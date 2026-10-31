# Repair and utility changes

Full-condition repair budgets before Armory and hero discounts:

| Tier | Armor/cape/rings or both hands | One hand |
| --- | --- | --- |
| Basic | 20 gp | 10 gp |
| Sturdy | 32 gp | 16 gp |
| Fine | 48 gp | 24 gp |
| Superior | 64 gp | 32 gp |
| Masterwork | 96 gp | 48 gp |
| Relic | 128 gp | 64 gp |
| Legendary | 160 gp | 80 gp |
| Heritage | 200 gp | 100 gp |

Repairs scale with the fraction of durability missing, with a minimum charge for damaged equipment. The final discounted, rounded quote is doubled, preserving exact 2× prices at partial-damage boundaries too. Armory and existing hero perks reduce the charge. Two-handed repairs use two rounded hand units, preserving parity with two equivalent one-handed repairs. Fully repaired items cost zero. Every repair charge is doubled from the prior schedule, including gathering tools. Tool durability behavior is unchanged. The existing repair quote and actual payment share the same function, so displayed fees agree with charges.

Ration, readiness potion and field-kit utility slots now reserve up to three actual uses from stock. Each expedition spends one use from the strongest useful item in each category; remaining charges stay equipped. Bonuses remain one ration plus one potion, at most +4 readiness, and one kit's protection. A multi-stage expedition still consumes only once at its start. Charges do not stack into stronger effects.

Unequipping or replacing returns every unused charge, including when the original stock entry was exhausted. Low stock loads one or two uses instead of inventing free charges. Existing equipped packs keep their remaining charges; re-equipping from sufficient stock loads up to three. Supplies carried by fallen heroes remain lost. Sale quantities continue to refer to stored, unreserved uses.

Inventory Consumables is now a native details section, closed by default. Existing headings and storage rendering retain the same element IDs.

Tests cover three successive departures in all three categories, stock reservations, partially stocked slots, returning unused charges, tier caps, one/two-handed parity, actual gold deductions, the consumables toggle and save/reload. Stage tests verify remaining charges stay unchanged through automatic continuation. Gear cost and offline lifecycle regressions pass.

## Three-use batch correction

Utility-slot capacity and recipe batch size are separate. Manual and automatic Kitchen production now create three-use ration batches, and Expedition Tonic now brews with three uses, matching Field Draughts and field kits. One batch still consumes its listed ingredients; the existing Kitchen limit counts batches, so it remains 30 ration batches rather than silently reducing capacity to ten. Recovery potions and permanent elixirs are not expedition utilities and retain their existing use counts.

A versioned one-time conversion upgrades legacy one-use ration and Tonic quantities to the new three-use batch convention, in storage and in carried utility slots. New batches and packs carry a version marker, so their partially consumed charges are never refilled by migration. Existing partly used Field Draughts and kits retain their exact remaining charges. Migration preserves IDs, effects, all other stock and queued reports, and cannot repeat on reload or save.

Inventory shows actual remaining uses with correct singular/plural wording, and explains that new batches have three uses. A partly used batch may correctly show one or two uses left. Tests cover manual/daily production, actual Tonic brewing, slot loading/consumption/returns, one-time legacy conversion, preservation of already-versioned partial rations and legacy partial Field Draughts/kits, displayed counts and reload.
