const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8');
const source = html.slice(html.indexOf('    class GraphApp {'), html.indexOf('    const app = new GraphApp();'));
const plain = value => JSON.parse(JSON.stringify(value));
function library() {
  return {
    nodes: [
      {id:'A',title:'Alpha',icon:'x',color:'#123456',free_text:{sv:'Original',en:'English',future:[1]},unknown:{keep:[null,false]}},
      {id:'B',title:'Beta',icon:'x',isImmigrant:false,free_text:'Legacy text'},
      {id:'C',title:'Gamma',icon:'y',color:'#987654'},
      {id:'D',title:'Delta',icon:'z'},
      {id:'E',title:'Epsilon',icon:'w'}
    ],
    edges: [{a:'A',b:'C',unknown:{keep:[1,2]}},{a:'A',b:'D',paused:true,extra:{paused:'retain'}},
      {a:'B',b:'C',weight:0},{a:'B',b:'D'},{a:'C',b:'E',paused:true,unknown:false}],
    state:{version:1,categories:[{symbol:'x',notes:'Original notes',unknown:{retain:1}},{symbol:'stored-only',notes:'Do not overwrite'}],
      modifications:[{id:'A',at:11,unknown:'clock metadata'},{id:'B',at:12}],unknown:{future:[false,0]}}
  };
}
function fixture() {
  const elements=new Map(), storage=new Map(), timers=new Map(), prompts=[], alerts=[];
  let now=1000,nextTimer=0,saves=0,renders=0;
  const window={location:{hash:'#A'},addEventListener(){}};
  const document={hidden:false,activeElement:null,createElement:element,querySelectorAll:()=>[],querySelector:()=>null,
    getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)}};
  function element(tag='div') {
    return {tag,style:{},children:[],listeners:{},attributes:{},textContent:'',value:'',isConnected:true,className:'',
      set innerHTML(v){this.html=v;this.children=[]},get innerHTML(){return this.html||''},
      appendChild(e){this.children.push(e);e.parentElement=this;return e},replaceWith(e){const parent=this.parentElement;if(parent){parent.children[parent.children.indexOf(this)]=e;e.parentElement=parent;this.isConnected=false}},setAttribute(k,v){this.attributes[k]=v},
      focus(){document.activeElement=this},setPointerCapture(id){this.capture=id},hasPointerCapture(id){return this.capture===id},releasePointerCapture(){this.capture=null},
      addEventListener(type,fn,capture){(this.listeners[type]||=[]).push({fn,capture:!!capture})},
      dispatch(type,fields={}){const e={button:0,isPrimary:true,pointerId:1,clientX:0,clientY:0,...fields,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}};
        for(const h of [...(this.listeners[type]||[])].sort((a,b)=>Number(b.capture)-Number(a.capture))){h.fn(e);if(e.stopped)break}return e}
    };
  }
  const context=vm.createContext({document,window,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    setTimeout:(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,due:now+delay});return id},clearTimeout:id=>timers.delete(id),
    prompt:()=>prompts.shift()??null,alert:m=>alerts.push(m),confirm:()=>true,
    Date:class extends Date{static now(){return now}}});
  const GraphApp=vm.runInContext(source+';GraphApp',context);
  const app=Object.create(GraphApp.prototype),data=library();
  Object.assign(app,{nodes:data.nodes,edges:data.edges,categoryState:data.state,mode:'create',db:null,currentLibrary:'synthetic-task003a',activeNodeId:'A',activeCategorySymbol:null,pressRevision:0});
  const actualSync=app.sync.bind(app);app.sync=(...args)=>{saves++;return actualSync(...args)};
  app.navigateTo=route=>{app.lastRoute=route};app.routeFromHash=()=>{renders++};
  return {app,context,document,elements,storage,prompts,alerts,element,GraphApp,plain,saves:()=>saves,renders:()=>renders,
    snapshot:()=>plain({nodes:app.nodes,edges:app.edges,state:app.categoryState}),
    advance(ms){now+=ms;for(const [id,t]of [...timers])if(t.due<=now){timers.delete(id);t.fn()}},timers};
}
module.exports={fixture,library,plain};
