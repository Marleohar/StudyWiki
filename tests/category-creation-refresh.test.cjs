const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./support/task003a-harness.cjs');
function setup(){const f=fixture();f.app.renderCategory('x');const binding=f.app.categoryCreationControl;f.document.getElementById=(id)=>{if(id==='createCategoryNode')return f.app.categoryCreationControl.button;return f.elements.get(id)||f.element()};return {...f,binding}}
for(const edit of ['rename','notes'])test('validated '+edit+' renews control without reviving retained callback',()=>{
 const f=setup(),old=f.binding;let opened=[];f.app.openCategoryBatch=c=>opened.push(c);
 if(edit==='rename'){f.prompts.push('New name');f.app.requestRenameCategory('x')}
 else{const slot=f.element();f.app.setCategoryDescription(slot,'x',true);slot.children[0].children[1].children[0].dispatch('click'); // unchanged save cannot renew
 assert.equal(f.app.categoryCreationControl,old);f.app.setCategoryDescription(slot,'x',true);slot.children[0].children[0].value='Changed';slot.children[0].children[1].children[0].dispatch('click')}
 const fresh=f.app.categoryCreationControl;assert.notEqual(fresh,old);assert.equal(old.button.isConnected,false);
 old.button.dispatch('click');assert.equal(opened.length,0);fresh.button.dispatch('click');assert.equal(opened[0],fresh.context);
});
for(const kind of ['cancel','unchanged','stale-node','stale-edge','stale-category','revision','library','view'])test(kind+' cannot authorize stale category action',()=>{
 const f=setup(),old=f.binding;
 if(kind==='cancel')f.prompts.push(null);else if(kind==='unchanged')f.prompts.push('');else{f.prompts.push('Changed');if(kind==='stale-node')f.app.nodes[0]={...f.app.nodes[0]};if(kind==='stale-edge')f.app.edges[0]={...f.app.edges[0]};if(kind==='stale-category')f.app.categoryState.categories[0]={...f.app.categoryState.categories[0]};if(kind==='revision')f.app.libraryLoadRevision++;if(kind==='library')f.app.currentLibrary='other';if(kind==='view')f.app.pressRevision++}
 f.app.requestRenameCategory('x');assert.equal(f.app.categoryCreationControl,old);
});
test('restoring old serialized metadata cannot revive replaced listener',()=>{const f=setup(),old=f.binding;f.prompts.push('One');f.app.requestRenameCategory('x');f.prompts.push('');f.app.requestRenameCategory('x');let calls=0;f.app.openCategoryBatch=()=>calls++;old.button.dispatch('click');assert.equal(calls,0)});

test('graph changes during rename prompt cannot renew stale transaction',()=>{const f=setup(),old=f.binding;f.context.prompt=()=>{f.app.nodes[0]={...f.app.nodes[0]};return 'Changed'};f.app.requestRenameCategory('x');assert.equal(f.app.categoryCreationControl,old)});

for(const action of ['cancel','unchanged','invalid-notes'])test('already stale control stays stale after '+action,()=>{const f=setup(),old=f.binding;f.app.nodes[0]={...f.app.nodes[0]};if(action==='invalid-notes'){const slot=f.element();f.app.setCategoryDescription(slot,'x',true);slot.children[0].children[0].value='x'.repeat(281);slot.children[0].children[1].children[0].dispatch('click')}else{f.prompts.push(action==='cancel'?null:'');f.app.requestRenameCategory('x')}assert.equal(f.app.categoryCreationControl,old);assert.equal(f.app.categoryBatchValid(old.context),false);assert.equal(f.saves(),0);assert.equal(f.storage.size,0)});
