'use client';

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Radio, Volume2, VolumeX, X, Album } from 'lucide-react';
import {
  INGREDIENTS,
  INGREDIENT_BY_ID,
  RITUAL_TOTAL,
  buildRound,
  formatAmount,
} from '@/lib/game/scenarios';
import { gradeRound } from '@/lib/game/grading';
import { PourRecord, RoundTarget } from '@/lib/game/types';
import { FRAGMENTS } from '@/lib/game/fragments';
import { DISCOUNT, RoundOutcome, isDiscountUnlocked } from '@/lib/game/progress';
import { useProgress } from '@/lib/game/useProgress';
import { ShareCardData } from '@/lib/game/shareCard';
import { PourStation } from './PourStation';
import { BrewingBeat } from './BrewingBeat';
import { ResultReveal } from './ResultReveal';
import { StreakBadge } from './StreakBadge';
import { MemoryAlbum } from './MemoryAlbum';
import { ShareCardModal } from './ShareCardModal';
import { audioEngine } from '@/lib/game/audioEngine';

interface ChaiGameArenaProps {
  onExitGame: () => void;
  onGoToStore: () => void;
}

type Phase = 'scenario' | 'pouring' | 'brewing' | 'reveal';

interface GameState {
  phase: Phase;
  round: RoundTarget;
  stepIndex: number;
  pours: PourRecord[];
  feedback: string | null;
  /** Identifies the round so progress is only ever committed once for it. */
  roundId: number;
}

type GameAction =
  | { type: 'begin' }
  | { type: 'commit'; poured: number; overflowed: boolean; feedback: string }
  | { type: 'advance' }
  | { type: 'brewed' }
  | { type: 'newRound' };

const EMPTY_POT_COLOR = '#e9e2d6';
const SETTLE_MS = 1150;

function createState(previousScenarioId?: string, previousRoundId = 0): GameState {
  return {
    phase: 'scenario',
    round: buildRound(Math.random, previousScenarioId),
    stepIndex: 0,
    pours: [],
    feedback: null,
    roundId: previousRoundId + 1,
  };
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'begin':
      return { ...state, phase: 'pouring', stepIndex: 0, pours: [], feedback: null };

    case 'commit': {
      const ingredient = INGREDIENTS[state.stepIndex];
      if (!ingredient) return state;
      return {
        ...state,
        feedback: action.feedback,
        pours: [
          ...state.pours,
          {
            id: ingredient.id,
            poured: action.poured,
            target: state.round.targets[ingredient.id],
            overflowed: action.overflowed,
          },
        ],
      };
    }

    case 'advance': {
      const nextIndex = state.stepIndex + 1;
      if (nextIndex >= INGREDIENTS.length) {
        return { ...state, phase: 'brewing', feedback: null };
      }
      return { ...state, stepIndex: nextIndex, feedback: null };
    }

    case 'brewed':
      return { ...state, phase: 'reveal' };

    case 'newRound':
      return createState(state.round.scenario.id, state.roundId);

    default:
      return state;
  }
}

function feedbackFor(poured: number, target: number, tolerance: number, overflowed: boolean) {
  if (overflowed) return 'Ubal gaya! Vessel spilled over.';
  const delta = poured - target;
  if (Math.abs(delta) <= tolerance * 0.35) return 'Bilkul theek. Haath sadha hua hai.';
  if (Math.abs(delta) <= tolerance) return delta > 0 ? 'Zara zyada, par chalega.' : 'Zara kam, par chalega.';
  return delta > 0 ? 'Bahut zyada daal diya, beta.' : 'Itne me kya banega? Kam reh gaya.';
}

