// Evaluate the package selection functions only. Never invoke build/stage.
const fs=require('fs'),vm=require('vm'),path=require('path'),{createRequire}=require('module');
const file=path.resolve(__dirname,'site_demo.js');
let src=fs.readFileSync(file,'utf8').split('const cmd = process.argv[2];')[0];
src+='\nJSON.stringify({files:[...TOP.flatMap(t=>walk(t,[])),...PAGES].filter(f=>!skip(f,chapterOneMedia())),enemies:[...shippedEnemies()],companions:[...shippedCompanions()],arcadeOnly:[...ARCADE_ONLY]})';
const data=JSON.parse(vm.runInNewContext(src,{require:createRequire(file),__dirname,process:{argv:['node',file,'size'],env:{EXPEDITIONS_SITE_THROUGH:'14'}},console:{log(){}}}));
data.ship=require('./size_check.js').shipList().files;
process.stdout.write(JSON.stringify(data));
