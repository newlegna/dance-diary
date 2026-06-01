"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Clip } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { getVideoUrl } from "@/lib/storage";

interface ClipTimelineProps {
  journeyId: string;
  clips: Clip[];
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (clipId: string) => void;
}

function ClipThumbnail({ clip }: { clip: Clip }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    getVideoUrl(clip.videoId).then((videoUrl) => {
      if (!active || !videoUrl) return;
      objectUrl = videoUrl;
      setUrl(videoUrl);
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [clip.videoId]);

  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-[var(--bg-elevated)]">
      {url ? (
        <video
          src={url}
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
          Loading...
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <p className="text-sm font-semibold">Day {clip.dayNumber}</p>
        <p className="text-xs text-white/70">{formatDate(clip.createdAt)}</p>
      </div>
    </div>
  );
}

export function ClipTimeline({
  journeyId,
  clips,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
}: ClipTimelineProps) {
  if (clips.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--border)] p-10 text-center">
        <p className="font-display text-xl font-semibold">No clips yet</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Record your Day 1 clip to start your progress timeline.
        </p>
        <Link
          href={`/journey/${journeyId}/record`}
          className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--on-accent)]"
        >
          Record Day 1
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clips.map((clip) => {
        const selected = selectedIds.includes(clip.id);
        const content = (
          <>
            <ClipThumbnail clip={clip} />
            {clip.note && (
              <p className="mt-3 line-clamp-2 text-sm text-[var(--text-muted)]">
                {clip.note}
              </p>
            )}
            {selectable && (
              <p className="mt-2 text-xs font-medium text-[var(--accent)]">
                {selected ? "Selected" : "Tap to select"}
              </p>
            )}
          </>
        );

        if (selectable && onToggleSelect) {
          return (
            <button
              key={clip.id}
              type="button"
              onClick={() => onToggleSelect(clip.id)}
              className={`rounded-3xl border p-3 text-left transition ${
                selected
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)] hover:border-[var(--accent)]/50"
              }`}
            >
              {content}
            </button>
          );
        }

        return (
          <div
            key={clip.id}
            className="rounded-3xl border border-[var(--border)] p-3"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
