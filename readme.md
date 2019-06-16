[![Build Status](https://travis-ci.com/Stratus51/typescript_emitter.svg?branch=master)](https://travis-ci.com/Stratus51/typescript_emitter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40stratus51%2Femitter.svg)](https://badge.fury.io/js/%40stratus51%2Femitter)
[![codecov](https://codecov.io/gh/Stratus51/typescript_emitter/branch/master/graph/badge.svg)](https://codecov.io/gh/Stratus51/typescript_emitter)

Implementation of a Typescript class representing an object capable of pushing packets to a list of callbacks.
It was designed mainly to handle easily typed events.

[npm repository](https://www.npmjs.com/package/@stratus51/emitter)

[github repository](https://github.com/Stratus51/typescript_emitter)

[examples](https://github.com/Stratus51/typescript_emitter/tree/master/examples)

Summary
- [Emitters methods](#EmitterMethods)
    - [`.sub(callback: (packet: T) => void): this`](#sub)
    - [`.unsub(callback: (packet: T) => void): boolean`](#unsub)
    - [`.emit(packet: T): this`](#emit)
    - [`.filter(accept: (packet: T) => boolean): Emitter<T>`](#filter)
    - [`.map<U>(convert: (packet: T) => U): Emitter<U>`](#map)
    - [`.relay(source: Emitter<T>): this`](#relay)
    - [`.sub_until<U>(condition: (packet: T) => U | undefined, timeout?: number, end_callback: (result?: U) => void) => boolean)`](#sub_until)
- [Available emitters](#Emitters)
    - [ImmediateEmitter](#ImmediateEmitter)
    - [AsynchronousEmitter](#AsynchronousEmitter)

<a name=EmitterMethods>Emitters methods</a>
===============================================================================
There is no instanciable Emitter class in this package. Instead there are 2
[emitters](#Emitters) implementing the same methods which are listed here.

In typescript, an emitter can emit only one type of packets (represented by a
generic type `T`) to allow type checking.

### <a name=sub>`.sub(callback: (packet: T) => void): this`</a>
Subscribes a callback to this emitter. The callback will then be called
whenever this emitter emits any packet.

### <a name=unsub>`.unsub(callback: (packet: T) => void): boolean`</a>
Unsubscribes the callback from the emitter. It will no longer be called upon
the emitter packet emissions.
Return whether the callback was subscribed or not.

### <a name=emit>`.emit(packet: T): this`</a>
Emits a packet to all the callbacks subscribed to the emitter.

### <a name=filter>`.filter(accept: (packet: T) => boolean): Emitter<T>`</a>
Creates a new Emitter that will forward the packets of the parent emitter which
make the `accept` callback return `true`.

### <a name=map>`.map<U>(convert: (packet: T) => U): Emitter<U>`</a>
Creates a new Emitter that will convert any packet from the parent emitter into
a new type of packet and forward those to its subscribed callbacks.

### <a name=relay>`.relay(source: Emitter<T>): this`</a>
Subscribe to another emitter and relay its packets to our subscribes callbacks.

### <a name=sub_until>`.sub_until<U>(condition: (packet: T) => U | undefined, timeout?: number, end_callback: (result?: U) => void) => boolean)`
Subscribes a the `condition` callback to this emitter until it returns any
value that is not `undefined`.
- The `timeout` optional parameter allows the `condition` to be unsubscribed
after `timeout` seconds even if it never returned non `undefined` result.
- The `end_callback` optional callback will be called upon unsubscription of
the `condition` callback. If the unsubscription occured due to the `condition`
succeeding, the `end_callback` will be given the resulting value. If the
unsubscription was triggered by a timeout the `result` will be `undefined`.

<a name=Emitters>Available emitters</a>
===============================================================================
<a name=ImmediateEmitter>ImmediateEmitter</a>
-------------------------------------------------------------------------------
Emitter implementation that trigger all the subscribed callbacks during the
[`.emit`](#emit) method call.

<a name=AsynchronousEmitter>AsynchronousEmitter</a>
-------------------------------------------------------------------------------
Emitter implementation that trigger all the subscribed callbacks one tick after
the [`.emit`](#emit) method call.
