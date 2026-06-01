"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ClipTimeline } from "@/components/ClipTimeline";
import { SideBySidePlayer } from "@/components/SideBySidePlayer";
import { getClipsForJourney, getJourney } from "@/lib/storage";
import type { Clip, Journey } from "@/lib/types";

function ComparePageContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [loadedJourney, loadedClips] = await Promise.all([
        getJourney(params.id),
        getClipsForJourney(params.id),
      ]);
      setJourney(loadedJourney ?? null);
      setClips(loadedClips);

      const clipA = searchParams.get("a");
      const clipB = searchParams.get("b");
      if (clipA && clipB) {
        setSelectedIds([clipA, clipB]);
      } else if (loadedClips.length >= 2) {
        setSelectedIds([
          loadedClips[0].id,
          loadedClips[loadedClips.length - 1].id,
        ]);
      }

      setLoading(false);
    }
    load();
  }, [params.id, searchParams]);

  const selectedClips = useMemo(() => {
    return selectedIds
      .map((id) => clips.find((clip) => clip.id === id))
      .filter(Boolean) as Clip[];
  }, [clips, selectedIds]);

  const toggleSelect = (clipId: string) => {
    setSelectedIds((current) => {
      if (current.includes(clipId)) {
        return current.filter((id) => id !== clipId);
      }
      if (current.length >= 2) {
        return [current[1], clipId];
      }
      return [...current, clipId];
    });
  };

  const clipA = selectedClips[0];
  const clipB = selectedClips[1];

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading comparison...</p>;
  }

  if (!journey) {
    return (
      <div className="rounded-3xl border border-[var(--border)] p-10 text-center">
        <p className="font-display text-xl font-semibold">Journey not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/journey/${journey.id}`}
          className="text-sm text-[var(--text-muted)]"
        >
          ← Back to timeline
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold">Compare progress</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Select two clips from {journey.name} to watch them side by side.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">Choose two clips</h2>
        <ClipTimeline
          journeyId={journey.id}
          clips={clips}
          selectable
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      </section>

      {clipA && clipB ? (
        <>
          <SideBySidePlayer clipA={clipA} clipB={clipB} />

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <p className="font-medium">Did this help you see your progress?</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                ["yes", "Yes, definitely"],
                ["little", "A little"],
                ["no", "Not really"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFeedback(label)}
                  className={`rounded-full px-4 py-2 text-sm ${
                    feedback === label
                      ? "bg-[var(--accent)] text-[var(--on-accent)]"
                      : "border border-[var(--border)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {feedback && (
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                Thanks — that emotional signal is the core value of Dance Diary.
              </p>
            )}
          </section>

          <Link
            href={`/journey/${journey.id}/export?a=${clipA.id}&b=${clipB.id}`}
            className="inline-flex rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--on-accent)]"
          >
            Export this comparison
          </Link>
        </>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          Select two clips to start the side-by-side playback.
        </p>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--text-muted)]">Loading comparison...</p>}>
      <ComparePageContent />
    </Suspense>
  );
}
