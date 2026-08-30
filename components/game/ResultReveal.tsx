'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, animate, useMotionValue, useMotionValueEvent } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  RotateCcw,
  Share2,
  Flame,
  Album,
  Sparkles,
  Ticket,
  Copy,
  Check,
  Trophy,
} from 'lucide-react';
import { GradeResult } from '@/lib/game/grading';
import { INGREDIENT_BY_ID, RITUAL_TOTAL, formatAmount } from '@/lib/game/scenarios';
import { Scenario } from '@/lib/game/types';
import { NostalgiaFragment } from '@/lib/game/fragments';
import { DISCOUNT, StreakEvent, streakHeadline } from '@/lib/game/progress';
import { audioEngine } from '@/lib/game/audioEngine';

interface ResultRevealProps {
  grade: GradeResult;
  scenario: Scenario;
  streakDay: number;
  streakEvent: StreakEvent;
  brokenFrom: number | null;
  isPersonalBest: boolean;
  newlyUnlocked: NostalgiaFragment[];
  unlockedCount: number;
  fragmentTotal: number;
  discountUnlocked: boolean;
  discountJustUnlocked: boolean;
  onOpenAlbum: (fragmentId?: string) => void;
  onShare: () => void;
  onPlayAgain: () => void;
  onGoToStore: () => void;
}

function streakNoteFor(event: StreakEvent, brokenFrom: number | null): string {
  switch (event) {
    case 'first':
      return 'Pehla din. Kal isi waqt phir banao, lay banti hai.';
    case 'continued':
      return 'Lay bani hui hai. Kal chhoote to shuru se ginna padega.';
    case 'broken':
      return brokenFrom && brokenFrom > 1
        ? `${brokenFrom} din ki lay toot gayi thi. Aaj se phir se — pehla din.`
        : 'Ek din chhoot gaya tha. Aaj se phir se shuru.';
    case 'sameDay':
    default:
      return 'Aaj ka din gin liya gaya hai. Yeh cup practice ke liye.';
  }
}

const BRAND_CONFETTI = ['#e07d26', '#c46a1c', '#00a59f', '#f7e0cd', '#0a3d3a'];

const BAND_ACCENT: Record<GradeResult['band'], string> = {
  amma: 'var(--blue-dark)',
  ghar: 'var(--orange-dark)',
  hostel: 'var(--ink-m)',
  disaster: 'var(--ink-l)',
};

