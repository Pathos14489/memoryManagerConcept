export class Chunk {
    constructor(memory, string){
        this.memory = memory;
        this.string = string;
        this.createdAt = Date.now();
    }
}