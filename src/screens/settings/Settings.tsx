import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import { prefs, setPrefs, type Prefs } from '../../shell/prefs';
import { update } from '../../shell/update';
import { applyTheme } from '../../theme/apply';
import { Confirm } from '../../shell/overlays/Confirm';
import { background, BG_SCREENS, deleteMedia, MAX_MEDIA_BYTES, MEDIA, putMedia, setBackground, type BgScreen, type BgSource } from '../../theme/background';
import type { Game, ThemeEngine } from '../../theme/engine';
import { TOKEN_KINDS, TRANSITIONS, type ThemeManifest } from '../../theme/validate';
import { extensions } from '../../extensions';
import { getJson } from '../profile/data';
import { MemberMenu } from '../lobby/MemberMenu';

type Tab = 'appearance' | 'layouts' | 'general' | 'game';
const TABS: Array<[Tab, TextKey]> = [
  ['appearance', 'stAppearance'],
  ['layouts', 'stLayouts'],
  ['general', 'stGeneral'],
  ['game', 'stGame'],
];

/** Configurações: aparência (temas, fundo), layouts, geral e as configurações do jogo. */
export function Settings({ lcu, themes }: { lcu: Lcu; themes: ThemeEngine }) {
  const [tab, setTab] = useState<Tab | string>('appearance');
  const extra = extensions().settingsTabs;
  const [editing, setEditing] = useState<ThemeManifest | null>(null);
  if (editing) return <ThemeEditor themes={themes} initial={editing} onClose={() => setEditing(null)} />;
  return (
    <section class="rlc-settings">
      <nav class="rlc-tabs-text">
        {TABS.map(([k, label]) => (
          <button type="button" key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
            {t(label)}
          </button>
        ))}
        {extra.map((x) => (
          <button type="button" key={x.id} aria-current={tab === x.id ? 'page' : undefined} onClick={() => setTab(x.id)}>
            {x.label()}
          </button>
        ))}
      </nav>
      <div class="rlc-st-body">
        {tab === 'appearance' ? <Appearance lcu={lcu} themes={themes} onEdit={setEditing} /> : null}
        {tab === 'layouts' ? <Layouts /> : null}
        {tab === 'general' ? <General /> : null}
        {tab === 'game' ? <GameSettings /> : null}
        {extra.map((x) => (tab === x.id ? <x.render key={x.id} lcu={lcu} /> : null))}
      </div>
    </section>
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
  const p = prefs.value;
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
        <section key={game} class="rlc-st-group">
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
      <section class="rlc-st-row">
        <label>
          {t('stMotion')}
          <select class="rlc-input" aria-label={t('stMotion')} value={p.motion} onChange={(e) => setPrefs({ motion: e.currentTarget.value as Prefs['motion'] })}>
            <option value="full">{t('stMotionFull')}</option>
            <option value="reduced">{t('stMotionReduced')}</option>
            <option value="off">{t('stMotionOff')}</option>
          </select>
        </label>
        <label class="rlc-st-check">
          <input type="checkbox" checked={p.video} onChange={(e) => setPrefs({ video: e.currentTarget.checked })} />
          {t('stVideo')}
        </label>
      </section>
      <BackgroundSection lcu={lcu} />
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

const SCREEN_LABEL: Record<BgScreen, TextKey> = { home: 'home', lobby: 'lobby', profile: 'navProfile', collection: 'navCollection', postgame: 'railPostGame' };

/** Fundo personalizado: por cima do tema, sem alterá-lo. */
function BackgroundSection({ lcu }: { lcu: Lcu }) {
  const b = background.value;
  const [screen, setScreen] = useState<BgScreen | 'global'>('global');
  const [picking, setPicking] = useState(false);
  const current = screen === 'global' ? b.global : (b.screens[screen] ?? { kind: 'none' });
  const setSource = (src: BgSource) => setBackground(screen === 'global' ? { ...b, global: src } : { ...b, scope: 'screens', screens: { ...b.screens, [screen]: src } });
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    // Tipo e tamanho checados aqui: o que não passa em `sanitizeBg` sumiria na próxima abertura.
    if (!MEDIA.test(file.type)) return void window.Toast?.error(t('stFileType'));
    if (file.size > MAX_MEDIA_BYTES) return void window.Toast?.error(t('stFileTooBig'));
    const key = `bg-${Date.now()}`;
    if (!(await putMedia(key, file))) return void window.Toast?.error(t('stFileFailed'));
    const previous = current.kind === 'file' ? current.key : null;
    setSource({ kind: 'file', key, mime: file.type });
    // O arquivo anterior desta fonte só sai se nenhuma outra fonte ainda usa.
    const latest = background.value;
    const inUse = [latest.global, ...Object.values(latest.screens)].some((s) => s?.kind === 'file' && s.key === previous);
    if (previous && !inUse) void deleteMedia(previous);
  };
  const slider = (label: TextKey, key: 'dim' | 'blur' | 'posX' | 'posY', max: number, step: number) => (
    <label class="rlc-st-slider">
      {t(label)}
      <input type="range" min={0} max={max} step={step} value={b[key]} onInput={(e) => setBackground({ ...b, [key]: Number(e.currentTarget.value) })} />
    </label>
  );
  return (
    <section class="rlc-st-bg">
      <h3>{t('stBackground')}</h3>
      <div class="rlc-chip-row">
        {(['global', ...BG_SCREENS] as const).map((s) => (
          <button type="button" key={s} class="rlc-queue-chip" aria-pressed={screen === s} onClick={() => setScreen(s)}>
            {s === 'global' ? t('stBgAll') : t(SCREEN_LABEL[s])}
          </button>
        ))}
      </div>
      <div class="rlc-chip-row">
        <button type="button" class="rlc-queue-chip" aria-pressed={current.kind === 'none'} onClick={() => setSource({ kind: 'none' })}>
          {t('stBgNone')}
        </button>
        <button type="button" class="rlc-queue-chip" aria-pressed={current.kind === 'splash'} onClick={() => setPicking(!picking)}>
          {t('stBgSplash')}
        </button>
        <label class="rlc-queue-chip" aria-pressed={current.kind === 'file'}>
          {t('stBgFile')}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/webm,video/mp4" hidden onChange={(e) => void onFile(e.currentTarget.files?.[0])} />
        </label>
        {screen === 'global' ? (
          <label class="rlc-st-check">
            <input type="checkbox" checked={b.random} onChange={(e) => setBackground({ ...b, random: e.currentTarget.checked })} />
            {t('stBgRandom')}
          </label>
        ) : null}
      </div>
      {picking ? <SplashPicker lcu={lcu} onPick={(skinId) => (setSource({ kind: 'splash', skinId }), setPicking(false))} /> : null}
      <div class="rlc-st-sliders">
        {slider('stBgDim', 'dim', 0.9, 0.05)}
        {slider('stBgBlur', 'blur', 20, 1)}
        {slider('stBgPosX', 'posX', 100, 1)}
        {slider('stBgPosY', 'posY', 100, 1)}
      </div>
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

function Layouts() {
  const p = prefs.value;
  return (
    <section class="rlc-st-group">
      <h3>{t('stChampSelectLayout')}</h3>
      <div class="rlc-chip-row">
        <button type="button" class="rlc-queue-chip" aria-pressed={p.champSelectLayout === 'cinematic'} onClick={() => setPrefs({ champSelectLayout: 'cinematic' })}>
          {t('stCinematic')}
        </button>
        <button type="button" class="rlc-queue-chip" aria-pressed={p.champSelectLayout === 'classic'} onClick={() => setPrefs({ champSelectLayout: 'classic' })}>
          {t('stClassic')}
        </button>
      </div>
    </section>
  );
}

function General() {
  const p = prefs.value;
  return (
    <section class="rlc-st-group rlc-st-general">
      <label>
        {t('stLanguage')}
        <select class="rlc-input" aria-label={t('stLanguage')} value={p.locale} onChange={(e) => setPrefs({ locale: e.currentTarget.value as Prefs['locale'] })}>
          <option value="auto">{t('stLangAuto')}</option>
          <option value="pt">Português (Brasil)</option>
          <option value="en">English</option>
        </select>
      </label>
      <label>
        {t('stOpenOnStart')}
        <select class="rlc-input" aria-label={t('stOpenOnStart')} value={p.openOnStart === null ? 'last' : String(p.openOnStart)} onChange={(e) => setPrefs({ openOnStart: e.currentTarget.value === 'last' ? null : e.currentTarget.value === 'true' })}>
          <option value="last">{t('stOpenLast')}</option>
          <option value="true">{t('stOpenOn')}</option>
          <option value="false">{t('stOpenOff')}</option>
        </select>
      </label>
      <p class="rlc-muted">{`${t('stShortcut')}: Ctrl+Shift+F12`}</p>
      <p class="rlc-muted">{`${t('versionLabel')} ${__RLC_VERSION__}`}</p>
      {update.value ? (
        <div class="rlc-st-update">
          <span>{`${t('updateAvailable')} ${update.value.version}`}</span>
          <button type="button" class="rlc-button" data-variant="primary" onClick={() => void request('POST', '/riotclient/open-url-in-browser', update.value!.url).catch(() => {})}>
            {t('updateOpen')}
          </button>
        </div>
      ) : null}
    </section>
  );
}

type Schema = Record<string, Record<string, { default: unknown }>>;
type Values = Record<string, Record<string, unknown>>;

/** Configurações do jogo geradas do esquema da LCU; cada mudança grava (PATCH + save). */
function GameSettings() {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [values, setValues] = useState<Values>({});
  useEffect(() => {
    void getJson<Schema>('/lol-game-settings/v1/game-settings-schema').then(setSchema);
    void getJson<Values>('/lol-game-settings/v1/game-settings').then((v) => setValues(v ?? {}));
  }, []);
  const save = async (cat: string, key: string, value: unknown, el: HTMLInputElement) => {
    const previous = values[cat]?.[key] ?? schema?.[cat]?.[key]?.default;
    try {
      await request('PATCH', '/lol-game-settings/v1/game-settings', { [cat]: { [key]: value } });
      await request('POST', '/lol-game-settings/v1/save');
      setValues((v) => ({ ...v, [cat]: { ...(v[cat] ?? {}), [key]: value } }));
    } catch {
      // O Toast já saiu em `request`. O navegador já mudou o controle: volta ao valor que a LCU tem.
      if (el.type === 'checkbox') el.checked = previous === true;
      else el.value = String(previous);
    }
  };
  if (!schema) return <p class="rlc-muted">{t('loadingQueues')}</p>;
  const label = (k: string) => k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  return (
    <div class="rlc-st-game">
      {Object.entries(schema).map(([cat, fields]) => (
        <details key={cat} class="rlc-st-cat" open={cat === 'General'}>
          <summary>{label(cat)}</summary>
          <div class="rlc-st-fields">
            {Object.entries(fields).map(([key, def]) => {
            const current = values[cat]?.[key] ?? def.default;
            if (typeof def.default === 'boolean')
              return (
                <label key={key} class="rlc-st-check">
                  <input type="checkbox" data-key={`${cat}.${key}`} checked={current === true} onChange={(e) => void save(cat, key, e.currentTarget.checked, e.currentTarget)} />
                  {label(key)}
                </label>
              );
            if (typeof def.default === 'number')
              return (
                <label key={key} class="rlc-st-slider">
                  {label(key)}
                  <input
                    type="number"
                    data-key={`${cat}.${key}`}
                    value={Number(current)}
                    step={Number.isInteger(def.default) ? 1 : 'any'}
                    onChange={(e) => {
                      // Campo vazio vira 0 em Number(''): não grava. Campo de inteiro (modos, índices) grava inteiro.
                      const raw = e.currentTarget.value.trim();
                      const n = Number(raw);
                      if (raw === '' || !Number.isFinite(n)) return void (e.currentTarget.value = String(current));
                      void save(cat, key, Number.isInteger(def.default) ? Math.round(n) : n, e.currentTarget);
                    }}
                  />
                </label>
              );
            return null;
          })}
          </div>
        </details>
      ))}
    </div>
  );
}

const FONTS = ['Quicksand, system-ui, sans-serif', 'system-ui, sans-serif', 'Georgia, serif', '"Segoe UI", sans-serif', '"Trebuchet MS", sans-serif', 'monospace'];
const EASINGS = ['ease', 'ease-in-out', 'linear', 'cubic-bezier(0.7, 0, 0.2, 1)', 'cubic-bezier(0.2, 0.8, 0.2, 1)'];

/** Editor de tema: painel à esquerda, prévia ao vivo à direita com o tema aplicado só nela. */
function ThemeEditor({ themes, initial, onClose }: { themes: ThemeEngine; initial: ThemeManifest; onClose: () => void }) {
  const [draft, setDraft] = useState<ThemeManifest>(initial);
  const [error, setError] = useState<string | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const resolved = themes.resolveDraft(draft);
  useLayoutEffect(() => {
    if (preview.current && resolved.ok) applyTheme(preview.current, resolved.theme);
  });
  const setToken = (token: string, value: string) => setDraft({ ...draft, tokens: { ...draft.tokens, [token]: value } });
  const field = (token: string) => {
    const kind = TOKEN_KINDS[token];
    const value = draft.tokens[token] ?? '';
    if (kind === 'color' && /^#[0-9a-f]{6}$/i.test(value || '#000000'))
      return <input type="color" data-token={token} value={value || '#000000'} onInput={(e) => setToken(token, e.currentTarget.value)} />;
    if (kind === 'font')
      return (
        <select class="rlc-input" data-token={token} value={value} onChange={(e) => setToken(token, e.currentTarget.value)}>
          {[value, ...FONTS.filter((f) => f !== value)].filter(Boolean).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      );
    if (kind === 'easing')
      return (
        <select class="rlc-input" data-token={token} value={value} onChange={(e) => setToken(token, e.currentTarget.value)}>
          {[value, ...EASINGS.filter((f) => f !== value)].filter(Boolean).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      );
    if (kind === 'length' || kind === 'duration') {
      const unit = kind === 'duration' ? 'ms' : 'px';
      return <input type="range" data-token={token} min={0} max={kind === 'duration' ? 1000 : 60} value={parseFloat(value) || 0} onInput={(e) => setToken(token, `${e.currentTarget.value}${unit}`)} />;
    }
    return <input class="rlc-input" data-token={token} value={value} onInput={(e) => setToken(token, e.currentTarget.value)} />;
  };
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
        {Object.keys(TOKEN_KINDS).map((token) => (
          <label key={token} class="rlc-ed-field">
            <span>{token}</span>
            {field(token)}
          </label>
        ))}
        <label class="rlc-ed-field">
          <span>{t('stTransition')}</span>
          <select class="rlc-input" value={draft.transition ?? 'wipe'} onChange={(e) => setDraft({ ...draft, transition: e.currentTarget.value as ThemeManifest['transition'] })}>
            {TRANSITIONS.map((tr) => (
              <option key={tr} value={tr}>
                {tr}
              </option>
            ))}
          </select>
        </label>
        {error ? <p class="rlc-ed-error">{error}</p> : resolved.ok ? null : <p class="rlc-ed-error">{resolved.error}</p>}
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
