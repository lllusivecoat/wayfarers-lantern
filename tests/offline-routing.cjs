const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const handlers={},stored=new Map(),put=[];let fetched=0;
const cache={match:async key=>stored.get(String(key)),put:async(key,value)=>{put.push(String(key));stored.set(String(key),value)}};
const ctx={URL,Request,Response,console,self:{registration:{scope:'https://example.com/game/'},addEventListener:(name,fn)=>handlers[name]=fn},caches:{open:async()=>cache},fetch:async()=>{fetched++;return new Response('image')}};
vm.runInNewContext(fs.readFileSync('sw.js','utf8'),ctx);
function request(url,mode='cors'){let promise;handlers.fetch({request:{method:'GET',url,mode},respondWith:p=>promise=p});return promise}
(async()=>{
 const cached=new Response('promoted main');stored.set('https://example.com/game/index.html',cached);
 assert.equal(await request('https://example.com/game/','navigate'),cached);
 stored.set('https://example.com/game/beta/gear-care.js',new Response('gear care'));
 assert.equal(await (await request('https://example.com/game/beta/gear-care.js?v=5')).text(),'gear care');assert.equal(fetched,0);
 assert.equal(await (await request('https://example.com/game/beta/art/portraits/chibi/fixture.webp')).text(),'image');assert.equal(fetched,1);
 await request('https://example.com/game/beta/art/portraits/chibi/fixture.webp');assert.equal(fetched,1);
 assert.equal(request('https://example.com/other-app/image.webp'),undefined);
 assert.equal(request('https://different.example/game/beta/img/test.webp'),undefined);
 assert.equal(request('https://example.com/game/beta/art/preview.html'),undefined);
 assert(put.length===1);
 console.log('PASS main navigation, versioned presentation assets, on-demand offline artwork and cross-app/origin isolation');
})().catch(e=>{console.error(e);process.exitCode=1});
