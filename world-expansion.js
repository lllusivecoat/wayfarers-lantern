/* More discoverable trade towns and contract sites, using existing exploration gates. */
(() => {
 const rows=[
 ['goldshire','Goldshire','Elwynn Forest','town',0,0,0,0,'Lion’s Pride Supply Escort','A busy crossroads inn needs dependable deliveries.'],
 ['kharanos','Kharanos','Dun Morogh','town',0,0,0,2,'Kharanos Workshop Repairs','Dwarven workshops seek help maintaining their equipment.'],
 ['crossroads','The Crossroads','Northern Barrens','town',1,1,50,0,'Crossroads Caravan Relief','Caravans converge on this exposed Barrens outpost.'],
 ['astranaar','Astranaar','Ashenvale','town',2,2,100,5,'Astranaar Forest Rescue','Sentinels need help locating travelers in the ancient forest.'],
 ['warsong-lumber-camp','Warsong Lumber Camp','Ashenvale','landmark',2,2,100,1,'Warsong Supply Recovery','Recover scattered supplies along contested woodland tracks.'],
 ['stromgarde-keep','Stromgarde Keep','Arathi Highlands','landmark',3,3,200,3,'Stromgarde Ruins Survey','Survey the ruined fortifications and report hostile movements.'],
 ['feathermoon','Feathermoon Stronghold','Feralas','town',3,4,400,0,'Feathermoon Coastal Escort','A Sentinel stronghold maintains coastal supply lines.'],
 ['blackrock-approach','Blackrock Mountain Approach','Burning Steppes','landmark',4,5,700,1,'Blackrock Expedition Salvage','Recover expedition supplies from the mountain’s dangerous approaches.'],
 ['everlook','Everlook','Winterspring','town',4,6,1000,0,'Everlook Winter Caravan','Goblin merchants trade supplies across the frozen highlands.'],
 ['wyrmrest-temple','Wyrmrest Temple','Dragonblight','landmark',5,7,1400,3,'Wyrmrest Patrol Survey','Record threats along the routes surrounding the temple.'],
 ['argent-tournament','Argent Tournament Grounds','Icecrown','landmark',5,8,1900,2,'Argent Tournament Preparations','Support the equipment and fortifications of the Argent expedition.'],
 ['firelands-approach','Firelands Approach','Mount Hyjal','landmark',6,9,2500,5,'Hyjal Expedition Rescue','Search the scorched approaches for missing expedition members.']
 ];
 for(const [id,name,zone,type,ring,minRank,minRep,kind,title,flavour] of rows){if(V9_LOC[id])continue;const loc={id,name,zone,type,ring,minRank,minRep,flavour,sites:[[kind,title,zone]],types:[],world:null,start:false};V9_WORLD.locations.push(loc);V9_LOC[id]=loc}
 const discovery=v9DiscoveryText;v9DiscoveryText=function(l){return discovery(l)+(['town','city'].includes(l.type)?' · Opens an inbound market and outbound trade route':'')};
 window.WL_WORLD_EXPANSION=Object.freeze({ids:rows.map(r=>r[0])});
 v9WorldEnsure(game);v9ApplyWorldPools(game);render();
})();
