"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? (resolvedTheme ?? theme ?? "light") : "light";

  const toggleTheme = () => {
    setTheme(activeTheme === "dark" ? "light" : "dark");
  };

  return {
    theme: activeTheme,
    toggleTheme,
    setTheme,
    mounted,
  };
}
