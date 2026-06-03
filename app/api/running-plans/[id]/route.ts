import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { deleteCalendarEvent } from "@/app/lib/google-calendar";

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

    // Fetch the plan with all runs to check ownership and get googleEventIds
    const existingPlan = await prisma.runningPlan.findUnique({
      where: { id },
      include: {
        runs: {
          where: {
            googleEventId: {
              not: null,
            },
          },
        },
      },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (existingPlan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete Google Calendar events for synced runs
    let deletedEventsCount = 0;
    let errorCount = 0;

    for (const run of existingPlan.runs) {
      if (run.googleEventId) {
        try {
          await deleteCalendarEvent(session.user.id, run.googleEventId);
          deletedEventsCount++;
        } catch (error) {
          console.error(`Error deleting calendar event ${run.googleEventId}:`, error);
          errorCount++;
          // Continue deleting other events even if one fails
        }
      }
    }

    // Delete the plan (cascade will delete all runs via schema onDelete: Cascade)
    await prisma.runningPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      deletedEventsCount,
      errorCount,
    });
  } catch (error) {
    console.error("Error deleting running plan:", error);
    return NextResponse.json(
      { error: "Failed to delete running plan" },
      { status: 500 }
    );
  }
}
