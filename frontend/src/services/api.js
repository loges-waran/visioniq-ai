/**
 * Dedicated API Client for VisionIQ AI
 * Includes AbortSignal support to discard stale requests when a new question arrives.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async checkHealth(signal = null) {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal
      });
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      throw new Error(`Health check failed: ${err.message}`);
    }
  }

  async answerQuestion(payload, signal = null) {
    try {
      const res = await fetch(`${this.baseUrl}/api/questions/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal
      });

      if (!res.ok) {
        let errDetail = `Server error (${res.status})`;
        try {
          const errData = await res.json();
          if (errData?.detail) errDetail = errData.detail;
        } catch {}
        throw new Error(errDetail);
      }

      return await res.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        const abortErr = new Error('Request was superseded by a newer question');
        abortErr.isStale = true;
        throw abortErr;
      }
      throw err;
    }
  }

  async answerQuestionFromImage(imageBlob, language = 'English', signal = null) {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'frame.jpg');
      formData.append('language', language);

      const res = await fetch(`${this.baseUrl}/api/questions/answer-image`, {
        method: 'POST',
        body: formData,
        signal
      });

      if (!res.ok) {
        let errDetail = `Server error (${res.status})`;
        try {
          const errData = await res.json();
          if (errData?.detail) errDetail = errData.detail;
        } catch {}
        throw new Error(errDetail);
      }

      return await res.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        const abortErr = new Error('Image request was superseded');
        abortErr.isStale = true;
        throw abortErr;
      }
      throw err;
    }
  }

  async verifyQuestion(payload, signal = null) {
    try {
      const res = await fetch(`${this.baseUrl}/api/questions/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal
      });
      if (!res.ok) throw new Error(`Verification HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      throw err;
    }
  }

  async getHistory(limit = 25, offset = 0) {
    try {
      const res = await fetch(`${this.baseUrl}/api/history?limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error(`History fetch failed: HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('History API unreachable:', err.message);
      return { items: [], total: 0 };
    }
  }

  async clearHistory() {
    const res = await fetch(`${this.baseUrl}/api/history`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to clear history');
    return await res.json();
  }
}

export const api = new ApiClient(API_BASE_URL);
