import EventEmitter from 'events';
import * as Tone from 'tone';
import MuskiSequencer from './muski-sequencer';
import { drumMap, reverseDrumMap } from './lib/midi-drums';
import BarButton from './lib/bar-button';

const sequenceLen = 16;
const inputLen = 6;
const BPM_DEFAULT = 100;
const BPM_MIN = 80;
const BPM_MAX = 200;

export default class MuskiDrums {
  constructor(ai = null, sampler, toneTransport, userOptions = {}) {
    const defaultOptions = {
      drums: ['kick', 'snare', 'hihatClosed', 'hihatOpen', 'tomLow', 'tomMid', 'tomHigh', 'crash', 'ride'],
    };
    this.options = Object.assign({}, defaultOptions, userOptions);

    this.ai = ai;
    this.sampler = sampler;
    this.toneTransport = toneTransport;
    this.toneTransport.events
      .on('start', () => {
        this.handleToneTransportStart();
      }).on('stop', () => {
        this.handleToneTransportStop();
      });
    this.bpm = BPM_DEFAULT;

    this.events = new EventEmitter();

    this.$element = $('<div></div>')
      .addClass('muski-drums')
      .toggleClass('with-ai', ai !== null);
    this.sequencer = new MuskiSequencer({
      rows: this.options.drums.map(drum => drumMap[drum]),
      cols: sequenceLen,
      rowLabels: this.options.drums.map(drum => MuskiDrums.DrumLabels[drum]),
    });

    const steps = [];
    for (let step = 0; step < sequenceLen; step += 1) {
      steps.push(step);
    }

    this.toneSequece = new Tone.Sequence((time, step) => {
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
        buttonText: '<span class="icon icon-robot"></span> Generate <span class="icon icon-arrow"></span>',
        holdTime: 1000,
      });
      this.generateButton.$element.appendTo(this.$aiPanel);
      this.generateButton.events.on('action',
        () => { this.handleGenerateButton(); });
    }

    this.$controlsPanel = $('<div></div>')
      .addClass('muski-drums-controls-panel')
      .appendTo(this.$element);

    this.$playButton = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-control-round', 'btn-control-round-lg', 'btn-play'])
      .text('Play')
      .on('click', () => { this.handlePlayButton(); })
      .appendTo(this.$controlsPanel);

    this.$tempoDisplay = $('<span></span>')
      .addClass(['muski-tempo-display-field']);

    this.$tempoRange = $('<div></div>')
      .addClass('muski-tempo')
      .append($('<label></label>')
        .addClass(['muski-tempo-label', 'me-2', 'ms-3'])
        .append(['Tempo: ']))
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
        .append([this.$tempoDisplay, ' bpm']))
      .appendTo(this.$controlsPanel);

    this.$clearButton = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-control-round', 'btn-control-round-clear'])
      .text('Clear')
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

  isPlaying() {
    return this.toneTransport && this.toneTransport.isRunning();
  }

  handleToneTransportStart() {
    this.$playButton.removeClass('btn-play').addClass('btn-stop').text('Stop');
  }

  handleToneTransportStop() {
    this.$playButton.removeClass('btn-stop').addClass('btn-play').text('Play');
    this.sequencer.setActiveColumn(null);
  }

  async handleGenerateButton() {
    const sequence = this.sequencer.getSequence().slice(0, inputLen);
    console.log('Continung sequence:', sequence);
    const continuation = await this.ai.continueSeq(sequence, sequenceLen - inputLen, 1.4);
    console.log('continuation', continuation);
    this.sequencer.clear(inputLen);
    continuation.notes.forEach((note) => {
      const normalizedPitch = drumMap[reverseDrumMap[note.pitch]];
      this.sequencer.setCell(
        String(normalizedPitch),
        note.quantizedStartStep + inputLen,
        true
      );
    });
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
      this.sampler.player(row).start();
    }
  }

  handleTempoChange(value) {
    this.$tempoDisplay.text(value);
    this.bpm = value;
    if (this.isPlaying()) {
      this.toneTransport.setBpm(value);
    }
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
