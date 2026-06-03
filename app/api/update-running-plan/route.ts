import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Local types for this route to avoid importing Prisma model types
type ExistingPlanRun = {
  weekNumber: number;
  weekTheme: string;
  date: Date;
  day: string;
  title: string;
  workoutType: string;
  details: string;
  durationMinutes?: number | null;
  distanceKm?: number | null;
  googleEventId?: string | null;
};

type WeeksMapValue = {
  weekNumber: number;
  theme: string;
  runs: Array<{
    date: string;
    day: string;
    title: string;
    workoutType: string;
    details: string;
    durationMinutes?: number;
    distanceKm?: number;
  }>;
};

interface RunSchema {
  date: string;
  day: string;
  title: string;
  workoutType: string;
  details: string;
  durationMinutes?: number;
  distanceKm?: number;
}

interface WeekSchema {
  weekNumber: number;
  theme: string;
  runs: RunSchema[];
}

interface UpdatedPlanSchema {
  planName: string;
  level: string;
  goal: string;
  durationWeeks: number;
  runsPerWeek: number;
  startDate: string;
  preferredRunningDays: string[];
  weeks: WeekSchema[];
  updateSummary: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { runningPlanId, userMessage } = body;

    if (!runningPlanId || !userMessage) {
      return NextResponse.json(
        { error: "runningPlanId and userMessage are required" },
        { status: 400 }
      );
    }

    // Fetch the existing plan with all runs
    const existingPlan = await prisma.runningPlan.findUnique({
      where: { id: runningPlanId },
      include: {
        runs: {
          orderBy: [{ weekNumber: "asc" }, { date: "asc" }],
        },
      },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (existingPlan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if any runs have googleEventId
    const hadSyncedRuns = existingPlan.runs.some((run: ExistingPlanRun) => run.googleEventId !== null);

    // Format existing plan for Claude
    const weeks = new Map<number, WeeksMapValue>();

    existingPlan.runs.forEach((run: ExistingPlanRun) => {
      if (!weeks.has(run.weekNumber)) {
        weeks.set(run.weekNumber, {
          weekNumber: run.weekNumber,
          theme: run.weekTheme,
          runs: [],
        });
      }
      weeks.get(run.weekNumber)!.runs.push({
        date: run.date.toISOString().split("T")[0],
        day: run.day,
        title: run.title,
        workoutType: run.workoutType,
        details: run.details,
        durationMinutes: run.durationMinutes ?? undefined,
        distanceKm: run.distanceKm ?? undefined,
      });
    });

    const currentPlan = {
      planName: existingPlan.name,
      level: existingPlan.level,
      goal: existingPlan.goal,
      durationWeeks: existingPlan.durationWeeks,
      runsPerWeek: existingPlan.runsPerWeek,
      startDate: existingPlan.startDate.toISOString().split("T")[0],
      preferredRunningDays: existingPlan.preferredRunningDays,
      weeks: Array.from(weeks.values()).sort((a, b) => a.weekNumber - b.weekNumber),
    };

    // Call Claude API to update the plan
    const systemPrompt = `You are an expert running coach helping users adjust their training plans.
You will receive a current running plan and a user's request to modify it.

Your task:
1. Analyze the current plan and the user's request
2. Make safe, sensible adjustments to the plan
3. Avoid unrealistic jumps in volume or intensity
4. Preserve the original goal when possible
5. Adjust dates, durations, distances, titles, and details as needed
6. Keep the plan realistic and sustainable

Important guidelines:
- If the user missed a run, shift the plan forward or adjust intensity
- If the user wants to reduce frequency, consolidate workouts safely
- If the user reports pain/injury, reduce load and add recovery
- If the plan feels too easy/hard, adjust pace and distance gradually
- Maintain proper progression and recovery balance
- Keep weekly mileage increases under 10% when possible

Return ONLY a valid JSON object with this exact structure:
{
  "planName": "string",
  "level": "beginner|intermediate|advanced",
  "goal": "string",
  "durationWeeks": number,
  "runsPerWeek": number,
  "startDate": "YYYY-MM-DD",
  "preferredRunningDays": ["Monday", "Wednesday", ...],
  "weeks": [
    {
      "weekNumber": number,
      "theme": "string (e.g., 'Base Building', 'Recovery Week')",
      "runs": [
        {
          "date": "YYYY-MM-DD",
          "day": "Monday|Tuesday|...",
          "title": "string (e.g., 'Easy Run', 'Tempo Run')",
          "workoutType": "easy|tempo|intervals|long|recovery|rest",
          "details": "string (detailed description)",
          "durationMinutes": number (optional),
          "distanceKm": number (optional)
        }
      ]
    }
  ],
  "updateSummary": "string (brief summary of what changed)"
}`;

    const userPrompt = `Current running plan:
${JSON.stringify(currentPlan, null, 2)}

User's request:
"${userMessage}"

Please update the plan according to the user's request. Return only the updated plan as valid JSON.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      temperature: 1,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract JSON from response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Try to parse JSON - Claude might wrap it in markdown code blocks
    let updatedPlan: UpdatedPlanSchema;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      updatedPlan = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", responseText);
      throw new Error("Failed to parse updated plan from AI response");
    }

    // Validate the updated plan structure
    if (
      !updatedPlan.weeks ||
      !Array.isArray(updatedPlan.weeks) ||
      updatedPlan.weeks.length === 0
    ) {
      throw new Error("Invalid plan structure returned from AI");
    }

    // Delete all existing runs for this plan
    await prisma.runningPlanRun.deleteMany({
      where: { runningPlanId },
    });

    // Update the plan metadata and create new runs
    const updated = await prisma.runningPlan.update({
      where: { id: runningPlanId },
      data: {
        name: updatedPlan.planName,
        level: updatedPlan.level,
        goal: updatedPlan.goal,
        durationWeeks: updatedPlan.durationWeeks,
        runsPerWeek: updatedPlan.runsPerWeek,
        startDate: new Date(updatedPlan.startDate),
        preferredRunningDays: updatedPlan.preferredRunningDays,
        runs: {
          create: updatedPlan.weeks.flatMap((week) =>
            week.runs.map((run) => {
              // Set default time to 20:00 (8 PM) for running plan runs
              const runDate = new Date(run.date);
              runDate.setHours(20, 0, 0, 0);

              return {
                weekNumber: week.weekNumber,
                weekTheme: week.theme,
                date: runDate,
                day: run.day,
                title: run.title,
                workoutType: run.workoutType,
                details: run.details,
                durationMinutes: run.durationMinutes || 60,
                distanceKm: run.distanceKm,
                // googleEventId is null for new/modified runs
                googleEventId: null,
              };
            })
          ),
        },
      },
      include: {
        runs: true,
      },
    });

    return NextResponse.json({
      success: true,
      runsModified: updated.runs.length,
      hadSyncedRuns,
      updateSummary: updatedPlan.updateSummary || "Plan updated successfully",
    });
  } catch (error) {
    console.error("Error updating running plan:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update plan" },
      { status: 500 }
    );
  }
}
