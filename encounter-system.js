/* New offers use explicit party requirements. Sealed reports keep their rolls. */
(function(){
 function normalize(q){
  if(!q)return q;
  const p=WL_BALANCE.partyProfile(q);
  return {...q,encounterVersion:2,...(p?{minParty:p.size,maxParty:p.size,jobType:p.id==='boss'?'Boss':q.jobType}: {})};
 }
 const oldSpecial=specialQuest;specialQuest=function(){return normalize(oldSpecial.apply(this,arguments))};
 const oldWorld=v9WorldQuest;v9WorldQuest=function(){return normalize(oldWorld.apply(this,arguments))};
 const oldList=qlist;qlist=function(){return oldList.apply(this,arguments).map(normalize)};
 window.encounterPartyError=(q,party)=>WL_BALANCE.partyError(q,party,v9Role);
 const oldPanel=v9RolePanel;v9RolePanel=function(q){
  const p=WL_BALANCE.partyProfile(q);if(!p)return oldPanel.apply(this,arguments);
  const party=teamMembers().filter(h=>h.ready&&heroEligible(h,q)),c=v9RoleCounts(party.map(h=>h.id)),error=encounterPartyError(q,party),need=r=>Math.ceil(p[r]*2/3);
  return `<div class="v9-rolepanel"><strong>${p.size}-hero party required</strong><div class="v9-rq-row"><span class="v9-rq ${c.tank>=p.tank?'ok':'no'}">Tanks ${c.tank}/${p.tank} minimum</span><span class="v9-rq ${c.healer>=p.healer?'ok':'no'}">Healers ${c.healer}/${p.healer} minimum</span><span class="v9-rq ${c.dps>=need('dps')?'ok':'no'}">DPS ${c.dps} · ${p.dps} suggested</span></div><p class="small muted">${v9EncText(q)} · Selected ${party.length}/${p.size}. Each encounter's roll targets: ${need('tank')} successful tank checks, ${need('healer')} healer checks and ${need('dps')} DPS checks. Extra tanks/healers may fill spare DPS places while these targets remain possible.</p>${error?`<p class="v9-rq-warn">${tbwEsc(error)} Dispatch is unavailable until the requirements are met.</p>`:''}<details class="v9-how"><summary>How roles work</summary><p>Party minimums and successful checks are separate. Bring the required tanks and healers; at least two-thirds of each reference role group must pass their checks in each phase, rounded up. Targets stay fixed when you change the role mix.</p><p>Tanks use STR or CON, healers WIS, and DPS their main stat. Existing critical bonuses and the average of phase results still determine the final result. Healer wound protection keeps its existing 30% cap.</p></details></div>`;
 };
 const oldTags=v9GroupTags;v9GroupTags=function(q){const p=WL_BALANCE.partyProfile(q);return p?`<span class="pill v9-stat">${p.size} heroes · ${p.tank} Tanks · ${p.healer} Healers · ${p.dps} DPS suggested</span><span class="pill v9-stat">${v9EncText(q)}</span>`:oldTags.apply(this,arguments)};
 const oldRecommended=recommendedPartyText;recommendedPartyText=function(q){const p=WL_BALANCE.partyProfile(q);return p?`${p.size} heroes required · at least ${p.tank} tanks and ${p.healer} healers · ${p.dps} DPS suggested`:oldRecommended.apply(this,arguments)};
 const oldCost=permanentExpeditionCost;permanentExpeditionCost=function(q,count){
  const p=q&&WL_BALANCE.partyProfile(q),base=oldCost.call(this,q,p?.size??count),key={'World Boss':'huntersLodge','World Raid':'commandPost'}[q?.kind];
  return base&&!q.legacyEncounter&&key&&buildingOperational(key)&&v9L(key)>=4?Math.max(1,Math.floor(base*.9)):base;
 };
 const oldLoot=bonusLootSpec;bonusLootSpec=function(q){const loot=oldLoot.apply(this,arguments);return loot&&q.kind==='World Raid'&&!q.legacyEncounter?{...loot,min:Math.ceil(loot.min*32/20),max:Math.ceil(loot.max*32/20)}:loot};
 const oldDetails=renderQuestDetails;renderQuestDetails=function(){
  const out=oldDetails.apply(this,arguments),q=questById(chosenQuest);if(!q)return out;
  const party=teamMembers().filter(h=>h.ready&&heroEligible(h,q)),error=encounterPartyError(q,party);
  if(error){const button=document.getElementById('quest-dispatch-btn');button.disabled=true;button.textContent='Meet party requirements'}return out;
 };
 const oldDispatch=dispatchQuest;dispatchQuest=function(){
  const q=questById(chosenQuest),party=teamMembers().filter(h=>h.ready&&q&&heroEligible(h,q));
  if(q){const error=encounterPartyError(q,party);if(error){alert(error);renderQuestDetails();return false}}
  return oldDispatch.apply(this,arguments);
 };
 const oldEncs=v9Encs;v9Encs=function(q){return WL_BALANCE.encounters(q,oldEncs.apply(this,arguments))};
 const oldResolve=v9GroupResolve;v9GroupResolve=function(q,party,checks,dc){return oldResolve.call(this,{...q,encounters:v9Encs(q)},party,checks,dc)};
 // Legacy story expeditions have not rolled yet. Retain their original party/DC
 // rules and object identity so the existing organizing-fee exemption still applies.
 const oldQueue=queueQuestReport;queueQuestReport=function(q){
  if(game.storySession?.quest!==q||q.encounterVersion)return oldQueue.apply(this,arguments);
  const previous=q.legacyEncounter;q.legacyEncounter=true;try{return oldQueue.apply(this,arguments)}finally{if(previous===undefined)delete q.legacyEncounter;else q.legacyEncounter=previous}
 };
 render();
})();
