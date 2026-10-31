/* Daily identity rotation and six-stat contract coverage. Numeric scaling stays
   in the existing factories; permanent world discoveries are not rerolled. */
(() => {
 const dungeons=[
 ['Ragefire Chasm','Orgrimmar',['Oggleflint','Jergosh the Invoker','Taragaman the Hungerer']],
 ['The Deadmines','Westfall',['Rhahk’Zor','Captain Greenskin','Edwin VanCleef']],
 ['Wailing Caverns','Northern Barrens',['Lady Anacondra','Verdan the Everliving','Mutanus the Devourer']],
 ['Shadowfang Keep','Silverpine Forest',['Baron Silverlaine','Commander Springvale','Archmage Arugal']],
 ['Gnomeregan','Dun Morogh',['Grubbis','Electrocutioner 6000','Mekgineer Thermaplugg']],
 ['Scarlet Monastery','Tirisfal Glades',['Houndmaster Loksey','Scarlet Commander Mograine','High Inquisitor Whitemane']],
 ['Uldaman','Badlands',['Ironaya','Galgann Firehammer','Archaedas']],
 ['Zul’Farrak','Tanaris',['Theka the Martyr','Witch Doctor Zum’rah','Chief Ukorz Sandscalp']],
 ['Razorfen Downs','Thousand Needles',['Tuten’kash','Mordresh Fire Eye','Amnennar the Coldbringer']],
 ['Maraudon','Desolace',['Noxxion','Landslide','Princess Theradras']],
 ['The Sunken Temple','Swamp of Sorrows',['Jammal’an the Prophet','Ogom the Wretched','Shade of Eranikus']],
 ['Blackrock Depths','Blackrock Mountain',['High Interrogator Gerstahn','General Angerforge','Emperor Dagran Thaurissan']]
 ];
 const raids=[
 ['Molten Core','Blackrock Mountain',['Garr','Majordomo Executus','Ragnaros']],
 ['Blackwing Lair','Blackrock Mountain',['Razorgore the Untamed','Chromaggus','Nefarian']],
 ['Zul’Gurub','Northern Stranglethorn',['High Priest Venoxis','Jin’do the Hexxer','Hakkar the Soulflayer']],
 ['Ruins of Ahn’Qiraj','Silithus',['Kurinnaxx','General Rajaxx','Ossirian the Unscarred']],
 ['Naxxramas','Dragonblight',['Heigan the Unclean','Sapphiron','Kel’Thuzad']],
 ['Karazhan','Deadwind Pass',['Moroes','The Curator','Prince Malchezaar']]
 ];
 const bosses=[['Azuregos','Azshara',['Azuregos']],['Lord Kazzak','Blasted Lands',['Lord Kazzak']],['Doomwalker','Shadowmoon Valley',['Doomwalker']],['Sha of Anger','Kun-Lai Summit',['Sha of Anger']],['Oondasta','Isle of Giants',['Oondasta']],['Nalak','Isle of Thunder',['Nalak']]];
 const pools={Dungeon:dungeons,Raid:raids,'World Boss':bosses};
 const extraTitles=[
 ['Baymaster’s Supply Run','Harbor Pilot Escort','Apothecary Parcel Delivery','Steamwheedle Messenger Escort','Stormbound Provision Run','Dockworkers’ Safe Passage','Customs Papers Delivery','Shipwright’s Timber Escort'],
 ['Salvage from the Broken Mast','Missing Survey Instruments','Sunken Lockbox Retrieval','Storm-Tossed Cargo Recovery','The Lost Harbor Ledger','Recovery at the Tide Pools','The Fisherman’s Lost Nets','Coastal Signal Flare Recovery'],
 ['Reinforce the Harbor Breakwater','Repair the Storm-Battered Jetty','Raise the Fallen Cargo Crane','Clear the Collapsed Storehouse','Brace the Lighthouse Stairs','Restore the Wharf Winch','Repair the Water Cistern','Fortify the Fishery Gates'],
 ['Interview the Dockside Witnesses','Investigate the Empty Warehouse','Decode the Smuggler’s Ledger','Track the Counterfeit Shipping Seals','Survey the Shifting Sandbanks','Inspect the Lighthouse Signals','Identify the Stolen Cargo Marks','Investigate the Midnight Footprints'],
 ['Clear the Warehouse Vermin','Drive Raptors from the Supply Road','Fishery Crab Infestation','The Jungle Cat at the Stockade','Protect the Goatherd’s Flock','Remove the Pier’s Serpent Nest','Gorillas at the Coastal Orchard','Boars in the Provision Gardens'],
 ['Rescue the Missing Lookout','Search the Storm-Wrecked Shore','Recover the Stranded Survey Team','Guide the Lost Jungle Pilgrims','Search the Old Coastal Trail','Find the Missing Harbor Runner','Rescue at the Cliffside Camp','Locate the Overdue Fishing Crew']
 ];
 extraTitles.forEach((titles,i)=>{for(const title of titles)if(!V9_BASE_POOLS[i].some(x=>x[0]===title))V9_BASE_POOLS[i].push([title,'Booty Bay and the surrounding Stranglethorn coast'])});
 const extraTypeTitles={
 'Bounty hunt':['Track the Coastal Poacher','Bounty on the Jungle Ravager','Hunt the Roadside Stalker','The Missing Scout’s Quarry','The Bloodscalp Trail','Predator at the Expedition Camp'],
 'Arena challenge':['Gurubashi Doubles Challenge','The Arena Gatekeeper’s Trial','Last Lantern in the Ring','The Sandpit Champion','A Challenger from the Coast','The Veteran’s Rematch'],
 'Smuggler interdiction':['Intercept the False-Flag Shipment','Break the Midnight Supply Chain','The Hidden Cargo Manifest','Ambush at the Smuggler’s Landing','Track the Contraband Brokers','Seal the Wrecker’s Route'],
 'Diplomatic courier':['Negotiate Harbor Access','Mediate the Caravan Dispute','Deliver the Neutral Charter','Settle the Dockside Trade Claim','Arrange a Prisoner Exchange','Win Safe Passage for the Surveyors'],
 'Arcane survey':['Calibrate the Leyline Beacons','Map the Unstable Rune Circle','Trace the Fading Enchantment','Inspect the Shattered Focus','Recover the Surveyor’s Spell Notes','Chart the Residual Mana Trail'],
 'Caravan defence':['Hold the Wagon Crossing','Protect the Rearguard Supplies','Break the Roadside Blockade','Defend the Stranded Caravan','Keep the Supply Column Moving','Guard the Night Encampment'],
 'Scourge cleansing':['Purge the Blighted Supply Cache','Cleanse the Abandoned Watchtower','Secure the Plague-Ridden Road','Destroy the Corrupted Ward','Recover the Fallen Patrol’s Standard','Contain the Graveyard Outbreak']
 };
 for(const type of V9_WORLD.types){const location=type.pool[0]?.[1]||'the known expedition route';for(const title of extraTypeTitles[type.label]||[])if(!type.pool.some(p=>p[0]===title))type.pool.push([title,location])}
 v9WorldEnsure(game);v9ApplyWorldPools(game);
 function state(){return game.questVariety||(game.questVariety={bags:{}})}
 function pick(type,pool){const s=state();s.bags=s.bags||{};let bag=(s.bags[type]||[]).filter(title=>pool.some(p=>p[0]===title));const board=new Set((game.questBoard||[]).filter(q=>q.expiresDay>=game.day).map(q=>q.title));
  if(!bag.length){bag=pool.map(p=>p[0]);for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}}
  let index=bag.findIndex(title=>!board.has(title));if(index<0)index=0;const title=bag.splice(index,1)[0];s.bags[type]=bag;return pool.find(p=>p[0]===title);
 }
 function varyContract(q){const type=V9_TYPES.find(t=>t.label===q.label)||v9UnlockedTypes().find(t=>t.label===q.label);if(!type?.pool?.length)return q;const entry=pick(q.label,type.pool);return {...q,title:entry[0],location:entry[1],desc:`${type.desc} Location: ${entry[1]}.${q.event?' Ongoing: '+q.event+'.':''}`,varietyVersion:1}}
 const generated=makeGeneratedQuest;makeGeneratedQuest=function(){return varyContract(generated.apply(this,arguments))};
 function variant(q){if(q.persistent||q.world||!pools[q.kind])return q;const pool=pools[q.kind],day=q.issuedDay??q.day??game.day,entry=pool[((day-1)%pool.length+pool.length)%pool.length],old=v9Encs(q),names=old.length===1?[entry[2].at(-1)]:entry[2];
  return {...q,title:`${entry[0]} · Daily ${q.kind==='Dungeon'?'dungeon':q.kind==='Raid'?'raid':'boss'}`,desc:`A daily guild expedition to ${entry[0]}, ${entry[1]}. Face ${entry[2].at(-1)} and secure the existing rank-scaled rewards. This daily offer does not discover or unlock a permanent world location.`,encounters:old.map((e,i)=>({...e,name:names[i%names.length]})),dailyVariant:entry[0]};
 }
 const special=specialQuest;specialQuest=function(){return variant(special.apply(this,arguments))};
 const ensure=ensureFeatureQuests;
 const statTypes={str:2,dex:1,con:0,int:3,wis:5,cha:0};
 function coverStats(){const s=state();if(s.coverageDay===game.day)return;
  let available=game.questBoard.filter(q=>q.kind==='Contract'&&!q.persistent&&!game.questDone[q.templateKey]&&q.expiresDay>=game.day);
  // Daily arrivals already guarantee at least six. Existing mid-day saves can
  // get a one-time top-up to six on adopting this feature; dispatch never refills.
  while(available.length<6){const q=makeGeneratedQuest(rollD6(),rollD6(),'stat-coverage');game.questBoard.push(q);available.push(q)}
  const reserved=new Set(),missing=[];for(const stat of abilityKeys){const q=available.find(q=>q.ability===stat&&!reserved.has(q));if(q)reserved.add(q);else missing.push(stat)}
  for(const stat of missing){const q=available.find(q=>!reserved.has(q)),type=V9_TYPES[statTypes[stat]],rank=q.rank,raw=type.reward+rank*30,life=raw>=180?1:raw>=80?2:3;
   Object.assign(q,{label:type.label,jobType:type.label,ability:stat,dc:type.dc+rank*2,reward:q.goldRewardVersion?Math.ceil(raw*1.2):raw,xp:type.xp+rank*3,rep:type.rep+rank,minParty:Math.min(6,type.minParty+Math.floor(rank/4)),icon:type.icon,expiresDay:Math.max(game.day,(q.issuedDay??game.day)+life-1)});delete q.v9type;delete q.substitution;q.statCoverage=true;Object.assign(q,varyContract(q));reserved.add(q);
  }
  s.coverageDay=game.day;
 }
 ensureFeatureQuests=function(){game.questBoard=game.questBoard.filter(q=>!(pools[q.kind]&&!q.persistent&&!q.world&&(q.issuedDay??q.day??game.day)<game.day));const out=ensure.apply(this,arguments);game.questBoard=game.questBoard.map(q=>q.kind==='Contract'&&!q.varietyVersion&&!game.questDone[q.templateKey]?varyContract(q):q.dailyVariant?q:variant(q));coverStats();return out};
 const arrivals=generateDailyArrivals;generateDailyArrivals=function(){const out=arrivals.apply(this,arguments);delete state().coverageDay;ensureFeatureQuests();save();return out};
 const queue=queueQuestReport;queueQuestReport=function(q){const before=game.pendingReports.length,result=queue.apply(this,arguments);if(q.dailyVariant&&game.pendingReports.length>before){const r=game.pendingReports.at(-1);r.dailyBossNames=q.encounters.map(e=>e.name);r.dailyBossResults=window.__v9Group?.results?.map(e=>({name:e.name,tier:e.tier}));}return result};
 window.WL_QUEST_VARIETY=Object.freeze({dungeons,raids,bosses});render();save();
})();
