import { memoryUsage } from 'node:process';
import { Metric } from './Metric.mjs';

export class MemoryUsageMetric extends Metric {
  measure() {
    const memoryUsageData = memoryUsage();

    return {
      memoryUsage: {
        rss: this.#toMB(memoryUsageData.rss),
        heapTotal: this.#toMB(memoryUsageData.heapTotal),
        heapUsed: this.#toMB(memoryUsageData.heapUsed),
        external: this.#toMB(memoryUsageData.external),
        arrayBuffers: this.#toMB(memoryUsageData.arrayBuffers),
      },
    };
  }

  #toMB(value) {
    return Math.round((value / 1024 / 1024) * 100) / 100;
  }
}
