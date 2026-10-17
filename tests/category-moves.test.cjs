const test=require('node:test');
const assert=require('node:assert/strict');
const {fixture,plain}=require('./support/task003a-harness.cjs');

test('move to existing category changes only icon/status plus intentional endpoint clocks',()=>{
 const f=fixture(),{app}=f,before=f.snapshot();
 assert.equal(app.moveNodeCategory('A','y'),true);
 const expected=plain(before);expected.nodes[0].icon='y';expected.nodes[0].isImmigrant=true;expected.state.modifications=plain(app.categoryState.modifications);
 assert.deepEqual(f.snapshot(),expected);assert.equal(f.saves(),1);assert.equal(app.lastRoute,'A');
 assert.deepEqual(plain(app.getNeighbors('A')),['C']);assert.deepEqual(plain(app.getNeighbors('A',true)),['D']);
 assert.equal(app.templateFor('x').sourceId,'B');assert.equal(app.templateFor('y').sourceId,'C');
 assert.deepEqual(plain(app.templateFor('y').rows),[{symbol:'x'},{symbol:'y'}]);
 assert.deepEqual(Object.keys(app.nodes[0]).sort(),Object.keys(expected.nodes[0]).sort());
});
test('move to unused exact special symbol then move immigrant again preserves IDs and all edges',()=>{
 const f=fixture(),{app}=f,edges=JSON.stringify(app.edges),id=app.nodes[0].id;
 const symbol=` '"/%\u96ea\ud83d\udc09 <img onerror=bad()> `;
 assert.equal(app.moveNodeCategory('A',symbol),true);assert.equal(app.nodes[0].icon,symbol);assert.equal(app.nodes[0].id,id);
 assert.equal(app.templateFor(symbol).sourceId,null);assert.deepEqual(plain(app.templateFor(symbol).rows),[]);
 assert.equal(app.moveNodeCategory('A','z'),true);assert.equal(app.nodes[0].isImmigrant,true);assert.equal(JSON.stringify(app.edges),edges);assert.equal(f.saves(),2);
});
test('all rejected/no-op moves preserve full snapshots, clocks and zero logical saves',()=>{
 const f=fixture(),{app}=f,before=f.snapshot();
 for(const [id,symbol] of [['A','x'],['missing','y'],['A',''],['A',null],['A',7]])assert.equal(app.moveNodeCategory(id,symbol),false);
 app.mode='read';assert.equal(app.moveNodeCategory('A','y'),false);
 assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),0);
});
test('appearance symbol path shares immigrant rules, color-only edits do not create status',()=>{
 const f=fixture(),{app,document}=f;
 app.appearanceTargetId='A';document.getElementById('appIconInput').value='x';document.getElementById('appColorInput').value='#654321';app.saveAppearance();
 assert.equal(app.nodes[0].isImmigrant,undefined);assert.equal(app.nodes[0].color,'#654321');assert.equal(f.saves(),1);
 app.appearanceTargetId='A';document.getElementById('appIconInput').value='y';app.saveAppearance();assert.equal(app.nodes[0].isImmigrant,true);assert.equal(f.saves(),2);
 const before=f.snapshot();app.appearanceTargetId='A';app.saveAppearance();assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),2);
 app.appearanceTargetId='A';document.getElementById('appIconInput').value='';app.saveAppearance();assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),2);
});
test('legacy fallback same-category appearance save does not normalize icons or mark immigrants',()=>{
 for(const icon of ['',null,undefined]){
 const f=fixture(),{app,document}=f;if(icon===undefined)delete app.nodes[0].icon;else app.nodes[0].icon=icon;
 const before=f.snapshot();app.appearanceTargetId='A';document.getElementById('appIconInput').value='&';document.getElementById('appColorInput').value='#123456';app.saveAppearance();
 assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),0);
 }
});
test('clear immigrant immediately restores eligibility without clock rewrites; repeated/read operations do not save',()=>{
 const f=fixture(),{app}=f;app.nodes[1].isImmigrant=true;
 assert.equal(app.templateFor('x').sourceId,'A');const before=f.snapshot();
 app.mode='read';assert.equal(app.clearImmigrantStatus('B'),false);assert.equal(f.saves(),0);
 app.mode='create';assert.equal(app.clearImmigrantStatus('B'),true);assert.equal(app.templateFor('x').sourceId,'B');
 const expected=plain(before);delete expected.nodes[1].isImmigrant;assert.deepEqual(f.snapshot(),expected);assert.equal(f.saves(),1);
 assert.equal(app.clearImmigrantStatus('B'),false);assert.equal(app.clearImmigrantStatus('missing'),false);assert.equal(app.clearImmigrantStatus('A'),false);assert.equal(f.saves(),1);
});
test('immigrant candidates excluded independently of score, name, ID, clocks and paused relationships',()=>{
 const f=fixture(),{app}=f;app.nodes[1].isImmigrant=true;app.categoryState.modifications[1].at=999999;
 const before=f.snapshot();assert.equal(app.templateFor('x').sourceId,'A');
 app.nodes[0].isImmigrant=true;assert.equal(app.templateFor('x').sourceId,null);assert.deepEqual(plain(app.templateFor('x').rows),[]);
 delete app.nodes[0].isImmigrant;assert.deepEqual(f.snapshot(),before);
});
test('eligible template ties retain score, latest-modified and stable ascending ID order',()=>{
 const {app}=fixture();app.edges=[];app.categoryState.modifications=[];app.nodes.reverse();
 assert.equal(app.templateFor('x').sourceId,'A');app.touchNodes(['B']);assert.equal(app.templateFor('x').sourceId,'B');
 app.nodes.find(n=>n.id==='B').isImmigrant=true;assert.equal(app.templateFor('x').sourceId,'A');
 app.nodes.find(n=>n.id==='A').isImmigrant=true;assert.equal(app.templateFor('x').sourceId,null);
});
test('category-wide rename is one save: notes/unknown fields follow; edges/clocks/status stay byte-for-byte',()=>{
 const f=fixture(),{app}=f;app.nodes[0].isImmigrant=true;const before=f.snapshot(),edges=JSON.stringify(app.edges),clocks=JSON.stringify(app.categoryState.modifications);
 const symbol=` '"/%\u00c5\ud83d\udc09|<svg onload=bad()> `;
 assert.equal(app.renameCategorySymbol('x',symbol),true);
 const expected=plain(before);for(const n of expected.nodes)if(n.icon==='x')n.icon=symbol;expected.state.categories[0].symbol=symbol;
 assert.deepEqual(f.snapshot(),expected);assert.equal(JSON.stringify(app.edges),edges);assert.equal(JSON.stringify(app.categoryState.modifications),clocks);assert.equal(f.saves(),1);
 assert.equal(app.lastRoute,'category/'+encodeURIComponent(symbol));assert.equal(app.templateFor(symbol).sourceId,'B');
 assert(plain(app.templateFor('y').rows).some(r=>r.symbol===symbol));
});
test('membership and metadata-only category collisions reject atomically with zero saves',()=>{
 const f=fixture(),{app}=f,before=f.snapshot();
 for(const to of ['y','stored-only','x','',null,7])assert.equal(app.renameCategorySymbol('x',to),false);
 assert.equal(app.renameCategorySymbol('absent','new'),false);app.mode='read';assert.equal(app.renameCategorySymbol('x','new'),false);
 assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),0);
});
test('default category rename intentionally changes only actual fallback members, preserving falsey legacy values elsewhere',()=>{
 const f=fixture(),{app}=f;app.nodes[0].icon='';app.nodes[1].icon=null;delete app.nodes[2].icon;app.nodes[3].icon='&';app.nodes[4].icon=' ';
 app.categoryState.categories.push({symbol:'&',notes:'Default notes',unknown:[false]});const before=f.snapshot();
 assert.equal(app.renameCategorySymbol('&','New'),true);const expected=plain(before);
 expected.nodes.slice(0,4).forEach(n=>n.icon='New');expected.state.categories.at(-1).symbol='New';assert.deepEqual(f.snapshot(),expected);assert.equal(f.saves(),1);
});
test('category rename retains template eligibility/order and updates related-symbol displays',()=>{
 const f=fixture(),{app}=f;const source=app.templateFor('x').sourceId,clocks=plain(app.categoryState.modifications);
 app.renameCategorySymbol('x','new');assert.equal(app.templateFor('new').sourceId,source);assert.deepEqual(plain(app.categoryState.modifications),clocks);
 assert.deepEqual(plain(app.templateFor('y').rows),[{symbol:'new'}]);assert.equal(app.categoryMembers('x').length,0);
});
test('object rename preserves immutable identity, status, both edge sets and all other fields',()=>{
 const f=fixture(),{app}=f;app.nodes[0].isImmigrant=true;const before=f.snapshot();
 const title=`Name '" \u96ea <img onerror=bad()> / %`;
 assert.equal(app.renameNode('A',title),true);const expected=plain(before);expected.nodes[0].title=title;expected.state.modifications=plain(app.categoryState.modifications);
 assert.deepEqual(f.snapshot(),expected);assert.equal(f.saves(),1);assert.equal(f.renders(),1);
});
test('rename cancellation, empty/invalid/unchanged/duplicate/read-mode requests produce zero writes',()=>{
 const f=fixture(),{app}=f,before=f.snapshot();
 for(const value of [null,undefined,7,'','  ','Alpha',' Alpha ',' beta ','BETA'])assert.equal(app.renameNode('A',value),false);
 assert.equal(app.renameNode('missing','New'),false);
 for(const value of [null,'','  ','Alpha',' Alpha ',' beta ']){f.prompts.push(value);app.requestRenameNode('A')}
 app.mode='read';assert.equal(app.renameNode('A','New'),false);app.requestRenameNode('A');
 assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),0);
});
test('local round trip preserves full immigrant/category/edge snapshots and library naming',async()=>{
 const f=fixture(),{app}=f;app.moveNodeCategory('A','y');const before=f.snapshot();
 await app.sync();app.nodes=[];app.edges=[];app.categoryState=null;app.fallbackLocal();
 assert.deepEqual(f.snapshot(),before);assert.equal(app.getDocName(),'nv_lib_synthetic-task003a');
 assert.equal(app.nodes[0].isImmigrant,true);app.clearImmigrantStatus('A');const cleared=f.snapshot();await app.sync();app.fallbackLocal();assert.deepEqual(f.snapshot(),cleared);
});
test('mock-cloud save and actual snapshot reload preserve immigrant flag, category metadata and unknown document fields',async()=>{
 const f=fixture(),{app,context}=f;let cloud={unknown:{keep:[false,null]}};
 const ref={set:async(payload,options)=>{assert.equal(options.merge,true);cloud={...cloud,...plain(payload)}},onSnapshot:callback=>{callback({exists:true,data:()=>plain(cloud)});return ()=>{}}};
 app.db={collection:()=>({doc:()=>ref})};app.moveNodeCategory('A','y');await app.sync();const before=f.snapshot();
 context.firebase={apps:[{}],firestore:()=>({collection:()=>({doc:()=>ref})})};app.nodes=[];app.edges=[];app.categoryState=null;app.initFirebase();
 assert.deepEqual(f.snapshot(),before);assert.deepEqual(cloud.unknown,{keep:[false,null]});assert.equal(app.nodes[0].isImmigrant,true);
});
test('render/navigation and mixed immigrant metadata never mutate legacy records',()=>{
 const f=fixture(),{app}=f;app.nodes[0].isImmigrant=true;app.nodes[1].isImmigrant=false;
 const before=f.snapshot();app.templateFor('x');app.renderPage('A');app.renderCategory('x');app.renderOverview();
 assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),0);
});
test('read mode blocks every new mutation and dialog path even when called directly',()=>{
 const f=fixture(),{app}=f;app.nodes[0].isImmigrant=true;app.mode='read';const before=f.snapshot();
 app.openSymbolEditDialog('A');app.symbolEditContext={nodeId:'A',source:'x',kind:'object'};f.document.getElementById('symbolEditInput').value='y';app.saveSymbolEdit();
 app.moveNodeCategory('A','y');app.renameCategorySymbol('x','new');app.clearImmigrantStatus('A');app.renameNode('A','New');
 assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),0);
});
test('800 ms long press fires once, swallows following click; next quick press navigates',()=>{
 const f=fixture(),{app}=f;let opens=0;app.openSymbolEditDialog=id=>{assert.equal(id,'A');opens++};
 const b=app.symbolButton('x','list-symbol','A');b.dispatch('pointerdown');f.advance(799);assert.equal(opens,0);f.advance(1);assert.equal(opens,1);f.advance(1000);assert.equal(opens,1);
 b.dispatch('pointerup');assert.equal(b.dispatch('click').prevented,true);assert.equal(app.lastRoute,undefined);
 b.dispatch('pointerdown');b.dispatch('pointerup');b.dispatch('click');assert.equal(app.lastRoute,'category/x');assert.equal(opens,1);
});
test('early release, movement, cancellation, capture loss, rerender and read lock invalidate pending callbacks',()=>{
 for(const cause of ['early','move','cancel','lost','render','scroll','read','removed','secondary']){
 const f=fixture(),{app}=f;let opens=0;app.openSymbolEditDialog=()=>opens++;const b=app.symbolButton('x','list-symbol','A');b.dispatch('pointerdown');f.advance(799);
 if(cause==='early')b.dispatch('pointerup');if(cause==='move')b.dispatch('pointermove',{clientX:9});if(cause==='cancel')b.dispatch('pointercancel');if(cause==='lost')b.dispatch('lostpointercapture');
 if(cause==='render')app.resetPresses();if(cause==='scroll')app.cancelLongPress(true);if(cause==='read')app.mode='read';if(cause==='removed')b.isConnected=false;if(cause==='secondary')b.dispatch('pointerdown',{isPrimary:false,pointerId:2});
 f.advance(2000);assert.equal(opens,0,cause);assert.equal(f.timers.size,0,cause);assert.equal(f.saves(),0);
 }
});
test('long-press title uses existing rename workflow; quick click/F2 remain safe closures for exact IDs',()=>{
 const f=fixture(),{app}=f;const node=app.nodes[0];node.id=`id/'"%\u96ea`;node.title='<img onerror=bad()>';let renames=0;app.requestRenameNode=id=>{assert.equal(id,node.id);renames++};
 const a=app.titleLink(node);assert.equal(a.textContent,node.title);assert.equal(a.innerHTML,'');
 a.dispatch('pointerdown');f.advance(800);a.dispatch('pointerup');a.dispatch('click');assert.equal(renames,1);assert.equal(app.lastRoute,undefined);
 a.dispatch('pointerdown');a.dispatch('pointerup');a.dispatch('click');assert.equal(app.lastRoute,node.id);
 a.dispatch('keydown',{key:'F2'});assert.equal(renames,2);app.mode='read';a.dispatch('keydown',{key:'F2'});assert.equal(renames,2);
});
test('stale symbol dialog cannot move a node whose category changed; collision and unchanged UI paths do not save',()=>{
 const f=fixture(),{app,document}=f;app.openSymbolEditDialog('A');app.chooseSymbolEdit('category');document.getElementById('symbolEditInput').value='stored-only';app.saveSymbolEdit();assert.equal(f.saves(),0);
 document.getElementById('symbolEditInput').value='x';app.saveSymbolEdit();assert.equal(app.symbolEditContext,null);assert.equal(f.saves(),0);
 app.openSymbolEditDialog('A');app.chooseSymbolEdit('object');app.nodes[0].icon='y';const before=f.snapshot();document.getElementById('symbolEditInput').value='z';app.saveSymbolEdit();assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),0);
});

