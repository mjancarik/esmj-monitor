export const IS_MEMO = Symbol('MemoSymbol');

export function memo(func) {
  return ((func) => {
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
    memoized[IS_MEMO] = true;

    return memoized;
  })(func);
}
