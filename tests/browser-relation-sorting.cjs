const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {withBrowser}=require('./support/browser-harness.cjs');const {sortingData}=require('./support/relation-sorting-fixture.cjs');
const data=sortingData();const hostile=`雪 '" <svg onload="qa.payloads++">`;data.nodes.push({id:`special/'"%雪`,title:hostile,icon:'criteria'});
const evidence=fs.mkdtempSync(path.join(os.tmpdir(),'studywiki-005-evidence-'));
withBrowser(data,async({evaluate,send,click,press,navigate,answers,dialogs})=>{
 await evaluate('qa.preferenceWrites=0;window.originalSortSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith("nv_category_sort_v1:"))qa.preferenceWrites++;return originalSortSet.call(this,key,value)}');
 const snapshot='JSON.stringify({nodes:testApp.nodes,edges:testApp.edges,state:testApp.categoryState})';const before=await evaluate(snapshot);const originalLibrary=await evaluate('testApp.currentLibrary');
 async function unchanged(expected=before){assert.equal(await evaluate(snapshot),expected);assert.deepEqual(await evaluate('[qa.saves,qa.writes-qa.preferenceWrites,qa.payloads]'),[0,0,0])}
 const key=async(key,vk)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,windowsVirtualKeyCode:vk,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key,windowsVirtualKeyCode:vk})};
 async function fill(text){await evaluate('document.getElementById("relationCriteriaSearch").focus();document.getElementById("relationCriteriaSearch").select()');await key('Backspace',8);if(text)await send('Input.insertText',{text})}
 async function mode(){await evaluate('document.getElementById("categorySortMode").focus()');await key('End',35);assert.equal(await evaluate('testApp.categorySort.mode'),'relations')}
 async function add(query,id){await fill(query);if(id)await evaluate('document.getElementById("relationCriteriaSelect").value='+JSON.stringify(id));await click('#addRelationCriterion')}
 const rows=()=>evaluate('[...document.querySelectorAll("#categoryMembers a")].map(e=>e.getAttribute("href").slice(1))');
 const headings=()=>evaluate('[...document.querySelectorAll("#categoryMembers h2")].map(e=>e.textContent)');
 await navigate('category/x');assert.deepEqual(await rows(),['none2','none10','m2','m10','p-only','q-only']);assert.equal(await evaluate('testApp.mode'),'read');
 await evaluate('window.sortTemplate=document.querySelector("#mainContent .item-card").lastElementChild;window.sortEditor=document.querySelector("#categoryDescriptionSlot .free-text-frame")');
 await mode();await fill('Pacifies');await evaluate('document.getElementById("relationCriteriaSelect").focus()');await key('Home',36);await key('Tab',9);assert.equal(await evaluate('document.activeElement.id'),'addRelationCriterion');await key('Enter',13);assert.deepEqual(await headings(),['Pacifies Pitta','Övriga objekt']);assert.deepEqual(await rows(),['m2','m10','p-only','none2','none10','q-only']);await unchanged();
 await add('Aggravates');assert.deepEqual(await headings(),['Aggravates Kapha, Pacifies Pitta','Aggravates Kapha','Pacifies Pitta','Övriga objekt']);assert.deepEqual(await rows(),['m2','m10','q-only','p-only','none2','none10']);
 assert.equal(await evaluate('sortTemplate===document.querySelector("#mainContent .item-card").lastElementChild && sortEditor===document.querySelector("#categoryDescriptionSlot .free-text-frame")'),true);await unchanged();
 // Remove through touch, then reverse criterion order to verify equal-cardinality groups.
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await press('#relationCriteriaChips button:nth-child(2)',0,'touch');await send('Emulation.setTouchEmulationEnabled',{enabled:false});assert.deepEqual(await evaluate('testApp.categorySort.ids'),['q']);await add('Pacifies');assert.deepEqual(await headings(),['Aggravates Kapha, Pacifies Pitta','Aggravates Kapha','Pacifies Pitta','Övriga objekt']);await unchanged();
 await click('#clearRelationCriteria');assert.deepEqual(await headings(),[]);assert.equal((await rows()).length,6);
 await add('雪');assert.deepEqual(await headings(),['Övriga objekt']);assert.equal(await evaluate('document.querySelector("#relationCriteriaChips button").textContent'),'Ta bort: '+hostile);assert.equal(await evaluate('document.querySelectorAll("#relationSortControls svg,#relationSortControls img").length'),0);await unchanged();
 const layouts=[];
 for(const width of [1280,375,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});const layout=await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,select:document.getElementById("relationCriteriaSelect").getBoundingClientRect().right})');assert(layout.scroll<=width);assert(layout.select<=width);layouts.push(layout);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(evidence,'sorting-'+width+'.png'),Buffer.from(shot.data,'base64'))}
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await click('#clearRelationCriteria');await add('Pacifies');await click('#categoryMembers a');assert.equal(await evaluate('testApp.activeNodeId'),'m2');await unchanged();
 await navigate('category/x');assert.equal(await evaluate('testApp.categorySort.mode'),'relations');await mode();await add('Aggravates');
 // Keyboard member navigation and original edit alternatives on grouped links.
 await evaluate('document.querySelector("#categoryMembers a").focus()');await key('Enter',13);assert.equal(await evaluate('testApp.activeNodeId'),'m2');await navigate('category/x');await mode();
 await evaluate('testApp.mode="create";testApp.updateModeUI()');let count=dialogs.length;answers.push(null);await press('#categoryMembers a',850);assert.equal(dialogs.length,count+1);assert.equal(await evaluate('location.hash'),'#category/x');
 count=dialogs.length;answers.push(null);await evaluate('document.querySelector("#categoryMembers a").focus()');await key('F2',113);assert.equal(dialogs.length,count+1);await unchanged();
 // Explicitly clear before the live rename scenario; refresh restores saved mode.
 await click('#clearRelationCriteria');
 await evaluate('testApp.getNode("p").title="Renamed criterion";testApp.libraryLoadRevision++;testApp.routeFromHash()');assert.equal(await evaluate('testApp.categorySort.mode'),'relations');await mode();await add('Renamed');assert.deepEqual(await headings(),['Renamed criterion','Övriga objekt']);
 await evaluate('testApp.nodes=testApp.nodes.filter(n=>n.id!=="p");testApp.routeFromHash()');assert.deepEqual(await evaluate('testApp.categorySort.ids'),['p']);assert.equal(await evaluate('document.querySelector("#relationCriteriaSelect").textContent.includes("Renamed criterion")'),false);
 const changed=await evaluate(snapshot);await unchanged(changed);
 // Actual prompt-driven library switch: exactly the pre-existing selection-key write.
 await mode();await add('Aggravates');await evaluate('window.retainedAdd=document.getElementById("addRelationCriterion");window.retainedState=testApp.categorySort');
 const other={nodes:[{id:'other',title:'Other',icon:'x'}],edges:[],state:{version:1,categories:[],modifications:[]}};
 await evaluate(`localStorage.setItem('nv_nodes_nv_lib_sort-other',${JSON.stringify(JSON.stringify(other.nodes))});localStorage.setItem('nv_edges_nv_lib_sort-other',${JSON.stringify(JSON.stringify(other.edges))});localStorage.setItem('nv_categories_nv_lib_sort-other',${JSON.stringify(JSON.stringify(other.state))});qa.writes=0;qa.preferenceWrites=0`);
 answers.push('sort-other');await click('#btnLibSwitcher');assert.equal(await evaluate('testApp.currentLibrary'),'sort-other');await navigate('category/x');assert.deepEqual(await rows(),['other']);assert.deepEqual(await evaluate('testApp.categorySort.ids'),[]);await evaluate('retainedAdd.click()');assert.deepEqual(await evaluate('testApp.categorySort.ids'),[]);assert.deepEqual(await evaluate('[qa.saves,qa.writes-qa.preferenceWrites,qa.payloads]'),[0,1,0]);assert.deepEqual(JSON.parse(await evaluate(snapshot)),other);
 console.log(JSON.stringify({result:'PASS',layouts,readMode:true,grouping:'full/partial/none; exact IDs; paused excluded; duplicates harmless',input:'mouse/touch/keyboard/longpress/F2',preservation:'complete snapshots; zero graph saves/writes; explicit browser preferences separate; library switch only 1 selection-key write',evidence}));
}).catch(e=>{console.error(e.stack);process.exitCode=1});
