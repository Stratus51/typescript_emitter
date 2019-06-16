import { expect } from "chai";
import { AsynchronousEmitter, Emitter, ImmediateEmitter } from "./main";

// Types
type EmitterClass<T> = new () => Emitter<T>;
interface IPacketListener<T> {
    received_packets: T[];
    callback: (packet: T) => void;
}
type CheckEmissionDone = <T>(
    emitter: Array<Emitter<T>>,
    listeners: Array<IPacketListener<T>>,
) => Promise<void>;

// Test input data
const numbers = [1, 2, 3, 9, 4, 0, 2, 1];
const strings = numbers.map((n) => String(n));
const booleans = [true, true, false, true, false, false, false];
const objects = numbers.map((n) => ({ n }));
const arrays = numbers.map((n) => [n]);

// Helpers
function build_packet_listener<T>(): IPacketListener<T> {
    const received_packets: T[] = [];
    return {
        received_packets,
        callback: (packet: T) => received_packets.push(packet),
    };
}

function build_emitter_with_subs<T>(
    emitter_class: EmitterClass<T>,
    subs_nb: number,
    skip_subscribing?: boolean,
): [Emitter<T>, Array<IPacketListener<T>>] {
    // Build the emitter
    const emitter = new emitter_class();

    // Build the subscribers
    const subs = [];
    for (let i = 0; i < subs_nb; ++i) {
        subs.push(build_packet_listener<T>());
    }

    // Build the subscribers
    if (!skip_subscribing) {
        subs.forEach((sub) => emitter.sub(sub.callback));
    }

    return [emitter, subs];
}

