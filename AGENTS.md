# AGENTS.md

Context for AI coding agents (Claude Code, Codex, Cursor, Copilot and others) working on ReimaginedLC. Humans: see [CONTRIBUTING.md](CONTRIBUTING.md).

ReimaginedLC is a [Pengu Loader](https://pengu.lol) plugin that draws a new interface over the League of Legends client. It is Preact + @preact/signals + TypeScript, built with Vite. The original client keeps running underneath; if one of our screens throws, `Boundary` turns the layer off and the original client comes back.

## Commands

```sh
npm ci
npx tsc --noEmit                      # typecheck
npx vitest run                        # app tests (jsdom)
npm test                              # tools + app + loader tests
npx vite build --mode client          # build and copy into C:\Program Files\Pengu Loader\plugins\ReimaginedLC (PENGU_DIR overrides)
npm run mock && npm run dev:mock      # run in a browser against a simulated client
```

Before you finish, run `npx tsc --noEmit` and `npx vitest run`. Both must pass.

## Where things are

| Path | What |
|---|---|
| `src/index.ts`, `src/shell/start.ts` | Entry: mounts `#rlc-root`, starts the LCU stores, plugins, theme engine. |
| `src/shell/` | App frame: `App.tsx` (screen routing by gameflow phase), `router.ts`, `layer.ts` (on/off, Ctrl+Shift+F12), `prefs.ts` (settings), `update.ts`, overlays, sounds. |
| `src/lcu/` | Client API: `request.ts` (HTTP), stores fed by the client WebSocket (`createStore`), generated types in `types.d.ts`. |
| `src/screens/<screen>/` | One folder per screen: `home`, `lobby`, `modes`, `champselect`, `ingame`, `postgame`, `honor`, `profile`, `collection`, `store`, `events`, `social`, `settings`. Tests sit next to the code. |
| `src/plugins/` | Built-in optional plugins: auto-accept, appear offline, dodge, marketplace, ROSE bridge, Spotify. |
| `src/theme/` | Themes: `validate.ts` (format and tokens), `resolve.ts` (`extends`), `apply.ts` (tokens to CSS variables), `engine.ts`, `contrast.ts`, `ai.ts` (schema and AI prompt), `customCss.ts`. |
| `src/ui/` | Shared components (`Loader`, `Rail`, `RoleIcon`, ...) and CSS: `styles.css` plus one file per area in `src/ui/css/`. |
| `src/i18n/` | `pt-BR.json` and `en-US.json`. Same keys in both (tested). |
| `public/themes/<name>/theme.json` | Built-in themes. |
| `loader/` | The signed auto-update loader that ships as `index.js`. |
| `helper/` | Optional helper (`rlc-helper.ps1` + `install-helper.cmd` / `uninstall-helper.cmd`, comments and messages in English): serves the Wallpaper Engine folder and `Pictures\ReimaginedLC` to the client on 127.0.0.1 (the client can't read folders) and maximizes the window like a browser. Client side: `src/theme/wallpapers.ts`, `src/ui/Wallpapers.tsx`. |
| `docs/THEMES.md`, `docs/theme.schema.json` | Theme format and its JSON Schema. |

## Rules

- **Chromium 108.** No CSS nesting, `:has()`, `color-mix()`, `@scope` or `popover`. Build target is `chrome108`.
- **CSS:** every selector starts with `#rlc-root`. Colors only through `var(--rlc-*)`; a literal color is allowed only as a `var()` fallback (`src/ui/styles.test.ts` enforces it). Put area CSS in `src/ui/css/<area>.css` and `@import` it from `styles.css`.
- **Theme tokens** are listed in `src/theme/validate.ts` (`TOKEN_KINDS`). A token `color.foo` becomes `--rlc-color-foo`. Adding a token: add it to `TOKEN_KINDS` (optional ones in `OPTIONAL_KINDS`), describe it in `TOKEN_HELP` in `src/theme/ai.ts`, add `stTok_<token>` to both i18n files, then regenerate the schema with `UPDATE_SCHEMA=1 npx vitest run src/theme/ai.test.ts`.
- **Text:** user-visible strings go through `t('key')` with the key in both `pt-BR.json` and `en-US.json`. Code comments are in Portuguese.
- **Safety:** text from the client or other players is rendered as text, never HTML. No optimistic UI: show a change after the client confirms it. Purchases and anything irreversible ask for confirmation (`shell/overlays/Confirm`).
- **No gameplay advantage, no Riot assets in the repo, no personal data in tests** (use `Fulano`, `Zeca`, synthetic ids).
- **Tests:** every behavior change comes with a test. Use the fakes in `src/test/fixtures.ts`.
- **Never reload the client** while the game phase is `ChampSelect`, `Matchmaking` or `InProgress`.

## Debugging a user's bug report

Users can copy a report from **Settings › General › Error report**. It has the version, game phase, theme, settings and the last error stack (`sessionStorage['rlc:lastError']`). Start from the stack: the top `src/...` frame usually names the screen. Reproduce with a test using `src/test/fixtures.ts` before fixing.

## Themes and custom CSS

- A theme is data only (JSON, validated by `validateTheme`). Never add a field that accepts CSS or URLs to the theme format.
- Custom CSS is a separate per-user setting (`src/theme/customCss.ts`), checked by `checkCss` and applied only while the layer is on.
- The theme editor has "Copy prompt for AI" and "Paste AI reply" (`themePrompt`, `extractJson`). Keep the prompt in sync when the format changes; `src/theme/ai.test.ts` checks the schema file against the validator.
