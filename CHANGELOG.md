## <small>0.8.1 (2025-12-01)</small>

* feat(): add constant to keep order of the severity levels ([fe73911](https://github.com/mjancarik/esmj-monitor/commit/fe73911))
* feat(): add new helper isSeverityLevelAtLeast ([dbd0673](https://github.com/mjancarik/esmj-monitor/commit/dbd0673))



## 0.8.0 (2025-11-24)

* style: 💄 allow any ([78f55d0](https://github.com/mjancarik/esmj-monitor/commit/78f55d0))
* feat: 🎸 add Fatal stage ([61d45ce](https://github.com/mjancarik/esmj-monitor/commit/61d45ce))


### BREAKING CHANGE

* 🧨 Added the new fatal stage.


## 0.7.0 (2025-11-19)

* ci: 🎡 fix CI for node test runner ([b7f7739](https://github.com/mjancarik/esmj-monitor/commit/b7f7739))
* ci: 🎡 update to node@24 ([1f52df2](https://github.com/mjancarik/esmj-monitor/commit/1f52df2))
* Update README to remove BETA labels ([7f19e35](https://github.com/mjancarik/esmj-monitor/commit/7f19e35))
* feat(): add typescript ([2b6670a](https://github.com/mjancarik/esmj-monitor/commit/2b6670a))
* feat(): add typescript ([01389c9](https://github.com/mjancarik/esmj-monitor/commit/01389c9))
* feat(): add typescript ([e4ac20c](https://github.com/mjancarik/esmj-monitor/commit/e4ac20c))
* feat(): export types for adding custom metrics functions ([f62db96](https://github.com/mjancarik/esmj-monitor/commit/f62db96))
* feat(): remove jest ([36dd0bc](https://github.com/mjancarik/esmj-monitor/commit/36dd0bc))
* feat(): update docs ([0a705b9](https://github.com/mjancarik/esmj-monitor/commit/0a705b9))
* feat(): update docs ([44df9e0](https://github.com/mjancarik/esmj-monitor/commit/44df9e0))
* feat(): upgrade pacakges ([8c15b86](https://github.com/mjancarik/esmj-monitor/commit/8c15b86))
* feat(Severity): add eveentLoopDelay and eluIdleTrend evaluations to the severity calculations ([4f05b93](https://github.com/mjancarik/esmj-monitor/commit/4f05b93))
* feat(Severity): add eveentLoopDelay and eluIdleTrend evaluations to the severity calculations ([2848aa2](https://github.com/mjancarik/esmj-monitor/commit/2848aa2))
* feat(Severity): add weight to eventLoopDelay calculations ([dd4e2b1](https://github.com/mjancarik/esmj-monitor/commit/dd4e2b1))
* feat(Severity): change option 'experimental' to object ([9b6369a](https://github.com/mjancarik/esmj-monitor/commit/9b6369a))
* feat(Severity): recalculate severity score from 0-20 to 0-100 ([32e3138](https://github.com/mjancarik/esmj-monitor/commit/32e3138))
* feat(Severity): set first attempt limits and assigned score ([fbf1f4b](https://github.com/mjancarik/esmj-monitor/commit/fbf1f4b))
* fix(): fix get cpu utilization pipe ([5a90827](https://github.com/mjancarik/esmj-monitor/commit/5a90827))
* fix(): fix types ([674ba35](https://github.com/mjancarik/esmj-monitor/commit/674ba35))
* fix(): fix types ([f3db279](https://github.com/mjancarik/esmj-monitor/commit/f3db279))



## <small>0.6.1 (2025-10-02)</small>

* fix: 🐛 add back deprectecated method percentile and trend ([d035947](https://github.com/mjancarik/esmj-monitor/commit/d035947))



## 0.6.0 (2025-10-01)

* feat: 🎸 add draft of severity detection ([5c94fd6](https://github.com/mjancarik/esmj-monitor/commit/5c94fd6))



## <small>0.5.4 (2025-06-05)</small>

* chore: 🤖 update dependencies ([acb8ec0](https://github.com/mjancarik/esmj-monitor/commit/acb8ec0))



## [0.5.3](https://github.com/mjancarik/esmj-monitor/compare/v0.5.2...v0.5.3) (2023-06-07)


### Features

* 🎸 add possibility to register custom statistics ([f2a15b8](https://github.com/mjancarik/esmj-monitor/commit/f2a15b8277c789e3f73da057fbb441b2be268bda))



## [0.5.2](https://github.com/mjancarik/esmj-monitor/compare/v0.5.1...v0.5.2) (2023-04-27)


### Features

* 🎸 makes method getValues of MetricsHistory public ([53c538f](https://github.com/mjancarik/esmj-monitor/commit/53c538f25eda90b8b64b13cedd6d2bdbcc71d3b1))



## [0.5.1](https://github.com/mjancarik/esmj-monitor/compare/v0.5.0...v0.5.1) (2023-03-17)


### Features

* 🎸 add new memoized percentileMemo and trendMemo functions ([62ff06a](https://github.com/mjancarik/esmj-monitor/commit/62ff06a6762a241e61ff99bf4083766311641016))



# [0.5.0](https://github.com/mjancarik/esmj-monitor/compare/v0.4.0...v0.5.0) (2023-02-16)


### Features

* 🎸 update to esmj/emitter@0.1.0 ([2def639](https://github.com/mjancarik/esmj-monitor/commit/2def6396d52210983075dd8e8d3ba20166b84905))


### BREAKING CHANGES

* 🧨 Subscribe method returns subscription object with unsubscribe method.



# [0.4.0](https://github.com/mjancarik/esmj-monitor/compare/v0.3.0...v0.4.0) (2023-02-03)


### Features

* 🎸 add trend function to metrcis history ([acadc6d](https://github.com/mjancarik/esmj-monitor/commit/acadc6d2ef17829a3552bab9f763ff2d0aa7bc00))



# [0.3.0](https://github.com/mjancarik/esmj-monitor/compare/v0.2.0...v0.3.0) (2023-01-19)


### Features

* 🎸 increase default limit and add new size property ([2527f25](https://github.com/mjancarik/esmj-monitor/commit/2527f25edd2493fc10b6de0bc4a3866881f5710b))



# [0.2.0](https://github.com/mjancarik/esmj-monitor/compare/v0.1.1...v0.2.0) (2022-12-04)


### Features

* 🎸 add metrics history ([1e321c2](https://github.com/mjancarik/esmj-monitor/commit/1e321c22d857ba4ea072c28cd2236ff840c18adc))



## [0.1.1](https://github.com/mjancarik/esmj-monitor/compare/v0.1.0...v0.1.1) (2022-11-17)



# [0.1.0](https://github.com/mjancarik/esmj-monitor/compare/v0.0.5...v0.1.0) (2022-11-17)


### Features

* 🎸 add metrics history for calculating percentile ([958992f](https://github.com/mjancarik/esmj-monitor/commit/958992f36878eb153d10dd5a7a20fc453b930ea5))



## [0.0.5](https://github.com/mjancarik/esmj-monitor/compare/v0.0.4...v0.0.5) (2022-09-09)


### Bug Fixes

* 🐛 monitor stop method clear interval ([3caf06d](https://github.com/mjancarik/esmj-monitor/commit/3caf06dd916249fa62506c12e5287f85b7a1c7b1))



## [0.0.4](https://github.com/mjancarik/esmj-monitor/compare/v0.0.3...v0.0.4) (2022-09-09)



## [0.0.3](https://github.com/mjancarik/esmj-monitor/compare/v0.0.2...v0.0.3) (2022-09-09)


### Features

* 🎸 add process metric ([4c6cb06](https://github.com/mjancarik/esmj-monitor/commit/4c6cb0651d6f3fefeb777dd84456ebce6e542ab0))



## 0.0.2 (2022-09-07)


### Bug Fixes

* 🐛 impoert path ([9307457](https://github.com/mjancarik/esmj-monitor/commit/930745799d06fcb12c79f7a173b5b88d207ecdaf))


### Features

* 🎸 init commit ([26b8ef7](https://github.com/mjancarik/esmj-monitor/commit/26b8ef73e8fc0358b17fb5f01dc44ef76ede165f))



