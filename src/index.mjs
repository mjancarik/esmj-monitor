import { Monitor } from './Monitor.mjs';
import { Metric } from './metric/Metric.mjs';
import { CPUUsageMetric } from './metric/CPUUsageMetric.mjs';
import { EventLoopDelayMetric } from './metric/EventLoopDelayMetric.mjs';
import { EventLoopUtilizationMetric } from './metric/EventLoopUtilizationMetric.mjs';
import { LoadAverageMetric } from './metric/LoadAverageMetric.mjs';
import { MemoryUsageMetric } from './metric/MemoryUsageMetric.mjs';
import { GCMetric } from './metric/GCMetric.mjs';
import { ProcessMetric } from './metric/ProcessMetric.mjs';
import { MetricsHistory } from './MetricsHistory.mjs';
import {
  linearRegression,
  percentile,
  medianNoiseReduction,
  takeLast,
} from './math.mjs';
import { memo } from './memo.mjs';
import { pipe } from '@esmj/observable';

function createMonitoring(options) {
  const cpuUsageMetric = new CPUUsageMetric();
  const eventLoopDelayMetric = new EventLoopDelayMetric();
  const eventLoopUtilizationMetric = new EventLoopUtilizationMetric();
  const loadAverageMetric = new LoadAverageMetric();
  const memoryUsageMetric = new MemoryUsageMetric();
  const gcMetric = new GCMetric();
  const processMetric = new ProcessMetric();

  const monitor = new Monitor(options?.monitor);
  const metricsHistory = new MetricsHistory(options?.metricsHistory);

  monitor.subscribe(metricsHistory);

  monitor.add(cpuUsageMetric);
  monitor.add(eventLoopDelayMetric);
  monitor.add(eventLoopUtilizationMetric);
  monitor.add(loadAverageMetric);
  monitor.add(memoryUsageMetric);
  monitor.add(gcMetric);
  monitor.add(processMetric);

  return { monitor, metricsHistory };
}

export {
  pipe,
  memo,
  linearRegression,
  percentile,
  medianNoiseReduction,
  takeLast,
  createMonitoring,
  Monitor,
  MetricsHistory,
  Metric,
  CPUUsageMetric,
  EventLoopDelayMetric,
  EventLoopUtilizationMetric,
  LoadAverageMetric,
  MemoryUsageMetric,
  ProcessMetric,
  GCMetric,
};
