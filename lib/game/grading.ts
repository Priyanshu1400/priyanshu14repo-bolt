import { INGREDIENT_BY_ID, INGREDIENTS, RITUAL_TOTAL } from './scenarios';
import { IngredientId, PourRecord, RoundTarget } from './types';

/**
 * How much each ingredient moves the final verdict. Tea and jaggery carry the most
 * flavour per unit, so a sloppy sachet costs more than a sloppy splash of water.
 */
const WEIGHTS: Record<IngredientId, number> = {
  water: 0.22,
  milk: 0.26,
  tea: 0.32,
  jaggery: 0.2,
};

/** Error, in tolerances, at which an ingredient scores nothing at all. */
const ZERO_AT = 2.45;
/** Accuracy still earned when landing exactly on the edge of Amma's tolerance. */
const EDGE_ACCURACY = 0.65;

export type GradeBand = 'amma' | 'ghar' | 'hostel' | 'disaster';

export interface IngredientScore {
  id: IngredientId;
  poured: number;
  target: number;
  tolerance: number;
  delta: number;
  /** Error expressed in tolerances: <=1 means inside the band. */
  errorRatio: number;
  accuracy: number;
  overflowed: boolean;
}

export interface ConfettiSpec {
  particleCount: number;
  spread: number;
  bursts: number;
}

export interface GradeResult {
  score: number;
  band: GradeBand;
  title: string;
  verdict: string;
  ingredientScores: IngredientScore[];
  totalPoured: number;
  /** Colour of the chai that actually came out, from the poured tea-to-milk ratio. */
  brewColor: string;
  confetti: ConfettiSpec;
}

export function accuracyFor(poured: number, target: number, tolerance: number, overflowed: boolean) {
  if (overflowed) return 0;
  const errorRatio = Math.abs(poured - target) / tolerance;
  if (errorRatio <= 1) {
    return 1 - (1 - EDGE_ACCURACY) * Math.pow(errorRatio, 1.5);
  }
  const falloff = EDGE_ACCURACY / (ZERO_AT - 1);
  return Math.max(0, EDGE_ACCURACY - falloff * (errorRatio - 1));
}

function lerpHex(from: string, to: string, t: number) {
  const clamped = Math.min(Math.max(t, 0), 1);
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const channel = (a: number, b: number) =>
    Math.round(a + (b - a) * clamped)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r1, r2)}${channel(g1, g2)}${channel(b1, b2)}`;
}

/** Pale milky chai through to over-steeped near-black, driven by what was poured. */
function brewColorFor(pours: PourRecord[]) {
  const amount = (id: IngredientId) => pours.find((pour) => pour.id === id)?.poured ?? 0;
  const liquid = amount('water') + amount('milk');
  const idealStrength = INGREDIENT_BY_ID.tea.base / (INGREDIENT_BY_ID.water.base + INGREDIENT_BY_ID.milk.base);
  const strength = liquid > 0 ? amount('tea') / liquid : idealStrength;
  const milkiness = liquid > 0 ? amount('milk') / liquid : 0.55;

  const pale = lerpHex('#c98a4b', '#e6c9a1', Math.min(milkiness, 1));
  return lerpHex(pale, '#4a2409', Math.min(strength / (idealStrength * 2.2), 1));
}

function bandFor(score: number): { band: GradeBand; title: string; verdict: string } {
  if (score >= 90) {
    return {
      band: 'amma',
      title: 'Amma-Approved',
      verdict: 'Bilkul mere haath jaisi. Aaj tumne naap ko samajh liya.',
    };
  }
  if (score >= 75) {
    return {
      band: 'ghar',
      title: 'Almost Ghar Jaisi',
      verdict: 'Kaafi acchi. Thoda haath sadha lo, phir bilkul ghar jaisi banegi.',
    };
  }
  if (score >= 50) {
    return {
      band: 'hostel',
      title: 'Hostel Chai',
      verdict: 'Peene layak hai, par yeh ghar ki chai nahi hai beta.',
    };
  }
  return {
    band: 'disaster',
    title: 'Kadak Disaster',
    verdict: 'Yeh chai nahi, sirf garam paani hai. Chalo phir se banate hain.',
  };
}

function confettiFor(score: number): ConfettiSpec {
  if (score < 50) return { particleCount: 0, spread: 0, bursts: 0 };
  const normalised = (score - 50) / 50;
  return {
    particleCount: Math.round(25 + normalised * 145),
    spread: Math.round(55 + normalised * 55),
    bursts: score >= 90 ? 3 : score >= 75 ? 2 : 1,
  };
}

export function gradeRound(round: RoundTarget, pours: PourRecord[]): GradeResult {
  const ingredientScores: IngredientScore[] = INGREDIENTS.map((ingredient) => {
    const pour = pours.find((item) => item.id === ingredient.id);
    const target = round.targets[ingredient.id];
    const tolerance = round.tolerances[ingredient.id];
    const poured = pour?.poured ?? 0;
    const overflowed = pour?.overflowed ?? false;

    return {
      id: ingredient.id,
      poured,
      target,
      tolerance,
      delta: poured - target,
      errorRatio: Math.abs(poured - target) / tolerance,
      accuracy: accuracyFor(poured, target, tolerance, overflowed),
      overflowed,
    };
  });

  const weighted = ingredientScores.reduce(
    (sum, item) => sum + item.accuracy * WEIGHTS[item.id],
    0,
  );
  const score = Math.round(weighted * 100);

  return {
    score,
    ...bandFor(score),
    ingredientScores,
    totalPoured: pours.reduce((sum, pour) => sum + pour.poured, 0),
    brewColor: brewColorFor(pours),
    confetti: confettiFor(score),
  };
}

export const RITUAL_TARGET_TOTAL = RITUAL_TOTAL;
