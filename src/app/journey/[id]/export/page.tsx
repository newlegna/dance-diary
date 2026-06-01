"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ProgressExport } from "@/components/ProgressExport";
import { getClip, getJourney } from "@/lib/storage";
import type { Clip, Journey } from "@/lib/types";

function ExportPageContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [clipA, setClipA] = useState<Clip | null>(null);
  const [clipB, setClipB] = useState<Clip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const loadedJourney = await getJourney(params.id);
      const clipIdA = searchParams.get("a");
      const clipIdB = searchParams.get("b");
      const [loadedA, loadedB] = await Promise.all([
        clipIdA ? getClip(clipIdA) : Promise.resolve(undefined),
        clipIdB ? getClip(clipIdB) : Promise.resolve(undefined),
      ]);

      setJourney(loadedJourney ?? null);
      setClipA(loadedA ?? null);
      setClipB(loadedB ?? null);
      setLoading(false);
    }
    load();
  }, [params.id, searchParams]);

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading export...</p>;
  }

  if (!journey || !clipA || !clipB) {
    return (
      <div className="rounded-3xl border border-[var(--border)] p-10 text-center">
        <p className="font-display text-xl font-semibold">
          Pick two clips to export
        </p>
        <Link
          href={`/journey/${params.id}/compare`}
          className="mt-4 inline-block text-[var(--accent)]"
        >
          Go to compare
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/journey/${journey.id}/compare?a=${clipA.id}&b=${clipB.id}`}
          className="text-sm text-[var(--text-muted)]"
        >
          ← Back to compare
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold">
          Create your glow-up reel
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Export a vertical video for TikTok, Instagram, or your camera roll.
        </p>
      </div>

      <ProgressExport
        journeyName={journey.name}
        clipA={clipA}
        clipB={clipB}
      />
    </div>
  );
}

export default function ExportPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--text-muted)]">Loading export...</p>}>
      <ExportPageContent />
    </Suspense>
  );
}
