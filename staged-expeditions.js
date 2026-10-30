/* Sequential world expeditions. Stage plans and sealed reports survive reloads. */
(() => {
 const cleared=r=>['Success','Exceptional Success'].includes(r.outcome);
 const count=q=>q?.legacyEncounter?1:q?.kind==='World Dungeon'?3:q?.kind==='World Raid'?5:q?.kind==='World Boss'&&(q.world||q.persistent)?2:1;
 const share=(total,i,n)=>Math.floor(total*(i+1)/n)-Math.floor(total*i/n);
 const raidNames={zulgurub:['High Priest Venoxis','High Priestess Jeklik','High Priest Thekal','Jin’do the Hexxer','Hakkar the Soulflayer'],'onyxias-lair':['Onyxia — opening assault','Onyxia — first flight','Onyxia — whelp onslaught','Onyxia — deep breath','Onyxia — final stand'],'molten-core':['Lucifron','Garr','Baron Geddon','Majordomo Executus','Ragnaros'],ahnqiraj:['The Prophet Skeram','Battleguard Sartura','The Twin Emperors','Ouro','C’Thun'],naxxramas:['Anub’Rekhan','Heigan the Unclean','The Four Horsemen','Sapphiron','Kel’Thuzad']};
 function encounters(q){const old=q.encounters||V9_ENCOUNTERS[q.kind]||[],n=count(q),names=raidNames[q.locationId];return Array.from({length:n},(_,i)=>({...old[Math.min(i,old.length-1)],name:names?.[i]||old[Math.min(i,old.length-1)]?.name||`${q.title} — stage ${i+1}`}))}
 for(const [id,names] of Object.entries(raidNames)){const l=V9_LOC[id];if(l?.world){const old=l.world.encounters;l.world.encounters=names.map((name,i)=>({...old[Math.min(i,old.length-1)],name}))}}
 const oldEncs=v9Encs;v9Encs=function(q){const e=oldEncs(q);return !q.stageRun&&count(q)===1&&['World Boss','Dungeon'].includes(q.kind)?e.slice(0,1):e};
 window.worldStageCount=count;
 window.stageShare=share;
 window.stageXP=(q,h,amount)=>q.stageRun?share(Math.ceil(amount*1.15),q.stageIndex,q.stageCount):amount;
 const cost=permanentExpeditionCost;permanentExpeditionCost=function(q,n){return q?.stageRun&&q.stageIndex>0?0:cost(q,n)};
 let continuing=false;
 const consume=consumeExpeditionSupplies;consumeExpeditionSupplies=function(){return continuing?[]:consume.apply(this,arguments)};
 const bonus=bonusLootSpec;bonusLootSpec=function(q){return q.stageRun&&q.stageIndex<q.stageCount-1?null:bonus(q)};
 function stageQuest(run,i){const q=structuredClone(run.quest),n=run.count,last=i===n-1;
 q.stageRun=run.id;q.stageIndex=i;q.stageCount=n;q.title=`${run.quest.title} · Stage ${i+1}/${n} · ${run.encounters[i].name}`;
 q.encounters=[run.encounters[i]];q.reward=share(Math.ceil((q.reward||0)*1.15),i,n);q.rep=share(q.rep||0,i,n);
 const common=(q.fixedLoot||[]).filter(d=>d.material==='Ancient Trade Goods');const rare=(q.fixedLoot||[]).filter(d=>d.material!=='Ancient Trade Goods');
 q.fixedLoot=common.map(d=>({...d,count:share(Math.ceil(d.count*1.15),i,n)})).filter(d=>d.count>0);
 if(!common.length){const units=Math.ceil((2+Math.floor((q.rank||0)/3))*1.15),qty=share(units,i,n);if(qty)q.fixedLoot.push({material:'Dungeon Salvage',count:qty})}
 if(last)q.fixedLoot.push(...rare);else delete q.signatureMaterial;
 return q;
 }
 const queue=queueQuestReport;
 function enqueue(run,i,due){const q=stageQuest(run,i),before=game.pendingReports.length,prior=continuing;continuing=i>0;let result;try{result=queue(q,run.partyIds,run.storyBonus,run.storySummary,due)}finally{continuing=prior}
 if(game.pendingReports.length>before){const r=game.pendingReports.at(-1);r.bossName=run.encounters[i].name;r.stagePlan=run;r.stageIndex=i;r.stageCount=run.count;r.stageCleared=cleared(r);r.durMs=share(run.duration,i,run.count);
 if(!cleared(r)){r.payout=0;r.memberCut=0;r.memberAwards=[];r.rep=0;r.lootDrops=[];r.growthAwards=[];r.resourceQty=0}
 r.summary=`Stage ${i+1}/${run.count} — ${run.encounters[i].name}: ${r.outcome}. ${cleared(r)?r.summary:'Stage not cleared; no stage rewards. The next attempt restarts at stage 1.'}`;
 r.extendedSummary=(r.extendedSummary||'')+` Stage ${i+1}/${run.count}: ${cleared(r)?'cleared; its rewards are retained.':'not cleared; no rewards for this stage, and the run ends. Restart from stage 1 on the next attempt.'}`;

 return true}return result;
 }
 function startRun(q,ids,storyBonus,storySummary,dueAt){const n=count(q);if(n===1||q.stageRun||game.storySession?.quest===q)return queue.apply(this,arguments);
 game.stageRunSequence=(Number(game.stageRunSequence)||0)+1;
 const run={id:'world-run-'+game.stageRunSequence,quest:structuredClone(q),partyIds:[...ids],storyBonus,storySummary,count:n,encounters:encounters(q),duration:Math.max(n,Math.round(v9QuestMs(q)))};
 return enqueue(run,0,Date.now()+share(run.duration,0,n));
 };
 function syncClears(){game.worldClearDays=game.worldClearDays||{};for(const r of game.todayReports||[]){if(!r.runComplete||!r.stagePlan)continue;const key=r.stagePlan.quest.templateKey;const day=r.worldClearedDay??game.day;r.worldClearedDay=day;game.worldClearDays[key]=Math.max(game.worldClearDays[key]??-1,day)}for(const [key,day] of Object.entries(game.worldClearDays))if(day===game.day)game.questDone[key]=true;}
 queueQuestReport=function(q){syncClears();if(!q.stageRun&&game.worldClearDays[q.templateKey]===game.day){alert('This world event has already been cleared today. Failed runs may be retried; successful clears reset next game day.');return false}return startRun.apply(this,arguments)};
 const quests=renderQuests;renderQuests=function(){syncClears();return quests.apply(this,arguments)};
 const apply=applyPendingReports;
 applyPendingReports=function(){const combined=[];let loops=0;
 do{const snapshots=new Map(game.pendingReports.filter(r=>r.stagePlan&&r.dueAt<=Date.now()).map(r=>[r.stagePlan.id,r.partyIds.map(id=>{const h=purse(id);return {id,preparedBonus:h?.preparedBonus||0,preparedSupplyBonuses:structuredClone(h?.preparedSupplyBonuses||{ration:0,potion:0,legacy:0}),expeditionKitProtection:h?.expeditionKitProtection||0}})]));
 const done=apply.apply(this,arguments);combined.push(...done);
 for(const r of done){if(!r.stagePlan)continue;const run=r.stagePlan;
 const alive=run.partyIds.map(purse).filter(h=>h&&!h.dead),canContinue=cleared(r)&&r.stageIndex+1<run.count&&alive.length===run.partyIds.length&&alive.every(h=>!h.wound||h.wound.tier<3);
 if(canContinue){for(const state of snapshots.get(run.id)||[]){const h=purse(state.id);if(h&&!h.dead){Object.assign(h,state);h.ready=false}}
 enqueue(run,r.stageIndex+1,Number(r.dueAt)+share(run.duration,r.stageIndex+1,run.count));r.runContinues=true;
 r.summary+=' Party continues to the next stage.';
 }else{r.runComplete=cleared(r)&&r.stageIndex===run.count-1;r.summary+=r.runComplete?' Expedition fully cleared.':' Expedition ended; the next attempt begins at stage 1.';
 if(r.runComplete){r.worldClearedDay=game.day;game.worldClearDays=game.worldClearDays||{};game.worldClearDays[run.quest.templateKey]=game.day;game.questDone[run.quest.templateKey]=true}else if(game.worldClearDays?.[run.quest.templateKey]!==game.day)delete game.questDone[run.quest.templateKey];
 }
 }
 if(!done.length)break;
 }while(++loops<5&&game.pendingReports.some(r=>r.stagePlan&&r.dueAt<=Date.now()));
 game.todayReports=combined;return combined;
 };
 const table=questLootTable;questLootTable=function(q){const rows=table(q),n=count(q);if(n>1)rows.unshift(['Daily limit','One successful full clear per event per game day. Failed or partial runs can be retried from stage 1 the same day.']);if(n>1){rows.unshift(['Stages',`${n} sequential stages sharing the existing total duration. Organizing fee once; rewards paid per cleared stage. Partial/failure ends the run; next attempt starts at stage 1.`]);rows.push(['Stage rewards','XP, payable gold and common reward budgets +15%, divided across stages. Rare loot and exclusive materials require the final clear. Supplies cover the full run.']);}return rows};
 const details=renderQuestDetails;renderQuestDetails=function(){const result=details.apply(this,arguments),q=questById(chosenQuest);if(count(q)>1){const p=document.createElement('p');p.className='notice';p.textContent=`${count(q)} stages · Each stage takes about ${v9DurLabel(q)} ÷ ${count(q)}. Clear every stage in order. Failure or partial success ends the run; earned stage rewards stay yours. Rare rewards require the final stage.`;document.getElementById('quest-detail-content').prepend(p)}return result};
 render();
})();
