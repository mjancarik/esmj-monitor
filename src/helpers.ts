import type { RequestMetricRequestData } from './metric/RequestMetric.ts';

import {
  SEVERITY_LEVEL,
  SEVERITY_LEVEL_ORDER,
  type SeverityCalculation,
  type SeverityLevel,
} from './Severity.ts';

export function isSeverityLevelAtLeast(
  threats: SeverityCalculation,
  minLevel: SeverityLevel,
) {
  return (
    SEVERITY_LEVEL_ORDER.indexOf(threats?.level) >=
    SEVERITY_LEVEL_ORDER.indexOf(minLevel)
  );
}

export function getRequestsDurationsAvg(
  duration: RequestMetricRequestData['duration'],
) {
  const weights = {
    10: 10,
    25: 25,
    50: 50,
    100: 100,
    200: 200,
    500: 500,
    1000: 1000,
    2000: 2000,
    5000: 5000,
    Infinity: 100000,
  };

  let totalCount = 0;
  let totalValue = 0;

  for (const key in duration) {
    const count = duration[key as keyof typeof duration];
    const weight = weights[key as keyof typeof weights];

    totalCount += count;
    totalValue += count * weight;
  }

  return totalCount === 0 ? 0 : totalValue / totalCount;
}
