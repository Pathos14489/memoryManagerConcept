export class Chunk {
    constructor(memory, string, createdAt = Date.now()) {
        this.memory = memory;
        this.string = string;
        this.createdAt = Date.now();
    }
    get export(){
        return {
            string: this.string,
            createdAt: this.createdAt
        }
    }
}