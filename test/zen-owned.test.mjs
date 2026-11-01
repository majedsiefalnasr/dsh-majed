// #137 approved assembled adapter/RPC seam; fake gateway only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import React from 'react';
import { create, act } from 'react-test-renderer';
import ts from 'typescript';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { apply } from '../dist/subscriptions.js';
function host(reference) {
  const routes=new Map(), adapters={}, cleanups=[];
  const llm={registerAdapter(ids,adapter){for(const id of ids){assert.equal(adapters[id],undefined,'provider collision: '+id);adapters[id]=adapter;}return {replace(){}};}};
  if(reference)llm.registerAdapter(['opencode2dsh'],reference);
  const ctx={logger:{warn(){}},llm,
    get:()=>({fetch:{register(route){routes.set(route.path,route);return ()=>routes.delete(route.path);}}}),
    effect(fn){const cleanup=fn();if(cleanup)cleanups.push(cleanup);},inject(names,fn){if(names.includes('connection'))fn(ctx);}};
  apply(ctx,{pool:{enabled:false}});
  return {adapters,async status(endpoint='status', signal){const method='majed-subscriptions.'+endpoint;const response=await routes.get('/api/'+method).fetch(new Request('http://localhost/api/'+method,{method:'POST',signal,headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'fixture',method,payload:{}})}));return (await response.json()).result;},dispose(){cleanups.reverse().forEach(fn=>fn());}};
}
test('Zen offers only free gateway models, caches discovery and coexists with opencode2dsh',async()=>{
  process.env.DSH_HOME=await mkdtemp('/tmp/majed137-host-');
  const previous=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,init)=>{calls.push({url:String(url),init});return Response.json({data:[{id:'mimo-v2.6-flash-free'},{id:'paid-model'},{id:'jev-1.13-free'},{id:'mimo-v2.6-flash-free'}]});};
  const reference={async listModels(){return [{provider:'opencode2dsh',id:'reference-free'}];}};
  const mounted=host(reference);
  try {
    const adapter=mounted.adapters['opencode-zen'];assert.ok(adapter);
    const models=await adapter.listModels('opencode-zen');assert.deepEqual(models.map(m=>m.id),['mimo-v2.6-flash-free']);
    await adapter.listModels('opencode-zen');assert.equal(calls.length,2);
    assert.equal(mounted.adapters.opencode2dsh,reference);
    assert.deepEqual(await mounted.adapters.opencode2dsh.listModels(),[{provider:'opencode2dsh',id:'reference-free'}]);
    assert.equal(calls[0].url,'https://opencode.ai/inference/v1/models');
    const status=(await mounted.status()).value.providers['opencode-zen'];
    assert.equal(status.reachable,true);assert.equal(status.modelCount,1);assert.equal(status.source,'gateway');
    await assert.rejects(()=>adapter.prepareCall('opencode-zen','paid-model'),/free model/);
    mounted.dispose();
    assert.equal(mounted.adapters.opencode2dsh,reference);
    assert.deepEqual(await mounted.adapters.opencode2dsh.listModels(),[{provider:'opencode2dsh',id:'reference-free'}]);
    await assert.rejects(()=>adapter.listModels('opencode-zen'));
  } finally {mounted.dispose();globalThis.fetch=previous;}
});

test('Zen cancellation releases stalled stream bodies and disposal aborts catalog reads',async()=>{
  process.env.DSH_HOME=await mkdtemp('/tmp/majed137-cancel-');
  const previous=globalThis.fetch;let cancelled=false,body;
  globalThis.fetch=async(url)=>String(url).endsWith('/models')?Response.json({data:[{id:'mimo-v2.6-flash-free'}]}):String(url).includes('models.dev')?Response.json({}):new Response(body=new ReadableStream({cancel(){cancelled=true;}}));
  const mounted=host();
  try {
    const controller=new AbortController();const run=(async()=>{for await(const chunk of mounted.adapters['opencode-zen'].stream({...options,signal:controller.signal})) {}})();
    await new Promise(resolve=>setTimeout(resolve,20));controller.abort();
    await assert.rejects(()=>run);assert.equal(cancelled,true);assert.equal(body.locked,false);
  }finally{mounted.dispose();globalThis.fetch=previous;}
});

