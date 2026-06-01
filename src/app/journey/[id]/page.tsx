"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipTimeline } from "@/components/ClipTimeline";
import { danceStyleLabel, formatDate } from "@/lib/format";
import {
  deleteJourney,
  getClipsForJourney,
  getJourney,
} from "@/lib/storage";
import type { Clip, Journey } from "@/lib/types";

export default function JourneyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [loadedJourney, loadedClips] = await Promise.all([
        getJourney(params.id),
        getClipsForJourney(params.id),
      ]);
      setJourney(loadedJourney ?? null);
      setClips(loadedClips);
      setLoading(false);
    }
    load();
  }, [params.id]);

  const handleDelete = async () => {
    if (!journey) return;
    const confirmed = window.confirm(
      "Delete this journey and all clips? This cannot be undone.",
    );
    if (!confirmed) return;
    await deleteJourney(journey.id);
    router.push("/");
  };

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading journey...</p>;
  }

  if (!journey) {
    return (
      <div className="rounded-3xl border border-[var(--border)] p-10 text-center">
        <p className="font-display text-xl font-semibold">Journey not found</p>
        <Link href="/" className="mt-4 inline-block text-[var(--accent)]">
          Go home
        </Link>
      </div>
    );
  }

  const canCompare = clips.length >= 2;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-[var(--text-muted)]">
          ← Back home
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
              {danceStyleLabel(journey.danceStyle)}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold">{journey.name}</h1>
            <p className="mt-2 max-w-2xl text-[var(--text-muted)]">{journey.goal}</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Started {formatDate(journey.createdAt)} · {journey.duration} days ·{" "}
              {journey.isPublic ? "Public" : "Private"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700"
          >
            Delete journey
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/journey/${journey.id}/record`}
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--on-accent)]"
        >
          Record today&apos;s clip
        </Link>
        {canCompare && (
          <>
            <Link
              href={`/journey/${journey.id}/compare`}
              className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium"
            >
              Compare clips
            </Link>
            <Link
              href={`/journey/${journey.id}/export?a=${clips[0]?.id}&b=${clips[clips.length - 1]?.id}`}
              className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium"
            >
              Export progress video
            </Link>
          </>
        )}
      </div>

      {canCompare && (
        <div className="rounded-3xl border border-[var(--accent-soft)] bg-[var(--accent-soft)] p-5">
          <p className="font-medium text-[var(--accent)]">
            Ready to see your glow-up?
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Compare Day {clips[0].dayNumber} with Day {clips[clips.length - 1].dayNumber}.
          </p>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold">Progress timeline</h2>
        <ClipTimeline journeyId={journey.id} clips={clips} />
      </section>
    </div>
  );
}
