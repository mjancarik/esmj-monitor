import { Observer } from '@esmj/observable';
import { memo } from './memo.mjs';

export class MetricsHistory extends Observer {
  #options = { limit: 60 };
  #history = [];

  constructor(options) {
    super();
    this.#options = { ...this.#options, ...options };

    this.percentileMemo = memo((...rest) => this.percentile(...rest));
    this.trendMemo = memo((...rest) => this.trend(...rest));
  }

  get size() {
    return this.#history.length;
  }

  get current() {
    return this.#history[this.#history.length - 1];
  }

  complete() {
    this.#history = [];
  }

  next(metric) {
    this.#history.push(metric);

    if (this.#history.length > this.#options.limit) {
      this.#history.shift();
    }

    this.percentileMemo.clear();
    this.trendMemo.clear();
  }

  error(error) {
    console.error(error);
  }

  percentile(key, number) {
    const array = this.#getValues(key);

    return this.#calculatePercentile(array, number);
  }

  trend(key, limit) {
    let array = this.#getValues(key);

    array = array.slice(
      !limit || limit > array.length ? 0 : array.length - limit,
      array.length
    );

    const { slope, yIntercept } = this.#getLinearRegression(array);

    return {
      slope,
      yIntercept,
      predict: (x = array.length + 1) => slope * x + yIntercept,
    };
  }

  #getValues(key) {
    const keys = key?.split('.') ?? [];

    return this.#history.map((metric) => {
      return keys.reduce((result, key) => {
        return result?.[key];
      }, metric);
    });
  }

  #getLinearRegression(array) {
    const { sumY, sumX, sumX2, sumXY } = array.reduce(
      (result, value, index) => {
        const x = value?.x ?? index + 1;
        const y = value?.y ?? value;
        result.sumX += x;
        result.sumY += y;
        result.sumX2 += x * x;
        result.sumXY += x * y;

        return result;
      },
      {
        sumY: 0,
        sumX: 0,
        sumX2: 0,
        sumXY: 0,
      }
    );

    const divisor = array.length * sumX2 - sumX * sumX;

    if (divisor === 0) {
      return { slope: 0, yIntercept: 0 };
    }

    const yIntercept = (sumY * sumX2 - sumX * sumXY) / divisor;
    const slope = (array.length * sumXY - sumX * sumY) / divisor;

    return { slope, yIntercept };
  }

  #calculatePercentile(array, number) {
    if (!array.length) {
      return undefined;
    }

    const sortedArray = [...array].sort((a, b) => a - b);
    const size = sortedArray.length;

    const min = 100 / (size + 1);
    const max = (100 * size) / (size + 1);

    if (number <= min) {
      return sortedArray[0];
    }

    if (number >= max) {
      return sortedArray[size - 1];
    }

    const estimatedIndex = (number / 100) * (size + 1) - 1;
    const index = Math.floor(estimatedIndex);
    const decimalWeight = Math.abs(estimatedIndex) - index;

    return (
      sortedArray[index] +
      decimalWeight * (sortedArray[index + 1] - sortedArray[index])
    );
  }
}
