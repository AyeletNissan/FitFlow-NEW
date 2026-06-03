import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { getCalendarEvent } from "@/app/lib/google-calendar";

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

    // Get workouts in date range that are synced to calendar
    const workouts = await prisma.workout.findMany({
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

    // Get plan runs in date range that are synced to calendar
    const planRuns = await prisma.runningPlanRun.findMany({
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

    let updatedCount = 0;
    let unsyncedCount = 0;
    let errorCount = 0;

    // Process each synced workout
    for (const workout of workouts) {
      if (!workout.googleEventId) continue;

      try {
        const calendarEvent = await getCalendarEvent(
          session.user.id,
          workout.googleEventId
        );

        // Event was deleted in Google Calendar
        if (!calendarEvent) {
          // Keep the workout but mark it as unsynced
          await prisma.workout.update({
            where: { id: workout.id },
            data: { googleEventId: null },
          });
          unsyncedCount++;
          continue;
        }

        // Check if event details changed
        const calendarStartTime = calendarEvent.start?.dateTime
          ? new Date(calendarEvent.start.dateTime)
          : null;
        const calendarEndTime = calendarEvent.end?.dateTime
          ? new Date(calendarEvent.end.dateTime)
          : null;

        if (!calendarStartTime || !calendarEndTime) {
          // Skip all-day events or events without time
          continue;
        }

        // Compare values to detect changes
        const titleChanged = calendarEvent.summary !== workout.title;
        const startTimeChanged =
          calendarStartTime.getTime() !== workout.startTime.getTime();
        const endTimeChanged =
          calendarEndTime.getTime() !== workout.endTime.getTime();
        const locationChanged =
          (calendarEvent.location || null) !== workout.location;
        const notesChanged =
          (calendarEvent.description || null) !== workout.notes;

        // If anything changed, update the workout
        if (
          titleChanged ||
          startTimeChanged ||
          endTimeChanged ||
          locationChanged ||
          notesChanged
        ) {
          // Extract date from the start time
          const eventDate = new Date(calendarStartTime);
          eventDate.setHours(0, 0, 0, 0);

          await prisma.workout.update({
            where: { id: workout.id },
            data: {
              title: calendarEvent.summary || workout.title,
              startTime: calendarStartTime,
              endTime: calendarEndTime,
              date: eventDate,
              location: calendarEvent.location || null,
              notes: calendarEvent.description || null,
            },
          });
          updatedCount++;
        }
      } catch (error) {
        console.error(
          `Error syncing workout ${workout.id} with event ${workout.googleEventId}:`,
          error
        );
        errorCount++;
      }
    }

    // Process each synced plan run
    for (const planRun of planRuns) {
      if (!planRun.googleEventId) continue;

      try {
        const calendarEvent = await getCalendarEvent(
          session.user.id,
          planRun.googleEventId
        );

        // Event was deleted in Google Calendar
        if (!calendarEvent) {
          // Keep the plan run but mark it as unsynced
          await prisma.runningPlanRun.update({
            where: { id: planRun.id },
            data: { googleEventId: null },
          });
          unsyncedCount++;
          continue;
        }

        // Check if event details changed
        const calendarStartTime = calendarEvent.start?.dateTime
          ? new Date(calendarEvent.start.dateTime)
          : null;
        const calendarEndTime = calendarEvent.end?.dateTime
          ? new Date(calendarEvent.end.dateTime)
          : null;

        if (!calendarStartTime || !calendarEndTime) {
          continue;
        }

        // Compare values to detect changes
        const titleChanged = calendarEvent.summary !== planRun.title;
        const startTimeChanged =
          calendarStartTime.getTime() !== planRun.date.getTime();
        const detailsChanged =
          (calendarEvent.description || null) !== planRun.details;

        // Calculate duration from calendar event
        const calendarDuration = Math.round(
          (calendarEndTime.getTime() - calendarStartTime.getTime()) / 60000
        );
        const durationChanged = calendarDuration !== (planRun.durationMinutes || 0);

        // If anything changed, update the plan run
        if (
          titleChanged ||
          startTimeChanged ||
          durationChanged ||
          detailsChanged
        ) {
          await prisma.runningPlanRun.update({
            where: { id: planRun.id },
            data: {
              title: calendarEvent.summary || planRun.title,
              date: calendarStartTime,
              durationMinutes: calendarDuration,
              details: calendarEvent.description || planRun.details,
            },
          });
          updatedCount++;
        }
      } catch (error) {
        console.error(
          `Error syncing plan run ${planRun.id} with event ${planRun.googleEventId}:`,
          error
        );
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      unsyncedCount,
      errorCount,
      totalChecked: workouts.length + planRuns.length,
    });
  } catch (error) {
    console.error("Error syncing from calendar:", error);
    return NextResponse.json(
      { error: "Failed to sync from calendar" },
      { status: 500 }
    );
  }
}
