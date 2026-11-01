const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),critical=fs.readFileSync(path.join(root,'launch-critical.js'),'utf8'),coordinator=fs.readFileSync(path.join(root,'launch.js'),'utf8'),index=fs.readFileSync(path.join(root,'index.html'),'utf8');
class Target{
 constructor(){this.events={};this.attrs={};this.hidden=false;this.disabled=false;this.textContent='';this.classList={values:new Set(),add(...xs){xs.forEach(x=>this.values.add(x))},remove(...xs){xs.forEach(x=>this.values.delete(x))},contains(x){return this.values.has(x)}};this.dataset={}}
 addEventListener(k,fn,options){(this.events[k]??=[]).push({fn,once:options?.once})}
 dispatchEvent(e){const listeners=[...(this.events[e.type]||[])];for(const item of listeners){if(item.once)this.events[e.type].splice(this.events[e.type].indexOf(item),1);item.fn(e)}return true}
 hasAttribute(k){return Object.hasOwn(this.attrs,k)}
 focus(){this.focused=true}
}
function setup({seen=false,raw=null,slowArt=false,slowCSS=false,reduced=false}={}){
 const win=new Target(),doc=new Target(),html=new Target(),nodes={};html.classList.add('beta-booting');doc.documentElement=html;doc.readyState='loading';
 for(const id of ['beta-launch-cover','launch-skip','launch-retry','launch-status','launch-art','beta-guild-name','player-name-label','heading'])nodes[id]=new Target();
 nodes['beta-launch-cover'].remove=()=>delete nodes['beta-launch-cover'];nodes['launch-skip'].disabled=true;nodes['launch-retry'].hidden=true;nodes['beta-guild-name'].textContent='Fixture guild';nodes['player-name-label'].textContent='Kael';
 const splash=nodes['launch-art'];splash.complete=!slowArt;splash.naturalWidth=slowArt?0:720;splash.decode=()=>Promise.resolve();
 const css=new Target();css.sheet=slowCSS?null:{};
 doc.getElementById=id=>nodes[id]||null;doc.querySelectorAll=s=>s.startsWith('link[')?[css]:[];
 doc.querySelector=s=>s==='#hall h2'?nodes.heading:s.startsWith('#')?nodes[s.slice(1)]||null:null;
 const storage=new Map(seen?[['wayfarers-lantern-beta-cover','seen']]:[]);if(raw!==null)storage.set('wayfarers_lantern_offline_v1',raw);
 const timers=new Map(),raf=[],images=[];let timerId=0;
 const ctx={console:{warn(){}},document:doc,Event:class{constructor(type){this.type=type}},matchMedia:()=>({matches:reduced}),localStorage:{getItem:k=>storage.get(k)??null,setItem(){throw Error('Boot must never write storage')},removeItem(){throw Error('Boot must never delete storage')}},setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>raf.push(fn),addEventListener:win.addEventListener.bind(win),dispatchEvent:win.dispatchEvent.bind(win),game:{day:3,player:{id:'player',name:'Kael'},heroes:[{id:'hero'}]},render(){},showView(view){ctx.view=view},imageSrc:()=>'',WL_BETA_PORTRAITS:{lookup:()=> 'art/portraits/chibi/fixture.webp'},WL_BETA_GEAR_CARE:{},WL_BETA_HARBOUR:{afterBoot(){ctx.handoffs++}},handoffs:0};
 ctx.window=ctx;ctx.Image=class extends Target{constructor(){super();this.complete=true;this.naturalWidth=128}set src(s){this.url=s;images.push(s)}decode(){return Promise.resolve()}};
 vm.createContext(ctx);vm.runInContext(critical,ctx);
 const emit=(type,fields={})=>win.dispatchEvent({type,...fields});
 const tick=async(n=12)=>{for(let i=0;i<n;i++){await Promise.resolve();const work=raf.splice(0);work.forEach(fn=>fn())}};
 const start=()=>{vm.runInContext(coordinator,ctx);doc.readyState='interactive';doc.dispatchEvent({type:'DOMContentLoaded'})};
 const advance=ms=>{for(const [id,timer]of [...timers])if(timer.ms===ms){timers.delete(id);timer.fn()}};
 return {ctx,doc,html,nodes,storage,css,splash,images,emit,tick,start,advance};
}
(async()=>{
 for(const seen of [false,true]){
  const h=setup({seen,raw:'{"heroes":[{"id":"retained"}],"gear":[],"day":9}'}),before=JSON.stringify([...h.storage]);
  assert(h.html.classList.contains('beta-booting'));assert(!h.ctx.WL_BETA_BOOT.skip());h.ctx.WL_BETA_BOOT.preflight();h.start();await h.tick();
  assert.equal(h.view,undefined);assert.equal(h.ctx.view,'hall');assert.equal(h.ctx.WL_BETA_BOOT.phase,'revealing');assert(h.nodes['beta-launch-cover']);assert(h.ctx.WL_BETA_BOOT.holding);assert.equal(h.ctx.handoffs,0);
  h.advance(300);assert.equal(h.ctx.WL_BETA_BOOT.phase,'done');assert(!h.nodes['beta-launch-cover']);assert(!h.html.classList.contains('beta-booting'));assert.equal(h.ctx.handoffs,1);assert.equal(JSON.stringify([...h.storage]),before);assert.equal(h.images.filter(src=>src.includes('/portraits/')).length,1);
 }
 console.log('PASS every cold load ignores seen flag, waits for rendered Hall, auto fades in 300ms, warms one portrait, hands off once and never writes storage');
 {
  const h=setup({slowArt:true});h.start();await h.tick();assert(h.ctx.WL_BETA_BOOT.minimumReady);assert(!h.nodes['launch-skip'].disabled);assert.equal(h.ctx.WL_BETA_BOOT.phase,'loading');assert(h.ctx.WL_BETA_BOOT.skip());h.advance(300);assert.equal(h.ctx.WL_BETA_BOOT.phase,'done');h.splash.complete=true;h.splash.naturalWidth=720;h.splash.dispatchEvent({type:'load'});await h.tick();assert.equal(h.ctx.handoffs,1);
 }
 {
  const h=setup({slowCSS:true});h.start();await h.tick();assert(!h.ctx.WL_BETA_BOOT.minimumReady);assert(h.nodes['launch-skip'].disabled);assert(!h.ctx.WL_BETA_BOOT.skip());h.css.sheet={};h.css.dispatchEvent({type:'load'});await h.tick();assert(h.ctx.WL_BETA_BOOT.minimumReady);
 }
 {
  const h=setup({reduced:true});h.start();await h.tick();assert.equal(h.ctx.WL_BETA_BOOT.phase,'done');assert(!h.nodes['beta-launch-cover']);
 }
 console.log('PASS Skip waits for minimum boot, bypasses pending art without duplicate handoff, required CSS gates readiness, reduced motion has no fade wait');
 for(const raw of ['{broken','null','{"heroes":{},"gear":[]}']){
  const h=setup({raw});assert.throws(()=>h.ctx.WL_BETA_BOOT.preflight());assert(h.ctx.WL_BETA_BOOT.failed);assert.equal(h.storage.get('wayfarers_lantern_offline_v1'),raw);assert(!h.nodes['launch-retry'].hidden);assert.match(h.nodes['launch-status'].textContent,/saved guild/);
 }
 {
  const h=setup({raw:'{broken'});h.ctx.SAVE_KEY='wayfarers_lantern_offline_v1';h.ctx.starter=()=>{throw Error('Fallback starter must not replace corrupt save')};vm.runInContext(index.match(/^function loadGame\(\).*$/m)[0],h.ctx);assert.throws(()=>h.ctx.loadGame());assert(h.ctx.WL_BETA_BOOT.failed);assert.equal(h.storage.get(h.ctx.SAVE_KEY),'{broken');
 }
 for(const failure of ['script','rejection','missing-init','save-guard','render']){
  const h=setup();if(failure==='script')h.emit('error',{target:{tagName:'SCRIPT'}});else if(failure==='rejection')h.emit('unhandledrejection');else{if(failure==='missing-init')delete h.ctx.WL_BETA_GEAR_CARE;if(failure==='save-guard')h.ctx.__betaSaveGuard={error:'fixture'};if(failure==='render')h.nodes['player-name-label'].textContent='';h.start();await h.tick()}
  assert(h.ctx.WL_BETA_BOOT.failed,failure);assert(h.html.classList.contains('beta-booting'));assert(h.nodes['beta-launch-cover']);assert(!h.nodes['launch-retry'].hidden);assert(!h.ctx.WL_BETA_BOOT.skip());
 }
 {
  const h=setup();h.advance(20000);assert(!h.nodes['launch-retry'].hidden);assert(h.nodes['beta-launch-cover']);assert(!h.ctx.WL_BETA_BOOT.failed);assert.match(h.nodes['launch-status'].textContent,/Still preparing/);
 }
 console.log('PASS corrupt saves never fall back or reset; missing scripts, rejected startup, save guard and incomplete render retain cover with Retry; stalled load offers Retry without a fake timer');
 assert(index.indexOf('<section id="beta-launch-cover"')<index.indexOf('<div class="shell">'));
 assert(index.indexOf('launch-critical-style:start')<index.indexOf('href="../offline.css"'));
 assert(index.indexOf('<section id="beta-launch-cover"')<index.indexOf('/* BETA save guard:'));
 assert(index.includes('gear-care.js?v=1'));assert(!index.includes('data-harbour-cover-pending'));assert(index.includes('onclick="location.reload()"'));
 assert(!critical.includes('setItem(')&&!critical.includes('removeItem('));assert(!coordinator.includes('localStorage'));assert(!critical.includes('wayfarers-lantern-beta-cover'));
 console.log('PASS critical inline cover precedes Hall and save read, no startup dependency on cover-seen key, reload-only Retry and Gear care retained');
 for(const observed of [false,true]){
  const events={},props={},element={setAttribute(){},style:{setProperty(k,v){props[k]=v}}};let observer;
  const ctx={document:{querySelectorAll:()=>[element]},WL_BETA_BOOT:{active:true},addEventListener:(type,fn)=>events[type]=fn};ctx.window=ctx;
  if(observed)ctx.IntersectionObserver=class{constructor(fn){this.fn=fn;observer=this}observe(){}unobserve(){}};
  vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'lazy-art.js'),'utf8'),ctx);ctx.betaDeferArtwork(element,'url("img/locations/booty-bay.webp")');if(observer)observer.fn([{target:element,isIntersecting:true}]);assert.deepEqual(props,{});ctx.WL_BETA_BOOT.active=false;events['beta:boot-ready']();if(observer)observer.fn([{target:element,isIntersecting:true}]);assert.equal(props['background-image'],'url("img/thumbnails/booty-bay.webp")');
 }
 console.log('PASS card/location artwork waits for dismissal, then resumes visibility observation with a no-observer fallback');

})().catch(error=>{console.error(error);process.exitCode=1});
