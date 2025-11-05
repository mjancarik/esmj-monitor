import { jest } from '@jest/globals';
import { toMockedInstance } from 'to-mock';
import { MetricsHistory } from '../MetricsHistory.mjs';
import { Monitor } from '../Monitor.mjs';
import { SEVERITY_LEVEL, Severity } from '../Severity.mjs';
import { RequestMetric } from '../index.mjs';

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

    metricsHistory.custom.getCurrentUtilization = jest
      .fn()
      .mockReturnValue(0.2);
    metricsHistory.custom.getAverageUtilization = jest
      .fn()
      .mockReturnValue(0.2);
    metricsHistory.custom.getCurrentMemoryPercent = jest
      .fn()
      .mockReturnValue(50);
    metricsHistory.custom.getAverageMemoryPercent = jest
      .fn()
      .mockReturnValue(50);
    metricsHistory.custom.getEventLoopDelay = jest.fn().mockReturnValue(10);
    metricsHistory.custom.getAverageEventLoopDelay = jest
      .fn()
      .mockReturnValue(10);
  });

  describe('initialization', () => {
    it('should initialize custom metrics', () => {
      expect(metricsHistory.custom.getCurrentUtilization).toBeDefined();
      expect(metricsHistory.custom.getAverageUtilization).toBeDefined();
      expect(metricsHistory.custom.getCurrentMemoryPercent).toBeDefined();
      expect(metricsHistory.custom.getAverageMemoryPercent).toBeDefined();
      expect(metricsHistory.custom.getEventLoopDelay).toBeDefined();
      expect(metricsHistory.custom.getAverageEventLoopDelay).toBeDefined();
    });

    it('should subscribe to monitor updates', () => {
      const initialCalculation = severity.getThreats();
      metricsHistory.custom.getAverageUtilization = jest
        .fn()
        .mockReturnValue(0.7);

      monitor.next();

      const newCalculation = severity.getThreats();

      expect(newCalculation).not.toBe(initialCalculation);
      expect(newCalculation.score).toBeGreaterThan(initialCalculation.score);
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

      expect(threats.level).toBe(SEVERITY_LEVEL.LOW);
      expect(threats.score).toBe(30);
      expect(threats.records).toHaveLength(1);
      expect(threats.records[0].metric).toBe('insufficientMetricsHistory');
    });

    it('should detect very high utilization', () => {
      metricsHistory.custom.getAverageUtilization = jest
        .fn()
        .mockReturnValue(0.8);
      metricsHistory.custom.getCurrentUtilization = jest
        .fn()
        .mockReturnValue(0.8);

      const threats = severity.getThreats();

      expect(threats.level).toBe(SEVERITY_LEVEL.HIGH);
      expect(threats.score).toBe(65);
      expect(threats.records).toHaveLength(1);
      expect(threats.records).toContainEqual(
        expect.objectContaining({ metric: 'veryHighUtilization' }),
      );
    });

    it('should detect utilization spike', () => {
      metricsHistory.custom.getAverageUtilization = jest
        .fn()
        .mockReturnValue(0.3);
      metricsHistory.custom.getCurrentUtilization = jest
        .fn()
        .mockReturnValue(0.7);

      const threats = severity.getThreats();

      expect(threats.records).toContainEqual(
        expect.objectContaining({ metric: 'utilizationSpike' }),
      );
    });

    it('should detect DoS attack', () => {
      shortRequestMetric.setRequest({ count: { total: 15, active: 5 } });

      const threats = severity.getThreats();

      expect(threats.level).toBe(SEVERITY_LEVEL.HIGH);
      expect(threats.score).toBeGreaterThanOrEqual(75);
      expect(threats.records).toContainEqual(
        expect.objectContaining({ metric: 'denialOfServiceDetected' }),
      );
    });

    it('should detect DDoS attack', () => {
      shortRequestMetric.setRequest({ count: { total: 25, active: 5 } });

      const threats = severity.getThreats();

      expect(threats.level).toBe(SEVERITY_LEVEL.CRITICAL);
      expect(threats.score).toBe(100);
      expect(threats.records).toContainEqual(
        expect.objectContaining({
          metric: 'distributedDenialOfServiceDetected',
        }),
      );
    });

    it('should detect request deadlock', () => {
      requestMetric.setRequest({ count: { total: 5, active: 15 } });

      const threats = severity.getThreats();

      expect(threats.level).toBe(SEVERITY_LEVEL.HIGH);
      expect(threats.score).toBeGreaterThanOrEqual(75);
      expect(threats.records).toContainEqual(
        expect.objectContaining({ metric: 'deadlockDetected' }),
      );
    });

    it('should detect event loop delay spikes', () => {
      metricsHistory.custom.getAverageEventLoopDelay = jest
        .fn()
        .mockReturnValue(20);
      metricsHistory.custom.getEventLoopDelay = jest.fn().mockReturnValue(40);

      const threats = severity.getThreats();

      expect(threats.level).toBe(SEVERITY_LEVEL.NORMAL);
      expect(threats.score).toBeGreaterThanOrEqual(15);
      expect(threats.records).toContainEqual(
        expect.objectContaining({ metric: 'eventLoopDelaySpike' }),
      );
    });

    it('should prevent rapid drops in severity', () => {
      metricsHistory.custom.getAverageUtilization = jest
        .fn()
        .mockReturnValue(0.9);
      const highThreats = severity.getThreats();
      expect(highThreats.level).toBe(SEVERITY_LEVEL.CRITICAL);

      metricsHistory.custom.getAverageUtilization = jest
        .fn()
        .mockReturnValue(0.2);
      monitor.next();

      const newThreats = severity.getThreats();

      expect(newThreats.score).toBe(highThreats.score - 5);
      expect(newThreats.records).toContainEqual(
        expect.objectContaining({ metric: 'decreasingSeverity' }),
      );
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

      expect(threats.level).toBe(SEVERITY_LEVEL.HIGH);
      expect(threats.records).toContainEqual(
        expect.objectContaining({ metric: 'denialOfServiceDetected' }),
      );
    });
  });

  describe('severity level mapping', () => {
    it('should map scores to correct severity levels', () => {
      metricsHistory.custom.getAverageUtilization = jest
        .fn()
        .mockReturnValue(0.5);
      let threats = severity.getThreats();
      expect(threats.score).toBe(15);
      expect(threats.level).toBe(SEVERITY_LEVEL.NORMAL);

      metricsHistory.custom.getAverageUtilization = jest
        .fn()
        .mockReturnValue(0.6);
      threats = severity.getThreats();
      expect(threats.score).toBe(15);
      expect(threats.level).toBe(SEVERITY_LEVEL.NORMAL);

      metricsHistory.custom.getAverageUtilization = jest
        .fn()
        .mockReturnValue(0.7);
      threats = severity.getThreats();
      expect(threats.score).toBe(15);
      expect(threats.level).toBe(SEVERITY_LEVEL.NORMAL);

      metricsHistory.custom.getAverageUtilization = jest
        .fn()
        .mockReturnValue(0.8);
      threats = severity.getThreats();
      expect(threats.score).toBe(15);
      expect(threats.level).toBe(SEVERITY_LEVEL.NORMAL);

      metricsHistory.custom.getAverageUtilization = jest
        .fn()
        .mockReturnValue(0.9);
      threats = severity.getThreats();
      expect(threats.score).toBe(15);
      expect(threats.level).toBe(SEVERITY_LEVEL.NORMAL);
    });
  });
});
