/* Beta-only quest grouping and consistent disclosure controls. */
(() => {
 const style=document.createElement('style');style.textContent=`
 .beta-party-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:18px}.beta-party-heading h3{margin:0!important}.beta-party-heading .btn{margin-left:auto}
 .beta-sheet-bd{z-index:1100!important}.beta-sheet{z-index:1101!important}
 html:not(.beta-tbar-on) .beta-tbar{display:none!important}
 .beta-expedition-heading{grid-column:1/-1;margin:28px 0 4px;padding-top:22px;border-top:1px solid var(--line);color:var(--acc);font:500 15px/1.5 var(--fn);letter-spacing:.08em;text-transform:uppercase}
 #beta-quest-tracker{padding:0!important}
 #beta-quest-tracker>.m-collapse-toggle{display:flex!important;align-items:center;position:static!important;width:100%;min-height:72px;margin:0!important;padding:20px!important;border:0;border-bottom:1px solid var(--line);border-radius:12px 12px 0 0;background:transparent;color:var(--acc);text-align:left;font:500 14px/1.5 var(--fn);letter-spacing:.08em;text-transform:uppercase}
 #beta-quest-tracker.m-collapsed>.m-collapse-toggle{border-bottom:0;border-radius:12px}
 #beta-quest-tracker.m-collapsed>:not(.m-collapse-toggle){display:none!important}
 #beta-quest-tracker>:not(.m-collapse-toggle){margin:18px 20px}
 `;document.head.append(style);
 function tracker(){const card=document.getElementById('report-count')?.closest('article');if(!card)return;card.id='beta-quest-tracker';card.dataset.mcol='beta-quest-tracker';card.classList.add('m-collapsible');let button=card.querySelector(':scope>.m-collapse-toggle');if(!button){button=document.createElement('button');button.type='button';button.className='m-collapse-toggle';card.prepend(button);try{card.classList.toggle('m-collapsed',JSON.parse(localStorage.getItem('wl-mobile-collapse')||'{}')['beta-quest-tracker']??true)}catch(e){card.classList.add('m-collapsed')}}
  const paint=()=>{const open=!card.classList.contains('m-collapsed');button.textContent=(open?'▾ ':'▸ ')+'Quest tracker';button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',(open?'Collapse ':'Expand ')+'Quest tracker');if(card.firstElementChild!==button)card.prepend(button)};
  button.onclick=e=>{e.stopPropagation();card.classList.toggle('m-collapsed');try{const key='wl-mobile-collapse',s=JSON.parse(localStorage.getItem(key)||'{}');s['beta-quest-tracker']=card.classList.contains('m-collapsed');localStorage.setItem(key,JSON.stringify(s))}catch(err){}paint()};paint();
 }
 function headings(){const root=document.getElementById('permanent-contract-list');if(!root)return;root.querySelectorAll('.beta-expedition-heading').forEach(h=>h.remove());const seen=new Set();for(const card of root.querySelectorAll(':scope>article.quest')){const id=card.getAttribute('onclick')?.match(/openQuestDetails\('([^']+)'/)?.[1],q=id&&questById(id),kind=q?.kind;if(!kind||seen.has(kind))continue;seen.add(kind);const h=document.createElement('h3');h.className='beta-expedition-heading';h.textContent=({Exploration:'Exploration','World Dungeon':'World dungeons','World Boss':'World bosses','World Raid':'World raids'}[kind]||kind);card.before(h)}const prior=root.previousElementSibling;if(prior?.classList.contains('eyebrow')&&prior.textContent==='Standing expeditions')prior.hidden=true}
 function salvage(){const root=document.getElementById('gather-quest-list'),card=[...root?.querySelectorAll('article.quest')||[]].find(c=>c.querySelector('h3')?.textContent==='Salvage for Coin');if(!card)return;
  // The shared salvage module uses a DOM listener; give beta the same card
  // identity used by the other gathering cards and their presentation rules.
  card.setAttribute('onclick',"openQuestDetails('gather-salvage-gold')");card.onkeydown=e=>{if(e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openQuestDetails('gather-salvage-gold')}};
  card.classList.add('beta-salvage-card');
 }
 const detail=renderQuestDetails;renderQuestDetails=function(){const out=detail.apply(this,arguments),box=document.getElementById('quest-detail-content'),heading=[...box?.querySelectorAll('h3')||[]].find(h=>h.textContent==='Choose party members');if(heading){const row=document.createElement('div');row.className='beta-party-heading';heading.before(row);row.append(heading);const button=document.createElement('button');button.type='button';button.className='btn ghost';button.id='beta-unselect-all';button.textContent='Unselect all';button.disabled=!game.selected.length;button.onclick=()=>{const scroll=box.closest('.modalbox'),top=scroll?.scrollTop;game.selected=[];renderQuestDetails();window.betaUxRun?.();if(scroll)scroll.scrollTop=top};row.append(button)}return out};
 const quests=renderQuests;renderQuests=function(){const out=quests.apply(this,arguments);headings();salvage();return out};const rendering=render;render=function(){const out=rendering.apply(this,arguments);tracker();return out};headings();salvage();tracker();
})();
