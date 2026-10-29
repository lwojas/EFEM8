# FM Groovebox v1: audit and implementation plan

Status: **Stage 1 (audit) and Stage 2 (palette) complete. No product code changed yet.** Baseline on the unmodified
reference: `npm test` 150/150 pass, `npm run build` passes (webdsp resolved via a `../webdsp` symlink, see Setup notes).

## 1. Audit

### What the reference gives us
- Layering is clean: `store` → `actions` → observers (`controller`, `persist`, `params`); `audio.ts` is the only
  webdsp user. All behaviour outside `spec.ts` branches on `role` (`drum | bass | tone`), not on instrument identity.
  Exactly what `REFERENCE_RESKIN.md` promises. About 20 `role` branch sites; none name an instrument.
- Per-track data is **indexed by track and by control index**: `TrackPattern.sound: number[]` (normalised, length =
  `controls.length`), `Step.parameterLocks` (keyed by `instrument.<key>`), preset name, param ids
  `track.N.sound.<key>`, MIDI CC rows (`SOUND_KEYS`).
- The PRESET / KIT chip row already exists in the sound panel (`PresetChips` in `ui/Panels.tsx`). That is the natural
  home for an engine selector. No new UI element is needed.
- P-LOCK exists, so one HAT engine covers closed and open by locking DECAY on a step. This is why the two hat tracks
  don't need to be two engines.

### The fixed assumption we must break
`TRACKS` is a **module-level constant** (about 90 references in 19 files): `controls`, `kind`, `role`, `fixed`,
`gainDb`, `chokeGroup`, note range. `audio.ts` creates one webdsp instrument per row at construction and never
replaces it. An engine-per-track model needs these facts to be **state-dependent**. The reference's own guidance
("Behaviour is selected by `role`") means the change is mechanical: replace `TRACKS[i]` in generic code with a
resolver, and keep `TRACKS` only as the *slots* (name, accent, starting mix).

### Existing FM DSP in webdsp (all reused, none modified)
| Kind | What | Notes |
|---|---|---|
| `Fm` (8) | 2-op PM, stepped ratios, bass weight, `tone` LP, legato/slide | Already in Pulse.8. Proven bass/lead voice. |
| `DmThump` (11) | Pitch-swept FM + membrane overtone + click | kick, tom, tuned perc |
| `DmMetal` (12) | 4-op cross-modulated cluster + noise + HP, `spread` glides harmonic→bar→808→scattered | hat, cymbal, bell/bar |
| `DmTone` (13) | 4-op, 6 structures, per-modulator envelopes (DX trick) | pluck, EP/keys, FM bass, chord stab |
| `DmCrack` (14) | feedback 2-op body + noise bursts, noise PM; `burst` snare→clap | snare, clap, rim |
| `DmChaos` (15) | 3-op feedback ring + fold | digital/industrial lead, strange hits |
| `PercSynth` (16) | 2 osc + noise + filter. Subtractive-leaning. | **Excluded** (not FM, brief forbids drifting subtractive) |
| Kick/Snare/Hat/Tom/Clap/Bass/… | analogue-modelled, non-FM | Excluded |

