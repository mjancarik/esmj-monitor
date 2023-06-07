import { Observer } from '@esmj/observable';
import { memo, IS_MEMO } from './memo.mjs';
import { linearRegression, percentile } from './math.mjs';

export class MetricsHistory extends Observer {
  #options = { limit: 60 };
  #regression = null;
  #history = [];
  custom = {};

  constructor(options) {
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

  next(metric) {
    this.#history.push(metric);

    if (this.#history.length > this.#options.limit) {
      this.#history.shift();
    }

    this.#clearMemo();
  }

  error(error) {
    console.error(error);
  }

  add(name, func) {
    if (this.custom[name]) {
      throw new Error(
        `The key "${name}" of custom statistic function is uccupied.`
      );
    }

    this.custom[name] = func;
  }

  // TODO deprecated, remove in next major version
  percentile(key, number) {
    const array = this.getValues(key);

    return percentile(number)(array);
  }

  // TODO deprecated, remove in next major version
  trend(key, limit) {
    let array = this.getValues(key);

    array = array.slice(
      !limit || limit > array.length ? 0 : array.length - limit,
      array.length
    );

    return this.#regression(array);
  }

  from(key) {
    return () => this.getValues(key);
  }

  getValues(key) {
    const keys = key?.split('.') ?? [];

    return this.#history.map((metric) => {
      return keys.reduce((result, key) => {
        return result?.[key];
      }, metric);
    });
  }
}
