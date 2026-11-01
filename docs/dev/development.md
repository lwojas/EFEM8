# Development

## Setup

```bash
git clone <this repo> FM8
cd FM8
npm install
npm run dev                                            # http://localhost:5175 (next free port if taken)
```

`package.json` depends on `"webdsp": "git+https://github.com/lwojas/webdsp.git"` (its `main`), so `npm install` fetches and builds it
(its `prepare` script runs tsup); no sibling checkout is needed. FM.8 needs `TriggerParams.envelope` and the LFO helpers
(`lfoValueAt`, `LFO_DIVISIONS`), which are in webdsp `main`. To work on webdsp alongside, point the dependency at `file:../webdsp`
locally and do not commit that.

Node 22 is what CI uses.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc --noEmit` then `vite build` to `dist/` |
| `npm run preview` | Serve `dist/` |
| `npm test` | Vitest, once |
| `npm run vst:build` | Build the optional `FM8.vst3` (see [VST3 build](vst.md)) |
| `npm run vst:serve` | Production build served on port 5175, for a plugin pointed at local code |
| `npm run vst:e2e` | Headless end-to-end test of the plugin's host path, no DAW |

TypeScript is `strict` with `noUnusedLocals` and `noUnusedParameters`; the build fails on both.

### The Vite configuration

`vite.config.ts` excludes `webdsp`, `webdsp/worklet-url` and `webdsp/sequencing` from dependency pre-bundling. webdsp
resolves its AudioWorklet module with `new URL('./engine-processor.js', import.meta.url)`, and pre-bundling would move
the module and break that lookup. `server.fs.allow: [".."]` lets the dev server read a linked sibling checkout of webdsp, if you use one.

## Tests

Ten files under `test/`, Vitest, Node environment, no audio, no DOM (188 tests). They cover the pure logic:

| File | Covers |
|---|---|
| `engine.test.ts` | Control maths (normalised ↔ units, defaults inside range), Punch FX (transparent at rest, takeover and glitch rules, sweep level), sends, the randomiser (in range, in scale), scales, the arpeggiator |
| `engines.test.ts` | The engine palette: every engine's five knobs, ranges, pinned parameters and note range; changing a track's engine; the lineup in saved state |
| `filter.test.ts` | The per-track filter: mapping, open-by-default, lock and MIDI ids |
| `plock.test.ts` | Parameter locks: resolution over the base, sanitising, the scheduled writes, sends and MIDI-mapped knobs in TWEAK mode |
| `laststep.test.ts` | Per-track last step: polymeter loops, swing, arps, locks, chains |
| `record.test.ts` | Nearest-step and gate maths for note recording |
| `midi.test.ts` | Mapping validation, value conversion both ways, channels, echo suppression, banks, the clock follower, song position |
| `hoststate.test.ts` | Host-state save/restore and the compacted snapshot |
| `nativeseq.test.ts` | The song compiled to a native sequence |
| `product.test.ts` | The identifiers saved on users' machines stay stable |

What is **not** tested automatically: the sound itself, the scheduler against a real audio clock, and the React
components. Check those by ear and by eye (`npm run dev`), at phone width and wide.

When a change touches one of the invariants below, add the test that pins it.

## Invariants worth protecting

- `audio.ts` is the only importer of webdsp's runtime.
- `state.ts`, `spec.ts`, `plock.ts`, `lfo.ts`, `mangler.ts`, `arp.ts`, `scale.ts`, `song.ts` and `midi/clock.ts` stay free of React and the audio runtime.
- The playhead and key highlights do not go through React or the store.
- CC numbers appear only in `midi/mapping.ts`; channels are 1–16 everywhere except on the wire (`midi/control.ts`).
- Parameter ids, punch ids and saved-array positions are permanent. Append; never reorder.
- Old projects load. Every change of saved shape comes with a migration.
- Every browser-storage access is wrapped in try/catch.

## Performance

- One `data-play` attribute flip per step on the old and new cell (per track for the step pads, since a track with a last step has its own position); about 20 attribute writes, no React render.
- Animation is `transform`/`opacity` only. No blurred shadows or filters on step cells, knob arcs or sliders.
- The scheduler runs from a Web Worker timer, so UI work cannot delay it.
- `Groovebox` caches the last value it sent for every parameter; do not bypass the caches with direct runtime calls.
- Selectors return primitives or stable references.

## Deployment

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main` (or by hand):

1. Check out FM8 and `lwojas/webdsp` side by side.
2. `npm ci` webdsp, then FM8 (which runs webdsp's `prepare`).
3. `npm test`, then `tsc --noEmit && vite build --base=/<repo-name>/`.
4. Upload `dist/` and deploy.

A failing test or type error stops the deploy. The `--base` is the repository name, because Pages serves the site from
`/<repo>/`.

## Known limits

- Bus gains and sends are not schedulable in webdsp, so punch *routing* is applied from a 10 ms audio-clock ticker
  (a few ms of jitter, inaudible at 16th-note resolution). Effect and instrument changes at pattern boundaries are
  sample-accurate. A webdsp "schedulable bus params" feature would remove the ticker.
- FX writes are one punch per step per lane (step-quantised), three lanes per pattern.
- Sound constants are a first pass, set by measurement rather than by ear. Expect them to be tuned.
- MIDI input is control (CC, program change, clock) plus an optional keyboard device that plays the selected track. There is no MIDI output of notes or clock.
- LFOs are written once per tick (control rate) and do not play in the plugin's native sequence.
- Web MIDI availability depends on the browser.

## Related documents

- [Architecture](architecture.md) · [Audio graph](audio-graph.md) · [Timing](timing.md) · [State](state-and-persistence.md)
  · [Extending](extending.md) · [MIDI](midi.md) · [VST3 build](vst.md)
- `concept/styleguide/` — the visual design tokens and reference mock-up.
- webdsp's own `ARCHITECTURE.md` and `docs/` — the engine FM.8 is built on.
