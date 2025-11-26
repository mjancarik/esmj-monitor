import {
  SEVERITY_LEVEL,
  type SeverityCalculation,
  type SeverityLevel,
} from './Severity.ts';

export function isSeverityLevelAtLeast(
  threats: SeverityCalculation,
  minLevel: SeverityLevel,
) {
  const order = Object.values(SEVERITY_LEVEL);
  return order.indexOf(threats?.level) >= order.indexOf(minLevel);
}
