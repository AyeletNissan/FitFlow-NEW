import { redirect } from "next/navigation";
import { auth } from "@/auth";
import WeeklyCalendar from "../components/weekly-calendar";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent"
            style={{
              background: "linear-gradient(to right, var(--theme-primary), var(--theme-primary-hover))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            Dashboard
          </h1>
          <p className="mt-3 text-base" style={{ color: "var(--theme-text-muted)" }}>
            Track your progress and plan your workouts
          </p>
        </div>

        <WeeklyCalendar />
      </div>
    </div>
  );
}
