import { type IntervalHistogram, monitorEventLoopDelay } from 'node:perf_hooks';

import { Metric, type MonitorOptions } from './Metric.ts';
import { roundToTwoDecimal } from './roundToTwoDecimal.ts';

export class EventLoopDelayMetric extends Metric {
  #histogram: IntervalHistogram | null = null;

  start() {
    this.#histogram = monitorEventLoopDelay({ resolution: 20 });
    this.#histogram.enable();
  }

  beforeMeasure() {
    this.#histogram?.disable();
  }

  measure({ interval }: MonitorOptions) {
    return {
      eventLoopDelay: {
        min: roundToTwoDecimal(
          (this.#histogram?.min ?? 0) / ((interval ?? 1000) * 1000),
        ),
        max: roundToTwoDecimal(
          (this.#histogram?.max ?? 0) / ((interval ?? 1000) * 1000),
        ),
        mean: roundToTwoDecimal(
          (this.#histogram?.mean ?? 0) / ((interval ?? 1000) * 1000),
        ),
        stddev: roundToTwoDecimal(
          (this.#histogram?.stddev ?? 0) / ((interval ?? 1000) * 1000),
        ),
        percentile80: roundToTwoDecimal(
          (this.#histogram?.percentile(80) ?? 0) / ((interval ?? 1000) * 1000),
        ),
      },
    };
  }

  afterMeasure() {
    this.#histogram?.reset();
    this.#histogram?.enable();
  }

  stop() {
    this.#histogram?.reset();
    this.#histogram?.disable();
    this.#histogram = null;
  }
}
