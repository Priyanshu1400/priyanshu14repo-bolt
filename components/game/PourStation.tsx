'use client';

import React, { useRef } from 'react';
import { motion, useMotionValueEvent, useSpring, useTransform } from 'motion/react';
import { IngredientDef } from '@/lib/game/types';
import { RITUAL_TOTAL, capacityFor, formatAmount } from '@/lib/game/scenarios';
import { useHoldPour } from '@/lib/game/useHoldPour';
import { audioEngine } from '@/lib/game/audioEngine';

/**
 * The stage is laid out in fixed pixels so the vessel lip, the falling stream and the
 * liquid surface stay locked together. The vessel rotates about its own lip.
 */
const STAGE = {
  width: 296,
  height: 300,
  potWidth: 260,
  potHeight: 118,
  potLeft: 18,
  vesselSize: 96,
  vesselLeft: 34,
  streamTop: 88,
};
const LIP_X = STAGE.vesselLeft + STAGE.vesselSize;
const LIQUID_TOP = STAGE.height - STAGE.potHeight + 2;
const LIQUID_HEIGHT = STAGE.potHeight - 4;
const MAX_POT_FILL = 0.96;

interface PourStationProps {
  ingredient: IngredientDef;
  target: number;
  tolerance: number;
  potColor: string;
  /** How full the pot already is from committed pours, 0..1 of the 300ml ritual. */
  potFill: number;
  stepIndex: number;
  stepCount: number;
  showNumbers: boolean;
  disabled?: boolean;
  onCommitted: (amount: number, overflowed: boolean) => void;
}

