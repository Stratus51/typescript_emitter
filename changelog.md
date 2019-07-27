2.0.0
==========================================================================================
Breaking changes:
------------------------------------------------------------------------------------------
- `emitter.emit` method renamed `emitter.pub` method to be consistent with the `emitter.sub`
method.

Features:
------------------------------------------------------------------------------------------
- Add `emitter.raw_sub_until` method allowing to catch the end of subscribtion with an
optional callback instead of a costly promise.
- Add `emitter.as_callback` method building a callback feeding the emitter.

Fixes:
------------------------------------------------------------------------------------------
- Updated dev dependencies to remove a vulnerability (deemed high by github).