export const ResultReveal: React.FC<ResultRevealProps> = ({
  grade,
  scenario,
  streakDay,
  streakEvent,
  brokenFrom,
  isPersonalBest,
  newlyUnlocked,
  unlockedCount,
  fragmentTotal,
  discountUnlocked,
  discountJustUnlocked,
  onOpenAlbum,
  onShare,
  onPlayAgain,
  onGoToStore,
}) => {
  const scoreRef = useRef<HTMLSpanElement>(null);
  const displayed = useMotionValue(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(DISCOUNT.code);
      setCopied(true);
      audioEngine.playChime(660);
    } catch {
      setCopied(false);
    }
  };

  useMotionValueEvent(displayed, 'change', (value) => {
    if (scoreRef.current) {
      scoreRef.current.textContent = Math.round(value).toString();
    }
  });

  useEffect(() => {
    const controls = animate(displayed, grade.score, {
      duration: 1.1,
      ease: [0.16, 0.84, 0.3, 1],
    });
    return () => controls.stop();
  }, [displayed, grade.score]);

  // Celebration is proportional to the grade: a bad cup gets no confetti at all.
  useEffect(() => {
    if (grade.confetti.bursts > 0) {
      audioEngine.playVictoryFanfare();
    } else {
      audioEngine.playChime(220);
    }

    const timers: number[] = [];
    for (let burst = 0; burst < grade.confetti.bursts; burst += 1) {
      timers.push(
        window.setTimeout(() => {
          try {
            confetti({
              particleCount: Math.round(grade.confetti.particleCount / grade.confetti.bursts),
              spread: grade.confetti.spread,
              startVelocity: 38,
              gravity: 1.1,
              scalar: 0.95,
              origin: { y: 0.55, x: 0.5 + (burst - 1) * 0.14 },
              colors: BRAND_CONFETTI,
            });
          } catch {
            // Confetti is decorative; never let it break the reveal.
          }
        }, burst * 260),
      );
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [grade.confetti]);

  const totalDelta = grade.totalPoured - RITUAL_TOTAL;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 90, damping: 18, mass: 1.1 }}
      className="bg-white/85 hand-edge border-2 border-[var(--ink)] p-6 sm:p-9 shadow-[var(--shadow-lg)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <div className="flex-1">
          <span className="inline-block text-[11px] font-site-logo uppercase tracking-[0.2em] text-[var(--blue-dark)]">
            {scenario.title}
          </span>

          <div className="mt-2 flex items-end gap-3 flex-wrap">
            <span className="font-site-display text-6xl sm:text-7xl leading-none">
              <span ref={scoreRef}>0</span>%
            </span>
            {isPersonalBest && (
              <span className="inline-flex items-center gap-1.5 mb-1.5 px-2.5 py-1 hand-edge-sm border-2 border-[var(--ink)] bg-[var(--orange-pale)] text-[10px] font-site-logo font-bold uppercase tracking-[0.12em] text-[var(--orange-dark)]">
                <Trophy className="w-3 h-3" />
                Personal best
              </span>
            )}
          </div>

          <h2
            className="mt-2 text-2xl sm:text-3xl font-site-display"
            style={{ color: BAND_ACCENT[grade.band] }}
          >
            {grade.title}
          </h2>

          <p className="mt-3 text-lg font-caveat text-[var(--ink-m)]">“{grade.verdict}”</p>
        </div>

        {/* The cup that actually came out of this brew */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative w-20 h-28">
            <div className="absolute inset-x-0 bottom-0 h-24 rounded-b-2xl rounded-t-sm border-2 border-[var(--ink)] bg-white/70 overflow-hidden">
              <motion.div
                className="absolute inset-x-0 bottom-0"
                initial={{ height: '0%' }}
                animate={{ height: '82%', backgroundColor: grade.brewColor }}
                transition={{ duration: 1, ease: [0.22, 0.61, 0.36, 1], delay: 0.2 }}
              >
                <div className="absolute top-0 inset-x-0 h-1.5 bg-white/45" />
              </motion.div>
              <div className="absolute inset-y-0 left-2 w-[2px] bg-white/50" />
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-2 w-24 rounded-full bg-[var(--ink)]/70" />
          </div>
          <span className="mt-3 text-[10px] font-site-logo uppercase tracking-[0.14em] text-[var(--ink-l)]">
            Your cup
          </span>
        </div>
      </div>

      {/* Per-ingredient accuracy */}
      <div className="mt-7 pt-5 border-t border-dashed border-[var(--ink)]/25 space-y-3">
        {grade.ingredientScores.map((item) => {
          const ingredient = INGREDIENT_BY_ID[item.id];
          const within = item.errorRatio <= 1 && !item.overflowed;
          const barColor = item.overflowed
            ? '#b3261e'
            : within
              ? 'var(--blue)'
              : 'var(--orange)';

          return (
            <div key={item.id} className="flex items-center gap-3">
              <span className="w-20 sm:w-24 shrink-0 text-xs font-site-logo font-semibold">
                {ingredient.name}
              </span>

              <div className="flex-1 h-2.5 rounded-full bg-[var(--cream-dark)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: barColor }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.round(item.accuracy * 100)}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1], delay: 0.15 }}
                />
              </div>

              <span className="w-24 sm:w-28 shrink-0 text-right text-[11px] font-site-body text-[var(--ink-m)]">
                {formatAmount(item.poured)} / {formatAmount(item.target)} {ingredient.unit}
              </span>

              <span
                className="w-11 shrink-0 text-right text-[11px] font-site-logo font-bold"
                style={{ color: barColor }}
              >
                {item.overflowed ? 'spill' : `${Math.round(item.accuracy * 100)}%`}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-[var(--ink-l)]">
        {formatAmount(grade.totalPoured)} ml in the patila ·{' '}
        {Math.abs(totalDelta) < 1
          ? 'exactly the 300 ml ritual'
          : `${totalDelta > 0 ? '+' : ''}${formatAmount(totalDelta)} ml against the 300 ml ritual`}
      </p>

      {/* Streak, stated with what's at stake */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 110, damping: 20 }}
        className="mt-6 flex items-start gap-3 hand-edge border-2 border-[var(--ink)] bg-[var(--blue-pale)] px-4 py-3.5"
      >
        <div className="shrink-0 w-10 h-10 hand-edge-sm border-2 border-[var(--ink)] bg-[var(--blue)] flex items-center justify-center">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-base sm:text-lg font-site-display leading-tight">
            {streakHeadline(streakDay)}
          </p>
          <p className="mt-0.5 text-sm font-caveat text-[var(--ink-m)]">
            “{streakNoteFor(streakEvent, brokenFrom)}”
          </p>
        </div>
      </motion.div>

      {/* Fragments earned by this cup */}
      {newlyUnlocked.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 110, damping: 20 }}
          className="mt-3 hand-edge border-2 border-[var(--ink)] bg-[var(--orange-pale)] px-4 py-3.5"
        >
          <span className="inline-flex items-center gap-1.5 text-[10px] font-site-logo uppercase tracking-[0.16em] text-[var(--orange-dark)]">
            <Sparkles className="w-3.5 h-3.5" />
            {newlyUnlocked.length === 1 ? 'A memory came back' : `${newlyUnlocked.length} memories came back`}
          </span>

          <div className="mt-2 space-y-1.5">
            {newlyUnlocked.map((fragment) => (
              <button
                key={fragment.id}
                type="button"
                onClick={() => onOpenAlbum(fragment.id)}
                className="w-full flex items-center justify-between gap-3 text-left hand-edge-sm border border-[var(--ink)]/25 bg-white/70 px-3 py-2 hover:bg-white transition-colors"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-site-display leading-tight truncate">
                    {fragment.title}
                  </span>
                  <span className="block text-[10px] font-site-logo uppercase tracking-[0.12em] text-[var(--ink-l)]">
                    {fragment.era}
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0 text-[var(--ink-m)]" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* The reward that points back at the real product */}
      {discountUnlocked && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 110, damping: 20 }}
          className="mt-3 hand-edge border-2 border-[var(--ink)] bg-white px-4 py-4"
        >
          <span className="inline-flex items-center gap-1.5 text-[10px] font-site-logo uppercase tracking-[0.16em] text-[var(--blue-dark)]">
            <Ticket className="w-3.5 h-3.5" />
            {discountJustUnlocked ? 'Unlocked just now' : 'Already unlocked'}
          </span>

          <p className="mt-1 text-base sm:text-lg font-site-display leading-tight">
            {DISCOUNT.percent}% off a real 300ml T box
          </p>
          <p className="mt-0.5 text-sm font-caveat text-[var(--ink-m)]">
            “Naap seekh liya. Ab asli chai bhi ghar aane do.”
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="px-4 py-2.5 hand-edge-sm border-2 border-dashed border-[var(--ink)] bg-[var(--cream)] font-site-display tracking-[0.14em]">
              {DISCOUNT.code}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-2.5 hand-edge-sm border-2 border-[var(--ink)] bg-white text-xs font-site-logo font-semibold"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[var(--blue-dark)]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? 'Copied' : 'Copy code'}
            </button>
          </div>
        </motion.div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onShare}
          className="flex items-center justify-center gap-2 px-6 py-4 hand-edge border-2 border-[var(--ink)] bg-[var(--orange)] text-white font-site-display hover:bg-[var(--orange-dark)] transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share this cup
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          className="flex items-center justify-center gap-2 px-6 py-4 hand-edge border-2 border-[var(--ink)] bg-white font-site-display hover:bg-[var(--blue-pale)] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Brew another cup
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onOpenAlbum()}
          className="flex items-center justify-center gap-2 px-5 py-3 hand-edge-sm border-2 border-[var(--ink)] bg-white text-xs font-site-logo font-semibold hover:bg-[var(--cream)] transition-colors"
        >
          <Album className="w-3.5 h-3.5" />
          Memory album · {unlockedCount}/{fragmentTotal}
        </button>
        <button
          type="button"
          onClick={onGoToStore}
          className="flex items-center justify-center gap-2 px-5 py-3 hand-edge-sm border-2 border-[var(--ink)] bg-white text-xs font-site-logo font-semibold hover:bg-[var(--blue-pale)] transition-colors"
        >
          Visit the 300ml T store
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.section>
  );
};
