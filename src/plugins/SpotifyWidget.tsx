import { useEffect, useState } from 'preact/hooks';
import { t } from '../i18n';
import { request } from '../lcu/request';
import { prefs, setPrefs } from '../shell/prefs';
import { Row, Switch } from '../screens/settings/controls';
import {
  connectSpotify,
  connectSpotifyInBrowser,
  DEFAULT_REDIRECT,
  disconnectSpotify,
  finishSpotifyLogin,
  setSpotifyClient,
  spotifyCanControl,
  spotifyConfig,
  spotifyControl,
  spotifyError,
  spotifyTrack,
} from './spotify';

const DASHBOARD = 'https://developer.spotify.com/dashboard';
const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const Svg = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);
const PLAY = 'M8 5v14l11-7z';
const PAUSE = 'M6 5h4v14H6zM14 5h4v14h-4z';
const NEXT = 'M6 6l8.5 6L6 18zM16 6h2v12h-2z';
const PREV = 'M18 6l-8.5 6 8.5 6zM6 6h2v12H6z';

/** Widget "tocando agora": capa, faixa, artista e controles; clicar na capa abre o volume e a posição. */
export function SpotifyWidget() {
  const tr = spotifyTrack.value;
  const [open, setOpen] = useState(false);
  const [, tick] = useState(0);
  // A posição anda sozinha entre as consultas (só com o painel aberto e tocando).
  useEffect(() => {
    if (!open || !tr?.playing) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [open, tr?.playing]);
  if (!prefs.value.spotify || !tr) return null;
  const can = spotifyCanControl.value;
  const pos = Math.min(tr.durationMs, tr.progressMs + (tr.playing ? Date.now() - tr.at : 0));
  const hint = can ? undefined : t('spPremium');
  const ctl = (label: string, d: string, run: () => void) => (
    <button type="button" class="rlc-sp-btn" aria-label={label} title={hint ?? label} disabled={!can} onClick={run}>
      <Svg d={d} />
    </button>
  );
  return (
    <div class="rlc-sp" data-open={open ? 'true' : undefined} aria-label={t('spNowPlaying')} role="group">
      <button type="button" class="rlc-sp-art" aria-expanded={open} aria-label={t('spMore')} onClick={() => setOpen(!open)}>
        {tr.art ? <img src={tr.art} alt="" /> : null}
      </button>
      <div class="rlc-sp-text">
        <b title={tr.name}>{tr.name}</b>
        <span title={tr.album}>{tr.artists}</span>
      </div>
      <div class="rlc-sp-ctl">
        {ctl(t('spPrev'), PREV, () => void spotifyControl('previous'))}
        {ctl(tr.playing ? t('spPause') : t('spPlay'), tr.playing ? PAUSE : PLAY, () => void spotifyControl(tr.playing ? 'pause' : 'play'))}
        {ctl(t('spNext'), NEXT, () => void spotifyControl('next'))}
      </div>
      {open ? (
        <div class="rlc-sp-more">
          <label class="rlc-sp-range">
            <span>{mmss(pos)}</span>
            <input type="range" aria-label={t('spSeek')} min={0} max={tr.durationMs || 1} step={1000} value={pos} disabled={!can} onChange={(e) => void spotifyControl('seek', Number(e.currentTarget.value))} />
            <span>{mmss(tr.durationMs)}</span>
          </label>
          {tr.volume !== null ? (
            <label class="rlc-sp-range">
              <span>{t('spVolume')}</span>
              <input type="range" aria-label={t('spVolume')} min={0} max={100} step={1} value={tr.volume} disabled={!can} onChange={(e) => void spotifyControl('volume', Number(e.currentTarget.value))} />
              <span>{`${tr.volume}%`}</span>
            </label>
          ) : null}
          {hint ? <p class="rlc-sp-hint">{hint}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Configuração na aba de plugins: ligar, Client ID, endereço de volta a registrar, conectar e recado do chat. */
export function SpotifySettings() {
  const p = prefs.value;
  const cfg = spotifyConfig.value;
  const [clientId, setClientId] = useState(cfg.clientId ?? '');
  const [redirect, setRedirect] = useState(cfg.redirect ?? DEFAULT_REDIRECT);
  const [pasted, setPasted] = useState('');
  const connected = !!cfg.refresh;
  const keep = () => setSpotifyClient(clientId, redirect === DEFAULT_REDIRECT ? undefined : redirect);
  const copy = () =>
    void navigator.clipboard?.writeText(redirect).then(
      () => window.Toast?.success(t('spCopied')),
      () => {},
    );
  return (
    <>
      <Row name={t('spName')} desc={t('spDesc')}>
        <Switch label={t('spName')} checked={p.spotify} onChange={(spotify) => setPrefs({ spotify })} />
      </Row>
      {p.spotify ? (
        <div class="rlc-sp-setup">
          {connected ? (
            <div class="rlc-sp-setup-line">
              <span role="status">{t('spConnected')}</span>
              <button type="button" class="rlc-button" data-variant="pill" onClick={disconnectSpotify}>
                {t('spDisconnect')}
              </button>
            </div>
          ) : (
            <>
              <ol class="rlc-sp-steps">
                <li>
                  {t('spStep1')}{' '}
                  <button type="button" class="rlc-mk-link" onClick={() => void request('POST', '/riotclient/open-url-in-browser', DASHBOARD).catch(() => {})}>
                    developer.spotify.com/dashboard
                  </button>
                </li>
                <li>{t('spStep2')}</li>
                <li>{t('spStep3')}</li>
              </ol>
              <label class="rlc-sp-field">
                <span>{t('spRedirect')}</span>
                <span class="rlc-sp-setup-line">
                  <input class="rlc-input" value={redirect} spellcheck={false} aria-label={t('spRedirect')} onInput={(e) => setRedirect(e.currentTarget.value)} onBlur={keep} />
                  <button type="button" class="rlc-button" data-variant="pill" onClick={copy}>
                    {t('spCopy')}
                  </button>
                </span>
              </label>
              <label class="rlc-sp-field">
                <span>{t('spClientId')}</span>
                <input class="rlc-input" value={clientId} spellcheck={false} aria-label={t('spClientId')} onInput={(e) => setClientId(e.currentTarget.value)} onBlur={keep} />
              </label>
              <div class="rlc-sp-setup-line">
                <button
                  type="button"
                  class="rlc-button"
                  data-variant="primary"
                  disabled={!clientId.trim()}
                  onClick={() => {
                    keep();
                    void connectSpotify();
                  }}
                >
                  {t('spConnect')}
                </button>
                <button
                  type="button"
                  class="rlc-mk-link"
                  disabled={!clientId.trim()}
                  onClick={() => {
                    keep();
                    void connectSpotifyInBrowser();
                  }}
                >
                  {t('spInBrowser')}
                </button>
              </div>
              <label class="rlc-sp-field">
                <span>{t('spPaste')}</span>
                <span class="rlc-sp-setup-line">
                  <input class="rlc-input" value={pasted} spellcheck={false} placeholder="https://127.0.0.1…?code=…" aria-label={t('spPaste')} onInput={(e) => setPasted(e.currentTarget.value)} />
                  <button
                    type="button"
                    class="rlc-button"
                    data-variant="pill"
                    disabled={!pasted.trim()}
                    onClick={() =>
                      void finishSpotifyLogin(pasted).then((ok) => {
                        if (ok) setPasted('');
                        else window.Toast?.error(t('spPasteBad'));
                      })
                    }
                  >
                    {t('spPasteGo')}
                  </button>
                </span>
              </label>
              {spotifyError.value ? <p class="rlc-sp-hint" role="alert">{`${t('spFailed')} (${spotifyError.value})`}</p> : null}
            </>
          )}
        </div>
      ) : null}
      {p.spotify ? (
        <Row name={t('spStatus')} desc={t('spStatusDesc')}>
          <Switch label={t('spStatus')} checked={p.spotifyStatus} onChange={(spotifyStatus) => setPrefs({ spotifyStatus })} />
        </Row>
      ) : null}
    </>
  );
}
