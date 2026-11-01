const assert = require('node:assert/strict');
const { readContext, contextSearch } = require('../src/lib/context.ts');
const { buildHeatmapData } = require('../src/lib/heatmap.ts');
const context = {view:'galaxy',book:42,pair:null,verse:[42,1,1],category:4};
assert.deepEqual(readContext(contextSearch(context)),context);
assert.deepEqual(readContext('?view=oops&book=-1&theme=8&pair=1.99&verse=42.0.1'),{view:'arcs',book:null,pair:null,verse:null,category:null});
assert.deepEqual(readContext('?pair=0.65').pair,[0,65]);
assert.equal(readContext('?book=1e1').book,null);
assert.equal(readContext('?verse=0.1.999').verse,null);
const bins=[{sourceBook:0,targetBook:42,category:0,count:7},{sourceBook:0,targetBook:42,category:1,count:3},{sourceBook:0,targetBook:0,category:1,count:2}];
const all=buildHeatmapData(bins);
assert.equal(all.matrix[42],10);assert.equal(all.matrix[42*66],10);assert.equal(all.matrix[0],2);assert.equal(all.maxCount,10);
const filtered=buildHeatmapData(bins,[false,true]);
assert.equal(filtered.matrix[42],3);assert.equal(filtered.matrix[42*66],3);assert.equal(filtered.dominantCat[42],1);assert.equal(filtered.maxCount,3);
assert.equal(buildHeatmapData(bins,[]).maxCount,0);
console.log('Experience regressions passed: URL round trip, malformed links, symmetric filtered counts, diagonal counts, dominant theme, empty selection.');

// Exercise the worker's actual fetch/validation failure path without a browser.
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const workerSource = ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/dataWorker.ts'),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
async function workerResult(fetchResult) {
  const messages=[];
  const self={postMessage:message=>messages.push(message)};
  vm.runInNewContext(workerSource,{self,exports:{},require:()=>require('../src/data/categories.ts'),fetch:fetchResult});
  await self.onmessage({data:{type:'load',url:'/references.json'}});
  return messages.at(-1);
}
(async()=>{
  assert.equal((await workerResult(async()=>{throw new Error('offline')})).type,'error');
  assert.equal((await workerResult(async()=>({ok:false}))).type,'error');
  assert.equal((await workerResult(async()=>({ok:true,json:async()=>[{s:[999,1,1],t:[0,1,1],cat:0}]}))).type,'error');
  const result=await workerResult(async()=>({ok:true,json:async()=>[{s:[42,1,1],t:[0,1,1],cat:0}]}));
  assert.equal(result.type,'ready');assert.equal(result.totalCount,1);assert.equal(result.bins[0].sourceBook,0);
  console.log('Worker checks passed: offline, HTTP failure, invalid input, successful binning.');
})().catch(error=>{console.error(error);process.exitCode=1});
