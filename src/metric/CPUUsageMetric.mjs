import { cpuUsage } from 'node:process';
import { Metric } from './Metric.mjs';

export class CPUUsageMetric extends Metric {
  #cpuUsage = null;

  start() {
    this.#cpuUsage = cpuUsage();
  }

  measure({ interval }) {
    const cpuUsageData = cpuUsage(this.#cpuUsage);

    return {
      cpuUsage: {
        user: cpuUsageData.user,
        system: cpuUsageData.system,
        percent:
          (100 * (cpuUsageData.user + cpuUsageData.system)) / (interval * 1000),
      },
    };
  }

  afterMeasure() {
    this.#cpuUsage = cpuUsage();
  }

  stop() {
    this.#cpuUsage = null;
  }
}
