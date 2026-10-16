// No packages required. Uses installed Chrome/Edge and Node's built-in CDP WebSocket.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const browser = process.env.STUDYWIKI_TEST_BROWSER || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(p => fs.existsSync(p));
if (!browser) throw Error('Set STUDYWIKI_TEST_BROWSER to a Chromium executable');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'studywiki-smoke-'));
const nodes = ['A', 'B', 'C', 'Standalone'].map(id => ({ id, title: id, custom: 'preserved' }));
const edges = [{ a: 'B', b: 'A', custom: 'preserved' }, { a: 'B', b: 'C' }];
let html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
// Remove remote scripts; force the normal local fallback with disposable synthetic storage.
html = html.replace(/<script\b[^>]*\bsrc=[^>]*>[\s\S]*?<\/script>/gi, '');
html = html.replace('const app = new GraphApp();', `
  localStorage.setItem('nv_current_lib', 'synthetic-browser-task001');
  if (!localStorage.getItem('nv_nodes_nv_lib_synthetic-browser-task001')) {
    localStorage.setItem('nv_nodes_nv_lib_synthetic-browser-task001', ${JSON.stringify(JSON.stringify(nodes))});
    localStorage.setItem('nv_edges_nv_lib_synthetic-browser-task001', ${JSON.stringify(JSON.stringify(edges))});
  }
  const app = new GraphApp(); window.testApp = app;
`);
const server = http.createServer((req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html); });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let proc, socket;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  proc = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  proc.on('error', () => {});
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; break; } catch {}
    await delay(100);
  }
  if (!port) throw Error('Browser did not start');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let next = 0; const pending = new Map();
  function send(method, params = {}) { return new Promise((resolve, reject) => {
    const id = ++next;
    const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 10000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: e => { clearTimeout(timer); reject(e); } });
    socket.send(JSON.stringify({ id, method, params }));
  }); }
  socket.addEventListener('message', event => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result); }
    if (m.method === 'Fetch.requestPaused') {
      const local = m.params.request.url.startsWith(origin + '/');
      send(local ? 'Fetch.continueRequest' : 'Fetch.failRequest', { requestId: m.params.requestId, ...(local ? {} : { errorReason: 'BlockedByClient' }) });
    }
  });
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.text + ': ' + r.exceptionDetails.exception?.description);
    return r.result.value;
  };
  await send('Page.navigate', { url: origin + '/#A' });
  for (let i = 0; i < 100 && !await evaluate('!!window.testApp'); i++) await delay(50);
  await evaluate("testApp.mode='create'; testApp.updateModeUI()");
  async function click(selector) {
    const rect = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) throw Error('Missing control'); e.scrollIntoView(); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...rect, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...rect, button: 'left', clickCount: 1 });
  }
  await click('[aria-label="Pausa relation"]');
  assert.deepEqual(await evaluate("[testApp.getNeighbors('A'),testApp.getNeighbors('B'),testApp.getNeighbors('A',true),testApp.getNeighbors('B',true)]"), [[], ['C'], ['B'], ['A']]);
  await click('section[aria-label="Vilande relationer"] a');
  assert.equal(await evaluate('testApp.activeNodeId'), 'B');
  await click('section[aria-label="Vilande relationer"] button');
  assert.equal(await evaluate("testApp.areNeighbors('A','B')"), true);
  await click('[onclick="app.requestRemoveRelation(\'B\', \'A\')"]');
  await send('Page.reload'); await delay(500);
  assert.deepEqual(await evaluate("[testApp.getNeighbors('A',true), testApp.getNeighbors('B',true), testApp.nodes.length, testApp.mode]"), [['B'], ['A'], 4, 'read']);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('section button')).display"), 'none');
  await evaluate("testApp.requestRestoreRelation('B','A')");
  assert.equal(await evaluate("testApp.edges[0].paused"), true);
  await evaluate("testApp.navigateTo('overview')");
  assert.equal(await evaluate("document.getElementById('mainContent').textContent.includes('Standalone')"), true);
  await evaluate("document.getElementById('searchInput').value='Standalone'");
  await click('button[onclick="app.handleSearch()"]');
  assert.equal(await evaluate('testApp.activeNodeId'), 'Standalone');
  // Keep hostile titles out of the inherited active/header rendering surfaces.
  // This scenario tests only the newly introduced paused list.
  const hostileTitle = '<img src=x onerror="window.pausedInjected=true"><script>window.pausedInjected=true</script><span onclick="window.pausedInjected=true">literal</span>';
  await evaluate(`(() => {
    testApp.nodes = [{id:'safe-root',title:'Safe root'}, {id:'hostile-title',title:${JSON.stringify(hostileTitle)}}];
    testApp.edges = [{a:'safe-root',b:'hostile-title',paused:true,custom:{keep:true}}];
    window.pausedInjected = false;
    window.hostileBefore = JSON.stringify({nodes:testApp.nodes,edges:testApp.edges});
    testApp.renderPage('safe-root');
  })()`);
  assert.equal(await evaluate("document.querySelector('#pausedRelationsList a').textContent"), hostileTitle);
  assert.equal(await evaluate("document.querySelectorAll('#pausedRelationsList img, #pausedRelationsList script, #pausedRelationsList span, #pausedRelationsList [onclick], #pausedRelationsList [onerror]').length"), 0);
  assert.equal(await evaluate("[...document.querySelectorAll('#pausedRelationsList *')].some(e => [...e.attributes].some(a => /^on/i.test(a.name)))"), false);
  assert.equal(await evaluate('window.pausedInjected'), false);
  assert.equal(await evaluate('JSON.stringify({nodes:testApp.nodes,edges:testApp.edges}) === window.hostileBefore'), true);

  await evaluate('window.originalSync = testApp.sync');
  for (const specialId of ["apostrophe's", 'double"quote', '雪å🧙', 'percent%25%']) {
    await evaluate(`(() => {
      testApp.nodes = [{id:'root',title:'Root',custom:{keep:true}}, {id:${JSON.stringify(specialId)},title:'Special endpoint',custom:{keep:true}}];
      testApp.edges = [{a:${JSON.stringify(specialId)},b:'root',paused:true,custom:{keep:true}}];
      testApp.mode='create'; testApp.updateModeUI();
      window.specialBefore = JSON.stringify({nodes:testApp.nodes,edges:testApp.edges});
      window.persistCount = 0;
      testApp.sync = () => { window.persistCount++; return window.originalSync.call(testApp); };
      window.originalNavigate = testApp.navigateTo;
      // Capture the raw navigation argument at the router boundary. Existing hash
      // decoding of arbitrary IDs is outside this paused-list correction.
      testApp.navigateTo = id => { window.clickedId = id; testApp.renderPage(id); };
      testApp.renderPage('root');
    })()`);
    await click('#pausedRelationsList a');
    assert.equal(await evaluate('window.clickedId'), specialId);
    assert.equal(await evaluate('testApp.activeNodeId'), specialId);
    assert.equal(await evaluate('JSON.stringify({nodes:testApp.nodes,edges:testApp.edges}) === window.specialBefore'), true);
    assert.equal(await evaluate('window.persistCount'), 0);
    assert.equal(await evaluate("document.querySelectorAll('#pausedRelationsList [onclick], #pausedRelationsList [onerror], #pausedRelationsList script').length"), 0);
    await click('#pausedRelationsList button');
    assert.equal(await evaluate('window.persistCount'), 1);
    await evaluate(`testApp.requestRestoreRelation('root',${JSON.stringify(specialId)})`);
    assert.equal(await evaluate('window.persistCount'), 1);
    await evaluate(`testApp.requestRemoveRelation('root',${JSON.stringify(specialId)}); testApp.renderPage('root')`);
    assert.equal(await evaluate('window.persistCount'), 2);
    await click('#pausedRelationsList button');
    assert.equal(await evaluate('window.persistCount'), 3);
    assert.equal(await evaluate(`(() => { const expected=JSON.parse(window.specialBefore); delete expected.edges[0].paused; return JSON.stringify({nodes:testApp.nodes,edges:testApp.edges})===JSON.stringify(expected); })()`), true);
    await evaluate(`testApp.requestRestoreRelation('root',${JSON.stringify(specialId)}); testApp.requestRestoreRelation(${JSON.stringify(specialId)},'root')`);
    assert.equal(await evaluate('window.persistCount'), 3);
    await evaluate('testApp.navigateTo = window.originalNavigate');
  }
  await evaluate(`(() => {
    testApp.sync = window.originalSync;
    testApp.categoryState = {version:1,categories:[],modifications:[],future:{keep:true}};
    testApp.nodes = [{id:'cat-A',title:'A',icon:'x',custom:{keep:true}}, {id:'cat-B',title:'B',icon:'x'},
      {id:'cat-C',title:'C',icon:'sword'}, {id:'cat-D',title:'D',icon:'shield'}];
    testApp.edges = [{a:'cat-A',b:'cat-C',unknown:1},{a:'cat-B',b:'cat-C'}, {a:'cat-B',b:'cat-D'},
      {a:'cat-A',b:'cat-D',paused:true,unknown:{keep:true}}];
    window.categoryOriginalNodes=JSON.stringify(testApp.nodes);
    window.categoryOriginalEdges=JSON.stringify(testApp.edges);
    testApp.mode='create';testApp.updateModeUI();testApp.navigateTo('cat-A');
  })()`);
  assert.equal(await evaluate("document.querySelectorAll('#objectTemplate .list-row').length"), 2);
  assert.deepEqual(await evaluate("testApp.getNeighbors('cat-A')"), ['cat-C']);
  await click('#nodeCategorySymbol button');
  assert.equal(await evaluate('location.hash'), '#category/x');
  assert.equal(await evaluate("document.querySelector('#mainContent h1').textContent"), 'X');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#categoryMembers a')].map(e=>e.textContent)"), ['A','B']);
  assert.equal(await evaluate("[...document.querySelectorAll('#categoryMembers .list-row')].every(e=>e.children.length===1)"), true);
  const categoryNotes = '雪 "notes" <img src=x onerror="window.categoryInjected=true"><script>bad()</script>';
  await evaluate(`window.categoryInjected=false;document.getElementById('categoryNotes').value=${JSON.stringify(categoryNotes)}`);
  await click('#saveCategoryNotes');
  assert.equal(await evaluate("document.querySelector('[aria-label=Kategorianteckningar]').textContent"), categoryNotes);
  assert.equal(await evaluate("document.querySelectorAll('#mainContent img,#mainContent script,#mainContent [onerror]').length"), 0);
  await evaluate("document.getElementById('categoryNotes').value='a'.repeat(281)");
  await click('#saveCategoryNotes');
  assert.equal(await evaluate("document.querySelector('[role=alert]').textContent"), 'Högst 280 tecken. Texten har inte sparats.');
  assert.equal(await evaluate('testApp.categoryState.categories[0].notes'), categoryNotes);
  await click('#createCategoryNode');
  await evaluate("document.getElementById('modalTitle').value='Created in category';document.getElementById('modalFreeText').value='Object notes'");
  await click('button[onclick="app.saveNewNode()"]');
  assert.equal(await evaluate("testApp.getNode(testApp.activeNodeId).icon"), 'x');
  assert.deepEqual(await evaluate('testApp.getNeighbors(testApp.activeNodeId)'), []);
  await click('#nodeCategorySymbol button');
  await click('#categoryMembers .list-row:nth-child(2) a');
  assert.equal(await evaluate('testApp.activeNodeId'), 'cat-B');
  await click('#editNodeAppearance');
  await evaluate("document.getElementById('appIconInput').value='y';document.getElementById('appColorInput').value='#123456'");
  await click('button[onclick="app.saveAppearance()"]');
  await click('#nodeCategorySymbol button');
  assert.equal(await evaluate("document.querySelector('#mainContent h1').textContent"), 'Y');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#categoryMembers a')].map(e=>e.textContent)"), ['B']);
  await click('#mainContent > button');
  await click('#mainContent .category-symbol-slot button');
  assert.equal(await evaluate('location.hash'), '#category/x');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#categoryMembers a')].map(e=>e.textContent)"), ['A','Created in category']);
  assert.equal(await evaluate("testApp.templateFor('x').sourceId"), 'cat-A');
  assert.equal(await evaluate("JSON.stringify(testApp.edges)===window.categoryOriginalEdges"), true);
  assert.equal(await evaluate("(() => { const expected=JSON.parse(window.categoryOriginalNodes);expected[1].icon='y';expected[1].color='#123456';return JSON.stringify(testApp.nodes.slice(0,4))===JSON.stringify(expected); })()"), true);
  const categoryBeforeReload = await evaluate("JSON.stringify({nodes:testApp.nodes,edges:testApp.edges,state:testApp.categoryState})");
  await send('Page.reload'); await delay(500);
  assert.equal(await evaluate('JSON.stringify({nodes:testApp.nodes,edges:testApp.edges,state:testApp.categoryState})'),
    categoryBeforeReload);
  assert.equal(await evaluate("document.querySelector('[aria-label=Kategorianteckningar]').textContent"), categoryNotes);
  assert.equal(await evaluate("getComputedStyle(document.getElementById('saveCategoryNotes')).display"), 'none');
  assert.equal(await evaluate('window.categoryInjected === true'), false);
  assert.equal(await evaluate('testApp.categoryState.future.keep'), true);
  const hostileSymbol = '\'"%雪<svg onload="window.categoryInjected=true">';
  const hostileCategoryTitle = '<img src=x onerror="window.categoryInjected=true">雪 "title"';
  await evaluate(`(() => {
    testApp.nodes=[{id:'safe-category-node',title:'Safe',icon:${JSON.stringify(hostileSymbol)}},
      {id:'hostile-category-title',title:${JSON.stringify(hostileCategoryTitle)},icon:${JSON.stringify(hostileSymbol)}}];
    testApp.edges=[];window.categoryInjected=false;testApp.navigateTo('safe-category-node');
  })()`);
  await click('#nodeCategorySymbol button');
  assert.equal(await evaluate("document.querySelector('#mainContent h1').textContent"), hostileSymbol.toUpperCase());
  assert.equal(await evaluate('decodeURIComponent(location.hash.slice(10))'), hostileSymbol);
  assert.equal(await evaluate("[...document.querySelectorAll('#categoryMembers a')].some(e=>e.textContent===" + JSON.stringify(hostileCategoryTitle) + ")"), true);
  assert.equal(await evaluate("document.querySelectorAll('#mainContent img,#mainContent svg,#mainContent script').length"), 0);
  assert.equal(await evaluate("[...document.querySelectorAll('#mainContent *')].some(e=>[...e.attributes].some(a=>/^on/i.test(a.name)))"), false);
  assert.equal(await evaluate('window.categoryInjected'), false);
  await evaluate(`(() => {
    testApp.nodes=[{id:'legacy-empty',title:'Empty',icon:'',unknown:{keep:[1,2]}},
      {id:'legacy-null',title:'Null',icon:null},{id:'legacy-missing',title:'Missing'},
      {id:'legacy-default',title:'Default',icon:'&'},
      {id:'legacy-special',title:'Special',icon:"'\\\"%雪"}];
    testApp.edges=[{a:'legacy-empty',b:'legacy-null',unknown:{keep:true}},
      {a:'legacy-empty',b:'legacy-missing'},{a:'legacy-empty',b:'legacy-default'},
      {a:'legacy-empty',b:'legacy-special'}];
    window.legacyBefore=JSON.stringify({nodes:testApp.nodes,edges:testApp.edges,state:testApp.categoryState});
    window.legacyStorageBefore=JSON.stringify(Object.entries(localStorage).sort());
    window.legacyWrites=0;window.legacySyncs=0;
    const originalSetItem=Storage.prototype.setItem;
    Storage.prototype.setItem=function(...args){window.legacyWrites++;return originalSetItem.apply(this,args);};
    const originalSync=testApp.sync.bind(testApp);
    testApp.sync=()=>{window.legacySyncs++;return originalSync();};
    testApp.navigateTo('legacy-empty');
  })()`);
  assert.equal(await evaluate("document.querySelector('#nodeCategorySymbol button').textContent"), '&');
  await click('#nodeCategorySymbol button');
  assert.equal(await evaluate('location.hash'), '#category/%26');
  assert.equal(await evaluate("document.querySelector('#mainContent h1').textContent"), '&');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#categoryMembers a')].map(e=>e.textContent)"), ['Default','Empty','Missing','Null']);
  assert.deepEqual(await evaluate("testApp.templateFor('&').rows.map(row=>row.symbol)"), ['&', '\'"%雪']);
  await click('#categoryMembers .list-row:nth-child(2) a');
  assert.equal(await evaluate('testApp.activeNodeId'), 'legacy-empty');
  await click('#nodeCategorySymbol button');
  assert.equal(await evaluate('JSON.stringify({nodes:testApp.nodes,edges:testApp.edges,state:testApp.categoryState})===window.legacyBefore'), true);
  assert.equal(await evaluate('JSON.stringify(Object.entries(localStorage).sort())===window.legacyStorageBefore'), true);
  assert.deepEqual(await evaluate('[window.legacyWrites,window.legacySyncs]'), [0,0]);
  console.log('PASS: legacy empty/null/missing icon default category and real mouse navigation; exact records/metadata preserved with zero storage writes or sync calls.');
  console.log('PASS: category mouse navigation, exact membership/uppercase heading, shared templates, safe notes/limit, category creation, appearance changes, template recalculation and local reload/read mode.');
  console.log('PASS: browser clicks pause from A, navigate to B, restore from B, pause/reload, read mode, isolated overview/search. External page requests blocked; synthetic disposable localStorage only.');
  console.log('PASS: literal hostile title, no injected paused-list elements/handlers, mouse navigation with original special IDs at router boundary, restoration from both endpoints, metadata preservation and zero no-op persistence.');
})().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (proc) { proc.kill(); await delay(500); }
  server.close();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
});
