import { pid, platform, ppid, uptime, version } from 'node:process';
import { Metric } from './Metric.ts';

export class ProcessMetric extends Metric {
  measure() {
    return {
      process: {
        pid,
        ppid,
        platform,
        uptime: uptime(),
        version,
      },
    };
  }
}
