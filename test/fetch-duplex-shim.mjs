const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const needsDuplex = init && init.body !== undefined && init.duplex === undefined;
  if (needsDuplex) init = { ...init, duplex: 'half' };
  try { return originalFetch(input, init); }
  catch (e) { console.error('SHIM THREW needsDuplex=', needsDuplex, 'bodyType=', typeof init?.body, 'duplex=', init?.duplex, 'msg=', e.message); throw e; }
};
