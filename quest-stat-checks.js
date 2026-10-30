/* Either-stat gathering checks; social contracts give CHA a practical role. */
(() => {
 const pairs={Mining:['str','con'],Fishing:['dex','wis'],Herbalism:['wis','int'],Skinning:['dex','str'],Woodcutting:['str','con'],Tailoring:['dex','int'],Jewelcrafting:['int','dex'],Hunting:['dex','wis']};
 const gather=gatheringQuest;gatheringQuest=function(p){const q=gather.apply(this,arguments);return q&&pairs[p]?{...q,ability:pairs[p][0],gatherAbilities:[...pairs[p]]}:q};
 Object.assign(V9_TYPE_STATS,{'Escort / delivery':{con:.3,wis:.3,cha:.4},'Investigation / observation':{int:.5,wis:.3,cha:.2},'Exploration / rescue':{wis:.4,int:.3,cha:.3},'Diplomatic courier':{cha:1}});
 // Existing unaccepted social offers may gain CHA; sealed reports never change.
 const ensure=ensureFeatureQuests;ensureFeatureQuests=function(){const out=ensure.apply(this,arguments);if(game.chaOfferDay===game.day)return out;const available=game.questBoard.filter(q=>q.kind==='Contract'&&!q.persistent&&!game.questDone[q.templateKey]&&q.expiresDay>=game.day);if(available.some(q=>q.ability==='cha'))game.chaOfferDay=game.day;else{const q=available.find(q=>['Escort / delivery','Investigation / observation','Exploration / rescue','Diplomatic courier'].includes(q.label||q.jobType));if(q){q.ability='cha';game.chaOfferDay=game.day}}return out};
 const statName=v9StatName;v9StatName=function(q){return q?.gatherAbilities?q.gatherAbilities.map(a=>a.toUpperCase()).join(' or '):statName(q)};
 const tag=v9StatTag;v9StatTag=function(q){return q?.gatherAbilities?`<span class="pill v9-stat" title="One roll per hero using their higher readiness stat">${v9StatName(q)} check</span>`:tag(q)};
 function bestStat(h,q){return q.gatherAbilities.reduce((best,a)=>readiness(h,a)>readiness(h,best)?a:best,q.gatherAbilities[0])}
 const stat=perkStatFor;perkStatFor=function(h,q){return q?.kind==='Gathering'&&q.gatherAbilities?bestStat(h,q):stat.apply(this,arguments)};
 const extra=v9PickExtra;v9PickExtra=function(h,q){return q?.gatherAbilities?q.gatherAbilities.map(a=>`${a.toUpperCase()} ${v9ReadyPill(readiness(h,a))}`).join(' · ')+` · Uses ${bestStat(h,q).toUpperCase()}`:extra.apply(this,arguments)};
 window.resolveGatheringChecks=function(q,party,dc,PK,TB,storyBonus){
 const selected=new Map(party.map(h=>[h.id,bestStat(h,q)]));
 const checks=perkRollChecks(q,party,dc,PK,h=>readiness(h,selected.get(h.id))+(h.rank>0?1:0)+(h.id==='player'?storyBonus:0)+tbwRollMod(h,TB));
 for(const c of checks)c.gatherAbility=selected.get(c.id);
 tbwPostChecks(q,party,checks,dc,TB);const tier=perkTier(q,party,checks,PK);
 return {checks,tier,phases:[{ability:q.gatherAbilities.join(' or '),mode:'either',dc,tier,checks:checks.map(c=>({...c}))}]};
 };
 const table=questLootTable;questLootTable=function(q){const rows=table.apply(this,arguments);if(q?.gatherAbilities)rows.unshift(['Either stat',`${v9StatName(q)}: each hero makes one roll using whichever stat gives them higher readiness. Ties use the first listed stat. Heroes in the same party may use different stats. One normal outcome, fee, supply use and reward payout.`]);return rows};
 const show=showReportDetails;showReportDetails=function(r){const out=show.apply(this,arguments);if(!r.gatheringChecks?.length)return out;const root=document.getElementById('report-detail-text'),section=document.createElement('section');section.className='report-fight';const heading=document.createElement('h3');heading.textContent='Gathering skill checks';section.append(heading);for(const phase of r.gatheringChecks){const title=document.createElement('p');title.textContent=`${phase.ability.toUpperCase()} check · DC ${phase.dc} · ${['Failure','Partial Success','Success','Exceptional Success'][phase.tier]}`;section.append(title);for(const c of phase.checks){const p=document.createElement('p');p.textContent=`${c.name}${c.gatherAbility?' ('+c.gatherAbility.toUpperCase()+')':''}: d20 ${c.roll} ${c.modifier>=0?'+':''}${c.modifier} = ${c.total} (${c.success?'success':'failed'}).`;section.append(p)}}root.prepend(section);return out};
 window.WL_QUEST_STATS=Object.freeze({pairs});render();
})();
