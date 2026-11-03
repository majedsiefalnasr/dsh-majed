// #135 public provider seams; real Responses deliberately ignore transport abort.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AntigravityAdapter,exchangeAntigravityCode,refreshAntigravity,fetchAntigravityModels,isAntigravityPermanentRefreshError} from '../dist/providers/antigravity.js';
const session = {accessToken:'fixture',refreshToken:'fixture',expiresAt:4000000000000,projectId:'fixture'};
const tick = () => new Promise(resolve=>setImmediate(resolve));
function stalled(status=200, cancelMode='pending') {
  let cancelled=false;
  const body=new ReadableStream({pull(){},cancel(){cancelled=true;return cancelMode==='reject' ? Promise.reject(new Error('fixture cancel rejection')) : new Promise(()=>{});}});
  return {response:new Response(body,{status}),body,get cancelled(){return cancelled;}};
}
async function bounded(work) {
  let timer;
  try {return await Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('body did not settle')),150);})]);}
  finally {clearTimeout(timer);}
}
for (const cancelMode of ['pending','reject']) for (const mode of ['idle','caller']) test(`Antigravity ${mode} abort releases a stalled SSE body with ${cancelMode} cancel`,async()=>{
  const source=stalled(200,cancelMode), caller=new AbortController();
  const adapter=new AntigravityAdapter({models:[],discovery:false,streamIdleTimeoutMs:20,tokens:{session:async()=>session},fetchFn:async()=>source.response});
  const work=(async()=>{for await(const chunk of adapter.stream({provider:'antigravity',model:'fixture',messages:[],signal:caller.signal})) {}})();
  const rejected=assert.rejects(bounded(work),mode==='idle'?/idle timeout/:/aborted by caller/);
  await tick();if(mode==='caller')caller.abort(new Error('fixture abort'));
  await rejected;
  assert.equal(source.cancelled,true);assert.equal(source.body.locked,false);
});

for (const operation of ['exchange','refresh','internal']) test(`Antigravity ${operation} stalled error body cancels and unlocks`,async()=>{
  const source=stalled(400), controller=new AbortController(), fetch=async()=>source.response;
  const work=operation==='exchange'
    ? exchangeAntigravityCode('fixture','fixture','http://localhost/callback',{clientId:'fixture'},{},fetch,controller.signal)
    : operation==='refresh' ? refreshAntigravity(session,{clientId:'fixture'},fetch,controller.signal)
    : fetchAntigravityModels(session,{},fetch,controller.signal);
  const rejected=assert.rejects(bounded(work),/fixture abort/);
  await tick();controller.abort(new Error('fixture abort'));await rejected;
  assert.equal(source.cancelled,true);assert.equal(source.body.locked,false);
});

test('Antigravity errors retain classification while sanitizing diagnostics',async()=>{
  await assert.rejects(refreshAntigravity(session,{clientId:'fixture'},async()=>Response.json({error:'invalid_grant',error_description:'Bearer fixture-sensitive'},{status:400})),error=>{
    assert.equal(isAntigravityPermanentRefreshError(error),true);assert.equal(error.status,400);
    assert.equal(error.message.includes('fixture-sensitive'),false);return true;
  });
  await assert.rejects(fetchAntigravityModels(session,{},async()=>new Response('Bearer fixture-sensitive',{status:429,headers:{'retry-after':'2'}})),error=>{
    assert.equal(error.code,'RATE_LIMIT');assert.equal(error.failure.status,429);assert.equal(error.failure.providerRetryAfterMs,4000); // Existing two-second reset grace is preserved.
    assert.equal(error.failure.message.includes('fixture-sensitive'),false);
    assert.equal(error.message.includes('fixture-sensitive'),false);return true;
  });
});
test('Antigravity controller ignores late token response after cancel',async()=>{
  const {mkdtemp}=await import('node:fs/promises');
  const {AntigravityAuthController}=await import('../dist/auth/antigravity-controller.js');
  process.env.DSH_HOME=await mkdtemp('/tmp/majed135-late-');
  let completeFetch, started;
  const entered=new Promise(resolve=>{started=resolve;});
  const original=globalThis.fetch;
  globalThis.fetch=()=>{started();return new Promise(resolve=>{completeFetch=resolve;});};
  const attempt={authorizeUrl:'https://example.invalid',pkce:{verifier:'fixture'},redirectUri:'http://localhost/callback',waitCode:async()=>'fixture',cancel(){}};
  let changed=0;
  const controller=new AntigravityAuthController({start:async()=>attempt,pending:()=>undefined},{clientId:'fixture'},{},()=>changed++,String);
  try {
    await controller.login();await entered;controller.cancel();
    const response=Response.json({access_token:'fixture',refresh_token:'fixture',expires_in:3600});
    completeFetch(response);await tick();await tick();
    assert.deepEqual((await controller.status()).accounts,[]);assert.equal(changed,0);
    assert.equal(response.body.locked,false);
  } finally {controller.dispose();globalThis.fetch=original;}
});
