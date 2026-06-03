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

    const workout = await prisma.workout.findUnique({
      where: { id },
    });

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    if (workout.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (workout.googleEventId) {
      return NextResponse.json(
        { error: "Workout already added to calendar", eventId: workout.googleEventId },
        { status: 400 }
      );
    }

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

    const updatedWorkout = await prisma.workout.update({
      where: { id },
      data: {
        googleEventId: event.id || null,
      },
    });

    return NextResponse.json({
      success: true,
      eventId: event.id,
      workout: updatedWorkout,
    });
  } catch (error) {
    console.error("Error adding workout to calendar:", error);
    return NextResponse.json(
      { error: "Failed to add workout to calendar" },
      { status: 500 }
    );
  }
}
