import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";
import { RunningPlan } from "@/app/lib/running-plan-types";
import { prisma } from "@/app/lib/prisma";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      runningLevel,
      goal,
      runsPerWeek,
      durationWeeks,
      startDate,
      preferredDays,
    } = body;

    // Validate required fields
    if (
      !runningLevel ||
      !goal ||
      !runsPerWeek ||
      !durationWeeks ||
      !startDate ||
      !preferredDays
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate dates for each week based on start date and preferred days
    const startDateObj = new Date(startDate);

    // Build prompt for Claude requesting strict JSON
    const prompt = `You are an expert running coach. Create a detailed and safe running plan based on the following information:

Running Level: ${runningLevel}
Goal: ${goal}
Runs Per Week: ${runsPerWeek}
Duration: ${durationWeeks} weeks
Start Date: ${startDate}
Preferred Running Days: ${preferredDays.join(", ")}

IMPORTANT: You must return ONLY valid JSON with no additional text, markdown, or explanations.

Return a JSON object with this exact structure:
{
  "planName": "string (e.g., 'Beginner 5K Training Plan')",
  "level": "${runningLevel}",
  "goal": "${goal}",
  "durationWeeks": ${durationWeeks},
  "runsPerWeek": ${runsPerWeek},
  "startDate": "${startDate}",
  "preferredRunningDays": ${JSON.stringify(preferredDays)},
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "string (e.g., 'Base Building', 'Speed Work')",
      "runs": [
        {
          "date": "YYYY-MM-DD",
          "day": "Monday",
          "title": "Easy Run",
          "workoutType": "easy",
          "details": "Run at a conversational pace. Focus on form and breathing.",
          "durationMinutes": 30,
          "distanceKm": 3
        }
      ]
    }
  ]
}

Guidelines:
1. Create ${durationWeeks} weeks of training
2. Each week should have ${runsPerWeek} runs scheduled on the preferred days: ${preferredDays.join(", ")}
3. Calculate actual dates for each run starting from ${startDate}
4. Include varied workout types: easy, tempo, intervals, long, recovery
5. Progressive overload: gradually increase distance/intensity
6. Make it safe and realistic for a ${runningLevel} runner training for ${goal}
7. workoutType should be one of: "easy", "tempo", "intervals", "long", "recovery", "rest"
8. Include durationMinutes and/or distanceKm for each workout
9. Provide specific, actionable details for each workout

Return ONLY the JSON object, no other text.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse and validate JSON
    let plan: RunningPlan;
    try {
      // Remove any markdown code blocks if present
      const jsonText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      plan = JSON.parse(jsonText);

      // Basic validation
      if (!plan.planName || !plan.weeks || !Array.isArray(plan.weeks)) {
        throw new Error("Invalid plan structure");
      }

      // Validate each week has required fields
      for (const week of plan.weeks) {
        if (!week.weekNumber || !week.theme || !Array.isArray(week.runs)) {
          throw new Error(`Invalid week structure: week ${week.weekNumber}`);
        }

        // Validate each run has required fields
        for (const run of week.runs) {
          if (!run.date || !run.day || !run.title || !run.workoutType || !run.details) {
            throw new Error(`Invalid run structure in week ${week.weekNumber}`);
          }
        }
      }
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      console.error("Raw response:", responseText.substring(0, 500));
      return NextResponse.json(
        { error: "Failed to parse running plan from AI response" },
        { status: 500 }
      );
    }

    // Save plan to database
    const savedPlan = await prisma.runningPlan.create({
      data: {
        userId: session.user.id,
        name: plan.planName,
        level: plan.level,
        goal: plan.goal,
        durationWeeks: plan.durationWeeks,
        runsPerWeek: plan.runsPerWeek,
        startDate: new Date(plan.startDate),
        preferredRunningDays: plan.preferredRunningDays,
        runs: {
          create: plan.weeks.flatMap((week) =>
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
      plan,
      savedPlanId: savedPlan.id,
    });
  } catch (error) {
    console.error("Error generating running plan:", error);
    return NextResponse.json(
      { error: "Failed to generate running plan" },
      { status: 500 }
    );
  }
}
