/* Modern WoW class proficiencies for the game's equipment families. */
(function(){
 const armor=['cloth','leather','mail','plate'];
 const recipeFamilies=new Map(renderGearCatalog().map(x=>[x.name,x.family]));
 const rules={
  Warrior:[3,'sword greatsword axe mace dagger bow crossbow gun polearm staff fist shield'],
  Paladin:[3,'sword greatsword axe mace polearm shield'],
  'Death Knight':[3,'sword greatsword axe mace polearm'],
  Hunter:[2,'sword greatsword axe dagger bow crossbow gun polearm staff fist'],
  Shaman:[2,'axe mace dagger fist staff shield'],Evoker:[2,'sword greatsword axe mace dagger fist staff'],
  Rogue:[1,'sword axe mace dagger fist bow crossbow gun'],Monk:[1,'sword axe mace fist staff polearm'],
  Druid:[1,'mace dagger fist staff polearm'],'Demon Hunter':[1,'sword axe fist dagger warglaive'],
  Priest:[0,'dagger mace staff wand'],Mage:[0,'sword dagger staff wand'],Warlock:[0,'sword dagger staff wand']
 };
 function family(g){
  if(g.family)return g.family;
  const recipe=recipeFamilies.get(g.name);if(recipe)return recipe;
  const text=String(g.name||'').toLowerCase(),group=gearGroup(g);
  if(group==='armor')return armor.find(a=>text.includes(a))||(/robe|weave|vestment/.test(text)?'cloth':/hide/.test(text)?'leather':/chain|hauberk/.test(text)?'mail':/cuirass|bulwark/.test(text)?'plate':({INT:'cloth',DEX:'leather',CON:'mail',STR:'plate'}[g.stat]||'cloth'));
  if(group==='offhand')return /shield|buckler|aegis/.test(text)?'shield':'holdable';
  if(group!=='weapon')return group;
  return /greatsword|claymore|zweihander/.test(text)?'greatsword':/warglaive/.test(text)?'warglaive':/crossbow|arbalest/.test(text)?'crossbow':/bow/.test(text)?'bow':/gun|rifle|flintlock|cannon/.test(text)?'gun':/polearm|pike|spear|halberd/.test(text)?'polearm':/staff|stave/.test(text)?'staff':/wand/.test(text)?'wand':/dagger|knife|stiletto/.test(text)?'dagger':/axe|hatchet|cleaver/.test(text)?'axe':/mace|hammer|cudgel|maul/.test(text)?'mace':/fist|knuckle|talon/.test(text)?'fist':({INT:'staff',WIS:'mace',DEX:'dagger'}[g.stat]||'sword');
 }
 const twoHand=g=>!!g&&(g.hands===2||g.hands!==1&&['greatsword','bow','crossbow','gun','polearm','staff'].includes(family(g)));
 window.gearIsTwoHanded=twoHand;
 window.gearReadinessBonus=g=>(Number(g?.bonus)||0)*(twoHand(g)?2:1);
 window.gearProficiencyFamily=family;
 window.canHeroEquip=function(h,g){
  if(!h||!g)return false;const r=rules[h.className];if(!r)return false;const group=gearGroup(g),f=family(g);
  if(group==='armor')return armor.indexOf(f)>=0&&armor.indexOf(f)<=r[0];
  if(group==='weapon'||f==='shield')return r[1].split(' ').includes(f==='pistol'?'gun':f);
  if(group==='offhand')return !['Hunter','Death Knight','Demon Hunter'].includes(h.className);
  return true;
 };
 window.canHeroEquipInSlot=function(h,g,slot){
  if(!canHeroEquip(h,g))return false;
  const def=equipmentSlotDefs.find(s=>s.key===slot);if(!def)return false;
  if(slot==='offhand'&&gearGroup(g)==='weapon')return !twoHand(g)&&(h.className==='Demon Hunter'&&family(g)==='warglaive'||['Warrior','Rogue','Hunter'].includes(h.className)&&['dagger','pistol'].includes(family(g)));
  return gearGroup(g)===def.group;
 };
 function clean(h){
  if(!h||h.dead||!h.ready||hasActiveQuestFor(h.id))return;
  const eq=h.equipment||{},weapon=game.gear.find(g=>g.id===(eq.weapon||h.gear));
  for(const g of game.gear.filter(g=>g.owner===h.id||g.id===h.gear||Object.values(eq).includes(g.id))){
   if(!canHeroEquip(h,g)||Object.entries(eq).some(([slot,id])=>id===g.id&&(!canHeroEquipInSlot(h,g,slot)||slot==='offhand'&&twoHand(weapon)))){
    Object.keys(eq).forEach(k=>{if(eq[k]===g.id)eq[k]=null});if(h.gear===g.id)h.gear=null;if(g.owner===h.id)g.owner=null;
   }
  }
 }
 const oldEnsure=ensureHeroEquipment;ensureHeroEquipment=function(h){clean(h);return oldEnsure.apply(this,arguments)};
 const oldEquip=equipSlot;equipSlot=function(id,slot,value){
  const h=purse(id),g=game.gear.find(g=>g.id===value);if(!h||!h.ready||hasActiveQuestFor(id))return false;
  if(g&&!canHeroEquipInSlot(h,g,slot)){alert(`${h.className} cannot equip ${family(g)} equipment.`);return false}
  const eq=ensureHeroEquipment(h),weapon=game.gear.find(g=>g.id===eq.weapon);
  if(g&&slot==='offhand'&&twoHand(weapon)){alert('Unequip the two-handed weapon before equipping an offhand.');return false}
  const result=oldEquip.apply(this,arguments);clean(h);if(viewingHeroId===id)renderHeroStats();return result;
 };
 const oldEquipment=renderHeroEquipment;renderHeroEquipment=function(h){
  const box=document.createElement('div');box.innerHTML=oldEquipment.apply(this,arguments);
  box.querySelectorAll('option').forEach(o=>{const g=game.gear.find(g=>g.id===o.value);if(g&&!canHeroEquip(h,g))o.remove()});
  return box.innerHTML+`<p class="small muted">${tbwEsc(h.className)} proficiencies: ${armor.slice(0,(rules[h.className]?.[0]||0)+1).join(', ')} armor; ${rules[h.className]?.[1]||'no known weapons'}. Daggers and pistols can use either hand for Warriors, Rogues and Hunters. Demon Hunters can use warglaives in either hand. Rifles remain two-handed. Two-handed weapons use the offhand space and double their listed stat contribution; total gear readiness remains capped at +6. Incompatible equipment returns to guild storage.</p>`;
 };
 const oldBase=readinessBase;readinessBase=function(h){clean(h);return oldBase.apply(this,arguments)};
 const oldSave=save;save=function(){[game.player,...game.heroes].forEach(clean);return oldSave.apply(this,arguments)};
 const layout=document.createElement('style');layout.textContent=`
#hero-stats-content .equipment-slot-grid{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:none!important;grid-template-areas:none!important;gap:10px!important;max-width:none!important}
#hero-stats-content .equipment-slot-grid .equipment-slot{grid-area:auto!important;grid-column:1/-1!important;display:grid;grid-template-columns:22px minmax(0,1fr);align-items:center;text-align:left;gap:5px 8px;min-height:0!important;padding:9px 11px!important;margin:0!important}
#hero-stats-content .equipment-slot-grid .equipment-slot .equipment-slot-icon{height:20px!important;font-size:18px!important;line-height:1}
#hero-stats-content .equipment-slot-grid .equipment-slot .slot-name{min-height:0;line-height:1.4;white-space:normal;overflow-wrap:anywhere}
#hero-stats-content .equipment-slot-grid .equipment-slot select{grid-column:1/-1;width:100%;min-width:0;min-height:44px;margin:0!important;padding:7px 9px!important;font-size:16px!important;line-height:1.5}
#hero-stats-content .equipment-slot-grid .equipment-slot .slot-durability{grid-column:1/-1;display:block;margin:0!important;white-space:normal;overflow-wrap:anywhere;line-height:1.4}
`;document.head.appendChild(layout);
 render();
})();
