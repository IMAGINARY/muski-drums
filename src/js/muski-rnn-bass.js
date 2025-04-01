// eslint-disable-next-line import/no-unresolved
import { MusicRNN, sequences } from '@magenta/music';
import buildNoteSequence from './lib/note-seq';

export default class MuskiRnnBass {
  async init(checkpoint) {
    this.bassRnn = new MusicRNN(checkpoint);
    await this.bassRnn.initialize();
  }

  destroy() {
    this.bassRnn.dispose();
  }

  async continueSeq(seq, steps, temperature, chords) {
    const noteSeq = buildNoteSequence(seq, 4, 100);
    const quantNoteSeq = sequences.quantizeNoteSequence(noteSeq, 4);
    return this.bassRnn.continueSequence(
      quantNoteSeq,
      steps,
      temperature,
      chords
    );
  }
}
