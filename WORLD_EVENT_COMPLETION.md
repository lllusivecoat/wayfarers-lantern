# World-event daily completion

World dungeons, persistent world bosses and world raids use their daily completion on either a full successful clear or a partial result. A partial stage ends the run and locks that event until the next game day. Outright failures remain eligible for same-day retries from stage one.

Partial completion is recorded separately from runComplete, so it cannot award final-clear rare loot or turn an uncleared stage into a cleared stage. Earlier cleared-stage rewards remain retained. Existing partial-stage reward handling is unchanged.

The saved worldClearDays ledger records both full clear and partial completion. It restores UI availability and rejects another dispatch before fees or utility consumption. Saved partial reports returned on the current day also restore this limit; report returnedDay is used when migrating older entries. Game-day rollover makes the event available again. Existing heroes, inventory, rewards and staged reports are preserved.

Gathering member cards show a compact Tool −N badge only when a selected hero carries a matching, durable tool. Its title and accessible label contain the full tool name. The badge is highlighted if that tool supplies the party reduction; stronger tools on other selected members remain authoritative. Stats and tool share three compact columns so the badge does not add a card row or overflow narrow mobile screens.

Validation covers dungeon partial locking, failure retries, boss/raid partial locking, save/reload, gathering stat behavior, existing stage rewards and offline updates. Mobile tool checks cover selection, matching profession, broken tools, active reduction and inline placement at widths 320, 390 and 768.
