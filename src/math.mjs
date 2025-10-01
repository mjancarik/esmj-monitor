export function medianNoiseReduction(grouping = 5) {
  return function _medianNoiseReduction(array) {
    const newArray = [];

    for (let index = 0; index < array.length; index++) {
      const startIndex =
        index - Math.floor(grouping / 2) < 0
          ? 0
          : index - Math.floor(grouping / 2);
      const endIndex =
        index + Math.ceil(grouping / 2) <= array.length
          ? index + Math.ceil(grouping / 2)
          : array.length;
      const group = array.slice(startIndex, endIndex);

      newArray.push(percentile(50)(group));
    }

    return newArray;
  };
}

export function linearRegression() {
  return function _linearRegression(array) {
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
      },
    );

    const divisor = array.length * sumX2 - sumX * sumX;

    if (divisor === 0) {
      return { slope: 0, yIntercept: 0, predict: () => 0 };
    }

    const yIntercept = (sumY * sumX2 - sumX * sumXY) / divisor;
    const slope = (array.length * sumXY - sumX * sumY) / divisor;

    return {
      slope,
      yIntercept,
      predict: (x = array.length + 1) => slope * x + yIntercept,
    };
  };
}

export function percentile(number = 50) {
  return function _percentile(array) {
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
  };
}

export function takeLast(size) {
  return function _takeLast(array) {
    return array.slice(
      !size || size > array.length ? 0 : array.length - size,
      array.length,
    );
  };
}

export function first() {
  return function _first(array) {
    return array[0];
  };
}

export function last() {
  return function _last(array) {
    return array[array.length - 1];
  };
}

export function avg() {
  return function _avg(array) {
    if (!array.length) {
      return undefined;
    }

    const sum = _sum(array);
    return sum / array.length;
  };
}

export function sum() {
  return _sum;
}

export function _sum(array) {
  if (!array.length) {
    return undefined;
  }

  let result = 0;
  for (let i = 0; i < array.length; i++) {
    if (typeof array[i] !== 'number' || Number.isNaN(array[i])) {
      return undefined;
    }
    result += array[i];
  }

  return result;
}
