# Balance step 1: tier-based flat-readiness cap

The first audit finding is addressed without changing effects, crafting costs, smith unlocks, XP/set rules or encounter DCs. Previously every loadout was capped at +6. Full equipped loadouts now have these caps:

| Tiers | Cap |
| --- | --- |
| Basic / Sturdy | +6 |
| Fine / Superior | +7 |
| Masterwork / Relic | +8 |
| Legendary / Heritage | +9 |

These are ceilings, not free readiness. Only actual matching-stat bonuses count toward a check. Quality increases an item's bonus but cannot raise the loadout cap. Workshop enhancements remain special effects only.

Each item's tier grade is floor(tierIndex / 2), giving 0/1/2/3. Hands, armor, cape and rings share four equal groups. Two-handed weapons fill the hand group; a main hand and offhand are averaged. All three rings share one group, so their grades are averaged, counting missing rings as zero. The cap is 6 + floor(sum of the four group grades / 4), at most 9. Missing, broken, incompatible and duplicate item references contribute zero. Utilities/tools do not contribute. Group grade uses equipped tiers independently of stat, so off-stat armor/capes still represent investment in the overall loadout, while their flat stat bonus only applies to the appropriate checks.

Examples: all Fine pieces reach cap +7. One Heritage weapon with otherwise Basic equipment remains capped at +6. Full Legendary/Heritage reaches +9. Breaking a group can lower the cap, and repairing restores it. No item, staff skill, currency or saved progress is rewritten by this derived cap.

## Comparison using the same audit

Both saved audits use seed 20261030 and 140 cases × 1,500 attempts. Results below are Renown full-run clear rates; normal sampling differences of a few percentage points are expected. As in the original audit, stages are evaluated with fixed loadouts and no wounds, deaths or durability attrition, so the numbers are optimistic for actual survival. The optimized sensitivity scenario assumes extra perk/bond bonuses; it is not proof that every class composition supplies them.

| Scenario | Expedition / gear | Before | After |
| --- | --- | ---: | ---: |
| high support | World Dungeon / Basic | 44.9% | 46.2% |
| high support | World Dungeon / Heritage enhanced | 54.5% | 82.5% |
| high support | World Boss / Heritage enhanced | 8.5% | 50.3% |
| high support | World Raid / Heritage enhanced | 0.0% | 4.0% |
| optimized sensitivity | World Raid / Heritage enhanced | 48.2% | 89.8% |

This gives higher-tier gear a real flat-stat advantage without allowing quality-boosted Basic gear to raise its own cap. Optimized endgame raid clear rates increase substantially; endgame encounter tuning remains pending after the remaining gear fixes. This step is not a declaration that the whole game is balanced.

## Validation

`tests/gear-cap-browser.py` checks all 40 specs × 8 tiers, actual readiness, quality cannot bypass the Basic cap, single-piece shortcuts, missing/broken/mixed/duplicate gear, dual/two-hand parity, utilities, UI and save/reload. Existing enhancement, effect/set, staged expedition and offline browser checks also pass. Runtime descriptions and the hero equipment panel display the new cap and tier progress.

The historical baseline remains `GEAR_BALANCE_AUDIT.json`; new results are `GEAR_BALANCE_CAP_AUDIT.json`. Reproduce the latter with `python3 scripts/audit-gear-browser.py --output GEAR_BALANCE_CAP_AUDIT.json`.

Next audit issue: overlapping special effects that make some paid upgrades redundant. Nothing has been deployed.
