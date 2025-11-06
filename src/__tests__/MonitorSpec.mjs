import { jest } from '@jest/globals';

import { toMockedInstance } from 'to-mock';

import { Monitor } from '../Monitor.ts';
import { Metric } from '../metric/Metric.ts';

jest.spyOn(global, 'setInterval').mockImplementation((method) => {
  method();

  return {
    unref: () => {},
  };
});

describe('Monitor', () => {
  let monitor;
  let metric;

  beforeEach(() => {
    monitor = new Monitor();
    metric = toMockedInstance(Metric, {
      measure() {
        return { custom: { metric1: 1 } };
      },
    });
  });

  it('should measure defined metric1', () => {
    const metric = toMockedInstance(Metric);
    monitor.add(metric);
    monitor.start();
    monitor.stop();

    expect(metric.start.mock.calls).toHaveLength(1);
    expect(metric.beforeMeasure.mock.calls).toHaveLength(1);
    expect(metric.measure.mock.calls).toHaveLength(1);
    expect(metric.afterMeasure.mock.calls).toHaveLength(1);
    expect(metric.stop.mock.calls).toHaveLength(1);
  });

  it('should notify defined observer with collected metrics', () => {
    monitor.add(metric);
    monitor.subscribe((metrics) => {
      expect(metrics).toMatchInlineSnapshot(`
        {
          "custom": {
            "metric1": 1,
          },
        }
      `);
    });
    monitor.start();
    monitor.stop();

    expect(metric.start.mock.calls).toHaveLength(1);
    expect(metric.beforeMeasure.mock.calls).toHaveLength(1);
    expect(metric.afterMeasure.mock.calls).toHaveLength(1);
    expect(metric.stop.mock.calls).toHaveLength(1);
  });
});
