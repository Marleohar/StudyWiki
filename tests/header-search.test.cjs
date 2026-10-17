const test=require('node:test');
const assert=require('node:assert/strict');
const {fixture,plain}=require('./support/task003a-harness.cjs');
function setup(){
 const f=fixture();f.document.body={setAttribute(){}};
 Object.assign(f.app,{searchOpen:false,headerMenuOpen:false,connectionState:'offline',searchResults:[],searchActiveIndex:-1});
 return f;
}
function query(f,text){f.document.getElementById('searchInput').value=text;f.app.updateSearchSuggestions()}
function noChange(f,before){assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),0);assert.equal(f.storage.size,0)}

test('search ranks prefixes before substrings, then deterministic folded title/ID ordering with an eight-result cap',()=>{
 const f=setup(),{app}=f;app.nodes=[{id:'z',title:'Pine Apple'},{id:'2',title:'apple'},{id:'1',title:'Apple'},{id:'a',title:'Apricot'},{id:'b',title:'Crapapple'}];
 const before=f.snapshot();assert.deepEqual(plain(app.searchMatches(' AP ').map(n=>n.id)),['1','2','a','b','z']);
 app.nodes=Array.from({length:12},(_,i)=>({id:String(i),title:'Match '+String(i).padStart(2,'0')}));assert.equal(app.searchMatches('match').length,8);app.nodes=before.nodes;noChange(f,before);
});
test('header/search disclosure, status and mode updates touch only UI and never invalidate a pending main-page press',()=>{
 const f=setup(),{app,document}=f,before=f.snapshot();const press={cancel(){throw Error('Header interaction canceled a main-page press')}};app.pendingPress=press;const revision=app.pressRevision;
 app.toggleSearch();assert.equal(app.searchOpen,true);assert.equal(document.activeElement,document.getElementById('searchInput'));
 query(f,'Alpha');app.closeSearch();assert.equal(document.getElementById('searchSuggestions').hidden,true);assert.equal(document.getElementById('btnSearchToggle').attributes['aria-expanded'],'false');
 app.toggleHeaderMenu();assert.equal(document.activeElement,document.getElementById('btnModeLock'));
 for(const [state,label]of [['connecting','Ansluter\u2026'],['online','Synkad'],['offline','Lokal/offline']]){app.setConnectionStatus(state);assert.equal(document.getElementById('dbStatus').textContent,label)}
 assert.equal(document.getElementById('menuMode').hidden,false);app.closeHeaderMenu();assert.equal(document.getElementById('btnMenu').attributes['aria-expanded'],'false');
 assert.equal(app.pendingPress,press);assert.equal(app.pressRevision,revision);noChange(f,before);
});
test('suggestions use safe DOM text and ID closures, including stale-library rejection',()=>{
 const f=setup(),{app,document}=f;const title=`Alpha '" \u96ea <img onerror=bad()>`,id=`id/'"%/\u96ea`;app.nodes[0].title=title;app.nodes[0].id=id;
 const before=f.snapshot();app.toggleSearch();query(f,'alpha');const option=document.getElementById('searchSuggestions').children[0];assert.equal(option.textContent,title);assert.equal(option.innerHTML,'');
 option.dispatch('pointerdown');option.dispatch('click');assert.equal(app.lastRoute,id);
 app.currentLibrary='another';delete app.lastRoute;option.dispatch('click');assert.equal(app.lastRoute,undefined);noChange(f,before);
});
test('ArrowDown/Up/Enter use a deliberate selection; Escape clears suggestions before closing search',()=>{
 const f=setup(),{app,document}=f,before=f.snapshot();app.toggleSearch();query(f,'a');let prevented=0;
 const key=key=>app.handleSearchKeydown({key,preventDefault(){prevented++}});
 key('ArrowDown');assert.equal(app.searchActiveIndex,0);key('ArrowUp');assert.equal(app.searchActiveIndex,app.searchResults.length-1);
 const selected=app.searchResults[app.searchActiveIndex];key('Enter');assert.equal(app.lastRoute,selected);
 query(f,'a');key('Escape');assert.equal(app.searchOpen,true);assert.equal(document.getElementById('searchSuggestions').hidden,true);key('Escape');assert.equal(app.searchOpen,false);assert(prevented>=5);noChange(f,before);
});
test('exact case-insensitive search navigates, missing creative search prefills a dialog, blank input does nothing',()=>{
 const f=setup(),{app,document}=f,before=f.snapshot();app.toggleSearch();query(f,' aLpHa ');assert.equal(document.getElementById('btnSearchGo').textContent,'G\u00e5 till');app.handleSearch();assert.equal(app.lastRoute,'A');
 query(f,'Requested new title');assert.equal(document.getElementById('btnSearchGo').textContent,'Skapa');app.handleSearch();assert.equal(document.getElementById('modalTitle').value,'Requested new title');assert.equal(document.getElementById('createDialog').style.display,'flex');app.closeCreateDialog();
 for(const text of ['', '  ']){query(f,text);app.handleSearch();assert.equal(document.getElementById('btnSearchGo').disabled,true);assert.equal(document.getElementById('createDialog').style.display,'none')}
 noChange(f,before);
});
test('read-mode missing search shows unlock guidance and every creation/name-save entry stays guarded',()=>{
 const f=setup(),{app,document}=f;app.mode='read';const before=f.snapshot();app.toggleSearch();query(f,'Missing');app.handleSearch();app.openCreateDialog('Blocked');
 assert.equal(document.getElementById('btnSearchGo').attributes['aria-disabled'],'true');assert.match(document.getElementById('searchHint').textContent,/skaparl/);
 app.saveNewNode();assert.equal(app.saveCategoryName('x','Blocked'),false);noChange(f,before);
});
test('creation options union exact symbols with metadata-only categories and named/neutral labels without mutation',()=>{
 const f=setup(),{app,document}=f;const symbol=` /%'"\u96ea `;app.nodes.push({id:'special',title:'Special',icon:symbol});app.nodes.push({id:'default',title:'Default',icon:null});
 app.categoryState.categories.push({symbol,name:'Human <img onerror=bad()>',notes:'Kept',future:{a:false}});
 app.categoryState.categories.push({symbol,unknown:'duplicate legacy metadata'});const before=f.snapshot();
 const choices=plain(app.categoryChoices());assert.equal(choices.filter(c=>c.symbol===symbol).length,1);assert(choices.some(c=>c.symbol==='stored-only'));assert(choices.some(c=>c.symbol==='&'));assert.equal(choices.find(c=>c.symbol===symbol).name,'Human <img onerror=bad()>');
 app.openCreateDialog('Prefill');const option=document.getElementById('creationCategory').children.find(o=>o.value===symbol);assert.equal(option.textContent,symbol+' Human <img onerror=bad()>');assert.equal(option.innerHTML,'');app.closeCreateDialog();noChange(f,before);
});
test('empty libraries offer explicit default; category-page creation preselects its exact origin including an empty view',()=>{
 const f=setup(),{app,document}=f;app.nodes=[];app.edges=[];app.categoryState.categories=[];assert.deepEqual(plain(app.categoryChoices()),[{symbol:'&',name:'Namnl\u00f6s kategori'}]);
 app.openCreateDialog();assert.equal(document.getElementById('creationCategory').value,'&');app.closeCreateDialog();app.activeCategorySymbol=' \u96ea/% ';app.openCreateDialog();assert.equal(document.getElementById('creationCategory').value,' \u96ea/% ');assert.equal(f.saves(),0);
});
test('successful creation uses selected symbol, original shape and one save; preserves all existing fields/edges and is not an immigrant',()=>{
 const f=setup(),{app,document}=f,before=f.snapshot();app.activeCategorySymbol='x';app.openCreateDialog('New object');document.getElementById('creationCategory').value='stored-only';document.getElementById('modalFreeText').value='Text \u96ea';
 app.saveNewNode();assert.equal(f.saves(),1);assert.equal(f.storage.size,3);assert.deepEqual([...f.storage.keys()].sort(),['nv_categories_nv_lib_synthetic-task003a','nv_edges_nv_lib_synthetic-task003a','nv_nodes_nv_lib_synthetic-task003a']);const node=app.getNodeByTitle('New object');assert.match(node.id,/^n_/);assert.equal(node.icon,'stored-only');assert.equal(node.isImmigrant,undefined);assert.deepEqual(plain(node.free_text),{sv:'Text \u96ea',en:'Text \u96ea'});assert.equal(app.lastRoute,node.id);
 assert.deepEqual(plain(app.nodes.slice(0,-1)),before.nodes);assert.deepEqual(plain(app.edges),before.edges);assert.deepEqual(plain(app.categoryState.categories),before.state.categories);assert.deepEqual(Object.keys(node).sort(),['color','free_text','icon','id','title']);
 app.saveNewNode();assert.equal(f.saves(),1);
});
test('duplicate, blank, tampered and stale-library creation selections write nothing',()=>{
 for(const mode of ['duplicate','blank','invalid','other-library','cancel']){
  const f=setup(),{app,document}=f,before=f.snapshot();app.openCreateDialog('New');
  if(mode==='duplicate')document.getElementById('modalTitle').value=' ALPHA ';if(mode==='blank')document.getElementById('modalTitle').value=' ';if(mode==='invalid')document.getElementById('creationCategory').value='not offered';if(mode==='other-library')app.currentLibrary='other';if(mode==='cancel')app.closeCreateDialog();
  app.saveNewNode();noChange(f,before);
 }
});
test('optional category names preserve notes/unknown metadata and avoid duplicate records or no-op writes',()=>{
 const f=setup(),{app}=f,before=f.snapshot();assert.equal(app.saveCategoryName('x','Weapons'),true);assert.equal(f.saves(),1);const expected=plain(before);expected.state.categories[0].name='Weapons';assert.deepEqual(f.snapshot(),expected);
 app.saveCategoryName('x','Weapons');app.saveCategoryName('x',' Weapons ');assert.equal(f.saves(),1);app.saveCategoryName('x','');delete expected.state.categories[0].name;assert.deepEqual(f.snapshot(),expected);assert.equal(f.saves(),2);
 app.saveCategoryName('unrecorded','');assert.equal(f.saves(),2);app.saveCategoryName('unrecorded','New name');assert.equal(app.categoryState.categories.filter(c=>c.symbol==='unrecorded').length,1);assert.equal(app.categoryName('unrecorded'),'New name');
});
test('category symbol rename retains its name; read/render/search preserve unnamed legacy metadata',()=>{
 const f=setup(),{app}=f;app.categoryState.categories[0].name='Category name';const edges=JSON.stringify(app.edges),clocks=JSON.stringify(app.categoryState.modifications);
 app.renameCategorySymbol('x','new symbol');assert.equal(app.categoryName('new symbol'),'Category name');assert.equal(JSON.stringify(app.edges),edges);assert.equal(JSON.stringify(app.categoryState.modifications),clocks);
 const before=f.snapshot(),saves=f.saves();app.renderCategory('stored-only');app.toggleSearch();query(f,'Alpha');app.categoryChoices();assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),saves);
});
test('category names and selected-symbol creation survive complete local and mocked cloud round trips',async()=>{
 const f=setup(),{app,document,context}=f;app.saveCategoryName('stored-only','Named');app.openCreateDialog('Cloud new');document.getElementById('creationCategory').value='stored-only';app.saveNewNode();const before=f.snapshot();
 app.nodes=[];app.edges=[];app.categoryState=null;app.fallbackLocal();assert.deepEqual(f.snapshot(),before);
 const data={nodes:plain(app.nodes),edges:plain(app.edges),symbolCategories:plain(app.categoryState)};
 context.firebase={apps:[{}],firestore:()=>({collection:()=>({doc:()=>({onSnapshot(cb){cb({exists:true,data:()=>data});return()=>{}}})})})};app.nodes=[];app.edges=[];app.categoryState=null;app.initFirebase();assert.deepEqual(f.snapshot(),before);
});
test('library switching clears old suggestions/dialog state and preserves legacy document names and selected-library storage',()=>{
 const f=setup(),{app,document}=f;app.toggleSearch();query(f,'Alpha');app.openCreateDialog('Stale');app.toggleHeaderMenu();
 const second={nodes:[{id:'second',title:'Other library',icon:'s'}],edges:[],state:{version:1,categories:[{symbol:'s',name:'Second'}],modifications:[],unknown:{keep:1}}};
 for(const [key,value]of [['nodes',second.nodes],['edges',second.edges],['categories',second.state]])f.storage.set('nv_'+key+'_nv_lib_second',JSON.stringify(value));f.prompts.push('second');app.promptLibrarySwitch();
 assert.equal(app.currentLibrary,'second');assert.equal(app.getDocName(),'nv_lib_second');assert.equal(f.storage.get('nv_current_lib'),'second');assert.equal(app.searchOpen,false);assert.equal(app.headerMenuOpen,false);assert.equal(document.getElementById('searchInput').value,'');assert.equal(app.creationLibrary,null);assert.deepEqual(f.snapshot(),second);
 app.toggleSearch();query(f,'alpha');assert.deepEqual(plain(app.searchResults),[]);assert.equal(f.saves(),0);
});
test('late cloud callbacks from a prior library load cannot replace current nodes or search suggestions',()=>{
 const f=setup(),{app,context}=f,callbacks=[];
 context.firebase={apps:[{}],firestore:()=>({collection:()=>({doc:()=>({onSnapshot(cb){callbacks.push(cb);return()=>{}}})})})};
 app.initFirebase();app.currentLibrary='second';app.initFirebase();const current={nodes:[{id:'second',title:'Second',icon:'s'}],edges:[],symbolCategories:{version:1,categories:[],modifications:[]}};
 callbacks[1]({exists:true,data:()=>current});const before=f.snapshot();callbacks[0]({exists:true,data:()=>({nodes:[{id:'old',title:'Old data'}],edges:[]})});assert.deepEqual(f.snapshot(),before);assert.equal(app.getNode('old'),undefined);assert.equal(f.saves(),0);
});

