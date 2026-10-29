import { createWorker } from 'tesseract.js';

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitializing = false;
    this.initPromise = null;
  }

  async getWorker() {
    if (this.worker) return this.worker;

    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        const worker = await createWorker('eng');
        this.worker = worker;
        this.isInitializing = false;
        return worker;
      } catch (err) {
        this.isInitializing = false;
        this.initPromise = null;
        console.error('Failed to initialize Tesseract worker:', err);
        throw err;
      }
    })();

    return this.initPromise;
  }

  async recognizeCanvas(canvas) {
    if (!canvas) {
      return { text: '', confidence: 0 };
    }

    try {
      const worker = await this.getWorker();
      const result = await worker.recognize(canvas);
      return {
        text: result?.data?.text || '',
        confidence: result?.data?.confidence || 0,
        words: result?.data?.words || []
      };
    } catch (err) {
      console.warn('OCR recognition encountered an error:', err);
      return { text: '', confidence: 0, error: err.message };
    }
  }

  async terminate() {
    if (this.worker) {
      try {
        await this.worker.terminate();
      } catch (e) {
        console.warn('Error terminating OCR worker:', e);
      }
      this.worker = null;
    }
    this.isInitializing = false;
    this.initPromise = null;
  }
}

export const ocrService = new OCRService();
