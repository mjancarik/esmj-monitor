export const IS_MEMO = Symbol('MemoSymbol');

export type MemoizedFunction<T extends (...args: any[]) => any> = T & {
  clear: () => void;
  [IS_MEMO]: true;
};

export function memo<T extends (...args: any[]) => any>(
  func: T,
): MemoizedFunction<T> {
  return ((func) => {
    let cache: Record<string, ReturnType<T>> = {};

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
