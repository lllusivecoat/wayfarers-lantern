/* Beta presentation for existing repair/enhancement actions. No price or Armory overrides. */
(() => {
 'use strict';
 const host=typeof window==='undefined'?globalThis:window;
 const originalRepair=repairGear,originalEnhance=enhanceGear;
 function hero(id){return purse(id)}
 function equipped(id){const h=hero(id);if(!h)return [];const ids=new Set(Object.values(h.equipment||{}).filter(Boolean));if(!h.equipment&&h.gear)ids.add(h.gear);return (game.gear||[]).filter(g=>ids.has(g.id)&&g.owner===id)}
 function items(id,scope,kind){if(scope==='equipped')return equipped(id);return (game.gear||[]).filter(g=>(kind==='enhance'?(g.heroOwner||g.owner):g.owner)===id)}
 const damaged=g=>Number(g.maxDurability)>0&&Number(g.durability)<Number(g.maxDurability);
 function repairQuote(id,heroId){const g=(game.gear||[]).find(g=>g.id===id),h=hero(heroId);let reason='',gold=0;
  if(!g||!h)reason='This hero or item is no longer available.';else if(g.owner!==heroId)reason='Equip this item to this hero before repairing.';else if(!damaged(g))reason='All gear repaired';else{gold=gearRepairCost(g);if(!Number.isFinite(gold)||gold<=0)reason='This item cannot currently be repaired.';else if((h.gold||0)<gold)reason='Needs '+(gold-(h.gold||0))+' gp more; purse '+(h.gold||0)+' gp.'}
  return {gold,reason};
 }
 function enhancementQuote(id,heroId){const q=gearEnhancementQuote(id);return {...q,reason:q.payerId&&q.payerId!==heroId?'This item is paid for by another hero.':q.reason}}
 function candidates(kind,id,scope){const list=items(id,scope,kind);return kind==='repair'?list.filter(damaged):list.filter(g=>g.madeByPlayer&&!g.gatherTool&&Number(g.enhancement||0)<4)}
 function quotePlan(kind,heroId,scope='equipped',onlyId=null){
  const h=hero(heroId),list=candidates(kind,heroId,scope).filter(g=>!onlyId||g.id===onlyId),out={kind,heroId,scope,ids:list.map(g=>g.id),steps:[],gold:0,materials:{},reason:''};
  if(!h){out.reason='Choose a hero to pay from their personal purse.';return out}if(!list.length){out.reason=kind==='repair'?'All gear repaired':'No next enhancement stages available.';return out}
  const liveGame=game,functions={render,save,addLog,alert:host.alert,random:Math.random};
  // Execute the unchanged actions in an isolated save copy. This preserves fractional
  // material credits and staff-practice discount changes across a whole hero's batch.
  // Preview rendering, saving, logging and alerts are suppressed, then restored.
  try{
   game=typeof structuredClone==='function'?structuredClone(liveGame):JSON.parse(JSON.stringify(liveGame));render=()=>{};save=()=>{};addLog=()=>{};Math.random=()=>.5;let alertMessage='';host.alert=text=>{alertMessage=String(text)};
   hero(heroId).gold=1e12;
   for(const id of out.ids){
    const g=game.gear.find(g=>g.id===id);let gold=0,materials={},reason='';
    if(kind==='repair'){gold=gearRepairCost(g);if(!Number.isFinite(gold)||gold<=0)reason='This item cannot currently be repaired.'}
    else{let q=enhancementQuote(id,heroId);for(const key of Object.keys(q.materials||{}))game.materials[key]=Math.max(Number(game.materials[key])||0,1e12);q=enhancementQuote(id,heroId);gold=q.gold;materials=q.materials||{};reason=q.reason||'';if(q.payerId!==heroId)reason='This item is paid for by another hero.'}
    out.steps.push({id,gold,materials:{...materials},reason});out.gold+=gold;for(const [key,n] of Object.entries(materials))out.materials[key]=(out.materials[key]||0)+n;
    if(reason){out.reason=out.reason||reason;continue}
    alertMessage='';const before=kind==='repair'?g.durability:Number(g.enhancement)||0;
    if(kind==='repair')originalRepair(id);else originalEnhance(id);
    const applied=kind==='repair'?g.durability===g.maxDurability&&g.durability!==before:Number(g.enhancement)===before+1;
    if(!applied||alertMessage)out.reason=out.reason||alertMessage||'This action is currently unavailable.';
   }
  }catch(error){out.reason='Unable to quote this batch. Try refreshing the view.';console.warn('beta-gear-quote',error)}
  finally{game=liveGame;render=functions.render;save=functions.save;addLog=functions.addLog;host.alert=functions.alert;Math.random=functions.random}
  if(!out.reason&&(h.gold||0)<out.gold)out.reason='Needs '+out.gold+' gp; '+h.name+' has '+(h.gold||0)+' gp in their personal purse.';
  const missing=Object.entries(out.materials).filter(([key,n])=>(game.materials[key]||0)<n);if(!out.reason&&missing.length)out.reason='Not enough materials: '+missing.map(([key,n])=>key+' '+(game.materials[key]||0)+'/'+n).join(', ')+'.';
  return out;
 }
 let busy=false;
 function perform(kind,heroId,scope='equipped',onlyId=null){
  if(busy)return {ok:false,completed:0,reason:'An action is already in progress.'};
  const plan=quotePlan(kind,heroId,scope,onlyId);if(plan.reason)return {ok:false,completed:0,...plan};
  busy=true;let completed=0,reason='',spent=0;const alertBefore=host.alert,renderBefore=render;
  try{render=()=>{};host.alert=text=>{reason=String(text)};
   for(const id of plan.ids){
    if(!items(heroId,scope,kind).some(g=>g.id===id)){reason='The equipped items changed. Review this hero’s gear again.';break}
    const q=kind==='repair'?repairQuote(id,heroId):enhancementQuote(id,heroId);if(q.reason){reason=q.reason;break}
    const item=game.gear.find(g=>g.id===id),before=kind==='repair'?item.durability:Number(item.enhancement)||0;
    if(kind==='repair')originalRepair(id);else originalEnhance(id);
    const applied=kind==='repair'?item.durability===item.maxDurability&&item.durability!==before:Number(item.enhancement)===before+1;
    if(!applied){reason=reason||'The action could not be completed.';break}completed++;spent+=q.gold;
   }
  }finally{host.alert=alertBefore;render=renderBefore;busy=false;if(completed)render()}
  return {ok:completed===plan.ids.length,completed,gold:spent,reason,total:plan.ids.length};
 }
 const api={equipped,items,damaged,repairQuote,enhancementQuote,candidates,quotePlan,perform};host.WL_BETA_GEAR_CARE=Object.freeze(api);
 if(typeof document==='undefined')return;
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 const state={damagedOnly:true,repairHero:null,enhanceHero:null,repairOpen:new Set(),enhanceOpen:new Set(),feedback:new Map(),heroOpen:new Set()};
 const money=n=>Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2});let serial=0;
 function make(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node}
 function btn(text,fn,reason='',cls='btn secondary'){const b=make('button',cls,text);b.type='button';b.disabled=busy||!!reason;b.onclick=fn;if(reason)b.title=reason;return b}
 function note(text,cls='gearcare-note'){return make('p',cls,text)}
 function reasonFor(button,text){if(!text)return null;const p=note(text,'gearcare-reason');p.id='gearcare-reason-'+(++serial);button.setAttribute('aria-describedby',p.id);return p}
 function status(kind,id){const node=note('','gearcare-feedback');node.setAttribute('role','status');node.setAttribute('aria-live','polite');node.tabIndex=-1;node.dataset.gearStatus=kind+'|'+id;const text=state.feedback.get(kind+'|'+id);if(text)requestAnimationFrame(()=>{node.textContent=text});return node}
 function act(kind,id,scope,onlyId=null){const result=perform(kind,id,scope,onlyId),verb=kind==='repair'?'Repaired':'Enhanced';let text=result.completed?verb+' '+result.completed+' '+(result.completed===1?'item':'items')+' for '+money(result.gold)+' gp from '+(hero(id)?.name||'this hero')+'’s purse.':'';if(result.reason)text+=(text?' ':'')+result.reason;state.feedback.set(kind+'|'+id,text);refresh();const target=$$('#hero-stats-modal.open .gearcare-feedback,.view.active .gearcare-feedback').find(node=>node.dataset.gearStatus===kind+'|'+id);target?.focus({preventScroll:true})}
 function fold(label,cls=''){const box=make('details','gearcare-fold '+cls);box.append(make('summary','',label));return box}
 function materialsList(q,label='Required materials'){
  const entries=Object.entries(q.materials||{});if(!entries.length)return null;
  const box=fold(label,'gearcare-materials'),list=make('dl','gearcare-material-list');
  for(const [key,needed] of entries){const owned=Number(game.materials[key])||0,row=make('div','gearcare-material-row');row.append(make('dt','',key),make('dd','',money(owned)+' owned / '+money(needed)+' needed'));if(owned<needed)row.classList.add('gearcare-material-short');list.append(row)}
  box.append(list);return box;
 }
 function effectsPanel(g){
  if(!host.WL_GEAR_EFFECTS)return null;
  const stage=Number(g.enhancement)||0,current=WL_GEAR_EFFECTS.description(g),next=stage<4?WL_GEAR_EFFECTS.description({...g,enhancement:stage+1}):null;
  const split=text=>String(text).split(/ Enhancement stage \d+\/4\.\s*/);
  const [effect,set]=split(current),box=fold('Effects & set bonuses','gearcare-effects');
  box.append(make('h4','','Current effect · stage '+stage),note(effect));
  if(next)box.append(make('h4','','Next effect · stage '+(stage+1)),note(split(next)[0]));
  else box.append(note('All four effect stages complete.'));
  if(set)box.append(make('h4','','Set bonus · unchanged by enhancement'),note(set));
  return box;
 }
 function itemRow(kind,g,h,scope){
  const row=make('article','gearcare-item');row.dataset.gearId=g.id;const copy=make('div','gearcare-item-copy');copy.append(make('strong','',g.name));
  if(kind==='repair'){
   const progress=make('progress','gearcare-durability');progress.max=Math.max(1,Number(g.maxDurability)||1);progress.value=Math.max(0,Number(g.durability)||0);progress.setAttribute('aria-label',g.name+' durability '+(g.durability||0)+' of '+(g.maxDurability||0));copy.append(progress,note((g.durability||0)+' / '+(g.maxDurability||0)+' durability'));
   if(Number(g.durability)<=0)copy.append(make('span','gearcare-broken','Broken'));
  }else{copy.append(note('Effect stage '+(g.enhancement||0)+' / 4'));const effects=effectsPanel(g);if(effects)copy.append(effects)}
  row.append(copy);let q;
  if(!h){q=kind==='enhance'?enhancementQuote(g.id,null):{gold:0};q.reason=kind==='repair'?'Equip to repair':'Equip to enhance';}else q=kind==='repair'?repairQuote(g.id,h.id):enhancementQuote(g.id,h.id);
  if(kind==='repair'&&!damaged(g)){row.append(note('All gear repaired'));return row}
  if(kind==='enhance'&&Number(g.enhancement||0)>=4){row.append(note('All four stages complete'));return row}
  const actions=make('div','gearcare-item-actions'),label=(kind==='repair'?'Repair':'Enhance')+' · '+money(q.gold)+' gp'+(h?' (purse '+money(h.gold)+' gp)':'');const action=btn(label,()=>act(kind,h.id,scope,g.id),q.reason);if(kind==='repair')action.classList.add('gearcare-primary');action.dataset.gearAction=kind;action.dataset.gearId=g.id;actions.append(action);const why=reasonFor(action,q.reason);if(why)actions.append(why);if(kind==='enhance'){const materials=materialsList(q);if(materials)copy.append(materials)}row.append(actions);return row;
 }
 function bulk(kind,h,scope,plan){
  const box=make('div','gearcare-bulk');if(kind==='repair'&&plan.ids.length<2)return box;
  const label=(kind==='repair'?'Repair all':'Enhance all')+' · '+money(plan.gold)+' gp',action=btn(label,()=>act(kind,h.id,scope),plan.reason);
  action.dataset.gearBulk=kind;action.setAttribute('aria-label',label+' for '+h.name+' only');box.append(action);
  const why=reasonFor(action,plan.reason);if(why){why.className='gearcare-bulk-reason';why.hidden=true;box.append(why)}
  if(kind==='enhance'){const materials=materialsList(plan,'Total required materials');if(materials)box.append(materials)}
  return box;
 }
 function reveal(node){for(let p=node;p;p=p.parentElement){if(p.tagName==='DETAILS')p.open=true;if(p.classList.contains('m-collapsed'))$(':scope>.m-collapse-toggle',p)?.click()}}
 function focusBatch(kind,id){if(typeof closeHeroStats==='function')closeHeroStats();if(kind==='repair'){state.repairHero=id;state.damagedOnly=true;state.repairOpen.add(id);showView('warehouse')}else{state.enhanceHero=id;state.enhanceOpen.add(id);showView('crafting')}refresh();requestAnimationFrame(()=>{const root=$(kind==='repair'?'#warehouse-gear':'#gear-enhancement');const group=root&&$$('[data-gear-hero]',root).find(node=>node.dataset.gearHero===String(id));const target=group||root;if(!target)return;reveal(target);target.tabIndex=-1;target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});target.focus({preventScroll:true})})}
 function heroBlock(h,kind){
  const list=kind==='repair'?equipped(h.id).filter(damaged):equipped(h.id).filter(g=>g.madeByPlayer&&!g.gatherTool);
  const active=kind==='repair'?list:list.filter(g=>Number(g.enhancement||0)<4),key=h.id+'|'+kind;
  const block=make('section','gearcare-hero-block');block.dataset.gearKind=kind;
  const link=btn(kind==='repair'?'Open batch repairs':'Open batch workshop',()=>focusBatch(kind,h.id),'','btn ghost gearcare-link');
  if(!active.length){block.classList.add('gearcare-complete');block.append(note(kind==='repair'?'All gear repaired':list.length?'All equipped enhancements complete':'No crafted equipment equipped.'),link,status(kind,h.id));return block}
  const head=make('div','gearcare-section-head gearcare-aligned-head'),content=make('div','gearcare-hero-items');
  content.id='gearcare-items-'+kind+'-'+h.id;content.hidden=!state.heroOpen.has(key);
  const toggle=btn('',()=>{content.hidden=!content.hidden;if(content.hidden)state.heroOpen.delete(key);else state.heroOpen.add(key);sync()},'','gearcare-hero-toggle');
  toggle.setAttribute('aria-controls',content.id);
  const title=make('span','',kind==='repair'?'Needs repair':'Enhancements'),count=make('small','',list.length+' '+(list.length===1?'item':'items'));
  toggle.append(title,count);
  function sync(){toggle.setAttribute('aria-expanded',String(!content.hidden));block.classList.toggle('gearcare-expanded',!content.hidden)}sync();
  head.append(toggle,link);block.append(head,content);
  let populated=false;
  function populate(){if(populated)return;populated=true;for(const g of list)content.append(itemRow(kind,g,h,'equipped'));content.append(bulk(kind,h,'equipped',quotePlan(kind,h.id)),status(kind,h.id))}
  const click=toggle.onclick;toggle.onclick=()=>{click();if(!content.hidden)populate()};if(!content.hidden)populate();return block;
 }
 function collapseHelp(right){
  for(const p of $$('p',right)){
   if(p.closest('details,.gearcare-hero')||p.textContent.length<100)continue;
   const text=p.textContent.trim(),utility=/^(Utility supplies|Field kit protection)/i.test(text),workshop=/^Workshop enhancements/i.test(text);
   const details=fold(utility?'Utility supplies':workshop?'Workshop enhancements':'Equipment rules','gear-info-collapse '+(utility?'gearcare-utility-help':'gearcare-equipment-help'));
   p.before(details);details.append(p);
  }
 }
 const equipment=renderHeroEquipment;renderHeroEquipment=function(){const template=make('template');template.innerHTML=equipment.apply(this,arguments);collapseHelp(template.content);return template.innerHTML};
 function heroPanel(){const h=typeof viewingHeroId==='undefined'?null:hero(viewingHeroId),right=$('#hero-stats-content .hero-stats-right');if(!h||h.dead||!right)return;let panel=$(':scope>.gearcare-hero',right);if(panel)panel.remove();panel=make('div','gearcare-hero');panel.append(heroBlock(h,'repair'),heroBlock(h,'enhance'));right.prepend(panel);collapseHelp(right)}
 function groups(kind){const map=new Map();for(const g of game.gear||[]){if(kind==='enhance'&&(!g.madeByPlayer||g.gatherTool))continue;const id=(kind==='repair'?g.owner:(g.heroOwner||g.owner))||'storage';if(!map.has(id))map.set(id,[]);map.get(id).push(g)}return [...map].sort(([a],[b])=>a==='player'?-1:b==='player'?1:(hero(a)?.name||'Guild storage').localeCompare(hero(b)?.name||'Guild storage'))}
 function batch(kind){const root=$(kind==='repair'?'#warehouse-gear':'#gear-enhancement');if(!root||!root.closest('.view')?.classList.contains('active'))return;const filter=kind==='repair'?state.repairHero:state.enhanceHero,open=kind==='repair'?state.repairOpen:state.enhanceOpen;const all=groups(kind),plans=new Map();for(const [id,list] of all)if(hero(id))plans.set(id,quotePlan(kind,id,'owned'));
  const box=make('div','gearcare-batch');box.dataset.gearBatch=kind;
  if(kind==='enhance')box.append(make('h3','','Enhance equipment'));
  box.append(note('Gold is paid by the owning hero. '+(kind==='repair'?'Each Repair all affects one hero only.':'Materials come from guild storage. One next stage per item.')));
  if(kind==='repair'){const visible=all.filter(([id])=>filter===null||filter===id),owners=visible.filter(([id,list])=>hero(id)&&list.some(damaged));box.append(note(owners.length+' '+(owners.length===1?'hero':'heroes')+' · '+visible.reduce((n,[id,list])=>n+list.filter(damaged).length,0)+' damaged · '+money(owners.reduce((n,[id])=>n+(plans.get(id)?.gold||0),0))+' gp','gearcare-total'));const label=make('label','gearcare-filter'),input=make('input');input.type='checkbox';input.checked=state.damagedOnly;input.onchange=()=>{state.damagedOnly=input.checked;batch('repair')};label.append(input,document.createTextNode('Damaged only'));box.append(label)}
  const chips=make('div','gearcare-chips');chips.setAttribute('aria-label',kind==='repair'?'Repair groups':'Workshop groups');const choose=id=>{const next=filter===id?null:id;if(kind==='repair')state.repairHero=next;else state.enhanceHero=next;batch(kind)};
  for(const [id,list] of all){const damage=list.filter(damaged).length;if(kind==='repair'&&state.damagedOnly&&!damage&&filter!==id)continue;const h=hero(id),plan=plans.get(id);const text=(h?.name||'Guild storage')+' · '+(kind==='repair'?damage+' damaged':list.length+' items')+(plan?' · '+money(plan.gold)+' gp':'');const chip=btn(text,()=>choose(id),'','btn ghost');chip.setAttribute('aria-pressed',String(filter===id));chip.dataset.gearChip=id;chips.append(chip)}box.append(chips);
  let shown=0;
  for(const [id,list] of all){if(filter!==null&&filter!==id)continue;const h=hero(id),display=kind==='repair'&&state.damagedOnly?list.filter(damaged):list;if(!display.length&&filter!==id)continue;shown++;const section=make('section','gearcare-group');section.dataset.gearHero=id;const head=make('div','gearcare-group-head');head.append(make('h3','',h?.name||'Guild storage'));if(h)head.append(note('Purse '+money(h.gold)+' gp'));section.append(head);
   const plan=plans.get(id);if(h&&plan?.ids.length)section.append(bulk(kind,h,'owned',plan));
   if(display.length){const detail=make('details','gearcare-items'),summary=make('summary','',display.length+' '+(kind==='repair'&&state.damagedOnly?'damaged ':'')+(display.length===1?'item':'items'));detail.append(summary);detail.open=open.has(id);detail.ontoggle=()=>{if(detail.open)open.add(id);else open.delete(id)};for(const item of display)detail.append(itemRow(kind,item,h,'owned'));section.append(detail)}else section.append(note(kind==='repair'?'All gear repaired':'No equipment in this group.'));
   section.append(status(kind,id));box.append(section);
  }
  if(!shown){box.append(note(kind==='repair'?'No damaged gear. Clear “Damaged only” to review all equipment.':'Craft equipment to begin enhancing it.'));if(kind==='enhance')box.append(btn('Craft at Workshop →',()=>{showView('crafting');document.querySelector('#gear-crafting')?.scrollIntoView({block:'start'})},'','btn'));}
  if(kind==='enhance'){const help=make('details','gear-info-collapse'),summary=make('summary','','Workshop enhancement rules');help.append(summary,note('Workshop 2 unlocks the first effect. Workshop 3 strengthens it; 4 adds a second effect; 5 strengthens the second effect.'),note('Each stage uses guild materials. The owning hero pays the service fee from their personal purse.'),note('Enhancements improve special effects. Flat stats, durability, tier and set membership stay unchanged.'));box.append(help)}
  root.replaceChildren(box);
 }
 function refresh(){heroPanel();batch('repair');batch('enhance');if($('#hero-stats-modal.open'))host.betaUxRun?.()}
 const warehouse=renderWarehouse;renderWarehouse=function(){const out=warehouse.apply(this,arguments);batch('repair');batch('enhance');return out};
 const stats=renderHeroStats;renderHeroStats=function(){const out=stats.apply(this,arguments);heroPanel();return out};
 const open=openHeroStats;openHeroStats=function(){const out=open.apply(this,arguments);host.betaUxRun?.();return out};
 host.WL_BETA_GEAR_CARE=Object.freeze({...api,focusBatch,refresh,state});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();
