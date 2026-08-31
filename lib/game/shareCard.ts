/**
 * Renders the shareable result card on a canvas. The card is drawn rather than
 * screenshotted so it keeps the site's type and paper texture at a size that
 * survives WhatsApp and Instagram compression (1080 x 1350).
 */

export interface ShareCardIngredient {
  name: string;
  accuracy: number;
  within: boolean;
  overflowed: boolean;
}

export interface ShareCardData {
  score: number;
  bandTitle: string;
  verdict: string;
  scenarioTitle: string;
  brewColor: string;
  streakDay: number;
  ingredients: ShareCardIngredient[];
  totalPoured: number;
  discountCode?: string | null;
  dateLabel: string;
}

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;

const FALLBACK = {
  orange: '#e07d26',
  orangeDark: '#c46a1c',
  orangePale: '#fdf0e6',
  blue: '#00a59f',
  blueDark: '#008a85',
  bluePale: '#e0f5f3',
  cream: '#faf6f1',
  creamDark: '#f0e8e0',
  ink: '#1a1410',
  inkMid: '#4a3f36',
  inkLight: '#8a7d70',
};

/** Reads a live brand token so the card follows the colour customiser. */
function token(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!value || value.startsWith('var(')) return fallback;
    return value;
  } catch {
    return fallback;
  }
}

const DISPLAY = '"Dela Gothic One", "Playfair Display", serif';
const LOGO = '"Space Grotesk", "Inter", sans-serif';
const HAND = '"Caveat", cursive';
const BODY = '"Inter", system-ui, sans-serif';

export async function ensureShareCardFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.allSettled([
      document.fonts.load(`400 200px ${DISPLAY}`),
      document.fonts.load(`600 28px ${LOGO}`),
      document.fonts.load(`700 46px ${HAND}`),
      document.fonts.load(`400 26px ${BODY}`),
    ]);
    await document.fonts.ready;
  } catch {
    // Falling back to system type is acceptable; the card still renders.
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radii: [number, number, number, number],
) {
  const [tl, tr, br, bl] = radii;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + width - tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + tr);
  ctx.lineTo(x + width, y + height - br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
  ctx.lineTo(x + bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

function pill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  roundedRect(ctx, x, y, width, height, [height / 2, height / 2, height / 2, height / 2]);
}

/** Same fractal-ish grain the pages carry, tiled so it stays cheap. */
function paintGrain(ctx: CanvasRenderingContext2D) {
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const tileCtx = tile.getContext('2d');
  if (!tileCtx) return;

  const image = tileCtx.createImageData(tile.width, tile.height);
  for (let index = 0; index < image.data.length; index += 4) {
    const value = 120 + Math.random() * 135;
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }
  tileCtx.putImageData(image, 0, 0);

  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;

  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }

  if (lines.length < maxLines && current) lines.push(current);

  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (last.length > 4 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    if (ctx.measureText(lines[maxLines - 1]).width > maxWidth) lines[maxLines - 1] = `${last}…`;
  }

  return lines;
}

function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
) {
  let cursor = x;
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + spacing;
  }
  return cursor - spacing - x;
}

function trackedWidth(ctx: CanvasRenderingContext2D, text: string, spacing: number) {
  let width = 0;
  for (const char of text) width += ctx.measureText(char).width + spacing;
  return Math.max(0, width - spacing);
}

