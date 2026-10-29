import { beforeEach, describe, expect, it, vi } from "vitest";
import { NodeParam } from "webdsp";
import { setEngine, setFilter, setLockable, setPlockMode } from "../src/engine/actions";
import { Groovebox, lockWrite, trackFxWrites, type GraphIds } from "../src/engine/audio";
import { getParam, setParam } from "../src/engine/params";
import { lockParam } from "../src/engine/plock";
import { initialState } from "../src/engine/state";
import { getState, replaceState, setState } from "../src/engine/store";
import { filterHz, filterOpen, filterQ, FILTER_MAX_HZ, FILTER_MAX_Q, FILTER_MIN_HZ, FILTER_MIN_Q } from "../src/engine/trackfx";

const T = 4;
const tp = () => getState().patterns[getState().pattern].tracks[T];
const ids = {
  trackBus: Array.from({ length: 8 }, (_, i) => 200 + i), filterFx: Array.from({ length: 8 }, (_, i) => 400 + i),
  delayBus: Array.from({ length: 8 }, (_, i) => 500 + i), reverbBus: Array.from({ length: 8 }, (_, i) => 600 + i),
  delayFx: Array.from({ length: 8 }, (_, i) => ({ dub: 700 + i, free: 800 + i })), reverbFx: Array.from({ length: 8 }, (_, i) => 900 + i),
} as unknown as GraphIds;

beforeEach(() => replaceState(initialState()));

describe("track filter: state", () => {
  it("starts transparent: low-pass, fully open, no resonance", () => {
    for (const t of getState().patterns[0].tracks) expect(t.filter).toEqual({ mode: 0, cut: 1, res: 0 });
    expect(filterHz(1)).toBeCloseTo(FILTER_MAX_HZ);
    expect(filterHz(0)).toBeCloseTo(FILTER_MIN_HZ);
    expect(filterQ(0)).toBeCloseTo(FILTER_MIN_Q);
    expect(filterQ(1)).toBeCloseTo(FILTER_MAX_Q);
  });

  it("changing the mode puts the cutoff at that mode's open end, so a switch never closes the track", () => {
    setFilter(T, { cut: 0.3 });
    setFilter(T, { mode: 1 });
    expect(tp().filter).toMatchObject({ mode: 1, cut: filterOpen(1) });
    setFilter(T, { cut: 0.6, mode: 1 }); // same mode: the cutoff is taken as given
    expect(tp().filter.cut).toBe(0.6);
    setFilter(T, { mode: 0 });
    expect(tp().filter.cut).toBe(1);
  });

  it("clamps values and edits only the pattern on screen", () => {
    setFilter(T, { cut: 5, res: -1 });
    expect(tp().filter).toMatchObject({ cut: 1, res: 0 });
    setFilter(T, { cut: 0.2 });
    expect(getState().patterns[1].tracks[T].filter.cut).toBe(1);
  });

  it("is reset, with its locks, when the slot's engine changes; send locks stay", () => {
    setFilter(T, { cut: 0.2, res: 0.8 });
    setPlockMode(true);
    setState({ focus: T, selStep: 2 });
    setLockable(T, "fx.filterCut", 0.1);
    setLockable(T, "fx.delaySend", 0.7);
    setEngine(T, 5);
    expect(tp().filter).toEqual({ mode: 0, cut: 1, res: 0 });
    expect(tp().steps[2].parameterLocks).toEqual({ "fx.delaySend": 0.7 });
  });
});

describe("track filter: graph", () => {
  it("writes mode, cutoff (Hz) and resonance (Q) to the track bus's filter, for every track", () => {
    setFilter(T, { cut: 0.5, res: 0.5 });
    const writes = trackFxWrites(ids, getState().patterns[0], (_, v) => v).filter((w) => w.kind === "fx" && w.effect === ids.filterFx[T]);
    const by = (p: number) => writes.find((w) => w.kind === "fx" && w.param === p)!;
    expect(by(NodeParam.FilterCutoff).value).toBeCloseTo(filterHz(0.5));
    expect(by(NodeParam.FilterResonance).value).toBeCloseTo(filterQ(0.5));
    expect(by(NodeParam.FilterMode).value).toBe(0);
    expect(writes.every((w) => w.kind === "fx" && w.bus === ids.trackBus[T])).toBe(true);
    expect(trackFxWrites(ids, getState().patterns[0], (_, v) => v).filter((w) => w.kind === "fx" && w.param === NodeParam.FilterCutoff)).toHaveLength(8);
  });

  it("a lock writes the same key the base uses, so the two share caches", () => {
    const base = trackFxWrites(ids, getState().patterns[0], (_, v) => v).find((w) => w.key === `${T}:fCut`)!;
    const lock = lockWrite(ids, T, lockParam(T, "fx.filterCut")!, 0.25);
    expect(lock).toMatchObject({ kind: "fx", key: base.key, bus: ids.trackBus[T], effect: ids.filterFx[T], param: NodeParam.FilterCutoff });
    expect(lock.value).toBeCloseTo(filterHz(0.25));
  });

  it("schedules a lock as an effect parameter on its step and the base on the next", () => {
    setPlockMode(true);
    setState({ focus: T, selStep: 3 });
    setLockable(T, "fx.filterCut", 0.2);
    setFilter(T, { res: 0 });
    const scheduled: any[][] = [];
    const gb = Object.create(Groovebox.prototype) as any;
    gb.runtime = { scheduleParams: vi.fn((e) => scheduled.push(e)), getCurrentTime: () => 0 };
    gb.ids = ids;
    gb.soundCache = Array.from({ length: 8 }, () => new Array(5).fill(NaN));
    gb.busCache = new Map();
    gb.fxCache = new Map([[`${T}:fCut`, 18000]]);
    gb.lockedParams = Array.from({ length: 8 }, () => new Map());
    gb.lockedKeys = new Set();
    const pat = getState().patterns[0];
    gb.scheduleLocks(pat, 3, 1.0);
    gb.scheduleLocks(pat, 4, 1.1);
    expect(scheduled).toHaveLength(2);
    const [lock] = scheduled[0];
    const [restore] = scheduled[1];
    expect(lock).toMatchObject({ time: 1.0, target: { effect: { bus: ids.trackBus[T], effect: ids.filterFx[T] } }, param: NodeParam.FilterCutoff });
    expect(lock.value).toBeCloseTo(filterHz(0.2));
    expect(restore.value).toBeCloseTo(filterHz(1));
    expect(gb.fxCache.get(`${T}:fCut`)).toBeCloseTo(filterHz(1)); // back on the base
  });
});

describe("track filter: parameters", () => {
  it("is addressable by id and follows P-LOCK mode like the knobs", () => {
    setParam("track.5.filterMode", 1, "midi");
    setParam("track.5.filterCut", 0.4, "midi");
    setParam("track.5.filterRes", 0.7, "midi");
    expect(tp().filter).toEqual({ mode: 1, cut: 0.4, res: 0.7 });
    expect(getParam("track.5.filterRes", getState())).toBe(0.7);
    expect(getParam("track.5.filterMode", getState())).toBe(1);
    setPlockMode(true);
    setState({ focus: T, selStep: 1 });
    setParam("track.5.filterCut", 0.9, "midi");
    expect(tp().filter.cut).toBe(0.4); // the base is untouched
    expect(tp().steps[1].parameterLocks).toEqual({ "fx.filterCut": 0.9 });
    expect(getParam("track.5.filterCut", getState())).toBe(0.9);
  });
});
