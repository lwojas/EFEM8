import { beforeEach, describe, expect, it, vi } from "vitest";
import { setArp, setEngine, setLockable, setPlockMode, setSound, tapStep, toggleStepFlag, setStepGate } from "../src/engine/actions";
import { Groovebox, mixWrites, type GraphIds, type Write } from "../src/engine/audio";
import { DEFAULT_ENGINES, ENGINES } from "../src/engines";
import { fromHostSnapshot, toHostSnapshot } from "../src/engine/persist";
import { getParam, paramManifest } from "../src/engine/params";
import { defaultSound, TRACKS } from "../src/engine/spec";
import { initialState } from "../src/engine/state";
import { getState, replaceState, setState } from "../src/engine/store";

const id = (name: string) => ENGINES.findIndex((e) => e.name === name);
const KICK = id("KICK");
const BASS = id("BASS");
const PLUCK = id("PLUCK");
const BELL = id("BELL");
const LEAD = id("LEAD");
const tp = (t: number, pattern = getState().pattern) => getState().patterns[pattern].tracks[t];

beforeEach(() => replaceState(initialState()));

describe("the lineup", () => {
  it("starts as the default engines and mirrors state.engines in TRACKS", () => {
    expect(getState().engines).toEqual([...DEFAULT_ENGINES]);
    getState().engines.forEach((e, t) => expect(TRACKS[t].name).toBe(ENGINES[e].name));
  });

  it("derives the role, accent and pitch range of a slot from its engine", () => {
    setEngine(0, BASS);
    expect(TRACKS[0].role).toBe("bass");
    expect(TRACKS[0].accent).toBe("--bass");
    expect(TRACKS[0].noteLo).toBe(ENGINES[BASS].noteLo);
    setEngine(0, KICK);
    expect(TRACKS[0].role).toBe("drum");
    expect(TRACKS[0].noteLo).toBeUndefined();
  });

  it("allows the same engine in several slots, and keeps exactly 8 tracks", () => {
    for (let t = 0; t < 8; t++) setEngine(t, KICK);
    expect(TRACKS.map((s) => s.name)).toEqual(new Array(8).fill("KICK"));
    expect(TRACKS).toHaveLength(8);
    expect(getState().patterns[0].tracks).toHaveLength(8);
  });
});

describe("switching an engine leaves nothing of the old one behind", () => {
  it("resets the knobs, mix and octave of the slot in every pattern, and no other slot", () => {
    setSound(4, 0, 0.9);
    setSound(5, 0, 0.9);
    const p2 = 7;
    setState((s) => {
      const patterns = s.patterns.slice();
      patterns[p2] = structuredClone(patterns[p2]);
      patterns[p2].tracks[4].sound[2] = 0.11;
      patterns[p2].tracks[4].level = 0.2;
      patterns[p2].tracks[4].oct = 2;
      return { patterns };
    });
    setEngine(4, LEAD);
    for (const p of [getState().pattern, p2]) {
      expect(tp(4, p).sound).toEqual(defaultSound(TRACKS[4]));
      expect(tp(4, p).level).toBe(ENGINES[LEAD].mix.level);
      expect(tp(4, p).oct).toBe(0);
    }
    expect(tp(5).sound[0]).toBe(0.9); // PLUCK untouched
  });

  it("drops sound locks but keeps send locks", () => {
    setPlockMode(true);
    setState({ focus: 4, selStep: 3 });
    setLockable(4, "instrument.k4", 0.2);
    setLockable(4, "fx.delaySend", 0.9);
    setEngine(4, PLUCK);
    expect(tp(4).steps[3].parameterLocks).toEqual({ "fx.delaySend": 0.9 });
  });

  it("keeps the rhythm: which steps are on, and their accents", () => {
    const before = tp(4).steps.map((s) => [s.on, s.acc]);
    setEngine(4, PLUCK);
    expect(tp(4).steps.map((s) => [s.on, s.acc])).toEqual(before);
  });

  it("resets the arpeggiator of the slot only", () => {
    setArp(4, { on: true, rate: 1 });
    setArp(5, { on: true });
    setEngine(4, BELL);
    expect(getState().arp[4].on).toBe(false);
    expect(getState().arp[5].on).toBe(true);
  });

  it("does nothing for the same engine or an unknown one", () => {
    const before = getState();
    setEngine(4, BASS);
    setEngine(4, 999);
    setEngine(4, -1);
    expect(getState()).toBe(before);
  });

  it("deselects the step of the track being changed", () => {
    setState({ focus: 5, selStep: 3 });
    setEngine(5, BELL);
    expect(getState().selStep).toBe(-1);
    setState({ focus: 0, selStep: 3 });
    setEngine(5, PLUCK);
    expect(getState().selStep).toBe(3);
  });
});

