import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Facebook,
  Linkedin,
  Loader2,
  Search,
  ShieldCheck,
  Twitter,
  Upload,
  Youtube,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

// Local types matching the backend contract
interface SentenceResult {
  text: string;
  aiScore: number;
}

interface AnalysisResult {
  overallScore: number;
  sentences: SentenceResult[];
  classification: string;
  explanation: string;
}

// Extended actor type to include analyzeText
interface ExtendedActor {
  analyzeText(text: string): Promise<AnalysisResult>;
}

// Semicircle Gauge
function SemicircleGauge({ score, color }: { score: number; color: string }) {
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorMap: Record<string, string> = {
    human: "#22c55e",
    mixed: "#f59e0b",
    ai: "#ef4444",
  };
  const strokeColor = colorMap[color] ?? colorMap.ai;

  return (
    <svg
      viewBox="0 0 200 110"
      className="w-full max-w-[220px]"
      role="img"
      aria-label={`AI score gauge: ${score}%`}
    >
      <title>AI score gauge: {score}%</title>
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        stroke={strokeColor}
        strokeWidth="16"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease-out" }}
      />
      <text
        x="100"
        y="92"
        textAnchor="middle"
        fontSize="28"
        fontWeight="700"
        fill="#0f172a"
      >
        {score}%
      </text>
      <text x="100" y="108" textAnchor="middle" fontSize="11" fill="#64748b">
        AI Probability Score
      </text>
    </svg>
  );
}

function getScoreCategory(score: number) {
  if (score < 33)
    return {
      label: "Likely Human",
      color: "human",
      badge: "bg-green-100 text-green-800",
    };
  if (score < 67)
    return {
      label: "Mixed",
      color: "mixed",
      badge: "bg-amber-100 text-amber-800",
    };
  return {
    label: "Likely AI",
    color: "ai",
    badge: "bg-red-100 text-red-800",
  };
}

function getSentenceStyle(aiScore: number): string {
  if (aiScore < 0.33) return "bg-green-100 text-green-900";
  if (aiScore < 0.67) return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-900";
}

function getSentenceDot(aiScore: number): string {
  if (aiScore < 0.33) return "bg-green-500";
  if (aiScore < 0.67) return "bg-amber-500";
  return "bg-red-500";
}

const SAMPLE_TEXT =
  "Artificial intelligence has transformed numerous industries over the past decade. Machine learning algorithms enable computers to learn from data without explicit programming. These systems can identify patterns and make decisions with minimal human intervention. The technology continues to evolve at a remarkable pace, creating new opportunities and challenges.";

