// eslint-disable-next-line import/no-unresolved
import { MusicRNN, sequences } from '@magenta/music';
import buildNoteSequence from './lib/note-seq';

export default class MuskiRnnDrums {
  async init(checkpoint) {
    this.drumsRnn = new MusicRNN(checkpoint);
    await this.drumsRnn.initialize();
  }

  destroy() {
    this.drumsRnn.dispose();
  }

  async continueSeq(seq, steps, temperature) {
    const noteSeq = buildNoteSequence(seq, 4, 120);
    console.log('noteSeq', noteSeq);
    const quantNoteSeq = sequences.quantizeNoteSequence(noteSeq, 4);
    console.log('quantNoteSeq', quantNoteSeq);
    const continuation = await this.drumsRnn.continueSequence(quantNoteSeq, steps, temperature);
    return continuation;
  }
}
