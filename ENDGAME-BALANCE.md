# Endgame outcome study

The permanent elixir now grants one raw ability point total per hero, across all
six stat variants. Further elixirs are rejected without consuming stock. The
Alchemy browser checks cover same-stat and different-stat repeat attempts.

## Method

Run `python3 scripts/analyze-endgame.py` against a local game on port 8000.
The script uses a disposable Chromium context and the actual perk preparation,
trait/bond preparation, individual checks, role quotas, encounters and tier engine.
The current rank adjustments are included. Full output is written to
`/tmp/endgame-study-after.json`.

Each case has 4,000 seeded trials. Heroes are level 20/rank Renown with the standard
15/14/13/12/10/8 stat array. Six legal crafted gear slots supply +6 per relevant
stat (the total equipped contribution is capped at +6, rather than added for every
item). Gear is durable, provisions supply +2 readiness, and heroes are rested and
uninjured. Group parties have Protection Warriors, Holy Priests and Fury Warriors,
with required tank/healer counts and the remaining slots as DPS. Mining uses five
Fury Warriors. Positive applicable traits, Comrades-or-better bonds and level-10
staff with maximum matching aptitudes are included. Legal example perk builds
are selected per quest; this is not an exhaustive search over every class/party.
Perk cooldowns are reset for each independent trial. The elixir case gives each
party member one point in their main stat. Increasing 15 to 16 improves its ability
modifier by one; increasing an even score to the next odd score would not.

Regular special-quest DC formulas are evaluated at rank 9. World locations are
representative examples at rank 9, including Blackrock Depths and Zul’Gurub.
The comparison uses full recommended parties, not single-hero raid runs. Partial
success is excluded from the success column. Wounds, deaths, resource efficiency
and complete campaign strategy are outside this outcome-only calculation.
Sampling uncertainty is roughly up to ±1.6 percentage points near 50%.

## Current example builds, full parties

“Full success” means Success or Exceptional Success, excluding Partial Success.
The old column uses the same equipped example parties before this patch.

| Quest | Party | Old, with elixir | Current without elixir | Current with elixir |
| --- | ---: | ---: | ---: | ---: |
| Gathering — Mining Expedition | 5 | 53.85% | 45.88% | 53.85% |
| Dungeon — The Sunken Reliquary | 5 | 99.35% | 69.05% | 78.08% |
| World Dungeon — Blackrock Depths | 8 | 16.88% | 9.70% | 16.88% |
| Raid — Siege of the Blackwater Hold | 20 | 99.95% | 58.35% | 78.13% |
| World Boss — The Thornmaw Colossus | 20 | 99.98% | 62.78% | 77.40% |
| World Raid — Zul’Gurub | 20 | 99.83% | 59.33% | 79.48% |

These are representative prepared parties with strong legal perk choices, not
all builds or guaranteed win rates. Perks and composition matter: without perks,
the same Raid fixture has only 19.68% full success even with elixirs. Partial
results can still recover loot. This patch does not claim to rebalance casualty
rates or every location.

## Applied rank adjustments

Add the following DC before staff/building/perk reductions. Quest cards and detail
screens show the adjusted challenge; queued reports store their original rolls
and terms, and are not recalculated when loading a save.

| Rank | Dungeon / World Boss | Raid / World Raid |
| --- | ---: | ---: |
| F–B | 0 | 0 |
| A | +1 | +2 |
| S | +3 | +4 |
| SS | +4 | +5 |
| Legendary | +5 | +7 |
| Renown | +7 | +9 |

The +6 equipment cap, +2 provision cap and one permanent stat point per hero
remain. Gathering, exploration, ordinary contracts and World Dungeon DCs retain
their existing curves. The tested World Dungeon is still much harder than the
other encounters: review its location/rank growth, role quotas, reward and
casualty model in the next world-content scaling discussion. Validate more party
compositions and casualty rates before treating these initial targets as final.
