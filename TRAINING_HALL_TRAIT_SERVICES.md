# Training Hall trait replacement

A staffed operational Training Hall now offers two instant services under Reroll & choose traits:

- 10 gp: replace one selected trait with a different random compatible trait from the normal rollable catalogue. The result can be positive, negative or social.
- 100 gp: choose one specific compatible replacement from the full catalogue, including evolved traits.

Both are paid from that hero's personal purse into the guild treasury and require confirmation. They do not advance the day, occupy a training slot or modify level, XP, skills, equipment, bonds, wounds or other traits. Trait count stays the same. This replaces an existing real trait; it does not add extra trait slots to heroes without traits.

Existing trait conflicts and duplicate restrictions apply. Dead heroes, away heroes, heroes with active trait training, insufficient funds and invalid replacements cannot use the service. Current training must finish or be canceled through its existing flow, so paid training progress is not silently discarded. Rerolled trait progress resets only for the replaced trait; other progress remains saved. There is no added cooldown; the fixed prices do not receive ordinary Training Hall discounts.

The UI uses native selects and a collapsible panel beneath the Training Hall roster, with the hero's purse shown and a description of the chosen trait. Existing training/removal/evolution and perk respec systems remain available.

The accompanying report fix uses actual paragraph elements and block spacing for XP and per-member GP, preserving existing colors and recorded amounts.

Browser tests cover confirmations, both prices and guild transfers, deterministic random replacement, conflicts and duplicates, insufficient funds, away/active-training guards, retained unrelated progress, all 32 tier/stage enhancement fee combinations, visible report paragraph spacing and save/reload. Existing economy, enhancement, report and offline lifecycle regressions pass.
