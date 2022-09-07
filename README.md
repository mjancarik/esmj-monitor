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
import { createMonitor } from '@esmj/monitor';

const { monitor } = new createMonitor();

const unsubscribe = monitor.subscribe((metrics) => {
  console.log(metrics);
});

monitor.start();

setTimeout(() => {
  unsubscribe();
  monitor.stop();
}, 15000);

```

## API
### monitor = new Monitor(options?)

Create a new instance of Monitor.

##### options?

Type: `object`

Configure the new instance of Monitor.

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