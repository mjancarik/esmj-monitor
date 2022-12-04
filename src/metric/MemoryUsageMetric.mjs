import { memoryUsage } from 'node:process';
import { getHeapStatistics } from 'node:v8';
import { Metric } from './Metric.mjs';
import { roundToTwoDecimal } from './roundToTwoDecimal.mjs';

export class MemoryUsageMetric extends Metric {
  #heapStatistics = null;

  start() {
    this.#heapStatistics = getHeapStatistics();
  }

  measure() {
    const memoryUsageData = memoryUsage();

    return {
      memoryUsage: {
        percent: roundToTwoDecimal(
          (memoryUsageData.rss / this.#heapStatistics.total_available_size) *
            100
        ),
        rss: this.#toMB(memoryUsageData.rss),
        heapTotal: this.#toMB(memoryUsageData.heapTotal),
        heapUsed: this.#toMB(memoryUsageData.heapUsed),
        external: this.#toMB(memoryUsageData.external),
        arrayBuffers: this.#toMB(memoryUsageData.arrayBuffers),
      },
    };
  }

  stop() {
    this.#heapStatistics = null;
  }

  #toMB(value) {
    return roundToTwoDecimal(value / 1024 / 1024);
  }
}
