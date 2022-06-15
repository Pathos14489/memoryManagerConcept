export class Chunk {
    constructor(memory, string, meta, createdAt = Date.now()) {
        this.memory = memory;
        this.string = string;
        this.meta = meta;
        this.createdAt = Date.now();
    }
    get export(){
        return {
            string: this.string,
            meta: this.meta,
            createdAt: this.createdAt
        }
    }
}