import { pid, platform, ppid, uptime, version } from 'node:process';
import { Metric } from './Metric.mjs';

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
