import { Chunk } from "./Chunk.js";
import got from "got";
import FormData from 'form-data';
import { apiURL } from "../index.js";
export class Memory{
    chunks = []
    constructor(manager){
        this.manager = manager;
        this.createdAt = Date.now()
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
    comparisonCache = {};
    async compare(string){
        // console.log(string);
        var form = new FormData();
        form.append('input', string);
        form.append('references', this.chunks.map(chunk => chunk.string).join('|'));
        var result = null
        if(this.comparisonCache[string]){
            if(this.comparisonCache[string].chunkCount == this.chunks.length){
                result = this.comparisonCache[string].result;
            }else{
                var response = await got(apiURL + "similarity", {
                    method: "POST",
                    body: form
                });
                result = JSON.parse(response.body);
            }
        }else{
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
}