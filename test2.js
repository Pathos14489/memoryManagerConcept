import fs from 'fs';
import got from "got";

import MemoryManager from './index.js';

async function main(){
    // Manager Initialisation
    var manager = new MemoryManager();
    
    await manager.load("test.json");

    console.log(`${manager.memories.length} memories across ~${manager.memories.length*manager.memorySize} chunks loaded`);
    
    var str = "When was Q nice to Picard?";

    fs.mkdirSync('tests2', {recursive: true});

    // Test
    var time1a1 = Date.now();
    var embeddinga1 = await manager.getEmbedding(str,"oldest",false);
    console.log(embeddinga1);
    embeddinga1.processingTime = Date.now() - time1a1;
    fs.writeFileSync('tests2/all.json', JSON.stringify(embeddinga1));
    console.log(Date.now() - time1a1);

    var time1r1 = Date.now();
    var embeddingr1 = await manager.getEmbedding(str,"random");
    console.log(embeddingr1);
    embeddingr1.processingTime = Date.now() - time1r1;
    fs.writeFileSync('tests2/random-1.json', JSON.stringify(embeddingr1));
    console.log(Date.now() - time1r1);

    var time1r2 = Date.now();
    var embeddingr2 = await manager.getEmbedding(str,"random");
    console.log(embeddingr2);
    embeddingr2.processingTime = Date.now() - time1r2;
    fs.writeFileSync('tests2/random-2.json', JSON.stringify(embeddingr2));
    console.log(Date.now() - time1r2);

    var time1r3 = Date.now();
    var embeddingr3 = await manager.getEmbedding(str,"random");
    console.log(embeddingr3);
    embeddingr3.processingTime = Date.now() - time1r3;
    fs.writeFileSync('tests2/random-3.json', JSON.stringify(embeddingr3));
    console.log(Date.now() - time1r3);

    var time2 = Date.now();
    var embedding2 = await manager.getEmbedding(str,"oldest");
    console.log(embedding2);
    embedding2.processingTime = time2 - Date.now()
    fs.writeFileSync('tests2/oldest.json', JSON.stringify(embedding2));
    console.log(Date.now() - time2);

    var time3 = Date.now();
    var embedding3 = await manager.getEmbedding(str,"newest");
    console.log(embedding3);
    embedding3.processingTime = time3 - Date.now()
    fs.writeFileSync('tests2/newest.json', JSON.stringify(embedding3));
    console.log(Date.now() - time3);
}
main()