"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const t = useTranslations("Common");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("gunerav_theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("gunerav_theme", nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  };

  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-full border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/80" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 text-neutral-700 dark:text-neutral-300 shadow-sm transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white active:scale-95"
      aria-label={theme === "dark" ? t("switchThemeToLight") : t("switchThemeToDark")}
      title={theme === "dark" ? t("lightTheme") : t("darkTheme")}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-[#d4af37] transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-indigo-600 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