describe("notes follow the role of the engine", () => {
  it("a drum going melodic gets the engine's default note on every step", () => {
    setEngine(0, BASS);
    expect(tp(0).steps.every((s) => s.note === ENGINES[BASS].defaultNote)).toBe(true);
    expect(tp(0).steps.filter((s) => s.on)).toHaveLength(4); // the kick pattern, now a bass rhythm
  });

  it("melodic to drum clears notes, slides and gates", () => {
    setStepGate(4, 0, 2);
    expect(tp(4).steps[3].slide).toBe(true);
    setEngine(4, KICK);
    for (const s of tp(4).steps) {
      expect(s.note).toBe(0);
      expect(s.slide).toBe(false);
      expect(s.gate).toBeUndefined();
    }
  });

  it("melodic to melodic keeps notes inside the new range, and slides and gates", () => {
    const bass = TRACKS[4];
    const steps = tp(4).steps;
    expect(steps.some((s) => s.on && s.note < ENGINES[BELL].noteLo!)).toBe(true); // the demo bass line is below the bell's range
    setEngine(4, BELL);
    for (const s of tp(4).steps) {
      expect(s.note).toBeGreaterThanOrEqual(ENGINES[BELL].noteLo!);
      expect(s.note).toBeLessThanOrEqual(ENGINES[BELL].noteHi!);
    }
    expect(tp(4).steps.some((s) => s.slide)).toBe(true);
    expect(bass.name).toBe("BASS"); // the spec captured before the change is not mutated
  });

  it("drum pads and the piano roll follow: tapping a step edits by role", () => {
    setEngine(5, KICK); // PLUCK slot becomes a drum
    tapStep(5, 1);
    expect(tp(5).steps[1].on).toBe(true);
    expect(getState().selStep).toBe(-1); // a drum tap selects nothing
    tapStep(4, 1); // BASS: tap places a note and selects it
    expect(getState().selStep).toBe(1);
  });

  it("toggling a flag is still allowed on a melodic step after a switch", () => {
    setEngine(0, PLUCK);
    toggleStepFlag(0, 0, "slide");
    expect(tp(0).steps[0].slide).toBe(true);
  });
});

describe("parameter ids belong to the slot, not the engine", () => {
  it("is the same manifest whatever the lineup", () => {
    const before = paramManifest().map((p) => p.id);
    setEngine(0, LEAD);
    setEngine(3, BELL);
    expect(paramManifest().map((p) => p.id)).toEqual(before);
    expect(before).toContain("track.1.sound.k5");
    expect(before.filter((i) => i.includes(".sound."))).toHaveLength(8 * 5);
  });

  it("knob k of track N reads that control whichever engine is in the slot", () => {
    setSound(0, 1, 0.37);
    expect(getParam("track.1.sound.k2", getState())).toBe(0.37);
    setEngine(0, BASS);
    expect(getParam("track.1.sound.k2", getState())).toBe(defaultSound(TRACKS[0])[1]);
  });
});

describe("persistence", () => {
  it("round-trips the lineup and the data that belongs to it through a host snapshot", () => {
    setEngine(0, BASS);
    setEngine(7, KICK);
    setSound(0, 3, 0.8);
    const snap = toHostSnapshot();
    const engines = [...getState().engines];
    replaceState(initialState());
    expect(TRACKS[0].role).toBe("drum");
    const project = fromHostSnapshot(snap);
    expect(project).not.toBeNull();
    expect(project!.engines).toEqual(engines);
    replaceState({ ...getState(), ...project! });
    expect(TRACKS[0].name).toBe("BASS");
    expect(TRACKS[7].name).toBe("KICK");
    expect(tp(0).sound[3]).toBe(0.8);
    // the blank steps a snapshot drops come back with the default note of the engine the track was saved with
    expect(tp(0, 20).steps[63].note).toBe(ENGINES[BASS].defaultNote);
    expect(tp(7, 20).steps[63].note).toBe(0);
  });

  it("a snapshot that does not parse leaves the live lineup in force", () => {
    setEngine(2, BELL);
    const snap = toHostSnapshot();
    const data = JSON.parse(snap.data);
    data.project.engines = [BASS, BASS, BASS, BASS, BASS, BASS, BASS, BASS];
    data.project.patterns[0].tracks[0].sound = [0.5]; // wrong number of knobs
    expect(fromHostSnapshot({ ...snap, data: JSON.stringify(data) })).toBeNull();
    expect(TRACKS[2].name).toBe("BELL");
    expect(TRACKS[0].name).toBe("KICK");
  });

  it("unknown or missing engines in a save fall back to the default lineup's", () => {
    const snap = toHostSnapshot();
    const data = JSON.parse(snap.data);
    data.project.engines = [KICK, 999, "x"];
    const project = fromHostSnapshot({ ...snap, data: JSON.stringify(data) });
    expect(project!.engines).toEqual([KICK, ...DEFAULT_ENGINES.slice(1)]);
  });
});

