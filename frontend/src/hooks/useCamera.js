import { useState, useRef, useCallback, useEffect } from 'react';

export function useCamera(preferredFacing = 'environment') {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState(preferredFacing);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);

  // Check camera support & devices
  const checkDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      setError('MediaDevices API not supported in this browser environment.');
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
    } catch (e) {
      console.warn('Could not enumerate video devices:', e);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setIsInitializing(false);
  }, []);

  const startCamera = useCallback(async (facing = facingMode) => {
    setError(null);
    setIsInitializing(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera access is not supported by your browser.');
      setIsInitializing(false);
      return false;
    }

    // Stop any existing stream
    stopCamera();

    // Constraints with fallback
    const constraints = {
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 }
      },
      audio: false
    };

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Fallback to basic video constraint without facing mode
        console.warn('Initial facing mode camera constraint failed, retrying generic video...', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setPermissionState('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready and playing
        await new Promise((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(resolve).catch(resolve);
          };
        });
      }

      setIsActive(true);
      setIsInitializing(false);
      checkDevices();
      return true;
    } catch (err) {
      console.error('Camera activation error:', err);
      setIsInitializing(false);
      setIsActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera device was found on this system.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is currently in use by another application or blocked.');
      } else {
        setError(`Camera error: ${err.message || 'Unable to access video stream'}`);
      }
      return false;
    }
  }, [facingMode, stopCamera, checkDevices]);

  const switchCamera = useCallback(async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (isActive) {
      await startCamera(nextFacing);
    }
  }, [facingMode, isActive, startCamera]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isActive,
    isInitializing,
    facingMode,
    permissionState,
    error,
    availableDevices,
    startCamera,
    stopCamera,
    switchCamera
  };
}
