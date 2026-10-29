/* One signature weapon pattern per specialization. Stats use this game's main attributes. */
(() => {
 const rows=[
 ['Death Knight','Blood','greatsword','Bloodforged Runeblade','none'],
 ['Death Knight','Frost','sword','Frostbound Runeblade','dual'],
 ['Death Knight','Unholy','greatsword','Plagueforged Greatblade','none'],
 ['Demon Hunter','Havoc','warglaive','Chaos Warglaive','dual'],
 ['Demon Hunter','Vengeance','warglaive','Soulguard Warglaive','dual'],
 ['Demon Hunter','Devourer','warglaive','Voidbound Warglaive','dual'],
 ['Druid','Balance','staff','Moonwarden Staff','none'],
 ['Druid','Feral','polearm','Wildfang Spear','none'],
 ['Druid','Guardian','polearm','Bearwarden Polearm','none'],
 ['Druid','Restoration','staff','Lifebloom Staff','none'],
 ['Evoker','Augmentation','staff','Earthwarder Staff','none'],
 ['Evoker','Devastation','staff','Dragonfire Staff','none'],
 ['Evoker','Preservation','staff','Dreamkeeper Staff','none'],
 ['Hunter','Beast Mastery','gun','Beastwarden Rifle','none'],
 ['Hunter','Marksmanship','bow','Farstrider Longbow','none'],
 ['Hunter','Survival','polearm','Wildstalker Spear','none'],
 ['Mage','Arcane','staff','Leyweaver Staff','none'],
 ['Mage','Fire','sword','Flameweaver Spellblade','focus'],
 ['Mage','Frost','staff','Winterweaver Staff','none'],
 ['Monk','Brewmaster','staff','Brewguard Staff','none'],
 ['Monk','Mistweaver','staff','Jade Mist Staff','none'],
 ['Monk','Windwalker','fist','Windwalker Knuckles','dual'],
 ['Paladin','Holy','mace','Dawnmender Hammer','shield'],
 ['Paladin','Protection','sword','Oathkeeper Sword','shield'],
 ['Paladin','Retribution','greatsword','Dawnbringer Greatsword','none'],
 ['Priest','Discipline','staff','Atonement Staff','none'],
 ['Priest','Holy','staff','Benediction Staff','none'],
 ['Priest','Shadow','dagger','Voidwhisper Dagger','focus'],
 ['Rogue','Assassination','dagger','Venomfang Dagger','dual'],
 ['Rogue','Outlaw','sword','Dread Corsair Cutlass','dual'],
 ['Rogue','Subtlety','dagger','Nightveil Dagger','dual'],
 ['Shaman','Elemental','fist','Stormcaller Fist','shield'],
 ['Shaman','Enhancement','mace','Stormforged Hammer','dual'],
 ['Shaman','Restoration','mace','Tidemender Mace','shield'],
 ['Warlock','Affliction','staff','Soulreaper Staff','none'],
 ['Warlock','Demonology','dagger','Felbinder Dagger','focus'],
 ['Warlock','Destruction','staff','Chaosfire Staff','none'],
 ['Warrior','Arms','greatsword','Warbreaker Greatsword','none'],
 ['Warrior','Fury','greatsword','Berserker Greatsword','dual'],
 ['Warrior','Protection','sword','Vanguard Sword','shield']
 ];
 const two=['greatsword','bow','crossbow','gun','polearm','staff'];
 const all=rows.map(([className,spec,family,name,offhand])=>({key:(className+'-'+spec).toLowerCase().replace(/[^a-z0-9]+/g,'-'),className,spec,family,name,offhand,stat:SPEC_STATS[className][spec][0].toUpperCase(),hands:offhand==='dual'?1:two.includes(family)?2:1}));
 window.WL_SPEC_WEAPONS=Object.freeze({all,forHero:h=>all.find(p=>p.className===h.className&&p.spec===h.spec),byKey:key=>all.find(p=>p.key===key)});
})();
