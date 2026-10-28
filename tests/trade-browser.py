"""Real mixed convoys, migration, return-time relationships, mobile controls and errors."""
import json
import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.on('dialog',lambda d:d.accept());page.set_default_timeout(15000)
    page.add_init_script("window.check=(ok,msg)=>{if(!ok)throw Error(msg)};window.random=Math.random;")
    page.goto('http://127.0.0.1:8000',wait_until='networkidle')
    page.wait_for_function("typeof WL_TRADE==='object'")
    page.evaluate("""() => {
      game.hall=7;game.gold=10000;game.pendingReports=[];
      game.staffMembers.push({id:'trade-keeper',name:'Keeper',wage:2,buildingUid:null,buildingKey:null,profession:'Generalist',professionXP:{},skillAwards:{}});
      check(v9AssignStaff('trade-keeper','warehouse')==='','assign keeper');
      selectedTradeRoute='booty-bay';game.tradeParty=['player'];game.player.ready=true;game.player.wound=null;
      for(const key of abilityKeys)game.player.abilities[key]=100;
      render();showView('trading');
      check(!tradeDestinations().some(r=>r.id==='stormwind'),'relationships cannot discover locations');
    }""")
    page.locator('[data-market-quantity="0"]').fill('2')
    page.locator('[data-market-select="1"]').check()
    page.locator('[data-market-quantity="1"]').fill('3')
    assert 'Cargo 5/20 units' in page.locator('#market-cost').inner_text()
    page.reload(wait_until='networkidle');page.wait_for_function("typeof WL_TRADE==='object'");page.evaluate("showView('trading')")
    assert page.locator('[data-market-quantity="1"]').input_value()=='3'
    page.evaluate("""() => {
      const route=tradeDestinations().find(r=>r.id===selectedTradeRoute),goods=WL_TRADE.offers(route);
      window.firstGoods=goods.map(g=>g.material);window.materialsBefore={...game.materials};window.goldBefore=game.gold;
      window.random=Math.random;Math.random=()=>.99;
    }""")
    page.locator('#market-buy').click()
    page.evaluate("""() => {
      Math.random=random;const r=game.pendingReports.at(-1);
      check(r.inboundCargo.length===2&&r.outcome==='Success','mixed inbound success');
      check(game.gold===goldBefore-r.purchaseCost-r.escortCost,'exact goods and escort payment');
      check(r.escortCost===2&&!game.player.ready,'escort reserved');
      check(!WL_TRADE.relationship(r.routeId).points,'relationship only on return');
      check(r.inboundCargo[0].count===2&&r.inboundCargo[1].count===3,'mixed quantities');
      window.arrival=r.dueAt;save();
    }""")
    arrival=page.evaluate('arrival');page.reload(wait_until='networkidle');page.wait_for_function("typeof WL_TRADE==='object'")
    page.evaluate("""() => {
      const r=game.pendingReports.at(-1);check(r.dueAt===ARRIVAL,'pending arrival retained');
      const before={...game.materials};r.dueAt=Date.now()-1;applyPendingReports();
      for(const c of r.inboundCargo)check(game.materials[c.material]===(before[c.material]||0)+c.count,'each line delivered');
      const after=JSON.stringify(game.materials),points=WL_TRADE.relationship(r.routeId).points;
      tbwApplyReport(r);check(JSON.stringify(game.materials)===after&&WL_TRADE.relationship(r.routeId).points===points,'idempotent goods and relationship');
      game.tradeParty=['player'];game.materials={'Copper Ore':100,Timber:100};game.tradeCargo={'Copper Ore':21};render();showView('trading');
    }""".replace('ARRIVAL',str(arrival)))
    assert page.locator('#trade-dispatch').is_disabled()
    assert 'over capacity' in page.locator('#trade-preview').inner_text()
    page.evaluate("""() => {
      const before=JSON.stringify([game.gold,game.materials,game.player.ready,game.pendingReports,game.marketStock]);dispatchTrade();
      check(JSON.stringify([game.gold,game.materials,game.player.ready,game.pendingReports,game.marketStock])===before,'overloaded outbound atomic');
      const goods=WL_TRADE.offers(tradeDestinations().find(r=>r.id===selectedTradeRoute));
      game.day++;renderTrading();
      game.marketCargo[selectedTradeRoute]=Object.fromEntries(goods.map(g=>[g.material,8]));renderTrading();
      const stock=JSON.stringify([game.gold,game.marketStock,game.player.ready,game.pendingReports]);dispatchInbound();
      check(JSON.stringify([game.gold,game.marketStock,game.player.ready,game.pendingReports])===stock,'overloaded inbound atomic');
      for(const bad of [0,-1,1.5,NaN,999]){
        game.marketCargo[selectedTradeRoute]={[goods[0].material]:bad};dispatchInbound();
        check(JSON.stringify([game.gold,game.marketStock,game.player.ready,game.pendingReports])===stock,'invalid inbound atomic');
      }
      game.marketCargo[selectedTradeRoute]={[goods[0].material]:2};game.gold=0;dispatchInbound();
      check(!game.pendingReports.length&&game.player.ready,'unaffordable inbound rejected');game.gold=10000;
      // A boundary-sized outbound load succeeds, all goods leave together.
      game.tradeCargo={'Copper Ore':12,Timber:8};Math.random=()=>.99;
      const successful=dispatchTrade();Math.random=random;
      check(successful.cargo.length===2&&successful.outcome==='Success','full capacity outbound');
      check(game.materials['Copper Ore']===88&&game.materials.Timber===92,'mixed outbound deduction');
      successful.dueAt=Date.now()-1;applyPendingReports();
      // Repeating the same shared roll with more escorts cannot worsen delivery.
      game.gear=[];game.heroes=[];game.staffMembers[0].professionXP.Storekeeping=0;game.tradeRelations={};
      for(const key of abilityKeys)game.player.abilities[key]=10;
      game.player.equipment={};game.player.gear=null;game.player.preparedBonus=0;game.player.preparedSupplyBonuses={};game.player.utilitySupplies={};
      for(let i=0;i<7;i++){const h=structuredClone(game.player);h.id='escort-'+i;h.name='Escort '+i;h.abilities.str=1;game.heroes.push(h)}
      let previous=-1;
      for(const count of [1,2,5,8]){
        const heroes=[game.player,...game.heroes];for(const h of heroes){h.ready=true;h.wound=null;h.training=null}
        game.tradeParty=heroes.slice(0,count).map(h=>h.id);game.tradeCargo={'Copper Ore':8,Timber:4};game.materials={'Copper Ore':100,Timber:100};
        let first=true;Math.random=()=>{if(first){first=false;return .325}return .99};
        const r=dispatchTrade();Math.random=random;
        check(r.deliveredFraction>=previous,'more escorts never reduce delivery');previous=r.deliveredFraction;
        check(r.rolls.every(c=>c.total===r.rolls[0].total),'one shared check');
        if(r.deliveredFraction===.75)check(r.deliveredCargo[0].count===6&&r.deliveredCargo[1].count===3,'partial integer cargo');
        r.dueAt=Date.now()-1;applyPendingReports();
      }
      check(previous===1,'support improves full delivery');
      for(const h of [game.player,...game.heroes]){h.ready=true;h.wound=null}
      game.tradeParty=['player'];game.tradeCargo={'Copper Ore':8};game.materials={'Copper Ore':100};Math.random=()=>0;
      const failed=dispatchTrade();Math.random=random;check(failed.outcome==='Failure'&&failed.relationshipValue===0,'failure awards no trade progress');
      failed.dueAt=Date.now()-1;applyPendingReports();
      // Mixed inbound ambushes commit the entire purchase and each stock line.
      game.player.ready=true;game.player.wound=null;game.tradeParty=['player'];game.tradeRelations={};
      const inboundRoute=tradeDestinations().find(r=>r.id===selectedTradeRoute),inboundGoods=WL_TRADE.offers(inboundRoute);
      game.marketCargo[selectedTradeRoute]=Object.fromEntries(inboundGoods.slice(0,2).map(g=>[g.material,4]));
      const startGold=game.gold;let firstInbound=true;Math.random=()=>{if(firstInbound){firstInbound=false;return .325}return .99};
      const partialBuy=dispatchInbound();Math.random=random;
      check(partialBuy.outcome==='Partial Success'&&partialBuy.inboundCargo.every(c=>c.count===3),'mixed inbound partial');
      check(game.gold===startGold-partialBuy.purchaseCost-partialBuy.escortCost,'lost purchases remain paid');
      partialBuy.dueAt=Date.now()-1;applyPendingReports();
      for(const c of partialBuy.inboundCargo)check(game.materials[c.material]>=3,'partial bought line delivered');
      game.day++;game.player.ready=true;game.player.wound=null;game.tradeParty=['player'];
      game.marketCargo[selectedTradeRoute]={[inboundGoods[0].material]:4};
      let firstFail=true;Math.random=()=>{if(firstFail){firstFail=false;return 0}return .99};
      const failedBuy=dispatchInbound();Math.random=random;
      check(failedBuy.outcome==='Failure'&&failedBuy.inboundCargo[0].count===0&&failedBuy.relationshipValue===0,'failed inbound loses bought cargo');
      check(WL_TRADE.offers(inboundRoute)[0].stock===inboundGoods[0].stock-4,'failed cargo still consumes market stock');
      failedBuy.dueAt=Date.now()-1;applyPendingReports();
      // Legacy queued single-item cargo remains deliverable exactly once.
      const old={kind:'trade',title:'Old purchase',summary:'Old terms',outcome:'Success',partyIds:[],payout:0,rep:0,inboundGoods:{name:'Silver Ore',count:4},dueAt:Date.now()-1};
      game.pendingReports=[old];applyPendingReports();const silver=game.materials['Silver Ore'];tbwApplyReport(old);
      check(silver===4&&game.materials['Silver Ore']===4,'legacy inbound migration');
      game.tradeRelations={};const award=(v)=>{const r={kind:'trade',tradeVersion:2,routeId:'booty-bay',relationshipValue:v,title:'Trade',summary:'Delivered',outcome:'Success',partyIds:[]};tbwApplyReport(r);return r};
      const tiny=award(4);check(WL_TRADE.relationship('booty-bay').points===0,'tiny shipment no free point');
      award(6);check(WL_TRADE.relationship('booty-bay').points===1,'small trades accumulate without rounding exploit');
      const big=award(10000);check(WL_TRADE.relationship('booty-bay').points===10,'daily cap');award(1000);
      check(WL_TRADE.relationship('booty-bay').points===10,'repeated shipments capped');
      game.day++;award(1000);check(WL_TRADE.relationship('booty-bay').name==='Familiar','next day advances tier');
      const discoveredBefore=JSON.stringify(game.world.discovered);game.tradeRelations.stormwind={points:260};
      check(!tradeDestinations().some(r=>r.id==='stormwind')&&JSON.stringify(game.world.discovered)===discoveredBefore,'even allied relationships cannot discover');
      for(const l of V9_WORLD.locations.filter(l=>['town','city'].includes(l.type)))if(!game.world.discovered.includes(l.id))game.world.discovered.push(l.id);
      const routes=tradeDestinations(),times=routes.map(r=>v9ConvoyMins(r));check(new Set(times).size>=12,'route-specific travel times');
      for(const threshold of [0,20,60,140,260]){game.tradeRelations['booty-bay']={points:threshold};const rel=WL_TRADE.relationship('booty-bay');check(rel.discount<=.04&&rel.stock<=8&&rel.timeCut<=.2&&rel.dangerCut<=2,'bounded relation perks')}
      const booty=routes.find(r=>r.id==='booty-bay');check(v9ConvoyMins(booty)===8,'allied travel discount');
      game.tradeRelations['booty-bay'].points=260;game.tradeParty=['player'];game.player.ready=true;game.player.wound=null;renderTrading();save();
    }""")
    page.reload(wait_until='networkidle');page.wait_for_function("typeof WL_TRADE==='object'");page.evaluate("showView('trading')")
    assert page.evaluate("WL_TRADE.relationship('booty-bay').points")==260
    for width in [360,390,768,1280]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.locator('#inbound-market').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
        assert page.locator('#trading').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
    page.set_viewport_size({'width':390,'height':844});page.locator('#inbound-market').screenshot(path='/tmp/trading-overhaul-mobile.png')
    # The one-second quest timer must not settle reports before return handlers
    # load. Delay the final gameplay module to reproduce a slow mobile startup.
    startup=page.evaluate('JSON.stringify(game)');key=page.evaluate('SAVE_KEY')
    for mixed in [False,True]:
        data=json.loads(startup);before=data['materials'].get('Timber',0)
        r={'kind':'trade','title':'Startup convoy','summary':'Queued before reload','outcome':'Success',
           'partyIds':[],'payout':0,'rep':0,'dueAt':int(time.time()*1000)-1}
        if mixed:r.update({'tradeVersion':2,'routeId':'booty-bay','inboundCargo':[{'material':'Timber','count':4}],'relationshipValue':8})
        else:r['inboundGoods']={'name':'Timber','count':4}
        data['pendingReports']=[r]
        context=browser.new_context(service_workers='block');slow=context.new_page()
        slow.on('pageerror',lambda e:errors.append(str(e)))
        context.add_init_script('localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps(data))+')')
        def delay(route):time.sleep(1.6);route.continue_()
        slow.route('**/trade-system.js',delay)
        slow.goto('http://127.0.0.1:8000',wait_until='networkidle')
        slow.wait_for_function("typeof WL_TRADE==='object' && game.todayReports.some(r=>r.title==='Startup convoy')")
        assert slow.evaluate("game.materials.Timber")==before+4
        slow.evaluate("tickQuestTimers()")
        assert slow.evaluate("game.materials.Timber")==before+4
        context.close()
    assert not errors,errors
    browser.close()
    print('PASS: mixed inbound/outbound, stock/payment/capacity atomicity, save/reload, shared escort roll and partial/failure, legacy cargo, slow-start return handling, relationship accumulation/cap/tiers/bonuses/idempotence, discovery, route times, mobile/desktop; no console errors')
