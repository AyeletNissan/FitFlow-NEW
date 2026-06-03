export interface Run {
  date: string; // ISO date string
  day: string; // e.g., "Monday"
  title: string; // e.g., "Easy Run"
  workoutType: string; // e.g., "easy", "tempo", "intervals", "long", "recovery", "rest"
  details: string; // Description of the workout
  durationMinutes?: number;
  distanceKm?: number;
}

export interface Week {
  weekNumber: number;
  theme: string; // e.g., "Base Building", "Speed Work", "Endurance"
  runs: Run[];
}

export interface RunningPlan {
  planName: string;
  level: string; // "beginner", "intermediate", "advanced"
  goal: string; // "5K", "10K", "half marathon"
  durationWeeks: number;
  runsPerWeek: number;
  startDate: string; // ISO date string
  preferredRunningDays: string[];
  weeks: Week[];
}

// Database-persisted running plan with IDs
export interface SavedRunningPlan {
  id: string;
  userId: string;
  name: string;
  level: string;
  goal: string;
  durationWeeks: number;
  runsPerWeek: number;
  startDate: Date;
  preferredRunningDays: string[];
  createdAt: Date;
  updatedAt: Date;
  runs: SavedRun[];
}

export interface SavedRun {
  id: string;
  runningPlanId: string;
  weekNumber: number;
  weekTheme: string;
  date: Date;
  day: string;
  title: string;
  workoutType: string;
  details: string;
  durationMinutes: number | null;
  distanceKm: number | null;
  googleEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
