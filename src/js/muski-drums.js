import EventEmitter from 'events';
import * as Tone from 'tone';
import MuskiSequencer from './muski-sequencer';
import { drumMap, reverseDrumMap } from './lib/midi-drums';
import BarButton from './lib/bar-button';
import arrayOfArrays from './lib/array-of-arrays';
import sequencerPatternTransition from './lib/sequencer-pattern-transition';
import StringsEn from './i18n/en';
import StringsDe from './i18n/de';
import StringsFr from './i18n/fr';

const sequenceLen = 16;
const inputLen = 6;
const BPM_DEFAULT = 100;
const BPM_MIN = 80;
const BPM_MAX = 160;
const DEFAULT_TEMPERATURE = 1.2;
const DEFAULT_RANDOM_PROBABILITY = 0.15;

const DefaultStrings = {
  en: StringsEn,
  de: StringsDe,
  fr: StringsFr,
};

/**
 * MuskiDrums class provides a drum machine with a sequencer and AI capabilities.
 *
 * @class MuskiDrums
 * @param {Object} ai - AI instance for generating drum patterns.
 * @param {Tone.Players} sampler - Tone.js sampler for playing drum sounds.
 * @param {Object} toneTransport - Tone.js transport manager for controlling playback.
 * @param {Object} [userOptions] - User-defined options for the drum machine.
 * @param {Array} [userOptions.drums] - List of drums to include in the sequencer.
 * @param {boolean} [userOptions.withRandom=false] - Whether to include a random generation feature.
 * @param {boolean} [userOptions.editableOutput=true] - Whether the output is editable by the user.
 * @param {number} [userOptions.randomProbability=0.15] - Density of notes in the random generation.
 * @param {string} [userOptions.lang='en'] - Language for UI strings.
 * @param {Object} [userOptions.strings] - Custom strings for UI localization.
 * @param {number} [userOptions.tempo=100] - Initial tempo in BPM.
 * @param {string} [userOptions.preset] - Preset drum pattern to load.
 * @param {boolean} [userOptions.editableOutput=true] - Whether the output is editable by the user.
 * @param {Number} [userOptions.patternTransitionDuration=600]
 *   Duration of pattern transitions in ms. (default: 600)
 */
export default class MuskiDrums {
  constructor(ai, sampler, toneTransport, userOptions = {}) {
    const defaultOptions = {
      drums: ['kick', 'snare', 'hihatClosed', 'hihatOpen', 'tomLow', 'tomMid', 'tomHigh', 'crash', 'ride'],
      withRandom: false,
      editableOutput: true,
      randomProbability: DEFAULT_RANDOM_PROBABILITY,
      lang: 'en',
      tempo: BPM_DEFAULT,
      preset: null,
      patternTransitionDuration: 600,
      strings: DefaultStrings,
    };
    this.options = { ...defaultOptions, ...userOptions };

    this.strings = {
      ...DefaultStrings[this.options.lang],
      ...this.options.strings[this.options.lang],
    };
    this.ai = ai;
    this.sampler = sampler;
    this.toneTransport = toneTransport;
    this.toneTransport.events
      .on('start', () => {
        this.handleToneTransportStart();
      }).on('stop', () => {
        this.handleToneTransportStop();
      });
    this.bpm = this.options.tempo;

    this.events = new EventEmitter();

    const outputColumns = [];
    for (let i = inputLen; i < sequenceLen; i += 1) {
      outputColumns.push(i);
    }

    this.$element = $('<div></div>')
      .addClass('muski-drums')
      .toggleClass('with-ai', ai !== null);
    this.sequencer = new MuskiSequencer({
      rows: this.options.drums.map((drum) => drumMap[drum]),
      cols: sequenceLen,
      rowLabels: this.options.drums.map((drum) => this.strings.drums[drum]),
      lockedColumns: this.options.editableOutput ? [] : outputColumns,
    });

    const steps = [];
    for (let step = 0; step < sequenceLen; step += 1) {
      steps.push(step);
    }

    this.toneSequence = new Tone.Sequence((time, step) => {
      this.events.emit('step', step);
      if (this.isPlaying()) {
        const sequence = this.sequencer.getSequence();
        const notes = sequence[step];
        notes.forEach((note) => {
          this.sampler.player(String(note)).start(time, 0);
        });
        this.sequencer.setActiveColumn(step);
      }
    }, steps, '16n').start(0);

    this.sequencer.events.on('cell-on', (row) => { this.handleSequencerCellOn(row); });

    if (this.options.preset) {
      const sequences = this.options.preset.split(';');
      sequences.forEach((sequence) => {
        const [drum, notes] = sequence.split(':');
        notes.split(',').forEach((note) => {
          this.sequencer.setCell(drumMap[drum], Number(note) - 1, true);
        });
      });
    }

    if (this.ai !== null) {
      Object.values(this.sequencer.$cellButtons).forEach((row) => {
        row.forEach((cell, i) => {
          if (i > inputLen - 1) {
            cell.addClass('ai-input');
          }
        });
      });
    }
    this.$element.append(this.sequencer.$element);

    if (this.ai) {
      this.$aiPanel = $('<div></div>')
        .addClass('muski-drums-ai-panel')
        .appendTo(this.$element);

      this.generateButton = new BarButton({
        buttonText: `<span class="icon icon-robot"></span> ${this.strings.ui.generate} <span class="icon icon-arrow"></span>`,
        animationTime: 500,
      });
      this.generateButton.$element.appendTo(this.$aiPanel);
      this.generateButton.events.on(
        'start',
        async () => {
          await this.handleGenerateButton();
          this.generateButton.done();
        }
      );
    }

    if (this.options.withRandom) {
      this.$randomPanel = $('<div></div>')
        .addClass('muski-drums-random-panel')
        .appendTo(this.$element);

      this.randomButton = new BarButton({
        buttonText: `<span class="icon icon-random"></span> ${this.strings.ui.random} <span class="icon icon-arrow"></span>`,
        animationTime: 500,
      });
      this.randomButton.$element.appendTo(this.$randomPanel);
      this.randomButton.events.on(
        'start',
        async () => {
          await this.handleRandomButton();
          this.randomButton.done();
        }
      );
    }

    this.$controlsPanel = $('<div></div>')
      .addClass('muski-drums-controls-panel')
      .appendTo(this.$element);

    this.$playButton = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-control-round', 'btn-control-round-lg', 'btn-play'])
      .text(this.strings.ui.play)
      .on('click', () => { this.handlePlayButton(); })
      .appendTo(this.$controlsPanel);

    this.$tempoDisplay = $('<span></span>')
      .addClass(['muski-tempo-display-field']);

    this.$tempoRange = $('<div></div>')
      .addClass('muski-tempo')
      .append($('<label></label>')
        .addClass(['muski-tempo-label', 'me-2', 'ms-3'])
        .append([`${this.strings.ui.tempo}: `]))
      .append(
        $('<input>')
          .addClass(['form-range', 'muski-tempo-range'])
          .attr('type', 'range')
          .attr('min', BPM_MIN)
          .attr('max', BPM_MAX)
          .attr('step', 1)
          .val(this.bpm)
          .on('input', (e) => { this.handleTempoChange(e.target.value); })
          .trigger('input')
      )
      .append($('<span></span>')
        .addClass(['muski-tempo-display', 'ms-2'])
        .append([this.$tempoDisplay, ` ${this.strings.ui.bpm}`]))
      .appendTo(this.$controlsPanel);

    this.$clearButton = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-control-round', 'btn-control-round-clear'])
      .text(this.strings.ui.clear)
      .on('click', () => { this.handleClearButton(); })
      .appendTo(this.$controlsPanel);
  }

