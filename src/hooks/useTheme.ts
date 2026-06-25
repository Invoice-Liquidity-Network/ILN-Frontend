"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";

export function useTheme() {
  const { theme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setMounted(true);
    return () => clearTimeout(transitionTimerRef.current);
  }, []);

  const activeTheme = mounted ? (resolvedTheme ?? theme ?? "light") : "light";

  const applyTransition = useCallback(() => {
    const el = document.documentElement;
    clearTimeout(transitionTimerRef.current);
    el.setAttribute("data-theme-transition", "");
    transitionTimerRef.current = setTimeout(
      () => el.removeAttribute("data-theme-transition"),
      300,
    );
  }, []);

  const toggleTheme = useCallback(() => {
    applyTransition();
    setNextTheme(activeTheme === "dark" ? "light" : "dark");
  }, [activeTheme, setNextTheme, applyTransition]);

  const setTheme = useCallback(
    (t: string) => {
      applyTransition();
      setNextTheme(t);
    },
    [setNextTheme, applyTransition],
  );

  return {
    theme: activeTheme,
    toggleTheme,
    setTheme,
    mounted,
  };
}
