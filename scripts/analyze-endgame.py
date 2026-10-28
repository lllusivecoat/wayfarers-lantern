"""Read-only endgame outcome study. Serve the game on localhost:8000 first. Outputs /tmp/endgame-study-after.json. No live save is used."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();page.goto('http://127.0.0.1:8000',wait_until='networkidle')
 result=page.evaluate("""() => {
 game.hall=7;game.reputation=100000;game.gold=1000000;game.buildingList=buildingDefs.filter(b=>b.key!=='warehouse').map(b=>({key:b.key,uid:'sim-'+b.key,level:5,spent:b.cost}));v9Sync();
 game.staffMembers=Object.entries(WL_STAFF.skills).map(([key,skill])=>({id:'s-'+key,name:key,wage:4,morale:3,buildingKey:key,buildingUid:key==='warehouse'?'warehouse':'sim-'+key,professionXP:{[skill]:275},aptitudes:{Organisation:3,Craftsmanship:3,Care:3,Fieldcraft:3},personality:'Cautious',skillAwards:{}}));for(const st of game.staffMembers){const aptitude=WL_STAFF.jobs[st.buildingKey],other=WL_STAFF.aptitudes.filter(k=>k!==aptitude);st.aptitudes={[aptitude]:5,[other[0]]:3,[other[1]]:2,[other[2]]:2}}staffMigrate(game);
 game.heroes=[{id:'top',rank:9,level:20,dead:false}];game.permRanks={};
 const quests=[];
 for(const kind of ['Dungeon','World Dungeon','Raid','World Boss','World Raid']){
  if(kind==='World Dungeon'||kind==='World Raid'){
   const locations=V9_WORLD.locations.filter(l=>l.world?.kind===kind);for(const l of locations)game.permRanks[l.world.legacy?'world-dungeon':'world-'+l.id]=9;
   const qs=locations.map(v9WorldQuest);qs.sort((a,b)=>b.dc-a.dc);quests.push(qs[0]);
  }else {const q=specialQuest(kind);quests.push({...q,rank:9,dc:q.dc+9-q.rank})}
 }
 quests.unshift({...gatheringQuest('Mining'),rank:9,dc:28,minParty:5});
 let seed=20261028;const random=Math.random;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 function partyFor(n,potion,q,perks){
  game.gear=[];const tanks=v9IsGroup(q)?Math.max(1,Math.round(n/10)):0,heals=tanks;
  const party=Array.from({length:n},(_,i)=>{const spec=i<tanks?'Protection':i<tanks+heals?'Holy':'Fury',cls=spec==='Holy'?'Priest':'Warrior';
   const h={id:'h'+i,name:'Hero '+i,className:cls,spec,race:'Human',rank:9,level:20,abilities:defaultAbilities(cls,spec),preparedBonus:2,rested:true,ready:true,traits:['Fearless','Eagle-Eyed','Keen Tracker'],perks:[],pendingPerks:[],professionXP:{},equipment:{},perkCd:{},missions:100};
   const main=SPEC_STATS[cls][spec][0];if(potion)h.abilities[main]++;
   abilityKeys.forEach((k,j)=>{const id=h.id+'-'+k;game.gear.push({id,stat:k.toUpperCase(),bonus:6,durability:90,maxDurability:90,owner:h.id});h.equipment[({str:'weapon',dex:'amulet1',con:'armor',int:'amulet2',wis:'cape',cha:'amulet3'})[k]]=id});
   if(perks)for(const L of PERK_LEVELS){
    const legal=PERKS.filter(p=>p.level===L&&(p.cls==='General'||p.cls===cls&&(p.type==='Class'||p.type===spec)));
    const score=p=>p.fx.reduce((sum,e)=>{try{if(!perkCond(e,h,{q,party:[h],tier:2}))return sum}catch(_){};return sum+(e.roll||0)*3+(e.proll||0)*4+(e.pdc||0)*4+(e.weaponBonus?2:0)+(['rerollFail','rerollNat1','drw','rallyingCry','prevent','deathReroll'].includes(e.sp)?2:0)+(e.crit19?1:0)},0);
    legal.sort((a,b)=>score(b)-score(a));if(legal[0])h.perks.push({id:legal[0].id,level:L});
   }
   return h;
  });game.heroes=party;game.bonds={};for(let i=0;i<n-1;i++)game.bonds[bondKey(party[i].id,party[i+1].id)]={v:100,lastDay:game.day,n:100};return party;
 }

 const rows=[];
 try{for(const q of quests){if(!q)continue;const size=q.maxParty||q.minParty||1;
  for(const perks of [false,true])for(const potion of [false,true]){
   const party=partyFor(size,potion,q,perks),out=[0,0,0,0],trials=4000;let dcSum=0;
   seed=20261028;
   for(let t=0;t<trials;t++){
    party.forEach(h=>{h.perkCd={};h.rested=true;h.lastQuestDay=undefined;h.hauntedPending=false});
    const short=Math.max(0,q.minParty-party.length),extra=Math.max(0,party.length-q.minParty),fixed=v9IsGroup(q),support=WL_STAFF.preparation(q);
    const pk=perkPrepare(q,party,short,fixed),tb=tbwPrepare(q,party),dc=Math.max(6,Math.max(6,q.dc+WL_BALANCE.highRankDcBonus(q)+(fixed?short*2:short)-(q.kind==='Contract'?Math.min(4,extra):0)-support)-Math.max(pk.dcCut,v9BuildingDcCut(q)));
    const checks=perkRollChecks(q,party,dc,pk,h=>readiness(h,q.ability)+(h.rank>0?1:0)+tbwRollMod(h,tb));tbwPostChecks(q,party,checks,dc,tb);const tier=perkTier(q,party,checks,pk);out[tier]++;dcSum+=dc;
   }
   rows.push({kind:q.kind,title:q.title,rank:q.rank,party:size,baseDC:q.dc,effectiveDC:dcSum/trials,perks,potion,primaryReadiness:readiness(party.at(-1),v9MainStat(party.at(-1))),outcomes:out.map(n=>Math.round(n/trials*10000)/100),success:Math.round((out[2]+out[3])/trials*10000)/100,perkBuilds:perks?[...new Set(party.map(h=>h.spec))].map(spec=>({spec,perks:party.find(h=>h.spec===spec).perks.map(p=>PERK_BY_ID[p.id].name)})):undefined});
  }
 }}finally{Math.random=random}
 return rows;
}""")
 Path('/tmp/endgame-study-after.json').write_text(json.dumps(result,indent=2));print(json.dumps([{k:r[k] for k in ['kind','title','party','perks','potion','success']} for r in result if r['perks']],indent=2));b.close()
