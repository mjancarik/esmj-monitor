import { Observable } from '@esmj/observable';
import type { Metric, MonitorOptions } from './metric/Metric.ts';

export class Monitor extends Observable {
  #options = { interval: 1000 };
  #intervalId: NodeJS.Timeout | null = null;
  #metrics: Metric[] = [];

  constructor(options?: MonitorOptions) {
    super();
    this.#options = { ...this.#options, ...options };
  }

  add(metric: Metric) {
    this.#metrics.push(metric);

    return () => {
      this.remove(metric);
    };
  }

  remove(metric: Metric) {
    const index = this.#metrics.indexOf(metric);

    this.#metrics.splice(index, 1);
  }

  start() {
    if (this.#intervalId) {
      return;
    }

    this.#runMetricMethod('start', this.#options);

    this.#measure();
  }

  stop() {
    clearInterval(this.#intervalId);
    this.#runMetricMethod('stop', this.#options);
    this.complete();
  }

  #runMetricMethod(method: keyof Metric, args: MonitorOptions) {
    return this.#metrics.reduce((result, metric) => {
      Object.assign(result, metric[method](args));

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

  #notify(...rest: Record<string, unknown>[]) {
    try {
      this.next(...rest);
    } catch (error) {
      this.error(error);
    }
  }
}
