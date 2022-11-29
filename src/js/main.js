import '../sass/default.scss';
import MuskiDrumsManager from './muski-drums-manager';
import MuskiDrums from './muski-drums';

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
    const drumsManager = new MuskiDrumsManager({
      aiCheckpointUrl: 'checkpoints/drums_rnn',
      soundFontUrl: 'sounds/drums/',
    });
    await drumsManager.init();

    $('[data-component=muski-drums]').each(async (i, element) => {
      const { ai, sampler } = drumsManager;
      const withAI = $(element).data('with-ai') !== false;
      const options = Object.fromEntries(
        Object.entries({
          drums: $(element).data('drums')
            ? $(element).data('drums').split(',')
              .map(drum => drumArgs[drum.trim()])
              .filter(v => v)
            : undefined,
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
})();
