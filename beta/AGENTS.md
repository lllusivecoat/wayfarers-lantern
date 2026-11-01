# Beta scope and deployment

Only change beta/ files unless the user explicitly authorizes root changes.
Beta is served at /wayfarers-lantern/beta/ from this repository's main branch.
Root JavaScript imported through ../ is shared with live; do not modify it.
Preserve the inline beta save backup/error/empty-guild guard. Beta shares live's
save key; test with browser fixtures rather than a user's real browser storage.
Do not regenerate the root service worker for beta-only changes.

Run python3 beta/tests/hall-browser.py for Hall controls, rename persistence,
mobile ordering and ledger controls, themes, and shared-save guard checks.
