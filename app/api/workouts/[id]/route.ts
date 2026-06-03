import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { updateCalendarEvent, deleteCalendarEvent } from "@/app/lib/google-calendar";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, type, date, startTime, endTime, location, notes } = body;

    const existingWorkout = await prisma.workout.findUnique({
      where: { id },
    });

    if (!existingWorkout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    if (existingWorkout.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const workout = await prisma.workout.update({
      where: { id },
      data: {
        title,
        type,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location: location || null,
        notes: notes || null,
      },
    });

    // If workout is synced to Google Calendar, update the event
    if (existingWorkout.googleEventId) {
      try {
        await updateCalendarEvent(session.user.id, existingWorkout.googleEventId, {
          summary: title,
          description: notes || `${type} workout`,
          location: location || undefined,
          start: {
            dateTime: new Date(startTime).toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: new Date(endTime).toISOString(),
            timeZone: "UTC",
          },
        });
      } catch (error) {
        console.error("Error updating calendar event:", error);
        // Don't fail the workout update if calendar sync fails
      }
    }

    return NextResponse.json(workout);
  } catch (error) {
    console.error("Error updating workout:", error);
    return NextResponse.json(
      { error: "Failed to update workout" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingWorkout = await prisma.workout.findUnique({
      where: { id },
    });

    if (!existingWorkout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    if (existingWorkout.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If workout is synced to Google Calendar, delete the event
    if (existingWorkout.googleEventId) {
      try {
        await deleteCalendarEvent(session.user.id, existingWorkout.googleEventId);
      } catch (error) {
        console.error("Error deleting calendar event:", error);
        // Don't fail the workout deletion if calendar sync fails
      }
    }

    await prisma.workout.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workout:", error);
    return NextResponse.json(
      { error: "Failed to delete workout" },
      { status: 500 }
    );
  }
}
