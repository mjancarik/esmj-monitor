import { pipe } from '@esmj/observable';
import { MetricsHistory } from './MetricsHistory.mjs';
import { Monitor } from './Monitor.mjs';
import { SEVERITY_LEVEL, Severity } from './Severity.mjs';
import {
  avg,
  first,
  last,
  linearRegression,
  medianNoiseReduction,
  percentile,
  sum,
  takeLast,
} from './math.mjs';
import { memo } from './memo.mjs';
import { CPUUsageMetric } from './metric/CPUUsageMetric.mjs';
import { EventLoopDelayMetric } from './metric/EventLoopDelayMetric.mjs';
import { EventLoopUtilizationMetric } from './metric/EventLoopUtilizationMetric.mjs';
import { GCMetric } from './metric/GCMetric.mjs';
import { LoadAverageMetric } from './metric/LoadAverageMetric.mjs';
import { MemoryUsageMetric } from './metric/MemoryUsageMetric.mjs';
import { Metric } from './metric/Metric.mjs';
import { ProcessMetric } from './metric/ProcessMetric.mjs';
import { RequestMetric } from './metric/RequestMetric.mjs';

function createMonitoring(options) {
  const cpuUsageMetric = new CPUUsageMetric();
  const eventLoopDelayMetric = new EventLoopDelayMetric();
  const eventLoopUtilizationMetric = new EventLoopUtilizationMetric();
  const loadAverageMetric = new LoadAverageMetric();
  const memoryUsageMetric = new MemoryUsageMetric();
  const gcMetric = new GCMetric();
  const processMetric = new ProcessMetric();
  const requestMetric = new RequestMetric();

  const shortEventLoopUtilizationMetric = new EventLoopUtilizationMetric();
  const shortMemoryUsageMetric = new MemoryUsageMetric();
  const shortRequestMetric = new RequestMetric();

  const monitor = new Monitor(options?.monitor);
  const metricsHistory = new MetricsHistory(options?.metricsHistory);

  const shortMonitor = new Monitor(options?.shortMonitor ?? { interval: 10 });
  const shortMetricsHistory = new MetricsHistory(
    options?.shortMetricsHistory ?? { limit: 100 },
  );
  const severity = new Severity(
    monitor,
    metricsHistory,
    shortMonitor,
    shortMetricsHistory,
    requestMetric,
    shortRequestMetric,
    options?.severity,
  );
  severity.init();

  monitor.subscribe(metricsHistory);
  shortMonitor.subscribe(shortMetricsHistory);
  shortMonitor.subscribe(shortMetricsHistory);

  monitor.add(cpuUsageMetric);
  monitor.add(eventLoopDelayMetric);
  monitor.add(eventLoopUtilizationMetric);
  monitor.add(loadAverageMetric);
  monitor.add(memoryUsageMetric);
  monitor.add(gcMetric);
  monitor.add(processMetric);
  monitor.add(requestMetric);

  shortMonitor.add(shortEventLoopUtilizationMetric);
  shortMonitor.add(shortMemoryUsageMetric);
  shortMonitor.add(shortRequestMetric);

  return {
    monitor,
    metricsHistory,
    shortMonitor,
    shortMetricsHistory,
    severity,
    start() {
      monitor.start();
      shortMonitor.start();
    },
    stop() {
      monitor.stop();
      shortMonitor.stop();
    },
  };
}

export {
  pipe,
  memo,
  linearRegression,
  percentile,
  medianNoiseReduction,
  takeLast,
  first,
  last,
  avg,
  sum,
  createMonitoring,
  Monitor,
  MetricsHistory,
  Severity,
  SEVERITY_LEVEL,
  Metric,
  CPUUsageMetric,
  EventLoopDelayMetric,
  EventLoopUtilizationMetric,
  LoadAverageMetric,
  MemoryUsageMetric,
  ProcessMetric,
  GCMetric,
  RequestMetric,
};
