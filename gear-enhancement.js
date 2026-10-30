/* Material-paid refinements replace automatic Workshop stat bonuses. */
(() => {
 const unlock=[0,2,3,4,5,6,7,8];
 function migrate(){for(const g of game.gear){if(!g.madeByPlayer||g.gatherTool||!Number.isInteger(g.tier)||g.enhancementVersion===2)continue;
 const credit=Math.max(0,Math.min(4,Number(g.enhancement)||Number(g.buildingBonus)||0));g.legacyWorkshopBonus=Number(g.buildingBonus)||0;g.baseCraftBonus=Number(g.bonus)||0;g.enhancement=credit;g.enhancementVersion=2;g.buildingBonus=0;}}
 window.gearBaseReadinessBonus=g=>gearReadinessBonus(g);
 window.heroEnhancementReadiness=()=>0;
 function workshop(){return v9Ops('workshop').sort((a,b)=>b.level-a.level)[0]}
 function recipe(g){return renderGearCatalog().find(r=>r.id===(g.signatureKey||g.family)+'-'+g.tier)}
 window.gearEnhancementQuote=function(id){migrate();const g=game.gear.find(g=>g.id===id),i=workshop(),next=(Number(g?.enhancement)||0)+1,r=g&&recipe(g);let reason='';
 if(!g?.madeByPlayer||g.gatherTool||!r)reason='Only crafted equipment can be enhanced';else if(!i)reason='Requires staffed Workshop';else if(projectForBuilding(i.uid))reason='Finish Workshop upgrades first';else if(next>4)reason='All four effect stages complete';else if(next>i.level-1)reason=`Requires Workshop Level ${next+1}`;else if(g.owner&&(!purse(g.owner)?.ready||hasActiveQuestFor(g.owner)))reason='Hero must return before enhancing';else if(staffProfessionLevel(buildingStaff('workshop'))<unlock[g.tier])reason=`Requires Blacksmithing ${unlock[g.tier]}`;
 const materials=r?Object.fromEntries(Object.entries(r.requirements).map(([k,n])=>[k,n*next])):{};
 if(!reason&&Object.entries(materials).some(([k,n])=>(game.materials[k]||0)<n))reason='Not enough enhancement materials';
 return {next,materials,reason,cap:i?i.level-1:0};
 };
 window.enhanceGear=function(id){const q=gearEnhancementQuote(id),g=game.gear.find(g=>g.id===id);if(q.reason)return false;for(const [k,n] of Object.entries(q.materials))game.materials[k]-=n;g.enhancement=q.next;g.effectText=`+${gearReadinessBonus(g)} ${g.stat} readiness before the loadout-based +6 to +9 gear cap. Effect enhancement stage ${g.enhancement}/4. ${window.WL_GEAR_EFFECTS?WL_GEAR_EFFECTS.description(g):''}`;practiceStaff('workshop');addLog('Gear enhanced',`${g.name} upgraded to effect stage ${g.enhancement}. Tier, flat stats, durability and set membership are retained. Special effects have improved. Materials: ${Object.entries(q.materials).map(([k,n])=>n+' '+k).join(', ')}.`);render();save();return true};
 let selected='';
 function panel(){migrate();let root=document.getElementById('gear-enhancement');if(!root){root=document.createElement('article');root.className='card';root.id='gear-enhancement';const box=document.createElement('details');box.className='craft-collapse';box.innerHTML='<summary>Enhance equipment</summary>';box.append(root);document.getElementById('crafting').append(box)}
 const all=game.gear.filter(g=>g.madeByPlayer&&!g.gatherTool&&recipe(g));if(!all.some(g=>g.id===selected))selected=all[0]?.id;const g=all.find(g=>g.id===selected),q=g&&gearEnhancementQuote(g.id);
 root.innerHTML=`<h3>Enhance equipment</h3><p>Workshop 2: unlock/improve the first effect. Workshop 3: strengthen it. Workshop 4: add a second effect. Workshop 5: strengthen the second effect. Pay materials for each stage. Flat stats and durability stay unchanged; Blacksmithing controls crafting quality and durability. Matching-tier set membership remains. Flat gear readiness cap: +6 to +9 based on equipped tiers. No gold cost.</p>${g?`<label>Item<select>${all.map(g=>`<option value="${g.id}" ${g.id===selected?'selected':''}>${tbwEsc(g.name)} · effect stage ${g.enhancement||0}/4 · ${tbwEsc(g.owner?purse(g.owner)?.name||'Equipped':'Storage')}</option>`).join('')}</select></label><p>Current: ${window.WL_GEAR_EFFECTS?tbwEsc(WL_GEAR_EFFECTS.description(g)):""}</p><p>After next stage: ${window.WL_GEAR_EFFECTS?tbwEsc(WL_GEAR_EFFECTS.description({...g,enhancement:Math.min(4,q.next)})):""}</p><p>Next enhancement stage: ${q.next}. Cost: ${Object.entries(q.materials).map(([k,n])=>`${n} ${tbwEsc(k)} (${game.materials[k]||0} stored)`).join(' + ')}</p><button class="btn secondary" ${q.reason?'disabled':''}>${tbwEsc(q.reason||'Apply effect stage '+q.next)}</button>`:'<p>Craft equipment to begin enhancing it.</p>'}`;
 if(g){root.querySelector('select').onchange=e=>{selected=e.target.value;panel()};root.querySelector('button').onclick=()=>enhanceGear(selected)}
 }
 const warehouse=renderWarehouse;renderWarehouse=function(){const r=warehouse.apply(this,arguments);panel();return r};
 const renderOld=render;render=function(){migrate();return renderOld.apply(this,arguments)};
 const saveOld=save;save=function(){migrate();return saveOld.apply(this,arguments)};
 const equipment=renderHeroEquipment;renderHeroEquipment=function(h){return equipment(h)+`<p class="small muted">Workshop enhancements improve or add special effects. They do not add flat readiness or durability. Upgrading the Workshop does not automatically enhance items.</p>`};
 migrate();render();
})();
