# Guild gathering expertise

Mining, Fishing, Herbalism, Skinning, Woodcutting, Tailoring, Jewelcrafting and Hunting each have independent saved Level 1–10 expertise. These are guild-wide professions, not individual hero or staff skills.

Each level above 1 adds 5% main material yield, reaching 45% at Level 10. Existing outcome/rank and party-size calculations happen first, then expertise multiplies the resulting main yield, rounded down. Small hauls may need several levels before gaining a whole extra unit. Expertise does not modify resource unlocks, rare-material chances, DC or tool effectiveness. Food byproducts that already derive from main yield naturally follow their existing calculation.

Cumulative thresholds for Levels 1–10 are 0, 5, 15, 30, 50, 75, 105, 140, 180 and 225 practice. Practice carries forward, is retained above the cap and is never spent. The interface shows current benefit, total practice, a progress bar and the next benefit.

Successful gathering returns award 1 + floor(rank index / 3) practice: 1 at F/E/D, 2 at C/B/A, 3 at S/SS/Legendary and 4 at Renown. Exceptional success doubles practice. Partial success and failure award none. Party size does not multiply practice, preventing rapid expertise inflation; its yield bonus remains. Return processing awards points once; dispatching, rendering and reloading do not. Report text explains awarded guild practice.

Yields are sealed using expertise at dispatch, matching the existing saved-report behavior. Another party's later level-up cannot retroactively change cargo already rolled.

Existing profession points are backed up in legacyGatheringXP. Migration retains at least the old displayed level (capped at 10) and all existing numeric practice, raising it only when necessary to preserve that level under the new curve. Saves without progress start at Level 1. Migration is versioned and runs once.

Tests exercise every level threshold and just below it, bonus/cap and party scaling, independent professions, actual returned practice, no award at dispatch, carryover, exceptional/partial/failure outcomes, repeat processing, legacy migration, all eight trackers and save/reload. Stage and offline lifecycle regression checks also run. No existing hero, staff, building or crafting data is deleted.
