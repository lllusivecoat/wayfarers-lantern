/* Direct access to existing equipment and utility reservation rules. */
(() => {
  let selected='player',opener=null;
  const modal=document.createElement('div');modal.id='quick-equip-modal';modal.className='modal';
  modal.innerHTML='<div class="modalbox" role="dialog" aria-modal="true" aria-labelledby="quick-equip-title"><div class="row"><h2 id="quick-equip-title">Equip heroes</h2><button class="btn ghost" id="quick-equip-close">Close</button></div><label>Hero<select id="quick-equip-hero"></select></label><p id="quick-equip-status" role="status"></p><div id="quick-equip-slots"></div></div>';
  document.body.appendChild(modal);
  function refresh(){
    if(!modal.classList.contains('open'))return;
    const heroes=[game.player,...game.heroes].filter(h=>h&&!h.dead);
    if(!heroes.some(h=>h.id===selected))selected=heroes[0]?.id;
    const h=heroes.find(h=>h.id===selected);if(!h)return close();
    modal.querySelector('#quick-equip-hero').innerHTML=heroes.map(h=>`<option value="${tbwEsc(h.id)}" ${h.id===selected?'selected':''}>${tbwEsc(h.name)} · Lv ${heroLevel(h)}${h.ready?'':' · Away'}</option>`).join('');
    const locked=!h.ready||hasActiveQuestFor(h.id);
    modal.querySelector('#quick-equip-status').textContent=locked?'This hero is away. Equipment and provisions can be changed after they return.':`${h.className} · ${h.spec} · ${h.gold||0} gp personal purse. Choose gear and utility supplies below. Changes save immediately.`;
    const slots=modal.querySelector('#quick-equip-slots');slots.innerHTML=renderHeroEquipment(h);
    slots.querySelectorAll('select').forEach(s=>{if(locked)s.disabled=true});
  }
  function close(){modal.classList.remove('open');if(opener?.isConnected)opener.focus()}
  window.openQuickEquip=function(id='player'){
    const h=purse(id);if(!h||h.dead)return;
    selected=id;opener=document.activeElement;modal.classList.add('open');refresh();modal.querySelector('#quick-equip-hero').focus();
  };
  modal.querySelector('#quick-equip-close').onclick=close;
  modal.querySelector('#quick-equip-hero').onchange=e=>{selected=e.target.value;refresh()};
  modal.querySelector('#quick-equip-slots').addEventListener('change',()=>setTimeout(refresh,0));
  modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}});
  const button=document.createElement('button');button.className='btn secondary';button.type='button';button.id='quick-equip-open';button.textContent='Equip heroes';button.onclick=()=>openQuickEquip(selected);
  document.querySelector('.topactions').prepend(button);
  const previous=render;render=function(){const result=previous.apply(this,arguments);refresh();return result};
  const style=document.createElement('style');style.textContent=`
    .topactions{flex-wrap:wrap}
    #quick-equip-modal .modalbox{width:min(640px,96vw);max-height:88dvh;overflow-y:auto;overscroll-behavior:contain}
    #quick-equip-modal label{display:block;margin:16px 0}#quick-equip-modal select{width:100%;min-width:0;min-height:44px;padding:8px;font-size:16px}
    #quick-equip-modal .equipment-slot-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-areas:none!important;gap:12px}
    #quick-equip-modal .equipment-slot{grid-area:auto!important;grid-column:1/-1!important;min-width:0;min-height:0!important;padding:12px!important;text-align:left}
    #quick-equip-modal .equipment-slot-icon{display:none}#quick-equip-modal .slot-name{display:block;margin-bottom:8px}#quick-equip-modal .slot-durability{margin-top:8px;overflow-wrap:anywhere}
    #quick-equip-status{line-height:1.7;margin:18px 0}
  `;document.head.appendChild(style);
  renderHeroes();
})();
