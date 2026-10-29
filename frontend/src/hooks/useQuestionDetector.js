import { useState, useRef, useEffect, useCallback } from 'react';
import { ocrService } from '../services/ocrService';
import { preprocessVideoFrame } from '../services/imagePreprocessing';
import { parseQuestionAndOptions } from '../utils/questionParser';
import { isDuplicateQuestion } from '../utils/textSimilarity';
import { api } from '../services/api';
import { playDetectionChime, playAnswerChime } from '../utils/sound';

export const DETECTOR_STATES = {
  IDLE: 'IDLE',
  SCANNING: 'SCANNING',
  QUESTION_DETECTED: 'QUESTION_DETECTED',
  EXTRACTING_TEXT: 'EXTRACTING_TEXT',
  PROCESSING_ANSWER: 'PROCESSING_ANSWER',
  ANSWER_READY: 'ANSWER_READY',
  NEEDS_VERIFICATION: 'NEEDS_VERIFICATION',
  ERROR: 'ERROR'
};

export function useQuestionDetector({
  videoRef,
  isCameraActive,
  settings,
  roiRect = null
}) {
  const [state, setState] = useState(DETECTOR_STATES.IDLE);
  const [isScanningActive, setIsScanningActive] = useState(true);
  
  // Current question data
  const [detectedQuestion, setDetectedQuestion] = useState(null);
  const [answerData, setAnswerData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [ocrQuality, setOcrQuality] = useState(0);
  const [scanCount, setScanCount] = useState(0);

  // Stability and duplicate tracking refs
  const lastCandidateRef = useRef(null);
  const stabilityCounterRef = useRef(0);
  const lastAnsweredQuestionRef = useRef(null);
  const activeQuestionIdRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isOcrBusyRef = useRef(false);
  const timerRef = useRef(null);

  const QUESTION_STABILITY_CHECKS = 2;
  const MIN_TEXT_LENGTH = 15;
  const DUPLICATE_SIMILARITY_THRESHOLD = 0.88;

  // Manual update / correction of question
  const manualCorrectQuestion = useCallback(async (correctedQuestion, correctedOptions) => {
    if (!correctedQuestion || correctedQuestion.trim().length < 3) return;

    // Cancel any current request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    const newQuestionId = `manual-${Date.now()}`;
    activeQuestionIdRef.current = newQuestionId;

    const updated = {
      id: newQuestionId,
      question: correctedQuestion.trim(),
      options: correctedOptions || [],
      timestamp: Date.now(),
      isManual: true
    };

    setDetectedQuestion(updated);
    setAnswerData(null);
    setState(DETECTOR_STATES.PROCESSING_ANSWER);

    try {
      const response = await api.answerQuestion({
        question: updated.question,
        options: updated.options,
        subject: 'General',
        language: settings.language || 'English',
        client_timestamp: Date.now()
      }, abortCtrl.signal);

      // Verify not superseded
      if (activeQuestionIdRef.current === newQuestionId) {
        setAnswerData(response);
        lastAnsweredQuestionRef.current = updated.question;
        setState(
          response.needs_verification 
            ? DETECTOR_STATES.NEEDS_VERIFICATION 
            : DETECTOR_STATES.ANSWER_READY
        );
        if (settings.soundAlerts) playAnswerChime();
      }
    } catch (err) {
      if (err.isStale || err.name === 'AbortError') return;
      if (activeQuestionIdRef.current === newQuestionId) {
        setErrorMessage(err.message || 'Error processing answer');
        setState(DETECTOR_STATES.ERROR);
      }
    }
  }, [settings.language, settings.soundAlerts]);

  // Submit frame via vision model directly
  const submitImageDirectly = useCallback(async () => {
    if (!videoRef.current || !isCameraActive) return;

    const canvas = preprocessVideoFrame(videoRef.current, roiRect);
    if (!canvas) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    const newQuestionId = `vision-${Date.now()}`;
    activeQuestionIdRef.current = newQuestionId;

    setState(DETECTOR_STATES.PROCESSING_ANSWER);
    setAnswerData(null);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const response = await api.answerQuestionFromImage(blob, settings.language || 'English', abortCtrl.signal);
        if (activeQuestionIdRef.current === newQuestionId) {
          setDetectedQuestion({
            id: newQuestionId,
            question: response.question,
            options: response.options || [],
            timestamp: Date.now(),
            fromVision: true
          });
          setAnswerData(response);
          lastAnsweredQuestionRef.current = response.question;
          setState(
            response.needs_verification
              ? DETECTOR_STATES.NEEDS_VERIFICATION
              : DETECTOR_STATES.ANSWER_READY
          );
          if (settings.soundAlerts) playAnswerChime();
        }
      } catch (err) {
        if (err.isStale || err.name === 'AbortError') return;
        if (activeQuestionIdRef.current === newQuestionId) {
          setErrorMessage(err.message || 'Vision API processing failed');
          setState(DETECTOR_STATES.ERROR);
        }
      }
    }, 'image/jpeg', 0.85);
  }, [videoRef, isCameraActive, roiRect, settings.language, settings.soundAlerts]);

  // Main scan step
  const executeScan = useCallback(async () => {
    if (!isCameraActive || !isScanningActive || isOcrBusyRef.current) {
      return;
    }

    const videoEl = videoRef.current;
    if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0) {
      return;
    }

    isOcrBusyRef.current = true;
    setScanCount(c => c + 1);

    try {
      // 1. Preprocess cropped ROI frame
      const canvas = preprocessVideoFrame(videoEl, roiRect);
      if (!canvas) {
        isOcrBusyRef.current = false;
        return;
      }

      // 2. Perform OCR recognition
      const ocrResult = await ocrService.recognizeCanvas(canvas);
      const rawText = ocrResult?.text || '';

      // 3. Parse question and options
      const parsed = parseQuestionAndOptions(rawText);
      setOcrQuality(parsed.qualityScore);

      // 4. Validate question criteria
      const cleanQuestion = parsed.question.trim();
      const isSufficientLength = cleanQuestion.length >= MIN_TEXT_LENGTH;

      if (!parsed.isQuestion || !isSufficientLength) {
        // No clear question in this frame; reset candidate tracking if unstable
        if (stabilityCounterRef.current > 0) {
          stabilityCounterRef.current = 0;
          lastCandidateRef.current = null;
        }
        isOcrBusyRef.current = false;
        return;
      }

      // 5. Compare with already answered question to avoid duplicate calls
      if (lastAnsweredQuestionRef.current) {
        const isDupe = isDuplicateQuestion(
          cleanQuestion,
          lastAnsweredQuestionRef.current,
          DUPLICATE_SIMILARITY_THRESHOLD
        );
        if (isDupe) {
          // Identical to what we already answered, do not fire duplicate AI call
          isOcrBusyRef.current = false;
          return;
        }
      }

      // 6. Stability checks: ensure question is seen across consecutive frames
      if (lastCandidateRef.current) {
        const candidateSim = isDuplicateQuestion(cleanQuestion, lastCandidateRef.current, 0.80);
        if (candidateSim) {
          stabilityCounterRef.current += 1;
        } else {
          lastCandidateRef.current = cleanQuestion;
          stabilityCounterRef.current = 1;
        }
      } else {
        lastCandidateRef.current = cleanQuestion;
        stabilityCounterRef.current = 1;
      }

      // If stability threshold reached, we have confirmed a new question!
      if (stabilityCounterRef.current >= QUESTION_STABILITY_CHECKS) {
        // Reset stability
        stabilityCounterRef.current = 0;
        lastCandidateRef.current = null;

        // Cancel previous pending API call if still running
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        const abortCtrl = new AbortController();
        abortControllerRef.current = abortCtrl;

        const newQuestionId = `q-${Date.now()}`;
        activeQuestionIdRef.current = newQuestionId;

        const questionPayload = {
          id: newQuestionId,
          question: cleanQuestion,
          options: parsed.options,
          timestamp: Date.now(),
          ocrQuality: parsed.qualityScore
        };

        // Update UI immediately with new question
        setDetectedQuestion(questionPayload);
        setAnswerData(null); // Clear previous answer
        setErrorMessage(null);
        setState(DETECTOR_STATES.QUESTION_DETECTED);

        if (settings.soundAlerts) {
          playDetectionChime();
        }

        // Proceed to AI answer request
        setState(DETECTOR_STATES.PROCESSING_ANSWER);

        try {
          const aiResponse = await api.answerQuestion({
            question: cleanQuestion,
            options: parsed.options,
            subject: 'General',
            language: settings.language || 'English',
            client_timestamp: Date.now(),
            raw_ocr_text: rawText
          }, abortCtrl.signal);

          // Verify race condition: only accept if activeQuestionId still matches!
          if (activeQuestionIdRef.current === newQuestionId) {
            setAnswerData(aiResponse);
            lastAnsweredQuestionRef.current = cleanQuestion;

            setState(
              aiResponse.needs_verification 
                ? DETECTOR_STATES.NEEDS_VERIFICATION 
                : DETECTOR_STATES.ANSWER_READY
            );

            if (settings.soundAlerts) {
              playAnswerChime();
            }
          }
        } catch (apiErr) {
          if (apiErr.isStale || apiErr.name === 'AbortError') {
            // Superseded by newer question, ignore silently
            return;
          }
          if (activeQuestionIdRef.current === newQuestionId) {
            setErrorMessage(apiErr.message || 'Error generating answer');
            setState(DETECTOR_STATES.ERROR);
          }
        }
      }
    } catch (scanErr) {
      console.warn('Scan iteration error:', scanErr);
    } finally {
      isOcrBusyRef.current = false;
    }
  }, [
    isCameraActive,
    isScanningActive,
    videoRef,
    roiRect,
    settings.language,
    settings.soundAlerts
  ]);

  // Scan loop timer
  useEffect(() => {
    if (!isCameraActive || !isScanningActive) {
      if (state !== DETECTOR_STATES.ANSWER_READY && state !== DETECTOR_STATES.NEEDS_VERIFICATION) {
        setState(DETECTOR_STATES.IDLE);
      }
      return;
    }

    if (state === DETECTOR_STATES.IDLE) {
      setState(DETECTOR_STATES.SCANNING);
    }

    const interval = Math.max(800, Number(settings.scanInterval) || 1200);
    timerRef.current = setInterval(executeScan, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCameraActive, isScanningActive, settings.scanInterval, executeScan, state]);

  const pauseScanning = () => setIsScanningActive(false);
  const resumeScanning = () => setIsScanningActive(true);

  return {
    state,
    isScanningActive,
    detectedQuestion,
    answerData,
    errorMessage,
    ocrQuality,
    scanCount,
    pauseScanning,
    resumeScanning,
    manualCorrectQuestion,
    submitImageDirectly
  };
}
