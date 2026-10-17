// Dependency-free real Chromium/CDP harness. No production SDK, configuration or data executes.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function withBrowser(data,run){
 const browser=process.env.STUDYWIKI_TEST_BROWSER||['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>fs.existsSync(p));
 if(!browser)throw Error('Set STUDYWIKI_TEST_BROWSER to Chrome/Edge');
 let html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
 html=html.replace(/<script\b[^>]*\bsrc=[^>]*>[\s\S]*?<\/script>/gi,'').replace(/const firebaseConfig = \{[\s\S]*?\};/,'const firebaseConfig = {};');
 assert(!/<script\b[^>]*\bsrc=/i.test(html));assert(!html.includes('apiKey:'));
 html=html.replace('if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);',"throw Error('Firebase disabled by offline browser harness');");
 assert(!html.includes('firebase.initializeApp('));
 html=html.replace('const app = new GraphApp();',`
 const seed=${JSON.stringify(data)};
 if(!localStorage.getItem('nv_current_lib')){
   localStorage.setItem('nv_current_lib','synthetic-task003a-browser');
   localStorage.setItem('nv_nodes_nv_lib_synthetic-task003a-browser',JSON.stringify(seed.nodes));
   localStorage.setItem('nv_edges_nv_lib_synthetic-task003a-browser',JSON.stringify(seed.edges));
   localStorage.setItem('nv_categories_nv_lib_synthetic-task003a-browser',JSON.stringify(seed.state));
 }
 window.qa={writes:0,saves:0,payloads:0};
 for(const name of ['setItem','removeItem','clear']){const old=Storage.prototype[name];Storage.prototype[name]=function(...args){window.qa.writes++;return old.apply(this,args)}}
 const app = new GraphApp();window.testApp=app;
 const save=app.sync.bind(app);app.sync=(...args)=>{window.qa.saves++;return save(...args)};
 `);
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'studywiki-003a-browser-'));
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'");res.end(html)});
 let proc,socket;const external=[],errors=[],dialogs=[],answers=[];
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  proc=spawn(browser,['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking','--disable-component-update','--proxy-server=http://127.0.0.1:9','--proxy-bypass-list=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
  proc.on('error',()=>{});let port;
  for(let i=0;i<100;i++){try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];break}catch{}await delay(100)}
  if(!port)throw Error('Browser did not start');
  const targets=await(await fetch('http://127.0.0.1:'+port+'/json')).json();socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));let next=0;const pending=new Map();
  function send(method,params={}){return new Promise((resolve,reject)=>{const id=++next;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method))},10000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});socket.send(JSON.stringify({id,method,params}))})}
  socket.addEventListener('message',event=>{
   const m=JSON.parse(event.data);
   if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}
   if(m.method==='Fetch.requestPaused'){const local=m.params.request.url.startsWith(origin+'/');if(!local)external.push(m.params.request.url);send(local?'Fetch.continueRequest':'Fetch.failRequest',{requestId:m.params.requestId,...(local?{}:{errorReason:'BlockedByClient'})}).catch(e=>errors.push(e.message))}
   if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
   if(m.method==='Page.javascriptDialogOpening'){dialogs.push(m.params);const answer=answers.shift();send('Page.handleJavaScriptDialog',{accept:answer!==undefined&&answer!==null,promptText:typeof answer==='string'?answer:''}).catch(e=>errors.push(e.message))}
  });
  console.log('Chromium: '+(await send('Browser.getVersion')).product);
  await send('Fetch.enable',{patterns:[{urlPattern:'*'}]});await send('Page.enable');await send('Runtime.enable');
  async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
  async function until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(20)}throw Error('Timed out: '+expression)}
  async function point(selector){return evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)}
  async function press(selector,ms=0,type='mouse',ending='release'){
   const p=await point(selector);await delay(40);
   const mouse=(event,pos=p)=>send('Input.dispatchMouseEvent',{type:event,...pos,button:'left',clickCount:1});
   const touch=(event,pos=p)=>send('Input.dispatchTouchEvent',{type:event,touchPoints:event==='touchEnd'||event==='touchCancel'?[]:[{...pos,id:1}]});
   if(type==='touch')await touch('touchStart');else{await mouse('mouseMoved');await mouse('mousePressed')}
   if(ending==='move'){
    if(type==='touch')await touch('touchMove',{x:p.x+40,y:p.y+60});else await mouse('mouseMoved',{x:p.x+40,y:p.y});
   }
   if(ending==='scroll')await evaluate('window.scrollBy(0,80)');
   if(ending==='rerender')await evaluate('testApp.renderPage(testApp.activeNodeId)');
   if(ending==='cancel' && type==='touch'){await delay(150);await touch('touchCancel');if(ms)await delay(ms);return;}
   if(ms)await delay(ms);
   if(type==='touch')await touch(ending==='cancel'?'touchCancel':'touchEnd');else await mouse('mouseReleased');
   await delay(40);
  }
  async function navigate(route){await evaluate('testApp.navigateTo('+JSON.stringify(route)+')');await delay(25)}
  async function reload(){await send('Page.reload');await until('!!window.testApp');await delay(80)}
  await send('Page.navigate',{url:origin+'/#A'});await until('!!window.testApp');
  await run({evaluate,send,press,click:s=>press(s),navigate,reload,until,delay,answers,dialogs,external,errors,origin});
  assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 }finally{
  if(socket)socket.close();if(proc){proc.kill();await delay(300)}await new Promise(resolve=>server.close(resolve));
  // Absolute, freshly created temporary profile only. No repository path is removed.
  if(path.dirname(profile)===os.tmpdir()&&path.basename(profile).startsWith('studywiki-003a-browser-'))fs.rmSync(profile,{recursive:true,force:true});
 }
}
module.exports={withBrowser};
