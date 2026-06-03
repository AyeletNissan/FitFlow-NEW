import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

// Local types used only in this route to avoid importing Prisma model types
type DashboardWorkout = {
  id: string;
  title: string;
  type: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location: string | null;
  notes: string | null;
  googleEventId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

type DashboardPlanRun = {
  id: string;
  runningPlanId: string;
  weekNumber: number;
  weekTheme: string;
  date: Date;
  title: string;
  workoutType: string;
  details: string;
  durationMinutes: number | null;
  distanceKm: number | null;
  googleEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
  runningPlan: {
    id: string;
    name: string;
    goal: string;
    durationWeeks: number;
  };
  userId?: string; // not used for plan runs in this route but present on some objects
};

export async function GET(request: NextRequest) {
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

    // Fetch manual workouts
  const workouts = await prisma.workout.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDateTime,
          lte: endDateTime,
        },
      },
      orderBy: { date: "asc" },
    });

    // Fetch running plan runs for the date range
    const runningPlanRuns = await prisma.runningPlanRun.findMany({
      where: {
        runningPlan: {
          userId: session.user.id,
        },
        date: {
          gte: startDateTime,
          lte: endDateTime,
        },
      },
      include: {
        runningPlan: {
          select: {
            id: true,
            name: true,
            goal: true,
            durationWeeks: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // Format workouts
  const formattedWorkouts = workouts.map((w: DashboardWorkout) => ({
      id: w.id,
      type: "workout" as const,
      title: w.title,
      workoutType: w.type,
      date: w.date,
      startTime: w.startTime,
      endTime: w.endTime,
      location: w.location,
      notes: w.notes,
      googleEventId: w.googleEventId,
      userId: w.userId,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));

    // Format running plan runs
  const formattedPlanRuns = runningPlanRuns.map((r: DashboardPlanRun) => {
      // Use the stored date/time, or default to 20:00 if only date is set
      const startTime = r.date;
      const duration = r.durationMinutes || 60; // Default to 60 minutes
      const endTime = new Date(startTime.getTime() + duration * 60000);

      return {
        id: r.id,
        type: "planRun" as const,
        title: r.title,
        workoutType: r.workoutType,
        date: r.date,
        startTime,
        endTime,
        location: null,
        notes: r.details,
        googleEventId: r.googleEventId,
        userId: session.user!.id,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        // Extra fields for plan runs
        runningPlanId: r.runningPlanId,
        runningPlanName: r.runningPlan.name,
        runningPlanGoal: r.runningPlan.goal,
        runningPlanDurationWeeks: r.runningPlan.durationWeeks,
        weekNumber: r.weekNumber,
        weekTheme: r.weekTheme,
        durationMinutes: r.durationMinutes,
        distanceKm: r.distanceKm,
      };
    });

    // Combine and sort by date
    const allItems = [...formattedWorkouts, ...formattedPlanRuns].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    return NextResponse.json(allItems);
  } catch (error) {
    console.error("Error fetching dashboard items:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard items" },
      { status: 500 }
    );
  }
}
