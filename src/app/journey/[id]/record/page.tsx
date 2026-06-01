"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VideoRecorder } from "@/components/VideoRecorder";
import { createId, getJourney, getNextDayNumber, saveClip } from "@/lib/storage";
import type { Journey } from "@/lib/types";

export default function RecordClipPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [dayNumber, setDayNumber] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const loadedJourney = await getJourney(params.id);
      const nextDay = await getNextDayNumber(params.id);
      setJourney(loadedJourney ?? null);
      setDayNumber(nextDay);
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading recorder...</p>;
  }

  if (!journey) {
    return (
      <div className="rounded-3xl border border-[var(--border)] p-10 text-center">
        <p className="font-display text-xl font-semibold">Journey not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/journey/${journey.id}`}
          className="text-sm text-[var(--text-muted)]"
        >
          ← Back to timeline
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold">
          Record Day {dayNumber}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {journey.name} · Keep it short, imperfect, and honest.
        </p>
      </div>

      <VideoRecorder
        onSave={async (blob, meta) => {
          const clipId = createId();
          const videoId = createId();
          await saveClip(
            {
              id: clipId,
              journeyId: journey.id,
              dayNumber,
              durationSeconds: meta.durationSeconds,
              note: meta.note || undefined,
              skillFocus: meta.skillFocus,
              videoId,
              createdAt: new Date().toISOString(),
            },
            blob,
          );
          router.push(`/journey/${journey.id}`);
        }}
      />
    </div>
  );
}
