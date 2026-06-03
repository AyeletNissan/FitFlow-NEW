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
    const { title, date, startTime, endTime, details } = body;

    const existingRun = await prisma.runningPlanRun.findUnique({
      where: { id },
      include: {
        runningPlan: true,
      },
    });

    if (!existingRun) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    if (existingRun.runningPlan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate duration from time range if provided
    let durationMinutes = existingRun.durationMinutes;
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    }

    const planRun = await prisma.runningPlanRun.update({
      where: { id },
      data: {
        title: title || existingRun.title,
        date: date ? new Date(date) : existingRun.date,
        details: details !== undefined ? details : existingRun.details,
        durationMinutes,
      },
    });

    // If run is synced to Google Calendar, update the event
    if (existingRun.googleEventId && (title || date || startTime || endTime || details)) {
      try {
        const runDate = date ? new Date(date) : existingRun.date;
        const start = startTime ? new Date(startTime) : runDate;
        const end = endTime ? new Date(endTime) : new Date(start.getTime() + (durationMinutes || 30) * 60000);

        await updateCalendarEvent(session.user.id, existingRun.googleEventId, {
          summary: title || existingRun.title,
          description: details !== undefined ? details : existingRun.details,
          location: undefined,
          start: {
            dateTime: start.toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: end.toISOString(),
            timeZone: "UTC",
          },
        });
      } catch (error) {
        console.error("Error updating calendar event:", error);
        // Don't fail the run update if calendar sync fails
      }
    }

    return NextResponse.json(planRun);
  } catch (error) {
    console.error("Error updating plan run:", error);
    return NextResponse.json(
      { error: "Failed to update plan run" },
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

    const existingRun = await prisma.runningPlanRun.findUnique({
      where: { id },
      include: {
        runningPlan: true,
      },
    });

    if (!existingRun) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    if (existingRun.runningPlan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If run is synced to Google Calendar, delete the event
    if (existingRun.googleEventId) {
      try {
        await deleteCalendarEvent(session.user.id, existingRun.googleEventId);
      } catch (error) {
        console.error("Error deleting calendar event:", error);
        // Don't fail the run deletion if calendar sync fails
      }
    }

    await prisma.runningPlanRun.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plan run:", error);
    return NextResponse.json(
      { error: "Failed to delete plan run" },
      { status: 500 }
    );
  }
}
