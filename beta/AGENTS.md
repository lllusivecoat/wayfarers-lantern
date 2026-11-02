# Shared production presentation assets

The former beta game is now the root index.html. beta/index.html redirects there.
This folder contains production CSS, JavaScript and artwork; changes affect the main game.
Preserve the root inline save backup/error/empty-guild guard and existing save keys.
After runtime changes, run python3 beta/build-launch.py when critical assets change,
then python3 scripts/build-offline.py and commit the generated root sw.js.
Do not retain a second playable copy of the old main or beta game.
