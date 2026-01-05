import { pipe } from '@esmj/observable';
import type { MetricsHistory } from './MetricsHistory.ts';
import type { Monitor } from './Monitor.ts';
import { getRequestsDurationsAvg } from './helpers.ts';
import {
  type Regression,
  avg,
  first,
  last,
  linearRegression,
  medianNoiseReduction,
  takeLast,
} from './math.ts';
import { memo } from './memo.ts';
import type {
  RequestMetric,
  RequestMetricRequestData,
} from './metric/RequestMetric.ts';

const CRITICAL_TO_FATAL_TIME_THRESHOLD = 5000;

export const SEVERITY_LEVEL = Object.freeze({
  NORMAL: 'normal',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
  FATAL: 'fatal',
});
export type SeverityLevel =
  (typeof SEVERITY_LEVEL)[keyof typeof SEVERITY_LEVEL];
export const SEVERITY_LEVEL_ORDER: SeverityLevel[] = [
  SEVERITY_LEVEL.NORMAL,
  SEVERITY_LEVEL.LOW,
  SEVERITY_LEVEL.MEDIUM,
  SEVERITY_LEVEL.HIGH,
  SEVERITY_LEVEL.CRITICAL,
  SEVERITY_LEVEL.FATAL,
];

const DEFAULT_OPTIONS = {
  threshold: {
    denialOfService: 10,
    distributedDenialOfService: 20,
    deadlock: 10,
    oldDataToFatalTime: 4000,
  },
  experimental: {
    evaluateMemoryUsage: false,
  },
};

export type SeverityOptions = {
  threshold?: {
    denialOfService?: number;
    distributedDenialOfService?: number;
    deadlock?: number;
    oldDataToFatalTime?: number;
  };
  experimental?: {
    evaluateMemoryUsage?: boolean;
  };
};

type SeverityRecord = {
  score: number;
  metric: string;
};

export type SeverityCalculation = {
  score: number;
  level: SeverityLevel;
  records: SeverityRecord[];
};

type RequestMetricFunction = (
  request: RequestMetricRequestData,
  shortRequest: RequestMetricRequestData,
) => void;

export class Severity {
  #metricsHistory: MetricsHistory = null;
  #monitor: Monitor = null;
  #shortMonitor: Monitor = null;
  #shortMetricsHistory: MetricsHistory = null;
  #requestMetric: RequestMetric = null;
  #shortRequestMetric: RequestMetric = null;
  #previousCalculation: SeverityCalculation = null;
  #currentCalculation: SeverityCalculation = null;
  #requestMetrics: RequestMetricFunction[] = [];
  #options: SeverityOptions = null;
  #criticalSince: number | null = null;

