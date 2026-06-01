"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { JourneyCard } from "@/components/JourneyCard";
import { StreakTracker } from "@/components/StreakTracker";
import { TAGLINE } from "@/lib/constants";
import { computeStreakStats } from "@/lib/streak";
import { getClipsForJourney, getJourneys } from "@/lib/storage";
import type { Clip, Journey } from "@/lib/types";

const featureSections = [
  {
    title: "Record your daily practice",
    body: "Capture a 10-20 second clip without needing a polished performance.",
  },
  {
    title: "Compare your progress",
    body: "Play your first and latest clips side by side to make improvement visible.",
  },
  {
    title: "Create your glow-up reel",
    body: "Export a vertical progress video with day labels and your journey name.",
  },
];

export default function HomePage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [clipsByJourney, setClipsByJourney] = useState<Record<string, Clip[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const allJourneys = await getJourneys();
      const clipEntries = await Promise.all(
        allJourneys.map(async (journey) => [
          journey.id,
          await getClipsForJourney(journey.id),
        ] as const),
      );
      setJourneys(allJourneys);
      setClipsByJourney(Object.fromEntries(clipEntries));
      setLoading(false);
    }
    load();
  }, []);

  const streakStats = useMemo(() => {
    const allClips = Object.values(clipsByJourney).flat();
    return computeStreakStats(allClips.map((clip) => clip.createdAt));
  }, [clipsByJourney]);

  const totalClips = Object.values(clipsByJourney).reduce(
    (total, clips) => total + clips.length,
    0,
  );
  const activeJourney = journeys[0];
  const activeJourneyClips = activeJourney
    ? clipsByJourney[activeJourney.id] ?? []
    : [];
  const comparisonJourney = journeys.find(
    (journey) => (clipsByJourney[journey.id] ?? []).length >= 2,
  );
  const comparisonClips = comparisonJourney
    ? clipsByJourney[comparisonJourney.id] ?? []
    : [];

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[radial-gradient(circle_at_top_left,rgba(230,184,46,0.22),transparent_42%),linear-gradient(180deg,rgba(255,107,74,0.1),transparent)] p-8 sm:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-[var(--accent)]">
          Private-first dance progress tracker
        </p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
          See your dance progress in motion.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--text-muted)] sm:text-lg">
          {TAGLINE} Record 10–20 second practice clips, compare Day 1 with Day
          30, and export your glow-up reel.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/journey/new"
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--on-accent)]"
          >
            Start your first dance journey
          </Link>
          <Link
            href="/community"
            className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-medium"
          >
            Browse community
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {featureSections.map((feature) => (
          <div
            key={feature.title}
            className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
          >
            <h2 className="font-display text-xl font-bold">{feature.title}</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{feature.body}</p>
          </div>
        ))}
      </section>

      {activeJourney && (
        <section className="rounded-[2rem] border border-[var(--accent-soft)] bg-[var(--accent-soft)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
                Today&apos;s recording prompt
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold">
                Record Day {activeJourneyClips.length + 1} for {activeJourney.name}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Your future self will want this clip.
              </p>
            </div>
            <Link
              href={`/journey/${activeJourney.id}/record`}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--on-accent)]"
            >
              Record today&apos;s clip
            </Link>
          </div>
        </section>
      )}

      <StreakTracker stats={streakStats} />

      <section className="grid gap-4 sm:grid-cols-2">
        {[
          { label: "Active journeys", value: journeys.length },
          { label: "Clips saved", value: totalClips },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
          >
            <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Your journeys</h2>
          <Link
            href="/journey/new"
            className="text-sm font-medium text-[var(--accent)]"
          >
            + New journey
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading journeys...</p>
        ) : journeys.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border)] p-10 text-center">
            <p className="font-display text-xl font-semibold">
              Your future self will want this clip.
            </p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Start a 7-day progress challenge and record Day 1 today.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {journeys.map((journey) => (
              <JourneyCard
                key={journey.id}
                journey={journey}
                clips={clipsByJourney[journey.id] ?? []}
              />
            ))}
          </div>
        )}
      </section>

      {comparisonJourney && comparisonClips.length >= 2 && (
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
            Recent progress comparison
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold">
            Day {comparisonClips[0].dayNumber} vs Day{" "}
            {comparisonClips[comparisonClips.length - 1].dayNumber}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Watch your first clip beside your latest take from {comparisonJourney.name}.
          </p>
          <Link
            href={`/journey/${comparisonJourney.id}/compare?a=${comparisonClips[0].id}&b=${comparisonClips[comparisonClips.length - 1].id}`}
            className="mt-5 inline-flex rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium"
          >
            Compare first and latest
          </Link>
        </section>
      )}
    </div>
  );
}
