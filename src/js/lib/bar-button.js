import EventEmitter from 'events';

export default class BarButton {
  constructor(options) {
    const defaultOptions = {
      buttonText: '',
      animationTime: 500,
      processTimeout: 15000,
    };
    this.options = { ...defaultOptions, ...options };
    this.animationTimeout = null;
    this.processTimeout = null;
    this.isProcessing = false;
    this.isAnimating = false;

    this.events = new EventEmitter();

    this.$element = $('<div></div>')
      .addClass('bar-button');

    this.$button = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-secondary', 'bar-button-button'])
      .html(this.options.buttonText)
      .on('click', (ev) => {
        ev.preventDefault();
        this.handleStart();
      })
      .appendTo(this.$element);

    this.$bar = $('<div></div>')
      .addClass('bar-button-bar')
      .append(
        $('<span class="progress"></span>')
          .css({
            animationDuration: `${this.options.animationTime}ms`,
          })
      )
      .appendTo(this.$element);
  }

  done() {
    this.handleDone();
  }

  handleStart() {
    if (!this.isProcessing) {
      this.$element.addClass('in-progress');
      this.isAnimating = true;
      this.isProcessing = true;

      this.animationTimeout = setTimeout(() => {
        this.animationTimeout = null;
        this.isAnimating = false;
        this.updateProgress();
        this.events.emit('start');
      }, this.options.animationTime);

      this.processTimeout = setTimeout(() => {
        this.processTimeout = null;
        this.handleDone();
        this.events.emit('abort');
      }, this.options.processTimeout);
    }
  }

  handleDone() {
    if (this.processTimeout) {
      clearTimeout(this.processTimeout);
      this.processTimeout = null;
    }
    this.isProcessing = false;
    this.updateProgress();
  }

  updateProgress() {
    if (!this.isProcessing && !this.isAnimating) {
      this.$element.removeClass('in-progress');
    }
  }
}
