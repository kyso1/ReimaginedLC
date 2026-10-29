import { createPortal, type ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { t } from '../i18n';
import { getJson } from '../screens/profile/data';
import { useEscape } from './useEscape';

/** Vídeos das habilidades: o JSON do campeão manda o caminho relativo a este CDN (o mesmo da tela de campeão da Riot). */
export const ABILITY_CDN = 'https://d28xe8vt774jo5.cloudfront.net/';

interface ChromaJson {
  id: number;
  name: string;
  chromaPath?: string | null;
  colors?: string[];
}
interface FeatureJson {
  description?: string;
  iconPath?: string;
  videoPath?: string;
}
export interface SkinJson {
  id: number;
  name: string;
  isBase?: boolean;
  splashPath?: string;
  uncenteredSplashPath?: string;
  loadScreenPath?: string;
  splashVideoPath?: string | null;
  chromaPath?: string | null;
  description?: string | null;
  chromas?: ChromaJson[] | null;
  skinFeaturePreviewData?: FeatureJson[] | null;
  questSkinInfo?: { tiers?: Array<{ id: number; name?: string; splashPath?: string; uncenteredSplashPath?: string; loadScreenPath?: string }> } | null;
}
interface AbilityJson {
  spellKey?: string;
  name: string;
  abilityIconPath?: string;
  abilityVideoPath?: string;
  abilityVideoImagePath?: string;
  description?: string;
}
export interface ChampionJson {
  id: number;
  name: string;
  title?: string;
  skins?: SkinJson[];
  passive?: AbilityJson;
  spells?: AbilityJson[];
}

// JSON do campeão (pequeno, ~100 KB) lido uma vez por campeão; falha não fica guardada.
const cache = new Map<number, Promise<ChampionJson | null>>();
export function championJson(id: number): Promise<ChampionJson | null> {
  let p = cache.get(id);
  if (!p) {
    p = getJson<ChampionJson>(`/lol-game-data/assets/v1/champions/${id}.json`).then((c) => {
      if (!c) cache.delete(id);
      return c;
    });
    cache.set(id, p);
  }
  return p;
}

/** Skin de um id (skin, croma ou estágio de skin evolutiva); sem id ou desconhecido, a base do campeão. */
export function findSkin(c: ChampionJson, id: number | undefined): SkinJson | undefined {
  const skins = c.skins ?? [];
  if (id) {
    const hit = skins.find((s) => s.id === id || s.chromas?.some((x) => x.id === id) || s.questSkinInfo?.tiers?.some((x) => x.id === id));
    if (hit) return hit;
  }
  return skins.find((s) => s.isBase) ?? skins[0];
}

const cdn = (path: string | undefined) => (!path ? '' : /^https?:|^\//.test(path) ? path : ABILITY_CDN + path);
// Os vídeos de efeitos da skin vêm como `ASSETS/...`, relativos à pasta de artes da LCU.
const asset = (path: string | undefined) => (!path ? '' : path.startsWith('/') ? path : `/lol-game-data/assets/${path}`);

export type PreviewView = 'splash' | 'load' | 'chromas' | 'features' | 'abilities';

/** Abas que fazem sentido para a skin: só aparecem as que têm arte. */
export function previewViews(skin: SkinJson, champion: ChampionJson): PreviewView[] {
  const out: PreviewView[] = ['splash'];
  if (skin.loadScreenPath) out.push('load');
  if (skin.chromas?.length) out.push('chromas');
  if (skin.skinFeaturePreviewData?.some((f) => f.videoPath)) out.push('features');
  if ([champion.passive, ...(champion.spells ?? [])].some((a) => a?.abilityVideoPath)) out.push('abilities');
  return out;
}

const VIEW_LABEL: Record<PreviewView, Parameters<typeof t>[0]> = {
  splash: 'pvSplash',
  load: 'pvLoading',
  chromas: 'csChromas',
  features: 'pvFeatures',
  abilities: 'pvAbilities',
};

/**
 * Prévia de skin, croma ou campeão em tela cheia: splash (animada quando a skin tem), tela de carregamento, cromas
 * (o modelo de cada uma), efeitos da skin e habilidades do campeão em vídeo. Tudo vem do próprio client
 * (`/lol-game-data`), menos os vídeos das habilidades, do CDN que a tela de campeão da Riot usa.
 * `start` abre numa aba; `children` são as ações (comprar) no pé.
 */
export function SkinPreview({ championId, skinId, start, onClose, children }: { championId: number; skinId?: number; start?: PreviewView; onClose: () => void; children?: ComponentChildren }) {
  useEscape(onClose);
  const [champ, setChamp] = useState<ChampionJson | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void championJson(championId).then((c) => live && setChamp(c));
    return () => void (live = false);
  }, [championId]);
  const skin = champ ? findSkin(champ, skinId) : undefined;
  const views = skin && champ ? previewViews(skin, champ) : [];
  const chromaStart = skin?.chromas?.some((c) => c.id === skinId);
  const [view, setView] = useState<PreviewView | null>(null);
  const shown = view && views.includes(view) ? view : start && views.includes(start) ? start : chromaStart ? 'chromas' : 'splash';
  const tier = skin?.questSkinInfo?.tiers?.find((x) => x.id === skinId);
  const name = chromaStart ? (skin?.chromas?.find((c) => c.id === skinId)?.name ?? skin?.name) : (tier?.name ?? skin?.name);
  const bg = tier?.uncenteredSplashPath || tier?.splashPath || skin?.uncenteredSplashPath || skin?.splashPath || '';
  // Portal para a raiz: a tela que abre a prévia (loja, seleção) cria um contexto de empilhamento abaixo da coluna de
  // amigos; na raiz, a prévia cobre tudo.
  const host = (document.getElementById('rlc-root') as HTMLElement | null) ?? document.body;
  return createPortal(
    <div class="rlc-pv" role="dialog" aria-modal="true" aria-label={`${t('pvPreview')} · ${name ?? ''}`}>
      <div class="rlc-pv-bg" style={bg ? { backgroundImage: `url("${bg}")` } : undefined} />
      <button type="button" class="rlc-pv-x" aria-label={t('storeClose')} onClick={onClose}>
        ✕
      </button>
      {champ === undefined ? <p class="rlc-pv-wait rlc-muted">{t('pvWait')}</p> : null}
      {champ === null ? <p class="rlc-pv-wait rlc-muted">{t('pvFailed')}</p> : null}
      {skin && champ ? (
        <>
          <header class="rlc-pv-head">
            <small class="rlc-muted">{champ.name}</small>
            <h2>{name}</h2>
          </header>
          <div class="rlc-pv-stage" data-view={shown}>
            {shown === 'splash' ? <Splash skin={skin} tier={tier} /> : null}
            {shown === 'load' ? <img class="rlc-pv-load" src={tier?.loadScreenPath || skin.loadScreenPath} alt="" /> : null}
            {shown === 'chromas' ? <Chromas skin={skin} first={chromaStart ? skinId : undefined} /> : null}
            {shown === 'features' ? <Videos items={(skin.skinFeaturePreviewData ?? []).filter((f) => f.videoPath).map((f) => ({ name: f.description ?? '', icon: asset(f.iconPath), video: asset(f.videoPath) }))} /> : null}
            {shown === 'abilities' ? (
              <Videos
                items={[champ.passive, ...(champ.spells ?? [])]
                  .filter((a): a is AbilityJson => !!a?.abilityVideoPath)
                  .map((a, i) => ({ name: a.name, key: i === 0 && champ.passive ? 'P' : (a.spellKey ?? '').toUpperCase(), icon: a.abilityIconPath ?? '', video: cdn(a.abilityVideoPath), poster: cdn(a.abilityVideoImagePath), text: a.description }))}
              />
            ) : null}
          </div>
          <footer class="rlc-pv-foot">
            {views.length > 1 ? (
              <nav class="rlc-tabs-text rlc-pv-tabs">
                {views.map((v) => (
                  <button type="button" key={v} aria-current={v === shown ? 'page' : undefined} onClick={() => setView(v)}>
                    {t(VIEW_LABEL[v])}
                  </button>
                ))}
              </nav>
            ) : null}
            {children ? <div class="rlc-pv-actions">{children}</div> : null}
          </footer>
        </>
      ) : null}
    </div>,
    host,
  );
}

