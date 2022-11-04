import '../sass/default.scss';
import MuskiRnnDrums from './muski-rnn-drums';
import MuskiSequencer from './muski-sequencer';
import { drumMap, reverseDrumMap } from './lib/midi-drums';

const sequenceLen = 16;
const inputLen = 4;

const drums = new MuskiRnnDrums();
$('[data-component=muski-drums]').each(async (i, element) => {
  console.log('Initializing...');
  await drums.init('checkpoints/drums_rnn');
  console.log('Initialized.');
  // const continuation = await drums.continueSeq([[36, 42], [42], [38, 42], [42]], 12, 1.4);
  // console.log('continuation', continuation);

  const sequencer = new MuskiSequencer({
    rows: [drumMap.kick, drumMap.snare, drumMap.hihatClosed, drumMap.hihatOpen,
      drumMap.tomLow, drumMap.tomMid, drumMap.tomHigh, drumMap.crash, drumMap.ride],
    cols: sequenceLen,
    rowLabels: ['Kick', 'Snare', 'Closed Hi-Hat', 'Open Hi-Hat', 'Low Tom', 'Mid Tom', 'Hi Tom', 'Crash', 'Ride'],
  });

  $(element).append(sequencer.$element);

  $('<button></button>')
    .attr('type', 'button')
    .addClass(['btn', 'btn-primary'])
    .text('Generate')
    .on('click', async () => {
      const sequence = sequencer.getSequence().slice(0, inputLen);
      console.log('Continung sequence:', sequence);
      const continuation = await drums.continueSeq(sequence, sequenceLen - inputLen, 1.4);
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
    .appendTo(element);
});
