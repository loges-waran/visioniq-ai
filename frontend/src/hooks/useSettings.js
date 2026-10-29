import { useState, useEffect } from 'react';

const SETTINGS_KEY = 'visioniq_settings_v1';

const DEFAULT_SETTINGS = {
  scanInterval: 1200,          // ms between scans
  language: 'English',         // 'English' or 'Tamil'
  autoDetect: true,            // automatic question detection
  enableHistory: true,         // log questions to backend SQLite
  soundAlerts: true,           // audio feedback on detection/answer
  explanationLength: 'normal', // 'concise', 'normal', 'detailed'
  cameraFacing: 'environment', // rear camera preferred for screens
  theme: 'dark',
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }, [settings]);

  const updateSettings = (partial) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    resetSettings
  };
}
