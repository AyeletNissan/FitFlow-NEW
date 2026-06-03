"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function MobileHamburger() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="relative md:hidden" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-label="Open menu"
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center justify-center rounded-lg p-2 text-sm"
        style={{
          border: "2px solid var(--theme-border-light)",
          backgroundColor: "var(--theme-bg-card)",
          color: "var(--theme-primary)",
        }}
      >
        {/* simple hamburger icon */}
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-40 rounded-md shadow-lg"
          style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border-light)" }}
        >
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm"
              style={{ color: "var(--theme-text)" }}
            >
              Dashboard
            </Link>
            <Link
              href="/run-coach"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm"
              style={{ color: "var(--theme-text)" }}
            >
              Run Coach
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
