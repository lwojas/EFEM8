# Punch FX

Punch FX are the performance heart of FM.8. Nine effects live on one shared effect section: six processors and three glitches. You hold a pad, the
effect **sweeps in** while you hold it, and you let go to bring it back out. Arm **WRITE** and the move is recorded
into the pattern, including how far the sweep had gone at every step.

## The pads

| Pad | Effect | Type | Character knob |
|---|---|---|---|
| **DRIVE** | Tape-style saturation | takeover | DRIVE |
| **CRUSH** | Bit and sample-rate reduction | takeover | CRUSH |
| **PHASE** | Sweeping phaser | takeover | RATE (0.4 – 3 Hz) |
| **DUB** | Echo throw | throw | TIME (`1/16` … `1/8T`) |
| **SWEEP** | Filter sweep, closing or opening | takeover | SHAPE |
| **FLANGE** | Jet flanger | takeover | RATE (0.1 – 1.2 Hz) |
| **REPEAT** | Beat repeat: loops the last beat-fraction that played | glitch | RATE (`1/4` … `1/32`) |
| **TAPE** | Tape stop, slow or reverse | glitch | SHAPE (`STOP`, `SLOW`, `REVERSE`) |
| **GATE** | Tempo-synced chop | glitch | RATE (`1/4` … `1/32`) |

**Takeover** effects take over the mix. While held, every track's dry output is cut and the whole mix goes through the
effect, so nothing leaks around it. A **throw** (DUB) leaves the mix running and lifts each track's send into the effect,
so what is playing is flung into an echo. **Glitches** (REPEAT, TAPE, GATE) work on a buffer that has been recording the
mix all along, so they can grab what played *before* you touched the pad; while one is held it replaces the dry mix.

- **REPEAT** captures the last beat-fraction (`RATE`) the instant you press and loops it, even if the track
  stops. With a sweep time longer than NOW it is a **roll**: it starts up to two divisions slower and steps down to the
  chosen rate as you hold (1/4 → 1/8 → 1/16 → 1/32).
- **TAPE** slows the whole mix toward a stop (`STOP`), half speed (`SLOW`) or backwards (`REVERSE`) as the sweep rises:
  a bar-long sweep is a slow tape stop, NOW is a hard one.
- **GATE** chops the mix with a square at the chosen rate; the sweep sets how deep the chop gets.
- A glitch can be layered with another pad, in written FX lanes too (REPEAT into DRIVE, for instance).

Each pad has **one character knob**, shown in the Punch FX panel for the pad you last pressed. The setting is per
pattern and is saved. Turn it before you press, or while you hold.

### SWEEP shapes

| Shape | Does |
|---|---|
| **CLOSE** | Filter closes from open to dark |
| **CLOSE RES** | The same, with a resonant peak riding the sweep |
| **OPEN** | Filter opens from dark to bright |
| **OPEN RES** | The same, with a resonant peak |

SWEEP is the one pad that keeps moving while you hold it: it swings back and forth for as long as the pad is down.

## Sweep in

A held effect does not snap on. It rises from nothing to full over the **SWEEP IN** time:

| Setting | Time to full |
|---|---|
| **NOW** | Instant |
| **1 BT** | One beat |
| **2 BT** | Two beats (default) |
| **1 BAR** | One bar |

The time is in beats at the project tempo, so it scales with BPM. Longer times are for builds, NOW is for stabs.

## Writing FX

Press **WRITE** (the red dot). While the transport is playing and WRITE is armed, whatever pad you hold is recorded
into one of the pattern's **three FX lanes**. Tabs above the pads switch the sequencer between **STEPS** and **FX1**, **FX2**, **FX3**, each showing just that lane
(a tab is outlined when its lane holds something).

- Each hold is one take. It goes into the **first empty lane**, and the lanes play back **together**, layered on the
  one effect section. When all three lanes are taken, the next take wipes them all and starts again in lane 1.
- One effect per step per lane. A lane stores the pad and **how far into its sweep it was**, and playback replays the
  movement as smooth ramps scheduled on the audio clock, not as an on/off switch.
- A pad pressed late in a step is aimed at the next step.
- A pad you are holding always wins over what is written.
- **ERASE** (hold it) clears every lane as the playhead passes over it.
- Tap a cell of a lane to clear just that step. A lane's **CLR** wipes that lane (tap twice); **CLR** beside WRITE wipes all three.
- **FX ON** switches playback of the written lanes on and off without losing them.
- Two lanes that use the same part of the chain (say two SWEEPs) fight over it: the higher lane wins.

FX writing is step-quantised: an effect is *selected* on a step boundary, and its level is smooth in between.

## Tips

- Set **SWEEP IN** to **1 BAR**, hold **SWEEP** (CLOSE) from the start of a pattern, and release on the downbeat of the next:
  a build and a drop.
- **REPEAT** at `1/32` with a **1 BAR** sweep is a classic build: hold it and the loop gets faster and faster.
- **TAPE** (`STOP`) with **NOW** on the last step of a pattern is a record-stop into the next one.
- Write a **DUB** throw on the last step of a pattern so it echoes into the next.
- FX are per pattern, so a chain can carry different written moves in each pattern. See
  [Patterns & songs](06-patterns-and-songs.md).

Next: [Patterns & songs](06-patterns-and-songs.md).
