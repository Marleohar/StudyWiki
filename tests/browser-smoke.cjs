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
  console.log('PASS: browser clicks pause from A, navigate to B, restore from B, pause/reload, read mode, isolated overview/search. External page requests blocked; synthetic disposable localStorage only.');
})().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (proc) { proc.kill(); await delay(500); }
  server.close();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
});
