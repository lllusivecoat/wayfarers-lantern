/* Personal-income gathering: daily hero limit and fixed travel prevent repeat farming. */
(() => {
 const id='gather-salvage-gold';
 const goldByRank=[40,60,80,100,125,150,175,200,225,250];
 function quest(){const rank=v9PermRank(id,0);return {id,templateKey:id,persistent:true,kind:'Gathering',goldGathering:true,profession:'Salvaging',title:'Salvage for Coin',jobType:'Gold gathering',desc:'Recover saleable scraps for local buyers. All gold is split equally among the participating heroes; the guild receives none. Each hero may make one trip per game day. No materials, XP or reputation. Organising costs are paid by the guild.',rank,dc:10+rank*2,ability:'dex',gatherAbilities:['dex','int'],reward:0,rep:0,minParty:1,maxParty:4,icon:'¤',expiresDay:null}}
 const find=questById;questById=function(key){return key===id?quest():find.apply(this,arguments)};
 const eligible=heroEligible;heroEligible=function(h,q){return !(q?.goldGathering&&game.goldGatheringDays?.[h.id]===game.day)&&eligible.apply(this,arguments)};
 const timing=v9QuestMins;v9QuestMins=function(q){return q?.goldGathering?45:timing.apply(this,arguments)};
 const duration=v9DurLabel;v9DurLabel=function(q){return q?.goldGathering?'45 min (fixed)':duration.apply(this,arguments)};
 const loot=bonusLootSpec;bonusLootSpec=function(q){return q?.goldGathering?null:loot.apply(this,arguments)};
 const queue=queueQuestReport;queueQuestReport=function(q,ids){if(!q?.goldGathering)return queue.apply(this,arguments);
  const unique=[...new Set(ids||[])];if(!unique.length||unique.length>4||unique.length!==ids.length||unique.some(key=>!purse(key)||game.goldGatheringDays?.[key]===game.day)){alert('Choose 1–4 heroes who have not taken a Salvage for Coin trip today.');return false}
  const before=game.pendingReports.length,out=queue.apply(this,arguments);if(game.pendingReports.length===before)return out;
  const r=game.pendingReports.at(-1);game.goldGatheringDays=game.goldGatheringDays||{};unique.forEach(key=>game.goldGatheringDays[key]=game.day);
  const base=goldByRank[q.rank]*(1+.25*(unique.length-1)),total=Math.floor(base*v9Mul(r.outcome)),share=Math.floor(total/unique.length),remainder=total%unique.length;
  r.payout=0;r.rep=0;r.resourceQty=0;r.lootDrops=[];r.growthAwards=[];r.memberCut=total;r.memberAwards=unique.map((key,n)=>({id:key,amount:share+(n<remainder?1:0)}));r.goldGathering=true;
  r.summary=`${r.outcome}. ${total} gp earned entirely by the heroes; guild receives 0 gp. Organising cost: ${r.organizingCost} gp.`;
  r.extendedSummary=`The party searches the shore for salvage and sells its findings to local buyers. Outcome: ${r.outcome}. ${r.rolls.map(c=>`${c.name}: d20 ${c.roll} + ${c.modifier} = ${c.total} (${c.success?'success':'failed'})`).join('; ')}. The guild receives 0 gp. Level progress earned: none. All ${total} gp is split equally among the heroes, with leftover coins distributed one each. Organising cost: ${r.organizingCost} gp. No materials or reputation earned.`;
  return out;
 };
 const table=questLootTable;questLootTable=function(q){if(!q?.goldGathering)return table.apply(this,arguments);const n=Math.max(1,Math.min(4,game.selected?.length||1)),base=goldByRank[q.rank]*(1+.25*(n-1));return [['Hero gold pool',`${Math.floor(base)} gp on success; ${Math.floor(base*.5)} partial; ${Math.floor(base*1.5)} exceptional; 0 failure. 100% divided equally among the selected heroes, not paid once per hero.`],['Organising cost',`${permanentExpeditionCost(q,n)} guild gp, paid upfront and not refunded.`],['Limits','1–4 heroes; once per hero per game day; fixed 45 minutes, unaffected by Waystation. No materials, XP, reputation, Depot or Contracts Office bonus.'],['Stat check','DEX or INT, whichever gives each hero the higher check bonus.']]};
 const renderQuestsBefore=renderQuests;renderQuests=function(){const out=renderQuestsBefore.apply(this,arguments),q=quest(),root=document.getElementById('gather-quest-list');if(root){const card=document.createElement('article');card.className='card quest';card.innerHTML=`<div class="cardhead"><h3>Salvage for Coin</h3>${v9RankPicker(q)}</div><p>${q.desc}</p><p>DEX or INT · DC ${q.dc} · 45 min · Party 1–4</p><p>${goldByRank[q.rank]} gp success pool for a solo hero; each additional hero adds 25% to the pool. Organise from ${permanentExpeditionCost(q,1)} gp.</p><button class="btn secondary" type="button">Details & assign</button>`;card.querySelector('button').onclick=()=>openQuestDetails(id);root.append(card)}return out};renderQuests();
})();
