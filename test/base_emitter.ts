import { expect } from "chai";
import { AsynchronousEmitter, Emitter, ImmediateEmitter } from "../main";

// Types
type EmitterClass<T> = new () => Emitter<T>;
interface IPacketListener<T> {
    received_packets: T[];
    callback: (packet: T) => void;
}

// Test input data
const numbers = [1, 2, 3, 9, 4, 0, 2, 1];
const strings = numbers.map((n) => String(n));
const booleans = [true, true, false, true, false, false, false, true];
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
            () => {
                // Build emitter with its subs
                const [emitter, subs] = build_emitter_with_subs(
                    emitter_class,
                    subs_nb,
                );

                // Emit the packets
                fwd_packets.forEach((packet) => emitter.emit(packet));

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

    it("unsub should exclude subscribers", () => {
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

    describe("multiple emitters", () => {});
}

function test_emitter_complex_methods<T>(
    emitter_class: EmitterClass<T>,
    packets: T[],
) {}

function test_emitter_with_data<T>(
    emitter_class: EmitterClass<T>,
    packets: T[],
) {
    describe("base", () =>
        test_emitter_base_requirements(emitter_class, packets));
    describe("complex", () =>
        test_emitter_complex_methods(emitter_class, packets));
}

// Test listing
type GenericEmitterClass = new <T>() => Emitter<T>;
function test_emitter(class_name: string, emitter_class: GenericEmitterClass) {
    describe(class_name, () => {
        describe("numbers", () =>
            test_emitter_with_data(emitter_class, numbers));
        describe("strings", () =>
            test_emitter_with_data(emitter_class, strings));
        describe("booleans", () =>
            test_emitter_with_data(emitter_class, booleans));
        describe("objects", () =>
            test_emitter_with_data(emitter_class, objects));
        describe("arrays", () => test_emitter_with_data(emitter_class, arrays));
    });
}
test_emitter("ImmediateEmitter", ImmediateEmitter);
test_emitter("AsynchronousEmitter", AsynchronousEmitter);
