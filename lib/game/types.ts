export type IngredientId = 'water' | 'milk' | 'tea' | 'jaggery';

export type PourSoundKind = 'water' | 'milk' | 'grain' | 'sugar';

export interface IngredientDef {
  id: IngredientId;
  name: string;
  hindiName: string;
  unit: string;
  /** Share of the 300ml ritual before the round's scenario shifts it. */
  base: number;
  /** Units per second once the stream reaches full flow. */
  rate: number;
  /** Milliseconds of ramp-up before full flow — the weight of the vessel. */
  rampMs: number;
  /** Tolerance as a fraction of this round's target. Smaller = less forgiving. */
  toleranceFactor: number;
  /** Floor so tiny targets stay pourable. */
  minTolerance: number;
  vessel: string;
  streamColor: string;
  streamWidth: number;
  /** Colour the pot settles to once this ingredient is in. */
  brewColor: string;
  soundKind: PourSoundKind;
  ammaTip: string;
}

export interface Scenario {
  id: string;
  title: string;
  ammaLine: string;
  /** Per-ingredient nudges applied to the base ratio. */
  multipliers: Partial<Record<IngredientId, number>>;
  /** <1 tightens every tolerance for the round, >1 loosens it. */
  toleranceScale: number;
}

export interface RoundTarget {
  scenario: Scenario;
  targets: Record<IngredientId, number>;
  tolerances: Record<IngredientId, number>;
}

export interface PourRecord {
  id: IngredientId;
  poured: number;
  target: number;
  overflowed: boolean;
}
