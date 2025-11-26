import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SEVERITY_LEVEL } from '../Severity.ts';
import { isSeverityLevelAtLeast } from '../severityHelpers.ts';

function getThreats(level) {
  return {
    score: 0,
    level: level,
    records: [],
  };
}

describe('SeverityHelpsers', () => {
  describe('isSeverityLevelAtLeast', () => {
    it('should return true if severity level is at least the specified level', () => {
      assert.strictEqual(
        isSeverityLevelAtLeast(
          getThreats(SEVERITY_LEVEL.HIGH),
          SEVERITY_LEVEL.HIGH,
        ),
        true,
      );
    });

    it('should return true if severity level is higher than the specified level', () => {
      assert.strictEqual(
        isSeverityLevelAtLeast(
          getThreats(SEVERITY_LEVEL.CRITICAL),
          SEVERITY_LEVEL.HIGH,
        ),
        true,
      );
    });

    it('should return false if severity level is lower than the specified level', () => {
      assert.strictEqual(
        isSeverityLevelAtLeast(
          getThreats(SEVERITY_LEVEL.MEDIUM),
          SEVERITY_LEVEL.HIGH,
        ),
        false,
      );
    });
  });
});
