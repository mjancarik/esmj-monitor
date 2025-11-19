import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

import { Monitor } from '../Monitor.ts';

mock.method(global, 'setInterval', (fn) => {
  fn();
  return { unref() {} };
});

describe('Monitor', () => {
  let monitor;
  let metric;

  beforeEach(() => {
    monitor = new Monitor();
    metric = {
      start: mock.fn(),
      beforeMeasure: mock.fn(),
      measure: mock.fn(() => ({ custom: { metric1: 1 } })),
      afterMeasure: mock.fn(),
      stop: mock.fn(),
    };
  });

  it('should measure defined metric1', () => {
    monitor.add(metric);
    monitor.start();
    monitor.stop();

    assert.strictEqual(metric.start.mock.callCount(), 1);
    assert.strictEqual(metric.beforeMeasure.mock.callCount(), 1);
    assert.strictEqual(metric.measure.mock.callCount(), 1);
    assert.strictEqual(metric.afterMeasure.mock.callCount(), 1);
    assert.strictEqual(metric.stop.mock.callCount(), 1);
  });

  it('should notify defined observer with collected metrics', () => {
    let receivedMetrics;

    monitor.add(metric);
    monitor.subscribe((metrics) => {
      receivedMetrics = metrics;
    });
    monitor.start();
    monitor.stop();

    assert.deepEqual(receivedMetrics, {
      custom: { metric1: 1 },
    });

    assert.strictEqual(metric.start.mock.callCount(), 1);
    assert.strictEqual(metric.beforeMeasure.mock.callCount(), 1);
    assert.strictEqual(metric.afterMeasure.mock.callCount(), 1);
    assert.strictEqual(metric.stop.mock.callCount(), 1);
  });
});
