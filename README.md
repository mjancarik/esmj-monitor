# ESMJ-Monitor

The `@esmj/monitor` is module for collecting node metrics from native node API.

## Features

- Event Loop Utilization monitoring
- Event Loop Delay monitoring
- CPU Usage monitoring
- Memory Usage monitoring
- GC (Garbage Collection) metrics
- HTTP Request monitoring
- Load Average monitoring
- Process information
- Severity Analysis for system health (BETA)
- DoS and DDoS attack detection (BETA)

## Requirements

- Node 18+

## Installation

```bash
npm install @esmj/monitor
```

## Basic Usage

It works for both Javascript modules (ESM and CJS).

```javascript
// server.js
import { createMonitoring } from '@esmj/monitor';

const { monitor, metricsHistory, severity, start, stop } = createMonitoring();

// Start collecting metrics
start();

// Subscribe to metrics updates
const { unsubscribe } = monitor.subscribe((metrics) => {
  console.log('Current metrics:', metrics);
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
//   },
//   request: {
//     count: {
//       total: 45,
//       active: 3,
//       zombie: 0,
//       clientErrors: 2,
//       serverErrors: 0,
//       connections: 15
//     },
//     duration:  {
//      10: 1, // 10 requests completed in under 10ms
//      25: 5, // 5 requests completed in 10-25ms
//      50: 10, // 10 requests completed in 25-50ms
//      100: 20, // 20 requests completed in 50-100ms
//      200: 30, // 30 requests completed in 100-200ms
//      500: 50, // 50 requests completed in 200-500ms
//      1000: 60, // 60 requests completed in 500-1000ms
//      2000: 70, // 70 requests completed in 1000-2000ms
//      5000: 80, // 80 requests completed in 2000-5000ms
//      'Infinity': 90, // 90 requests completed in above 5000ms
//      },
//   }
// }
});

// Check system health using severity analysis
setInterval(() => {
  const threats = severity.getThreats();
  console.log(`Current severity: ${threats.level} (score: ${threats.score})`);
  
  if (threats.level === 'high' || threats.level === 'critical') {
    console.warn('ALERT: System under stress!', threats.records);
  }
}, 5000);

// Access metrics history and create custom metrics
setTimeout(() => {
  console.log(metricsHistory.size); // 15
  console.log(metricsHistory.current); // return last captured metric structure
  
  // Custom metrics can be added and used
  metricsHistory.add('getCPUPercent', pipe(
    metricsHistory.from('cpuUsage.percent'),
    takeLast(5),
    avg()
  ));
  console.log(metricsHistory.custom.getCPUPercent()); // e.g., 0.26
}, 5000);

setTimeout(() => {
  unsubscribe();
  stop();
}, 15000);
```

## Advanced Configuration

```javascript
const { monitor, metricsHistory, severity, start, stop } = createMonitoring({
  monitor: { interval: 1000 }, // Collect metrics every second
  metricsHistory: { limit: 60 }, // Keep 1 minutes of history
  shortMonitor: { interval: 10 }, // High-frequency collection (10ms)
  severity: {
    threshold: {
      denialOfService: 50, // Request threshold for DoS detection
      distributedDenialOfService: 200, // Request threshold for DDoS detection
      deadlock: 20 // Active request threshold for deadlock detection
    }
  }
});
```

## Severity Analysis (BETA)

The severity analysis component evaluates multiple metrics to determine the health of your system:

- **Normal**: System functioning properly
- **Low**: Minor issues detected, monitor the situation
- **Medium**: Performance degradation detected
- **High**: Significant issues affecting performance
- **Critical**: System under severe stress, immediate action required

```javascript
// Example severity assessment
{
  score: 16, // Severity score (0-20)
  level: 'critical', // One of: 'normal', 'low', 'medium', 'high', 'critical'
  records: [
    { score: 16, metric: 'denialOfServiceDetected' }
    // Other factors contributing to the score
  ]
}
```

## Architecture

```
┌────────────┐     ┌──────────────────┐     ┌────────────────┐
│            │     │                  │     │                │
│  Monitor   │────▶│  MetricsHistory  │────▶│  Subscribers   │
│            │     │                  │     │                │
└────────────┘     └──────────────────┘     └────────────────┘
       │                                            ▲
       │                                            │
       │           ┌──────────────┐                 │
       └──────────▶│  Severity    │─────────────────┘
                   │              │
                   └──────────────┘
```

## API

### Functions

#### createMonitoring(options?)

Factory function that creates and wires up all monitoring components.

