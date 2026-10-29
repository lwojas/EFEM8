// Track sends: a conventional delay send and reverb send per track (mixing, always available).
// Deliberately small: delay is Free (a time in ms) or Beat (a tempo division); reverb is send + size.
// These are separate from the punch FX in mangler.ts, which are performed, not mixed.
import { DUB_DIVISIONS } from "./mangler";
import { TRACKS } from "./spec";

export interface DelaySend {
  send: number;
  /** 0 = Free (time in ms), 1 = Beat (division of the project tempo). */
  mode: 0 | 1;
  /** Free time, normalised 0..1 (see `freeDelaySeconds`). */
  time: number;
  /** Beat division, index into `DUB_DIVISIONS`. */
  div: number;
}

export interface ReverbSend {
  send: number;
  /** Size / decay character, 0..1. */
  size: number;
}

export const DELAY_MODES = ["FREE", "BEAT"] as const;
export const BEAT_DIVISIONS = DUB_DIVISIONS;

/** Fixed delay character: only time/mode/send are exposed. */
export const DELAY_FEEDBACK_FREE = 0.4;
export const DELAY_FEEDBACK_BEAT = 0.45;
export const DELAY_TONE = 3500;

/** Free delay time: 40 ms .. 900 ms on an exponential taper. */
export const freeDelaySeconds = (n: number) => 0.04 * Math.pow(0.9 / 0.04, Math.min(1, Math.max(0, n)));
export const formatFreeDelay = (n: number) => `${Math.round(freeDelaySeconds(n) * 1000)} ms`;
export const formatBeatDelay = (div: number) => BEAT_DIVISIONS[Math.min(BEAT_DIVISIONS.length - 1, Math.max(0, div))].label;

export const reverbDecay = (size: number) => 0.35 + 0.58 * Math.min(1, Math.max(0, size));
export const reverbDamping = (size: number) => 0.45 - 0.25 * Math.min(1, Math.max(0, size));

/** Quarter-note ticks into a readable time for the delay readout. */
export function delayReadout(d: DelaySend): string {
  return d.mode === 1 ? formatBeatDelay(d.div) : formatFreeDelay(d.time);
}

/** The track filter: a resonant LP or HP on the track's bus, before the sends (so a filtered track is filtered into its delay and
 * reverb too). `cut` and `res` are normalised 0..1; the filter is transparent at LP with `cut` 1 and at HP with `cut` 0. */
export interface TrackFilter {
  /** 0 = low-pass, 1 = high-pass. */
  mode: 0 | 1;
  cut: number;
  res: number;
}
export const FILTER_MODES = ["LP", "HP"] as const;
export const FILTER_MIN_HZ = 40;
export const FILTER_MAX_HZ = 18000;
export const FILTER_MIN_Q = 0.707;
export const FILTER_MAX_Q = 12;
export const filterHz = (cut: number) => FILTER_MIN_HZ * Math.pow(FILTER_MAX_HZ / FILTER_MIN_HZ, Math.min(1, Math.max(0, cut)));
export const filterQ = (res: number) => FILTER_MIN_Q * Math.pow(FILTER_MAX_Q / FILTER_MIN_Q, Math.min(1, Math.max(0, res)));
/** The cutoff at which the filter of this mode does nothing. */
export const filterOpen = (mode: 0 | 1): number => (mode === 1 ? 0 : 1);
export const formatFilterHz = (cut: number) => {
  const hz = filterHz(cut);
  return hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1)}k` : `${Math.round(hz)}`;
};
export const newFilter = (): TrackFilter => ({ mode: 0, cut: 1, res: 0 });

// Per-track starting sends live in `TRACKS[i].mix` (spec.ts).
export const defaultDelaySend = (track: number) => TRACKS[track].mix.delay;
export const defaultReverbSend = (track: number) => TRACKS[track].mix.reverb;

export const newDelay = (track: number): DelaySend => ({ send: defaultDelaySend(track), mode: 1, time: 0.5, div: 1 });
export const newReverb = (track: number): ReverbSend => ({ send: defaultReverbSend(track), size: 0.5 });
