# Wayfarer's Lantern

A single-file browser guild management game.

Play: https://lllusivecoat.github.io/wayfarers-lantern/

Saves are stored locally in your browser.

## Install and play offline

Open the site online and wait for **Offline ready**. Use **Install game** when your
browser offers it, or use its **Install app / Add to Home Screen** menu. The game
can then reopen offline. Installation is optional; the same cached site works in
a normal browser tab. The Spotify soundtrack still requires internet.

Updates download when the game is online. Use **Check for updates** to check immediately. **Restart to apply update** saves and
checks progress before switching versions. Close other game tabs/windows first.
Closing all game windows also lets a fully downloaded update activate for the next
launch. Updates do not clear saves. Browser saves belong to the browser/profile
and origin; export/import a save to move to another device or browser.

## Development and patches

Serve this directory with `python3 -m http.server 8000 --bind 127.0.0.1`. Service
workers require HTTPS or localhost. File downloads opened with `file://` do not
support this installation flow.

Before every deployment, run:

```sh
python3 scripts/build-offline.py
python3 scripts/build-offline.py --check
```

Commit the generated `sw.js` with the changed game files. Add any new runtime files
to the build script's `ASSETS` list. The release fingerprints its complete file set
and verifies each download before installation; a partial deployment keeps the
previous complete version. Save data lives in localStorage, separately from the
versioned asset caches. The worker cleans only this application's old asset caches.

Run `python3 tests/offline-browser.py` to test offline reopening, update consent,
save protection, multiple windows and incomplete deployments. It uses Python
Playwright and `/usr/bin/chromium`, and starts its own temporary server.

During local development, an installed worker deliberately serves its saved release.
Use the browser's service-worker development bypass/unregister option when editing,
or rebuild `sw.js` and use the game's update flow. Clearing browser storage also
clears the game save, so export a backup before using storage-clearing tools.