/** The cutting-chai glass, filled with the colour the player actually brewed. */
function drawGlass(ctx: CanvasRenderingContext2D, x: number, y: number, brewColor: string) {
  const ink = token('--ink', FALLBACK.ink);
  const topWidth = 150;
  const bottomWidth = 112;
  const height = 200;

  const path = new Path2D();
  path.moveTo(x - topWidth / 2, y);
  path.lineTo(x + topWidth / 2, y);
  path.lineTo(x + bottomWidth / 2, y + height);
  path.quadraticCurveTo(x, y + height + 16, x - bottomWidth / 2, y + height);
  path.closePath();

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fill(path);

  ctx.clip(path);
  const fillHeight = height * 0.8;
  ctx.fillStyle = brewColor;
  ctx.fillRect(x - topWidth, y + height - fillHeight, topWidth * 2, fillHeight + 24);

  // Cream line where the chai meets air, then a highlight down the glass.
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.fillRect(x - topWidth, y + height - fillHeight, topWidth * 2, 9);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(x - topWidth / 2 + 20, y, 6, height);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 5;
  ctx.stroke(path);

  // Saucer.
  ctx.beginPath();
  ctx.ellipse(x, y + height + 30, 104, 15, 0, 0, Math.PI * 2);
  ctx.fillStyle = FALLBACK.creamDark;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export async function renderShareCard(data: ShareCardData): Promise<HTMLCanvasElement> {
  await ensureShareCardFonts();

  const canvas = document.createElement('canvas');
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const orange = token('--orange', FALLBACK.orange);
  const blue = token('--blue', FALLBACK.blue);
  const blueDark = token('--blue-dark', FALLBACK.blueDark);
  const ink = token('--ink', FALLBACK.ink);
  const inkMid = token('--ink-m', FALLBACK.inkMid);
  const inkLight = token('--ink-l', FALLBACK.inkLight);

  // --- Paper ---
  ctx.fillStyle = FALLBACK.cream;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  const warm = ctx.createRadialGradient(190, 0, 0, 190, 0, 900);
  warm.addColorStop(0, 'rgba(224,125,38,0.16)');
  warm.addColorStop(1, 'rgba(224,125,38,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  const cool = ctx.createRadialGradient(980, 90, 0, 980, 90, 760);
  cool.addColorStop(0, 'rgba(0,165,159,0.13)');
  cool.addColorStop(1, 'rgba(0,165,159,0)');
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  const base = ctx.createRadialGradient(540, SHARE_CARD_HEIGHT, 0, 540, SHARE_CARD_HEIGHT, 720);
  base.addColorStop(0, 'rgba(26,20,16,0.1)');
  base.addColorStop(1, 'rgba(26,20,16,0)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  paintGrain(ctx);

  // --- Hand-drawn frame ---
  ctx.strokeStyle = ink;
  ctx.lineWidth = 6;
  roundedRect(ctx, 34, 34, SHARE_CARD_WIDTH - 68, SHARE_CARD_HEIGHT - 68, [40, 54, 36, 50]);
  ctx.stroke();

  // --- Masthead ---
  const logoX = 88;
  const logoY = 92;
  ctx.fillStyle = orange;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 5;
  roundedRect(ctx, logoX, logoY, 104, 104, [26, 34, 22, 30]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `400 44px ${DISPLAY}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText('300', logoX + 52, logoY + 56);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = ink;
  ctx.font = `400 46px ${DISPLAY}`;
  ctx.fillText('300ml T', logoX + 132, logoY + 48);

  ctx.fillStyle = blueDark;
  ctx.font = `600 22px ${LOGO}`;
  drawTracked(ctx, 'THE MEASUREMENT RITUAL', logoX + 134, logoY + 86, 4.2);

  ctx.strokeStyle = 'rgba(26,20,16,0.28)';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(88, 250);
  ctx.lineTo(SHARE_CARD_WIDTH - 88, 250);
  ctx.stroke();
  ctx.setLineDash([]);

  /**
   * The bottom of the card is anchored (footer, reward chip, streak ribbon, then
   * the bars above them) while the hero block flows from the top, so a long
   * verdict or a two-line scenario can never push anything off the paper.
   */
  const MARGIN = 88;
  const CONTENT_WIDTH = SHARE_CARD_WIDTH - MARGIN * 2;
  /** The glass sits at the right of the hero block, so hero text stops short of it. */
  const HERO_WIDTH = 640;
  const footerBaseline = 1288;
  const chipHeight = 76;
  const ribbonHeight = 88;
  const rowGap = 54;

  const chipY = data.discountCode ? footerBaseline - 46 - chipHeight : null;
  const ribbonBottom = chipY !== null ? chipY - 18 : footerBaseline - 46;
  const ribbonY = ribbonBottom - ribbonHeight;
  const barsBlockHeight = data.ingredients.length * rowGap + 40;
  const barsTop = ribbonY - 48 - barsBlockHeight;

  // --- Scenario + score ---
  ctx.fillStyle = blueDark;
  ctx.font = `600 22px ${LOGO}`;
  const scenarioLines = wrapText(ctx, data.scenarioTitle.toUpperCase(), HERO_WIDTH, 2);
  scenarioLines.forEach((line, index) => {
    drawTracked(ctx, line, MARGIN, 312 + index * 34, 3.2);
  });
  const scenarioBottom = 312 + (scenarioLines.length - 1) * 34;

  ctx.fillStyle = ink;
  ctx.font = `400 140px ${DISPLAY}`;
  const scoreBaseline = scenarioBottom + 132;
  const scoreText = `${data.score}`;
  ctx.fillText(scoreText, MARGIN - 4, scoreBaseline);
  const scoreWidth = ctx.measureText(scoreText).width;
  ctx.font = `400 62px ${DISPLAY}`;
  ctx.fillText('%', MARGIN + 4 + scoreWidth, scoreBaseline);

  ctx.fillStyle = data.score >= 90 ? blueDark : data.score >= 75 ? FALLBACK.orangeDark : inkMid;
  ctx.font = `400 48px ${DISPLAY}`;
  const titleLines = wrapText(ctx, data.bandTitle, HERO_WIDTH, 2);
  titleLines.forEach((line, index) => {
    ctx.fillText(line, MARGIN, scoreBaseline + 72 + index * 54);
  });
  const titleBottom = scoreBaseline + 72 + (titleLines.length - 1) * 54;

  ctx.fillStyle = inkMid;
  ctx.font = `700 38px ${HAND}`;
  const verdictBaseline = titleBottom + 48;
  const verdictRoom = Math.floor((barsTop - 56 - verdictBaseline) / 44) + 1;
  const verdictLines = wrapText(
    ctx,
    `“${data.verdict}”`,
    HERO_WIDTH,
    Math.min(3, Math.max(1, verdictRoom)),
  );
  verdictLines.forEach((line, index) => {
    ctx.fillText(line, MARGIN, verdictBaseline + index * 44);
  });

  drawGlass(ctx, 858, 300, data.brewColor);

  // --- Per-ingredient accuracy ---
  ctx.strokeStyle = 'rgba(26,20,16,0.28)';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(MARGIN, barsTop - 40);
  ctx.lineTo(SHARE_CARD_WIDTH - MARGIN, barsTop - 40);
  ctx.stroke();
  ctx.setLineDash([]);

  const trackX = 320;
  const trackWidth = 540;
  data.ingredients.forEach((item, index) => {
    const y = barsTop + index * rowGap;

    ctx.fillStyle = ink;
    ctx.font = `600 26px ${LOGO}`;
    ctx.fillText(item.name, MARGIN, y + 8);

    ctx.fillStyle = FALLBACK.creamDark;
    pill(ctx, trackX, y - 14, trackWidth, 22);
    ctx.fill();

    const barColor = item.overflowed ? '#b3261e' : item.within ? blue : orange;
    const width = Math.max(10, Math.round(trackWidth * Math.min(Math.max(item.accuracy, 0), 1)));
    ctx.fillStyle = barColor;
    pill(ctx, trackX, y - 14, width, 22);
    ctx.fill();

    ctx.fillStyle = barColor;
    ctx.font = `600 26px ${LOGO}`;
    ctx.textAlign = 'right';
    ctx.fillText(
      item.overflowed ? 'spill' : `${Math.round(item.accuracy * 100)}%`,
      SHARE_CARD_WIDTH - MARGIN,
      y + 8,
    );
    ctx.textAlign = 'left';
  });

  ctx.fillStyle = inkLight;
  ctx.font = `400 23px ${BODY}`;
  ctx.fillText(
    `${Math.round(data.totalPoured)} ml in the patila · ${data.dateLabel}`,
    MARGIN,
    barsTop + (data.ingredients.length - 1) * rowGap + 46,
  );

  // --- Streak ribbon ---
  ctx.fillStyle = blue;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 5;
  roundedRect(ctx, MARGIN, ribbonY, CONTENT_WIDTH, ribbonHeight, [22, 30, 20, 28]);
  ctx.fill();
  ctx.stroke();

  const streakText = `DAY ${data.streakDay} OF MAKING CHAI LIKE AMMA`;
  const streakTracking = 2;
  ctx.fillStyle = '#ffffff';
  // Long streak counts must shrink rather than run past the ribbon's edges.
  let streakSize = 34;
  ctx.font = `400 ${streakSize}px ${DISPLAY}`;
  while (streakSize > 18 && trackedWidth(ctx, streakText, streakTracking) > CONTENT_WIDTH - 56) {
    streakSize -= 2;
    ctx.font = `400 ${streakSize}px ${DISPLAY}`;
  }
  const streakWidth = trackedWidth(ctx, streakText, streakTracking);
  drawTracked(
    ctx,
    streakText,
    (SHARE_CARD_WIDTH - streakWidth) / 2,
    ribbonY + ribbonHeight / 2 + streakSize / 3,
    streakTracking,
  );

  // --- Reward chip ---
  if (data.discountCode && chipY !== null) {
    ctx.fillStyle = FALLBACK.orangePale;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 10]);
    roundedRect(ctx, MARGIN, chipY, CONTENT_WIDTH, chipHeight, [18, 24, 16, 22]);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = FALLBACK.orangeDark;
    ctx.font = `600 22px ${LOGO}`;
    drawTracked(ctx, 'UNLOCKED', MARGIN + 28, chipY + 50, 3);

    ctx.fillStyle = ink;
    ctx.font = `400 34px ${DISPLAY}`;
    ctx.textAlign = 'right';
    ctx.fillText(data.discountCode, SHARE_CARD_WIDTH - MARGIN - 28, chipY + 52);
    ctx.textAlign = 'left';
  }

  // --- Footer ---
  ctx.fillStyle = inkLight;
  ctx.font = `600 21px ${LOGO}`;
  const footer = 'MAGIC OF MAA = MAGIC OF MEASUREMENT';
  const footerWidth = trackedWidth(ctx, footer, 3.4);
  drawTracked(ctx, footer, (SHARE_CARD_WIDTH - footerWidth) / 2, footerBaseline, 3.4);

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    } catch {
      resolve(null);
    }
  });
}

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled' | 'failed';

/**
 * Native share sheet when the platform supports sharing files, otherwise a
 * straight PNG download. Both paths are "success" from the player's side.
 */
export async function shareCardImage(
  canvas: HTMLCanvasElement,
  options: { filename: string; title: string; text: string },
): Promise<ShareOutcome> {
  const blob = await canvasToBlob(canvas);
  if (!blob) return 'failed';

  const file = new File([blob], options.filename, { type: 'image/png' });
  const shareData = { files: [file], title: options.title, text: options.text };

  if (typeof navigator !== 'undefined' && navigator.canShare?.(shareData) && navigator.share) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Fall through to the download path if the sheet itself failed.
    }
  }

  return downloadBlob(blob, options.filename) ? 'downloaded' : 'failed';
}

export function downloadBlob(blob: Blob, filename: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