test('editing operations never run inherited dangling-edge cleanup as an unrelated side effect',()=>{
 for(const action of [a=>a.moveNodeCategory('A','y'),a=>a.renameCategorySymbol('x','new'),a=>a.renameNode('A','Changed'),a=>a.clearImmigrantStatus('A')]){
  const f=fixture(),{app}=f;app.nodes[0].isImmigrant=true;app.edges.push({a:'missing-legacy-id',b:'A',paused:true,unknown:{preserve:['all']}});
  const before=JSON.stringify(app.edges);assert.equal(action(app),true);assert.equal(JSON.stringify(app.edges),before);assert.equal(f.saves(),1);
 }
});
test('move clocks update only the moved node and active neighbors; existing clock metadata survives',()=>{
 const f=fixture(),{app}=f;const before=plain(app.categoryState.modifications);app.moveNodeCategory('A','y');
 assert.deepEqual(app.categoryState.modifications.map(r=>r.id),['A','B','C']);
 assert(app.categoryState.modifications[0].at>before[0].at);assert.equal(app.categoryState.modifications[0].unknown,'clock metadata');assert.deepEqual(plain(app.categoryState.modifications[1]),before[1]);assert(!app.categoryState.modifications.find(r=>r.id==='D'));
});
test('cosmetic rename preserves multiple source metadata records and stored-only categories atomically',()=>{
 const f=fixture(),{app}=f;app.categoryState.categories.push({symbol:'x',notes:'Second source metadata',unknown:[1]});const before=f.snapshot();
 assert.equal(app.renameCategorySymbol('x',' '),true);const expected=plain(before);expected.nodes.filter(n=>n.icon==='x').forEach(n=>n.icon=' ');expected.state.categories.filter(c=>c.symbol==='x').forEach(c=>c.symbol=' ');assert.deepEqual(f.snapshot(),expected);
 assert.equal(app.renameCategorySymbol('stored-only','metadata-new'),true);assert.equal(app.categoryState.categories[1].notes,'Do not overwrite');assert.equal(f.saves(),2);
});
test('read-only symbol and title presses keep quick navigation and never activate keyboard edit alternatives',()=>{
 const f=fixture(),{app}=f;app.mode='read';let opens=0;app.openSymbolEditDialog=()=>opens++;app.requestRenameNode=()=>opens++;
 const b=app.symbolButton('x','list-symbol','A'),a=app.titleLink(app.nodes[0]);
 for(const element of [b,a]){element.dispatch('pointerdown');f.advance(1000);element.dispatch('pointerup');element.dispatch('click');element.dispatch('keydown',{key:'F2'})}
 assert.equal(opens,0);assert.equal(f.timers.size,0);assert.equal(f.saves(),0);assert.equal(app.lastRoute,'A');
});

