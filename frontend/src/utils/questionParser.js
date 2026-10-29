/**
 * Robust OCR Question and Option Extraction Engine
 * Supports:
 * - Single and multiline questions
 * - Standard MCQ formats: A), B), C), D) / (A), (B) / A., B. / 1., 2.
 * - Questions without explicit options (free-response, code snippets, definitions)
 * - Noise filtering from browser/window chrome
 */

export function parseQuestionAndOptions(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { question: '', options: [], isQuestion: false, qualityScore: 0 };
  }

  // Normalize lines and trim whitespace
  const rawLines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (rawLines.length === 0) {
    return { question: '', options: [], isQuestion: false, qualityScore: 0 };
  }

  // Regex patterns for options: A), (A), A., Option A:, 1., 1)
  const optionRegex = /^(\(?[A-Da-d]\)?[\.\:\)]|\b[A-Da-d][\.\)]|\(?[1-4]\)[\.\)]?|[1-4]\.)\s*(.*)$/;
  
  // Question start indicators: "Q1.", "1.", "Question 1:", etc.
  const questionPrefixRegex = /^(?:Q(?:uestion)?\s*\d*[\.\:\-\)]|\d{1,3}[\.\:\-\)])\s*(.*)$/i;

  const questionLines = [];
  const extractedOptions = [];
  let foundFirstOption = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Filter out common screen noise (e.g., URL bars, battery indicators, "Page 1 of 10")
    if (/^(https?:\/\/|www\.|chrome|tab\s*\d+|battery|\d{1,2}:\d{2}\s*(?:am|pm)?$)/i.test(line)) {
      continue;
    }

    const matchOpt = line.match(optionRegex);
    if (matchOpt) {
      foundFirstOption = true;
      extractedOptions.push(line);
    } else if (!foundFirstOption) {
      // Still in question body
      // If the line starts with "1. " or "Q1. ", strip prefix for question text but keep tracking
      const cleanLine = line.replace(questionPrefixRegex, '$1').trim();
      questionLines.push(cleanLine.length > 0 ? cleanLine : line);
    } else {
      // Append to the last option if it's a multiline option
      if (extractedOptions.length > 0) {
        extractedOptions[extractedOptions.length - 1] += ' ' + line;
      }
    }
  }

  let questionText = questionLines.join(' ').replace(/\s+/g, ' ').trim();

  // If no question text was collected prior to options, use the first line
  if (!questionText && extractedOptions.length > 0) {
    questionText = extractedOptions.shift().replace(optionRegex, '$2').trim();
  }

  // Calculate OCR quality heuristics
  const words = questionText.split(/\s+/).filter(Boolean);
  const hasQuestionMark = questionText.includes('?');
  const hasOptions = extractedOptions.length >= 2;
  const isQuestionLike = hasQuestionMark || 
    /^(which|what|where|when|who|why|how|identify|calculate|find|explain|define|evaluate|true\s+or\s+false)/i.test(questionText) ||
    hasOptions;

  let qualityScore = 0;
  if (words.length >= 3) qualityScore += 30;
  if (words.length >= 7) qualityScore += 20;
  if (hasQuestionMark) qualityScore += 25;
  if (hasOptions) qualityScore += 25;

  const isQuestion = (words.length >= 3 && isQuestionLike) || (words.length >= 5);

  return {
    question: questionText,
    options: extractedOptions,
    isQuestion,
    qualityScore: Math.min(100, qualityScore),
    wordCount: words.length
  };
}
