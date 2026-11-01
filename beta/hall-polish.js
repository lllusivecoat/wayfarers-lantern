/* Beta-only Hall controls and palette; the shared-save guard remains in charge. */
(() => {
 const css=document.createElement('style');css.textContent=`
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
  const hall=document.getElementById('hall'),latest=document.getElementById('latest-title')?.closest('article');if(latest&&hall.lastElementChild!==latest)hall.append(latest);
 }
 form.onsubmit=e=>{e.preventDefault();const name=input.value.trim().replace(/\s+/g,' ');if(!name){input.setCustomValidity('Enter a guild name.');input.reportValidity();return}input.setCustomValidity('');
  if(window.__betaSaveGuard?.error){document.getElementById('beta-guild-name-status').textContent='Saving is paused by the beta save guard. Reload before renaming your guild.';return}
  game.guildName=name;save();sync();document.getElementById('beta-guild-name-status').textContent='Guild renamed to '+name+'.';
 };
 input.oninput=()=>input.setCustomValidity('');const previous=render;render=function(){const out=previous.apply(this,arguments);sync();return out};sync();
})();
