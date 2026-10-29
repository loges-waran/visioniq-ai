import { describe, it, expect } from 'vitest';
import { calculateDiceSimilarity, isDuplicateQuestion } from '../src/utils/textSimilarity';

describe('Similarity and Duplicate Prevention Engine', () => {
  it('identifies identical text with 1.0 similarity', () => {
    const q = 'Which data structure follows the LIFO principle?';
    expect(calculateDiceSimilarity(q, q)).toBe(1.0);
    expect(isDuplicateQuestion(q, q)).toBe(true);
  });

  it('detects minor OCR noise differences as the same duplicate question', () => {
    const q1 = 'Which data structure follows the LIFO principle?';
    const q2 = 'Which data structure follows the LIFO principle ? ';
    expect(isDuplicateQuestion(q1, q2)).toBe(true);
  });

  it('identifies distinct questions correctly as NOT duplicate', () => {
    const q1 = 'Which data structure follows the LIFO principle?';
    const q2 = 'What is the time complexity of searching in a balanced BST?';
    expect(isDuplicateQuestion(q1, q2)).toBe(false);
    expect(calculateDiceSimilarity(q1, q2)).toBeLessThan(0.35);
  });

  it('handles empty or null gracefully', () => {
    expect(isDuplicateQuestion('', 'something')).toBe(false);
    expect(isDuplicateQuestion(null, undefined)).toBe(false);
  });
});
