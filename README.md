# ReimaginedLC

A new interface for the League of Legends client, built as a [Pengu Loader](https://pengu.lol) plugin. It replaces the client screens with its own: home, lobby, queue, champion select, post-game, profile, collection, loot, friends and chat, settings with a theme editor, and TFT customization.

[Leia em português](README.pt-BR.md)

> **Unofficial project.** ReimaginedLC is not endorsed by or affiliated with Riot Games. Modifying the client is a gray area under Riot's terms. Pengu Loader is tolerated today, with no guarantee. Use it at your own risk. ReimaginedLC never adds gameplay advantages: no hidden-name reveal, no dodge without penalty, no skin unlocks.

## Install

1. Install [Pengu Loader](https://pengu.lol) and activate it.
2. Download `ReimaginedLC-<version>.zip` from [Releases](https://github.com/kyso1/ReimaginedLC/releases).
3. Extract it into `Pengu Loader/plugins/`, so the result is `Pengu Loader/plugins/ReimaginedLC/index.js`.
4. Restart the client.
5. Press **Ctrl+Shift+F12** to turn the new interface on.

## Turning it off

- **Ctrl+Shift+F12** switches between ReimaginedLC and the original client at any time.
- **Original client**, at the bottom of the left rail, does the same.
- If a screen fails, ReimaginedLC turns itself off and the original client comes back.
- To uninstall, delete the `Pengu Loader/plugins/ReimaginedLC` folder.

The original client keeps running under the new interface, because it is the fallback. Login and the store stay Riot's.

## Updates

ReimaginedLC checks for a new release once a day. When one exists, it shows a notice and a link in **Settings › General**. It never updates itself: download the new zip and replace the folder.

## Themes

Three themes ship with the plugin: Vidro, Vidro lúdico (used for TFT by default) and Editorial. You can create a theme in **Settings › Appearance › New theme**, or import a JSON file. See [the theme guide](docs/THEMES.md).

## Language

Portuguese (Brazil) and English, following the client language. You can pin one in **Settings › General**. Champion, item and queue names come from the client, already translated.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). The repository contains no Riot assets: icons, splashes and sounds are loaded at runtime from the client itself.
