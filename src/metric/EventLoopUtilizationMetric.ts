import { type EventLoopUtilization, performance } from 'node:perf_hooks';

import { Metric } from './Metric.ts';
import { roundToTwoDecimal } from './roundToTwoDecimal.ts';

const { eventLoopUtilization } = performance;

export class EventLoopUtilizationMetric extends Metric {
  #eventLoopUtilizationDataStart: EventLoopUtilization = null;
  #eventLoopUtilizationDataEnd: EventLoopUtilization = null;

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