const VesselArt: React.FC<{ ingredient: IngredientDef }> = ({ ingredient }) => {
  const ink = '#1a1410';

  if (ingredient.id === 'water') {
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
        <path
          d="M28 52 C26 88, 44 104, 60 104 C77 104, 95 88, 92 52 Z"
          fill="#dfe6e6"
          stroke={ink}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M24 50 C40 43, 80 43, 96 50 C80 57, 40 57, 24 50 Z" fill="#eef2f2" stroke={ink} strokeWidth="2.5" />
        <path d="M38 66 C42 80, 48 88, 56 92" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (ingredient.id === 'milk') {
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
        <path
          d="M30 44 L34 100 C34 106, 40 110, 60 110 C80 110, 86 106, 86 100 L90 44 Z"
          fill="#f4efe6"
          stroke={ink}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M26 42 C42 36, 78 36, 94 42 C78 49, 42 49, 26 42 Z" fill="#fdfaf4" stroke={ink} strokeWidth="2.5" />
        <path d="M90 54 C104 58, 106 72, 98 80" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M42 62 C44 78, 48 90, 54 96" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (ingredient.id === 'tea') {
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
        <path
          d="M34 26 L86 24 L90 96 C90 102, 78 106, 60 106 C42 106, 30 102, 30 96 Z"
          fill="#e2d4c2"
          stroke={ink}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M32 40 L88 38" stroke={ink} strokeWidth="2" strokeDasharray="5 4" />
        <text x="60" y="72" textAnchor="middle" fontSize="17" fontWeight="700" fill="#c46a1c" fontFamily="Space Grotesk, sans-serif">
          300
        </text>
        <path d="M34 26 L44 18 L56 26 L68 18 L80 26 L86 24" fill="none" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
      <path
        d="M32 50 L34 96 C34 102, 42 106, 60 106 C78 106, 86 102, 86 96 L88 50 Z"
        fill="#d9bb8e"
        stroke={ink}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M28 48 C44 42, 76 42, 92 48 C76 54, 44 54, 28 48 Z" fill="#e8d2ae" stroke={ink} strokeWidth="2.5" />
      <circle cx="52" cy="72" r="4" fill="#a5651f" opacity="0.7" />
      <circle cx="68" cy="82" r="3" fill="#a5651f" opacity="0.6" />
    </svg>
  );
};

export const PourStation: React.FC<PourStationProps> = ({
  ingredient,
  target,
  tolerance,
  potColor,
  potFill,
  stepIndex,
  stepCount,
  showNumbers,
  disabled = false,
  onCommitted,
}) => {
  const capacity = capacityFor(ingredient);
  const liveReadoutRef = useRef<HTMLSpanElement>(null);
  const soundFrameRef = useRef(0);

  const { amount, flow, isPouring, bind } = useHoldPour({
    ingredient,
    capacity,
    disabled,
    onStart: () => audioEngine.startPour(ingredient.soundKind),
    onFlow: (_poured, flowRatio) => {
      // The Web Audio ramps don't need 60 updates a second.
      soundFrameRef.current += 1;
      if (soundFrameRef.current % 4 === 0) {
        audioEngine.setPourIntensity(flowRatio);
      }
    },
    onRelease: (poured, overflowed) => {
      audioEngine.stopPour(true);
      onCommitted(poured, overflowed);
    },
  });

  const fillHeight = useTransform(amount, (value) => `${Math.min((value / capacity) * 100, 100)}%`);
  const tiltTarget = useTransform(flow, [0, 1], [0, -42]);
  const tilt = useSpring(tiltTarget, { stiffness: 90, damping: 15, mass: 1.3 });
  const streamOpacity = useTransform(flow, [0, 0.12, 1], [0, 0.75, 1]);
  const streamWidth = useTransform(
    flow,
    [0, 1],
    [ingredient.streamWidth * 0.4, ingredient.streamWidth],
  );

  // The pot rises live as the stream lands in it, and the stream is drawn down to
  // whatever the current liquid surface is.
  const liveFill = useTransform(amount, (value) =>
    Math.min(potFill + value / RITUAL_TOTAL, MAX_POT_FILL),
  );
  const potLiquidHeight = useTransform(liveFill, (value) => `${value * 100}%`);
  const surfaceY = useTransform(liveFill, (value) => LIQUID_TOP + LIQUID_HEIGHT * (1 - value));
  const streamHeight = useTransform(surfaceY, (value) => Math.max(value - STAGE.streamTop, 8));
  const rippleY = useSpring(surfaceY, { stiffness: 60, damping: 20, mass: 1.4 });

  useMotionValueEvent(amount, 'change', (value) => {
    if (liveReadoutRef.current) {
      liveReadoutRef.current.textContent = formatAmount(value);
    }
  });

  const markBottom = (target / capacity) * 100;
  const bandBottom = (Math.max(target - tolerance, 0) / capacity) * 100;
  const bandHeight = (Math.min(tolerance * 2, capacity) / capacity) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-site-logo font-semibold uppercase tracking-[0.18em] text-[var(--ink-l)]">
            Step {stepIndex + 1} of {stepCount}
          </span>
          <span className="h-3 w-px bg-[var(--line)]" />
          <span className="text-[11px] font-site-logo uppercase tracking-[0.14em] text-[var(--ink-l)]">
            {ingredient.vessel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: stepCount }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index < stepIndex
                  ? 'w-5 bg-[var(--blue)]'
                  : index === stepIndex
                    ? 'w-8 bg-[var(--orange)]'
                    : 'w-5 bg-[var(--line)]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_auto] gap-4 sm:gap-8 items-end">
        {/* Vessel, falling stream and the pot it lands in — one fixed-geometry stage */}
        <div className="flex justify-center">
          <div
            className="relative origin-bottom scale-[0.82] sm:scale-100"
            style={{ width: STAGE.width, height: STAGE.height }}
          >
            {/* Patila */}
            <div
              className="absolute bottom-0"
              style={{ left: STAGE.potLeft, width: STAGE.potWidth, height: STAGE.potHeight }}
            >
              <div className="absolute -top-2 inset-x-0 h-4 rounded-full bg-[#cdc6bd] border-2 border-[var(--ink)]" />
              <div className="absolute inset-0 rounded-b-[46px] border-2 border-t-0 border-[var(--ink)] bg-[#d7d1c8] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-black/12 via-white/25 to-black/16 pointer-events-none" />

                <motion.div
                  className="absolute inset-x-0 bottom-0 rounded-b-[44px]"
                  style={{ height: potLiquidHeight }}
                  animate={{ backgroundColor: potColor }}
                  transition={{ duration: 1.1, ease: 'easeInOut' }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-white/40 blur-[1px]" />
                </motion.div>
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-2 w-[70%] rounded-full bg-[var(--ink)]/70" />
            </div>

            {/* Vessel — rotates about its own lip */}
            <motion.div
              className="absolute top-0 origin-bottom-right"
              style={{
                left: STAGE.vesselLeft,
                width: STAGE.vesselSize,
                height: STAGE.vesselSize,
                rotate: tilt,
              }}
            >
              <VesselArt ingredient={ingredient} />
            </motion.div>

            {/* The stream falls from the lip to the current liquid surface */}
            <motion.div
              className="absolute z-10 pointer-events-none -translate-x-1/2"
              style={{ left: LIP_X, top: STAGE.streamTop, opacity: streamOpacity }}
            >
              <motion.div
                className="animate-stream rounded-full origin-top"
                style={{
                  width: streamWidth,
                  height: streamHeight,
                  backgroundColor: ingredient.streamColor,
                  filter: 'blur(0.4px)',
                }}
              />
            </motion.div>

            {/* Ripple rings sit exactly where the stream meets the liquid */}
            {isPouring && (
              <motion.div
                className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{ left: LIP_X, top: rippleY }}
              >
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block w-12 h-2.5 rounded-full bg-white/60 animate-ripple" />
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block w-16 h-3 rounded-full bg-white/35 animate-ripple"
                  style={{ animationDelay: '0.35s' }}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Measuring glass — chalk ticks, this round's target mark, live fill */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-16 sm:w-20 h-52 sm:h-60 rounded-b-2xl rounded-t-md border-2 border-[var(--ink)] bg-white/55 overflow-hidden hand-edge-sm">
            <div className="absolute inset-0 chalk-tick opacity-60 pointer-events-none" />

            {/* Amma's tolerance band for this round */}
            <div
              className="absolute inset-x-0 bg-[var(--blue)]/22 border-y border-dashed border-[var(--blue)]/70 pointer-events-none"
              style={{ bottom: `${bandBottom}%`, height: `${bandHeight}%` }}
            />
            <div
              className="absolute inset-x-0 flex items-center pointer-events-none"
              style={{ bottom: `${markBottom}%` }}
            >
              <span className="h-[2.5px] w-full bg-[var(--orange)] -rotate-[0.8deg]" />
            </div>

            <motion.div
              className="absolute inset-x-0 bottom-0"
              style={{ height: fillHeight, backgroundColor: ingredient.streamColor, opacity: 0.85 }}
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-white/60" />
            </motion.div>
          </div>

          <div className="text-center leading-tight">
            {showNumbers ? (
              <p className="text-xs font-site-logo font-semibold text-[var(--ink)]">
                <span ref={liveReadoutRef}>0</span>
                <span className="text-[var(--ink-l)]"> / {formatAmount(target)} {ingredient.unit}</span>
              </p>
            ) : (
              <p className="text-[11px] font-site-logo uppercase tracking-[0.14em] text-[var(--ink-l)]">
                Fill to the mark
              </p>
            )}
          </div>
        </div>
      </div>

      {/* The hold control */}
      <div className="mt-6">
        <motion.button
          type="button"
          {...bind}
          disabled={disabled}
          aria-label={`Press and hold to pour ${ingredient.name}`}
          className={`w-full touch-none select-none rounded-2xl hand-edge border-2 border-[var(--ink)] px-6 py-5 text-left transition-colors ${
            disabled
              ? 'bg-[var(--cream-dark)] cursor-default opacity-70'
              : isPouring
                ? 'bg-[var(--orange)] text-white cursor-grabbing'
                : 'bg-white hover:bg-[var(--orange-pale)] cursor-pointer'
          }`}
          animate={{ scale: isPouring ? 0.985 : 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.9 }}
        >
          <span className="block text-lg sm:text-xl font-site-display">
            {isPouring ? `Pouring ${ingredient.name}…` : `Pour the ${ingredient.name}`}
          </span>
          <span
            className={`block mt-0.5 text-xs font-site-body ${
              isPouring ? 'text-white/85' : 'text-[var(--ink-m)]'
            }`}
          >
            {isPouring ? 'Let go when it reaches the mark' : 'Press and hold — release to stop'}
          </span>
        </motion.button>

        <p className="mt-3 text-base font-caveat text-[var(--ink-m)] leading-snug">
          “{ingredient.ammaTip}”
        </p>
      </div>
    </div>
  );
};
