import { type IntervalHistogram, monitorEventLoopDelay } from 'node:perf_hooks';

import { Metric, type MonitorOptions } from './Metric.ts';
import { roundToTwoDecimal } from './roundToTwoDecimal.ts';

export class EventLoopDelayMetric extends Metric {
  #histogram: IntervalHistogram = null;

  start() {
    this.#histogram = monitorEventLoopDelay({ resolution: 20 });
    this.#histogram.enable();
  }

  beforeMeasure() {
    this.#histogram.disable();
  }

  measure({ interval }: MonitorOptions) {
    return {
      eventLoopDelay: {
        min: roundToTwoDecimal(this.#histogram.min / (interval * 1000)),
        max: roundToTwoDecimal(this.#histogram.max / (interval * 1000)),
        mean: roundToTwoDecimal(this.#histogram.mean / (interval * 1000)),
        stddev: roundToTwoDecimal(this.#histogram.stddev / (interval * 1000)),
        percentile80: roundToTwoDecimal(
          this.#histogram.percentile(80) / (interval * 1000),
        ),
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
