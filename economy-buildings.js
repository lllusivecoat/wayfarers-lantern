/* Unique late-Hall economic services. Rewards are sealed at dispatch. */
(() => {
 const keys=['supplyDepot','contractsOffice','adventurersEndowment'];
 const costs={supplyDepot:[600,450,750,1200,1800],contractsOffice:[900,650,1000,1600,2400],adventurersEndowment:[1500,1000,1600,2400,3600]};
 function active(key){return v9Inst(key).find(i=>v9StaffOf(i.uid).length&&!projectForBuilding(i.uid))}
 function skill(key){const i=active(key);return i?staffProfessionLevel(v9StaffOf(i.uid)[0]):0}
 function level(key){return active(key)?.level||0}
 function depot(){return level('supplyDepot')*.10+Math.min(5,skill('supplyDepot'))*.01}
 function office(){return level('contractsOffice')*.04+skill('contractsOffice')*.005}
 function discount(key){return key==='supplyDepot'?Math.max(0,skill(key)-5)*.04:key==='adventurersEndowment'?skill(key)*.02:0}
 const cost=v9UpCost;v9UpCost=function(key,to){return costs[key]?.[to-1]??cost(key,to)};
 const upkeep=buildingUpkeep;buildingUpkeep=function(){let total=upkeep();for(const key of keys){const i=active(key);if(i)total-=(v9Def(key).upkeep*i.level)*discount(key)}return Math.ceil(total-1e-9)};
 const payout=v9PayoutMul;v9PayoutMul=function(q){return payout(q)+(!q.persistent&&q.kind!=='Gathering'&&q.reward>0?office():0)};
 function snapshot(q){return {version:1,depot:depot(),expertise:q.kind==='Gathering'?gatheringExpertise(q.profession).bonus:0,logistician:active('supplyDepot')?v9StaffOf(active('supplyDepot').uid)[0].id:null}}
 function bonus(material,base,rate){if(!base||!rate)return base;game.depotMaterialCredits=game.depotMaterialCredits||{};const amount=base*rate+(game.depotMaterialCredits[material]||0),whole=Math.floor(amount+1e-9);game.depotMaterialCredits[material]=Math.max(0,amount-whole);return base+whole}
 function settle(r){if(r.kind!=='operation'||r.economySettled||!r.economySupport)return;r.economySettled=true;
  const support=r.economySupport,materialReturn=r.resourceQty>0||(r.lootDrops||[]).some(d=>d.count>0);
  if(r.resourceQty>0){const old=r.resourceQty,base=r.questKind==='Gathering'?r.resourceBaseQty:old;
   // Without a Depot preserve the established expertise-only rounding.
   r.resourceQty=support.depot?bonus(r.resource,base,support.depot+support.expertise):old;
   r.extendedSummary=(r.extendedSummary||'').replace(`Recovered ${old} ${r.resource}.`,`Recovered ${r.resourceQty} ${r.resource}.`);
  }
  const additions=[];for(const d of r.lootDrops||[]){const old=d.count;d.count=bonus(d.material,old,support.depot);if(d.count!==old){additions.push(`${d.material}: ${d.count} total`);const escaped=d.material.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),pattern=new RegExp('\\b'+old+' '+escaped+'(?=[.,; \u00b7]|$)','g');for(const field of ['summary','extendedSummary'])r[field]=(r[field]||'').replace(pattern,d.count+' '+d.material)}}
  if(support.depot&&materialReturn){const text=` Supply Depot: +${Math.round(support.depot*100)}% material support${additions.length?' · '+additions.join('; '):''}. Fractional bonus materials carry forward.`;r.extendedSummary=(r.extendedSummary||'')+text;r.summary=(r.summary||'')+text}
  if(!['Success','Exceptional Success'].includes(r.outcome))return;
  if(materialReturn&&support.logistician){const st=game.staffMembers.find(s=>s.id===support.logistician&&s.buildingKey==='supplyDepot');
   game.logisticsService=game.logisticsService?.day===game.day?game.logisticsService:{day:game.day,count:0};
   game.logisticsRuns=game.logisticsRuns||{};const run=r.stagePlan?.id;
   if(st&&active('supplyDepot')&&game.logisticsService.count<3&&(!run||!game.logisticsRuns[run])){st.professionXP.Logistics=(Number(st.professionXP.Logistics)||0)+1;game.logisticsService.count++;if(run)game.logisticsRuns[run]=true;r.logisticsPractice=1;r.extendedSummary+=' Logistics: +1 practice.'}
  }
  if(r.payout>0)practiceStaff('contractsOffice',1);
 }
 const work=completeStaffWorkDay;completeStaffWorkDay=function(){const shift=game.staffWorkSnapshot,workers=shift?.workers.filter(w=>keys.includes(w.key))||[];
  if(shift)shift.workers=shift.workers.filter(w=>!keys.includes(w.key));work.apply(this,arguments);
  if(!shift||shift.day!==game.day-1||game.staffCostsPaidDay!==game.day)return;
  for(const w of workers){const st=game.staffMembers.find(s=>s.id===w.id&&s.buildingUid===w.uid);if(!st||!active(w.key)||st.lastWorkDay>=game.day)continue;st.professionXP[staffProfessionForKey(w.key)]=(Number(st.professionXP[staffProfessionForKey(w.key)])||0)+1;st.lastWorkDay=game.day;st.loyalDays=(st.loyalDays||0)+1}
  const i=active('adventurersEndowment');if(!i||game.endowmentPaidDay===game.day||!workers.some(w=>w.uid===i.uid))return;
  game.endowmentPaidDay=game.day;const heroes=[game.player,...game.heroes].filter(h=>h&&!h.dead);const awards=heroes.map(h=>{h.gold=(h.gold||0)+i.level;return {id:h.id,name:h.name,amount:i.level}});
  game.endowmentReport={day:game.day,amount:i.level,total:i.level*awards.length,awards};addLog('Endowment paid',`${i.level} gp to each of ${awards.length} living heroes (${i.level*awards.length} gp sponsored; no treasury deduction).`);
 };
 // The staff tracker already uses the same 0–10 practice thresholds.
 const unlock=staffUnlockText;staffUnlockText=function(key,n){if(key==='supplyDepot')return `Logistics ${n}: +${Math.min(5,n)}% material yield; ${Math.max(0,n-5)*4}% Depot upkeep reduction. Paid workday +1 practice; material successes +1, max 3/day; each world run once.`;if(key==='contractsOffice')return `Negotiation ${n}: +${n*.5}% client gold.`;if(key==='adventurersEndowment')return `Stewardship ${n}: upkeep −${n*2}%.`;return unlock.apply(this,arguments)};
 const card=v9InstCard;v9InstCard=function(i){if(!keys.includes(i.key))return card(i);const b=v9Def(i.key),p=projectForBuilding(i.uid),next=i.level+1,req=buildingUpgradeHall(next,i.key),on=!!active(i.key),effect=i.key==='supplyDepot'?`Material quantities +${Math.round(depot()*100)}% across all quests. Logistics upkeep reduction ${Math.round(discount(i.key)*100)}%.`:i.key==='contractsOffice'?`Client quest gold +${Math.round(office()*1000)/10}% before member cuts.`:`Every living hero receives ${i.level} gp per paid day. Upkeep reduction ${Math.round(discount(i.key)*100)}%.`;
 return `<div class="building v9-bcard"><div><strong>${b.name} · Level ${i.level}</strong><p>${on?effect:'Not operating — assign one worker and finish upgrades.'}</p><p>Upkeep ${Math.ceil(b.upkeep*i.level*(1-discount(i.key)))} gp/day, plus staff wages.</p></div><div class="v9-actions">${p?constructionStatus(p):next<=5?`<button class="btn secondary" onclick="upgradeBuilding('${i.uid}')" ${game.hall<req||game.gold<v9UpCost(i.key,next)?'disabled':''}>${game.hall<req?'Requires Hall Level '+req:'Upgrade · '+v9UpCost(i.key,next)+' gp'}</button>`:'<span>Maximum level</span>'}<button class="btn secondary" onclick="showView('staff')">Assign staff</button><button class="btn ghost" onclick="v9Destroy('${i.uid}')" ${p?'disabled':''}>Destroy</button></div><details><summary>All levels & staff bonuses</summary>${[1,2,3,4,5].map(l=>`<p>Level ${l} · Hall ${buildingUpgradeHall(l,i.key)} · ${costs[i.key][l-1]} gp ${l===1?'build':'upgrade'} · ${b.upkeep*l} gp/day upkeep · ${i.key==='supplyDepot'?l*10+'% yield':i.key==='contractsOffice'?l*4+'% gold':l+' gp per hero/day'}</p>`).join('')}<p>${staffUnlockText(i.key,skill(i.key))}</p></details></div>`};
 const buildings=renderBuildings;renderBuildings=function(){const out=buildings.apply(this,arguments),r=game.endowmentReport;if(r){const panel=document.createElement('details');panel.innerHTML=`<summary>Endowment payments · Day ${r.day} · ${r.total} gp</summary>`;for(const a of r.awards){const p=document.createElement('p');p.textContent=`${a.name}: +${a.amount} gp`;panel.append(p)}document.getElementById('building-list').append(panel)}return out};
 const table=questLootTable;questLootTable=function(q){const rows=table.apply(this,arguments);if(depot()&&q.kind==='Gathering'){const n=Math.max(1,game.selected?.length||q.minParty),base=v9Qty((q.resourceQtyBase+q.rank)*WL_BALANCE.gatheringYieldMultiplier(n),'Success'),total=base+Math.floor(base*(depot()+gatheringExpertise(q.profession).bonus)+(game.depotMaterialCredits?.[q.resource]||0)+1e-9),row=rows.find(row=>row[0]===q.resource);if(row)row[1]=`${total} on success with ${n} member(s), including expertise, Depot and saved fractional credit. +25% base yield per additional member.`}if(depot())rows.push(['Supply Depot',`+${Math.round(depot()*100)}% material quantities on return; adds to gathering expertise. Fractional bonus materials carry forward per resource. Drop chances and final-stage restrictions unchanged.`]);if(!q.persistent&&q.reward>0&&office())rows.push(['Contracts Office',`+${Math.round(office()*1000)/10}% client gold before member cuts. Partial success pays half; no gold is added to guild-funded expeditions.`]);return rows};
 window.WL_ECONOMY_BUILDINGS=Object.freeze({snapshot,settle,depot,office,discount});v9Sync();render();
})();