**Returns**: `{ monitor, metricsHistory, shortMonitor, shortMetricsHistory, severity, start, stop }`

**Parameters**:
- `options?` (object): Configuration options for the monitoring system
  - `monitor?` (object): Options for the main Monitor instance. Default: `{ interval: 1000 }`
  - `metricsHistory?` (object): Options for the main MetricsHistory instance. Default: `{ limit: 60 }`
  - `shortMonitor?` (object): Options for the high-frequency Monitor instance. Default: `{ interval: 10 }`
  - `shortMetricsHistory?` (object): Options for the high-frequency MetricsHistory instance. Default: `{ limit: 100 }`
  - `severity?` (object): Options for the Severity instance, including threshold configuration

**Methods**:
- `start()`: Start collecting metrics on both monitor and shortMonitor
- `stop()`: Stop collecting metrics on both monitor and shortMonitor

#### pipe(...)

Composes functions from left to right.

**Parameters**:
- `...functions` (Function): The functions to compose

**Returns**: (Function): A function that is the composition of all input functions

#### memo(fn)

Creates a memoized (cached) version of a function.

**Parameters**:
- `fn` (Function): The function to memoize

**Returns**: (Function): A memoized version of the input function with a `clear()` method

#### linearRegression()

Creates a function that calculates linear regression from an array of values.

**Returns**: (Function): A function that accepts an array and returns regression analysis with `slope`, `yIntercept` and `predict` method

#### percentile(number)

Creates a function that calculates the specified percentile from an array of values.

**Parameters**:
- `number` (Number): The percentile to calculate (0-100). Default: `50`

**Returns**: (Function): A function that accepts an array and returns the specified percentile value

#### medianNoiseReduction(grouping)

Creates a function that applies median-based noise reduction to an array of values.

**Parameters**:
- `grouping` (Number): The size of the grouping window. Default: `5`

**Returns**: (Function): A function that accepts an array and returns a noise-reduced array

#### takeLast(size)

Creates a function that returns the last N items from an array.

**Parameters**:
- `size` (Number): Number of items to take from the end

**Returns**: (Function): A function that accepts an array and returns the last N items

#### first()

Creates a function that returns the first item from an array.

**Returns**: (Function): A function that accepts an array and returns its first item

#### last()

Creates a function that returns the last item from an array.

**Returns**: (Function): A function that accepts an array and returns its last item

#### avg()

Creates a function that calculates the average of an array of numbers.

**Returns**: (Function): A function that accepts an array and returns its average value

#### sum()

Creates a function that calculates the sum of an array of numbers.

**Returns**: (Function): A function that accepts an array and returns the sum of its values

### Classes

#### Monitor

Manages the collection of metrics at regular intervals.

##### Constructor
```javascript
new Monitor(options?)
```

**Parameters**:
- `options?` (object): Configuration options
  - `interval?` (number): Measurement interval in milliseconds. Default: `1000`

##### Methods

- `start()`: Begin collecting metrics
- `stop()`: Stop collecting metrics
- `add(metric)`: Add a metric collector
  - `metric` (Metric): The metric collector to add
  - **Returns**: (Function): Function to remove the added metric
- `remove(metric)`: Remove a metric collector
  - `metric` (Metric): The metric collector to remove
- `subscribe(listener)`: Subscribe to metric updates
  - `listener` (Function): Callback function that receives metrics
  - **Returns**: (object): Subscription with `unsubscribe` method

#### MetricsHistory

Stores metrics history and provides data access functions.

##### Constructor
```javascript
new MetricsHistory(options?)
```

**Parameters**:
- `options?` (object): Configuration options
  - `limit?` (number): Maximum number of metrics to store. Default: `60`

##### Properties

- `size` (number): Current number of stored metrics
- `current` (object): The most recently captured metrics
- `custom` (object): Container for custom metric functions

##### Methods

- `next(metric)`: Add a new metric to the history
  - `metric` (object): The metric to add
- `complete()`: Clear all stored metrics
- `add(name, func)`: Add a custom calculation function
  - `name` (string): Name of the function
  - `func` (Function): The calculation function
- `from(key)`: Create a function that retrieves values for a specific key
  - `key` (string): Path in metrics structure
  - **Returns**: (Function): Function that returns values for the key
- `getValues(key)`: Get all values for a specific metric key
  - `key` (string): Path in metrics structure
  - **Returns**: (Array): Array of values

#### Severity

Analyzes metrics to determine system health and detect attacks.

