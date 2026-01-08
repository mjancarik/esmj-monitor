import { pipe } from '@esmj/observable';
import {
  type CustomMetrics,
  type MetricsFunction,
  MetricsHistory,
  type MetricsHistoryEntry,
  type MetricsHistoryOptions,
} from './MetricsHistory.ts';
import { Monitor } from './Monitor.ts';
import {
  SEVERITY_LEVEL,
  Severity,
  type SeverityCalculation,
  type SeverityLevel,
  type SeverityOptions,
} from './Severity.ts';
import { isSeverityLevelAtLeast } from './helpers.ts';
import {
  avg,
  first,
  last,
  linearRegression,
  medianNoiseReduction,
  percentile,
  sum,
  takeLast,
} from './math.ts';
import { type MemoizedFunction, memo } from './memo.ts';
import { CPUUsageMetric } from './metric/CPUUsageMetric.ts';
import { EventLoopDelayMetric } from './metric/EventLoopDelayMetric.ts';
import { EventLoopUtilizationMetric } from './metric/EventLoopUtilizationMetric.ts';
import { GCMetric } from './metric/GCMetric.ts';
import { LoadAverageMetric } from './metric/LoadAverageMetric.ts';
import { MemoryUsageMetric } from './metric/MemoryUsageMetric.ts';
import { Metric, type MonitorOptions } from './metric/Metric.ts';
import { ProcessMetric } from './metric/ProcessMetric.ts';
import { RequestMetric } from './metric/RequestMetric.ts';

type MonitoringOptions = {
  monitor: MonitorOptions;
  metricsHistory: MetricsHistoryOptions;
  shortMonitor: MonitorOptions;
  shortMetricsHistory: MetricsHistoryOptions;
  severity: SeverityOptions;
};

function createMonitoring(options: MonitoringOptions) {
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
  type MetricsHistoryEntry,
  type CustomMetrics,
  type MetricsFunction,
  type MemoizedFunction,
  Severity,
  SEVERITY_LEVEL,
  type SeverityLevel,
  type SeverityCalculation,
  isSeverityLevelAtLeast,
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
