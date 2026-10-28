/* Quartermaster-made utility supplies. Existing preparation and saves are retained. */
(function(){
 const esc=tbwEsc;
 const recipes=[
  {id:'trail',name:'Trail Field Kit',office:1,skill:0,gold:0,protection:.10,ingredients:{'Wool Cloth':2,'Light Leather':1}},
  {id:'reinforced',name:'Reinforced Field Kit',office:2,skill:3,gold:0,protection:.12,ingredients:{'Silk Cloth':2,'Medium Leather':1}},
  {id:'expedition',name:'Expedition Field Kit',office:3,skill:5,gold:0,protection:.15,ingredients:{'Arcane Thread':2,'Heavy Leather':1}},
  {id:'veteran',name:'Veteran Field Kit',office:4,skill:7,gold:0,protection:.18,ingredients:{Runecloth:2,'Thick Leather':1}},
  {id:'masterwork',name:'Masterwork Field Kit',office:5,skill:9,gold:0,protection:.20,ingredients:{Runecloth:3,'Rugged Leather':2,Kingsblood:1}}
 ];
 let selected='trail',target='player';
 function migrate(g){g.fieldKits=Array.isArray(g.fieldKits)?g.fieldKits:[];g.fieldKitBatches=g.fieldKitBatches||{};return g}
 const office=()=>v9Inst('staffOffice')[0];
 const used=()=>{const e=game.fieldKitBatches[office()?.uid];return e?.day===game.day?e.count:0};
 function reason(r){
  const i=office();if(!i)return 'Requires Staff Office';
  if(projectForBuilding(i.uid))return 'Finish the Staff Office construction/upgrade first.';
  if(!buildingOperational('staffOffice'))return 'Assign a quartermaster to the Staff Office.';
  if(i.level<r.office)return `Requires Staff Office Level ${r.office}.`;
  if(staffProfessionLevel(buildingStaff('staffOffice'))<r.skill)return `Requires Quartermastery Level ${r.skill}.`;
  if(used()>=i.level)return 'Daily kit batches exhausted. Rest until tomorrow.';
  const missing=Object.entries(r.ingredients).find(([key,n])=>(game.materials[key]||0)<n);
  return missing?`Needs ${missing[1]} ${missing[0]}.`:'';
 }
 const effect=r=>`${Math.round(r.protection*100)}% less ordinary wound chance for this hero's next expedition. Relative reduction; no readiness bonus. Mandatory natural-1 wounds, existing-wound worsening and direct death checks are unchanged.`;
 window.fieldKitRecipes=()=>recipes.map(r=>({...r,ingredients:{...r.ingredients},uses:3}));
 window.craftFieldKit=function(id){
  migrate(game);const r=recipes.find(r=>r.id===id);if(!r)return false;
  const blocked=reason(r);if(blocked){alert(blocked);return false}
  for(const [key,n] of Object.entries(r.ingredients))game.materials[key]-=n;
  game.fieldKitBatches[office().uid]={day:game.day,count:used()+1};
  game.fieldKitSequence=(Number(game.fieldKitSequence)||0)+1;
  game.fieldKits.push({id:'kit-'+game.fieldKitSequence,recipe:r.id,uses:3});
  practiceStaff('staffOffice');addLog('Field kits prepared',`${r.name}: 3 uses. ${effect(r)} Cost: ${r.gold} gp; ${Object.entries(r.ingredients).map(([key,n])=>n+' '+key).join(', ')}.`);
  render();save();return true;
 };
 function renderKits(){
  let root=document.getElementById('field-kits-panel');if(!root){root=document.createElement('article');root.id='field-kits-panel';root.className='card';document.getElementById('warehouse').appendChild(root)}
  const r=recipes.find(r=>r.id===selected)||recipes[0],i=office(),st=buildingStaff('staffOffice'),blocked=reason(r),heroes=[game.player,...game.heroes].filter(h=>h&&!h.dead);
  if(!heroes.some(h=>h.id===target))target=heroes[0]?.id||'';
  root.innerHTML=`<h3>Field kits · Staff Office</h3><p>${i?`Office Level ${i.level} · ${st?esc(st.name)+' · Quartermastery '+staffProfessionLevel(st):'Assign a quartermaster'} · ${used()}/${i.level} batches used today.`:'Build a Staff Office and assign a quartermaster.'}</p><p>Office level allows 1–5 batches per day; every batch makes 3 uses. Quartermastery unlocks better recipes. Equip one kit beside one ration and one potion. Only the strongest kit is used at departure; extra kits are backups.</p><label>Recipe<select id="field-kit-recipe">${recipes.map(x=>`<option value="${x.id}" ${x.id===r.id?'selected':''}>${esc(x.name)} · Office ${x.office} / Quartermastery ${x.skill}</option>`).join('')}</select></label><h4>${esc(r.name)} · 3 uses</h4><p>${esc(effect(r))}</p><p>Requires Office ${r.office}, Quartermastery ${r.skill} · materials only; no gold charge.</p><div>${Object.entries(r.ingredients).map(([key,n])=>`<p>${esc(key)}: ${n} required · ${game.materials[key]||0} stored. Source: ${/Leather/.test(key)?'Skinning and rank-appropriate combat caches':key==='Kingsblood'?'Herbalism and combat caches':'Tailoring and rank-appropriate combat caches'}.</p>`).join('')}</div><button class="btn secondary" id="field-kit-craft" ${blocked?'disabled':''}>${blocked?esc(blocked):'Prepare '+esc(r.name)}</button>${blocked?`<p class="muted">${esc(blocked)}</p>`:''}<details><summary>All field kit recipes</summary>${recipes.map(x=>`<p><strong>${esc(x.name)}</strong> · Office ${x.office}, Quartermastery ${x.skill} · ${Math.round(x.protection*100)}% protection · 3 uses for ${x.gold} gp + ${Object.entries(x.ingredients).map(([key,n])=>n+' '+esc(key)).join(' + ')}.</p>`).join('')}</details><h4>Stored field kits</h4><label>Recipient<select id="field-kit-hero">${heroes.map(h=>`<option value="${esc(h.id)}" ${h.id===target?'selected':''}>${esc(h.name)}${h.ready&&!hasActiveQuestFor(h.id)?'':' · away/unavailable'}</option>`).join('')}</select></label>${game.fieldKits.map((item,index)=>{const rec=recipes.find(x=>x.id===item.recipe);return rec?`<section class="field-kit-stock"><strong>${esc(rec.name)} · ${item.uses} uses</strong><p>${esc(effect(rec))}</p><button class="btn secondary" data-equip-kit="${index}" ${purse(target)?.ready&&!hasActiveQuestFor(target)?'':'disabled'}>Equip for ${esc(purse(target)?.name||'selected hero')}</button></section>`:''}).join('')||'<p>No field kits stored.</p>'}<p class="muted">Kits do not stack with other kits. A 20% ordinary wound chance becomes 16% with a Masterwork kit. Recovery potions still treat wounds from guild storage.</p>`;
  root.querySelector('#field-kit-recipe').onchange=e=>{selected=e.target.value;renderKits()};root.querySelector('#field-kit-craft').onclick=()=>craftFieldKit(r.id);
  root.querySelector('#field-kit-hero').onchange=e=>{target=e.target.value;renderKits()};root.querySelectorAll('[data-equip-kit]').forEach(button=>button.onclick=()=>equipFieldKit(target,game.fieldKits[Number(button.dataset.equipKit)]?.id));
 }
 const oldRender=render;render=function(){migrate(game);return oldRender.apply(this,arguments)};
 const oldWarehouse=renderWarehouse;renderWarehouse=function(){const out=oldWarehouse.apply(this,arguments);renderKits();return out};
 const oldLoad=loadGame;loadGame=function(){return migrate(oldLoad.apply(this,arguments))};
 const oldSave=save;save=function(){migrate(game);return oldSave.apply(this,arguments)};
 const style=document.createElement('style');style.textContent='#field-kits-panel{margin-top:24px;line-height:1.8;overflow-wrap:anywhere}#field-kits-panel p{margin:16px 0}#field-kits-panel h4,#field-kits-panel details{margin:24px 0 14px}#field-kits-panel label{display:block;margin:20px 0}#field-kits-panel select{display:block;width:100%;margin-top:10px;padding:10px;font-size:16px}#field-kits-panel button{max-width:100%;white-space:normal}.field-kit-stock{margin-top:20px;padding:20px 0;border-top:1px solid var(--line)}';document.head.appendChild(style);
 migrate(game);
})();
