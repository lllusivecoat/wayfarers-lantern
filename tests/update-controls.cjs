const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 const nodes={},events={},timers=new Map();let next=0,mode='ok',calls=0,stopped=false;
 const node=()=>({hidden:false,disabled:false,textContent:'',addEventListener(name,fn){this[name]=fn},setAttribute(){},click(){return this.clickHandler?.()||this.onclick?.()},scrollIntoView(){this.scrolled=true}});
 for(const key of ['offline-status','apply-game-update','install-game','check-game-update','install-help'])nodes[key]=node();
 const panel=node();panel.querySelector=s=>nodes[s.slice(1)];
 const menuCheck=node();menuCheck.addEventListener=(name,fn)=>menuCheck.clickHandler=()=>fn({stopImmediatePropagation(){stopped=true}});menuCheck.after=p=>menuCheck.following=p;
 const menu={querySelector:()=>menuCheck,appendChild(){}};
 const reg={waiting:null,installing:null,addEventListener(){},update(){calls++;if(mode==='reject')return Promise.reject(Error('network'));if(mode==='hang')return new Promise(()=>{});return Promise.resolve()}};
 const ctx={URL,console,Date,Promise,Error,document:{currentScript:{src:'https://example.com/game/offline.js'},readyState:'loading',createElement:()=>panel,querySelector:()=>menu,addEventListener:(name,fn)=>events[name]=fn},navigator:{onLine:true,serviceWorker:{controller:{},register:()=>Promise.resolve(reg),addEventListener(){}}},isSecureContext:true,matchMedia:()=>({matches:false}),addEventListener(){},setTimeout(fn){const id=++next;timers.set(id,fn);return id},clearTimeout:id=>timers.delete(id)};ctx.window=ctx;
 vm.runInNewContext(fs.readFileSync('offline.js','utf8'),ctx);events.DOMContentLoaded();
 return {ctx,reg,nodes,panel,menuCheck,timers,setMode:m=>mode=m,get calls(){return calls},get stopped(){return stopped}};
}
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
(async()=>{
 const h=setup();await flush();assert.equal(h.menuCheck.following,h.panel);
 h.menuCheck.click();assert(h.panel.open);assert(h.panel.scrolled);assert(h.stopped);assert.equal(h.nodes['offline-status'].textContent,'Checking for updates…');await flush();assert.match(h.nodes['offline-status'].textContent,/up to date/);assert(!h.menuCheck.disabled);
 h.reg.waiting={};h.menuCheck.click();await flush();assert.match(h.nodes['offline-status'].textContent,/Update available/);assert(!h.nodes['apply-game-update'].hidden);
 h.reg.waiting=null;h.setMode('reject');h.menuCheck.click();await flush();assert.match(h.nodes['offline-status'].textContent,/Could not check/);assert(!h.menuCheck.disabled);
 h.setMode('hang');h.menuCheck.click();await flush();assert(h.menuCheck.disabled);for(const fn of [...h.timers.values()])fn();await flush();assert.match(h.nodes['offline-status'].textContent,/taking too long/);assert(!h.menuCheck.disabled);
 const before=h.calls;h.ctx.navigator.onLine=false;h.menuCheck.click();await flush();assert.equal(h.calls,before);assert.match(h.nodes['offline-status'].textContent,/Connect to the internet/);
 console.log('PASS Settings result placement, immediate checking status, up-to-date/update-available outcomes, network failure, stalled-check timeout and offline retry feedback');
})().catch(e=>{console.error(e);process.exitCode=1});
