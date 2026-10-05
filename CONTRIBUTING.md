# Contributing

## Setup

Requires Node 24.2 or newer.

```sh
npm ci
npm test          # tool tests (node --test) and app tests (vitest)
npm run build     # typecheck and build into dist/ReimaginedLC
```

- `npm run dev:client` rebuilds on every change and copies the build into `C:\Program Files\Pengu Loader\plugins\ReimaginedLC` (set `PENGU_DIR` for another path). Restart the client interface to load it.
- `npm run mock` plus `npm run dev:mock` runs the interface in a browser against a simulated client, replaying recorded sessions from `docs/dump/sessions`.

## Rules

- **No gameplay advantage.** Pull requests that reveal hidden names, dodge without penalty, unlock content or break Riot's terms in a similar way are closed.
- **No Riot assets in the repository.** Load them at runtime from client routes (`/lol-game-data/assets/...`, `/fe/...`).
- **No personal data.** Use neutral names (`Fulano`, `Zeca`) and synthetic ids in tests and docs. Recordings in `docs/dump/sessions` are anonymized by `tools/dump`; check the output before committing.
- The client runs Chromium 108: no CSS nesting, `color-mix()`, `popover` or `:has()`. CSS selectors live under `#rlc-root`, and colors come only from `--rlc-*` variables (`src/ui/styles.test.ts` enforces it).
- Text from the client or from other players is rendered as text, never as HTML. Themes and stored settings are validated before use.
- No optimistic UI: show a change only after the client confirms it. Actions that spend resources or cannot be undone ask for confirmation.
- Every behavior change comes with a test.

## Translations

Texts live in `src/i18n/<language>.json`, one file per language, with the same keys (a test checks it). To add a language, copy `en-US.json`, translate the values and register it in `src/i18n/index.ts`.

## Releases

Bump `version` in `package.json`, then push a tag `v<version>`. The release workflow tests, builds and attaches `ReimaginedLC-<version>.zip` to a GitHub release. Tags with a suffix (`v0.2.0-beta.1`) become pre-releases.
