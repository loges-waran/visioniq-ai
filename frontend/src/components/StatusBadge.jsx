import React from 'react';
import { DETECTOR_STATES } from '../hooks/useQuestionDetector';
import { Activity, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

export function StatusBadge({ state, ocrQuality = 0 }) {
  switch (state) {
    case DETECTOR_STATES.IDLE:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-slate-500"></span>
          Idle
        </span>
      );

    case DETECTOR_STATES.SCANNING:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 animate-pulse">
          <Activity className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          Scanning for Questions...
        </span>
      );

    case DETECTOR_STATES.QUESTION_DETECTED:
    case DETECTOR_STATES.EXTRACTING_TEXT:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          Question Detected ({ocrQuality}% quality)
        </span>
      );

    case DETECTOR_STATES.PROCESSING_ANSWER:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-950/80 text-violet-300 border border-violet-700/50">
          <Activity className="w-3.5 h-3.5 text-violet-400 animate-spin" />
          Solving with AI...
        </span>
      );

    case DETECTOR_STATES.ANSWER_READY:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Answer Ready
        </span>
      );

    case DETECTOR_STATES.NEEDS_VERIFICATION:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-700/50">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Needs Verification
        </span>
      );

    case DETECTOR_STATES.ERROR:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-950/80 text-rose-300 border border-rose-700/50">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          Detection Error
        </span>
      );

    default:
      return null;
  }
}
