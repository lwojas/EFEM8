// Punch FX: performance effects on one shared effect bus (drive, crush, phaser, flanger, dub echo,
// filter sweep) and the glitch effects (repeat, tape, gate) on a bus of their own that feeds it. Not a
// mixer send: the track delay/reverb sends live in trackfx.ts.
//
// While a punch is held it either "takes over" the mix (every track's dry output is cut and fully
// sent through the chain, like the punch-in FX of a Pocket Operator), "throws" (the tracks' sends
// into the bus are lifted: DUB), or is a glitch (the mix is taken from a tap that has been feeding the
// glitch bus's ring buffer all along, so a repeat can capture what played *before* the pad went down).
// Each punch has one character parameter and a sweep level 0..1: the level rises while the pad is
// held, so the effect is performed in, not switched on.
import { DubDelayDivision, GlitchMode, NodeParam } from "webdsp";
import type { ManglerBase, Pattern } from "./state";

export type ManglerKey =
  | "fCut" | "fRes"
  | "sDrive" | "sOut" | "sMix"
  | "cBits" | "cDown" | "cMix"
  | "pRate" | "pDepth" | "pFb" | "pCenter" | "pMix"
  | "xRate" | "xDepth" | "xDelay" | "xFb" | "xMix"
  | "dDiv" | "dFb" | "dTone" | "dMix"
  | "gMix" | "gMode" | "gDiv" | "gSpeed";

export type ManglerValues = Record<ManglerKey, number>;
export type FxSlot = "filter" | "sat" | "crush" | "phaser" | "flange" | "dub" | "glitch";
/** Which bus each slot's effect lives on: every slot is on the punch bus, except the glitch, which has a bus of its own in front of it. */
export const SLOT_ON_GLITCH_BUS: Readonly<Record<FxSlot, boolean>> = { filter: false, sat: false, crush: false, phaser: false, flange: false, dub: false, glitch: true };

/** Where each mangler value goes, in chain order. */
export const MANGLER_PARAMS: Record<ManglerKey, { fx: FxSlot; param: NodeParam }> = {
  fCut: { fx: "filter", param: NodeParam.FilterCutoff },
  fRes: { fx: "filter", param: NodeParam.FilterResonance },
  sDrive: { fx: "sat", param: NodeParam.SatDrive },
  sOut: { fx: "sat", param: NodeParam.SatOutputGain },
  sMix: { fx: "sat", param: NodeParam.SatMix },
  cBits: { fx: "crush", param: NodeParam.CrushBits },
  cDown: { fx: "crush", param: NodeParam.CrushDownsample },
  cMix: { fx: "crush", param: NodeParam.CrushMix },
  pRate: { fx: "phaser", param: NodeParam.PhaserRate },
  pDepth: { fx: "phaser", param: NodeParam.PhaserDepth },
  pFb: { fx: "phaser", param: NodeParam.PhaserFeedback },
  pCenter: { fx: "phaser", param: NodeParam.PhaserCenter },
  pMix: { fx: "phaser", param: NodeParam.PhaserMix },
  xRate: { fx: "flange", param: NodeParam.ChorusFlangerRate },
  xDepth: { fx: "flange", param: NodeParam.ChorusFlangerDepth },
  xDelay: { fx: "flange", param: NodeParam.ChorusFlangerDelay },
  xFb: { fx: "flange", param: NodeParam.ChorusFlangerFeedback },
  xMix: { fx: "flange", param: NodeParam.ChorusFlangerMix },
  dDiv: { fx: "dub", param: NodeParam.DubDelayDivision },
  dFb: { fx: "dub", param: NodeParam.DubDelayFeedback },
  dTone: { fx: "dub", param: NodeParam.DubDelayTone },
  dMix: { fx: "dub", param: NodeParam.DubDelayMix },
  gMix: { fx: "glitch", param: NodeParam.GlitchMix },
  gMode: { fx: "glitch", param: NodeParam.GlitchMode },
  gDiv: { fx: "glitch", param: NodeParam.GlitchDivision },
  gSpeed: { fx: "glitch", param: NodeParam.GlitchSpeed },
};

