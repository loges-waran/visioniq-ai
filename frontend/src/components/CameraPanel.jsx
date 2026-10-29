import React, { useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  Pause, 
  Play, 
  RotateCcw, 
  Sparkles, 
  AlertCircle, 
  UploadCloud,
  Layers
} from 'lucide-react';
import { AlignmentOverlay } from './AlignmentOverlay';
import { StatusBadge } from './StatusBadge';

export function CameraPanel({
  videoRef,
  isCameraActive,
  isInitializing,
  permissionState,
  cameraError,
  facingMode,
  detectorState,
  isScanningActive,
  ocrQuality,
  scanCount,
  scanInterval,
  onStartCamera,
  onStopCamera,
  onSwitchCamera,
  onPauseScanning,
  onResumeScanning,
  onSubmitImageDirectly,
  onTestSampleQuestion
}) {
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      // Draw to an offscreen video-like canvas or dispatch test
      if (videoRef.current) {
        // Can simulate or trigger direct vision submission
      }
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="bg-navy-850 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Panel Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-navy-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Camera className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Live Camera Feed</h2>
            <p className="text-xs text-slate-400">
              {isCameraActive 
                ? `${facingMode === 'environment' ? 'Rear' : 'Front'} Camera • ${scanInterval}ms scan` 
                : 'Camera is off'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <StatusBadge state={detectorState} ocrQuality={ocrQuality} />
      </div>

      {/* Video Viewport */}
      <div className="relative aspect-video sm:aspect-[4/3] md:aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Real HTML5 Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isCameraActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Overlay guides when active */}
        {isCameraActive && (
          <AlignmentOverlay isScanning={isScanningActive} />
        )}

        {/* Camera Inactive State */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-navy-950/90 backdrop-blur-sm">
            {cameraError ? (
              <div className="max-w-xs flex flex-col items-center text-rose-300">
                <AlertCircle className="w-10 h-10 text-rose-400 mb-2" />
                <p className="text-sm font-medium mb-1">Camera Access Issue</p>
                <p className="text-xs text-slate-400 mb-4">{cameraError}</p>
                <button
                  onClick={onStartCamera}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/30"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
                  <Camera className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">Camera is Stopped</h3>
                <p className="text-xs text-slate-400 max-w-xs mb-5">
                  Point your smartphone camera at any laptop screen, monitor, or test paper to automatically scan questions.
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={onStartCamera}
                    disabled={isInitializing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-medium rounded-xl transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    {isInitializing ? 'Connecting Camera...' : 'Start Camera'}
                  </button>

                  {/* Sample Question Button for desktop quick-testing */}
                  <button
                    onClick={onTestSampleQuestion}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
                    title="Load sample question to test answering pipeline immediately"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Load Sample Question
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera Controls Bar */}
      <div className="p-4 bg-navy-900 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isCameraActive ? (
            <button
              onClick={onStopCamera}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium rounded-lg transition"
            >
              <CameraOff className="w-3.5 h-3.5" />
              Stop Camera
            </button>
          ) : (
            <button
              onClick={onStartCamera}
              disabled={isInitializing}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition shadow-md shadow-indigo-600/20"
            >
              <Camera className="w-3.5 h-3.5" />
              Start
            </button>
          )}

          {isCameraActive && (
            <button
              onClick={isScanningActive ? onPauseScanning : onResumeScanning}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition ${
                isScanningActive
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {isScanningActive ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause Scan
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Resume Scan
                </>
              )}
            </button>
          )}

          {isCameraActive && (
            <button
              onClick={onSwitchCamera}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium rounded-lg transition"
              title="Switch front / rear camera"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Flip
            </button>
          )}
        </div>

        {/* Secondary actions: Vision AI instant solve */}
        <div className="flex items-center gap-2">
          {isCameraActive && (
            <button
              onClick={onSubmitImageDirectly}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-medium rounded-lg transition shadow-md shadow-violet-600/20"
              title="Snapshot frame and send directly to Vision AI model"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Vision AI Solve
            </button>
          )}

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Scans: {scanCount}
          </span>
        </div>
      </div>
    </div>
  );
}
