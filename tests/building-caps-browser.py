from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8000',wait_until='networkidle')
 page.evaluate("""() => {
 const check=(x,m)=>{if(!x)throw Error(m)};
 game.gold=100000;game.buildingList=[{key:'workshop',uid:'cap-workshop',level:1,spent:100}];game.constructionProjects=[];
 for(let hall=1;hall<=7;hall++)for(let level=1;level<=5;level++){
  game.hall=hall;game.warehouseLevel=level;game.buildingList[0].level=level;game.constructionProjects=[];
  const cap=[1,2,3,3,4,4,5][hall-1],gold=game.gold;
  check(buildingUpgradeCap()===cap,'cap mapping');
  const result=upgradeBuilding('cap-workshop');
  check((game.constructionProjects.length===1)===(level<cap),'building gate '+hall+' '+level);
  if(level>=cap)check(game.gold===gold,'blocked building charges nothing');
  game.constructionProjects=[];const before=game.gold;upgradeWarehouse();
  check((game.constructionProjects.length===1)===(level<cap),'warehouse gate '+hall+' '+level);
  if(level>=cap)check(game.gold===before,'blocked warehouse charges nothing');
 }
 game.hall=1;game.warehouseLevel=5;game.buildingList[0].level=5;game.constructionProjects=[];save();
 check(loadGame().warehouseLevel===5&&loadGame().buildingList[0].level===5,'existing levels retained');
 game.warehouseLevel=1;game.buildingList[0].level=1;renderBuildings();
 check(document.getElementById('building-list').textContent.includes('Requires Hall Level 2'),'UI explains gate');
 // Previously paid construction continues on its saved terms.
 const project={key:'workshop',uid:'cap-workshop',action:'upgrade',targetLevel:4};game.constructionProjects=[project];completeConstructionProject(project);
 check(game.buildingList[0].level===4,'queued upgrade preserved');
 }""")
 assert not errors,errors;b.close();print('PASS: all Hall/building level combinations, warehouse, blocked costs, UI, saved levels and queued upgrades')
