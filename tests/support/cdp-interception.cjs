// Test-only CDP Fetch lifecycle handling. Unknown errors fail the suite; only
// expired interception IDs proven canceled by Network.loadingFailed are expected.
function createRequestInterceptor({send, origin, beforeSend = () => {}, cancellationTimeoutMs = 1000}) {
  const tasks = new Set(), canceled = new Set(), terminal = new Set(), waiters = new Map(), failures = [], external = [];
  const stats = {handled: 0, staleCanceled: 0, externalBlocked: 0};
  function waitForCancellation(networkId) {
    if (canceled.has(networkId)) return Promise.resolve(true);
    if (!networkId || terminal.has(networkId)) return Promise.resolve(false);
    return new Promise(resolve => {
      let callbacks = waiters.get(networkId);
      if (!callbacks) waiters.set(networkId, callbacks = new Set());
      const finish = value => { clearTimeout(timer); callbacks.delete(finish); if (!callbacks.size) waiters.delete(networkId); resolve(value); };
      const timer = setTimeout(() => finish(false), cancellationTimeoutMs);
      callbacks.add(finish);
    });
  }
  function handle(message) {
    const {method, params} = message;
    if (method === 'Network.loadingFailed' || method === 'Network.loadingFinished') {
      terminal.add(params.requestId);
      const wasCanceled = method === 'Network.loadingFailed' && params.canceled === true;
      if (wasCanceled) canceled.add(params.requestId);
      for (const finish of [...(waiters.get(params.requestId) || [])]) finish(wasCanceled);
      return;
    }
    if (method !== 'Fetch.requestPaused') return;
    const record = {id: params.requestId, networkId: params.networkId, url: params.request.url};
    try { record.local = new URL(record.url).origin === origin; }
    catch (error) { record.local = false; }
    const command = record.local ? 'Fetch.continueRequest' : 'Fetch.failRequest';
    if (!record.local) { external.push(record.url); stats.externalBlocked++; }
    const task = (async () => {
      try {
        // The hook is used only to force real canceled-request races in browser tests.
        if (record.local) await beforeSend(record);
        await send(command, {requestId: record.id, ...(record.local ? {} : {errorReason: 'BlockedByClient'})});
        stats.handled++;
      } catch (error) {
        if (error.code === -32602 && error.message === 'Invalid InterceptionId.' && await waitForCancellation(record.networkId)) {
          stats.staleCanceled++;
          return;
        }
        failures.push(new Error(`${command} failed for ${record.id}: ${error.message}`));
      }
    })();
    tasks.add(task);
    // Attach both outcomes immediately; event callbacks must never leak rejections.
    task.then(() => tasks.delete(task), error => { failures.push(error); tasks.delete(task); });
  }
  async function drain() {
    while (tasks.size) await Promise.all([...tasks]);
    if (failures.length) throw new AggregateError(failures, 'CDP interception failed');
  }
  return {
    handle, drain, waitForCancellation, stats, external,
    async start() {
      await send('Network.enable');
      await send('Fetch.enable', {patterns: [{urlPattern: '*', requestStage: 'Request'}]});
    }
  };
}
module.exports = {createRequestInterceptor};
