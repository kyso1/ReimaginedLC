import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import { prefs, setPrefs } from '../../shell/prefs';
import { background, setBackground, type BgSource } from '../../theme/background';
import { Wallpapers } from '../../ui/Wallpapers';
import { Button } from '../../ui/Button';
import { Crossfade } from '../../ui/Crossfade';
import { getJson } from '../profile/data';
import { NAV_URL, pageUrl, parseNav, parsePage, type FeaturedLink, type FeaturedPage, type FeaturedTab } from './featured';

/** "16.19.823.0722" vira "16.19". */
export function shortPatch(version: string | null | undefined): string | null {
  const match = /^(\d+)\.(\d+)\./.exec(version ?? '');
  return match ? `${match[1]}.${match[2]}` : null;
}

/** Página de notas do patch no site da Riot, no idioma do client. Locale fora do padrão `xx_YY` cai em inglês. */
export function patchNotesUrl(locale: string | null | undefined): string {
  const safe = /^[a-z]{2}_[A-Z]{2}$/.test(locale ?? '') ? locale!.toLowerCase().replace('_', '-') : 'en-us';
  return `https://www.leagueoflegends.com/${safe}/news/tags/patch-notes/`;
}

type Load = (url: string) => Promise<unknown>;

export function Home({ version, locale, onPlay, onStore, onEvents, open = (url) => window.open(url, '_blank'), load = getJson }: { version: string | null; locale: string | null; onPlay: () => void; onStore?: () => void; onEvents?: () => void; open?: (url: string) => unknown; load?: Load }) {
  const patch = shortPatch(version);
  const openNotes = () => {
    try {
      if (!open(patchNotesUrl(locale))) window.Toast?.error(t('openFailed'));
    } catch {
      window.Toast?.error(t('openFailed'));
    }
  };
  const bare = prefs.value.homeBare;
  const eye = useRef<HTMLButtonElement>(null);
  useEyeGlide(eye, bare);
  const toggle = (e: MouseEvent) => {
    eyeFrom = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPrefs({ homeBare: !bare });
  };
  const [walls, setWalls] = useState(false);
  const pickWall = (src: BgSource) => setBackground({ ...background.value, global: src });
  const wallButton = (
    <button type="button" class="rlc-home-bare rlc-home-walls" aria-label={t('wpTitle')} title={t('wpTitle')} aria-expanded={walls} onClick={() => setWalls(!walls)}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.7" />
        <path d="M3 16l5-5 4 4 3-3 6 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
        <circle cx="16" cy="9" r="1.5" fill="currentColor" />
      </svg>
    </button>
  );
  const wallPanel = walls ? (
    <div class="rlc-home-wallpanel" role="dialog" aria-label={t('wpTitle')}>
      <Wallpapers current={background.value.global} onPick={pickWall} compact />
    </div>
  ) : null;
  // Só o fundo: nada por cima além do botão (discreto, aparece no hover) que traz o Início de volta.
  if (bare)
    return (
      <section class="rlc-home" data-bare="true">
        {wallPanel}
        <div class="rlc-home-corner">{wallButton}
        <button ref={eye} type="button" class="rlc-home-bare" aria-label={t('homeBareOff')} title={t('homeBareOff')} onClick={toggle}>
          <EyeIcon off />
        </button>
        </div>
      </section>
    );
  return (
    <section class="rlc-home">
      <Featured load={load} locale={locale} onLink={(l) => (l.kind === 'store' ? onStore?.() : l.kind === 'events' ? onEvents?.() : open(l.url))} />
      <div class="rlc-home-play">
        <Button variant="primary" onClick={onPlay}>
          {t('play')}
        </Button>
      </div>
      {wallPanel}
      <div class="rlc-home-patch">
        {wallButton}
        <button ref={eye} type="button" class="rlc-home-bare" aria-label={t('homeBareOn')} title={t('homeBareOn')} onClick={toggle}>
          <EyeIcon />
        </button>
        <Button variant="pill" onClick={openNotes}>
          {patch ? <strong>Patch {patch}</strong> : null}
          {t('patchNotes')}
        </Button>
      </div>
    </section>
  );
}

/** Troca de slide sozinha a cada 8 s, como a tela da Riot; para com o mouse em cima e com movimento desligado. */
const AUTOPLAY_MS = 8000;
const EMPTY: FeaturedPage = { masthead: null, slides: [] };

/**
 * Destaques da tela inicial do client: abas à esquerda; a página da aba ocupa o fundo (vídeo ou imagem do cabeçalho,
 * ou a galeria com miniaturas) com título, descrição e botões. Abas de site da Riot (Worlds, notas do patch) abrem
 * num quadro. Sem conteúdo (offline, região sem destaques), não aparece nada.
 */
