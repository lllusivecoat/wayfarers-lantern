/* Alchemy inventory stays separate from food; old draughts remain usable. */
(function(){
 const esc=tbwEsc;
 const endgame={'Eternium Ore':100,'Rugged Leather':100,'Ancient Timber':100,Runecloth:100,'Arcane Crystal':50,Kingsblood:100,'Heritage Ore':20,'World Dungeon Relic':30,'Rare Raid Relic':30,'Campaign Spoils':30,'Boss Trophy':30,'Primal Meat':50,'Royal Salmon':50,'Eternal Wellspring Essence':20,'Darkmaster’s Essence':10,'Nether Prison Crystal':10};
 const recipes=[
  {id:'field',name:'Field Draught',lab:1,skill:0,gold:0,ingredients:{Peacebloom:2},uses:3,bonus:1},
  {id:'mending',name:'Mending Potion',lab:1,skill:1,gold:0,ingredients:{Peacebloom:4,'Fresh Fish':2},uses:1,heal:1,tier:1},
  {id:'tonic',name:'Expedition Tonic',lab:2,skill:3,gold:0,ingredients:{Kingsblood:3,'Flawless Gem':1},uses:1,bonus:2},
  {id:'restorative',name:'Restorative Potion',lab:3,skill:5,gold:0,ingredients:{Kingsblood:8,'Silverfin':3,'Dungeon Salvage':2},uses:1,heal:2,tier:2},
  {id:'panacea',name:'Panacea',lab:4,skill:7,gold:0,ingredients:{Kingsblood:15,'Arcane Crystal':3,'Rare Raid Relic':2,'Deepwater Fish':4},uses:1,heal:2,tier:3},
  ...abilityKeys.map(stat=>({id:'ascension-'+stat,name:'Ascension Elixir · '+abilityNames[stat],lab:5,skill:10,hall:7,gold:0,ingredients:{...endgame},uses:1,stat}))
 ];
 let selected='field',target='player';
 function migrate(g){g.alchemyPotions=Array.isArray(g.alchemyPotions)?g.alchemyPotions:[];g.alchemyBatches=g.alchemyBatches||{};g.alchemyRecoveryDays=g.alchemyRecoveryDays||{};return g}
 function lab(){return v9Inst('alchemyLab')[0]}
 function worker(){return buildingStaff('alchemyLab')}
 function effect(r){return r.stat?`Permanently +1 ${abilityNames[r.stat]} (raw stat, not readiness). One permanent stat point total per hero; retained through respecialisation.`:r.bonus?`+${r.bonus} next-expedition readiness · ${r.uses} uses. One potion per expedition; combines with one ration for up to +4 total readiness.`:`Wound recovery −${r.heal} day(s), up to ${WOUND_TIERS[r.tier].name}. Combined alchemy recovery limit: 2 days per hero/game day. No resurrection or scar removal.`}
 function quote(r){const e=WL_STAFF.service('alchemyLab');return {gold:0,ingredients:Object.fromEntries(Object.entries(r.ingredients).map(([k,n])=>[k,r.stat?n:Math.max(1,Math.ceil(n*(1-e.materialDiscount)))]))}}
 function used(){const entry=game.alchemyBatches[lab()?.uid];return entry?.day===game.day?entry.count:0}
 function reason(r){
  if(!lab())return 'Requires Alchemy Lab';
  if(projectForBuilding(lab().uid))return 'Finish the Lab construction/upgrade first.';
  if(!buildingOperational('alchemyLab'))return 'Assign an alchemist to the Lab.';
  if(lab().level<r.lab)return `Requires Lab Level ${r.lab}.`;
  if(staffProfessionLevel(worker())<r.skill)return `Requires Alchemy Level ${r.skill}.`;
  if((game.hall||1)<(r.hall||2))return `Requires Hall Level ${r.hall||2}.`;
  if(used()+(r.stat?5:1)>lab().level)return 'Daily Lab capacity exhausted. Rest until tomorrow.';
  const q=quote(r);
  const missing=Object.entries(q.ingredients).find(([k,n])=>(game.materials[k]||0)<n);return missing?`Needs ${missing[1]} ${missing[0]}.`:'';
 }
 window.alchemyRecipes=()=>recipes.map(r=>({...r,ingredients:{...r.ingredients}}));
 window.alchemyQuote=id=>{const r=recipes.find(r=>r.id===id);return r?quote(r):null};
 window.brewAlchemy=function(id){
  migrate(game);const r=recipes.find(r=>r.id===id);if(!r)return false;
  const blocked=reason(r);if(blocked){alert(blocked);return false}
  if(r.stat&&!confirm(`Brew ${r.name} using all listed endgame ingredients? It grants one permanent raw stat point. Each hero may use only one permanent-stat elixir in total.`))return false;
  // Recheck immediately before committing the full cost.
  if(reason(r))return false;const q=quote(r);
  for(const [key,n] of Object.entries(q.ingredients))game.materials[key]-=n;
  const count=used()+(r.stat?5:1);game.alchemyBatches[lab().uid]={day:game.day,count};
  game.alchemySequence=(Number(game.alchemySequence)||0)+1;
  game.alchemyPotions.push({id:'alchemy-'+game.alchemySequence,recipe:r.id,uses:r.uses});
  practiceStaff('alchemyLab');addLog('Potion brewed',`${r.name}: ${effect(r)} Cost: ${q.gold} gp; ${Object.entries(q.ingredients).map(([k,n])=>n+' '+k).join(', ')}.`);render();save();return true;
 };
 // The old recipe now follows the same lab, staffing, skill and daily checks.
 craftDraught=function(){return brewAlchemy('field')};
 function canUse(h,r){
  if(!h||h.dead||!h.ready||hasActiveQuestFor(h.id))return false;
  if(r.stat)return !Object.values(h.alchemyStatGains||{}).some(n=>Number(n)>0)&&Number.isFinite(Number(h.abilities?.[r.stat]));
  if(r.bonus)return true;
  const used=game.alchemyRecoveryDays[h.id];return !!h.wound&&h.wound.tier<=r.tier&&(used?.day!==game.day||used.amount<2);
 }
 window.useAlchemyPotion=function(heroId,itemId){
  migrate(game);const h=purse(heroId),item=game.alchemyPotions.find(x=>x.id===itemId),r=recipes.find(r=>r.id===item?.recipe);
  if(!item||item.uses<1||!r||!canUse(h,r)){alert('Choose a living, available hero who can benefit from this potion. No potion was consumed.');return false}
  if(r.stat&&!confirm(`Give ${h.name} permanent +1 ${abilityNames[r.stat]}? Current stat: ${h.abilities[r.stat]} → ${h.abilities[r.stat]+1}. This hero can never use another permanent-stat elixir.`))return false;
  if(!canUse(h,r)||item.uses<1)return false;
  if(r.stat){h.abilities[r.stat]++;h.alchemyStatGains=h.alchemyStatGains||{};h.alchemyStatGains[r.stat]=1}
  else if(r.bonus)h.preparedBonus=Math.max(h.preparedBonus||0,r.bonus);
  else{
   const entry=game.alchemyRecoveryDays[h.id],spent=entry?.day===game.day?entry.amount:0,amount=Math.min(r.heal,2-spent,h.wound.days);
   h.wound.days-=amount;if(h.wound.days<=0)h.wound=null;game.alchemyRecoveryDays[h.id]={day:game.day,amount:spent+amount};
  }
  item.uses--;game.alchemyPotions=game.alchemyPotions.filter(x=>x.uses>0);
  addLog('Alchemy potion used',`${h.name} used ${r.name}. ${effect(r)}`);render();if(viewingHeroId===heroId)renderHeroStats();save();return true;
 };
 function renderAlchemy(){
  let root=document.getElementById('alchemy-panel');if(!root){root=document.createElement('article');root.id='alchemy-panel';root.className='card';root.style.marginTop='24px';document.getElementById('warehouse').appendChild(root)}
  const r=recipes.find(r=>r.id===selected)||recipes[0],q=quote(r),blocked=reason(r),heroes=[game.player,...game.heroes].filter(h=>h&&!h.dead);
  if(!heroes.some(h=>h.id===target))target=heroes[0]?.id||'';
  root.innerHTML=`<h3>Alchemy Lab</h3><p>${lab()?`Lab Level ${lab().level} · ${worker()?esc(worker().name)+' · Alchemy '+staffProfessionLevel(worker()):'Assign an alchemist'} · ${used()}/${lab().level} capacity used today.`:'Requires Hall Level 2, 150 gp and an available plot. Build the Lab in Buildings, then assign one staff member.'}</p><p>Alchemy uses Craftsmanship. Lab levels grant 1–5 brews/day; skills unlock recipes and reduce ordinary ingredient costs. Ascension Elixirs consume all five daily capacity and receive no discounts.</p><label>Recipe<select id="alchemy-recipe">${recipes.map(x=>`<option value="${x.id}" ${x.id===r.id?'selected':''}>${esc(x.name)} · Lab ${x.lab} / Alchemy ${x.skill}</option>`).join('')}</select></label><h4>${esc(r.name)}</h4><p>${esc(effect(r))}</p><p>Requires Lab ${r.lab}, Alchemy ${r.skill}, Hall ${r.hall||2} · materials only; no gold charge.</p><div class="alchemy-ingredients">${Object.entries(q.ingredients).map(([k,n])=>`<p>${esc(k)}: ${n} required · ${game.materials[k]||0} stored${WL_DUNGEONS.source(k)?' · Source: '+esc(WL_DUNGEONS.source(k)):''}</p>`).join('')}</div><button class="btn secondary" id="alchemy-brew" ${blocked?'disabled':''}>${blocked?esc(blocked):'Brew '+esc(r.name)}</button>${blocked?`<p class="muted">${esc(blocked)}</p>`:''}<h4>Stored potions</h4><label>Recipient<select id="alchemy-hero">${heroes.map(h=>`<option value="${esc(h.id)}" ${h.id===target?'selected':''}>${esc(h.name)}${h.ready&&!hasActiveQuestFor(h.id)?'':' · away/unavailable'}</option>`).join('')}</select></label>${game.alchemyPotions.map((item,index)=>{const recipe=recipes.find(r=>r.id===item.recipe);return recipe?`<section class="alchemy-stock"><strong>${esc(recipe.name)} · ${item.uses} uses</strong><p>${esc(effect(recipe))}</p>${recipe.stat?`<p>Recipient's current stat: ${purse(target)?.abilities?.[recipe.stat]??'—'} · ${Object.values(purse(target)?.alchemyStatGains||{}).some(n=>Number(n)>0)?'Already permanently enhanced; no further stat elixirs allowed.':'Enhancement available.'}</p>`:''}<button class="btn secondary" data-alchemy-use="${index}" ${canUse(purse(target),recipe)?'':'disabled'}>${recipe.bonus?'Equip for':'Use on'} ${esc(purse(target)?.name||'selected hero')}</button></section>`:''}).join('')||'<p>No alchemy potions stored.</p>'}<p class="muted">Expedition potions and rations equip into utility slots, one reserved use per slot. Wound remedies and permanent elixirs stay in storage. Existing Field Draughts retain all uses. Raw stat points affect readiness through the usual ability modifier; +1 raw stat may not immediately increase a roll modifier.</p>`;
  root.querySelector('#alchemy-recipe').onchange=e=>{selected=e.target.value;renderAlchemy()};root.querySelector('#alchemy-brew').onclick=()=>brewAlchemy(r.id);
  root.querySelector('#alchemy-hero').onchange=e=>{target=e.target.value;renderAlchemy()};root.querySelectorAll('[data-alchemy-use]').forEach(button=>button.onclick=()=>useAlchemyPotion(target,game.alchemyPotions[Number(button.dataset.alchemyUse)]?.id));
 }
 const oldWarehouse=renderWarehouse;renderWarehouse=function(){const out=oldWarehouse.apply(this,arguments);document.getElementById('provision-crafting')?.remove();renderAlchemy();return out};
 const oldStats=renderHeroStats;renderHeroStats=function(){const out=oldStats.apply(this,arguments),h=purse(viewingHeroId),root=document.getElementById('hero-stats-content');if(h&&root){const panel=document.createElement('div');panel.className='hero-detail-block';panel.innerHTML=`<h3>Alchemy</h3><p>${abilityKeys.filter(k=>h.alchemyStatGains?.[k]).map(k=>'+1 '+abilityNames[k]+' permanently').join(' · ')||'No permanent elixir enhancements.'}</p>${h.dead?'':'<button class="btn secondary" id="open-alchemy">Alchemy & potions</button>'}`;root.appendChild(panel);panel.querySelector('#open-alchemy')?.addEventListener('click',()=>{target=h.id;closeHeroStats();showView('crafting');document.getElementById('alchemy-panel').scrollIntoView({block:'start'})})}return out};
 const oldRender=render;render=function(){migrate(game);return oldRender.apply(this,arguments)};
 const oldLoad=loadGame;loadGame=function(){return migrate(oldLoad.apply(this,arguments))};
 const oldSave=save;save=function(){migrate(game);return oldSave.apply(this,arguments)};
 const style=document.createElement('style');style.textContent='#alchemy-panel{line-height:1.8;overflow-wrap:anywhere}#alchemy-panel p{margin:16px 0}#alchemy-panel h4{margin:24px 0 14px}#alchemy-panel label{display:block;margin:20px 0}#alchemy-panel select{display:block;width:100%;margin-top:10px;padding:10px;font-size:16px}#alchemy-panel button{max-width:100%;white-space:normal}.alchemy-stock{margin-top:20px;padding:20px 0;border-top:1px solid var(--line)}.alchemy-ingredients{margin:18px 0}';document.head.appendChild(style);
 migrate(game);render();
})();
