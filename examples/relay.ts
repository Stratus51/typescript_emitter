import { ImmediateEmitter as Emitter } from "../main";

const emitter = new Emitter();
const emitter2 = new Emitter();

emitter2.relay(emitter);
emitter2.sub((p) => console.log("Receiving", p));

for (let i = 0; i < 10; ++i) {
    console.log("Emitting", i);
    emitter.emit(i);
}