function Featured({ load, locale, onLink }: { load: Load; locale: string | null; onLink: (l: FeaturedLink) => void }) {
  const [tabs, setTabs] = useState<FeaturedTab[]>([]);
  const [tabId, setTabId] = useState<string | null>(null);
  const [page, setPage] = useState<FeaturedPage>(EMPTY);
  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    let live = true;
    void load(NAV_URL).then((nav) => {
      if (!live) return;
      const list = parseNav(nav, locale);
      setTabs(list);
      setTabId((cur) => cur ?? list[0]?.id ?? null);
    });
    return () => void (live = false);
  }, [load, locale]);
  const tab = tabs.find((x) => x.id === tabId) ?? null;
  useEffect(() => {
    setPage(EMPTY);
    setIndex(0);
    if (!tab || tab.kind !== 'page') return;
    let live = true;
    void load(pageUrl(tab.id)).then((p) => live && setPage(parsePage(p)));
    return () => void (live = false);
  }, [tab?.id, load]);
  const slides = page.slides;
  const still = hold || prefs.value.motion === 'off' || slides.length < 2;
  useEffect(() => {
    if (still) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [still, slides.length, index]);
  const slide = slides[index] ?? null;
  const m = page.masthead;
  // A Crossfade só troca depois de a nova imagem carregar: sem piscar o fundo, com fusão entre slides.
  const image = slide?.image ?? m?.image;
  if (!tabs.length) return null;
  const go = (step: number) => setIndex((i) => (i + step + slides.length) % slides.length);
  const video = !slide && m?.video && prefs.value.video && prefs.value.motion !== 'off' ? m.video : null;
  return (
    <div class="rlc-feat" data-kind={tab?.kind} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      {/* Fica montada entre abas: sem imagem nova ainda, a anterior continua até a próxima carregar. */}
      {tab?.kind === 'page' ? <Crossfade src={image} class="rlc-feat-bg" position="center 30%" /> : null}
      {tab?.kind === 'page' && video ? <video class="rlc-feat-bg rlc-feat-video" key={video} src={video} poster={m?.image ?? undefined} autoplay muted loop playsInline /> : null}
      <nav class="rlc-feat-tabs" aria-label={t('featured')}>
        {tabs.map((x) => (
          <button type="button" key={x.id} aria-current={x.id === tabId ? 'true' : undefined} onClick={() => setTabId(x.id)}>
            {x.title}
          </button>
        ))}
      </nav>
      {tab?.kind === 'embed' ? <iframe class="rlc-feat-embed" key={tab.url} src={tab.url} title={tab.title} /> : null}
      {tab?.kind === 'page' && (slide || m) ? (
        <div class="rlc-feat-info">
          {m?.supertitle ? <span class="rlc-feat-super">{m.supertitle}</span> : null}
          <h2 class="rlc-feat-title">{slide?.title || m?.title}</h2>
          {!slide && m?.subtitle ? <p class="rlc-feat-sub">{m.subtitle}</p> : null}
          {!slide && m?.description ? <p class="rlc-feat-desc">{m.description}</p> : null}
          <div class="rlc-feat-links">
            {slide?.store ? (
              <button type="button" class="rlc-button" data-variant="pill" onClick={() => onLink({ title: t('seeInStore'), kind: 'store' })}>
                {t('seeInStore')}
              </button>
            ) : null}
            {(slide ? [] : (m?.links ?? [])).map((l) => (
              <button type="button" key={l.title} class="rlc-button" data-variant="pill" onClick={() => onLink(l)}>
                {l.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {slides.length > 1 ? (
        <div class="rlc-feat-strip">
          <button type="button" class="rlc-feat-arrow" aria-label={t('previous')} onClick={() => go(-1)}>
            ‹
          </button>
          {slides.map((x, i) => (
            <button type="button" key={x.id} class="rlc-feat-thumb" aria-label={x.title} aria-pressed={i === index} style={{ backgroundImage: `url("${x.image}")` }} onClick={() => setIndex(i)} />
          ))}
          <button type="button" class="rlc-feat-arrow" aria-label={t('next')} onClick={() => go(1)}>
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Olho (mostrar só o fundo) e olho riscado (trazer o Início de volta). */
function EyeIcon({ off = false }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7" />
      {off ? <path d="M4 4l16 16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /> : null}
    </svg>
  );
}

/** Onde o olho estava no clique; o olho novo sai dali (FLIP) para ficar claro para onde ele foi. */
let eyeFrom: DOMRect | null = null;
export const EYE_GLIDE_MS = 560;

/** Desliza o olho da posição antiga até a nova ao alternar o Início só com o fundo (respeita movimento desligado). */
function useEyeGlide(eye: { current: HTMLButtonElement | null }, bare: boolean): void {
  useLayoutEffect(() => {
    const from = eyeFrom;
    eyeFrom = null;
    const el = eye.current;
    if (!from || !el || prefs.value.motion === 'off' || typeof el.animate !== 'function') return;
    const to = el.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    if (!dx && !dy) return;
    // Durante o deslize o olho fica aceso; depois volta ao jeito discreto do modo.
    el.animate([{ transform: `translate(${dx}px, ${dy}px)`, opacity: 1 }, { transform: 'none', opacity: 1 }], {
      duration: prefs.value.motion === 'reduced' ? 200 : EYE_GLIDE_MS,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });
  }, [bare]);
}
