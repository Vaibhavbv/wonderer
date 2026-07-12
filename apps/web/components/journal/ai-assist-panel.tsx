"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import {
  generateStory,
  generateTitle,
  pollAiJob,
  type StoryLength,
  type StoryResult,
  type StoryTone,
  type TitleResult,
} from "@/lib/ai-api";
import type { TripRecord } from "@/lib/trip-api";

const TONES: { value: StoryTone; label: string }[] = [
  { value: "poetic", label: "Poetic" },
  { value: "humorous", label: "Humorous" },
  { value: "descriptive", label: "Descriptive" },
  { value: "journalistic", label: "Journalistic" },
  { value: "minimal", label: "Minimal" },
];

const LENGTHS: { value: StoryLength; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

interface AiAssistPanelProps {
  trip: TripRecord;
  open: boolean;
  onClose: () => void;
  /** Insert a generated draft: a title plus story paragraphs. */
  onInsertStory: (result: StoryResult) => void;
  /** Apply a suggested title to the hero block. */
  onApplyTitle: (title: string) => void;
}

function friendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return "You're out of AI credits for now.";
    if (err.status === 408) return "That took too long — try again.";
    return err.message;
  }
  return "AI generation failed — try again.";
}

export function AiAssistPanel({ trip, open, onClose, onInsertStory, onApplyTitle }: AiAssistPanelProps) {
  const { getToken } = useAuth();
  const prefersReduced = useReducedMotion();

  const [tone, setTone] = useState<StoryTone>("descriptive");
  const [length, setLength] = useState<StoryLength>("medium");
  const [guidance, setGuidance] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<StoryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [titleBusy, setTitleBusy] = useState(false);
  const [titles, setTitles] = useState<string[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      const job = await generateStory(token, {
        tripId: trip.id,
        tone,
        length,
        ...(guidance.trim() && { userPrompt: guidance.trim() }),
      });
      const story = await pollAiJob<StoryResult>(token, job.jobId);
      setResult(story);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSuggestTitles() {
    setTitleBusy(true);
    setTitleError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      const job = await generateTitle(token, {
        destinations: trip.locations.map((l) => l.name),
        ...(trip.startDate && {
          dates: `${trip.startDate.slice(0, 10)}${trip.endDate ? ` to ${trip.endDate.slice(0, 10)}` : ""}`,
        }),
      });
      const res = await pollAiJob<TitleResult>(token, job.jobId);
      setTitles(res.titles ?? []);
    } catch (err) {
      setTitleError(friendlyError(err));
    } finally {
      setTitleBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          />
          <motion.aside
            initial={prefersReduced ? { opacity: 0 } : { x: "100%" }}
            animate={prefersReduced ? { opacity: 1 } : { x: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-xl"
            role="dialog"
            aria-label="AI writing assistant"
          >
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="flex items-center gap-2 font-heading text-xl text-text-primary">
                <Sparkles className="h-5 w-5 text-primary-500" />
                Writing assistant
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-text-tertiary hover:text-text-primary"
                aria-label="Close assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
              {/* Story draft */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">
                  Draft the story
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Writes a first draft from your stops, notes and dates. You edit from there.
                </p>

                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-medium text-text-primary">Tone</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TONES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTone(t.value)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          tone === t.value
                            ? "bg-primary-500 text-white"
                            : "bg-surface-pressed text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-medium text-text-primary">Length</p>
                  <div className="flex gap-1.5">
                    {LENGTHS.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLength(l.value)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          length === l.value
                            ? "bg-primary-500 text-white"
                            : "bg-surface-pressed text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={guidance}
                  onChange={(e) => setGuidance(e.target.value)}
                  placeholder="Anything the story should focus on? (optional)"
                  rows={2}
                  className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />

                <Button className="mt-3" fullWidth onClick={handleGenerate} isLoading={generating}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {generating ? "Writing…" : "Generate draft"}
                </Button>

                {error && <p className="mt-2 text-sm text-error">{error}</p>}

                {result && (
                  <div className="mt-4 rounded-xl border border-border bg-background p-4">
                    <p className="font-heading text-lg text-text-primary">{result.title}</p>
                    <div className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm leading-relaxed text-text-secondary">
                      {result.content.split(/\n\n+/).map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-text-tertiary">{result.wordCount} words</p>
                    <Button
                      className="mt-3"
                      fullWidth
                      onClick={() => {
                        onInsertStory(result);
                        onClose();
                      }}
                    >
                      Insert into journal
                    </Button>
                  </div>
                )}
              </section>

              {/* Title suggestions */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">
                  Title ideas
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Five names for this journey, from your destinations.
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  fullWidth
                  onClick={handleSuggestTitles}
                  isLoading={titleBusy}
                >
                  Suggest titles
                </Button>
                {titleError && <p className="mt-2 text-sm text-error">{titleError}</p>}
                {titles.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {titles.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onApplyTitle(t)}
                        className="rounded-lg border border-border px-3 py-2 text-left text-sm text-text-primary transition-colors hover:border-primary-500/50 hover:bg-primary-500/10"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
