# Punch FX

Punch FX are what make FM.8 fun to perform with. There are nine effects (six processors and three glitches), all sharing one effects section. Hold a pad and the effect **fades in** while you hold it; let go and it fades back out. Press **REC FX** and your move is recorded
into the pattern, including how far the effect had built up at every step.

## The pads

| Pad | Effect | Type | Main knob |
|---|---|---|---|
| **DRIVE** | Warm, tape-style distortion | takeover | DRIVE |
| **CRUSH** | Lo-fi crunch (bit and sample-rate reduction) | takeover | CRUSH |
| **PHASE** | A swirling phaser | takeover | RATE (0.4 – 3 Hz) |
| **DUB** | An echo throw | throw | TIME (`1/16` … `1/8T`) |
| **SWEEP** | A filter sweep, closing or opening | takeover | SHAPE |
| **FLANGE** | A jet-plane flanger | takeover | RATE (0.1 – 1.2 Hz) |
| **REPEAT** | A beat repeat: loops the last slice of the beat | glitch | RATE (`1/4` … `1/32`) |
| **TAPE** | A tape stop, slow-down or reverse | glitch | SHAPE (`STOP`, `SLOW`, `REVERSE`) |
| **GATE** | A tempo-synced chop | glitch | RATE (`1/4` … `1/32`) |

**Takeover** effects take over the mix. While you hold the pad, the normal sound of every track is cut and the whole mix
plays through the effect, so nothing sneaks past it. A **throw** (DUB) leaves the mix playing and sends a part of each track
into the effect, so whatever is playing gets flung into an echo. **Glitches** (REPEAT, TAPE, GATE) work on a buffer that has
been quietly recording the mix all along, so they can grab what played *before* you touched the pad. While one is held it
replaces the normal mix.

- **REPEAT** captures the last slice of the beat (set by `RATE`) the instant you press, and loops it, even if the track has
  stopped. With a **RAMP** longer than NOW it becomes a **roll**: it starts up to two divisions slower and steps down to the
  chosen rate as you hold (1/4, then 1/8, 1/16, 1/32).
- **TAPE** slows the whole mix toward a stop (`STOP`), to half speed (`SLOW`) or backwards (`REVERSE`) as the effect builds.
  A bar-long ramp is a slow tape stop; NOW is a hard one.
- **GATE** chops the mix with a square wave at the chosen rate. The ramp sets how deep the chop gets.
- A glitch can be layered with another pad, including in the recorded lanes (REPEAT into DRIVE, for example).

Each pad has **one main knob**, shown in the Punch FX panel for the pad you pressed last. Its setting is saved with the
pattern. Turn it before you press the pad, or while you hold it.

### SWEEP shapes

| Shape | What it does |
|---|---|
| **CLOSE** | The filter closes from open to dark |
| **CLOSE RES** | The same, with a resonant whistle riding along |
| **OPEN** | The filter opens from dark to bright |
| **OPEN RES** | The same, with a resonant whistle |

SWEEP is the one pad that keeps moving while you hold it, swinging back and forth for as long as your finger is down.

## Fading in

A held effect doesn't jump straight on. It builds from nothing to full over the **RAMP** time:

| Setting | Time to reach full |
|---|---|
| **NOW** | Instant |
| **1 BEAT** | One beat |
| **2 BEATS** | Two beats (the starting setting) |
| **1 BAR** | One bar |

These times follow your tempo, so they speed up and slow down with the BPM. Use longer times for builds and NOW for
quick stabs.



## Recording effects

Press **REC FX** (the red dot). While the beat is playing and REC FX is on, whichever pad you hold is recorded into one
of the pattern's **three FX lanes**. The tabs above the pads switch the sequencer between **STEPS** and **LANE 1**,
**LANE 2** and **LANE 3**, each showing only that lane. A tab has an outline when its lane has something recorded.

- Each time you hold a pad, that's one take. It goes into the **first empty lane**, and all the lanes play back **together**,
  layered on the same effects section. When all three lanes are full, the next take wipes them all and starts again in
  lane 1.
- Each lane can hold one effect per step. It remembers the pad and **how far the effect had built up**, and plays back the
  whole movement as a smooth fade rather than a simple on and off.
- If you press a pad late in a step, it's placed on the next step.
- A pad you're holding always overrides what's recorded.
- **ERASE** (hold it down) clears every lane as the playhead passes over it.
- Tap a cell in a lane to clear just that step. **CLR LANE** wipes a whole lane (tap twice); **CLR FX**, beside REC FX,
  wipes all three.
- The **ON / OFF** button beside ERASE switches the recorded effects on or off without losing them. It shows the current
  state.
- If two lanes use the same part of the effect (say two SWEEPs), they compete for it and the higher lane wins.

Recorded effects line up with the steps: each effect switches on at a step, and its level moves smoothly in between.

## Tips

- Set **RAMP** to **1 BAR**, hold **SWEEP** (CLOSE) from the start of a pattern, and let go on the first beat of the next
  one. That's a build and a drop.
- **REPEAT** at `1/32` with a **1 BAR** ramp is a classic build: hold it and the loop gets faster and faster.
- **TAPE** (`STOP`) with **NOW**, on the last step of a pattern, is a record stop into the next pattern.
- Record a **DUB** throw on the last step of a pattern so it echoes into the next one.
- Effects are saved per pattern, so each pattern in a chain can have different recorded moves. See
  [Patterns & songs](06-patterns-and-songs.md).

Next: [Patterns & songs](06-patterns-and-songs.md).
