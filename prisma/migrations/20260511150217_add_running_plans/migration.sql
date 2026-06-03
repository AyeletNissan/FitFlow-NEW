-- CreateTable
CREATE TABLE "RunningPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "durationWeeks" INTEGER NOT NULL,
    "runsPerWeek" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "preferredRunningDays" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunningPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunningPlanRun" (
    "id" TEXT NOT NULL,
    "runningPlanId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weekTheme" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "day" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workoutType" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "distanceKm" DOUBLE PRECISION,
    "googleEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunningPlanRun_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RunningPlan" ADD CONSTRAINT "RunningPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunningPlanRun" ADD CONSTRAINT "RunningPlanRun_runningPlanId_fkey" FOREIGN KEY ("runningPlanId") REFERENCES "RunningPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
