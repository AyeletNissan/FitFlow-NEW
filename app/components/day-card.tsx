"use client";

import { useState } from "react";
import { formatDate, formatDayName, isToday } from "../lib/date-utils";
import { DashboardItem, formatTimeForInput } from "../lib/mock-data";

interface DayCardProps {
  date: Date;
  items: DashboardItem[];
  onAddWorkout: (date: Date) => void;
  onEditWorkout: (item: DashboardItem) => void;
  onDeleteWorkout: (item: DashboardItem) => void;
  onAddToCalendar: (item: DashboardItem) => void;
}

export default function DayCard({ date, items, onAddWorkout, onEditWorkout, onDeleteWorkout, onAddToCalendar }: DayCardProps) {
  const today = isToday(date);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div
      className="rounded-2xl border-2 p-5 shadow-md transition-all"
      style={{
        borderColor: today ? "var(--theme-border-strong)" : "var(--theme-border-light)",
        backgroundColor: today ? "var(--theme-bg-card-alt)" : "var(--theme-bg-card)",
        boxShadow: today
          ? "0 4px 6px -1px var(--theme-shadow-strong)"
          : "0 4px 6px -1px var(--theme-shadow)",
      }}
      onMouseEnter={(e) => {
        if (!today) {
          e.currentTarget.style.boxShadow = "0 10px 15px -3px var(--theme-shadow-strong)";
        }
      }}
      onMouseLeave={(e) => {
        if (!today) {
          e.currentTarget.style.boxShadow = "0 4px 6px -1px var(--theme-shadow)";
        }
      }}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold" style={{ color: "var(--theme-text)" }}>
            {formatDayName(date)}
          </div>
          {today && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm"
              style={{ backgroundColor: "var(--theme-primary)" }}
            >
              Today
            </span>
          )}
        </div>
        <div className="mt-1.5 text-xs font-medium" style={{ color: "var(--theme-text-muted)" }}>
          {formatDate(date)}
        </div>
      </div>

      <div className="space-y-2.5">
        {items.length === 0 ? (
          <div className="py-6 text-center text-xs font-medium" style={{ color: "var(--theme-text-muted)" }}>
            No workouts
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group rounded-xl p-3 text-xs shadow-sm transition-all"
              style={{
                backgroundColor: item.type === "planRun" ? "var(--theme-bg-card-alt)" : "var(--theme-bg-card)",
                borderWidth: "2px",
                borderStyle: "solid",
                borderColor: item.type === "planRun" ? "var(--theme-border)" : "var(--theme-border-light)",
                boxShadow: "0 1px 2px var(--theme-shadow)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 6px -1px var(--theme-shadow)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)"}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="font-semibold" style={{ color: "var(--theme-text)" }}>
                        {item.title}
                      </div>
                      {item.type === "planRun" && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: "var(--theme-primary)" }}
                          title={`From ${item.runningPlanName}`}
                        >
                          Plan
                        </span>
                      )}
                      {item.googleEventId && (
                        <span className="text-green-600 dark:text-green-400" title="Added to Google Calendar">
                          📅
                        </span>
                      )}
                    </div>
                    <div className="mt-1" style={{ color: "var(--theme-text-muted)" }}>
                      {item.workoutType}
                    </div>
                    {item.type === "planRun" ? (
                      <>
                        <div className="mt-1" style={{ color: "var(--theme-text-muted)" }}>
                          {item.durationMinutes && `⏱️ ${item.durationMinutes} min`}
                          {item.durationMinutes && item.distanceKm && " • "}
                          {item.distanceKm && `📏 ${item.distanceKm} km`}
                        </div>
                        <div className="mt-1 text-[10px]" style={{ color: "var(--theme-text-muted)" }}>
                          Week {item.weekNumber}: {item.weekTheme}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mt-1" style={{ color: "var(--theme-text-muted)" }}>
                          🕐 {formatTimeForInput(item.startTime)} - {formatTimeForInput(item.endTime)}
                        </div>
                        {item.location && (
                          <div className="mt-1" style={{ color: "var(--theme-text-muted)" }}>
                            📍 {item.location}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="ml-2 flex gap-1.5 opacity-0 group-hover:opacity-100">
                    {!item.googleEventId && item.type === "workout" && (
                      <button
                        onClick={() => onAddToCalendar(item)}
                        className="rounded-lg p-1.5 transition-all"
                        style={{
                          color: "var(--theme-primary)",
                          backgroundColor: hoveredButton === `cal-${item.id}` ? "var(--theme-bg-hover)" : "transparent",
                        }}
                        onMouseEnter={() => setHoveredButton(`cal-${item.id}`)}
                        onMouseLeave={() => setHoveredButton(null)}
                        title="Add to Google Calendar"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => onEditWorkout(item)}
                      className="rounded-lg p-1.5 transition-all"
                      style={{
                        color: "var(--theme-primary)",
                        backgroundColor: hoveredButton === `edit-${item.id}` ? "var(--theme-bg-hover)" : "transparent",
                      }}
                      onMouseEnter={() => setHoveredButton(`edit-${item.id}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                      title={item.type === "planRun" ? "Edit plan run" : "Edit workout"}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteWorkout(item)}
                      className="rounded-lg p-1.5 text-red-500 transition-all hover:bg-red-50 hover:shadow-sm dark:text-red-400 dark:hover:bg-red-900/20"
                      title={item.type === "planRun" ? "Delete plan run" : "Delete workout"}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => onAddWorkout(date)}
        className="mt-3 w-full rounded-xl border-2 border-dashed py-2.5 text-xs font-semibold transition-all"
        style={{
          borderColor: hoveredButton === `add-${date.toISOString()}` ? "var(--theme-border)" : "var(--theme-border-light)",
          color: "var(--theme-primary)",
          backgroundColor: hoveredButton === `add-${date.toISOString()}` ? "var(--theme-bg-hover)" : "transparent",
          boxShadow: "0 1px 2px var(--theme-shadow)",
        }}
        onMouseEnter={(e) => {
          setHoveredButton(`add-${date.toISOString()}`);
          e.currentTarget.style.boxShadow = "0 4px 6px -1px var(--theme-shadow)";
        }}
        onMouseLeave={(e) => {
          setHoveredButton(null);
          e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
        }}
      >
        + Add Workout
      </button>
    </div>
  );
}
