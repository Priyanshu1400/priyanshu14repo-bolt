'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Flame, AlertTriangle } from 'lucide-react';
import { StoredProgress, StreakStatus, streakHeadline } from '@/lib/game/progress';

interface StreakBadgeProps {
  progress: StoredProgress;
  status: StreakStatus;
  nudge: string | null;
  variant?: 'full' | 'compact';
}

/**
 * The streak, stated plainly and prominently. When a day is on the line the
 * badge changes colour and says what stands to be lost — the nudge copy is
 * doing loss-aversion work, so it should never be buried.
 */
export const StreakBadge: React.FC<StreakBadgeProps> = ({
  progress,
  status,
  nudge,
  variant = 'full',
}) => {
  const displayDay = status.streak > 0 ? status.streak : 1;
  const isWarning = status.atRisk || status.lapsed;

  if (variant === 'compact') {
    return (
      <div
        title={nudge ?? streakHeadline(status.streak)}
        className={`flex items-center gap-1.5 px-2.5 py-2 hand-edge-sm border-2 border-[var(--ink)] ${
          isWarning ? 'bg-[var(--orange-pale)]' : 'bg-white'
        }`}
      >
        {isWarning ? (
          <AlertTriangle className="w-4 h-4 text-[var(--orange-dark)]" />
        ) : (
          <Flame className="w-4 h-4 text-[var(--orange)]" />
        )}
        <span className="text-xs font-site-logo font-bold">Day {displayDay}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 110, damping: 20, mass: 0.9 }}
      className={`hand-edge border-2 border-[var(--ink)] px-4 py-3.5 sm:px-5 ${
        isWarning ? 'bg-[var(--orange-pale)]' : 'bg-[var(--blue-pale)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 w-11 h-11 hand-edge-sm border-2 border-[var(--ink)] flex items-center justify-center ${
            isWarning ? 'bg-[var(--orange)]' : 'bg-[var(--blue)]'
          }`}
        >
          {isWarning ? (
            <AlertTriangle className="w-5 h-5 text-white" />
          ) : (
            <Flame className="w-5 h-5 text-white" />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-base sm:text-lg font-site-display leading-tight">
            {streakHeadline(displayDay)}
          </p>

          {nudge && (
            <p
              className={`mt-1 text-sm font-caveat leading-snug ${
                isWarning ? 'text-[var(--orange-dark)]' : 'text-[var(--ink-m)]'
              }`}
            >
              “{nudge}”
            </p>
          )}

          <p className="mt-1.5 text-[11px] font-site-logo uppercase tracking-[0.12em] text-[var(--ink-l)]">
            {progress.totalRounds} {progress.totalRounds === 1 ? 'cup' : 'cups'} ·{' '}
            {progress.bestScore > 0 ? `best ${progress.bestScore}%` : 'no score yet'} · longest{' '}
            {progress.longestStreak} {progress.longestStreak === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
