/* Staff potential is saved independently of earned skills and building capacity. */
(function(){
 const aptitudes=['Organisation','Craftsmanship','Care','Fieldcraft'];
 const jobs={alchemyLab:'Craftsmanship',warehouse:'Organisation',staffOffice:'Organisation',workshop:'Craftsmanship',kitchen:'Craftsmanship',infirmary:'Care',armory:'Craftsmanship',trainingHall:'Care',warRoom:'Organisation',huntersLodge:'Fieldcraft',commandPost:'Organisation',cartographersOffice:'Fieldcraft',waystation:'Fieldcraft'};
 const skills={alchemyLab:'Alchemy',warehouse:'Storekeeping',staffOffice:'Quartermastery',workshop:'Blacksmithing',kitchen:'Cooking',infirmary:'First Aid',armory:'Armoring',trainingHall:'Training',warRoom:'Tactics',huntersLodge:'Hunting',commandPost:'Command',cartographersOffice:'Cartography',waystation:'Pathfinding'};
 const traits={
  Meticulous:'Workshop bonus chance +6 percentage points; service gold charges +5%.',
  Resourceful:'Crafting material discount +3 percentage points; treatment, training and repair charges −5%; Workshop bonus chance −3 percentage points.',
  Industrious:'Kitchen extra-ration chance +15 percentage points; crafted durability +5. Fixed base wage +1 gp/day.',
  Studious:'Adds 0.20 passive practice per paid workday; aptitude fit reduced by 25%. Service-use practice is unchanged.',
  Specialist:'Fit +4 percentage points when using a highest positive-level skill (ties qualify). Inactive at Level 0 or in a lower skill.',
  Adaptable:'Passive practice +25% while the assigned skill is below the highest skill. Inactive at parity, including all skills at Level 0.',
  Cautious:'Expedition/convoy support +1; warehouse sale bonus −3 percentage points and expedition loot modifier −3 percentage points.',
  Daring:'Warehouse sale bonus +4 percentage points or expedition loot modifier +3 percentage points; expedition/convoy support −1.',
  Loyal:'Fit +1 percentage point per seven paid workdays at the same building, up to +4 after 28. Moving/unassigning resets the streak, never skills.',
  Ambitious:'Fit +4 percentage points in Level 4–5 buildings. Fixed base wage +1 gp/day at every building level.'
 };
 const points=[0,5,15,30,50,75,105,140,180,225,275],clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const level=x=>points.reduce((n,p,i)=>Number(x)>=p?i:n,0);
 const combos=[];for(let a=1;a<=5;a++)for(let b=1;b<=5;b++)for(let c=1;c<=5;c++)for(let d=1;d<=5;d++)if(a+b+c+d===12)combos.push([a,b,c,d]);
 const valid=s=>s&&aptitudes.every(k=>Number.isInteger(s[k])&&s[k]>=1&&s[k]<=5)&&aptitudes.reduce((n,k)=>n+s[k],0)===12;
 function roll(random=Math.random){const scores=combos[Math.min(combos.length-1,Math.floor(random()*combos.length))],names=Object.keys(traits),personality=names[Math.min(names.length-1,Math.floor(random()*names.length))];return {aptitudes:Object.fromEntries(aptitudes.map((k,i)=>[k,scores[i]])),personality,wage:2+(scores.includes(5)?1:0)+(['Industrious','Ambitious'].includes(personality)?1:0),staffProfileVersion:1}}
 function migrate(st){
  if(!valid(st.aptitudes))st.aptitudes=Object.fromEntries(aptitudes.map(k=>[k,3]));
  if(!Object.hasOwn(traits,st.personality))st.personality=null;
  st.staffProfileVersion=1;st.passiveCredit=Math.max(0,Math.floor(Number(st.passiveCredit)||0));
  if(st.loyalBuilding!==st.buildingUid){st.loyalBuilding=st.buildingUid||null;st.loyalDays=0}
  st.loyalDays=Math.max(0,Math.floor(Number(st.loyalDays)||0));return st;
 }
 function evaluate(key,building,skill,scores,trait,days=0,highest=skill){
  building=clamp(Number(building)||1,1,5);skill=clamp(Number(skill)||0,0,10);
  let fit=(clamp(Number(scores?.[jobs[key]])||1,1,5)-1)*.03;
  if(trait==='Studious')fit*=.75;
  if(trait==='Specialist'&&skill>0&&skill===highest)fit+=.04;
  if(trait==='Ambitious'&&building>=4)fit+=.04;
  if(trait==='Loyal')fit+=Math.min(.04,Math.floor(days/7)*.01);
  fit=Math.min(.16,fit);
  const baseSupport=Math.floor(skill/3),supportKeys=['warehouse','staffOffice','warRoom','huntersLodge','commandPost','cartographersOffice'];
  const support=clamp(baseSupport+(supportKeys.includes(key)?trait==='Cautious'?1:trait==='Daring'?-1:0:0),0,4);
  const costs=trait==='Meticulous'?1.05:trait==='Resourceful'?.95:1;
  const r={key,building,skill,fit,support,costs,aptitude:clamp(Number(scores?.[jobs[key]])||1,1,5)};
  if(key==='warehouse')r.sale=clamp(skill*.03*(1+fit)+(trait==='Daring'?.04:trait==='Cautious'?-.03:0),0,.35);
  if(key==='workshop')Object.assign(r,{materialDiscount:Math.min(.45,1-(1-clamp(skill*.025*(1+fit)+(trait==='Resourceful'?.03:0),0,.3125))*(building===5?.8:1)),quality:clamp(skill*.03+fit/2+(trait==='Meticulous'?.06:trait==='Resourceful'?-.03:0),0,.4),extra:skill>=9?2:1,buildingBonus:building>=4?2:building>=2?1:0,durability:(building>=5?20:building>=3?10:0)+(trait==='Industrious'?5:0),craftCost:trait==='Meticulous'?1.05:1});
  if(key==='alchemyLab')Object.assign(r,{materialDiscount:Math.min(.25,skill*.02*(1+fit)+(trait==='Resourceful'?.03:0)),goldFactor:costs});
  if(key==='kitchen')r.extraRationChance=Math.min(.3,fit+Math.floor(skill/4)*.05+(trait==='Industrious'?.15:0));
  if(key==='infirmary')r.treatmentFactor=Math.max(.5,(building>=4?.75:1)*(1-Math.min(.2,baseSupport*.05*(1+fit)))*costs);
  if(key==='armory')r.repairUnit=Math.max(1,(5*[0,.7,.6,.5,.45,.4][building]-.5*baseSupport)*(1-fit/2)*costs);
  if(key==='trainingHall')r.trainerFactor=(1-Math.min(.2,baseSupport*.05*(1+fit)))*costs;
  if(['warRoom','huntersLodge','commandPost'].includes(key))r.loot=clamp(support*.05+(building>=5?.1:building>=2?.05:0)+fit+(trait==='Daring'?.03:trait==='Cautious'?-.03:0),0,.35);
  if(key==='cartographersOffice')r.partialDiscovery=Math.min(.5,.35+.03*(building-1)+fit);
  if(key==='waystation')r.timeCut=Math.min(.8,WL_BALANCE.questTimeCut(skill,building)+fit/3);
  return r;
 }
 function service(key,st=buildingStaff(key),building=buildingLevel(key),uid=st?.buildingUid,override){
  const skill=override??level(st?.professionXP?.[skills[key]]||0),highest=Math.max(0,...Object.values(st?.professionXP||{}).map(level));
  return evaluate(key,building,skill,st?.aptitudes,st?.personality,st?.buildingUid===uid&&st?.buildingKey===key?st.loyalDays:0,override===undefined?highest:Math.max(highest,skill));
 }
 function passiveRate(st,office=false){
  const current=level(st.professionXP?.[skills[st.buildingKey]]||0),highest=Math.max(0,...Object.values(st.professionXP||{}).map(level));
  return 100+(office?25:0)+(st.personality==='Studious'?20:st.personality==='Adaptable'&&current<highest?25:0);
 }
 function loot(q){const key={Raid:'warRoom','World Boss':'huntersLodge','World Raid':'commandPost'}[q.kind];return key&&buildingOperational(key)?service(key).loot:0}
 function preparation(q,random=Math.random){
  const specialist={Exploration:'cartographersOffice',Raid:'warRoom','World Boss':'huntersLodge','World Raid':'commandPost'}[q.kind];
  const office=buildingOperational('staffOffice')?service('staffOffice'):null;
  let total=(office?.support||0)+(specialist&&buildingOperational(specialist)?service(specialist).support:0);
  if(office&&total<6&&random()<office.fit)total++;
  return Math.min(6,total);
 }
 const percent=n=>(Math.round(n*1000)/10)+'%';
 function describe(key,st,building,uid,override){
  const e=service(key,st,building,uid,override),trait=st?.personality;
  const text={alchemyLab:()=>`Alchemy ${e.skill}; ordinary potion materials −${percent(e.materialDiscount)} (25% cap); gold ×${e.goldFactor}. Permanent elixirs receive no discounts.`,warehouse:()=>`Sale bonus +${percent(e.sale)} (35% cap); convoy danger −${e.support}.`,staffOffice:()=>`Preparation −${e.support} DC; ${percent(e.fit)} chance of an extra −1 (combined staff cap 6). Field kits unlock at Quartermastery 0/3/5/7/9; Office level allows 1–5 batches/day, 3 uses per batch.`,workshop:()=>`${['Basic','Basic','Sturdy','Fine','Superior','Masterwork','Relic','Legendary','Heritage'][Math.min(8,e.skill)]}; materials −${percent(e.materialDiscount)} (45% cap); ${percent(e.quality)} extra-bonus chance (40% cap); building readiness +${e.buildingBonus}; durability +${e.durability}; craft gold ×${e.craftCost}.`,kitchen:()=>`${e.building} base rations/day; ${percent(e.extraRationChance)} chance of one extra (30% chance cap; maximum 6). Every ration needs recipe ingredients and space.`,infirmary:()=>`Treatment costs ${percent(e.treatmentFactor)} of base (50% floor); free treatments remain free.`,armory:()=>`${Math.round(e.repairUnit*100)/100} gp per five durability restored before hero perks/rounding (minimum 1).`,trainingHall:()=>`Trainer charge ×${Math.round(e.trainerFactor*1000)/1000}; training gold has a 30%-of-sheet floor.`,warRoom:()=>`Raid support −${e.support} DC; bonus-loot modifier +${percent(e.loot)} (35% cap).`,huntersLodge:()=>`World-boss support −${e.support} DC; bonus-loot modifier +${percent(e.loot)} (35% cap).`,commandPost:()=>`World-raid support −${e.support} DC; bonus-loot modifier +${percent(e.loot)} (35% cap).`,cartographersOffice:()=>`Exploration −${e.support} DC; partial-success discovery ${percent(e.partialDiscovery)} (50% cap). Exploration alone discovers places.`,waystation:()=>`Quest time −${percent(e.timeCut)}${e.timeCut>=.8?' · At the 80% cap; further fit gives no speed benefit.':'; one-minute minimum, convoys unchanged.'}`};
  let status='';
  const highest=Math.max(0,...Object.values(st?.professionXP||{}).map(level));
  if(trait==='Specialist'&&!(e.skill>0&&e.skill===Math.max(highest,e.skill)))status=' Specialist inactive: use a highest positive-level skill.';
  if(trait==='Adaptable')status=e.skill<highest?' Adaptable active: +25% passive practice.':' Adaptable inactive: current skill is not below the highest.';
  if(trait==='Ambitious'&&e.building<4)status=' Ambitious inactive below building Level 4; agreed wage stays fixed.';
  if(trait==='Loyal')status=` Loyal: ${st.buildingUid===uid?st.loyalDays||0:0}/28 paid days at this building; moving resets the streak.`;
  if(trait==='Industrious'&&!['workshop','kitchen'].includes(key))status=' Industrious service bonus inactive here; agreed wage stays fixed.';
  if(['Cautious','Daring'].includes(trait)&&!['warehouse','staffOffice','cartographersOffice','warRoom','huntersLodge','commandPost'].includes(key))status=' Safety/sale/loot trait inactive for this service.';
  if(trait==='Meticulous'&&key!=='workshop')status=['infirmary','trainingHall','armory','alchemyLab'].includes(key)?' Meticulous quality bonus inactive here; gold charges +5%.':' Meticulous inactive: this service has no crafted quality or gold charge.';
  if(trait==='Resourceful'&&!['workshop','infirmary','trainingHall','armory','alchemyLab'].includes(key))status=' Resourceful inactive: no material or service-gold charge here.';
  return (text[key]?.()||'Assign to a completed building.')+status;
 }
 function profileHTML(st){
  const esc=tbwEsc,trait=st.personality;
  return `<div class="staff-aptitudes">${aptitudes.map(k=>`<span>${k}<strong>${st.aptitudes[k]}/5</strong></span>`).join('')}</div><p class="staff-personality"><strong>${esc(trait||'No personality trait (existing staff)')}</strong>${trait?' · '+esc(traits[trait]):''}</p>`;
 }
 window.WL_STAFF=Object.freeze({aptitudes,jobs,skills,traits,combos,roll,migrate,evaluate,service,passiveRate,loot,preparation,describe,profileHTML,level,percent});
})();
