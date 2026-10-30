/* Ingredient-based export prices; independent of current staff discounts. */
(() => {
 window.gearEconomyQuote=function(g){
  let ingredients=g?.craftRequirements;
  if(!ingredients&&typeof renderGearCatalog==='function'){
   const r=renderGearCatalog().find(r=>r.id===(g.signatureKey||g.family)+'-'+g.tier);
   if(r&&typeof gearRawRequirements==='function'){const units=r.category==='weapon'&&(r.hands===2||r.hands!==1&&['greatsword','staff','polearm','bow','crossbow','gun'].includes(r.weaponFamily||r.family))?2:1;ingredients=Object.fromEntries(Object.entries(gearRawRequirements(r)).map(([n,v])=>[n,v*units]))}
  }
  const entries=Object.entries(ingredients||{}).filter(([,v])=>Number.isFinite(v)&&v>0);
  const ingredientValue=entries.reduce((sum,[name,n])=>sum+n*(tradeValues[name]||2),0);
  const condition=Math.max(0,Math.min(1,(Number(g?.durability)||0)/(Number(g?.maxDurability)||1)));
  const fullValue=ingredientValue?Math.ceil(ingredientValue*1.35):Math.max(0,Math.floor((Number(g?.price)||0)*.4));
  return {ingredientValue,fullValue,condition,convoyValue:Math.floor(fullValue*condition),legacy:!ingredientValue};
 };
})();
