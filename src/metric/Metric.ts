export type MonitorOptions = {
  interval?: number;
};

export class Metric {
  start(_options?: MonitorOptions) {}
  beforeMeasure(_options?: MonitorOptions) {}
  measure(_options?: MonitorOptions) {}
  afterMeasure(_options?: MonitorOptions) {}
  stop(_options?: MonitorOptions) {}
}
