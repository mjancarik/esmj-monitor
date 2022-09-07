import { monitorEventLoopDelay } from 'node:perf_hooks';

import { Metric } from './metric.mjs';

export class EventLoopDelayMetric extends Metric {
  #histogram = null;

  start() {
    this.#histogram = monitorEventLoopDelay({ resolution: 20 });
    this.#histogram.enable();
  }

  beforeMeasure() {
    this.#histogram.disable();
  }

  measure({ interval }) {
    return {
      eventLoopDelay: {
        min: this.#histogram.min / (interval * 1000),
        max: this.#histogram.max / (interval * 1000),
        mean: this.#histogram.mean / (interval * 1000),
        stddev: this.#histogram.stddev / (interval * 1000),
        percentile80: this.#histogram.percentile(80) / (interval * 1000),
      },
    };
  }

  afterMeasure() {
    this.#histogram.reset();
    this.#histogram.enable();
  }

  stop() {
    this.#histogram.reset();
    this.#histogram.disable();
    this.#histogram = null;
  }
}
