import { Memory } from "./Memory.js";
export class MemoryManager{
    memories = [];
    memorySize = 25;
    bestGuess = false
    bestGuessOf = 100
    constructor(options){
        if(options?.memorySize){
            this.memorySize = options.memorySize;
        }
        if(options?.memories){
            options.memories.forEach(memory => {
                this.memories.push(memory);
            })
        }
        if(this.memories.length == 0){
            this.newMemory();
        }
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
}