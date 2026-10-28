/* One reserved use occupies one real utility slot. Only departure consumes it. */
(function(){
 const slots=['utility1','utility2','utility3'];
 const inventory=source=>source==='alchemy'?game.alchemyPotions:game.consumables;
 function info(pack){return pack.source==='alchemy'?alchemyRecipes().find(r=>r.id===pack.recipe):pack}
 function eligible(item,source){return item.uses>0&&(source==='alchemy'?!!alchemyRecipes().find(r=>r.id===item.recipe)?.bonus:!!item.ration||/rations|draught/i.test(item.name||''))}
 function supplies(h){return Object.entries(h.utilitySupplies||{}).filter(([slot,p])=>slots.includes(slot)&&p&&(['food','alchemy'].includes(p.source))&&(p.source==='alchemy'?Number(info(p)?.bonus)>0:eligible(p,'food')))}
 function useful(h,p){const bonus=Math.min(2,Number(info(p)?.bonus)||1),ration=p.ration||/rations/i.test(p.name||'');if(bonus>(Number(h.preparedBonus)||0))return true;if((p.heal||ration&&v9L('kitchen')>=4)&&h.wound?.tier===1&&game.rationHealedDays?.[h.id]!==game.day)return true;const spent=game.rationRepairDays?.[h.id]?.day===game.day?game.rationRepairDays[h.id].amount:0;return p.repair&&spent<Math.min(2,p.repair)&&game.gear.some(g=>[h.gear,...Object.values(h.equipment||{})].includes(g.id)&&g.durability<g.maxDurability)}
 function best(h,onlyUseful=false){return supplies(h).filter(([,p])=>!onlyUseful||useful(h,p)).map(([slot,p])=>({slot,pack:p,bonus:Math.min(2,Number(info(p)?.bonus)||1)})).sort((a,b)=>b.bonus-a.bonus||slots.indexOf(a.slot)-slots.indexOf(b.slot))[0]}
 function available(h){return h&&!h.dead&&h.ready&&!hasActiveQuestFor(h.id)}
 function returnPack(h,slot){const pack=h.utilitySupplies?.[slot];if(!pack)return;const stock=inventory(pack.source),same=stock.find(x=>x.id===pack.sourceId);if(same)same.uses++;else{const copy={...pack,id:pack.sourceId,uses:1};delete copy.source;delete copy.sourceId;stock.push(copy)}delete h.utilitySupplies[slot]}
 window.equipUtilitySupply=function(heroId,slot,value){
  const h=purse(heroId);if(!available(h)||!slots.includes(slot))return false;
  if(!value?.startsWith('supply:'))return false;
  const [,source,...parts]=value.split(':'),id=parts.join(':'),item=inventory(source)?.find(x=>x.id===id);
  if(!['food','alchemy'].includes(source)||!item||!eligible(item,source))return false;
  const equipment=ensureHeroEquipment(h),old=equipment[slot];
  const pack={...item,uses:1,source,sourceId:id};item.uses--;
  if(source==='alchemy')game.alchemyPotions=game.alchemyPotions.filter(x=>x.uses>0);else game.consumables=game.consumables.filter(x=>x.uses>0);
  returnPack(h,slot);h.utilitySupplies=h.utilitySupplies||{};h.utilitySupplies[slot]=pack;equipment[slot]=null;
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
   const pack=h.utilitySupplies?.[slot];if(pack){const r=info(pack),option=document.createElement('option');option.value='loaded:'+slot;option.textContent=`${r?.name||pack.name} · 1 reserved use · +${Math.min(2,Number(r?.bonus)||1)}`;option.setAttribute('selected','');select.appendChild(option);cell.classList.add('equipped');cell.querySelector('.slot-durability').textContent=`${r?.name||pack.name} · +${Math.min(2,Number(r?.bonus)||1)} · one use reserved for departure`}
   for(const source of ['food','alchemy'])for(const item of inventory(source)||[]){if(!eligible(item,source))continue;const r=source==='alchemy'?alchemyRecipes().find(r=>r.id===item.recipe):item,option=document.createElement('option');option.value=`supply:${source}:${item.id}`;option.textContent=`${r.name} · +${Math.min(2,Number(r.bonus)||1)} · ${item.uses} in storage`;select.appendChild(option)}
   select.disabled=!available(h);
  }
  return box.innerHTML+'<p class="small muted">Utility supplies: one reserved use per slot. On departure, the strongest useful readiness supply is consumed; ties use the first slot. Bonuses do not stack (maximum +2). Unused supplies remain equipped. Emptying a slot returns its use to storage.</p>';
 };
 const oldBase=readinessBase;readinessBase=function(h,ability){const base=oldBase.apply(this,arguments),p=available(h)?best(h):null;return base+(p?Math.max(0,p.bonus-(Number(h.preparedBonus)||0)):0)};
 function recover(h,p){
  const ration=p.ration||/rations/i.test(p.name||''),heal=Math.max(Number(p.heal)||0,ration&&v9L('kitchen')>=4?1:0);
  game.rationHealedDays=game.rationHealedDays||{};
  if(heal&&h.wound?.tier===1&&game.rationHealedDays[h.id]!==game.day){game.rationHealedDays[h.id]=game.day;h.wound.days--;if(h.wound.days<=0)h.wound=null}
  if(p.repair){game.rationRepairDays=game.rationRepairDays||{};const used=game.rationRepairDays[h.id]?.day===game.day?game.rationRepairDays[h.id].amount:0,ids=[h.gear,...Object.values(h.equipment||{})],gear=game.gear.filter(g=>ids.includes(g.id)&&g.durability<g.maxDurability).sort((a,b)=>(b.maxDurability-b.durability)-(a.maxDurability-a.durability))[0];if(gear&&used<Math.min(2,p.repair)){const amount=Math.min(2-used,p.repair-used,gear.maxDurability-gear.durability);gear.durability+=amount;game.rationRepairDays[h.id]={day:game.day,amount:used+amount}}}
 }
 window.consumeExpeditionSupplies=function(party){const records=[];
  for(const h of party){const p=best(h,true);if(!p)continue;h.preparedBonus=Math.max(Number(h.preparedBonus)||0,p.bonus);recover(h,p.pack);delete h.utilitySupplies[p.slot];records.push({heroId:h.id,name:info(p.pack)?.name||p.pack.name,bonus:p.bonus,slot:p.slot})}
  return records;
 };
 function equipFirst(id,source,itemId){const h=purse(id);if(!available(h))return false;const equipment=ensureHeroEquipment(h),slot=slots.find(s=>!h.utilitySupplies?.[s]&&!equipment[s]);if(!slot){alert('All utility slots are occupied. Choose a slot in the hero equipment screen.');return false}return equipUtilitySupply(id,slot,`supply:${source}:${itemId}`)}
 useDraught=function(id,itemId){if(itemId!==undefined)return equipFirst(id,'food',itemId);openHeroStats(id);document.querySelector('#hero-stats-content .slot-utility1')?.scrollIntoView({block:'center'})};
 const oldAlchemyUse=useAlchemyPotion;useAlchemyPotion=function(id,itemId){const item=game.alchemyPotions.find(x=>x.id===itemId),recipe=alchemyRecipes().find(r=>r.id===item?.recipe);if(recipe?.bonus)return equipFirst(id,'alchemy',itemId);return oldAlchemyUse.apply(this,arguments)};
 const oldDismiss=confirmDismissHero;confirmDismissHero=function(){const h=purse(dismissHeroId);if(h&&!h.dead&&!hasActiveQuestFor(h.id))for(const slot of slots)returnPack(h,slot);return oldDismiss.apply(this,arguments)};

 const style=document.createElement('style');style.textContent='@media(max-width:760px){#hero-stats-content .equipment-slot-grid :is(.slot-utility1,.slot-utility2,.slot-utility3){grid-area:auto!important;grid-column:1/-1!important;min-height:0;padding:12px;align-items:stretch;text-align:left;margin-top:8px}#hero-stats-content :is(.slot-utility1,.slot-utility2,.slot-utility3) select{font-size:16px!important;padding:8px!important;margin-top:8px}#hero-stats-content :is(.slot-utility1,.slot-utility2,.slot-utility3) .slot-durability{display:block;margin-top:8px;white-space:normal;overflow-wrap:anywhere}}';document.head.appendChild(style);
 render();
})();
