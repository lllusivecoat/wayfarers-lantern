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
 const h=game.player;h.gold=10000;h.ready=true;h.wound=null;h.equipment={};h.gear=null;h.traits=[];
 const rates=[.08,.08,.08,.08,.08,.08,.10,.10,.12,.12];for(let rank=0;rank<10;rank++)check(contractRateForQuest({rank})===rates[rank],'base cut '+rank);
 const cases=[['Greedy',1.05,84],['Very Greedy',1.1,88],['Frugal',.95,76],['Generous',.95,76]];for(const [trait,mul,amount] of cases){h.traits=[trait];check(Math.abs(tbwCutMul(h)-mul)<1e-9,'trait '+trait);const base=calculatePartyCompensation({kind:'Contract',rank:0},[h],1000),adjusted=tbwAdjustCompensation(base,[h],1000);check(adjusted.awards[0].amount===amount,'final share '+trait)}h.traits=['Very Greedy'];check(tbwAdjustCompensation(calculatePartyCompensation({kind:'Contract',rank:6},[h],1000),[h],1000).awards[0].amount===110,'no floating point overcharge');h.traits=[];
 const g={id:'enh-fee',name:'Basic sword',kind:'Weapon',family:'sword',tier:0,bonus:1,enhancementVersion:2,enhancement:0,madeByPlayer:true,owner:h.id,durability:25,maxDurability:25};game.gear.push(g);for(const r of renderGearCatalog())for(const k of Object.keys(r.requirements))game.materials[k]=100000;
 for(let stage=1;stage<=4;stage++){const q=gearEnhancementQuote(g.id);check(!q.reason&&q.gold===20+30*(stage-1)&&q.payerId===h.id,'fee quote '+stage);const hero=h.gold,guild=game.gold;check(enhanceGear(g.id),'enhance');check(h.gold===hero-q.gold&&game.gold===guild+q.gold,'purse transfer')}
 const poor={...g,id:'poor-enh',enhancement:0};game.gear.push(poor);h.gold=0;const stock=JSON.stringify(game.materials),credits=JSON.stringify(game.gearMaterialCredits),guild=game.gold;check(!enhanceGear(poor.id)&&poor.enhancement===0&&JSON.stringify(game.materials)===stock&&JSON.stringify(game.gearMaterialCredits)===credits&&game.gold===guild,'insufficient funds atomic');
 const stored={...poor,id:'unowned',owner:null,heroOwner:null};game.gear.push(stored);check(gearEnhancementQuote(stored.id).reason.includes('Equip'),'unowned requires hero');h.gold=10000;h.ready=false;check(gearEnhancementQuote(poor.id).reason==='Hero must return before enhancing','away blocked');h.ready=true;
 const two={...poor,id:'two-fee',family:'greatsword',hands:2};game.gear.push(two);check(gearEnhancementQuote(two.id).gold===2*gearEnhancementQuote(poor.id).gold,'hand parity');
 renderWarehouse();check(document.getElementById('gear-enhancement').textContent.includes('pays the gold service fee'),'fee explained');save();window.feeGold=h.gold;
 }''')
  heroGold=page.evaluate('feeGold')
  page.reload(wait_until='networkidle')
  assert page.evaluate('game.player.gold')==heroGold
  assert page.evaluate("game.gear.find(g=>g.id==='enh-fee').enhancement")==4
  assert not errors,errors;b.close();print('PASS all rank/trait cuts, tier/stage enhancement fees, hero-to-guild transfers, hand parity, insufficient-fund atomicity, ownership/away guards, UI and reload')
finally:s.shutdown()
