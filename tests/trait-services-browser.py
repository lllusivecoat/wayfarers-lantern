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
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};game.hall=7;game.gold=10000;game.pendingReports=[];game.buildingList.push({uid:'enh-shop',key:'workshop',level:5});game.staffMembers.push({id:'enh-smith',name:'Smith',wage:2,buildingUid:'enh-shop',buildingKey:'workshop',professionXP:{Blacksmithing:225},aptitudes:{Organisation:1,Craftsmanship:1,Care:1,Fieldcraft:1},personality:null,staffProfileVersion:1});v9Sync();staffMigrate(game);
 game.buildingList.push({uid:'trait-hall',key:'trainingHall',level:1});game.staffMembers.push({id:'trait-trainer',name:'Trainer',wage:2,buildingUid:'trait-hall',buildingKey:'trainingHall',professionXP:{Training:0}});v9Sync();staffMigrate(game);
 const h=game.player;h.ready=true;h.wound=null;h.equipment={};h.gear=null;h.gold=500;h.traits=['Greedy','Brave'];h.traitProgress={'since:Greedy':{n:3},'since:Brave':{n:4}};const confirmOld=window.confirm,random=Math.random;window.confirm=()=>false;
 const gold=game.gold;check(!replaceHeroTrait(h.id,'Greedy','Frugal')&&h.gold===500&&game.gold===gold,'cancel free');window.confirm=()=>true;check(!replaceHeroTrait(h.id,'Greedy','Cowardly'),'conflict blocked');check(!replaceHeroTrait(h.id,'Greedy','Brave'),'duplicate blocked');
 const next=replaceHeroTrait(h.id,'Greedy','Frugal');check(next==='Frugal'&&h.gold===400&&game.gold===gold+100,'specific payment and replacement');check(h.traits.includes('Brave')&&h.traitProgress['since:Brave'].n===4,'other progress retained');Math.random=()=>0;const before=[...h.traits];const reroll=replaceHeroTrait(h.id,'Frugal');check(reroll&&reroll!=='Frugal'&&TRAITS[reroll].rollable&&h.traits.length===2&&h.gold===390&&game.gold===gold+110,'random replacement and fee');
 h.gold=0;const unchanged=JSON.stringify(h.traits);check(!replaceHeroTrait(h.id,h.traits[0])&&JSON.stringify(h.traits)===unchanged,'insufficient funds');h.gold=500;h.ready=false;check(!replaceHeroTrait(h.id,h.traits[0]),'away blocked');h.ready=true;h.training={trait:h.traits[0]};check(!replaceHeroTrait(h.id,h.traits[0]),'active training blocked');h.training=null;
 renderBuildings();check(document.getElementById('trait-reroll-panel').textContent.includes('100 gp'),'Training Hall controls');
 const g={id:'fee-scale',name:'Sword',kind:'Weapon',family:'sword',tier:0,bonus:1,madeByPlayer:true,owner:h.id,durability:25,maxDurability:25,enhancementVersion:2,enhancement:0};game.gear.push(g);
 for(let tier=0;tier<8;tier++)for(let stage=1;stage<=4;stage++){g.tier=tier;g.enhancement=stage-1;check(gearEnhancementQuote(g.id).gold===20+30*tier+30*(stage-1),'fee scale '+tier+'/'+stage)}
 const r={title:'Report spacing',outcome:'Success',extendedSummary:'Level progress earned: Kael Arden +56 XP. Traits, bonds & wounds: none.',partyIds:[h.id],memberAwards:[{id:h.id,amount:7}],memberCut:7};showReportDetails(r);const xp=document.querySelector('.report-xp'),gp=document.querySelector('.report-member-gold');check(xp.tagName==='P'&&gp.tagName==='P','semantic paragraphs');check(gp.getBoundingClientRect().top-xp.getBoundingClientRect().bottom>=14,'paragraph gap');window.confirm=confirmOld;Math.random=random;save();window.expectedTraits=JSON.stringify(h.traits);
 }''')
  traits=page.evaluate('expectedTraits')
  page.reload(wait_until='networkidle')
  assert page.evaluate('JSON.stringify(game.player.traits)')==traits
  assert not errors,errors;b.close();print('PASS 10/100gp trait services, confirmations, conflicts/duplicates, funds/away/training guards, retained progress, all 32 tier/stage fees, report paragraph spacing and reload')
finally:s.shutdown()
