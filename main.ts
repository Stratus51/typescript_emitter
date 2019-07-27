// Basic types
export type Constructor<T extends unknown[], A = object> = new (
    ...args: T
) => A;
export type Subscriber<T, U> = (packet: T) => U;

// Generic emitter definition
export interface IEmitter<T> {
    sub: (subscriber: Subscriber<T, void>) => IEmitter<T>;
    unsub: (subscriber: Subscriber<T, void>) => boolean;
    pub: (packet: T) => IEmitter<T>;
}

export abstract class Emitter<T> implements IEmitter<T> {
    abstract sub(subscriber: Subscriber<T, void>): Emitter<T>;
    abstract unsub(subscriber: Subscriber<T, void>): boolean;
    abstract pub(packet: T): Emitter<T>;

    filter(accept: (packet: T) => boolean) {
        const ret = this.new_emitter<T>();
        this.sub((packet) => {
            if (accept(packet)) {
                ret.pub(packet);
            }
        });
        return ret;
    }
    map<U>(convert: (packet: T) => U) {
        const ret = this.new_emitter<U>();
        this.sub((packet) => ret.pub(convert(packet)));
        return ret;
    }
    relay(source: Emitter<T>) {
        source.sub((packet) => this.pub(packet));
        return this;
    }

    raw_sub_until<U>(
        condition: (packet: T) => U | undefined,
        end_callback: (result: U | undefined) => void,
        timeout?: number,
    ): void {
        let timer: NodeJS.Timer | undefined;
        const wrapper = (packet: T) => {
            const res = condition(packet);
            if (typeof res !== "undefined") {
                unsub(res);
            }
        };
        const unsub = (result?: U) => {
            this.unsub(wrapper);
            if (typeof timer !== "undefined") {
                clearTimeout(timer);
            }
            end_callback(result);
        };
        this.sub(wrapper);
        if (typeof timeout === "number") {
            timer = setTimeout(() => unsub(), timeout);
        }
    }

    sub_until<U>(
        condition: (packet: T) => U | undefined,
        timeout?: number,
    ): Promise<U | undefined> {
        return new Promise((resolve) =>
            this.raw_sub_until(condition, resolve, timeout),
        );
    }
    protected abstract new_emitter<U>(): Emitter<U>;
}

// Specific emitter definition
export class ImmediateEmitter<T> extends Emitter<T> {
    subscribers: Array<Subscriber<T, void>> = [];
    sub(subscriber: Subscriber<T, void>) {
        this.subscribers.push(subscriber);
        return this;
    }
    unsub(subscriber: Subscriber<T, void>): boolean {
        const initial_length = this.subscribers.length;
        this.subscribers = this.subscribers.filter((s) => s !== subscriber);
        return initial_length !== this.subscribers.length;
    }
    pub(packet: T) {
        this.subscribers.forEach((s) => s(packet));
        return this;
    }
    protected new_emitter<U>() {
        return new ImmediateEmitter<U>();
    }
}

export class AsynchronousEmitter<T> extends Emitter<T> {
    subscribers: Array<Subscriber<T, void>> = [];
    sub(subscriber: Subscriber<T, void>) {
        this.subscribers.push(subscriber);
        return this;
    }
    unsub(subscriber: Subscriber<T, void>): boolean {
        const initial_length = this.subscribers.length;
        this.subscribers = this.subscribers.filter((s) => s !== subscriber);
        return initial_length !== this.subscribers.length;
    }
    pub(packet: T) {
        process.nextTick(() => this.subscribers.forEach((s) => s(packet)));
        return this;
    }
    protected new_emitter<U>() {
        return new AsynchronousEmitter<U>();
    }
}
