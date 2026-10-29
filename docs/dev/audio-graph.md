# Audio graph

`engine/audio.ts` builds the whole signal path from webdsp primitives: instruments, buses, bus sends and effects. There
are no custom DSP nodes in FM.8.

## Topology

A webdsp bus has **one main route and one send**. Each track therefore needs a short chain of four buses, each adding
one tap:

```
instrument ─▶ A ─main─▶ B ─main─▶ D ─main─▶ C ─main─▶ master ─▶ limiter
 (track filter) │         │         │         │
              │         │         │         └─send─▶ PUNCH bus ─▶ master
              │         │         └─send─▶ GLITCH bus ─▶ PUNCH bus   (always 1; the bus is silent until a glitch is held)
              │         └─send─▶ REVERB_t  (wet only)
              └─send─▶ DELAY_t   (wet only)
```

| Bus | Holds | Sends |
|---|---|---|
| **A** | The track filter (a webdsp Filter effect on the bus: resonant LP/HP), then the fader and mute (`BusGain`) | the track's delay send |
| **B** | | the track's reverb send |
| **D** | The glitch cut (`BusMainGain`) | the glitch tap, always at 1 for a track that takes part in punch FX |
| **C** | The takeover cut (`BusMainGain`) | the punch send |
| **DELAY_t** | Dub Delay (beat mode) → Delay (free mode); one is live, the other has mix 0 | |
| **REVERB_t** | Reverb at mix 1 | |
| **GLITCH** | One Glitch effect (ring buffer: repeat, tape, gate). Bus gain 0 until a glitch is held. Plays into PUNCH | |
| **PUNCH** | Filter → Saturation → Bitcrusher → Phaser → Chorus/Flanger → Dub Delay | |

Consequences, deliberately:

- The fader/mute is at A, **before** every tap, so mute and level silence the sends too.
- The punch send leaves from C, **after** the sends, so the punch bus hears the faded, un-delayed track.
- During a **takeover** punch, C's main gain is cut to 0 and its send raised to 1: the dry signal is removed and the
  whole mix goes through the punch chain. A **throw** leaves C's main at 1 and raises the send by `boost × level`.
- The track filter is on A's own chain, ahead of its gain and sends, so a filtered track is filtered into its delay and reverb too.
- The **glitch tap** (D) sits before C and feeds the GLITCH bus continuously, so its ring buffer always holds what just
  played: a REPEAT captures the last beat-fraction from *before* the pad went down. While a glitch punch is held, D's main
  is cut and the GLITCH bus opens (`mixWrites` `glitch`), so the glitch replaces the dry mix and flows on into the PUNCH
  bus, where another punch (DRIVE, say) can still process it. At most 8 + 8×5 + 2 = 50 of webdsp's 64 buses are used.
- An unfed bus costs nothing: webdsp sleeps buses with no input, so idle sends are free.

Instruments are created on bus A. Fixed (unexposed) instrument parameters and a per-track gain trim (`gainDb` in the
spec) are applied at creation. Voice limit: 32.

## Level taper

`levelToGain(level) = level² × 1.1`: fine control at the bottom, about unity at 0.95.

## What is schedulable and what is not

| Thing | Mechanism | Accuracy |
|---|---|---|
| Notes | `instrumentNoteOn({ time })` | sample-accurate |
| Instrument parameters at a pattern change | `scheduleParams` | sample-accurate |
| Punch FX chain values in a written lane | `scheduleParams` with `from`/`value`/`ramp` | sample-accurate, ramped |
| Bus gains, sends, main gain | not schedulable in webdsp | applied from the 10 ms audio-clock ticker (`TimedQueue`) |

That last row is the one known compromise: punch *routing* changes land within a few milliseconds of their step. At
sixteenth-note resolution this is inaudible. If webdsp gains schedulable bus parameters, the `TimedQueue` and
`Groovebox.when` can be deleted.

## Caching

`Groovebox` keeps `soundCache`, `busCache`, `fxCache`, `manglerCache` and `scheduled`. `applySound`, `applyMix`,
`applyManglerValues` and `scheduleManglerSegment` send only values that differ. `resetManglerSchedule()` forgets them
on transport start and stop so the next write sends everything.

When a scheduled segment is written, the immediate cache entry for that key is dropped: the engine value is no longer
what the immediate path last wrote.

## The Punch chain

`mangler.ts` holds the data; `audio.ts` applies it.

- `MANGLER_PARAMS` maps each `ManglerKey` (`fCut`, `sDrive`, `pRate`…) to an effect slot and a webdsp `NodeParam`.
- `baseValues()` is the resting, **transparent** state: filter open at 20 kHz, every mix at 0, the dub echo return open,
  the glitch idle (`gMix` 0).
- The glitch slot lives on the GLITCH bus, not the PUNCH bus (`SLOT_ON_GLITCH_BUS`); `manglerWrites` and the scheduled
  segments address the right bus per slot.
- A `PunchDef.values(p, lvl)` returns *overrides* on top of the resting values, where `p` is the character knob and
  `lvl` the 0..1 sweep level. `manglerTarget` merges and returns `{ values, takeover, boost, glitch }`.
- Takeover punches must set `dMix: 0` (`OWN`) so the wet-only dub return gets out of the way. A **glitch** punch is not a takeover: it sets `glitch: true`.

`scheduleManglerSegment(from, to, time, dur)` turns a step of the written lane into `ScheduledParam` events: a ramp from
the level at this step to the level at the next when both are the same punch, a step otherwise.

## Limiter

webdsp's master limiter protects the output. Levels are balanced by `gainDb` in the spec, not by compensating in the
mixer.
