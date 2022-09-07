import { performance } from 'node:perf_hooks';

import { Metric } from './Metric.mjs';

const { eventLoopUtilization } = performance;

export class EventLoopUtilizationMetric extends Metric {
  #eventLoopUtilizationDataStart = null;
  #eventLoopUtilizationDataEnd = null;

  start() {
    this.#eventLoopUtilizationDataStart = eventLoopUtilization();
  }

  beforeMeasure() {
    this.#eventLoopUtilizationDataEnd = eventLoopUtilization();
  }

  measure() {
    return {
      eventLoopUtilization: eventLoopUtilization(
        this.#eventLoopUtilizationDataEnd,
        this.#eventLoopUtilizationDataStart
      ),
    };
  }

  afterMeasure() {
    this.#eventLoopUtilizationDataStart = this.#eventLoopUtilizationDataEnd;
  }

  stop() {
    this.#eventLoopUtilizationDataStart = null;
    this.#eventLoopUtilizationDataEnd = null;
  }
}
