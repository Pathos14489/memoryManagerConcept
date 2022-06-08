import { Chunk } from "./Chunk.js";
import got from "got";
import FormData from 'form-data';
import { apiURL } from "../index.js";
export class Memory{
    createdAt = Date.now()
    chunks = []
    comparisonCache = {};
    constructor(manager,options){
        this.manager = manager;
        if(options){
            // console.log("Memory:",options.createdAt);
            if(options.createdAt){
                this.createdAt = options.createdAt;
            }
            if(options.chunks){
                options.chunks.forEach(chunk => {
                    this.chunks.push(new Chunk(this,chunk.string,chunk.createdAt));
                })
                console.log(`Loaded ${this.chunks.length} chunks`);
            }
            if(options.cache){
                console.log(`Loading cache for memory ${this.index}`);
                this.comparisonCache = JSON.parse(options.cache);
                console.log(`Loaded ${this.comparisonCache.length} cached results`);
            }
        }
    }
    get lastChunk(){
        return this.chunks[this.chunks.length - 1];
    }
    get index(){
        return this.manager.memories.indexOf(this);
    }
    newChunk(string){
        if(string.replace(/\s/g, '').length > 0){
            if(this.manager.memorySize > this.chunks.length || this.manager.memorySize == 0){
                this.chunks.push(new Chunk(this, string));
            }else{
                var newMem = this.manager.newMemory();
                newMem.newChunk(string);
            }
        }else{
            console.log("Ignoring empty chunk");
        }
    }
    async compare(string){
        // console.log(string);
        var form = new FormData();
        form.append('input', string);
        form.append('references', this.chunks.map(chunk => chunk.string).join('|'));
        var result = null
        // console.log(this.comparisonCache);
        if(this.comparisonCache[string]){
            if(this.comparisonCache[string].chunkCount == this.chunks.length){
                // console.log(`Using cached result for ${string}`);
                result = this.comparisonCache[string].result;
            }else{
                // console.log(`Updating cache for ${string}`);
                var response = await got(apiURL + "similarity", {
                    method: "POST",
                    body: form
                });
                result = JSON.parse(response.body);
            }
        }else{
            // console.log(`No cached result for ${string}`);
            var response = await got(apiURL + "similarity", {
                method: "POST",
                body: form
            });
            result = JSON.parse(response.body);
        }
        this.chunks.forEach((chunk,i) => {
            result[i].memory = this.index;
        })
        this.comparisonCache[string] = {
            chunkCount: this.chunks.length,
            result: result,
            string: string
        }
        // console.log(result);
        return result;
    }
    async getSimilarity(string){
        var result = await this.compare(string);
        var score = 0;
        result.forEach(similarity => {
            score += similarity.embedding
        })
        score = score/result.length
        console.log(`${this.index}|${score}|${string}`);
        return {
            score: score,
            embedding: result
        };
    }
    get export(){
        return {
            createdAt: this.createdAt,
            chunks: this.chunks.map(chunk => chunk.export),
            cache: JSON.stringify(this.comparisonCache)
        }
    }
}