import { PerformanceObserver } from 'node:perf_hooks';
import { Metric } from './Metric.mjs';

export class GCMetric extends Metric {
  #performanceObserver = null;
  #entry = null;

  start() {
    this.#performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      if (entries && entries[0]) {
        this.#entry = entries[0];
      }
      /* 
      The entry would be an instance of PerformanceEntry containing
      metrics of garbage collection.
      For example:
      PerformanceEntry {
        name: 'gc',
        entryType: 'gc',
        startTime: 2820.567669,
        duration: 1.315709,
        kind: 1
      }
      */
    });

    this.#performanceObserver.observe({ entryTypes: ['gc'] });
  }

  measure() {
    return {
      gc: {
        entry: this.#entry,
      },
    };
  }

  afterMeasure() {
    this.#entry = null;
  }

  stop() {
    this.#performanceObserver.disconnect();
  }
}
