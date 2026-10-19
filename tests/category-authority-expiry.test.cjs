const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,plain}=require('./support/task003a-harness.cjs');
const walk=e=>[e,...(e.children||[]).flatMap(walk)];
function setup(cloud=false){
 const f=fixture(),originalGet=f.document.getElementById.bind(f.document);
 f.document.getElementById=id=>{if(id==='createCategoryNode'&&f.app.categoryCreationControl)return f.app.categoryCreationControl.button;for(const root of f.elements.values()){const found=walk(root).find(e=>e.id===id);if(found)return found}return originalGet(id)};
 f.get=f.document.getElementById.bind(f.document);const root=f.get('categoryBatchDialog'),body=f.get('categoryBatchBody');root.children=[body];root.contains=e=>walk(root).includes(e);root.querySelectorAll=()=>walk(root).filter(e=>['input','button'].includes(e.tag));f.document.body={setAttribute(){},children:[f.get('mainContent'),root]};
 f.cloudWrites=0;if(cloud)f.app.db={collection:()=>({doc:()=>({set:async(p,o)=>{f.cloudWrites++;f.payload=plain(p);assert.equal(o.merge,true)}})})};
 f.app.renderCategory('x');f.open=()=>{f.app.categoryCreationControl.button.dispatch('click');return f.app.categoryBatch};f.add=text=>{f.app.categoryBatch.input.value=text;return f.app.addCategoryBatchName(f.app.categoryBatch)};
 f.metrics=()=>({saves:f.saves(),storage:f.storage.size,cloud:f.cloudWrites});return f;
}
const changes={
 notes:f=>{const c=f.app.categoryState.categories[0],v=c.notes;c.notes='Changed';return()=>c.notes=v},
 category:f=>{f.app.activeCategorySymbol='y';return()=>f.app.activeCategorySymbol='x'},
 library:f=>{const v=f.app.currentLibrary;f.app.currentLibrary='other';return()=>f.app.currentLibrary=v},
 revision:f=>{const v=f.app.libraryLoadRevision;f.app.libraryLoadRevision=81;return()=>f.app.libraryLoadRevision=v},
 node:f=>{const v=f.app.nodes[0];f.app.nodes[0]={...v};return()=>f.app.nodes[0]=v},
 edge:f=>{const v=f.app.edges[0];f.app.edges[0]={...v};return()=>f.app.edges[0]=v},
 unrelated:f=>{const c=f.app.categoryState.categories[1],v=c.notes;c.notes='Unrelated';return()=>c.notes=v},
 view:f=>{const v=f.app.pressRevision;f.app.pressRevision++;return()=>f.app.pressRevision=v}
};
function unchanged(f,before,metrics){assert.deepEqual(f.snapshot(),before);assert.deepEqual(f.metrics(),metrics)}
for(const cloud of [false,true])for(const [change,mutate] of Object.entries(changes))for(const first of ['add','remove','create'])test(`expired ${first} authority never returns after ${change} restoration (${cloud?'cloud':'local'})`,()=>{
 const f=setup(cloud),s=f.open();f.add('First');f.add('Second');const remove=s.list.children[0].children[1],before=f.snapshot(),metrics=f.metrics(),pending=plain(s.pending),restore=mutate(f),changed=f.snapshot();
 if(first==='add'){s.input.value='Not added';assert.equal(f.app.addCategoryBatchName(s),false)}else if(first==='remove')remove.dispatch('click');else assert.equal(f.app.commitCategoryBatch(s),false);
 unchanged(f,changed,metrics);restore();assert.deepEqual(f.snapshot(),before);
 for(let i=0;i<3;i++){s.input.value='Still forbidden';assert.equal(f.app.addCategoryBatchName(s),false);remove.dispatch('click');s.input.value='';assert.equal(f.app.commitCategoryBatch(s),false);assert.deepEqual(plain(s.pending),pending);unchanged(f,before,metrics)}
});
for(const cloud of [false,true])for(const [change,mutate] of Object.entries(changes))test(`button and direct listener stay revoked after ${change} restoration (${cloud?'cloud':'local'})`,()=>{
 const f=setup(cloud),binding=f.app.categoryCreationControl,callback=binding.button.listeners.click[0].fn,before=f.snapshot(),metrics=f.metrics();
 for(let cycle=0;cycle<3;cycle++){const restore=mutate(f),changed=f.snapshot();binding.button.dispatch('click');callback();assert.equal(!!f.app.categoryBatch,false);unchanged(f,changed,metrics);restore();binding.button.dispatch('click');callback();assert.equal(!!f.app.categoryBatch,false);unchanged(f,before,metrics)}
 f.app.renderCategory('x');assert.notEqual(f.app.categoryCreationControl,binding);assert(f.open());callback();assert.equal(f.app.categoryBatch.context,f.app.categoryCreationControl.context);f.app.closeCategoryBatch();unchanged(f,before,metrics);
});
function notes(f,text){const slot=f.get('categoryDescriptionSlot');f.app.setCategoryDescription(slot,'x',true);slot.children[0].children[0].value=text;slot.children[0].children[1].children[0].dispatch('click')}
for(const cloud of [false,true])for(const edit of ['name','notes'])test(`observed stale binding cannot be renewed by ${edit} even after graph restoration (${cloud?'cloud':'local'})`,()=>{
 const f=setup(cloud),binding=f.app.categoryCreationControl,callback=binding.button.listeners.click[0].fn,restore=changes.notes(f);callback();restore();
 if(edit==='name'){f.prompts.push('Legitimate rename');f.app.requestRenameCategory('x')}else notes(f,'Legitimate notes');assert.equal(f.app.categoryCreationControl,binding);const before=f.snapshot(),metrics=f.metrics();callback();assert.equal(!!f.app.categoryBatch,false);unchanged(f,before,metrics);assert.equal(f.saves(),1);
});
for(const cloud of [false,true])for(const edit of ['name','notes'])for(const count of [1,2,5])test(`fresh ${count}-object operation survives authorized ${edit} renewal (${cloud?'cloud':'local'})`,()=>{
 const f=setup(cloud),old=f.app.categoryCreationControl;if(edit==='name'){f.prompts.push('Current category');f.app.requestRenameCategory('x')}else notes(f,'Current notes');assert.notEqual(f.app.categoryCreationControl,old);old.button.dispatch('click');assert.equal(!!f.app.categoryBatch,false);const before=f.snapshot(),saves=f.saves(),writes=f.cloudWrites,s=f.open();for(let i=0;i<count;i++)f.add('Created '+i);assert(f.app.commitCategoryBatch(s));const after=f.snapshot();assert.deepEqual(after.nodes.slice(0,before.nodes.length),before.nodes);assert.deepEqual(after.edges,before.edges);assert.deepEqual(after.state.categories,before.state.categories);assert.deepEqual(after.state.modifications.slice(0,before.state.modifications.length),before.state.modifications);assert.equal(f.saves()-saves,1);assert.equal(f.cloudWrites-writes,cloud?1:0);
});
for(const cloud of [false,true])test('correctable input errors preserve live batch authority '+cloud,()=>{
 const f=setup(cloud),s=f.open(),before=f.snapshot(),metrics=f.metrics();for(const invalid of ['', '  ', 'Alpha']){s.input.value=invalid;assert.equal(f.app.addCategoryBatchName(s),false);unchanged(f,before,metrics)}f.add('Unique');s.input.value=' UNIQUE ';assert.equal(f.app.addCategoryBatchName(s),false);assert.equal(f.app.commitCategoryBatch(s),false);s.input.value='';s.pending.push({title:'Alpha'});assert.equal(f.app.commitCategoryBatch(s),false);s.pending.pop();unchanged(f,before,metrics);assert(f.app.commitCategoryBatch(s));assert.equal(f.saves(),1);assert.equal(f.cloudWrites,cloud?1:0);
});
for(const cloud of [false,true])test('expired callbacks cannot modify or cancel a fresh batch '+cloud,()=>{
 const f=setup(cloud),old=f.open();f.add('Old pending');const controls=[f.get('categoryBatchAdd'),old.list.children[0].children[1],f.get('categoryBatchSave'),f.get('categoryBatchCancel')],restore=changes.notes(f);f.app.commitCategoryBatch(old);restore();f.app.closeCategoryBatch();const fresh=f.open();f.add('Fresh pending');fresh.input.value='Incomplete';const before=f.snapshot(),metrics=f.metrics();for(const control of controls)control.dispatch('click');assert.equal(f.app.categoryBatch,fresh);assert.deepEqual(plain(fresh.pending),[{title:'Fresh pending'}]);assert.equal(fresh.input.value,'Incomplete');unchanged(f,before,metrics);
});
for(const edit of ['cancel-name','same-name','cancel-notes','same-notes','invalid-notes'])test('ordinary metadata action does not replace or expire current binding: '+edit,()=>{
 const f=setup(),binding=f.app.categoryCreationControl,before=f.snapshot(),metrics=f.metrics();if(edit==='cancel-name'||edit==='same-name'){f.prompts.push(edit==='same-name'?'':null);f.app.requestRenameCategory('x')}else if(edit==='cancel-notes'){const slot=f.get('categoryDescriptionSlot');f.app.setCategoryDescription(slot,'x',true);slot.children[0].children[1].children[1].dispatch('click')}else notes(f,edit==='same-notes'?'Original notes':'x'.repeat(281));assert.equal(f.app.categoryCreationControl,binding);unchanged(f,before,metrics);assert(f.open());
});
