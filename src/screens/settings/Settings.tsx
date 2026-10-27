import { Wallpapers } from '../../ui/Wallpapers';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { prefs, setPrefs, type Prefs } from '../../shell/prefs';
import { isLite, liteAuto, readPotato, writePotato } from '../../shell/perf';
import { canReload, reloadForUpdate, update } from '../../shell/update';
import { applyTheme } from '../../theme/apply';
import { Confirm } from '../../shell/overlays/Confirm';
import { background, BG_SCREENS, deleteMedia, MAX_MEDIA_BYTES, MEDIA, putMedia, setBackground, type BgScreen, type BgSource } from '../../theme/background';
import type { Game, ThemeEngine } from '../../theme/engine';
import { OPTIONAL_TOKENS, TOKEN_KINDS, TRANSITIONS, validateTheme, type ThemeManifest, type Transition } from '../../theme/validate';
import { extractJson, fixPrompt, themePrompt } from '../../theme/ai';
import { contrastIssues } from '../../theme/contrast';
import { cssPrompt, customCss, MAX_CSS, setCustomCss } from '../../theme/customCss';
import { copyText } from '../../shell/clipboard';
import { errorReport, ISSUES_URL, lastError } from '../../shell/report';
import { extensions } from '../../extensions';
import { BuiltIns, Marketplace } from '../../plugins/Marketplace';
import { roseStatus, startRose, useRose } from '../../plugins/rose';
import { SpotifySettings } from '../../plugins/SpotifyWidget';
import { request } from '../../lcu/request';
import { getJson } from '../profile/data';
import { MemberMenu } from '../lobby/MemberMenu';
import { pct, Range, Row, Seg, Switch } from './controls';
import { ChatRows, GameFields, gamePeeks, humanize, KeysArea, searchNames, useGameData, type GameData } from './game';

type Area = 'look' | 'anim' | 'sound' | 'plug' | 'general' | 'notif' | 'chat' | 'game' | 'keys';

// Ícones de traço simples, um por área.
const ICONS: Record<Area, string> = {
  look: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16M12 4a8 8 0 0 0 0 16z',
  anim: 'M4 12c4-8 12 8 16 0',
  sound: 'M4 9h4l5-4v14l-5-4H4zM17 9a4 4 0 0 1 0 6',
  plug: 'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4',
  general: 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M12 3v3M12 18v3M3 12h3M18 12h3',
  notif: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20h4',
  chat: 'M4 5h16v11H9l-5 4z',
  game: 'M6 9h12a3 3 0 0 1 3 3v2a3 3 0 0 1-5 2l-1-1H9l-1 1a3 3 0 0 1-5-2v-2a3 3 0 0 1 3-3z',
  keys: 'M5 8h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2zM7 12h.01M11 12h.01M15 12h2',
};
const Icon = ({ area }: { area: Area }) => (
  <svg class="rlc-st-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d={ICONS[area]} />
  </svg>
);

const AREAS: Array<[Area, TextKey, TextKey]> = [
  ['look', 'stAppearance', 'stPurLook'],
  ['anim', 'stAreaAnim', 'stPurAnim'],
  ['sound', 'stAreaSound', 'stPurSound'],
  ['plug', 'stAreaPlug', 'stPurPlug'],
  ['general', 'stGeneral', 'stPurGeneral'],
  ['notif', 'stAreaNotif', 'stPurNotif'],
  ['chat', 'stAreaChat', 'stPurChat'],
  ['game', 'stGame', 'stPurGame'],
  ['keys', 'stAreaKeys', 'stPurKeys'],
];

// Linhas das áreas da camada, para a busca achar a configuração pelo nome.
const OWN_ROWS: Partial<Record<Area, TextKey[]>> = {
  look: ['stThemesLol', 'stThemesTft', 'stImport', 'stNewTheme', 'stCss', 'stBackground', 'stBgScreen', 'stBgSource', 'stBgRandom', 'stBgDim', 'stBgBlur', 'stBgPosX', 'stBgPosY'],
  anim: ['stMotion', 'stVideo', 'stReadyAnim', 'stLobbyAnim'],
  sound: ['stAmbient', 'stAmbientVol', 'stClicks', 'stClickVol'],
  plug: ['stRunesAuto', 'stRunesMatchup', 'stRunesLock', 'stAllSplashes', 'mkAutoAccept', 'mkAcceptDelay', 'mkOffline', 'roseName', 'spName', 'spStatus', 'mkTitle'],
  general: ['stLanguage', 'stOpenOnStart', 'perfLite', 'perfPotato', 'stShortcut', 'versionLabel', 'stReport'],
  chat: ['socialPinned'],
};

/** Comparação de busca sem caixa nem acento. */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const LOCALES: Array<[Prefs['locale'], () => string]> = [
  ['auto', () => t('stLangAuto')],
  ['pt', () => 'Português (Brasil)'],
  ['en', () => 'English'],
];
const OPEN: Array<['last' | 'true' | 'false', TextKey]> = [
  ['last', 'stOpenLast'],
  ['true', 'stOpenOn'],
  ['false', 'stOpenOff'],
];
const MOTIONS: Array<[Prefs['motion'], TextKey]> = [
  ['full', 'stMotionFull'],
  ['reduced', 'stMotionReduced'],
  ['off', 'stMotionOff'],
];
const openKey = (v: Prefs['openOnStart']) => (v === null ? 'last' : v ? 'true' : 'false');

