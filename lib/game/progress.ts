/**
 * Streak, unlock and discount persistence for The Measurement Ritual.
 *
 * Everything here is pure except load/save, so the streak rules can be reasoned
 * about (and tested) without a browser. "Day" means the player's local calendar
 * day — brewing at 1 AM counts for that night, not the previous afternoon.
 */

import { FRAGMENTS, NostalgiaFragment, unlockedIdsFor, UnlockStats } from './fragments';

const STORAGE_KEY = 'mlt300:ritual-progress:v1';

export interface StoredProgress {
  version: 1;
  /** Consecutive days with at least one finished round. */
  streak: number;
  longestStreak: number;
  /** Local calendar day (YYYY-MM-DD) of the last finished round. */
  lastPlayedDate: string | null;
  daysPlayed: number;
  totalRounds: number;
  bestScore: number;
  lastScore: number | null;
  unlocked: string[];
  /** Day the discount was earned, or null while still locked. */
  discountUnlockedOn: string | null;
}

export type StreakEvent = 'first' | 'continued' | 'sameDay' | 'broken';

export interface RoundOutcome {
  progress: StoredProgress;
  event: StreakEvent;
  /** The streak that was lost, when the event is 'broken'. */
  brokenFrom: number | null;
  newlyUnlocked: NostalgiaFragment[];
  discountJustUnlocked: boolean;
  isPersonalBest: boolean;
}

/** The reward that ties the game back to the shop. */
export const DISCOUNT = {
  code: 'AMMA300',
  percent: 15,
  streakRequirement: 3,
  scoreRequirement: 90,
} as const;

export function emptyProgress(): StoredProgress {
  return {
    version: 1,
    streak: 0,
    longestStreak: 0,
    lastPlayedDate: null,
    daysPlayed: 0,
    totalRounds: 0,
    bestScore: 0,
    lastScore: null,
    unlocked: [],
    discountUnlockedOn: null,
  };
}

