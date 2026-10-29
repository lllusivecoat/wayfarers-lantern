/* Mixed manifests, shared escort checks and saved relationships with known markets. */
(() => {
  'use strict';
  const tiers=[
    {name:'New contact',points:0}, {name:'Familiar',points:20},
    {name:'Trusted',points:60}, {name:'Trade partner',points:140},
    {name:'Close ally',points:260}
  ];
  const minutes={'booty-bay':10,gromgol:15,darkshire:20,'sentinel-hill':22,stonard:24,
    ratchet:25,nethergarde:28,stormwind:30,orgrimmar:35,lakeshire:32,gadgetzan:38,
    theramore:34,ironforge:40,'thunder-bluff':42,undercity:50,'lights-hope':48};
  const currentRoute=()=>tradeDestinations().find(r=>r.id===selectedTradeRoute);
  const capacity=()=>WL_BALANCE.convoyCapacity(party().length);
  const load=cargo=>cargo.reduce((n,c)=>n+c.count,0);
  const value=cargo=>cargo.reduce((n,c)=>n+(tradeValues[c.material]||2)*c.count,0);
  const manifest=cargo=>cargo.map(c=>`${c.count} ${c.material}`).join(', ');
  function relationship(id){
    game.tradeRelations=game.tradeRelations||{};
    const r=game.tradeRelations[id]||(game.tradeRelations[id]={points:0});
    r.points=Math.max(0,Math.min(260,Number(r.points)||0));
    const level=tiers.reduce((best,t,i)=>r.points>=t.points?i:best,0);
    return {...r,level,name:tiers[level].name,discount:level*.01,stock:level*2,
      timeCut:level*.05,dangerCut:Math.floor(level/2),next:tiers[level+1]};
  }
  function danger(route){return Math.max(6,route.dc-(buildingStaff('warehouse')?staffSkillBonus('warehouse'):0)-v9RouteDcCut()-relationship(route.id).dangerCut)}
  v9ConvoyMins=function(route){
    const id=typeof route==='string'?route:route?.id;
    const base=minutes[id]||10+8*(V9_LOC[id]?.ring||0);
    return Math.max(8,Math.ceil(base*(1-relationship(id).timeCut)));
  };
  function offers(route){
    const loc=V9_LOC[route.id],index=V9_WORLD.locations.indexOf(loc),rel=relationship(route.id);
    const groups=[['Copper Ore','Timber','Light Leather'],['Peacebloom','Wool Cloth','Meat'],
      ['Silver Ore','Medium Leather','Kingsblood'],['Seasoned Timber','Silk Cloth','Flawless Gem']];
    const names=[...new Set([...groups[index%(loc.ring<2?2:4)],
      ...(loc.type==='city'&&loc.ring>=4?['Mithril Ore','Arcane Thread']:[])])];
    const market=game.marketStock||(game.marketStock={});
    if(market.day!==game.day){market.day=game.day;market.used={}}
    market.used=market.used||{};
    return names.map(name=>({material:name,price:WL_BALANCE.marketPrice(tradeValues[name]||2,route.rate,rel.discount),
      stock:Math.max(0,WL_BALANCE.marketStock(loc.ring)+rel.stock-(market.used[route.id+':'+name]||0))}));
  }
  function cart(route){
    game.marketCargo=game.marketCargo||{};
    if(!Object.hasOwn(game.marketCargo,route.id)){
      const first=offers(route).find(o=>o.stock>0);
      game.marketCargo[route.id]=first?{[first.material]:1}:{};
    }
    return Object.entries(game.marketCargo[route.id]).map(([material,count])=>({material,count:Number(count)}));
  }
  function party(){return [...new Set(game.tradeParty||[])].map(purse).filter(h=>h&&h.ready&&tbwConvoyEligible(h))}
  function modifier(h){return readiness(h)+(h.id!=='player'&&(h.rank||0)>0?1:0)-(h.wound&&h.wound.tier<3?WOUND_TIERS[h.wound.tier].pen:0)}
  function escortProfile(heroes){
    const lead=heroes.reduce((best,h)=>!best||modifier(h)>modifier(best)?h:best,null);
    return {lead,modifier:lead?modifier(lead):0,support:WL_BALANCE.convoySupport(heroes.length)};
  }
  function odds(heroes,route){
    if(!heroes.length)return 'Choose a ready escort.';
    const profile=escortProfile(heroes),dc=danger(route);let full=0,partial=0;
    for(let roll=1;roll<=20;roll++){
      const fraction=WL_BALANCE.convoyFraction(roll+profile.modifier+profile.support,dc);
      if(fraction===1)full++;else if(fraction>0)partial++;
    }
    return `Lead: ${profile.lead.name} · d20 ${v9SignSp(profile.modifier)} + ${profile.support} support · ${full*5}% full delivery, ${partial*5}% partial. Up to four additional escorts give +1 each; weaker escorts never lower delivery odds. Includes equipped readiness supplies; they are consumed at dispatch.`;
  }
  function validCargo(cargo,available){return cargo.length>0&&cargo.every(c=>Number.isSafeInteger(c.count)&&c.count>0&&c.count<=available(c.material))}
  function blockers(route,cargo,heroes,purchase=null){
    const reasons=[];
    if(!route)reasons.push('Choose a discovered town or city.');
    if(!heroes.length)reasons.push((game.tradeParty||[]).length?'Your selected escorts are unavailable. Choose ready, living heroes without Grievous wounds.':'Select at least one ready convoy member above.');
    if(!cargo.length)reasons.push(purchase?'Select goods to buy and their quantities.':'Select warehouse goods to sell and their quantities.');
    const goods=purchase?.goods;
    for(const c of cargo){
      if(!Number.isSafeInteger(c.count)||c.count<1){reasons.push(`${c.material}: enter a positive whole quantity.`);continue}
      const available=purchase?(goods.find(o=>o.material===c.material)?.stock||0):Number(game.materials[c.material]||0);
      if(c.count>available)reasons.push(`${c.material}: ${c.count} selected, but only ${available} ${purchase?'in market stock':'in warehouse storage'}.`);
    }
    if(heroes.length&&load(cargo)>capacity())reasons.push(`Cargo exceeds convoy capacity: ${load(cargo)}/${capacity()} items. Reduce quantities or select more members (20 items each).`);
    if(purchase?.valid&&purchase.total>game.gold)reasons.push(`Not enough guild gold: need ${purchase.total} gp (${purchase.goodsCost} goods + ${purchase.escortPay} escort pay), have ${game.gold} gp.`);
    return reasons;
  }
  function showBlockers(button,reasons){
    if(!button)return;
    const id=button.id+'-reason';let notice=document.getElementById(id);
    if(!notice){notice=document.createElement('p');notice.id=id;notice.className='notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.style.whiteSpace='pre-line';notice.style.flexBasis='100%';notice.style.maxWidth='100%';button.insertAdjacentElement('afterend',notice)}
    notice.hidden=!reasons.length;notice.textContent=reasons.length?'Cannot dispatch:\n'+reasons.join('\n'):'';
    button.disabled=!!reasons.length;button.title=reasons.join(' ');button.setAttribute('aria-describedby',id);
  }
  function inboundQuote(route){
    const cargo=cart(route),goods=offers(route),heroes=party();
    const valid=validCargo(cargo,name=>goods.find(o=>o.material===name)?.stock||0);
    const goodsCost=valid?cargo.reduce((n,c)=>n+c.count*goods.find(o=>o.material===c.material).price,0):0;
    const escortPay=2*heroes.length;
    return {cargo,goods,heroes,valid,goodsCost,escortPay,total:goodsCost+escortPay};
  }
  tradeQuote=function(route,cargo,partySize){
    const rate=route.rate*(1+(buildingStaff('warehouse')?WL_STAFF.service('warehouse').sale:0))*v9TradeMul();
    const gross=Math.floor(value(cargo)*rate),memberCut=WL_BALANCE.convoyPay(gross,partySize);
    return {rate,gross,memberCut,guildGold:gross-memberCut};
  };
  updateTradePreview=function(){
    const route=currentRoute(),cargo=tradeCargo(),heroes=party();
    const valid=validCargo(cargo,name=>Number(game.materials[name]||0)),units=load(cargo);
    const button=document.getElementById('trade-dispatch'),root=document.getElementById('trade-preview');
    showBlockers(button,blockers(route,cargo,heroes));
    if(root)root.textContent=!route?'Choose a discovered market.':!valid?'Select cargo with whole quantities within warehouse stock.':
      `${manifest(cargo)} · Cargo ${units}/${capacity()} units${units>capacity()?' — over capacity':''} · Full-delivery estimate: ${tradeQuote(route,cargo,heroes.length).gross} gp gross, ${tradeQuote(route,cargo,heroes.length).memberCut} gp escort pay, ${tradeQuote(route,cargo,heroes.length).guildGold} gp to treasury · Travel ${v9ConvoyLabel(route)} · Danger DC ${danger(route)}. An ambush may lose cargo; partial delivery keeps 75% of each line, rounded down.`;
    const note=document.getElementById('trade-party-note');if(note&&route)note.textContent=`${heroes.length} selected · Convoy capacity ${capacity()} items (20 per member) · ${odds(heroes,route)} ${buildingStaff('warehouse')?'Warehouse staff bonuses applied.':'Warehouse unstaffed: no Storekeeping bonuses.'}`;
  };
  function previewInbound(route){
    const q=inboundQuote(route),units=load(q.cargo),root=document.getElementById('market-cost');
    if(root)root.textContent=`${q.valid?`Total ${q.total} gp (${q.goodsCost} goods + ${q.escortPay} escort pay) · ${game.gold} gp treasury`:'Choose whole quantities within available market stock.'} · Cargo ${units}/${capacity()} units${units>capacity()?' — over capacity':''} · Travel ${v9ConvoyLabel(route)} · Danger DC ${danger(route)}.`;
    const button=document.getElementById('market-buy');
    showBlockers(button,blockers(route,q.cargo,q.heroes,q));
  }
  const oldTrading=renderTrading;
  renderTrading=function(){
    const routes=tradeDestinations();
    if(!routes.some(r=>r.id===selectedTradeRoute))selectedTradeRoute=routes[0]?.id;
    // Old saves always know Booty Bay; guard imports with no discoveries too.
    if(!routes.length){document.getElementById('trade-destinations').textContent='Explore to discover a market.';return}
    oldTrading();const route=currentRoute();
    document.querySelectorAll('#trade-destinations .card').forEach((el,i)=>{
      el.querySelector('.pill').textContent=`Danger DC ${danger(routes[i])}`;
      const rel=relationship(routes[i].id),p=document.createElement('p');p.className='small trade-relationship';
      p.textContent=`${rel.name} · ${rel.points}/260 relationship`;el.appendChild(p);
    });
    document.getElementById('trade-route-risk').textContent=`Danger DC ${danger(route)} · ${v9ConvoyLabel(route)}`;
    let root=document.getElementById('inbound-market');
    if(!root){root=document.createElement('article');root.id='inbound-market';root.className='card';document.getElementById('trading').appendChild(root)}
    const rel=relationship(route.id),cargo=cart(route),goods=offers(route);
    root.innerHTML=`<h3>Inbound market convoy · ${tbwEsc(route.name)}</h3>
      <div class="trade-relationship"><strong>${rel.name} · ${rel.points}${rel.next?` / ${rel.next.points}`:' / 260'} relationship</strong>
      <p>${rel.level}% purchase discount · +${rel.stock} stock per good · ${Math.round(rel.timeCut*100)}% faster travel · −${rel.dangerCut} danger.</p>
      <p>Earn 1 relationship point per 10 gp of delivered goods' base value, up to 10 points here per game day. Purchases and sales both count on return.</p>
      <details><summary>Relationship levels and bonuses</summary><ul>${tiers.map((t,i)=>`<li>${t.name} · ${t.points} points: ${i}% discount, +${i*2} stock, ${i*5}% faster, −${Math.floor(i/2)} danger.</li>`).join('')}</ul></details></div>
      <p>Select several goods for one shipment. Your convoy can carry ${capacity()} items (20 per selected member). Select escorts above; goods and escort pay are charged at dispatch.</p>
      <details><summary>Cargo limits, stock and ambushes</summary><p>Warehouse storage is unlimited. Each ready convoy member carries 20 items: 1 member carries 20, 2 carry 40, and 5 carry 100. Additional escorts also improve safety, up to +4 support. Stock refreshes each game day. An ambush may lose cargo: partial delivery keeps 75% of each line, rounded down; failure loses the entire shipment.</p></details>
      <div id="inbound-cargo">${goods.map((o,i)=>{const selected=cargo.find(c=>c.material===o.material);return `<div class="trade-cargo-row"><label><input type="checkbox" data-market-select="${i}" ${selected?'checked':''} ${!o.stock&&!selected?'disabled':''}><span>${tbwEsc(o.material)}<small>${o.price} gp each · ${o.stock} in stock</small></span></label><label class="trade-cargo-quantity">Quantity<input aria-label="Buy ${tbwEsc(o.material)} quantity" data-market-quantity="${i}" type="number" min="1" max="${o.stock}" step="1" value="${selected?tbwEsc(selected.count):1}" ${!selected?'disabled':''}></label></div>`}).join('')}</div>
      <p id="market-cost" role="status"></p><button class="btn" id="market-buy">Dispatch inbound convoy</button>`;
    const change=(i,on,n)=>{const name=goods[i].material;if(on)game.marketCargo[route.id][name]=n;else delete game.marketCargo[route.id][name];previewInbound(route);save()};
    root.querySelectorAll('[data-market-select]').forEach(box=>box.onchange=()=>{const i=Number(box.dataset.marketSelect),input=root.querySelector(`[data-market-quantity="${i}"]`);input.disabled=!box.checked;change(i,box.checked,Number(input.value))});
    root.querySelectorAll('[data-market-quantity]').forEach(input=>input.oninput=()=>change(Number(input.dataset.marketQuantity),true,Number(input.value)));
    document.getElementById('market-buy').onclick=dispatchInbound;previewInbound(route);
  };
  function rollConvoy(heroes,route){
    const profile=escortProfile(heroes),roll=1+Math.floor(Math.random()*20),dc=danger(route);
    const total=roll+profile.modifier+profile.support,fraction=WL_BALANCE.convoyFraction(total,dc);
    const outcome=fraction===1?'Success':fraction>0?'Partial Success':'Failure';
    const checks=heroes.map(h=>({id:h.id,name:h.name,roll,modifier:profile.modifier+profile.support,total,
      success:fraction===1,critical:roll===1&&h.id===profile.lead.id,convoyLead:h.id===profile.lead.id}));
    const losses=tbwConvoyCasualties(heroes,checks,outcome);
    return {fraction,outcome,checks,losses,description:`${profile.lead.name} leads: d20 ${roll} ${v9SignSp(profile.modifier)} + ${profile.support} support = ${total} vs DC ${dc}.`};
  }
  function queue(route,heroes,result,fields){
    const duration=v9ConvoyMs(route),tw=result.losses;
    heroes.forEach(h=>{h.ready=false;h.lastQuestDay=game.day});
    const r={kind:'trade',tradeVersion:2,routeId:route.id,durMs:duration,dueAt:Date.now()+duration,dueDay:game.day+1,
      dispatchedDay:game.day,outcome:result.outcome,deliveredFraction:result.fraction,partyIds:heroes.map(h=>h.id),
      casualties:tw.dead,wounds:tw.wounds,near:tw.near,tbwNotes:tw.notes,rolls:result.checks,growthAwards:[],rep:0,...fields};
    game.pendingReports.push(r);game.tradeParty=[];addLog(r.title,`Cargo committed. Arrival in ${v9ConvoyLabel(route)}. ${r.summary}`);render();save();return r;
  }
  dispatchTrade=function(){
    const route=currentRoute(),cargo=tradeCargo(),heroes=party();
    const reasons=blockers(route,cargo,heroes);if(reasons.length){updateTradePreview();return alert(reasons.join('\n'))}
    const suppliesUsed=consumeExpeditionSupplies(heroes),result=rollConvoy(heroes,route);
    const delivered=cargo.map(c=>({...c,count:Math.floor(c.count*result.fraction)})),quote=tradeQuote(route,delivered,heroes.length);
    cargo.forEach(c=>{game.materials[c.material]-=c.count;if(!game.materials[c.material])delete game.materials[c.material]});
    game.tradeCargo={};
    return queue(route,heroes,result,{title:`Trade convoy to ${route.name}`,suppliesUsed,cargo,deliveredCargo:delivered,
      relationshipValue:value(delivered),payout:quote.guildGold,memberCut:quote.memberCut,
      rep:quote.gross?Math.max(1,Math.floor(quote.gross/30*route.repRate)):0,
      summary:`Committed cargo: ${manifest(cargo)}. Delivered: ${manifest(delivered)}. ${quote.gross} gp gross; ${quote.guildGold} gp to treasury and ${quote.memberCut} gp escort pay. ${result.description}`});
  };
  window.dispatchInbound=function(){
    const route=currentRoute();if(!route)return alert('Choose a discovered market.');
    const q=inboundQuote(route);
    const reasons=blockers(route,q.cargo,q.heroes,q);if(reasons.length){previewInbound(route);return alert(reasons.join('\n'))}
    const suppliesUsed=consumeExpeditionSupplies(q.heroes),result=rollConvoy(q.heroes,route);
    const delivered=q.cargo.map(c=>({...c,count:Math.floor(c.count*result.fraction)}));
    game.gold-=q.total;
    q.cargo.forEach(c=>{const key=route.id+':'+c.material;game.marketStock.used[key]=(game.marketStock.used[key]||0)+c.count});
    game.marketCargo[route.id]={};
    return queue(route,q.heroes,result,{title:`Inbound convoy from ${route.name}`,suppliesUsed,
      purchasedCargo:q.cargo,inboundCargo:delivered,
      // Preserve the legacy single-line report shape for old report consumers.
      ...(delivered.length===1?{inboundGoods:{name:delivered[0].material,count:delivered[0].count}}:{}),
      relationshipValue:value(delivered),purchaseCost:q.goodsCost,escortCost:q.escortPay,payout:0,memberCut:q.escortPay,
      summary:`Bought: ${manifest(q.cargo)}. Delivered: ${manifest(delivered)}. ${q.total} gp paid (${q.goodsCost} goods + ${q.escortPay} escort pay). ${result.description}`});
  };
  const oldApply=tbwApplyReport;
  tbwApplyReport=function(r){
    const result=oldApply.apply(this,arguments);
    if(!r.marketDelivered&&(r.inboundCargo||r.inboundGoods)){
      const delivered=r.inboundCargo||[{material:r.inboundGoods.name,count:r.inboundGoods.count}];
      delivered.forEach(c=>{if(c.count>0)game.materials[c.material]=(game.materials[c.material]||0)+c.count});r.marketDelivered=true;
    }
    if(r.tradeVersion===2&&!r.relationshipAwarded){
      r.relationshipAwarded=true;
      if(r.relationshipValue>0&&V9_LOC[r.routeId]){
        const before=relationship(r.routeId),record=game.tradeRelations[r.routeId];
        if(record.awardDay!==game.day){record.awardDay=game.day;record.dailyValue=0}
        const previous=Math.min(10,Math.floor((record.dailyValue||0)/10));
        record.dailyValue=Math.min(100,(record.dailyValue||0)+r.relationshipValue);
        record.points=Math.min(260,record.points+Math.min(10,Math.floor(record.dailyValue/10))-previous);
        const after=relationship(r.routeId);r.relationshipPoints=after.points-before.points;
        r.summary+=` ${V9_LOC[r.routeId].name} relationship +${r.relationshipPoints} (${after.name}, ${after.points}/260).`;
      }
    }
    return result;
  };
  const style=document.createElement('style');style.textContent=`
    #inbound-cargo .trade-cargo-row{margin:16px 0;padding:16px 0;gap:16px}
    #inbound-cargo .trade-cargo-row>label{margin:0;min-width:0}
    #inbound-cargo input[type=checkbox]{display:inline-block;width:22px;min-height:22px;margin:0 10px 0 0;flex-shrink:0}
    #inbound-cargo small{display:block;line-height:1.7;margin-top:8px}
    #inbound-market .trade-relationship{padding:16px 0;margin:16px 0;border-bottom:1px solid var(--line)}
    #inbound-market .trade-relationship p{margin:12px 0;line-height:1.7}
    #inbound-market details li{margin:12px 0;line-height:1.7}
    #trade-party-note{line-height:1.8;flex:1 1 260px} #trade-preview{line-height:1.9;margin:24px 0}
    #trade-party-note+button{min-width:180px;flex-shrink:0}
    #trading .trade-dispatch-row{flex-wrap:wrap;gap:18px;align-items:center}
    @media(max-width:600px){#inbound-cargo .trade-cargo-row{display:flex;flex-direction:column;align-items:stretch}#inbound-cargo .trade-cargo-row>label:first-child{display:flex;align-items:center}#inbound-cargo .trade-cargo-quantity{width:100%}#trade-party-note+button{width:100%}}
  `;document.head.appendChild(style);
  window.WL_TRADE=Object.freeze({relationship,offers,capacity,escortProfile,odds,danger,tiers});
  renderTrading();save();
})();
