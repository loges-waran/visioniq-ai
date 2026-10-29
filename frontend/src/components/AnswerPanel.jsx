import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  XCircle, 
  Clock, 
  Cpu, 
  Lightbulb, 
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { DETECTOR_STATES } from '../hooks/useQuestionDetector';

export function AnswerPanel({
  answerData,
  detectorState,
  errorMessage,
  language = 'English'
}) {
  // If actively processing
  if (detectorState === DETECTOR_STATES.PROCESSING_ANSWER) {
    return (
      <div className="bg-navy-850 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[220px] text-center">
        <div className="relative w-12 h-12 mb-3">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
          <div className="relative w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        </div>
        <h3 className="text-sm font-semibold text-slate-200 mb-1">Reasoning & Solving...</h3>
        <p className="text-xs text-slate-400 max-w-xs">
          Querying AI engine, considering options, and validating reasoning steps.
        </p>
      </div>
    );
  }

  // If error
  if (detectorState === DETECTOR_STATES.ERROR || errorMessage) {
    return (
      <div className="bg-navy-850 border border-rose-900/50 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[220px] text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3">
          <XCircle className="w-6 h-6 text-rose-400" />
        </div>
        <h3 className="text-sm font-semibold text-rose-300 mb-1">Could Not Generate Answer</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-3">
          {errorMessage || 'An error occurred during AI processing. Please verify network or API keys.'}
        </p>
      </div>
    );
  }

  // If no answer ready
  if (!answerData) {
    return (
      <div className="bg-navy-850 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[220px] text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-3 text-slate-500">
          <Lightbulb className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Answer Panel</h3>
        <p className="text-xs text-slate-400 max-w-xs">
          Once a question is locked in, the correct answer, option selection, and concise explanation will appear here automatically.
        </p>
      </div>
    );
  }

  const {
    answer,
    selected_option,
    explanation,
    confidence_label = 'High confidence',
    needs_verification,
    generation_time_ms,
    provider = 'openai'
  } = answerData;

  const isHighConfidence = confidence_label === 'High confidence' && !needs_verification;
  const isNeedsVerification = confidence_label === 'Needs verification' || needs_verification;
  const isQuestionUnclear = confidence_label === 'Question unclear';

  return (
    <div className="bg-navy-850 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Answer Header & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {isHighConfidence && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              High Confidence
            </span>
          )}
          {isNeedsVerification && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Needs Verification
            </span>
          )}
          {isQuestionUnclear && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30">
              <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
              Question Unclear
            </span>
          )}

          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {generation_time_ms ? `${generation_time_ms}ms` : '<1s'}
          </span>
        </div>

        {/* Engine provider badge */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Cpu className="w-3 h-3 text-indigo-400" />
          <span className="font-mono">{provider.includes('mock') ? 'Mock Engine' : 'OpenAI gpt-4o'}</span>
        </div>
      </div>

      {/* Answer Showcase */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-navy-900 to-slate-900 border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
        <div className="flex items-start gap-3">
          {selected_option && (
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/30">
              {selected_option}
            </div>
          )}
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-indigo-400">
              {selected_option ? `Option ${selected_option}` : 'Answer'}
            </p>
            <p className="text-base sm:text-lg font-bold text-white tracking-tight">
              {answer}
            </p>
          </div>
        </div>
      </div>

      {/* Explanation Section */}
      {explanation && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Explanation {language !== 'English' && `(${language})`}</span>
          </div>
          <div className="bg-navy-900/80 border border-slate-800/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {explanation}
          </div>
        </div>
      )}

      {/* Uncertainty Notice / Academic Reminder */}
      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
        <AlertTriangle className="w-3 h-3 text-slate-400 shrink-0" />
        <span>System quality indicator for practice and study. Always independently verify final answers.</span>
      </div>
    </div>
  );
}
