# Gear balance audit — 30 October 2026

Verdict: the implementation passes functional checks, but the economy and progression are not yet balanced enough to call finished. This audit did not change runtime balance rules. Previously implemented, undeployed gear changes remain in the workspace.

## Findings, in priority order

1. **The +6 flat-readiness cap compresses progression too early.** A full Basic loadout can reach it without quality bonuses: two hands +2, matching armor +1 and three matching-stat rings +3. The healer fixture reaches it through weapon, rings and cape. Higher tier flat stats and quality then have no marginal value on that check. Relic can be stronger in combat than Legendary when both are capped, because Relic retains an intrinsic effect. Higher durability still matters. Raising the cap alone would make many existing encounters trivial; the cap, low-tier quality and encounter curves need reviewing together.
2. **Effect overlap makes paid upgrades redundant.** In the complete Heritage stage-4 fixture, removing enhancements from any one individual slot did not change aggregate roll, precision, protection or set-XP totals. Other rings cover the weapon; cape and armor cover one another; shield protection is overridden by stronger body protection. Duplicate gear can provide backup after breakage, but does not add healthy upgrade progression. Give slot groups distinct purposes, or introduce controlled diminishing returns with clear UI caps.
3. **Two-handed crafting, enhancement and repair budgets are too cheap.** A Basic two-handed sword needs 2 Copper Ore, while two Basic one-handed swords need 4. The same ratio persists in each material-paid enhancement, because it reuses the recipe cost. Repairing 10 durability costs 10 gp on the two-hander versus 20 gp across two equivalent one-handed items without discounts. Equip prices already have equal hand budgets. Price materials/repairs per occupied hand, retaining family-specific ingredients. Heritage Ore is additionally required by swords but not other Heritage weapon families, making class costs uneven.
4. **Some quality milestones cannot be used.** Masterwork's +1 quality threshold is Blacksmithing 3, but its recipe unlocks at 5, after +2 is already available. Relic +1 at 5 is inaccessible until the recipe unlocks at 6 (+2). Sturdy/Fine/Superior also unlock with their +2 ceiling already reached. Heritage 8/9/10 and Legendary 7/8 work as intended. Align recipe unlocks with the intended quality milestones, or adjust the lower-tier quality ladder consistently.
5. **Material discounts are weakened by rounding and single-item crafting.** With average Craftsmanship 3/5, no trait, Blacksmithing 10 advertises 31.8% reduction. Basic swords still require 2 Copper Ore and Fine swords still need 3 Silver Ore, identical to skill 0. Masterwork ore drops 4→3 and Heritage ore 5→4. One-unit signature ingredients do not decrease. Batch-level discounts or saved fractional material credit would make small recipes benefit; avoid accidentally eliminating rare-material unlock requirements.
6. **The four-piece set bonus loses its purpose at the level cap.** +5% base combat XP is useful while levelling, but awards no further levels after Level 20. Much of the intended Heritage audience is already at that cap. Give the full set a modest endgame utility effect, with XP retained as a levelling benefit if desired. Keep the two-piece protection, tier matching and duplicate-group safeguards.

## What is working

- Base hand bonuses and offensive proc budgets match between two matching one-handed weapons and one equivalent two-handed weapon.
- Equip prices match the combined hand budget.
- New Workshop enhancements improve effects without modifying flat stats, durability, tier or set membership.
- Protection does not remove mandatory natural-1 wounds, existing-wound worsening or direct death checks.
- Tier effects and effect enhancement percentages rise monotonically when compared in isolation.
- Set pieces must share a tier; duplicate rings and both hands do not inflate distinct groups.
- Broken gear disables contributions; existing gear snapshots and save migrations are retained.

## Simulation method

The reproducible browser audit is `scripts/audit-gear-browser.py`; full results are `GEAR_BALANCE_AUDIT.json`. It ran **140 cases × 1,500 trials = 210,000 simulated expedition attempts** with seed 20261030. It uses the actual group encounter resolver, role quotas, stage sequencing, critical bumps, stat/gear caps and equipment effect probabilities. Readiness and perk-free gear preparation are cached per fixed loadout; cached preparation is checked against the live implementation with identical RNG state.

The 8/20/32-hero fixtures use legal Warrior Protection tanks, Priest Holy healers and Warrior Arms damage dealers. They are not an exhaustive simulation of all class/spec/perk compositions. Full sets use seven equipped items, with no crafting-quality proc; the flat cap is nevertheless reached. No wound, death or gear-wear attrition is simulated between stages, so real full-run survival can be lower. Skill/party perks are absent from the first three preparation scenarios. Trials are approximate; near 50% results, 95% sampling uncertainty is about ±2.5 percentage points per case. A zero is zero observed clears in 1,500 attempts, not proof of impossibility.

“High support” uses primary attributes 20, +4 readiness provisions, +6 staff support and the normal +1 rank bonus. “Optimized sensitivity” additionally assumes +3 combat modifier from a possible perk/bond budget and −2 DC; it illustrates sensitivity, rather than proving a particular hero build provides those bonuses.

| Scenario | Expedition | Basic gear clear rate | Heritage stage-4 clear rate |
| --- | --- | ---: | ---: |
| high support | Renown World Dungeon | 44.9% | 54.5% |
| high support | default World Boss | 83.3% | 86.6% |
| high support | Renown World Boss | 5.1% | 8.5% |
| high support | default World Raid | 84.1% | 88.1% |
| high support | Renown World Raid | 0.0% | 0.0% |
| optimized sensitivity | Renown World Dungeon | 80.5% | 80.6% |
| optimized sensitivity | Renown World Raid | 36.4% | 48.2% |

The default World Boss fixture is rank C (Twilight Grove); the default World Raid is SS (Naxxramas). Renown cases deliberately select rank 9. The fixed Renown dungeon is Well of Eternity. These are full-run probabilities, not single-stage rates.

The results show a preparation cliff: optimized support/perks can change a Renown raid from effectively no observed full clears to a substantial success rate, while all gear tiers share the same flat readiness. Do not lower all encounter DCs just to compensate for this. First fix progression and overlapping effects, then rerun the same seeded audit before tuning encounter difficulty.

## Recommended order

1. Resolve flat-cap and low-tier-quality interaction, preserving the intended paired tiers.
2. Give armor, cape, ring and hand upgrades distinct useful roles; preserve the shared dual/two-hand budget.
3. Align crafting/repair material budgets and Blacksmithing unlock/quality thresholds.
4. Make small-recipe discounts and max-level four-piece sets meaningful.
5. Re-run encounter simulations and then tune staged endgame difficulty and reward-to-cost ratios.

No publication or deployment was performed by this audit.
