import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { pipe } from '@esmj/observable';
import { MetricsHistory } from '../MetricsHistory.ts';
import {
  linearRegression,
  medianNoiseReduction,
  percentile,
  takeLast,
} from '../math.ts';
import { memo } from '../memo.ts';

describe('MetricsHistory', () => {
  let metricsHistory;

  beforeEach(() => {
    metricsHistory = new MetricsHistory();

    metricsHistory.next({
      cpuUsage: { user: 850, system: 450, percent: 1 },
      memoryUsage: {
        rss: 100,
        heapTotal: 70,
      },
    });
    metricsHistory.next({
      cpuUsage: { user: 900, system: 400, percent: 10 },
      memoryUsage: {
        rss: 120,
        heapTotal: 80,
      },
    });

    metricsHistory.next({
      cpuUsage: { user: 1000, system: 500, percent: 20 },
      memoryUsage: {
        rss: 140,
        heapTotal: 80,
      },
    });

    metricsHistory.next({
      cpuUsage: { user: 100, system: 100, percent: 5 },
      memoryUsage: {
        rss: 80,
        heapTotal: 60,
      },
    });

    metricsHistory.next({
      cpuUsage: { user: 2000, system: 1000, percent: 45 },
      memoryUsage: {
        rss: 200,
        heapTotal: 100,
      },
    });

    metricsHistory.next({
      cpuUsage: { user: 1200, system: 900, percent: 30 },
      memoryUsage: {
        rss: 150,
        heapTotal: 80,
      },
    });
  });

  it('should get percentile for defined metric', () => {
    const percentile100 = pipe(
      metricsHistory.from('cpuUsage.percent'),
      percentile(100),
    )();
    const percentile80 = pipe(
      metricsHistory.from('cpuUsage.percent'),
      percentile(80),
    )();
    const percentile75 = pipe(
      metricsHistory.from('cpuUsage.percent'),
      percentile(75),
    )();
    const median = pipe(
      metricsHistory.from('cpuUsage.percent'),
      percentile(50),
    )();
    const percentile25 = pipe(
      metricsHistory.from('cpuUsage.percent'),
      percentile(25),
    )();
    const percentile20 = pipe(
      metricsHistory.from('cpuUsage.percent'),
      percentile(20),
    )();
    const percentile0 = pipe(
      metricsHistory.from('cpuUsage.percent'),
      percentile(0),
    )();

    assert.strictEqual(percentile100, 45);
    assert.strictEqual(percentile80, 39.00000000000001);
    assert.strictEqual(percentile75, 33.75);
    assert.strictEqual(median, 15);
    assert.strictEqual(percentile25, 4);
    assert.strictEqual(percentile20, 2.6000000000000005);
    assert.strictEqual(percentile0, 1);
    assert.strictEqual(metricsHistory.size, 6);
    assert.deepEqual(metricsHistory.current, {
      cpuUsage: { user: 1200, system: 900, percent: 30 },
      memoryUsage: { rss: 150, heapTotal: 80 },
    });
  });

  describe('trend method', () => {
    it('should return linear regression trend for empty metrics history', () => {
      metricsHistory = new MetricsHistory();
      const trend = pipe(
        metricsHistory.from('cpuUsage.percent'),
        takeLast(5),
        linearRegression(),
      )();

      assert.strictEqual(trend.slope, 0);
      assert.strictEqual(trend.yIntercept, 0);
      assert.strictEqual(trend.predict(), 0);
    });

    it('should return linear regression trend for one metrics history', () => {
      metricsHistory = new MetricsHistory();
      metricsHistory.next({
        cpuUsage: { user: 900, system: 400, percent: 10 },
        memoryUsage: {
          rss: 120,
          heapTotal: 80,
        },
      });
      const trend = pipe(
        metricsHistory.from('cpuUsage.percent'),
        takeLast(5),
        linearRegression(),
      )();

      assert.strictEqual(trend.slope, 0);
      assert.strictEqual(trend.yIntercept, 0);
      assert.strictEqual(trend.predict(), 0);
    });

    it('should return linear regression trend for two metrics history', () => {
      metricsHistory = new MetricsHistory();
      metricsHistory.next({
        cpuUsage: { user: 900, system: 400, percent: 10 },
        memoryUsage: {
          rss: 120,
          heapTotal: 80,
        },
      });
      metricsHistory.next({
        cpuUsage: { user: 900, system: 400, percent: 20 },
        memoryUsage: {
          rss: 120,
          heapTotal: 80,
        },
      });

      const trend = pipe(
        metricsHistory.from('cpuUsage.percent'),
        takeLast(5),
        linearRegression(),
      )();

      assert.strictEqual(trend.slope, 10);
      assert.strictEqual(trend.yIntercept, 0);
      assert.strictEqual(trend.predict(), 30);
    });

    it('should return linear regression trend for defined metric', () => {
      const trend = pipe(
        metricsHistory.from('cpuUsage.percent'),
        takeLast(5),
        linearRegression(),
      )();

      assert.strictEqual(trend.slope, 6.5);
      assert.strictEqual(trend.yIntercept, 2.5);
      assert.strictEqual(trend.predict(), 41.5);
    });

    it('memo function should calculate trend only once for same inputs', () => {
      const trendFn = pipe(
        metricsHistory.from('cpuUsage.percent'),
        takeLast(5),
        linearRegression(),
      );
      const trendMock = mock.fn(trendFn);
      const trendMemo = memo(trendMock);

      trendMemo();
      trendMemo();
      trendMemo();

      const trend = trendMemo();

      assert.strictEqual(trend.slope, 6.5);
      assert.strictEqual(trend.yIntercept, 2.5);
      assert.strictEqual(trend.predict(), 41.5);

      assert.strictEqual(trendMock.mock.callCount(), 1);
    });

    it('memo function should recalculate trend for new metrics', () => {
      metricsHistory = new MetricsHistory();

      const trendFn = pipe(
        metricsHistory.from('cpuUsage.percent'),
        takeLast(5),
        linearRegression(),
      );
      const trendMock = mock.fn(trendFn);
      const trendMemo = memo(trendMock);

      metricsHistory.add('trendCPUUsage', trendMemo);

      metricsHistory.custom.trendCPUUsage();
      metricsHistory.custom.trendCPUUsage();

      metricsHistory.next({
        cpuUsage: { user: 900, system: 400, percent: 10 },
        memoryUsage: {
          rss: 120,
          heapTotal: 80,
        },
      });

      metricsHistory.custom.trendCPUUsage();
      metricsHistory.custom.trendCPUUsage();

      metricsHistory.next({
        cpuUsage: { user: 900, system: 400, percent: 20 },
        memoryUsage: {
          rss: 120,
          heapTotal: 80,
        },
      });

      const trend = metricsHistory.custom.trendCPUUsage();

      assert.strictEqual(trend.slope, 10);
      assert.strictEqual(trend.yIntercept, 0);
      assert.strictEqual(trend.predict(), 30);

      assert.strictEqual(trendMock.mock.callCount(), 3);
    });
  });

  describe('custom statistics', () => {
    let passArgs;

    beforeEach(() => {
      passArgs = mock.fn((arg) => arg);
      metricsHistory.add(
        'trendCPUUsage',
        memo(
          pipe(
            metricsHistory.from('cpuUsage.percent'),
            passArgs,
            takeLast(5),
            medianNoiseReduction(),
            linearRegression(),
          ),
        ),
      );
    });

    afterEach(() => {
      passArgs = mock.fn((arg) => arg);
    });

    it('should return right value from custom statistic', () => {
      assert.strictEqual(metricsHistory.custom.trendCPUUsage().predict(), 35);
    });

    it('should calculate value only once', () => {
      assert.strictEqual(metricsHistory.custom.trendCPUUsage().predict(), 35);
      assert.strictEqual(metricsHistory.custom.trendCPUUsage().predict(), 35);
      assert.strictEqual(passArgs.mock.callCount(), 1);
    });

    it('should calculate value only once for same inputs', () => {
      assert.strictEqual(metricsHistory.custom.trendCPUUsage().predict(), 35);
      assert.strictEqual(metricsHistory.custom.trendCPUUsage().predict(), 35);
      assert.strictEqual(passArgs.mock.callCount(), 1);

      metricsHistory.next({
        cpuUsage: { user: 900, system: 400, percent: 10 },
        memoryUsage: {
          rss: 120,
          heapTotal: 80,
        },
      });

      assert.strictEqual(metricsHistory.custom.trendCPUUsage().predict(), 27.5);
      assert.strictEqual(metricsHistory.custom.trendCPUUsage().predict(), 27.5);
      assert.strictEqual(passArgs.mock.callCount(), 2);
    });
  });
});
