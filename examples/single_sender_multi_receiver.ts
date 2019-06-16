import { ImmediateEmitter as Emitter } from "../main";

const emitter = new Emitter<string>();

// Creating and subscribing 3 receivers
const receivers = [];
for (let i = 0; i < 3; ++i) {
    receivers.push((msg: string) => console.log("Receiver " + i + ":", msg));
}
receivers.forEach((receiver) => emitter.sub(receiver));

// Emitting packets
console.log("Emitting 5 packets");
for (let i = 0; i < 5; ++i) {
    emitter.emit("Packet " + i);
}

// Unsubscribing part of the receivers
console.log("Unsubscribing all receivers but one");
for (let i = 1; i < receivers.length; ++i) {
    emitter.unsub(receivers[i]);
}

// Emitting packets
console.log("Emitting 5 packets");
for (let i = 0; i < 5; ++i) {
    emitter.emit("Packet " + i);
}
