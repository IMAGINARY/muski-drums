// Mapping from AI Jam and Magenta demos

// The mapping that Magenta uses can be found here:
// https://github.com/magenta/note-seq/blob/main/note_seq/drums_encoder_decoder.py
// see also the General MIDI spec: https://www.midi.org/specifications-old/item/gm-level-1-sound-set

// deep-drum has a slightly different mapping, which are the same as neural-drum
// (one program got them from the other)
const drumMap = {
  kick: 36,
  snare: 38,
  hihatClosed: 42,
  hihatOpen: 46,
  tomLow: 45,
  tomMid: 48,
  tomHigh: 50,
  crash: 49,
  ride: 51,
};

const drumpMapExt = {
  kick: [36, 35],
  snare: [38, 27, 28, 31, 32, 33, 34, 37, 39, 40, 56, 65, 66, 75, 85],
  hihatClosed: [42, 44, 54, 68, 69, 70, 71, 73, 78, 80, 22],
  hihatOpen: [46, 67, 72, 74, 79, 81, 26],
  tomLow: [45, 29, 41, 43, 61, 64, 84],
  tomMid: [48, 47, 60, 63, 77, 86, 87],
  tomHigh: [50, 30, 62, 76, 83],
  crash: [49, 52, 55, 57, 58],
  ride: [51, 53, 59, 82],
};

const reverseDrumMap = {};
Object.entries(drumpMapExt).forEach(([id, pitches]) => {
  pitches.forEach((pitch) => {
    reverseDrumMap[pitch] = id;
  });
});

export { drumMap, drumpMapExt, reverseDrumMap };
