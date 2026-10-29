import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { useSettings } from './hooks/useSettings';
import { useCamera } from './hooks/useCamera';
import { useQuestionDetector } from './hooks/useQuestionDetector';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendHealth, setBackendHealth] = useState(null);

  // Settings
  const { settings, updateSettings, resetSettings } = useSettings();

  // Camera hook
  const camera = useCamera(settings.cameraFacing);

  // Question Detector engine
  const detector = useQuestionDetector({
    videoRef: camera.videoRef,
    isCameraActive: camera.isActive,
    settings
  });

  // Check backend health on mount & periodically
  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        const health = await api.checkHealth();
        if (isMounted) setBackendHealth(health);
      } catch (e) {
        if (isMounted) setBackendHealth({ status: 'unreachable', error: e.message });
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleToggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'dark bg-navy-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Global Navigation Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCameraActive={camera.isActive}
        backendHealth={backendHealth}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="pb-12">
        {activeTab === 'dashboard' && (
          <Dashboard
            camera={camera}
            detector={detector}
            settings={settings}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage enableHistory={settings.enableHistory} />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            settings={settings}
            onUpdateSettings={updateSettings}
            onResetSettings={resetSettings}
            backendHealth={backendHealth}
          />
        )}

        {activeTab === 'about' && (
          <AboutPage />
        )}
      </main>
    </div>
  );
}
