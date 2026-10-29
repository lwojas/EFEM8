// Track layout and the macro control surface. A track is a *slot* (an id, 0..7) holding one engine from
// `engines.ts`; this file resolves the two into the `TrackSpec` the rest of the app reads: which webdsp
// instrument plays, which of its parameters are exposed as macro knobs, over what sweet-spot range.
//
// Every control is stored as a normalised 0..1 value (so retuning a range never breaks saved
// patterns) and mapped to engine units here. Ranges are narrower than the engine's on purpose:
// the whole knob travel should be musical.
import { DEFAULT_ENGINES, ENGINES, type ControlSpec, type EngineSpec, type Role, type Unit } from "../engines";

export { FM_COLORS, KNOBS } from "../engines";
export type { ControlSpec, Role, Unit };

export interface TrackSpec extends EngineSpec {
  id: number;
  /** CSS custom property holding this track's accent colour (follows the engine's role). */
  accent: "--drum" | "--bass" | "--tone";
}

export const NUM_TRACKS = 8;

const ACCENT: Record<Role, TrackSpec["accent"]> = { drum: "--drum", bass: "--bass", tone: "--tone" };

/** The engine in each slot, as the app sees it. This array is a live view of `AppState.engines`: `store.ts` calls
 * `setLineup` whenever that changes, before anything observes the change, and nothing else writes it. Read it at the
 * moment of use (never cache a derived list at module load); components re-render for a change via `state.engines`. */
export const TRACKS: TrackSpec[] = [];

export function setLineup(engines: readonly number[]): void {
  TRACKS.length = 0;
  for (let id = 0; id < NUM_TRACKS; id++) {
    const e = ENGINES[engines[id]] ?? ENGINES[DEFAULT_ENGINES[id]];
    TRACKS.push({ ...e, id, accent: ACCENT[e.role] });
  }
}
setLineup(DEFAULT_ENGINES);

/** Tracks that play a piano roll (bass and tone engines), by current lineup. */
export const melodicTracks = (): number[] => TRACKS.filter((t) => t.role !== "drum").map((t) => t.id);

// --- normalised <-> engine units -------------------------------------------------------------

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

export function normToUnits(c: ControlSpec, n: number): number {
  n = clamp01(n);
  if (c.steps) return Math.round(n * (c.steps.length - 1));
  if (c.curve === "exp") return c.lo * Math.pow(c.hi / c.lo, n);
  if (c.curve === "pow") return c.lo + (c.hi - c.lo) * Math.pow(n, c.gamma ?? 1);
  return c.lo + n * (c.hi - c.lo);
}

export function unitsToNorm(c: ControlSpec, v: number): number {
  if (c.steps) return c.steps.length > 1 ? clamp01(v / (c.steps.length - 1)) : 0;
  if (c.curve === "exp") return clamp01(Math.log(v / c.lo) / Math.log(c.hi / c.lo));
  const lin = clamp01((v - c.lo) / (c.hi - c.lo));
  return c.curve === "pow" ? Math.pow(lin, 1 / (c.gamma ?? 1)) : lin;
}

export function defaultSound(track: TrackSpec): number[] {
  return track.controls.map((c) => unitsToNorm(c, c.def));
}

/** Readout for a control at a normalised value, e.g. "52 Hz", "380 ms", "78%". */
export function formatControl(c: ControlSpec, n: number): string {
  const v = normToUnits(c, n);
  if (c.steps) return c.steps[Math.round(v)] ?? "";
  switch (c.unit) {
    case "Hz": return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 2)} kHz` : `${Math.round(v)} Hz`;
    case "s": return v < 1 ? `${Math.round(v * 1000)} ms` : `${v.toFixed(2)} s`;
    case "st": return `${v >= 0 ? "+" : ""}${v.toFixed(1)} st`;
    case "oct": return `${v.toFixed(1)} oct`;
    case "%": return `${Math.round(clamp01(unitsToNorm(c, v)) * 100)}%`;
    default: return v.toFixed(2);
  }
}

// --- notes -----------------------------------------------------------------------------------

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

/** MIDI 24 is C1 (the convention used in the design mock-up). */
export function noteName(midi: number): string {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

export const isBlackKey = (midi: number) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
