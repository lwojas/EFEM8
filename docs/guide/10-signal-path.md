# Signal path

This page shows the route a sound takes, from a step on the grid to your speakers. It helps when you're wondering *why*
something sounds the way it does: why a muted track's echoes stop, or why a stutter effect can grab sound that played
*before* you touched the pad.

## One track

Every track follows the same route, whichever instrument is on it. There are eight of them.

```
   INSTRUMENT                the track's FM sound, shaped by its five knobs
     │
     ▼
   FILTER                    CUT · RES · LP/HP (wide open by default: it does nothing until you move it)
     │
     ▼
   LEVEL · MUTE · SOLO       the fader and the M and S buttons
     │
     ├── DLY knob ───▶ [ DELAY ]   this track's own echo ──────────────────┐
     │                                                                     │
     ├── REV knob ───▶ [ REVERB ]  this track's own room ──────────────────┤
     │                                                                     │
     ├── always listening ───▶ [ MEMORY ]  a short recording of the mix    │
     │                          (REPEAT, TAPE and GATE use it)             │
     │                                                                     │
     ├── PUNCH FX button ───▶ [ PUNCH FX ]  the shared performance ────────┤
     │   (on by default)       effects (see below)                         │
     │                                                                     │
     ▼                                                                     │
   straight on to the mix  ◀───────────────────────────────────────────────┘
```

The echo and the room carry only the effect itself, not the track. They join the track's own sound at the mix.

## The whole machine

```
   TRACK 1  ──┐
   TRACK 2  ──┤
   TRACK 3  ──┤
   TRACK 4  ──┼──▶  MIX  ──▶  LIMITER  ──▶  OUTPUT
   TRACK 5  ──┤       ▲
   TRACK 6  ──┤       │
   TRACK 7  ──┤    ┌──┴───────────────────────────────────────────────┐
   TRACK 8  ──┘    │ MEMORY ──▶ PUNCH FX ◀── the PUNCH FX feed from   │
                   │                          every track             │
                   └──────────────────────────────────────────────────┘
```

Each track's delay and reverb also join the mix. The **limiter** at the end keeps the total from clipping, so a loud
build won't distort your output.

## Inside the Punch FX

Everything you hold on the punch pads passes through these effects, in this order. Most of the time they're all at rest
and silent, so the mix passes through untouched.

```
   from the tracks, and from the MEMORY
        │
        ▼
   SWEEP ▸ DRIVE ▸ CRUSH ▸ PHASE ▸ FLANGE ▸ DUB
     ▲                                        ▲
     │                                        │
   the filter                              the echo
        │
        ▼
      to the mix
```

**REPEAT**, **TAPE** and **GATE** are different. They work on the **MEMORY**, which has been quietly recording the mix
all along. When you hold one, the normal mix is replaced by the stuttered version, and that then flows on through the
effects above, so you can still add DRIVE or a PHASE on top.

## What this means for your mix

- **Filter, mute and level come first.** The track's filter and fader sit *before* its delay and reverb. A filtered track is
  filtered into its echoes too, and a muted track's echoes and room go quiet with it.
- **Punch FX hear the track as you've mixed it.** What goes to the punch effects is taken after level, mute and solo. The
  track's own echo and room are *not* fed through the punch effects: they carry on to the mix by their own route.
- **Stutters can grab the past.** Because the MEMORY is always listening, REPEAT loops the last slice of the beat from
  *before* you pressed the pad, and it keeps looping even if the music stops.
- **Whole-mix, throw or stutter.** A *whole-mix* pad (DRIVE, CRUSH, PHASE, SWEEP, FLANGE) cuts the normal sound of every track
  that takes part and plays everything through the effect instead. The echo *throw* (DUB) leaves the mix playing and
  sends a part of each track into the echo. A *stutter* replaces the beat for as long as you hold it.
- **Keep a track out of the punch.** Switch off a track's **PUNCH FX** button and it skips the punch effects entirely: it
  isn't thrown into echoes, isn't muted by a whole-mix effect and isn't recorded by the MEMORY, so it plays on dry.
- **Delay and reverb are per track.** The Track FX panel changes the echo time and room size for the selected track only.
  The punch effects have their own, separate echo.

Back to the [guide](01-getting-started.md) · [Reference](09-reference.md).