/** Resumo do estado atual de cada área, mostrado no painel. */
function peeks(area: Area, themes: ThemeEngine, data: GameData): string[] {
  const p = prefs.value;
  const b = background.value;
  switch (area) {
    case 'look': {
      const src = b.global.kind === 'splash' ? t('stBgSplash') : b.global.kind === 'file' ? t('stPeekCustomBg') : null;
      return [themes.forGame.lol.value.label, ...(src ? [src] : []), ...(b.dim > 0 ? [`${t('stBgDim')} ${pct(b.dim)}`] : [])];
    }
    case 'anim':
      return [t(MOTIONS.find(([m]) => m === p.motion)?.[1] ?? 'stMotionFull'), t(p.video ? 'stPeekVideoOn' : 'stPeekVideoOff')];
    case 'sound':
      return [p.ambient ? `${t('stPeekAmbient')} ${pct(p.ambientVolume)}` : t('stPeekNoAmbient'), p.clicks ? `${t('stPeekClicks')} ${pct(p.clickVolume)}` : t('stPeekNoClicks'), ...gamePeeks(data, 'sound')];
    case 'plug': {
      const on = [p.runesAuto && t('stPeekRunes'), p.runesAuto && p.runesMatchup && t('stPeekMatchup'), p.allSplashes && t('stPeekSplashes'), p.autoAccept && t('stPeekAccept'), p.appearOffline && t('stPeekOffline')].filter((x): x is string => !!x);
      return on.length ? on : [t('stPeekPlugOff')];
    }
    case 'general':
      return [LOCALES.find(([l]) => l === p.locale)?.[1]() ?? t('stLangAuto'), t(OPEN.find(([o]) => o === openKey(p.openOnStart))![1])];
    default:
      return gamePeeks(data, area);
  }
}

/** Configurações em painéis: um por área com o resumo do estado; o clique abre a área. */
/** Sombra sob o cabeçalho fixo só depois que o conteúdo passou por baixo dele. */
const markScrolled = (e: Event) => {
  const el = e.currentTarget as HTMLElement;
  if (el.scrollTop > 4) el.dataset.scrolled = '';
  else delete el.dataset.scrolled;
};

