const PREFIX='mshem-navigator-field-', CACHE=PREFIX+'001-v2.0.6';
const scope=new URL('./',self.location.href).href;
const url=path=>new URL(path,scope).href;
const manifest=url('offline-files.json');
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
async function savedCache(){
 const keys=await caches.keys();
 const compatible=[CACHE,...keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).reverse()];
 for(const key of compatible){
  if(!keys.includes(key))continue;
  const bucket=await caches.open(key);
  if(await bucket.match(manifest))return {bucket,key};
 }
 return null;
}
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 const previous=await savedCache();
 if(previous&&previous.key!==CACHE){
  // Refresh only an existing opt-in copy. Keep the last complete edition
  // available if the connection drops part way through the update.
  try{await offline('save');}catch{/* The previous complete cache remains available. */}
 }
 await self.clients.claim();
})()));
let job=Promise.resolve();
async function offline(action){
 if(action==='clear'){
  for(const key of await caches.keys())if(key.startsWith(PREFIX))await caches.delete(key);
 }else if(action==='save'){
  const response=await fetch(manifest,{cache:'reload'});
  if(!response.ok)throw Error('The file list could not be loaded. Reconnect and try again.');
  const files=await response.clone().json(),cache=await caches.open(CACHE);
  await cache.addAll(files.map(path=>new Request(url(path),{cache:'reload',credentials:'same-origin'})));
  await cache.put(manifest,response);
  for(const key of await caches.keys())if(key!==CACHE&&key.startsWith(PREFIX))await caches.delete(key);
 }
 const saved=await savedCache();
 return {ready:!!saved,current:saved?.key===CACHE};
}
self.addEventListener('message',e=>{
 const port=e.ports[0];if(!port||!['save','clear','check'].includes(e.data?.action))return;
 job=job.then(()=>offline(e.data.action)).then(r=>port.postMessage(r)).catch(()=>port.postMessage({error:'Could not complete the offline request. Check your connection and available storage, then retry.'}));
 e.waitUntil(job);
});
self.addEventListener('fetch',e=>{
 const req=e.request;
 if(req.method!=='GET'||!req.url.startsWith(scope))return;
 e.respondWith((async()=>{
  try{return await fetch(req);}
  catch(error){
   const saved=await savedCache();
   if(!saved)throw error;
   const cache=saved.bucket;
   const hit=await cache.match(req.mode==='navigate'&&new URL(req.url).pathname===new URL(scope).pathname?url('index.html'):req,{ignoreSearch:true});
   return hit||Response.error();
  }
 })());
});
