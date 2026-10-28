/* Ingredient-backed daily cooking. Existing inventory and queued reports remain valid. */
(function(){
  const esc=tbwEsc;
  const recipes=[
    {id:'trail',name:'Trail Rations',building:1,skill:0,meat:'Meat',fish:'Fresh Fish',bonus:1},
    {id:'hearty',name:'Hearty Rations',building:2,skill:3,meat:'Prime Meat',fish:'Deviate Fish',bonus:2},
    {id:'restorative',name:'Restorative Rations',building:3,skill:5,meat:'Rich Game Meat',fish:'Silverfin',bonus:2,heal:1},
    {id:'fortifying',name:'Fortifying Rations',building:4,skill:7,meat:'Wild Game Meat',fish:'Deepwater Fish',bonus:2,heal:1,repair:1},
    {id:'feast',name:'Grand Feast Rations',building:5,skill:9,meat:'Primal Meat',fish:'Royal Salmon',bonus:2,heal:1,repair:2}
  ];
  const grades=[
    {rank:0,meat:'Meat',fish:'Fresh Fish',divisor:2},
    {rank:3,meat:'Prime Meat',fish:'Deviate Fish',divisor:4},
    {rank:5,meat:'Rich Game Meat',fish:'Silverfin',divisor:6},
    {rank:6,meat:'Wild Game Meat',fish:'Deepwater Fish',divisor:8},
    {rank:7,meat:'Primal Meat',fish:'Royal Salmon',divisor:10}
  ];
  const effects=r=>`+${Math.min(2,Number(r.bonus)||1)} readiness${r.heal?' · Light wound recovery −1 day':''}${r.repair?` · restore up to ${r.repair} durability to one equipped item`:''}`;
  const isRation=item=>item.ration===true||/rations/i.test(item.name||'');
  const storedRations=()=>game.consumables.filter(isRation).reduce((n,item)=>n+Math.max(0,Number(item.uses)||0),0);
  const cookFor=i=>v9StaffOf(i.uid)[0];
  function selected(i){return recipes.find(r=>r.id===game.kitchenRecipes?.[i.uid])||recipes[0]}
  function eligible(i,r){return !!cookFor(i)&&i.level>=r.building&&staffProfessionLevel(cookFor(i))>=r.skill}
  function plan(i){
    const r=selected(i),paused=game.kitchenRecipes?.[i.uid]==='paused',room=Math.max(0,30-storedRations());
    const count=!paused&&eligible(i,r)?Math.max(0,Math.min(i.level,Math.floor(Number(game.materials[r.meat])||0),Math.floor(Number(game.materials[r.fish])||0),room)):0;
    const extraChance=WL_STAFF.service('kitchen',cookFor(i),i.level,i.uid).extraRationChance,canExtra=count>0&&room>count&&(game.materials[r.meat]||0)>count&&(game.materials[r.fish]||0)>count;
    return {r,count,paused,extraChance,canExtra};
  }
  window.kitchenRecipes=()=>recipes.map(r=>({...r}));
  window.setKitchenRecipe=function(uid,id){
    const i=v9InstById(uid),r=recipes.find(r=>r.id===id);
    if(!i||i.key!=='kitchen'||id!=='paused'&&(!r||i.level<r.building||!cookFor(i)||staffProfessionLevel(cookFor(i))<r.skill))return false;
    (game.kitchenRecipes||(game.kitchenRecipes={}))[uid]=id;save();renderWarehouse();return true;
  };
  v9KitchenDay=function(){
    const done=game.kitchenProduction||(game.kitchenProduction={});
    // Production follows the existing daily-cost settlement; unpaid shifts don't make free food.
    if(game.staffCostsPaidDay!==game.day)return;
    v9Ops('kitchen').forEach(i=>{
      if(done[i.uid]===game.day)return;
      done[i.uid]=game.day;
      const batch=plan(i),r=batch.r;let count=batch.count;
      if(!count)return;
      if(batch.canExtra&&Math.random()<batch.extraChance)count++;
      game.materials[r.meat]-=count;game.materials[r.fish]-=count;
      for(let n=0;n<count;n++)game.consumables.push({id:`ration-${i.uid}-${game.day}-${n}`,name:r.name,uses:1,bonus:r.bonus,heal:r.heal||0,repair:r.repair||0,ration:true,recipe:r.id});
      practiceStaff('kitchen');addLog('Kitchen provisions prepared',`${v9InstLabel(i)} cooked ${count} ${r.name} (${effects(r)} each), using ${count} ${r.meat} and ${count} ${r.fish}.`);
    });
    save();
  };
  function foodDrops(q,r){
    if(q.kind!=='Gathering'||!['Skinning','Fishing'].includes(q.profession)||!['Success','Exceptional Success','Partial Success'].includes(r.outcome))return [];
    const qty=Math.max(0,Number(r.resourceQty)||0);if(!qty)return [];
    const drops=[];
    grades.filter(g=>q.rank>=g.rank).forEach(g=>{
      // Fresh Fish is already the main reward; all other food is additional loot.
      if(q.profession==='Fishing'&&g.rank===0)return;
      drops.push({material:q.profession==='Skinning'?g.meat:g.fish,count:Math.max(1,Math.ceil(qty/g.divisor)),foodDrop:true});
    });
    return drops;
  }
  const oldQueue=queueQuestReport;
  queueQuestReport=function(q){const before=game.pendingReports.length;const out=oldQueue.apply(this,arguments);if(game.pendingReports.length>before){const r=game.pendingReports.at(-1),drops=foodDrops(q,r);if(drops.length){r.lootDrops=r.lootDrops||[];r.lootDrops.push(...drops);const text=' Food supplies: '+drops.map(d=>`${d.count} ${d.material}`).join(', ')+'.';r.summary+=text;r.extendedSummary=(r.extendedSummary||'')+text}}return out};
  const oldGather=gatheringQuest;
  gatheringQuest=function(profession){const q=oldGather(profession);if(!['Skinning','Fishing'].includes(profession))return q;
    const supply=grades.map(g=>`${ranks[g.rank]}+: ${profession==='Skinning'?g.meat:g.fish}`).join('; ');
    return {...q,desc:q.desc+' Kitchen supplies by gathering rank: '+supply+'. Higher ranks retain lower-grade supplies; Skinning keeps leather rewards.'};
  };
  const oldLoot=questLootTable;
  questLootTable=function(q){const rows=oldLoot(q);if(q.kind==='Gathering'&&['Fishing','Skinning'].includes(q.profession))grades.filter(g=>q.rank>=g.rank).forEach(g=>{
    if(q.profession==='Fishing'&&g.rank===0)return;
    rows.push([q.profession==='Skinning'?g.meat:g.fish,`${ranks[g.rank]}+ food: returned haul ÷ ${g.divisor}, rounded up; only on a successful or partial haul.`]);
  });return rows};
  Object.assign(tradeValues,{'Prime Meat':6,'Rich Game Meat':7,Silverfin:8,'Wild Game Meat':8,'Deepwater Fish':9,'Primal Meat':10,'Royal Salmon':10});
  function damagedGear(h){const ids=[h.gear,...Object.values(h.equipment||{})].filter(Boolean);return game.gear.filter(g=>ids.includes(g.id)&&g.maxDurability>g.durability).sort((a,b)=>(b.maxDurability-b.durability)-(a.maxDurability-a.durability))}
  function healing(item){return Math.max(Number(item.heal)||0,isRation(item)&&v9L('kitchen')>=4?1:0)}
  function useful(h,item){return item.uses>0&&(Math.min(2,Number(item.bonus)||1)>(Number(h.preparedBonus)||0)||healing(item)&&h.wound?.tier===1&&game.rationHealedDays?.[h.id]!==game.day||Number(item.repair)>0&&(game.rationRepairDays?.[h.id]?.day!==game.day||game.rationRepairDays[h.id].amount<Math.min(2,Number(item.repair)))&&damagedGear(h).length>0)}
  function closeProvision(){document.getElementById('provision-choice-modal')?.classList.remove('open')}
  useDraught=function(id,itemId){
    const h=purse(id);if(!h||h.dead)return;
    if(!h.ready||hasActiveQuestFor(id))return alert('Use provisions before dispatching this hero.');
    if(itemId===undefined){
      if(!game.consumables.some(item=>useful(h,item)))return alert('No provision would currently improve this hero.');
      let modal=document.getElementById('provision-choice-modal');if(!modal){modal=document.createElement('div');modal.id='provision-choice-modal';modal.className='modal';document.body.appendChild(modal)}
      const items=game.consumables.filter(x=>x.uses>0),groups=[];
      items.forEach(item=>{const key=JSON.stringify([item.name,item.bonus,item.heal||0,item.repair||0]),group=groups.find(g=>g.key===key);if(group)group.uses+=item.uses;else groups.push({key,item,uses:item.uses})});
      modal.innerHTML=`<div class="modalbox" role="dialog" aria-modal="true" aria-labelledby="provision-choice-title" style="max-height:85vh;overflow:auto"><h2 id="provision-choice-title">Choose a provision</h2><p>${esc(h.name)} · readiness from food: +${Number(h.preparedBonus)||0}/2. Food does not stack. Light-wound recovery is limited to once per day; gear recovery to 2 durability per hero per day.</p>${groups.map((g,index)=>`<div class="building"><div><strong>${esc(g.item.name)}</strong><p>${esc(effects(g.item))} · ${g.uses} available</p><button class="btn secondary" data-provision="${index}" ${!useful(h,g.item)?'disabled':''}>Use ${esc(g.item.name)}</button></div></div>`).join('')}<div class="modalactions"><button class="btn ghost" id="close-provision">Cancel</button></div></div>`;
      modal.querySelectorAll('[data-provision]').forEach(button=>button.onclick=()=>useDraught(id,groups[Number(button.dataset.provision)].item.id));
      modal.querySelector('#close-provision').onclick=closeProvision;modal.classList.add('open');modal.querySelector('button:not(:disabled)')?.focus();return;
    }
    const item=game.consumables.find(x=>x.id===itemId);if(!item||!useful(h,item))return alert('This provision would not improve this hero.');
    item.uses--;h.preparedBonus=Math.max(Number(h.preparedBonus)||0,Math.min(2,Number(item.bonus)||1));
    game.consumables=game.consumables.filter(x=>x.uses>0);
    if(healing(item)&&h.wound?.tier===1){
      const healed=game.rationHealedDays||(game.rationHealedDays={});
      if(healed[id]!==game.day){healed[id]=game.day;h.wound.days=Math.max(0,h.wound.days-1);if(!h.wound.days)h.wound=null}
    }
    if(item.repair){
      const days=game.rationRepairDays||(game.rationRepairDays={}),used=days[id]?.day===game.day?days[id].amount:0,gear=damagedGear(h)[0];
      if(gear&&used<item.repair){const amount=Math.min(2-used,item.repair-used,gear.maxDurability-gear.durability);gear.durability+=amount;days[id]={day:game.day,amount:used+amount}}
    }
    addLog('Provision used',`${h.name} uses ${item.name}: ${effects(item)}. Daily recovery limits apply; food readiness does not stack.`);closeProvision();render();
    if(typeof viewingHeroId!=='undefined'&&viewingHeroId===id)renderHeroStats();save();
  };
  const oldWarehouse=renderWarehouse;
  renderWarehouse=function(){
    oldWarehouse();
    document.getElementById('warehouse-consumables').innerHTML=game.consumables.map(item=>`<div class="building"><strong>${esc(item.name)}</strong><span class="pill">${item.uses} uses left</span><p>${esc(effects(item))}. Equip one use in a hero’s utility slot. The strongest equipped supply is consumed when that hero departs.</p></div>`).join('')||'<p class="small muted">No provisions stored.</p>';
    let root=document.getElementById('kitchen-recipes');if(!root){root=document.createElement('article');root.id='kitchen-recipes';root.className='card';document.getElementById('warehouse').appendChild(root)}
    root.innerHTML=`<h3>Kitchen recipes</h3><p>Each ration consumes 1 meat and 1 fish from storage. Cooking happens when resting until tomorrow, after operating costs are paid. Kitchen level sets the daily limit (1–5); Cooking unlocks better recipes. Ration stock: ${storedRations()}/30. Food readiness is capped at +2 and does not stack.</p><details><summary>All recipes and ingredient ranks</summary>${recipes.map((rec,n)=>`<p><strong>${rec.name}</strong> · Kitchen ${rec.building}, Cooking ${rec.skill} · ${ranks[grades[n].rank]}+ ingredients: 1 ${rec.meat} + 1 ${rec.fish}. ${effects(rec)}.</p>`).join('')}</details><div class="kitchen-list">${v9Inst('kitchen').map((i,index)=>{
      const {r,count,paused,extraChance,canExtra}=plan(i),cook=cookFor(i),skill=staffProfessionLevel(cook),made=game.kitchenProduction?.[i.uid]===game.day;
      return `<section><h3>${esc(v9InstLabel(i))} · Level ${i.level}</h3><p>${cook?`${esc(cook.name)} · Cooking ${skill}`:'Assign a staff member to cook.'}</p><label>Daily recipe<select data-kitchen-index="${index}"><option value="paused" ${paused?'selected':''}>Pause cooking</option>${recipes.map(rec=>`<option value="${rec.id}" ${!paused&&rec.id===r.id?'selected':''} ${!eligible(i,rec)?'disabled':''}>${rec.name} · Kitchen ${rec.building}, Cooking ${rec.skill}</option>`).join('')}</select></label><p>${paused?'Cooking paused.':`${effects(r)}. Per ration: 1 ${r.meat} (have ${Number(game.materials[r.meat])||0}) + 1 ${r.fish} (have ${Number(game.materials[r.fish])||0}). Based on current stock: ${count}/${i.level} rations next day; consumes ${count} of each ingredient. ${WL_STAFF.percent(extraChance)} chance of one extra ration, consuming one more of each ingredient (six-ration maximum). ${canExtra?'Ingredients and storage permit the extra ration.':'Extra ration unavailable with current ingredients or storage.'}`}</p><p class="small muted">${made?'Today’s batch is complete. Recipe changes apply next day.':'No production without the recipe’s ingredients, required skill, assigned worker and paid operating costs.'}</p></section>`;
    }).join('')||'<p>Build a Kitchen and assign one staff member to begin cooking.</p>'}</div><p class="small muted">Skinning supplies Meat alongside leather. Fishing supplies Fresh Fish. Better ingredients unlock at C, A, S and SS gathering ranks. Higher-rank trips retain lower-grade supplies.</p>`;
    root.querySelectorAll('[data-kitchen-index]').forEach(select=>select.onchange=()=>{const i=v9Inst('kitchen')[Number(select.dataset.kitchenIndex)];if(!setKitchenRecipe(i.uid,select.value))renderWarehouse()});
  };
  render();
})();
