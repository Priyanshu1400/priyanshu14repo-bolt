/**
 * Nostalgia fragments — the collectibles. Deliberately not XP or power-ups: each
 * one is a scrap of a 90s Indian kitchen (a note in Amma's hand, a sound you
 * haven't heard in twenty years, a thing only that decade did), earned by
 * keeping the ritual rather than by grinding.
 */

import { NostalgiaClip } from './audioEngine';

export type FragmentKind = 'note' | 'audio' | 'reference';

export interface UnlockRequirement {
  /** Current daily streak, in days. */
  streak?: number;
  /** Best score ever reached, as a percentage. */
  score?: number;
  /** Total finished rounds. */
  rounds?: number;
}

export interface UnlockStats {
  streak: number;
  longestStreak: number;
  bestScore: number;
  totalRounds: number;
}

export interface NostalgiaFragment {
  id: string;
  kind: FragmentKind;
  title: string;
  era: string;
  /** Shown once unlocked. */
  body: string;
  /** Signed line for notes from Amma. */
  signature?: string;
  /** Synthesised clip, for audio fragments. */
  clip?: NostalgiaClip;
  requirement: UnlockRequirement;
  /** Hint shown while it is still locked. */
  teaser: string;
}

export const FRAGMENTS: NostalgiaFragment[] = [
  {
    id: 'first-note',
    kind: 'note',
    title: 'Note under the tea tin',
    era: 'Amma, in blue ballpoint',
    body: 'Chai banane se pehle haath dho lena. Aur naap dekh ke daalna — andaaza baad me aata hai, pehle naap seekho.',
    signature: '— Amma',
    requirement: { rounds: 1 },
    teaser: 'Finish one round and Amma leaves you a note.',
  },
  {
    id: 'cooker-whistle',
    kind: 'audio',
    title: 'Three whistles from the next room',
    era: 'Every kitchen, 1994',
    body: 'Nobody set a timer. You counted the whistles, and at three the rice was done and the chai went on the back burner.',
    clip: 'cooker-whistle',
    requirement: { rounds: 3 },
    teaser: 'Brew 3 cups to hear it again.',
  },
  {
    id: 'chitrahaar',
    kind: 'reference',
    title: 'Wednesday, 7:30 PM',
    era: '90s reference',
    body: 'Chitrahaar started and the whole building went quiet. Chai had to be poured before the titles, or you missed the first song arguing about who forgot the jaggery.',
    requirement: { streak: 2 },
    teaser: 'Two days in a row unlocks a Wednesday evening.',
  },
  {
    id: 'cycle-bell',
    kind: 'audio',
    title: 'The doodhwala’s bell',
    era: 'Six in the morning',
    body: 'Two rings meant the milk was at the door. You went down with the steel pot, half asleep, and the chai waited for you to come back up.',
    clip: 'cycle-bell',
    requirement: { score: 75 },
    teaser: 'Score 75% or better to earn this sound.',
  },
  {
    id: 'amma-measure-note',
    kind: 'note',
    title: 'Note on the back of a bill',
    era: 'Amma, in a hurry',
    body: 'Teen din se tum theek bana rahe ho. Ab dhyan do — doodh ka haath bhaari rakhna, paani ka halka. Yehi farq hai ghar aur tapri me.',
    signature: '— Amma',
    requirement: { streak: 3 },
    teaser: 'Keep a 3-day streak for Amma’s next note.',
  },
  {
    id: 'crowd-roar',
    kind: 'audio',
    title: 'The building cheering at once',
    era: 'India batting, Sunday',
    body: 'You knew the score without seeing the TV. The whole lane roared, and somebody’s chai boiled over in the excitement.',
    clip: 'crowd-roar',
    requirement: { score: 85 },
    teaser: 'Score 85% or better to bring the crowd back.',
  },
  {
    id: 'std-booth',
    kind: 'reference',
    title: 'The yellow STD/ISD board',
    era: '90s reference',
    body: 'Rates dropped after eleven, so you waited with a cup in hand, watching the meter tick in paise while Amma asked whether you were eating properly.',
    requirement: { rounds: 8 },
    teaser: 'Brew 8 cups to find the booth still open.',
  },
  {
    id: 'evening-raga',
    kind: 'audio',
    title: 'Transistor on the window sill',
    era: 'Vividh Bharati, dusk',
    body: 'The signal drifted, the tape hissed, and the tune came through anyway — the sound of the hour between homework and dinner.',
    clip: 'evening-raga',
    requirement: { streak: 5 },
    teaser: 'A 5-day streak switches the transistor on.',
  },
  {
    id: 'amma-letter',
    kind: 'note',
    title: 'The full letter',
    era: 'Amma, on ruled paper',
    body: 'Ab tumhein naap yaad ho gaya hai — haath ne seekh liya. Jab tum door raho, chai wahi rahegi jo main banati thi. Bas jaldi na karo, aur chakhne se pehle naapna mat bhoolo.',
    signature: '— Amma, tumhari',
    requirement: { streak: 7 },
    teaser: 'Seven days of the ritual earns the whole letter.',
  },
  {
    id: 'temple-bell',
    kind: 'audio',
    title: 'The 6 AM bell',
    era: 'Two lanes away',
    body: 'It carried further in winter. Amma’s chai was always on the stove before it rang — that was how she knew she was on time.',
    clip: 'temple-bell',
    requirement: { score: 95 },
    teaser: 'A 95% cup rings this bell.',
  },
];

export const FRAGMENT_BY_ID = FRAGMENTS.reduce(
  (acc, fragment) => {
    acc[fragment.id] = fragment;
    return acc;
  },
  {} as Record<string, NostalgiaFragment>,
);

export function meetsRequirement(requirement: UnlockRequirement, stats: UnlockStats): boolean {
  if (requirement.streak !== undefined && stats.longestStreak < requirement.streak) return false;
  if (requirement.score !== undefined && stats.bestScore < requirement.score) return false;
  if (requirement.rounds !== undefined && stats.totalRounds < requirement.rounds) return false;
  return true;
}

export function unlockedIdsFor(stats: UnlockStats): string[] {
  return FRAGMENTS.filter((fragment) => meetsRequirement(fragment.requirement, stats)).map(
    (fragment) => fragment.id,
  );
}

export function requirementLabel(requirement: UnlockRequirement): string {
  const parts: string[] = [];
  if (requirement.streak !== undefined) parts.push(`${requirement.streak}-day streak`);
  if (requirement.score !== undefined) parts.push(`${requirement.score}% cup`);
  if (requirement.rounds !== undefined) {
    parts.push(`${requirement.rounds} ${requirement.rounds === 1 ? 'cup' : 'cups'} brewed`);
  }
  return parts.join(' · ');
}

/** How close the player is to a locked fragment, 0..1, for the progress hint. */
export function requirementProgress(requirement: UnlockRequirement, stats: UnlockStats): number {
  const ratios: number[] = [];
  if (requirement.streak !== undefined) {
    ratios.push(stats.longestStreak / requirement.streak);
  }
  if (requirement.score !== undefined) {
    ratios.push(stats.bestScore / requirement.score);
  }
  if (requirement.rounds !== undefined) {
    ratios.push(stats.totalRounds / requirement.rounds);
  }
  if (ratios.length === 0) return 1;
  return Math.min(1, Math.max(0, Math.min(...ratios)));
}
