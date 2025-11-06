import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  _sum,
  avg,
  first,
  last,
  linearRegression,
  medianNoiseReduction,
  percentile,
  sum,
  takeLast,
} from '../math.ts';

describe('math', () => {
  const array = [1, 10, 20, 5, 45, 30];

  describe('percentile', () => {
    it('should create new percentile method', () => {
      assert.strictEqual(typeof percentile(), 'function');
    });

    describe('percentile method', () => {
      it('should calculate right value for defined edge', () => {
        assert.strictEqual(percentile(100)(array), 45);
        assert.strictEqual(percentile(80)(array), 39.00000000000001);
        assert.strictEqual(percentile(75)(array), 33.75);
        assert.strictEqual(percentile(50)(array), 15);
        assert.strictEqual(percentile(25)(array), 4);
        assert.strictEqual(percentile(20)(array), 2.6000000000000005);
        assert.strictEqual(percentile(0)(array), 1);
      });
    });
  });

  describe('medianNoiseReduction', () => {
    it('should create new medianNoiseReduction method', () => {
      assert.strictEqual(typeof medianNoiseReduction(), 'function');
    });

    describe('medianNoiseReduction method', () => {
      it('should remove noise from array', () => {
        const noiseReduction = medianNoiseReduction(5);
        assert.deepStrictEqual(
          noiseReduction([488, 525, 577, 488, 359]),
          [525, 506.5, 488, 506.5, 488],
        );
      });
    });
  });

  describe('linear Regression', () => {
    it('should create new linearRegression method', () => {
      assert.strictEqual(typeof linearRegression(), 'function');
    });

    describe('method', () => {
      it('should return linear regression trend for empty array', () => {
        const trend = linearRegression()([]);

        assert.strictEqual(trend.slope, 0);
        assert.strictEqual(trend.yIntercept, 0);
        assert.strictEqual(trend.predict(), 0);
      });

      it('should return linear regression trend for one metrics history', () => {
        const trend = linearRegression()([10]);

        assert.strictEqual(trend.slope, 0);
        assert.strictEqual(trend.yIntercept, 0);
        assert.strictEqual(trend.predict(), 0);
      });

      it('should return linear regression trend for two metrics history', () => {
        const trend = linearRegression()([10, 20]);

        assert.strictEqual(trend.slope, 10);
        assert.strictEqual(trend.yIntercept, 0);
        assert.strictEqual(trend.predict(), 30);
      });

      it('should return linear regression trend for defined metric', () => {
        const trend = linearRegression()([10, 20, 5, 45, 30]);

        assert.strictEqual(trend.slope, 6.5);
        assert.strictEqual(trend.yIntercept, 2.5);
        assert.strictEqual(trend.predict(), 41.5);
      });
    });
  });

  describe('takeLast', () => {
    it('should create new takeLast method', () => {
      assert.strictEqual(typeof takeLast(), 'function');
    });

    describe('takeLast method', () => {
      it('should return the last N elements of an array', () => {
        const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        assert.deepStrictEqual(takeLast(3)(array), [8, 9, 10]);
        assert.deepStrictEqual(takeLast(5)(array), [6, 7, 8, 9, 10]);
        assert.deepStrictEqual(
          takeLast(10)(array),
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        );
        assert.deepStrictEqual(
          takeLast(15)(array),
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        );
      });

      it('should handle edge cases', () => {
        const array = [1, 2, 3];

        assert.deepStrictEqual(takeLast(0)(array), [1, 2, 3]);
        assert.deepStrictEqual(takeLast(-1)(array), []); // Negative values return empty array per implementation
        assert.deepStrictEqual(takeLast()(array), [1, 2, 3]);
        assert.deepStrictEqual(takeLast(3)([]), []);
      });
    });
  });

  describe('first', () => {
    it('should create new first method', () => {
      assert.strictEqual(typeof first(), 'function');
    });

    describe('first method', () => {
      it('should return the first element of an array', () => {
        assert.strictEqual(first()([5, 2, 3]), 5);
        assert.strictEqual(first()([99]), 99);
      });

      it('should return undefined for an empty array', () => {
        assert.strictEqual(first()([]), undefined);
      });
    });
  });

  describe('last', () => {
    it('should create new last method', () => {
      assert.strictEqual(typeof last(), 'function');
    });

    describe('last method', () => {
      it('should return the last element of an array', () => {
        assert.strictEqual(last()([1, 2, 3]), 3);
        assert.strictEqual(last()([99]), 99);
      });

      it('should return undefined for an empty array', () => {
        assert.strictEqual(last()([]), undefined);
      });
    });
  });

  describe('avg', () => {
    it('should create new avg method', () => {
      assert.strictEqual(typeof avg(), 'function');
    });

    describe('avg method', () => {
      it('should calculate average of an array', () => {
        assert.strictEqual(avg()([1, 2, 3, 4, 5]), 3);
        assert.strictEqual(avg()([10, 20]), 15);
        assert.strictEqual(avg()([7]), 7);
      });

      it('should return undefined for an empty array', () => {
        assert.strictEqual(avg()([]), undefined);
      });

      it('should handle non-number values', () => {
        // According to implementation, avg() returns NaN for non-number values
        // rather than undefined as in _sum
        const result1 = avg()([1, 2, 'three']);
        const result2 = avg()([1, Number.NaN, 3]);

        assert.ok(Number.isNaN(result1) || result1 === undefined);
        assert.ok(Number.isNaN(result2) || result2 === undefined);
      });
    });
  });

  describe('sum', () => {
    it('should create new sum method', () => {
      assert.strictEqual(typeof sum(), 'function');
    });

    describe('sum method', () => {
      it('should calculate sum of an array', () => {
        assert.strictEqual(sum()([1, 2, 3, 4, 5]), 15);
        assert.strictEqual(sum()([10, 20]), 30);
        assert.strictEqual(sum()([7]), 7);
      });

      it('should return undefined for an empty array', () => {
        assert.strictEqual(sum()([]), undefined);
      });

      it('should return undefined if array contains non-numbers', () => {
        assert.strictEqual(sum()([1, 2, 'three']), undefined);
        assert.strictEqual(sum()([1, Number.NaN, 3]), undefined);
      });
    });
  });

  describe('_sum (internal)', () => {
    it('should calculate sum of an array directly', () => {
      assert.strictEqual(_sum([1, 2, 3, 4, 5]), 15);
      assert.strictEqual(_sum([10, 20]), 30);
      assert.strictEqual(_sum([7]), 7);
    });

    it('should return undefined for an empty array', () => {
      assert.strictEqual(_sum([]), undefined);
    });

    it('should return undefined if array contains non-numbers', () => {
      assert.strictEqual(_sum([1, 2, 'three']), undefined);
      assert.strictEqual(_sum([1, Number.NaN, 3]), undefined);
    });
  });
});
