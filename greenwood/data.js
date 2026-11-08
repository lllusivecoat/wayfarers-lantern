// Static species data and encounter configuration. No network is required.
export const roster = [
  ['bulbasaur',1,'Bulbasaur','Grass',45,49,49,45,'Common','A quiet woodland partner that thrives in the morning rain.','Forest','Morning','Rain','Overgrow'],
  ['charmander',4,'Charmander','Fire',39,52,43,65,'Common','A spirited partner, drawn to sunny clearings and warm rocks.','Rocky clearing','Day','Clear','Blaze'],
  ['squirtle',7,'Squirtle','Water',44,48,65,43,'Common','A sturdy partner that watches the woodland from the shallows.','Shoreline','Day','Rain','Torrent'],
  ['pikachu',25,'Pikachu','Electric',35,55,40,90,'Uncommon','Listen for a crackle in the trees when storm clouds gather.','Forest','Dusk','Storm','Static'],
  ['pidgey',16,'Pidgey','Flying',40,45,40,56,'Common','A familiar sight along open paths at the start of a new day.','Path','Morning','Clear','Keen Eye'],
  ['caterpie',10,'Caterpie','Bug',45,30,35,45,'Common','Freshly nibbled leaves reveal where this tiny traveller feeds.','Forest','Morning','Rain','Shield Dust'],
  ['eevee',133,'Eevee','Normal',55,55,50,55,'Rare','Curiosity draws this adaptable companion toward woodland camps.','Grass','Dusk','Clear','Adaptability'],
  ['geodude',74,'Geodude','Rock',40,80,100,20,'Common','It can be difficult to tell a resting Geodude from a stone.','Rocky clearing','Day','Clear','Sturdy'],
  ['gastly',92,'Gastly','Ghost',30,35,30,80,'Uncommon','It gathers in the cool mist around the old observatory.','Ruins','Night','Fog','Levitate'],
  ['oddish',43,'Oddish','Grass',45,50,55,30,'Common','Its little tracks crisscross the grass after the sun sets.','Grass','Night','Rain','Chlorophyll'],
  ['psyduck',54,'Psyduck','Water',50,52,48,55,'Common','Look for circles spreading across a quiet patch of water.','Shoreline','Day','Rain','Cloud Nine'],
  ['dratini',147,'Dratini','Dragon',41,64,45,50,'Rare','A patient search at the eastern shore may reveal a fleeting glimpse.','Eastern shore','Dusk','Rain','Shed Skin'],
  ['growlithe',58,'Growlithe','Fire',55,70,45,60,'Uncommon','A loyal wanderer whose pawprints cross the warm eastern rocks.','Rocky clearing','Day','Clear','Intimidate'],
  ['vulpix',37,'Vulpix','Fire',38,41,40,65,'Uncommon','It slips between the rocks just as the daylight begins to fade.','Rocky clearing','Dusk','Clear','Flash Fire'],
  ['mareep',179,'Mareep','Electric',55,40,40,35,'Common','Faint sparks cling to the grass wherever the flock has wandered.','Grass','Day','Storm','Static'],
  ['murkrow',198,'Murkrow','Flying',60,85,42,91,'Uncommon','It perches above the ruins, watching for a gleam of something lost.','Ruins','Night','Fog','Insomnia'],
  ['phanpy',231,'Phanpy','Ground',90,60,60,40,'Uncommon','Its playful tracks loop around the sandy woodland path.','Path','Morning','Clear','Pickup'],
  ['lapras',131,'Lapras','Water',130,85,80,60,'Rare','A gentle silhouette sometimes glides past the distant shoreline.','Shoreline','Morning','Rain','Water Absorb']
].map(([id,number,name,type,hp,attack,defence,speed,rarity,description,habitat,activity,weather,passive])=>({id,number,name,type,hp,attack,defence,speed,rarity,description,habitat,activity,weather,passive}));
export const get=id=>roster.find(p=>p.id===id);
export const colors={Grass:'#a6d69d',Fire:'#e8ac84',Water:'#8dc5dd',Electric:'#e0cd88',Flying:'#bfc9d1',Bug:'#c1d18b',Normal:'#c6b8a9',Rock:'#c9b997',Ghost:'#c3a5db',Dragon:'#adacd9',Ground:'#d6b892'};
export const icons={Grass:'❧',Fire:'♨',Water:'≈',Electric:'ϟ',Flying:'⋎',Bug:'♧',Normal:'✧',Rock:'⬡',Ghost:'☽',Dragon:'♜',Ground:'◈'};
export const map=['FFFFGGGG','FGGGWWGF','FGPPWWGF','GGPPGBGF','FGPPGWRR','FGGPGWRR','FGGPGBGR','FFFGGWFF'];
export const signs={'3,3':0,'6,4':1,'3,6':2};
export const clues=['Dratini has been spotted along the eastern shoreline. Search east of column 5.','Rain brings it out of hiding. Return when rain falls.','It surfaces at dusk. Watch the water as daylight fades.'];
export const weatherOptions=['Clear','Rain','Storm','Fog'];
export const timeOptions=['Morning','Day','Dusk','Night'];
export const events=[{id:'stormfront',name:'Stormfront',description:'Electric and Water encounters are more common.'},{id:'moonfall',name:'Moonlit gathering',description:'Gastly and Murkrow gather near the woodland ruins.'},{id:'swarm',name:'Meadow swarm',description:'Caterpie and Oddish are unusually active.'}];
export const tools=[{name:'Field Trap',price:150,count:10,bonus:0},{name:'Reinforced Trap',price:240,count:5,bonus:.18},{name:'Arcane Trap',price:300,count:3,bonus:.35}];
export const moves=[{name:'Quick attack',cost:1,power:12,kind:'neutral'},{name:'Element strike',cost:2,power:19,kind:'element',status:true},{name:'Power surge',cost:3,power:25,kind:'element'},{name:'Brace',cost:0,power:0,kind:'guard'}];
export const elementalMove={Grass:'Vine Whip',Fire:'Ember',Water:'Water Pulse',Electric:'Thunder Shock',Flying:'Gust',Bug:'Bug Bite',Normal:'Swift',Rock:'Rock Throw',Ghost:'Lick',Dragon:'Dragon Breath',Ground:'Mud Shot'};
export const achievementData=[['first-catch','First catch','Catch a Pokémon beyond your starter.'],['first-steps','Trailblazer','Explore 10 tiles.'],['research','Field researcher','See 8 different species.'],['hunter','Follow the signs','Discover all three Dratini clues.'],['collector','Collector 10','Own 10 individuals.'],['shiny','A different sparkle','Catch a Shiny Pokémon.'],['arena','Arena initiate','Win an AI arena match.'],['mastery','Old friends','Reach Mastery III.'],['dratini','Patient hunter','Catch Dratini.'],['battler','Finding your rhythm','Win 5 battles.']];
export const masteryRewards=['Profile badge','Passive insight','Ability insight','Cosmetic aura','Companion title'];
