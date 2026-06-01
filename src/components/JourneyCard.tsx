import Link from "next/link";
import type { Clip, Journey } from "@/lib/types";
import { danceStyleLabel, formatDate } from "@/lib/format";

interface JourneyCardProps {
  journey: Journey;
  clips: Clip[];
}

export function JourneyCard({ journey, clips }: JourneyCardProps) {
  const currentDay = clips.length;
  const progress = Math.min((currentDay / journey.duration) * 100, 100);
  const latestClip = clips[clips.length - 1];
  const canCompare = clips.length >= 2;

  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[0_12px_40px_var(--shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
            {danceStyleLabel(journey.danceStyle)}
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold">{journey.name}</h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
            {journey.goal}
          </p>
        </div>
        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)]">
          {journey.isPublic ? "Public journey" : "Private"}
        </span>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span>
            Day {Math.max(currentDay, 1)} of {journey.duration}
          </span>
          <span className="text-[var(--text-muted)]">
            {clips.length} clip{clips.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {latestClip && (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Last clip: Day {latestClip.dayNumber} · {formatDate(latestClip.createdAt)}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/journey/${journey.id}/record`}
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--on-accent)] transition hover:brightness-110"
        >
          Record today&apos;s clip
        </Link>
        <Link
          href={`/journey/${journey.id}`}
          className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium transition hover:border-[var(--accent)]"
        >
          View timeline
        </Link>
        {canCompare && (
          <Link
            href={`/journey/${journey.id}/compare`}
            className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium transition hover:border-[var(--accent)]"
          >
            Compare progress
          </Link>
        )}
      </div>
    </article>
  );
}
