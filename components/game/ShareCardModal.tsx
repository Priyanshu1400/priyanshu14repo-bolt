'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Download, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import {
  ShareCardData,
  canvasToBlob,
  downloadBlob,
  renderShareCard,
  shareCardImage,
} from '@/lib/game/shareCard';
import { audioEngine } from '@/lib/game/audioEngine';

interface ShareCardModalProps {
  isOpen: boolean;
  data: ShareCardData | null;
  onClose: () => void;
}

type Status = 'idle' | 'rendering' | 'ready' | 'failed';

function captionFor(data: ShareCardData) {
  return `${data.score}% — ${data.bandTitle}. Day ${data.streakDay} of making chai like Amma. 300ml T · The Measurement Ritual`;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({ isOpen, data, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const build = useCallback(async (cardData: ShareCardData) => {
    setStatus('rendering');
    setNote(null);
    try {
      const canvas = await renderShareCard(cardData);
      canvasRef.current = canvas;
      setPreview(canvas.toDataURL('image/png'));
      setStatus('ready');
    } catch {
      canvasRef.current = null;
      setPreview(null);
      setStatus('failed');
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !data) return;
    void build(data);
  }, [isOpen, data, build]);

  useEffect(() => {
    if (isOpen) return;
    setPreview(null);
    setStatus('idle');
    setNote(null);
    setCopied(false);
    canvasRef.current = null;
  }, [isOpen]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const filename = data ? `300mlt-chai-${data.score}-day-${data.streakDay}.png` : '300mlt-chai.png';

  const handleShare = async () => {
    if (!canvasRef.current || !data || busy) return;
    setBusy(true);
    const outcome = await shareCardImage(canvasRef.current, {
      filename,
      title: '300ml T · The Measurement Ritual',
      text: captionFor(data),
    });
    setBusy(false);

    if (outcome === 'shared') {
      audioEngine.playChime(700);
      setNote('Shared.');
    } else if (outcome === 'downloaded') {
      audioEngine.playChime(660);
      setNote('Your device can’t share files directly, so the card was saved instead.');
    } else if (outcome === 'cancelled') {
      setNote(null);
    } else {
      setNote('Sharing failed. Try saving the card instead.');
    }
  };

  const handleDownload = async () => {
    if (!canvasRef.current || busy) return;
    setBusy(true);
    const blob = await canvasToBlob(canvasRef.current);
    setBusy(false);
    if (!blob || !downloadBlob(blob, filename)) {
      setNote('Could not save the card on this device.');
      return;
    }
    audioEngine.playChime(620);
    setNote('Saved to your downloads.');
  };

  const handleCopyCaption = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(captionFor(data));
      setCopied(true);
    } catch {
      setNote('Clipboard is blocked in this browser.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && data && (
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
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 95, damping: 19, mass: 1 }}
            className="relative w-full max-w-md my-4 kitchen-paper paper-grain hand-edge border-2 border-[var(--ink)] shadow-[var(--shadow-lg)] overflow-hidden"
          >
            <header className="relative z-10 flex items-start justify-between gap-3 px-5 py-4 border-b-2 border-[var(--ink)]/12">
              <div>
                <span className="text-[11px] font-site-logo uppercase tracking-[0.2em] text-[var(--blue-dark)]">
                  Share your cup
                </span>
                <h2 className="mt-0.5 text-lg font-site-display leading-tight">
                  Today’s chai, on paper
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="shrink-0 p-2 hand-edge-sm border-2 border-[var(--ink)] bg-white text-[var(--ink-m)]"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="relative z-10 p-5">
              <div className="hand-edge-sm border-2 border-[var(--ink)] bg-white/70 overflow-hidden aspect-[4/5] flex items-center justify-center">
                {status === 'ready' && preview ? (
                  <img
                    src={preview}
                    alt={`Result card: ${data.score}% ${data.bandTitle}`}
                    className="w-full h-full object-contain"
                  />
                ) : status === 'failed' ? (
                  <div className="text-center px-6">
                    <p className="text-sm font-site-body text-[var(--ink-m)]">
                      The card couldn’t be drawn in this browser.
                    </p>
                    <button
                      type="button"
                      onClick={() => data && build(data)}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 hand-edge-sm border-2 border-[var(--ink)] bg-white text-xs font-site-logo font-semibold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[var(--ink-l)]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[11px] font-site-logo uppercase tracking-[0.14em]">
                      Drawing the card
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  disabled={status !== 'ready' || busy}
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 hand-edge border-2 border-[var(--ink)] bg-[var(--orange)] text-white font-site-display disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  Share this cup
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={status !== 'ready' || busy}
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 px-4 py-3 hand-edge-sm border-2 border-[var(--ink)] bg-white text-xs font-site-logo font-semibold disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Save PNG
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="flex items-center justify-center gap-2 px-4 py-3 hand-edge-sm border-2 border-[var(--ink)] bg-white text-xs font-site-logo font-semibold"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-[var(--blue-dark)]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? 'Copied' : 'Copy caption'}
                  </button>
                </div>
              </div>

              {note && (
                <p className="mt-3 text-xs font-site-body text-[var(--ink-m)] text-center">{note}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