export const MANGLER_KEYS = Object.keys(MANGLER_PARAMS) as ManglerKey[];

/** Echo divisions the UI offers (sweet spots only). */
export const DUB_DIVISIONS = [
  { label: "1/16", value: DubDelayDivision.Sixteenth },
  { label: "1/8", value: DubDelayDivision.Eighth },
  { label: "1/8.", value: DubDelayDivision.DottedEighth },
  { label: "1/4", value: DubDelayDivision.Quarter },
  { label: "1/8T", value: DubDelayDivision.EighthTriplet },
] as const;

/** How long a held punch takes to reach full effect, in 16th steps (0 = instantly). */
export const SWEEPS = [
  { label: "NOW", steps: 0 },
  { label: "1 BT", steps: 4 },
  { label: "2 BT", steps: 8 },
  { label: "1 BAR", steps: 16 },
] as const;
export const DEFAULT_SWEEP = 2;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const expLerp = (a: number, b: number, t: number) => a * Math.pow(b / a, t);
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** The resting state: transparent chain, dub echo return open, glitch idle (mix 0). */
export function baseValues(): ManglerValues {
  return {
    fCut: 20000, fRes: 0.707,
    sDrive: 0, sOut: 0, sMix: 0,
    cBits: 16, cDown: 1, cMix: 0,
    pRate: 0.5, pDepth: 0.8, pFb: 0.3, pCenter: 900, pMix: 0,
    xRate: 0.3, xDepth: 3, xDelay: 2.5, xFb: 0.7, xMix: 0,
    dDiv: DubDelayDivision.DottedEighth, dFb: 0.55, dTone: 3500, dMix: 1,
    gMix: 0, gMode: GlitchMode.Repeat, gDiv: 1, gSpeed: 1,
  };
}

/** Takeover punches own the whole signal, so the wet-only returns must get out of the way. */
const OWN = { dMix: 0 } as const;

