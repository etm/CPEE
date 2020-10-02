All code in this package is provided under the LGPL-3 license.
Please read the file COPYING in the main directory.

Tested for MRI 2.6, 2.7

Searching for mem-leaks:
  valgrind --num-callers=50 --error-limit=no --partial-loads-ok=yes --undef-value-errors=no ./server/server.rb -v start
