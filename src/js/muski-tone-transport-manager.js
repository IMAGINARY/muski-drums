import * as Tone from 'tone';
import EventEmitter from 'events';

class MuskiToneTransportController {
  constructor(manager) {
    this.manager = manager;
    this.events = new EventEmitter();
  }

  start(bpm) {
    this.manager.onControllerStart(this, bpm);
  }

  stop() {
    this.manager.onControllerStop(this);
  }

  setBpm(value) {
    this.manager.setBpm(value);
  }

  isRunning() {
    return this.manager.isRunning(this);
  }

  signalStopped() {
    this.events.emit('stop');
  }

  signalStarted() {
    this.events.emit('start');
  }
}

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
