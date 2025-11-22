class PollingService {
  constructor(interval) {
    this.intervalId = null;
    this.interval = interval;
  }

  start() {
    if (this.intervalId) return;
    this._pollOnce();
    this.intervalId = setInterval(() => this._pollOnce(), this.interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  restart() {
    this.stop();
    this.start();
  }

  setInterval(newInterval) {
    this.interval = newInterval;
    if (this.intervalId) this.restart();
  }

  async _pollOnce() {
    throw new Error('_pollOnce must be implemented by subclass');
  }
}
