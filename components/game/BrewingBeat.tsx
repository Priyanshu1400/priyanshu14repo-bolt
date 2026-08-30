'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { audioEngine } from '@/lib/game/audioEngine';

interface BrewingBeatProps {
  brewColor: string;
  durationMs?: number;
  onDone: () => void;
}

const STEAM_PUFFS = [
  { left: '32%', size: 26, delay: 0, drift: -14 },
  { left: '44%', size: 34, delay: 0.5, drift: 10 },
  { left: '56%', size: 30, delay: 1.0, drift: -8 },
  { left: '48%', size: 22, delay: 1.5, drift: 16 },
  { left: '38%', size: 30, delay: 2.1, drift: 6 },
  { left: '60%', size: 24, delay: 2.6, drift: -12 },
];

const BEATS = [
  'Ubaal aane do…',
  'Patti khul rahi hai…',
  'Rang aa raha hai…',
  'Bas ek ubaal aur…',
];

export const BrewingBeat: React.FC<BrewingBeatProps> = ({
  brewColor,
  durationMs = 4400,
  onDone,
}) => {
  const [beatIndex, setBeatIndex] = useState(0);

  useEffect(() => {
    audioEngine.startBoilingSound(0.35);

    const rampUp = window.setTimeout(() => audioEngine.setBoilingIntensity(0.95), 900);
    const whistle = window.setTimeout(
      () => audioEngine.playKettleWhistle(2.1),
      Math.max(durationMs - 2500, 600),
    );
    const finish = window.setTimeout(onDone, durationMs);

    const step = durationMs / BEATS.length;
    const cycle = window.setInterval(
      () => setBeatIndex((index) => Math.min(index + 1, BEATS.length - 1)),
      step,
    );

    return () => {
      window.clearTimeout(rampUp);
      window.clearTimeout(whistle);
      window.clearTimeout(finish);
      window.clearInterval(cycle);
      audioEngine.stopBoilingSound();
    };
  }, [durationMs, onDone]);

  return (
    <div className="bg-white/80 hand-edge border-2 border-[var(--ink)] p-6 sm:p-10 shadow-[var(--shadow-md)] text-center">
      <span className="inline-block text-[11px] font-site-logo uppercase tracking-[0.2em] text-[var(--blue-dark)]">
        On the flame
      </span>

      <div className="relative mx-auto mt-6 w-[260px] h-[240px]">
        {/* Steam — slow, weighted drift rather than a bouncy loop */}
        <div className="absolute inset-x-0 top-0 h-[120px] overflow-hidden pointer-events-none">
          {STEAM_PUFFS.map((puff, index) => (
            <motion.span
              key={index}
              className="absolute bottom-0 rounded-full bg-white"
              style={{ left: puff.left, width: puff.size, height: puff.size, filter: 'blur(7px)' }}
              initial={{ opacity: 0, y: 10, scale: 0.6 }}
              animate={{
                opacity: [0, 0.55, 0.4, 0],
                y: [10, -50, -90, -125],
                x: [0, puff.drift * 0.4, puff.drift, puff.drift * 1.3],
                scale: [0.6, 1.1, 1.5, 1.9],
              }}
              transition={{
                duration: 3.4,
                delay: puff.delay,
                repeat: Infinity,
                ease: [0.25, 0.6, 0.35, 1],
                times: [0, 0.35, 0.7, 1],
              }}
            />
          ))}
        </div>

        {/* Patila with the brew slowly darkening */}
        <div className="absolute bottom-[34px] left-0 right-0 h-[118px]">
          <div className="absolute -top-2 inset-x-0 h-4 rounded-full bg-[#cdc6bd] border-2 border-[var(--ink)]" />
          <div className="absolute inset-0 rounded-b-[46px] border-2 border-t-0 border-[var(--ink)] bg-[#d7d1c8] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-black/12 via-white/25 to-black/16 pointer-events-none" />
            <motion.div
              className="absolute inset-x-0 bottom-0 rounded-b-[44px]"
              initial={{ height: '78%' }}
              animate={{ height: ['78%', '86%', '80%'], backgroundColor: brewColor }}
              transition={{
                height: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
                backgroundColor: { duration: 3.2, ease: 'easeInOut' },
              }}
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-white/35 blur-[1px]" />
              <div className="absolute inset-0 flex items-end justify-around pb-3 px-6 pointer-events-none">
                <span className="w-2.5 h-2.5 rounded-full bg-white/40 animate-bubble" />
                <span className="w-3.5 h-3.5 rounded-full bg-white/30 animate-bubble [animation-delay:0.4s]" />
                <span className="w-2 h-2 rounded-full bg-white/45 animate-bubble [animation-delay:0.9s]" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Flame */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="flex items-end gap-1 animate-flame">
            {Array.from({ length: 7 }).map((_, index) => (
              <span
                key={index}
                className="w-2.5 rounded-full bg-gradient-to-t from-[var(--blue)] via-[#7fd7d3] to-[var(--orange)] blur-[1px]"
                style={{ height: `${16 + Math.sin(index) * 6}px`, animationDelay: `${index * 0.08}s` }}
              />
            ))}
          </div>
          <div className="mt-0.5 h-2.5 w-32 rounded-full bg-[var(--ink)]/80" />
        </div>
      </div>

      <motion.p
        key={beatIndex}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mt-6 text-xl sm:text-2xl font-caveat text-[var(--ink-m)]"
      >
        {BEATS[beatIndex]}
      </motion.p>

      <div className="mt-4 mx-auto h-1 w-48 rounded-full bg-[var(--line)] overflow-hidden">
        <motion.div
          className="h-full bg-[var(--orange)]"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: durationMs / 1000, ease: 'linear' }}
        />
      </div>
    </div>
  );
};
