import { describe, expect, it } from "vitest";
import { FILE_EXT, PRODUCT, storageKey } from "../src/product";
import { TRACKS } from "../src/engine/spec";
import { defaultLevel, newTrackPattern } from "../src/engine/state";
import { newDelay, newReverb } from "../src/engine/trackfx";

describe("product identity", () => {
  it("keeps the identifiers saved on users' machines stable", () => {
    expect(PRODUCT.id).toBe("fm8");
    expect(storageKey("midi")).toBe("fm8.midi");
    expect(storageKey("keyHighlight")).toBe("fm8.keyHighlight");
    expect(FILE_EXT).toBe(".fm8.json");
  });
});

describe("per-track mix defaults (TrackSpec.mix)", () => {
  it("gives every track a level and sends in range", () => {
    for (const t of TRACKS) {
      for (const v of [t.mix.level, t.mix.delay, t.mix.reverb]) expect(v >= 0 && v <= 1).toBe(true);
    }
  });
  it("feeds fresh patterns", () => {
    TRACKS.forEach((t, i) => {
      const tp = newTrackPattern(i);
      expect(tp.level).toBe(t.mix.level);
      expect(defaultLevel(i)).toBe(t.mix.level);
      expect(newDelay(i).send).toBe(t.mix.delay);
      expect(newReverb(i).send).toBe(t.mix.reverb);
    });
  });
  it("matches the shipped values", () => {
    expect(TRACKS.map((t) => t.mix.level)).toEqual([0.85, 0.75, 0.55, 0.6, 0.78, 0.62, 0.55, 0.5]);
    expect(TRACKS.map((t) => t.mix.delay)).toEqual([0, 0.15, 0.15, 0.3, 0.1, 0.3, 0.3, 0.3]);
    expect(TRACKS.map((t) => t.mix.reverb)).toEqual([0, 0.12, 0, 0.1, 0, 0.15, 0.3, 0.15]);
  });
});
