export function memo(func) {
  return (function (func) {
    let cache = {};

    const keyGenerator = (...rest) => rest.join('-');
    const clear = () => {
      cache = {};
    };
    const memoized = (...rest) => {
      const key = keyGenerator(...rest);

      if (!cache[key]) {
        cache[key] = func(...rest);
      }

      return cache[key];
    };

    memoized.clear = clear;

    return memoized;
  })(func);
}
