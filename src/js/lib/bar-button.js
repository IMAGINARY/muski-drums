import EventEmitter from 'events';

export default class BarButton {
  constructor(options) {
    const defaultOptions = {
      buttonText: '',
      holdTime: 1000,
    };
    this.options = Object.assign({}, defaultOptions, options);

    this.events = new EventEmitter();
    this.holdTimeout = null;
    this.trackedPointerId = null;

    this.$element = $('<div></div>')
      .addClass('bar-button');

    this.$button = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-secondary', 'bar-button-button'])
      .html(this.options.buttonText)
      .on('pointerdown', (ev) => {
        if (this.trackedPointerId === null) {
          ev.preventDefault();
          this.trackedPointerId = ev.pointerId;
          // On touch, apparently, the pointer is automatically captured by pointerdown
          ev.delegateTarget.releasePointerCapture(ev.pointerId);
          this.handleHoldStart();
        }
      })
      .appendTo(this.$element);

    this.$bar = $('<div></div>')
      .addClass('bar-button-bar')
      .append(
        $('<span class="progress"></span>')
          .css({
            animationDuration: `${this.options.holdTime}ms`,
          })
      )
      .appendTo(this.$element);

    $(document)
      .on('pointerup', (ev) => {
        if (ev.pointerId === this.trackedPointerId) {
          this.handleHoldAbort();
        }
      })
      .on('pointercancel', (ev) => {
        if (ev.pointerId === this.trackedPointerId) {
          this.handleHoldAbort();
        }
      });
  }

  handleHoldStart() {
    if (this.holdTimeout !== null) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
    }

    this.$element.addClass('held');
    this.holdTimeout = setTimeout(() => {
      this.holdTimeout = null;
      this.trackedPointerId = null;
      this.events.emit('action');
      this.$element.removeClass('held');
    }, this.options.holdTime);
  }

  handleHoldAbort() {
    if (this.holdTimeout !== null) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
    }
    this.$element.removeClass('held');
    this.trackedPointerId = null;
  }
}
