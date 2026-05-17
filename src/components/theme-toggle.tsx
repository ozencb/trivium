"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className={compact ? "w-8 h-8" : "h-5"} />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={
        compact
          ? "p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          : "flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      }
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun size={compact ? 16 : 14} strokeWidth={1.5} />
      ) : (
        <Moon size={compact ? 16 : 14} strokeWidth={1.5} />
      )}
      {!compact && (theme === "dark" ? "Light mode" : "Dark mode")}
    </button>
  );
}
