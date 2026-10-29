import { describe, it, expect } from 'vitest';
import { parseQuestionAndOptions } from '../src/utils/questionParser';

describe('Question and Option Parser Engine', () => {
  it('should parse a clear single-line question with standard A-D MCQ choices', () => {
    const rawOcr = `Which data structure follows the LIFO principle?
A) Queue
B) Stack
C) Binary Tree
D) Graph`;

    const parsed = parseQuestionAndOptions(rawOcr);
    expect(parsed.isQuestion).toBe(true);
    expect(parsed.question).toBe('Which data structure follows the LIFO principle?');
    expect(parsed.options.length).toBe(4);
    expect(parsed.options[0]).toContain('Queue');
    expect(parsed.options[1]).toContain('Stack');
    expect(parsed.qualityScore).toBeGreaterThanOrEqual(70);
  });

  it('should parse a multiline question with numbered question prefix', () => {
    const rawOcr = `14. A client sends a request with an authorization token.
The server verifies the cryptographic signature before returning sensitive data.
What authentication mechanism is this?
A. Basic Auth
B. OAuth 2.0 / JWT
C. Session Cookies
D. IP Whitelisting`;

    const parsed = parseQuestionAndOptions(rawOcr);
    expect(parsed.isQuestion).toBe(true);
    expect(parsed.question).toContain('A client sends a request');
    expect(parsed.question).toContain('What authentication mechanism is this?');
    expect(parsed.options.length).toBe(4);
  });

  it('should handle questions without options', () => {
    const rawOcr = `Explain the primary difference between synchronous and asynchronous execution in JavaScript.`;
    const parsed = parseQuestionAndOptions(rawOcr);
    expect(parsed.isQuestion).toBe(true);
    expect(parsed.question).toBe(rawOcr);
    expect(parsed.options.length).toBe(0);
  });

  it('should reject noisy / too-short OCR snippets', () => {
    const rawOcr = `Page 1 of 12`;
    const parsed = parseQuestionAndOptions(rawOcr);
    expect(parsed.isQuestion).toBe(false);
  });

  it('should filter out window chrome or battery percentages', () => {
    const rawOcr = `12:45 PM
https://example.com/exam
Which algorithm solves the shortest path in a weighted graph?
A) DFS
B) Dijkstra's Algorithm
C) Bubble Sort`;

    const parsed = parseQuestionAndOptions(rawOcr);
    expect(parsed.isQuestion).toBe(true);
    expect(parsed.question).not.toContain('12:45 PM');
    expect(parsed.question).not.toContain('https://example.com');
    expect(parsed.options[1]).toContain("Dijkstra's Algorithm");
  });
});
