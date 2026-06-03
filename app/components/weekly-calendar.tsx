"use client";

import { useState, useEffect } from "react";
import { getWeekDates, isSameDay } from "../lib/date-utils";
import { DashboardItem, Workout, combineDateTime } from "../lib/mock-data";
import DayCard from "./day-card";
import Modal from "./modal";
import WorkoutForm from "./workout-form";
import PlanRunForm from "./plan-run-form";
import ConfirmDialog from "./confirm-dialog";

export default function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<DashboardItem | null>(null);
  const [workoutToDelete, setWorkoutToDelete] = useState<DashboardItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncingTo, setSyncingTo] = useState(false);
  const [unsyncing, setUnsyncing] = useState(false);
  const [showUnsyncConfirm, setShowUnsyncConfirm] = useState(false);
  const weekDates = getWeekDates(currentDate);

  // Hover state management
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkouts();
  }, [currentDate]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = weekDates[0].toISOString();
      const endDate = weekDates[6].toISOString();

      const response = await fetch(
        `/api/dashboard-items?startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch workouts");
      }

      const data = await response.json();
      const parsedItems = data.map((item: any) => ({
        ...item,
        date: new Date(item.date),
        startTime: new Date(item.startTime),
        endTime: new Date(item.endTime),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));

      setItems(parsedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getWeekRangeText = () => {
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = endDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}–${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
    }
  };

  const handleAddWorkout = (date: Date) => {
    setSelectedDate(date);
    setEditingWorkout(null);
    setIsModalOpen(true);
  };

  const handleEditWorkout = (item: DashboardItem) => {
    setEditingWorkout(item);
    setSelectedDate(item.date);
    setIsModalOpen(true);
  };

  const handleSubmitWorkout = async (formData: {
    title: string;
    type: string;
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    notes?: string;
  }) => {
    try {
      const startDateTime = combineDateTime(formData.date, formData.startTime);
      const endDateTime = combineDateTime(formData.date, formData.endTime);

      const payload = {
        title: formData.title,
        type: formData.type,
        date: formData.date,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: formData.location,
        notes: formData.notes,
      };

      let response;
      if (editingWorkout && editingWorkout.type === "workout") {
        response = await fetch(`/api/workouts/${editingWorkout.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to update workout");
        }
      } else {
        response = await fetch("/api/workouts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to create workout");
        }
      }

      await fetchWorkouts();
      setIsModalOpen(false);
      setSelectedDate(null);
      setEditingWorkout(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : editingWorkout ? "Failed to update workout" : "Failed to create workout");
    }
  };

  const handleSubmitPlanRun = async (formData: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    details: string;
  }) => {
    if (!editingWorkout || editingWorkout.type !== "planRun") return;

    try {
      const startDateTime = combineDateTime(formData.date, formData.startTime);
      const endDateTime = combineDateTime(formData.date, formData.endTime);

      const payload = {
        title: formData.title,
        date: formData.date,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        details: formData.details,
      };

      const response = await fetch(`/api/plan-runs/${editingWorkout.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update plan run");
      }

      await fetchWorkouts();
      setIsModalOpen(false);
      setSelectedDate(null);
      setEditingWorkout(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update plan run");
    }
  };

  const handleCancelWorkout = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setEditingWorkout(null);
  };

  const handleDeleteWorkout = (item: DashboardItem) => {
    setWorkoutToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!workoutToDelete) return;

    try {
      const endpoint = workoutToDelete.type === "planRun"
        ? `/api/plan-runs/${workoutToDelete.id}`
        : `/api/workouts/${workoutToDelete.id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${workoutToDelete.type === "planRun" ? "plan run" : "workout"}`);
      }

      await fetchWorkouts();
      setWorkoutToDelete(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete item");
      setWorkoutToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setWorkoutToDelete(null);
  };

  const handleAddToCalendar = async (item: DashboardItem) => {
    // For now, only manual workouts can be added to calendar
    if (item.type === "planRun") {
      alert("Running plan workouts will be synced to calendar in a future update.");
      return;
    }

    try {
      const response = await fetch(`/api/workouts/${item.id}/add-to-calendar`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add to calendar");
      }

      await fetchWorkouts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add workout to calendar");
    }
  };

  const handleSyncToCalendar = async () => {
    try {
      setSyncingTo(true);
      const startDate = weekDates[0].toISOString();
      const endDate = weekDates[6].toISOString();

      const response = await fetch(
        `/api/sync-to-calendar?startDate=${startDate}&endDate=${endDate}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sync to calendar");
      }

      const result = await response.json();
      await fetchWorkouts();

      // Show sync results
      if (result.totalAdded > 0 || result.errorCount > 0) {
        const messages = [];
        if (result.addedWorkoutsCount > 0) {
          messages.push(`${result.addedWorkoutsCount} workout(s) added`);
        }
        if (result.addedPlanRunsCount > 0) {
          messages.push(`${result.addedPlanRunsCount} plan run(s) added`);
        }
        if (result.errorCount > 0) {
          messages.push(`${result.errorCount} failed`);
        }
        alert(messages.join(", "));
      } else {
        alert("All items already synced to calendar");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to sync to calendar");
    } finally {
      setSyncingTo(false);
    }
  };

  const handleSyncFromCalendar = async () => {
    try {
      setSyncing(true);
      const startDate = weekDates[0].toISOString();
      const endDate = weekDates[6].toISOString();

      const response = await fetch(
        `/api/sync-from-calendar?startDate=${startDate}&endDate=${endDate}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sync from calendar");
      }

      const result = await response.json();
      await fetchWorkouts();

      // Show sync results
      if (result.updatedCount > 0 || result.unsyncedCount > 0) {
        const messages = [];
        if (result.updatedCount > 0) {
          messages.push(`${result.updatedCount} item(s) updated`);
        }
        if (result.unsyncedCount > 0) {
          messages.push(`${result.unsyncedCount} item(s) unsynced (deleted in calendar)`);
        }
        alert(messages.join(", "));
      } else {
        alert("All items are up to date");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to sync from calendar");
    } finally {
      setSyncing(false);
    }
  };

  const handleUnsyncFromCalendar = async () => {
    try {
      setUnsyncing(true);
      const startDate = weekDates[0].toISOString();
      const endDate = weekDates[6].toISOString();

      const response = await fetch(
        `/api/unsync-from-calendar?startDate=${startDate}&endDate=${endDate}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to unsync from calendar");
      }

      const result = await response.json();
      await fetchWorkouts();

      // Show unsync results
      if (result.totalRemoved > 0 || result.errorCount > 0) {
        const messages = [];
        if (result.removedWorkoutsCount > 0) {
          messages.push(`${result.removedWorkoutsCount} workout(s) removed from calendar`);
        }
        if (result.removedPlanRunsCount > 0) {
          messages.push(`${result.removedPlanRunsCount} plan run(s) removed from calendar`);
        }
        if (result.errorCount > 0) {
          messages.push(`${result.errorCount} failed`);
        }
        alert(messages.join(", "));
      } else {
        alert("No synced items found to remove from calendar");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unsync from calendar");
    } finally {
      setUnsyncing(false);
      setShowUnsyncConfirm(false);
    }
  };

  const getItemsForDate = (date: Date): DashboardItem[] => {
    return items.filter((item) => isSameDay(item.date, date));
  };

  const calculateStats = () => {
    // Weekly Distance: sum of all distanceKm in displayed week
    const totalDistance = items.reduce((sum, item) => {
      const distance = item.type === "planRun" ? (item.distanceKm || 0) : 0;
      return sum + distance;
    }, 0);

    // Workouts This Week: count all items (workouts + plan runs)
    const workoutCount = items.length;

    return {
      weeklyDistance: totalDistance > 0 ? `${totalDistance.toFixed(1)} km` : "0.0 km",
      weeklyWorkouts: workoutCount,
      avgPace: "—", // Placeholder - no pace tracking yet
      streak: "—", // Placeholder - no completion tracking yet
    };
  };

  const getRunningPlanInfo = () => {
    // Get unique running plans in this week
    const planRuns = items.filter((item) => item.type === "planRun");
    if (planRuns.length === 0) return [];

    const planMap = new Map<string, { name: string; goal: string; weekNumber: number; durationWeeks: number }>();

    planRuns.forEach((run) => {
      if (!planMap.has(run.runningPlanId)) {
        planMap.set(run.runningPlanId, {
          name: run.runningPlanName,
          goal: run.runningPlanGoal,
          weekNumber: run.weekNumber,
          durationWeeks: run.runningPlanDurationWeeks,
        });
      }
    });

    return Array.from(planMap.values());
  };

  const stats = calculateStats();
  const runningPlans = getRunningPlanInfo();

  if (loading) {
    return (
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: "var(--theme-bg-card)",
          borderColor: "var(--theme-border)"
        }}
      >
        <div className="flex items-center justify-center py-12">
          <div
            className="text-sm"
            style={{ color: "var(--theme-text-muted)" }}
          >
            Loading workouts...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/20">
        <div className="flex items-center justify-between">
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          <button
            onClick={fetchWorkouts}
            className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="rounded-2xl border-2 p-4 sm:p-6 shadow-md"
          style={{
            backgroundColor: "var(--theme-bg-card)",
            borderColor: "var(--theme-border)",
            boxShadow: `0 4px 6px -1px var(--theme-shadow), 0 2px 4px -2px var(--theme-shadow)`
          }}
        >
          <div
            className="text-sm font-semibold"
            style={{ color: "var(--theme-primary)" }}
          >
            Weekly Distance
          </div>
          <div
            className="mt-3 text-2xl sm:text-3xl font-bold"
            style={{ color: "var(--theme-text)" }}
          >
            {stats.weeklyDistance}
          </div>
        </div>

        <div
          className="rounded-2xl border-2 p-4 sm:p-6 shadow-md"
          style={{
            backgroundColor: "var(--theme-bg-card)",
            borderColor: "var(--theme-border)",
            boxShadow: `0 4px 6px -1px var(--theme-shadow), 0 2px 4px -2px var(--theme-shadow)`
          }}
        >
          <div
            className="text-sm font-semibold"
            style={{ color: "var(--theme-primary)" }}
          >
            Workouts This Week
          </div>
          <div
            className="mt-3 text-2xl sm:text-3xl font-bold"
            style={{ color: "var(--theme-text)" }}
          >
            {stats.weeklyWorkouts}
          </div>
        </div>

        <div
          className="rounded-2xl border-2 p-4 sm:p-6 shadow-md"
          style={{
            backgroundColor: "var(--theme-bg-card)",
            borderColor: "var(--theme-border)",
            boxShadow: `0 4px 6px -1px var(--theme-shadow), 0 2px 4px -2px var(--theme-shadow)`
          }}
        >
          <div
            className="text-sm font-semibold"
            style={{ color: "var(--theme-primary)" }}
          >
            Avg Pace
          </div>
          <div
            className="mt-3 text-2xl sm:text-3xl font-bold"
            style={{ color: "var(--theme-text-muted)" }}
          >
            {stats.avgPace}
          </div>
        </div>

        <div
          className="rounded-2xl border-2 p-4 sm:p-6 shadow-md"
          style={{
            backgroundColor: "var(--theme-bg-card)",
            borderColor: "var(--theme-border)",
            boxShadow: `0 4px 6px -1px var(--theme-shadow), 0 2px 4px -2px var(--theme-shadow)`
          }}
        >
          <div
            className="text-sm font-semibold"
            style={{ color: "var(--theme-primary)" }}
          >
            Day Streak
          </div>
          <div
            className="mt-3 text-2xl sm:text-3xl font-bold"
            style={{ color: "var(--theme-text-muted)" }}
          >
            {stats.streak}
          </div>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div
        className="rounded-2xl border-2 p-8 shadow-lg"
        style={{
          backgroundColor: "var(--theme-bg-card)",
          borderColor: "var(--theme-border)",
          boxShadow: `0 10px 15px -3px var(--theme-shadow-strong), 0 4px 6px -4px var(--theme-shadow-strong)`
        }}
      >
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handlePreviousWeek}
              className="rounded-xl border-2 px-2 py-1.5 shadow-sm transition-all"
              style={{
                backgroundColor: hoveredElement === 'prev' ? "var(--theme-bg-hover)" : "var(--theme-bg-card)",
                borderColor: "var(--theme-border-light)",
                color: "var(--theme-primary)",
                boxShadow: hoveredElement === 'prev'
                  ? `0 4px 6px -1px var(--theme-shadow), 0 2px 4px -2px var(--theme-shadow)`
                  : `0 1px 2px 0 var(--theme-shadow)`
              }}
              onMouseEnter={() => setHoveredElement('prev')}
              onMouseLeave={() => setHoveredElement(null)}
              title="Previous week"
            >
              <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="rounded-xl border-2 px-3 py-1.5 text-sm font-semibold shadow-sm transition-all"
              style={{
                backgroundColor: hoveredElement === 'today' ? "var(--theme-bg-hover)" : "var(--theme-bg-card)",
                borderColor: "var(--theme-border-light)",
                color: "var(--theme-primary)",
                boxShadow: hoveredElement === 'today'
                  ? `0 4px 6px -1px var(--theme-shadow), 0 2px 4px -2px var(--theme-shadow)`
                  : `0 1px 2px 0 var(--theme-shadow)`
              }}
              onMouseEnter={() => setHoveredElement('today')}
              onMouseLeave={() => setHoveredElement(null)}
              title="Go to current week"
            >
              Today
            </button>
            <button
              onClick={handleNextWeek}
              className="rounded-xl border-2 px-2 py-1.5 shadow-sm transition-all"
              style={{
                backgroundColor: hoveredElement === 'next' ? "var(--theme-bg-hover)" : "var(--theme-bg-card)",
                borderColor: "var(--theme-border-light)",
                color: "var(--theme-primary)",
                boxShadow: hoveredElement === 'next'
                  ? `0 4px 6px -1px var(--theme-shadow), 0 2px 4px -2px var(--theme-shadow)`
                  : `0 1px 2px 0 var(--theme-shadow)`
              }}
              onMouseEnter={() => setHoveredElement('next')}
              onMouseLeave={() => setHoveredElement(null)}
              title="Next week"
            >
              <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h2
              className="text-lg sm:text-2xl font-bold"
              style={{ color: "var(--theme-text)" }}
            >
              {getWeekRangeText()}
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleSyncToCalendar}
              disabled={syncingTo}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              style={{
                backgroundColor: hoveredElement === 'syncTo' && !syncingTo ? "var(--theme-primary-hover)" : "var(--theme-primary)",
                boxShadow: hoveredElement === 'syncTo' && !syncingTo
                  ? `0 10px 15px -3px var(--theme-shadow-strong), 0 4px 6px -4px var(--theme-shadow-strong)`
                  : `0 4px 6px -1px var(--theme-shadow-strong), 0 2px 4px -2px var(--theme-shadow-strong)`
              }}
              onMouseEnter={() => setHoveredElement('syncTo')}
              onMouseLeave={() => setHoveredElement(null)}
              title="Add unsynced items to Google Calendar"
            >
              <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {syncingTo ? "Syncing..." : "Sync to Calendar"}
            </button>
            <button
              onClick={handleSyncFromCalendar}
              disabled={syncing}
              className="flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              style={{
                backgroundColor: hoveredElement === 'syncFrom' && !syncing ? "var(--theme-bg-hover)" : "var(--theme-bg-card)",
                borderColor: "var(--theme-border-light)",
                color: "var(--theme-primary)",
                boxShadow: hoveredElement === 'syncFrom' && !syncing
                  ? `0 4px 6px -1px var(--theme-shadow), 0 2px 4px -2px var(--theme-shadow)`
                  : `0 1px 2px 0 var(--theme-shadow)`
              }}
              onMouseEnter={() => setHoveredElement('syncFrom')}
              onMouseLeave={() => setHoveredElement(null)}
              title="Pull changes from Google Calendar"
            >
              <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? "Syncing..." : "Sync from Calendar"}
            </button>
            <button
              onClick={() => setShowUnsyncConfirm(true)}
              disabled={unsyncing}
              className="flex items-center gap-2 rounded-xl border-2 border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm shadow-red-300/20 transition-all hover:bg-red-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-700 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-900/30 w-full sm:w-auto"
              title="Remove synced items from Google Calendar"
            >
              <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
              {unsyncing ? "Removing..." : "Unsync from Calendar"}
            </button>
          </div>
        </div>

        {/* Running Plan Progress */}
        {runningPlans.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-3">
            {runningPlans.map((plan, idx) => (
              <div
                key={idx}
                className="rounded-xl border-2 px-2 py-1.5 sm:px-4 sm:py-2.5 shadow-sm"
                style={{
                  backgroundColor: "var(--theme-bg-card-alt)",
                  borderColor: "var(--theme-border)",
                  boxShadow: `0 1px 2px 0 var(--theme-shadow)`
                }}
              >
                <div
                  className="text-sm font-semibold"
                  style={{ color: "var(--theme-primary)" }}
                >
                  {plan.name} — Week {plan.weekNumber} of {plan.durationWeeks}
                </div>
              </div>
            ))}
          </div>
        )}

  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {weekDates.map((date) => {
            const dayItems = getItemsForDate(date);
            return (
              <DayCard
                key={date.toISOString()}
                date={date}
                items={dayItems}
                onAddWorkout={handleAddWorkout}
                onEditWorkout={handleEditWorkout}
                onDeleteWorkout={handleDeleteWorkout}
                onAddToCalendar={handleAddToCalendar}
              />
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCancelWorkout}
        title={
          editingWorkout
            ? editingWorkout.type === "planRun"
              ? "Edit Plan Run"
              : "Edit Workout"
            : "Add Workout"
        }
      >
        {selectedDate && editingWorkout?.type === "planRun" ? (
          <PlanRunForm
            selectedDate={selectedDate}
            existingRun={editingWorkout}
            onSubmit={handleSubmitPlanRun}
            onCancel={handleCancelWorkout}
          />
        ) : selectedDate ? (
          <WorkoutForm
            selectedDate={selectedDate}
            existingWorkout={editingWorkout && editingWorkout.type === "workout" ? editingWorkout : null}
            onSubmit={handleSubmitWorkout}
            onCancel={handleCancelWorkout}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={!!workoutToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Workout"
        message={`Are you sure you want to delete "${workoutToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <ConfirmDialog
        isOpen={showUnsyncConfirm}
        onConfirm={handleUnsyncFromCalendar}
        onCancel={() => setShowUnsyncConfirm(false)}
        title="Unsync from Google Calendar"
        message="This will remove all synced items from Google Calendar for this week. The items will remain in FitFlow. Are you sure you want to continue?"
        confirmText="Remove from Calendar"
        cancelText="Cancel"
      />
    </>
  );
}