  constructor(
    monitor: Monitor,
    metricsHistory: MetricsHistory,
    shortMonitor: Monitor,
    shortMetricsHistory: MetricsHistory,
    requestMetric: RequestMetric,
    shortRequestMetric: RequestMetric,
    options: SeverityOptions = {},
  ) {
    this.#metricsHistory = metricsHistory;
    this.#monitor = monitor;
    this.#shortMonitor = shortMonitor;
    this.#shortMetricsHistory = shortMetricsHistory;
    this.#requestMetric = requestMetric;
    this.#shortRequestMetric = shortRequestMetric;
    this.#options = {
      ...DEFAULT_OPTIONS,
      ...options,
      threshold: {
        ...DEFAULT_OPTIONS.threshold,
        ...options?.threshold,
      },
      experimental: {
        ...DEFAULT_OPTIONS.experimental,
        ...options?.experimental,
      },
    };
  }

  init() {
    this.#initializeCustomMetrics();

    this.#requestMetrics = [
      (
        request: RequestMetricRequestData,
        shortRequest: RequestMetricRequestData,
      ) => {
        if (
          shortRequest.count.total > this.#options?.threshold?.denialOfService
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
      (
        request: RequestMetricRequestData,
        shortRequest: RequestMetricRequestData,
      ) => {
        if (
          shortRequest.count.total >
          this.#options?.threshold?.distributedDenialOfService
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
      (
        request: RequestMetricRequestData,
        shortRequest: RequestMetricRequestData,
      ) => {
        if (request.count.active > this.#options?.threshold?.deadlock) {
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

    if (this.#isFatalSeverity()) {
      this.#currentCalculation.level = SEVERITY_LEVEL.FATAL;
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
    const records: SeverityRecord[] = [];
    let score = 0;

    this.#evaluateInsufficientData(records);
    this.#evaluateUtilization(records);
    this.#evaluateEventLoopDelay(records);

    if (this.#options?.experimental?.evaluateMemoryUsage) {
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

    const level = this.#mapScoreToSeverityLevel(score);

    // If the severity reaches the critical level, mark its start
    if (level === SEVERITY_LEVEL.CRITICAL) {
      if (this.#criticalSince === null) {
        this.#criticalSince = Date.now();
      }
    } else {
      this.#criticalSince = null;
    }

    return {
      score,
      level,
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

  #evaluateInsufficientData(records: SeverityRecord[]) {
    if (this.#shortMetricsHistory.size < 50 || this.#metricsHistory.size < 5) {
      records.push({ score: 30, metric: 'insufficientMetricsHistory' });
    }

    return records;
  }

  #evaluateUtilization(records: SeverityRecord[]) {
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
        records.push({ score: 65, metric: 'veryHighUtilization' }); // 60
        return records;
      }

      if (averageUtilization >= 0.7) {
        records.push({ score: 50, metric: 'highUtilization' }); // 40
        return records;
      }

      if (averageUtilization >= 0.6) {
        records.push({ score: 35, metric: 'elevatedUtilization' }); // 30
        return records;
      }

      if (averageUtilization >= 0.5) {
        records.push({ score: 15, metric: 'moderateUtilization' }); // 20
        return records;
      }
    }

    return records;
  }

  #evaluateMemoryUsage(records: SeverityRecord[]) {
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

  #evaluateEventLoopDelay(records: SeverityRecord[]) {
    const averageEventLoopDelay =
      this.#metricsHistory.custom.getAverageEventLoopDelay();
    const currentEventLoopDelay =
      this.#metricsHistory.custom.getEventLoopDelay();

    const ratio =
      currentEventLoopDelay /
      (averageEventLoopDelay ? averageEventLoopDelay : 1);

    const weight = Math.min(this.#metricsHistory.size / 15, 1);

    if (ratio >= 2) {
      records.push({ score: 5 + 10 * weight, metric: 'eventLoopDelaySpike' });
      return records;
    }

    return records;
  }

  #isFatalSeverity() {
    const lastMetrics = this.#metricsHistory.current;
    const currentTimestamp = Date.now();

    // Check if the gathered metrics are old -> server doesn't respond -> fatal
    if (
      currentTimestamp - lastMetrics.timestamp >=
      this.#options.threshold.oldDataToFatalTime
    ) {
      return true;
    }

    // Check if there is the critical level for more than 'CRITICAL_TO_FATAL_TIME_THRESHOLD' seconds
    if (
      this.#criticalSince &&
      currentTimestamp - this.#criticalSince >= CRITICAL_TO_FATAL_TIME_THRESHOLD
    ) {
      const entriesToCheck = Math.round(
        CRITICAL_TO_FATAL_TIME_THRESHOLD / 1000,
      );

      // Also check if there is an increasing trend of active requests -> server is not getting better -> possible fatal
      const getRequestActiveCountsTrend = pipe(
        this.#metricsHistory.from('request.count.active'),
        takeLast(entriesToCheck),
        linearRegression(),
        (value) => value ?? { slope: 0, yIntercept: 0, predict: () => 0 },
      ) as () => Regression;

      // Also check if the requests durations average has increasing trend -> server is not getting better -> possible fatal
      const getRequestsDurationsTrend = pipe(
        this.#metricsHistory.from('request.duration'),
        takeLast<RequestMetricRequestData['duration']>(entriesToCheck),
        (durations) => durations.map(getRequestsDurationsAvg),
        linearRegression(),
        (value) => value ?? { slope: 0, yIntercept: 0, predict: () => 0 },
      ) as () => Regression;

      if (
        getRequestActiveCountsTrend().slope > 0 &&
        getRequestsDurationsTrend().slope > 0
      ) {
        return true;
      }
    }

    return false;
  }

  #mapScoreToSeverityLevel(
    score: number,
  ): (typeof SEVERITY_LEVEL)[keyof typeof SEVERITY_LEVEL] {
    if (score >= 80) return SEVERITY_LEVEL.CRITICAL;
    if (score >= 65) return SEVERITY_LEVEL.HIGH;
    if (score >= 50) return SEVERITY_LEVEL.MEDIUM;
    if (score >= 30) return SEVERITY_LEVEL.LOW;
    return SEVERITY_LEVEL.NORMAL;
  }
}