test('open suggestions refresh at the existing sync boundary after title edits and object creation',()=>{
 const f=setup(),{app,document}=f;app.toggleSearch();query(f,'Alpha');assert.deepEqual(plain(app.searchResults),['A']);
 app.renameNode('A','Zebra');assert.deepEqual(plain(app.searchResults),[]);assert.equal(document.getElementById('searchSuggestions').children[0].textContent,'Inga matchande objekt.');
 query(f,'New title');app.openCreateDialog('New title');app.saveNewNode();assert.equal(document.getElementById('btnSearchGo').textContent,'G\u00e5 till');
 assert.equal(app.searchMatches('New title')[0].id,app.getNodeByTitle('New title').id);
});
test('category-name cloud saves merge exact metadata and reload via the existing snapshot path without local writes',async()=>{
 const f=setup(),{app,context}=f;let writes=0,cloud={unrelated:{retain:[false,null]}};
 const ref={set:async(payload,options)=>{assert.equal(options.merge,true);writes++;cloud={...cloud,...plain(payload)}},onSnapshot:callback=>{callback({exists:true,data:()=>plain(cloud)});return()=>{}}};
 app.db={collection:()=>({doc:()=>ref})};const before=f.snapshot();app.saveCategoryName('x','Cloud category name');await Promise.resolve();
 const expected=plain(before);expected.state.categories[0].name='Cloud category name';assert.deepEqual(f.snapshot(),expected);assert.equal(writes,1);assert.equal(f.storage.size,0);assert.deepEqual(cloud.unrelated,{retain:[false,null]});
 context.firebase={apps:[{}],firestore:()=>({collection:()=>({doc:()=>ref})})};app.nodes=[];app.edges=[];app.categoryState=null;app.initFirebase();assert.deepEqual(f.snapshot(),expected);assert.equal(writes,1);
});
