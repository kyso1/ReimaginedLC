# Theme guide

A theme is a JSON file. It only holds data, never code or CSS. ReimaginedLC checks every field on import and rejects anything outside the formats below, naming the field that failed.

The easiest way to start is the editor in **Settings › Appearance › New theme**. It copies the active theme and shows a live preview; **⋯ › Export JSON** saves the result as a file you can share.

## Example

```json
{
  "name": "midnight",
  "label": "Midnight",
  "version": 1,
  "extends": "vidro",
  "tokens": {
    "color.accent": "#8ab4ff",
    "color.onAccent": "#0b1020",
    "radius.md": "14px"
  },
  "transition": "fade",
  "backgrounds": { "home": "/fe/lol-static-assets/2019-intro-background.jpg" },
  "layouts": {}
}
```

## Fields

| Field | Meaning |
|---|---|
| `name` | Identifier: lowercase letters, digits and `-`, up to 40 characters. It cannot be the name of a built-in theme (`vidro`, `vidro-ludico`, `editorial`). |
| `label` | Name shown in Settings. |
| `version` | Theme version, a whole number. |
| `extends` | Theme this one starts from, or `null`. A theme with `extends` lists only what it changes. Built-in themes and your own themes can be parents. A theme with no parent must define every token. |
| `tokens` | Visual values, listed below. |
| `transition` | Screen change animation: `wipe`, `fade`, `slide` or `zoom`. |
| `backgrounds` | Background per screen (`default`, `home`, `lobby`, ...). It is a path to an image or video served by the client: it starts with `/fe/` or `/lol-game-data/assets/` and ends in `png`, `jpg`, `webp`, `gif`, `webm` or `mp4`. To use your own image or video, use **Settings › Appearance › Custom background** instead. |
| `layouts` | Reserved for screen layouts; use `{}`. |

## Tokens

| Token | Format | Examples |
|---|---|---|
| `color.bg`, `color.surface`, `color.border`, `color.text`, `color.textMuted`, `color.accent`, `color.onAccent` | color: hex (`#fff`, `#0b1020`, `#0b1020cc`), `rgb()`/`rgba()`, `hsl()`/`hsla()` | `rgba(255, 255, 255, 0.12)` |
| `font.body`, `font.display` | font family list | `"Segoe UI", sans-serif` |
| `font.displayWeight` | weight, a multiple of 10 from 100 | `650` |
| `radius.sm`, `radius.md`, `radius.pill` | length in `px`, `rem` or `%` | `10px` |
| `blur.surface` | length | `10px` |
| `motion.duration` | duration in `ms` or `s` | `320ms` |
| `motion.easing` | `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out` or `cubic-bezier(a, b, c, d)` | `cubic-bezier(0.7, 0, 0.2, 1)` |

`color.surface` is used on panels over the background, so it is usually translucent. `color.onAccent` is the text color on top of `color.accent` (buttons), and needs enough contrast with it.

## Themes per game

**Settings › Appearance** has a LoL group and a TFT group. A theme can be chosen for each; the TFT theme applies while the lobby or the game is TFT.
