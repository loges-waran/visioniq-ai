import React from 'react';
import { 
  Eye, 
  Settings, 
  History, 
  Info, 
  Camera, 
  Radio, 
  Wifi, 
  WifiOff, 
  LayoutDashboard,
  Moon,
  Sun
} from 'lucide-react';

export function Header({
  activeTab,
  onTabChange,
  isCameraActive,
  backendHealth,
  theme = 'dark',
  onToggleTheme
}) {
  const isBackendHealthy = backendHealth?.status === 'healthy';
  const isAiConfigured = backendHealth?.ai_configured;

  return (
    <header className="sticky top-0 z-40 bg-navy-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onTabChange('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <Eye className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                VisionIQ <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 font-extrabold">AI</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hidden sm:inline">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              See the Question. Understand the Answer.
            </p>
          </div>
        </div>

        {/* Live System Status Indicators */}
        <div className="hidden md:flex items-center gap-3">
          {/* Camera Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-900 border border-slate-800 text-xs">
            <Radio className={`w-3.5 h-3.5 ${isCameraActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-slate-300 text-[11px]">
              {isCameraActive ? 'Camera Live' : 'Camera Off'}
            </span>
          </div>

          {/* Backend Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-900 border border-slate-800 text-xs">
            {isBackendHealthy ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300 text-[11px]">
                  {isAiConfigured ? 'AI Online' : 'Mock AI Mode'}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400 text-[11px]">Backend Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
              activeTab === 'history'
                ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
              activeTab === 'settings'
                ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            onClick={() => onTabChange('about')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
              activeTab === 'about'
                ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">About</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition ml-1"
            title="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