test('appearance defaults are a no-op for absent/null/empty legacy colors in the current category',()=>{
 for(const color of [undefined,null,'']){
  const f=fixture(),{app,document}=f;if(color===undefined)delete app.nodes[0].color;else app.nodes[0].color=color;
  const before=f.snapshot();app.appearanceTargetId='A';document.getElementById('appIconInput').value='x';document.getElementById('appColorInput').value='#202122';app.saveAppearance();
  assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),0);
 }
});

test('capture ownership lost at 150 ms cancels at threshold without a lostpointercapture event',()=>{
 const f=fixture(),{app}=f;let opens=0;app.openSymbolEditDialog=()=>opens++;
 const b=app.symbolButton('x','list-symbol','A');b.dispatch('pointerdown');f.advance(150);b.releasePointerCapture(1);assert.equal(b.hasPointerCapture(1),false);
 f.advance(650);assert.equal(opens,0);assert.equal(app.pendingPress,null);assert.equal(f.timers.size,0);
 b.dispatch('pointerup');assert.equal(b.dispatch('click').prevented,true);assert.equal(app.lastRoute,undefined);assert.equal(f.saves(),0);
 b.dispatch('pointerdown');b.dispatch('pointerup');b.dispatch('click');assert.equal(app.lastRoute,'category/x');b.dispatch('keydown',{key:'F2'});assert.equal(opens,1);
});
test('capture checks fail safely and known ownership loss on movement invalidates immediately',()=>{
 for(const cause of ['missing','throws','failed acquisition','movement']){
 const f=fixture(),{app}=f;let opens=0;app.openSymbolEditDialog=()=>opens++;const b=app.symbolButton('x','list-symbol','A');
 if(cause==='missing')b.hasPointerCapture=undefined;
 if(cause==='throws')b.hasPointerCapture=()=>{throw Error('Synthetic capture failure')};
 if(cause==='failed acquisition')b.setPointerCapture=()=>{throw Error('Synthetic inactive pointer')};
 b.dispatch('pointerdown');
 if(cause==='movement'){b.releasePointerCapture(1);b.dispatch('pointermove',{clientX:1});assert.equal(app.pendingPress,null);assert.equal(f.timers.size,0)}
 f.advance(1000);assert.equal(opens,0,cause);assert.equal(f.timers.size,0);assert.equal(b.dispatch('click').prevented,true);assert.equal(f.saves(),0);
 }
});
