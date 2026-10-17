const assert=require('node:assert/strict');
const {withBrowser}=require('./support/browser-harness.cjs');
const {library}=require('./support/task003a-harness.cjs');
const data=library(),title=`O'Brien 雪 <img src=x onerror="qa.payloads++">`,symbol=` /%'雪 <svg onload="qa.payloads++"> `;
data.nodes[0].title=title;data.state.categories.push({symbol,name:'Exact destination'});
withBrowser(data,async({evaluate,send,click,navigate})=>{
 const snap=()=>evaluate('JSON.stringify({nodes:testApp.nodes,edges:testApp.edges,state:testApp.categoryState})');
 const metrics=()=>evaluate('[qa.saves,qa.writes,qa.payloads]');
 const key=async(key,vk,shift=false)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,windowsVirtualKeyCode:vk,modifiers:shift?8:0,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key,windowsVirtualKeyCode:vk})};
 async function fill(id,text){await evaluate(`document.getElementById(${JSON.stringify(id)}).focus();document.getElementById(${JSON.stringify(id)}).select()`);await send('Input.insertText',{text})}
 const shown=id=>evaluate(`getComputedStyle(document.getElementById(${JSON.stringify(id)})).display!=='none'`);
 await evaluate('testApp.mode="create";testApp.updateModeUI()');await navigate('category/y');await click('#createCategoryNode');
 await fill('modalTitle',' '+title.toUpperCase()+' ');await fill('modalFreeText','Unsaved must never overwrite');
 await evaluate('document.getElementById("creationCategory").value='+JSON.stringify(symbol));
 const before=await snap();await click('button[onclick="app.saveNewNode()"]');assert(await shown('existingMoveDialog'));assert.equal(await evaluate('Number(getComputedStyle(document.getElementById("existingMoveDialog")).zIndex)>Number(getComputedStyle(document.getElementById("createDialog")).zIndex)'),true);
 assert.equal(await evaluate('document.activeElement.id'),'cancelExistingMove');assert.equal(await evaluate('document.getElementById("createDialog").inert'),true);
 assert((await evaluate('document.getElementById("existingMoveQuestion").textContent')).includes(title));assert((await evaluate('document.getElementById("existingMoveQuestion").textContent')).includes(symbol));assert.equal(await evaluate('document.querySelectorAll("#existingMoveDialog img,#existingMoveDialog svg").length'),0);
 await key('Tab',9);assert.equal(await evaluate('document.activeElement.id'),'confirmExistingMove');await key('Tab',9,true);assert.equal(await evaluate('document.activeElement.id'),'cancelExistingMove');
 await key('Escape',27);assert(!await shown('existingMoveDialog'));assert(await shown('createDialog'));assert.equal(await evaluate('document.activeElement.id'),'modalTitle');assert.equal(await snap(),before);assert.deepEqual(await metrics(),[0,0,0]);
 await click('button[onclick="app.saveNewNode()"]');await click('#cancelExistingMove');assert.equal(await evaluate('document.getElementById("modalFreeText").value'),'Unsaved must never overwrite');assert.equal(await snap(),before);assert.deepEqual(await metrics(),[0,0,0]);
 await click('button[onclick="app.saveNewNode()"]');await click('#confirmExistingMove');
 const after=JSON.parse(await snap()),original=JSON.parse(before);const moved=structuredClone(original.nodes[0]);moved.icon=symbol;moved.isImmigrant=true;
 assert.deepEqual(after.nodes[0],moved);assert.deepEqual(after.nodes.slice(1),original.nodes.slice(1));assert.deepEqual(after.edges,original.edges);assert.deepEqual(after.state.categories,original.state.categories);assert.deepEqual(await metrics(),[1,3,0]);assert.equal(await evaluate('testApp.activeNodeId'),'A');assert(!await shown('createDialog'));assert(!await shown('existingMoveDialog'));
 await evaluate('qa.saves=0;qa.writes=0');await navigate('category/'+encodeURIComponent(symbol));await click('#createCategoryNode');await fill('modalTitle',title);const same=await snap();await click('button[onclick="app.saveNewNode()"]');assert(!await shown('existingMoveDialog'));assert.equal(await snap(),same);assert.deepEqual(await metrics(),[0,0,0]);
 // Revalidation after a live synthetic data update; no save of either version.
 await evaluate('testApp.closeCreateDialog()');await navigate('category/y');await click('#createCategoryNode');await fill('modalTitle',title);await click('button[onclick="app.saveNewNode()"]');await evaluate('testApp.nodes[0].unknown.updated=true');const stale=await snap();await click('#confirmExistingMove');assert.equal(await snap(),stale);assert.deepEqual(await metrics(),[0,0,0]);assert(!await shown('createDialog'));
 // Live mode/library changes invalidate a pending confirmation without persistence.
 for(const change of ['testApp.currentLibrary="synthetic-stale"','testApp.mode="read"']){
  await navigate('category/y');await click('#createCategoryNode');await fill('modalTitle',title);await click('button[onclick="app.saveNewNode()"]');
  await evaluate(change);const protectedSnapshot=await snap();await click('#confirmExistingMove');assert.equal(await snap(),protectedSnapshot);assert.deepEqual(await metrics(),[0,0,0]);
  await evaluate('testApp.currentLibrary="synthetic-task003a-browser";testApp.mode="create";testApp.updateModeUI()');
 }
 // A stale active category cannot turn global search creation into a transfer.
 await click('#btnSearchToggle');await fill('searchInput','Brand new');await click('#btnSearchGo');await fill('modalTitle',title);await click('button[onclick="app.saveNewNode()"]');assert(!await shown('existingMoveDialog'));assert.equal(await snap(),stale);assert.deepEqual(await metrics(),[0,0,0]);
 await fill('modalTitle','Brand new');await click('button[onclick="app.saveNewNode()"]');assert.equal(await evaluate('testApp.nodes.at(-1).title'),'Brand new');assert.equal(await evaluate('testApp.nodes.at(-1).isImmigrant===undefined'),true);assert.deepEqual(await metrics(),[1,3,0]);
 console.log('PASS: real category-button context; literal special title/symbol; Ja/Nej/Escape/Tab; immutable ID, full records/languages/active-paused edges; one-save move; zero-write cancellations/same-category/stale state/global duplicate; unique creation.');
}).catch(e=>{console.error(e.stack);process.exitCode=1});
