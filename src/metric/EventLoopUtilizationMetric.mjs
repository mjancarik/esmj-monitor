import { performance } from 'node:perf_hooks';

import { Metric } from './Metric.mjs';
import { roundToTwoDecimal } from './roundToTwoDecimal.mjs';

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
    const eventLoopUtilizationData = eventLoopUtilization(
      this.#eventLoopUtilizationDataEnd,
      this.#eventLoopUtilizationDataStart,
    );

    return {
      eventLoopUtilization: {
        idle: roundToTwoDecimal(eventLoopUtilizationData.idle),
        active: roundToTwoDecimal(eventLoopUtilizationData.active),
        utilization: roundToTwoDecimal(eventLoopUtilizationData.utilization),
      },
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
