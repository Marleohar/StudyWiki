const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,plain}=require('./support/task003a-harness.cjs');
function find(root,id){if(root.id===id)return root;for(const child of root.children||[]){const result=find(child,id);if(result)return result}}
function setup(cloud=false){
 const f=fixture(),get=f.document.getElementById.bind(f.document);f.document.getElementById=id=>{for(const root of f.elements.values()){const match=find(root,id);if(match)return match}return get(id)};
 f.app.renderPage('A',true);f.get=f.document.getElementById.bind(f.document);f.editor=f.get('freeTextEditor');f.editor.value='Complete draft\n雪 "quoted"  ';f.cloudWrites=0;
 f.header=f.element();f.header.inert=false;f.prior=f.element();f.prior.inert=true;f.document.body={children:[f.header,f.prior,f.get('linkDialog'),f.get('smartDialog'),f.get('descriptionLinkDialog')]};
 if(cloud)f.app.db={collection:()=>({doc:()=>({set:async()=>{f.cloudWrites++}})})};return f;
}
function renderFresh(f,editing){f.get('objectDescriptionSlot').innerHTML='';f.get('pausedRelationsList').innerHTML='';f.app.renderPage('A',editing)}
function unchanged(f,before){assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),0);assert.equal(f.storage.size,0);assert.equal(f.cloudWrites,0)}
for(const cloud of [false,true])for(const changed of ['source','target'])test(`rendered restore rejects identical ${changed} replacement ${cloud?'cloud':'local'}`,()=>{
 const f=setup(cloud),button=f.get('pausedRelationsList').children[0].children.at(-1),originalEditor=f.editor,text=f.editor.value;const index=changed==='source'?0:3;f.app.nodes[index]={...f.app.nodes[index]};const before=f.snapshot();button.dispatch('click');unchanged(f,before);assert.equal(f.app.descriptionLinkDecision,null);assert.equal(f.get('freeTextEditor'),originalEditor);assert.equal(originalEditor.value,text);assert.equal(f.app.edges[1].paused,true);
});
for(const kind of ['node','editor','detached','language'])test('fresh direct request cannot bypass stale draft '+kind,()=>{
 const f=setup();if(kind==='node')f.app.nodes[0]={...f.app.nodes[0]};if(kind==='editor')f.app.objectDescriptionDraft.editor=f.element('textarea');if(kind==='detached')f.editor.isConnected=false;if(kind==='language')f.app.lang='en';const before=f.snapshot();f.app.requestRestoreRelation('A','D');unchanged(f,before);assert.equal(f.editor.value,'Complete draft\n雪 "quoted"  ');
});
for(const editing of [false,true])test('absent or unchanged valid editor permits visible restoration '+editing,()=>{const f=setup();renderFresh(f,editing);f.get('pausedRelationsList').children[0].children.at(-1).dispatch('click');assert.equal(f.saves(),1);assert.equal(f.app.areNeighbors('A','D'),true);assert.deepEqual(plain(f.app.getNode('A').free_text),{sv:'Original',en:'English',future:[1]})});
for(const cloud of [false,true])for(const ending of ['button','escape'])test(`legacy ${ending} clears operation, restores editor/inert, ignores retained controls ${cloud?'cloud':'local'}`,()=>{
 const f=setup(cloud),text=f.editor.value;f.app.openLinkDialog('A');f.app.pendingLinks=['Beta'];const before=f.snapshot();f.app.executeLinkNodes();const decision=f.app.descriptionLinkDecision,retained=f.get('descriptionLink-save');assert(decision.legacy);if(ending==='button')f.get('descriptionLink-cancel').dispatch('click');else f.get('descriptionLinkDialog').onkeydown({key:'Escape',preventDefault(){},stopPropagation(){}});
 assert.equal(f.get('linkDialog').style.display,'none');assert.equal(f.get('descriptionLinkDialog').style.display,'none');assert.equal(f.app.targetPageForLink,null);assert.equal(f.app.legacyLinkContext,null);assert.deepEqual(plain(f.app.pendingLinks),[]);assert.equal(f.document.activeElement,f.editor);assert.equal(f.editor.value,text);assert.equal(f.header.inert,false);assert.equal(f.prior.inert,true);
 f.advance(100);assert.equal(f.document.activeElement,f.editor);retained.dispatch('click');f.app.resolveDescriptionLink(decision,'save');f.app.executeLinkNodes();unchanged(f,before);
});
for(const cloud of [false,true])test('fresh reopened restore view permits approved save exactly once '+cloud,()=>{
 const f=setup(cloud);f.app.nodes[0]={...f.app.nodes[0]};f.get('pausedRelationsList').children[0].children.at(-1).dispatch('click');assert.equal(f.saves(),0);renderFresh(f,true);f.get('freeTextEditor').value='Fresh draft';f.get('pausedRelationsList').children[0].children.at(-1).dispatch('click');const decision=f.app.descriptionLinkDecision;f.app.resolveDescriptionLink(decision,'save');f.app.resolveDescriptionLink(decision,'discard');assert.equal(f.saves(),1);assert.equal(f.cloudWrites,cloud?1:0);assert.equal(f.storage.size,cloud?0:3);assert.equal(f.app.getNode('A').free_text.sv,'Fresh draft');assert.equal(f.app.areNeighbors('A','D'),true);
});
