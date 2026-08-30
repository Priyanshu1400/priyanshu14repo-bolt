'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Play, Square, BookOpen, Tv, Volume2, Ticket, Copy, Check } from 'lucide-react';
import {
  FRAGMENTS,
  NostalgiaFragment,
  requirementLabel,
  requirementProgress,
  UnlockStats,
} from '@/lib/game/fragments';
import { DISCOUNT } from '@/lib/game/progress';
import { audioEngine } from '@/lib/game/audioEngine';

interface MemoryAlbumProps {
  isOpen: boolean;
  unlockedIds: string[];
  stats: UnlockStats;
  discountUnlocked: boolean;
  highlightId?: string | null;
  onClose: () => void;
  onGoToStore: () => void;
}

const KIND_ICON: Record<NostalgiaFragment['kind'], React.ReactNode> = {
  note: <BookOpen className="w-3.5 h-3.5" />,
  audio: <Volume2 className="w-3.5 h-3.5" />,
  reference: <Tv className="w-3.5 h-3.5" />,
};

const KIND_LABEL: Record<NostalgiaFragment['kind'], string> = {
  note: 'Note from Amma',
  audio: 'Sound',
  reference: '90s reference',
};

export const MemoryAlbum: React.FC<MemoryAlbumProps> = ({
  isOpen,
  unlockedIds,
  stats,
  discountUnlocked,
  highlightId,
  onClose,
  onGoToStore,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const unlocked = useMemo(() => new Set(unlockedIds), [unlockedIds]);

  // A clip is fire-and-forget in the audio graph, so the button state is timed
  // to the reported clip length rather than to a real playback event.
  useEffect(() => {
    if (!playingId) return;
    const fragment = FRAGMENTS.find((item) => item.id === playingId);
    if (!fragment?.clip) return;
    const duration = audioEngine.playNostalgiaClip(fragment.clip);
    const timer = window.setTimeout(() => setPlayingId(null), Math.max(duration, 400));
    return () => window.clearTimeout(timer);
  }, [playingId]);

  useEffect(() => {
    if (!isOpen) setPlayingId(null);
  }, [isOpen]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-[var(--ink)]/55 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 95, damping: 19, mass: 1 }}
            className="relative w-full max-w-3xl my-4 kitchen-paper paper-grain hand-edge border-2 border-[var(--ink)] shadow-[var(--shadow-lg)] overflow-hidden"
          >
            <header className="relative z-10 flex items-start justify-between gap-3 px-5 sm:px-7 py-5 border-b-2 border-[var(--ink)]/12">
              <div>
                <span className="text-[11px] font-site-logo uppercase tracking-[0.2em] text-[var(--blue-dark)]">
                  Memory album
                </span>
                <h2 className="mt-1 text-xl sm:text-2xl font-site-display leading-tight">
                  What the ritual brings back
                </h2>
                <p className="mt-1 text-xs text-[var(--ink-l)]">
                  {unlocked.size} of {FRAGMENTS.length} fragments recovered
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                title="Close the album"
                className="shrink-0 p-2 hand-edge-sm border-2 border-[var(--ink)] bg-white text-[var(--ink-m)]"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="relative z-10 px-5 sm:px-7 py-6 space-y-3">
              {FRAGMENTS.map((fragment) => {
                const isUnlocked = unlocked.has(fragment.id);
                const isHighlighted = highlightId === fragment.id;
                const isPlaying = playingId === fragment.id;
                const nearness = requirementProgress(fragment.requirement, stats);

                return (
                  <div
                    key={fragment.id}
                    className={`hand-edge-sm border-2 p-4 sm:p-5 transition-colors ${
                      isUnlocked
                        ? isHighlighted
                          ? 'border-[var(--orange)] bg-[var(--orange-pale)]'
                          : 'border-[var(--ink)] bg-white/85'
                        : 'border-dashed border-[var(--ink)]/35 bg-white/45'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-site-logo uppercase tracking-[0.14em] text-[var(--ink-l)]">
                          {KIND_ICON[fragment.kind]}
                          {KIND_LABEL[fragment.kind]}
                        </span>

                        <h3
                          className={`mt-1 text-base sm:text-lg font-site-display leading-tight ${
                            isUnlocked ? '' : 'text-[var(--ink-l)]'
                          }`}
                        >
                          {isUnlocked ? fragment.title : 'Locked fragment'}
                        </h3>

                        <p className="text-[11px] font-site-logo uppercase tracking-[0.1em] text-[var(--ink-l)]">
                          {isUnlocked ? fragment.era : requirementLabel(fragment.requirement)}
                        </p>
                      </div>

                      {isUnlocked && fragment.clip ? (
                        <button
                          type="button"
                          onClick={() => setPlayingId(isPlaying ? null : fragment.id)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-2 hand-edge-sm border-2 border-[var(--ink)] bg-[var(--blue)] text-white text-xs font-site-logo font-semibold"
                        >
                          {isPlaying ? (
                            <Square className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          {isPlaying ? 'Playing' : 'Listen'}
                        </button>
                      ) : null}

                      {!isUnlocked && (
                        <div className="shrink-0 p-2 hand-edge-sm border-2 border-[var(--ink)]/35 bg-white/60">
                          <Lock className="w-4 h-4 text-[var(--ink-l)]" />
                        </div>
                      )}
                    </div>

                    {isUnlocked ? (
                      <>
                        <p
                          className={`mt-3 leading-relaxed ${
                            fragment.kind === 'note'
                              ? 'text-lg sm:text-xl font-caveat text-[var(--ink)]'
                              : 'text-sm font-site-body text-[var(--ink-m)]'
                          }`}
                        >
                          {fragment.kind === 'note' ? `“${fragment.body}”` : fragment.body}
                        </p>
                        {fragment.signature && (
                          <p className="mt-1.5 text-right text-lg font-caveat text-[var(--ink-m)]">
                            {fragment.signature}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="mt-3 text-sm font-site-body text-[var(--ink-l)] italic">
                          {fragment.teaser}
                        </p>
                        <div className="mt-3 h-1.5 rounded-full bg-[var(--cream-dark)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--ink-l)]"
                            style={{ width: `${Math.round(nearness * 100)}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {/* The business tie-back, kept inside the album so it reads as a reward. */}
              <div
                className={`hand-edge-sm border-2 p-4 sm:p-5 ${
                  discountUnlocked
                    ? 'border-[var(--ink)] bg-[var(--blue-pale)]'
                    : 'border-dashed border-[var(--ink)]/35 bg-white/45'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 text-[10px] font-site-logo uppercase tracking-[0.14em] text-[var(--ink-l)]">
                  <Ticket className="w-3.5 h-3.5" />
                  Reward
                </span>

                <h3
                  className={`mt-1 text-base sm:text-lg font-site-display leading-tight ${
                    discountUnlocked ? '' : 'text-[var(--ink-l)]'
                  }`}
                >
                  {DISCOUNT.percent}% off a real 300ml T box
                </h3>

                {discountUnlocked ? (
                  <>
                    <p className="mt-2 text-sm font-site-body text-[var(--ink-m)]">
                      Amma’s naap earned this one. Use it on the signature kadak box.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="px-4 py-2.5 hand-edge-sm border-2 border-dashed border-[var(--ink)] bg-white font-site-display text-lg tracking-[0.14em]">
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
                      <button
                        type="button"
                        onClick={onGoToStore}
                        className="px-4 py-2.5 hand-edge-sm border-2 border-[var(--ink)] bg-[var(--orange)] text-white text-xs font-site-logo font-semibold"
                      >
                        Use it in the store
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm font-site-body text-[var(--ink-l)] italic">
                    Unlocks at a {DISCOUNT.streakRequirement}-day streak, or with one{' '}
                    {DISCOUNT.scoreRequirement}% cup.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
