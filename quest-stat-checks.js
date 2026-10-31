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
 const extra=v9PickExtra;v9PickExtra=function(h,q){if(!q?.gatherAbilities)return extra.apply(this,arguments);const selected=bestStat(h,q),tool=gatheringToolFor(q,[h]),active=tool&&game.selected?.includes(h.id)&&gatheringToolFor(q,teamMembers().filter(m=>m.ready&&heroEligible(m,q)))?.id===tool.id;return '<span class="gather-stat-options '+(tool?'has-tool':'')+'">'+q.gatherAbilities.map(a=>{const n=readiness(h,a),used=a===selected;return `<span class="gather-stat ${used?'selected':''} ${n<0?'negative':''}" title="${a.toUpperCase()} readiness ${n>=0?'+':''}${n}${used?' — automatically used':''}">${a.toUpperCase()} <b>${n>=0?'+':''}${n}</b>${used?'<small>Used</small>':''}</span>`}).join('')+(tool?`<span class="gather-stat gather-tool ${active?'active':''}" title="${tbwEsc(tool.name)}: DC −${tool.toolCut}. ${active?'Applied to this party.':'Carried; only the strongest matching tool applies.'}" aria-label="${tbwEsc(tool.name)}, DC reduction ${tool.toolCut}${active?', applied':''}">Tool <b>−${tool.toolCut}</b></span>`:'')+'</span>'};
 const head=v9PickHead;v9PickHead=function(h,q,extra){const html=head.apply(this,arguments);if(!q?.gatherAbilities)return html;const box=document.createElement('div');box.innerHTML=html;const row=box.firstElementChild;row.classList.add('gather-pick-head');const dot=row.querySelector('.v9-tdot');if(dot)row.querySelector('.v9pick-name').append(dot);return box.innerHTML};
 const style=document.createElement('style');style.textContent=`
 .v9pick-head.gather-pick-head{display:grid;grid-template-columns:minmax(0,1fr) 26px;gap:10px 8px;width:100%;align-items:start}
 .gather-pick-head .v9pick-name{grid-column:1;grid-row:1;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;max-width:none!important;line-height:1.4;overflow-wrap:anywhere}
 .gather-pick-head .v9-info{grid-column:2;grid-row:1;justify-self:end;margin-top:1px}
 .gather-pick-head .v9-tdot{display:inline-block;margin-left:8px;vertical-align:middle}
 .gather-stat-options{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px;min-width:0}
 .gather-stat{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--line);border-radius:7px;padding:4px 8px;font:12px/1.4 system-ui,sans-serif;color:var(--muted);white-space:nowrap}
 .gather-stat-options.has-tool{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}.has-tool .gather-stat{min-width:0;justify-content:center;padding:4px 3px;gap:3px;font-size:10px}.has-tool .gather-stat small{display:none}.gather-tool.active{border-color:#5f8a52;color:#b9dca8;background:#22331d88}
 .gather-stat.selected{border-color:#a68c4d;background:#a68c4d18;color:var(--gold2)}
 .gather-stat.negative b{color:#ffaaa0}.gather-stat small{font-size:10px;opacity:.85}
 .v9pick:has(.gather-pick-head){padding:12px!important}
 .v9pick:has(.gather-pick-head) .v9pick-body{gap:10px!important}
 .v9pick:has(.gather-pick-head) .v9pick-meta{flex-wrap:wrap!important;line-height:1.5}
 .v9pick:has(.gather-pick-head) .v9pick-class{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.5;overflow-wrap:anywhere}
 `;document.head.append(style);
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
