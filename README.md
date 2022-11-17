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

const unsubscribe = monitor.subscribe((metrics) => {
  console.log(metrics);
//   {
//   cpuUsage: { user: 1692, system: 925, percent: 0.2617 },
//   eventLoopDelay: {
//     min: 20.0704,
//     max: 21.151743,
//     mean: 20.785241043478262,
//     stddev: 0.3817646061991465,
//     percentile80: 21.086207
//   },
//   eventLoopUtilization: {
//     idle: 992.720965999999,
//     active: 7.85202197369108,
//     utilization: 0.00784752543599303
//   },
//   loadAverage: {
//     minute1: 3.38623046875,
//     minute5: 8.2880859375,
//     minute15: 9.15283203125
//   },
//   memoryUsage: {
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
}, 5000);

setTimeout(() => {
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

Returns an unsubscribe method.

#### unsubscribe(listener)
Remove subscription.

#### add(metric)
Monitoring start measure node metric.

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
Default: `10`

FIFO size of array for calculating percentile.

#### percentile(key, value)
Monitoring start measure node metric.

##### key

Type: `String`

Path in measured metric structure.

##### value

Type: `Number`

Percentile number for FIFO array