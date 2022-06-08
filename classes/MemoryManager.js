import { Memory } from "./Memory.js";
import fs from "fs";
export class MemoryManager{
    memories = [];
    memorySize = 25;
    bestGuess = false;
    bestGuessOf = 100;
    constructor(options){
        if(options){
            console.log("MemoryManager:",options);
            console.log(`Importing ${options.memories.length} memories, with a memory size of ${options.memorySize}, and a best guess of ${options.bestGuessOf}, and a best guess of ${options.bestGuess}`);
            if(options?.memorySize){
                this.memorySize = options.memorySize || this.memorySize;
            }
            if(options?.bestGuess){
                this.bestGuess = options.bestGuess || this.bestGuess;
            }
            if(options?.bestGuessOf){
                this.bestGuessOf = options.bestGuessOf || this.bestGuessOf;
            }
            if(options?.memories){
                this.memories = options.memories.map(memory => new Memory(this,memory));
            }
        }
        if(this.memories.length == 0){
            this.newMemory();
        }
        console.log("EXPORT",this.export);
    }
    get currentMemory(){
        return this.memories[this.memories.length - 1];
    }
    get lastMemory(){
        return this.memories[this.memories.length - 2];
    }
    newMemory(){
        this.memories.push(new Memory(this));
        return this.currentMemory;
    }
    newChunk(chunk){
        this.currentMemory.newChunk(chunk);
    }
    async getEmbedding(string,sort = "oldest",bestGuess = null){ // oldest, newest, random
        if(bestGuess == null){
            bestGuess = this.bestGuess;
        }
        var scores = [];
        var currentBest = {
            score: 0,
        }
        var currentBestDuration = 1;
        var memories = this.memories
        // randomize the order of the memories
        switch(sort){
            case "random":
                memories = memories.sort(() => Math.random() - 0.5);
                break;
            case "newest":
                memories = memories.sort((a,b) => b.createdAt - a.createdAt);
                break;
            default:
            case "oldest":
                // lol, it's already like this.
                break;
        }
        for(var i = 0; i < memories.length; i++){
            var memory = memories[i];
            scores.push(await memory.getSimilarity(string));
            if(scores[i].score > currentBest.score){
                currentBest = scores[i]
                currentBestDuration = 1
            }else{
                currentBestDuration++;
            }
            console.log(scores[i].score,">",currentBest.score,currentBestDuration);
            if(bestGuess && currentBestDuration > this.bestGuessOf){
                break;
            }
        }
        scores.sort((a, b) => {
            return b.score - a.score;
        });
        return {
            string: string,
            memorySize: this.memorySize,
            bestGuess: bestGuess,
            bestGuessOf: this.bestGuessOf,
            sort: sort,
            scores,
        };
    }
    get export(){
        return {
            memories: this.memories.map(memory => memory.export),
            memorySize: this.memorySize,
            bestGuess: this.bestGuess,
            bestGuessOf: this.bestGuessOf
        }
    }
    async save(name){
        var data = JSON.stringify(this.export);
        fs.writeFileSync(name, data);
    }
    async load(name){
        var data = fs.readFileSync(name);
        var options = JSON.parse(data);
        console.log(`Importing ${options.memories.length} memories, with a memory size of ${options.memorySize}, and a best guess of ${options.bestGuessOf}, and a best guess of ${options.bestGuess}`);
        if(options?.memorySize){
            this.memorySize = options.memorySize || this.memorySize;
        }
        if(options?.bestGuess){
            this.bestGuess = options.bestGuess || this.bestGuess;
        }
        if(options?.bestGuessOf){
            this.bestGuessOf = options.bestGuessOf || this.bestGuessOf;
        }
        if(options?.memories){
            this.memories = options.memories.map(memory => new Memory(this,memory));
        }
        return this
    }
}