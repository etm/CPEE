* run is copied into every instance.
* opts.yaml is written on each start.
* instance.rb is written on each start.

## What can you do to make it more robust?

Replace run with a program that actually compiles and runs instance.rb.  Of
courses the transformation_* xslts would have to be adapted to create suitable
code. The compiled executable would just need to behave the same as the instance.rb,
dispersing all the same events through redis.

More suitable languages would be crystal and javascript, c++. Less suitable,
but doable, would be python, C. I.e., all languages that do not support multi-line
lambdas would produce much less readable code, thus the "Description" tab in
the cockpit would be garbage.

Definitely do tell me if you are interessted in doing something like this ;-)
