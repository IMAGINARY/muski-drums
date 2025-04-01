import * as Tone from 'tone';
import MuskiToneTransportController from './muski-tone-transport-controller';

export default class MuskiToneTransportManager {
  constructor() {
    this.toneStarted = false;
    this.activeController = null;
  }

  createController() {
    return new MuskiToneTransportController(this);
  }

  isRunning(controller) {
    return this.activeController === controller;
  }

  onControllerStart(controller, bpm) {
    if (!this.toneStarted) {
      Tone.start();
      this.toneStarted = true;
    }

    if (!this.isRunning(controller)) {
      if (this.activeController) {
        this.onControllerStop(this.activeController);
      }
      this.activeController = controller;
      this.activeController.signalStarted();
      this.setBpm(bpm);
      Tone.Transport.start();
    }
  }

  onControllerStop(controller) {
    if (this.isRunning(controller)) {
      Tone.Transport.stop();
      this.activeController.signalStopped();
      this.activeController = null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  setBpm(value) {
    Tone.Transport.bpm.value = value;
  }
}
