# CPEE component default ports

Default listening port for each `cpee*` service, as configured in its
daemon script (`server/<name>`, or overridden by a `.conf` file.
Sorted numerically.

| Port | Component | Notes |
|------|-----------|-------|
| 8080 | cpee (client tool) | `tools/cpee` default target, not a listening port |
| 9294 | cpee-overlay | |
| 9295 | cpee-transformation | |
| 9296 | cpee-instantiation | |
| 9297 | cpee-script-ruby | |
| 9298 | cpee (engine) | `tools/server/cpee`, `contrib/dev.rb` |
| 9298 | cpeeui | **collides with cpee (engine)** |
| 9299 | cpee-logging-xes-yaml | |
| 9301 | cpee (examples) | `examples/async/async.rb`, not the main engine |
| 9302 | cpee-eval-ruby | |
| 9303 | cpee-resources | |
| 9304 | cpee-dstore | |
| 9305 | cpee-llm | |
| 9310 | cpee-llm-documents | forwards to cpee-llm's `/generic/` (9305) by default |
| 9311 | cpee-correlator-message | |
| 9312 | cpee-correlator-sync | |
| 9313 | cpee-complex-rest | |
| 9316 | cpee-model-management | |
| 9317 | cpee-model-management (dashing) | `lib/cpee-model-management/dashing.rb` dashboard |
| 9318 | cpee-history | |
| 9326 | cpee-light | |
| 9339 | cpee-digital-twin-containers | |
| 9350 | cpee-mqtt-op | |
| 9351 | cpee-testing-framework | |
| 9352 | cpee-logging-experiments | shared by all four experiment scripts (azure.rb, elasticsearch.rb, non_tamp.rb, xes_xml.rb) — old, unmaintained, not meant to run concurrently |
| 9398 | cpee-worklist | |
| 9399 | cpee-replay | |
