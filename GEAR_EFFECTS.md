# Equipment effects and matching-tier sets

Basic/Fine/Masterwork/Legendary retain their flat bonuses. Sturdy/Superior/Relic/Heritage add one gear-appropriate effect. Existing crafted gear qualifies by its current tier; upgrading a Workshop still does not recraft or improve an owned item's stats.

| Effect | Sturdy | Superior | Relic | Heritage |
| --- | --- | --- | --- | --- |
| Precision: chance to enable natural 19–20 criticals for the combat stage | 10% | 15% | 20% | 25% |
| Penetration/Spellcraft: chance of +1 on the owner's combat check | 10% | 15% | 20% | 25% |
| Protection: relative reduction of ordinary wound chance | 2% | 4% | 6% | 8% |

The offensive chances above describe a two-handed weapon. Each one-handed weapon/focus receives half the chance; two matching one-handed effects sum to the full chance. Shields receive half the protection value. Agile weapons use Precision; other physical weapons use Penetration; caster weapons/focuses use Spellcraft. Armor and capes use Protection. Rings use an offensive effect based on their stat. Overlapping effects now contribute with diminishing returns. The strongest source applies in full; each additional source contributes 25% of its chance against the remaining headroom. Offensive headroom is 45% per effect type; ordinary-wound protection headroom is 35% before the separate set bonus. Both hands combine into one source, preserving dual-wield/two-handed parity. Every other item contributes separately, including additional rings. Protection combines multiplicatively with set protection and existing provisions.

For example, a 25% Heritage weapon effect plus one matching 25% ring becomes 26.25%, rather than remaining at 25%. Three such rings produce about 28.52%. Two 8% Protection pieces produce 8.54% before the set bonus. This keeps extra pieces useful without adding their chances directly. The equipment panel explains the rule. Existing perk critical ranges do not stack into a wider critical range.

Each tier forms an Expedition Set. A durable, equipped crafted item contributes one distinct group: armor, cape, ring, or hands. Both hands together count as one group; extra rings do not count again. Tools and consumables are excluded. Tiers cannot mix to complete a set.

- Two groups: 5% less ordinary wound chance.
- Four groups: retain the two-piece protection and gain 5% more base combat quest XP.
- Only one set activates: most groups first, highest tier as tiebreaker.
- Broken or unequipped gear immediately stops contributing.
- Protection does not prevent mandatory natural-1 wounds, existing-wound worsening, or direct death checks.

These are conditional effects, separate from permanent hero attributes and the loadout-based +6 to +9 gear-readiness cap. Enhancements improve the primary effect at stages 1–2, add a secondary at stage 3, and strengthen it at stage 4; they add no flat stats or durability. Workshop upgrades unlock material-paid enhancements instead of adding automatic crafting stats; Blacksmithing grants tier-specific quality bonuses and durability. The crafting preview, crafted-item result, inventory repair list, and hero equipment panel describe the effects and set progress.

## Balance review — change 2

The regression test equips a full Heritage loadout at enhancement stage 4 and removes each item's enhancements separately. Every tested weapon, armor, cape and ring now changes at least one aggregate effect. Tests also verify bounded chances, slot-order independence, hand budgets, broken pieces, save/reload and combat integration. This addresses overlapping effects only; material costs, quality unlocks, discount rounding and max-level set utility remain separate review items. Historical audit JSON files retain the previous stacking rules and are not new encounter forecasts.
