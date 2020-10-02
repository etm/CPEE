# CPEE Features
* The engine itself is a RESTful web service for simple integration into
  websites and existing information systems.
* Instances can be created, started, stopped, and modified through simple HTTP
  calls.
* Instances can be serialized and migrated between multiples nodes to ensure scalability.
* Every aspect of execution is exposed through an event / subscription based
  model.
* It allows external RESTful plugins to control the execution, by voting for
  activity execution (start, finish activity) and state changes (stop, start
  engine).
* It provides better coverage of workflow patterns compared to Oracle BPELPM,
  jBOSS jBPM, and Apache Ode.

# CPEE Technical Details
* Reuses an existing virtual machine for executing control flow
* Supports BPEL and other languages through transformation to a directly
  executable DSL.
* The engine (named WEEL and available as a separate package) has a core size
  of ~ 1110 LOC.
* Each instance runs in its own OS process, can be seperately monitored and killed.
* Uses ~ 50 MiB of RAM per instance (depending on storage backend and data
  available in instance)
* Can utilize multiple threads per instance.
* Can be restarted in while instances are running.

# CPEE Applied Benefits
* Interprocess Synchronization as a Service
* Service Replacement (Repair) Service
* Plain HTML & JavaScript instance editor that allows to modify all aspects of
  (running) process instances.
