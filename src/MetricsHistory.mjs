import { Observer } from '@esmj/observable';

export class MetricsHistory extends Observer {
  #options = { limit: 10 };
  #history = [];

  constructor(options) {
    super();
    this.#options = { ...this.#options, ...options };
  }

  complete() {
    this.#history = [];
  }

  next(metric) {
    this.#history.push(metric);

    if (this.#history.length > this.#options.limit) {
      this.#history.shift();
    }
  }

  error(error) {
    console.error(error);
  }

  percentile(key, number) {
    const array = this.#getValues(key);

    return this.#calculate(array, number);
  }

  #getValues(key) {
    const keys = key?.split('.') ?? [];

    return this.#history.map((metric) => {
      return keys.reduce((result, key) => {
        return result?.[key];
      }, metric);
    });
  }

  #calculate(array, number) {
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
