import { jest } from '@jest/globals';
import {
  objectKeepUnmock,
  setGlobalKeepUnmock,
  setGlobalMockMethod,
} from 'to-mock';

// every method is replaced to jest.fn()
setGlobalMockMethod(jest.fn);
// native object method keep unmock
setGlobalKeepUnmock(objectKeepUnmock);
