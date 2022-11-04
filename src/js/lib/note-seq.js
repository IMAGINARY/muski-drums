// Based on definitions found in:
// https://github.com/magenta/note-seq/blob/main/note_seq/protobuf/music.proto

// MIDI ticks per quarter note, AKA PPQ (pulses per quarter)
// There is no widely-used default.
const MIDI_TICKS_PER_QUARTER = 220;
const DEFAULT_VELOCITY = 100;

/**
 * Convert a sequence of notes to the note sequence format that
 * Magenta.js expects.
 *
 * @param {Array<Array<Number>>} sequence
 *  A sequence of steps, each step containing an array of pitches.
 * @param {number} stepsPerQuarter
 *  Number of steps per quarter note.
 * @param {number} tempo
 *  The tempo of the sequence, in quarters per minute.
 * @returns {object}
 */
export default function buildNoteSequence(sequence, stepsPerQuarter, tempo = 120) {
  // The duration of the sequence, in seconds.
  const duration = (sequence.length / stepsPerQuarter) / (tempo / 60);
  const stepStart = step => (step / stepsPerQuarter) / (tempo / 60);

  return {
    ticksPerQuarter: MIDI_TICKS_PER_QUARTER,
    // total time of the sequence in seconds
    totalTime: duration,
    // 4/4 time signature
    timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
    // Tempo in quarters per minute
    tempos: [{ time: 0, qpm: tempo }],
    notes: [
      ...sequence.map((notes, i) => notes.map(note => ({
        pitch: note,
        velocity: DEFAULT_VELOCITY,
        startTime: stepStart(i),
        endTime: stepStart(i + 1),
        isDrum: true,
      }))).flat(),
    ],
  };
}
