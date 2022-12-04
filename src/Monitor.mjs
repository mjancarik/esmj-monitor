import { Observable } from '@esmj/observable';

export class Monitor extends Observable {
  #options = { interval: 1000 };
  #intervalId = null;
  #metrics = [];

  constructor(options) {
    super();
    this.#options = { ...this.#options, ...options };
  }

  add(metric) {
    this.#metrics.push(metric);

    return () => {
      this.remove(metric);
    };
  }

  remove(metric) {
    const index = this.#metrics.indexOf(metric);

    this.#metrics.splice(index, 1);
  }

  start() {
    this.#runMetricMethod('start', this.#options);

    this.#measure();
  }

  stop() {
    clearInterval(this.#intervalId);
    this.#runMetricMethod('stop', this.#options);
    this.complete();
  }

  #runMetricMethod(method, args) {
    return this.#metrics.reduce((result, metric) => {
      result = { ...result, ...metric[method](args) };

      return result;
    }, {});
  }

  #measure() {
    this.#intervalId = setInterval(() => {
      this.#runMetricMethod('beforeMeasure', this.#options);
      const metrics = this.#runMetricMethod('measure', this.#options);
      this.#notify(metrics);
      this.#runMetricMethod('afterMeasure', this.#options);
    }, this.#options.interval).unref();
  }

  #notify(...rest) {
    try {
      this.next(...rest);
    } catch (error) {
      this.error(error);
    }
  }
}
