import { ImmediateEmitter as Emitter } from "../main";

const emitter = new Emitter<number>();

emitter.filter((n) => n % 2 === 0).sub((p) => console.log("Receiving", p));

for (let i = 0; i < 10; ++i) {
    console.log("Emitting", i);
    emitter.pub(i);
}
