"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"wellness" | "sport">("wellness");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem("fitflow-theme");
    if (savedTheme === "sport") {
      setTheme("sport");
      document.documentElement.setAttribute("data-theme", "sport");
    } else {
      setTheme("wellness");
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "wellness" ? "sport" : "wellness";
    setTheme(newTheme);

    if (newTheme === "sport") {
      document.documentElement.setAttribute("data-theme", "sport");
      localStorage.setItem("fitflow-theme", "sport");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("fitflow-theme", "wellness");
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button className="rounded-xl border-2 border-transparent px-4 py-2 text-sm font-semibold opacity-0">
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all flex items-center justify-center"
      style={{
        borderColor: "var(--theme-border-light)",
        backgroundColor: "var(--theme-bg-card)",
        color: "var(--theme-primary)",
        boxShadow: `0 1px 2px var(--theme-shadow)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--theme-bg-hover)";
        e.currentTarget.style.boxShadow = `0 4px 6px var(--theme-shadow)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--theme-bg-card)";
        e.currentTarget.style.boxShadow = `0 1px 2px var(--theme-shadow)`;
      }}
      title={theme === "wellness" ? "Switch to Sport Mode" : "Switch to Wellness Mode"}
    >
      {/* Emoji-only on small screens, full label on md+ */}
      <span className="md:hidden">{theme === "wellness" ? "🏃" : "🌸"}</span>
      <span className="hidden md:inline">{theme === "wellness" ? "🏃 Sport Mode" : "🌸 Wellness Mode"}</span>
    </button>
  );
}
