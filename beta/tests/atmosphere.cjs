const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const beta=path.resolve(__dirname,'..'),noop=()=>{};
function element(tag){return {tag,id:'',className:'',children:[],dataset:{},attrs:{},hidden:false,checked:false,textContent:'',append(...children){this.children.push(...children)},setAttribute(k,v){this.attrs[k]=v},querySelector(selector){return this.querySelectorAll(selector)[0]||null},querySelectorAll(selector){const out=[];const match=n=>selector[0]==='.'?n.className?.split(' ').includes(selector.slice(1)):selector[0]==='#'?n.id===selector.slice(1):n.tag===selector;const visit=n=>{for(const c of n.children||[]){if(match(c))out.push(c);visit(c)}};visit(this);return out}}}
function harness(preferences={},AudioContext){
 const prefs=new Map(Object.entries(preferences)),events={},menu=element('aside'),gallery=element('a'),galleries=[gallery],nodes=new Map();
 for(const id of ['test-complete-quests','test-quest-status','latest-title','latest-text']){const n=element('div');n.hidden=true;nodes.set(id,n)}
 const context={console,URL,URLSearchParams,location:{search:'?debug=1'},localStorage:{getItem:k=>prefs.get(k)??null,setItem:(k,v)=>prefs.set(k,v)},document:{hidden:false,getElementById:id=>nodes.get(id)||menu.querySelector('#'+id),querySelector:s=>s==='.beta-menu'?menu:null,querySelectorAll:s=>s==='.beta-portrait-gallery'?galleries:[],createElement:element,createTextNode:text=>({textContent:text}),head:element('head'),body:element('body'),addEventListener:(k,fn)=>events[k]=fn},MutationObserver:class{observe(){}},addEventListener:(k,fn)=>events[k]=fn,renderHeroes:noop,v9PickHead:noop,renderReports:noop,render:noop,save:()=>context.saves++,saves:0,addLog:noop,game:{gold:100,day:1,heroes:[],todayReports:[],pendingReports:[{kind:'operation',dueAt:Date.now()+60000,summary:'Returned safely'}]}};
 if(AudioContext)context.AudioContext=AudioContext;context.window=context;context.applyPendingReports=()=>context.game.pendingReports.splice(0);vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(beta,'../testing-controls.js'),'utf8'),context);vm.runInContext(fs.readFileSync(path.join(beta,'atmosphere.js'),'utf8'),context);
 return {context,prefs,events,menu,nodes,gallery,galleries,input:key=>menu.querySelectorAll('input').find(n=>n.dataset.betaPref===key)};
}
async function main(){
 const h=harness(),button=h.menu.querySelector('#beta-debug-toggle');assert(button);assert.equal(button.attrs['aria-pressed'],'false');
 assert.equal(h.nodes.get('test-complete-quests').hidden,true);assert.equal(h.nodes.get('test-quest-status').hidden,true);assert.equal(h.gallery.hidden,true);assert.equal(h.context.testCompleteAllQuests().length,0);assert.equal(h.context.saves,0);assert.equal(h.context.game.pendingReports.length,1);
 // The URL alone cannot turn on tools: the settings button controls the preference.
 assert.equal(h.context.betaDebugEnabled(),false);button.onclick();assert.equal(button.attrs['aria-pressed'],'true');assert.equal(h.prefs.get('wayfarers-lantern-beta-debug'),'1');assert.equal(h.gallery.hidden,false);assert.equal(h.nodes.get('test-complete-quests').hidden,false);
 const late=element('a');h.galleries.push(late);h.context.betaApplyDebugMode();assert.equal(late.hidden,false);
 assert.equal(h.context.testCompleteAllQuests().length,1);assert.equal(h.context.game.day,1);assert.equal(h.context.saves,1);assert.equal(h.nodes.get('test-complete-quests').disabled,true);
 button.onclick();assert.equal(h.gallery.hidden,true);assert.equal(late.hidden,true);assert.equal(h.nodes.get('test-complete-quests').hidden,true);assert.equal(h.nodes.get('test-quest-status').hidden,true);assert.equal(h.prefs.get('wayfarers-lantern-beta-debug'),'0');
 h.events.pointerdown();h.events.pointerdown();h.events.keydown();assert.equal(h.menu.children.length,2);
 const saved=harness({'wayfarers-lantern-beta-debug':'1'});assert.equal(saved.context.betaDebugEnabled(),true);assert.equal(saved.gallery.hidden,false);assert.equal(saved.menu.querySelector('#beta-debug-toggle').attrs['aria-pressed'],'true');
 console.log('PASS Debug mode settings toggle, default-off and saved state, both hidden tools, late gallery links, guarded quest completion and stable settings');
 const instances=[];const parameter=()=>({value:0,setValueAtTime:noop,linearRampToValueAtTime:noop,exponentialRampToValueAtTime:noop});const node=()=>({connect:noop,disconnect:noop,start(){this.started=true},stop(){this.stopped=true}});
 class Audio{
  static blockNew=false;
  constructor(){this.sampleRate=8;this.currentTime=2;this.destination={};this.state='suspended';this.resumeCalls=0;this.blocked=Audio.blockNew;this.oscillators=[];instances.push(this)}
  createBuffer(ch,n){assert.equal(ch,1);assert.equal(n,32);return {getChannelData:()=>new Float32Array(n)}}
  createBufferSource(){return this.source=node()}
  createBiquadFilter(){return this.filter={...node(),frequency:parameter()}}
  createGain(){return {...node(),gain:parameter()}}
  createOscillator(){const n={...node(),frequency:parameter()};this.oscillators.push(n);return n}
  resume(){this.resumeCalls++;if(!this.blocked){this.state='running';this.onstatechange?.()}return Promise.resolve()}
  close(){this.state='closed';this.onstatechange?.();return Promise.resolve()}
 }
 const a=harness({},Audio);assert.equal(instances.length,0);assert.equal(a.input('harbour-sounds').checked,false);
 const initial=a.context.betaDawnCopy();a.context.game.day=2;assert.notEqual(a.context.betaDawnCopy(),initial);const dawn=a.input('dawn-variants');dawn.checked=false;dawn.onchange();assert.equal(a.context.betaDawnCopy(),initial);
 const sound=a.input('harbour-sounds');sound.checked=true;sound.onchange();await Promise.resolve();const first=instances[0];assert.equal(first.state,'running');assert(first.source.started);assert(first.source.loop);assert.equal(first.filter.type,'lowpass');assert.equal(first.filter.frequency.value,430);
 a.context.betaHarbourDawn();assert.equal(first.oscillators.length,2);assert.deepEqual(first.oscillators.map(n=>n.frequency.value),[660,880]);
 a.context.document.hidden=true;a.events.visibilitychange();assert.equal(first.state,'closed');
 Audio.blockNew=true;a.context.document.hidden=false;a.events.visibilitychange();await Promise.resolve();const second=instances[1];assert.equal(second.state,'suspended');assert.equal(second.resumeCalls,1);
 second.blocked=false;a.events.pointerdown();await Promise.resolve();assert.equal(second.state,'running');assert.equal(second.resumeCalls,2);assert.equal(instances.length,2);
 sound.checked=false;sound.onchange();assert.equal(second.state,'closed');a.context.betaHarbourDawn();assert.equal(second.oscillators.length,0);assert.equal(a.prefs.get('wayfarers-lantern-beta-harbour-sounds'),'0');
 assert([...a.prefs.keys()].every(k=>k.startsWith('wayfarers-lantern-beta-')));assert.equal(a.context.saves,0);
 const unsupported=harness();const toggle=unsupported.input('harbour-sounds');toggle.checked=true;toggle.onchange();const hint=unsupported.menu.querySelector('.beta-atmosphere-settings').children.find(n=>n.attrs?.role==='status');assert.match(hint.textContent,/does not support/);
 console.log('PASS changing dawn messages, opt-in sea loop, two dawn bells, tab-hide cleanup, tap-to-resume after suspension, unsupported-browser feedback and separate preferences');
}
main().catch(e=>{console.error(e);process.exitCode=1});
