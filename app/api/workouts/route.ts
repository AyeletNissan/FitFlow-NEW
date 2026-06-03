import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      userId: session.user.id,
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const workouts = await prisma.workout.findMany({
      where,
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(workouts);
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch workouts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, type, date, startTime, endTime, location, notes } = body;

    if (!title || !type || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const workout = await prisma.workout.create({
      data: {
        userId: session.user.id,
        title,
        type,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location: location || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(workout, { status: 201 });
  } catch (error) {
    console.error("Error creating workout:", error);
    return NextResponse.json(
      { error: "Failed to create workout" },
      { status: 500 }
    );
  }
}
