# Offline release workflow

The game is a static GitHub Pages application. Preserve existing local saves when
changing gameplay or adding migrations.

When changing an application asset, run `python3 scripts/build-offline.py` before
committing or deploying. Commit the generated `sw.js` together with the application
changes. Do not edit `sw.js` directly; its source is `scripts/sw-template.js`.
`python3 scripts/build-offline.py --check` detects stale offline releases.

If you add a runtime asset, include it in `ASSETS` in `scripts/build-offline.py`.
Keep all manifest, script and icon paths relative for the GitHub Pages subpath.
Do not automatically activate a waiting update while somebody is playing.

Use `python3 tests/offline-browser.py` for changes to caching or updates. It starts
its own temporary server and exercises actual service workers in Chromium. The
existing gameplay browser tests require a static server on port 8000.
