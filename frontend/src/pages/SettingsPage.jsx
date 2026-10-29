import React, { useState } from 'react';
import { 
  Settings, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Globe, 
  Clock, 
  Database, 
  Sparkles, 
  Check, 
  RotateCcw,
  Camera,
  Server
} from 'lucide-react';
import { api } from '../services/api';

export function SettingsPage({
  settings,
  onUpdateSettings,
  onResetSettings,
  backendHealth
}) {
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await api.checkHealth();
      setConnectionResult({ success: true, message: `Connected! Version ${res.version}, AI: ${res.ai_configured ? 'OpenAI' : 'Mock Engine'}` });
    } catch (err) {
      setConnectionResult({ success: false, message: `Connection failed: ${err.message}` });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Application Settings
        </h1>
        <p className="text-xs text-slate-400">
          Configure scanning intervals, language preferences, audio feedback, and privacy options.
        </p>
      </div>

      <div className="space-y-4">
        {/* Scan Frequency */}
        <div className="bg-navy-850 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Scan Interval (ms)</h3>
                <p className="text-xs text-slate-400">
                  Delay between camera frame analyses (Lower is faster, higher saves CPU/battery)
                </p>
              </div>
            </div>
            <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              {settings.scanInterval} ms
            </span>
          </div>
          <input
            type="range"
            min="800"
            max="3000"
            step="100"
            value={settings.scanInterval}
            onChange={(e) => onUpdateSettings({ scanInterval: Number(e.target.value) })}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>800ms (Rapid)</span>
            <span>1200ms (Balanced default)</span>
            <span>3000ms (Power Saver)</span>
          </div>
        </div>

        {/* Explanation Language */}
        <div className="bg-navy-850 border border-slate-800 rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Explanation Language</h3>
              <p className="text-xs text-slate-400">
                Choose the primary language for AI explanations and reasoning steps
              </p>
            </div>
          </div>
          <select
            value={settings.language}
            onChange={(e) => onUpdateSettings({ language: e.target.value })}
            className="bg-navy-900 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="English">English</option>
            <option value="Tamil">Tamil (தமிழ்)</option>
          </select>
        </div>

        {/* Automatic Question Detection */}
        <div className="bg-navy-850 border border-slate-800 rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Automatic Question Detection</h3>
              <p className="text-xs text-slate-400">
                Automatically detect new questions and solve them without manual button taps
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoDetect}
              onChange={(e) => onUpdateSettings({ autoDetect: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Sound Notifications */}
        <div className="bg-navy-850 border border-slate-800 rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {settings.soundAlerts ? (
              <Volume2 className="w-5 h-5 text-indigo-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-500" />
            )}
            <div>
              <h3 className="text-sm font-semibold text-white">Audio Chimes</h3>
              <p className="text-xs text-slate-400">
                Play subtle synthesizer tones when a new question is detected and answered
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.soundAlerts}
              onChange={(e) => onUpdateSettings({ soundAlerts: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Question History Storage */}
        <div className="bg-navy-850 border border-slate-800 rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Save Question History</h3>
              <p className="text-xs text-slate-400">
                Store detected questions and answers in backend SQLite database for later review
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableHistory}
              onChange={(e) => onUpdateSettings({ enableHistory: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Backend Connection Diagnostic */}
        <div className="bg-navy-850 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Backend Connection Diagnostic</h3>
                <p className="text-xs text-slate-400">
                  Verify API reachability and active AI engine status
                </p>
              </div>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition"
            >
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {connectionResult && (
            <div className={`p-3 rounded-xl text-xs ${
              connectionResult.success 
                ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300' 
                : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
            }`}>
              {connectionResult.message}
            </div>
          )}
        </div>
      </div>

      {/* Reset Settings */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={onResetSettings}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
