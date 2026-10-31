/* Confirm only completed crafts; synchronous multi-batch crafts share one prompt. */
(() => {
 let pending=new Map(),scheduled=false;
 function notify(name,count,uses){const key=JSON.stringify([name,uses]);pending.set(key,(pending.get(key)||0)+count);if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;
  let modal=document.getElementById('craft-success-modal');if(!modal){modal=document.createElement('div');modal.id='craft-success-modal';modal.className='modal';modal.innerHTML='<div class="modalbox" role="dialog" aria-modal="true" aria-labelledby="craft-success-title"><h2 id="craft-success-title">Crafting complete</h2><div id="craft-success-items"></div><button class="btn secondary" type="button">Done</button></div>';modal.querySelector('button').onclick=()=>modal.classList.remove('open');document.body.append(modal)}
  const root=modal.querySelector('#craft-success-items');root.replaceChildren();for(const [key,count] of pending){const [name,uses]=JSON.parse(key),p=document.createElement('p');p.textContent=`${count} × ${name}${uses?` · ${uses} uses each`:''} crafted and added to inventory.`;root.append(p)}pending.clear();modal.classList.add('open');modal.querySelector('button').focus();
 })}
 const recipes={cookRations:()=>kitchenRecipes(),brewAlchemy:()=>alchemyRecipes(),craftFieldKit:()=>fieldKitRecipes()};
 for(const [name,collection] of [['cookRations','consumables'],['brewAlchemy','alchemyPotions'],['craftFieldKit','fieldKits'],['craftGatheringTool','gear']]){
  const craft=window[name];window[name]=function(){const before=new Set((game[collection]||[]).map(i=>i.id)),result=craft.apply(this,arguments);
   for(const item of game[collection]||[]){if(before.has(item.id))continue;const recipe=recipes[name]?.().find(r=>r.id===item.recipe);notify(item.name||recipe?.name||'Item',1,item.uses)}return result;
  };
 }
})();
