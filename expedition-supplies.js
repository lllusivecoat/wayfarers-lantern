/* Up to three stored uses occupy one utility slot; departure spends one. */
(function(){
 const slots=['utility1','utility2','utility3'];
 const inventory=source=>source==='kit'?game.fieldKits:source==='alchemy'?game.alchemyPotions:game.consumables;
 function info(pack){return pack.source==='kit'?fieldKitRecipes().find(r=>r.id===pack.recipe):pack.source==='alchemy'?alchemyRecipes().find(r=>r.id===pack.recipe):pack}
 function eligible(item,source){return item.uses>0&&(source==='kit'?!!fieldKitRecipes().find(r=>r.id===item.recipe)?.protection:source==='alchemy'?!!alchemyRecipes().find(r=>r.id===item.recipe)?.bonus:!!item.ration||/rations|draught/i.test(item.name||''))}
 function supplies(h){return Object.entries(h.utilitySupplies||{}).filter(([slot,p])=>slots.includes(slot)&&p&&(['food','alchemy','kit'].includes(p.source))&&eligible(p,p.source))}
 const category=p=>p.source==='kit'?'kit':p.ration||/rations/i.test(p.name||'')?'ration':'potion';
 const effect=p=>p.source==='kit'?`${Math.round((Number(info(p)?.protection)||0)*100)}% less ordinary wound chance`:`+${Math.min(2,Number(info(p)?.bonus)||1)} readiness`;
 const total=s=>Math.max(s.legacy,s.ration+s.potion);
 function preparation(h){
  const amount=Math.max(0,Number(h.preparedBonus)||0),s=h.preparedSupplyBonuses;
  // Older preparation has no known category. Preserve its value as a floor,
  // without manufacturing a free second category or charging it again.
  if(s&&['ration','potion','legacy'].every(k=>Number.isFinite(s[k])&&s[k]>=0)&&s.ration<=2&&s.potion<=2&&total(s)===amount)return {...s};
  return {ration:0,potion:0,legacy:amount};
 }
 function recoveryUseful(h,p){const ration=category(p)==='ration';if((p.heal||ration&&v9L('kitchen')>=4)&&h.wound?.tier===1&&game.rationHealedDays?.[h.id]!==game.day)return true;const spent=game.rationRepairDays?.[h.id]?.day===game.day?game.rationRepairDays[h.id].amount:0;return p.repair&&spent<Math.min(2,p.repair)&&game.gear.some(g=>[h.gear,...Object.values(h.equipment||{})].includes(g.id)&&g.durability<g.maxDurability)}
 function best(h,kind,recoveryOnly=false){return supplies(h).filter(([,p])=>category(p)===kind&&(!recoveryOnly||recoveryUseful(h,p))).map(([slot,p])=>({slot,pack:p,bonus:kind==='kit'?0:Math.min(2,Number(info(p)?.bonus)||1),protection:kind==='kit'?Math.min(.2,Number(info(p)?.protection)||0):0,category:kind})).sort((a,b)=>b.protection-a.protection||b.bonus-a.bonus||slots.indexOf(a.slot)-slots.indexOf(b.slot))[0]}
 function plan(h){
  const state=preparation(h),next={...state},choices=['ration','potion'].map(k=>best(h,k)).filter(Boolean);
  for(const p of choices)next[p.category]=Math.max(next[p.category],p.bonus);
  const improves=total(next)>total(state);
  return {state,bonus:total(next),uses:['ration','potion'].map(k=>{const p=choices.find(p=>p.category===k);return improves&&p&&p.bonus>state[k]?p:best(h,k,true)}).filter(Boolean)};
 }
 function available(h){return h&&!h.dead&&h.ready&&!hasActiveQuestFor(h.id)}
 function returnPack(h,slot){const pack=h.utilitySupplies?.[slot];if(!pack)return;const stock=inventory(pack.source),same=stock.find(x=>x.id===pack.sourceId);if(same)same.uses+=pack.uses;else{const copy={...pack,id:pack.sourceId,uses:pack.uses};delete copy.source;delete copy.sourceId;stock.push(copy)}delete h.utilitySupplies[slot]}
 window.equipUtilitySupply=function(heroId,slot,value){
  const h=purse(heroId);if(!available(h)||!slots.includes(slot))return false;
  if(!value?.startsWith('supply:'))return false;
  const [,source,...parts]=value.split(':'),id=parts.join(':'),item=inventory(source)?.find(x=>x.id===id);
  if(!['food','alchemy','kit'].includes(source)||!item||!eligible(item,source))return false;
  const equipment=ensureHeroEquipment(h),old=equipment[slot];
  returnPack(h,slot);
  const pack={...item,name:info({...item,source})?.name||item.name,uses:Math.min(3,item.uses),source,sourceId:id};item.uses-=pack.uses;
  if(source==='kit')game.fieldKits=game.fieldKits.filter(x=>x.uses>0);else if(source==='alchemy')game.alchemyPotions=game.alchemyPotions.filter(x=>x.uses>0);else game.consumables=game.consumables.filter(x=>x.uses>0);
  h.utilitySupplies=h.utilitySupplies||{};h.utilitySupplies[slot]=pack;equipment[slot]=null;
  const gear=game.gear.find(g=>g.id===old);if(gear?.owner===h.id&&!Object.values(equipment).includes(old))gear.owner=null;
  if(h.gear===old)h.gear=equipment.weapon||equipment.armor||null;
  render();if(viewingHeroId===heroId)renderHeroStats();save();return true;
 };
 const oldEquip=equipSlot;equipSlot=function(id,slot,value){
  if(!slots.includes(slot))return oldEquip.apply(this,arguments);
  const h=purse(id);if(!available(h))return false;
  if(value?.startsWith('supply:'))return equipUtilitySupply(id,slot,value);
  if(value?.startsWith('loaded:'))return true;
  const gear=game.gear.find(g=>g.id===value);
  if(value&&(!gear||gearGroup(gear)!=='utility'||gear.owner&&gear.owner!==id||gear.madeByPlayer&&gear.owner!==id&&(h.gold||0)<(gear.price||0)))return false;
  returnPack(h,slot);return oldEquip.apply(this,arguments);
 };
 const oldEquipment=renderHeroEquipment;renderHeroEquipment=function(h){
  const box=document.createElement('div');box.innerHTML=oldEquipment(h);
  for(const slot of slots){const cell=box.querySelector('.slot-'+slot),select=cell?.querySelector('select');if(!select)continue;
   const pack=h.utilitySupplies?.[slot];if(pack){const r=info(pack),option=document.createElement('option');option.value='loaded:'+slot;option.textContent=`${r?.name||pack.name} · ${pack.uses}/3 uses · ${effect(pack)}`;option.setAttribute('selected','');select.appendChild(option);cell.classList.add('equipped');cell.querySelector('.slot-durability').textContent=`${r?.name||pack.name} · ${effect(pack)} · ${pack.uses}/3 uses remaining`}
   for(const source of ['food','alchemy','kit'])for(const item of inventory(source)||[]){if(!eligible(item,source))continue;const pack={...item,source},r=info(pack),option=document.createElement('option');option.value=`supply:${source}:${item.id}`;option.textContent=`${r.name} · ${effect(pack)} · ${item.uses} in storage`;select.appendChild(option)}
   select.disabled=!available(h);
  }
  const kit=best(h,'kit'),protection=Math.max(Number(h.expeditionKitProtection)||0,kit?.protection||0);
  return box.innerHTML+`<p class="small muted">Utility supplies: up to three uses per slot, reserved from storage when equipped. Low stock loads fewer uses. One ration and one readiness potion can combine: up to +2 each, +4 total. One field kit reduces ordinary wound chance without adding readiness. On departure, the strongest useful item in each category spends one use; ties use the first slot. Extras remain as backups. Emptying a slot returns all unused charges to storage.</p>${protection?`<p class="small muted">Field kit protection: ${Math.round(protection*100)}% less ordinary wound chance${available(h)?' on departure':''}. Mandatory natural-1 wounds and direct death checks are unchanged.</p>`:''}`;
 };
 const oldBase=readinessBase;readinessBase=function(h,ability){const base=oldBase.apply(this,arguments);return base+(available(h)?Math.max(0,plan(h).bonus-(Number(h.preparedBonus)||0)):0)};
 function recover(h,p){
  const ration=p.ration||/rations/i.test(p.name||''),heal=Math.max(Number(p.heal)||0,ration&&v9L('kitchen')>=4?1:0);
  game.rationHealedDays=game.rationHealedDays||{};
  if(heal&&h.wound?.tier===1&&game.rationHealedDays[h.id]!==game.day){game.rationHealedDays[h.id]=game.day;h.wound.days--;if(h.wound.days<=0)h.wound=null}
  if(p.repair){game.rationRepairDays=game.rationRepairDays||{};const used=game.rationRepairDays[h.id]?.day===game.day?game.rationRepairDays[h.id].amount:0,ids=[h.gear,...Object.values(h.equipment||{})],gear=game.gear.filter(g=>ids.includes(g.id)&&g.durability<g.maxDurability).sort((a,b)=>(b.maxDurability-b.durability)-(a.maxDurability-a.durability))[0];if(gear&&used<Math.min(2,p.repair)){const amount=Math.min(2-used,p.repair-used,gear.maxDurability-gear.durability);gear.durability+=amount;game.rationRepairDays[h.id]={day:game.day,amount:used+amount}}}
 }
 window.consumeExpeditionSupplies=function(party){const records=[];
  for(const h of party){const {state,uses}=plan(h);for(const p of uses){state[p.category]=Math.max(state[p.category],p.bonus);recover(h,p.pack);p.pack.uses--;if(p.pack.uses<=0)delete h.utilitySupplies[p.slot];records.push({heroId:h.id,name:info(p.pack)?.name||p.pack.name,category:p.category,bonus:p.bonus,slot:p.slot})}h.preparedSupplyBonuses=state;h.preparedBonus=total(state);
   const kit=best(h,'kit');if(kit&&kit.protection>(Number(h.expeditionKitProtection)||0)){h.expeditionKitProtection=kit.protection;kit.pack.uses--;if(kit.pack.uses<=0)delete h.utilitySupplies[kit.slot];records.push({heroId:h.id,name:info(kit.pack)?.name,category:'kit',protection:kit.protection,slot:kit.slot})}
  }
  return records;
 };
 function equipFirst(id,source,itemId){const h=purse(id);if(!available(h))return false;const equipment=ensureHeroEquipment(h),slot=slots.find(s=>!h.utilitySupplies?.[s]&&!equipment[s]);if(!slot){alert('All utility slots are occupied. Choose a slot in the hero equipment screen.');return false}return equipUtilitySupply(id,slot,`supply:${source}:${itemId}`)}
 window.equipFieldKit=(id,itemId)=>equipFirst(id,'kit',itemId);
 useDraught=function(id,itemId){if(itemId!==undefined)return equipFirst(id,'food',itemId);openHeroStats(id);document.querySelector('#hero-stats-content .slot-utility1')?.scrollIntoView({block:'center'})};
 const oldAlchemyUse=useAlchemyPotion;useAlchemyPotion=function(id,itemId){const item=game.alchemyPotions.find(x=>x.id===itemId),recipe=alchemyRecipes().find(r=>r.id===item?.recipe);if(recipe?.bonus)return equipFirst(id,'alchemy',itemId);return oldAlchemyUse.apply(this,arguments)};
 const oldDismiss=confirmDismissHero;confirmDismissHero=function(){const h=purse(dismissHeroId);if(h&&!h.dead&&!hasActiveQuestFor(h.id))for(const slot of slots)returnPack(h,slot);return oldDismiss.apply(this,arguments)};
 const oldDetails=showReportDetails;showReportDetails=function(r){const out=oldDetails.apply(this,arguments);if(r.suppliesUsed?.length)document.getElementById('report-detail-text').textContent+=' Supplies used: '+r.suppliesUsed.map(x=>`${purse(x.heroId)?.name||'Hero'} — ${x.name} (${x.category==='kit'?Math.round(x.protection*100)+'% less ordinary wound chance':'+'+x.bonus+' readiness'})`).join('; ')+'.';return out};

 const style=document.createElement('style');style.textContent='.inventory-consumables>summary{cursor:pointer;padding:12px 0;font-weight:600}.inventory-consumables[open]>div{margin-top:12px}@media(max-width:760px){#hero-stats-content .equipment-slot-grid :is(.slot-utility1,.slot-utility2,.slot-utility3){grid-area:auto!important;grid-column:1/-1!important;min-height:0;padding:12px;align-items:stretch;text-align:left;margin-top:8px}#hero-stats-content :is(.slot-utility1,.slot-utility2,.slot-utility3) select{font-size:16px!important;padding:8px!important;margin-top:8px}#hero-stats-content :is(.slot-utility1,.slot-utility2,.slot-utility3) .slot-durability{display:block;margin-top:8px;white-space:normal;overflow-wrap:anywhere}}';document.head.appendChild(style);
 render();
})();
