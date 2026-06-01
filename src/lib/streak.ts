export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  practicedToday: boolean;
  lastPracticeDate: string | null;
  totalPracticeDays: number;
  week: WeekDay[];
}

export interface WeekDay {
  date: string;
  label: string;
  practiced: boolean;
  isToday: boolean;
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function todayKey(): string {
  return toDateKey(new Date().toISOString());
}

function daysBetween(later: string, earlier: string): number {
  const a = new Date(`${later}T12:00:00`);
  const b = new Date(`${earlier}T12:00:00`);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function shiftDate(dateKey: string, offset: number): string {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return toDateKey(date.toISOString());
}

function computeLongestStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;

  let longest = 1;
  let run = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    if (daysBetween(sortedDates[i], sortedDates[i - 1]) === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  return longest;
}

function computeCurrentStreak(sortedDates: string[], today: string): number {
  if (sortedDates.length === 0) return 0;

  const last = sortedDates[sortedDates.length - 1];
  const gapFromToday = daysBetween(today, last);

  // Streak stays alive if you practiced today or yesterday.
  if (gapFromToday > 1) return 0;

  let streak = 1;
  for (let i = sortedDates.length - 2; i >= 0; i--) {
    if (daysBetween(sortedDates[i + 1], sortedDates[i]) === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function buildWeek(practiceSet: Set<string>, today: string): WeekDay[] {
  const formatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });

  return Array.from({ length: 7 }, (_, index) => {
    const offset = index - 6;
    const date = shiftDate(today, offset);
    return {
      date,
      label: formatter.format(new Date(`${date}T12:00:00`)),
      practiced: practiceSet.has(date),
      isToday: date === today,
    };
  });
}

export function computeStreakStats(practiceTimestamps: string[]): StreakStats {
  const today = todayKey();
  const practiceDates = [
    ...new Set(practiceTimestamps.map(toDateKey)),
  ].sort();

  const practiceSet = new Set(practiceDates);
  const lastPracticeDate = practiceDates.at(-1) ?? null;

  return {
    currentStreak: computeCurrentStreak(practiceDates, today),
    longestStreak: computeLongestStreak(practiceDates),
    practicedToday: practiceSet.has(today),
    lastPracticeDate,
    totalPracticeDays: practiceDates.length,
    week: buildWeek(practiceSet, today),
  };
}

export function streakStatusMessage(stats: StreakStats): string {
  if (stats.currentStreak === 0 && stats.totalPracticeDays === 0) {
    return "Record your first clip to start a streak.";
  }

  if (stats.practicedToday) {
    return stats.currentStreak === 1
      ? "You're on the board. Come back tomorrow."
      : `${stats.currentStreak} days in a row — keep the groove going.`;
  }

  if (stats.currentStreak > 0) {
    return `Streak at ${stats.currentStreak}. Record today to keep it alive.`;
  }

  return "Streak reset. Today's a fresh Day 1.";
}
