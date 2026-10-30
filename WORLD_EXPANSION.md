# More discoveries and clearer mobile reports

Reports separate Traits, bonds & wounds and Discovery into block sections with paragraph spacing. Discoveries use green text, preserving existing loot/XP/boss/injury colors. DOM ranges move existing nodes rather than reinterpret report data as HTML; saved report outcomes and text are untouched.

The gear crafting explanation is a native details control labeled Crafting rules & Blacksmithing bonuses, collapsed by default. Recipe selection, requirements and crafting controls remain outside it.

Twelve added locations use the existing exploration candidate rules (rank, reputation, frontier and weighted selection). None is known automatically. Every location adds one contract site; towns also open the existing inbound/outbound market flows when discovered.

| Location | Area | Rank index | Reputation | Type |
| --- | --- | --- | --- | --- |
| Goldshire | Elwynn Forest | 0 | 0 | Town |
| Kharanos | Dun Morogh | 0 | 0 | Town |
| The Crossroads | Northern Barrens | 1 | 50 | Town |
| Astranaar | Ashenvale | 2 | 100 | Town |
| Warsong Lumber Camp | Ashenvale | 2 | 100 | Contract site |
| Stromgarde Keep | Arathi Highlands | 3 | 200 | Contract site |
| Feathermoon Stronghold | Feralas | 4 | 400 | Town |
| Blackrock Mountain Approach | Burning Steppes | 5 | 700 | Contract site |
| Everlook | Winterspring | 6 | 1000 | Town |
| Wyrmrest Temple | Dragonblight | 7 | 1400 | Contract site |
| Argent Tournament Grounds | Icecrown | 8 | 1900 | Contract site |
| Firelands Approach | Mount Hyjal | 9 | 2500 | Contract site |

Ranks use the existing F through Renown indexes. Existing dungeon identities, materials and recipes are unchanged. New contract sites enter the normal generated-offer pools rather than creating bespoke reward currencies.

Startup now preserves string discovery IDs before external modules register their locations. Previously it could prune these IDs prematurely, losing discovered external locations on reload. Known contract pools are rebuilt after registration. Unknown IDs do not create routes or selectable locations without a matching location definition.

Browser checks cover separate colored discovery/trait paragraphs, retained XP/injury formatting, collapsed help with visible controls, all twelve unique locations and sites, rank/reputation exclusion, undiscovered-market exclusion, discovered-town routes, contract-pool persistence after reload, existing boss-report presentation and offline update lifecycle.