function Splash({ skin, tier }: { skin: SkinJson; tier?: { splashPath?: string; uncenteredSplashPath?: string } }) {
  const still = tier?.uncenteredSplashPath || tier?.splashPath || skin.uncenteredSplashPath || skin.splashPath;
  // Splash animada só da skin (os estágios não têm vídeo próprio).
  if (!tier && skin.splashVideoPath) return <video class="rlc-pv-splash" src={skin.splashVideoPath} poster={still} autoplay loop muted playsInline />;
  return still ? <img class="rlc-pv-splash" src={still} alt="" /> : null;
}

function Chromas({ skin, first }: { skin: SkinJson; first?: number }) {
  // A própria skin entra como "Padrão" quando tem o modelo renderizado.
  const list: ChromaJson[] = [...(skin.chromaPath ? [{ id: skin.id, name: t('pvDefault'), chromaPath: skin.chromaPath }] : []), ...(skin.chromas ?? [])];
  const [id, setId] = useState(first ?? list[0]?.id);
  const current = list.find((c) => c.id === id) ?? list[0];
  return (
    <div class="rlc-pv-chromas">
      <div class="rlc-pv-model">{current?.chromaPath ? <img key={current.id} src={current.chromaPath} alt="" /> : null}</div>
      <p class="rlc-pv-caption">{current?.name}</p>
      <div class="rlc-pv-swatches" role="group" aria-label={t('csChromas')}>
        {list.map((c) => (
          <button type="button" key={c.id} class="rlc-pv-swatch" aria-label={c.name} title={c.name} aria-pressed={c.id === current?.id} style={c.colors?.[0] ? { background: c.colors[0] } : undefined} onClick={() => setId(c.id)} onMouseEnter={() => setId(c.id)} />
        ))}
      </div>
    </div>
  );
}

