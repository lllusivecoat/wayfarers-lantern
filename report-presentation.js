/* Named encounters and accessible, structured full-report emphasis. */
(() => {
 const oldRooms=['Flooded gallery','Warded vault','Guardian hall'];
 const vaultBosses=['Gorath the Drowned','Selvara the Runeweaver','Korvash, Vault Sentinel'];
 // Deepdelve is an original dungeon; these are its own named guardians.
 V9_LOC['deepdelve-vault'].world.encounters.forEach((e,i)=>e.name=vaultBosses[i]);
 function bosses(r){const run=r.stagePlan;let names=r.dailyBossNames?.length?r.dailyBossNames:r.bossName?[r.bossName]:run?.encounters?(Number.isInteger(r.stageIndex)?[run.encounters[r.stageIndex]?.name]:run.encounters.map(e=>e.name)):[];
 return names.filter(Boolean).map(n=>oldRooms.includes(n)?vaultBosses[oldRooms.indexOf(n)]:n)}
 const style=document.createElement('style');style.textContent='.report-component{margin:24px 0;padding:18px 0;border-top:1px solid var(--line)}.report-component h3{margin:0 0 14px;font-size:1rem;color:var(--gold2)}.report-component summary{cursor:pointer;min-height:44px;color:var(--gold2);font-weight:600}.report-component p{margin:14px 0;line-height:1.8}.report-component>p:last-child{margin-bottom:0}.report-fight{margin:20px 0;padding:16px;border:1px solid var(--line);border-radius:10px;line-height:1.65}.report-fight h3{margin:0 0 12px}.report-discovery{color:#88e2b1;font-weight:600}.report-traits,.report-discovery{display:block;margin:18px 0;line-height:1.7}.report-member-gold{display:block;margin:18px 0!important;color:#f2ce78;margin:14px 0;line-height:1.7}.report-loot{color:#f2ce78;font-weight:600}.report-xp{display:block;margin:18px 0!important;color:#86d5f5;font-weight:600}.report-wound{color:#ff9393;font-weight:600}#report-detail-text{line-height:1.7;overflow-wrap:anywhere}#report-detail-text .report-fight p{margin:12px 0}';document.head.append(style);
 function span(cls,text){const s=document.createElement(cls==='report-xp'?'p':'span');s.className=cls;s.textContent=text;return s}
 const show=showReportDetails;showReportDetails=function(r){const out=show.apply(this,arguments),root=document.getElementById('report-detail-text');if(!root)return out;
 const isVault=/Deepdelve Vault/.test(r.title||'')||r.stagePlan?.quest?.locationId==='deepdelve-vault';
 if(isVault){for(let i=0;i<oldRooms.length;i++)root.textContent=root.textContent.split(oldRooms[i]).join(vaultBosses[i]);const title=document.getElementById('report-detail-title');for(let i=0;i<oldRooms.length;i++)title.textContent=title.textContent.split(oldRooms[i]).join(vaultBosses[i])}
 // Split report components before adding emphasis; saved report text stays unchanged.
 const labels=/(Level progress earned:|Advancement earned:|Member gold earned:|Supplies used:|Perk effects:|Traits, bonds & wounds:|Discovery:|Bonus find secured:|Crafting materials secured:|Outcome:|The guild receives|The guild earns|Roles:|Guild-funded expedition:)/g;
 const paragraphs=root.textContent.replace(labels,'\n$1').split(/\n+/).map(t=>t.trim()).filter(Boolean);
 root.replaceChildren(...paragraphs.map(text=>{const p=document.createElement('p');p.textContent=text;return p}));
 const names=bosses(r);if(names.length){const section=document.createElement('section');section.className='report-fight';const heading=document.createElement('h3');heading.textContent='Boss encounter';section.append(heading);
 for(const name of names){const bossResult=r.dailyBossResults?.find(e=>e.name===name),outcome=bossResult?['Failure','Partial Success','Success','Exceptional Success'][bossResult.tier]:r.outcome;const p=document.createElement('p');p.append(span('boss-name',name),document.createTextNode(' — '+({ 'Exceptional Success':'The party broke through the boss’s defenses with coordinated attacks and secured a decisive victory.',Success:'The party held its formation through the boss’s assault and defeated the guardian.', 'Partial Success':'The party made headway, but could not overcome the boss. The expedition withdrew before clearing this stage.',Failure:'The boss broke the party’s offensive. The survivors withdrew without clearing this stage.'}[outcome]||'The encounter ended with the recorded outcome.')));section.append(p)}root.prepend(section)}
 // Highlight recorded text using DOM nodes, never interpolate report data as HTML.
 const woundedIds=new Set(Object.keys(r.wounds||{}));for(const id of r.partyIds||[]){const name=purse(id)?.name;if(name&&(r.tbwNotes||[]).some(n=>n.includes(name)&&/wound/i.test(n)))woundedIds.add(id)}const woundNames=[...woundedIds].map(id=>purse(id)?.name).filter(Boolean);
 const esc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const parts=['(?:Level progress earned|Advancement earned):[^.]*\\.','(?:Bonus find secured|Crafting materials secured):[^.]*\\.','\\b(?:Light|Serious|Grievous) wound(?: worsens)?',...woundNames.map(esc)];
 const re=new RegExp(parts.join('|'),'g'),walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())if(!walker.currentNode.parentElement.closest('.report-fight'))nodes.push(walker.currentNode);
 for(const node of nodes){const text=node.textContent;let pos=0,match,fragment=document.createDocumentFragment(),changed=false;re.lastIndex=0;while((match=re.exec(text))){fragment.append(text.slice(pos,match.index));const value=match[0],cls=/^(Level progress|Advancement)/.test(value)?'report-xp':/^(Bonus find|Crafting materials)/.test(value)?'report-loot':'report-wound';fragment.append(span(cls,value));pos=match.index+value.length;changed=true}if(changed){fragment.append(text.slice(pos));node.replaceWith(fragment)}}
 for(const xp of root.querySelectorAll('p.report-xp')){const parent=xp.parentElement;if(parent!==root&&parent.tagName==='P'&&parent.textContent===xp.textContent)parent.replaceWith(xp)}
 // Use sealed individual awards, never recompute old payments with new rates.
 const ids=[...new Set([...(r.partyIds||[]),...(r.memberAwards||[]).map(a=>a.id)])];
 if(ids.length){let text;const recorded=Array.isArray(r.memberAwards),zero=r.memberCut===0||r.questPersistent||r.questKind==='Gathering';
  if(recorded||zero){text='Member gold earned: '+ids.map(id=>{const award=(r.memberAwards||[]).find(a=>a.id===id),name=award?.name||purse(id)?.name||(r.rolls||[]).find(c=>c.id===id)?.name||'Member',fallen=(r.casualties||[]).includes(id),amount=fallen?0:Math.max(0,Number(award?.amount)||0);return `${name} +${amount} gp${fallen?' (fallen; no payment received)':''}`}).join(', ')+'.'}
  else if(Number(r.memberCut)>0)text='Member gold earned: individual payments were not recorded in this older report.';
  if(text){const p=document.createElement('p');p.className='report-member-gold';p.textContent=text;const xp=root.querySelector('.report-xp');if(xp)xp.after(p);else root.append(p)}
 }
 // Explicit injury line keeps the injured name and severity together in red.
 for(const [id,w] of Object.entries(r.wounds||{})){const p=document.createElement('p');p.className='report-wound';p.textContent=`${purse(id)?.name||'Hero'} — ${WOUND_TIERS[w.tier]?.name||'Unknown'} wound${w.worsened?' (worsened)':''}.`;root.append(p)}
 // Give each component its own labelled block. Long lists can be folded away.
 for(const node of [...root.children]){
  if(node.classList.contains('report-fight'))continue;
  const text=node.textContent.trim();if(!text){node.remove();continue}
  let title='Expedition summary',cls='';
  if(/^(Level progress|Advancement)/.test(text)){title='Hero XP';cls='report-xp'}
  else if(/^Member gold/.test(text)){title='Member gold';cls='report-member-gold'}
  else if(/^(Bonus find|Crafting materials)/.test(text)){title='Loot gained';cls='report-loot'}
  else if(/^Discovery:/.test(text)){title='Discoveries';cls='report-discovery'}
  else if(/^Traits, bonds/.test(text)){title='Traits, bonds & wounds';cls='report-traits'}
  else if(/^Supplies used:/.test(text))title='Supplies used';
  else if(/^Perk effects:/.test(text))title='Perk effects';
  else if(/^(The guild|Guild-funded)/.test(text))title='Guild rewards & costs';
  else if(/^Outcome:/.test(text))title='Outcome';
  else if(/^Roles:|: d20 /.test(text))title='Party checks';
  else if(node.classList.contains('report-wound'))title='Wounds';
  const collapse=text.length>420||title==='Party checks';
  const block=document.createElement(collapse?'details':'section');block.className='report-component';
  const heading=document.createElement(collapse?'summary':'h3');heading.textContent=title;block.append(heading);node.before(block);block.append(node);
  if(cls)node.classList.add(cls);
 }
 return out};
 window.WL_REPORT_PRESENTATION=Object.freeze({bosses});
})();
