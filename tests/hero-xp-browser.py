from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
s=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parent.parent)));Thread(target=s.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto(f'http://127.0.0.1:{s.server_port}',wait_until='networkidle')
  page.evaluate('''() => {
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 for(let level=1;level<20;level++)check(growthNeeded(level)===250+25*(level<=4?4:level<=9?6:8+2*(level-10)),'threshold '+level);check(growthNeeded(20)===0,'cap threshold');
 check(staffCap()===plotCap()+1,'staff plus warehouse');
 for(const p of WL_SPEC_WEAPONS.all)check(p.hands===2&&p.offhand==='none'||p.hands===1&&['dual','shield','focus'].includes(p.offhand),'complete hands '+p.key);
 const old={id:'old',level:5,growth:3};migrateProgression(old);check(old.level===5&&old.growth===75,'old progress fraction preserved');migrateProgression(old);check(old.growth===75,'idempotent migration');
 const h={id:'xp-test',level:1,growth:75,heroXPVersion:1};check(addGrowthBase(h,1000)===3&&h.level===4&&h.growth===25,'multiple levels and carryover');h.level=19;h.growth=0;addGrowthBase(h,10000);check(h.level===20&&h.growth===0,'level cap');
 const reports=[{kind:'operation',dueAt:Date.now()+10000,growthAwards:[{id:'old',amount:2}]}];migratePendingReports(reports,1);migratePendingReports(reports,1);check(reports[0].growthAwards[0].amount===50,'legacy pending rewards convert once');
 for(const kind of ['Contract','Gathering','Exploration','Dungeon','World Dungeon','Raid','World Boss','World Raid']){check(questHeroXP({kind,rank:9},{level:1})>questHeroXP({kind,rank:0},{level:1}),'rank XP '+kind);check(questHeroXP({kind,rank:0},{level:20})<questHeroXP({kind,rank:0},{level:1}),'overlevel '+kind)}
 game.hall=7;game.gold=100000;game.buildingList.push({uid:'xp-shop',key:'workshop',level:5});game.staffMembers.push({id:'xp-smith',name:'Smith',wage:2,buildingUid:'xp-shop',buildingKey:'workshop',professionXP:{Blacksmithing:275}});v9Sync();staffMigrate(game);
 for(const r of renderGearCatalog())for(const k of Object.keys(r.requirements))game.materials[k]=100000;
 for(let t=0;t<8;t++){const items=[];for(const pattern of ['warrior-arms','death-knight-frost','shield']){craftGear(pattern+'-'+t);items.push(game.gear.at(-1))}check(items[0].price===items[1].price+items[2].price,'hand price parity tier '+t)}
 game.pendingReports=[];game.heroes=[{...structuredClone(game.player),id:'quest-xp',name:'Tester',level:1,rank:0,growth:0,heroXPVersion:1,ready:true}];const tier=perkTier;perkTier=()=>2;queueQuestReport({kind:'Contract',rank:0,ability:'str',minParty:1,reward:100,rep:1,dc:6,title:'XP test'},['quest-xp'],0,'test');perkTier=tier;const r=game.pendingReports.at(-1);check(r.heroXPVersion===1&&r.growthAwards[0].amount>=25,'actual quest XP');save();
 }''' );assert not errors,errors;b.close();print('PASS all 40 hand setups, eight-tier price parity, staff cap, XP migration/carryover/cap, legacy reports, rank scaling and actual quest XP')
finally:s.shutdown()
