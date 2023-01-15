import EventEmitter from 'events';
import * as Tone from 'tone';
import MuskiSequencer from './muski-sequencer';
import BarButton from './lib/bar-button';

const sequenceLen = 16;
const inputLen = 4;
const BPM_DEFAULT = 100;
const BPM_MIN = 80;
const BPM_MAX = 160;

// const BassNotes = {
//   C: 'C3',
//   D: 'D3',
//   E: 'E3',
//   F: 'F3',
//   G: 'G3',
//   A: 'A3',
//   B: 'B3',
// };

const BassNotes = {
  C: 48,
  // 'C#': 49,
  D: 50,
  // 'D#': 51,
  E: 52,
  F: 53,
  // 'F#': 54,
  G: 55,
  // 'G#': 56,
  A: 57,
  // 'A#': 58,
  B: 59,
};

export default class MuskiBass {
  constructor(ai = null, synth, toneTransport, options = {}) {
    const defaultOptions = {
    };
    this.options = Object.assign({}, defaultOptions, options);

    this.ai = ai;
    this.synth = synth;
    this.toneTransport = toneTransport;
    this.toneTransport.events
      .on('start', () => {
        this.handleToneTransportStart();
      }).on('stop', () => {
        this.handleToneTransportStop();
      });
    this.bpm = this.options.tempo || BPM_DEFAULT;

    this.events = new EventEmitter();

    this.$element = $('<div></div>')
      .addClass('muski-bass')
      .toggleClass('with-ai', ai !== null);
    this.sequencer = new MuskiSequencer({
      rows: Object.values(BassNotes),
      cols: sequenceLen,
      rowLabels: Object.keys(BassNotes),
      monophonic: true,
    });

    const steps = [];
    for (let step = 0; step < sequenceLen; step += 1) {
      steps.push(step);
    }

    this.toneSequece = new Tone.Sequence((time, step) => {
      if (this.isPlaying()) {
        this.synth.triggerRelease(time);
        const sequence = this.sequencer.getSequence();
        const notes = sequence[step];
        notes.forEach((note) => {
          this.synth.triggerAttack(Tone.Midi(note).toFrequency(), time);
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
        animationTime: 500,
      });
      this.generateButton.$element.appendTo(this.$aiPanel);
      this.generateButton.events.on('start',
        async () => {
          await this.handleGenerateButton();
          this.generateButton.done();
        });
    }

    if (this.options.withRandom) {
      this.$randomPanel = $('<div></div>')
        .addClass('muski-bass-random-panel')
        .appendTo(this.$element);

      this.randomButton = new BarButton({
        buttonText: '<span class="icon icon-random"></span> Random <span class="icon icon-arrow"></span>',
        animationTime: 500,
      });
      this.randomButton.$element.appendTo(this.$randomPanel);
      this.randomButton.events.on('start',
        async () => {
          await this.handleRandomButton();
          this.randomButton.done();
        });
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
      this.synth.triggerRelease();
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
    const continuation = await this.ai.continueSeq(sequence, sequenceLen - inputLen, 1, ['C']);
    console.log('continuation', continuation);
    this.sequencer.clear(inputLen);
    let notesFiltered = 0;
    let notesAdjusted = 0;
    let notesShifted = 0;
    continuation.notes.forEach((note) => {
      let { pitch } = note;
      if (pitch > Math.max(...Object.values(BassNotes))) {
        pitch = Math.min(...Object.values(BassNotes)) + (pitch % 12);
        notesAdjusted += 1;
      }
      if (!Object.values(BassNotes).includes(pitch)) {
        pitch -= 1;
        notesShifted += 1;
      }
      if (Object.values(BassNotes).includes(pitch)) {
        this.sequencer.setCell(
          String(pitch),
          note.quantizedStartStep + inputLen,
          true
        );
      } else {
        notesFiltered += 1;
      }
    });
    console.log(`notesFiltered: ${notesFiltered} notesAdjusted: ${notesAdjusted} notesShifted: ${notesShifted}`);
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
      this.synth.triggerAttackRelease(Tone.Midi(row).toFrequency(), '16n');
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
    this.sequencer.clear(inputLen);
    for (let i = inputLen; i < sequenceLen; i += 1) {
      const index = Math.floor(Math.random() * (Object.keys(BassNotes).length + 1));
      if (index !== 0) {
        const note = BassNotes[Object.keys(BassNotes)[index - 1]];
        this.sequencer.setCell(
          String(note),
          i,
          true
        );
      }
    }
  }
}
