import type { StreakStats } from "@/lib/streak";
import { streakStatusMessage } from "@/lib/streak";

interface StreakTrackerProps {
  stats: StreakStats;
}

export function StreakTracker({ stats }: StreakTrackerProps) {
  const message = streakStatusMessage(stats);

  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
            Practice streak
          </p>
          <div className="mt-3 flex items-end gap-3">
            <p className="font-display text-6xl font-bold leading-none">
              {stats.currentStreak}
            </p>
            <p className="pb-2 text-lg text-[var(--text-muted)]">
              day{stats.currentStreak === 1 ? "" : "s"}
            </p>
          </div>
          <p className="mt-3 max-w-md text-sm text-[var(--text-muted)]">
            {message}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[
            { label: "Longest streak", value: stats.longestStreak },
            { label: "Total practice days", value: stats.totalPracticeDays },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3"
            >
              <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-4 text-sm font-medium">Last 7 days</p>
        <div className="grid grid-cols-7 gap-2">
          {stats.week.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-2">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-semibold transition ${
                  day.practiced
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                } ${day.isToday ? "ring-2 ring-[var(--accent)]/40" : ""}`}
                title={day.date}
              >
                {day.practiced ? "✓" : "·"}
              </span>
              <span
                className={`text-xs ${
                  day.isToday ? "font-semibold text-[var(--accent)]" : "text-[var(--text-muted)]"
                }`}
              >
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
