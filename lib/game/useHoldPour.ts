'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMotionValue, MotionValue } from 'motion/react';
import { IngredientDef } from './types';

interface HoldPourOptions {
  ingredient: IngredientDef;
  capacity: number;
  disabled?: boolean;
  onStart?: () => void;
  /** Called every frame while pouring — used to drive the pour sound, never React state. */
  onFlow?: (amount: number, flowRatio: number) => void;
  onRelease: (amount: number, overflowed: boolean) => void;
}

export interface HoldPourBinding {
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
  onContextMenu: (event: React.MouseEvent<HTMLElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  onKeyUp: (event: React.KeyboardEvent<HTMLElement>) => void;
}

export interface HoldPourState {
  /** Live poured amount. Updated per frame off the React render path. */
  amount: MotionValue<number>;
  /** Live flow rate as a fraction of full flow, for stream thickness. */
  flow: MotionValue<number>;
  isPouring: boolean;
  bind: HoldPourBinding;
}

/** Heavy vessels ease into full flow instead of snapping on. */
function smoothstep(p: number) {
  const c = Math.min(Math.max(p, 0), 1);
  return c * c * (3 - 2 * c);
}

/**
 * Poured volume as a closed-form integral of the flow curve, so the amount depends only
 * on how long the player held — never on how many frames the device managed to render.
 */
function pouredBy(elapsedSeconds: number, rate: number, rampSeconds: number) {
  if (elapsedSeconds <= 0) return 0;
  if (elapsedSeconds <= rampSeconds) {
    const u = elapsedSeconds / rampSeconds;
    return rate * rampSeconds * (Math.pow(u, 3) - Math.pow(u, 4) / 2);
  }
  return rate * (rampSeconds * 0.5 + (elapsedSeconds - rampSeconds));
}

/** Drops that keep falling after the vessel is lifted away. */
const TAIL_SECONDS = 0.06;

export function useHoldPour({
  ingredient,
  capacity,
  disabled = false,
  onStart,
  onFlow,
  onRelease,
}: HoldPourOptions): HoldPourState {
  const amount = useMotionValue(0);
  const flow = useMotionValue(0);
  const [isPouring, setIsPouring] = useState(false);

  const pouringRef = useRef(false);
  const doneRef = useRef(false);
  const amountRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  // Keep the latest callbacks without restarting the pour loop.
  const callbacks = useRef({ onStart, onFlow, onRelease });
  callbacks.current = { onStart, onFlow, onRelease };

  const stopLoop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const release = useCallback(() => {
    if (!pouringRef.current) return;
    pouringRef.current = false;
    stopLoop();

    // Measure the hold at the instant of release rather than at the last rendered frame.
    const elapsed = (performance.now() - startedAtRef.current) / 1000;
    const rampSeconds = ingredient.rampMs / 1000;
    const tail = ingredient.rate * smoothstep(elapsed / rampSeconds) * TAIL_SECONDS;
    const finalAmount = Math.min(
      pouredBy(elapsed, ingredient.rate, rampSeconds) + tail,
      capacity,
    );
    amountRef.current = finalAmount;
    amount.set(finalAmount);
    flow.set(0);

    setIsPouring(false);
    doneRef.current = true;
    callbacks.current.onRelease(finalAmount, finalAmount >= capacity);
  }, [amount, capacity, flow, ingredient.rampMs, ingredient.rate, stopLoop]);

  const tick = useCallback(
    (now: number) => {
      if (!pouringRef.current) return;

      const elapsed = (now - startedAtRef.current) / 1000;
      const rampSeconds = ingredient.rampMs / 1000;

      const flowRatio = smoothstep(elapsed / rampSeconds);
      flow.set(flowRatio);

      amountRef.current = Math.min(pouredBy(elapsed, ingredient.rate, rampSeconds), capacity);
      amount.set(amountRef.current);
      callbacks.current.onFlow?.(amountRef.current, flowRatio);

      if (amountRef.current >= capacity) {
        release();
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    },
    [amount, capacity, flow, ingredient.rampMs, ingredient.rate, release],
  );

  const start = useCallback(() => {
    if (disabled || pouringRef.current || doneRef.current) return;

    pouringRef.current = true;
    amountRef.current = 0;
    amount.set(0);
    flow.set(0);
    startedAtRef.current = performance.now();

    setIsPouring(true);
    callbacks.current.onStart?.();
    frameRef.current = requestAnimationFrame(tick);
  }, [amount, disabled, flow, tick]);

  // A pointer released off-target, or a backgrounded tab, must still end the pour.
  useEffect(() => {
    const handleGlobalRelease = () => release();
    const handleVisibility = () => {
      if (document.hidden) release();
    };
    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('blur', handleGlobalRelease);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('blur', handleGlobalRelease);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [release]);

  useEffect(() => stopLoop, [stopLoop]);

  const bind: HoldPourBinding = {
    onPointerDown: (event) => {
      event.preventDefault();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is best-effort; the global listener is the safety net.
      }
      start();
    },
    onPointerUp: () => release(),
    onPointerCancel: () => release(),
    onContextMenu: (event) => event.preventDefault(),
    onKeyDown: (event) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (event.repeat) return;
      start();
    },
    onKeyUp: (event) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      release();
    },
  };

  return { amount, flow, isPouring, bind };
}