export function dayKey(date: Date = new Date()): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function keyToDate(key: string): Date | null {
  const parts = key.split('-').map(Number);
  if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/** Whole calendar days from `from` to `to`; negative if `to` is earlier. */
export function daysBetween(from: string, to: string): number | null {
  const a = keyToDate(from);
  const b = keyToDate(to);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export interface StreakStatus {
  /** Streak the player actually holds right now — a missed day already zeroes it. */
  streak: number;
  /** True once the stored streak has lapsed but hasn't been overwritten yet. */
  lapsed: boolean;
  /** The streak that will be lost if they don't brew today. */
  lapsedFrom: number;
  /** Played earlier today, so the day is already safe. */
  playedToday: boolean;
  /** Last brew was yesterday: the streak survives only if they brew today. */
  atRisk: boolean;
}

export function streakStatus(progress: StoredProgress, today: string = dayKey()): StreakStatus {
  if (!progress.lastPlayedDate) {
    return { streak: 0, lapsed: false, lapsedFrom: 0, playedToday: false, atRisk: false };
  }

  const gap = daysBetween(progress.lastPlayedDate, today);
  if (gap === null || gap < 0) {
    return {
      streak: progress.streak,
      lapsed: false,
      lapsedFrom: 0,
      playedToday: false,
      atRisk: false,
    };
  }

  if (gap === 0) {
    return {
      streak: progress.streak,
      lapsed: false,
      lapsedFrom: 0,
      playedToday: true,
      atRisk: false,
    };
  }

  if (gap === 1) {
    return {
      streak: progress.streak,
      lapsed: false,
      lapsedFrom: progress.streak,
      playedToday: false,
      atRisk: true,
    };
  }

  return {
    streak: 0,
    lapsed: true,
    lapsedFrom: progress.streak,
    playedToday: false,
    atRisk: false,
  };
}

/** Loss-aversion copy — Amma notices when you skip a day. */
export function streakNudge(progress: StoredProgress, today: string = dayKey()): string | null {
  const status = streakStatus(progress, today);

  if (status.lapsed && status.lapsedFrom > 1) {
    return `Tumne ${status.lapsedFrom} din ki lay tod di. Aaj se phir se shuru — pehla din.`;
  }
  if (status.lapsed) {
    return 'Ek din chhoot gaya. Chalo, aaj se phir shuru karein.';
  }
  if (status.atRisk && status.lapsedFrom >= 2) {
    return `Aaj nahi banai to ${status.lapsedFrom} din ki lay chali jaayegi.`;
  }
  if (status.atRisk) {
    return 'Kal banai thi. Aaj bhi bana lo, warna lay toot jaayegi.';
  }
  if (status.playedToday) {
    return 'Aaj ki chai ho gayi. Kal phir isi waqt.';
  }
  return null;
}

export function streakHeadline(streak: number): string {
  if (streak <= 0) return 'Day 1 of making chai like Amma';
  return `Day ${streak} of making chai like Amma`;
}

export function unlockStatsFor(progress: StoredProgress): UnlockStats {
  return {
    streak: progress.streak,
    longestStreak: progress.longestStreak,
    bestScore: progress.bestScore,
    totalRounds: progress.totalRounds,
  };
}

export function isDiscountUnlocked(progress: StoredProgress): boolean {
  return progress.discountUnlockedOn !== null;
}

function discountEarned(progress: StoredProgress): boolean {
  return (
    progress.streak >= DISCOUNT.streakRequirement || progress.bestScore >= DISCOUNT.scoreRequirement
  );
}

/**
 * Folds a finished round into the saved progress. Extra rounds on the same day
 * still count for scores and unlocks, but the streak only moves once a day.
 */
export function commitRound(
  previous: StoredProgress,
  score: number,
  today: string = dayKey(),
): RoundOutcome {
  const gap = previous.lastPlayedDate ? daysBetween(previous.lastPlayedDate, today) : null;

  let event: StreakEvent;
  let streak: number;
  let brokenFrom: number | null = null;

  if (gap === 0) {
    event = 'sameDay';
    streak = previous.streak;
  } else if (gap === 1) {
    event = 'continued';
    streak = previous.streak + 1;
  } else if (previous.lastPlayedDate === null) {
    event = 'first';
    streak = 1;
  } else {
    event = 'broken';
    brokenFrom = previous.streak;
    streak = 1;
  }

  const next: StoredProgress = {
    ...previous,
    streak,
    longestStreak: Math.max(previous.longestStreak, streak),
    lastPlayedDate: today,
    daysPlayed: previous.daysPlayed + (event === 'sameDay' ? 0 : 1),
    totalRounds: previous.totalRounds + 1,
    bestScore: Math.max(previous.bestScore, score),
    lastScore: score,
  };

  const alreadyUnlocked = new Set(previous.unlocked);
  const unlockedNow = unlockedIdsFor(unlockStatsFor(next));
  const newIds = unlockedNow.filter((id) => !alreadyUnlocked.has(id));
  next.unlocked = [...previous.unlocked, ...newIds];

  const discountJustUnlocked = !isDiscountUnlocked(previous) && discountEarned(next);
  if (discountJustUnlocked) {
    next.discountUnlockedOn = today;
  }

  return {
    progress: next,
    event,
    brokenFrom,
    newlyUnlocked: newIds
      .map((id) => FRAGMENTS.find((fragment) => fragment.id === id))
      .filter((fragment): fragment is NostalgiaFragment => Boolean(fragment)),
    discountJustUnlocked,
    isPersonalBest: score > previous.bestScore && previous.totalRounds > 0,
  };
}

/**
 * Grants anything the player's history already earns. Keeps the album honest if
 * the fragment list grows in a later release, or if a save was written before a
 * requirement existed.
 */
function reconcileUnlocks(progress: StoredProgress): StoredProgress {
  const earned = unlockedIdsFor(unlockStatsFor(progress));
  const missing = earned.filter((id) => !progress.unlocked.includes(id));
  if (missing.length === 0) return progress;
  return { ...progress, unlocked: [...progress.unlocked, ...missing] };
}

export function loadProgress(): StoredProgress {
  const base = emptyProgress();
  if (typeof window === 'undefined') return base;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;

    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    const number = (value: unknown, fallback: number) =>
      typeof value === 'number' && Number.isFinite(value) ? value : fallback;

    return reconcileUnlocks({
      version: 1,
      streak: Math.max(0, Math.floor(number(parsed.streak, 0))),
      longestStreak: Math.max(0, Math.floor(number(parsed.longestStreak, 0))),
      lastPlayedDate: typeof parsed.lastPlayedDate === 'string' ? parsed.lastPlayedDate : null,
      daysPlayed: Math.max(0, Math.floor(number(parsed.daysPlayed, 0))),
      totalRounds: Math.max(0, Math.floor(number(parsed.totalRounds, 0))),
      bestScore: Math.min(100, Math.max(0, number(parsed.bestScore, 0))),
      lastScore: typeof parsed.lastScore === 'number' ? parsed.lastScore : null,
      unlocked: Array.isArray(parsed.unlocked)
        ? parsed.unlocked.filter(
            (id): id is string =>
              typeof id === 'string' && FRAGMENTS.some((fragment) => fragment.id === id),
          )
        : [],
      discountUnlockedOn:
        typeof parsed.discountUnlockedOn === 'string' ? parsed.discountUnlockedOn : null,
    });
  } catch {
    // Corrupt or blocked storage should never stop someone from playing.
    return base;
  }
}

export function saveProgress(progress: StoredProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private-mode storage failures are non-fatal; the session still works.
  }
}

export function resetProgress(): StoredProgress {
  const fresh = emptyProgress();
  saveProgress(fresh);
  return fresh;
}
