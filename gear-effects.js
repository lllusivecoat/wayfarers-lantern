/* Paired-tier effects and matching-tier sets; raw stats and saves remain intact. */
(() => {
 const tiers=['Basic','Sturdy','Fine','Superior','Masterwork','Relic','Legendary','Heritage'];
 const combat=q=>['Dungeon','World Dungeon','Raid','World Boss','World Raid'].includes(q?.kind);
 function group(g){return g.category||gearGroup(g)}
 function effects(g){if(!Number.isInteger(g?.tier)||g.gatherTool)return [];
 const grade=Math.floor(g.tier/2),strength=(g.tier+1)/2,cat=group(g),family=g.weaponFamily||g.family,level=Math.max(0,Math.min(4,Number(g.enhancement)||0));
 const weight=cat==='weapon'?(g.hands===2||g.hands!==1&&['greatsword','staff','polearm','bow','crossbow','gun'].includes(family)?1:.5):cat==='offhand'?.5:1;
 const defensive=cat==='armor'||cat==='cape'||family==='shield',precise=['dagger','bow','crossbow','gun','pistol','fist','warglaive'].includes(family)||g.stat==='DEX';
 const type=defensive?'protection':precise?'precision':'roll',name=defensive?'Protection':precise?'Precision':['INT','WIS','CHA'].includes(g.stat)?'Spellcraft':'Penetration';
 const base=g.tier%2===1?(defensive?.02*strength:[0,.10,.15,.20,.25][strength]):0;
 const low=defensive?.01+.002*grade:.05+.01*grade,boost=level>=2?2*low:level>=1?low:0;
 const result=[];if(base+boost>0)result.push({type,name,value:(base+boost)*weight,weight});
 if(level>=3){const secondType=type==='roll'?'precision':'roll',secondName=secondType==='precision'?'Precision':type==='precision'?'Penetration':'Resolve';result.push({type:secondType,name:secondName,value:(.05+.01*grade)*(level>=4?2:1)*weight,weight})}
 return result;
 }
 function effect(g){return effects(g)[0]||null}
 function description(g){const tier=tiers[g.tier],list=effects(g);return `${list.length?list.map(e=>e.type==='protection'?`${e.name}: ${Math.round(e.value*1000)/10}% less ordinary wound chance.`:`${e.name}: ${Math.round(e.value*1000)/10}% chance per combat stage to ${e.type==='precision'?'crit on 19–20':'gain +1 on your combat check'}.`).join(' '):'No individual special effect.'} Enhancement stage ${Number(g.enhancement)||0}/4. ${tier?`${tier} Expedition Set: 2 distinct groups = 5% less ordinary wound chance; 4 groups also grant +5% base combat XP. Groups: armor, cape, ring, hands. Both hands together count as one group.`:''}`}
 function items(h){return [...new Set(Object.values(h.equipment||{}).filter(Boolean))].map(id=>game.gear.find(g=>g.id===id&&g.owner===h.id&&g.durability>0)).filter(g=>g&&g.madeByPlayer&&Number.isInteger(g.tier)&&!g.gatherTool)}
 // Preserve the strongest source; overlapping sources use a quarter of their
 // strength against the remaining headroom. Hands share one source budget.
 function combine(values,ceiling){const sorted=values.filter(v=>v>0).sort((a,b)=>b-a);if(!sorted.length)return 0;const best=Math.min(ceiling,sorted[0]);return best+(ceiling-best)*(1-sorted.slice(1).reduce((remaining,v)=>remaining*(1-v*.25),1))}
 function forHero(h){const equipped=items(h),sets=new Map();let handRoll=0,handCrit=0,handProtection=0;const rolls=[],crits=[],protections=[];
 for(const g of equipped){const cat=gearGroup(g),key=['weapon','offhand'].includes(cat)?'hands':cat==='amulet'?'ring':cat;if(!['hands','armor','cape','ring'].includes(key))continue;
 if(!sets.has(g.tier))sets.set(g.tier,new Set());sets.get(g.tier).add(key);
 for(const e of effects(g)){if(e.type==='protection'){if(key==='hands')handProtection+=e.value;else protections.push(e.value)}else if(e.type==='precision'){if(key==='hands')handCrit+=e.value;else crits.push(e.value)}else{if(key==='hands')handRoll+=e.value;else rolls.push(e.value)}
 }
 }
 const completed=[...sets].filter(([,groups])=>groups.size>=2).sort((a,b)=>b[1].size-a[1].size||b[0]-a[0])[0];
 return {roll:combine([handRoll,...rolls],.45),precision:combine([handCrit,...crits],.45),protection:1-(1-combine([handProtection,...protections],.35))*(completed?.[1].size>=2?.95:1),setTier:completed?.[0],pieces:completed?.[1].size||0,xp:completed?.[1].size>=4?.05:0,sets:[...sets].map(([tier,groups])=>({tier,pieces:groups.size}))};
 }
 window.WL_GEAR_EFFECTS=Object.freeze({effect,effects,description,forHero});
 const prepare=perkPrepare;perkPrepare=function(q,party){const ctx=prepare.apply(this,arguments);ctx.gearRoll={};if(!combat(q))return ctx;
 for(const h of party){const fx=forHero(h);if(fx.roll&&Math.random()<fx.roll){ctx.gearRoll[h.id]=1;ctx.notes.push(`${h.name}: equipment grants +1 combat check`)}if(fx.precision&&Math.random()<fx.precision)ctx.fx[h.id].push({crit19:true,perk:{id:'equipment-precision',name:'Equipment Precision'}})}return ctx};
 const roll=perkRollChecks;perkRollChecks=function(q,party,dc,ctx,base){return roll.call(this,q,party,dc,ctx,h=>base(h)+(ctx.gearRoll?.[h.id]||0))};
 const xp=questHeroXP;questHeroXP=function(q,h){return Math.ceil(xp(q,h)*(combat(q)?1+forHero(h).xp:1))};
 const equipment=renderHeroEquipment;renderHeroEquipment=function(h){const fx=forHero(h);return equipment(h)+`<details class="hero-detail-block gear-info-collapse"><summary>Equipment effects & sets</summary><p>Only durable, equipped crafted gear counts. Matching tiers count one each for armor, cape, ring and hands. Duplicate rings and dual weapons do not add set pieces.</p>${items(h).map(g=>`<p><strong>${tbwEsc(g.name)}</strong>: ${tbwEsc(description(g))}</p>`).join('')}<p>${fx.sets.map(s=>`${tiers[s.tier]} Expedition Set: ${s.pieces}/4 groups`).join(' · ')||'No set pieces equipped.'}</p><p>Active: ${Math.round(fx.protection*1000)/10}% less ordinary wound chance; +${Math.round(fx.xp*100)}% base combat XP. Overlapping effects contribute with diminishing returns: the strongest applies fully; each additional source uses 25% of its chance against remaining headroom (45% offensive, 35% protection). Both hands share one source. Only one set bonus applies. Natural-1 wounds, wound worsening and direct death checks are unchanged.</p></details>`};
 render();
})();
