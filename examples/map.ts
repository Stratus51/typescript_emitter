import { ImmediateEmitter as Emitter } from "../main";

const emitter = new Emitter<number>();

emitter.map((n) => ({ n })).sub((p) => console.log("Receiving", p));

for (let i = 0; i < 10; ++i) {
    console.log("Emitting", i);
    emitter.pub(i);
}
