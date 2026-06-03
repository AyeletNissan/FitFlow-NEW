export interface Workout {
  id: string;
  type: "workout";
  title: string;
  workoutType: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location?: string | null;
  notes?: string | null;
  googleEventId?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanRun {
  id: string;
  type: "planRun";
  title: string;
  workoutType: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location: null;
  notes: string;
  googleEventId?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // Plan-specific fields
  runningPlanId: string;
  runningPlanName: string;
  runningPlanGoal: string;
  runningPlanDurationWeeks: number;
  weekNumber: number;
  weekTheme: string;
  durationMinutes: number | null;
  distanceKm: number | null;
}

export type DashboardItem = Workout | PlanRun;

export function formatTimeForInput(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function combineDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}
