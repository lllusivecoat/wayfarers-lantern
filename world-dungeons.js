/* Fixed WoW-themed dungeon identities. Existing discovery IDs and sealed reports survive. */
(() => {
  const rows=[
    ["ragefire-chasm", "Ragefire Chasm", 0, "Orgrimmar", "Emberstone", "Taragaman the Hungerer"],
    ["deadmines", "The Deadmines", 0, "Westfall", "Defias Steel", "Edwin VanCleef"],
    ["wailing-caverns", "Wailing Caverns", 0, "Northern Barrens", "Deviate Essence", "Mutanus the Devourer"],
    ["shadowfang-keep", "Shadowfang Keep", 1, "Silverpine Forest", "Worgen Fang", "Archmage Arugal"],
    ["stockade", "The Stockade", 1, "Stormwind", "Convict’s Iron", "Bazil Thredd"],
    ["blackfathom-deeps", "Blackfathom Deeps", 1, "Ashenvale", "Abyssal Pearl", "Aku’mai"],
    ["gnomeregan", "Gnomeregan", 2, "Dun Morogh", "Irradiated Gearwork", "Mekgineer Thermaplugg"],
    ["razorfen-kraul", "Razorfen Kraul", 2, "Southern Barrens", "Bristled Hide", "Charlga Razorflank"],
    ["scarlet-monastery", "Scarlet Monastery", 2, "Tirisfal Glades", "Scarlet Silk", "High Inquisitor Whitemane"],
    ["uldaman", "Uldaman", 3, "Badlands", "Titan Alloy Fragment", "Archaedas"],
    ["razorfen-downs", "Razorfen Downs", 3, "Thousand Needles", "Deathbloom Extract", "Amnennar the Coldbringer"],
    ["zulfarrak", "Zul’Farrak", 3, "Tanaris", "Sandfury Runestone", "Chief Ukorz Sandscalp"],
    ["maraudon", "Maraudon", 4, "Desolace", "Primal Earth Crystal", "Princess Theradras"],
    ["sunken-temple", "The Sunken Temple", 4, "Swamp of Sorrows", "Atal’ai Blood", "Shade of Eranikus"],
    ["dire-maul-east", "Dire Maul East", 4, "Feralas", "Wildgrowth Heart", "Alzzin the Wildshaper"],
    ["blackrock-depths", "Blackrock Depths", 5, "Blackrock Mountain", "Darkforge Ingot", "Emperor Dagran Thaurissan"],
    ["dire-maul-west", "Dire Maul West", 5, "Feralas", "Arcane Binding", "Prince Tortheldrin"],
    ["lower-blackrock-spire", "Lower Blackrock Spire", 5, "Blackrock Mountain", "Blackscale Leather", "Overlord Wyrmthalak"],
    ["scholomance", "Scholomance", 6, "Western Plaguelands", "Darkmaster’s Essence", "Darkmaster Gandling"],
    ["stratholme", "Stratholme", 6, "Eastern Plaguelands", "Consecrated Ash", "Baron Rivendare"],
    ["upper-blackrock-spire", "Upper Blackrock Spire", 6, "Blackrock Mountain", "Black Dragon Core", "General Drakkisath"],
    ["shattered-halls", "The Shattered Halls", 7, "Hellfire Peninsula", "Felsteel Warplate", "Warchief Kargath Bladefist"],
    ["shadow-labyrinth", "Shadow Labyrinth", 7, "Terokkar Forest", "Murmur’s Resonance", "Murmur"],
    ["arcatraz", "The Arcatraz", 7, "Netherstorm", "Nether Prison Crystal", "Harbinger Skyriss"],
    ["halls-of-lightning", "Halls of Lightning", 8, "The Storm Peaks", "Titanstorm Core", "Loken"],
    ["forge-of-souls", "The Forge of Souls", 8, "Icecrown", "Soulforged Alloy", "Devourer of Souls"],
    ["pit-of-saron", "Pit of Saron", 8, "Icecrown", "Unbound Saronite", "Scourgelord Tyrannus"],
    ["halls-of-origination", "Halls of Origination", 9, "Uldum", "Origination Spark", "Rajh"],
    ["end-time", "End Time", 9, "Caverns of Time", "Echo of Lost Time", "Murozond"],
    ["well-of-eternity", "Well of Eternity", 9, "Caverns of Time", "Eternal Wellspring Essence", "Mannoroth"]
  ];
  const all=rows.map(([id,name,rank,zone,material,boss])=>({id,name,rank,zone,material,boss}));
  for(const d of all){
    let l=V9_LOC[d.id];
    if(!l){l={id:d.id,sites:[],types:[],start:false};V9_WORLD.locations.push(l);V9_LOC[d.id]=l}
    Object.assign(l,{name:d.name,zone:d.zone,type:'dungeon',ring:Math.min(6,1+Math.floor(d.rank/2)),minRank:d.rank,minRep:[0,50,100,200,400,700,1000,1400,1900,2500][d.rank],flavour:`${d.name}: ${ranks[d.rank]} rank. Defeat ${d.boss} to recover ${d.material}.`});
    l.world={kind:'World Dungeon',title:d.name,rank:d.rank,signature:d.material,desc:`Face ${d.boss} in ${d.name}. Fixed ${ranks[d.rank]} rank; 2 ${d.material} on Success, 3 on Exceptional Success, none on partial success or failure. One expedition per game day.`,encounters:[{name:`${d.name} approach`,stat:'dex',dc:-1},{name:`${d.name} inner defenses`,stat:'int',dc:0},{name:d.boss,stat:'con',dc:1}]};
  }
  // Keep the original starting dungeon and its generic materials for old recipes.
  V9_LOC['deepdelve-vault'].world.rank=0;
  const oldWorld=v9WorldQuest;
  v9WorldQuest=function(l){const q=oldWorld(l);if(q.kind!=='World Dungeon')return q;
    const rank=l.world.rank??l.minRank;
    return {...q,rank,fixedRank:true,dc:12+rank*2,reward:0,rep:0,...(l.world.signature?{signatureMaterial:l.world.signature,fixedLoot:[]}:{fixedLoot:[{material:'World Dungeon Relic',count:2},{material:'Ancient Trade Goods',count:4}]} )};
  };
  const oldPicker=v9RankPicker;v9RankPicker=function(q){return q.fixedRank?`<span class="pill gold">${ranks[q.rank]} rank · Fixed</span>`:oldPicker(q)};
  const oldSet=setPermRank;setPermRank=function(key,r){if(key==='world-dungeon'||all.some(d=>key==='world-'+d.id))return;return oldSet(key,r)};
  const oldQueue=queueQuestReport;
  queueQuestReport=function(q){const before=game.pendingReports.length,result=oldQueue.apply(this,arguments);
    if(q.signatureMaterial&&game.pendingReports.length>before){const r=game.pendingReports.at(-1);r.locationId=q.locationId;r.signatureMaterial=q.signatureMaterial;
      if(['Success','Exceptional Success'].includes(r.outcome)){const count=r.outcome==='Exceptional Success'?3:2;r.lootDrops.push({material:q.signatureMaterial,count,signatureDrop:true});const text=` Dungeon signature recovered: ${count} ${q.signatureMaterial}.`;r.summary+=text;r.extendedSummary+=text}
    }return result;
  };
  const oldTable=questLootTable;questLootTable=function(q){const rows=oldTable(q);if(q.signatureMaterial)rows.splice(1,0,[q.signatureMaterial,'Exclusive to this dungeon · 2 on Success; 3 on Exceptional Success; none on partial/failure']);return rows};
  const oldDiscovery=v9DiscoveryText;v9DiscoveryText=function(l){return oldDiscovery(l)+(l.world?.signature?` · Fixed ${ranks[l.world.rank]} rank · ${l.world.signature}`:'')};
  function gearIngredients(item){
    // Two ingredients per item at most; no recipe requires every dungeon.
    const rankGroups=[[],[0,1],[2],[3],[4],[5,6],[7,8],[9]];
    const family=item.weaponFamily||item.family,cat=item.category;
    const magic=['INT','WIS','CHA'].includes(item.stat),weapon=cat==='weapon';
    const soft=family==='leather'||family==='mail'||cat==='cape';
    const indexFor=rank=>[
      weapon?0:cat==='armor'?1:2,
      weapon?0:cat==='armor'||family==='shield'?1:2,
      soft?1:magic||family==='cloth'?2:0,
      magic?1:weapon?2:0,
      magic?1:soft?2:0,
      magic?1:soft?2:0,
      magic?0:weapon?2:1,
      cat==='ring'?2:magic?1:0,
      weapon?0:cat==='armor'||cat==='cape'?1:2,
      0
    ][rank];
    return Object.fromEntries(rankGroups[item.tier].map(rank=>{const d=all.filter(d=>d.rank===rank)[indexFor(rank)];return [d.material,item.tier>=6?3:1]}));
  }
  window.WL_DUNGEONS=Object.freeze({all,gearIngredients,source:name=>all.find(d=>d.material===name)?.name});
})();
