import { Monitor } from './Monitor.mjs';
import { Metric } from './metric/Metric.mjs';
import { CPUUsageMetric } from './metric/CPUUsageMetric.mjs';
import { EventLoopDelayMetric } from './metric/EventLoopDelayMetric.mjs';
import { EventLoopUtilizationMetric } from './metric/EventLoopUtilizationMetric.mjs';
import { LoadAverageMetric } from './metric/LoadAverageMetric.mjs';
import { MemoryUsageMetric } from './metric/MemoryUsageMetric.mjs';
import { GCMetric } from './metric/GCMetric.mjs';

function createMonitor(options) {
  const cpuUsageMetric = new CPUUsageMetric();
  const eventLoopDelayMetric = new EventLoopDelayMetric();
  const eventLoopUtilizationMetric = new EventLoopUtilizationMetric();
  const loadAverageMetric = new LoadAverageMetric();
  const memoryUsageMetric = new MemoryUsageMetric();
  const gcMetric = new GCMetric();

  const monitor = new Monitor(options);

  monitor.add(cpuUsageMetric);
  monitor.add(eventLoopDelayMetric);
  monitor.add(eventLoopUtilizationMetric);
  monitor.add(loadAverageMetric);
  monitor.add(memoryUsageMetric);
  monitor.add(gcMetric);

  return { monitor };
}

export {
  createMonitor,
  Monitor,
  Metric,
  CPUUsageMetric,
  EventLoopDelayMetric,
  EventLoopUtilizationMetric,
  LoadAverageMetric,
  MemoryUsageMetric,
};
