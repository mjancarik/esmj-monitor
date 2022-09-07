export class Monitor {
  #options = { interval: 1000 };
  #intervalId = null;
  #metrics = [];
  #observers = [];

  constructor(options) {
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

  subscribe(observer) {
    this.#observers.push(observer);

    return () => {
      this.unsubscribe(observer);
    };
  }

  unsubscribe(observer) {
    const index = this.#observers.indexOf(observer);

    this.#observers.splice(index, 1);
  }

  start() {
    this.#runMetricMethod('start', this.#options);

    this.#measure();
  }

  stop() {
    this.#runMetricMethod('stop', this.#options);
  }

  #runMetricMethod(method, args) {
    return this.#metrics.reduce((result, metric) => {
      result = { ...result, ...metric[method](args) };

      return result;
    }, {});
  }

  #measure() {
    this.intervalId = setInterval(() => {
      this.#runMetricMethod('beforeMeasure', this.#options);
      const metrics = this.#runMetricMethod('measure', this.#options);
      this.#notify(metrics);
      this.#runMetricMethod('afterMeasure', this.#options);
    }, this.#options.interval).unref();
  }

  #notify(...rest) {
    this.#observers.forEach((observer) => {
      observer(...rest);
    });
  }
}
