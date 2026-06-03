import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

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
    const body = await request.json();
    const { newStartDate } = body;

    if (!newStartDate) {
      return NextResponse.json({ error: "newStartDate is required" }, { status: 400 });
    }

    const parsedNew = new Date(newStartDate);
    if (isNaN(parsedNew.getTime())) {
      return NextResponse.json({ error: "Invalid newStartDate" }, { status: 400 });
    }

    // Fetch existing plan and runs
    const existingPlan = await (prisma as any).runningPlan.findUnique({
      where: { id },
      include: { runs: true },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (existingPlan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const oldStart = existingPlan.startDate;
    const diffMs = parsedNew.getTime() - oldStart.getTime();
    const daysDiff = Math.round(diffMs / (24 * 60 * 60 * 1000));

    // If no change, return early
    if (daysDiff === 0) {
      return NextResponse.json({ success: true, runsModified: 0, hadSyncedRuns: false, clearedGoogleEventCount: 0 });
    }

    let clearedGoogleEventCount = 0;
    let hadSyncedRuns = false;

    // Build updates for runs
    const runUpdates = existingPlan.runs.map((run: any) => {
      const newDate = new Date(run.date);
      newDate.setDate(newDate.getDate() + daysDiff);

      const willClearGoogle = !!run.googleEventId;
      if (willClearGoogle) {
        hadSyncedRuns = true;
        clearedGoogleEventCount++;
      }

      return (prisma as any).runningPlanRun.update({
        where: { id: run.id },
        data: {
          date: newDate,
          // clear googleEventId to avoid duplicate calendar events; user will re-sync manually
          googleEventId: null,
        },
      });
    });

    // Run updates in a transaction: update plan startDate, then update runs
    const txResults = await prisma.$transaction([
  (prisma as any).runningPlan.update({ where: { id }, data: { startDate: parsedNew } }),
      ...runUpdates,
    ]);

    const runsModified = existingPlan.runs.length;

    return NextResponse.json({ success: true, runsModified, hadSyncedRuns, clearedGoogleEventCount });
  } catch (error) {
    console.error("Error rescheduling running plan:", error);
    return NextResponse.json({ error: "Failed to reschedule running plan" }, { status: 500 });
  }
}
