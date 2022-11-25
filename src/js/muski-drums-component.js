import * as Tone from 'tone';
import MuskiSequencer from './muski-sequencer';
import { drumMap, reverseDrumMap } from './lib/midi-drums';

const sequenceLen = 16;
const inputLen = 4;

export default class MuskiDrumsComponent {
  constructor(drums = null) {
    this.drums = drums;

    if (!this.drums.initialized) {
      throw new Error('MuskiDrumsComponent is not initialized.');
    }

    this.$element = $('<div></div>');
    const sequencer = new MuskiSequencer({
      rows: [drumMap.kick, drumMap.snare, drumMap.hihatClosed, drumMap.hihatOpen,
        drumMap.tomLow, drumMap.tomMid, drumMap.tomHigh, drumMap.crash, drumMap.ride],
      cols: sequenceLen,
      rowLabels: ['Kick', 'Snare', 'Closed Hi-Hat', 'Open Hi-Hat', 'Low Tom', 'Mid Tom', 'Hi Tom', 'Crash', 'Ride'],
    });

    let playing = false;
    Tone.Transport.bpm.value = 100;

    const steps = [];
    for (let step = 0; step < sequenceLen; step += 1) {
      steps.push(step);
    }
    const stepper = new Tone.Sequence((time, step) => {
      if (playing) {
        const sequence = sequencer.getSequence();
        const notes = sequence[step];
        notes.forEach((note) => {
          this.drums.sampler.player(String(note)).start(time, 0);
        });
        sequencer.setActiveColumn(step);
      }
    }, steps, '16n').start(0);

    sequencer.events.on('cell-on', (row) => {
      // Only preview the note if the sequencer is not playing.
      if (!playing) {
        this.drums.sampler.player(row).start();
      }
    });

    this.$element.append(sequencer.$element);

    $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-primary'])
      .text('Play')
      .on('click', () => {
        if (!playing) {
          playing = true;
          Tone.Transport.start();
        } else {
          Tone.Transport.stop();
          sequencer.setActiveColumn(null);
          playing = false;
        }
      })
      .appendTo(this.$element);

    const tempoDisplay = $('<span></span>')
      .addClass('muski-drums-tempo-display');

    $('<div></div>')
      .addClass('form-group-tempo')
      .append($('<label></label>')
        .addClass('muski-drums-tempo-label')
        .css('display', 'block')
        .append(['Tempo: ', tempoDisplay, 'bpm']))
      .append(
        $('<input>')
          .attr('type', 'range')
          .attr('min', 80)
          .attr('max', 200)
          .attr('step', 1)
          .val(Tone.Transport.bpm.value)
          .on('input', (e) => {
            tempoDisplay.text(e.target.value);
            Tone.Transport.bpm.value = e.target.value;
          })
          .trigger('input')
      )
      .appendTo(this.$element);

    $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-primary'])
      .text('Generate')
      .on('click', async () => {
        const sequence = sequencer.getSequence().slice(0, inputLen);
        console.log('Continung sequence:', sequence);
        const continuation = await this.drums.ai.continueSeq(sequence, sequenceLen - inputLen, 1.4);
        console.log('continuation', continuation);
        sequencer.clear(inputLen);
        continuation.notes.forEach((note) => {
          const normalizedPitch = drumMap[reverseDrumMap[note.pitch]];
          sequencer.setCell(
            String(normalizedPitch),
            note.quantizedStartStep + inputLen,
            true
          );
        });
      })
      .appendTo(this.$element);

    $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-primary'])
      .text('Clear')
      .on('click', () => {
        sequencer.clear();
      })
      .appendTo(this.$element);
  }
}
