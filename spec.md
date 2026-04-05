# AI Detector

## Current State
The backend uses a simple heuristic based on sentence length, vocabulary diversity, and punctuation frequency. The formula compresses most scores into a narrow band (40–65%), making it hard to differentiate human vs AI text. The frontend shows a gauge, badge, and two static insight bullets. No sentence-level breakdown exists.

## Requested Changes (Diff)

### Add
- `analyzeText(text)` backend method returning structured result: overall score, per-sentence scores, classification string, and explanation text
- Per-sentence AI likelihood scores in the backend
- Sentence-by-sentence highlighting panel in the frontend (green = human-like, yellow = mixed, red = AI-like)
- Three classification labels: Likely Human / Mixed / Likely AI
- Explanation paragraph below the score explaining the dominant signal

### Modify
- Backend scoring algorithm: replace old formula with multi-signal heuristic (AI phrase density, sentence length variance, per-sentence phrase presence) that produces clearly differentiated scores
- Frontend result card: use new `analyzeText` API, show classification badge + explanation + sentence highlight view
- Score thresholds: 0–32% = Likely Human, 33–66% = Mixed, 67–100% = Likely AI

### Remove
- Derived metrics panel (perplexity, burstiness numbers were fake and misleading)
- Old two-bullet insight list (replaced by explanation paragraph)

## Implementation Plan
1. Rewrite `main.mo`: add `SentenceResult` and `AnalysisResult` types; implement `analyzeText` with phrase-density, uniformity, and per-sentence scoring; keep `getScore` as thin wrapper
2. Update `backend.d.ts` to expose `analyzeText` with proper TypeScript types
3. Update `App.tsx`: call `analyzeText`, render sentence highlighting panel, show classification + explanation, keep existing gauge and layout structure