export function Settings({ lcu, themes }: { lcu: Lcu; themes: ThemeEngine }) {
  const [area, setArea] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<ThemeManifest | null>(null);
  const [data, setData] = useGameData();
  const detail = useRef<HTMLDivElement>(null);
  const extra = extensions().settingsTabs;
  // Linha achada pela busca: realça e rola até ela (as do jogo chegam depois, por isso a cada render).
  useEffect(() => {
    if (!focus || !detail.current) return;
    for (const row of detail.current.querySelectorAll<HTMLElement>('[data-name]')) {
      const hit = row.dataset.name === focus;
      if (hit && row.dataset.hit !== 'true') row.scrollIntoView?.({ block: 'center' });
      row.dataset.hit = hit ? 'true' : 'false';
    }
  });
  if (editing) return <ThemeEditor themes={themes} initial={editing} onClose={() => setEditing(null)} />;
  const open = (a: string | null, f: string | null = null) => {
    setArea(a);
    setFocus(f);
  };

  if (area) {
    const own = AREAS.find(([a]) => a === area);
    const ext = extra.find((x) => x.id === area);
    return (
      <section class="rlc-settings rlc-st-panels" data-area={area} onScroll={markScrolled}>
        <header class="rlc-st-head">
          <button type="button" class="rlc-st-back" aria-label={t('back')} onClick={() => open(null)}>
            {`‹ ${t('stTitle')}`}
          </button>
          <h2>
            {own ? <Icon area={own[0]} /> : null}
            {own ? t(own[1]) : ext?.label()}
          </h2>
        </header>
        <div class="rlc-st-detail" ref={detail}>
          {area === 'look' ? <Appearance lcu={lcu} themes={themes} onEdit={setEditing} /> : null}
          {area === 'anim' ? <Animations /> : null}
          {area === 'sound' ? (
            <>
              <Sound />
              <GameFields data={data} setData={setData} area="sound" />
            </>
          ) : null}
          {area === 'plug' ? <Plugins /> : null}
          {area === 'general' ? <General lcu={lcu} themes={themes} /> : null}
          {area === 'chat' ? (
            <section class="rlc-st-card">
              <Row name={t('socialPinned')} desc={t('socialPinnedDesc')}>
                <Switch label={t('socialPinned')} checked={prefs.value.socialPinned} onChange={(socialPinned) => setPrefs({ socialPinned })} />
              </Row>
            </section>
          ) : null}
          {area === 'notif' || area === 'chat' ? (
            <>
              <ChatRows data={data} setData={setData} area={area} />
              <GameFields data={data} setData={setData} area={area} />
            </>
          ) : null}
          {area === 'game' ? <GameFields data={data} setData={setData} area="game" /> : null}
          {area === 'keys' ? <KeysArea data={data} setData={setData} /> : null}
          {ext ? <ext.render lcu={lcu} /> : null}
        </div>
      </section>
    );
  }

  const q = fold(query.trim());
  const names: Array<[Area, string]> = [...Object.entries(OWN_ROWS).flatMap(([a, keys]) => keys.map((k): [Area, string] => [a as Area, t(k)])), ...searchNames(data)];
  const hits = q ? names.filter(([, n]) => fold(n).includes(q)) : [];
  const shown = q ? AREAS.filter(([a, name, purpose]) => fold(t(name)).includes(q) || fold(t(purpose)).includes(q) || hits.some(([h]) => h === a)) : AREAS;
  return (
    <section class="rlc-settings rlc-st-panels" onScroll={markScrolled}>
      <header class="rlc-st-head">
        <h2>{t('stTitle')}</h2>
        <input class="rlc-input rlc-st-search" type="search" placeholder={t('stSearch')} aria-label={t('stSearch')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
      </header>
      {hits.length ? (
        <div class="rlc-st-hits" role="group" aria-label={t('stFound')}>
          {hits.slice(0, 12).map(([a, n]) => (
            <button type="button" key={`${a}:${n}`} class="rlc-st-hit" onClick={() => open(a, n)}>
              <b>{n}</b>
              <span>{t(AREAS.find(([x]) => x === a)![1])}</span>
            </button>
          ))}
        </div>
      ) : null}
      {shown.length ? (
        <div class="rlc-st-grid">
          {shown.map(([a, name, purpose]) => (
            <button type="button" key={a} class="rlc-st-tile" data-area={a} onClick={() => open(a)}>
              <b class="rlc-st-tile-name">
                <Icon area={a} />
                {t(name)}
              </b>
              <span class="rlc-st-purpose">{t(purpose)}</span>
              <span class="rlc-st-peek">
                {peeks(a, themes, data).map((p) => (
                  <span key={p} class="rlc-st-tag">
                    {p}
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p class="rlc-muted">{t('stNothing')}</p>
      )}
      {extra.length ? (
        <nav class="rlc-tabs-text rlc-st-ext" aria-label={t('stExtensions')}>
          {extra.map((x) => (
            <button type="button" key={x.id} onClick={() => open(x.id)}>
              {x.label()}
            </button>
          ))}
        </nav>
      ) : null}
    </section>
  );
}

function Animations() {
  const p = prefs.value;
  return (
    <section class="rlc-st-card">
      <Row name={t('stMotion')} desc={t('stMotionDesc')}>
        <Seg label={t('stMotion')} value={p.motion} options={MOTIONS.map(([m, k]) => [m, t(k)])} onPick={(motion) => setPrefs({ motion })} />
      </Row>
      <Row name={t('stVideo')} desc={t('stVideoDesc')}>
        <Switch label={t('stVideo')} checked={p.video} onChange={(video) => setPrefs({ video })} />
      </Row>
      <Row name={t('stReadyAnim')} desc={t('stReadyAnimDesc')}>
        <Switch label={t('stReadyAnim')} checked={p.readyCheckAnim} onChange={(readyCheckAnim) => setPrefs({ readyCheckAnim })} />
      </Row>
      <Row name={t('stLobbyAnim')} desc={t('stLobbyAnimDesc')}>
        <Switch label={t('stLobbyAnim')} checked={p.lobbyAnim} onChange={(lobbyAnim) => setPrefs({ lobbyAnim })} />
      </Row>
    </section>
  );
}

function Sound() {
  const p = prefs.value;
  return (
    <section class="rlc-st-card">
      <h3>{t('stInClient')}</h3>
      <Row name={t('stAmbient')} desc={t('stAmbientDesc')}>
        <Switch label={t('stAmbient')} checked={p.ambient} onChange={(ambient) => setPrefs({ ambient })} />
      </Row>
      <Row name={t('stAmbientVol')}>
        <Range label={t('stAmbientVol')} value={p.ambientVolume} min={0} max={1} step={0.05} text={pct(p.ambientVolume)} onInput={(ambientVolume) => setPrefs({ ambientVolume })} />
      </Row>
      <Row name={t('stClicks')} desc={t('stClicksDesc')}>
        <Switch label={t('stClicks')} checked={p.clicks} onChange={(clicks) => setPrefs({ clicks })} />
      </Row>
      <Row name={t('stClickVol')}>
        <Range label={t('stClickVol')} value={p.clickVolume} min={0} max={1} step={0.05} text={pct(p.clickVolume)} onInput={(clickVolume) => setPrefs({ clickVolume })} />
      </Row>
      <Row name={t('socChatSound')} desc={t('socChatSoundDesc')}>
        <Switch label={t('socChatSound')} checked={p.chatSound} onChange={(chatSound) => setPrefs({ chatSound })} />
      </Row>
    </section>
  );
}

type BoolPref = 'runesAuto' | 'runesMatchup' | 'runesApplyOnLock' | 'allSplashes' | 'dodge' | 'nameReveal' | 'wallpapers';
const PLUGINS: Array<[BoolPref, TextKey, TextKey]> = [
  ['runesAuto', 'stRunesAuto', 'stRunesAutoDesc'],
  ['runesMatchup', 'stRunesMatchup', 'stRunesMatchupDesc'],
  ['runesApplyOnLock', 'stRunesLock', 'stRunesLockDesc'],
  ['allSplashes', 'stAllSplashes', 'stAllSplashesDesc'],
  ['dodge', 'stDodge', 'stDodgeDesc'],
  ['nameReveal', 'stNameReveal', 'stNameRevealDesc'],
  ['wallpapers', 'stWallpapers', 'stWallpapersDesc'],
];

function Plugins() {
  const p = prefs.value;
  return (
    <>
      <section class="rlc-st-card">
        {PLUGINS.map(([key, name, desc]) => (
          <Row key={key} name={t(name)} desc={t(desc)}>
            <Switch label={t(name)} checked={p[key]} onChange={(on) => setPrefs({ [key]: on })} />
          </Row>
        ))}
        <BuiltIns />
        <RoseRow />
        <SpotifySettings />
      </section>
      <Marketplace />
    </>
  );
}

const ROSE_URL = 'https://github.com/Alban1911/Rose';

/** Integração com o ROSE: liga só com o app rodando (enquanto a tela está aberta, a ponte só sonda). */
function RoseRow() {
  useRose(true);
  const on = prefs.value.rose;
  const status = roseStatus.value;
  const state = status === 'connected' ? t('roseConnected') : status === 'searching' || status === 'off' ? t('roseSearching') : t('roseAbsent');
  return (
    <Row name={t('roseName')} desc={t('roseDesc')}>
      <span class="rlc-st-rose" data-status={status}>
        <span role="status">{state}</span>
        <button type="button" class="rlc-mk-link" onClick={() => void request('POST', '/riotclient/open-url-in-browser', ROSE_URL).catch(() => {})}>
          {t('roseLink')}
        </button>
      </span>
      <input
        type="checkbox"
        role="switch"
        class="rlc-st-switch"
        aria-label={t('roseName')}
        checked={on}
        disabled={!on && status !== 'connected'}
        onChange={(e) => {
          const rose = e.currentTarget.checked;
          setPrefs({ rose });
          if (rose) startRose();
        }}
      />
    </Row>
  );
}

/** Baixa um texto como arquivo (window.open é bloqueado no client; um link com `download` não). */
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const uniqueName = (themes: ThemeEngine, base: string) => {
  const taken = new Set(themes.list.value.map((t) => t.name));
  for (let i = 1; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
};

/** Tema novo a partir de outro: herda dele e copia os tokens para editar. */
function derive(themes: ThemeEngine, from: string, label: string): ThemeManifest {
  const src = themes.manifest(from);
  return { name: uniqueName(themes, 'meu-tema'), label, version: 1, extends: from, tokens: { ...(src?.tokens ?? {}) }, backgrounds: {}, layouts: {} };
}

function Appearance({ lcu, themes, onEdit }: { lcu: Lcu; themes: ThemeEngine; onEdit: (m: ThemeManifest) => void }) {
  const [deleting, setDeleting] = useState<{ name: string; label: string } | null>(null);
  const groups: Array<[Game, TextKey]> = [
    ['lol', 'stThemesLol'],
    ['tft', 'stThemesTft'],
  ];
  const importJson = async (file: File | undefined) => {
    if (!file) return;
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      window.Toast?.error(`${t('themeInvalid')}: JSON`);
      return;
    }
    // Mesmo nome de um tema seu: importa como cópia em vez de substituir sem avisar.
    if (data && typeof data === 'object' && typeof (data as { name?: unknown }).name === 'string') {
      const name = (data as { name: string }).name;
      if (themes.list.value.some((th) => th.user && th.name === name)) data = { ...data, name: uniqueName(themes, name) };
    }
    const result = themes.saveUser(data);
    if (result.ok) window.Toast?.success(t('themeImported'));
    else window.Toast?.error(`${t('themeInvalid')}: ${result.error}`);
  };
  return (
    <div class="rlc-st-appearance">
      {groups.map(([game, label]) => (
        <section key={game} class="rlc-st-group rlc-st-card" data-name={t(label)}>
          <h3>{t(label)}</h3>
          <div class="rlc-st-themes">
            {themes.list.value.map((th) => {
              const m = themes.manifest(th.name);
              const tokens = m?.tokens ?? {};
              return (
                <div key={th.name} class="rlc-st-theme-wrap">
                  <button
                    type="button"
                    class="rlc-st-theme"
                    data-name={th.name}
                    aria-pressed={themes.forGame[game].value.name === th.name}
                    style={{ background: tokens['color.bg'] ?? undefined, borderColor: tokens['color.accent'] ?? undefined }}
                    onClick={() => themes.set(th.name, game)}
                  >
                    <span>{th.label}</span>
                  </button>
                  <MemberMenu
                    items={[
                      { label: t('stEdit'), run: () => onEdit(th.user && m ? m : derive(themes, th.name, `${th.label} (${t('stCopy')})`)) },
                      {
                        label: t('stDuplicate'),
                        run: () => {
                          const r = themes.saveUser(derive(themes, th.name, `${th.label} (${t('stCopy')})`));
                          if (!r.ok) window.Toast?.error(`${t('themeInvalid')}: ${r.error}`);
                        },
                      },
                      { label: t('stExport'), run: () => download(`${th.name}.json`, themes.exportTheme(th.name) ?? '{}') },
                      ...(th.user ? [{ label: t('delete'), run: () => setDeleting(th) }] : []),
                    ]}
                  />
                </div>
              );
            })}
            {game === 'lol' ? (
              <>
                <label class="rlc-st-theme rlc-st-import">
                  {t('stImport')}
                  <input type="file" accept=".json,application/json" hidden onChange={(e) => void importJson(e.currentTarget.files?.[0])} />
                </label>
                <button type="button" class="rlc-st-theme rlc-st-import" onClick={() => onEdit(derive(themes, themes.active.value.name, t('stNewTheme')))}>
                  {t('stNewTheme')}
                </button>
              </>
            ) : null}
          </div>
        </section>
      ))}
      <section class="rlc-st-card">
        <Row name={t('homeBareSetting')} desc={t('homeBareDesc')}>
          <Switch label={t('homeBareSetting')} checked={prefs.value.homeBare} onChange={(homeBare) => setPrefs({ homeBare })} />
        </Row>
        <Row name={t('sidebarGlass')} desc={t('sidebarGlassDesc')}>
          <Switch label={t('sidebarGlass')} checked={prefs.value.sidebarGlass} onChange={(sidebarGlass) => setPrefs({ sidebarGlass })} />
        </Row>
      </section>
      <BackgroundSection lcu={lcu} />
      <CustomCssSection />
      {deleting ? (
        <Confirm
          message={`${t('stDeleteThemeConfirm')} ${deleting.label}?`}
          confirmLabel={t('delete')}
          onConfirm={() => {
            const r = themes.deleteUser(deleting.name);
            if (!r.ok) window.Toast?.error(`${t('stDeleteThemeFailed')}: ${r.error}`);
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}

/** CSS próprio do usuário, com aviso de risco e o mesmo fluxo de IA do editor de tema. */
function CustomCssSection() {
  const saved = customCss.value;
  const [css, setCss] = useState(saved.css);
  const [ask, setAsk] = useState('');
  const [error, setError] = useState<string | null>(null);
  const save = (on: boolean, text = css) => {
    const e = setCustomCss({ on: on && text.trim() !== '', css: text });
    setError(e);
    if (!e) window.Toast?.success(t('themeSaved'));
  };
  return (
    <section class="rlc-st-css rlc-st-card" data-name={t('stCss')}>
      <h3>{t('stCss')}</h3>
      <p class="rlc-st-css-warn">{t('stCssWarn')}</p>
      <Row name={t('stCssOn')} desc={t('stCssOnDesc')}>
        <Switch label={t('stCssOn')} checked={saved.on} onChange={(on) => save(on, saved.css)} />
      </Row>
      <textarea class="rlc-input rlc-st-css-code" rows={10} spellcheck={false} maxLength={MAX_CSS} aria-label={t('stCss')} placeholder="#rlc-root .rlc-button { ... }" value={css} onInput={(e) => setCss(e.currentTarget.value)} />
      <textarea class="rlc-input" rows={2} aria-label={t('stAiAsk')} placeholder={t('stCssAsk')} value={ask} onInput={(e) => setAsk(e.currentTarget.value)} />
      {error ? <p class="rlc-ed-error">{`${t('stCssBlocked')}: ${error}`}</p> : null}
      <div class="rlc-chip-row">
        <button type="button" class="rlc-button" data-variant="primary" data-css="save" onClick={() => save(true)}>
          {t('save')}
        </button>
        <button type="button" class="rlc-button" data-css="ai" onClick={() => void copyText(cssPrompt(css, ask), t('stAiCopied'))}>
          {t('stAiCopy')}
        </button>
      </div>
    </section>
  );
}

const SCREEN_LABEL: Record<BgScreen, TextKey> = { home: 'home', lobby: 'lobby', profile: 'navProfile', collection: 'navCollection', postgame: 'railPostGame' };
/** Escurecer para no máximo 85%: acima disso o fundo some e a tela parece apagada. */
export const DIM_MAX = 0.85;

/** Fundo personalizado: por cima do tema, sem alterá-lo. */
function BackgroundSection({ lcu }: { lcu: Lcu }) {
  const b = background.value;
  const [screen, setScreen] = useState<BgScreen | 'global'>('global');
  const [picking, setPicking] = useState(false);
  const [walls, setWalls] = useState(false);
  const current = screen === 'global' ? b.global : (b.screens[screen] ?? { kind: 'none' });
  const setSource = (src: BgSource) => setBackground(screen === 'global' ? { ...b, global: src } : { ...b, scope: 'screens', screens: { ...b.screens, [screen]: src } });
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    // Tipo e tamanho checados aqui: o que não passa em `sanitizeBg` sumiria na próxima abertura.
    if (!MEDIA.test(file.type)) return void window.Toast?.error(t('stFileType'));
    if (file.size > MAX_MEDIA_BYTES) return void window.Toast?.error(t('stFileTooBig'));
    const key = `bg-${Date.now()}`;
    const saved = await putMedia(key, file);
    if (!saved) return void window.Toast?.error(t('stFileFailed'));
    // Grande demais para a cópia que sobrevive: vale só até fechar o client.
    if (saved === 'session') window.Toast?.error(t('stFileSession'));
    const previous = current.kind === 'file' ? current.key : null;
    setSource({ kind: 'file', key, mime: file.type });
    // O arquivo anterior desta fonte só sai se nenhuma outra fonte ainda usa.
    const latest = background.value;
    const inUse = [latest.global, ...Object.values(latest.screens)].some((s) => s?.kind === 'file' && s.key === previous);
    if (previous && !inUse) void deleteMedia(previous);
  };
  const slider = (label: TextKey, desc: TextKey, key: 'dim' | 'blur' | 'posX' | 'posY', max: number, step: number, text: (v: number) => string) => {
    const value = Math.min(max, b[key]);
    return (
      <Row name={t(label)} desc={t(desc)}>
        <Range label={t(label)} dataKey={key} value={value} min={0} max={max} step={step} text={text(value)} onInput={(v) => setBackground({ ...b, [key]: Math.min(max, Math.max(0, v)) })} />
      </Row>
    );
  };
  return (
    <section class="rlc-st-bg rlc-st-card" data-name={t('stBackground')}>
      <h3>{t('stBackground')}</h3>
      <Row name={t('stBgScreen')} desc={t('stBgScreenDesc')}>
        <div class="rlc-chip-row">
          {(['global', ...BG_SCREENS] as const).map((s) => (
            <button type="button" key={s} class="rlc-queue-chip" aria-pressed={screen === s} onClick={() => setScreen(s)}>
              {s === 'global' ? t('stBgAll') : t(SCREEN_LABEL[s])}
            </button>
          ))}
        </div>
      </Row>
      <Row name={t('stBgSource')} desc={t('stBgSourceDesc')}>
        <div class="rlc-chip-row">
          <button type="button" class="rlc-queue-chip" aria-pressed={current.kind === 'none'} onClick={() => setSource({ kind: 'none' })}>
            {t('stBgNone')}
          </button>
          <button type="button" class="rlc-queue-chip" aria-pressed={current.kind === 'splash'} onClick={() => setPicking(!picking)}>
            {t('stBgSplash')}
          </button>
          {prefs.value.wallpapers ? (
            <button type="button" class="rlc-queue-chip" aria-pressed={current.kind === 'local' || walls} onClick={() => (setWalls(!walls), setPicking(false))}>
              {t('wpTitle')}
            </button>
          ) : null}
          <label class="rlc-queue-chip" aria-pressed={current.kind === 'file'}>
            {t('stBgFile')}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/webm,video/mp4" hidden onChange={(e) => void onFile(e.currentTarget.files?.[0])} />
          </label>
        </div>
      </Row>
      {walls && prefs.value.wallpapers ? <Wallpapers current={current} onPick={setSource} /> : null}
      {picking ? <SplashPicker lcu={lcu} onPick={(skinId) => (setSource({ kind: 'splash', skinId }), setPicking(false))} /> : null}
      {screen === 'global' ? (
        <Row name={t('stBgRandom')} desc={t('stBgRandomDesc')}>
          <Switch label={t('stBgRandom')} checked={b.random} onChange={(random) => setBackground({ ...b, random })} />
        </Row>
      ) : null}
      {slider('stBgDim', 'stBgDimDesc', 'dim', DIM_MAX, 0.05, pct)}
      {slider('stBgBlur', 'stBgBlurDesc', 'blur', 20, 1, (v) => `${v}px`)}
      {slider('stBgPosX', 'stBgPosDesc', 'posX', 100, 1, (v) => `${v}%`)}
      {slider('stBgPosY', 'stBgPosDesc', 'posY', 100, 1, (v) => `${v}%`)}
    </section>
  );
}

/** Splash de qualquer campeão ou skin: busca o campeão, escolhe a skin. */
function SplashPicker({ lcu, onPick }: { lcu: Lcu; onPick: (skinId: number) => void }) {
  const [champions, setChampions] = useState<Array<{ id: number; name: string }>>([]);
  const [query, setQuery] = useState('');
  const [champion, setChampion] = useState<number | null>(null);
  const [skins, setSkins] = useState<Array<{ id: number; name: string; tilePath?: string }>>([]);
  useEffect(() => {
    void lcu.game.champions().then((m) => setChampions([...m.values()].sort((a, b) => a.name.localeCompare(b.name))));
  }, [lcu]);
  useEffect(() => {
    setSkins([]);
    if (!champion) return;
    let live = true;
    void getJson<{ skins?: Array<{ id: number; name: string; tilePath?: string }> }>(`/lol-game-data/assets/v1/champions/${champion}.json`).then((c) => live && setSkins(c?.skins ?? []));
    return () => void (live = false);
  }, [champion]);
  const q = query.trim().toLowerCase();
  return (
    <div class="rlc-st-picker">
      <input class="rlc-input" placeholder={t('searchChampion')} aria-label={t('searchChampion')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
      <div class="rlc-chip-row">
        {champions
          .filter((c) => q && c.name.toLowerCase().includes(q))
          .slice(0, 12)
          .map((c) => (
            <button type="button" key={c.id} class="rlc-queue-chip" aria-pressed={champion === c.id} onClick={() => setChampion(c.id)}>
              {c.name}
            </button>
          ))}
      </div>
      <div class="rlc-cn-strip">
        {skins.map((s) => (
          <button type="button" key={s.id} class="rlc-cn-card" aria-label={s.name} title={s.name} data-owned="true" style={s.tilePath ? { backgroundImage: `url("${s.tilePath}")` } : undefined} onClick={() => onPick(s.id)}>
            <span>{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const LITE: Array<[Prefs['lite'], TextKey]> = [
  ['auto', 'perfLiteAuto'],
  ['on', 'perfLiteOn'],
  ['off', 'perfLiteOff'],
];

/** "Ativar modo de especificação baixa" do client oficial: lido da LCU ao abrir; some se a LCU não responder. */
function PotatoRow() {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    void readPotato().then((v) => live && setOn(v));
    return () => void (live = false);
  }, []);
  if (on === null) return null;
  return (
    <Row name={t('perfPotato')} desc={t('perfPotatoDesc')}>
      <Switch label={t('perfPotato')} checked={on} onChange={(v, el) => void writePotato(v).then(() => setOn(v), () => (el.checked = on))} />
    </Row>
  );
}

function General({ lcu, themes }: { lcu: Lcu; themes: ThemeEngine }) {
  const p = prefs.value;
  const report = () => errorReport({ phase: lcu.gameflowPhase.value.data ?? null, theme: themes.forGame.lol.value.name, tftTheme: themes.forGame.tft.value.name });
  return (
    <section class="rlc-st-card rlc-st-general">
      <Row name={t('stLanguage')} desc={t('stLanguageDesc')}>
        <Seg label={t('stLanguage')} value={p.locale} options={LOCALES.map(([l, label]) => [l, label()])} onPick={(locale) => setPrefs({ locale })} />
      </Row>
      <Row name={t('stOpenOnStart')} desc={t('stOpenOnStartDesc')}>
        <Seg label={t('stOpenOnStart')} value={openKey(p.openOnStart)} options={OPEN.map(([o, k]) => [o, t(k)])} onPick={(v) => setPrefs({ openOnStart: v === 'last' ? null : v === 'true' })} />
      </Row>
      <Row name={t('stFullscreen')} desc={t('stFullscreenDesc')}>
        <Switch label={t('stFullscreen')} checked={p.fullscreen} onChange={(fullscreen) => setPrefs({ fullscreen })} />
      </Row>
      <Row name={t('perfLite')} desc={t(p.lite === 'auto' ? (isLite('auto', liteAuto.value) ? 'perfLiteDescAutoOn' : 'perfLiteDescAutoOff') : 'perfLiteDesc')}>
        <Seg label={t('perfLite')} value={p.lite} options={LITE.map(([v, k]) => [v, t(k)])} onPick={(lite) => setPrefs({ lite })} />
      </Row>
      <PotatoRow />
      <Row name={t('stShortcut')} desc={t('stShortcutDesc')}>
        <span class="rlc-st-key">Ctrl + Shift + F12</span>
      </Row>
      <Row name={t('versionLabel')}>
        <span class="rlc-muted">{__RLC_VERSION__}</span>
      </Row>
      <Row name={t('stReport')} desc={t(lastError() ? 'stReportDescErr' : 'stReportDesc')}>
        <div class="rlc-chip-row">
          <button type="button" class="rlc-button" data-report="copy" onClick={() => void copyText(report(), t('stAiCopied'))}>
            {t('stReportCopy')}
          </button>
          <a class="rlc-button" href={ISSUES_URL} target="_blank" rel="noreferrer">
            {t('stReportIssue')}
          </a>
        </div>
      </Row>
      {update.value ? (
        <div class="rlc-st-update">
          <span>{`${t('updReady')} ${update.value.version}`}</span>
          <button type="button" class="rlc-button" data-variant="primary" disabled={!canReload.value} title={canReload.value ? undefined : t('updReloadLater')} onClick={() => reloadForUpdate()}>
            {t('updReload')}
          </button>
        </div>
      ) : null}
    </section>
  );
}

const FONTS = ['Quicksand, system-ui, sans-serif', 'system-ui, sans-serif', 'Georgia, serif', '"Segoe UI", sans-serif', '"Trebuchet MS", sans-serif', 'monospace'];
const EASINGS = ['ease', 'ease-in-out', 'linear', 'cubic-bezier(0.7, 0, 0.2, 1)', 'cubic-bezier(0.2, 0.8, 0.2, 1)'];
const TRANSITION_LABEL: Record<Transition, TextKey> = { wipe: 'stTrWipe', fade: 'stTrFade', slide: 'stTrSlide', zoom: 'stTrZoom' };
// Nomes legíveis no editor: a pilha de fontes mostra só a primeira família; a curva, um nome.
const fontLabel = (f: string) => {
  const first = f.split(',')[0]!.trim().replace(/^["']|["']$/g, '');
  return first === 'system-ui' ? t('stFontSystem') : first === 'monospace' ? t('stFontMono') : first;
};
const easingLabel = (e: string) => t(`stEase_${e}` as TextKey) || t('stEaseCustom');
const tokenLabel = (token: string) => t(`stTok_${token}` as TextKey) || humanize(token.replace('.', '_'));

/** Editor de tema: painel à esquerda, prévia ao vivo à direita com o tema aplicado só nela. */
function ThemeEditor({ themes, initial, onClose }: { themes: ThemeEngine; initial: ThemeManifest; onClose: () => void }) {
  const [draft, setDraft] = useState<ThemeManifest>(initial);
  const [error, setError] = useState<string | null>(null);
  const [ask, setAsk] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const resolved = themes.resolveDraft(draft);
  useLayoutEffect(() => {
    if (preview.current && resolved.ok) applyTheme(preview.current, resolved.theme);
  });
  const setToken = (token: string, value: string) => {
    const tokens = { ...draft.tokens, [token]: value };
    // Opcional apagado volta ao padrão do CSS, em vez de virar um valor vazio que o validador recusa.
    if (value === '' && OPTIONAL_TOKENS.has(token)) delete tokens[token];
    setDraft({ ...draft, tokens });
  };
  const choice = (token: string, value: string, list: string[], label: (v: string) => string) => (
    <select class="rlc-input" data-token={token} value={value} onChange={(e) => setToken(token, e.currentTarget.value)}>
      {[value, ...list.filter((f) => f !== value)].filter(Boolean).map((f) => (
        <option key={f} value={f}>
          {label(f)}
        </option>
      ))}
    </select>
  );
  const field = (token: string) => {
    const kind = TOKEN_KINDS[token];
    const value = draft.tokens[token] ?? '';
    if (OPTIONAL_TOKENS.has(token) && value === '') return <input class="rlc-input" data-token={token} value="" placeholder={t('stTokDefault')} onChange={(e) => setToken(token, e.currentTarget.value.trim())} />;
    if (kind === 'color' && /^#[0-9a-f]{6}$/i.test(value || '#000000'))
      return <input type="color" data-token={token} value={value || '#000000'} onInput={(e) => setToken(token, e.currentTarget.value)} />;
    if (kind === 'font') return choice(token, value, FONTS, fontLabel);
    if (kind === 'easing') return choice(token, value, EASINGS, easingLabel);
    if (kind === 'length' || kind === 'duration') {
      const unit = kind === 'duration' ? 'ms' : 'px';
      return <input type="range" data-token={token} min={0} max={kind === 'duration' ? 1000 : 60} value={parseFloat(value) || 0} onInput={(e) => setToken(token, `${e.currentTarget.value}${unit}`)} />;
    }
    return <input class="rlc-input" data-token={token} value={value} onInput={(e) => setToken(token, e.currentTarget.value)} />;
  };
  // Resposta da IA colada: só entra no rascunho se passar no validador; o erro vai pronto para devolver à IA.
  const applyReply = () => {
    let parsed: unknown;
    try {
      parsed = extractJson(reply ?? '');
    } catch {
      return setError(`${t('themeInvalid')}: JSON`);
    }
    const r = validateTheme(parsed);
    if (!r.ok) return setError(r.error);
    setError(null);
    setReply(null);
    setDraft(r.theme);
  };
  const warnings = contrastIssues(resolved.ok ? resolved.theme.tokens : draft.tokens);
  const save = () => {
    const r = themes.saveUser(draft);
    if (r.ok) {
      setError(null);
      window.Toast?.success(t('themeSaved'));
    } else setError(r.error);
  };
  return (
    <section class="rlc-editor">
      <aside class="rlc-ed-panel">
        <input class="rlc-input rlc-ed-name" aria-label={t('stThemeName')} value={draft.label} maxLength={40} onInput={(e) => setDraft({ ...draft, label: e.currentTarget.value })} />
        {Object.keys(TOKEN_KINDS)
          .filter((token) => !OPTIONAL_TOKENS.has(token))
          .map((token) => (
            <label key={token} class="rlc-ed-field">
              <span>{tokenLabel(token)}</span>
              {field(token)}
            </label>
          ))}
        <details class="rlc-ed-more">
          <summary>{t('stTokAdvanced')}</summary>
          {[...OPTIONAL_TOKENS].map((token) => (
            <label key={token} class="rlc-ed-field">
              <span>{tokenLabel(token)}</span>
              {field(token)}
            </label>
          ))}
        </details>
        <label class="rlc-ed-field">
          <span>{t('stTransition')}</span>
          <select class="rlc-input" value={draft.transition ?? 'wipe'} onChange={(e) => setDraft({ ...draft, transition: e.currentTarget.value as ThemeManifest['transition'] })}>
            {TRANSITIONS.map((tr) => (
              <option key={tr} value={tr}>
                {t(TRANSITION_LABEL[tr])}
              </option>
            ))}
          </select>
        </label>
        {warnings.length ? (
          <ul class="rlc-ed-warn" aria-label={t('stContrast')}>
            {warnings.map((w) => (
              <li key={`${w.text}-${w.background}`}>{`${t('stContrast')}: ${tokenLabel(w.text)} / ${tokenLabel(w.background)} ${w.ratio}:1 (${t('stContrastMin')} ${w.min}:1)`}</li>
            ))}
          </ul>
        ) : null}
        <section class="rlc-ed-ai">
          <h3>{t('stAiTitle')}</h3>
          <p class="rlc-muted">{t('stAiDesc')}</p>
          <textarea class="rlc-input" rows={2} aria-label={t('stAiAsk')} placeholder={t('stAiAsk')} value={ask} onInput={(e) => setAsk(e.currentTarget.value)} />
          <div class="rlc-chip-row">
            <button type="button" class="rlc-button" data-ai="copy" onClick={() => void copyText(themePrompt(draft, ask), t('stAiCopied'))}>
              {t('stAiCopy')}
            </button>
            <button type="button" class="rlc-button" data-ai="paste" aria-expanded={reply !== null} onClick={() => setReply(reply === null ? '' : null)}>
              {t('stAiPaste')}
            </button>
          </div>
          {reply !== null ? (
            <>
              <textarea class="rlc-input rlc-ed-reply" rows={6} aria-label={t('stAiPaste')} placeholder={t('stAiPasteHint')} value={reply} onInput={(e) => setReply(e.currentTarget.value)} />
              <button type="button" class="rlc-button" data-variant="primary" data-ai="apply" disabled={!reply.trim()} onClick={applyReply}>
                {t('stAiApply')}
              </button>
            </>
          ) : null}
        </section>
        {error ? (
          <div class="rlc-ed-error">
            <p>{error}</p>
            <button type="button" class="rlc-button" data-ai="fix" onClick={() => void copyText(fixPrompt(error), t('stAiCopied'))}>
              {t('stAiCopyFix')}
            </button>
          </div>
        ) : resolved.ok ? null : (
          <p class="rlc-ed-error">{resolved.error}</p>
        )}
        <div class="rlc-dialog-actions">
          <button type="button" class="rlc-button" data-variant="primary" onClick={save}>
            {t('save')}
          </button>
          <button type="button" class="rlc-button" onClick={() => setDraft(initial)}>
            {t('stUndo')}
          </button>
          <button type="button" class="rlc-button" onClick={onClose}>
            {t('back')}
          </button>
        </div>
      </aside>
      <div class="rlc-ed-preview" ref={preview}>
        <div class="rlc-ed-sample">
          <h1>{draft.label}</h1>
          <div class="rlc-chip-row">
            <button type="button" class="rlc-queue-chip" aria-pressed="true">
              {t('filterRanked')}
            </button>
            <button type="button" class="rlc-queue-chip">
              {t('filterNormal')}
            </button>
          </div>
          <div class="rlc-invite">
            <span class="rlc-invite-title">{t('partyInvite')}</span>
            <strong>Zeca</strong>
          </div>
          <button type="button" class="rlc-button" data-variant="primary">
            {t('play')}
          </button>
        </div>
      </div>
    </section>
  );
}
