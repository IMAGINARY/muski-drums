import * as Tone from 'tone';
import MuskiRnnBass from './muski-rnn-bass';
import MuskiToneTransportManager from './muski-tone-transport-manager';

export default class MuskiBassManager {
  constructor(options) {
    this.options = {
      aiCheckpointUrl: null,
      ...options,
    };
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      await Promise.all([
        this.initAi(),
      ]);
      this.initSynth();
      this.toneTransportManager = new MuskiToneTransportManager();
      this.initialized = true;
    }
  }

  async initAi() {
    if (!this.options.aiCheckpointUrl) {
      throw new Error('MuskiBassManager: aiCheckpointUrl is not set.');
    }
    this.ai = new MuskiRnnBass();
    await this.ai.init(this.options.aiCheckpointUrl);
    return this.ai;
  }

  initSynth() {
    // https://tonejs.github.io/examples/simpleSynth
    this.synth = new Tone.Synth({
      oscillator: {
        type: 'amtriangle',
        harmonicity: 0.5,
        modulationType: 'sine',
      },
      envelope: {
        attackCurve: 'exponential',
        attack: 0.05,
        decay: 0.2,
        sustain: 0.2,
        release: 1.5,
      },
      portamento: 0.05,
    }).toDestination();
  }

  createToneTransport() {
    return this.toneTransportManager.createController();
  }
}
