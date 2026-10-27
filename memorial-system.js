/* Permanent memorials: preserve report and bond records before death aftermath. */
(function(){
  const LIMIT=3,EPITAPH_LIMIT=240;
  const esc=tbwEsc;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const members=g=>[...(g.heroes||[]),g.player].filter(Boolean);
  const fallen=g=>(g.heroes||[]).filter(h=>h.id!=='player'&&h.dead);
  const find=(g,id)=>[...members(g),...(g.dismissedHeroes||[])].find(h=>h.id===id);
  const day=value=>Number.isFinite(Number(value))&&Number(value)>0?Number(value):null;
  const service=(h,g)=>h.serviceRecord||(h.serviceRecord={sinceDay:g.day,reports:0,successes:0,exceptional:0,dangerousVictories:0,convoys:0});
  function archive(r){
    const copy={};
    for(const key of ['title','kind','questKind','questRank','profession','outcome','summary','extendedSummary','dispatchedDay','returnedDay','partyIds','casualties','rolls','deathAccounts','payout','rep','lootDrops','resource','resourceQty','organizingCost','cargo','deliveredFraction','lostEquipment']){
      if(r[key]!==undefined)copy[key]=clone(r[key]);
    }
    return copy;
  }
  function capture(h,g,r,legacy){
    if(h.memorial)return h.memorial;
    const companions=Object.entries(g.bonds||{}).filter(([key,b])=>key.split('|').includes(h.id)&&Number(b.v)>0).map(([key,b])=>{
      const id=key.split('|').find(id=>id!==h.id),other=find(g,id);
      return {id,name:other?.name||'Unknown companion',value:Number(b.v),tier:bondTier(Number(b.v)).name};
    }).sort((a,b)=>b.value-a.value).slice(0,3);
    const rank=Math.max(0,Number(h.rank)||0),level=heroLevel(h),missions=Math.max(0,Number(h.missions)||0);
    const achievements=[`Reached ${ranks[rank]||'F'} rank`,`Reached Level ${level}`];
    if(missions)achievements.push(`${missions} completed mission${missions===1?'':'s'} in guild service`);
    if((h.perks||[]).length)achievements.push(`Mastered ${(h.perks||[]).length} perk${h.perks.length===1?'':'s'}`);
    const record=h.serviceRecord;
    if(record?.exceptional)achievements.push(`${record.exceptional} exceptional expedition${record.exceptional===1?'':'s'}`);
    if(record?.dangerousVictories)achievements.push(`${record.dangerousVictories} victories in dungeons, raids or world-boss expeditions`);
    h.memorial={version:1,name:h.name,rank,level,missions,recruitedDay:day(h.recruitedDay),deathDay:day(r?.returnedDay)||(!legacy?g.day:day(h.deathDay)),legacy:!!legacy,companions,companionsKnown:!legacy||companions.length>0,achievements,service:record?clone(record):null,finalReport:r?archive(r):null,epitaph:'',honored:!legacy&&fallen(g).filter(x=>x.memorial?.honored).length<LIMIT};
    return h.memorial;
  }
  window.memorialMigrate=function(g){
    if(!g)return g;protectGuildmaster(g);
    const reports=g.todayReports||[];
    for(const h of members(g)){
      if(!h.dead){service(h,g);continue}
      const report=[...reports].reverse().find(r=>(r.casualties||[]).includes(h.id));
      const m=capture(h,g,report,true);
      m.epitaph=typeof m.epitaph==='string'?m.epitaph.slice(0,EPITAPH_LIMIT):'';
    }
    let honors=0;for(const h of fallen(g))if(h.memorial.honored)h.memorial.honored=++honors<=LIMIT;
    return g;
  };
  // Capture every casualty together, before tbwOnDeath deletes any shared bonds.
  const oldAftermath=tbwApplyReport;
  tbwApplyReport=function(r){
    if(!r.memorialServiceRecorded){
      for(const id of new Set(r.partyIds||[])){
        const h=find(game,id);if(!h)continue;
        const record=service(h,game);record.reports++;if(r.kind==='trade')record.convoys++;
        if(['Success','Exceptional Success'].includes(r.outcome)){
          record.successes++;
          if(r.outcome==='Exceptional Success')record.exceptional++;
          if(['Dungeon','World Dungeon','Raid','World Boss','World Raid'].includes(r.questKind))record.dangerousVictories++;
        }
      }
      r.memorialServiceRecorded=true;
    }
    for(const id of new Set(r.casualties||[])){
      const h=find(game,id);if(h?.dead)capture(h,game,null,false);
    }
    return oldAftermath.apply(this,arguments);
  };
  const oldResolve=applyPendingReports;
  applyPendingReports=function(){
    const reports=oldResolve.apply(this,arguments);
    for(const r of reports)for(const id of new Set(r.casualties||[])){
      const h=find(game,id);if(h?.dead){const m=capture(h,game,null,false);if(!m.finalReport)m.finalReport=archive(r)}
    }
    return reports;
  };
  // Recruitment date and detailed career counters begin with this update.
  const oldHire=confirmHire;
  confirmHire=function(){
    const ids=new Set((game.heroes||[]).map(h=>h.id));
    const result=oldHire.apply(this,arguments);
    for(const h of game.heroes||[])if(!ids.has(h.id)){h.recruitedDay=game.day;service(h,game)}
    if((game.heroes||[]).some(h=>!ids.has(h.id)))save();
    return result;
  };
  const oldLoad=loadGame;loadGame=function(){return memorialMigrate(oldLoad.apply(this,arguments))};
  const oldSave=save;save=function(){memorialMigrate(game);return oldSave.apply(this,arguments)};
  window.openFallenMemorial=function(){showFallen=true;showView('roster');renderHeroes()};
  window.openMemorialRecord=function(id){const h=find(game,id);if(h?.dead&&id!=='player')openHeroStats(id)};
  window.openMemorialReport=function(id){
    const h=find(game,id),r=id!=='player'&&h?.dead&&h.memorial?.finalReport;if(r)showReportDetails(r);
  };
  function refresh(){render();if(viewingHeroId&&find(game,viewingHeroId)?.dead)renderHeroStats()}
  window.setMemorialHonor=function(id){
    const h=find(game,id);if(!h?.dead||id==='player')return false;memorialMigrate(game);
    const m=h.memorial;if(!m.honored&&fallen(game).filter(x=>x.memorial.honored).length>=LIMIT)return false;
    m.honored=!m.honored;save();refresh();return true;
  };
  window.saveMemorialEpitaph=function(id,text){
    const h=find(game,id);if(!h?.dead||id==='player')return false;memorialMigrate(game);
    h.memorial.epitaph=String(text||'').trim().slice(0,EPITAPH_LIMIT);save();refresh();
    const status=document.getElementById('memorial-save-status');if(status)status.textContent='Epitaph saved.';
    return true;
  };
  function label(h){const m=h.memorial;return `${(ranks[m.rank]||'F')+' rank'} · Level ${m.level} · ${m.deathDay?'Fell on Day '+m.deathDay:'Date of death unrecorded'}`}
  function bindRecords(root,heroes){
    root.querySelectorAll('[data-memorial-open]').forEach(button=>button.onclick=()=>openMemorialRecord(heroes[Number(button.dataset.memorialOpen)].id));
  }
  function renderRemembrance(){
    const root=document.getElementById('guild-remembrance');if(!root)return;
    const all=fallen(game),honored=all.filter(h=>h.memorial.honored);root.hidden=!all.length;
    root.innerHTML=`<div class="eyebrow">Guild remembrance</div><h3>Those who carried the Lantern</h3><p class="small muted">Honour up to ${LIMIT} fallen heroes here. Their service is remembered by the guild.</p><div class="remembrance-grid">${honored.map((h,index)=>`<section class="remembrance-plaque"><h4>${esc(h.memorial.name)}</h4><p class="small muted">${esc(label(h))}</p><blockquote>${esc(h.memorial.epitaph||'Their watch has ended. The Lantern remembers.')}</blockquote><button type="button" class="btn ghost" data-memorial-open="${index}">Memorial record</button></section>`).join('')||'<p class="muted">Choose heroes to honour from the Fallen Memorial.</p>'}</div><button type="button" class="btn secondary" id="hall-memorial-open">Fallen Memorial · ${all.length}</button>`;
    root.querySelector('#hall-memorial-open').onclick=openFallenMemorial;bindRecords(root,honored);
  }
  const oldHeroes=renderHeroes;
  renderHeroes=function(){
    const result=oldHeroes.apply(this,arguments),all=fallen(game);
    document.getElementById('fallen-toggle').textContent=showFallen?'← Back to heroes':`Fallen Memorial · ${all.length}`;
    document.getElementById('roster-count').textContent=`${game.heroes.filter(h=>!h.dead).length} active · ${all.length} fallen`;
    if(showFallen){
      memorialMigrate(game);
      const root=document.getElementById('hero-list'),filters=document.getElementById('v9-rfilters');if(filters)filters.style.display='none';
      root.innerHTML=all.map((h,index)=>`<article class="card memorial-card"><div class="eyebrow">${h.memorial.honored?'Honoured in the Guild Hall':'Fallen Memorial'}</div><h3>${esc(h.memorial.name)}</h3><p class="small muted">${esc(label(h))}</p><p>${h.memorial.missions} completed missions</p>${h.memorial.epitaph?`<blockquote>${esc(h.memorial.epitaph)}</blockquote>`:''}<button type="button" class="btn secondary" data-memorial-open="${index}">Memorial record</button></article>`).join('')||'<div class="empty">No heroes have fallen. The memorial hall is quiet.</div>';
      root.classList.remove('roster-scroll');root.style.maxHeight='';root.style.overflowY='';bindRecords(root,all);
    }
    return result;
  };
  function recordPanel(h){
    const m=h.memorial,r=m.finalReport,s=m.service,full=fallen(game).filter(x=>x.memorial.honored).length>=LIMIT;
    return `<section class="memorial-record"><div class="eyebrow">Permanent memorial record</div><h3>A life in guild service</h3><p>${esc(label(h))}</p><p>${m.recruitedDay?'Joined on Day '+m.recruitedDay:'Recruitment date unrecorded'} · ${m.missions} completed missions</p><h4>Achievements</h4><ul>${m.achievements.map(a=>`<li>${esc(a)}</li>`).join('')}</ul>${s?`<p class="small muted">Detailed service recorded from Day ${s.sinceDay}: ${s.reports} expeditions, ${s.successes} successful, ${s.exceptional} exceptional, ${s.convoys} convoy runs. Earlier missions remain included in the completed-mission total.</p>`:'<p class="small muted">Detailed service history was not recorded before this update.</p>'}<h4>Closest companions</h4>${m.companions.length?`<ul>${m.companions.map(c=>`<li>${esc(c.name)} · ${esc(c.tier)} (${c.value}/100)</li>`).join('')}</ul>`:`<p class="muted">${m.companionsKnown?'No bonds were recorded at the time of death.':'Earlier companion records are unavailable.'}</p>`}<h4>Final expedition</h4>${r?`<p>${esc(r.title)} · ${esc(r.outcome)}</p>${reportDeathsMarkup(r,true)}<button type="button" class="btn secondary" id="memorial-final-report">Read preserved final report</button>`:'<p class="muted">The final quest report is no longer available in this save.</p>'}<div class="memorial-epitaph"><label for="memorial-epitaph">Epitaph <span class="small muted">(up to ${EPITAPH_LIMIT} characters)</span></label><textarea id="memorial-epitaph" rows="4" maxlength="${EPITAPH_LIMIT}" placeholder="Write how the guild will remember them…">${esc(m.epitaph)}</textarea><button type="button" class="btn secondary" id="memorial-save-epitaph">Save epitaph</button><p class="small muted" id="memorial-save-status" role="status"></p></div><div class="memorial-honor"><button type="button" class="btn ${m.honored?'ghost':'secondary'}" id="memorial-honor" aria-pressed="${!!m.honored}" ${full&&!m.honored?'disabled':''}>${m.honored?'Remove from Guild Hall remembrance':'Honour in the Guild Hall'}</button><p class="small muted">${full&&!m.honored?'All three remembrance places are occupied. Remove another hero from the display to make room.':'Up to three heroes may be honoured in the Guild Hall. Every fallen hero keeps their permanent memorial record.'}</p></div></section>`;
  }
  const oldStats=renderHeroStats;
  renderHeroStats=function(){
    const result=oldStats.apply(this,arguments),h=find(game,viewingHeroId);if(!h?.dead)return result;
    memorialMigrate(game);
    const right=document.querySelector('#hero-stats-content .hero-stats-right');if(!right)return result;
    right.innerHTML=recordPanel(h);
    const final=right.querySelector('#memorial-final-report');if(final)final.onclick=()=>openMemorialReport(h.id);
    right.querySelector('#memorial-save-epitaph').onclick=()=>saveMemorialEpitaph(h.id,right.querySelector('#memorial-epitaph').value);
    right.querySelector('#memorial-honor').onclick=()=>setMemorialHonor(h.id);
    return result;
  };
  const oldRender=render;render=function(){memorialMigrate(game);const result=oldRender.apply(this,arguments);renderRemembrance();return result};
  memorialMigrate(game);render();
})();
