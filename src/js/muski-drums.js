import EventEmitter from 'events';
import * as Tone from 'tone';
import MuskiSequencer from './muski-sequencer';
import { drumMap, reverseDrumMap } from './lib/midi-drums';

const sequenceLen = 16;
const inputLen = 4;
const BPM_DEFAULT = 100;
const BPM_MIN = 80;
const BPM_MAX = 200;

export default class MuskiDrums {
  constructor(ai, sampler, toneTransport) {
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

    this.$element = $('<div></div>');
    this.sequencer = new MuskiSequencer({
      rows: [drumMap.kick, drumMap.snare, drumMap.hihatClosed, drumMap.hihatOpen,
        drumMap.tomLow, drumMap.tomMid, drumMap.tomHigh, drumMap.crash, drumMap.ride],
      cols: sequenceLen,
      rowLabels: ['Kick', 'Snare', 'Closed Hi-Hat', 'Open Hi-Hat', 'Low Tom', 'Mid Tom', 'Hi Tom', 'Crash', 'Ride'],
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

    this.$element.append(this.sequencer.$element);

    this.$playButton = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-control-round', 'btn-control-round-lg', 'btn-play'])
      .text('Play')
      .on('click', () => { this.handlePlayButton(); })
      .appendTo(this.$element);

    this.$tempoDisplay = $('<span></span>')
      .addClass('muski-manager-tempo-display');

    this.$tempoRange = $('<div></div>')
      .addClass('form-group-tempo')
      .append($('<label></label>')
        .addClass('muski-manager-tempo-label')
        .css('display', 'block')
        .append(['Tempo: ', this.$tempoDisplay, 'bpm']))
      .append(
        $('<input>')
          .attr('type', 'range')
          .attr('min', BPM_MIN)
          .attr('max', BPM_MAX)
          .attr('step', 1)
          .val(this.bpm)
          .on('input', (e) => { this.handleTempoChange(e.target.value); })
          .trigger('input')
      )
      .appendTo(this.$element);

    this.$generateButton = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-primary'])
      .text('Generate')
      .on('click', async () => { this.handleGenerateButton(); })
      .appendTo(this.$element);

    this.$clearButton = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-control-round', 'btn-control-round-clear'])
      .text('Clear')
      .on('click', () => { this.handleClearButton(); })
      .appendTo(this.$element);
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
