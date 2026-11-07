# Punch FX

Punch FX are what make FM.8 fun to perform with. There are nine effects, played from a row of pads. Hold a pad and the effect **fades in** while you hold it; let go and it fades back out. Press **REC FX** and your move is recorded
into the pattern, including how far the effect had built up at every step.

## The pads

| Pad | What you hear | How it behaves | Main knob |
|---|---|---|---|
| **DRIVE** | Warm, tape-style distortion | The whole mix goes through it | DRIVE |
| **CRUSH** | Lo-fi crunch, like an old sampler | The whole mix goes through it | CRUSH |
| **PHASE** | A swirling, whooshing phaser | The whole mix goes through it | RATE (0.4 – 3 Hz) |
| **DUB** | An echo thrown off the beat | The mix plays on; some of it is flung into the echo | TIME (`1/16` … `1/8T`) |
| **SWEEP** | A filter sweep, closing or opening | The whole mix goes through it | SHAPE |
| **FLANGE** | A jet-plane flanger | The whole mix goes through it | RATE (0.1 – 1.2 Hz) |
| **REPEAT** | The last slice of the beat loops, like a DJ beat-repeat | The beat is replaced by the loop | RATE (`1/4` … `1/32`) |
| **TAPE** | The tape slows, stops or runs backwards | The beat is replaced by the tape effect | SHAPE (`STOP`, `SLOW`, `REVERSE`) |
| **GATE** | The beat is chopped into rhythmic stutters | The beat is replaced by the chopped version | RATE (`1/4` … `1/32`) |

There are three kinds of pad:

- **Whole-mix effects** (DRIVE, CRUSH, PHASE, SWEEP, FLANGE). While you hold one, you hear the band through the effect and
  nothing sneaks past it.
- **The echo throw** (DUB). The groove carries on as normal while a part of every track is flung into the echo, so what's
  playing at that moment trails off behind it.
- **Stutter effects** (REPEAT, TAPE, GATE). These listen to the music all the time, so they can grab what played
  *just before* you touched the pad. While you hold one, it stands in for the normal beat. You can still layer a
  whole-mix effect on top, even in the recorded lanes (REPEAT into DRIVE, for example).

What each stutter does:

- **REPEAT** loops the last slice of the beat (its length is set by `RATE`) the moment you press, and keeps looping even if
  the music has stopped. With a **RAMP** longer than NOW it becomes a **roll**: it starts up to two divisions slower and
  speeds up to the chosen rate as you hold (1/4, then 1/8, 1/16, 1/32).
- **TAPE** slows the whole mix toward a stop (`STOP`), to half speed (`SLOW`) or backwards (`REVERSE`) as the effect builds.
  A bar-long ramp is a slow tape stop; NOW is a hard one.
- **GATE** chops the mix on and off at the chosen rate. The ramp sets how deep the chop gets.

Each pad has **one main knob**, shown in the Punch FX panel for the pad you pressed last. Its setting is saved with the
pattern. Turn it before you press the pad, or while you hold it.

## Macros and the LFO

Beside the main knob each pad has **two macros**. Each moves several parts of the effect together along one musical
dimension. The macros start at 50 %, except DRIVE's BLEND, the MIX of REPEAT and TAPE, and the DEPTH of TAPE and GATE, which start at 100 %. At the start the effect sounds as it always has, so turning a macro is a change from there.

| Pad | Macro 1 | Macro 2 |
|---|---|---|
| DRIVE | GRIT: drive, with the output trim following | BLEND: how much driven signal is mixed in |
| CRUSH | BITS: how few bits | RATE: how far the sample rate drops |
| PHASE | DEPTH: notch depth and amount | COLOR: feedback and notch centre |
| DUB | SPACE: send level and how long it repeats | TONE: dark to bright repeats |
| SWEEP | RANGE: how dark the sweep gets | RESO: the resonant peak |
| FLANGE | DEPTH: swing and amount | FEEDBACK: the ring, and a longer delay with it |
| REPEAT | MIX: how much of the loop is in the mix | LENGTH: a shorter or longer loop |
| TAPE | MIX: how much of the tape is in the mix | DEPTH: how far it winds down |
| GATE | DEPTH: how far the gate closes | RATE: a faster or slower chop |

The **LFO** button opens one LFO for the pad you pressed last. Point it at **MACRO 1** or **MACRO 2** and it moves that
macro around where you set it. It works like the track LFOs (wave, SYNC, rate, depth) and starts on a 4-bar cycle. It runs
on the beat, not on the steps, so a one-bar pattern keeps repeating while the effect slowly changes over 2, 4 or more bars.
You hear it while the effect is on: while you hold the pad, or while a recorded lane has it playing. Punching works as ever.

The macros are saved with the pattern and can be played from a MIDI controller (see [MIDI](08-midi.md)). Recorded lanes
that the DAW plugin plays by itself use the macro settings but not the LFO.

### SWEEP shapes

| Shape | What it does |
|---|---|
| **CLOSE** | The filter closes from open to dark |
| **CLOSE RES** | The same, with a resonant whistle riding along |
| **OPEN** | The filter opens from dark to bright |
| **OPEN RES** | The same, with a resonant whistle |

SWEEP is the one pad that keeps moving while you hold it, swinging back and forth for as long as your finger is down.

## Fading in

A held effect doesn't jump straight on. It builds from nothing to full over the **RAMP** time, which is how long a move takes to reach its full effect:

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
  layered on top of each other. When all three lanes are full, the next take wipes them all and starts again in
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
- If two lanes ask for the same sound at once (say two SWEEPs), the higher lane wins.

Recorded effects line up with the steps: each effect comes in at a step, and moves smoothly from one step to the next.

## Tips

- Set **RAMP** to **1 BAR**, hold **SWEEP** (CLOSE) from the start of a pattern, and let go on the first beat of the next
  one. That's a build and a drop.
- **REPEAT** at `1/32` with a **1 BAR** ramp is a classic build: hold it and the loop gets faster and faster.
- **TAPE** (`STOP`) with **NOW**, on the last step of a pattern, is a record stop into the next pattern.
- Record a **DUB** throw on the last step of a pattern so it echoes into the next one.
- Effects are saved per pattern, so each pattern in a chain can have different recorded moves. See
  [Patterns & songs](06-patterns-and-songs.md).

Next: [Patterns & songs](06-patterns-and-songs.md).
