import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SEVERITY_LEVEL } from '../Severity.ts';
import { getRequestsDurationsAvg, isSeverityLevelAtLeast } from '../helpers.ts';

function getThreats(level) {
  return {
    score: 0,
    level: level,
    records: [],
  };
}

describe('Helpers', () => {
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

  describe('getRequestsDurationsAvg', () => {
    it('it should calculate average duration from durations histogram', () => {
      assert.strictEqual(
        getRequestsDurationsAvg({
          10: 10,
          25: 9,
          50: 8,
          100: 7,
          200: 6,
          500: 5,
          1000: 4,
          2000: 3,
          5000: 2,
          Infinity: 1,
        }),
        2275,
      );
    });
  });
});
