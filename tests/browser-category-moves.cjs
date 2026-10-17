const assert=require('node:assert/strict');
const {withBrowser}=require('./support/browser-harness.cjs');
const {library}=require('./support/task003a-harness.cjs');
const snapshot='JSON.stringify({nodes:testApp.nodes,edges:testApp.edges,state:testApp.categoryState})';
const seed=library();
withBrowser(seed,async({evaluate,send,press,click,navigate,reload,delay,answers,dialogs,errors,interception,holdLocalRequest})=>{
 const get=()=>evaluate(snapshot);
 const metrics=()=>evaluate('[qa.saves,qa.writes,qa.payloads]');
 const creative=()=>evaluate("testApp.mode='create';testApp.updateModeUI()");
 async function reset(){await evaluate(`testApp.nodes=${JSON.stringify(seed.nodes)};testApp.edges=${JSON.stringify(seed.edges)};testApp.categoryState=${JSON.stringify(seed.state)};qa.saves=0;qa.writes=0;testApp.closeSymbolEditDialog();testApp.closeAppearanceDialog();testApp.mode='create';testApp.updateModeUI();testApp.navigateTo('A')`);await delay(60)}
 async function unchanged(before){assert.equal(await get(),before);assert.deepEqual(await metrics(),[0,0,0])}
 async function dialogOpen(){return evaluate("getComputedStyle(document.getElementById('symbolEditDialog')).display!=='none'")}
 async function choose(kind,value){await click(`#symbolEditChoices button:nth-child(${kind==='object'?1:2})`);await evaluate('document.getElementById("symbolEditInput").value='+JSON.stringify(value));await click('#symbolEditForm button')}
 // Quick symbol navigation and early release; real mouse and touch.
 await creative();let before=await get();
 await click('#nodeCategorySymbol button');assert.equal(await evaluate('location.hash'),'#category/x');await unchanged(before);
 await navigate('A');await press('#nodeCategorySymbol button',300);assert.equal(await evaluate('location.hash'),'#category/x');assert.equal(await dialogOpen(),false);await delay(850);assert.equal(await dialogOpen(),false);await unchanged(before);
 await navigate('A');await press('#nodeCategorySymbol button',850);assert.equal(await dialogOpen(),true);assert.equal(await evaluate('location.hash'),'#A');await unchanged(before);
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});assert.equal(await dialogOpen(),false);
 await click('#nodeCategorySymbol button');assert.equal(await evaluate('location.hash'),'#category/x');await unchanged(before);
 // Native capture loss before threshold, without a subsequent pointer event to deliver lostpointercapture.
 await navigate('A');
 await evaluate("window.qaCapture={got:false,id:null};const b=document.querySelector('#nodeCategorySymbol button');b.addEventListener('pointerdown',e=>qaCapture.id=e.pointerId,{once:true});b.addEventListener('gotpointercapture',()=>qaCapture.got=true,{once:true})");
 const capturePoint=await evaluate("(()=>{const b=document.querySelector('#nodeCategorySymbol button');b.scrollIntoView();const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");
 await send('Input.dispatchMouseEvent',{type:'mousePressed',...capturePoint,button:'left',buttons:1,clickCount:1});
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',...capturePoint,button:'left',buttons:1});
 for(let n=0;n<50&&!await evaluate('qaCapture.got');n++)await delay(5);
 assert.equal(await evaluate('qaCapture.got'),true);
 assert.equal(await evaluate("document.querySelector('#nodeCategorySymbol button').hasPointerCapture(qaCapture.id)"),true);
 await delay(150);
 await evaluate("document.querySelector('#nodeCategorySymbol button').releasePointerCapture(qaCapture.id)");
 assert.equal(await evaluate("document.querySelector('#nodeCategorySymbol button').hasPointerCapture(qaCapture.id)"),false);
 // No pointer event occurs during this wait. The timeout must inspect ownership itself.
 await delay(900);
 assert.equal(await dialogOpen(),false);assert.equal(await evaluate('!!testApp.pendingPress'),false);
 assert.equal(await evaluate('location.hash'),'#A');await unchanged(before);
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',...capturePoint,button:'left',buttons:0,clickCount:1});
 await delay(30);assert.equal(await dialogOpen(),false);assert.equal(await evaluate('location.hash'),'#A');await unchanged(before);
 await click('#nodeCategorySymbol button');assert.equal(await evaluate('location.hash'),'#category/x');await unchanged(before);
 // Genuine pointer/touch: short, held, movement and pointercancel.
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await navigate('A');await press('#nodeCategorySymbol button',200,'touch');assert.equal(await evaluate('location.hash'),'#category/x');await unchanged(before);
 await navigate('A');await press('#nodeCategorySymbol button',850,'touch');assert.equal(await dialogOpen(),true);assert.equal(await evaluate('location.hash'),'#A');await click('#symbolEditDialog > div > button');
 for(const ending of ['cancel','move']){await navigate('A');await press('#nodeCategorySymbol button',900,'touch',ending);assert.equal(await dialogOpen(),false,ending);assert.equal(await evaluate('location.hash'),'#A');await unchanged(before)}
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 for(const ending of ['move','rerender']){await press('#nodeCategorySymbol button',900,'mouse',ending);assert.equal(await dialogOpen(),false,ending);assert.equal(await evaluate('location.hash'),'#A');await unchanged(before)}
 // Meaningful page scrolling cancels a pending timer (and never navigates).
 await evaluate("document.getElementById('mainContent').style.minHeight='2400px'");await press('#nodeCategorySymbol button',900,'mouse','scroll');assert.equal(await dialogOpen(),false);await unchanged(before);
 await evaluate("document.getElementById('mainContent').style.minHeight='';window.scrollTo(0,0)");
 // Read mode: no dialog, rename prompt or mutations, including direct guard calls.
 await evaluate("testApp.mode='read';testApp.updateModeUI()");await press('#nodeCategorySymbol button',900);assert.equal(await dialogOpen(),false);assert.equal(await evaluate('location.hash'),'#category/x');
 await navigate('A');const count=dialogs.length;await press('#nodeTitle',900);assert.equal(dialogs.length,count);await unchanged(before);
 await creative();
 // Header/title long press uses original prompt and rejects/cancels without a save.
 answers.push(null);await press('#nodeTitle',850);assert.equal(dialogs.length,count+1);await unchanged(before);
 const renamed=`New '" \u96ea <img src=x onerror="qa.payloads++"> <script>qa.payloads++</script>`;
 answers.push(renamed);await press('#nodeTitle',850);assert.equal(await evaluate("testApp.getNode('A').title"),renamed);assert.equal(await evaluate("document.getElementById('nodeTitle').textContent"),renamed);
 assert.equal(await evaluate("document.querySelectorAll('#mainContent img,#mainContent script,#existingNodesList img,#existingNodesList script').length"),0);
 assert.deepEqual(await metrics(),[1,3,0]);
 const renamedState=JSON.parse(await get()),old=JSON.parse(before);const expected=structuredClone(old);expected.nodes[0].title=renamed;expected.state.modifications=renamedState.state.modifications;assert.deepEqual(renamedState,expected);
 await navigate('overview');assert((await evaluate("[...document.querySelectorAll('#mainContent a.list-title')].map(e=>e.textContent)")).includes(renamed));
 await navigate('category/x');assert((await evaluate("[...document.querySelectorAll('#categoryMembers a')].map(e=>e.textContent)")).includes(renamed));
 await navigate('C');assert((await evaluate("[...document.querySelectorAll('#mainContent a.list-title')].map(e=>e.textContent)")).includes(renamed));
 // Real quick title navigation works in overview/category/active and paused lists.
 await reset();before=await get();
 for(const [route,selector,target]of [['overview','#mainContent .list-title','A'],['category/x','#categoryMembers .list-title','A'],['C','#mainContent .flat-list-container .list-title','A'],['D','#pausedRelationsList .list-title','A']]){
  await navigate(route);await click(selector);assert.equal(await evaluate('testApp.activeNodeId'),target);await unchanged(before);
 }
 // All list-title long presses cancel the normal click and run one rename prompt.
 for(const [route,selector]of [['overview','#mainContent .list-title'],['category/x','#categoryMembers .list-title'],['C','#mainContent .flat-list-container .list-title'],['D','#pausedRelationsList .list-title']]){
  await navigate(route);const n=dialogs.length;answers.push(null);await press(selector,850);assert.equal(dialogs.length,n+1);assert.equal(await evaluate('location.hash'),'#'+route);await unchanged(before);
 }
 // Existing category move through the new two-choice dialog.
 await navigate('A');await press('#nodeCategorySymbol button',850);await choose('object','y');
 assert.equal(await evaluate("testApp.getNode('A').icon"),'y');assert.equal(await evaluate("testApp.getNode('A').isImmigrant"),true);assert.equal(await evaluate('location.hash'),'#A');assert.equal(await evaluate("document.getElementById('immigrantStatus').textContent.includes('Inflyttare')"),true);
 const moved=JSON.parse(await get()),moveExpected=JSON.parse(before);moveExpected.nodes[0].icon='y';moveExpected.nodes[0].isImmigrant=true;moveExpected.state.modifications=moved.state.modifications;assert.deepEqual(moved,moveExpected);assert.deepEqual(await metrics(),[1,3,0]);
 assert.equal(await evaluate("testApp.templateFor('y').sourceId"),'C');
 // No-op UI move causes no writes/timestamps. Explicit controls are keyboard accessible.
 await evaluate('qa.saves=0;qa.writes=0');before=await get();await click('#editNodeCategory');await choose('object','y');await unchanged(before);
 await evaluate("document.querySelector('#nodeCategorySymbol button').focus()");await send('Input.dispatchKeyEvent',{type:'keyDown',key:'F2',code:'F2'});assert.equal(await dialogOpen(),true);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await unchanged(before);
 // Local reload preserves the entire payload and marks the immigrant in read mode.
 before=await get();await reload();assert.equal(await get(),before);assert.equal(await evaluate('testApp.mode'),'read');assert.equal(await evaluate("getComputedStyle(document.getElementById('clearImmigrantStatus')).display"),'none');await unchanged(before);
 await creative();await click('#clearImmigrantStatus');assert.equal(await evaluate("'isImmigrant' in testApp.getNode('A')"),false);assert.deepEqual(await metrics(),[1,3,0]);
 // Move an existing immigrant to a previously unused exact symbol without copying any template rows.
 await reset();const repeatedBefore=JSON.parse(await get());
 const unused=`Unused / % '\" \u96ea`;
 await click('#editNodeCategory');await choose('object',unused);
 assert.equal(await evaluate("testApp.getNode('A').isImmigrant"),true);
 assert.equal(await evaluate('testApp.templateFor('+JSON.stringify(unused)+').sourceId'),null);
 await click('#editNodeCategory');await choose('object','z');
 const repeatedAfter=JSON.parse(await get()),repeatedExpected=structuredClone(repeatedBefore);
 repeatedExpected.nodes[0].icon='z';repeatedExpected.nodes[0].isImmigrant=true;repeatedExpected.state.modifications=repeatedAfter.state.modifications;
 assert.deepEqual(repeatedAfter,repeatedExpected);assert.deepEqual(await metrics(),[2,6,0]);
 // Existing appearance UI cannot bypass moves; changing only color remains ordinary.
 await reset();await navigate('B');await click('#editNodeAppearance');await evaluate("document.getElementById('appColorInput').value='#654321'");await click('button[onclick="app.saveAppearance()"]');assert.equal(await evaluate("testApp.getNode('B').isImmigrant"),false);assert.deepEqual(await metrics(),[1,3,0]);
 await click('#editNodeAppearance');await evaluate("document.getElementById('appIconInput').value='y'");await click('button[onclick="app.saveAppearance()"]');assert.equal(await evaluate("testApp.getNode('B').isImmigrant"),true);assert.equal(await evaluate("testApp.templateFor('y').sourceId"),'C');
 await click('#clearImmigrantStatus');assert.equal(await evaluate("testApp.templateFor('y').sourceId"),'B');
 // Whole-category collision rejects without intermediate changes, including metadata-only targets.
 await reset();before=await get();await click('#editNodeCategory');await click('#symbolEditChoices button:nth-child(2)');
 for(const symbol of ['y','stored-only','']){await evaluate('document.getElementById("symbolEditInput").value='+JSON.stringify(symbol));await click('#symbolEditForm button');await unchanged(before);assert.equal(await dialogOpen(),true);assert((await evaluate("document.getElementById('symbolEditError').textContent")).length>0)}
 await evaluate("document.getElementById('symbolEditInput').value='x'");await click('#symbolEditForm button');await unchanged(before);assert.equal(await dialogOpen(),false);
 const symbol=` '"/%\u96ea\ud83d\udc09|<svg onload="qa.payloads++"> `;
 await click('#editNodeCategory');await choose('category',symbol);
 const categoryState=JSON.parse(await get()),categoryExpected=JSON.parse(before);categoryExpected.nodes.filter(n=>n.icon==='x').forEach(n=>n.icon=symbol);categoryExpected.state.categories[0].symbol=symbol;assert.deepEqual(categoryState,categoryExpected);assert.deepEqual(await metrics(),[1,3,0]);
 assert.equal(await evaluate('location.hash'),'#category/'+encodeURIComponent(symbol));assert.equal(await evaluate("document.querySelector('h1.item-name').textContent"),symbol.toUpperCase());assert.equal(await evaluate("testApp.templateFor(testApp.activeCategorySymbol).sourceId"),'B');
 assert.equal(await evaluate("document.querySelectorAll('#mainContent svg,#mainContent img,#mainContent script').length"),0);
 before=await get();await reload();assert.equal(await get(),before);await unchanged(before);
 // Rendering and mouse navigation with renamed symbols never normalizes legacy records.
 await creative();await navigate('A');await evaluate('qa.saves=0;qa.writes=0');before=await get();await click('#nodeCategorySymbol button');assert.equal(await evaluate('location.hash'),'#category/'+encodeURIComponent(symbol));await unchanged(before);
 // Force the same expired Fetch-ID lifecycle: abort while a local request is paused,
 // then resolve its disposition only after Chromium confirms Network cancellation.
 await interception.drain();
 const staleBefore=interception.stats.staleCanceled;
 const held=holdLocalRequest('/qa-aborted-request');
 await evaluate("window.qaAbortController=new AbortController();window.qaAbortResult=null;fetch('/qa-aborted-request',{signal:qaAbortController.signal}).catch(e=>qaAbortResult=e.name);true");
 let pauseDeadline;
 const aborted=await Promise.race([held.paused,new Promise((_,reject)=>{pauseDeadline=setTimeout(()=>reject(Error('Local Fetch request did not reach interception')),5000)})]).finally(()=>clearTimeout(pauseDeadline));
 await evaluate('qaAbortController.abort();true');
 assert.equal(await interception.waitForCancellation(aborted.networkId),true);
 held.release();
 await interception.drain();
 assert.equal(interception.stats.staleCanceled,staleBefore+1);
 assert.equal(await evaluate('qaAbortResult'),'AbortError');
 await unchanged(before);
 console.log('PASS: 800 ms mouse/touch long press; quick navigation; early release; pointer cancel; movement; scrolling; rerender; no duplicate click; read locks; list/header renames and F2/Escape controls.');
 console.log('PASS: existing/new category rules; immigrant display/clear/local reload; template exclusion/restored eligibility; appearance bypass blocked; atomic collision rejection and cosmetic metadata rename; complete snapshots/edges preserved.');
 console.log('PASS: native capture release at 150 ms cancels the held edit; canceled Fetch IDs are correlated and awaited without weakening external blocking.');
 console.log('PASS: safe exact special symbols/names, zero no-op/navigation writes; every logical local save writes only the existing three keys; no page errors, payload execution or external requests.');
}).catch(error=>{console.error(error.stack);process.exitCode=1});
