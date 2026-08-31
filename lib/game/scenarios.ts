import { IngredientDef, IngredientId, RoundTarget, Scenario } from './types';

/** The brand promise: every brew resolves to exactly 300ml. */
export const RITUAL_TOTAL = 300;

/**
 * The measuring glass is scaled to the ingredient, never to the round's target — so a
 * scenario that shifts the target visibly moves the mark the player is pouring towards.
 */
export const GAUGE_HEADROOM = 2;

/** Per-ingredient jitter applied on top of the scenario, so targets are never memorisable. */
const JITTER = 0.06;

export const INGREDIENTS: IngredientDef[] = [
  {
    id: 'water',
    name: 'Water',
    hindiName: 'पानी',
    unit: 'ml',
    base: 120,
    rate: 82,
    rampMs: 240,
    toleranceFactor: 0.2,
    minTolerance: 4,
    vessel: 'Steel lota',
    streamColor: '#cfe6e4',
    streamWidth: 10,
    brewColor: '#e8ded0',
    soundKind: 'water',
    ammaTip: 'Paani pehle. Chai patti ko khulne ke liye jagah chahiye.',
  },
  {
    id: 'milk',
    name: 'Milk',
    hindiName: 'दूध',
    unit: 'ml',
    base: 150,
    rate: 88,
    rampMs: 340,
    toleranceFactor: 0.18,
    minTolerance: 4,
    vessel: 'Doodh ka patila',
    streamColor: '#fdf8f0',
    streamWidth: 13,
    brewColor: '#f1e4d2',
    soundKind: 'milk',
    ammaTip: 'Doodh dheere. Bhaari haath se daalo, warna ubal jaayega.',
  },
  {
    id: 'tea',
    name: 'CTC Tea',
    hindiName: 'चाय पत्ती',
    unit: 'g',
    base: 20,
    rate: 13,
    rampMs: 170,
    toleranceFactor: 0.13,
    minTolerance: 2,
    vessel: 'Sachet No. 1',
    streamColor: '#4a2408',
    streamWidth: 7,
    brewColor: '#b9723c',
    soundKind: 'grain',
    ammaTip: 'Ek chutki zyada aur chai kadwi. Naap ke, beta.',
  },
  {
    id: 'jaggery',
    name: 'Jaggery',
    hindiName: 'गुड़',
    unit: 'g',
    base: 10,
    rate: 7,
    rampMs: 200,
    toleranceFactor: 0.13,
    minTolerance: 1.6,
    vessel: 'Gud ki dibbi',
    streamColor: '#a5651f',
    streamWidth: 8,
    brewColor: '#a95f28',
    soundKind: 'sugar',
    ammaTip: 'Gud ghulne do. Meetha baad me chakhna, pehle naapna.',
  },
];

export const INGREDIENT_BY_ID = INGREDIENTS.reduce((acc, ing) => {
  acc[ing.id] = ing;
  return acc;
}, {} as Record<IngredientId, IngredientDef>);

export const SCENARIOS: Scenario[] = [
  {
    id: 'rainy-monday',
    title: "Rainy Monday, Dad's home early",
    ammaLine: 'Baarish ho rahi hai — aaj gud thoda zyada, chai thodi lambi.',
    multipliers: { water: 1.1, milk: 0.95, jaggery: 1.3 },
    toleranceScale: 1,
  },
  {
    id: 'guests-arriving',
    title: 'Guests arriving in 10 minutes',
    ammaLine: 'Mehmaan aa rahe hain. Bilkul theek banani hai, koi bahana nahi.',
    multipliers: {},
    toleranceScale: 0.78,
  },
  {
    id: 'exam-night',
    title: 'Exam night — make it strong',
    ammaLine: 'Raat bhar padhna hai? Patti badha do, doodh kam.',
    multipliers: { tea: 1.45, milk: 0.85, jaggery: 0.9 },
    toleranceScale: 1.05,
  },
  {
    id: 'december-morning',
    title: 'First cold morning of December',
    ammaLine: 'Thand hai. Doodh gaadha, gud zyada, paani kam.',
    multipliers: { water: 0.85, milk: 1.15, jaggery: 1.2 },
    toleranceScale: 1,
  },
  {
    id: 'amma-fasting',
    title: "Amma's fasting — light and sweet",
    ammaLine: 'Vrat hai mera. Halki chai, par meethi honi chahiye.',
    multipliers: { tea: 0.7, milk: 1.1, jaggery: 1.25 },
    toleranceScale: 0.95,
  },
  {
    id: 'power-cut',
    title: 'Power cut, one candle, transistor on',
    ammaLine: 'Andhere me bhi haath ko yaad hai naap. Chalo banao.',
    multipliers: { water: 1.15, tea: 1.1 },
    toleranceScale: 1.18,
  },
  {
    id: 'sunday-match',
    title: 'Sunday match, India batting',
    ammaLine: 'Poora ghar baitha hai TV ke saamne. Doodh wali kadak chahiye.',
    multipliers: { milk: 1.2, tea: 1.05, jaggery: 1.15 },
    toleranceScale: 0.9,
  },
  {
    id: 'night-shift',
    title: 'Night shift, 2 AM tapri',
    ammaLine: 'Neend bhagani hai. Patti khoob, doodh naam ka.',
    multipliers: { water: 1.2, milk: 0.7, tea: 1.35, jaggery: 0.85 },
    toleranceScale: 1.1,
  },
];

function jitter(rng: () => number) {
  return 1 + (rng() * 2 - 1) * JITTER;
}

export function pickScenario(rng: () => number = Math.random, avoidId?: string): Scenario {
  const pool = avoidId ? SCENARIOS.filter((s) => s.id !== avoidId) : SCENARIOS;
  return pool[Math.floor(rng() * pool.length) % pool.length];
}

/**
 * Builds one round: the scenario shifts the base ratio, per-ingredient jitter makes it
 * unmemorisable, then everything is renormalised so the brew still totals exactly 300ml.
 */
export function buildRound(rng: () => number = Math.random, avoidScenarioId?: string): RoundTarget {
  const scenario = pickScenario(rng, avoidScenarioId);

  const raw = {} as Record<IngredientId, number>;
  for (const ing of INGREDIENTS) {
    const multiplier = scenario.multipliers[ing.id] ?? 1;
    raw[ing.id] = ing.base * multiplier * jitter(rng);
  }

  const rawTotal = INGREDIENTS.reduce((sum, ing) => sum + raw[ing.id], 0);
  const normalise = RITUAL_TOTAL / rawTotal;

  const targets = {} as Record<IngredientId, number>;
  const tolerances = {} as Record<IngredientId, number>;
  for (const ing of INGREDIENTS) {
    const target = raw[ing.id] * normalise;
    targets[ing.id] = target;
    tolerances[ing.id] = Math.max(
      target * ing.toleranceFactor * scenario.toleranceScale,
      ing.minTolerance,
    );
  }

  return { scenario, targets, tolerances };
}

/** Glass capacity — pouring past this spills over the rim and ends the pour. */
export function capacityFor(ingredient: IngredientDef) {
  return ingredient.base * GAUGE_HEADROOM;
}

export function formatAmount(amount: number) {
  return amount >= 100 ? Math.round(amount).toString() : (Math.round(amount * 10) / 10).toString();
}
