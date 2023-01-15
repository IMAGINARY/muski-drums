import '../sass/default.scss';
import MuskiDrumsManager from './muski-drums-manager';
import MuskiBassManager from './muski-bass-manager';
import MuskiDrums from './muski-drums';
import MuskiBass from './muski-bass';

const drumArgs = {
  BD: 'kick',
  SD: 'snare',
  CH: 'hihatClosed',
  OH: 'hihatOpen',
  LT: 'tomLow',
  MT: 'tomMid',
  HT: 'tomHigh',
  CR: 'crash',
  RD: 'ride',
};

(async () => {
  if ($('[data-component=muski-drums]').length > 0) {
    const aiCheckpointUrl = $('[data-component=muski-drums][data-ai-checkpoint]').data('ai-checkpoint');
    const soundfontUrl = $('[data-component=muski-drums][data-soundfont]').data('soundfont');

    const drumsManager = new MuskiDrumsManager({
      aiCheckpointUrl: aiCheckpointUrl || 'checkpoints/drums_rnn',
      soundFontUrl: soundfontUrl || 'sounds/dmx/',
    });
    await drumsManager.init();
    $('[data-component=muski-drums]').each(async (i, element) => {
      const { ai, sampler } = drumsManager;
      const withAI = $(element).data('with-ai') !== false;
      const tempo = $(element).data('tempo') || 100;
      const lang = $(element).data('lang') || 'en';
      const options = Object.fromEntries(
        Object.entries({
          drums: $(element).data('drums')
            ? $(element).data('drums').split(',')
              .map(drum => drumArgs[drum.trim()])
              .filter(v => v)
            : undefined,
          tempo,
          lang,
        }).filter(([, v]) => v !== undefined)
      );
      const drums = new MuskiDrums(
        withAI ? ai : null,
        sampler,
        drumsManager.createToneTransport(),
        options
      );
      $(element).replaceWith(drums.$element);
    });
  }

  if ($('[data-component=muski-bass]').length > 0) {
    const aiCheckpointUrl = $('[data-component=muski-bass][data-ai-checkpoint]').data('ai-checkpoint');
    const bassManager = new MuskiBassManager({
      aiCheckpointUrl: aiCheckpointUrl || 'checkpoints/chord_pitches_improv',
    });
    await bassManager.init();

    $('[data-component=muski-bass]').each(async (i, element) => {
      const { ai, synth } = bassManager;
      const withAI = $(element).data('with-ai') !== false;
      const withRandom = $(element).data('with-random') !== false;
      const tempo = $(element).data('tempo') || 100;
      const lang = $(element).data('lang') || 'en';
      const options = Object.fromEntries(
        Object.entries({
          withRandom,
          tempo,
          lang,
        }).filter(([, v]) => v !== undefined)
      );
      const bass = new MuskiBass(
        withAI ? ai : null,
        synth,
        bassManager.createToneTransport(),
        options
      );
      $(element).replaceWith(bass.$element);
    });
  }
})();
