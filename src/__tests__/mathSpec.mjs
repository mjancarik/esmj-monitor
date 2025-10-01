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
} from '../math.mjs';

describe('math', () => {
  const array = [1, 10, 20, 5, 45, 30];

  describe('percentile', () => {
    it('should create new percentile method', () => {
      expect(typeof percentile()).toEqual('function');
    });

    describe('percentile method', () => {
      it('should calculate right value for defined edge', () => {
        expect(percentile(100)(array)).toMatchInlineSnapshot('45');
        expect(percentile(80)(array)).toMatchInlineSnapshot(
          '39.00000000000001',
        );
        expect(percentile(75)(array)).toMatchInlineSnapshot('33.75');
        expect(percentile(50)(array)).toMatchInlineSnapshot('15');
        expect(percentile(25)(array)).toMatchInlineSnapshot('4');
        expect(percentile(20)(array)).toMatchInlineSnapshot(
          '2.6000000000000005',
        );
        expect(percentile(0)(array)).toMatchInlineSnapshot('1');
      });
    });
  });

  describe('medianNoiseReduction', () => {
    it('should create new medianNoiseReduction method', () => {
      expect(typeof medianNoiseReduction()).toEqual('function');
    });

    describe('medianNoiseReduction method', () => {
      it('should remove noise from array', () => {
        const noiseReduction = medianNoiseReduction(5);
        expect(noiseReduction([488, 525, 577, 488, 359])).toEqual([
          525, 506.5, 488, 506.5, 488,
        ]);
      });
    });
  });

  describe('linear Regression', () => {
    it('should create new linearRegression method', () => {
      expect(typeof linearRegression()).toEqual('function');
    });

    describe('method', () => {
      it('should return linear regression trend for empty array', () => {
        const trend = linearRegression()([]);

        expect(trend.slope).toMatchInlineSnapshot('0');
        expect(trend.yIntercept).toMatchInlineSnapshot('0');
        expect(trend.predict()).toMatchInlineSnapshot('0');
      });

      it('should return linear regression trend for one metrics history', () => {
        const trend = linearRegression()([10]);

        expect(trend.slope).toMatchInlineSnapshot('0');
        expect(trend.yIntercept).toMatchInlineSnapshot('0');
        expect(trend.predict()).toMatchInlineSnapshot('0');
      });

      it('should return linear regression trend for two metrics history', () => {
        const trend = linearRegression()([10, 20]);

        expect(trend.slope).toMatchInlineSnapshot('10');
        expect(trend.yIntercept).toMatchInlineSnapshot('0');
        expect(trend.predict()).toMatchInlineSnapshot('30');
      });

      it('should return linear regression trend for defined metric', () => {
        const trend = linearRegression()([10, 20, 5, 45, 30]);

        expect(trend.slope).toMatchInlineSnapshot('6.5');
        expect(trend.yIntercept).toMatchInlineSnapshot('2.5');
        expect(trend.predict()).toMatchInlineSnapshot('41.5');
      });
    });
  });

  describe('takeLast', () => {
    it('should create new takeLast method', () => {
      expect(typeof takeLast()).toEqual('function');
    });

    describe('takeLast method', () => {
      it('should return the last N elements of an array', () => {
        const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        expect(takeLast(3)(array)).toEqual([8, 9, 10]);
        expect(takeLast(5)(array)).toEqual([6, 7, 8, 9, 10]);
        expect(takeLast(10)(array)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(takeLast(15)(array)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      });

      it('should handle edge cases', () => {
        const array = [1, 2, 3];

        expect(takeLast(0)(array)).toEqual([1, 2, 3]);
        expect(takeLast(-1)(array)).toEqual([]); // Negative values return empty array per implementation
        expect(takeLast()(array)).toEqual([1, 2, 3]);
        expect(takeLast(3)([])).toEqual([]);
      });
    });
  });

  describe('first', () => {
    it('should create new first method', () => {
      expect(typeof first()).toEqual('function');
    });

    describe('first method', () => {
      it('should return the first element of an array', () => {
        expect(first()([5, 2, 3])).toEqual(5);
        expect(first()([99])).toEqual(99);
      });

      it('should return undefined for an empty array', () => {
        expect(first()([])).toBeUndefined();
      });
    });
  });

  describe('last', () => {
    it('should create new last method', () => {
      expect(typeof last()).toEqual('function');
    });

    describe('last method', () => {
      it('should return the last element of an array', () => {
        expect(last()([1, 2, 3])).toEqual(3);
        expect(last()([99])).toEqual(99);
      });

      it('should return undefined for an empty array', () => {
        expect(last()([])).toBeUndefined();
      });
    });
  });

  describe('avg', () => {
    it('should create new avg method', () => {
      expect(typeof avg()).toEqual('function');
    });

    describe('avg method', () => {
      it('should calculate average of an array', () => {
        expect(avg()([1, 2, 3, 4, 5])).toEqual(3);
        expect(avg()([10, 20])).toEqual(15);
        expect(avg()([7])).toEqual(7);
      });

      it('should return undefined for an empty array', () => {
        expect(avg()([])).toBeUndefined();
      });

      it('should handle non-number values', () => {
        // According to implementation, avg() returns NaN for non-number values
        // rather than undefined as in _sum
        const result1 = avg()([1, 2, 'three']);
        const result2 = avg()([1, Number.NaN, 3]);

        expect(Number.isNaN(result1) || result1 === undefined).toBeTruthy();
        expect(Number.isNaN(result2) || result2 === undefined).toBeTruthy();
      });
    });
  });

  describe('sum', () => {
    it('should create new sum method', () => {
      expect(typeof sum()).toEqual('function');
    });

    describe('sum method', () => {
      it('should calculate sum of an array', () => {
        expect(sum()([1, 2, 3, 4, 5])).toEqual(15);
        expect(sum()([10, 20])).toEqual(30);
        expect(sum()([7])).toEqual(7);
      });

      it('should return undefined for an empty array', () => {
        expect(sum()([])).toBeUndefined();
      });

      it('should return undefined if array contains non-numbers', () => {
        expect(sum()([1, 2, 'three'])).toBeUndefined();
        expect(sum()([1, Number.NaN, 3])).toBeUndefined();
      });
    });
  });

  describe('_sum (internal)', () => {
    it('should calculate sum of an array directly', () => {
      expect(_sum([1, 2, 3, 4, 5])).toEqual(15);
      expect(_sum([10, 20])).toEqual(30);
      expect(_sum([7])).toEqual(7);
    });

    it('should return undefined for an empty array', () => {
      expect(_sum([])).toBeUndefined();
    });

    it('should return undefined if array contains non-numbers', () => {
      expect(_sum([1, 2, 'three'])).toBeUndefined();
      expect(_sum([1, Number.NaN, 3])).toBeUndefined();
    });
  });
});
