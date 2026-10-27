"""Guildmaster fatality immunity across rolls, queued reports, saves and memorials."""
import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    page.set_default_timeout(15000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.on('dialog',lambda d:d.accept())
    page.goto('http://127.0.0.1:8000',wait_until='networkidle')
    page.wait_for_function("typeof memorialMigrate==='function'")
    page.evaluate("""() => {
      const check=(ok,msg)=>{if(!ok)throw Error(msg)};window.check=check;
      game.gold=10000;
      const a=makeApplicant({race:'Human',className:'Warrior',spec:'Arms'});
      game.applicants.push(a);openRecruit(a.id);confirmHire();
      const hero=game.heroes.at(-1),player=game.player;
      hero.level=1;hero.traits=[];hero.perks=[];hero.pendingPerks=[];player.traits=[];
      player.wound={tier:2,days:4};
      const random=Math.random;
      Math.random=()=>0;
      try{
        // Natural-one critical failures with already-wounded characters: normal
        // heroes can die, but the guildmaster only receives a wound.
        for(const kind of ['Contract','Dungeon','Raid','World Boss','World Raid','Gathering','Exploration']){
          const q={kind,rank:0,minParty:1},party=[hero,player];
          const checks=party.map(h=>({id:h.id,name:h.name,success:false,critical:true,roll:1}));
          const ctx={q,party,notes:[],used:new Set(),vanished:new Set(),noSpike:new Set(),halve:new Set(),painSup:new Set(),skipDeath:new Set(),fx:{[hero.id]:[],player:[]}};
          const result=tbwCasualties(q,party,checks,ctx,'Failure',{notes:[],swornUsed:false});
          check(result.dead.includes(hero.id),'normal fatality remains possible '+kind);
          check(!result.dead.includes('player'),'guildmaster immune '+kind);
          check(result.wounds.player?.tier>=1,'guildmaster can still be wounded '+kind);
        }
        const checks=[hero,player].map(h=>({id:h.id,name:h.name,success:false,critical:true,roll:1}));
        check(!tbwConvoyCasualties([hero,player],checks,'Failure').dead.includes('player'),'convoy death immunity');
      }finally{Math.random=random}
      // Old or malformed queued reports cannot bypass the immunity rule.
      const pending={kind:'operation',questKind:'Dungeon',title:'An Old Dispatch',outcome:'Failure',summary:'The expedition failed.',extendedSummary:'The objective remains unfinished.',partyIds:['player',hero.id],casualties:['player',hero.id],deathAccounts:[{id:'player',name:player.name,text:'Incorrect fatality'}],wounds:{player:{tier:2}},rolls:[],growthAwards:[],payout:0,rep:0,dispatchedDay:game.day,dueAt:Date.now()-1};
      game.pendingReports=[pending];applyPendingReports();
      check(!player.dead&&!player.memorial,'pending operation cannot kill guildmaster');
      check(hero.dead&&!!hero.memorial,'ordinary hero fatality and memorial preserved');
      check(player.wound?.tier===2,'surviving wounds preserved');
      check(!pending.casualties.includes('player')&&!pending.deathAccounts.some(a=>a.id==='player'),'invalid fatality removed from report');
      check(!reportDeathsMarkup(pending,true).includes(player.name+' has died'),'no guildmaster death notice');
      const trade={...pending,kind:'trade',title:'An Old Convoy',partyIds:['player'],casualties:['player'],deathAccounts:[],wounds:{player:{tier:1}},dueAt:Date.now()-1};
      game.pendingReports=[trade];applyPendingReports();
      check(!player.dead&&trade.casualties.length===0,'pending convoy cannot kill guildmaster');
      // Invalid historical state is corrected without resetting progression or gear.
      const before=JSON.stringify([player.name,player.level,player.levelProgress,player.gold,player.equipment,player.wound,player.traits,game.gold,game.materials]);
      player.dead=true;player.ready=false;player.memorial={name:player.name,honored:true};player.deathDay=2;
      game.todayReports=[{...trade,casualties:['player',hero.id],deathAccounts:[{id:'player',name:player.name,text:'Incorrect'},{id:hero.id,name:hero.name,text:'A recorded loss'}],summary:'The expedition failed. '+player.name+' did not return from the operation. Their death is recorded.'}];
      // Include a false guildmaster casualty in another hero's archived report too.
      hero.memorial.finalReport.casualties.push('player');
      hero.memorial.finalReport.deathAccounts.push({id:'player',name:player.name,text:'Incorrect'});
      memorialMigrate(game);
      check(!player.dead&&player.ready&&!player.memorial&&!player.deathDay,'stale guildmaster death corrected');
      check(JSON.stringify([player.name,player.level,player.levelProgress,player.gold,player.equipment,player.wound,player.traits,game.gold,game.materials])===before,'identity, progress, wounds and economy unchanged');
      check(!game.todayReports[0].summary.includes('Their death is recorded'),'false old death message removed');
      check(hero.memorial.finalReport.casualties.includes(hero.id)&&!hero.memorial.finalReport.casualties.includes('player'),'real memorial loss retained');
      check(hero.memorial.finalReport.deathAccounts.every(a=>a.id!=='player'),'archived false death notice removed');
      check(!setMemorialHonor('player')&&!saveMemorialEpitaph('player','Impossible memorial'),'guildmaster cannot occupy remembrance slot');
      // Restoring a stale flag must not make an away guildmaster available early.
      player.dead=true;player.ready=false;
      game.pendingReports=[{...trade,partyIds:['player'],casualties:['player'],dueAt:Date.now()+60000}];
      memorialMigrate(game);check(!player.dead&&!player.ready,'underway assignment preserved');
      game.pendingReports=[];player.ready=true;render();openFallenMemorial();
      check(document.querySelectorAll('.memorial-card').length===1,'only ordinary fallen hero listed');
      openMemorialRecord('player');check(!document.getElementById('hero-stats-modal').classList.contains('open'),'guildmaster has no memorial view');
      save();
    }""")
    # Simulate the previously invalid state on disk before loading the game.
    page.evaluate("const x=JSON.parse(localStorage.getItem(SAVE_KEY));x.player.dead=true;x.player.ready=false;x.player.memorial={name:x.player.name,honored:true};localStorage.setItem(SAVE_KEY,JSON.stringify(x))")
    page.reload(wait_until='networkidle')
    page.wait_for_function("typeof memorialMigrate==='function'")
    assert page.evaluate('!game.player.dead && game.player.ready && !game.player.memorial')
    payload=page.evaluate('JSON.stringify(game)')
    imported=json.loads(payload)
    imported['guildmasterImportCheck']=True
    imported['player']['dead']=True
    imported['player']['ready']=False
    imported['player']['memorial']={'name':imported['player']['name'],'honored':True}
    page.locator('#import-file').set_input_files({'name':'old-guildmaster-save.json','mimeType':'application/json','buffer':json.dumps(imported).encode()})
    page.wait_for_function('game.guildmasterImportCheck===true && !game.player.dead && game.player.ready && !game.player.memorial')
    page.evaluate('showView("hall");openHeroStats("player")')
    assert 'Fallen' not in page.locator('#hero-stats-content').inner_text()
    assert not errors,errors
    browser.close()
    print('PASS: fatal rolls and convoy immunity, wounds retained, stale report protection, ordinary hero deaths, legacy load/import, away status, and memorial exclusion; no console errors')
