/* Staff skills and market convoys. Extends the existing v9 building/report engine. */
(function(){
  const skills={cartographersOffice:'Cartography',waystation:'Pathfinding',warehouse:'Storekeeping',staffOffice:'Quartermastery',workshop:'Blacksmithing',kitchen:'Cooking',infirmary:'First Aid',armory:'Armoring',trainingHall:'Training',warRoom:'Tactics',huntersLodge:'Hunting',commandPost:'Command'};
  const thresholds=[0,5,15,30,50,75,105,140,180,225,275];
  const esc=tbwEsc;
  window.staffSkillLevel=points=>thresholds.reduce((level,t,i)=>Number(points)>=t?i:level,0);
  window.staffMigrate=function(g){
    (g.staffMembers||[]).forEach(st=>{
      if(typeof st.professionXP==='number')st.professionXP={[st.profession||skills[st.buildingKey]||'Generalist']:st.professionXP};
      st.professionXP=st.professionXP||{};
      if(st.professionXP.Medicine!==undefined){st.professionXP['First Aid']=Math.max(Number(st.professionXP['First Aid'])||0,Number(st.professionXP.Medicine)||0);delete st.professionXP.Medicine}
      if(st.profession==='Medicine')st.profession='First Aid';
      if(skills[st.buildingKey])st.profession=skills[st.buildingKey];
      st.skillAwards=st.skillAwards||{};
    });
    const occupied=new Set();
    const posts=new Map((g.buildingList||[]).map(i=>[i.uid,i.key]));
    if(g.buildings?.warehouse)posts.set('warehouse','warehouse');
    const ranked=[...(g.staffMembers||[])].sort((a,b)=>{
      const points=st=>Number(st.professionXP[skills[posts.get(st.buildingUid)]]||0);
      return points(b)-points(a);
    });
    ranked.forEach(st=>{
      if(!st.buildingUid)return;
      if(!posts.has(st.buildingUid)||occupied.has(st.buildingUid)){st.buildingUid=null;st.buildingKey=null;delete st.homeKey;return}
      occupied.add(st.buildingUid);st.buildingKey=posts.get(st.buildingUid);st.profession=skills[st.buildingKey];
    });
    return g;
  };
  staffProfessionForKey=key=>skills[key]||'Generalist';
  staffPracticeCount=st=>st?Math.max(0,Number(st.professionXP?.[skills[st.buildingKey]||st.profession])||0):0;
  staffProfessionLevel=st=>st?staffSkillLevel(staffPracticeCount(st)):0;
  staffSkillBonus=key=>WL_BALANCE.supportBonus(staffProfessionLevel(buildingStaff(key)));
  staffUnlockText=function(key,level){
    const bonus=WL_BALANCE.supportBonus(level);
    return ({cartographersOffice:`Exploration checks improved by +${bonus}; exploration unlocks when construction completes, even without staff`,waystation:`New quest time −${Math.round(WL_BALANCE.questTimeCut(level,buildingLevel('waystation'))*100)}%; building levels grant 10/25/40/55/80% plus 2% per Pathfinding level (80% cap); strongest Pathfinder applies`,warehouse:`+${Math.round(level*WL_BALANCE.salePerLevel*100)}% sale prices; convoy danger −${bonus}`,staffOffice:`+${bonus} expedition preparation`,workshop:`${['No gear tier','Basic','Sturdy','Fine','Superior','Masterwork','Relic','Legendary','Heritage'][Math.min(8,level)]}; ${level*WL_BALANCE.materialPerLevel*100}% fewer materials; ${level*WL_BALANCE.craftChancePerLevel*100}% chance of +${WL_BALANCE.craftExtra(level)} extra readiness`,kitchen:`Cooking 0/3/5/7/9 unlocks recipes for Kitchen 1/2/3/4/5. Better recipes require higher-rank meat and fish; food readiness caps at +2, with limited recovery on advanced meals.`,infirmary:`${Math.min(25,bonus*5)}% treatment discount; improved casualty prevention`,armory:`Repair unit cost reduced by ${bonus*.5} gp`,trainingHall:`${Math.min(15,bonus*5)}% training and respec discount`,warRoom:`+${bonus} raid tactics and ${bonus*5}% extra loot chance`,huntersLodge:`+${bonus} world-boss readiness and ${bonus*5}% extra loot chance`,commandPost:`+${bonus} world-raid readiness and ${bonus*5}% extra loot chance`})[key]||'Assign to a building to train its skill';
  };
  function assigned(st){return st.buildingUid==='warehouse'?!!game.buildings.warehouse:!!v9InstById(st.buildingUid)}
  function award(st,amount,kind){
    if(!assigned(st)||!skills[st.buildingKey])return;
    const skill=skills[st.buildingKey],token=skill+':'+kind;
    if(st.skillAwards[token]===game.day)return;
    st.skillAwards[token]=game.day;
    const before=staffProfessionLevel(st);st.professionXP[skill]=(Number(st.professionXP[skill])||0)+amount;
    const after=staffProfessionLevel(st);if(after>before)addLog('Staff skill advanced',`${st.name}: ${skill} Level ${after}. ${staffUnlockText(st.buildingKey,after)}.`);
  }
  practiceStaff=function(key,amount=1){staffMigrate(game);if(amount>0)(game.staffMembers||[]).filter(st=>st.buildingKey===key).forEach(st=>award(st,amount,'service'))};
  const oldDay=nextDay;
  nextDay=function(){staffMigrate(game);game.staffMembers.forEach(st=>award(st,1,'work'));return oldDay.apply(this,arguments)};
  const oldRender=render;
  render=function(){staffMigrate(game);return oldRender.apply(this,arguments)};
  // Normal load and import both call render; migrate before the next save as well.
  const oldSave=save;save=function(){staffMigrate(game);return oldSave.apply(this,arguments)};
  const oldLoad=loadGame;loadGame=function(){return staffMigrate(oldLoad())};
  v9AssignStaff=function(id,uid){
    const st=game.staffMembers.find(s=>s.id===id),i=uid==='warehouse'?{uid,key:'warehouse',level:game.warehouseLevel||1}:v9InstById(uid);
    if(!st||!i||(uid==='warehouse'&&!game.buildings.warehouse))return 'invalid';
    const used=game.staffMembers.filter(s=>s!==st&&s.buildingUid===uid).length;
    if(used>=1)return 'full';
    st.buildingUid=uid;st.buildingKey=i.key;st.profession=skills[i.key];delete st.homeKey;
    staffMigrate(game);addLog('Staff assigned',`${st.name} now trains ${st.profession} at ${i.key==='warehouse'?'Warehouse':v9InstLabel(i)}.`);render();save();return '';
  };
  // Building levels control capacity, never skill levels.
  buildingLevel=function(key){return key==='warehouse'?game.warehouseLevel||1:Math.max(1,...v9Inst(key).map(i=>i.level))};
  function staffTargets(){return [...(game.buildings.warehouse?[{uid:'warehouse',key:'warehouse',level:game.warehouseLevel||1}]:[]),...(game.buildingList||[])]}
  function staffLocation(st){const target=staffTargets().find(i=>i.uid===st.buildingUid);return target?target.uid==='warehouse'?'Warehouse':v9InstLabel(target):'Unassigned'}
  function staffPay(st){return assigned(st)&&st.wage>0?Math.max(1,st.wage-(v9L('staffOffice')>=3?1:0)):0}
  hireStaff=function(){
    if(game.staffMembers.length>=staffCap())return v9Say('Staff capacity is full. Upgrade the Guild Hall to hire more staff.');
    let id;do{game.staffSeq=(game.staffSeq||0)+1;id='staff-'+game.staffSeq}while(game.staffMembers.some(st=>st.id===id));
    const race=APPLICANT_RACES[Math.floor(Math.random()*APPLICANT_RACES.length)];
    const name=generateRaceName(race,[...game.staffMembers,...game.heroes,...game.applicants,game.player,...(game.dismissedHeroes||[])].filter(Boolean).map(h=>h.name));
    game.staffMembers.push({id,name,race,job:'Staff',wage:2,morale:3,buildingUid:null,buildingKey:null,profession:'Generalist',professionXP:{},skillAwards:{}});
    addLog('Staff hired',`${name} joins the staff roster, unassigned. Base wage: 2 gp/day when assigned.`);render();save();return '';
  };
  staffDismiss=function(id){const st=game.staffMembers.find(s=>s.id===id);if(!st||!confirm(`Dismiss ${st.name}?${assigned(st)?` Their slot at ${staffLocation(st)} will become vacant.`:''}`))return;game.staffMembers=game.staffMembers.filter(s=>s!==st);addLog('Staff departure',`${st.name} leaves the guild staff.`);render();save()};
  renderStaffTab=function(){
    const staff=game.staffMembers||[],targets=staffTargets(),full=staff.length>=staffCap();
    document.getElementById('staff-cap-label').textContent=`${staff.length} / ${staffCap()} staff`;
    document.getElementById('staff-wage-summary').textContent=`Daily wages: ${staffWages()} gp · ${staff.filter(st=>!assigned(st)).length} unassigned`;
    document.getElementById('staff-profession').innerHTML=`<section aria-labelledby="staff-recruit-title"><h3 id="staff-recruit-title">Recruit staff</h3><button class="btn secondary" id="hire-general-staff" ${full?'disabled':''}>Hire staff · 2 gp/day when assigned</button>${full?`<p class="small muted">Staff limit reached (${staff.length}/${staffCap()}). Upgrade the Guild Hall to recruit more.</p>`:''}</section><div class="divider"></div><section aria-labelledby="staff-vacancies-title"><h3 id="staff-vacancies-title">Building vacancies</h3><p>Assign someone from your roster. Staff assigned elsewhere can move here without being hired again.</p>${targets.map((target,index)=>{
      const occupied=v9StaffOf(target.uid).length,free=Math.max(0,1-occupied),skill=skills[target.key];
      const candidates=staff.map((st,i)=>({st,i})).filter(({st})=>st.buildingUid!==target.uid).sort((a,b)=>Number(assigned(a.st))-Number(assigned(b.st)));
      return `<div class="building staff-vacancy"><div class="staff-vacancy-summary"><strong>${esc(target.uid==='warehouse'?'Warehouse':v9InstLabel(target))}</strong><div class="small muted">${occupied}/1 staff · ${free} available · Trains ${esc(skill)}</div></div>${free?`<div class="staff-vacancy-controls"><label>Existing staff<select data-vacancy-index="${index}" aria-label="Assign staff to ${esc(target.uid==='warehouse'?'Warehouse':v9InstLabel(target))}" ${!candidates.length?'disabled':''}><option value="">Select staff</option>${candidates.map(({st,i})=>`<option value="${i}">${esc(st.name)} · ${esc(staffLocation(st))} · ${esc(skill)} Lv ${staffSkillLevel(st.professionXP[skill]||0)} · ${st.wage} gp/day base</option>`).join('')}</select></label><button class="btn secondary" data-fill-vacancy="${index}" disabled>Assign staff</button>${!candidates.length?`<p class="small muted">${full?'No other staff available. Upgrade the Guild Hall to recruit more staff.':'Hire staff above to fill this vacancy.'}</p>`:''}</div>`:'<span class="pill">Fully staffed</span>'}</div>`;
    }).join('')||'<p class="small muted">Complete a building to create assignment slots.</p>'}</section>`;
    document.getElementById('hire-general-staff').onclick=()=>hireStaff();
    document.querySelectorAll('[data-vacancy-index]').forEach(select=>{const index=Number(select.dataset.vacancyIndex),button=document.querySelector(`[data-fill-vacancy="${index}"]`);select.onchange=()=>{button.disabled=select.value===''};button.onclick=()=>{const st=staff[Number(select.value)];if(select.value!==''&&st&&v9AssignStaff(st.id,targets[index].uid)){alert('That building has no available staff slot.');render()}}});
    document.getElementById('staff-roster').innerHTML=game.staffMembers.map((st,index)=>{
      const options=targets.filter(i=>i.uid===st.buildingUid||v9StaffOf(i.uid).length<1);
      const progress=Object.entries(skills).map(([key,skill])=>{
        const xp=Number(st.professionXP[skill])||0,level=staffSkillLevel(xp),toward=xp-thresholds[level],need=thresholds[level+1]-thresholds[level];
        return `<div class="building"><div><strong>${skill} · Level ${level}${st.buildingKey===key?' · Training here':''}</strong><div class="small muted">${level===10?`Mastered · ${xp} total practice`:`${toward}/${need} practice toward Level ${level+1} · ${xp} total`}</div><p>${esc(staffUnlockText(key,level))}${level<10?`<br>Next: ${esc(staffUnlockText(key,level+1))}`:''}</p></div></div>`;
      }).join('');
      return `<article class="card"><h3>${esc(st.name)}</h3>${st.race?`<div class="small muted">${esc(st.race)}</div>`:''}<p>${staffPay(st)} gp/day current wage (${st.wage} gp/day base) · ${esc(staffLocation(st))} · Earn 1 practice per working day and at most 1 service award per skill per day.</p><label>Assignment <select data-staff-index="${index}"><option value="">Unassigned</option>${options.map(i=>`<option value="${esc(i.uid)}" ${i.uid===st.buildingUid?'selected':''}>${esc(i.uid==='warehouse'?'Warehouse':v9InstLabel(i))} · ${v9StaffOf(i.uid).length}/1 staff</option>`).join('')}</select></label><details><summary>Skills and next benefits</summary>${progress}</details><button class="btn ghost" data-dismiss-index="${index}">Dismiss</button></article>`;
    }).join('')||'<div class="empty">No staff hired yet. Recruit staff, then assign them to a building vacancy.</div>';
    document.querySelectorAll('[data-staff-index]').forEach(el=>el.onchange=()=>{const st=game.staffMembers[Number(el.dataset.staffIndex)];if(!el.value){st.buildingUid=null;st.buildingKey=null;render();save()}else if(v9AssignStaff(st.id,el.value)){alert('That building has no available staff slot.');render()}});
    document.querySelectorAll('[data-dismiss-index]').forEach(el=>el.onclick=()=>staffDismiss(game.staffMembers[Number(el.dataset.dismissIndex)].id));
  };
  v9KitchenDay=function(){};
  const oldQuestReport=queueQuestReport;queueQuestReport=function(){const before=game.pendingReports.length;const result=oldQuestReport.apply(this,arguments);if(game.pendingReports.length>before&&buildingOperational('waystation'))practiceStaff('waystation');return result};
  const oldTreat=treatWound;treatWound=function(id){const ok=oldTreat(id);if(ok){practiceStaff('infirmary');save()}return ok};
  const oldTrainTick=v9TrainTick;v9TrainTick=function(h){const days=h.training?.days;oldTrainTick(h);if(h.training&&h.training.days<days)practiceStaff('trainingHall')};

  // Only exploration discoveries grant market routes, including the starting town.
  const oldRoutes=tradeDestinations;
  tradeDestinations=function(){const legacy=oldRoutes();return V9_WORLD.locations.filter(l=>['town','city'].includes(l.type)&&v9Known(l.id)).map(l=>({...legacy.find(d=>d.id===l.id),id:l.id,name:l.name,region:l.zone,dc:legacy.find(d=>d.id===l.id)?.dc||10+l.ring*2,rate:legacy.find(d=>d.id===l.id)?.rate||1+l.ring*.15,repRate:1+l.ring*.2,unlock:0,desc:l.flavour}))};
  const oldTrading=renderTrading,oldDispatch=dispatchTrade;
  function storeLevel(){return staffProfessionLevel(buildingStaff('warehouse'))}
  function danger(route){return Math.max(6,route.dc-WL_BALANCE.supportBonus(storeLevel())-v9RouteDcCut())}
  function offers(route){
    const loc=V9_LOC[route.id],index=V9_WORLD.locations.indexOf(loc),groups=[['Copper Ore','Timber','Light Leather'],['Peacebloom','Wool Cloth','Meat'],['Silver Ore','Medium Leather','Kingsblood'],['Seasoned Timber','Silk Cloth','Flawless Gem']];
    return [...new Set([...groups[(index+(loc.ring<2?2:4))%(loc.ring<2?2:4)],...(loc.type==='city'&&loc.ring>=4?['Mithril Ore','Arcane Thread']:[])])].map(name=>({name,price:WL_BALANCE.marketPrice(tradeValues[name]||2,route.rate),stock:WL_BALANCE.marketStock(loc.ring)}));
  }
  function stock(route,offer){const market=game.marketStock||(game.marketStock={});if(market.day!==game.day){market.day=game.day;market.used={}}return offer.stock-(market.used[route.id+':'+offer.name]||0)}
  renderTrading=function(){
    const routes=tradeDestinations();if(!routes.some(r=>r.id===selectedTradeRoute))selectedTradeRoute=routes[0]?.id;
    oldTrading();
    document.querySelectorAll('#trade-destinations .card').forEach((el,i)=>{const pill=el.querySelector('.pill');if(pill)pill.textContent=`Danger DC ${danger(routes[i])}`});
    const route=routes.find(r=>r.id===selectedTradeRoute);if(!route)return;
    document.getElementById('trade-route-risk').textContent=`Danger DC ${danger(route)} · ${v9ConvoyLabel(route)}`;
    let root=document.getElementById('inbound-market');if(!root){root=document.createElement('article');root.id='inbound-market';root.className='card';document.getElementById('trading').appendChild(root)}
    root.innerHTML=`<h3>Inbound market convoy · ${esc(route.name)}</h3><p>Buy supplies for crafting or resale. Stock refreshes each game day. Payment and stock are committed at dispatch; an ambush can lose cargo. Select the escort above. Travel ${v9ConvoyLabel(route)} · Danger DC ${danger(route)}.</p><label>Goods <select id="market-good">${offers(route).map(o=>`<option value="${esc(o.name)}">${esc(o.name)} · ${o.price} gp each · ${stock(route,o)} in stock</option>`).join('')}</select></label> <label>Quantity <input id="market-quantity" type="number" min="1" value="1"></label><p id="market-cost"></p><button class="btn" id="market-buy">Dispatch inbound convoy</button>`;
    function preview(){const offer=offers(route).find(o=>o.name===document.getElementById('market-good').value),n=Number(document.getElementById('market-quantity').value);document.getElementById('market-cost').textContent=`Total ${offer.price*n} gp · ${game.gold} gp treasury · ${stock(route,offer)} available · ${v9ConvoyLabel(route)} · Danger DC ${danger(route)}`}
    root.querySelectorAll('input,select').forEach(el=>el.onchange=preview);document.getElementById('market-buy').onclick=dispatchInbound;preview();
  };
  // Keep existing outbound casualty, travel, payout and wage-sharing rules.
  dispatchTrade=function(){if(!tradeDestinations().some(r=>r.id===selectedTradeRoute))return alert('Explore this location first.');return oldDispatch.apply(this,arguments)};
  window.dispatchInbound=function(){
    const route=tradeDestinations().find(r=>r.id===selectedTradeRoute);if(!route||!buildingOperational('warehouse'))return alert('Assign staff to the Warehouse and choose a discovered market.');
    const offer=offers(route).find(o=>o.name===document.getElementById('market-good').value),n=Number(document.getElementById('market-quantity').value),ids=[...new Set(game.tradeParty||[])].filter(id=>{const h=purse(id);return h&&h.ready&&tbwConvoyEligible(h)});
    if(!offer||!Number.isSafeInteger(n)||n<1||n>stock(route,offer)||!ids.length||game.gold<offer.price*n)return alert('Choose available stock, enough gold, and a ready escort.');
    const party=ids.map(purse),dc=danger(route),checks=party.map(h=>{const roll=1+Math.floor(Math.random()*20),modifier=readiness(h)+(h.id==='player'?0:(h.rank||0)>0?1:0)-(h.wound&&h.wound.tier<3?WOUND_TIERS[h.wound.tier].pen:0);return {id:h.id,name:h.name,roll,modifier,total:roll+modifier,success:roll+modifier>=dc,critical:roll===1}}),success=checks.filter(c=>c.success).length,outcome=success===party.length?'Success':success>=Math.ceil(party.length*2/3)?'Partial Success':'Failure',qty=outcome==='Success'?n:outcome==='Partial Success'?Math.floor(n*success/party.length):0,TW=tbwConvoyCasualties(party,checks,outcome);
    game.gold-=offer.price*n;game.marketStock.used[route.id+':'+offer.name]=(game.marketStock.used[route.id+':'+offer.name]||0)+n;
    party.forEach(h=>{h.ready=false;h.lastQuestDay=game.day});
    game.pendingReports.push({kind:'trade',inboundGoods:{name:offer.name,count:qty},durMs:v9ConvoyMs(route),dueAt:Date.now()+v9ConvoyMs(route),dueDay:game.day+1,dispatchedDay:game.day,title:`Inbound convoy from ${route.name}`,outcome,summary:`${qty}/${n} ${offer.name} delivered from ${route.name}; ${n*offer.price} gp paid. Danger DC ${dc}.`,partyIds:ids,payout:0,rep:0,casualties:TW.dead,wounds:TW.wounds,near:TW.near,tbwNotes:TW.notes,rolls:checks,growthAwards:[]});
    game.tradeParty=[];addLog('Inbound convoy underway',`${n} ${offer.name} purchased for ${n*offer.price} gp. Arrival in ${v9ConvoyLabel(route)}.`);render();save();
  };
  const oldApply=tbwApplyReport;tbwApplyReport=function(r){const result=oldApply(r);if(r.inboundGoods&&!r.marketDelivered){r.marketDelivered=true;const {name,count}=r.inboundGoods;game.materials[name]=(game.materials[name]||0)+count}return result};
  staffMigrate(game);render();
})();
