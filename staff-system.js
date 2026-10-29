/* Staff skills and market convoys. Extends the existing v9 building/report engine. */
(function(){
  const skills={alchemyLab:'Alchemy',cartographersOffice:'Cartography',waystation:'Pathfinding',warehouse:'Storekeeping',staffOffice:'Quartermastery',workshop:'Blacksmithing',kitchen:'Cooking',infirmary:'First Aid',armory:'Armoring',trainingHall:'Training',warRoom:'Tactics',huntersLodge:'Hunting',commandPost:'Command'};
  const thresholds=[0,5,15,30,50,75,105,140,180,225,275];
  const esc=tbwEsc;
  const expandedStaff=new Set();
  function skillBar(st,skill){const xp=Number(st.professionXP[skill])||0,level=staffSkillLevel(xp),toward=xp-thresholds[level],need=thresholds[level+1]-thresholds[level];return `<div class="staff-skill-tracker" style="margin:18px 0"><strong>${esc(skill)} · Level ${level}</strong><progress style="display:block;width:100%;height:18px;margin:10px 0;accent-color:var(--gold2)" max="${level===10?1:need}" value="${level===10?1:toward}" aria-label="${esc(skill)} practice toward next level"></progress><span class="small muted">${level===10?'Mastered · Level 10':`${toward}/${need} practice · ${need-toward} more to Level ${level+1}`}</span></div>`}

  window.staffSkillLevel=points=>thresholds.reduce((level,t,i)=>Number(points)>=t?i:level,0);
  window.ensureStaffCandidates=function(g=game){
    if(g.staffCandidateDay===g.day&&Array.isArray(g.staffCandidates)){g.staffCandidates.forEach(c=>{if(!c.staffProfileVersion){if(c.status==='available')Object.assign(c,WL_STAFF.roll());else{const st=(g.staffMembers||[]).find(st=>st.id===c.id);if(st?.aptitudes)Object.assign(c,{aptitudes:{...st.aptitudes},personality:st.personality});WL_STAFF.migrate(c)}}});return g.staffCandidates;}
    const used=[...(g.staffMembers||[]),...(g.heroes||[]),...(g.applicants||[]),g.player,...(g.dismissedHeroes||[])].filter(Boolean).map(h=>h.name);
    g.staffCandidates=[];g.staffCandidateDay=g.day;
    for(let i=0;i<2;i++){
      const race=APPLICANT_RACES[Math.floor(Math.random()*APPLICANT_RACES.length)],name=generateRaceName(race,used);used.push(name);
      g.staffCandidateSequence=(Number(g.staffCandidateSequence)||0)+1;
      g.staffCandidates.push({id:'staff-candidate-'+g.staffCandidateSequence,name,race,...WL_STAFF.roll(),status:'available'});
    }
    return g.staffCandidates;
  };
  window.staffMigrate=function(g){
    ensureStaffCandidates(g);
    (g.staffMembers||[]).forEach(st=>{
      if(typeof st.professionXP==='number')st.professionXP={[st.profession||skills[st.buildingKey]||'Generalist']:st.professionXP};
      st.professionXP=st.professionXP||{};
      if(st.professionXP.Medicine!==undefined){st.professionXP['First Aid']=Math.max(Number(st.professionXP['First Aid'])||0,Number(st.professionXP.Medicine)||0);delete st.professionXP.Medicine}
      if(st.profession==='Medicine')st.profession='First Aid';
      if(skills[st.buildingKey])st.profession=skills[st.buildingKey];
      st.skillAwards=st.skillAwards||{};WL_STAFF.migrate(st);
      if(st.lastWorkDay===undefined)st.lastWorkDay=Math.max(0,...Object.entries(st.skillAwards).filter(([k])=>k.endsWith(':work')).map(([,day])=>Number(day)||0));
    });
    const occupied=new Set();
    const posts=new Map((g.buildingList||[]).map(i=>[i.uid,i.key]));
    if(g.buildings?.warehouse)posts.set('warehouse','warehouse');
    const ranked=[...(g.staffMembers||[])].sort((a,b)=>{
      const points=st=>Number(st.professionXP[skills[posts.get(st.buildingUid)]]||0);
      return points(b)-points(a);
    });
    ranked.forEach(st=>{
      if(!st.buildingUid)return;
      if(!posts.has(st.buildingUid)||occupied.has(st.buildingUid)){st.buildingUid=null;st.buildingKey=null;delete st.homeKey;return}
      occupied.add(st.buildingUid);st.buildingKey=posts.get(st.buildingUid);st.profession=skills[st.buildingKey];
    });
    g.staffMembers.forEach(WL_STAFF.migrate);return g;
  };
  staffProfessionForKey=key=>skills[key]||'Generalist';
  staffPracticeCount=st=>st?Math.max(0,Number(st.professionXP?.[skills[st.buildingKey]||st.profession])||0):0;
  staffProfessionLevel=st=>st?staffSkillLevel(staffPracticeCount(st)):0;
  staffSkillBonus=key=>WL_STAFF.service(key).support;
  staffUnlockText=function(key,level){const st=buildingStaff(key);return WL_STAFF.describe(key,st,buildingLevel(key),st?.buildingUid,level)};
  function assigned(st){return st.buildingUid==='warehouse'?!!game.buildings.warehouse:!!v9InstById(st.buildingUid)}
  function award(st,amount,kind){
    if(!assigned(st)||!skills[st.buildingKey])return;
    const skill=skills[st.buildingKey],token=skill+':'+kind;
    if(st.skillAwards[token]===game.day)return;
    st.skillAwards[token]=game.day;
    const before=staffProfessionLevel(st);st.professionXP[skill]=(Number(st.professionXP[skill])||0)+amount;
    const after=staffProfessionLevel(st);if(after>before)addLog('Staff skill advanced',`${st.name}: ${skill} Level ${after}. ${WL_STAFF.describe(st.buildingKey,st,buildingLevel(st.buildingKey),st.buildingUid,after)}`);
  }
  practiceStaff=function(key,amount=1){staffMigrate(game);if(amount>0)(game.staffMembers||[]).filter(st=>st.buildingKey===key).forEach(st=>award(st,amount,'service'))};
  const oldDay=nextDay;
  nextDay=function(){
    staffMigrate(game);game.staffWorkSnapshot={day:game.day,office:v9L('staffOffice')>=2,workers:game.staffMembers.filter(assigned).map(st=>({id:st.id,uid:st.buildingUid,key:st.buildingKey}))};
    return oldDay.apply(this,arguments);
  };
  window.completeStaffWorkDay=function(){
    const shift=game.staffWorkSnapshot;delete game.staffWorkSnapshot;
    if(!shift||shift.day!==game.day-1)return;
    if(game.staffCostsPaidDay!==game.day){for(const worker of shift.workers){const st=game.staffMembers.find(s=>s.id===worker.id);if(st)st.loyalDays=0}return;}
    for(const worker of shift.workers){
      const st=game.staffMembers.find(s=>s.id===worker.id);
      if(!st||st.buildingUid!==worker.uid||!assigned(st)||st.lastWorkDay>=game.day)continue;
      if(st.lastWorkDay!==shift.day)st.loyalDays=0;
      st.lastWorkDay=game.day;st.loyalDays++;
      st.passiveCredit+=WL_STAFF.passiveRate(st,shift.office);
      const points=Math.floor(st.passiveCredit/100);st.passiveCredit%=100;award(st,points,'work');
    }
  };
  const oldRender=render;
  render=function(){staffMigrate(game);return oldRender.apply(this,arguments)};
  // Normal load and import both call render; migrate before the next save as well.
  const oldSave=save;save=function(){staffMigrate(game);return oldSave.apply(this,arguments)};
  const oldLoad=loadGame;loadGame=function(){return staffMigrate(oldLoad())};
  v9AssignStaff=function(id,uid){
    const st=game.staffMembers.find(s=>s.id===id),i=uid==='warehouse'?{uid,key:'warehouse',level:game.warehouseLevel||1}:v9InstById(uid);
    if(!st||!i||(uid==='warehouse'&&!game.buildings.warehouse))return 'invalid';
    const used=game.staffMembers.filter(s=>s!==st&&s.buildingUid===uid).length;
    if(used>=1)return 'full';
    st.buildingUid=uid;st.buildingKey=i.key;st.profession=skills[i.key];delete st.homeKey;
    staffMigrate(game);addLog('Staff assigned',`${st.name} now trains ${st.profession} at ${i.key==='warehouse'?'Warehouse':v9InstLabel(i)}.`);render();save();return '';
  };
  // Building levels control capacity, never skill levels.
  buildingLevel=function(key){return key==='warehouse'?game.warehouseLevel||1:Math.max(1,...v9Inst(key).map(i=>i.level))};
  function staffTargets(){return [...(game.buildings.warehouse?[{uid:'warehouse',key:'warehouse',level:game.warehouseLevel||1}]:[]),...(game.buildingList||[])]}
  function staffLocation(st){const target=staffTargets().find(i=>i.uid===st.buildingUid);return target?target.uid==='warehouse'?'Warehouse':v9InstLabel(target):'Unassigned'}
  function staffPay(st){return assigned(st)&&st.wage>0?Math.max(1,st.wage-(v9L('staffOffice')>=3?1:0)):0}
  hireStaff=function(id){
    const candidate=ensureStaffCandidates().find(c=>c.id===id);
    if(!candidate||candidate.status!=='available')return 'candidate';
    if(game.staffMembers.length>=staffCap()){v9Say('Staff capacity is full. Upgrade the Guild Hall to hire more staff.');return 'full'}
    if(!confirm(`Hire ${candidate.name}? No hiring fee. Base wage: ${candidate.wage} gp/day when assigned; no wage while unassigned. They join your roster unassigned.`))return 'cancelled';
    if(candidate.status!=='available'||game.staffMembers.some(st=>st.id===candidate.id))return 'candidate';
    if(game.staffMembers.length>=staffCap())return 'full';
    game.staffMembers.push({id:candidate.id,name:candidate.name,race:candidate.race,job:'Staff',wage:candidate.wage,morale:3,buildingUid:null,buildingKey:null,profession:'Generalist',professionXP:{},skillAwards:{},aptitudes:{...candidate.aptitudes},personality:candidate.personality,staffProfileVersion:1,passiveCredit:0,loyalDays:0});
    candidate.status='hired';
    addLog('Staff hired',`${candidate.name} joins the staff roster, unassigned. Base wage: ${candidate.wage} gp/day when assigned.`);render();save();return '';
  };
  window.passStaffCandidate=function(id){
    const candidate=ensureStaffCandidates().find(c=>c.id===id);
    if(!candidate||candidate.status!=='available')return false;
    if(!confirm(`Pass on ${candidate.name}? They will leave today's recruitment pool. Two new candidates arrive next game day.`))return false;
    candidate.status='passed';addLog('Staff candidate passed',`${candidate.name} leaves without being hired.`);render();save();return true;
  };
  staffDismiss=function(id){const st=game.staffMembers.find(s=>s.id===id);if(!st||!confirm(`Dismiss ${st.name}?${assigned(st)?` Their slot at ${staffLocation(st)} will become vacant.`:''}`))return;game.staffMembers=game.staffMembers.filter(s=>s!==st);addLog('Staff departure',`${st.name} leaves the guild staff.`);render();save()};
  renderStaffTab=function(){
    const staff=game.staffMembers||[],targets=staffTargets(),full=staff.length>=staffCap();
    document.getElementById('staff-cap-label').textContent=`${staff.length} / ${staffCap()} staff`;
    document.getElementById('staff-wage-summary').textContent=`Daily wages: ${staffWages()} gp · ${staff.filter(st=>!assigned(st)).length} unassigned`;
    document.getElementById('staff-profession').innerHTML=`<section aria-labelledby="staff-recruit-title"><h3 id="staff-recruit-title">Recruit staff</h3><p>Two candidates arrive each game day. Hire or pass on each; new hires are untrained and can learn any building skill through assignment. No hiring fee.</p><div class="staff-candidates">${ensureStaffCandidates().map((c,index)=>`<article class="staff-candidate"><h4>${esc(c.name)}</h4><p>${esc(c.race)} · ${c.wage} gp/day when assigned · no wage while unassigned</p>${WL_STAFF.profileHTML(c)}<details class="staff-fit-preview"><summary>Building compatibility</summary><p>Projected effects at current building levels, or Level 1 for buildings not yet built. New staff start at skill Level 0.</p>${Object.keys(skills).map(key=>`<p><strong>${esc(buildingDefs.find(b=>b.key===key)?.name||key)} · ${skills[key]} · ${c.aptitudes[WL_STAFF.jobs[key]]}/5 ${WL_STAFF.jobs[key]}</strong><br>${esc(WL_STAFF.describe(key,c,buildingLevel(key),null))}</p>`).join('')}</details>${c.status==='available'?`<div class="staff-candidate-actions"><button type="button" class="btn secondary" data-hire-candidate="${index}" ${full?'disabled':''}>Hire</button><button type="button" class="btn ghost" data-pass-candidate="${index}">Pass</button></div>`:`<span class="pill">${c.status==='hired'?'Hired':'Passed'}</span>`}</article>`).join('')}</div><p class="small muted">Next candidates arrive on Day ${game.day+1}. Hiring or passing does not refresh today's pool.</p>${full?`<p class="small muted">Staff limit reached (${staff.length}/${staffCap()}). Upgrade the Guild Hall to recruit more.</p>`:''}</section><div class="divider"></div><section aria-labelledby="staff-vacancies-title"><h3 id="staff-vacancies-title">Building vacancies</h3><p>Assign someone from your roster. Staff assigned elsewhere can move here without being hired again.</p>${targets.map((target,index)=>{
      const occupied=v9StaffOf(target.uid).length,free=Math.max(0,1-occupied),skill=skills[target.key];
      const candidates=staff.map((st,i)=>({st,i})).filter(({st})=>st.buildingUid!==target.uid).sort((a,b)=>Number(assigned(a.st))-Number(assigned(b.st)));
      return `<div class="building staff-vacancy"><div class="staff-vacancy-summary"><strong>${esc(target.uid==='warehouse'?'Warehouse':v9InstLabel(target))}</strong><div class="small muted">${occupied}/1 staff · ${free} available · Trains ${esc(skill)}</div></div>${free?`<div class="staff-vacancy-controls"><label>Existing staff<select data-vacancy-index="${index}" aria-label="Assign staff to ${esc(target.uid==='warehouse'?'Warehouse':v9InstLabel(target))}" ${!candidates.length?'disabled':''}><option value="">Select staff</option>${candidates.map(({st,i})=>`<option value="${i}">${esc(st.name)} · ${esc(staffLocation(st))} · ${esc(skill)} Lv ${staffSkillLevel(st.professionXP[skill]||0)} · ${st.aptitudes[WL_STAFF.jobs[target.key]]}/5 fit · ${st.wage} gp/day base</option>`).join('')}</select></label><button class="btn secondary" data-fill-vacancy="${index}" disabled>Assign staff</button>${!candidates.length?`<p class="small muted">${full?'No other staff available. Upgrade the Guild Hall to recruit more staff.':'Hire staff above to fill this vacancy.'}</p>`:''}</div>`:'<span class="pill">Fully staffed</span>'}</div>`;
    }).join('')||'<p class="small muted">Complete a building to create assignment slots.</p>'}</section>`;
    document.querySelectorAll('[data-hire-candidate]').forEach(el=>el.onclick=()=>hireStaff(game.staffCandidates[Number(el.dataset.hireCandidate)].id));
    document.querySelectorAll('[data-pass-candidate]').forEach(el=>el.onclick=()=>passStaffCandidate(game.staffCandidates[Number(el.dataset.passCandidate)].id));
    document.querySelectorAll('[data-vacancy-index]').forEach(select=>{const index=Number(select.dataset.vacancyIndex),button=document.querySelector(`[data-fill-vacancy="${index}"]`);select.onchange=()=>{button.disabled=select.value===''};button.onclick=()=>{const st=staff[Number(select.value)];if(select.value!==''&&st&&v9AssignStaff(st.id,targets[index].uid)){alert('That building has no available staff slot.');render()}}});
    document.getElementById('staff-roster').innerHTML=game.staffMembers.map((st,index)=>{
      const options=targets.filter(i=>i.uid===st.buildingUid||v9StaffOf(i.uid).length<1);
      const progress=Object.entries(skills).map(([key,skill])=>{
        const xp=Number(st.professionXP[skill])||0,level=staffSkillLevel(xp),toward=xp-thresholds[level],need=thresholds[level+1]-thresholds[level];
        return `<div class="building"><div><strong>${skill} · Level ${level}${st.buildingKey===key?' · Training here':''}</strong><div class="small muted">${level===10?`Mastered · ${xp} total practice`:`${toward}/${need} practice toward Level ${level+1} · ${xp} total`}</div>${skillBar(st,skill)}<p>${esc(WL_STAFF.describe(key,st,buildingLevel(key),key===st.buildingKey?st.buildingUid:null,level))}${level<10?`<br>Next: ${esc(WL_STAFF.describe(key,st,buildingLevel(key),key===st.buildingKey?st.buildingUid:null,level+1))}`:''}</p></div></div>`;
      }).join('');
      return `<details class="card staff-member" data-staff-card="${esc(st.id)}" ${expandedStaff.has(st.id)?'open':''}><summary><strong>${esc(st.name)}</strong><span class="small muted">${esc(staffLocation(st))}${st.buildingKey?` · ${esc(skills[st.buildingKey])} Lv ${staffSkillLevel(st.professionXP[skills[st.buildingKey]]||0)}`:''}</span></summary><div class="staff-member-body">${st.race?`<div class="small muted">${esc(st.race)}</div>`:''}<p>${staffPay(st)} gp/day current wage (${st.wage} gp/day base) · ${esc(staffLocation(st))} · Passive practice on paid workdays, plus at most 1 service award per skill per day. Next paid shift: ${st.buildingUid?WL_STAFF.passiveRate(st,v9L('staffOffice')>=2)/100:0} practice. Saved passive credit: ${st.passiveCredit}/100.</p>${st.buildingKey?skillBar(st,skills[st.buildingKey]):'<p class="small muted">Assign to a building to train a skill. Earned skills remain saved below.</p>'}${WL_STAFF.profileHTML(st)}${st.buildingKey?`<p class="staff-current-effect">${esc(WL_STAFF.describe(st.buildingKey,st,buildingLevel(st.buildingKey),st.buildingUid))}</p>`:''}<label>Assignment <select data-staff-index="${index}"><option value="">Unassigned</option>${options.map(i=>`<option value="${esc(i.uid)}" ${i.uid===st.buildingUid?'selected':''}>${esc(i.uid==='warehouse'?'Warehouse':v9InstLabel(i))} · ${v9StaffOf(i.uid).length}/1 staff · ${st.aptitudes[WL_STAFF.jobs[i.key]]}/5 ${WL_STAFF.jobs[i.key]}</option>`).join('')}</select></label><details><summary>Skills and next benefits</summary>${progress}</details><button class="btn ghost" data-dismiss-index="${index}">Dismiss</button></div></details>`;
    }).join('')||'<div class="empty">No staff hired yet. Recruit staff, then assign them to a building vacancy.</div>';
    document.querySelectorAll('[data-staff-card]').forEach(el=>el.ontoggle=()=>{if(el.open)expandedStaff.add(el.dataset.staffCard);else expandedStaff.delete(el.dataset.staffCard)});
    document.querySelectorAll('[data-staff-index]').forEach(el=>el.onchange=()=>{const st=game.staffMembers[Number(el.dataset.staffIndex)];if(!el.value){st.buildingUid=null;st.buildingKey=null;render();save()}else if(v9AssignStaff(st.id,el.value)){alert('That building has no available staff slot.');render()}});
    document.querySelectorAll('[data-dismiss-index]').forEach(el=>el.onclick=()=>staffDismiss(game.staffMembers[Number(el.dataset.dismissIndex)].id));
  };
  v9KitchenDay=function(){};
  const oldQuestReport=queueQuestReport;queueQuestReport=function(){const before=game.pendingReports.length;const result=oldQuestReport.apply(this,arguments);if(game.pendingReports.length>before&&buildingOperational('waystation'))practiceStaff('waystation');return result};
  const oldTreat=treatWound;treatWound=function(id){const ok=oldTreat(id);if(ok){practiceStaff('infirmary');save()}return ok};
  const oldTrainTick=v9TrainTick;v9TrainTick=function(h){const days=h.training?.days;oldTrainTick(h);if(h.training&&h.training.days<days)practiceStaff('trainingHall')};

  // Only exploration discoveries grant market routes, including the starting town.
  const oldRoutes=tradeDestinations;
  tradeDestinations=function(){const legacy=oldRoutes();return V9_WORLD.locations.filter(l=>['town','city'].includes(l.type)&&v9Known(l.id)).map(l=>({...legacy.find(d=>d.id===l.id),id:l.id,name:l.name,region:l.zone,dc:legacy.find(d=>d.id===l.id)?.dc||10+l.ring*2,rate:legacy.find(d=>d.id===l.id)?.rate||1+l.ring*.15,repRate:1+l.ring*.2,unlock:0,desc:l.flavour}))};
  staffMigrate(game);render();save();
})();
