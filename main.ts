// Basic types
export type Constructor<T extends unknown[], A = object> = new (
    ...args: T
) => A;
export type Subscriber<T> = (packet: T) => void;

// Generic emitter definition
export interface IEmitter<T> {
    sub: (subscriber: Subscriber<T>) => IEmitter<T>;
    unsub: (subscriber: Subscriber<T>) => boolean;
    emit: (packet: T) => IEmitter<T>;
}

export abstract class Emitter<T> implements IEmitter<T> {
    abstract new_emitter<U>(): Emitter<U>;
    abstract sub(subscriber: Subscriber<T>): Emitter<T>;
    abstract unsub(subscriber: Subscriber<T>): boolean;
    abstract emit(packet: T): Emitter<T>;

    filter(accept: (packet: T) => boolean) {
        const ret = this.new_emitter<T>();
        this.sub((packet) => {
            if (accept(packet)) {
                ret.emit(packet);
            }
        });
        return ret;
    }
    map<U>(convert: (packet: T) => U) {
        const ret = this.new_emitter<U>();
        this.sub((packet) => ret.emit(convert(packet)));
        return ret;
    }
    relay(source: Emitter<T>) {
        source.sub((packet) => this.emit(packet));
        return this;
    }
}

// Specific emitter definition
export class ImmediateEmitter<T> extends Emitter<T> {
    subscribers: Array<Subscriber<T>> = [];
    new_emitter<U>() {
        return new ImmediateEmitter<U>();
    }
    sub(subscriber: Subscriber<T>) {
        this.subscribers.push(subscriber);
        return this;
    }
    unsub(subscriber: Subscriber<T>): boolean {
        const initial_length = this.subscribers.length;
        this.subscribers = this.subscribers.filter((s) => s !== subscriber);
        return initial_length !== this.subscribers.length;
    }
    emit(packet: T) {
        this.subscribers.forEach((s) => s(packet));
        return this;
    }
}

export class AsynchronousEmitter<T> extends Emitter<T> {
    subscribers: Array<Subscriber<T>> = [];
    new_emitter<U>() {
        return new AsynchronousEmitter<U>();
    }
    sub(subscriber: Subscriber<T>) {
        this.subscribers.push(subscriber);
        return this;
    }
    unsub(subscriber: Subscriber<T>): boolean {
        const initial_length = this.subscribers.length;
        this.subscribers = this.subscribers.filter((s) => s !== subscriber);
        return initial_length !== this.subscribers.length;
    }
    emit(packet: T) {
        process.nextTick(() => this.subscribers.forEach((s) => s(packet)));
        return this;
    }
}
