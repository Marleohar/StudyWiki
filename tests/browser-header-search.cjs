const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {withBrowser}=require('./support/browser-harness.cjs');
const {library}=require('./support/task003a-harness.cjs');
const data=library();
const specialSymbol=` /%'"\u96ea <svg onload="qa.payloads++"> `;
const specialTitle=`O'Brien " / % \u96ea <img src=x onerror="qa.payloads++">`;
data.nodes.push({id:'apple',title:'Apple',icon:'x'},{id:'apricot',title:'Apricot',icon:'x'},{id:'pine',title:'Pine apple',icon:'y'},
 {id:'special',title:specialTitle,icon:specialSymbol,free_text:{sv:'Swedish unchanged',en:'English unchanged'},unknown:{retain:[false,null]}});
for(let n=0;n<12;n++)data.nodes.push({id:'match-'+n,title:'Match '+String(n).padStart(2,'0'),icon:'x'});
for(let n=0;n<40;n++)data.state.categories.push({symbol:'stored-category-'+String(n).padStart(2,'0'),name:'Category '+n,unknown:{keep:n}});
data.state.categories[0].name='Vapen';data.state.categories.push({symbol:specialSymbol,name:'Named <svg onload="qa.payloads++">',notes:'Not a category name',unknown:{preserve:[1,false]}});
const evidence=fs.mkdtempSync(path.join(os.tmpdir(),'studywiki-004a-evidence-'));
withBrowser(data,async({evaluate,send,click,press,navigate,reload,delay,answers,dialogs})=>{
 const snapshot='JSON.stringify({nodes:testApp.nodes,edges:testApp.edges,state:testApp.categoryState})';
 const get=()=>evaluate(snapshot),metrics=()=>evaluate('[qa.saves,qa.writes,qa.payloads]');
 const key=async(name,modifiers=0)=>{const vk={Enter:13,Escape:27,Tab:9,ArrowUp:38,ArrowDown:40,Home:36,End:35,Backspace:8};await send('Input.dispatchKeyEvent',{type:'keyDown',key:name,code:name,windowsVirtualKeyCode:vk[name],modifiers,...(name==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key:name,code:name,windowsVirtualKeyCode:vk[name],modifiers})};
 async function fill(selector,text){await evaluate('document.querySelector('+JSON.stringify(selector)+').focus();document.querySelector('+JSON.stringify(selector)+').select()');await key('Backspace');if(text)await send('Input.insertText',{text});}
 const shown=selector=>evaluate('document.querySelector('+JSON.stringify(selector)+').getClientRects().length>0');
 async function unchanged(before){assert.equal(await get(),before);assert.deepEqual(await metrics(),[0,0,0])}
 async function ensureSearch(){if(!await evaluate('testApp.searchOpen'))await click('#btnSearchToggle')}
 const initial=await get();const originalLibrary=await evaluate('testApp.currentLibrary');
 const layouts=[];
 for(const width of [1280,320,375]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  await evaluate('testApp.currentLibrary='+JSON.stringify('An unusually long library name '.repeat(15))+';testApp.updateLibraryLabel()');
  const layout=await evaluate(`(()=>{const h=document.getElementById('topBar'),r=[...h.children].map(e=>{const b=e.getBoundingClientRect();return{x:b.x,right:b.right,y:b.y,bottom:b.bottom}});return{width:innerWidth,documentWidth:document.documentElement.scrollWidth,headerHeight:h.getBoundingClientRect().height,rects:r,truncated:document.getElementById('libraryName').scrollWidth>document.getElementById('libraryName').clientWidth,ellipsis:getComputedStyle(document.getElementById('libraryName')).textOverflow}})()`);
  assert.equal(layout.rects.length,4);assert(layout.documentWidth<=width);assert(layout.rects.every(r=>r.x>=0&&r.right<=width));
  for(let n=1;n<4;n++){assert(layout.rects[n].x>=layout.rects[n-1].right);assert(Math.abs((layout.rects[n].y+layout.rects[n].bottom)/2-(layout.rects[0].y+layout.rects[0].bottom)/2)<1)}
  assert(layout.truncated);assert.equal(layout.ellipsis,'ellipsis');layouts.push({width,headerHeight:layout.headerHeight,noOverlap:true,noHorizontalScroll:true,truncated:true});
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(evidence,'header-'+width+'.png'),Buffer.from(shot.data,'base64'));
  if(width===320){
   await click('#btnMenu');assert.equal(await evaluate("(()=>{const r=document.getElementById('headerMenu').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<innerHeight})()"),true);await key('Escape');
   await click('#btnSearchToggle');assert.equal(await evaluate("(()=>{const a=document.getElementById('searchInput').getBoundingClientRect(),b=document.getElementById('btnSearchGo').getBoundingClientRect();return a.left>=0&&a.right<=b.left&&b.right<=innerWidth})()"),true);await key('Escape');
  }
 }
 await evaluate('testApp.currentLibrary='+JSON.stringify(originalLibrary)+';testApp.updateLibraryLabel()');
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 assert.equal(await shown('#searchPanel'),false);assert.equal(await shown('#headerMenu'),false);assert.equal(await shown('#dbStatus'),false);
 assert.equal(await evaluate("document.querySelectorAll('#btnNewNode,#btnBatchCreate').length"),0);
 for(const id of ['btnSearchToggle','btnMenu']){assert((await evaluate('document.getElementById('+JSON.stringify(id)+').getAttribute("aria-label")')).length>0);assert.equal(await evaluate('document.getElementById('+JSON.stringify(id)+').getAttribute("aria-expanded")'),'false')}
 // Menu uses real keyboard/outside clicks; status changes while it stays open.
 await evaluate("document.getElementById('btnMenu').focus()");await key('Enter');assert.equal(await evaluate('document.activeElement.id'),'btnModeLock');assert.equal(await evaluate("document.getElementById('btnModeLock').textContent"),'L\u00e5s upp skaparl\u00e4ge');
 for(const [state,label]of [['connecting','Ansluter\u2026'],['online','Synkad'],['offline','Lokal/offline']]){await evaluate('testApp.setConnectionStatus('+JSON.stringify(state)+')');assert.equal(await evaluate("document.getElementById('dbStatus').textContent"),label);assert.equal(await shown('#headerMenu'),true)}
 await key('Escape');assert.equal(await shown('#headerMenu'),false);assert.equal(await evaluate('document.activeElement.id'),'btnMenu');
 await click('#btnMenu');await click('#mainContent h1');assert.equal(await shown('#headerMenu'),false);await unchanged(initial);
 // Preserve the existing unlock policy without storing its existing credential in tests/output.
 const credential=await evaluate('GraphApp.prototype.promptModeUnlock.toString().match(/pwd === "([^"]+)"/)[1]');
 answers.push(credential);await click('#btnMenu');await click('#btnModeLock');assert.equal(await evaluate('testApp.mode'),'create');assert.equal(await shown('#headerMenu'),false);
 await click('#btnMenu');assert.equal(await evaluate("document.getElementById('btnModeLock').textContent"),'L\u00e5s skaparl\u00e4ge');assert.equal(await shown('#menuMode'),true);
 answers.push(null);await click('#btnModeLock');assert.equal(await evaluate('testApp.mode'),'create');
 answers.push('');await click('#btnMenu');await click('#btnModeLock');assert.equal(await evaluate('testApp.mode'),'read');await unchanged(initial);
 // Autocomplete: real text input, active keyboard selection, mouse and touch.
 await evaluate("document.getElementById('btnSearchToggle').focus()");await key('Enter');assert.equal(await evaluate('document.activeElement.id'),'searchInput');assert.equal(await evaluate("document.getElementById('btnSearchToggle').getAttribute('aria-expanded')"),'true');
 await fill('#searchInput','ap');assert.deepEqual(await evaluate("[...document.querySelectorAll('#searchSuggestions button')].map(e=>e.textContent)"),['Apple','Apricot','Pine apple']);
 await key('ArrowDown');assert.equal(await evaluate("document.getElementById('searchInput').getAttribute('aria-activedescendant')"),'search-option-0');await key('ArrowDown');await key('Enter');assert.equal(await evaluate('testApp.activeNodeId'),'apricot');
 await fill('#searchInput','ap');await click('#search-option-2');assert.equal(await evaluate('testApp.activeNodeId'),'pine');
 await fill('#searchInput','O\'Brien');assert.equal(await evaluate("document.querySelector('#search-option-0').textContent"),specialTitle);
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await press('#search-option-0',0,'touch');await send('Emulation.setTouchEmulationEnabled',{enabled:false});assert.equal(await evaluate('testApp.activeNodeId'),'special');
 await fill('#searchInput','Match');assert.equal(await evaluate("document.querySelectorAll('#searchSuggestions button').length"),8);await key('ArrowUp');assert.equal(await evaluate('testApp.searchActiveIndex'),7);
 await key('Escape');assert.equal(await shown('#searchSuggestions'),false);assert.equal(await shown('#searchPanel'),true);await key('Escape');assert.equal(await shown('#searchPanel'),false);
 await ensureSearch();await fill('#searchInput',' aLPHa ');assert.equal(await evaluate("document.getElementById('btnSearchGo').textContent"),'G\u00e5 till');await click('#btnSearchGo');assert.equal(await evaluate('testApp.activeNodeId'),'A');
 await fill('#searchInput','Not present');assert.equal(await evaluate("document.getElementById('btnSearchGo').textContent"),'Skapa');assert.equal(await evaluate("document.getElementById('btnSearchGo').getAttribute('aria-disabled')"),'true');
 await click('#btnSearchGo');await key('Enter');assert.equal(await shown('#createDialog'),false);assert((await evaluate("document.getElementById('searchHint').textContent")).includes('skaparl'));await unchanged(initial);
 await fill('#searchInput','   ');await key('Enter');assert.equal(await evaluate("document.getElementById('btnSearchGo').disabled"),true);assert.equal(await shown('#createDialog'),false);await unchanged(initial);
 // Header-only state updates leave a captured main-page symbol and its 800 ms press intact.
 await evaluate("testApp.mode='create';testApp.updateModeUI()");await navigate('A');
 await evaluate("window.headerPressTarget=document.querySelector('#nodeCategorySymbol button');window.headerPressGot=false;headerPressTarget.addEventListener('gotpointercapture',()=>headerPressGot=true,{once:true})");
 const pressPoint=await evaluate("(()=>{const e=headerPressTarget;e.scrollIntoView();const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await delay(40);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',...pressPoint,button:'left',buttons:1,clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',...pressPoint,button:'left',buttons:1});assert.equal(await evaluate('headerPressGot'),true);
 await evaluate("testApp.closeSearch(false);testApp.toggleSearch();document.getElementById('searchInput').value='Alpha';testApp.updateSearchSuggestions()");
 assert.equal(await evaluate("headerPressTarget===document.querySelector('#nodeCategorySymbol button')&&!!testApp.pendingPress"),true);
 await delay(850);assert.equal(await shown('#symbolEditDialog'),true);assert.equal(await evaluate('location.hash'),'#A');
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',...pressPoint,button:'left',buttons:0,clickCount:1});await key('Escape');await unchanged(initial);
 await evaluate("testApp.mode='read';testApp.updateModeUI()");
 // Creation from search opens a prefilled dialog and can be canceled without writes.
 answers.push(credential);await click('#btnMenu');await click('#btnModeLock');
 const newTitle=`New '" \u96ea <img src=x onerror="qa.payloads++">`;
 await fill('#searchInput',newTitle);await key('Enter');assert.equal(await shown('#createDialog'),true);assert.equal(await evaluate("document.getElementById('modalTitle').value"),newTitle);
 assert.equal(await evaluate("!!(document.getElementById('creationCategory').compareDocumentPosition(document.getElementById('modalTitle'))&Node.DOCUMENT_POSITION_FOLLOWING)"),true);
 const choices=await evaluate("[...document.getElementById('creationCategory').options].map(o=>({value:o.value,text:o.textContent}))");
 assert(choices.length>40);assert(choices.some(o=>o.value==='x'&&o.text==='x Vapen'));assert(choices.some(o=>o.value==='stored-only'&&o.text.includes('Namnl\u00f6s kategori')));assert.equal(choices.filter(o=>o.value===specialSymbol).length,1);
 await key('Escape');assert.equal(await shown('#createDialog'),false);await unchanged(initial);
 await click('#btnSearchGo');
 const storedIndex=choices.findIndex(o=>o.value==='stored-only');await evaluate("document.getElementById('creationCategory').focus()");await key('Home');for(let n=0;n<storedIndex;n++)await key('ArrowDown');assert.equal(await evaluate("document.getElementById('creationCategory').value"),'stored-only');await unchanged(initial);
 await fill('#modalFreeText','New content in both languages');await click('button[onclick="app.saveNewNode()"]');
 const createdState=JSON.parse(await get()),original=JSON.parse(initial),created=createdState.nodes.at(-1);
 assert.equal(created.title,newTitle);assert.equal(created.icon,'stored-only');assert.equal(created.isImmigrant,undefined);assert.deepEqual(created.free_text,{sv:'New content in both languages',en:'New content in both languages'});assert.equal(await evaluate('testApp.activeNodeId'),created.id);
 assert.deepEqual(createdState.nodes.slice(0,-1),original.nodes);assert.deepEqual(createdState.edges,original.edges);assert.deepEqual(createdState.state.categories,original.state.categories);assert.deepEqual(createdState.state.modifications.slice(0,-1),original.state.modifications);assert.equal(createdState.state.modifications.at(-1).id,created.id);assert.deepEqual(await metrics(),[1,3,0]);
 assert.equal(await evaluate("document.getElementById('nodeTitle').textContent"),newTitle);assert.equal(await evaluate("document.querySelectorAll('#mainContent img,#mainContent script,#existingNodesList img').length"),0);
 // Category-page origin and saved optional names use exact symbols, never labels as IDs.
 await evaluate('qa.saves=0;qa.writes=0');let before=await get();await navigate('category/'+encodeURIComponent(specialSymbol));await click('#createCategoryNode');assert.equal(await evaluate("document.getElementById('creationCategory').value"),specialSymbol);
 await fill('#modalTitle',' ALPHA ');await click('button[onclick="app.saveNewNode()"]');assert.equal(await shown('#createDialog'),true);await unchanged(before);
 await fill('#modalTitle','Invalid selection');await evaluate("const s=document.getElementById('creationCategory');const o=document.createElement('option');o.value='tampered';o.textContent='Tampered';s.appendChild(o);s.value='tampered'");await click('button[onclick="app.saveNewNode()"]');await unchanged(before);await key('Escape');
 const categoryName=`Category '" \u96ea <svg onload="qa.payloads++">`;
 await fill('#categoryNameInput',categoryName);await click('#saveCategoryName');assert.equal(await evaluate("document.getElementById('categoryDisplayName').textContent"),categoryName);
 const named=JSON.parse(await get()),expected=JSON.parse(before);expected.state.categories.find(c=>c.symbol===specialSymbol).name=categoryName;assert.deepEqual(named,expected);assert.deepEqual(await metrics(),[1,3,0]);
 await evaluate('qa.saves=0;qa.writes=0');before=await get();await click('#saveCategoryName');await unchanged(before);await click('#createCategoryNode');assert((await evaluate("[...document.getElementById('creationCategory').options].map(o=>o.textContent)")).includes(specialSymbol+' '+categoryName));await key('Escape');await unchanged(before);
 await reload();assert.equal(await get(),before);assert.equal(await evaluate('testApp.mode'),'read');assert.equal(await evaluate("document.getElementById('categoryDisplayName').textContent"),categoryName);await unchanged(before);
 // Current-library suggestions are reset on the existing prompt-based switch.
 const second={nodes:[{id:'second',title:'Unique other library',icon:'s',unknown:{keep:[false]}}],edges:[],state:{version:1,categories:[{symbol:'s',name:'Other category'}],modifications:[],unknown:{keep:1}}};
 await evaluate(`localStorage.setItem('nv_nodes_nv_lib_synthetic-second',${JSON.stringify(JSON.stringify(second.nodes))});localStorage.setItem('nv_edges_nv_lib_synthetic-second',${JSON.stringify(JSON.stringify(second.edges))});localStorage.setItem('nv_categories_nv_lib_synthetic-second',${JSON.stringify(JSON.stringify(second.state))});qa.saves=0;qa.writes=0`);
 await ensureSearch();await fill('#searchInput','Alpha');await evaluate("window.oldSuggestion=document.querySelector('#search-option-0')");answers.push('synthetic-second');await click('#btnLibSwitcher');assert.equal(await evaluate('testApp.currentLibrary'),'synthetic-second');assert.equal(await shown('#searchPanel'),false);assert.equal(await shown('#headerMenu'),false);assert.equal(await evaluate("document.getElementById('searchInput').value"),'');assert.deepEqual(await metrics(),[0,1,0]);
 assert.deepEqual(JSON.parse(await get()),second);await evaluate('oldSuggestion.click();qa.writes=0');assert.equal(await evaluate('testApp.activeNodeId'),null);
 await ensureSearch();await fill('#searchInput','Alpha');assert.equal(await evaluate("document.querySelectorAll('#searchSuggestions button').length"),0);await fill('#searchInput','Unique');await click('#search-option-0');assert.equal(await evaluate('testApp.activeNodeId'),'second');await unchanged(JSON.stringify(second));
 console.log(JSON.stringify({result:'PASS',layouts,suggestions:'keyboard/mouse/touch',searchCreation:'prefilled/validated/one-save/ordinary-member',categoryNames:'literal/exact-symbol/local-reload',libraryIsolation:true,noUnexpectedWrites:true,payloadExecutions:0,evidence}));
}).catch(error=>{console.error(error.stack);process.exitCode=1});
