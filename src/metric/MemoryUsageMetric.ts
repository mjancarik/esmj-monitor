import { memoryUsage } from 'node:process';
import { type HeapInfo, getHeapStatistics } from 'node:v8';
import { Metric } from './Metric.ts';
import { roundToTwoDecimal } from './roundToTwoDecimal.ts';

export class MemoryUsageMetric extends Metric {
  #heapStatistics: HeapInfo = null;

  start() {
    this.#heapStatistics = getHeapStatistics();
  }

  measure() {
    const memoryUsageData = memoryUsage();

    return {
      memoryUsage: {
        percent: roundToTwoDecimal(
          (memoryUsageData.rss / this.#heapStatistics.heap_size_limit) * 100,
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

  #toMB(value: number) {
    return roundToTwoDecimal(value / 1024 / 1024);
  }
}
