# Hall 4 economic buildings

All three are unique, occupy one plot, and require one assigned worker. New-only upgrade gates: levels 1/2/3/4/5 require Hall 4/4/5/6/7. Existing buildings retain their gates. Construction and upgrade downtime suppress service bonuses. Wages follow existing staff rules.

| Level | Hall | Depot yield | Office client gold | Endowment personal gp/hero/day |
|---|---|---|---|---|
| 1 | 4 | 10% | 4% | 1 |
| 2 | 4 | 20% | 8% | 2 |
| 3 | 5 | 30% | 12% | 3 |
| 4 | 6 | 40% | 16% | 4 |
| 5 | 7 | 50% | 20% | 5 |

Build/upgrade prices, levels 1–5:
- Depot: 600 / 450 / 750 / 1200 / 1800 gp; upkeep 3 gp per building level.
- Office: 900 / 650 / 1000 / 1600 / 2400 gp; upkeep 3 gp per level.
- Endowment: 1500 / 1000 / 1600 / 2400 / 3600 gp; upkeep 4 gp per level.

## Staff

Uses existing staff levels 0–10 and total practice thresholds 0/5/15/30/50/75/105/140/180/225/275. Skills stay with the worker when reassigned. The normal staff progress bars display these professions.

- Logistics: +1 percentage point of yield per level 1–5 (maximum +5%). Levels 6–10 reduce Depot upkeep by 4% each (maximum 20%). One practice per paid, continuously assigned workday, plus one for a successful/exceptional material-return quest, maximum three service practice per game day. Each staged world run awards practice at most once. Partial success gives materials but no service practice.
- Negotiation: +0.5 percentage points of client gold per skill level, maximum +5%; one practice per paid workday and standard once-daily service practice for a successful paid quest return.
- Stewardship: Endowment upkeep reduction 2% per skill level, maximum 20%; one practice per paid workday. Does not multiply the stipend.

New professions use fixed one-practice workdays; the daily Logistics maximum is four practice.

## Rewards and saved state

Support rates and gathering expertise are recorded when dispatching a quest. Existing sealed reports without this support record are preserved. No quest payouts are retroactively recalculated.

The Depot affects main material rewards and all material loot drops from every quest type, including exclusive resources that actually dropped. It does not affect gold, XP, reputation, finished gear, convoy cargo or crafted goods. It cannot add failed-stage loot or change drop chances. Maximum gathering-main yield bonus is 45% expertise +50% Depot +5% Logistics =100%; other material rewards get up to55%. Expertise alone retains its existing rounding when there is no Depot.

Fractional extra material quantities are accumulated in `depotMaterialCredits` per resource. Credits only change on actual returns, never previews, and survive save/load. Return processing is marked once per report. Displayed material totals are updated to match storage deposits.

The Office adds to existing percentage payout bonuses, before outcome scaling, rounding and existing member shares. It does not introduce payments for guild-funded expeditions. Maximum Office bonus is25%.

The Endowment settles once after a full daily operating-cost payment. A continuously staffed, operational Endowment must have been present in the outgoing work snapshot. All living heroes, including the guildmaster and away/wounded heroes, receive the building level in personal gp. Fallen heroes receive none. Payments are sponsored; the treasury pays upkeep/wages only. New arrivals occur afterward. Per-hero payments and total are retained in an expandable Buildings report. No payment on reload, unpaid day, new assignment on settlement, or ordinary quest completion.

## Verification

`tests/economy-buildings-browser.py` covers Hall gates, uniqueness, exact prices, old building gates, Logistics5/10 bonuses, additive yield, fractional credits, actual warehouse deposits, sealed dispatch support, partial success, service caps, world-run practice, legacy records, full/partial gold, daily living-hero grants, unpaid days, duplicate settlement, staff UI and persistence. Existing report, economy, staged-world and offline browser suites provide regression coverage.
