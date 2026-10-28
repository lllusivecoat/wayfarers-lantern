/* Wayfarer's Lantern gear progression, crafting, and material rewards. */
(function(){
  const tiers=['Basic','Sturdy','Fine','Superior','Masterwork','Relic','Legendary','Heritage'];
  const bonuses=[1,1,2,2,3,3,4,4];
  const durability=[25,30,35,40,45,50,55,60];
  const guildUnlock=[0,1,2,3,4,6,8,9];
  const smithUnlock=[0,2,3,4,5,6,7,8];
  const tierCost=[10,15,25,40,70,110,170,250];
  const familyData=[
    ['weapon','sword','Sword','STR','metal',['Iron Shortblade','Guard’s Longsword','Silvered Blade','Runed Saber','Master-forged Edge','Relicblade','Dawnstar','Founders’ Oathblade']],
    ['weapon','greatsword','Greatsword','STR','metal',['Iron Greatsword','Reinforced Claymore','Silversteel Greatblade','Runed Executioner','Master-forged Zweihander','Relic Greatblade','Worldbreaker','First King’s Blade']],
    ['weapon','axe','Axe','STR','metal',['Iron Hatchet','Reinforced Battleaxe','Honed War Axe','Silveredge Cleaver','Master-forged Headsman','Relic Axe','Stormsplitter','First King’s Hatchet']],
    ['weapon','mace','Mace','STR','metal',['Iron Cudgel','Reinforced Mace','Steel Warhammer','Silvered Maul','Master-forged Crusher','Relic Maul','Earthshatter','Stonefather’s Hand']],
    ['weapon','dagger','Dagger','DEX','metalLeather',['Skinner’s Knife','Guard’s Dagger','Balanced Stiletto','Silverpoint Dirk','Master-forged Shadowknife','Relic Fang','Night’s Edge','First Whisper']],
    ['weapon','bow','Bow','DEX','woodLeather',['Short Hunting Bow','Reinforced Longbow','Yew Longbow','Silverwood Recurve','Master-forged Windbow','Relic Longbow','Farstrider','First Hunt']],
    ['weapon','crossbow','Crossbow','DEX','woodMetal',['Hand Crossbow','Reinforced Arbalest','Silverbolt Crossbow','Runed Arbalest','Master-forged Siegebow','Relic Boltthrower','Eagle’s Judgment','Founders’ Longshot']],
    ['weapon','gun','Gun','DEX','woodMetal',['Flintlock','Reinforced Hand Cannon','Steelbarrel Rifle','Silvershot Musket','Master-forged Longrifle','Relic Thunderer','Dragonfire','First Powdermaker’s Rifle']],
    ['weapon','polearm','Polearm','STR','woodMetal',['Ash Spear','Iron-tipped Pike','Balanced Glaive','Silverpoint Lance','Master-forged Halberd','Relic Sky-piercer','Worldtree’s Reach','Founders’ Spear']],
    ['weapon','staff','Staff','INT','woodArcane',['Oak Staff','Iron-bound Staff','Sagewood Staff','Kingsblood Rod','Master-forged Spellstaff','Relic Leyline Staff','Worldroot','First Arcanist’s Branch']],
    ['weapon','wand','Wand','INT','gemArcane',['Apprentice Wand','Coppercore Wand','Silverglass Wand','Kingsblood Focus','Master-forged Spellbinder','Relic Scepter','Starheart Wand','First Light Focus']],
    ['weapon','fist','Fist Weapon','DEX','metalLeather',['Wrapped Knuckles','Iron Knuckleguards','Steel Talons','Silverclaw Grips','Master-forged Runebreakers','Relic Dragonclaws','Thunderfists','Hands of the First']],
    ['offhand','shield','Shield','CON','woodMetal',['Wooden Buckler','Reinforced Shield','Steelguard Shield','Runed Ward','Masterwork Bulwark','Relic Aegis','Dawnward Shield','Founders’ Bulwark']],
    ['offhand','focus','Spell Focus','INT','gemArcane',['Apprentice Orb','Sturdy Spell Focus','Fine Crystal Focus','Runed Orb','Masterwork Spell Focus','Relic Spell Focus','Starheart Orb','First Arcanist’s Focus']],
    ['offhand','tome','Healer Tome','WIS','herbGem',['Novice Prayerbook','Sturdy Prayerbook','Fine Healing Tome','Runed Prayerbook','Masterwork Healing Tome','Relic Prayerbook','Dawnlight Codex','First Seer’s Tome']],
    ['armor','cloth','Cloth Armor','INT','clothArcane',['Apprentice Robes','Reinforced Robes','Fine Spellweave','Silverthread Vestments','Master-forged Arcanist Garb','Relicweave Raiment','Starcaller’s Robes','First Arcanist’s Vestments']],
    ['armor','leather','Leather Armor','DEX','leather',['Scout’s Leathers','Reinforced Hide','Medium-hide Armor','Shadowstalker Leathers','Master-forged Ranger’s Gear','Relic Hide','Farstrider’s Armor','First Huntmaster’s Leathers']],
    ['armor','mail','Mail Armor','CON','metalLeather',['Copper-ring Hauberk','Reinforced Mail','Silvered Chainmail','Kingsblood-linked Mail','Master-forged Scale Armor','Relic Hauberk','Stormguard Mail','First Warden’s Mail']],
    ['armor','plate','Plate Armor','STR','metalLeather',['Iron Cuirass','Reinforced Plate','Silversteel Armor','Runed Bulwark','Master-forged Warplate','Relic Plate','Worldbreaker Plate','First King’s Aegis']],
    ['cape','cape','Cape','WIS','clothLeather',['Traveler’s Mantle','Reinforced Cloak','Silverthread Cape','Kingsblood Cloak','Master-forged Mantle','Relicweave Cape','Starcaller’s Shroud','Founders’ Mantle']],
    ['ring','might','Ring of Might','STR','metalGem',['Copper Band','Reinforced Signet','Silver Signet','Kingsblood Seal','Master-forged Mightband','Relic Signet of Strength','Worldbreaker Ring','Founders’ Ring of Might']],
    ['ring','finesse','Ring of Finesse','DEX','metalLeather',['Copper Loop','Scout’s Signet','Silver Loop','Windrider Ring','Master-forged Finesseband','Relic Ring of Precision','Farstrider’s Loop','First Hunt Ring']],
    ['ring','fortitude','Ring of Fortitude','CON','metalLeather',['Iron Band','Warden’s Ring','Silver Bulwark','Kingsblood Seal','Master-forged Fortitude Ring','Relic Ring of Endurance','Stoneheart Ring','First Guardian’s Band']],
    ['ring','intellect','Ring of Intellect','INT','gemArcane',['Copper Focus Ring','Scholar’s Band','Silver Focus Ring','Kingsblood Signet','Master-forged Mindband','Relic Ring of Insight','Starheart Signet','First Arcanist’s Ring']],
    ['ring','wisdom','Ring of Wisdom','WIS','herbGem',['Herbalist’s Band','Wayfinder’s Ring','Silver Eye','Kingsblood Loop','Master-forged Wisdom Ring','Relic Ring of Foresight','Worldroot Signet','First Seer’s Ring']],
    ['ring','presence','Ring of Presence','CHA','metalArcane',['Copper Signet','Envoy’s Ring','Silver Diplomat’s Band','Kingsblood Seal','Master-forged Presence Ring','Relic Ring of Command','Dawnstar Signet','First Envoy’s Ring']]
  ];
  const catalog=[];
  familyData.forEach(([category,family,label,stat,mat,names])=>names.forEach((name,tier)=>catalog.push({id:`${family}-${tier}`,category,family,label,name,tier,stat,mat,bonus:bonuses[tier],durability:durability[tier]})));
  const matByType={
    metalArcane:['Copper Ore','Copper Ore','Silver Ore','Silver Ore','Mithril Ore','Thorium Ore','Eternium Ore','Eternium Ore'],
    metal:['Copper Ore','Copper Ore','Silver Ore','Silver Ore','Mithril Ore','Thorium Ore','Eternium Ore','Eternium Ore'],
    metalLeather:['Copper Ore','Copper Ore','Silver Ore','Silver Ore','Mithril Ore','Thorium Ore','Eternium Ore','Eternium Ore'],
    woodLeather:['Timber','Timber','Seasoned Timber','Seasoned Timber','Enchanted Timber','Ancient Timber','Ancient Timber','Ancient Timber'],
    woodMetal:['Timber','Timber','Seasoned Timber','Seasoned Timber','Enchanted Timber','Ancient Timber','Ancient Timber','Ancient Timber'],
    woodArcane:['Timber','Timber','Seasoned Timber','Seasoned Timber','Enchanted Timber','Ancient Timber','Ancient Timber','Ancient Timber'],
    clothArcane:['Wool Cloth','Wool Cloth','Silk Cloth','Silk Cloth','Arcane Thread','Runecloth','Runecloth','Runecloth'],
    leather:['Light Leather','Light Leather','Medium Leather','Medium Leather','Heavy Leather','Thick Leather','Rugged Leather','Rugged Leather'],
    clothLeather:['Wool Cloth','Wool Cloth','Silk Cloth','Silk Cloth','Arcane Thread','Runecloth','Runecloth','Runecloth'],
    metalGem:['Copper Ore','Copper Ore','Silver Ore','Silver Ore','Mithril Ore','Thorium Ore','Eternium Ore','Eternium Ore'],
    gemArcane:['Raw Gem','Raw Gem','Flawless Gem','Flawless Gem','Arcane Crystal','Arcane Crystal','Arcane Crystal','Arcane Crystal'],
    herbGem:['Peacebloom','Peacebloom','Kingsblood','Kingsblood','Kingsblood','Arcane Crystal','Arcane Crystal','Arcane Crystal']
  };
  const extraByTier=['','', '', 'Dungeon Salvage', 'Dungeon Salvage', 'Rare Raid Relic', 'Campaign Spoils', 'World Dungeon Relic'];
  function requirements(item){
    const t=item.tier,main=matByType[item.mat][t],req={[main]:2+Math.floor(t/2)};
    if(item.mat==='metalLeather'||item.mat==='woodLeather'||item.mat==='clothLeather'){const l=['Light Leather','Light Leather','Medium Leather','Medium Leather','Heavy Leather','Thick Leather','Rugged Leather','Rugged Leather'][t];req[l]=(req[l]||0)+1+Math.floor(t/4)}
    if(item.mat==='woodMetal')req[matByType.metal[t]]=(req[matByType.metal[t]]||0)+1+Math.floor(t/4);
    if(item.mat==='woodArcane'||item.mat==='metalArcane')req[['Peacebloom','Peacebloom','Kingsblood','Kingsblood','Kingsblood','Kingsblood','Arcane Crystal','Arcane Crystal'][t]]=(req[['Peacebloom','Peacebloom','Kingsblood','Kingsblood','Kingsblood','Kingsblood','Arcane Crystal','Arcane Crystal'][t]]||0)+1;
    if(item.mat==='clothArcane'||item.mat==='clothLeather'){const m=['Peacebloom','Peacebloom','Kingsblood','Kingsblood','Kingsblood','Kingsblood','Arcane Crystal','Arcane Crystal'][t];req[m]=(req[m]||0)+1}
    if(item.mat==='metalGem'){const m=['Raw Gem','Raw Gem','Flawless Gem','Flawless Gem','Arcane Crystal','Arcane Crystal','Arcane Crystal','Arcane Crystal'][t];req[m]=(req[m]||0)+1}
    if(item.mat==='gemArcane'||item.mat==='herbGem'){const m=item.mat==='herbGem'?['Raw Gem','Raw Gem','Flawless Gem','Flawless Gem','Arcane Crystal','Arcane Crystal','Arcane Crystal','Arcane Crystal'][t]:['Peacebloom','Peacebloom','Kingsblood','Kingsblood','Kingsblood','Kingsblood','Arcane Crystal','Arcane Crystal'][t];req[m]=(req[m]||0)+1}
    const extra=extraByTier[t];if(extra)req[extra]=t>=6?2:1;
    if(t===7&&item.family==='sword')req['Heritage Ore']=1;
    return Object.fromEntries(Object.entries(req).map(([name,n])=>[name,Math.max(1,Math.ceil(n*(1-WL_STAFF.service('workshop').materialDiscount)))]));
  }
  function craftInfo(item){
    const staff=WL_STAFF.service('workshop'),base=Math.min(6,item.bonus+staff.buildingBonus);
    return {staff,base,extra:Math.min(staff.extra,6-base),durability:item.durability+staff.durability,cost:Math.max(1,Math.ceil(tierCost[item.tier]*staff.craftCost))};
  }
  function groupFor(item){return item.category==='weapon'?'weapon':item.category==='armor'?'armor':item.category==='cape'?'cape':'amulet'}
  function capText(){return 'Equipped gear contributes up to +6 readiness to checks using the same stat.'}
  function unlockName(t){return guildTiers[guildUnlock[t]]||'Renowned'}
  function recipeAvailable(item,smith){return smith>=smithUnlock[item.tier]}
  let selectedCategory='weapon',selectedFamily='sword',selectedTier=0;
  function selectedRecipe(){return catalog.find(x=>x.category===selectedCategory&&x.family===selectedFamily&&x.tier===Number(selectedTier))||catalog.find(x=>x.category===selectedCategory)||catalog[0]}
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function sourceFor(name){
    if(name==='Heritage Ore')return 'Renown-rank contract success only';
    if(/Ore/.test(name))return 'Mining missions · rank-appropriate dungeon and raid caches';
    if(/Crystal|Gem/.test(name))return 'Mining or Jewelcrafting missions · rank-appropriate dungeon and raid caches';
    if(/Leather/.test(name))return 'Skinning missions · hides salvaged from dungeon beasts';
    if(/Timber/.test(name))return 'Woodcutting missions · dungeon crates and ruined weapon stores';
    if(/Cloth|Thread|Runecloth/.test(name))return 'Tailoring missions · dungeon stores and enemy supply caches';
    if(/Peacebloom|Kingsblood/.test(name))return 'Herbalism missions · arcane and dungeon caches';
    if(name==='Dungeon Salvage')return 'Dungeon success and exceptional reports';
    if(name==='Rare Raid Relic'||name==='Campaign Spoils')return 'High-rank raid reports';
    if(name==='World Dungeon Relic')return 'World Dungeon success';
    return 'Appropriate-rank profession missions and dungeons';
  }
  function bonusText(item){return `+${item.bonus} readiness on ${item.stat} checks while durable. ${capText()}`}
  function ensureCraftModal(){if(document.getElementById('gear-crafted-modal'))return;const m=document.createElement('div');m.id='gear-crafted-modal';m.className='modal';m.innerHTML='<div class="modalbox gear-crafted-box" role="dialog" aria-modal="true" aria-labelledby="gear-crafted-title"><div class="eyebrow">Crafting complete</div><h2 id="gear-crafted-title"></h2><div id="gear-crafted-details" class="muted"></div><div class="modalactions"><button class="btn" onclick="closeGearCrafted()">Continue</button></div></div>';document.body.appendChild(m)}
  function injectStyles(){if(document.getElementById('gear-system-styles'))return;const s=document.createElement('style');s.id='gear-system-styles';s.textContent='.gear-craft-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:12px 0}.gear-craft-controls label{display:grid;gap:5px;color:var(--muted);font:11px system-ui,sans-serif}.gear-craft-preview{border:1px solid var(--line);border-radius:9px;padding:12px;margin:10px 0;background:#0f1d2e}.gear-craft-preview h3{margin-bottom:5px}.gear-craft-preview p{margin:5px 0;font:12px/1.5 system-ui,sans-serif}.gear-craft-requirements{display:grid;grid-template-columns:1fr auto;gap:5px 10px;margin-top:8px;font:11px system-ui,sans-serif}.gear-craft-short{color:#f0a99d}.gear-crafted-box{width:min(520px,100%)}.gear-crafted-box h2{margin:0 0 10px}.gear-crafted-box p{margin:8px 0}.gear-tier-lock{color:#e9c878}@media(max-width:600px){.gear-craft-controls{grid-template-columns:1fr}}';document.head.appendChild(s)}
  window.closeGearCrafted=function(){document.getElementById('gear-crafted-modal')?.classList.remove('open')};
  window.gearCraftSetCategory=function(v){selectedCategory=v;const first=catalog.find(x=>x.category===v);selectedFamily=first?.family||'sword';selectedTier=0;renderWarehouse()};
  window.gearCraftSetFamily=function(v){selectedFamily=v;renderWarehouse()};
  window.gearCraftSetTier=function(v){selectedTier=Number(v);renderWarehouse()};
  window.craftGear=function(id){
    const item=catalog.find(x=>x.id===id);if(!item)return alert('Choose a gear pattern first.');
    if(!buildingOperational('workshop'))return alert('Build the Workshop and hire its Smith before crafting.');
    const smith=staffProfessionLevel(buildingStaff('workshop')),req=requirements(item),info=craftInfo(item),cost=info.cost,missing=Object.entries(req).find(([n,q])=>(game.materials[n]||0)<q);
    if(!recipeAvailable(item,smith))return alert(`${tiers[item.tier]} gear requires Blacksmithing ${smithUnlock[item.tier]}.`);
    if(missing)return alert(`Crafting requires ${missing[1]} ${missing[0]}. Source: ${sourceFor(missing[0])}.`);
    Object.entries(req).forEach(([n,q])=>game.materials[n]=Math.max(0,(game.materials[n]||0)-q));
    const qualityProc=Math.random()<info.staff.quality,extra=qualityProc?info.extra:0,extraDurability=qualityProc&&!info.extra?5:0,totalDurability=info.durability+extraDurability;
    const uid=`crafted-${item.id}-${Date.now()}`,gear={id:uid,name:item.name,kind:item.category==='offhand'?'Offhand':item.category==='ring'?'Ring':item.category==='cape'?'Cape':item.category==='armor'?'Armor':'Weapon',slot:item.category==='offhand'?'Offhand':item.category==='ring'?'Ring':item.category==='cape'?'Cape':item.category==='armor'?'Armor':'Weapon',family:item.family,tier:item.tier,tierName:tiers[item.tier],bonus:info.base+extra,buildingBonus:info.staff.buildingBonus,extraBonus:extra,extraDurability,qualityProc,stat:item.stat,owner:null,level:0,durability:totalDurability,maxDurability:totalDurability,madeByPlayer:true,price:Math.ceil(cost*1.5),effectText:bonusText({...item,bonus:info.base+extra}),craftRequirements:req};
    game.gear.push(gear);practiceStaff('workshop',1);v9CraftUse();
    addLog('Gear crafted',`${gear.name} (${gear.tierName}): ${gear.effectText} Durability ${gear.durability}/${gear.maxDurability}.`);render();save();
    ensureCraftModal();document.getElementById('gear-crafted-title').textContent=gear.name;document.getElementById('gear-crafted-details').innerHTML=`<p><span class="pill gold">${gear.tierName}</span> · ${gear.kind} · ${gear.price} gp to equip</p><p><strong>${gear.effectText}</strong> Building bonus: +${info.staff.buildingBonus}. Extra crafted bonus: +${extra} ${item.stat}${extraDurability?`; readiness is capped, so quality added +${extraDurability} durability`:''}.</p><p>Durability: ${gear.durability}/${gear.maxDurability}. Materials spent: ${Object.entries(req).map(([n,q])=>`${q} ${n}`).join(', ')}.</p>`;document.getElementById('gear-crafted-modal').classList.add('open');document.querySelector('#gear-crafted-modal button')?.focus();
  };
  const previousGatheringQuest=gatheringQuest;
  if(!gatherProfessions.includes('Woodcutting'))gatherProfessions.push('Woodcutting');
  if(!gatherProfessions.includes('Tailoring'))gatherProfessions.push('Tailoring');
  if(!gatherProfessions.includes('Jewelcrafting'))gatherProfessions.push('Jewelcrafting');
  window.gatheringQuest=function(profession){
    if(!['Woodcutting','Tailoring','Jewelcrafting'].includes(profession)){
      const q=previousGatheringQuest(profession);if(!q)return q;q.rank=v9PermRank(q.templateKey,Math.min(9,guildTierIndex()));q.dc=10+q.rank*2;q.resourceQtyBase=2+q.rank*2;q.minParty=1+Math.floor(q.rank/2);q.reward=0;
      if(profession==='Mining')q.rareResource=q.rank>=8?'Eternium Ore':q.rank>=6?'Thorium Ore':q.rank>=4?'Mithril Ore':'Silver Ore';
      if(profession==='Skinning')q.rareResource=q.rank>=8?'Rugged Leather':q.rank>=6?'Thick Leather':q.rank>=4?'Heavy Leather':'Medium Leather';
      return q;
    }
    const rank=v9PermRank(`gather-${profession.toLowerCase()}`,Math.min(9,guildTierIndex())),data={Woodcutting:['Timber',rank>=7?'Ancient Timber':rank>=4?'Enchanted Timber':rank>=2?'Seasoned Timber':'Timber','str','Gather wood from safe trails; higher-rank routes reach ancient and enchanted groves.'],Tailoring:['Wool Cloth',rank>=6?'Runecloth':rank>=4?'Arcane Thread':rank>=2?'Silk Cloth':'Wool Cloth','int','Recover and prepare cloth supplies; higher-rank missions reach rare weave and arcane thread.'],Jewelcrafting:['Raw Gem',rank>=5?'Arcane Crystal':rank>=2?'Flawless Gem':'Raw Gem','int','Seek and cut rough stones; higher-rank routes uncover flawless gems and arcane crystals.']}[profession];
    const id=`gather-${profession.toLowerCase()}`;return {id,templateKey:id,kind:'Gathering',jobType:'Gathering expedition',profession,title:`${profession} Expedition`,desc:data[3],ability:data[2],rank,dc:10+rank*2,reward:0,rep:0,resource:data[0],resourceQtyBase:2+rank*2,minParty:1+Math.floor(rank/2),icon:'✦',persistent:true,expiresDay:null,bonusKind:'Gathering',rareResource:data[1]};
  };
  const previousQueueQuestReport=queueQuestReport;
  window.queueQuestReport=function(q,partyIds,storyBonus,storySummary,dueAt){
    previousQueueQuestReport.apply(this,arguments);const r=game.pendingReports[game.pendingReports.length-1];if(!r||r.questKind==='Gathering'||!['Success','Exceptional Success'].includes(r.outcome))return;
    const band=Math.max(0,Math.min(4,Math.floor((Number(q.rank)||0)/2))),pools=[['Copper Ore','Light Leather','Timber','Wool Cloth','Raw Gem','Peacebloom'],['Silver Ore','Medium Leather','Seasoned Timber','Silk Cloth','Flawless Gem','Kingsblood'],['Mithril Ore','Heavy Leather','Enchanted Timber','Arcane Thread','Arcane Crystal','Kingsblood'],['Thorium Ore','Thick Leather','Ancient Timber','Runecloth','Arcane Crystal','Kingsblood'],['Eternium Ore','Rugged Leather','Ancient Timber','Runecloth','Arcane Crystal','Kingsblood']];
    const combatLoot=['Dungeon','World Dungeon','Raid','World Boss','World Raid'].includes(q.kind),rank=Number(q.rank)||0;
    if(combatLoot||rank>=2){const pool=pools[band],pick=pool[Math.floor(Math.random()*pool.length)],n=r.outcome==='Exceptional Success'?2:1;r.lootDrops=r.lootDrops||[];r.lootDrops.push({material:pick,count:n,craftingDrop:true})}
    if(q.kind==='Contract'&&rank===9){r.lootDrops=r.lootDrops||[];r.lootDrops.push({material:'Heritage Ore',count:1,craftingDrop:true});r.renownOre=true}
    const extra=(r.lootDrops||[]).filter(x=>x.craftingDrop);if(extra.length){const line=extra.map(x=>`${x.count} ${x.material}`).join(', ');r.summary+=` Crafting materials secured: ${line}.`;r.extendedSummary=(r.extendedSummary||r.summary)+` Crafting materials secured: ${line}.`}
  };
  const previousQuestLootTable=questLootTable;
  window.questLootTable=function(q){const rows=previousQuestLootTable(q);if(q.kind==='Contract'&&Number(q.rank)===9)rows.splice(1,0,['Heritage Ore','1 guaranteed on Success or Exceptional Success · Renown-rank contracts only']);else if(['Dungeon','World Dungeon','Raid','World Boss','World Raid'].includes(q.kind)||Number(q.rank)>=2)rows.splice(Math.max(0,rows.length-1),0,['Tiered crafting material','1 on success; material grade follows quest rank and type']);return rows};
  const previousReadinessBase=readinessBase;
  window.readinessBase=function(hero,ability){
    const key=ability||(SPEC_STATS[hero.className]?.[hero.spec]?.[0])||classAbility[hero.className]||'str',score=abilityModifier((hero.abilities||defaultAbilities(hero.className))[key]),equipment=hero.equipment&&typeof hero.equipment==='object'?Object.values(hero.equipment):[hero.gear],gearBonus=[...new Set(equipment.filter(Boolean))].reduce((n,id)=>{const item=game.gear.find(g=>g.id===id);if(!item||item.durability<=0)return n;const stat=String(item.stat||'').toLowerCase();return !stat||stat===String(key).toLowerCase()?n+(Number(item.bonus)||0):n},0);return score+(hero.preparedBonus||0)+Math.min(6,gearBonus)+(hero.spec==='Protection'||hero.spec==='Guardian'||hero.spec==='Blood'||hero.spec==='Vengeance'?1:0)
  };
  const previousRenderWarehouse=renderWarehouse;
  window.renderWarehouse=function(){
    const mats=document.getElementById('warehouse-materials');if(mats)mats.innerHTML=Object.entries(game.materials||{}).filter(([,n])=>n>0).map(([n,c])=>`<span class="item">${esc(n)} · ${c}</span>`).join(' ')||'<span class="small muted">No materials stored yet. Gathering missions add stock.</span>';
    const consumables=document.getElementById('warehouse-consumables');if(consumables)consumables.innerHTML=(game.consumables||[]).map(x=>`<div class="building"><strong>${esc(x.name)}</strong><span class="pill">${x.uses} uses left</span><p>One use grants +${Math.min(2,Number(x.bonus)||1)} readiness to a hero’s next expedition.</p></div>`).join('')||'<span class="small muted">No limited-use items.</span>';
    const gearRoot=document.getElementById('warehouse-gear');if(gearRoot)gearRoot.innerHTML=(game.gear||[]).map(g=>`<div class="building"><div><strong>${esc(g.name)}${g.madeByPlayer?' · Crafted by the guild':''}${g.tierName?` · ${esc(g.tierName)}`:''}</strong><div class="small muted">+${Number(g.bonus)||0} ${esc(g.stat||'readiness')} readiness${g.effectText?` · ${esc(g.effectText)}`:''} · durability ${g.durability??0}/${g.maxDurability??0}${g.madeByPlayer?` · equip price ${g.price||0} gp`:''}</div></div><span class="pill ${g.durability?'':'gold'}">${g.owner?(purse(g.owner)?.name||'Equipped'):'Warehouse'}</span>${g.owner&&g.durability<g.maxDurability?`<button class="btn secondary" onclick="repairGear('${g.id}')">Repair · personal gold</button>`:''}<p>At 0 durability the gear bonus is inactive. ${g.effectText?esc(g.effectText):''}</p></div>`).join('')||'<span class="small muted">No gear in storage.</span>';
    const smith=staffProfessionLevel(buildingStaff('workshop')),root=document.getElementById('craft-actions');if(!root)return;
    const families=familyData.filter(x=>x[0]===selectedCategory),family=families.find(x=>x[1]===selectedFamily)||families[0];if(family)selectedFamily=family[1];const item=selectedRecipe();if(!item)return previousRenderWarehouse();
    const cats=[['weapon','Weapons'],['armor','Armor'],['offhand','Offhands'],['cape','Capes'],['ring','Rings']];
    const req=requirements(item),unlocked=recipeAvailable(item,smith),missing=Object.entries(req).some(([n,q])=>(game.materials[n]||0)<q),info=craftInfo(item),cost=info.cost;
    const blocked=!game.buildings?.workshop?'Requires Workshop':!buildingOperational('workshop')?'Requires an assigned smith and completed Workshop':!unlocked?`Requires Blacksmithing ${smithUnlock[item.tier]}`:missing?'Requires materials':'';
    const reqHTML=Object.entries(req).map(([n,q])=>`<span class="${(game.materials[n]||0)<q?'gear-craft-short':''}">${esc(n)} — need ${q}, have ${game.materials[n]||0}<br><small>${esc(sourceFor(n))}</small></span><b class="${(game.materials[n]||0)<q?'gear-craft-short':''}">${game.materials[n]||0}/${q}</b>`).join('');
    root.innerHTML=`<div class="small muted">Eight tiers from Basic to Heritage. Basic recipes are available immediately with an assigned smith, including Blacksmithing Level 0. No daily gear-crafting limit; each item consumes its listed materials. Gear improves readiness only on checks using its listed stat. ${capText()} Blacksmithing ${smith}: ${WL_STAFF.percent(info.staff.materialDiscount)} combined material reduction (45% cap); ${WL_STAFF.percent(info.staff.quality)} chance of ${info.extra?`an extra +${info.extra} ${item.stat}`:'+5 durability because readiness is capped'}. Building readiness +${info.staff.buildingBonus}; staff/building durability +${info.staff.durability}.</div><div class="gear-craft-controls"><label>Gear type<select onchange="gearCraftSetCategory(this.value)">${cats.map(([v,l])=>`<option value="${v}" ${selectedCategory===v?'selected':''}>${l}</option>`).join('')}</select></label><label>Pattern<select onchange="gearCraftSetFamily(this.value)">${families.map(f=>`<option value="${f[1]}" ${selectedFamily===f[1]?'selected':''}>${esc(f[2])}</option>`).join('')}</select></label><label>Tier<select onchange="gearCraftSetTier(this.value)">${tiers.map((t,i)=>`<option value="${i}" ${item.tier===i?'selected':''} ${smith<smithUnlock[i]?'disabled':''}>${t}${smith<smithUnlock[i]?` · Blacksmithing ${smithUnlock[i]}`:''}</option>`).join('')}</select></label></div><div class="gear-craft-preview"><h3>${esc(item.name)} <span class="pill gold">${tiers[item.tier]}</span></h3><p><strong>Crafted bonus:</strong> ${esc(bonusText({...item,bonus:info.base}))} Possible quality bonus: ${info.extra?'+'+info.extra+' '+item.stat:'+5 durability at the readiness cap'}.</p><p><strong>Slot:</strong> ${item.category==='offhand'?'Offhand':item.category==='weapon'?(['staff','greatsword','bow','crossbow','gun','polearm'].includes(item.family)?'Two-handed weapon; offhand must be empty':'One-handed weapon'):item.category} · <strong>Durability:</strong> ${info.durability} · <strong>Crafting cost:</strong> materials only · <strong>Hero equip price:</strong> ${Math.ceil(cost*1.5)} gp</p><p><strong>Unlocks:</strong> Blacksmithing ${smithUnlock[item.tier]}. ${unlocked?'Available now.':`Currently Blacksmithing ${smith}.`}</p><div class="divider"></div><strong>Required materials</strong><div class="gear-craft-requirements">${reqHTML}</div></div><button class="btn secondary" onclick="craftGear('${item.id}')" ${blocked?'disabled':''}>${blocked?esc(blocked):'Craft '+esc(item.name)}</button>${blocked?`<p class="muted" role="status">${esc(blocked)}</p>`:''}`;
    let provisions=document.getElementById('provision-crafting');
    if(!provisions){provisions=document.createElement('article');provisions.id='provision-crafting';provisions.className='card';provisions.style.marginTop='20px';document.getElementById('warehouse').appendChild(provisions)}
    provisions.innerHTML=`<h3>Provision crafting</h3><p style="margin:18px 0;line-height:1.8">Field Draught · 3 uses. Each use grants +1 readiness for the next expedition. Food and draught readiness do not stack; the stronger bonus applies.</p><p style="margin:18px 0;line-height:1.8">Requires an operational Warehouse, 2 Peacebloom; no gold charge. Stored Peacebloom: ${game.materials['Peacebloom']||0}.</p><button class="btn secondary" onclick="craftDraught()" ${!buildingOperational('warehouse')||(game.materials['Peacebloom']||0)<2?'disabled':''}>Make Field Draught · 2 Peacebloom</button>`;
  };
  function augmentQuestResources(){
    const values={Timber:2,'Seasoned Timber':4,'Enchanted Timber':9,'Ancient Timber':18,'Wool Cloth':2,'Silk Cloth':5,'Arcane Thread':12,Runecloth:18,'Raw Gem':4,'Flawless Gem':10,'Arcane Crystal':22,'Mithril Ore':14,'Thorium Ore':24,'Eternium Ore':35,'Heavy Leather':8,'Thick Leather':15,'Rugged Leather':25,'Dungeon Salvage':12,'Heritage Ore':120};Object.assign(tradeValues,values);
  }
  injectStyles();augmentQuestResources();ensureCraftModal();
  window.renderGearCatalog=()=>catalog.map(x=>({...x,requirements:requirements(x)}));
  try{renderWarehouse()}catch(e){console.warn('Gear bench initialization deferred',e)}
})();
