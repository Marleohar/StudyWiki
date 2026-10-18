const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {withBrowser}=require('./support/browser-harness.cjs'),{library}=require('./support/task003a-harness.cjs');
const evidence=fs.mkdtempSync(path.join(os.tmpdir(),'task013-refresh-')),records=[];
withBrowser(library(),async({evaluate,send,click,navigate,reload,answers})=>{
 const graph=()=>evaluate('({nodes:testApp.nodes,edges:testApp.edges,state:testApp.categoryState,storage:Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))})');
 const counts=()=>evaluate('({saves:qa.saves,storage:qa.writes,cloud:cloudWrites})');
 const key=async(key,code,shift=false)=>{for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key,windowsVirtualKeyCode:code,modifiers:shift?8:0,...(key==='Enter'&&type==='keyDown'?{text:'\r'}:{})})};

 async function reset(cloud,width){ await evaluate(`(()=>{const add=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(type,fn,...args){if(this.id==='createCategoryNode'&&type==='click')this.retainedAction=fn;return add.call(this,type,fn,...args)}})()`);await evaluate(`testApp.closeCategoryBatch(false);var d=${JSON.stringify(library())};testApp.nodes=d.nodes;testApp.edges=d.edges;testApp.categoryState=d.state;testApp.mode='create';testApp.db=null;testApp.updateModeUI();window.cloudWrites=0`);if(cloud)await evaluate('testApp.db={collection:()=>({doc:()=>({set:async(p,o)=>{if(!o.merge)throw Error("merge required");cloudWrites++}})})}');await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});await navigate('category/x');await zero()}
 async function zero(){await evaluate('qa.saves=0;qa.writes=0;cloudWrites=0')}
 async function unchanged(before){assert.deepEqual(await graph(),before);assert.deepEqual(await counts(),{saves:0,storage:0,cloud:0})}
 async function rename(name){answers.push(name);await click('#renameCategory')}
 async function notes(text){await click('#categoryDescriptionSlot .free-text-frame');await evaluate('document.getElementById("categoryNotes").select()');await send('Input.insertText',{text});await click('#saveCategoryNotes')}
 async function add(text,enter){await click('#categoryBatchName');await send('Input.insertText',{text});if(enter)await key('Enter',13);else await click('#categoryBatchAdd');assert.equal(await evaluate('document.activeElement.id'),'categoryBatchName')}
 for(const width of [1280,375,320])for(const cloud of [false,true])for(const number of [1,2,5]){
  await reset(cloud,width);await evaluate('window.oldButton=document.getElementById("createCategoryNode");window.oldCallback=oldButton.retainedAction');
  await rename('Saved name');await notes('Saved notes');await rename('Final name');await notes('Final notes');
  assert.equal(await evaluate('document.getElementById("categoryDisplayName").textContent'),'Final name');await zero();const before=await graph();
  await evaluate('oldButton.click();oldCallback()');assert.equal(await evaluate('!!testApp.categoryBatch'),false);await unchanged(before);
  await click('#createCategoryNode');assert.equal(await evaluate('testApp.categoryBatch.context.symbol'),'x');assert.equal(await evaluate('document.querySelectorAll("#categoryBatchBody select").length'),0);assert((await evaluate('document.getElementById("categoryBatchCategory").textContent')).includes('Final name'));
  for(let i=0;i<number;i++)await add('Created '+width+' '+number+' '+i,i%2===0);
  await add('Remove only me');await click('#categoryBatchPending li:last-child button');assert.equal(await evaluate('testApp.categoryBatch.pending.length'),number);
  const trace=[];for(const shift of [false,true])for(let i=0;i<number+4;i++){await key('Tab',9,shift);trace.push(await evaluate('document.activeElement.id||document.activeElement.textContent'));assert.equal(await evaluate('document.getElementById("categoryBatchDialog").contains(document.activeElement)'),true)}
  await unchanged(before);await evaluate('window.oldState=testApp.categoryBatch;window.oldSave=document.getElementById("categoryBatchSave")');
  if(number===5){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(evidence,`batch-${width}-${cloud}.png`),Buffer.from(shot.data,'base64'))}
  await click('#categoryBatchSave');const after=await graph();assert.equal(after.nodes.length,before.nodes.length+number);assert.deepEqual(after.nodes.slice(0,before.nodes.length),before.nodes);assert.deepEqual(after.edges,before.edges);assert.deepEqual(after.state.categories,before.state.categories);for(const n of after.nodes.slice(before.nodes.length)){assert.equal(n.icon,'x');assert.deepEqual(n.free_text,{sv:'',en:''})}assert.equal(await evaluate('location.hash'),'#category/x');assert.equal(await evaluate('document.activeElement.id'),'createCategoryNode');assert.deepEqual(await counts(),{saves:1,storage:cloud?0:3,cloud:cloud?1:0});
  await evaluate('oldSave.click();testApp.commitCategoryBatch(oldState);oldCallback()');assert.deepEqual(await graph(),after);assert.deepEqual(await counts(),{saves:1,storage:cloud?0:3,cloud:cloud?1:0});
  if(!cloud){await reload();assert.deepEqual(await graph(),after)}records.push({case:'success-after-successive-metadata',width,cloud,number,before,after,trace,counts:{saves:1,storage:cloud?0:3,cloud:cloud?1:0}});
 }
 for(const cloud of [false,true])for(const change of ['node','edge','metadata','library','revision','route','read','open-batch','cancel','unchanged','invalid']){
  await reset(cloud,375);await evaluate('window.oldButton=document.getElementById("createCategoryNode");window.oldCallback=oldButton.retainedAction');
  if(change==='open-batch'){await click('#createCategoryNode');await add('Must not create',true);await evaluate('window.staleBatch=testApp.categoryBatch;testApp.saveCategoryNotes("x","Programmatic edit")')}
  else if(change==='cancel'){await rename(null)}else if(change==='unchanged'){await rename('')}
  else if(change==='invalid'){await click('#categoryDescriptionSlot .free-text-frame');await evaluate('document.getElementById("categoryNotes").value="a".repeat(281)');await click('#saveCategoryNotes');await click('#cancelCategoryNotes')}
  else{await evaluate({node:'testApp.nodes[0]={...testApp.nodes[0]}',edge:'testApp.edges[0]={...testApp.edges[0]}',metadata:'testApp.categoryState.categories[1].notes="Unrelated"',library:'testApp.currentLibrary="other"',revision:'testApp.libraryLoadRevision++',route:'testApp.navigateTo("category/y")',read:'testApp.mode="read";testApp.updateModeUI()'}[change]);if(['node','edge','metadata','library','revision'].includes(change))await rename('Valid edit cannot bless stale context')}
  await zero();const before=await graph();await evaluate('oldButton.click();oldCallback();if(window.staleBatch)testApp.commitCategoryBatch(staleBatch)');
  if(!['cancel','unchanged','invalid'].includes(change))assert.equal(await evaluate('!!testApp.categoryBatch && testApp.categoryBatch!==window.staleBatch'),false);
  await evaluate('testApp.closeCategoryBatch(false)');await unchanged(before);
  records.push({case:'retained-guard',cloud,change,before,after:await graph(),counts:await counts()});
 }
 for(const cloud of [false,true])for(const cancel of [false,true]){
  await reset(cloud,320);await rename('Ready');await notes('Ready notes');await zero();const before=await graph();await click('#createCategoryNode');await add('Discard',true);await evaluate('window.staleBatch=testApp.categoryBatch;window.oldSave=document.getElementById("categoryBatchSave")');if(cancel)await click('#categoryBatchCancel');else await key('Escape',27);assert.equal(await evaluate('document.activeElement.id'),'createCategoryNode');await click('#createCategoryNode');await evaluate('oldSave.click();testApp.commitCategoryBatch(staleBatch)');assert.equal(await evaluate('testApp.categoryBatch.pending.length'),0);await key('Escape',27);await unchanged(before);records.push({case:'cancel-reopen',cloud,cancel,before,after:await graph(),counts:await counts()});
 }
}).then(()=>{fs.writeFileSync(path.join(evidence,'snapshots.json'),JSON.stringify(records,null,2));console.log(JSON.stringify({passed:records.length,evidence}))}).catch(e=>{console.error(e.stack);process.exitCode=1});
