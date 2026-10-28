# Current encounter balance and party requirements

This release implements the party requirements, supply system and encounter
balance described below.

## Required parties

| Encounter | Party size | Minimum tanks | Minimum healers | Suggested DPS | Successful checks per phase (tank / healer / DPS) |
| --- | ---: | ---: | ---: | ---: | --- |
| Daily Boss contract | 12 | 2 | 2 | 8 | 2 / 2 / 6 |
| Discovered World Boss | 20 | 2 | 4 | 14 | 2 / 3 / 10 |
| World Raid | 32 | 5 | 10 | 17 | 4 / 7 / 12 |

The full party size and tank/healer minimums are mandatory at dispatch, including
confirmed dispatches. Extra tanks/healers may replace suggested DPS as long as
at least 6/10/12 DPS remain, respectively, so the encounter's fixed success target
is possible. The picker, role panel, costs, button state and dispatch validation
use the same profile. A missing role cannot be bypassed by a confirmation.

Assigned role minimums and successful roll targets are distinct: each phase
requires two-thirds of each reference role group to pass, rounded up. Success
targets do not increase when extra tanks/healers are selected. Critical bumps
and phase averaging retain their existing rules. Healer wound protection still
caps at 30%; ten healers do not grant ten independent damage reductions.
World Dungeons remain balanced for eight heroes and ordinary Raid contracts for
20, retaining their existing reduced-party warnings and role rules.

## Difficulty curves

Quest cards, details and actual rolls use one shared adjusted DC function.
Base special-quest formulas and the existing high-rank additions remain, with
these extra adjustments (not extra bonuses per hero):

| Rank | Daily Boss | World Boss / ordinary Raid | Early World Raid | Later World Raid |
| --- | ---: | ---: | ---: | ---: |
| F–A | 0 | 0 | 0 | 0 |
| S | +1 | +1 | +1 | +1 |
| SS | +1 | +1 | +1 | +2 |
| Legendary | +1 | +2 | +2 | +3 |
| Renown | +1 | +2 | +2 | +3 |

Early world raids are Zul'Gurub and Onyxia; later raids are Molten Core, AQ and
Naxxramas. At SS and above, Naxxramas' final phase adds another +1 encounter DC.
World Dungeon base difficulty is now
`12 + 2*rank - floor(rank/4) + floor(location.ring/2)`:
one fewer DC at B, and a second at Legendary. Early dungeons become reliable
farming while the hardest locations remain challenging at maximum preparation.
Gathering, exploration and ordinary contracts keep their current DC curves.

## Funding, rewards and building effects

Daily Boss/Raid contracts retain client payment. Discovered world expeditions
remain guild-funded. A Renown 32-hero World Raid costs 66 gp before building
support. A staffed Command Post L4+ reduces this to 59 gp (10%, rounded down).
A staffed Hunter's Lodge L4+ similarly discounts World Boss organizing costs;
its existing +10% daily Boss contract payout is retained. These world-only fee
discounts replace descriptions of payout bonuses that did nothing on zero-pay
world expeditions. Staff loot/DC effects, caps and other building upgrades stay.

World Raid Campaign Spoils base quantities rise from 2–4 to 4–7, scaling by
32/20 and rounding up. The existing drop chance and outcome multipliers remain.
The larger required force therefore receives more materials, without restoring
client gold to world missions. Recipe crafting materials and other quest loot
retain their normal rules.

## Simulation method and results

Run `python3 scripts/analyze-endgame.py --world-review --kit-protection 20` against
a local static server on port 8000. Output: `/tmp/world-scaling-current.json`.
The script uses the actual game role, perk, trait, staff and encounter code in a
disposable browser. It uses each profile's requested tank/healer count and fills
the remaining slots with DPS. Each row is 4,000 seeded trials at Renown.

Heroes are level 20, with maximum relevant +6 gear contributions, +4 combined
ration/potion readiness, maximum field kits, one permanent main-stat point,
strong legal example perk builds, positive traits, bonds and maximum staff and
buildings. Cooldowns reset between independent trials; recent-quest conditions
are reset. These are prepared top-party examples, not expected rates for every
player or a progression study at every rank. Ordinary builds, repeated trips,
pre-existing wounds and economic efficiency require additional playtesting.
Partial Success is excluded from full success. Sampling uncertainty is up to
roughly ±1.6 percentage points near 50%.

| Encounter | Party | Full success |
| --- | ---: | ---: |
| Dungeon: The Sunken Reliquary | 5 | 90.90% |
| World Dungeon: Blackrock Depths | 8 | 74.05% |
| World Dungeon: Stratholme | 8 | 74.05% |
| World Dungeon: The Deadmines | 8 | 86.10% |
| World Dungeon: The Sunken Temple | 8 | 84.93% |
| World Dungeon: Zul’Farrak | 8 | 86.10% |
| World Dungeon: The Deepdelve Vault | 8 | 93.78% |
| Raid: Siege of the Blackwater Hold | 20 | 78.13% |
| Boss: The Thornmaw Colossus | 12 | 81.65% |
| World Boss: Emeriss of the Grove | 20 | 83.20% |
| World Boss: Lord Kazzak | 20 | 84.98% |
| World Boss: Azuregos | 20 | 83.20% |
| World Raid: Zul’Gurub | 32 | 95.10% |
| World Raid: Onyxia’s Lair | 32 | 95.10% |
| World Raid: Molten Core | 32 | 77.10% |
| World Raid: Temple of Ahn’Qiraj | 32 | 74.60% |
| World Raid: Naxxramas | 32 | 69.35% |

The hardest World Dungeons are about 74%; the daily Boss is about 82%; World
Bosses are 83–85%. Earlier world raids become reliable farming at about 95%,
Molten Core/AQ sit at about 75–77%, and Naxxramas is about 69%. Protective perks
being ready on every healthy party is optimistic; no sampled deaths does not
imply that real campaigns have no casualties. Field kits do not add readiness.

## Save compatibility and validation

Only future offers use the new party sizes. Old board offers are normalized for
display/dispatch without replacing staff, heroes, gear or progress. Already sealed
reports retain stored rolls, party IDs, fees, payouts and loot; they are neither
rerolled nor resized. Legacy unrolled story sessions retain their old quotas,
party sizes, phase difficulty and organizing-fee exemption. Current reports save
the explicit requirements, challenge DC and difficulty adjustments for review.

Browser checks cover exact party counts, missing tanks/healers, oversized
parties, confirmation bypasses, validation before costs/supplies, all new success
targets, 32-person selection, payment/fee discounts, scaled loot, Naxxramas phase
DCs, save/reload, sealed reports, legacy stories and mobile width. Existing kits,
rations, potions, staff, gear crafting, convoy and offline behavior are checked
separately. The new encounter module is included in the offline release manifest.
