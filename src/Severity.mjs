import { pipe } from '@esmj/observable';
import { avg, first, last, medianNoiseReduction, takeLast } from './math.mjs';
import { memo } from './memo.mjs';

export const SEVERITY_LEVEL = {
  NORMAL: 'normal',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export class Severity {
  #metricsHistory = null;
  #monitor = null;
  #shortMonitor = null;
  #shortMetricsHistory = null;
  #requestMetric = null;
  #shortRequestMetric = null;
  #previousCalculation = null;
  #currentCalculation = null;
  #requestMetrics = [];
  #options = null;

  constructor(
    monitor,
    metricsHistory,
    shortMonitor,
    shortMetricsHistory,
    requestMetric,
    shortRequestMetric,
    options = {},
  ) {
    this.#metricsHistory = metricsHistory;
    this.#monitor = monitor;
    this.#shortMonitor = shortMonitor;
    this.#shortMetricsHistory = shortMetricsHistory;
    this.#requestMetric = requestMetric;
    this.#shortRequestMetric = shortRequestMetric;
    this.#options = options;
  }

  init() {
    this.#initializeCustomMetrics();

    this.#requestMetrics = [
      (request, shortRequest) => {
        if (
          shortRequest.count.total >
          (this.#options?.threshold?.denialOfService ?? 10)
        ) {
          this.#previousCalculation = {
            ...this.#currentCalculation,
            records: [...this.#currentCalculation.records],
          };
          this.#currentCalculation.score = Math.min(
            this.#currentCalculation.score + 75,
            100,
          );
          this.#currentCalculation.level = this.#mapScoreToSeverityLevel(
            this.#currentCalculation.score,
          );
          this.#currentCalculation.records.push({
            score: 80,
            metric: 'denialOfServiceDetected',
          });
        }
      },
      (request, shortRequest) => {
        if (
          shortRequest.count.total >
          (this.#options?.threshold?.distributedDenialOfService ?? 20)
        ) {
          this.#previousCalculation = {
            ...this.#currentCalculation,
            records: [...this.#currentCalculation.records],
          };
          this.#currentCalculation.score = 100;
          this.#currentCalculation.level = this.#mapScoreToSeverityLevel(
            this.#currentCalculation.score,
          );
          this.#currentCalculation.records.push({
            score: 100,
            metric: 'distributedDenialOfServiceDetected',
          });
        }
      },
      (request, shortRequest) => {
        if (request.count.active > (this.#options?.threshold?.deadlock ?? 10)) {
          this.#previousCalculation = {
            ...this.#currentCalculation,
            records: [...this.#currentCalculation.records],
          };
          this.#currentCalculation.score = Math.min(
            this.#currentCalculation.score + 75,
            100,
          );
          this.#currentCalculation.level = this.#mapScoreToSeverityLevel(
            this.#currentCalculation.score,
          );
          this.#currentCalculation.records.push({
            score: 80,
            metric: 'deadlockDetected',
          });
        }
      },
    ];

    this.#monitor.subscribe(() => {
      this.#previousCalculation = this.#currentCalculation;
      this.#currentCalculation = this.#calculateSeverity();
    });
  }

  getThreats() {
    if (!this.#currentCalculation) {
      this.#previousCalculation = this.#currentCalculation;
      this.#currentCalculation = this.#calculateSeverity();
    }

    if (this.#currentCalculation.score < 80) {
      const { request } = this.#requestMetric.measure();
      const { request: shortRequest } = this.#shortRequestMetric.measure();

      for (const metric of this.#requestMetrics) {
        if (this.#currentCalculation.score < 80) {
          metric(request, shortRequest);
        } else {
          break;
        }
      }
    }

    return this.#currentCalculation;
  }

  #calculateSeverity() {
    const records = [];
    let score = 0;

    this.#evaluateInsufficientData(records);
    this.#evaluateUtilization(records);
    this.#evaluateEventLoopDelay(records);

    if (this.#options?.experimental) {
      this.#evaluateMemoryUsage(records);
    }

    score = Math.min(
      records.reduce((acc, { score }) => acc + score, 0),
      100,
    );

    if (
      this.#previousCalculation &&
      score < this.#previousCalculation.score - 5
    ) {
      score = this.#previousCalculation.score - 5;
      records.push(...this.#previousCalculation.records);
      records.push({ score: -5, metric: 'decreasingSeverity' });

      if (records.length > 20) {
        records.splice(0, records.length - 20);
      }
    }

    return {
      score,
      level: this.#mapScoreToSeverityLevel(score),
      records,
    };
  }

  #initializeCustomMetrics() {
    this.#metricsHistory.add(
      'getCurrentUtilization',
      memo(
        pipe(
          this.#metricsHistory.from('eventLoopUtilization.utilization'),
          takeLast(5),
          medianNoiseReduction(),
          last(),
          (value) => value ?? 0,
        ),
      ),
    );
    this.#metricsHistory.add(
      'getAverageUtilization',
      memo(
        pipe(
          this.#metricsHistory.from('eventLoopUtilization.utilization'),
          takeLast(15),
          avg(),
          (value) => value ?? 0,
        ),
      ),
    );

    this.#metricsHistory.add(
      'getCurrentMemoryPercent',
      memo(
        pipe(
          this.#metricsHistory.from('memoryUsage.percent'),
          takeLast(1),
          last(),
          (value) => value ?? 0,
        ),
      ),
    );

    this.#metricsHistory.add(
      'getAverageMemoryPercent',
      memo(
        pipe(
          this.#metricsHistory.from('memoryUsage.percent'),
          takeLast(15),
          avg(),
          (value) => value ?? 0,
        ),
      ),
    );

    this.#metricsHistory.add(
      'getEventLoopDelay',
      memo(
        pipe(
          this.#metricsHistory.from('eventLoopDelay.percentile80'),
          takeLast(1),
          first(),
          (value) => value ?? 0,
        ),
      ),
    );

    this.#metricsHistory.add(
      'getAverageEventLoopDelay',
      memo(
        pipe(
          this.#metricsHistory.from('eventLoopDelay.percentile80'),
          takeLast(15),
          avg(),
          (value) => value ?? 0,
        ),
      ),
    );
  }

  #evaluateInsufficientData(records) {
    if (this.#shortMetricsHistory.size < 50 || this.#metricsHistory.size < 5) {
      records.push({ score: 25, metric: 'insufficientMetricsHistory' });
    }

    return records;
  }

  #evaluateUtilization(records) {
    const averageUtilization =
      this.#metricsHistory.custom.getAverageUtilization();
    const currentUtilization =
      this.#metricsHistory.custom.getCurrentUtilization();

    if (averageUtilization >= 0.3) {
      if (currentUtilization > averageUtilization * 2) {
        records.push({
          score: 20 + (currentUtilization / averageUtilization) * 5,
          metric: 'utilizationSpike',
        });
      }

      if (averageUtilization >= 0.9) {
        records.push({ score: 80, metric: 'criticalUtilization' }); // 80
        return records;
      }

      if (averageUtilization >= 0.8) {
        records.push({ score: 60, metric: 'veryHighUtilization' }); // 60
        return records;
      }

      if (averageUtilization >= 0.7) {
        records.push({ score: 35, metric: 'highUtilization' }); // 40
        return records;
      }

      if (averageUtilization >= 0.6) {
        records.push({ score: 25, metric: 'elevatedUtilization' }); // 30
        return records;
      }

      if (averageUtilization >= 0.5) {
        records.push({ score: 15, metric: 'moderateUtilization' }); // 20
        return records;
      }
    }

    return records;
  }

  #evaluateMemoryUsage(records) {
    const currentMemoryPercent =
      this.#metricsHistory.custom.getCurrentMemoryPercent();
    const averageMemoryPercent =
      this.#metricsHistory.custom.getAverageMemoryPercent();

    // NO DETECT SMALL MEMORY LEAK
    if (currentMemoryPercent * 1.5 >= averageMemoryPercent) {
      if (currentMemoryPercent >= 90) {
        records.push({ score: 65, metric: 'criticalMemoryUsage' });
        return records;
      }

      if (currentMemoryPercent >= 80) {
        records.push({ score: 50, metric: 'highMemoryUsage' });
        return records;
      }

      if (currentMemoryPercent >= 70) {
        records.push({ score: 40, metric: 'elevatedMemoryUsage' });
        return records;
      }

      if (currentMemoryPercent >= 60) {
        records.push({ score: 25, metric: 'moderateMemoryUsage' });
        return records;
      }
    }

    return records;
  }

  #evaluateEventLoopDelay(records) {
    const averageEventLoopDelay =
      this.#metricsHistory.custom.getAverageEventLoopDelay();

    const currentEventLoopDelay =
      this.#metricsHistory.custom.getEventLoopDelay();

    const ratio = currentEventLoopDelay / averageEventLoopDelay;

    if (ratio >= 2.5) {
      records.push({ score: 80, metric: 'criticalEventLoopDelay' }); // TODO is necesery to have the 80 score (critical level) ??
      return records;
    }

    if (ratio >= 2) {
      records.push({ score: 65, metric: 'veryHighEventLoopDelay' });
      return records;
    }

    if (ratio >= 1.8) {
      records.push({ score: 40, metric: 'highEventLoopDelay' }); // TODO will trigger SPA with 0.6 cpu, testing
      return records;
    }

    if (ratio >= 1.5) {
      records.push({ score: 15, metric: 'elevatedEventLoopDelay' }); // TODO wil trigger SPA with 0.8 cpu
      return records;
    }

    return records;
  }

  #mapScoreToSeverityLevel(score) {
    if (score >= 80) return SEVERITY_LEVEL.CRITICAL;
    if (score >= 65) return SEVERITY_LEVEL.HIGH;
    if (score >= 50) return SEVERITY_LEVEL.MEDIUM;
    if (score >= 25) return SEVERITY_LEVEL.LOW;
    return SEVERITY_LEVEL.NORMAL;
  }
}
