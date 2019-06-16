import { ImmediateEmitter as Emitter } from "../main";

const emitter = new Emitter();

emitter.sub_until((n) => {
    console.log("Receiving", n);
    if (n === 4) {
        return true;
    }
    return;
});

for (let i = 0; i < 10; ++i) {
    console.log("Emitting", i);
    emitter.emit(i);
}
