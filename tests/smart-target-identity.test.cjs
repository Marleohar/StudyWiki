const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,plain}=require('./support/task003a-harness.cjs');
function find(element,id){if(element?.id===id)return element;for(const child of element?.children||[]){const found=find(child,id);if(found)return found}}
function setup(duplicate){const f=fixture(),lookup=f.document.getElementById.bind(f.document);f.document.getElementById=id=>{for(const root of f.elements.values()){const found=find(root,id);if(found)return found}return lookup(id)};if(duplicate)f.app.nodes[4].title='Beta';f.app.renderPage('A');return f}
function query(f){const s=f.app.quickLinkState;s.input.value='Beta';f.app.refreshQuickLink(s);return s}
for(const cloud of [false,true])for(const scenario of ['unique target','selected duplicate target','retained suggestion'])test(`identical-field replacement rejects ${scenario} with ${cloud?'cloud':'local'} persistence; reopening permits fresh selection`,async()=>{
 const duplicate=scenario==='selected duplicate target',f=setup(duplicate),s=query(f);let cloudWrites=0,payload;
 if(cloud)f.app.db={collection:()=>({doc:()=>({set:async(p,options)=>{cloudWrites++;payload=plain(p);assert.equal(options.merge,true)}})})};
 const suggestion=s.options.find(option=>option.textContent==='Beta'||option.children.some(child=>child.textContent==='Beta'));
 assert(suggestion);if(duplicate)suggestion.dispatch('click');
 const oldTarget=f.app.getNode('B'),oldAction=s.action;f.app.nodes[1]={...oldTarget};assert.notEqual(f.app.getNode('B'),oldTarget);
 const before=f.snapshot();
 if(scenario==='retained suggestion'){suggestion.dispatch('click');assert.equal(s.selected,null)}
 oldAction.dispatch('click');assert.equal(f.app.commitQuickLink(s),false);await Promise.resolve();
 assert.deepEqual(f.snapshot(),before);assert.equal(f.saves(),0);assert.equal(f.storage.size,0);assert.equal(cloudWrites,0);
 f.app.renderPage('A');const fresh=query(f);assert.notEqual(fresh,s);const current=f.app.getNode('B');assert.equal(current,f.app.nodes[1]);
 fresh.options.find(option=>option.children.some(child=>child.textContent==='Beta')).dispatch('click');assert.equal(fresh.selected.id,'B');
 assert.equal(f.app.commitQuickLink(fresh),true);await Promise.resolve();assert.equal(f.saves(),1);assert.equal(f.storage.size,cloud?0:3);assert.equal(cloudWrites,cloud?1:0);
 const after=f.snapshot();assert.deepEqual(after.nodes,before.nodes);assert.deepEqual(after.edges,[...before.edges,{a:'A',b:'B'}]);assert.deepEqual(after.state.categories,before.state.categories);assert.deepEqual(after.state.unknown,before.state.unknown);
 assert.deepEqual(after.state.modifications,before.state.modifications.map(clock=>({...clock,at:1000})));
 if(cloud){assert.deepEqual(payload.nodes,after.nodes);assert.deepEqual(payload.edges,after.edges);assert.deepEqual(payload.symbolCategories,after.state)}
});
