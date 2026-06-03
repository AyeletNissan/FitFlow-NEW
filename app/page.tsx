"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <section className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-4xl text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight" style={{ color: "var(--theme-text)" }}>
            Train Smarter with{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                background: "linear-gradient(to right, var(--theme-primary), var(--theme-primary-hover))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              FitFlow
            </span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8" style={{ color: "var(--theme-text-muted)" }}>
            Plan your workouts, track your runs, and get personalized coaching powered by AI.
            Everything you need to reach your fitness goals.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/dashboard"
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all w-full sm:w-auto"
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
              Get Started
            </Link>
            <Link
              href="/run-coach"
              className="rounded-xl border-2 px-6 py-3 text-sm font-semibold transition-all w-full sm:w-auto"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor: "var(--theme-bg-card)",
                color: "var(--theme-primary)",
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
              Try Run Coach
            </Link>
          </div>

          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div
              className="rounded-2xl border-2 p-8 transition-all"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor: "var(--theme-bg-card)",
                boxShadow: "0 4px 6px -1px var(--theme-shadow)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 10px 15px -3px var(--theme-shadow-strong)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 6px -1px var(--theme-shadow)"}
            >
              <div className="text-4xl mb-4">🏃</div>
              <h3 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>
                Running Plans
              </h3>
              <p className="mt-3 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                Structured training plans tailored to your goals and fitness level
              </p>
            </div>

            <div
              className="rounded-2xl border-2 p-8 transition-all"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor: "var(--theme-bg-card)",
                boxShadow: "0 4px 6px -1px var(--theme-shadow)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 10px 15px -3px var(--theme-shadow-strong)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 6px -1px var(--theme-shadow)"}
            >
              <div className="text-4xl mb-4">💪</div>
              <h3 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>
                Workout Tracking
              </h3>
              <p className="mt-3 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                Log and monitor your workouts with detailed progress tracking
              </p>
            </div>

            <div
              className="rounded-2xl border-2 p-8 transition-all"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor: "var(--theme-bg-card)",
                boxShadow: "0 4px 6px -1px var(--theme-shadow)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 10px 15px -3px var(--theme-shadow-strong)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 6px -1px var(--theme-shadow)"}
            >
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>
                AI Run Coach
              </h3>
              <p className="mt-3 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                Get personalized coaching and advice powered by AI
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
