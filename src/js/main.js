import '../sass/default.scss';
import MuskiDrums from './muski-drums';
import MuskiDrumsComponent from './muski-drums-component';

(async () => {
  if ($('[data-component=muski-drums]').length > 0) {
    const drums = new MuskiDrums({
      aiCheckpointUrl: 'checkpoints/drums_rnn',
      soundFontUrl: 'sounds/drums/',
    });
    await drums.init();

    $('[data-component=muski-drums]').each(async (i, element) => {
      const drumMachine = new MuskiDrumsComponent(drums);
      $(element).replaceWith(drumMachine.$element);
    });
  }
})();
