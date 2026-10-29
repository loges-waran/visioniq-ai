import React from 'react';
import { HelpCircle, Edit3, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

export function QuestionPanel({
  detectedQuestion,
  onOpenManualCorrection,
  selectedOption = null
}) {
  if (!detectedQuestion) {
    return (
      <div className="bg-navy-850 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center min-h-[220px]">
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-3 text-slate-500">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">No Question Detected Yet</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Point the camera at a multiple choice or open question. As soon as the text stabilizes, VisionIQ AI will extract and solve it automatically.
        </p>
      </div>
    );
  }

  const { id, question, options = [], timestamp, ocrQuality, isManual, fromVision } = detectedQuestion;
  const timeFormatted = timestamp ? new Date(timestamp).toLocaleTimeString() : 'Just now';

  return (
    <div className="bg-navy-850 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Question Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-medium">
            {id ? id.substring(0, 10) : 'Active'}
          </span>
          {isManual && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Edited
            </span>
          )}
          {fromVision && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Vision AI
            </span>
          )}
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {timeFormatted}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quality Indicator */}
          {ocrQuality !== undefined && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <span>OCR:</span>
              <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className={`h-full ${ocrQuality > 70 ? 'bg-emerald-400' : ocrQuality > 40 ? 'bg-amber-400' : 'bg-rose-400'}`}
                  style={{ width: `${ocrQuality}%` }}
                />
              </div>
              <span className="text-[11px] font-mono">{ocrQuality}%</span>
            </div>
          )}

          {/* Manual Correction Button */}
          <button
            onClick={() => onOpenManualCorrection(detectedQuestion)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
            title="Edit question or options manually if OCR was imperfect"
          >
            <Edit3 className="w-3 h-3 text-indigo-400" />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* Question Text Body */}
      <div>
        <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
          {question}
        </p>
      </div>

      {/* Options List */}
      {options && options.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Detected Options ({options.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {options.map((opt, index) => {
              const letter = chrOptionLetter(opt, index);
              const isSelected = selectedOption && selectedOption.toUpperCase() === letter;

              return (
                <div
                  key={index}
                  className={`p-2.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 transition-all ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                      : 'bg-navy-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                    isSelected 
                      ? 'bg-emerald-500 text-slate-950' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {letter}
                  </span>
                  <span className="flex-1 break-words leading-snug">
                    {cleanOptionText(opt)}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function chrOptionLetter(str, idx) {
  const match = str.match(/^([A-Da-d1-4])[\.\)\:\s]/);
  if (match) {
    const val = match[1].toUpperCase();
    if (['1', '2', '3', '4'].includes(val)) {
      return String.fromCharCode(64 + parseInt(val, 10));
    }
    return val;
  }
  return String.fromCharCode(65 + idx);
}

function cleanOptionText(str) {
  return str.replace(/^(\(?[A-Da-d1-4]\)?[\.\:\)]|\b[A-Da-d][\.\)]|[1-4]\.)\s*/, '').trim() || str;
}
