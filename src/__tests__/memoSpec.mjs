import { jest } from '@jest/globals';

import { memo } from '../memo.ts';

describe('memo', () => {
  let calculateMemo;
  let calculate;

  beforeEach(() => {
    calculate = jest.fn((a, b) => a + b);
    calculateMemo = memo(calculate);
  });

  it('should calculate only once for same inputs', () => {
    calculateMemo(1, 2);
    expect(calculateMemo(1, 2)).toEqual(3);
    expect(calculate.mock.calls.length).toEqual(1);
  });
});
