import { loadavg } from 'node:os';

import { Metric } from './Metric.ts';
import { roundToTwoDecimal } from './roundToTwoDecimal.ts';

export class LoadAverageMetric extends Metric {
  measure() {
    const [minute1, minute5, minute15] = loadavg();

    return {
      loadAverage: {
        minute1: roundToTwoDecimal(minute1),
        minute5: roundToTwoDecimal(minute5),
        minute15: roundToTwoDecimal(minute15),
      },
    };
  }
}
