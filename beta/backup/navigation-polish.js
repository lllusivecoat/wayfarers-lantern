/* Beta-only shortcuts and consistent inventory/quest presentation. */
(() => {
 const style=document.createElement('style');style.textContent=`
 .pill{display:inline-flex!important;align-items:center;justify-content:center;max-width:100%;min-height:28px;padding:5px 10px!important;border-radius:9px!important;line-height:1.4!important;white-space:normal!important;overflow-wrap:anywhere;text-align:center;vertical-align:middle}
 .btn,.v9-chip,.trait-chip,.v9-rank-pick,.beta-htabs button,.beta-subtabs button{border-radius:10px!important;line-height:1.4!important}
 .btn,.v9-chip,button.trait-chip{min-height:44px!important}
 #hero-stats-modal .v9-trait-panel{display:grid!important;gap:16px;width:100%}
 #hero-stats-modal .v9-trait-item{display:grid!important;grid-template-columns:minmax(0,1fr) 142px;gap:8px;align-items:center;width:100%;min-width:0}
 #hero-stats-modal .v9-trait-item .trait-chip{justify-self:start;white-space:nowrap!important;word-break:normal;overflow-wrap:normal}
 #hero-stats-modal .beta-training-details{grid-column:1/-1;line-height:1.5}
 #hero-stats-modal .v9-train,#hero-stats-modal .wound-badge .btn,#hero-stats-modal .beta-trait-action .btn,#hero-stats-modal .v9-respec{width:142px!important;max-width:100%;min-height:44px!important;padding:10px!important;box-sizing:border-box;font:600 12px/1.4 var(--fn);justify-self:end;margin:0}
 #hero-stats-modal .wound-badge{display:grid;grid-template-columns:minmax(0,1fr) 142px;gap:10px;align-items:center}
 #hero-stats-modal .beta-trait-action{display:grid;grid-template-columns:minmax(0,1fr) 142px;gap:12px}
 #hero-stats-modal .beta-trait-action button{grid-column:2;grid-row:1}
 #hero-stats-modal .beta-trait-action>span{grid-column:1/-1;grid-row:2}
 #hero-stats-modal .v9-respec{display:block;margin-left:auto}
 .beta-trait-help{margin-top:20px;padding-top:16px;border-top:1px solid var(--line)}.beta-trait-help summary{cursor:pointer;min-height:44px;color:var(--acc)}.beta-trait-help p{margin:16px 0;line-height:1.7}
 #beta-materials{margin:20px 0;padding:16px 0;border-block:1px solid var(--line)}
 #beta-materials>summary{cursor:pointer;min-height:44px;color:var(--acc);font-weight:600}
 .beta-trait-action{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:20px}
 `;document.head.append(style);
 const materials=document.getElementById('warehouse-materials');if(materials&&!document.getElementById('beta-materials')){const box=document.createElement('details'),label=document.createElement('summary');box.id='beta-materials';label.textContent='Materials & provisions';const old=materials.previousElementSibling;if(old?.classList.contains('eyebrow'))old.remove();materials.before(box);box.append(label,materials)}
 function reveal(el){for(let p=el;p;p=p.parentElement){if(p.tagName==='DETAILS')p.open=true;if(p.classList.contains('m-collapsed'))p.querySelector(':scope > .m-collapse-toggle')?.click()}}
 function openTraits(id){closeHeroStats();showView('hall');renderBuildings();let panel=document.getElementById('trait-reroll-panel');if(!panel)return;const select=panel.querySelector('[data-trait-hero]');select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));panel=document.getElementById('trait-reroll-panel');reveal(panel);panel.scrollIntoView({block:'center'});panel.querySelector('[data-trait-old]')?.focus()}
 const stats=renderHeroStats;renderHeroStats=function(){const out=stats.apply(this,arguments),h=purse(viewingHeroId),root=document.getElementById('hero-stats-content');if(!h||h.dead||!root)return out;
  const section=[...root.querySelectorAll('.hero-detail-block')].find(el=>el.querySelector('.eyebrow')?.textContent.trim().toLowerCase()==='traits');if(!section||section.querySelector('.beta-trait-action'))return out;
  const action=document.createElement('div');action.className='beta-trait-action';const button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent='Change traits';button.disabled=!buildingOperational('trainingHall');button.onclick=()=>openTraits(h.id);const note=document.createElement('span');note.className='small muted';note.textContent=button.disabled?'Requires a completed, staffed Training Hall.':'Random: 10 gp · Choose: 100 gp · Hero pays';action.append(button,note);section.append(action);const help=document.createElement('details');help.className='beta-trait-help';help.innerHTML='<summary>Train or change traits?</summary><p><strong>Train · 15–25 gp:</strong> Pay once to follow that trait’s fixed improvement path. Finish both the listed training days and qualifying quests to remove or improve the trait. Heroes can still go on quests, but training days pause while they are away. Quests that do not qualify do not reset progress or require another payment.</p><p><strong>Change traits:</strong> Replace one trait instantly: 10 gp for a different random trait, or 100 gp to choose a compatible replacement. Random results can be positive or negative. Duplicate and conflicting traits are excluded. Finish or cancel existing trait training first.</p><p>Both options require a staffed Training Hall and use the hero’s personal gold. Other traits and skills are kept.</p>';section.append(help);return out;
 };
 const tracker=document.getElementById('report-count')?.closest('article');
 function placeTracker(id){if(!tracker||!['quests','permanent-quests'].includes(id))return;const view=document.getElementById(id),anchor=view.querySelector(':scope > .beta-subtabs')||view.querySelector(':scope > .heading');if(tracker.parentElement!==view){if(anchor)anchor.after(tracker);else view.prepend(tracker)}}
 const view=showView;showView=function(id){placeTracker(id);return view.apply(this,arguments)};placeTracker(document.querySelector('.view.active')?.id);
})();
