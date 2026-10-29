import React from 'react';
import { Scan } from 'lucide-react';

export function AlignmentOverlay({ isScanning = true, onSelectSample = null }) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
      {/* Top instruction header */}
      <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/80 text-xs font-medium text-slate-300 flex items-center gap-2 shadow-lg">
        <Scan className="w-3.5 h-3.5 text-indigo-400" />
        <span>Align screen or question inside target frame</span>
      </div>

      {/* Target Reticle Box */}
      <div className="relative w-[90%] h-[72%] max-w-lg border border-indigo-500/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.12)]">
        {/* Animated laser scan line */}
        {isScanning && (
          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#38bdf8] animate-scan-line" />
        )}

        {/* Top-left corner */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-indigo-400 rounded-tl" />
        {/* Top-right corner */}
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-indigo-400 rounded-tr" />
        {/* Bottom-left corner */}
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-indigo-400 rounded-bl" />
        {/* Bottom-right corner */}
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-indigo-400 rounded-br" />

        {/* Subtle center crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200" />
        </div>
      </div>

      {/* Bottom alignment tips */}
      <div className="text-[11px] text-slate-400 bg-slate-900/70 px-3 py-1 rounded-md backdrop-blur-sm border border-slate-800">
        Keep device steady • Avoid glare & reflection
      </div>
    </div>
  );
}
