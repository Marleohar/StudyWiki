const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const source = html.slice(html.indexOf('    class GraphApp {'), html.indexOf('    const app = new GraphApp();'));
const plain = value => JSON.parse(JSON.stringify(value));
function descendant(element,id) { if(element.id===id)return element;for(const child of element.children||[]){const found=descendant(child,id);if(found)return found} }
function fixture() {
  const elements = new Map(), storage = new Map(); let writes = 0;
  function element(tag = 'div') {
    return { tag, textContent: '', value: '', children: [], style: {}, listeners: {}, attributes: {},
      set innerHTML(value) { this.html = value; this.children = []; }, get innerHTML() { return this.html || ''; },
      appendChild(child) { this.children.push(child); return child; },
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(key, handler) { this.listeners[key] = handler; } };
  }
  const document = { createElement: element, querySelectorAll: () => [], getElementById(id) {
    if (!elements.has(id)) elements.set(id, element()); return elements.get(id);
  } };
  const context = vm.createContext({ document, localStorage: { getItem: key => storage.get(key), setItem: (key, value) => { writes++; storage.set(key, value); } }, setTimeout: () => {}, alert: () => {}, confirm: () => true });
  const GraphApp = vm.runInContext(source + ';GraphApp', context);
  const app = Object.create(GraphApp.prototype);
  Object.assign(app, { mode: 'create', currentLibrary: 'synthetic-categories', db: null,
    categoryState: { version: 1, categories: [], modifications: [] },
    nodes: [{ id: 'A', title: 'Legacy UPPERCASE', icon: 'x', extra: { preserve: true } },
      { id: 'B', title: 'B', icon: 'x' }, { id: 'C', title: 'C', icon: 'sword', color: 'red' },
      { id: 'D', title: 'D', icon: 'sword', color: 'blue' }, { id: 'E', title: 'E', icon: 'shield' },
      { id: 'I', title: 'Isolated', icon: 'x' }],
    edges: [{ a: 'A', b: 'C', extra: [1, 2] }, { a: 'A', b: 'D' }, { a: 'B', b: 'C' }, { a: 'E', b: 'B' }, { a: 'A', b: 'E', paused: true, unknown: 'keep' }]
  });
  app.navigateTo = id => { app.lastRoute = id; }; app.routeFromHash = () => {};
  return { app, document, elements, storage, context, writes: () => writes };
}
test('legacy empty, null and missing icons share the visible default without data or persistence changes', () => {
  const { app, elements, writes } = fixture();
  app.nodes = [{ id: 'empty', title: 'Empty', icon: '', unknown: { keep: [1, 2] } },
    { id: 'null', title: 'Null', icon: null }, { id: 'missing', title: 'Missing' },
    { id: 'default', title: 'Default', icon: '&' },
    { id: 'special', title: 'Special', icon: '\'"%雪' },
    { id: 'space', title: 'Space', icon: ' ' }];
  app.edges = [{ a: 'empty', b: 'null', metadata: 'keep' }, { a: 'empty', b: 'missing' },
    { a: 'empty', b: 'default' }, { a: 'empty', b: 'special' }];
  const before = plain({ nodes: app.nodes, edges: app.edges, state: app.categoryState });
  assert.deepEqual(plain(app.categoryMembers('&').map(n => n.id)), ['empty', 'null', 'missing', 'default']);
  assert.equal(app.categoryMembers('').length, 0);
  assert.equal(app.categoryMembers('\'"%雪')[0].id, 'special');
  assert.equal(app.categoryMembers(' ')[0].id, 'space');
  assert.deepEqual(plain(app.templateFor('&').rows), [{ symbol: '&' }, { symbol: '\'"%雪' }]);
  app.renderPage('empty');
  const button = elements.get('nodeCategorySymbol').children[0];
  assert.equal(button.textContent, '&'); button.listeners.click();
  assert.equal(app.lastRoute, 'category/%26');
  app.renderCategory('&');
  assert.equal(descendant(elements.get('mainContent'),'categoryHeadingSymbol').textContent, '&');
  assert.deepEqual(plain({ nodes: app.nodes, edges: app.edges, state: app.categoryState }), before);
  assert.equal(writes(), 0);
});
test('exact symbol membership and uppercase headings do not convert legacy names', () => {
  const { app, elements } = fixture(); const before = plain(app.nodes);
  app.renderCategory('x');
  assert.deepEqual(plain(app.categoryMembers('x').map(n => n.id)), ['A', 'B', 'I']);
  const card = elements.get('mainContent').children[1];
  assert.equal(descendant(card,'categoryHeadingSymbol').textContent, 'X');
  assert.equal(elements.get('mainContent').innerHTML, '');
  assert.deepEqual(plain(app.nodes), before);
  assert.equal(app.categoryMembers('X').length, 0);
});
test('symbol click closures preserve arbitrary symbol identity and safe text', () => {
  const { app } = fixture();
  const symbol = '\'"%雪<img onerror=bad()>/';
  const button = app.symbolButton(symbol);
  assert.equal(button.textContent, symbol); assert.equal(button.innerHTML, '');
  button.listeners.click(); assert.equal(app.lastRoute, 'category/' + encodeURIComponent(symbol));
});
test('template counts distinct active symbols, ignores colors, paused edges and duplicates', () => {
  const { app } = fixture();
  const before = plain({ nodes: app.nodes, edges: app.edges, state: app.categoryState });
  assert.equal(app.templateFor('x').sourceId, 'B');
  assert.deepEqual(plain(app.templateFor('x').rows), [{ symbol: 'shield' }, { symbol: 'sword' }]);
  assert.deepEqual(plain({ nodes: app.nodes, edges: app.edges, state: app.categoryState }), before);
  app.renderPage('A'); assert.deepEqual(plain(app.getNeighbors('A')), ['C', 'D']);
});
test('ties use new edits then stable legacy ID, independent of array order', () => {
  const { app } = fixture(); app.edges = [];
  assert.equal(app.templateFor('x').sourceId, 'A');
  app.nodes.reverse(); assert.equal(app.templateFor('x').sourceId, 'A');
  app.touchNodes(['B']); assert.equal(app.templateFor('x').sourceId, 'B');
  app.touchNodes(['I']); assert.equal(app.templateFor('x').sourceId, 'I');
  assert.equal(app.templateFor('missing').sourceId, null);
});
test('shared template propagation preserves complete node and edge records', () => {
  const { app } = fixture(); const before = plain({ nodes: app.nodes, edges: app.edges });
  app.requestRestoreRelation('A', 'E');
  assert.equal(app.templateFor('x').sourceId, 'A');
  const expected = plain(before); delete expected.edges[4].paused;
  assert.deepEqual(plain({ nodes: app.nodes, edges: app.edges }), expected);
  app.renderCategory('x'); app.renderPage('B');
  assert.deepEqual(plain({ nodes: app.nodes, edges: app.edges }), expected);
  assert.deepEqual(plain(app.getNeighbors('B')), ['C', 'E']);
});
test('category notes accept 280 Unicode characters, reject 281 without truncation or writes', () => {
  const { app, writes } = fixture();
  const text = '雪'.repeat(280);
  assert.equal(app.saveCategoryNotes('x', text), true);
  const count = writes();
  assert.equal(app.saveCategoryNotes('x', text + 'a'), false);
  assert.equal(app.categoryState.categories[0].notes, text); assert.equal(writes(), count);
  app.saveCategoryNotes('x', text); assert.equal(writes(), count);
  app.saveCategoryNotes('x', 'Edited'); assert.equal(app.categoryState.categories[0].notes, 'Edited');
  app.mode = 'read'; app.saveCategoryNotes('x', 'Blocked');
  assert.equal(app.categoryState.categories[0].notes, 'Edited');
});
test('category creation inherits exact symbol with established standalone shape', () => {
  const { app, document } = fixture();
  app.activeCategorySymbol = '雪%"'; app.openCreateDialog();
  document.getElementById('modalTitle').value = 'New standalone';
  document.getElementById('modalFreeText').value = 'Notes';
  app.saveNewNode(); const node = app.getNodeByTitle('New standalone');
  assert.equal(node.icon, '雪%"'); assert.deepEqual(Object.keys(node).sort(), ['color', 'free_text', 'icon', 'id', 'title']);
  assert.deepEqual(plain(app.getNeighbors(node.id)), []);
  assert.ok(app.categoryState.modifications.find(record => record.id === node.id));
});
test('free-text edits preserve metadata/languages and update tie selection; no-op does not write', () => {
  const { app, document, writes } = fixture(); app.edges = [];
  app.nodes[1].free_text = { sv: 'Old', en: 'English', unknown: 7 };
  document.getElementById('freeTextEditor').value = 'New'; app.saveFreeText('B');
  assert.equal(app.templateFor('x').sourceId, 'B');
  assert.deepEqual(plain(app.nodes[1].free_text), { sv: 'New', en: 'English', unknown: 7 });
  const count = writes(); app.saveFreeText('B'); assert.equal(writes(), count);
});
test('symbol changes move membership and update affected template timestamps', () => {
  const { app, document } = fixture(); app.appearanceTargetId = 'B'; app.activeNodeId = 'B';
  document.getElementById('appIconInput').value = 'shield'; document.getElementById('appColorInput').value = '#123456';
  app.saveAppearance();
  assert.equal(app.categoryMembers('x').some(n => n.id === 'B'), false);
  assert.equal(app.categoryMembers('shield').some(n => n.id === 'B'), true);
  assert.ok(app.categoryState.modifications.find(record => record.id === 'C'));
});
test('complete records and unknown category metadata survive local save/reload', async () => {
  const { app } = fixture();
  app.categoryState.extra = { future: 'preserved' };
  app.categoryState.categories.push({ symbol: 'x', notes: 'Saved', future: [1, 2] });
  app.touchNodes(['A']);
  const before = plain({ nodes: app.nodes, edges: app.edges, state: app.categoryState });
  await app.sync(); app.nodes = []; app.edges = []; app.categoryState = null; app.fallbackLocal();
  assert.deepEqual(plain({ nodes: app.nodes, edges: app.edges, state: app.categoryState }), before);
});
test('Firestore payload merges new metadata without replacing unrelated document fields', async () => {
  const { app } = fixture(); let stored = { unrelated: { keep: true }, symbolCategories: { futureRoot: 1 } };
  app.db = { collection: () => ({ doc: () => ({ set: async (value, options) => {
    assert.equal(options.merge, true); stored = { ...stored, ...plain(value) };
  } }) }) };
  await app.sync();
  assert.deepEqual(stored.unrelated, { keep: true });
  assert.deepEqual(stored.nodes, plain(app.nodes)); assert.deepEqual(stored.edges, plain(app.edges));
  assert.deepEqual(stored.symbolCategories, plain(app.categoryState));
});
test('read mode blocks category creation, note writes, free text and appearance', () => {
  const { app, document, writes } = fixture(); app.mode = 'read';
  const before = plain({ nodes: app.nodes, edges: app.edges, state: app.categoryState });
  document.getElementById('modalTitle').value = 'Blocked'; app.saveNewNode();
  app.saveCategoryNotes('x', 'Blocked'); app.saveFreeText('A'); app.appearanceTargetId = 'A'; app.saveAppearance();
  assert.deepEqual(plain({ nodes: app.nodes, edges: app.edges, state: app.categoryState }), before);
  assert.equal(writes(), 0);
});
test('relationship edits update both endpoint clocks, no-op operations leave clocks unchanged', () => {
  const { app, writes } = fixture();
  app.requestRemoveRelation('A', 'C');
  const first = plain(app.categoryState.modifications), count = writes();
  assert.ok(first.find(record => record.id === 'A')); assert.ok(first.find(record => record.id === 'C'));
  app.requestRemoveRelation('C', 'A');
  assert.deepEqual(plain(app.categoryState.modifications), first); assert.equal(writes(), count);
  app.addRelation('A', 'C');
  assert.ok(app.categoryState.modifications.find(record => record.id === 'A').at > first[0].at);
});
test('synthetic Firestore reload restores category state and unknown fields without rewrites', () => {
  const { app, context } = fixture();
  app.categoryState.categories.push({ symbol: 'x', notes: 'Cloud mock', unknown: { keep: true } });
  app.touchNodes(['B']);
  const before = plain({ nodes: app.nodes, edges: app.edges, state: app.categoryState });
  const data = { nodes: before.nodes, edges: before.edges, symbolCategories: before.state };
  context.firebase = { apps: [{}], firestore: () => ({ collection: () => ({ doc: () => ({ onSnapshot: callback => {
    callback({ exists: true, data: () => data }); return () => {};
  } }) }) }) };
  app.nodes = []; app.edges = []; app.categoryState = null; app.initFirebase();
  assert.deepEqual(plain({ nodes: app.nodes, edges: app.edges, state: app.categoryState }), before);
});
test('category metadata stays isolated by existing library document names', async () => {
  const { app } = fixture(); app.saveCategoryNotes('x', 'First library');
  app.currentLibrary = 'synthetic-second';
  // Seed the second library with synthetic records so bundled defaults are never read.
  app.categoryState = { version: 1, categories: [], modifications: [] }; await app.sync();
  app.saveCategoryNotes('x', 'Second library');
  app.currentLibrary = 'synthetic-categories'; app.fallbackLocal();
  assert.equal(app.categoryState.categories[0].notes, 'First library');
  app.currentLibrary = 'synthetic-second'; app.fallbackLocal();
  assert.equal(app.categoryState.categories[0].notes, 'Second library');
});
test('explicit deletion keeps its behavior and records the surviving endpoints relationship edits', () => {
  const { app } = fixture(); const nodes = plain(app.nodes), edges = plain(app.edges);
  app.requestDeleteNode('C');
  assert.deepEqual(plain(app.nodes), nodes.filter(node => node.id !== 'C'));
  assert.deepEqual(plain(app.edges), edges.filter(edge => edge.a !== 'C' && edge.b !== 'C'));
  assert.ok(app.categoryState.modifications.find(record => record.id === 'A'));
  assert.ok(app.categoryState.modifications.find(record => record.id === 'B'));
});
