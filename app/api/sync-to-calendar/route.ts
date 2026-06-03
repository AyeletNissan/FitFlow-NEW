import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { createCalendarEvent } from "@/app/lib/google-calendar";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    // Get unsynced manual workouts
    const unsyncedWorkouts = await prisma.workout.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDateTime,
          lte: endDateTime,
        },
        googleEventId: null,
      },
    });

    // Get unsynced plan runs
    const unsyncedPlanRuns = await prisma.runningPlanRun.findMany({
      where: {
        runningPlan: {
          userId: session.user.id,
        },
        date: {
          gte: startDateTime,
          lte: endDateTime,
        },
        googleEventId: null,
      },
      include: {
        runningPlan: {
          select: {
            name: true,
          },
        },
      },
    });

    let addedWorkoutsCount = 0;
    let addedPlanRunsCount = 0;
    let errorCount = 0;

    // Sync manual workouts
    for (const workout of unsyncedWorkouts) {
      try {
        const event = await createCalendarEvent(session.user.id, {
          summary: workout.title,
          description: workout.notes || `${workout.type} workout`,
          location: workout.location || undefined,
          start: {
            dateTime: workout.startTime.toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: workout.endTime.toISOString(),
            timeZone: "UTC",
          },
        });

        await prisma.workout.update({
          where: { id: workout.id },
          data: { googleEventId: event.id || null },
        });

        addedWorkoutsCount++;
      } catch (error) {
        console.error(`Error syncing workout ${workout.id}:`, error);
        errorCount++;
      }
    }

    // Sync plan runs
    for (const run of unsyncedPlanRuns) {
      try {
        const startTime = run.date;
        const duration = run.durationMinutes || 60;
        const endTime = new Date(startTime.getTime() + duration * 60000);

        const event = await createCalendarEvent(session.user.id, {
          summary: `${run.title} (${run.runningPlan.name})`,
          description: `Week ${run.weekNumber}: ${run.weekTheme}\n\n${run.details}\n\n${
            run.distanceKm ? `Distance: ${run.distanceKm} km\n` : ""
          }${run.durationMinutes ? `Duration: ${run.durationMinutes} min\n` : ""}`,
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

        await prisma.runningPlanRun.update({
          where: { id: run.id },
          data: { googleEventId: event.id || null },
        });

        addedPlanRunsCount++;
      } catch (error) {
        console.error(`Error syncing plan run ${run.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      addedWorkoutsCount,
      addedPlanRunsCount,
      errorCount,
      totalAdded: addedWorkoutsCount + addedPlanRunsCount,
    });
  } catch (error) {
    console.error("Error syncing to calendar:", error);
    return NextResponse.json(
      { error: "Failed to sync to calendar" },
      { status: 500 }
    );
  }
}