  start() {
    if (!this.isPlaying()) {
      this.toneTransport.start(this.bpm);
    }
  }

  stop() {
    if (this.isPlaying()) {
      this.toneTransport.stop();
    }
  }

  setDrumVolume(drum, volume) {
    if (drumMap[drum] === undefined) {
      throw new Error(`Unknown drum: ${drum}`);
    }
    const player = this.sampler.player(String(drumMap[drum]));
    if (!player) {
      throw new Error(`Player for drum ${drum} not found in sampler.`);
    }
    this.sampler.player(String(drumMap[drum])).volume.value = volume;
  }

  async generateUsingAI() {
    const sequence = this.sequencer.getSequence().slice(0, inputLen);
    const continuation = await this.ai.continueSeq(
      sequence,
      sequenceLen - inputLen,
      DEFAULT_TEMPERATURE
    );
    const newSequence = arrayOfArrays(sequenceLen, 0);
    continuation.notes.forEach((note) => {
      const normalizedPitch = drumMap[reverseDrumMap[note.pitch]];
      newSequence[note.quantizedStartStep + inputLen].push(normalizedPitch);
    });

    this.transitionSequencerToSequence(newSequence);
  }

  generateUsingRandomAlgorithm() {
    // this.sequencer.clear(inputLen);
    const newSequence = arrayOfArrays(sequenceLen, 0);
    for (let i = inputLen; i < sequenceLen; i += 1) {
      Object.values(drumMap).forEach((note) => {
        if (Math.random() < this.options.randomProbability) {
          newSequence[i].push(note);
        }
      });
    }

    this.transitionSequencerToSequence(newSequence);
  }

  transitionSequencerToSequence(sequence) {
    sequencerPatternTransition(
      this.sequencer,
      sequence,
      this.options.patternTransitionDuration,
      {
        startCol: inputLen,
        endCol: sequenceLen - 1,
        onStart: () => {
          this.sequencer.clear(inputLen);
        },
        onEnd: () => {
        },
        onCell: (row, col, state) => {
          this.sequencer.pulseCell(row, col);
          if (state) {
            this.sequencer.setCell(
              String(row),
              col,
              true
            );
          }
        },
      }
    );
  }

  isPlaying() {
    return this.toneTransport && this.toneTransport.isRunning();
  }

  handleToneTransportStart() {
    this.$playButton.removeClass('btn-play').addClass('btn-stop').text('Stop');
    this.events.emit('start');
  }

  handleToneTransportStop() {
    this.$playButton.removeClass('btn-stop').addClass('btn-play').text('Play');
    this.sequencer.setActiveColumn(null);
    this.events.emit('stop');
  }

  async handleGenerateButton() {
    await this.generateUsingAI();
  }

  handleClearButton() {
    this.sequencer.clear();
  }

  handlePlayButton() {
    if (!this.isPlaying()) {
      this.start();
    } else {
      this.stop();
    }
  }

  handleSequencerCellOn(row) {
    if (!this.isPlaying()) {
      this.sampler.player(String(row)).start();
    }
  }

  handleTempoChange(value) {
    this.$tempoDisplay.text(value);
    this.bpm = value;
    if (this.isPlaying()) {
      this.toneTransport.setBpm(value);
    }
  }

  handleRandomButton() {
    this.generateUsingRandomAlgorithm();
  }
}

MuskiDrums.DrumLabels = {
  kick: 'Kick',
  snare: 'Snare',
  hihatClosed: 'Closed Hi-hat',
  hihatOpen: 'Open Hi-hat',
  tomLow: 'Low Tom',
  tomMid: 'Mid Tom',
  tomHigh: 'Hi Tom',
  crash: 'Crash',
  ride: 'Ride',
};
