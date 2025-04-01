import EventEmitter from 'events';

export default class MuskiToneTransportController {
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
