import { MetricsHistory } from '../MetricsHistory.mjs';

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
    const percentile100 = metricsHistory.percentile('cpuUsage.percent', 100);
    const percentile80 = metricsHistory.percentile('cpuUsage.percent', 80);
    const percentile75 = metricsHistory.percentile('cpuUsage.percent', 75);
    const median = metricsHistory.percentile('cpuUsage.percent', 50);
    const percentile25 = metricsHistory.percentile('cpuUsage.percent', 25);
    const percentile20 = metricsHistory.percentile('cpuUsage.percent', 20);
    const percentile0 = metricsHistory.percentile('cpuUsage.percent', 0);

    expect(percentile100).toMatchInlineSnapshot(`45`);
    expect(percentile80).toMatchInlineSnapshot(`39.00000000000001`);
    expect(percentile75).toMatchInlineSnapshot(`33.75`);
    expect(median).toMatchInlineSnapshot(`15`);
    expect(percentile25).toMatchInlineSnapshot(`4`);
    expect(percentile20).toMatchInlineSnapshot(`2.6000000000000005`);
    expect(percentile0).toMatchInlineSnapshot(`1`);
    expect(metricsHistory.size).toEqual(6);
  });

  describe('trend method', () => {
    it('should return linear regression trend for empty metrics history', () => {
      metricsHistory = new MetricsHistory();
      const trend = metricsHistory.trend('cpuUsage.percent', 5);

      expect(trend.slope).toMatchInlineSnapshot(`0`);
      expect(trend.yIntercept).toMatchInlineSnapshot(`0`);
      expect(trend.predict()).toMatchInlineSnapshot(`0`);
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
      const trend = metricsHistory.trend('cpuUsage.percent', 5);

      expect(trend.slope).toMatchInlineSnapshot(`0`);
      expect(trend.yIntercept).toMatchInlineSnapshot(`0`);
      expect(trend.predict()).toMatchInlineSnapshot(`0`);
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

      const trend = metricsHistory.trend('cpuUsage.percent', 5);

      expect(trend.slope).toMatchInlineSnapshot(`10`);
      expect(trend.yIntercept).toMatchInlineSnapshot(`0`);
      expect(trend.predict()).toMatchInlineSnapshot(`30`);
    });

    it('should return linear regression trend for defined metric', () => {
      const trend = metricsHistory.trend('cpuUsage.percent', 5);

      expect(trend.slope).toMatchInlineSnapshot(`6.5`);
      expect(trend.yIntercept).toMatchInlineSnapshot(`2.5`);
      expect(trend.predict()).toMatchInlineSnapshot(`41.5`);
    });
  });
});
