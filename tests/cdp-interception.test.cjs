const test = require('node:test');
const assert = require('node:assert/strict');
const {createRequestInterceptor} = require('./support/cdp-interception.cjs');
const origin = 'http://127.0.0.1:8765';
const paused = (url = origin + '/test', networkId = 'network-1') => ({method: 'Fetch.requestPaused', params: {requestId: 'fetch-1', networkId, request: {url}}});
const invalid = () => Object.assign(Error('Invalid InterceptionId.'), {code: -32602});
const canceled = (value = true) => ({method: 'Network.loadingFailed', params: {requestId: 'network-1', canceled: value, errorText: value ? 'net::ERR_ABORTED' : 'net::ERR_FAILED'}});

test('interception explicitly enables request-stage blocking and continues only the exact loopback origin', async () => {
 const calls = [], i = createRequestInterceptor({origin, send: async (...args) => calls.push(args)});
 await i.start();i.handle(paused());await i.drain();
 for (const url of ['https://blocked.invalid/test',origin+'.evil.invalid/test','data:text/plain,test']) {i.handle(paused(url));await i.drain();}
 assert.deepEqual(calls.slice(0,2), [['Network.enable'],['Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]}]]);
 assert.equal(calls[2][0],'Fetch.continueRequest');
 for(const [command,params] of calls.slice(3)){assert.equal(command,'Fetch.failRequest');assert.equal(params.errorReason,'BlockedByClient');}
 assert.equal(i.external.length,3);assert.equal(i.stats.externalBlocked,3);
});
test('expired Fetch ID is accepted only with matching explicit browser cancellation', async () => {
 const i = createRequestInterceptor({origin, send: async () => {throw invalid()}});
 i.handle(canceled());i.handle(paused());await i.drain();assert.equal(i.stats.staleCanceled,1);
});
test('late cancellation notification resolves the correlated async waiter without sleeps', async () => {
 let rejected;const observed=new Promise(resolve=>rejected=resolve);
 const i=createRequestInterceptor({origin,send:async()=>{rejected();throw invalid()}});
 i.handle(paused());await observed;const drained=i.drain();
 i.handle(canceled());await drained;assert.equal(i.stats.staleCanceled,1);
});
test('unknown live expired-ID errors fail instead of being silently suppressed', async () => {
 const i=createRequestInterceptor({origin,cancellationTimeoutMs:10,send:async()=>{throw invalid()}});
 i.handle(paused());await assert.rejects(i.drain(),/CDP interception failed/);assert.equal(i.stats.staleCanceled,0);
});
test('finished or failed-but-not-canceled requests are not proof of benign cancellation', async () => {
 for(const terminal of [canceled(false),{method:'Network.loadingFinished',params:{requestId:'network-1'}}]){
  const i=createRequestInterceptor({origin,send:async()=>{throw invalid()}});i.handle(terminal);i.handle(paused());await assert.rejects(i.drain(),/CDP interception failed/);
 }
});
test('unrelated protocol and transport errors remain fatal even for canceled requests', async () => {
 for(const error of [Object.assign(Error('Invalid InterceptionId.'),{code:-123}),Object.assign(Error('Other protocol error'),{code:-32602}),Error('Socket closed')]){
  const i=createRequestInterceptor({origin,send:async()=>{throw error}});i.handle(canceled());i.handle(paused());await assert.rejects(i.drain(),/CDP interception failed/);
 }
});
test('interception drain waits for asynchronous disposition completion', async () => {
 let release;const gate=new Promise(resolve=>release=resolve);let completed=false;
 const i=createRequestInterceptor({origin,send:async()=>{await gate;completed=true}});
 i.handle(paused());const drained=i.drain();assert.equal(completed,false);release();await drained;assert.equal(completed,true);assert.equal(i.stats.handled,1);
});
test('missing or mismatched network identity cannot excuse an expired interception ID', async () => {
 for(const id of [null,'other-network']){
  const i=createRequestInterceptor({origin,cancellationTimeoutMs:10,send:async()=>{throw invalid()}});i.handle(canceled());i.handle(paused(origin+'/test',id));await assert.rejects(i.drain(),/CDP interception failed/);
 }
});
