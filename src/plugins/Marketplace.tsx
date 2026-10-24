import { useEffect, useState } from 'preact/hooks';
import { t } from '../i18n';
import { request } from '../lcu/request';
import { prefs, setPrefs } from '../shell/prefs';
import { Range, Row, Switch } from '../screens/settings/controls';
import { changed, EntryNotFound, folderPlugins, installed, key, latestSha, loadCatalog, resolveInstall, saveInstalled, type Installed, type Listing } from './market';

/** Plugins que vêm com o ReimaginedLC e não dependem da camada: aceitar partida e aparecer offline. */
export function BuiltIns() {
  const p = prefs.value;
  return (
    <>
      <Row name={t('mkAutoAccept')} desc={t('mkAutoAcceptDesc')}>
        <Switch label={t('mkAutoAccept')} checked={p.autoAccept} onChange={(autoAccept) => setPrefs({ autoAccept })} />
      </Row>
      {p.autoAccept ? (
        <Row name={t('mkAcceptDelay')}>
          <Range label={t('mkAcceptDelay')} value={p.acceptDelay} min={0} max={10} step={1} text={`${p.acceptDelay} s`} onInput={(acceptDelay) => setPrefs({ acceptDelay })} />
        </Row>
      ) : null}
      <Row name={t('mkOffline')} desc={t('mkOfflineDesc')}>
        <Switch label={t('mkOffline')} checked={p.appearOffline} onChange={(appearOffline) => setPrefs({ appearOffline })} />
      </Row>
    </>
  );
}

type Catalog = { status: 'loading' } | { status: 'error' } | { status: 'ready'; list: Listing[] };
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const openCode = (url: string) => void request('POST', '/riotclient/open-url-in-browser', url).catch(() => {});

