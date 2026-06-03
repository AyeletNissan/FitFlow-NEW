import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { createCalendarEvent } from "@/app/lib/google-calendar";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const plan = await prisma.runningPlan.findUnique({
      where: { id },
      include: {
        runs: {
          orderBy: [{ weekNumber: "asc" }, { date: "asc" }],
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (plan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Add each run to calendar
    for (const run of plan.runs) {
      // Skip runs that already have a calendar event
      if (run.googleEventId) {
        skippedCount++;
        continue;
      }

      try {
        // Calculate end time based on duration or default to 1 hour
        const startTime = run.date;
        const durationMs = (run.durationMinutes || 60) * 60000;
        const endTime = new Date(run.date.getTime() + durationMs);

        const event = await createCalendarEvent(session.user.id, {
          summary: `${run.title} (${plan.name})`,
          description: `Week ${run.weekNumber}: ${run.weekTheme}\n\n${run.details}\n\n${
            run.distanceKm ? `Distance: ${run.distanceKm} km\n` : ""
          }${
            run.durationMinutes ? `Duration: ${run.durationMinutes} min\n` : ""
          }`,
          location: undefined,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: "UTC",
          },
        });

        // Save the event ID
        await prisma.runningPlanRun.update({
          where: { id: run.id },
          data: { googleEventId: event.id || null },
        });

        addedCount++;
      } catch (error) {
        console.error(`Error adding run ${run.id} to calendar:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      addedCount,
      skippedCount,
      errorCount,
      totalRuns: plan.runs.length,
    });
  } catch (error) {
    console.error("Error adding plan to calendar:", error);
    return NextResponse.json(
      { error: "Failed to add plan to calendar" },
      { status: 500 }
    );
  }
}