Every Digital Machine puts `tune`, `decay`, depth at param ids 0/1/2 by design ("a client can swap Machines on a
track and keep those values"). The engine contract was designed for this product shape.

### Honest unknowns / risks
1. **DM voices are "first-pass, not tuned by ear"** (their own docs). "FM instruments sound good" is the highest
   product risk, and I cannot listen. Ranges will be set from the doc's measured behaviour and the reference's
   method (offline renders), then need a human ear pass.
2. **Dynamic role** (drum pads ↔ piano roll per track). See decision D1.
3. **VST path.** `nativeseq.ts` / host state address instruments by id; swapping an engine recreates the instrument.
   The host snapshot must record the engine per track and recreate instruments in a deterministic order. Needs the
   `vst:e2e` suite (webvst + native toolchain); I will flag it as unverified if that toolchain isn't present.
4. **Stale state on switch**: base sound values, step locks on sound controls, preset label, arp state, sustained
   notes on the old instrument, scheduled param ramps targeting the old instrument id, `soundCache` in `audio.ts`.
5. **Parameter ids**: `track.N.sound.<key>` would change meaning per engine, which is bad for DAW automation lanes.
6. Old saves: none exist for this product, so no migrations (per reskin doc).

## 2. Proposed engine palette (8 engines, for 8 slots)

Rule used: two engines only if they differ in *role or control surface*, not just defaults. Controls are ≤5 and map
onto the same five knob positions in every engine, so the Sound panel layout never changes.

| Engine | Role | DSP | Controls | Why it exists |
|---|---|---|---|---|
| **KICK** | drum | `DmThump`, ratio low, sweep high | TUNE · SWEEP · DECAY · PUNCH · DRIVE | FM kick. Same five knobs as the reference kick, so it's instantly familiar. |
| **SNARE** | drum | `DmCrack` | TUNE · DECAY · BODY · NOISE · BURST | `burst` sweeps snare → clap, so one engine replaces the reference's separate snare and clap. |
| **HAT** | drum (choke 1) | `DmMetal`, tone high | PITCH · DECAY · METAL(spread) · BRIGHT(tone) · NOISE | Closed and open via DECAY + P-LOCK. Choke group makes it behave like a hat. |
| **TOM** | drum | `DmThump`, ratio 1.59 | TUNE · SWEEP · DECAY · BODY · DAMP-style drive | Tuned percussion. **Same kind as KICK**; kept because it has a different tune range (80–360 Hz), overtone emphasis and a different musical job. First candidate to drop if the palette needs trimming. |
| **BASS** | bass | `Fm` (2-op) | TONE · MOD · BITE · DECAY · SLIDE | The reference's proven FM bass voice with legato/slide. Gives the bass role without DmTone. |
| **PLUCK** | tone | `DmTone` Twin/Stack, hold 0 | TONE · MOD · DAMP · DECAY · DRIVE | 80s FM pluck / EP-ish keys. DAMP is the "DX trick" (strike brightness vs settled tone). |
| **BELL** | tone | `DmMetal` bar set, tone 0, noise 0 (pitched) | PITCH · DECAY · MOD · SPREAD · CHICK | Glassy, inharmonic, pitched. Not reproducible by PLUCK. |
| **LEAD** | tone | `DmChaos`, hold 1 | CHAOS · RATIO · FOLD · DECAY/HOLD · SWEEP | The harsh digital/industrial voice. Sustained notes via step gate. |

Held in reserve (not v1): chord stabs (`DmTone` Major/Minor/Sus), `DmChaos` as a percussion hit, `DmCrack` as rim.
They fit the existing engines' control model if wanted, with no new UI.

**Default lineup:** 1 KICK · 2 SNARE · 3 HAT · 4 TOM · 5 BASS · 6 PLUCK · 7 BELL · 8 LEAD.
Any engine on any track (all-percussion, 4+4, mostly melodic are all reachable).

**Naming:** control labels follow the reference vocabulary (TUNE, DECAY, BITE, TONE...). No operator, ratio or
algorithm terms in the UI. `ratio`/`structure` are pinned per engine, or hidden behind one musical knob (e.g. METAL,
COLOR) mapped across a curated sweet-spot range.

## 3. Architecture changes (smallest clean set)

**D0. Product config file.** New `src/engines.ts` (a plain table, per the reskin doc's "no plugin framework" rule):
`ENGINES: EngineSpec[]` (name, short, role, webdsp `kind`, controls, fixed, gainDb, chokeGroup, note range) and
`DEFAULT_ENGINES: number[]` (the lineup). Reuses `ControlSpec`/`normToUnits` unchanged. A future product swaps this
one file.

**D1. Role is a property of the engine, and a track's role follows its engine.** `TRACKS` shrinks to *slots*
(id, name, accent colour class, starting mix). Generic code switches from `TRACKS[i].role` to `specFor(state, i)`
(returns slot + current engine merged into a `TrackSpec`, same shape as today, so most call sites change by one
function). Accent colour follows role (drum / bass / tone), as today.

**D2. Engine is project state, not pattern state.** `AppState.engines: number[]` (saved, in host snapshot). Sound
values stay per pattern as in the reference. Reason: patterns switch at loop boundaries, and swapping a webdsp
instrument mid-song would be a hazard; the engine is "what is plugged into the slot".

**D3. Switching engine** (`setEngine(track, engine)` action) does, atomically:
reset the track's sound to the new engine's defaults in **every** pattern, delete sound-control locks on that
track's steps (keep send locks), convert step shape drum↔melodic (give new melodic steps `defaultNote`, drop notes on
drum), clear arp state and the preset label, silence the old instrument, then `audio.ts` swaps the instrument on the
same bus (`removeInstrument` + `createInstrument`, re-apply gain/fixed, clear `soundCache` for that track).

**D4. Stable parameter ids.** `track.N.sound.<key>` becomes `track.N.sound.p1..p5` (slot-based). Labels and ranges
come from the active engine; MIDI CCs and automation lanes keep meaning "knob k of track N" across engine changes.
`SOUND_KEYS` becomes uniform. `params.ts` registry is built per slot. This is a one-time change before any shipping,
so the "don't change shipped ids" rule isn't violated.

**D5. UI.** `PresetChips` becomes the **ENGINE** chip row (8 chips, short names, no panel). Choosing a chip = choosing
an instrument and loading its default sound. Engine-internal presets are dropped in v1 (simplify to make room; the
product principle). Sequencer, mixer, PFX/Punch UI, transport, mobile layout: unchanged.

**Out of scope, untouched:** `controller.ts` timing, `ticker.ts`, `stepcompile.ts` scheduling logic, `mangler.ts`
and Punch FX, mixer/sends, MIDI engine files. Only their `TRACKS[...]` lookups move to the resolver.

## 4. Stages

1. **Setup/identity** (`product.ts` name+id, `index.html`, `package.json`, CMake ids, remove legacy migrations, theme tokens).
2. **Engines table + resolver** with *the current default lineup mapped to today's reference instruments* first, so
   the refactor is proven behaviour-neutral (all 150 tests green) before any FM sound is introduced.
3. **Engine switching** (state, action, audio swap, persist, host snapshot, params ids, MIDI map, chips).
4. **FM engines**: ranges from offline renders; presets removed; `demoPattern`/`randomizeTrack` density per role.
5. **Validate**: unit tests (switch leaves no stale sound/locks/arp; save/load; params), desktop + 390px mobile via
   Playwright, audio lifecycle, VST e2e if the toolchain exists.

## 5. Decisions I need from you (before Stage 3)
- **Name/id** for the product (the `id` is permanent: it prefixes saves and DAW state).
- **Repo layout**: I cloned into `efem/PulseEight/` with its git history. Do you want it flattened into `efem/` as a
  fresh repo (history of the reference dropped, remote removed)? Recommended.
- Confirm **D1** (a track's drum/melodic UI follows its engine) and **D5** (engine chips replace presets).

## Setup notes
`package.json` points at `file:../webdsp`. In this layout webdsp lives at `Lech/webdsp`, so `efem/webdsp` is a symlink
to it. Flattening the repo changes the relative path; fix then.
