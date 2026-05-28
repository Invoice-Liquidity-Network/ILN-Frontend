import { useState, useEffect } from "react";

const SETTINGS_KEY = "iln-lp-settings";

interface LPSettings {
  minReputation: number;
}

const DEFAULT_SETTINGS: LPSettings = {
  minReputation: 0,
};

export function useLPSettings() {
  const [settings, setSettings] = useState<LPSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load LP settings", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateSettings = (newSettings: Partial<LPSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  };

  return { settings, updateSettings, isLoaded };
}
