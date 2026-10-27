import { useEffect, useState } from 'preact/hooks';
import { t } from '../i18n';
import type { BgSource } from '../theme/background';
import { findHelper, helperBase, loadWallpapers, openUserFolder, resetHelper, wallpaperUrl, type Wallpaper } from '../theme/wallpapers';
import { Loader } from './Loader';

type Tab = 'engine' | 'user';
type State = { status: 'loading' } | { status: 'absent' } | { status: 'ready'; list: Wallpaper[] };

/** Lista do auxiliar; `reload` procura o auxiliar de novo (acabou de instalar) e relê a lista. */
function useWallpaperList(): [State, () => void] {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    void findHelper()
      .then(async (base) => (base ? { status: 'ready' as const, list: await loadWallpapers(base) } : { status: 'absent' as const }))
      .catch(() => ({ status: 'absent' as const }))
      .then((s) => live && setState(s));
    return () => void (live = false);
  }, [nonce]);
  return [
    state,
    () => {
      resetHelper();
      setNonce((n) => n + 1);
    },
  ];
}

/**
 * Wallpapers do Wallpaper Engine e da pasta do usuário, servidos pelo auxiliar de fundos. Clique escolhe como fundo.
 * Sem o auxiliar, explica como instalar (um clique no `install-helper.cmd` da pasta do plugin).
 */
export function Wallpapers({ current, onPick, compact = false }: { current: BgSource; onPick: (src: BgSource) => void; compact?: boolean }) {
  const [state, reload] = useWallpaperList();
  const [tab, setTab] = useState<Tab>('engine');
  const [query, setQuery] = useState('');
  if (state.status === 'loading') return <Loader small label={t('wpLoading')} />;
  if (state.status === 'absent')
    return (
      <div class="rlc-wp-absent">
        <p>{t('wpAbsent')}</p>
        <div class="rlc-chip-row">
          <button type="button" class="rlc-button" data-variant="pill" onClick={() => (window as Window & { openPluginsFolder?: () => void }).openPluginsFolder?.()}>
            {t('wpOpenPlugins')}
          </button>
          <button type="button" class="rlc-button" data-variant="pill" onClick={reload}>
            {t('wpRetry')}
          </button>
        </div>
      </div>
    );
  const base = helperBase.value!;
  const q = query.trim().toLowerCase();
  // Vídeos primeiro: são os que rodam de verdade (cenas entram só pela prévia).
  const list = state.list.filter((w) => w.source === tab && (!q || w.title.toLowerCase().includes(q))).sort((a, b) => Number(!!a.preview) - Number(!!b.preview));
  const chosen = current.kind === 'local' ? current.id : null;
  return (
    <div class="rlc-wp" data-compact={compact ? 'true' : undefined}>
      <div class="rlc-wp-tools">
        <div class="rlc-tft-filter" role="tablist">
          {(['engine', 'user'] as const).map((k) => (
            <button type="button" key={k} role="tab" aria-checked={tab === k} onClick={() => setTab(k)}>
              {t(k === 'engine' ? 'wpEngine' : 'wpUser')} <small>{state.list.filter((w) => w.source === k).length}</small>
            </button>
          ))}
        </div>
        <input type="search" class="rlc-input" placeholder={t('wpSearch')} aria-label={t('wpSearch')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
        {tab === 'user' ? (
          <button type="button" class="rlc-button" data-variant="pill" onClick={() => void openUserFolder(base)}>
            {t('wpOpenUser')}
          </button>
        ) : null}
        <button type="button" class="rlc-button" data-variant="pill" onClick={reload}>
          {t('wpRetry')}
        </button>
      </div>
      {list.length ? (
        <div class="rlc-wp-grid">
          {list.map((w) => (
            <button type="button" key={w.id} class="rlc-wp-item" aria-pressed={chosen === w.id} title={w.preview ? `${w.title} · ${t('wpPreviewOnly')}` : w.title} onClick={() => onPick({ kind: 'local', id: w.id, mime: w.mime })}>
              {w.thumb ? <img src={wallpaperUrl(base, w.id, 'thumb')} alt="" loading="lazy" decoding="async" /> : <span class="rlc-wp-noart" aria-hidden="true" />}
              {w.media === 'video' ? <i class="rlc-wp-badge">{t('wpVideo')}</i> : null}
              <span>{w.title || '—'}</span>
            </button>
          ))}
        </div>
      ) : (
        <p class="rlc-muted">{t(tab === 'user' ? 'wpUserEmpty' : 'wpEngineEmpty')}</p>
      )}
    </div>
  );
}
