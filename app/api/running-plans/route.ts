import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await prisma.runningPlan.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        runs: {
          orderBy: [
            { weekNumber: "asc" },
            { date: "asc" },
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching running plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch running plans" },
      { status: 500 }
    );
  }
}
