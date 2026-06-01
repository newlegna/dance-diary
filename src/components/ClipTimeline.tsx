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
  onDeleteClip?: (clip: Clip) => Promise<void>;
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

function ClipViewer({
  clip,
  onClose,
  onDeleteClip,
}: {
  clip: Clip;
  onClose: () => void;
  onDeleteClip?: (clip: Clip) => Promise<void>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!onDeleteClip) return;
    const confirmed = window.confirm(
      `Delete Day ${clip.dayNumber}? This clip will be removed from your private timeline.`,
    );
    if (!confirmed) return;
    setDeleting(true);
    await onDeleteClip(clip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/70 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--accent)]">
              Day {clip.dayNumber}
            </p>
            <h3 className="font-display text-2xl font-bold">Practice clip</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {formatDate(clip.createdAt)} · {clip.durationSeconds}s
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>

        {url ? (
          <video
            src={url}
            className="aspect-[9/16] max-h-[70vh] w-full rounded-3xl bg-black object-cover"
            controls
            playsInline
          />
        ) : (
          <div className="flex aspect-[9/16] max-h-[70vh] items-center justify-center rounded-3xl bg-[var(--bg-elevated)] text-sm text-[var(--text-muted)]">
            Loading clip...
          </div>
        )}

        {clip.note && (
          <p className="mt-4 rounded-2xl bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-muted)]">
            {clip.note}
          </p>
        )}

        {onDeleteClip && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="mt-4 rounded-full border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-700 disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete clip"}
          </button>
        )}
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
  onDeleteClip,
}: ClipTimelineProps) {
  const [viewingClip, setViewingClip] = useState<Clip | null>(null);

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
    <>
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
              <p className="mt-2 text-xs font-medium text-[var(--accent)]">
                {selectable ? (selected ? "Selected" : "Tap to select") : "Tap to view"}
              </p>
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
            <button
              key={clip.id}
              type="button"
              onClick={() => setViewingClip(clip)}
              className="rounded-3xl border border-[var(--border)] p-3 text-left transition hover:border-[var(--accent)]/50"
            >
              {content}
            </button>
          );
        })}
      </div>

      {viewingClip && (
        <ClipViewer
          clip={viewingClip}
          onClose={() => setViewingClip(null)}
          onDeleteClip={onDeleteClip}
        />
      )}
    </>
  );
}