##### Constructor
```javascript
new Severity(monitor, metricsHistory, shortMonitor, shortMetricsHistory, requestMetric, shortRequestMetric, options?)
```

**Parameters**:
- `monitor` (Monitor): Primary metrics monitor
- `metricsHistory` (MetricsHistory): History of metrics
- `shortMonitor` (Monitor): High-frequency metrics monitor
- `shortMetricsHistory` (MetricsHistory): High-frequency metrics history
- `requestMetric` (RequestMetric): HTTP request metrics
- `shortRequestMetric` (RequestMetric): High-frequency HTTP request metrics
- `options?` (object): Configuration options
  - `threshold?` (object): Detection thresholds
    - `denialOfService?` (number): Request threshold for DoS detection. Default: `10`
    - `distributedDenialOfService?` (number): Request threshold for DDoS detection. Default: `20`
    - `deadlock?` (number): Active request threshold for deadlock detection. Default: `10`

##### Methods

- `init()`: Initialize the severity analyzer
- `getThreats()`: Calculate and return the current system severity assessment
  - **Returns**: (object): `{ score, level, records }`
    - `score` (number): Severity score (0-20)
    - `level` (string): One of: 'normal', 'low', 'medium', 'high', 'critical'
    - `records` (Array): Factors contributing to the severity score

#### Metric

Base class for all metric collectors.

##### Methods

- `start(options)`: Called when monitoring starts
- `beforeMeasure(options)`: Called before each measurement
- `measure(options)`: Performs the measurement
  - **Returns**: (object): The collected metrics
- `afterMeasure(options)`: Called after each measurement
- `stop(options)`: Called when monitoring stops

## Custom Metrics

The MetricsHistory class allows you to create custom metrics by combining utility functions. Custom metrics are useful for calculating specific insights from your collected data without constantly writing the same code.

### Adding Custom Metrics

```javascript
import { pipe, memo, takeLast, avg } from '@esmj/monitor';

// Add a custom metric function
metricsHistory.add('averageCPULastMinute', pipe(
  metricsHistory.from('cpuUsage.percent'),
  takeLast(60),  // Last 60 measurements (1 minute at 1000ms interval)
  avg()
));

// Add a memoized custom metric for better performance
metricsHistory.add('memoizedCPUAverage', memo(pipe(
  metricsHistory.from('cpuUsage.percent'),
  takeLast(60),
  avg()
)));

// Use the custom metrics later
const cpuAverage = metricsHistory.custom.averageCPULastMinute();
console.log(`Average CPU usage over the last minute: ${cpuAverage}%`);

// Memoized version - calculates once until metrics history changes
const memoizedAvg = metricsHistory.custom.memoizedCPUAverage();
```

### Common Custom Metric Examples

```javascript
import { 
  pipe, memo, linearRegression, percentile, 
  takeLast, first, last, avg, sum 
} from '@esmj/monitor';

// Memory growth trend detection - with memoization for performance
metricsHistory.add('memoryTrend', memo(pipe(
  metricsHistory.from('memoryUsage.rss'),
  takeLast(30),
  linearRegression()
)));

// Then check if memory is growing too fast
const { slope } = metricsHistory.custom.memoryTrend();
if (slope > 5) {
  console.warn('Memory usage is increasing rapidly!');
}

// 95th percentile of event loop delay
metricsHistory.add('p95EventLoopDelay', memo(pipe(
  metricsHistory.from('eventLoopDelay.max'),
  takeLast(60),
  percentile(95)
)));
```

## Utility Functions

These utility functions can be imported directly from the module:

```javascript
import { 
  pipe, 
  memo, 
  linearRegression, 
  percentile, 
  medianNoiseReduction, 
  takeLast,
  first,
  last, 
  avg,
  sum 
} from '@esmj/monitor';
```

They can be combined to create powerful data transformations:

```javascript
// Calculate average CPU usage from the last 10 measurements
const getAvgCPU = pipe(
  metricsHistory.from('cpuUsage.percent'),
  takeLast(10),
  avg()
);

// Get highest memory usage from the last minute
const getMaxMemory = pipe(
  metricsHistory.from('memoryUsage.heapUsed'),
  takeLast(60),
  percentile(100)
);

// Create a noise-reduced trend analysis of event loop delay
const smoothedDelay = pipe(
  metricsHistory.from('eventLoopDelay.max'),
  medianNoiseReduction(5)
);
```

## Contributing

Issues and pull requests are welcome! Feel free to contribute.

## License

MIT
