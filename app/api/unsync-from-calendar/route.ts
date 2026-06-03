import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { deleteCalendarEvent } from "@/app/lib/google-calendar";

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

    // Get synced manual workouts
    const syncedWorkouts = await prisma.workout.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDateTime,
          lte: endDateTime,
        },
        googleEventId: {
          not: null,
        },
      },
    });

    // Get synced plan runs
    const syncedPlanRuns = await prisma.runningPlanRun.findMany({
      where: {
        runningPlan: {
          userId: session.user.id,
        },
        date: {
          gte: startDateTime,
          lte: endDateTime,
        },
        googleEventId: {
          not: null,
        },
      },
    });

    let removedWorkoutsCount = 0;
    let removedPlanRunsCount = 0;
    let errorCount = 0;

    // Unsync manual workouts
    for (const workout of syncedWorkouts) {
      if (!workout.googleEventId) continue;

      try {
        await deleteCalendarEvent(session.user.id, workout.googleEventId);

        await prisma.workout.update({
          where: { id: workout.id },
          data: { googleEventId: null },
        });

        removedWorkoutsCount++;
      } catch (error) {
        console.error(`Error unsyncing workout ${workout.id}:`, error);
        errorCount++;
      }
    }

    // Unsync plan runs
    for (const run of syncedPlanRuns) {
      if (!run.googleEventId) continue;

      try {
        await deleteCalendarEvent(session.user.id, run.googleEventId);

        await prisma.runningPlanRun.update({
          where: { id: run.id },
          data: { googleEventId: null },
        });

        removedPlanRunsCount++;
      } catch (error) {
        console.error(`Error unsyncing plan run ${run.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      removedWorkoutsCount,
      removedPlanRunsCount,
      errorCount,
      totalRemoved: removedWorkoutsCount + removedPlanRunsCount,
    });
  } catch (error) {
    console.error("Error unsyncing from calendar:", error);
    return NextResponse.json(
      { error: "Failed to unsync from calendar" },
      { status: 500 }
    );
  }
}
