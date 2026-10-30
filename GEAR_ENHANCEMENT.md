# Workshop enhancement and Blacksmithing replacement

Workshop levels unlock four material-paid effect stages:

| Workshop | Paid stage | Change |
| --- | --- | --- |
| 1 | 0 | Only the tier's intrinsic effect, if any |
| 2 | 1 | Unlock first effect on a flat tier, or improve an existing effect |
| 3 | 2 | Strengthen that first effect further |
| 4 | 3 | Add a different second effect at a low percentage |
| 5 | 4 | Strengthen the second effect |

Enhancements do not add flat stats, durability, or repair an item. New crafted gear starts at stage 0 regardless of Workshop level. Tier, quality and set membership remain unchanged. Costs are the current smith-discounted crafting ingredients multiplied by the target stage number (1/2/3/4). No gold fee. Owned gear cannot be enhanced while its hero is away. A staffed operational Workshop and the recipe's smith skill requirement are necessary.

An existing crafted item retains its stored flat stats, durability and damage. Historical Workshop bonuses are retained as legacy stats and credited effect stages, once only. The Workshop does not automatically improve owned gear when upgraded.

## Staff scaling

- Material reduction: 3% per Blacksmithing level, adjusted by aptitude/traits, hard cap 45%. No separate Workshop-level material discount.
- Durability: +2 per Blacksmithing level; Industrious adds its existing +5.
- Quality chance: existing skill/aptitude/trait formula, capped at 40%.
- Stat-quality maximum depends on tier:

| Tier | Recipe unlock | +1 quality starts | +2 quality starts |
| --- | --- | --- | --- |
| Basic | 0 | 1 | 2 |
| Sturdy | 2 | 2 | 3 |
| Fine | 3 | 3 | 4 |
| Superior | 4 | 4 | 5 |
| Masterwork | 5 | 5 | 6 |
| Relic | 6 | 6 | 7 |
| Legendary | 7 | 7 | 8 |
| Heritage | 8 | 9 | 10 |

Recipe unlock requirements remain unchanged. The +1 milestone is never earlier than the recipe unlock, so every tier has an attainable +1 stage before +2. Basic remains available at skill 0; Heritage still gains stat quality only at 9/10. These are possible quality bonuses, not guaranteed additions. A quality proc before stat-quality eligibility gives +5 durability instead.

## Effect strengths and caps

The combined flat gear-readiness cap ranges from +6 to +9 by equipped tier grades; see GEAR_CAP_BALANCE.md. Sets remain independent. For a full-budget two-handed weapon, the first enhancement adds 5–8 percentage points to the primary effect, depending on tier; the second doubles that increase. Protection instead adds 1–1.6 points, doubled at stage 2. Stage 3 introduces a secondary effect at 5–8%; stage 4 doubles it. One-handed weapons and offhands receive half these values; dual copies combine to the equivalent two-handed budget.

Penetration/Spellcraft gains Precision as a second effect. Precision gains Penetration. Protective gear gains Resolve (+1 combat-check proc). Each offensive effect type caps at a 45% chance, using the same strongest-effect/nonstacking rules. The primary effect of an even tier starts at zero; odd tiers retain and improve their intrinsic effect.

## Example: Heritage one-handed sword

A neutral Blacksmithing 10 smith gives 20 extra durability and a 30% chance to craft +2 quality. The sword has +4 flat readiness, or +6 after that successful quality proc, and 80 durability. These stay unchanged across the four effect upgrades.

| Paid stage | Penetration chance | Precision chance |
| --- | --- | --- |
| 0 | 12.5% | — |
| 1 | 16.5% | — |
| 2 | 20.5% | — |
| 3 | 20.5% | 4% |
| 4 | 20.5% | 8% |

Penetration procs grant +1 on the owner's combat check. Precision procs enable natural 19–20 criticals for that stage; they are not an 8% direct critical chance. Natural-1 wound protection and direct death rules remain unchanged.

## Balance review — fix 4

Crafting quality and enhancement eligibility use the shared tier progression helper. The preview shows both quality milestones. Existing crafted items are not recalculated, including items with +2 quality earned under the earlier rules. All 88 tier/skill combinations (eight tiers, skills 0–10) are tested against actual crafting with forced quality rolls, locked recipes, UI text and save/reload. This fix changes quality eligibility only; discounts and maximum-level set benefits remain separate review items.
