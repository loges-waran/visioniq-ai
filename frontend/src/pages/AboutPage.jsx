import React from 'react';
import { ShieldCheck, Eye, Cpu, Zap, Lock, BookOpen } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Hero section */}
      <div className="text-center space-y-3 max-w-2xl mx-auto pt-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 p-0.5 shadow-xl shadow-indigo-600/20 mx-auto flex items-center justify-center">
          <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
            <Eye className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          VisionIQ <span className="text-indigo-400">AI</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300">
          "See the Question. Understand the Answer."
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          VisionIQ AI is an intelligent real-time camera-based question detection and AI tutoring platform designed for interactive study, exam revision, accessibility, and autonomous tutoring.
        </p>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-navy-850 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white">Edge Preprocessing & OCR</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Video frames are preprocessed in your browser via HTML5 Canvas (contrast-stretching and ROI cropping), then recognized locally via Tesseract.js Web Workers before any network calls.
          </p>
        </div>

        <div className="bg-navy-850 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white">Multimodal AI Solver</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The FastAPI backend integrates with OpenAI's latest models (`gpt-4o`) using strict JSON schemas to provide step-by-step reasoning, MCQ option selection, and structured explanations.
          </p>
        </div>

        <div className="bg-navy-850 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white">Quality & Verification</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Deterministic arithmetic checks, choice existence validation, and ambiguity heuristics tag answers with clear quality indicators rather than deceptive probability percentages.
          </p>
        </div>
      </div>

      {/* Privacy & Ethics Policy */}
      <div className="bg-navy-850 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 text-slate-200">
          <Lock className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold">Privacy-First Architecture & Ethical Use</h2>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            • <strong>No Hidden Streaming:</strong> Raw video frames are processed locally inside your device browser and are never uploaded to our servers by default.
          </p>
          <p>
            • <strong>Explicit Permissions:</strong> The camera stream is activated exclusively when you tap "Start Camera" and terminates immediately when stopped or when navigating away.
          </p>
          <p>
            • <strong>Secure Backend API Keys:</strong> AI API credentials reside strictly in backend environment variables and are never exposed to browser clients or frontend code.
          </p>
          <p>
            • <strong>Authorized Use Only:</strong> VisionIQ AI is intended for revision, academic study, accessibility, and authorized practice. It strictly does not support stealth capture or academic dishonesty.
          </p>
        </div>
      </div>
    </div>
  );
}
