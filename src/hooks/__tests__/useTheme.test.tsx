import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeProvider from "@/components/ThemeProvider";
import { useTheme } from "@/hooks/useTheme";

function ThemeProbe() {
  const { theme, toggleTheme, setTheme, mounted } = useTheme();
  return (
    <div>
      <span data-testid="theme">{mounted ? theme : "loading"}</span>
      <button type="button" onClick={toggleTheme}>
        Toggle theme
      </button>
      <button type="button" onClick={() => setTheme("dark")}>
        Force dark
      </button>
      <button type="button" onClick={() => setTheme("light")}>
        Force light
      </button>
      <button type="button" onClick={() => setTheme("system")}>
        Use system
      </button>
    </div>
  );
}

function renderWithThemeProvider() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
}

describe("useTheme / next-themes integration", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to system preference when no stored override", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    renderWithThemeProvider();

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles between light and dark modes", async () => {
    const user = userEvent.setup();
    renderWithThemeProvider();

    await waitFor(() => {
      expect(screen.getByTestId("theme")).not.toHaveTextContent("loading");
    });

    await user.click(screen.getByRole("button", { name: "Force dark" }));
    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await user.click(screen.getByRole("button", { name: "Toggle theme" }));
    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("light");
    });
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("persists manual override in localStorage", async () => {
    const user = userEvent.setup();
    renderWithThemeProvider();

    await waitFor(() => {
      expect(screen.getByTestId("theme")).not.toHaveTextContent("loading");
    });

    await user.click(screen.getByRole("button", { name: "Force dark" }));

    await waitFor(() => {
      expect(localStorage.getItem("theme")).toBe("dark");
    });
  });

  it("restores stored theme on remount", async () => {
    localStorage.setItem("theme", "dark");

    renderWithThemeProvider();

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("returns to system preference when system mode is selected", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const user = userEvent.setup();
    renderWithThemeProvider();

    await waitFor(() => {
      expect(screen.getByTestId("theme")).not.toHaveTextContent("loading");
    });

    await user.click(screen.getByRole("button", { name: "Force light" }));
    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("light");
    });

    await user.click(screen.getByRole("button", { name: "Use system" }));

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(localStorage.getItem("theme")).toBe("system");
    });
  });
});
