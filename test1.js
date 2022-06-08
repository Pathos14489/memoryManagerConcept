import fs from 'fs';
import got from "got";

import MemoryManager from './index.js';

async function main(){
    // Manager Initialisation
    var manager = new MemoryManager();
    manager.memorySize = 75; // Comment out to test with custom size limit handler(e.g. by episode in this case)

    // Instead of checking every memory, if the best guess it's found so far lasts bestGuessOf new memories
    // it will stop checking to save enormous amounts of time at the cost of not always finding the best guess.
    manager.bestGuess = true; 
    manager.writeCache = true; // Writes the memory caches to file so they can be loaded later -- same queries will already be computed
    manager.bestGuessOf = 100;

    // Downloads test data from GJBroughton/Star_Trek_Scripts repository if needed
    if(!fs.existsSync('all_scripts_raw.json')){
        console.log('Downloading all_scripts_raw.json...');
        var scripts = await got('https://raw.githubusercontent.com/GJBroughton/Star_Trek_Scripts/master/data/all_scripts_raw.json');
        fs.writeFileSync('all_scripts_raw.json', scripts.body);
    }

    // Data input (LTM)
    var data = JSON.parse(fs.readFileSync('all_scripts_raw.json'))
    var data2 = {};
    data2.TNG = data.TNG;
    for (const series in data2) {
        for (const episode in data2[series]) {
            var episodeText = data2[series][episode]
            episodeText.replace(/(\\n)+/g, '\n');
            var lines = data2[series][episode].split('\n');
            // If line doesn't begin with a NAME: then it's not a script line and should be combined with the previous line
            for (var i = 0; i < lines.length; i++) {
                var lineRegex = /^[A-Za-z0-9 \[\]'-\(\)]+: (.*)$/;
                var otherLineRegex = /^\(.*\)$/;
                var otherOtherLineRegex = /^\[.*\]$/;
                if(lines[i - 1]){
                    // console.log(lines[i-1],lineRegex.test(lines[i-1].trim()), lines[i],lineRegex.test(lines[i].trim()));
                    if(lineRegex.test(lines[i-1].trim())){
                        while( lines[i] != undefined && !lineRegex.test(lines[i]?.trim()) && !otherLineRegex.test(lines[i]?.trim()) && !otherOtherLineRegex.test(lines[i]?.trim())){
                            // console.log(`Combined | ${lines[i - 1]} + ${lines[i]}`);
                            lines[i - 1] += " " + lines[i];
                            lines.splice(i, 1);
                        }
                    }
                }
            }
            // console.log(`${series} ${episode}, ${lines.length} lines`);
            lines = lines.filter(line => {
                return line.replace(/\s/g, '').length > 0;
            })
            lines = lines.filter(line => {
                return line.replace(/^\[.*?\]$/g, '').length > 0;
            })
            for (const line of lines) {
                manager.newChunk(line);
            }
            // manager.newMemory(); // Uncomment to create new memory every episode
        }
    }

    console.log(`${manager.memories.length} memories across ~${manager.memories.length*manager.memorySize} chunks loaded`);
    
    var str = "When was Q nice to Picard?";

    fs.mkdirSync('tests', {recursive: true});

    // Test
    var time1a1 = Date.now();
    var embeddinga1 = await manager.getEmbedding(str,"oldest",false);
    console.log(embeddinga1);
    embeddinga1.processingTime = Date.now() - time1a1;
    fs.writeFileSync('tests/all.json', JSON.stringify(embeddinga1));
    console.log(Date.now() - time1a1);

    var time1r1 = Date.now();
    var embeddingr1 = await manager.getEmbedding(str,"random");
    console.log(embeddingr1);
    embeddingr1.processingTime = Date.now() - time1r1;
    fs.writeFileSync('tests/random-1.json', JSON.stringify(embeddingr1));
    console.log(Date.now() - time1r1);

    var time1r2 = Date.now();
    var embeddingr2 = await manager.getEmbedding(str,"random");
    console.log(embeddingr2);
    embeddingr2.processingTime = Date.now() - time1r2;
    fs.writeFileSync('tests/random-2.json', JSON.stringify(embeddingr2));
    console.log(Date.now() - time1r2);

    var time1r3 = Date.now();
    var embeddingr3 = await manager.getEmbedding(str,"random");
    console.log(embeddingr3);
    embeddingr3.processingTime = Date.now() - time1r3;
    fs.writeFileSync('tests/random-3.json', JSON.stringify(embeddingr3));
    console.log(Date.now() - time1r3);

    var time2 = Date.now();
    var embedding2 = await manager.getEmbedding(str,"oldest");
    console.log(embedding2);
    embedding2.processingTime = time2 - Date.now()
    fs.writeFileSync('tests/oldest.json', JSON.stringify(embedding2));
    console.log(Date.now() - time2);

    var time3 = Date.now();
    var embedding3 = await manager.getEmbedding(str,"newest");
    console.log(embedding3);
    embedding3.processingTime = time3 - Date.now()
    fs.writeFileSync('tests/newest.json', JSON.stringify(embedding3));
    console.log(Date.now() - time3);

    await manager.save("test.json")
}
main()