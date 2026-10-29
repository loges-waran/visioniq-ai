/**
 * Browser-side Image Preprocessing for Fast, Accurate OCR
 * - Region-of-Interest (ROI) cropping matching the alignment guide
 * - Resizing to optimal OCR resolution (width ~900-1100px)
 * - Grayscale & Contrast Stretches
 * - Fast local thresholding (Binarization)
 */

export function preprocessVideoFrame(videoElement, roiRect = null) {
  if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    return null;
  }

  const vw = videoElement.videoWidth;
  const vh = videoElement.videoHeight;

  // Determine ROI coordinates (default to centered 85% width, 65% height)
  let sx = 0;
  let sy = 0;
  let sWidth = vw;
  let sHeight = vh;

  if (roiRect) {
    sx = Math.max(0, Math.floor(roiRect.x * vw));
    sy = Math.max(0, Math.floor(roiRect.y * vh));
    sWidth = Math.min(vw - sx, Math.floor(roiRect.width * vw));
    sHeight = Math.min(vh - sy, Math.floor(roiRect.height * vh));
  } else {
    // Default ROI: center 80% width, 70% height
    sWidth = Math.floor(vw * 0.85);
    sHeight = Math.floor(vh * 0.70);
    sx = Math.floor((vw - sWidth) / 2);
    sy = Math.floor((vh - sHeight) / 2);
  }

  // Target canvas width around 900px for speed and accuracy
  const targetWidth = Math.min(sWidth, 900);
  const targetHeight = Math.floor((sHeight / sWidth) * targetWidth);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) return null;

  // Draw cropped frame
  ctx.drawImage(videoElement, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

  // Apply Grayscale and Contrast Enhancement
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;

  // First pass: Compute min/max brightness for contrast stretching
  let minBrightness = 255;
  let maxBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    // Luminance formula
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (gray < minBrightness) minBrightness = gray;
    if (gray > maxBrightness) maxBrightness = gray;
  }

  const range = maxBrightness - minBrightness || 1;

  // Second pass: stretch contrast and mild binarization threshold
  const midThreshold = 135;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // Contrast stretched value (0 - 255)
    const stretched = Math.min(255, Math.max(0, ((gray - minBrightness) / range) * 255));
    
    // Slight high-contrast enhancement for text
    const boosted = stretched > midThreshold 
      ? Math.min(255, stretched * 1.15) 
      : Math.max(0, stretched * 0.85);

    data[i] = boosted;
    data[i + 1] = boosted;
    data[i + 2] = boosted;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