const options = {provider:'opencode-zen',model:'mimo-v2.6-flash-free',messages:[{role:'user',content:[{type:'text',text:'fixture'}]}]};
test('Zen streams translated replies with canonical client identity and safe errors',async()=>{
  process.env.DSH_HOME=await mkdtemp('/tmp/majed137-stream-');
  const previous=globalThis.fetch; let failure, posted;
  globalThis.fetch=async(url,init)=>{
    if(String(url).endsWith('/models'))return Response.json({data:[{id:options.model}]});
    posted=init;
    if(failure)return new Response(failure.body,{status:failure.status});
    return new Response('data: '+JSON.stringify({choices:[{delta:{content:'hello'},finish_reason:null}]})+'\n\ndata: '+JSON.stringify({choices:[{delta:{},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');
  };
  const mounted=host();
  try {
    const adapter=mounted.adapters['opencode-zen'];
    const chunks=[];for await(const chunk of adapter.stream(options))chunks.push(chunk);
    assert.ok(chunks.some(chunk=>chunk.type==='text-delta'&&chunk.text==='hello'));
    assert.match(posted.headers['x-opencode-session'],/^ses_[a-f0-9]{12}[0-9A-Za-z]{14}$/);
    assert.equal(posted.headers['x-opencode-project'],'global');
    assert.equal(posted.headers['x-opencode-request'],undefined);
    const body=JSON.parse(posted.body);assert.equal(body.tool_choice,'none');assert.deepEqual(body.tools.map(t=>t.function.name),['bash','read']);
    for(const [status,body,code] of [[429,'private fixture detail','RATE_LIMIT'],[403,'FreeTierError private fixture detail','FREE_TIER_RESTRICTED'],[403,'RegionError private fixture detail','REGION_BLOCKED']]){
      failure={status,body};
      await assert.rejects(async()=>{for await(const chunk of adapter.stream(options)){}},error=>error.code===code&&!error.message.includes('private fixture detail'));
    }
  }finally{mounted.dispose();globalThis.fetch=previous;}
});
test('Zen uses static fallback when discovery fails without exposing transport details',async()=>{
  process.env.DSH_HOME=await mkdtemp('/tmp/majed137-fallback-');
  const previous=globalThis.fetch;globalThis.fetch=async()=>{throw Error('private transport detail');};const mounted=host();
  try {await mounted.adapters['opencode-zen'].listModels('opencode-zen');const status=(await mounted.status()).value.providers['opencode-zen'];assert.equal(status.reachable,false);assert.equal(status.source,'static');assert.equal(status.modelCount,5);assert.equal(JSON.stringify(status).includes('private'),false);}
  finally{mounted.dispose();globalThis.fetch=previous;}
});
for(const locale of ['en','ar'])test('Zen actual status card is login-less and localized: '+locale,async()=>{
  const source=await readFile(new URL('../src/zen-card.ts',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const dictionary=JSON.parse(await readFile(new URL('../locale/'+locale+'.json',import.meta.url),'utf8')).subscriptions;
  const exports={};const calls=[];
  vm.runInNewContext(compiled,{exports,require:()=>({styles:{},callSubscriptionsAuth:async(rpc,endpoint,payload)=>{calls.push(endpoint);return {reachable:true,modelCount:2,source:'gateway'};}})});
  const Card=exports.createZenCard(React,{}, {},key=>dictionary[key]);let renderer;
  await act(async()=>{renderer=create(React.createElement(Card));});
  const rendered=JSON.stringify(renderer.toJSON());assert.ok(rendered.includes(dictionary.zenNoLogin));assert.ok(rendered.includes(dictionary.zenReachable));assert.ok(rendered.includes(dictionary.zenModelCount));
  assert.equal(renderer.root.findAllByType('button').length,1);assert.deepEqual(calls,['zenStatus']);
  await act(async()=>{renderer.unmount();});
});

// Public reference catalog metadata uses lifecycle/status as well as deprecated.
test('metadata paid and retired verdicts override free-looking names', async()=>{
  process.env.DSH_HOME=await mkdtemp('/tmp/majed137-metadata-');
  const saved=globalThis.fetch;
  globalThis.fetch=async url=>String(url).endsWith('/models')
    ?Response.json({data:['paid-free','retired-free','disabled-free','dated-free','allowed'].map(id=>({id}))})
    :Response.json({opencode:{models:{'paid-free':{cost:{input:1,output:0}},'retired-free':{cost:{input:0,output:0},status:'retired'},'disabled-free':{cost:{input:0,output:0},lifecycle:'disabled'},'dated-free':{cost:{input:0,output:0},deprecated_at:'2026-01-01'},allowed:{cost:{input:0,output:0}}}}});
  const mounted=host();
  try{assert.deepEqual((await mounted.adapters['opencode-zen'].listModels('opencode-zen')).map(m=>m.id),['allowed']);}
  finally{mounted.dispose();globalThis.fetch=saved;}
});
test('known paid and deprecated verdicts survive a later metadata outage',async()=>{
  process.env.DSH_HOME=await mkdtemp('/tmp/majed137-verdicts-');
  const saved=globalThis.fetch,now=Date.now;let clock=now(),refresh=0;
  Date.now=()=>clock;
  globalThis.fetch=async url=>{
    if(String(url).endsWith('/models'))return Response.json({data:['paid-free','retired-free','healthy-free'].map(id=>({id}))});
    if(refresh)throw Error('metadata unavailable');
    return Response.json({opencode:{models:{'paid-free':{cost:{input:1,output:0}},'retired-free':{deprecated:true,cost:{input:0,output:0}}}}});
  };
  const mounted=host();
  try{
    const adapter=mounted.adapters['opencode-zen'];
    assert.deepEqual((await adapter.listModels('opencode-zen')).map(m=>m.id),['healthy-free']);
    clock+=300001;refresh++;
    assert.deepEqual((await adapter.listModels('opencode-zen')).map(m=>m.id),['healthy-free']);
    await assert.rejects(()=>adapter.prepareCall('opencode-zen','paid-free'),/free model/);
  }finally{Date.now=now;mounted.dispose();globalThis.fetch=saved;}
});
test('registration and general status perform no discovery; dedicated status is bounded by caller cancellation',async()=>{
  process.env.DSH_HOME=await mkdtemp('/tmp/majed137-lazy-');
  const saved=globalThis.fetch;let calls=0,cancelled=false,body;
  globalThis.fetch=async()=>{calls++;return new Response(body=new ReadableStream({cancel(){cancelled=true;}}));};
  const mounted=host();
  try{
    assert.equal(calls,0);
    assert.equal((await mounted.status()).value.providers['opencode-zen'].reachable,null);
    assert.equal(calls,0);
    const controller=new AbortController();
    const pending=mounted.status('zenStatus',controller.signal);
    await new Promise(resolve=>setTimeout(resolve,20));controller.abort();
    assert.equal((await pending).ok,false);assert.equal(calls,1);assert.equal(cancelled,true);assert.equal(body.locked,false);
  }finally{mounted.dispose();globalThis.fetch=saved;}
});
test('cancelled discovery does not suppress the next independent healthy discovery',async()=>{
  process.env.DSH_HOME=await mkdtemp('/tmp/majed137-retry-');
  const saved=globalThis.fetch;let calls=0,started;
  const ready=new Promise(resolve=>{started=resolve;});
  globalThis.fetch=async url=>{calls++;if(calls===1){started();return new Response(new ReadableStream());}return String(url).endsWith('/models')?Response.json({data:[{id:'healthy-free'}]}):Response.json({});};
  const mounted=host();
  try{
    const controller=new AbortController(),adapter=mounted.adapters['opencode-zen'];
    const pending=adapter.listModels('opencode-zen',controller.signal);await ready;controller.abort();await assert.rejects(()=>pending);
    assert.deepEqual((await adapter.listModels('opencode-zen')).map(model=>model.id),['healthy-free']);assert.equal(calls,3);
  }finally{mounted.dispose();globalThis.fetch=saved;}
});
test('cached gateway roster survives failed refresh and later recovers',async()=>{
  process.env.DSH_HOME=await mkdtemp('/tmp/majed137-cache-');
  const saved=globalThis.fetch,now=Date.now;let clock=now(),fail=false,calls=0;
  Date.now=()=>clock;
  globalThis.fetch=async url=>{calls++;if(fail)throw Error('private');return String(url).endsWith('/models')?Response.json({data:[{id:'mimo-v2.6-flash-free'}]}):Response.json({});};
  const mounted=host();
  try{
    assert.equal((await mounted.status('zenStatus')).value.source,'gateway');
    await mounted.status('zenStatus');assert.equal(calls,2);
    clock+=300001;fail=true;
    const fallback=(await mounted.status('zenStatus')).value;
    assert.equal(fallback.source,'cache');assert.equal(fallback.reachable,false);assert.equal(fallback.modelCount,1);
    clock+=300001;fail=false;assert.equal((await mounted.status('zenStatus')).value.source,'gateway');
  }finally{Date.now=now;mounted.dispose();globalThis.fetch=saved;}
});
test('Responses-only free model uses Responses wire and translated terminal event',async()=>{
  process.env.DSH_HOME=await mkdtemp('/tmp/majed137-responses-');
  const saved=globalThis.fetch;let wire;
  globalThis.fetch=async(url,init)=>{
    if(String(url).endsWith('/models'))return Response.json({data:[{id:'muse-spark-1.3-contributor-free'}]});
    if(String(url).includes('models.dev'))return Response.json({});
    wire={url:String(url),body:JSON.parse(init.body)};
    return new Response('data: '+JSON.stringify({type:'response.output_text.delta',delta:'fixture response'})+'\n\ndata: '+JSON.stringify({type:'response.completed',response:{usage:{input_tokens:1,output_tokens:2}}})+'\n\n');
  };
  const mounted=host();
  try{
    const chunks=[];for await(const chunk of mounted.adapters['opencode-zen'].stream({...options,model:'muse-spark-1.3-contributor-free'}))chunks.push(chunk);
    assert.equal(wire.url,'https://opencode.ai/inference/v1/responses');assert.ok(wire.body.input);assert.equal(wire.body.messages,undefined);
    assert.deepEqual(wire.body.tools.map(tool=>tool.name),['bash','read']);
    assert.ok(chunks.some(chunk=>chunk.type==='text-delta'&&chunk.text==='fixture response'));
  }finally{mounted.dispose();globalThis.fetch=saved;}
});