/** Loja de plugins do Pengu (sem temas): explorar, instalar fixando o commit, remover e atualizar. */
export function Marketplace() {
  const [tab, setTab] = useState<'browse' | 'installed'>('browse');
  const [catalog, setCatalog] = useState<Catalog>({ status: 'loading' });
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [updates, setUpdates] = useState<Set<string>>(new Set());
  const fetchCatalog = () => {
    setCatalog({ status: 'loading' });
    loadCatalog().then(
      (list) => setCatalog({ status: 'ready', list }),
      () => setCatalog({ status: 'error' }),
    );
  };
  useEffect(fetchCatalog, []);
  // Aba Instalados: confere se o branch de cada um tem commit novo.
  useEffect(() => {
    if (tab !== 'installed') return;
    let alive = true;
    for (const p of installed.value) {
      latestSha(p).then(
        (sha) => alive && sha !== p.sha && setUpdates((u) => new Set(u).add(key(p))),
        () => {},
      );
    }
    return () => void (alive = false);
  }, [tab]);

  const mine = installed.value;
  const isInstalled = (l: Pick<Listing, 'repo' | 'path'>) => mine.some((p) => key(p) === key(l));
  const install = async (l: Pick<Listing, 'repo' | 'path' | 'branch' | 'name'>) => {
    setBusy(key(l));
    try {
      const rec = await resolveInstall(l);
      saveInstalled([...installed.value.filter((p) => key(p) !== key(l)), rec]);
      setUpdates((u) => {
        const next = new Set(u);
        next.delete(key(l));
        return next;
      });
      window.Toast?.success(t('mkInstalled'));
    } catch (e) {
      window.Toast?.error(t(e instanceof EntryNotFound ? 'mkNoEntry' : 'mkNetError'));
    } finally {
      setBusy(null);
    }
  };
  const remove = (p: Pick<Installed, 'repo' | 'path'>) => saveInstalled(installed.value.filter((x) => key(x) !== key(p)));

  return (
    <section class="rlc-st-card rlc-mk">
      <h3>{t('mkTitle')}</h3>
      <p class="rlc-mk-warn">{t('mkWarn')}</p>
      {changed.value ? (
        <div class="rlc-mk-reload" role="status">
          <span>{t('mkReloadHint')}</span>
          <button type="button" class="rlc-button" data-variant="primary" onClick={() => window.location.reload()}>
            {t('mkReload')}
          </button>
        </div>
      ) : null}
      <nav class="rlc-tabs-text rlc-mk-tabs" aria-label={t('mkTitle')}>
        <button type="button" aria-current={tab === 'browse' ? 'page' : undefined} onClick={() => setTab('browse')}>
          {t('mkBrowse')}
        </button>
        <button type="button" aria-current={tab === 'installed' ? 'page' : undefined} onClick={() => setTab('installed')}>
          {`${t('mkInstalledTab')} (${mine.length})`}
        </button>
      </nav>
      {tab === 'browse' ? (
        <>
          <input class="rlc-input rlc-mk-search" type="search" placeholder={t('mkSearch')} aria-label={t('mkSearch')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
          {catalog.status === 'loading' ? <p class="rlc-mk-empty">{t('mkLoading')}</p> : null}
          {catalog.status === 'error' ? (
            <div class="rlc-mk-empty">
              <p>{t('mkCatalogError')}</p>
              <button type="button" class="rlc-button" data-variant="pill" onClick={fetchCatalog}>
                {t('mkRetry')}
              </button>
            </div>
          ) : null}
          {catalog.status === 'ready' ? <Browse list={catalog.list} query={query} busy={busy} isInstalled={isInstalled} onInstall={install} onRemove={remove} /> : null}
        </>
      ) : (
        <>
          {mine.length ? (
            <ul class="rlc-mk-list">
              {mine.map((p) => (
                <li key={key(p)} class="rlc-mk-item">
                  <div class="rlc-mk-text">
                    <b>{p.name}</b>
                    <span class="rlc-mk-meta">{`${t('mkVersion')} ${p.sha.slice(0, 7)}`}</span>
                  </div>
                  <div class="rlc-mk-ctl">
                    <button type="button" class="rlc-mk-link" onClick={() => openCode(`https://github.com/${p.repo}/tree/${p.sha}${p.path ? `/${p.path}` : ''}`)}>
                      {t('mkCode')}
                    </button>
                    {updates.has(key(p)) ? (
                      <button type="button" class="rlc-button" data-variant="primary" disabled={busy === key(p)} onClick={() => void install(p)}>
                        {t('mkUpdate')}
                      </button>
                    ) : null}
                    <button type="button" class="rlc-button" data-variant="pill" disabled={busy === key(p)} onClick={() => remove(p)}>
                      {t('mkRemove')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p class="rlc-mk-empty">{t('mkNoneInstalled')}</p>
          )}
          <Folder />
        </>
      )}
      <p class="rlc-mk-note">{t('mkNote')}</p>
    </section>
  );
}

function Browse({ list, query, busy, isInstalled, onInstall, onRemove }: { list: Listing[]; query: string; busy: string | null; isInstalled: (l: Listing) => boolean; onInstall: (l: Listing) => void; onRemove: (l: Listing) => void }) {
  const q = fold(query.trim());
  const shown = q ? list.filter((l) => fold(`${l.name} ${l.author} ${l.description}`).includes(q)) : list;
  if (!list.length) return <p class="rlc-mk-empty">{t('mkCatalogEmpty')}</p>;
  if (!shown.length) return <p class="rlc-mk-empty">{t('mkNoMatch')}</p>;
  return (
    <ul class="rlc-mk-list">
      {shown.map((l) => {
        const on = isInstalled(l);
        return (
          <li key={key(l)} class="rlc-mk-item">
            <div class="rlc-mk-text">
              <b>{l.name}</b>
              <span class="rlc-mk-meta">
                <span>{`${t('mkBy')} ${l.author}`}</span>
                {l.stars !== null ? <span aria-label={`${l.stars} ${t('mkStars')}`}>{`★ ${l.stars}`}</span> : null}
              </span>
              {l.description ? <p>{l.description}</p> : null}
            </div>
            <div class="rlc-mk-ctl">
              <button type="button" class="rlc-mk-link" onClick={() => openCode(l.path ? `${l.url}/tree/${l.branch ?? 'HEAD'}/${l.path}` : l.url)}>
                {t('mkCode')}
              </button>
              <button type="button" class="rlc-button" data-variant={on ? 'pill' : 'primary'} disabled={busy === key(l)} onClick={() => (on ? onRemove(l) : onInstall(l))}>
                {busy === key(l) ? t('mkInstalling') : t(on ? 'mkRemove' : 'mkInstall')}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Os que já estão na pasta do Pengu: só leitura (o client não pode mexer na pasta). */
function Folder() {
  const list = folderPlugins();
  if (!list.length) return null;
  return (
    <div class="rlc-mk-folder">
      <h4>{t('mkFolder')}</h4>
      <p class="rlc-mk-meta">{t('mkFolderDesc')}</p>
      <ul>
        {list.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
