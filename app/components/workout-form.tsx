"use client";

import { useState, useEffect } from "react";
import { Workout, formatTimeForInput, formatDateForInput } from "../lib/mock-data";

interface WorkoutFormProps {
  selectedDate: Date;
  existingWorkout?: Workout | null;
  onSubmit: (formData: {
    title: string;
    type: string;
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
}

export default function WorkoutForm({ selectedDate, existingWorkout, onSubmit, onCancel }: WorkoutFormProps) {
  const predefinedTypes = ["Running", "Gym", "Cycling", "Swimming"];
  const isCustomType = existingWorkout?.workoutType && !predefinedTypes.includes(existingWorkout.workoutType);

  const [formData, setFormData] = useState({
    title: existingWorkout?.title || "",
    type: isCustomType ? "Custom" : (existingWorkout?.workoutType || "Running"),
    customType: isCustomType ? existingWorkout?.workoutType : "",
    date: existingWorkout ? formatDateForInput(existingWorkout.date) : selectedDate.toISOString().split("T")[0],
    startTime: existingWorkout ? formatTimeForInput(existingWorkout.startTime) : "",
    endTime: existingWorkout ? formatTimeForInput(existingWorkout.endTime) : "",
    location: existingWorkout?.location || "",
    notes: existingWorkout?.notes || "",
  });

  useEffect(() => {
    if (existingWorkout) {
      const isCustom = !predefinedTypes.includes(existingWorkout.workoutType);
      setFormData({
        title: existingWorkout.title,
        type: isCustom ? "Custom" : existingWorkout.workoutType,
        customType: isCustom ? existingWorkout.workoutType : "",
        date: formatDateForInput(existingWorkout.date),
        startTime: formatTimeForInput(existingWorkout.startTime),
        endTime: formatTimeForInput(existingWorkout.endTime),
        location: existingWorkout.location || "",
        notes: existingWorkout.notes || "",
      });
    }
  }, [existingWorkout]);

  const [errors, setErrors] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  const validate = () => {
    const newErrors = {
      title: "",
      date: "",
      startTime: "",
      endTime: "",
    };

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!formData.endTime) {
      newErrors.endTime = "End time is required";
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = "End time must be after start time";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const workoutType = formData.type === "Custom" ? formData.customType : formData.type;

    onSubmit({
      title: formData.title,
      type: workoutType,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    });
  };

  const inputStyles = {
    borderColor: "var(--theme-border-light)",
    backgroundColor: "var(--theme-bg-card)",
    color: "var(--theme-text)",
    boxShadow: "0 1px 2px var(--theme-shadow)",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1.5 w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:shadow-md"
          style={inputStyles}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-strong)";
            e.currentTarget.style.boxShadow = `0 0 0 3px var(--theme-shadow), 0 4px 6px -1px var(--theme-shadow)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-light)";
            e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
          }}
          placeholder="e.g. Morning Run"
        />
        {errors.title && (
          <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
          Type
        </label>
        <select
          value={formData.type}
          onChange={(e) =>
            setFormData({
              ...formData,
              type: e.target.value,
            })
          }
          className="mt-1.5 w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:shadow-md"
          style={inputStyles}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-strong)";
            e.currentTarget.style.boxShadow = `0 0 0 3px var(--theme-shadow), 0 4px 6px -1px var(--theme-shadow)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-light)";
            e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
          }}
        >
          <option value="Running">Running</option>
          <option value="Gym">Gym</option>
          <option value="Cycling">Cycling</option>
          <option value="Swimming">Swimming</option>
          <option value="Custom">Custom</option>
        </select>
      </div>

      {formData.type === "Custom" && (
        <div>
          <label className="block text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
            Custom Type <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.customType}
            onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
            className="mt-1.5 w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:shadow-md"
            style={inputStyles}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--theme-border-strong)";
              e.currentTarget.style.boxShadow = `0 0 0 3px var(--theme-shadow), 0 4px 6px -1px var(--theme-shadow)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--theme-border-light)";
              e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
            }}
            placeholder="e.g. Yoga, Pilates, Boxing"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="mt-1.5 w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:shadow-md"
          style={inputStyles}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-strong)";
            e.currentTarget.style.boxShadow = `0 0 0 3px var(--theme-shadow), 0 4px 6px -1px var(--theme-shadow)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-light)";
            e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
          }}
        />
        {errors.date && (
          <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{errors.date}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="mt-1.5 w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:shadow-md"
            style={inputStyles}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--theme-border-strong)";
              e.currentTarget.style.boxShadow = `0 0 0 3px var(--theme-shadow), 0 4px 6px -1px var(--theme-shadow)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--theme-border-light)";
              e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
            }}
          />
          {errors.startTime && (
            <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{errors.startTime}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="mt-1.5 w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:shadow-md"
            style={inputStyles}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--theme-border-strong)";
              e.currentTarget.style.boxShadow = `0 0 0 3px var(--theme-shadow), 0 4px 6px -1px var(--theme-shadow)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--theme-border-light)";
              e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
            }}
          />
          {errors.endTime && (
            <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{errors.endTime}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
          Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="mt-1.5 w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:shadow-md"
          style={inputStyles}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-strong)";
            e.currentTarget.style.boxShadow = `0 0 0 3px var(--theme-shadow), 0 4px 6px -1px var(--theme-shadow)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-light)";
            e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
          }}
          placeholder="e.g. Central Park"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="mt-1.5 w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:shadow-md"
          style={inputStyles}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-strong)";
            e.currentTarget.style.boxShadow = `0 0 0 3px var(--theme-shadow), 0 4px 6px -1px var(--theme-shadow)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-border-light)";
            e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
          }}
          placeholder="Add any notes about your workout..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all"
          style={{
            borderColor: "var(--theme-border-light)",
            backgroundColor: "var(--theme-bg-card)",
            color: "var(--theme-text)",
            boxShadow: "0 1px 2px var(--theme-shadow)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--theme-bg-hover)";
            e.currentTarget.style.boxShadow = "0 4px 6px -1px var(--theme-shadow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--theme-bg-card)";
            e.currentTarget.style.boxShadow = "0 1px 2px var(--theme-shadow)";
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all"
          style={{
            backgroundColor: "var(--theme-primary)",
            boxShadow: "0 4px 6px -1px var(--theme-shadow-strong)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--theme-primary-hover)";
            e.currentTarget.style.boxShadow = "0 10px 15px -3px var(--theme-shadow-strong)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--theme-primary)";
            e.currentTarget.style.boxShadow = "0 4px 6px -1px var(--theme-shadow-strong)";
          }}
        >
          {existingWorkout ? "Update Workout" : "Add Workout"}
        </button>
      </div>
    </form>
  );
}
