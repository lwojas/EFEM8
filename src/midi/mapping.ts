// FM.8's external control contract: which MIDI controller moves which parameter. This is the only
// file that contains CC numbers. Edit it freely; nothing else needs to change. Parameter ids come from
// engine/params.ts, and the engine that applies this (midi/control.ts) is generic.
//
// Channels are 1-16. A parameter without `channel` uses `defaultChannel`.
//
// Layout: one channel per track (the usual multitimbral hardware layout), the same CC numbers on
// every channel. Pattern selection is Bank Select + Program Change on the default channel.
//
//   CC   7  volume                 CC  91  reverb send        CC 70 72 73 75 76  the track's five sound knobs, in
//   CC  12  delay send             CC  20  mute (64+ = on)               the order shown in the app (what a knob
//   CC  21  solo                   CC  22  arpeggiator on                does follows the engine in the slot)
//   CC  74  filter cutoff          CC  71  filter resonance   CC 78  filter mode (64+ = high-pass)
//
// There is no pan: the app has none. CC 10 is left free for it.
import { KNOBS, NUM_TRACKS } from "../engine/spec";
import type { MidiMapping } from "./control";

/** Sound knob CCs by position on the track (Sound Controller 1-5): knob k of whatever engine is in the slot. */
/** (71 and 74 are the General MIDI resonance and cutoff: the track filter has them.) */
const SOUND_CCS = [70, 72, 73, 75, 76].slice(0, KNOBS);

function build(): MidiMapping["parameters"] {
  const parameters: MidiMapping["parameters"] = {};
  for (let t = 0; t < NUM_TRACKS; t++) {
    const channel = t + 1;
    const id = (name: string) => `track.${t + 1}.${name}`;
    parameters[id("volume")] = { cc: 7, channel };
    parameters[id("mute")] = { cc: 20, channel };
    parameters[id("solo")] = { cc: 21, channel };
    parameters[id("delaySend")] = { cc: 12, channel };
    parameters[id("reverbSend")] = { cc: 91, channel };
    parameters[id("arp")] = { cc: 22, channel };
    parameters[id("filterCut")] = { cc: 74, channel };
    parameters[id("filterRes")] = { cc: 71, channel };
    parameters[id("filterMode")] = { cc: 78, channel };
    SOUND_CCS.forEach((cc, i) => { parameters[id(`sound.k${i + 1}`)] = { cc, channel }; });
  }
  return parameters;
}

export const midiMapping: MidiMapping = {
  defaultChannel: 1,
  parameters: build(),
  // 64 patterns = 4 banks of 16. Bank Select (CC 0) picks the bank, Program Change 0-15 the pattern.
  program: { param: "pattern.select", bankSize: 16, bankCc: 0 },
};
