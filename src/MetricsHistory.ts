import { Observer } from '@esmj/observable';
import {
  type LinearRegressionInput,
  type Regression,
  linearRegression,
  percentile,
} from './math.ts';
import { IS_MEMO, type MemoizedFunction, memo } from './memo.ts';
import type { RequestMetricRequestData } from './metric/RequestMetric.ts';

export type MetricsHistoryOptions = {
  limit?: number;
};

export type MetricsFunction<T = unknown> = (...args: unknown[]) => T;

export interface MetricsHistoryEntry {
  timestamp: number;
  cpuUsage?: {
    user: number;
    system: number;
    percent: number;
  };
  memoryUsage?: {
    percent: number;
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  eventLoopDelay?: {
    min: number;
    max: number;
    mean: number;
    stddev: number;
    percentile80: number;
  };
  eventLoopUtilization?: { idle: number; active: number; utilization: number };
  gc?: { entry: PerformanceEntry };
  loadAverage?: {
    minute1: number;
    minute5: number;
    minute15: number;
  };
  process?: {
    pid: number;
    ppid: number;
    platform: NodeJS.Platform;
    uptime: number;
    version: string;
  };
  request?: RequestMetricRequestData;
}

export interface CustomMetrics {
  getCurrentUtilization?: MemoizedFunction<MetricsFunction<number>>;
  getAverageUtilization?: MemoizedFunction<MetricsFunction<number>>;
  getCurrentMemoryPercent?: MemoizedFunction<MetricsFunction<number>>;
  getAverageMemoryPercent?: MemoizedFunction<MetricsFunction<number>>;
  getEventLoopDelay?: MemoizedFunction<MetricsFunction<number>>;
  getAverageEventLoopDelay?: MemoizedFunction<MetricsFunction<number>>;
  getRequestsActiveCountsTrend?: MemoizedFunction<MetricsFunction<Regression>>;
  getRequestsDurationsTrend?: MemoizedFunction<MetricsFunction<Regression>>;
  [key: string]: MemoizedFunction<MetricsFunction>;
}

export class MetricsHistory extends Observer {
  #options: MetricsHistoryOptions = { limit: 60 };
  #history: MetricsHistoryEntry[] = [];
  #regression: (array: LinearRegressionInput[]) => Regression = null;
  custom: CustomMetrics = {};

  // TODO deprecated, remove in next major version
  percentileMemo: MemoizedFunction<
    (key: keyof MetricsHistoryEntry, number: number) => number
  >;
  trendMemo: MemoizedFunction<
    (key: keyof MetricsHistoryEntry, limit: number) => Regression
  >;

  constructor(options?: MetricsHistoryOptions) {
    super();
    this.#options = { ...this.#options, ...options };

    this.#regression = linearRegression();

    // TODO deprecated, remove in next major version
    this.percentileMemo = memo((...rest) => this.percentile(...rest));
    this.trendMemo = memo((...rest) => this.trend(...rest));
  }

  get size() {
    return this.#history.length;
  }

  get current() {
    return this.#history[this.#history.length - 1];
  }

  #clearMemo() {
    this.percentileMemo.clear();
    this.trendMemo.clear();

    Object.keys(this.custom).forEach((key) => {
      if (typeof this.custom[key] === 'function' && this.custom[key][IS_MEMO]) {
        this.custom[key].clear();
      }
    });
  }

  complete() {
    this.#history = [];

    this.#clearMemo();
  }

  next(metric: MetricsHistoryEntry) {
    this.#history.push({ timestamp: Date.now(), ...metric });

    if (this.#history.length > this.#options.limit) {
      this.#history.shift();
    }

    this.#clearMemo();
  }

  error(error: unknown) {
    console.error(error);
  }

  add(name: string, func: MemoizedFunction<MetricsFunction>) {
    if (this.custom[name]) {
      throw new Error(
        `The key "${name}" of custom statistic function is occupied.`,
      );
    }

    this.custom[name] = func;
  }

  // TODO deprecated, remove in next major version
  percentile(key: keyof MetricsHistoryEntry, number: number) {
    const array = this.getValues(key);

    return percentile(number)(array);
  }

  // TODO deprecated, remove in next major version
  trend(key: keyof MetricsHistoryEntry, limit: number) {
    let array = this.getValues(key);

    array = array.slice(
      !limit || limit > array.length ? 0 : array.length - limit,
      array.length,
    );

    return this.#regression(array);
  }

  from(key: string) {
    return () => this.getValues(key);
  }

  getValues(key: string) {
    const keys = key?.split('.') ?? [];

    return this.#history.map((metric) => {
      return keys.reduce((result, key) => {
        // @ts-expect-error Nested keys
        return result?.[key];
      }, metric);
    });
  }
}
