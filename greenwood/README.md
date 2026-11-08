# Greenwood

Standalone Pokémon browser RPG, hosted independently under /greenwood/.

All runtime paths are relative to this folder. Saves use only localStorage key `greenwood.save.v2`. This app does not register or unregister service workers, edit the parent game, clear browser storage, or modify the parent offline release. The parent worker passes these URLs through to the network. Greenwood itself currently needs internet for loading and Pokémon sprites.

The repository-root offline manifest belongs to Wayfarer’s Lantern; these files are not dependencies of that game.

Backgrounds were converted to WebP for faster downloads; original PNG sources remain in the development workspace.
