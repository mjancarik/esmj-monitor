import { Observer } from '@esmj/observable';
import { linearRegression, percentile } from './math.mjs';
import { IS_MEMO } from './memo.mjs';

export class MetricsHistory extends Observer {
  #options = { limit: 60 };
  #history = [];
  custom = {};

  constructor(options) {
    super();
    this.#options = { ...this.#options, ...options };
  }

  get size() {
    return this.#history.length;
  }

  get current() {
    return this.#history[this.#history.length - 1];
  }

  #clearMemo() {
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
        `The key "${name}" of custom statistic function is occupied.`,
      );
    }

    this.custom[name] = func;
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
