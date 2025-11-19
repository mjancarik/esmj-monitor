import { cpuUsage } from 'node:process';
import { Metric, type MonitorOptions } from './Metric.ts';
import { roundToTwoDecimal } from './roundToTwoDecimal.ts';

export class CPUUsageMetric extends Metric {
  #cpuUsage: NodeJS.CpuUsage = null;

  start() {
    this.#cpuUsage = cpuUsage();
  }

  measure({ interval }: MonitorOptions) {
    const cpuUsageData = cpuUsage(this.#cpuUsage);

    return {
      cpuUsage: {
        user: cpuUsageData.user,
        system: cpuUsageData.system,
        percent: roundToTwoDecimal(
          (100 * (cpuUsageData.user + cpuUsageData.system)) / (interval * 1000),
        ),
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
