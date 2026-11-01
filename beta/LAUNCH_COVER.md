# Permanent beta launch cover

Every document load starts with an inline-styled, static Booty Bay splash before
the Hall markup and before the shared-save guard reads storage. Its preloaded
720×1279 WebP is approximately 160 KB. Text, Skip and Retry are real HTML; the
illustration contains no baked-in interface or progress bar. There is no minimum
display duration. The only exit delay is the requested 300 ms fade, removed
under prefers-reduced-motion.

`launch-critical.js` is inlined in the head and owns the safe failure state.
`launch.js` runs after all game scripts and DOMContentLoaded initializers. It
waits for required CSS and two animation frames, verifies the Hall rendered,
then enables Skip. Normal dismissal also waits for decoded cover/Hall art and
warms only the Guildmaster's portrait. Skip can bypass those image waits once
minimum initialization is complete. Neither path advances the game or saves it.

Chibi images stay behind the existing custom-image fallback until the splash
finishes fading. The normal render then populates them with lazy image loading.
Card/location artwork remains deferred until splash dismissal and visibility.
The atlas is an inline schematic; its full-size location images load on demand.
Existing inline shell rules moved unchanged into `game-shell.css`, allowing
the splash markup to arrive in the first ~8 KB instead of after ~98 KB of head
styles. External font CSS is optional and cannot hold up the cover or boot. Required
game CSS loads without blocking the splash's first paint and gates Hall reveal.

The old cover-seen flag has no role in launch eligibility. Fresh guilds go
directly to the existing Getting started checklist after load; returning guilds
go to the Hall without Begin. Settings → Replay intro retains the optional old
story cover. Its seen flag/checklist handoff remain separate from launch.

The original shared-save backup/error/empty-guild guard is preserved verbatim.
Boot performs a read-only validation before loading an existing save. A malformed
save or migration exception halts initialization instead of silently falling
back to a new guild. Retry only reloads the current URL. There is no new save
key, storage override, save write, deletion, restore or reset in launch code.
Existing game migrations and normal save behavior remain the game's concern.

Missing required scripts/styles, runtime failures and incomplete initialization
keep the cover with Retry. A stalled load offers Retry after 20 seconds, without
automatically dismissing, resetting, or fabricating progress. Optional cover art
falls back to the Hall artwork. Skip is unavailable until minimum boot succeeds.

Both Gear care entry points and their existing pricing/Armory math are retained.
Only beta files change; root assets and the root service worker stay untouched.

After editing critical sources, run:

```
python3 beta/build-launch.py
python3 beta/build-launch.py --check
node beta/tests/launch.cjs
node beta/tests/harbour-polish.cjs
node beta/tests/portrait-catalog.cjs
node beta/tests/gear-care.cjs
python3 beta/tests/launch-browser.py
python3 beta/tests/hall-browser.py
```

Browser tests use disposable fixture storage. They exercise held startup files,
every-refresh display, Skip during pending art, reduced motion, failure Retry,
corrupt-save preservation and both Gear care links. They also save splash
screenshots at mobile/tablet/desktop sizes in `/tmp/wayfarers-launch`.