function Videos({ items }: { items: Array<{ name: string; key?: string; icon: string; video: string; poster?: string; text?: string }> }) {
  const [index, setIndex] = useState(0);
  // Vídeo que não carrega (campeão novo ainda sem vídeo no CDN responde 403): ícone grande e aviso no lugar.
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const current = items[index] ?? items[0];
  if (!current) return null;
  return (
    <div class="rlc-pv-videos">
      {broken.has(current.video) ? (
        <div class="rlc-pv-video rlc-pv-novideo">
          {current.icon ? <img src={current.icon} alt="" /> : null}
          <span class="rlc-muted">{t('pvNoVideo')}</span>
        </div>
      ) : (
        <video key={current.video} class="rlc-pv-video" src={current.video} poster={current.poster || undefined} autoplay loop muted playsInline onError={() => setBroken((b) => new Set(b).add(current.video))} />
      )}
      <div class="rlc-pv-abilities" role="group">
        {items.map((a, i) => (
          <button type="button" key={a.video} class="rlc-pv-ability" aria-label={a.name} title={a.name} aria-pressed={i === index} onClick={() => setIndex(i)}>
            {a.icon ? <img src={a.icon} alt="" /> : null}
            {a.key ? <i>{a.key}</i> : null}
          </button>
        ))}
      </div>
      <p class="rlc-pv-caption">
        <b>{current.name}</b>
        {current.text ? <span>{current.text}</span> : null}
      </p>
    </div>
  );
}
