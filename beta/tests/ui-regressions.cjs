const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const beta=path.resolve(__dirname,'..'),noop=()=>{},elements=new Map();
for(const id of ['test-complete-quests','test-quest-status','latest-title','latest-text'])elements.set(id,{hidden:true,disabled:false,textContent:''});
const context={console,URL,URLSearchParams,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:id=>elements.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({className:'',setAttribute:noop}),head:{append:noop},body:{append:noop},addEventListener:noop},MutationObserver:class{observe(){}},addEventListener:noop,renderHeroes:noop,v9PickHead:noop,renderReports:noop,render:noop,save:()=>context.saves++,saves:0,addLog:noop,game:{gold:100,day:3,heroes:[],todayReports:[],pendingReports:[{kind:'operation',dueAt:Date.now()+60000,summary:'Returned safely'}]},location:{search:''}};
context.window=context;context.applyPendingReports=()=>context.game.pendingReports.splice(0);vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(beta,'../testing-controls.js'),'utf8'),context);
const finish=context.testCompleteAllQuests;
vm.runInContext(fs.readFileSync(path.join(beta,'atmosphere.js'),'utf8'),context);
assert.equal(elements.get('test-complete-quests').hidden,false);assert.equal(elements.get('test-quest-status').hidden,false);assert.equal(context.testCompleteAllQuests,finish);
assert.equal(context.testCompleteAllQuests().length,1);assert.equal(context.game.pendingReports.length,0);assert.equal(context.game.day,3);assert.equal(context.saves,1);assert.match(elements.get('test-quest-status').textContent,/1 reports returned/);assert.equal(elements.get('test-complete-quests').disabled,true);
console.log('PASS quest completion visible and functional without debug, outcomes saved without advancing the day');
for(const relative of ['preview.html',...Array.from({length:5},(_,i)=>`batch-00${i+1}/preview.html`)]){
 const file=path.join(beta,'art/portraits/chibi',relative),html=fs.readFileSync(file,'utf8'),href=html.match(/class="gallery-back" href="([^"]+)"/)[1];
 assert.equal(path.resolve(path.dirname(file),href),path.join(beta,'index.html'));
 const back={},history={length:2,back:()=>history.calls++,calls:0};
 const ctx={URL,document:{referrer:'https://example.com/wayfarers-lantern/beta/',querySelector:()=>back,querySelectorAll:()=>[]},location:{origin:'https://example.com'},history};vm.createContext(ctx);vm.runInContext(html.match(/<script>(.*?)<\/script>/s)[1],ctx);
 let prevented=false;back.onclick({preventDefault:()=>prevented=true});assert.equal(history.calls,1);assert(prevented);
 ctx.document.referrer='';prevented=false;back.onclick({preventDefault:()=>prevented=true});assert.equal(history.calls,1);assert(!prevented);
}
console.log('PASS all six galleries return to the game, with safe direct-open fallback');
const framing=JSON.parse(fs.readFileSync(path.join(beta,'art/portraits/chibi/framing.json'),'utf8'));
assert.equal(Object.keys(framing).length,498);
for(const [id,f]of Object.entries(framing)){
 const [x,y,scale]=f.css;assert(f.confidence>=.45,id);
 assert(Math.abs((f.centre[0]-64)*scale+64+x/100*128-64)<.02,id+' x');
 assert(Math.abs((f.centre[1]-64)*scale+64+y/100*128-64)<.02,id+' y');
 assert(Math.abs((f.radius-2)*scale-64)<.01,id+' radius');
}
console.log('PASS all 498 portrait centres and inner rims align with their shared circular frame');
class Element{
 constructor(tag,classes='',size=48){this.tag=tag;this.className=classes;this.size=size;this.children=[];this.parentElement=null;this.hidden=false;this.dataset={};this.attrs={};this.style={values:{},setProperty(k,v){this.values[k]=v}};this.classList={contains:c=>this.className.split(' ').includes(c),add:c=>{if(!this.classList.contains(c))this.className+=' '+c}}}
 append(child){if(child.parentElement)child.parentElement.children.splice(child.parentElement.children.indexOf(child),1);this.children.push(child);child.parentElement=this}
 before(child){const parent=this.parentElement;parent.children.splice(parent.children.indexOf(this),0,child);child.parentElement=parent}
 closest(selector){for(let e=this;e;e=e.parentElement)if(selector.split(',').some(c=>e.classList.contains(c.trim().slice(1))))return e;return null}
 getAttribute(k){return this.attrs[k]||null}
}
const row=new Element('div'),frame=new Element('span','pv-photo-frame',36),header=new Element('img','v9-rpic',32),pip=new Element('span','pv-wound-icon');row.append(frame);frame.append(header);frame.append(pip);
const card=new Element('div'),portrait=new Element('img','portrait',48);card.append(portrait);
for(const image of [header,portrait])image.attrs.src='art/portraits/chibi/batch-001/portraits/020-dwarf-death-knight-female.webp';
const source=fs.readFileSync(path.join(beta,'hero-portraits.js'),'utf8'),start=source.indexOf(' function fitPortraits()'),end=source.indexOf('\n function bubble(',start);
const fitContext={framing:Object.fromEntries(Object.entries(framing).map(([id,f])=>[id,f.css])),document:{querySelectorAll:()=>[header,portrait],createElement:tag=>new Element(tag)},getComputedStyle:el=>({width:el.size+'px'})};vm.createContext(fitContext);vm.runInContext(source.slice(start,end),fitContext);fitContext.fitPortraits();fitContext.fitPortraits();
assert.equal(header.parentElement.className,'beta-portrait-clip');assert.equal(header.parentElement.parentElement,frame);assert.equal(frame.children.length,2);assert.equal(pip.parentElement,frame);
const newFrame=portrait.closest('.beta-portrait-frame');assert(newFrame);assert.equal(newFrame.parentElement,card);assert.equal(newFrame.style.values['--beta-portrait-size'],'48px');assert.equal(newFrame.children.length,1);
portrait.attrs.src='data:image/jpeg;base64,custom';fitContext.fitPortraits();assert.equal(newFrame.style.values['--beta-portrait-scale'],1);assert.equal(newFrame.style.values['--beta-portrait-x'],'0%');
portrait.hidden=true;fitContext.fitPortraits();assert.equal(newFrame.hidden,true);portrait.hidden=false;fitContext.fitPortraits();assert.equal(newFrame.hidden,false);
console.log('PASS existing/new portrait frames, stable repeat renders, unclipped wound indicators, custom images and hidden-state updates');
