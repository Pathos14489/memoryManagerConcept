import { MemoryManager } from "./MemoryManager.js";
import fs from "fs";
export class Brain{
    memorySize = 25;
    bestGuess = false;
    bestGuessOf = 100;
    managers = [];
    constructor(options){
        if(options){
            if(options?.memorySize){
                this.memorySize = options.memorySize || this.memorySize;
            }
            if(options?.bestGuess){
                this.bestGuess = options.bestGuess || this.bestGuess;
            }
            if(options?.bestGuessOf){
                this.bestGuessOf = options.bestGuessOf || this.bestGuessOf;
            }
            if(options?.managers){
                this.managers = options.managers.map(manager => new MemoryManager(this,manager));
            }
        }
    }
    get export(){
        return {
            memorySize: this.memorySize,
            bestGuess: this.bestGuess,
            bestGuessOf: this.bestGuessOf,
            managers: this.managers.map(manager => manager.export)
        }
    }
    async save(name){
        var data = JSON.stringify(this.export);
        fs.writeFileSync(name, data);
    }
    async load(name){
        var data = fs.readFileSync(name);
        var options = JSON.parse(data);
        if(options?.memorySize){
            this.memorySize = options.memorySize || this.memorySize;
        }
        if(options?.bestGuess){
            this.bestGuess = options.bestGuess || this.bestGuess;
        }
        if(options?.bestGuessOf){
            this.bestGuessOf = options.bestGuessOf || this.bestGuessOf;
        }
        if(options?.managers){
            console.log(`Importing ${options.managers.length} managers, each with a default memory size of ${options.memorySize}, and a best guess of ${options.bestGuessOf}, and a best guess of ${options.bestGuess}`);
            this.managers = options.managers.map(manager => new MemoryManager(this,manager));
        }
    }
    get memories(){
        return this.managers.map(manager => manager.memories).flat();
    }
    get chunks(){
        return this.managers.map(manager => manager.chunks).flat();
    }
    getContext(amount = 3,managerID = "none"){
        console.log(`Getting ${amount} memories from ${managerID}`);
        // for amount of memories(until out of memories), get the context of the last amount memoies and return it as a combined string
        var mems = []
        if(managerID != "none"){
            console.log("Getting from specific manager");
            var manager = this.managers.find(manager => manager.id == managerID);
            console.log(manager);
            if(manager){
                console.log("Manager found");
                var memories = manager.memories;
            }else{
                console.log("Manager not found");
                var memories = [];
            }
        }else{
            console.log("Getting from all managers");
            var memories = this.memories;
        }
        for(var i = 0; i < amount; i++){
            if(memories[i]){
                mems.push(memories[(memories.length-1)-i])
            }
        }
        mems.reverse()
        return mems;
    }
    newManager(id){
        var manager = new MemoryManager(this,{
            id,
            memorySize: this.memorySize,
            bestGuess: this.bestGuess,
            bestGuessOf: this.bestGuessOf
        });
        this.managers.push(manager);
        return manager;
    }
    getManager(id){
        var manager = this.managers.find(manager => manager.id == id);
        if(manager){
            return manager;
        }else{
            return this.newManager(id);
        }
    }
    newChunk(chunk,managerID,meta = {}){
        meta.neuron = managerID;
        var manager = this.getManager(managerID);
        manager.newChunk(chunk,meta);
    }
    findChunkByMeta(prop,meta){
        console.log(`Brain.findChunkByMeta(${prop},${meta})`);
        var results = []
        this.managers.forEach(manager => {
            var manResults = manager.findChunkByMeta(prop,meta)
            if(manResults != null){
                console.log(manResults);
                results.push(manResults);
            }
        })
        return results.flat();
    }
    async getEmbedding(string,sort = "oldest",bestGuess = null){ // oldest, newest, random
        console.log(`Brain.getEmbedding(${string},${sort},${bestGuess}) across ${this.managers.length} managers`);
        var results = []
        for(var i = 0; i < this.managers.length; i++){
            var manager = this.managers[i];
            var managerResults = await manager.getEmbedding(string,sort,bestGuess);
            if(managerResults != null){
                results.push(managerResults);
            }
        }
        var results2 = results.map(result => {
            return result.scores[0]
        });
        results2 = results2.sort((a,b) => {
            return b.score - a.score;
        })
        results2 = results2.flat();
        console.log(results2);
        results.sort((a,b) => {
            return b.top - a.top;
        })
        console.log(results);
        console.log(results[0].top);
        var embedding = results[0]
        return embedding;
    }
}