# Class perk balance pass

All 280 IDs and existing saved choices are retained. Existing heroes receive the
revised definitions automatically; no perks, progression, or saves are reset.

- Early party DC/roll perks now improve one ally's roll (+1 through level 7,
  +2 through level 15). Full-party modifiers remain level-19 benefits and use
  the strongest source, preventing identical-support stacking.
- Dungeon/Raid conditions include their World equivalents. Stat conditions in
  role encounters use the hero's actual role stat.
- Obsolete wear-avoidance perks grant +25 XP on rank-appropriate successes with
  a 4- or 6-quest cooldown. Conjure Refreshment retains its existing repair discount.
- Former +2-with-extra-wear perks grant +1, with another +1 against quests one
  rank higher. Successful checks never incur a durability penalty.
- Roll the Bones is rank-gated rather than imposing extra wear.
- The personal +2 positive roll cap remains. Overflow grants one +25 XP synergy
  award on rank-appropriate successes, with a shared 4-quest cooldown.
- Sentinel and crit-triggered tier raises apply to the final group outcome.
  Crit tier raises are limited to one per quest. Sentinel cannot lift Failure.
- Natural-1 tier protection becomes an actual reroll or death-spike protection,
  including in role encounters. Forced successful opening checks are respected.
- Touch of the Magi awards at most three successful heroes per trigger,
  prioritising the lowest levels, instead of scaling without bound with raid size.

This is a first balance pass, not proof that all complete builds are equally
strong. Survival, progression and quest-specialist perks remain distinct choices.
Live play and comparative outcome simulations should guide further tuning.

Validation: `node tests/perk-balance.cjs`, `node tests/mission-wear.cjs`,
`node beta/tests/gear-care.cjs`, and offline integrity/routing checks.
