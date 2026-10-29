// The FM.8 engine palette: the product-level configuration. Each of the eight track slots plays one
// engine from this table; `DEFAULT_ENGINES` is the lineup a new project starts with. This file and
// `product.ts` are what a new groovebox in the family replaces (see REFERENCE_RESKIN.md).
//
// An engine is a curated *personality* over one existing webdsp FM instrument: a role (drum pads or
// piano roll), the few musical controls it exposes, and the parameters pinned behind them. Raw FM
// terms (operators, ratios, algorithms) never reach the UI; where a ratio or structure matters it is
// pinned in `fixed`, or sits behind one musical knob with a deliberate sweet-spot range.
//
// Every engine exposes exactly `KNOBS` controls so the sound panel, MIDI map and automation ids are
// the same shape whatever is plugged into a slot. Control keys are therefore positional (`k1`..`k5`):
// `track.N.sound.k3` means "knob 3 of track N", and keeps meaning that when the engine changes.
//
// Every control is stored as a normalised 0..1 value and mapped to engine units by spec.ts. Ranges
// are narrower than webdsp's on purpose: the whole knob travel should be musical.
//
// Tuning status: the Digital Machine voices are first-pass in webdsp (set by measurement, not by
// ear), so the ranges and `gainDb` trims below are first-pass too.
import { DmChaosParam, DmCrackParam, DmMetalParam, DmThumpParam, DmToneParam, FmParam, InstrumentKind } from "webdsp";

export type Role = "drum" | "bass" | "tone";
export type Unit = "Hz" | "s" | "%" | "st" | "oct" | "";

export interface ControlSpec {
  /** Positional key (`k1`..): stable across engines. */
  key: string;
  label: string;
  /** webdsp parameter id (per-kind enum). */
  param: number;
  /** Sweet-spot range in engine units. */
  lo: number;
  hi: number;
  curve: "lin" | "exp" | "pow";
  /** `pow` only: value = lo + (hi - lo) * n^gamma. gamma > 1 spends more travel on low values. */
  gamma?: number;
  unit: Unit;
  /** Default in engine units. */
  def: number;
  /** Stepped control: detent names, `lo..hi` is `0..names.length-1`. */
  steps?: readonly string[];
}

/** Knobs per engine: the sound panel always shows this many. */
export const KNOBS = 5;

export interface EngineSpec {
  name: string;
  short: string;
  /** One line about the machine under the hood, shown in the sound panel. */
  engine: string;
  /** Drum: pads, choke, no pitch. Bass and tone: piano roll, arpeggiator; bass has the low note range. */
  role: Role;
  kind: InstrumentKind;
  controls: readonly ControlSpec[];
  /** Engine parameters pinned to fixed values (not exposed). */
  fixed: ReadonlyArray<readonly [param: number, value: number]>;
  /** Source gain trim in dB, for level balance between engines. */
  gainDb: number;
  /** Starting mix when the engine goes into a slot: fader level and delay / reverb sends (all 0..1). */
  mix: { level: number; delay: number; reverb: number };
  chokeGroup?: number;
  /** Melodic engines: MIDI note of the instrument's `tune` (note pitch = note - rootMidi). */
  rootMidi?: number;
  /** Melodic engines: playable MIDI range. */
  noteLo?: number;
  noteHi?: number;
  /** Melodic engines: note a new step gets. */
  defaultNote?: number;
}

type Ctl = Omit<ControlSpec, "key">;
const lin = (label: string, param: number, lo: number, hi: number, def: number, unit: Unit = "%"): Ctl => ({ label, param, lo, hi, curve: "lin", unit, def });
const exp = (label: string, param: number, lo: number, hi: number, def: number, unit: Unit): Ctl => ({ label, param, lo, hi, curve: "exp", unit, def });
/** Positional keys: knob i is `k{i+1}`. */
const knobs = (...c: Ctl[]): ControlSpec[] => c.map((x, i) => ({ ...x, key: `k${i + 1}` }));

/** Modulator colours of the bass voice (the 2-op FM's stepped ratio), named by how they sound. */
export const FM_COLORS = ["SUB", "FULL", "HOLLOW", "THIRDS", "THIN", "FIFTHS", "METAL", "BELL"] as const;

