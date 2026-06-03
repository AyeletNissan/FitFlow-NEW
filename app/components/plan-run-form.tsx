"use client";

import { useState, useEffect } from "react";
import { formatDateForInput, formatTimeForInput } from "../lib/mock-data";
import { PlanRun } from "../lib/mock-data";

interface PlanRunFormProps {
  selectedDate: Date;
  existingRun: PlanRun | null;
  onSubmit: (formData: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    details: string;
  }) => void;
  onCancel: () => void;
}

export default function PlanRunForm({
  selectedDate,
  existingRun,
  onSubmit,
  onCancel,
}: PlanRunFormProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(formatDateForInput(selectedDate));
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingRun) {
      setTitle(existingRun.title);
      setDate(formatDateForInput(existingRun.date));
      setStartTime(formatTimeForInput(existingRun.startTime));
      setEndTime(formatTimeForInput(existingRun.endTime));
      setDetails(existingRun.notes);
    }
  }, [existingRun]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!date) {
      newErrors.date = "Date is required";
    }

    if (!startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!endTime) {
      newErrors.endTime = "End time is required";
    }

    // Check if end time is after start time
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      if (end <= start) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit({
      title,
      date,
      startTime,
      endTime,
      details,
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
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          placeholder="e.g., Easy Run, Tempo Run"
        />
        {errors.title && (
          <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
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
          <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">
            {errors.date}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
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
            <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">
              {errors.startTime}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
            End Time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
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
            <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">
              {errors.endTime}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
          Details
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
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
          placeholder="Run at a comfortable pace. Focus on form and breathing."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all hover:[background-color:var(--theme-bg-hover)]"
          style={{
            borderColor: "var(--theme-border-light)",
            backgroundColor: "var(--theme-bg-card)",
            color: "var(--theme-text)",
            boxShadow: "0 1px 2px var(--theme-shadow)",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:[background-color:var(--theme-primary-hover)] hover:shadow-lg"
          style={{
            backgroundColor: "var(--theme-primary)",
            boxShadow: "0 4px 6px -1px var(--theme-shadow-strong)",
          }}
        >
          {existingRun ? "Update Run" : "Save Run"}
        </button>
      </div>
    </form>
  );
}
