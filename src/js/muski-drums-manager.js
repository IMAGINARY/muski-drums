import * as Tone from 'tone';
import MuskiRnnDrums from './muski-rnn-drums';
import { drumMap } from './lib/midi-drums';
import MuskiToneTransportManager from './muski-tone-transport-manager';

export default class MuskiDrumsManager {
  constructor(options) {
    this.options = {
      aiCheckpointUrl: null,
      soundFontUrl: null,
      ...options,
    };
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      await Promise.all([
        this.initAi(),
        this.initSampler(),
      ]);
      this.toneTransportManager = new MuskiToneTransportManager();
      this.initialized = true;
    }
  }

  async initAi() {
    if (!this.options.aiCheckpointUrl) {
      throw new Error('MuskiDrumsManager: aiCheckpointUrl is not set.');
    }
    this.ai = new MuskiRnnDrums();
    await this.ai.init(this.options.aiCheckpointUrl);
    return this.ai;
  }

  async initSampler() {
    if (!this.options.soundFontUrl) {
      throw new Error('MuskiDrumsManager: soundFontUrl is not set.');
    }
    return new Promise((resolve) => {
      this.sampler = new Tone.Players({
        urls: Object.fromEntries(Object.values(drumMap).map((pitch) => [String(pitch), `${pitch}.mp3`])),
        baseUrl: this.options.soundFontUrl,
        onload: () => {
          resolve(this.sampler);
        },
      }).toDestination();
    });
  }

  createToneTransport() {
    return this.toneTransportManager.createController();
  }
}
