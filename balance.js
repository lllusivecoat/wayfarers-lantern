/* Shared balance rules. Save values are never rewritten when these rules change. */
window.WL_BALANCE=Object.freeze({
  partyProfile:q=>q.legacyEncounter?null:q.kind==='World Raid'?{id:'worldRaid',size:32,tank:5,healer:10,dps:17}:q.kind==='World Boss'?(q.persistent||q.world?{id:'worldBoss',size:20,tank:2,healer:4,dps:14}:{id:'boss',size:12,tank:2,healer:2,dps:8}):null,
  partyError:(q,party,roleFor)=>{
    const p=window.WL_BALANCE.partyProfile(q);if(!p)return '';
    if(party.length!==p.size)return `${q.jobType||q.kind} requires exactly ${p.size} heroes; ${party.length} selected.`;
    const counts={tank:0,healer:0,dps:0};party.forEach(h=>counts[roleFor(h)]++);
    const missing=[];if(counts.tank<p.tank)missing.push(`${p.tank} tanks`);if(counts.healer<p.healer)missing.push(`${p.healer} healers`);
    const dpsNeed=Math.ceil(p.dps*2/3);if(counts.dps<dpsNeed)missing.push(`at least ${dpsNeed} DPS to meet the encounter success target`);
    return missing.length?'Requires '+missing.join(' and ')+'.':'';
  },
  worldDcAdjustment:q=>{
    if(q.legacyEncounter)return 0;
    const rank=Math.max(0,Math.min(9,Number(q.rank)||0)),extra=[0,0,0,0,0,0,1,1,2,2][rank];
    if(q.kind==='World Dungeon')return -Math.floor(rank/4);
    if(q.kind==='Raid')return extra;
    if(q.kind==='World Boss')return q.persistent||q.world?extra:Math.min(1,extra);
    if(q.kind==='World Raid')return /Zul|Onyxia/.test(q.title||'')?extra:[0,0,0,0,0,0,1,2,3,3][rank];
    return 0;
  },
  questDc:q=>Number(q.dc)+window.WL_BALANCE.highRankDcBonus(q)+window.WL_BALANCE.worldDcAdjustment(q),
  encounters:(q,list)=>q&&!q.legacyEncounter&&q.kind==='World Raid'&&/Naxxramas/.test(q.title||'')&&q.rank>=7?list.map((e,i)=>({...e,dc:e.dc+(i===list.length-1?1:0)})):list,
  questTimeCut:(skill,building=1)=>Math.min(.8,[0,.1,.25,.4,.55,.8][Math.max(1,Math.min(5,building))]+.02*Math.max(0,Math.min(10,skill))),
  highRankDcBonus:q=>({Dungeon:[0,0,0,0,0,1,3,4,5,7],Raid:[0,0,0,0,0,2,4,5,7,9],'World Boss':[0,0,0,0,0,1,3,4,5,7],'World Raid':[0,0,0,0,0,2,4,5,7,9]}[q.kind]?.[Math.max(0,Math.min(9,Number(q.rank)||0))]||0),
  expeditionCost:(kind,rank,party)=>({Gathering:2,Exploration:4,'World Dungeon':8,'World Boss':10,'World Raid':16}[kind]||4)+2*Math.max(0,Math.min(9,Number(rank)||0))+Math.max(1,Math.floor(Number(party)||1)),
  supportBonus:level=>Math.floor(Math.max(0,Math.min(10,level))/3),
  salePerLevel:.03,
  materialPerLevel:.025,
  craftChancePerLevel:.03,
  craftExtra:level=>level>=9?2:1,
  rationCount:building=>Math.max(1,Math.min(5,Number(building)||1)),
  rationBonus:skill=>skill>=6?2:1,
  // The spread still covers maximum Storekeeping + Warehouse bonuses and the
  // largest town discount, even when a mixed load shares one escort fee.
  marketPrice:(base,rate,discount=0)=>Math.max(1,Math.ceil(base*rate*1.3*(1-Math.min(.04,Math.max(0,discount))))),
  dailyContractMinimum:hall=>6+2*Math.max(0,Math.min(6,(Number(hall)||1)-1)),
  gatheringYieldMultiplier:members=>1+.25*Math.max(0,(Number.isSafeInteger(members)?members:1)-1),
  convoyCapacity:members=>Number.isSafeInteger(members)&&members>0?members*20:0,
  convoySupport:count=>Math.min(4,Math.max(0,count-1)),
  convoyFraction:(total,dc)=>total>=dc?1:total>=dc-4?.75:0,
  convoyPay:(gross,count)=>gross&&count?Math.min(gross,Math.max(Math.floor(gross*Math.min(.3,.2+.02*Math.max(0,count-1))),2*count)):0,
  marketStock:ring=>Math.min(18,8+ring*2)
});
