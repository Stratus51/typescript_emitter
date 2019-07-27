[![Build Status](https://travis-ci.com/Stratus51/typescript_emitter.svg?branch=master)](https://travis-ci.com/Stratus51/typescript_emitter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40stratus51%2Femitter.svg)](https://badge.fury.io/js/%40stratus51%2Femitter)
[![codecov](https://codecov.io/gh/Stratus51/typescript_emitter/branch/master/graph/badge.svg)](https://codecov.io/gh/Stratus51/typescript_emitter)

Implementation of some Typescript classes representing objects capable of pushing packets to a list of callbacks.
It was primarily designed to handle internal events.

[npm repository](https://www.npmjs.com/package/@stratus51/emitter)

[github repository](https://github.com/Stratus51/typescript_emitter)

[examples](https://github.com/Stratus51/typescript_emitter/tree/master/examples)

Summary
- [Emitters methods](#EmitterMethods)
    - [`.sub(callback: (packet: T) => void): this`](#sub)
    - [`.unsub(callback: (packet: T) => void): boolean`](#unsub)
    - [`.pub(packet: T): this`](#pub)
    - [`.filter(accept: (packet: T) => boolean): Emitter<T>`](#filter)
    - [`.map<U>(convert: (packet: T) => U): Emitter<U>`](#map)
    - [`.relay(source: Emitter<T>): this`](#relay)
    - [`.sub_until<U>(condition: (packet: T) => U | undefined, timeout?: number): Promise<U | undefined>`](#sub_until)
    - [`.raw_sub_until<U>(condition: (packet: T) => U | undefined, end_callback?: (result: U | undefined) => void, timeout?: number): this`](#raw_sub_until)
    - [`.as_callback(): (packet: T) => void`](#as_callback)
- [Available emitters](#Emitters)
    - [ImmediateEmitter](#ImmediateEmitter)
    - [AsynchronousEmitter](#AsynchronousEmitter)

<a name=EmitterMethods>Emitters methods</a>
===============================================================================
Each [concrete emitter class](#Emitters) implements the abstract methods
defined by the abstract class `Emitter<T>`. The `Emitter<T>` class methods are
the ones listed below.

In the typescript version of the library, an emitter can emit only one type of
packet (represented by a generic type `T`) to allow type checking the packets.

### <a name=sub>`.sub(callback: (packet: T) => void): this`</a>
Subscribes a callback to this emitter. The callback will then be called
whenever this emitter emits any packet.

### <a name=unsub>`.unsub(callback: (packet: T) => void): boolean`</a>
Unsubscribes the callback from the emitter. It will no longer be called upon
this emitter's packet emissions.
Returns whether the callback was subscribed or not.

### <a name=pub>`.pub(packet: T): this`</a>
Makes the emitter emit a packet. It will trigger all the callbacks currently
subscribed to the emitter.

### <a name=filter>`.filter(accept: (packet: T) => boolean): Emitter<T>`</a>
Creates a new `Emitter<T>` that will forward the packets of the parent emitter
which match the `accept` condition (`true` means the packets is forwarded).

### <a name=map>`.map<U>(convert: (packet: T) => U): Emitter<U>`</a>
Creates a new `Emitter<U>` that will convert any packet from the parent emitter
into a new type `U` of packet and forward those to its subscribed callbacks.

### <a name=relay>`.relay(source: Emitter<T>): this`</a>
Subscribes to another emitter and relay its packets to our subscribed callbacks.

### <a name=sub_until>`.sub_until<U>(condition: (packet: T) => U | undefined, timeout?: number): Promise<U | undefined>`
Subscribes the `condition` callback to this emitter until it returns any
value that is not `undefined`.
- The `timeout` optional parameter allows the `condition` to be unsubscribed
after `timeout` milliseconds even if it never returned a non `undefined` result.
- The return value is a promise that will resolve when the `condition` is
unsubscribed. If it was due to the `condition` succeeding, the promise
resolves to the result returned by `condition`. Else, on timeout it resolves
to `undefined`.

### <a name=raw_sub_until>`.raw_sub_until<U>(condition: (packet: T) => U | undefined, end_callback?: (U | undefined) => void, timeout?: number): this`
Same as [`sub_until`](#sub_until) but using an optional callback to catch the end of subscription
instead of a promise. This can save memory, would it be required.

### <a name=as_callback>`.as_callback(): (packet: T) => void`</a>
Builds a callback feeding this emitter. The callback is built on the first call and then passed to any
subsequent calls.

<a name=Emitters>Available emitters</a>
===============================================================================
<a name=ImmediateEmitter>ImmediateEmitter</a>
-------------------------------------------------------------------------------
Emitter implementation that triggers all the subscribed callbacks during the
[`.pub`](#pub) method call.

<a name=AsynchronousEmitter>AsynchronousEmitter</a>
-------------------------------------------------------------------------------
Emitter implementation that triggers all the subscribed callbacks one tick after
the [`.pub`](#pub) method call (using `process.nextTick()`).
