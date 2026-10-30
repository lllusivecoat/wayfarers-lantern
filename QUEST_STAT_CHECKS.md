# Gathering checks and Charisma contracts

Each gathering mission has two distinct stat phases. Every selected hero rolls once per phase. Existing readiness, staff support, supplies and the strongest matching gathering tool apply. Perks share their existing per-expedition usage state; a second phase does not reset once-only perks or grant another daily Lucky reroll.

| Profession | First check | Second check |
| --- | --- | --- |
| Mining | STR | CON |
| Fishing | DEX | WIS |
| Herbalism | WIS | INT |
| Skinning | DEX | STR |
| Woodcutting | STR | CON |
| Tailoring | DEX | INT |
| Jewelcrafting | INT | DEX |
| Hunting | DEX | WIS |

The existing party outcome formula scores each phase from 0 (Failure) to 3 (Exceptional Success). The mission averages these scores and rounds down. Success + Partial yields Partial; Exceptional + Partial yields Success. Both phases affect final yield and whether expertise practice is earned.

There remains one organizing fee, utility charge per used category, tool durability loss, reward roll, XP award and expertise award per expedition. The first phase remains the personal injury and qualifying partial-success XP check. The second phase affects the party result without creating another natural-1 death exposure; ordinary injury probability can still change with the combined outcome. Main material yield still includes party size and saved expertise. No automatic material/reward multiplier was added.

Quest badges and member previews show both stat readiness values. Full reports show each phase's stat, DC, result and individual rolls. Sealed reports store the phase data; old reports remain unchanged and unaugmented. Old saved quests lacking phase metadata retain their old single-check resolution.

Charisma contract stat weights:

| Type | Stat weights |
| --- | --- |
| Diplomatic courier | CHA 100% |
| Escort / delivery | CHA 40%, CON 30%, WIS 30% |
| Investigation / observation | INT 50%, WIS 30%, CHA 20% |
| Exploration / rescue contracts | WIS 40%, INT 30%, CHA 30% |

Permanent exploration missions retain their existing WIS check. Only these suitable social contract types change; combat encounters and convoys retain their existing rules. When no CHA contract is currently available, one eligible unaccepted social offer may switch to CHA, once per game day. This does not generate duplicate offers, bypass location unlocks or modify already dispatched reports. If the board has no eligible social offer, it does not manufacture one.

Browser coverage: all eight pairs, actual phase rolls and secondary stat modifiers, outcome combination, shared context restoration, single fee/charge/XP award, saved full reports, CHA stat weights and current offer adaptation, sealed report preservation, gathering expertise and staged world regressions, save/reload and offline updates.
