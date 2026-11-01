# Signal path

This page shows the route a sound takes, from a step on the grid to your speakers. It helps when you're wondering *why*
something sounds the way it does: why a muted track's echoes stop, or why a glitch can grab sound that played *before*
you touched the pad.

## One track

Every track follows the same route, whichever instrument is on it. There are eight of them.

```
   INSTRUMENT                the track's FM voice, shaped by its five knobs
     │
     ▼
   FILTER                    CUT · RES · LP/HP (open by default: it does nothing until you move it)
     │
     ▼
   LEVEL · MUTE · SOLO       the fader and the M and S buttons
     │
     ├── DLY knob ───▶ [ DELAY ]   this track's own echo ──────────────────┐
     │                                                                     │
     ├── REV knob ───▶ [ REVERB ]  this track's own room ──────────────────┤
     │                                                                     │
     ├── always listening ───▶ [ GLITCH ]  a short memory of the mix       │
     │                          (REPEAT, TAPE and GATE use it)             │
     │                                                                     │
     ├── PUNCH FX button ───▶ [ PUNCH FX ]  the shared performance ────────┤
     │   (on by default)       section (see below)                         │
     │                                                                     │
     ▼                                                                     │
   straight on to the mix  ◀───────────────────────────────────────────────┘
```

The echo and the room are **returns**: they carry only the effect (the wet sound), and they join the dry sound at the mix.

## The whole machine

```
   TRACK 1  ──┐
   TRACK 2  ──┤
   TRACK 3  ──┤
   TRACK 4  ──┼──▶  MIX  ──▶  LIMITER  ──▶  OUTPUT
   TRACK 5  ──┤       ▲
   TRACK 6  ──┤       │
   TRACK 7  ──┤    ┌──┴───────────────────────────────────────────────┐
   TRACK 8  ──┘    │ GLITCH ──▶ PUNCH FX  ◀── the PUNCH FX send of    │
                   │                          every track             │
                   └──────────────────────────────────────────────────┘
```

Behind the scenes, each track's delay and reverb also feed the mix. The **limiter** at the end keeps the total from
clipping, so a loud build won't distort your output.

## Inside the Punch FX section

Everything you hold on the punch pads passes through this chain, in this order. Most of the time it is wide open and
silent, so the mix passes through untouched.

```
   from the tracks, and from the GLITCH memory
        │
        ▼
   SWEEP ▸ DRIVE ▸ CRUSH ▸ PHASE ▸ FLANGE ▸ DUB
     ▲                                        ▲
     │                                        │
   the filter stage                        the echo stage
        │
        ▼
      to the mix
```

**REPEAT**, **TAPE** and **GATE** are different. They work on the **GLITCH** memory, which has been quietly recording the
mix all along. When you hold one, the normal mix is replaced by the glitched version, and that then flows on through the
chain above, so you can still add DRIVE or a PHASE on top.

## What this means for your mix

- **Filter, mute and level come first.** The track's filter and fader sit *before* its delay and reverb. A filtered track is
  filtered into its echoes too, and a muted track's echoes and room go quiet with it.
- **Punch FX hear the track's dry sound.** The punch send leaves after level, mute and solo, so the effect works on the track
  as you set it in the mix. The track's own echo and room are *not* fed through the punch section: they carry on to the
  mix by their own route.
- **Glitches can grab the past.** Because the GLITCH memory is always listening, REPEAT loops the last slice of the beat
  from *before* you pressed the pad, and it keeps looping even if the music stops.
- **Takeover, throw or glitch.** A *takeover* pad (DRIVE, CRUSH, PHASE, SWEEP, FLANGE) cuts the normal route of every
  track that takes part and sends everything through the effect instead. The *throw* pad (DUB) leaves the mix playing and
  sends a part of each track into the echo. A *glitch* replaces the mix for as long as you hold it.
- **Keep a track out of the punch.** Switch off a track's **PUNCH FX** button and it skips the section entirely: it isn't
  thrown into echoes, isn't cut by a takeover and isn't recorded by the glitch memory, so it plays on dry.
- **Delay and reverb are per track.** The Track FX panel changes the echo time and room size for the selected track only.
  The punch section has its own, separate echo.

Back to the [guide](01-getting-started.md) · [Reference](09-reference.md).
