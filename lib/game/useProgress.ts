'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FRAGMENTS, NostalgiaFragment, UnlockStats } from './fragments';
import {
  RoundOutcome,
  StoredProgress,
  StreakStatus,
  commitRound,
  dayKey,
  loadProgress,
  resetProgress,
  saveProgress,
  streakNudge,
  streakStatus,
  unlockStatsFor,
} from './progress';

export interface ProgressApi {
  progress: StoredProgress;
  status: StreakStatus;
  stats: UnlockStats;
  nudge: string | null;
  unlockedFragments: NostalgiaFragment[];
  isUnlocked: (fragmentId: string) => boolean;
  /** Folds a finished round in, persists it, and returns what changed. */
  commit: (score: number) => RoundOutcome;
  reset: () => void;
}

/** Milliseconds between checks for the local day rolling over. */
const DAY_WATCH_MS = 60_000;

export function useProgress(): ProgressApi {
  const [progress, setProgress] = useState<StoredProgress>(() => loadProgress());
  const [today, setToday] = useState<string>(() => dayKey());
  const latest = useRef(progress);

  useEffect(() => {
    latest.current = progress;
  }, [progress]);

  // The badge should turn to "at risk" on its own if the tab is left open overnight.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = dayKey();
      setToday((previous) => (previous === current ? previous : current));
    }, DAY_WATCH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const commit = useCallback((score: number) => {
    const outcome = commitRound(latest.current, score, dayKey());
    latest.current = outcome.progress;
    setProgress(outcome.progress);
    saveProgress(outcome.progress);
    return outcome;
  }, []);

  const reset = useCallback(() => {
    const fresh = resetProgress();
    latest.current = fresh;
    setProgress(fresh);
  }, []);

  const status = useMemo(() => streakStatus(progress, today), [progress, today]);
  const nudge = useMemo(() => streakNudge(progress, today), [progress, today]);
  const stats = useMemo(() => unlockStatsFor(progress), [progress]);

  const unlockedFragments = useMemo(
    () => FRAGMENTS.filter((fragment) => progress.unlocked.includes(fragment.id)),
    [progress.unlocked],
  );

  const isUnlocked = useCallback(
    (fragmentId: string) => progress.unlocked.includes(fragmentId),
    [progress.unlocked],
  );

  return { progress, status, stats, nudge, unlockedFragments, isUnlocked, commit, reset };
}
