export const IS_MEMO = Symbol('MemoSymbol');
// biome-ignore lint/suspicious/noExplicitAny: Allow any for memoized function typing
export type MemoizedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): ReturnType<T>;
  clear: () => void;
  [IS_MEMO]: true;
};

// biome-ignore lint/suspicious/noExplicitAny: Allow any for memoized function typing
export function memo<T extends (...args: any[]) => any>(
  func: T,
): MemoizedFunction<T> {
  let cache: Record<string, ReturnType<T>> = {};

  const keyGenerator = (...rest: Parameters<T>): string => rest.join('-');

  const clear = (): void => {
    cache = {};
  };

  const memoized = ((...rest: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator(...rest);

    if (!cache[key]) {
      cache[key] = func(...rest);
    }

    return cache[key];
  }) as MemoizedFunction<T>;

  memoized.clear = clear;
  memoized[IS_MEMO] = true;

  return memoized;
}
