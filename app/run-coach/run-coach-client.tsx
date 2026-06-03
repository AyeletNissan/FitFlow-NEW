"use client";

import { useState, useEffect } from "react";
import RunCoachForm from "../components/run-coach-form";
import ConfirmDialog from "../components/confirm-dialog";
import { RunningPlan, SavedRunningPlan } from "../lib/running-plan-types";

export default function RunCoachClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<RunningPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedRunningPlan[]>([]);
  const [loadingSavedPlans, setLoadingSavedPlans] = useState(true);
  const [viewingPlanId, setViewingPlanId] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState("");
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<SavedRunningPlan | null>(null);

  useEffect(() => {
    fetchSavedPlans();
  }, []);

  const fetchSavedPlans = async () => {
    try {
      setLoadingSavedPlans(true);
      const response = await fetch("/api/running-plans");
      if (response.ok) {
        const data = await response.json();
        setSavedPlans(data);
      }
    } catch (err) {
      console.error("Error fetching saved plans:", err);
    } finally {
      setLoadingSavedPlans(false);
    }
  };

  const handleGeneratePlan = async (formData: {
    runningLevel: string;
    goal: string;
    runsPerWeek: number;
    durationWeeks: number;
    startDate: string;
    preferredDays: string[];
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      setPlan(null);
      setViewingPlanId(null);

      const response = await fetch("/api/generate-running-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate running plan");
      }

      const data = await response.json();
      setPlan(data.plan);

      // Refresh saved plans list
      await fetchSavedPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setPlan(null);
    setError(null);
    setViewingPlanId(null);
  };

  const handleAddPlanToCalendar = async (planId: string) => {
    try {
      const response = await fetch(`/api/running-plans/${planId}/add-to-calendar`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add plan to calendar");
      }

      const result = await response.json();

      if (result.addedCount > 0 || result.skippedCount > 0) {
        const messages = [];
        if (result.addedCount > 0) {
          messages.push(`${result.addedCount} run(s) added to calendar`);
        }
        if (result.skippedCount > 0) {
          messages.push(`${result.skippedCount} already synced`);
        }
        if (result.errorCount > 0) {
          messages.push(`${result.errorCount} failed`);
        }
        alert(messages.join(", "));
      }

      // Refresh plans to show updated calendar status
      await fetchSavedPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add plan to calendar");
    }
  };

  const handleViewSavedPlan = (savedPlan: SavedRunningPlan) => {
    // Convert saved plan to RunningPlan format
    const weeks = new Map<number, { weekNumber: number; theme: string; runs: any[] }>();

    savedPlan.runs.forEach((run) => {
      if (!weeks.has(run.weekNumber)) {
        weeks.set(run.weekNumber, {
          weekNumber: run.weekNumber,
          theme: run.weekTheme,
          runs: [],
        });
      }
      weeks.get(run.weekNumber)!.runs.push({
        date: run.date.toString(),
        day: run.day,
        title: run.title,
        workoutType: run.workoutType,
        details: run.details,
        durationMinutes: run.durationMinutes ?? undefined,
        distanceKm: run.distanceKm ?? undefined,
      });
    });

    const planToView: RunningPlan = {
      planName: savedPlan.name,
      level: savedPlan.level,
      goal: savedPlan.goal,
      durationWeeks: savedPlan.durationWeeks,
      runsPerWeek: savedPlan.runsPerWeek,
      startDate: savedPlan.startDate.toString(),
      preferredRunningDays: savedPlan.preferredRunningDays,
      weeks: Array.from(weeks.values()).sort((a, b) => a.weekNumber - b.weekNumber),
    };

    setPlan(planToView);
    setViewingPlanId(savedPlan.id);
    setUpdateSuccess(null);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!viewingPlanId || !updateMessage.trim()) {
      return;
    }

    try {
      setIsUpdatingPlan(true);
      setError(null);
      setUpdateSuccess(null);

      const response = await fetch("/api/update-running-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runningPlanId: viewingPlanId,
          userMessage: updateMessage,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update plan");
      }

      const result = await response.json();

      // Refresh saved plans
      await fetchSavedPlans();

      // Find and display the updated plan
      const updatedSavedPlan = savedPlans.find(p => p.id === viewingPlanId);
      if (updatedSavedPlan) {
        // Fetch the fresh plan data
        const plansResponse = await fetch("/api/running-plans");
        if (plansResponse.ok) {
          const freshPlans = await plansResponse.json();
          const freshPlan = freshPlans.find((p: SavedRunningPlan) => p.id === viewingPlanId);
          if (freshPlan) {
            handleViewSavedPlan(freshPlan);
          }
        }
      }

      // Clear the message
      setUpdateMessage("");

      // Show success message
      let successMsg = "Plan updated successfully!";
      if (result.runsModified > 0) {
        successMsg = `Plan updated! ${result.runsModified} run(s) modified.`;
        if (result.hadSyncedRuns) {
          successMsg += " Some runs were previously synced to Google Calendar. Use 'Sync to Calendar' on the Dashboard to update them.";
        }
      }
      setUpdateSuccess(successMsg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update plan");
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;

    try {
      setError(null);

      const response = await fetch(`/api/running-plans/${planToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete plan");
      }

      // Close the plan view if we're viewing the deleted plan
      if (viewingPlanId === planToDelete.id) {
        setPlan(null);
        setViewingPlanId(null);
      }

      // Refresh saved plans
      await fetchSavedPlans();

      setPlanToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete plan");
      setPlanToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getWorkoutTypeColor = (workoutType: string) => {
    const colors: Record<string, string> = {
      easy: "bg-green-50 text-green-700 border border-green-200/50 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800",
      tempo: "bg-orange-50 text-orange-700 border border-orange-200/50 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800",
      intervals: "bg-red-50 text-red-600 border border-red-200/50 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
      long: "bg-blue-50 text-blue-700 border border-blue-200/50 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
      recovery: "bg-purple-50 text-purple-700 border border-purple-200/50 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800",
      rest: "bg-zinc-50 text-zinc-700 border border-zinc-200/50 dark:bg-zinc-800/30 dark:text-zinc-300 dark:border-zinc-700",
    };
    return colors[workoutType.toLowerCase()] || "bg-zinc-50 text-zinc-700 border border-zinc-200/50 dark:bg-zinc-800/30 dark:text-zinc-300 dark:border-zinc-700";
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1
            className="text-4xl font-bold bg-clip-text text-transparent"
            style={{
              background: "linear-gradient(to right, var(--theme-primary), var(--theme-primary-hover))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            AI Run Coach
          </h1>
          <p className="mt-3 text-base" style={{ color: "var(--theme-text-muted)" }}>
            Get a personalized running plan powered by Claude AI
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200/50 bg-red-50/50 p-5 shadow-sm dark:border-red-800 dark:bg-red-950/20">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100/50 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Saved Plans Section */}
        {!plan && savedPlans.length > 0 && (
          <div
            className="mb-6 rounded-2xl border-2 p-6"
            style={{
              borderColor: "var(--theme-border)",
              backgroundColor: "var(--theme-bg-card)",
              boxShadow: "0 4px 6px -1px var(--theme-shadow)",
            }}
          >
            <h2 className="mb-5 text-lg font-bold" style={{ color: "var(--theme-text)" }}>
              My Running Plans
            </h2>
            <div className="space-y-3">
              {savedPlans.map((savedPlan) => (
                <div
                  key={savedPlan.id}
                  className="flex items-center justify-between rounded-xl border-2 p-5 shadow-sm transition-all"
                  style={{
                    borderColor: "var(--theme-border-light)",
                    backgroundColor: "var(--theme-bg-card)",
                    boxShadow: "0 1px 2px var(--theme-shadow)",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 6px -1px var(--theme-shadow-strong)"}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)"}
                >
                  <div className="flex-1">
                    <h3 className="font-bold" style={{ color: "var(--theme-text)" }}>
                      {savedPlan.name}
                    </h3>
                    <p className="mt-1.5 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                      {savedPlan.level.charAt(0).toUpperCase() + savedPlan.level.slice(1)} •{" "}
                      {savedPlan.goal} • {savedPlan.durationWeeks} weeks •{" "}
                      {new Date(savedPlan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleViewSavedPlan(savedPlan)}
                      className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:[background-color:var(--theme-primary-hover)] hover:shadow-lg"
                      style={{
                        backgroundColor: "var(--theme-primary)",
                        boxShadow: "0 4px 6px -1px var(--theme-shadow-strong)",
                      }}
                    >
                      View Plan
                    </button>
                    <button
                      onClick={() => setPlanToDelete(savedPlan)}
                      className="rounded-xl border-2 border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm shadow-red-300/20 transition-all hover:bg-red-50 hover:shadow-md dark:border-red-700 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Delete Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form or Results */}
        {!plan ? (
          savedPlans.length === 0 && (
            <div
              className="rounded-2xl border-2 p-8"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor: "var(--theme-bg-card)",
                boxShadow: "0 4px 6px -1px var(--theme-shadow)",
              }}
            >
              <h2 className="mb-6 text-lg font-bold" style={{ color: "var(--theme-text)" }}>
                Create Your Running Plan
              </h2>
              <RunCoachForm onSubmit={handleGeneratePlan} isLoading={isLoading} />
            </div>
          )
        ) : (
          <div className="space-y-6">
            {/* Plan Header */}
            <div
              className="rounded-2xl border-2 p-6"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor: "var(--theme-bg-card)",
                boxShadow: "0 4px 6px -1px var(--theme-shadow)",
              }}
            >
              <div className="mb-5">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--theme-text)" }}>
                    {plan.planName}
                  </h2>
                  <p className="mt-2 text-sm font-medium" style={{ color: "var(--theme-text-muted)" }}>
                    {plan.level.charAt(0).toUpperCase() + plan.level.slice(1)} •{" "}
                    {plan.goal} • {plan.durationWeeks} weeks
                  </p>
                </div>
              </div>

              <div
                className="grid grid-cols-2 gap-4 rounded-xl p-5 text-sm sm:grid-cols-3"
                style={{ backgroundColor: "var(--theme-bg-card-alt)" }}
              >
                <div>
                  <span className="font-semibold" style={{ color: "var(--theme-primary)" }}>
                    Runs per Week:
                  </span>{" "}
                  <span style={{ color: "var(--theme-text)" }}>
                    {plan.runsPerWeek}
                  </span>
                </div>
                <div>
                  <span className="font-semibold" style={{ color: "var(--theme-primary)" }}>
                    Start Date:
                  </span>{" "}
                  <span style={{ color: "var(--theme-text)" }}>
                    {new Date(plan.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="font-semibold" style={{ color: "var(--theme-primary)" }}>
                    Running Days:
                  </span>{" "}
                  <span style={{ color: "var(--theme-text)" }}>
                    {plan.preferredRunningDays.join(", ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Update Plan Chat - Only show for saved plans */}
            {viewingPlanId && (
              <div
                className="rounded-2xl border-2 p-6"
                style={{
                  borderColor: "var(--theme-border)",
                  backgroundColor: "var(--theme-bg-card)",
                  boxShadow: "0 4px 6px -1px var(--theme-shadow)",
                }}
              >
                <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--theme-text)" }}>
                  Update Your Plan
                </h3>
                <p className="mb-4 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                  Tell the AI coach how you'd like to adjust your plan. For example: "I missed this week's Wednesday run", "This plan feels too easy", or "I can only run twice next week".
                </p>

                {updateSuccess && (
                  <div className="mb-4 rounded-xl border-2 border-green-300 bg-green-50 p-4 shadow-sm shadow-green-300/20 dark:border-green-800 dark:bg-green-950/20">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">{updateSuccess}</p>
                  </div>
                )}

                <form onSubmit={handleUpdatePlan} className="space-y-3">
                  <textarea
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    placeholder="Describe how you'd like to adjust your plan..."
                    rows={3}
                    disabled={isUpdatingPlan}
                    className="w-full rounded-xl border-2 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:shadow-md disabled:opacity-50"
                    style={{
                      borderColor: "var(--theme-border-light)",
                      backgroundColor: "var(--theme-bg-card)",
                      color: "var(--theme-text)",
                      boxShadow: "0 1px 2px var(--theme-shadow)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--theme-border-strong)";
                      e.currentTarget.style.boxShadow = `0 0 0 3px var(--theme-shadow), 0 4px 6px -1px var(--theme-shadow)`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--theme-border-light)";
                      e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      Updates will be saved in FitFlow. Use "Sync to Calendar" on the Dashboard to update Google Calendar.
                    </p>
                    <button
                      type="submit"
                      disabled={isUpdatingPlan || !updateMessage.trim()}
                      className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:[background-color:var(--theme-primary-hover)] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        backgroundColor: "var(--theme-primary)",
                        boxShadow: "0 4px 6px -1px var(--theme-shadow-strong)",
                      }}
                    >
                      {isUpdatingPlan ? "Updating..." : "Update Plan"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Weeks */}
            {plan.weeks.map((week) => (
              <div
                key={week.weekNumber}
                className="rounded-2xl border-2 p-6"
                style={{
                  borderColor: "var(--theme-border)",
                  backgroundColor: "var(--theme-bg-card)",
                  boxShadow: "0 4px 6px -1px var(--theme-shadow)",
                }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>
                      Week {week.weekNumber}
                    </h3>
                    <p className="mt-1 text-sm font-medium" style={{ color: "var(--theme-text-muted)" }}>
                      {week.theme}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {week.runs.map((run, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border-2 p-4 shadow-sm transition-all"
                      style={{
                        borderColor: "var(--theme-border-light)",
                        backgroundColor: "var(--theme-bg-card)",
                        boxShadow: "0 1px 2px var(--theme-shadow)",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 6px -1px var(--theme-shadow-strong)"}
                      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)"}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
                              {formatDate(run.date)}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${getWorkoutTypeColor(
                                run.workoutType
                              )}`}
                            >
                              {run.workoutType.charAt(0).toUpperCase() +
                                run.workoutType.slice(1)}
                            </span>
                          </div>
                          <h4 className="mt-1.5 font-bold" style={{ color: "var(--theme-text)" }}>
                            {run.title}
                          </h4>
                        </div>
                        <div className="ml-4 text-right text-sm font-medium" style={{ color: "var(--theme-text-muted)" }}>
                          {run.distanceKm && (
                            <div>{run.distanceKm} km</div>
                          )}
                          {run.durationMinutes && (
                            <div>{run.durationMinutes} min</div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm" style={{ color: "var(--theme-text)" }}>
                        {run.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Cards */}
        {!plan && !isLoading && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div
              className="rounded-2xl border-2 p-5"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor: "var(--theme-bg-card)",
                boxShadow: "0 4px 6px -1px var(--theme-shadow)",
              }}
            >
              <h3 className="font-bold" style={{ color: "var(--theme-primary)" }}>
                What You'll Get
              </h3>
              <ul className="mt-3 space-y-1.5 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                <li>• Week-by-week training schedule</li>
                <li>• Specific workout types and distances</li>
                <li>• Rest and recovery guidance</li>
                <li>• Injury prevention tips</li>
              </ul>
            </div>

            <div
              className="rounded-2xl border-2 p-5"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor: "var(--theme-bg-card)",
                boxShadow: "0 4px 6px -1px var(--theme-shadow)",
              }}
            >
              <h3 className="font-bold" style={{ color: "var(--theme-primary)" }}>
                Powered by Claude AI
              </h3>
              <ul className="mt-3 space-y-1.5 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                <li>• Expert running coach knowledge</li>
                <li>• Personalized to your level and goals</li>
                <li>• Safe progressive training</li>
                <li>• Evidence-based recommendations</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!planToDelete}
        onConfirm={handleDeletePlan}
        onCancel={() => setPlanToDelete(null)}
        title="Delete Running Plan"
        message={`Are you sure you want to delete "${planToDelete?.name}"? This will delete all runs in the plan. This action cannot be undone.`}
        confirmText="Delete Plan"
        cancelText="Cancel"
      />
    </div>
  );
}
