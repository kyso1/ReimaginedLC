# Theme guide

A theme is a JSON file. It only holds data, never code or CSS. ReimaginedLC checks every field on import and rejects anything outside the formats below, naming the field that failed.

The easiest way to start is the editor in **Settings › Appearance › New theme**. It copies the active theme and shows a live preview; **⋯ › Export JSON** saves the result as a file you can share.

## Example

```json
{
  "$schema": "https://raw.githubusercontent.com/kyso1/ReimaginedLC/master/docs/theme.schema.json",
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
| `$schema` | Optional. Points editors (VS Code) and AIs to [`theme.schema.json`](theme.schema.json) for autocomplete and validation. Ignored by the app. |
| `name` | Identifier: lowercase letters, digits and `-`, up to 40 characters. It cannot be the name of a built-in theme (`vidro`, `vidro-ludico`, `editorial`). |
| `label` | Name shown in Settings. |
| `version` | Format version. Must be `1`. |
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

### Optional tokens

These can be left out even without `extends`; each screen then keeps its own default. They are in the editor under **More colors and corners**.

| Token | Paints |
|---|---|
| `color.highlight` | Active turn (the player picking in champion select). |
| `color.danger`, `color.onDanger` | Destructive actions and errors, and the text on them. |
| `color.win`, `color.loss` | Victory and defeat, positive and negative LP. |
| `color.premium` | Premium pass rewards. |
| `color.online`, `color.away`, `color.playing` | Friend status dots. |
| `color.teamBlue`, `color.teamRed` | Team tints. |
| `color.scrim`, `color.shade`, `color.textShadow` | Veil over splash art, drop shadows, shadow behind text on art. |
| `color.glassTop`, `color.glassBottom`, `color.glassCard`, `color.glassCardHover` | Glass panels (champion select, drawers) and the cards inside them. |
| `color.bar` | Floating bars (lobby bar, queue pill, Spotify widget). |
| `color.sheetTop`, `color.sheetBottom` | Match history sheet. |
| `radius.lg` | Large hero panels. |

The full list with formats is in [`theme.schema.json`](theme.schema.json).

### Contrast

The editor warns when text is hard to read (WCAG): `color.text` on `color.bg` and on `color.surface` at least 4.5:1, `color.textMuted` on `color.bg` at least 3:1, `color.onAccent` on `color.accent` and `color.onDanger` on `color.danger` at least 4.5:1. Translucent colors are measured over `color.bg`. It is a warning; you can still save.

`color.surface` is used on panels over the background, so it is usually translucent. `color.onAccent` is the text color on top of `color.accent` (buttons), and needs enough contrast with it.

## Themes per game

**Settings › Appearance** has a LoL group and a TFT group. A theme can be chosen for each; the TFT theme applies while the lobby or the game is TFT.

## Creating a theme with AI

1. Open **Settings › Appearance**, then **New theme** (or **Edit** on a theme).
2. Under **Create or tweak with AI**, write what you want ("neon purple", "light paper look", "more contrast") and click **Copy prompt for AI**. The prompt carries the rules, every token and your current theme.
3. Paste it into ChatGPT, Claude, Gemini or any other AI.
4. Click **Paste AI reply**, paste the whole answer and click **Apply to draft**. The JSON is found inside the answer on its own.
5. If the theme is rejected, the error names the field. Click **Copy error for the AI to fix**, paste it into the same chat, and paste the new reply.
6. Check the preview and the contrast warnings, then **Save**.

Without the editor, give the AI this file and the schema URL, and ask for a theme JSON; import the result with **Import**.

## Custom CSS

For changes that tokens cannot express (layout, sizes, hiding something), **Settings › Appearance › Custom CSS** applies your own stylesheet on top of the theme.

- It is yours alone: it is not part of the theme file, so shared themes stay data-only and safe to import.
- Every selector should start with `#rlc-root`. The screen is on `#rlc-root .rlc-app[data-screen="..."]`. Open DevTools with **Ctrl+Shift+I** to find class names.
- `@import`, `url()` outside client paths (`/fe/...`, `/lol-game-data/assets/...`), `expression()` and `javascript:` are rejected. The client is Chromium 108: no CSS nesting, `:has()` or `color-mix()`.
- **Copy prompt for AI** works here too, with your CSS and request.
- It only applies while the new interface is on. If a screen breaks, turn the switch off or press **Ctrl+Shift+F12**.
