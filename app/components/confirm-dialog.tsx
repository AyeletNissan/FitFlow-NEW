"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border-2 p-6"
        style={{
          borderColor: "var(--theme-border)",
          backgroundColor: "var(--theme-bg-card)",
          boxShadow: "0 20px 25px -5px var(--theme-shadow-strong)",
        }}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>
          {title}
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--theme-text-muted)" }}>
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
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
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-500/30 transition-all hover:bg-red-600 hover:shadow-lg hover:shadow-red-600/40"
            style={{ backgroundColor: "#ef4444" }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
