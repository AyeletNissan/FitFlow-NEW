"use client";

import { useState } from "react";

interface RunCoachFormProps {
  onSubmit: (formData: {
    runningLevel: string;
    goal: string;
    runsPerWeek: number;
    durationWeeks: number;
    startDate: string;
    preferredDays: string[];
  }) => void;
  isLoading: boolean;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function RunCoachForm({ onSubmit, isLoading }: RunCoachFormProps) {
  const [runningLevel, setRunningLevel] = useState("beginner");
  const [goal, setGoal] = useState("5K");
  const [runsPerWeek, setRunsPerWeek] = useState(3);
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [preferredDays, setPreferredDays] = useState<string[]>(["Monday", "Wednesday", "Friday"]);

  const handleDayToggle = (day: string) => {
    if (preferredDays.includes(day)) {
      setPreferredDays(preferredDays.filter((d) => d !== day));
    } else {
      setPreferredDays([...preferredDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (preferredDays.length === 0) {
      alert("Please select at least one preferred running day");
      return;
    }

    if (preferredDays.length < runsPerWeek) {
      alert(`Please select at least ${runsPerWeek} preferred days to match your runs per week`);
      return;
    }

    onSubmit({
      runningLevel,
      goal,
      runsPerWeek,
      durationWeeks,
      startDate,
      preferredDays,
    });
  };

  const inputStyles = {
    borderColor: "var(--theme-border-light)",
    backgroundColor: "var(--theme-bg-card)",
    color: "var(--theme-text)",
    boxShadow: "0 1px 2px var(--theme-shadow)",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Running Level */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: "var(--theme-text)" }}>
          Running Level
        </label>
        <select
          value={runningLevel}
          onChange={(e) => setRunningLevel(e.target.value)}
          className="w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:shadow-md"
          style={inputStyles}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-strong)";
            e.currentTarget.style.boxShadow = `0 0 0 3px var(--theme-shadow), 0 4px 6px -1px var(--theme-shadow)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-light)";
            e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
          }}
          disabled={isLoading}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Goal */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: "var(--theme-text)" }}>
          Goal
        </label>
        <select
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:shadow-md"
          style={inputStyles}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-strong)";
            e.currentTarget.style.boxShadow = `0 0 0 3px var(--theme-shadow), 0 4px 6px -1px var(--theme-shadow)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-light)";
            e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
          }}
          disabled={isLoading}
        >
          <option value="5K">5K</option>
          <option value="10K">10K</option>
          <option value="half marathon">Half Marathon</option>
        </select>
      </div>

      {/* Runs Per Week */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: "var(--theme-text)" }}>
          Runs Per Week: {runsPerWeek}
        </label>
        <input
          type="range"
          min="2"
          max="7"
          value={runsPerWeek}
          onChange={(e) => setRunsPerWeek(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "var(--theme-primary)" }}
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs font-medium mt-1" style={{ color: "var(--theme-text-muted)" }}>
          <span>2</span>
          <span>7</span>
        </div>
      </div>

      {/* Duration in Weeks */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: "var(--theme-text)" }}>
          Duration (weeks): {durationWeeks}
        </label>
        <input
          type="range"
          min="4"
          max="16"
          value={durationWeeks}
          onChange={(e) => setDurationWeeks(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "var(--theme-primary)" }}
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs font-medium mt-1" style={{ color: "var(--theme-text-muted)" }}>
          <span>4</span>
          <span>16</span>
        </div>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: "var(--theme-text)" }}>
          Start Date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:shadow-md"
          style={inputStyles}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-strong)";
            e.currentTarget.style.boxShadow = `0 0 0 3px var(--theme-shadow), 0 4px 6px -1px var(--theme-shadow)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-light)";
            e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
          }}
          required
          disabled={isLoading}
        />
      </div>

      {/* Preferred Running Days */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: "var(--theme-text)" }}>
          Preferred Running Days
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => handleDayToggle(day)}
              disabled={isLoading}
              className="rounded-xl border-2 px-3 py-2.5 text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:[background-color:var(--theme-bg-hover)]"
              style={
                preferredDays.includes(day)
                  ? {
                      borderColor: "var(--theme-border-strong)",
                      backgroundColor: "var(--theme-bg-card-alt)",
                      color: "var(--theme-primary)",
                      boxShadow: "0 1px 2px var(--theme-shadow-strong)",
                    }
                  : {
                      borderColor: "var(--theme-border-light)",
                      backgroundColor: "var(--theme-bg-card)",
                      color: "var(--theme-text)",
                      boxShadow: "0 1px 2px var(--theme-shadow)",
                    }
              }
            >
              {day}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs font-medium" style={{ color: "var(--theme-text-muted)" }}>
          Select at least {runsPerWeek} days
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:[background-color:var(--theme-primary-hover)] hover:shadow-lg"
        style={{
          backgroundColor: "var(--theme-primary)",
          boxShadow: "0 4px 6px -1px var(--theme-shadow-strong)",
        }}
      >
        {isLoading ? "Generating Plan..." : "Generate Running Plan"}
      </button>
    </form>
  );
}