// Magnetic-ratio positions (0..1) of the Digital Machines' curated tables, for pinning one.
const THUMP_RATIO_1 = 0.17; // table 0.5 1 1.59 2 2.76 3.5 5.4: the 1:1 plateau
const THUMP_RATIO_MEMBRANE = 1 / 3; // 1.59: the membrane mode, a tuned tom
const METAL_SPREAD_BAR = 1 / 3; // ratio sets harmonic > free-free bar > 808 > scattered

export const ENGINES: readonly EngineSpec[] = [
  {
    name: "KICK", short: "KCK", engine: "SWEPT FM KICK", role: "drum", kind: InstrumentKind.DmThump,
    controls: knobs(
      exp("TUNE", DmThumpParam.Tune, 35, 90, 52, "Hz"),
      lin("SWEEP", DmThumpParam.Sweep, 0.5, 3.5, 2.2, "oct"),
      exp("DECAY", DmThumpParam.Decay, 0.15, 1.2, 0.45, "s"),
      lin("PUNCH", DmThumpParam.Punch, 0, 1, 0.55),
      lin("MOD", DmThumpParam.Fm, 0, 1, 0.35),
    ),
    fixed: [[DmThumpParam.Ratio, THUMP_RATIO_1], [DmThumpParam.Body, 0.15], [DmThumpParam.Drive, 0.25]],
    gainDb: 0, mix: { level: 0.85, delay: 0, reverb: 0 },
  },
  {
    name: "SNARE", short: "SNR", engine: "NOISE-FM SNARE / CLAP", role: "drum", kind: InstrumentKind.DmCrack,
    controls: knobs(
      exp("TUNE", DmCrackParam.Tune, 150, 320, 190, "Hz"),
      exp("DECAY", DmCrackParam.Decay, 0.08, 0.6, 0.2, "s"),
      lin("MOD", DmCrackParam.Fm, 0.1, 0.9, 0.4),
      lin("NOISE", DmCrackParam.Noise, 0.15, 1, 0.6),
      // one burst is a snare, five are a clap
      lin("CLAP", DmCrackParam.Burst, 0, 1, 0),
    ),
    fixed: [[DmCrackParam.Body, 0.55], [DmCrackParam.Tone, 0.5], [DmCrackParam.Drive, 0.2]],
    gainDb: -1, mix: { level: 0.75, delay: 0.15, reverb: 0.12 },
  },
  {
    name: "HAT", short: "HAT", engine: "METAL FM HAT", role: "drum", kind: InstrumentKind.DmMetal, chokeGroup: 1,
    controls: knobs(
      // closed or open is DECAY (and a parameter lock on the steps that should ring)
      exp("PITCH", DmMetalParam.Tune, 240, 520, 320, "Hz"),
      exp("DECAY", DmMetalParam.Decay, 0.03, 0.9, 0.07, "s"),
      lin("METAL", DmMetalParam.Spread, 0.3, 1, 0.67),
      lin("BRIGHT", DmMetalParam.Tone, 0.3, 1, 0.75),
      lin("NOISE", DmMetalParam.Noise, 0, 1, 0.5),
    ),
    fixed: [[DmMetalParam.Fm, 0.5], [DmMetalParam.Chick, 0.5], [DmMetalParam.Drive, 0.1]],
    gainDb: -4, mix: { level: 0.55, delay: 0.15, reverb: 0 },
  },
  {
    name: "TOM", short: "TOM", engine: "MEMBRANE FM TOM", role: "drum", kind: InstrumentKind.DmThump,
    controls: knobs(
      exp("TUNE", DmThumpParam.Tune, 80, 360, 120, "Hz"),
      lin("SWEEP", DmThumpParam.Sweep, 0, 1.6, 0.6, "oct"),
      exp("DECAY", DmThumpParam.Decay, 0.12, 1, 0.45, "s"),
      lin("BODY", DmThumpParam.Body, 0, 1, 0.5),
      lin("MOD", DmThumpParam.Fm, 0.1, 0.8, 0.3),
    ),
    fixed: [[DmThumpParam.Ratio, THUMP_RATIO_MEMBRANE], [DmThumpParam.Punch, 0.25], [DmThumpParam.Drive, 0.1]],
    gainDb: -2, mix: { level: 0.6, delay: 0.3, reverb: 0.1 },
  },
  {
    name: "BASS", short: "BAS", engine: "TWO-OP FM BASS", role: "bass", kind: InstrumentKind.Fm,
    controls: knobs(
      { label: "COLOR", param: FmParam.Ratio, lo: 0, hi: FM_COLORS.length - 1, curve: "lin", unit: "", def: 1, steps: FM_COLORS },
      lin("MOD", FmParam.Timbre, 0.05, 0.9, 0.35),
      lin("BITE", FmParam.Snap, 0, 1, 0.6),
      lin("TONE", FmParam.Tone, 0.15, 1, 0.7),
      exp("DECAY", FmParam.Decay, 0.06, 1.1, 0.3, "s"),
    ),
    fixed: [
      [FmParam.Tune, 55], [FmParam.Attack, 0.003], [FmParam.Sustain, 0.55],
      [FmParam.Release, 0.08], [FmParam.Legato, 0], [FmParam.Slide, 0.08],
    ],
    gainDb: -3, rootMidi: 33, noteLo: 24, noteHi: 59, defaultNote: 24,
    mix: { level: 0.78, delay: 0.1, reverb: 0 },
  },
  {
    name: "PLUCK", short: "PLK", engine: "FOUR-OP FM PLUCK", role: "tone", kind: InstrumentKind.DmTone,
    controls: knobs(
      lin("MOD", DmToneParam.Fm, 0.1, 0.9, 0.5),
      lin("COLOR", DmToneParam.Ratio, 0, 1, 0.111),
      // how long the strike brightness lasts: low is a pluck, high is a held tone
      lin("TONE", DmToneParam.Damp, 0, 1, 0.4),
      exp("DECAY", DmToneParam.Decay, 0.1, 2, 0.5, "s"),
      lin("DRIVE", DmToneParam.Drive, 0, 1, 0.1),
    ),
    fixed: [[DmToneParam.Tune, 110], [DmToneParam.Structure, 1], [DmToneParam.Attack, 0.002], [DmToneParam.Hold, 0]],
    gainDb: -3, rootMidi: 45, noteLo: 36, noteHi: 71, defaultNote: 48,
    mix: { level: 0.62, delay: 0.3, reverb: 0.15 },
  },
  {
    name: "BELL", short: "BEL", engine: "INHARMONIC FM BELL", role: "tone", kind: InstrumentKind.DmMetal,
    controls: knobs(
      lin("MOD", DmMetalParam.Fm, 0, 1, 0.5),
      lin("METAL", DmMetalParam.Spread, 0.15, 0.7, METAL_SPREAD_BAR),
      lin("TONE", DmMetalParam.Tone, 0, 0.6, 0.1),
      exp("DECAY", DmMetalParam.Decay, 0.25, 2, 0.9, "s"),
      lin("STRIKE", DmMetalParam.Chick, 0, 1, 0.4),
    ),
    fixed: [[DmMetalParam.Tune, 220], [DmMetalParam.Noise, 0], [DmMetalParam.Drive, 0.1]],
    gainDb: -6, rootMidi: 57, noteLo: 48, noteHi: 84, defaultNote: 60,
    mix: { level: 0.55, delay: 0.3, reverb: 0.3 },
  },
  {
    name: "LEAD", short: "LED", engine: "UNSTABLE FM LEAD", role: "tone", kind: InstrumentKind.DmChaos,
    controls: knobs(
      lin("CHAOS", DmChaosParam.Chaos, 0.05, 0.8, 0.35),
      lin("COLOR", DmChaosParam.Ratio, 0, 1, 0.143),
      lin("FOLD", DmChaosParam.Fold, 0, 0.8, 0.25),
      exp("DECAY", DmChaosParam.Decay, 0.1, 2, 0.5, "s"),
      lin("SUSTAIN", DmChaosParam.Hold, 0, 1, 0.6),
    ),
    fixed: [[DmChaosParam.Tune, 220], [DmChaosParam.Noise, 0], [DmChaosParam.Sweep, 0.15]],
    gainDb: -6, rootMidi: 57, noteLo: 48, noteHi: 84, defaultNote: 60,
    mix: { level: 0.5, delay: 0.3, reverb: 0.15 },
  },
];

/** The engine in each of the eight slots of a new project (indexes into `ENGINES`). */
export const DEFAULT_ENGINES: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7];
