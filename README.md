# Monitor

The `@esmj/monitor` is module for collecting node metrics from native node API.

## Requirements

- Node 18+

## Install

```shell
npm install @esmj/monitor
```

## Usage

It works for both Javascript modules (ESM and CJS).

```javascript 
// server.js
import { createMonitoring } from '@esmj/monitor';

const { monitor, metricsHistory } = new createMonitoring();

const { unsubscribe } = monitor.subscribe((metric) => {
  console.log(metric);
//   {
//   cpuUsage: { user: 1692, system: 925, percent: 0.26 },
//   eventLoopDelay: {
//     min: 20.07,
//     max: 21.15,
//     mean: 20.78,
//     stddev: 0.38,
//     percentile80: 21.08
//   },
//   eventLoopUtilization: {
//     idle: 992.72,
//     active: 7.85,
//     utilization: 0.01
//   },
//   loadAverage: {
//     minute1: 3.38,
//     minute5: 8.28,
//     minute15: 9.15
//   },
//   memoryUsage: {
//     percent: 5.23,
//     rss: 54.2,
//     heapTotal: 20.2,
//     heapUsed: 17.74,
//     external: 0.9,
//     arrayBuffers: 0.07
//   },
//   gc: { entry: null },
//   process: {
//     pid: 53509,
//     ppid: 53480,
//     platform: 'darwin',
//     uptime: 14.656514084,
//     version: 'v18.12.1'
//   }
// }
});

monitor.start();

setTimeout(() => {
  console.log(metricsHistory.percentile('cpuUsage.percent', 80)); // 1 
  console.log(metricsHistory.percentile('memoryUsage.rss', 80)); // 61
  console.log(metricsHistory.trend('memoryUsage.rss').predict()); // 65
}, 5000);

setTimeout(() => {
  console.log(metricsHistory.size) // 15;
  console.log(metricsHistory.current) // return last captured metric structure
  unsubscribe();
  monitor.stop();
  console.log(metricsHistory.percentile('cpuUsage.percent', 80)); // undefined 
  console.log(metricsHistory.percentile('memoryUsage.rss', 80)); // undefined
}, 15000);

```

## API
### monitor = new Monitor(options?)

Create a new instance of Monitor.

##### options?

Type: `object`

Configure options for the new instance of Monitor.

##### options.interval?

Type: `integer`
Default: `1000`

Measure interval metric.

#### start()
Monitoring start measure node metric.

#### stop()
Monitoring stop measure node metric.

#### subscribe(listener)
Subscribe listener for metrics.

Returns a subscription object with unsubscribe method.

#### unsubscribe(listener)
Remove subscription.

#### add(metric)
Monitoring add measure new metric.

##### metric

Type: `Metric`

Add new metric to monitoring.

#### remove(metric)
Remove defined metric from monitoring.

### metricsHistory = new MetricsHistory(options.metricsHistory?)

Create a new instance of Monitor.

##### options?

Type: `object`

Configure options for the new instance of MetricsHistory.

##### options.limit?

Type: `integer`
Default: `60`

FIFO size of array for calculating percentile and linear regressions.

#### percentile(key, number)
Returns defined percentile for measured metric

##### key

Type: `String`

Path in measured metric structure.

##### number

Type: `Number`

Percentile number for FIFO array

#### percentileMemo(key, number)
Memoized version of percentile function. Cache is cleared after capture new metric.

#### trend(key, limit)
Returns linear regression variables `slope`, `yIntercept` and `predict` function for measured metric.

##### key

Type: `String`

Path in measured metric structure.

##### limit

Type: `Number`

Defined how much records use for calculating linear regression. Default is use all records from FIFO array. 

#### trendMemo(key, number)
Memoized version of trend function. Cache is cleared after capture new metric.
