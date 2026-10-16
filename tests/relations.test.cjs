const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
// Extract only the class: never initialize Firebase or use bundled records/configuration.
const source = html.slice(html.indexOf('    class GraphApp {'), html.indexOf('    const app = new GraphApp();'));
function fixture() {
  const elements = new Map();
  const storage = new Map();
  const context = vm.createContext({
    document: { getElementById(id) { if (!elements.has(id)) elements.set(id, { innerHTML: '', value: '', style: {} }); return elements.get(id); } },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
    confirm: () => true,
  });
  const GraphApp = vm.runInContext(source + '\nGraphApp;', context);
  const app = Object.create(GraphApp.prototype);
  Object.assign(app, {
    nodes: ['A', 'B', 'C'].map(id => ({ id, title: id, extra: { preserved: true } })),
    edges: [{ a: 'B', b: 'A', custom: { preserved: true } }, { a: 'B', b: 'C' }],
    mode: 'create', currentLibrary: 'synthetic-task001', db: null, activeNodeId: 'A',
  });
  app.navigateTo = id => { app.lastNavigation = id; };
  app.routeFromHash = () => {};
  return { app, elements, storage, GraphApp };
}
const plain = value => JSON.parse(JSON.stringify(value));

test('legacy loading and rendering do not rewrite nodes, edges or metadata', () => {
  const { app } = fixture();
  const before = plain({ nodes: app.nodes, edges: app.edges });
  app.nodes = app.cleanDuplicates(app.nodes); app.edges = app.cleanEdges(app.edges);
  app.renderPage('A');
  assert.deepEqual(plain({ nodes: app.nodes, edges: app.edges }), before);
  assert.equal(app.areNeighbors('A', 'B'), true);
});
test('pause is bidirectional, preserves B-C, restores from B, and is idempotent', () => {
  const { app, elements } = fixture();
  const before = plain({ nodes: app.nodes, edges: app.edges });
  let saves = 0; app.sync = () => saves++;
  app.requestRemoveRelation('A', 'B'); app.requestRemoveRelation('B', 'A');
  assert.equal(saves, 1);
  assert.deepEqual(plain(app.getNeighbors('A')), []);
  assert.deepEqual(plain(app.getNeighbors('B')), ['C']);
  assert.deepEqual(plain(app.getNeighbors('A', true)), ['B']);
  assert.deepEqual(plain(app.getNeighbors('B', true)), ['A']);
  for (const id of ['A', 'B']) {
    app.renderPage(id);
    assert.match(elements.get('mainContent').innerHTML, /Vilande relationer/);
    assert.match(elements.get('mainContent').innerHTML, /requestRestoreRelation/);
  }
  app.requestRestoreRelation('B', 'A'); app.requestRestoreRelation('A', 'B');
  assert.equal(saves, 2);
  assert.deepEqual(plain({ nodes: app.nodes, edges: app.edges }), before);
});
test('relink, chain and batch restore the original edge without duplicates', () => {
  const { app } = fixture();
  const edge = app.edges[0];
  for (const restore of [() => app.addRelation('A', 'B'), () => app.parseChain('A', 'B'), () => {
    app.targetPageForLink = 'A'; app.pendingLinks = ['B']; app.executeLinkNodes();
    assert.equal(app.activeNodeId, 'A');
  }]) {
    app.requestRemoveRelation('A', 'B'); restore();
    assert.equal(app.edges.length, 2); assert.equal(app.edges[0], edge);
    assert.equal(app.areNeighbors('B', 'A'), true);
    assert.equal(app.addRelation('A', 'B'), false);
  }
});
test('isolated nodes and paused metadata survive local storage save and reload', async () => {
  const { app, storage } = fixture();
  app.getOrCreateNode('Standalone'); app.requestRemoveRelation('A', 'B');
  const before = plain({ nodes: app.nodes, edges: app.edges });
  await app.sync();
  app.nodes = []; app.edges = []; app.fallbackLocal();
  assert.deepEqual(plain({ nodes: app.nodes, edges: app.edges }), before);
  assert.equal(storage.size, 2);
  assert.ok(app.getNodeByTitle('Standalone')); assert.ok(app.getNode('A'));
  assert.deepEqual(plain(app.getNeighbors('A', true)), ['B']);
  assert.deepEqual(plain(app.getNeighbors('B', true)), ['A']);
  app.renderOverview();
  // Overview renders every node; isolated records are not filtered by degree.
  assert.ok(app.getNodeByTitle('Standalone'));
});
test('synthetic Firestore round-trip retains paused status and metadata', async () => {
  const { app } = fixture(); let serialized;
  app.requestRemoveRelation('A', 'B');
  app.db = { collection(name) { assert.equal(name, 'simple_db'); return { doc(id) {
    assert.equal(id, 'nv_lib_synthetic-task001'); return { async set(value) { serialized = JSON.stringify(value); } };
  } }; } };
  await app.sync();
  const data = JSON.parse(serialized);
  app.nodes = app.cleanDuplicates(data.nodes); app.edges = app.cleanEdges(data.edges);
  assert.deepEqual(plain(app.getNeighbors('A', true)), ['B']);
  assert.deepEqual(plain(app.getNeighbors('B', true)), ['A']);
  assert.equal(app.edges[0].custom.preserved, true);
});
test('read mode blocks pause, restore, direct linking, chain and batch', () => {
  const { app } = fixture(); app.edges[0].paused = true; app.mode = 'read';
  const before = plain({ nodes: app.nodes, edges: app.edges });
  app.requestRemoveRelation('B', 'C'); app.requestRestoreRelation('B', 'A');
  app.addRelation('A', 'C'); app.parseChain('A', 'New');
  app.targetPageForLink = 'A'; app.pendingLinks = ['New']; app.executeLinkNodes();
  assert.deepEqual(plain({ nodes: app.nodes, edges: app.edges }), before);
});
test('explicit node deletion removes its active and paused edges only', () => {
  const { app } = fixture(); app.requestRemoveRelation('A', 'B');
  app.requestDeleteNode('A');
  assert.equal(app.getNode('A'), undefined);
  assert.deepEqual(plain(app.edges), [{ a: 'B', b: 'C' }]);
  assert.equal(app.nodes.length, 2);
});
test('inherited duplicate endpoint records retain metadata and change state together', () => {
  const { app } = fixture();
  app.edges.push({ a: 'A', b: 'B', custom: 'second record' });
  const before = plain(app.edges);
  app.requestRemoveRelation('B', 'A');
  assert.deepEqual(plain(app.getNeighbors('A', true)), ['B']);
  app.addRelation('B', 'A');
  assert.deepEqual(plain(app.edges), before);
});
test('failed synthetic Firestore save uses existing local fallback', async () => {
  const { app, storage } = fixture();
  app.requestRemoveRelation('A', 'B');
  app.db = { collection: () => ({ doc: () => ({ set: async () => { throw Error('synthetic offline'); } }) }) };
  await app.sync();
  assert.equal(JSON.parse(storage.get('nv_edges_nv_lib_synthetic-task001'))[0].paused, true);
});
