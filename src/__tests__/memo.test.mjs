import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

import { memo } from '../memo.ts';

describe('memo', () => {
  let calculateMemo;
  let calculate;

  beforeEach(() => {
    calculate = mock.fn((a, b) => a + b);
    calculateMemo = memo(calculate);
  });

  it('should calculate only once for same inputs', () => {
    calculateMemo(1, 2);
    assert.strictEqual(calculateMemo(1, 2), 3);
    assert.strictEqual(calculate.mock.calls.length, 1);
  });
});
