import { loadavg } from 'node:os';

import { Metric } from './Metric.mjs';

export class LoadAverageMetric extends Metric {
  measure() {
    let [minute1, minute5, minute15] = loadavg();

    return {
      loadAverage: {
        minute1,
        minute5,
        minute15,
      },
    };
  }
}
