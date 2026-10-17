const test=require('node:test'),assert=require('node:assert/strict');const {fixture,plain}=require('./support/task003a-harness.cjs');
const destination='Correction /%雪',valid={version:1,categories:[['x',{mode:'relations',ids:['B']}],['z',{mode:'alphabetical',ids:['C']}]]};
const cases=[['read-source',JSON.stringify(valid),'read'],['read-absent',null,'read'],['read-destination',JSON.stringify({...valid,categories:[...valid.categories,[destination,{mode:'alphabetical',ids:['D']}]]}),'read'],['invalid-json','{','none'],['invalid-null','null','none'],['invalid-version',JSON.stringify({version:0,categories:[]}),'none'],['invalid-duplicate',JSON.stringify({version:1,categories:[...valid.categories,valid.categories[0]]}),'none'],['invalid-shape','{}','none'],['invalid-selection',JSON.stringify({version:1,categories:[['x',{mode:'relations',ids:['1','2','3','4','5','6','7']}]]}),'none'],['write-source',JSON.stringify(valid),'write']];
for(const cloud of [false,true])for(const [name,raw,failure]of cases)test(`symbol dialog rejects ${name} with ${cloud?'cloud':'local'} persistence and recovers without losing preferences`,async()=>{
 const f=fixture(),key=f.app.categorySortPreferenceKey();if(raw!==null)f.storage.set(key,raw);let prefWrites=0,graphWrites=0,cloudWrites=0,payload,blocked=true;
 const read=f.context.localStorage.getItem,write=f.context.localStorage.setItem;
 f.context.localStorage.getItem=k=>{if(blocked&&failure==='read'&&k===key)throw Error('read denied');return read(k)};
 f.context.localStorage.setItem=(k,v)=>{if(blocked&&failure==='write'&&k===key)throw Error('write denied');k===key?prefWrites++:graphWrites++;return write(k,v)};
 if(cloud)f.app.db={collection:()=>({doc:()=>({set:async(p,o)=>{cloudWrites++;payload=plain(p);assert.equal(o.merge,true)}})})};
 const before=f.snapshot(),stored=[...f.storage];f.app.openSymbolEditDialog('A');f.app.chooseSymbolEdit('category');f.document.getElementById('symbolEditInput').value=destination;f.app.saveSymbolEdit();await Promise.resolve();
 assert.deepEqual(f.snapshot(),before);assert.deepEqual([...f.storage],stored);assert.equal(f.saves(),0);assert.deepEqual([prefWrites,graphWrites,cloudWrites],[0,0,0]);assert.equal(f.document.getElementById('symbolEditDialog').style.display,'flex');assert.match(f.document.getElementById('symbolEditError').textContent,/inte|kunde/);assert.equal(f.app.symbolEditContext.kind,'category');
 // Normal view reads remain tolerant and never write on failure or invalid data.
 assert.deepEqual(plain(f.app.readCategorySortPreferences()),{version:1,categories:failure==='write'?valid.categories:[]});assert.deepEqual([...f.storage],stored);
 blocked=false;
 // Invalid records must be repaired explicitly by the test/user, never by migration.
 if(name.startsWith('invalid'))f.storage.set(key,JSON.stringify(valid));
 f.app.saveSymbolEdit();await Promise.resolve();assert.equal(f.saves(),1);assert.equal(graphWrites,cloud?0:3);assert.equal(cloudWrites,cloud?1:0);assert.equal(prefWrites,raw===null?0:1);assert.equal(f.document.getElementById('symbolEditDialog').style.display,'none');
 const after=f.snapshot(),expected=plain(before);expected.nodes.filter(n=>n.icon==='x').forEach(n=>n.icon=destination);expected.state.categories.filter(c=>c.symbol==='x').forEach(c=>c.symbol=destination);assert.deepEqual(after,expected);
 if(raw===null)assert.equal(f.storage.has(key),false);else assert.deepEqual(plain(f.app.readCategorySortPreferences().categories),[['z',{mode:'alphabetical',ids:['C']}],[destination,{mode:'relations',ids:['B']}]]);
 if(cloud){assert.deepEqual(payload.nodes,expected.nodes);assert.deepEqual(payload.edges,expected.edges);assert.deepEqual(payload.symbolCategories,expected.state)}
});
test('genuinely absent preferences permit one graph rename without creating preference storage',()=>{const f=fixture();assert.equal(f.app.renameCategorySymbol('x',destination),true);assert.equal(f.saves(),1);assert.equal(f.storage.size,3);assert(!f.storage.has(f.app.categorySortPreferenceKey()))});

