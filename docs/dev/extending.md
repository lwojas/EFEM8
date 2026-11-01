# Extending FM.8

Recipes for the changes people actually make. Each lists every file you touch and the tests that will tell you if you
missed one. Run `npm test` and `npm run build` (which type-checks) after each.

- [Add or change a knob on an engine](#add-or-change-a-knob-on-an-engine)
- [Add an engine](#add-an-engine)
- [Add a Punch FX](#add-a-punch-fx)
- [Add a scale or genre preset](#add-a-scale-or-genre-preset)
- [Add an arpeggiator rate or direction](#add-an-arpeggiator-rate-or-direction)
- [Add an externally controllable parameter](#add-an-externally-controllable-parameter)
- [Change the MIDI map](#change-the-midi-map)
- [Persist a new piece of project state](#persist-a-new-piece-of-project-state)
- [Add an action and a control](#add-an-action-and-a-control)
- [Add a lockable parameter (and LFO target)](#add-a-lockable-parameter-and-lfo-target)

---

## Add or change a knob on an engine

A knob is a `ControlSpec` in the engine's `controls` in `engines.ts`, written with the `knobs(...)` helper so its key is positional
(`k1`..`k5`).

```ts
exp("DECAY", DmThumpParam.Decay, 0.15, 1.2, 0.45, "s"),   // exponential taper
lin("PUNCH", DmThumpParam.Punch, 0, 1, 0.55),             // linear, shown as %
```

1. **`engines.ts`**: change the row. Choose a *narrow* range: the whole travel should be musical. A stepped control uses the object
   form with `steps: [...]` (the BASS's COLOR is the model). Every engine has exactly `KNOBS` (5) knobs, because the sound panel, the
   MIDI map and the parameter ids are the same shape whatever is in a slot.
2. **Saved data.** Saved `sound` arrays are indexed by position, so changing a knob's *meaning* in the middle of an engine changes what
   old projects mean. Keep the order, or add a migration in `persist.ts`.
3. **`midi/mapping.ts` and `params.ts`**: nothing; both address knobs by position (`track.N.sound.k1`..`k5`, CC 70, 72, 73, 75, 76).
4. UI: nothing. Panels render from the engine's `controls`.

Tests: `engine.test.ts` (defaults inside range, five knobs per engine) and `midi.test.ts` (every knob of every track is mapped).

---

## Add an engine

An engine is a row of `ENGINES` in `engines.ts`: a `name` and `short`, a one-line `engine` description, a `role` (`drum` gets pads and
a choke group, `bass` and `tone` get a piano roll and the arpeggiator), the webdsp `kind`, five `controls`, the `fixed` parameters
pinned behind them, a `gainDb` trim, a starting `mix` (level and sends) and, for melodic engines, `rootMidi`, `noteLo`, `noteHi` and
`defaultNote`. Append it **last**: a saved lineup stores an index into `ENGINES`, so reordering changes what old projects load.
Everything else (the engine chips, the track's accent, the audio graph, step compile, locks, MIDI) follows from the row. A new
`InstrumentKind` may also need a case where the audio layer builds instruments.

The default lineup is `DEFAULT_ENGINES` (an index per slot). `setEngine` (`actions.ts`) is the one place a slot changes engine: it resets
the slot in every pattern and keeps the rhythm.

---

## Add a Punch FX

A Punch FX is an entry in `PUNCHES` (`engine/mangler.ts`) and, if it needs a new effect, one new audio slot.

**Using the existing chain** (filter, saturation, crush, phaser, flanger, dub echo, reverb): add one object.

```ts
{
  id: 10,                                  // next free id. Ids are stored in saved FX lanes: never reuse or renumber
  label: "GATE", hint: "STUTTER GATE",
  takeover: true,                          // cut the dry mix and send everything through the chain
  boost: 1,                                // throw level at full (non-takeover only)
  param: { label: "RATE", def: 0.5, format: (n) => `${n.toFixed(2)}` },
  values: (p, l) => ({ ...overrides }),    // p = character knob, l = sweep level 0..1
}
```

`values` returns only the keys it changes; the rest rest. A takeover must include `...OWN` so the wet-only returns step
aside. Keep `l = 0` transparent: the effect must fade in from nothing. The pads, the knob panel, the FX lane and the
written-lane scheduling are all generated from `PUNCHES`; no UI change is needed. `defaultMangler()` sizes the
per-pattern `param` array from the catalogue, and `manglerTarget` falls back to `param.def` for patterns saved before
the pad existed.

**Adding a new effect to the chain:**

1. `mangler.ts` — extend `ManglerKey`, `FxSlot`, `MANGLER_PARAMS` (key → slot + `NodeParam`) and `baseValues()` (a
   *transparent* resting value).
2. `audio.ts` — add the slot to the list in the `Groovebox` constructor (this fixes its position in the chain).
3. If it is a pad with a new `PING_PONG` behaviour, add its id to that set.

Tests: "offers the new catalogue with one parameter each" pins the list of pad labels, so **update that list** when you add a pad; "sweeps in: level 0 is transparent" and the takeover test cover the rest.

Tip: to hear `values` without a browser, evaluate `manglerTarget(base, id, lvl)` and inspect the numbers, as the tests do.

---

## Add a scale or genre preset

`scale.ts`: a `SCALES` entry (`id`, `label`, `intervals` from the root, ascending from 0) or a `SCALE_PRESETS` entry
(`root` 0–11, `scale` id). Scale ids are saved in projects; `normalizeScale` falls back to chromatic for unknown ones,
so removing a scale is safe and renaming it is not.

---

## Add an arpeggiator rate or direction

`arp.ts` is self-contained.

- **Rate:** append to `ARP_RATES` as a length in 16th steps. **Append only**: `ArpSettings.rate` is a saved index.
- **Direction:** extend `ArpDirection` and `ARP_DIRECTIONS`, then add a case to `arpIndex`.

`normalizeArp` clamps stale values on load. The UI builds its choices from these arrays.

---

## Add an externally controllable parameter

Parameters are the contract with MIDI, plugin hosts and automation. `engine/params.ts → build()`:

```ts
defs.push({
  id: "swing", label: "Swing", kind: "norm", min: 0, max: 1, def: 0,
  get: (s) => (s.swing - 0.5) / 0.25,
  set: (v) => setState({ swing: 0.5 + v * 0.25 }),
});
```

- `kind` is `norm` (0..1), `int` (whole numbers, optional `labels`) or `bool`.
- `get` reads `AppState`. `set` **must go through the same action the UI uses**, so the UI follows by itself.
- **Ids are permanent once shipped.** They are the external contract: DAW automation lanes are bound to them.
- If `set` changes state other than `patterns`, `mutes`, `solos`, `pattern` or `arp`, extend the early-return in
  `onParamChange` so the change is reported.

Then give it a CC in `midi/mapping.ts` (next recipe). `paramManifest()` lists it for a host automatically.

---

## Change the MIDI map

Edit `midi/mapping.ts`. It is data, and the engine validates it.

```ts
parameters["track.1.volume"] = { cc: 7, channel: 1 };
parameters["track.7.sound.k1"] = { cc: 70, channel: 7 };   // knob 1 of whatever engine is on track 7
```

Pattern selection is not a CC; it is the `program` entry (Bank Select + Program Change). A mapping entry is
`{ cc, channel?, invert?, label? }`. `channel` is 1–16 and defaults to `defaultChannel`. Unknown
parameter ids, bad channels and doubled CCs are reported as warnings rather than failing (`compileMapping`), and the test
"compiles against the real parameters with no warnings" keeps the shipped map clean.

---

## Persist a new piece of project state

Say you add `s.metronome`.

1. `state.ts` — add to `AppState` and `initialState()`.
2. `persist.ts` — add to `Saved` (optional, since old saves lack it), to `snapshot()`, to the `persisted` list in
   `autosave()`, and to `parseProject`, defaulting when absent and clamping when present.
3. Never make `valid()` stricter without a migration.

If it is performance state (not part of the music), do not persist it; put it in `AppState` only.

---

## Add an action and a control

1. Put the edit in `actions.ts`. It takes plain arguments, calls `editPattern` or `setState`, and may call
   `controller.audition(...)` for immediate feedback. No React.
2. In the component, call the action from the handler and read state with `useStore((s) => …)`. Pick selectors that
   return primitives so only this component re-renders.
3. Use `Knob`/`Slider` from `ui/controls.tsx` for a continuous value (they give double-tap reset and keyboard nudge), and `Stepper` (the BPM readout between − and +) for a small integer or decimal value.
4. Do not read `getState()` during render, and do not call the controller to change state.
5. If the change must reach the audio engine, you normally need nothing: the controller observes `patterns`, `mutes`,
   `solos` and `pattern`, and `applySound`/`applyMix` push what changed. New *kinds* of audio parameter belong in
   `audio.ts`.

---

## Add a lockable parameter (and LFO target)

A *lockable* parameter is one a step can override (TWEAK) and an LFO can move. The list is `LOCKS` in `engine/plock.ts`.

1. **`plock.ts`**: add a `LockParam` with a **permanent** `id` (it is the key in `Step.parameterLocks` and in `Lfo.target`, so it
   is saved), a `label`, a `target` and a `base(tp)` that reads the pattern's value.
2. **`audio.ts → lockWrites`**: add the branch that turns the value into engine writes. Use the **same keys** as the mixer or sound
   writes use for that parameter, so a lock, an LFO and the base share caches.
3. **`actions.ts → setLockable`** and **`params.ts`**: route the on-screen control and the parameter through `setLockable` so TWEAK
   mode edits the step's lock instead of the base.
4. **LFO list**: `useTargets` in `ui/LfoModal.tsx` decides which lock ids the menu offers for a track.
5. `sanitizeLocks` and `sanitizeLfos` keep only known ids, so a renamed id is lost from old saves.

Tests: `plock.test.ts`.
