"use client";

import { ArrowDown, ArrowUp, ImageIcon, Trash2 } from "lucide-react";
import { mediaSrc } from "@/lib/utils";
import type { StoryBlock } from "@/lib/story-api";
import type { TripMediaRecord } from "@/lib/trip-api";

interface StoryBlockEditorProps {
  block: StoryBlock;
  index: number;
  total: number;
  media: TripMediaRecord[];
  preview: boolean;
  onChange: (patch: Partial<StoryBlock>) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}

const textareaClass =
  "w-full resize-none rounded-lg border border-transparent bg-transparent px-3 py-2 text-text-primary transition-colors hover:border-border focus:border-border focus:outline-none focus:ring-2 focus:ring-primary-500";

function content<T>(block: StoryBlock, key: string, fallback: T): T {
  const value = block.content?.[key];
  return (value ?? fallback) as T;
}

export function StoryBlockEditor({
  block,
  index,
  total,
  media,
  preview,
  onChange,
  onMove,
  onDelete,
}: StoryBlockEditorProps) {
  const setContent = (patch: Record<string, unknown>) =>
    onChange({ content: { ...block.content, ...patch } });

  const isHero = block.type === "hero";

  const body = (() => {
    switch (block.type) {
      case "hero":
        return preview ? (
          <div className="py-10 text-center">
            <h1 className="font-heading text-4xl text-text-primary sm:text-5xl">
              {content(block, "title", "Untitled journey")}
            </h1>
            {Boolean(content(block, "subtitle", "")) && (
              <p className="mt-3 text-lg text-text-secondary">{content(block, "subtitle", "")}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={content(block, "title", "")}
              onChange={(e) => setContent({ title: e.target.value })}
              placeholder="Journey title"
              className="w-full rounded-lg border border-transparent bg-transparent px-3 py-2 font-heading text-3xl text-text-primary transition-colors hover:border-border focus:border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              value={content(block, "subtitle", "")}
              onChange={(e) => setContent({ subtitle: e.target.value })}
              placeholder="A subtitle, if the story needs one"
              className="w-full rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-lg text-text-secondary transition-colors hover:border-border focus:border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        );

      case "heading":
        return preview ? (
          <h2 className="font-heading text-2xl text-text-primary sm:text-3xl">
            {content(block, "text", "")}
          </h2>
        ) : (
          <input
            type="text"
            value={content(block, "text", "")}
            onChange={(e) => setContent({ text: e.target.value })}
            placeholder="Chapter heading"
            className="w-full rounded-lg border border-transparent bg-transparent px-3 py-2 font-heading text-2xl text-text-primary transition-colors hover:border-border focus:border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        );

      case "text":
        return preview ? (
          <div className="mx-auto max-w-[65ch] space-y-4 text-[1.05rem] leading-relaxed text-text-primary">
            {String(content(block, "text", ""))
              .split(/\n\n+/)
              .filter(Boolean)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </div>
        ) : (
          <textarea
            value={content(block, "text", "")}
            onChange={(e) => {
              setContent({ text: e.target.value });
              // Autosize
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="Write the story…"
            rows={Math.max(3, String(content(block, "text", "")).split("\n").length)}
            className={textareaClass}
          />
        );

      case "photo": {
        const mediaId = content<string | null>(block, "mediaId", null);
        const chosen = media.find((m) => m.id === mediaId);
        const url = chosen ? mediaSrc(chosen) : content<string | null>(block, "url", null);
        return (
          <div>
            {url ? (
              <figure>
                <img src={url} alt={content(block, "caption", "") || "Journal photo"} className="w-full rounded-xl object-cover" />
                {preview ? (
                  Boolean(content(block, "caption", "")) && (
                    <figcaption className="mt-2 text-center text-sm text-text-tertiary">
                      {content(block, "caption", "")}
                    </figcaption>
                  )
                ) : (
                  <input
                    type="text"
                    value={content(block, "caption", "")}
                    onChange={(e) => setContent({ caption: e.target.value })}
                    placeholder="Caption (optional)"
                    className="mt-2 w-full rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-center text-sm text-text-tertiary transition-colors hover:border-border focus:border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
              </figure>
            ) : null}
            {!preview && (
              <div className={url ? "mt-3" : ""}>
                {media.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-text-tertiary">
                    No photos in this trip yet — add some in Edit trip first.
                  </p>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {media
                      .filter((m) => m.type === "IMAGE")
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setContent({ mediaId: m.id, url: mediaSrc(m) })}
                          className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                            mediaId === m.id ? "border-primary-500" : "border-transparent hover:border-primary-200"
                          }`}
                        >
                          <img src={mediaSrc(m, "thumbnail")} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      default:
        // Unknown block type (from a future editor version): render opaque,
        // never edit — it's preserved verbatim on save.
        return (
          <div className="rounded-lg border border-dashed border-border bg-surface-pressed px-4 py-3 text-sm text-text-tertiary">
            <ImageIcon className="mr-2 inline h-4 w-4" />
            Unsupported block ({block.type}) — kept as-is
          </div>
        );
    }
  })();

  if (preview) {
    return <div className="py-3">{body}</div>;
  }

  return (
    <div className="group relative rounded-xl border border-transparent px-1 py-2 transition-colors hover:border-border focus-within:border-border">
      {/* Block controls */}
      <div className="absolute -right-2 top-2 z-10 flex flex-col gap-1 rounded-lg border border-border bg-surface p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index <= (isHero ? 0 : 1)}
          className="rounded p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"
          aria-label="Move block up"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === total - 1 || isHero}
          className="rounded p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"
          aria-label="Move block down"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        {!isHero && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1 text-text-tertiary hover:text-error"
            aria-label="Delete block"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {body}
    </div>
  );
}
