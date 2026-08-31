'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, X } from 'lucide-react';

const SEEN_KEY = 'mlt300:welcome-seen';

export default function GameWelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      // Private mode should still show the choice once this visit.
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const dismiss = () => {
    markSeen();
    setOpen(false);
  };

  const markSeen = () => {
    try {
      window.sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Ignored
    }
  };

  if (!open) return null;

  return (
    <div
      className="game-welcome"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-welcome-title"
    >
      <div className="game-welcome__scrim" onClick={dismiss} aria-hidden />

      <div className="game-welcome__card">
        <button
          type="button"
          className="game-welcome__close"
          onClick={dismiss}
          title="Skip to the website"
          aria-label="Skip to the website"
        >
          <X size={18} />
        </button>

        <img
          src="/game/chai-signature-box.jpg"
          alt=""
          className="game-welcome__photo"
        />

        <div className="game-welcome__body">
          <p className="game-welcome__eyebrow">The Measurement Ritual</p>
          <h2 id="game-welcome-title" className="game-welcome__title">
            Make chai like Amma before you shop
          </h2>
          <p className="game-welcome__copy">
            Hold to pour. Release to stop. See if your naap is still ghar jaisi —
            or skip straight to the 300ml Tea store.
          </p>

          <div className="game-welcome__actions">
            <Link href="/game" className="game-welcome__play" onClick={markSeen}>
              <Flame size={16} />
              Play the game
            </Link>
            <button type="button" className="game-welcome__skip" onClick={dismiss}>
              Skip to the website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