export const ChaiGameArena: React.FC<ChaiGameArenaProps> = ({ onExitGame, onGoToStore }) => {
  const [state, dispatch] = useReducer(reducer, undefined, () => createState());
  const [isMuted, setIsMuted] = useState(audioEngine.getMuted());
  const [ambientOn, setAmbientOn] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);

  const { progress, status, nudge, stats, commit } = useProgress();
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [albumHighlight, setAlbumHighlight] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const committedRound = useRef<number | null>(null);

  const ingredient = INGREDIENTS[state.stepIndex];
  const isSettling = state.feedback !== null;

  const pouredTotal = useMemo(
    () => state.pours.reduce((sum, pour) => sum + pour.poured, 0),
    [state.pours],
  );

  const grade = useMemo(
    () =>
      state.pours.length === INGREDIENTS.length ? gradeRound(state.round, state.pours) : null,
    [state.pours, state.round],
  );

  const potColor = useMemo(() => {
    const last = state.pours[state.pours.length - 1];
    if (!last) return EMPTY_POT_COLOR;
    return INGREDIENTS.find((ing) => ing.id === last.id)?.brewColor ?? EMPTY_POT_COLOR;
  }, [state.pours]);

  // Hold the finished pour on screen for a beat before the next vessel comes up.
  useEffect(() => {
    if (!isSettling) return;
    const timer = window.setTimeout(() => dispatch({ type: 'advance' }), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [isSettling, state.pours.length]);

  useEffect(
    () => () => {
      audioEngine.stopPour(false);
      audioEngine.stopAmbient();
    },
    [],
  );

  // A round counts exactly once, however many times this effect is invoked.
  useEffect(() => {
    if (state.phase !== 'reveal' || !grade) return;
    if (committedRound.current === state.roundId) return;
    committedRound.current = state.roundId;
    setOutcome(commit(grade.score));
  }, [state.phase, state.roundId, grade, commit]);

  const shareData = useMemo<ShareCardData | null>(() => {
    if (!grade || !outcome) return null;
    return {
      score: grade.score,
      bandTitle: grade.title,
      verdict: grade.verdict,
      scenarioTitle: state.round.scenario.title,
      brewColor: grade.brewColor,
      streakDay: Math.max(outcome.progress.streak, 1),
      ingredients: grade.ingredientScores.map((item) => ({
        name: INGREDIENT_BY_ID[item.id].name,
        accuracy: item.accuracy,
        within: item.errorRatio <= 1 && !item.overflowed,
        overflowed: item.overflowed,
      })),
      totalPoured: grade.totalPoured,
      discountCode: isDiscountUnlocked(outcome.progress) ? DISCOUNT.code : null,
      dateLabel: new Date().toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };
  }, [grade, outcome, state.round.scenario.title]);

  const handleBrewed = useCallback(() => dispatch({ type: 'brewed' }), []);

  const handleNewRound = useCallback(() => {
    setOutcome(null);
    setShareOpen(false);
    dispatch({ type: 'newRound' });
  }, []);

  const handleOpenAlbum = useCallback((fragmentId?: string) => {
    setAlbumHighlight(fragmentId ?? null);
    setAlbumOpen(true);
  }, []);

  const handleToggleMute = () => setIsMuted(audioEngine.toggleMute());

  const handleToggleAmbient = () => {
    if (ambientOn) {
      audioEngine.stopAmbient();
      setAmbientOn(false);
    } else {
      audioEngine.startAmbient();
      setAmbientOn(true);
    }
  };

  const handleCommitted = (poured: number, overflowed: boolean) => {
    if (!ingredient) return;
    dispatch({
      type: 'commit',
      poured,
      overflowed,
      feedback: feedbackFor(
        poured,
        state.round.targets[ingredient.id],
        state.round.tolerances[ingredient.id],
        overflowed,
      ),
    });
  };

  return (
    <div className="relative min-h-screen w-full kitchen-paper paper-grain text-[var(--ink)] font-site-body flex flex-col">
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-8 py-4 border-b-2 border-[var(--ink)]/12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hand-edge-sm bg-[var(--orange)] text-white font-site-logo font-bold flex items-center justify-center border-2 border-[var(--ink)]">
            300
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-site-display leading-tight">
              The Measurement Ritual
            </h1>
            <p className="text-[11px] font-site-logo uppercase tracking-[0.16em] text-[var(--ink-l)]">
              Pour by feel, not by numbers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StreakBadge progress={progress} status={status} nudge={nudge} variant="compact" />

          <button
            type="button"
            onClick={() => handleOpenAlbum()}
            title="Memory album"
            className="relative p-2 hand-edge-sm border-2 border-[var(--ink)] bg-white text-[var(--ink-m)]"
          >
            <Album className="w-4 h-4" />
            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--blue)] border-2 border-[var(--ink)] text-[9px] font-site-logo font-bold text-white flex items-center justify-center">
              {progress.unlocked.length}
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggleAmbient}
            title={ambientOn ? 'Turn the transistor off' : 'Turn the transistor on'}
            className={`p-2 hand-edge-sm border-2 border-[var(--ink)] transition-colors ${
              ambientOn ? 'bg-[var(--blue)] text-white' : 'bg-white text-[var(--ink-m)]'
            }`}
          >
            <Radio className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="p-2 hand-edge-sm border-2 border-[var(--ink)] bg-white text-[var(--ink-m)]"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleNewRound}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 hand-edge-sm border-2 border-[var(--ink)] bg-white text-xs font-site-logo font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New round
          </button>

          <button
            type="button"
            onClick={onExitGame}
            title="Leave the kitchen"
            className="p-2 hand-edge-sm border-2 border-[var(--ink)] bg-white text-[var(--ink-m)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <AnimatePresence mode="wait">
          {/* --- SCENARIO PROMPT --- */}
          {state.phase === 'scenario' && (
            <motion.section
              key="scenario"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 90, damping: 18, mass: 1.1 }}
            >
              <div className="mb-4">
                <StreakBadge progress={progress} status={status} nudge={nudge} />
              </div>

              <div className="bg-white/80 hand-edge border-2 border-[var(--ink)] p-6 sm:p-9 shadow-[var(--shadow-md)]">
                <span className="inline-block text-[11px] font-site-logo uppercase tracking-[0.2em] text-[var(--blue-dark)]">
                  Today's kitchen
                </span>
                <h2 className="mt-3 text-2xl sm:text-4xl font-site-display leading-[1.15]">
                  {state.round.scenario.title}
                </h2>
                <p className="mt-4 text-lg sm:text-xl font-caveat text-[var(--ink-m)]">
                  “{state.round.scenario.ammaLine}”
                </p>

                <div className="mt-7 pt-5 border-t border-dashed border-[var(--ink)]/25">
                  <p className="text-[11px] font-site-logo uppercase tracking-[0.16em] text-[var(--ink-l)] mb-3">
                    Amma's proportion for this round — {RITUAL_TOTAL} ml total
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {INGREDIENTS.map((ing) => (
                      <div
                        key={ing.id}
                        className="hand-edge-sm border border-[var(--ink)]/25 bg-[var(--cream)] px-3 py-2.5"
                      >
                        <p className="text-[11px] font-site-logo uppercase tracking-[0.1em] text-[var(--ink-l)]">
                          {ing.name}
                        </p>
                        <p className="text-lg font-site-display">
                          {formatAmount(state.round.targets[ing.id])}
                          <span className="text-xs text-[var(--ink-l)] ml-0.5">{ing.unit}</span>
                        </p>
                        <p className="text-[10px] font-site-body text-[var(--ink-l)]">
                          ± {formatAmount(state.round.tolerances[ing.id])}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-[var(--ink-l)]">
                    The proportion shifts with the scenario every round — you can't memorise it.
                    Study it now; while pouring you'll only see the mark on the glass.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dispatch({ type: 'begin' })}
                  className="mt-7 w-full sm:w-auto px-8 py-4 hand-edge border-2 border-[var(--ink)] bg-[var(--orange)] text-white font-site-display text-lg hover:bg-[var(--orange-dark)] transition-colors"
                >
                  Light the stove
                </button>
              </div>
            </motion.section>
          )}

          {/* --- POURING --- */}
          {state.phase === 'pouring' && ingredient && (
            <motion.section
              key="pouring"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 90, damping: 18, mass: 1.1 }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
                <h2 className="text-xl sm:text-2xl font-site-display">
                  {state.round.scenario.title}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowNumbers((value) => !value)}
                  className="text-[11px] font-site-logo uppercase tracking-[0.14em] text-[var(--ink-l)] underline decoration-dotted"
                >
                  {showNumbers ? 'Hide practice numbers' : 'Show practice numbers'}
                </button>
              </div>

              <div className="bg-white/80 hand-edge border-2 border-[var(--ink)] p-5 sm:p-8 shadow-[var(--shadow-md)]">
                <PourStation
                  key={ingredient.id}
                  ingredient={ingredient}
                  target={state.round.targets[ingredient.id]}
                  tolerance={state.round.tolerances[ingredient.id]}
                  potColor={potColor}
                  potFill={pouredTotal / RITUAL_TOTAL}
                  stepIndex={state.stepIndex}
                  stepCount={INGREDIENTS.length}
                  showNumbers={showNumbers}
                  disabled={isSettling}
                  onCommitted={handleCommitted}
                />
              </div>

              <AnimatePresence>
                {state.feedback && (
                  <motion.p
                    key={state.feedback + state.pours.length}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 text-center text-lg font-caveat text-[var(--ink)]"
                  >
                    “{state.feedback}”
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.section>
          )}

          {/* --- BREWING BEAT --- */}
          {state.phase === 'brewing' && (
            <motion.section
              key="brewing"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 90, damping: 18, mass: 1.1 }}
            >
              <BrewingBeat brewColor={grade?.brewColor ?? potColor} onDone={handleBrewed} />
            </motion.section>
          )}

          {/* --- RESULT --- */}
          {state.phase === 'reveal' && grade && outcome && (
            <motion.div key="reveal" exit={{ opacity: 0, y: -12 }}>
              <ResultReveal
                grade={grade}
                scenario={state.round.scenario}
                streakDay={Math.max(outcome.progress.streak, 1)}
                streakEvent={outcome.event}
                brokenFrom={outcome.brokenFrom}
                isPersonalBest={outcome.isPersonalBest}
                newlyUnlocked={outcome.newlyUnlocked}
                unlockedCount={outcome.progress.unlocked.length}
                fragmentTotal={FRAGMENTS.length}
                discountUnlocked={isDiscountUnlocked(outcome.progress)}
                discountJustUnlocked={outcome.discountJustUnlocked}
                onOpenAlbum={handleOpenAlbum}
                onShare={() => setShareOpen(true)}
                onPlayAgain={handleNewRound}
                onGoToStore={onGoToStore}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MemoryAlbum
        isOpen={albumOpen}
        unlockedIds={progress.unlocked}
        stats={stats}
        discountUnlocked={isDiscountUnlocked(progress)}
        highlightId={albumHighlight}
        onClose={() => setAlbumOpen(false)}
        onGoToStore={onGoToStore}
      />

      <ShareCardModal isOpen={shareOpen} data={shareData} onClose={() => setShareOpen(false)} />

      <footer className="relative z-20 px-4 py-4 text-center text-[11px] font-site-logo uppercase tracking-[0.14em] text-[var(--ink-l)] border-t-2 border-[var(--ink)]/12">
        300ml T · Magic of Maa = Magic of Measurement
      </footer>
    </div>
  );
};
