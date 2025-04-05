# muski-drums

Drum machine and sequencer toys powered by Google Magenta models for the MusKI website

## Entry points

- [index.html](index.html) - Drum machine
- [index-bass.html](index.html) - Bass sequencer

## Usage

The components can be placed on a page by including the following HTML:

```html
<div data-component="muski-drums">
    <div class="text-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
</div>
```

```html
<div data-component="muski-bass">
    <div class="text-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
</div>
```

Note: The spinners are optional, whatever is placed inside the div will be replaced by the drum machine 
or bass sequencer once it is loaded.

## Configuration

Both components can be configured via `data-` attributes on the container element.

### Drum machine

All attributes should be prefixed with `data-`.

- `ai-checkpoint` - The URL of the Magenta model checkpoint to use. Defaults to 
    `checkpoints/drums_rnn`
- `soundfont` - The path to the soundfont to use. Defaults to `sounds/dmx/`.
- `drums`  - The drums to include. See below for the format.
- `with-ai` - Whether to add a button to generate a drum pattern using AI. Defaults to `false`.
- `with-random` - Whether to add a button to generate a random drum pattern. Defaults to `false`.
- `random-probability`: The probability of a note being used in a random pattern. Defaults to `0.15`.
- `editable-output` - Whether to allow editing the generated pattern. Defaults to `true`.
- `tempo` - The default tempo for the drum machine. Defaults to `100`.
- `lang` - The language to use for the UI. Defaults to `en`.
- `preset` - The initial pattern to show. See below for the format.

#### Drums format

Drums should be indicated as a comma-separated list of drum names. The following drums are available:

`BD, SD, CH, OH, LT, MT, HT, CR, RD`

(respectively Bass Drum, Snare Drum, Closed Hi-hat, Open Hi-hat, Low Tom, Mid Tom, High Tom, 
Crash Cymbal, Ride Cymbal)

#### Preset format

Initial patterns can be indicated with a semi-colon-separated list of 

`(<drum>:<notes>)`

where `<drum>` is the drum name and `<notes>` is a comma-separated list of step numbers (starting at 1).

The drum names for presets are 

`kick snare hihatClosed hihatOpen tomLow tomMid tomHigh crash ride`

Yes, the names are different from the drum names used in the `drums` attribute (:facepalm:).
This will be corrected in a future version (or not).

### Bass sequencer

- `ai-checkpoint` - The URL of the Magenta model checkpoint to use. Defaults to 
    `checkpoints/chord_pitches_improv`
- `with-ai` - Whether to add a button to generate a sequence using AI. Defaults to `false`.
- `with-random` - Whether to add a button to generate a random sequence. Defaults to `false`.
- `with-markov` - Whether to add a button to generate a sequence using a Markov chain algorithm. 
    Defaults to `false`.
- `tempo` - The default tempo for the sequencer. Defaults to `100`.
- `lang` - The language to use for the UI. Defaults to `en`.

## Developer resources

The following resources might be useful for analyzing, extending or maintaining this app:

- [Magenta Drums RNN demo](https://magenta.github.io/magenta-js/music/demos/drums_rnn.html)
- [@magenta/music @ npm](https://www.npmjs.com/package/@magenta/music#ddsp)
- [@magenta/music API documentation](https://magenta.github.io/magenta-js/music/index.html)
- [deep-drum](https://github.com/Gogul09/deep-drum)
- [Improv RNN information](https://github.com/magenta/magenta/blob/main/magenta/models/improv_rnn/README.md)
- [Magenta MusicRNN demo](https://magenta.github.io/magenta-js/music/demos/music_rnn.html)

Information about the format used by Magenta models for encoding and decoding note sequences
can be found [in their note-seq repository](https://github.com/magenta/note-seq).

## Credits

Uses the Drums RNN and Improv RNN models by [Google Magenta](https://magenta.tensorflow.org/).

Drum machine based on: 

- The [deep-drum](https://github.com/Gogul09/deep-drum) app by Gogul Ilango, 
licensed under the MIT License (). Copyright 2018, Gogul Ilango
- The [Magenta Drums RNN demo](https://magenta.github.io/magenta-js/music/demos/drums_rnn.html)
licensed under the Apache License Version 2.0. Copyright, 2020 Google Inc.

Adaptations by [Eric Londaits](mailto:eric.londaits@imaginary.org) for IMAGINARY gGmbH.
Copyright 2022 IMAGINARY gGmbH.
