import React, { useState } from 'react';
import { CameraPanel } from '../components/CameraPanel';
import { QuestionPanel } from '../components/QuestionPanel';
import { AnswerPanel } from '../components/AnswerPanel';
import { ManualCorrectionModal } from '../components/ManualCorrectionModal';
import { DETECTOR_STATES } from '../hooks/useQuestionDetector';

const SAMPLE_QUESTIONS = [
  {
    question: "Which data structure follows the LIFO principle?",
    options: ["A) Queue", "B) Stack", "C) Binary Tree", "D) Directed Graph"]
  },
  {
    question: "What is the time complexity of searching an element in a balanced binary search tree?",
    options: ["A) O(1)", "B) O(n)", "C) O(log n)", "D) O(n log n)"]
  },
  {
    question: "Evaluate the mathematical expression: 15 * 4",
    options: ["A) 45", "B) 60", "C) 75", "D) 90"]
  },
  {
    question: "Which protocol operates on default port 443?",
    options: ["A) HTTP", "B) FTP", "C) SSH", "D) HTTPS"]
  }
];

export function Dashboard({
  camera,
  detector,
  settings
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [sampleIdx, setSampleIdx] = useState(0);

  const handleOpenCorrection = (q) => {
    setEditingQuestion(q);
    setIsModalOpen(true);
  };

  const handleSaveCorrection = (correctedText, correctedOptions) => {
    detector.manualCorrectQuestion(correctedText, correctedOptions);
  };

  const handleLoadSample = () => {
    const sample = SAMPLE_QUESTIONS[sampleIdx % SAMPLE_QUESTIONS.length];
    setSampleIdx(i => i + 1);
    detector.manualCorrectQuestion(sample.question, sample.options);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Responsive Grid: Left (Camera), Right (Q & A) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Feed */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-4">
          <CameraPanel
            videoRef={camera.videoRef}
            isCameraActive={camera.isActive}
            isInitializing={camera.isInitializing}
            permissionState={camera.permissionState}
            cameraError={camera.error}
            facingMode={camera.facingMode}
            detectorState={detector.state}
            isScanningActive={detector.isScanningActive}
            ocrQuality={detector.ocrQuality}
            scanCount={detector.scanCount}
            scanInterval={settings.scanInterval}
            onStartCamera={camera.startCamera}
            onStopCamera={camera.stopCamera}
            onSwitchCamera={camera.switchCamera}
            onPauseScanning={detector.pauseScanning}
            onResumeScanning={detector.resumeScanning}
            onSubmitImageDirectly={detector.submitImageDirectly}
            onTestSampleQuestion={handleLoadSample}
          />

          {/* Quick tips card */}
          <div className="bg-navy-850/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-1.5 hidden lg:block">
            <p className="font-semibold text-slate-300">Tips for Optical Recognition:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Align the laptop screen perpendicular to your smartphone lens.</li>
              <li>Position the question text inside the targeting frame.</li>
              <li>Wait 1-2 seconds for camera autofocus to stabilize the text.</li>
              <li>Questions change automatically when you navigate to the next slide.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Question Panel & Answer Panel */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-6">
          {/* Detected Question Section */}
          <QuestionPanel
            detectedQuestion={detector.detectedQuestion}
            onOpenManualCorrection={handleOpenCorrection}
            selectedOption={detector.answerData?.selected_option}
          />

          {/* Answer Section */}
          <AnswerPanel
            answerData={detector.answerData}
            detectorState={detector.state}
            errorMessage={detector.errorMessage}
            language={settings.language}
          />
        </div>
      </div>

      {/* Manual Correction Modal */}
      <ManualCorrectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialQuestion={editingQuestion}
        onSave={handleSaveCorrection}
      />
    </div>
  );
}