export interface PunchParam {
  label: string;
  /** Detent names for a stepped parameter. */
  steps?: readonly string[];
  def: number;
  /** Readout for a normalised value. */
  format(n: number): string;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const SWEEP_SHAPES = ["CLOSE", "CLOSE RES", "OPEN", "OPEN RES"] as const;

export interface PunchDef {
  id: number;
  label: string;
  hint: string;
  /** Cut every track's dry output and send it all through the mangler. */
  takeover: boolean;
  /** A glitch: the mix comes from the glitch bus (which has been recording it all along) instead of the dry path. */
  glitch?: boolean;
  /** Send level into the bus at full effect (non-takeover punches; scales with the sweep level). */
  boost: number;
  /** The one character parameter: FX → amount (sweep) → character. */
  param: PunchParam;
  /** Overrides on top of the resting values. `p` is the character parameter, `lvl` the 0..1 sweep level. */
  values(p: number, lvl: number): Partial<ManglerValues>;
}

/** Lengths the glitch punches offer, as `GlitchDivision` indices (0 is 1/2, 1 is 1/4 ... 5 is 1/64). */
export const GLITCH_DIVISIONS = [
  { label: "1/4", value: 1 },
  { label: "1/8", value: 2 },
  { label: "1/16", value: 3 },
  { label: "1/32", value: 4 },
] as const;
const divLabel = (n: number) => GLITCH_DIVISIONS[Math.round(n * (GLITCH_DIVISIONS.length - 1))].label;
const divIndex = (n: number) => Math.round(n * (GLITCH_DIVISIONS.length - 1));
const TAPE_SHAPES = ["STOP", "SLOW", "REVERSE"] as const;
/** Where the tape speed ends up at full sweep, per shape. */
const TAPE_SPEEDS = [0, 0.5, -1] as const;

export const PUNCHES: readonly PunchDef[] = [
  {
    id: 1, label: "DRIVE", hint: "TAPE SATURATION", takeover: true, boost: 1,
    param: { label: "DRIVE", def: 0.6, format: pct },
    values: (p, l) => ({ sDrive: lerp(10, 30, p), sOut: -lerp(3, 9, p) * l, sMix: l, ...OWN }),
  },
  {
    id: 2, label: "CRUSH", hint: "BIT + RATE REDUCTION", takeover: true, boost: 1,
    param: { label: "CRUSH", def: 0.6, format: pct },
    values: (p, l) => ({
      cBits: Math.round(lerp(16, lerp(9, 4, p), l)), cDown: Math.round(lerp(1, lerp(2, 10, p), l)), cMix: 1, ...OWN,
    }),
  },
  {
    id: 3, label: "PHASE", hint: "SWEEPING PHASER", takeover: true, boost: 1,
    param: { label: "RATE", def: 0.6, format: (n) => `${lerp(0.4, 3, n).toFixed(1)} Hz` },
    values: (p, l) => ({ pMix: 0.85 * l, pRate: lerp(0.4, 3, p), pDepth: 0.95, pFb: lerp(0.4, 0.8, p), ...OWN }),
  },
  {
    id: 4, label: "DUB", hint: "ECHO THROW", takeover: false, boost: 0.85,
    param: {
      label: "TIME", steps: DUB_DIVISIONS.map((d) => d.label), def: 0.5,
      format: (n) => DUB_DIVISIONS[Math.round(n * (DUB_DIVISIONS.length - 1))].label,
    },
    values: (p, l) => ({
      dDiv: DUB_DIVISIONS[Math.round(p * (DUB_DIVISIONS.length - 1))].value, dFb: lerp(0.55, 0.9, l), dMix: 1,
    }),
  },
  {
    id: 5, label: "SWEEP", hint: "FILTER SWEEP", takeover: true, boost: 1,
    param: {
      label: "SHAPE", steps: SWEEP_SHAPES, def: 0,
      format: (n) => SWEEP_SHAPES[Math.round(n * (SWEEP_SHAPES.length - 1))],
    },
    // CLOSE: open → closed.  OPEN: closed → open.  RES adds a resonant peak that rides the sweep.
    values: (p, l) => {
      const shape = Math.round(p * (SWEEP_SHAPES.length - 1));
      const cut = shape >= 2 ? expLerp(120, 20000, l) : expLerp(20000, 140, l);
      return { fCut: cut, fRes: shape % 2 === 1 ? 3.4 : 1.3, ...OWN };
    },
  },
  {
    id: 6, label: "FLANGE", hint: "JET FLANGER", takeover: true, boost: 1,
    param: { label: "RATE", def: 0.4, format: (n) => `${lerp(0.1, 1.2, n).toFixed(1)} Hz` },
    values: (p, l) => ({ xMix: 0.8 * l, xRate: lerp(0.1, 1.2, p), xDepth: 3, xDelay: 2.5, xFb: 0.75, ...OWN }),
  },
  {
    // Captures the last beat-fraction the moment the pad goes down and loops it. The sweep makes it a roll: the loop starts up to two
    // divisions longer than the one chosen and steps down to it as the level rises (1/4 → 1/8 → 1/16 → 1/32), always the newest slice.
    id: 7, label: "REPEAT", hint: "BEAT REPEAT ROLL", takeover: false, glitch: true, boost: 0,
    param: { label: "RATE", steps: GLITCH_DIVISIONS.map((d) => d.label), def: 2 / 3, format: divLabel },
    values: (p, l) => {
      const end = divIndex(p);
      const start = Math.max(0, end - 2);
      return { gMix: 1, gMode: GlitchMode.Repeat, gDiv: GLITCH_DIVISIONS[Math.round(lerp(start, end, l))].value, gSpeed: 1, ...OWN };
    },
  },
  {
    // The mix slows toward a stop (or half speed, or backwards) as the level rises: a sweep of a bar is a slow tape-stop, NOW is a hard one.
    id: 8, label: "TAPE", hint: "TAPE STOP / SLOW / REVERSE", takeover: false, glitch: true, boost: 0,
    param: {
      label: "SHAPE", steps: TAPE_SHAPES, def: 0,
      format: (n) => TAPE_SHAPES[Math.round(n * (TAPE_SHAPES.length - 1))],
    },
    values: (p, l) => {
      const to = TAPE_SPEEDS[Math.round(p * (TAPE_SHAPES.length - 1))];
      return { gMix: 1, gMode: GlitchMode.Tape, gSpeed: lerp(1, to, l), ...OWN };
    },
  },
  {
    // A square chop at the chosen length; the depth is the sweep level, so a held pad closes the gate more and more.
    id: 9, label: "GATE", hint: "TEMPO-SYNCED CHOP", takeover: false, glitch: true, boost: 0,
    param: { label: "RATE", steps: GLITCH_DIVISIONS.map((d) => d.label), def: 2 / 3, format: divLabel },
    values: (p, l) => ({ gMix: l, gMode: GlitchMode.Gate, gDiv: GLITCH_DIVISIONS[divIndex(p)].value, gSpeed: 1, ...OWN }),
  },
];

export const punchById = (id: number): PunchDef | undefined => PUNCHES.find((p) => p.id === id);

/** The defaults for a new pattern's punch settings. */
export function defaultMangler(): ManglerBase {
  return { sweep: DEFAULT_SWEEP, param: [0, ...PUNCHES.map((p) => p.param.def)] };
}

export interface ManglerTarget {
  values: ManglerValues;
  takeover: boolean;
  /** Send level of every track into the bus. */
  boost: number;
  /** A glitch is held: the mix is taken from the glitch bus. */
  glitch: boolean;
}

/** Everything the mangler should look like for a punch (0 = none) at sweep level `lvl`. */
export function manglerTarget(base: ManglerBase, punchId: number, lvl = 1): ManglerTarget {
  const resting = baseValues();
  const punch = punchById(punchId);
  if (!punch) return { values: resting, takeover: false, boost: 0, glitch: false };
  const l = clamp01(lvl);
  const p = clamp01(base.param[punchId] ?? punch.param.def);
  return {
    values: { ...resting, ...punch.values(p, l) },
    takeover: punch.takeover,
    boost: punch.takeover ? 1 : punch.boost * l,
    glitch: !!punch.glitch,
  };
}

/** A punch at a sweep level: one written lane's contribution at a step. */
export interface PunchLayer {
  id: number;
  lvl: number;
}

/** Several punches at once (the FX lanes play layered). Each layer's overrides on the resting chain are
 * stacked in order, a later layer winning where two touch the same value; takeover (or glitch) if any layer is,
 * and the loudest boost. One layer is exactly `manglerTarget`. */
export function layeredTarget(base: ManglerBase, layers: readonly PunchLayer[]): ManglerTarget {
  if (layers.length === 0) return manglerTarget(base, 0, 0);
  const resting = baseValues();
  const values = { ...resting };
  let takeover = false;
  let glitch = false;
  let boost = 0;
  for (const { id, lvl } of layers) {
    const t = manglerTarget(base, id, lvl);
    for (const k of Object.keys(resting) as ManglerKey[]) if (t.values[k] !== resting[k]) values[k] = t.values[k];
    takeover ||= t.takeover;
    glitch ||= t.glitch;
    boost = Math.max(boost, t.boost);
  }
  return { values, takeover, boost, glitch };
}

/** The punches the written lanes of a pattern hold at `step`, in lane order. */
export const laneLayers = (pat: Pattern, step: number): PunchLayer[] =>
  pat.fxLanes.flatMap((l) => (l.fx[step] ? [{ id: l.fx[step], lvl: l.fxLvl[step] }] : []));

/** Punches whose level swings back and forth (0 → 1 → 0 …) for as long as the pad is held. */
export const PING_PONG = new Set([5]);
/** Half-period of a ping-pong swing when the sweep time is NOW, in 16th steps. */
export const PING_PONG_NOW_STEPS = 8;

/** Sweep level reached `elapsed` seconds after a punch went down. */
export function sweepLevel(base: ManglerBase, bpm: number, elapsed: number, punchId = 0): number {
  const steps = SWEEPS[base.sweep]?.steps ?? 0;
  const pingPong = PING_PONG.has(punchId);
  if (steps === 0 && !pingPong) return 1;
  const t = elapsed / ((steps || PING_PONG_NOW_STEPS) * (15 / bpm));
  if (!pingPong) return clamp01(t);
  const ph = ((t % 2) + 2) % 2;
  return ph <= 1 ? ph : 2 - ph;
}
