<div align="center">

# ReimaginedLC

**A new interface for the League of Legends client, built as a [Pengu Loader](https://pengu.lol) plugin.**

English · [Português](README.pt-BR.md) · [简体中文](README.zh-CN.md)

![Home](docs/screenshots/home.png)

</div>

> [!WARNING]
> **Unofficial project.** ReimaginedLC is not endorsed by or affiliated with Riot Games. Modifying the client is a gray area under Riot's terms. Pengu Loader is tolerated today, with no guarantee. Use it at your own risk.

## Contents

- [What it does](#what-it-does)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [First steps](#first-steps)
- [Built-in plugins](#built-in-plugins)
- [Updates](#updates)
- [Turning it off and uninstalling](#turning-it-off-and-uninstalling)
- [Troubleshooting](#troubleshooting)
- [Themes and language](#themes-and-language)
- [Development](#development)
- [License](#license)

## What it does

ReimaginedLC draws its own screens over the original client. The original client keeps running underneath. It is the fallback: if a screen fails, ReimaginedLC turns itself off and the original client comes back.

- **Home, lobby and queue.** A lane picker in the client's style. While you are in queue, a pill in the corner shows the queue and the time; it stretches back into the lobby bar when you return.
- **Champion select.** Large splash on stage and the real names of your allies. Each ally card shows rank, LP, win rate and KDA. Also: a skin carousel, ward skins, favorites per role (right-click), and runes per matchup.
- **Post-game.** Result, your numbers ranked within the match, charts, LP and mastery progress, and who honored you. TFT gets standings, every player's board and comp, and a comparison with your own history.
- **Honor.** Honor allies and enemies, like the current client.
- **Profile.** Your background, crest and banner. "Match history" opens a glass sheet with the feed, LoL or TFT.
- **Collection and loot.** Filters and tabs, loot crafting and rerolls, the Mythic Shop and the Sanctum. Purchases always ask for confirmation.
- **Store and events.** Featured skins with names and splash crossfades. The event pass shows locked rewards as disabled.
- **Friends and chat.** A drawer that can stay pinned open, folders that remember their state, hover cards, the room chat open by default, and sounds.
- **Settings.** A theme editor, background (image or video), lite mode for weaker PCs, and language.

## Screenshots

| | |
|---|---|
| ![Lobby](docs/screenshots/lobby.png) | ![Collection](docs/screenshots/collection.png) |
| Lobby | Collection |
| ![Profile](docs/screenshots/profile.png) | ![Settings](docs/screenshots/settings.png) |
| Profile | Settings and plugins |
| ![Store](docs/screenshots/store.png) | ![Events](docs/screenshots/events.png) |
| Store | Events |

## Installation

### Requirements

- Windows 10 or 11 with the League of Legends client installed.
- [Pengu Loader](https://pengu.lol) **1.1.6** or newer.

### Step by step

1. **Install Pengu Loader.**
   1. Download it from [pengu.lol](https://pengu.lol) (or [GitHub releases](https://github.com/PenguLoader/PenguLoader/releases)).
   2. Open it and click **Activate**. Keep the client closed while you do this.
2. **Download ReimaginedLC.**
   - Get `ReimaginedLC-<version>.zip` from [Releases](https://github.com/kyso1/ReimaginedLC/releases/latest).
3. **Open the plugins folder.**
   - In Pengu Loader, click **Plugins folder**. It is usually `C:\Program Files\Pengu Loader\plugins`.
4. **Extract the zip there.**
   - The result must be `plugins\ReimaginedLC\index.js`.
   - If you end up with `plugins\ReimaginedLC\ReimaginedLC\index.js`, move the inner folder up one level.
5. **Open the League client.**
   - If it was already open, reload it with **Ctrl+Shift+R**.
6. **Done.**
   - The new interface opens on its own the first time. **Ctrl+Shift+F12** switches between it and Riot's interface, and the client remembers your choice.

```text
Pengu Loader/
└── plugins/
    └── ReimaginedLC/
        ├── index.js      ← loader (checks for updates)
        └── app/          ← local copy of the interface
```

## First steps

- The **left rail** is the main menu: home, play, profile, collection, loot, store, events and settings.
- **Original client**, at the bottom of the rail, switches back to Riot's interface. **Ctrl+Shift+F12** does the same at any time.
- In **Settings › General** you choose the language, lite mode and whether the interface opens with the client.
- In **Settings › Appearance** you choose the theme and the background.

## Built-in plugins

All of them are off by default. Turn them on in **Settings › Plugins**.

| Plugin | What it does |
|---|---|
| **Auto-accept** | Accepts the match when the queue pops. |
| **Appear offline** | Keeps your chat status offline, even during matches. |
| **Dodge** | Leaves champion select without closing the client. The dodge penalty still applies (lockout, and LP in ranked). |
| **Marketplace** | Installs Pengu Loader plugins (plugins only, not themes) from the community registry. |
| **ROSE** | Integrates with [ROSE](https://github.com/Alban1911/Rose), a separate app for custom skins, so you can pick skins from the champion select carousel. ROSE is a third-party tool with its own risks. |
| **Spotify** | Shows what is playing in your Spotify and controls it from the client. Controls need Spotify Premium. It can also show the track as your status. It needs a free Spotify developer Client ID; the plugin settings walk you through it. |

## Updates

The `index.js` in the zip is a small loader. It checks GitHub for a new version every 6 hours and downloads it from jsDelivr. It only runs code whose signature it has verified (ECDSA P-256 and SHA-256). If anything fails, it uses the local copy in `app/`.

When an update is ready, a notice with a **Reload** button appears in **Settings › General**. It never reloads by itself, and the button is disabled during queue, champion select and matches.

## Turning it off and uninstalling

- **Turn off:** press **Ctrl+Shift+F12**, or click **Original client** in the rail.
- **Uninstall:** delete the `Pengu Loader/plugins/ReimaginedLC` folder and reload the client.
- **Remove Pengu Loader:** open it and click **Deactivate**.

## Troubleshooting

| Problem | Fix |
|---|---|
| Nothing changes after installing | Make sure the file is at `plugins/ReimaginedLC/index.js`, that Pengu Loader is activated, then reload the client with **Ctrl+Shift+R**. |
| "A screen failed" message, then the original client comes back | Reload with **Ctrl+Shift+R**. If it repeats, copy the report in **Settings › General › Error report** and paste it into an [issue](https://github.com/kyso1/ReimaginedLC/issues) or an AI. |
| Client feels slow | Turn on **Lite mode** in **Settings › General** (no glass blur, paused background videos). |
| Stuck on "Waiting" after a match | Update to the latest version; the post-game steps are completed automatically. |

## Themes and language

- **Themes.** Vidro, Vidro lúdico (the default for TFT) and Editorial ship with the plugin. Create your own in **Settings › Appearance › New theme**, or import a JSON file. The theme editor can write a prompt for ChatGPT, Claude or any AI and load the reply back; for deeper changes there is **Custom CSS**. See [the theme guide](docs/THEMES.md).
- **Language.** The interface is in Portuguese (Brazil) and English, following the client language. Champion, item and queue names come from the client, already translated.

## Development

```bash
npm ci
npm test                              # tools, app and loader tests
npx vite build --mode client          # builds and copies into the Pengu plugins folder
```

- `docs/publicacao.md` explains the release flow and the update signing.
- See [CONTRIBUTING.md](CONTRIBUTING.md) for code conventions. AI coding agents read [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE).

The repository contains no Riot assets. Icons, splashes and sounds are loaded at runtime from the client itself. League of Legends is a trademark of Riot Games, Inc.
