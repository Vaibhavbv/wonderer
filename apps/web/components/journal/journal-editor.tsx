"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Eye, Heading2, ImagePlus, PenLine, Sparkles, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryBlockEditor } from "@/components/journal/story-block";
import { AiAssistPanel } from "@/components/journal/ai-assist-panel";
import { getStory, updateStory, type Story, type StoryBlock } from "@/lib/story-api";
import type { StoryResult } from "@/lib/ai-api";
import type { TripRecord } from "@/lib/trip-api";

function newBlock(type: StoryBlock["type"], content: Record<string, unknown> = {}): StoryBlock {
  return {
    id: `block_${Math.random().toString(36).slice(2, 10)}`,
    type,
    // y is rewritten to the block's index on save; the grid shape just keeps
    // us compatible with the backend's default hero block.
    position: { x: 0, y: 0, w: 12, h: 1 },
    content,
  };
}

export function JournalEditor({ trip, canEdit }: { trip: TripRecord; canEdit: boolean }) {
  const { getToken } = useAuth();
  const prefersReduced = useReducedMotion();

  const [story, setStory] = useState<Story | null>(null);
  const [blocks, setBlocks] = useState<StoryBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [preview, setPreview] = useState(!canEdit);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Not signed in");
        const s = await getStory(token, trip.id);
        if (active) {
          setStory(s);
          setBlocks(Array.isArray(s.blocks) ? s.blocks : []);
        }
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : "Couldn't load the journal");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [trip.id, getToken]);

  // Warn before leaving with unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const mutateBlocks = useCallback((fn: (prev: StoryBlock[]) => StoryBlock[]) => {
    setBlocks((prev) => fn(prev));
    setDirty(true);
  }, []);

  function changeBlock(id: string, patch: Partial<StoryBlock>) {
    mutateBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function moveBlock(id: string, dir: -1 | 1) {
    mutateBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      const target = idx + dir;
      // Keep the hero block pinned to the top.
      if (idx <= 0 || target <= 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function deleteBlock(id: string) {
    mutateBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function addBlock(type: StoryBlock["type"]) {
    const content =
      type === "photo" ? { mediaId: null, url: null, caption: "" } : { text: "" };
    mutateBlocks((prev) => [...prev, newBlock(type, content)]);
  }

  function insertStoryResult(result: StoryResult) {
    mutateBlocks((prev) => [
      ...prev,
      newBlock("heading", { text: result.title }),
      ...result.content
        .split(/\n\n+/)
        .filter(Boolean)
        .map((para) => newBlock("text", { text: para })),
    ]);
  }

  function applyTitle(title: string) {
    mutateBlocks((prev) => {
      const hero = prev.find((b) => b.type === "hero");
      if (!hero) return [newBlock("hero", { title, subtitle: "", overlayOpacity: 0.4 }), ...prev];
      return prev.map((b) => (b.id === hero.id ? { ...b, content: { ...b.content, title } } : b));
    });
  }

  async function save() {
    if (!story) return;
    setSaving(true);
    setSaveError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      const withPositions = blocks.map((b, i) => ({
        ...b,
        position: { ...(b.position ?? { x: 0, w: 12, h: 1 }), y: i },
      }));
      const updated = await updateStory(token, trip.id, {
        template: story.template,
        ...(story.theme && { theme: story.theme }),
        blocks: withPositions,
      });
      setStory(updated);
      setBlocks(Array.isArray(updated.blocks) ? updated.blocks : withPositions);
      setDirty(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-text-tertiary">
        Opening your journal…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h2 className="font-heading text-2xl text-text-primary">The journal wouldn&apos;t open</h2>
        <p className="mt-2 text-text-secondary">{loadError}</p>
        <Link href={`/trips/${trip.id}`} className="mt-4 inline-block">
          <Button variant="outline">Back to trip</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-6">
        <Link
          href={`/trips/${trip.id}`}
          className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {trip.title}
        </Link>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPreview((p) => !p)}>
              {preview ? <PenLine className="mr-1.5 h-4 w-4" /> : <Eye className="mr-1.5 h-4 w-4" />}
              {preview ? "Write" : "Preview"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAiOpen(true)}>
              <Sparkles className="mr-1.5 h-4 w-4 text-primary-500" />
              Assistant
            </Button>
          </div>
        )}
      </div>

      {/* Blocks */}
      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {blocks.map((block, index) => (
            <motion.div
              key={block.id}
              layout={!prefersReduced}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <StoryBlockEditor
                block={block}
                index={index}
                total={blocks.length}
                media={trip.media}
                preview={preview || !canEdit}
                onChange={(patch) => changeBlock(block.id, patch)}
                onMove={(dir) => moveBlock(block.id, dir)}
                onDelete={() => deleteBlock(block.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add-block row */}
      {canEdit && !preview && (
        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4">
          <Button variant="ghost" size="sm" onClick={() => addBlock("heading")}>
            <Heading2 className="mr-1.5 h-4 w-4" />
            Heading
          </Button>
          <Button variant="ghost" size="sm" onClick={() => addBlock("text")}>
            <Type className="mr-1.5 h-4 w-4" />
            Text
          </Button>
          <Button variant="ghost" size="sm" onClick={() => addBlock("photo")}>
            <ImagePlus className="mr-1.5 h-4 w-4" />
            Photo
          </Button>
        </div>
      )}

      {/* Sticky save bar */}
      {canEdit && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              {story && <span>v{story.version}</span>}
              {dirty && (
                <span className="flex items-center gap-1.5 text-primary-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                  Unsaved changes
                </span>
              )}
              {saveError && <span className="text-error">{saveError}</span>}
            </div>
            <Button onClick={save} isLoading={saving} disabled={!dirty && !saveError}>
              Save journal
            </Button>
          </div>
        </div>
      )}

      <AiAssistPanel
        trip={trip}
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onInsertStory={insertStoryResult}
        onApplyTitle={applyTitle}
      />
    </div>
  );
}
