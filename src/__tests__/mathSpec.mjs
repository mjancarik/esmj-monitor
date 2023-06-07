import {
  medianNoiseReduction,
  percentile,
  linearRegression,
} from '../math.mjs';

describe('math', () => {
  const array = [1, 10, 20, 5, 45, 30];

  describe('percentile', () => {
    it('should create new percentile method', () => {
      expect(typeof percentile()).toEqual('function');
    });

    describe('percentile method', () => {
      it('should calculate right value for defined edge', () => {
        expect(percentile(100)(array)).toMatchInlineSnapshot(`45`);
        expect(percentile(80)(array)).toMatchInlineSnapshot(
          `39.00000000000001`
        );
        expect(percentile(75)(array)).toMatchInlineSnapshot(`33.75`);
        expect(percentile(50)(array)).toMatchInlineSnapshot(`15`);
        expect(percentile(25)(array)).toMatchInlineSnapshot(`4`);
        expect(percentile(20)(array)).toMatchInlineSnapshot(
          `2.6000000000000005`
        );
        expect(percentile(0)(array)).toMatchInlineSnapshot(`1`);
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

        expect(trend.slope).toMatchInlineSnapshot(`0`);
        expect(trend.yIntercept).toMatchInlineSnapshot(`0`);
        expect(trend.predict()).toMatchInlineSnapshot(`0`);
      });

      it('should return linear regression trend for one metrics history', () => {
        const trend = linearRegression()([10]);

        expect(trend.slope).toMatchInlineSnapshot(`0`);
        expect(trend.yIntercept).toMatchInlineSnapshot(`0`);
        expect(trend.predict()).toMatchInlineSnapshot(`0`);
      });

      it('should return linear regression trend for two metrics history', () => {
        const trend = linearRegression()([10, 20]);

        expect(trend.slope).toMatchInlineSnapshot(`10`);
        expect(trend.yIntercept).toMatchInlineSnapshot(`0`);
        expect(trend.predict()).toMatchInlineSnapshot(`30`);
      });

      it('should return linear regression trend for defined metric', () => {
        const trend = linearRegression()([10, 20, 5, 45, 30]);

        expect(trend.slope).toMatchInlineSnapshot(`6.5`);
        expect(trend.yIntercept).toMatchInlineSnapshot(`2.5`);
        expect(trend.predict()).toMatchInlineSnapshot(`41.5`);
      });
    });
  });
});
