export const IS_MEMO = Symbol('MemoSymbol');

export type MemoizedFunction<T extends (...args: unknown[]) => unknown> = T & {
  clear: () => void;
  [IS_MEMO]: true;
  _getType: () => ReturnType<T>;
};

export function memo<T extends (...args: unknown[]) => unknown>(
  func: T,
): MemoizedFunction<T> {
  return ((func) => {
    let cache: Record<string, unknown> = {};

    const keyGenerator = (...rest: Parameters<T>) => rest.join('-');
    const clear = () => {
      cache = {};
    };
    const memoized = (...rest: Parameters<T>) => {
      const key = keyGenerator(...rest);

      if (!cache[key]) {
        cache[key] = func(...rest);
      }

      return cache[key];
    };

    memoized.clear = clear;
    memoized[IS_MEMO] = true;

    return memoized;
  })(func) as MemoizedFunction<T>;
}
