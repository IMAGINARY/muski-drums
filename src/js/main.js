import '../sass/default.scss';
import MuskiDrumsManager from './muski-drums-manager';
import MuskiDrums from './muski-drums';

(async () => {
  if ($('[data-component=muski-drums]').length > 0) {
    const drumsManager = new MuskiDrumsManager({
      aiCheckpointUrl: 'checkpoints/drums_rnn',
      soundFontUrl: 'sounds/drums/',
    });
    await drumsManager.init();

    $('[data-component=muski-drums]').each(async (i, element) => {
      const { ai, sampler } = drumsManager;
      const drums = new MuskiDrums(ai, sampler, drumsManager.createToneTransport());
      $(element).replaceWith(drums.$element);
    });
  }
})();