describe("the audio layer swaps the instrument", () => {
  function fake() {
    const gb = Object.create(Groovebox.prototype) as any;
    const created: Array<[number, number]> = [];
    const set: Array<[number, number, number]> = [];
    const removed: number[] = [];
    let next = 500;
    gb.runtime = {
      removeInstrument: vi.fn((i: number) => removed.push(i)),
      createInstrument: vi.fn((kind: number) => { created.push([kind, next]); return next++; }),
      setInstrumentParameter: vi.fn((i: number, p: number, v: number) => set.push([i, p, v])),
    };
    gb.inst = Array.from({ length: 8 }, (_, i) => 100 + i);
    gb.trackBus = Array.from({ length: 8 }, (_, i) => 200 + i);
    gb.soundCache = Array.from({ length: 8 }, () => new Array(5).fill(0.5));
    gb.lockedParams = Array.from({ length: 8 }, () => new Map());
    gb.lockedKeys = new Set();
    gb.ids = { inst: gb.inst };
    return { gb: gb as Groovebox, created, set, removed };
  }

  it("frees the old instrument, builds the new engine's kind on the same bus with its pinned parameters, and forgets what it held", () => {
    const { gb, created, set, removed } = fake();
    (gb as any).lockedParams[4].set("instrument.k4", "4:3");
    (gb as any).lockedKeys.add("4:3");
    setEngine(4, LEAD);
    gb.setEngine(4);
    expect(removed).toEqual([104]);
    expect(created).toEqual([[ENGINES[LEAD].kind, 500]]);
    expect((gb.runtime.createInstrument as any).mock.calls[0][1]).toEqual({ bus: 204 });
    expect(gb.ids.inst[4]).toBe(500); // the shared id array is updated in place
    const pinned = set.filter(([i]) => i === 500).length;
    expect(pinned).toBe(1 + ENGINES[LEAD].fixed.length); // gain + fixed
    expect((gb as any).soundCache[4].every((v: number) => Number.isNaN(v))).toBe(true);
    expect((gb as any).soundCache[3].every((v: number) => v === 0.5)).toBe(true);
    expect((gb as any).lockedKeys.size).toBe(0);
    expect((gb as any).lockedParams[4].size).toBe(0);
  });
});

describe("glitch routing (mixWrites)", () => {
  const ids = {
    trackBus: [1, 2, 3, 4, 5, 6, 7, 8], busB: [11, 12, 13, 14, 15, 16, 17, 18], busC: [21, 22, 23, 24, 25, 26, 27, 28], busD: [31, 32, 33, 34, 35, 36, 37, 38], glitchBus: 99,
  } as unknown as GraphIds;
  const mix = (over: object) => ({ pattern: getState().patterns[0], mutes: [], solos: [], takeover: false, boost: 0, ...over });
  const value = (w: Write[], key: string) => w.find((x) => x.key === key)!.value;

  it("always feeds the glitch tap and never cuts it at rest", () => {
    const w = mixWrites(ids, mix({}), "punch");
    for (let t = 0; t < 8; t++) {
      expect(value(w, `${t}:gs`)).toBe(1);
      expect(value(w, `${t}:gm`)).toBe(1);
    }
    expect(value(w, "glitch:g")).toBe(0);
  });

  it("a held glitch cuts the tracks at the tap and opens the glitch bus, leaving the punch bus's takeover alone", () => {
    const w = mixWrites(ids, mix({ glitch: true }), "punch");
    for (let t = 0; t < 8; t++) {
      expect(value(w, `${t}:gm`)).toBe(0);
      expect(value(w, `${t}:gs`)).toBe(1);
      expect(value(w, `${t}:m`)).toBe(1); // bus C's main: only a takeover cuts it
      expect(value(w, `${t}:s`)).toBe(0);
    }
    expect(value(w, "glitch:g")).toBe(1);
  });

  it("a track that opts out of punch FX is neither fed to the glitch bus nor cut", () => {
    const pattern = structuredClone(getState().patterns[0]);
    pattern.tracks[2].punch = false;
    const w = mixWrites(ids, mix({ pattern, glitch: true }), "punch");
    expect(value(w, "2:gs")).toBe(0);
    expect(value(w, "2:gm")).toBe(1);
    expect(value(w, "1:gm")).toBe(0);
  });

  it("the pattern group writes none of it", () => {
    const w = mixWrites(ids, mix({ glitch: true }), "pattern");
    expect(w.some((x) => x.key.endsWith(":gs") || x.key.endsWith(":gm") || x.key === "glitch:g")).toBe(false);
  });
});
