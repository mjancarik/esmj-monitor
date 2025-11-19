import diagnostics_channel from 'node:diagnostics_channel';
import { Metric } from './Metric.ts';
import { roundToTwoDecimal } from './roundToTwoDecimal.ts';

const HTTP_EVENT_START = 'http.server.request.start';
const HTTP2_EVENT_START = 'http2.server.request.start';

const HTTP_EVENT_FINISHED = 'http.server.response.finish';
const HTTP2_EVENT_FINISHED = 'http2.server.response.finish';

const NET_EVENT_START = 'net.server.socket';
const requestStart = Symbol('requestStart');

type Request = {
  [requestStart]?: number;
  [key: symbol]: unknown;
  on(event: string, callBack: () => void): void;
};

type Response = {
  statusCode?: number;
  on(event: string, callBack: () => void): void;
};

export type RequestMetricRequestData = {
  count: {
    total: number;
    active: number;
    zombie: number;
    clientErrors: number;
    serverErrors: number;
    connections: number;
  };
  duration: {
    10: number;
    25: number;
    50: number;
    100: number;
    200: number;
    500: number;
    1000: number;
    2000: number;
    5000: number;
    Infinity: number;
  };
  errorRate: number;
};

export class RequestMetric extends Metric {
  #requestKey = Symbol('request key');
  #createRequest = this._createRequest.bind(this);
  #finishRequest = this._finishRequest.bind(this);

  #createConnection = this._createConnection.bind(this);

  #count = {
    total: 0,
    active: 0,
    zombie: 0,
    clientErrors: 0,
    httpServerErrors: 0,
    connections: 0,
  };

  #durationHistogram = {
    10: 0,
    25: 0,
    50: 0,
    100: 0,
    200: 0,
    500: 0,
    1000: 0,
    2000: 0,
    5000: 0,
    Infinity: 0,
  };

  start() {
    try {
      diagnostics_channel.subscribe(HTTP_EVENT_START, this.#createRequest);
      diagnostics_channel.subscribe(HTTP2_EVENT_START, this.#createRequest);

      diagnostics_channel.subscribe(HTTP_EVENT_FINISHED, this.#finishRequest);
      diagnostics_channel.subscribe(HTTP2_EVENT_FINISHED, this.#finishRequest);

      diagnostics_channel.subscribe(NET_EVENT_START, this.#createConnection);
    } catch (error) {
      console.warn('Diagnostics channel is not available:', error);
    }
  }

  measure() {
    return {
      request: {
        count: {
          total: this.#count.total,
          active: this.#count.active,
          zombie: this.#count.zombie,
          clientErrors: this.#count.clientErrors,
          serverErrors: this.#count.httpServerErrors,
          connections: this.#count.connections,
        },
        duration: {
          10: this.#durationHistogram[10],
          25: this.#durationHistogram[25],
          50: this.#durationHistogram[50],
          100: this.#durationHistogram[100],
          200: this.#durationHistogram[200],
          500: this.#durationHistogram[500],
          1000: this.#durationHistogram[1000],
          2000: this.#durationHistogram[2000],
          5000: this.#durationHistogram[5000],
          Infinity: this.#durationHistogram.Infinity,
        },
        errorRate: this.#count.total
          ? roundToTwoDecimal(
              (100 *
                (this.#count.clientErrors + this.#count.httpServerErrors)) /
                this.#count.total,
            )
          : 0,
      },
    };
  }

  afterMeasure() {
    this.#count = {
      total: 0,
      active: this.#count.active,
      zombie: this.#count.zombie,
      clientErrors: 0,
      httpServerErrors: 0,
      connections: 0,
    };
    this.#durationHistogram = {
      10: 0,
      25: 0,
      50: 0,
      100: 0,
      200: 0,
      500: 0,
      1000: 0,
      2000: 0,
      5000: 0,
      Infinity: 0,
    };
  }

  stop() {
    try {
      diagnostics_channel.unsubscribe(HTTP_EVENT_START, this.#createRequest);
      diagnostics_channel.unsubscribe(HTTP2_EVENT_START, this.#createRequest);

      diagnostics_channel.unsubscribe(HTTP_EVENT_FINISHED, this.#finishRequest);
      diagnostics_channel.unsubscribe(
        HTTP2_EVENT_FINISHED,
        this.#finishRequest,
      );

      diagnostics_channel.unsubscribe(NET_EVENT_START, this.#createConnection);
    } catch (error) {
      //console.warn('Diagnostics channel is not available:', error);
    }
  }

  _createConnection(_message: string) {
    this.#count.connections++;
  }

  _createRequest({
    request,
    response,
  }: { request: Request; response: Response }) {
    request[requestStart] = performance.now();
    request[this.#requestKey] = false; // Add a flag

    const decrementActive = () => {
      if (!request[this.#requestKey]) {
        this.#count.active--;
        request[this.#requestKey] = true;
      }
    };

    // Listen for completion events
    request.on('close', decrementActive);
    response.on('finish', decrementActive);
    response.on('close', decrementActive);

    // // Add a safety timeout (5 min) for zombie requests
    const zombieTimeout = setTimeout(() => {
      this.#count.zombie++;
    }, 30 * 1000);

    // Clear the timeout when the request completes normally
    const clearZombieTimeout = () => clearTimeout(zombieTimeout);
    request.on('close', clearZombieTimeout);

    response.on('finish', clearZombieTimeout);
    response.on('close', clearZombieTimeout);

    this.#count.total++;
    this.#count.active++;
  }

  _finishRequest({
    request,
    response,
  }: { request: Request; response: Response }) {
    const duration = performance.now() - request[requestStart];
    const durationKey =
      duration <= 10
        ? 10
        : duration <= 25
          ? 25
          : duration <= 50
            ? 50
            : duration <= 100
              ? 100
              : duration <= 200
                ? 200
                : duration <= 500
                  ? 500
                  : duration <= 1000
                    ? 1000
                    : duration <= 2000
                      ? 2000
                      : duration <= 5000
                        ? 5000
                        : 'Infinity';
    this.#durationHistogram[durationKey]++;

    if (response?.statusCode >= 400 && response?.statusCode < 500) {
      this.#count.clientErrors++;
    } else if (response?.statusCode >= 500) {
      this.#count.httpServerErrors++;
    }
  }
}