// Generic tests
function test_emitter_base_requirements<T>(
    emitter_class: EmitterClass<T>,
    packets: T[],
    emission_done?: CheckEmissionDone,
) {
    describe("base methods should succeed", () => {
        it("new_emitter", () => {
            const emitter = new emitter_class();
            const ret = emitter.new_emitter();
            expect(ret, "should return a new emitter").to.not.equal(emitter);
        });
        it("sub", () => {
            const emitter = new emitter_class();
            const ret = emitter.sub(() => {
                return;
            });
            expect(ret, "should return the emitter").to.equal(emitter);
        });
        it("unsub", () => {
            const emitter = new emitter_class();
            const ret = emitter.unsub(() => {
                return;
            });
            expect(
                ret,
                "should return false when subscriber was not subscribed",
            ).to.equal(false);
        });
        it("emit", () => {
            const emitter = new emitter_class();
            const ret = emitter.emit(packets[0]);
            expect(ret, "should return the emitter").to.equal(emitter);
        });
    });

    function simple_packet_forwarding(fwd_packets: T[], subs_nb: number) {
        it(
            "should successfully send " +
                fwd_packets.length +
                " packets to " +
                subs_nb +
                " subscribers.",
            async () => {
                // Build emitter with its subs
                const [emitter, subs] = build_emitter_with_subs(
                    emitter_class,
                    subs_nb,
                );

                // Emit the packets
                fwd_packets.forEach((packet) => emitter.emit(packet));

                // Wait for propagation if necessary
                if (emission_done) {
                    await emission_done([emitter], subs);
                }

                // Check the received packets
                subs.forEach((sub, i) =>
                    expect(
                        sub.received_packets,
                        "Listener " +
                            i +
                            " did not receive the correct packets.",
                    ).to.deep.equal(fwd_packets),
                );
            },
        );
    }

    describe("simple packet forwarding", () => {
        const packet_bundles = [[], [packets[0]], packets];
        const subs_numbers = [0, 1, 2, 10];
        packet_bundles.forEach((fwd_packets) => {
            subs_numbers.forEach((subs_nb) =>
                simple_packet_forwarding(fwd_packets, subs_nb),
            );
        });
    });

    describe("complex packet forwarding", () => {
        it("unsub should exclude subscribers", async () => {
            const unsub_i = [2, 3, 5, 7];
            // Build emitter with its subs
            const [emitter, subs] = build_emitter_with_subs(emitter_class, 10);

            // Separate subscribers from unsubscribers
            const unsubs = subs.filter((_, i) => unsub_i.includes(i));
            const real_subs = subs.filter((_, i) => !unsub_i.includes(i));

            // Unsubscribe wanted subscribers
            unsubs.forEach((sub) =>
                expect(
                    emitter.unsub(sub.callback),
                    "Bad response to valid unsubscribe",
                ).to.equal(true),
            );

            // Emit the packets
            packets.forEach((packet) => emitter.emit(packet));

            // Wait for propagation if necessary
            if (emission_done) {
                await emission_done([emitter], subs);
            }

            // Check the received packets
            real_subs.forEach((sub, i) =>
                expect(
                    sub.received_packets,
                    "Listener " + i + " did not receive the correct packets.",
                ).to.deep.equal(packets),
            );
            unsubs.forEach((sub, i) =>
                expect(
                    sub.received_packets,
                    "Listener " + i + " should not have received packets.",
                ).to.deep.equal([]),
            );
        });

        const NB_CHANNELS = 5;
        const SUBS_NB = 3;
        it("should not mix multiple emitters", async () => {
            // Build channels
            const channels: Array<{
                emitter: Emitter<T>;
                subs: Array<IPacketListener<T>>;
            }> = [];
            for (let i = 0; i < 5; ++i) {
                const [emitter, subs] = build_emitter_with_subs(
                    emitter_class,
                    SUBS_NB,
                );
                channels.push({ emitter, subs });
            }

            // Build shifted lists for each emitters
            const packet_lists = channels.map((_, i) => {
                const offset = i * Math.floor(packets.length / NB_CHANNELS);
                return packets.slice(offset).concat(packets.slice(0, offset));
            });

            // Emit packets
            packets.forEach((_, packet_i) =>
                channels.forEach(({ emitter }, channel_i) =>
                    emitter.emit(packet_lists[channel_i][packet_i]),
                ),
            );

            // Wait for propagation if necessary
            if (emission_done) {
                for (const { emitter, subs } of channels) {
                    await emission_done([emitter], subs);
                }
            }

            // Check the received packets
            channels.forEach(({ subs }, channel_i) =>
                subs.forEach((sub, sub_i) =>
                    expect(
                        sub.received_packets,
                        "Channel " +
                            channel_i +
                            ": Listener " +
                            sub_i +
                            " did not receive the correct packets.",
                    ).to.deep.equal(packet_lists[channel_i]),
                ),
            );
        });
    });
}

