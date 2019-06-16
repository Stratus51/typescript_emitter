import { ImmediateEmitter as Emitter } from "../main";

const emitter = new Emitter<string>();
emitter.sub(console.log);

for (let i = 0; i < 10; ++i) {
    emitter.emit("Packet " + i);
}
