# Sound design

Every instrument has exactly five knobs. Each knob only covers the range that sounds good, so wherever you turn it, it
sounds musical. There are no menus to dig through, and no operators, ratios or algorithms to worry about.

Select a track and open **SOUND** (on a larger screen, it's the instrument band along the top).

## Choosing an instrument

Under **ENGINE**, tap the instrument you want for the selected track: **KICK**, **SNARE**, **HAT**, **TOM**, **BASS**,
**PLUCK**, **BELL** or **LEAD**. Any instrument can go on any track.

Changing the instrument gives that track a fresh start: its knobs, level, delay, reverb, filter and LFOs go back to the new
instrument's starting values in every pattern, per-step tweaks to the sound knobs are removed (tweaks to the delay and reverb
sends stay), and the arpeggiator resets. **Your rhythm stays**: which steps are on, their accents and their lengths. Moving
from a drum to a melodic instrument gives the steps its default note, and moving between melodic instruments keeps each note
inside the new instrument's range. Which instrument is on each track is saved with the project and is the same in every
pattern.

## FILTER

Every track has a filter under its knobs, before the delay and reverb, so a filtered track is filtered into its echoes too.

| Control | What it does |
|---|---|
| **CUT** | The cutoff, from 40 Hz to 18 kHz |
| **RES** | Resonance: how much the filter rings at the cutoff |
| **LP / HP** | Low-pass (cuts the highs) or high-pass (cuts the lows) |

With LP and CUT all the way up, or HP and CUT all the way down, the filter does nothing. Switching LP/HP puts CUT at the open
end. CUT and RES can be tweaked per step in TWEAK mode, driven by an LFO, and are saved with each pattern.

## Sound belongs to the pattern

Sound, level, delay, reverb and filter settings are saved **with each pattern**, not with the project as a whole. Pattern 1
can have a tight, dry kit and pattern 2 a long, dubby one. If you switch pattern while the beat plays, the sound changes
exactly on the bar line.

## LFOs

An LFO is a slow wobble that moves a knob for you. Each track has three. Press **LFO** under the filter to open them. For
each one, choose:

- **Target**: what it moves. Any of the instrument's knobs, the delay or reverb send, or the filter's cutoff or resonance.
- **Wave**: sine, triangle, square or saw.
- **Rate**: how fast it moves, from very slow to quick. With **SYNC** on, the rate is a note length at your tempo instead,
  so the wobble stays in time.
- **Depth**: how far it moves the knob. The wobble swings around where the knob is set, so at 100% it sweeps half the knob's
  range either side. A negative depth flips it upside down.

If a step has a TWEAK on the same knob, the tweak wins for that step. LFO settings are saved with each pattern. LFOs work in
the browser version; they don't play inside the VST3 plugin yet.

## KICK

| Knob | What it does (range, starting value) |
|---|---|
| **TUNE** | The pitch the kick settles on: 35 – 90 Hz (52) |
| **SWEEP** | How far above that pitch it starts before dropping: 0.5 – 3.5 octaves (2.2) |
| **DECAY** | How long it rings: 150 ms – 1.2 s (450 ms) |
| **PUNCH** | How loud the click at the start is (55%) |
| **MOD** | How much the FM twists the tone, from clean to growly (35%) |

## SNARE

| Knob | What it does |
|---|---|
| **TUNE** | Pitch of the body: 150 – 320 Hz (190) |
| **DECAY** | 80 – 600 ms (200 ms) |
| **MOD** | How much FM is in the tone: 10 – 90% (40%) |
| **NOISE** | How much rattling noise is mixed in: 15 – 100% (60%) |
| **CLAP** | Blends from a snare (0) towards a clap's burst of hits (100%) |

## HAT

| Knob | What it does |
|---|---|
| **PITCH** | 240 – 520 Hz (320) |
| **DECAY** | 30 ms – 900 ms (70 ms). Short is closed, long is open |
| **METAL** | How metallic and clangy it sounds: 30 – 100% (67%) |
| **BRIGHT** | Brightness: 30 – 100% (75%) |
| **NOISE** | How much noise is mixed in (50%) |

## TOM

| Knob | What it does |
|---|---|
| **TUNE** | 80 – 360 Hz (120) |
| **SWEEP** | How far the pitch drops: 0 – 1.6 octaves (0.6) |
| **DECAY** | 120 ms – 1 s (450 ms) |
| **BODY** | The drum-skin ring (50%) |
| **MOD** | How much FM is in the tone: 10 – 80% (30%) |

## BASS

A punchy two-part FM bass for low lines.

| Knob | What it does |
|---|---|
| **COLOR** | Eight steps that change the character: `SUB`, `FULL`, `HOLLOW`, `THIRDS`, `THIN`, `FIFTHS`, `METAL`, `BELL` |
| **MOD** | How rich the sound is, from a pure tone to a bright one: 5 – 90% (35%) |
| **BITE** | An extra burst of brightness at the start of each note (60%) |
| **TONE** | How dark or bright it is: 15 – 100% (70%) |
| **DECAY** | 60 ms – 1.1 s (300 ms) |

COLOR moves in steps rather than smoothly. That's deliberate: each step stays in tune with itself, whereas smooth changes
would mostly sound out of tune.

## PLUCK

A short, plucked tone for stabs and little melodies.

| Knob | What it does |
|---|---|
| **MOD** | How much FM is in the tone: 10 – 90% (50%) |
| **COLOR** | Which overtones are present, from plain to glassy (11%) |
| **TONE** | How quickly the highs die away: dark at the top of the knob (40%) |
| **DECAY** | 100 ms – 2 s (500 ms) |
| **DRIVE** | Distortion (10%) |

## BELL

A ringing, slightly out-of-tune bell.

| Knob | What it does |
|---|---|
| **MOD** | How much FM is in the tone (50%) |
| **METAL** | How scattered the overtones are, from a tuned chime to a clanging bar: 15 – 70% (33%) |
| **TONE** | Brightness: 0 – 60% (10%) |
| **DECAY** | 250 ms – 2 s (900 ms) |
| **STRIKE** | How hard the click at the start is (40%) |

## LEAD

An unstable, lively lead that can run from smooth to wild.

| Knob | What it does |
|---|---|
| **CHAOS** | How unstable the tone is: 5 – 80% (35%) |
| **COLOR** | Which overtones are present (14%) |
| **FOLD** | Wave-folding: adds a gritty, metallic edge: 0 – 80% (25%) |
| **DECAY** | 100 ms – 2 s (500 ms) |
| **SUSTAIN** | How long a held note keeps sounding (60%) |

Next: [Mixing & track FX](04-mixing-and-track-fx.md).
