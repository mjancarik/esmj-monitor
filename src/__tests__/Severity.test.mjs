import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { toMockedInstance } from 'to-mock';
import { MetricsHistory } from '../MetricsHistory.ts';
import { Monitor } from '../Monitor.ts';
import { SEVERITY_LEVEL, Severity } from '../Severity.ts';
import { RequestMetric } from '../index.ts';

describe('Severity', () => {
  let severity;
  let monitor;
  let metricsHistory;
  let shortMonitor;
  let shortMetricsHistory;
  let requestMetric;
  let shortRequestMetric;

  beforeEach(() => {
    monitor = new Monitor();
    metricsHistory = new MetricsHistory();

    shortMonitor = new Monitor({ interval: 10 });
    shortMetricsHistory = new MetricsHistory({ limit: 100 });

    for (let i = 0; i < 100; i++) {
      shortMetricsHistory.next();
      metricsHistory.next();
    }

    requestMetric = toMockedInstance(RequestMetric, {
      measure() {
        return { request: this._request || { count: { total: 0, active: 0 } } };
      },
      setRequest(request) {
        this._request = request;
      },
      _request: { count: { total: 0, active: 0 } },
    });

    shortRequestMetric = toMockedInstance(RequestMetric, {
      measure() {
        return { request: this._request || { count: { total: 0, active: 0 } } };
      },
      setRequest(request) {
        this._request = request;
      },
      _request: { count: { total: 0, active: 0 } },
    });

    monitor.add(requestMetric);
    monitor.subscribe(metricsHistory);

    shortMonitor.add(shortRequestMetric);
    shortMonitor.subscribe(shortMetricsHistory);

    severity = new Severity(
      monitor,
      metricsHistory,
      shortMonitor,
      shortMetricsHistory,
      requestMetric,
      shortRequestMetric,
    );
    severity.init();

    metricsHistory.custom.getCurrentUtilization = () => 0.2;
    metricsHistory.custom.getAverageUtilization = () => 0.2;
    metricsHistory.custom.getCurrentMemoryPercent = () => 50;
    metricsHistory.custom.getAverageMemoryPercent = () => 50;
    metricsHistory.custom.getEventLoopDelay = () => 10;
    metricsHistory.custom.getAverageEventLoopDelay = () => 10;
  });

  describe('initialization', () => {
    it('should initialize custom metrics', () => {
      assert(metricsHistory.custom.getCurrentUtilization);
      assert(metricsHistory.custom.getAverageUtilization);
      assert(metricsHistory.custom.getCurrentMemoryPercent);
      assert(metricsHistory.custom.getAverageMemoryPercent);
      assert(metricsHistory.custom.getEventLoopDelay);
      assert(metricsHistory.custom.getAverageEventLoopDelay);
    });

    it('should subscribe to monitor updates', () => {
      const initialCalculation = severity.getThreats();
      metricsHistory.custom.getAverageUtilization = () => 0.7;

      monitor.next();

      const newCalculation = severity.getThreats();

      assert.notStrictEqual(newCalculation, initialCalculation);
      assert(newCalculation.score > initialCalculation.score);
    });
  });

  describe('getThreats', () => {
    it('should detect insufficient metrics history', () => {
      shortMetricsHistory = new MetricsHistory({ limit: 100 });

      severity = new Severity(
        monitor,
        metricsHistory,
        shortMonitor,
        shortMetricsHistory,
        requestMetric,
        shortRequestMetric,
      );

      const threats = severity.getThreats();

      assert.strictEqual(threats.level, SEVERITY_LEVEL.LOW);
      assert.strictEqual(threats.score, 30);
      assert.strictEqual(threats.records.length, 1);
      assert.strictEqual(
        threats.records[0].metric,
        'insufficientMetricsHistory',
      );
    });

    it('should detect very high utilization', () => {
      metricsHistory.custom.getAverageUtilization = () => 0.8;
      metricsHistory.custom.getCurrentUtilization = () => 0.8;

      const threats = severity.getThreats();

      assert.strictEqual(threats.level, SEVERITY_LEVEL.HIGH);
      assert.strictEqual(threats.score, 65);
      assert.strictEqual(threats.records.length, 1);
      assert.strictEqual(threats.records[0].metric, 'veryHighUtilization');
    });

    it('should detect utilization spike', () => {
      metricsHistory.custom.getAverageUtilization = () => 0.3;
      metricsHistory.custom.getCurrentUtilization = () => 0.7;

      const threats = severity.getThreats();

      assert.strictEqual(threats.records[0].metric, 'utilizationSpike');
    });

    it('should detect DoS attack', () => {
      shortRequestMetric.setRequest({ count: { total: 15, active: 5 } });

      const threats = severity.getThreats();

      assert.strictEqual(threats.level, SEVERITY_LEVEL.HIGH);
      assert(threats.score >= 75);
      assert(
        threats.records.some((r) => r.metric === 'denialOfServiceDetected'),
      );
    });

    it('should detect DDoS attack', () => {
      shortRequestMetric.setRequest({ count: { total: 25, active: 5 } });

      const threats = severity.getThreats();

      assert.strictEqual(threats.level, SEVERITY_LEVEL.CRITICAL);
      assert.strictEqual(threats.score, 100);
      assert(
        threats.records.some(
          (r) => r.metric === 'distributedDenialOfServiceDetected',
        ),
      );
    });

    it('should detect request deadlock', () => {
      requestMetric.setRequest({ count: { total: 5, active: 15 } });

      const threats = severity.getThreats();

      assert.strictEqual(threats.level, SEVERITY_LEVEL.HIGH);
      assert(threats.score >= 75);
      assert(threats.records.some((r) => r.metric === 'deadlockDetected'));
    });

    it('should detect event loop delay spikes', () => {
      metricsHistory.custom.getAverageEventLoopDelay = () => 20;
      metricsHistory.custom.getEventLoopDelay = () => 40;

      const threats = severity.getThreats();

      assert.strictEqual(threats.level, SEVERITY_LEVEL.NORMAL);
      assert(threats.score >= 15);
      assert(threats.records.some((r) => r.metric === 'eventLoopDelaySpike'));
    });

    it('should prevent rapid drops in severity', () => {
      metricsHistory.custom.getAverageUtilization = () => 0.9;
      const highThreats = severity.getThreats();
      assert.strictEqual(highThreats.level, SEVERITY_LEVEL.CRITICAL);

      metricsHistory.custom.getAverageUtilization = () => 0.2;
      monitor.next();

      const newThreats = severity.getThreats();

      assert.strictEqual(newThreats.score, highThreats.score - 5);
      assert(newThreats.records.some((r) => r.metric === 'decreasingSeverity'));
    });

    it('should handle custom thresholds', () => {
      metricsHistory = new MetricsHistory();
      shortMetricsHistory = new MetricsHistory({ limit: 100 });

      for (let i = 0; i < 100; i++) {
        shortMetricsHistory.next();
        metricsHistory.next();
      }

      severity = new Severity(
        monitor,
        metricsHistory,
        shortMonitor,
        shortMetricsHistory,
        requestMetric,
        shortRequestMetric,
        {
          threshold: {
            denialOfService: 5,
            distributedDenialOfService: 10,
            deadlock: 5,
          },
        },
      );
      severity.init();

      shortRequestMetric.setRequest({ count: { total: 6, active: 2 } }); // Above custom threshold of 5

      const threats = severity.getThreats();

      assert.strictEqual(threats.level, SEVERITY_LEVEL.HIGH);
      assert(
        threats.records.some((r) => r.metric === 'denialOfServiceDetected'),
      );
    });

    it('should detect stale metrics older than 4 seconds and return FATAL', () => {
      metricsHistory = new MetricsHistory();
      shortMetricsHistory = new MetricsHistory({ limit: 100 });

      for (let i = 0; i < 100; i++) {
        shortMetricsHistory.next();
        metricsHistory.next();
      }

      const last = metricsHistory.currentWithTimestamp;
      last.timestamp = last.timestamp - 4000;

      severity = new Severity(
        monitor,
        metricsHistory,
        shortMonitor,
        shortMetricsHistory,
        requestMetric,
        shortRequestMetric,
      );
      severity.init();

      const threats = severity.getThreats();

      assert.strictEqual(threats.level, SEVERITY_LEVEL.FATAL);
    });

    it('should detect CRITICAL persisting for 15 seconds and escalate to FATAL', () => {
      metricsHistory.custom.getAverageUtilization = () => 0.95;

      const originalNow = Date.now;
      let fakeNow = originalNow();

      global.Date.now = () => fakeNow;

      for (let i = 0; i < 15; i++) {
        fakeNow += 1000;
        shortMetricsHistory.next();
        metricsHistory.next();
        const y = severity.getThreats();
      }

      fakeNow += 1000;
      const threats = severity.getThreats();

      global.Date.now = originalNow;

      assert.strictEqual(threats.level, SEVERITY_LEVEL.FATAL);
    });
  });

  describe('severity level mapping', () => {
    it('should map scores to correct severity levels', () => {
      metricsHistory.custom.getAverageUtilization = () => 0.5;
      let threats = severity.getThreats();
      assert.strictEqual(threats.score, 15);
      assert.strictEqual(threats.level, SEVERITY_LEVEL.NORMAL);

      metricsHistory.custom.getAverageUtilization = () => 0.6;
      threats = severity.getThreats();
      assert.strictEqual(threats.score, 15);
      assert.strictEqual(threats.level, SEVERITY_LEVEL.NORMAL);

      metricsHistory.custom.getAverageUtilization = () => 0.7;
      threats = severity.getThreats();
      assert.strictEqual(threats.score, 15);
      assert.strictEqual(threats.level, SEVERITY_LEVEL.NORMAL);

      metricsHistory.custom.getAverageUtilization = () => 0.8;
      threats = severity.getThreats();
      assert.strictEqual(threats.score, 15);
      assert.strictEqual(threats.level, SEVERITY_LEVEL.NORMAL);

      metricsHistory.custom.getAverageUtilization = () => 0.9;
      threats = severity.getThreats();
      assert.strictEqual(threats.score, 15);
      assert.strictEqual(threats.level, SEVERITY_LEVEL.NORMAL);
    });
  });
});
