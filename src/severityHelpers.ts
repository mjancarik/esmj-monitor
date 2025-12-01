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
