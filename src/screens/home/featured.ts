/**
 * Aba de destaque da tela inicial do client (a coluna da esquerda da Riot). `page` abre uma página do CMS na própria
 * tela; `embed` é um site da Riot exibido num quadro (Worlds, notas do patch).
 */
export type FeaturedTab = { id: string; title: string; kind: 'page' } | { id: string; title: string; kind: 'embed'; url: string };
/** Um slide da galeria da aba: imagem, título e se leva a um item da loja. */
export interface Slide {
  id: string;
  title: string;
  image: string;
  store: boolean;
}
/** Botão da página: link externo, loja ou trilha de evento. */
export type FeaturedLink = { title: string; kind: 'web'; url: string } | { title: string; kind: 'store' } | { title: string; kind: 'events' };
/** Cabeçalho grande da página (o "masthead" da Riot). */
export interface Masthead {
  supertitle: string;
  title: string;
  subtitle: string;
  description: string;
  image: string | null;
  video: string | null;
  links: FeaturedLink[];
}
export interface FeaturedPage {
  masthead: Masthead | null;
  slides: Slide[];
}

type Media = { url?: string; type?: string };
type Action = { type?: string; payload?: { url?: string; tabId?: string } };
type Link = { title?: string; media?: Media; action?: Action };
type Item = { mediaGalleryItemID?: string; header?: { title?: string; links?: Link[] } };
type Backdrop = { background?: { type?: string; url?: string; sources?: Array<{ src?: string; type?: string }>; thumbnail?: Media } };
type Blade = {
  type?: string;
  items?: Item[];
  backdrop?: Backdrop;
  header?: { supertitle?: string; title?: string; subtitle?: string; description?: { body?: string }; links?: Link[] };
  footerLinks?: Link[];
};

export const NAV_URL = '/lol-activity-center/v1/content/client-nav';
export const pageUrl = (tabId: string) => `/lol-activity-center/v1/content/${encodeURIComponent(tabId)}`;

/** O CMS marca alguns títulos com `*` na frente. */
const clean = (s: string | undefined) => (s ?? '').replace(/^\*/, '').trim();
/** Texto de um corpo HTML do CMS, sem marcação (vira texto, nunca HTML). */
export const plainText = (html: string | undefined) =>
  (html ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** Endereço do quadro no idioma do client: `{locale}` vira `pt-br`, `{LOCALE}` vira `pt-BR`. */
export function embedUrl(url: string, clientLocale: string | null): string {
  const [lang = 'en', region = 'US'] = (clientLocale ?? 'en_US').split('_');
  return url.replace(/\{locale\}/g, `${lang}-${region}`.toLowerCase()).replace(/\{LOCALE\}/g, `${lang.toLowerCase()}-${region.toUpperCase()}`);
}

/** Abas da tela inicial: páginas da própria Riot e sites embutidos (só endereços https). */
export function parseNav(nav: unknown, clientLocale: string | null = null): FeaturedTab[] {
  const data = (nav as { data?: Array<{ title?: string; action?: Action }> } | null)?.data ?? [];
  const tabs: FeaturedTab[] = [];
  for (const d of data) {
    const title = clean(d.title);
    if (!title) continue;
    if (d.action?.type === 'lc_home_tab' && d.action.payload?.tabId) tabs.push({ id: d.action.payload.tabId, title, kind: 'page' });
    else if (d.action?.type === 'iframed' && /^https:\/\//.test(d.action.payload?.url ?? '')) tabs.push({ id: d.action.payload!.url!, title, kind: 'embed', url: embedUrl(d.action.payload!.url!, clientLocale) });
  }
  return tabs;
}

function parseLink(l: Link): FeaturedLink | null {
  const title = clean(l.title);
  if (!title) return null;
  const type = l.action?.type;
  if (type === 'weblink' && /^https:\/\//.test(l.action?.payload?.url ?? '')) return { title, kind: 'web', url: l.action!.payload!.url! };
  if (type === 'lc_store_paw' || type === 'lc_store') return { title, kind: 'store' };
  if (type === 'lc_event_shop' || type === 'lc_event_hub') return { title, kind: 'events' };
  return null;
}

/** Slides das galerias da página: cada item com imagem vira um slide. */
export function parseGallery(page: unknown): Slide[] {
  return parsePage(page).slides;
}

/** Cabeçalho e galeria de uma página do CMS. Peças que a tela não sabe mostrar ficam de fora. */
export function parsePage(page: unknown): FeaturedPage {
  const blades = (page as { blades?: Blade[] } | null)?.blades ?? [];
  const slides: Slide[] = [];
  let masthead: Masthead | null = null;
  const footer: FeaturedLink[] = [];
  for (const blade of blades) {
    if (blade.type === 'leagueClientMastheadContentBlock' && !masthead) {
      const bg = blade.backdrop?.background;
      const video = bg?.type === 'video' ? (bg.sources?.find((s) => /^https:\/\//.test(s.src ?? ''))?.src ?? null) : null;
      const image = bg?.type === 'image' ? (bg.url ?? null) : (bg?.thumbnail?.url ?? null);
      const h = blade.header ?? {};
      masthead = {
        supertitle: clean(h.supertitle),
        title: clean(h.title),
        subtitle: clean(h.subtitle),
        description: plainText(h.description?.body),
        image,
        video,
        links: (h.links ?? []).map(parseLink).filter((l): l is FeaturedLink => l !== null),
      };
    } else if (blade.type === 'mediaGallery') {
      for (const [i, item] of (blade.items ?? []).entries()) {
        const links = item.header?.links ?? [];
        const media = links.find((l) => l.media?.type === 'image' && l.media.url)?.media;
        if (!media) continue;
        slides.push({ id: item.mediaGalleryItemID ?? String(i), title: clean(item.header?.title), image: media.url!, store: links.some((l) => l.action?.type === 'lc_store_paw') });
      }
    } else if (blade.type === 'leagueClientTabContent') {
      footer.push(...(blade.footerLinks ?? []).map(parseLink).filter((l): l is FeaturedLink => l !== null));
    }
  }
  if (masthead) masthead.links.push(...footer);
  return { masthead, slides };
}