function test_emitter_complex_methods<T>(
    emitter_class: EmitterClass<T>,
    packets: T[],
    emission_done?: CheckEmissionDone,
) {
    it("map", async () => {
        // Create emitter and listener
        const emitter = new emitter_class();
        const listener = build_packet_listener<{ data: T }>();

        const mapped_emitter = emitter
            .map((data) => ({ data }))
            .sub(listener.callback);

        // Emit packets
        packets.forEach((packet) => emitter.emit(packet));

        // Wait for propagation if necessary
        if (emission_done) {
            await emission_done([mapped_emitter], [listener]);
        }

        // Check the received packets
        expect(
            listener.received_packets,
            "Listener did not receive the correct packets.",
        ).to.deep.equal(packets.map((data) => ({ data })));
    });

    it("relay", async () => {
        // Create emitter and listener
        const emitter = new emitter_class();
        const second_emitter = new emitter_class();
        const listener = build_packet_listener<T>();

        // Forward packets to second emitter
        second_emitter.relay(emitter).sub(listener.callback);

        // Emit packets
        packets.forEach((packet) => emitter.emit(packet));

        // Wait for propagation if necessary
        if (emission_done) {
            await emission_done([emitter, second_emitter], [listener]);
        }

        // Check the received packets
        expect(
            listener.received_packets,
            "Listener did not receive the correct packets.",
        ).to.deep.equal(packets);
    });

    it("filter", async () => {
        // Create emitter and listener
        const emitter = new emitter_class();
        const listener = build_packet_listener<T>();

        // Filter function
        function build_filter() {
            let pass = true;
            return () => (pass = !pass) && pass;
        }

        // Filter packets
        const filter = emitter.filter(build_filter()).sub(listener.callback);

        // Emit packets
        packets.forEach((packet) => emitter.emit(packet));

        // Wait for propagation if necessary
        if (emission_done) {
            await emission_done([emitter, filter], [listener]);
        }

        // Check the received packets
        expect(
            listener.received_packets,
            "Listener did not receive the correct packets.",
        ).to.deep.equal(packets.filter(build_filter()));
    });

    it("sub_until", async () => {
        // Create emitter and listener
        const emitter = new emitter_class();
        const listener = build_packet_listener<T>();

        // Subscribe temporarily
        let i = 0;
        const limit = Math.floor((packets.length + 1) / 2);
        const pres = emitter.sub_until((packet) => {
            listener.callback(packet);
            if (++i >= limit) {
                return { abc: 5 };
            }
            return;
        });

        // Emit packets
        packets.forEach((packet) => emitter.emit(packet));

        // Wait for propagation if necessary
        if (emission_done) {
            await emission_done([emitter], [listener]);
        }
        const res = await pres;

        // Check the received packets
        expect(
            listener.received_packets,
            "Listener did not receive the correct packets.",
        ).to.deep.equal(packets.slice(0, limit));
        expect(res).to.deep.equal({ abc: 5 });
    });

    it("sub_until timeout", async () => {
        // Create emitter and listener
        const emitter = new emitter_class();
        const listener = build_packet_listener<T>();

        // Subscribe temporarily
        let i = 0;
        const limit = Math.floor((packets.length + 1) / 2);
        const pres = emitter.sub_until((packet) => {
            listener.callback(packet);
            if (++i >= limit) {
                return true;
            }
            return;
        }, 1000);

        // Emit a single packet
        emitter.emit(packets[0]);

        // Wait for timeout
        const res = await pres;

        // Emit packets
        packets.forEach((packet) => emitter.emit(packet));

        // Wait for propagation if necessary
        if (emission_done) {
            await emission_done([emitter], [listener]);
        }

        // Check the received packets
        expect(
            listener.received_packets,
            "Listener did not receive the correct packets.",
        ).to.deep.equal(packets.slice(0, 1));
        expect(res).to.equal(undefined);
    });
}

function test_emitter_with_data<T>(
    emitter_class: EmitterClass<T>,
    packets: T[],
    emission_done?: CheckEmissionDone,
) {
    describe("base", () =>
        test_emitter_base_requirements(emitter_class, packets, emission_done));
    describe("complex", () =>
        test_emitter_complex_methods(emitter_class, packets, emission_done));
}

// Test listing
type GenericEmitterClass = new <T>() => Emitter<T>;
function test_emitter(
    class_name: string,
    emitter_class: GenericEmitterClass,
    emission_done?: CheckEmissionDone,
) {
    function test<T>(name: string, data: T[]) {
        describe(name, () =>
            test_emitter_with_data<T>(emitter_class, data, emission_done),
        );
    }
    describe(class_name, () => {
        test("numbers", numbers);
        test("strings", strings);
        test("booleans", booleans);
        test("objects", objects);
        test("arrays", arrays);
    });
}
test_emitter("ImmediateEmitter", ImmediateEmitter);
test_emitter(
    "AsynchronousEmitter",
    AsynchronousEmitter,
    (_, listeners) =>
        new Promise((resolve) => {
            const listeners_sizes: number[] = [];
            function check_done() {
                let changed = false;
                for (let i = 0; i < listeners.length; ++i) {
                    if (
                        listeners[i].received_packets.length !==
                        listeners_sizes[i]
                    ) {
                        listeners_sizes[i] =
                            listeners[i].received_packets.length;
                        changed = true;
                    }
                }
                if (changed) {
                    process.nextTick(check_done);
                } else {
                    resolve();
                }
            }
            check_done();
        }),
);