function DetectorSection() {
  const [inputText, setInputText] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { actor, isFetching: actorLoading } = useActor();

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery<AnalysisResult>({
    queryKey: ["analyzeText", submitted],
    queryFn: async () => {
      if (!actor || !submitted) throw new Error("No actor or text");
      return (actor as unknown as ExtendedActor).analyzeText(submitted);
    },
    enabled: !!actor && !actorLoading && submitted.length > 0,
  });

  const scorePercent =
    result !== undefined ? Math.round(result.overallScore * 100) : null;
  const category =
    scorePercent !== null ? getScoreCategory(scorePercent) : null;
  const hasResult = result !== undefined && scorePercent !== null;

  function handleAnalyze() {
    const text = inputText.trim();
    if (!text) return;
    setSubmitted(text);
    if (text === submitted) {
      refetch();
    }
  }

  function handleUseSample() {
    setInputText(SAMPLE_TEXT);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Card */}
      <div className="bg-card rounded-xl shadow-card border border-border p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-lg">
            Paste Your Text
          </h3>
          <button
            onClick={handleUseSample}
            className="text-xs text-primary hover:underline"
            type="button"
          >
            Use sample text
          </button>
        </div>
        <Textarea
          data-ocid="detector.input"
          className="min-h-[240px] resize-none text-sm leading-relaxed"
          placeholder="Paste any text here to analyze whether it was written by AI or a human..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <div className="flex gap-3">
          <Button
            data-ocid="detector.primary_button"
            className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
            onClick={handleAnalyze}
            disabled={!inputText.trim() || isFetching}
          >
            {isFetching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" /> Analyze Text
              </>
            )}
          </Button>
          <Button
            data-ocid="detector.secondary_button"
            variant="outline"
            className="gap-2"
            disabled
          >
            <Upload className="h-4 w-4" /> Upload File
          </Button>
        </div>
        {isFetching && (
          <div
            data-ocid="detector.loading_state"
            className="text-xs text-muted-foreground text-center"
          >
            Analyzing with AI heuristics...
          </div>
        )}
      </div>

      {/* Result Card */}
      <div className="bg-card rounded-xl shadow-card border border-border p-6 flex flex-col gap-4 overflow-y-auto max-h-[640px]">
        <h3 className="font-semibold text-foreground text-lg">
          Analysis Result
        </h3>
        <AnimatePresence mode="wait">
          {!hasResult ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center min-h-[280px] gap-4 text-muted-foreground"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <BarChart3 className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-sm text-center max-w-[240px]">
                Paste text and click &quot;Analyze Text&quot; to see the AI
                detection score.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-5"
            >
              {/* Badge + Gauge */}
              <div className="flex items-center gap-2">
                <Badge
                  className={`${category!.badge} border-0 font-semibold text-sm px-3 py-1`}
                >
                  {category!.label}
                </Badge>
              </div>

              <div className="flex justify-center">
                <SemicircleGauge
                  score={scorePercent!}
                  color={category!.color}
                />
              </div>

              {/* Explanation */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground">
                {result.explanation}
              </div>

              {/* Sentence Analysis */}
              {result.sentences && result.sentences.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Sentence Analysis
                  </p>
                  <div className="text-sm leading-relaxed flex flex-wrap gap-1">
                    {result.sentences.map((s, i) => (
                      <span
                        // biome-ignore lint/suspicious/noArrayIndexKey: sentence order is stable
                        key={i}
                        className={`inline rounded px-1.5 py-0.5 cursor-default ${getSentenceStyle(s.aiScore)}`}
                        title={`AI likelihood: ${Math.round(s.aiScore * 100)}%`}
                      >
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${getSentenceDot(s.aiScore)}`}
                        />
                        {s.text}
                      </span>
                    ))}
                  </div>
                  {/* Legend */}
                  <div className="flex gap-4 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{" "}
                      Likely Human
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />{" "}
                      Mixed
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{" "}
                      Likely AI
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  const currentYear = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-header border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2"
            data-ocid="header.link"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Search className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">DetectIQ</span>
          </a>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="nav.link"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="nav.link"
            >
              How It Works
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              data-ocid="header.secondary_button"
            >
              Log In
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground"
              data-ocid="header.primary_button"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <ShieldCheck className="h-4 w-4" />
                AI Content Detection
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
                Instant AI Content
                <br />
                <span className="text-primary">Detection &amp; Analysis</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Paste any text and get an accurate AI probability score in
                seconds. Sentence-by-sentence highlighting shows exactly where
                AI patterns appear.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <DetectorSection />
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 bg-card border-y border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Why DetectIQ?
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Built on heuristic signals that accurately differentiate human
                from AI-generated writing.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <CheckCircle className="h-6 w-6 text-primary" />,
                  title: "High Accuracy",
                  desc: "Multi-signal heuristic engine analyzes sentence uniformity, vocabulary diversity, and repetition patterns.",
                },
                {
                  icon: <Zap className="h-6 w-6 text-primary" />,
                  title: "Instant Speed",
                  desc: "Get results in under a second. No waiting, no queue — analysis happens on-chain in real time.",
                },
                {
                  icon: <BarChart3 className="h-6 w-6 text-primary" />,
                  title: "Sentence Highlighting",
                  desc: "Beyond a single score — each sentence is color-coded to show exactly which parts read as human or AI.",
                },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col items-start gap-3"
                >
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">
                    {f.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-3">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Three simple steps to detect AI-generated content.
              </p>
            </motion.div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-center gap-4 md:gap-0 mb-16">
              {[
                {
                  step: "1",
                  title: "Paste Text",
                  desc: "Copy and paste any content you want to verify into the text area.",
                },
                {
                  step: "2",
                  title: "Analyze",
                  desc: "Our heuristic engine scans for AI writing patterns instantly.",
                },
                {
                  step: "3",
                  title: "Get Score",
                  desc: "Receive a clear 0–100% AI probability score with sentence-level highlights.",
                },
              ].map((s, i) => (
                <div
                  key={s.step}
                  className="flex flex-col md:flex-row items-center"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.12 }}
                    className="flex flex-col items-center text-center max-w-[200px] px-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mb-3">
                      {s.step}
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {s.desc}
                    </p>
                  </motion.div>
                  {i < 2 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground mx-2 hidden md:block shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <Search className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">DetectIQ</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI content detection for the modern web. Fast, accurate, and
                transparent.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">
                Product
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-foreground transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <span className="cursor-pointer hover:text-foreground transition-colors">
                    Pricing
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">
                Resources
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <span className="cursor-pointer hover:text-foreground transition-colors">
                    API Docs
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer hover:text-foreground transition-colors">
                    Blog
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer hover:text-foreground transition-colors">
                    About
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">
                Follow Us
              </h4>
              <div className="flex gap-3">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
            &copy; {currentYear}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`}
              className="hover:text-foreground transition-colors underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
