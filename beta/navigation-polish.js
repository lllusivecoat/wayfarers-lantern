/* Beta-only shortcuts and consistent inventory/quest presentation. */
(() => {
 const style=document.createElement('style');style.textContent=`
 .pill{display:inline-flex!important;align-items:center;justify-content:center;max-width:100%;min-height:28px;padding:5px 10px!important;border-radius:9px!important;line-height:1.4!important;white-space:normal!important;overflow-wrap:anywhere;text-align:center;vertical-align:middle}
 .btn,.v9-chip,.trait-chip,.v9-rank-pick,.beta-htabs button,.beta-subtabs button{border-radius:10px!important;line-height:1.4!important}
 .btn,.v9-chip,button.trait-chip{min-height:44px!important}
 #beta-materials{margin:20px 0;padding:16px 0;border-block:1px solid var(--line)}
 #beta-materials>summary{cursor:pointer;min-height:44px;color:var(--acc);font-weight:600}
 .beta-trait-action{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:20px}
 `;document.head.append(style);
 const materials=document.getElementById('warehouse-materials');if(materials&&!document.getElementById('beta-materials')){const box=document.createElement('details'),label=document.createElement('summary');box.id='beta-materials';label.textContent='Materials & provisions';const old=materials.previousElementSibling;if(old?.classList.contains('eyebrow'))old.remove();materials.before(box);box.append(label,materials)}
 function reveal(el){for(let p=el;p;p=p.parentElement){if(p.tagName==='DETAILS')p.open=true;if(p.classList.contains('m-collapsed'))p.querySelector(':scope > .m-collapse-toggle')?.click()}}
 function openTraits(id){closeHeroStats();showView('hall');renderBuildings();let panel=document.getElementById('trait-reroll-panel');if(!panel)return;const select=panel.querySelector('[data-trait-hero]');select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));panel=document.getElementById('trait-reroll-panel');reveal(panel);panel.scrollIntoView({block:'center'});panel.querySelector('[data-trait-old]')?.focus()}
 const stats=renderHeroStats;renderHeroStats=function(){const out=stats.apply(this,arguments),h=purse(viewingHeroId),root=document.getElementById('hero-stats-content');if(!h||h.dead||!root)return out;
  const section=[...root.querySelectorAll('.hero-detail-block')].find(el=>el.querySelector('.eyebrow')?.textContent.trim().toLowerCase()==='traits');if(!section||section.querySelector('.beta-trait-action'))return out;
  const action=document.createElement('div');action.className='beta-trait-action';const button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent='Change traits';button.disabled=!buildingOperational('trainingHall');button.onclick=()=>openTraits(h.id);const note=document.createElement('span');note.className='small muted';note.textContent=button.disabled?'Requires a completed, staffed Training Hall.':'Random: 10 gp · Choose: 100 gp · Hero pays';action.append(button,note);section.append(action);return out;
 };
 const tracker=document.getElementById('report-count')?.closest('article');
 function placeTracker(id){if(!tracker||!['quests','permanent-quests'].includes(id))return;const view=document.getElementById(id),anchor=view.querySelector(':scope > .beta-subtabs')||view.querySelector(':scope > .heading');if(tracker.parentElement!==view){if(anchor)anchor.after(tracker);else view.prepend(tracker)}}
 const view=showView;showView=function(id){placeTracker(id);return view.apply(this,arguments)};placeTracker(document.querySelector('.view.active')?.id);
})();
