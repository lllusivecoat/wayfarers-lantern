/* Beta-only Hall controls and palette; the shared-save guard remains in charge. */
(() => {
 const css=document.createElement('style');css.textContent=`
 #hall>.grid:empty{display:none!important}
 .beta-hall-sections{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;margin-top:16px}
 #hall .beta-hall-sections>article{margin:0!important;padding:0!important;min-width:0}
 #hall .beta-hall-sections>article[hidden]{display:none!important}
 #hall .beta-hall-sections>article>.m-collapse-toggle{display:flex!important;align-items:center;gap:10px;position:static!important;width:100%;min-height:72px;margin:0!important;padding:20px!important;border:0;border-bottom:1px solid var(--line);border-radius:12px 12px 0 0;background:transparent;color:var(--acc);text-align:left;font:500 14px/1.5 var(--fn);letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
 #hall .beta-hall-sections>article.m-collapsed>.m-collapse-toggle{border-bottom:0;border-radius:12px}
 #hall .beta-hall-sections>article.m-collapsed>:not(.m-collapse-toggle){display:none!important}
 #hall .beta-hall-sections>article>:not(.m-collapse-toggle){margin:18px 20px}
 #hall>.beta-first-grid{order:initial!important;margin:13px 0!important}
 #hall .beta-first-grid{flex-direction:column!important}
 .beta-guild-heading>div{min-width:0;flex:1}
 #beta-guild-rename{margin-top:18px;max-width:560px}
 #beta-guild-rename label{display:block;margin-bottom:8px}
 #beta-guild-rename input{min-width:0;flex:1;width:100%;min-height:44px;padding:12px;background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:10px;font:inherit}
 #beta-guild-rename .row{gap:12px;flex-wrap:wrap}
 #beta-guild-name{overflow-wrap:anywhere}
 #hero-stats-modal .hero-ability,#hero-stats-modal .equipment-slot{background:var(--panel2)!important;border-color:var(--line)!important;color:var(--text)!important}
 #hero-stats-modal .equipment-slot.equipped{border-color:var(--acc)!important}
 `;document.head.append(css);
 const form=document.getElementById('beta-guild-rename'),input=document.getElementById('beta-guild-name-input'),heading=document.getElementById('beta-guild-name');
 function sync(){const name=game.guildName||"The Wayfarer's Lantern";heading.textContent=name;if(document.activeElement!==input)input.value=name;
  const hall=document.getElementById('hall');let group=document.getElementById('beta-hall-sections');if(!group){group=document.createElement('div');group.id='beta-hall-sections';group.className='beta-hall-sections';hall.append(group)}
  const sections=[['player-name-label','Guildmaster'],['applicant-list','Recruitment'],['hall-operations','Operations'],['building-list','Plots and buildings'],['guild-remembrance','Remembrance'],['latest-title','Latest entry']];
  sections.forEach(([id,label],index)=>{const node=document.getElementById(id),card=node?.closest('article');if(!card)return;if(group.children[index]!==card)group.insertBefore(card,group.children[index]||null);
   if(!card.dataset.betaHallReady){card.dataset.betaHallReady='1';card.dataset.mcol='beta-hall-'+id;try{const state=JSON.parse(localStorage.getItem('wl-mobile-collapse')||'{}');card.classList.toggle('m-collapsed',state[card.dataset.mcol]??true)}catch(err){card.classList.add('m-collapsed')}}
   card.classList.add('m-collapsible');let button=card.querySelector(':scope > .m-collapse-toggle');if(!button){button=document.createElement('button');button.type='button';button.className='m-collapse-toggle';card.prepend(button)}
   const paint=()=>{const open=!card.classList.contains('m-collapsed');const text=(open?'▾ ':'▸ ')+label;if(button.textContent!==text)button.textContent=text;button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',(open?'Collapse ':'Expand ')+label);if(card.firstElementChild!==button)card.prepend(button)};
   button.onclick=e=>{e.stopPropagation();card.classList.toggle('m-collapsed');try{const key='wl-mobile-collapse',state=JSON.parse(localStorage.getItem(key)||'{}');state[card.dataset.mcol||'beta-hall-'+id]=card.classList.contains('m-collapsed');localStorage.setItem(key,JSON.stringify(state))}catch(err){}paint()};paint();
  });
 }
 form.onsubmit=e=>{e.preventDefault();const name=input.value.trim().replace(/\s+/g,' ');if(!name){input.setCustomValidity('Enter a guild name.');input.reportValidity();return}input.setCustomValidity('');
  if(window.__betaSaveGuard?.error){document.getElementById('beta-guild-name-status').textContent='Saving is paused by the beta save guard. Reload before renaming your guild.';return}
  game.guildName=name;save();sync();document.getElementById('beta-guild-name-status').textContent='Guild renamed to '+name+'.';
 };
 input.oninput=()=>input.setCustomValidity('');const previous=render;render=function(){const out=previous.apply(this,arguments);sync();return out};sync();
})();
