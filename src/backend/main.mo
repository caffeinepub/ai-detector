import Text "mo:core/Text";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Array "mo:core/Array";
import Char "mo:core/Char";

persistent actor {
  public type SentenceResult = {
    text : Text;
    aiScore : Float;
  };

  public type AnalysisResult = {
    overallScore : Float;
    sentences : [SentenceResult];
    classification : Text;
    explanation : Text;
  };

  // AI-associated phrases commonly found in LLM output
  transient let AI_PHRASES : [Text] = [
    "furthermore",
    "moreover",
    "additionally",
    "it is worth noting",
    "it is important to",
    "notably",
    "consequently",
    "in conclusion",
    "to summarize",
    "in summary",
    "as a result",
    "this highlights",
    "this demonstrates",
    "this underscores",
    "this suggests",
    "delve",
    "in the realm",
    "it is essential",
    "it should be noted",
    "plays a crucial role",
    "multifaceted",
    "nuanced",
    "shed light",
    "tapestry",
    "plethora",
    "myriad",
    "robust",
    "leverage",
    "utilize",
    "paradigm",
    "cutting-edge",
    "state-of-the-art",
    "it goes without saying",
    "last but not least",
    "it is clear that",
    "it becomes evident",
    "game-changer",
    "groundbreaking",
    "seamlessly",
    "holistic",
    "transformative",
    "landscape",
  ];

  func charToLower(c : Char) : Char {
    if (c >= 'A' and c <= 'Z') {
      Char.fromNat32(c.toNat32() + 32)
    } else { c }
  };

  func toLower(t : Text) : Text {
    t.map(charToLower)
  };

  func containsPhrase(haystack : Text, needle : Text) : Bool {
    let h = toLower(haystack);
    let n = toLower(needle);
    let parts = h.split(#text n);
    parts.size() > 1
  };

  func phrasesInText(text : Text) : Int {
    var count = 0;
    for (phrase in AI_PHRASES.vals()) {
      if (containsPhrase(text, phrase)) { count += 1 };
    };
    count
  };

  func wordCount(text : Text) : Int {
    var count = 0;
    for (w in text.split(#char ' ')) {
      if (w.size() > 0) { count += 1 };
    };
    count
  };

  func splitSentences(text : Text) : [Text] {
    let parts = text.split(#predicate(func(c : Char) : Bool {
      c == '.' or c == '!' or c == '?'
    }));
    parts.filter(func(s : Text) : Bool {
      s.trim(#char ' ').size() > 10
    }).toArray()
  };

  public shared func analyzeText(text : Text) : async AnalysisResult {
    if (text.size() == 0) {
      return {
        overallScore = 0.0;
        sentences = [];
        classification = "human";
        explanation = "No text provided.";
      };
    };

    let sentences = splitSentences(text);
    let n = sentences.size();

    if (n == 0) {
      return {
        overallScore = 0.0;
        sentences = [];
        classification = "human";
        explanation = "Text is too short or lacks clear sentences to analyze.";
      };
    };

    // Word counts per sentence
    let sentenceWCs : [Int] = sentences.map(func(s : Text) : Int { wordCount(s) });

    // Mean sentence length
    var totalWC : Int = 0;
    for (wc in sentenceWCs.vals()) { totalWC += wc };
    let meanLen : Float = totalWC.toFloat() / n.toFloat();

    // Sentence length variance
    var varianceSum : Float = 0.0;
    for (wc in sentenceWCs.vals()) {
      let diff = wc.toFloat() - meanLen;
      varianceSum += diff * diff;
    };
    let variance : Float = varianceSum / n.toFloat();

    // Score each sentence
    let sentenceResults : [SentenceResult] = sentences.map(
      func(s : Text) : SentenceResult {
        let pc = phrasesInText(s);
        let base : Float = if (pc >= 2) { 0.88 }
                           else if (pc == 1) { 0.72 }
                           else { 0.12 };
        let wc = wordCount(s).toFloat();
        let lenBonus : Float = if (wc >= 10.0 and wc <= 30.0) { 0.08 } else { 0.0 };
        let score : Float = if (base + lenBonus > 1.0) { 1.0 } else { base + lenBonus };
        { text = s.trim(#char ' '); aiScore = score }
      },
    );

    // Average sentence score
    var sentScoreSum : Float = 0.0;
    for (sr in sentenceResults.vals()) { sentScoreSum += sr.aiScore };
    let avgSentScore = sentScoreSum / n.toFloat();

    // Total phrase count in full text
    let totalPhrases = phrasesInText(text);

    // Phrase density = phrases per sentence
    let phraseDensity : Float = totalPhrases.toFloat() / n.toFloat();

    // Phrase signal (0-1)
    let phraseSignal : Float =
      if (phraseDensity >= 3.0) { 1.0 }
      else if (phraseDensity >= 2.0) { 0.85 }
      else if (phraseDensity >= 1.0) { 0.65 }
      else if (phraseDensity >= 0.5) { 0.40 }
      else { 0.08 };

    // Uniformity signal (low variance = AI-like)
    let uniformitySignal : Float =
      if (variance < 5.0) { 0.88 }
      else if (variance < 15.0) { 0.58 }
      else if (variance < 40.0) { 0.28 }
      else { 0.05 };

    // Weighted overall score
    let rawScore = phraseSignal * 0.45 + avgSentScore * 0.35 + uniformitySignal * 0.20;
    let overallScore : Float = if (rawScore > 1.0) { 1.0 } else if (rawScore < 0.0) { 0.0 } else { rawScore };

    let classification : Text =
      if (overallScore < 0.33) { "human" }
      else if (overallScore < 0.67) { "mixed" }
      else { "ai" };

    let explanation : Text =
      if (totalPhrases >= 4) {
        "High concentration of AI-associated vocabulary detected (e.g. \"moreover\", \"nuanced\", \"leverage\"). This pattern is strongly consistent with AI-generated text."
      } else if (totalPhrases >= 2) {
        "Several AI-style phrases found. The writing structure and vocabulary are consistent with LLM-generated content."
      } else if (variance < 8.0 and n >= 3) {
        "Sentence lengths are highly uniform — a strong structural indicator of AI generation. Human writing typically varies more in rhythm and pacing."
      } else if (overallScore >= 0.67) {
        "Multiple AI writing patterns detected. The text shows consistent structure and phrasing typical of language models."
      } else if (overallScore >= 0.33) {
        "Some AI-like patterns are present alongside more natural writing characteristics. The text may be partially AI-generated or lightly edited."
      } else {
        "Natural variation in sentence length, rhythm, and vocabulary suggests this text was written by a human."
      };

    {
      overallScore;
      sentences = sentenceResults;
      classification;
      explanation;
    }
  };

  // Backward-compatible wrapper
  public shared func getScore(text : Text) : async Float {
    let result = await analyzeText(text);
    result.overallScore
  };
};
