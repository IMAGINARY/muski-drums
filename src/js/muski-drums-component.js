import * as Tone from 'tone';
import MuskiSequencer from './muski-sequencer';
import { drumMap, reverseDrumMap } from './lib/midi-drums';

const sequenceLen = 16;
const inputLen = 4;

export default class MuskiDrumsComponent {
  constructor(drums = null) {
    this.drums = drums;
    this.playing = false;
    this.bpm = 100;

    if (!this.drums.initialized) {
      throw new Error('MuskiDrumsComponent is not initialized.');
    }

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
    const stepper = new Tone.Sequence((time, step) => {
      if (this.playing) {
        const sequence = this.sequencer.getSequence();
        const notes = sequence[step];
        notes.forEach((note) => {
          this.drums.sampler.player(String(note)).start(time, 0);
        });
        this.sequencer.setActiveColumn(step);
      }
    }, steps, '16n').start(0);

    this.sequencer.events.on('cell-on', (row) => { this.handleSequencerCellOn(row); });

    this.$element.append(this.sequencer.$element);

    this.$playButton = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-control-round', 'btn-play'])
      .text('Play')
      .on('click', () => { this.handlePlayButton(); })
      .appendTo(this.$element);

    this.$tempoDisplay = $('<span></span>')
      .addClass('muski-drums-tempo-display');

    this.$tempoRange = $('<div></div>')
      .addClass('form-group-tempo')
      .append($('<label></label>')
        .addClass('muski-drums-tempo-label')
        .css('display', 'block')
        .append(['Tempo: ', this.$tempoDisplay, 'bpm']))
      .append(
        $('<input>')
          .attr('type', 'range')
          .attr('min', 80)
          .attr('max', 200)
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
      .addClass(['btn', 'btn-primary'])
      .text('Clear')
      .on('click', () => { this.handleClearButton(); })
      .appendTo(this.$element);
  }

  async handleGenerateButton() {
    const sequence = this.sequencer.getSequence().slice(0, inputLen);
    console.log('Continung sequence:', sequence);
    const continuation = await this.drums.ai.continueSeq(sequence, sequenceLen - inputLen, 1.4);
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

  async handlePlayButton() {
    if (!this.playing) {
      this.playing = true;
      this.$playButton.removeClass('btn-play').addClass('btn-pause').text('Pause');
      Tone.Transport.bpm.value = this.bpm;
      Tone.Transport.start();
    } else {
      Tone.Transport.stop();
      this.sequencer.setActiveColumn(null);
      this.$playButton.removeClass('btn-pause').addClass('btn-play').text('Play');
      this.playing = false;
    }
  }

  handleSequencerCellOn(row) {
    // Only preview the note if the sequencer is not playing.
    if (!this.playing) {
      this.drums.sampler.player(row).start();
    }
  }

  handleTempoChange(value) {
    this.$tempoDisplay.text(value);
    this.bpm = value;
    if (this.playing) {
      Tone.Transport.bpm.value = this.bpm;
    }
  }
}
