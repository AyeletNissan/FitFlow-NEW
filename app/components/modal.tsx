"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border-2"
        style={{
          borderColor: "var(--theme-border)",
          backgroundColor: "var(--theme-bg-card)",
          boxShadow: "0 20px 25px -5px var(--theme-shadow-strong)",
        }}
      >
        <div
          className="flex items-center justify-between border-b-2 p-5"
          style={{ borderColor: "var(--theme-border-light)" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-all"
            style={{ color: "var(--theme-text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--theme-bg-hover)";
              e.currentTarget.style.color = "var(--theme-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--theme-text-muted)";
            }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
