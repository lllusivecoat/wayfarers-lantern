/* Tier progression raises the flat-readiness ceiling without quality bypasses. */
(() => {
 function details(h){
  const seen=new Set(),eq=h?.equipment||{};
  function item(slot){const id=eq[slot];if(!id||seen.has(id))return null;seen.add(id);const g=game.gear.find(g=>g.id===id);return g&&g.owner===h.id&&g.durability>0&&!g.gatherTool&&canHeroEquipInSlot(h,g,slot)?g:null}
  const grade=g=>g&&Number.isInteger(g.tier)?Math.floor(Math.max(0,Math.min(7,g.tier))/2):0;
  const weapon=item('weapon'),offhand=gearIsTwoHanded(weapon)?null:item('offhand');
  const hands=gearIsTwoHanded(weapon)?grade(weapon):(grade(weapon)+grade(offhand))/2;
  const armor=grade(item('armor')),cape=grade(item('cape')),rings=['amulet1','amulet2','amulet3'].reduce((n,s)=>n+grade(item(s)),0)/3;
  const credits=hands+armor+cape+rings,cap=6+Math.min(3,Math.floor((credits+1e-9)/4));
  return {cap,credits,groups:{hands,armor,cape,rings},next:cap<9?(cap-5)*4:null};
 }
 window.gearReadinessLimit=h=>details(h).cap;
 window.WL_GEAR_CAP=Object.freeze({details});
 const equipment=renderHeroEquipment;renderHeroEquipment=function(h){const d=details(h),stat=v9MainStat(h),raw=[...new Set(Object.values(h.equipment||{}).filter(Boolean))].reduce((n,id)=>{const g=game.gear.find(g=>g.id===id);return g&&g.durability>0&&String(weaponStatForHero(g,h)).toLowerCase()===stat?n+gearReadinessBonus(g):n},0);
 return equipment(h)+`<details class="hero-detail-block gear-info-collapse"><summary>Flat gear readiness</summary><p>+${Math.min(d.cap,raw)} ${stat.toUpperCase()} readiness from gear · +${raw} before the +${d.cap} loadout cap.</p><p>Full Basic/Sturdy: cap +6; Fine/Superior: +7; Masterwork/Relic: +8; Legendary/Heritage: +9. Mixed loadouts progress by average tier grade across hands, armor, cape and rings. Two-handed weapons count as both hands; the three rings share one group. Missing, broken or incompatible items contribute zero tier grade. Quality bonuses and effect enhancements cannot raise the cap.</p>${d.next?`<p class="small muted">Tier grade progress: ${Math.round(d.credits*100)/100}/${d.next} toward cap +${d.cap+1}.</p>`:'<p class="small muted">Maximum loadout cap reached.</p>'}</details>`;
 };
 render();
})();
