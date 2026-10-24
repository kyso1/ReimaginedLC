import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { prefs } from '../../shell/prefs';
import { useEscape } from '../../ui/useEscape';
import { getJson } from './data';
import {
  bannerImage, bannerName, borderName, borderUrl, flagName, iconUrl, matches, prestigeTheme, save,
  type BannerCatalog, type ChallengeSummary, type Flag, type Look,
} from './look';

/** Pedaço da vitrine: botão que abre a janela na aba certa quando dá para editar; senão só a imagem. */
function Part({ tab, cls, label, onEdit, style, children }: {
  tab: Tab;
  cls: string;
  label: TextKey;
  onEdit?: (tab: Tab) => void;
  style?: Record<string, string>;
  children?: ComponentChildren;
}) {
  return onEdit ? (
    <button type="button" class={cls} style={style} aria-label={t(label)} title={t(label)} onClick={() => onEdit(tab)}>
      {children}
    </button>
  ) : (
    <div class={cls} style={style}>
      {children}
    </div>
  );
}

/**
 * Estandarte pendurado com o brasão (ícone + borda) e o nível no pé, igual na vitrine e na prévia da janela.
 * Com `onEdit`, estandarte, borda e ícone viram botões que abrem a aba correspondente.
 * `bare` tira o estandarte (a vitrine do perfil mostra só o brasão).
 */
export function Badge({ look, banners, onEdit, bare }: { look: Look; banners: BannerCatalog | null; onEdit?: (tab: Tab) => void; bare?: boolean }) {
  const banner = bannerImage(banners, look.banner, look.tier);
  return (
    <div class="rlc-pf-id" data-editable={onEdit ? 'true' : undefined} data-bare={bare ? 'true' : undefined}>
      {bare ? null : <Part tab="banners" cls="rlc-pf-banner" label="profEditBanner" onEdit={onEdit} style={banner ? { backgroundImage: `url("${banner}")` } : undefined} />}
      <div class="rlc-pf-crest" data-crest={look.crest} data-tier={(look.tier || 'none').toLowerCase()}>
        <Part tab="borders" cls="rlc-pf-ring" label="profEditBorder" onEdit={onEdit}>
          {look.crest === 'prestige' ? <img class="rlc-pf-border" src={borderUrl(look.prestige)} alt="" /> : <span class="rlc-pf-rim" />}
        </Part>
        <Part tab="icons" cls="rlc-pf-face" label="profEditIcon" onEdit={onEdit}>
          {look.icon ? <img class="rlc-pf-icon" src={iconUrl(look.icon)} alt="" /> : <span class="rlc-pf-icon" />}
        </Part>
        {look.level ? <b class="rlc-pf-level">{look.level}</b> : null}
      </div>
    </div>
  );
}

export type Tab = 'icons' | 'borders' | 'titles' | 'banners' | 'background';
const TABS: Array<[Tab, TextKey]> = [
  ['icons', 'profTabIcons'],
  ['borders', 'profTabBorders'],
  ['titles', 'profTabTitles'],
  ['banners', 'profTabBanners'],
  ['background', 'profTabBackground'],
];

interface Regalia {
  preferredBannerType?: string;
  lastSeasonHighestRank?: string;
  highestRankedEntry?: { tier?: string };
}
interface SkinMin {
  id: number;
  championId: number;
  name: string;
  tilePath?: string;
  splashPath?: string;
  ownership?: { owned?: boolean };
}
interface Data {
  regalia: Regalia | null;
  summary: ChallengeSummary | null;
  icons: Array<{ id: number; name: string }>;
  titles: Array<{ id: string; name: string }>;
  flags: Flag[];
  flag: Flag | null;
  skins: Array<SkinMin & { champion: string }>;
}

/** Tudo o que a janela lista, lido uma vez ao abrir. */
function useIdentityData(lcu: Lcu, summonerId: number | undefined): Data | null {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    let live = true;
    void Promise.all([
      getJson<Regalia>('/lol-regalia/v2/current-summoner/regalia'),
      getJson<ChallengeSummary>('/lol-challenges/v1/summary-player-data/local-player'),
      getJson<Array<{ itemId: number }>>('/lol-inventory/v2/inventory/SUMMONER_ICON'),
      getJson<Array<{ id: number; title?: string }>>('/lol-game-data/assets/v1/summoner-icons.json'),
      getJson<Array<{ itemId: number; name: string }>>('/lol-challenges/v2/titles/local-player'),
      getJson<Flag[]>('/lol-banners/v1/current-summoner/flags'),
      getJson<Flag>('/lol-banners/v1/current-summoner/flags/equipped'),
      summonerId ? getJson<SkinMin[]>(`/lol-champions/v1/inventories/${summonerId}/skins-minimal`) : null,
      lcu.game.champions(),
    ]).then(([regalia, summary, inv, iconMeta, titles, flags, flag, skins, champs]) => {
      if (!live) return;
      const names = new Map((iconMeta ?? []).map((i) => [i.id, i.title ?? '']));
      const champion = (id: number) => champs.get(id)?.name ?? '';
      setData({
        regalia,
        summary,
        icons: (inv ?? []).map((i) => ({ id: i.itemId, name: names.get(i.itemId) || t('profIcon') })).sort((a, b) => b.id - a.id),
        titles: (titles ?? []).map((x) => ({ id: String(x.itemId), name: x.name })).sort((a, b) => a.name.localeCompare(b.name)),
        flags: flags ?? [],
        flag,
        skins: (skins ?? [])
          .filter((s) => s.splashPath)
          .map((s) => ({ ...s, champion: champion(s.championId) }))
          .sort((a, b) => a.champion.localeCompare(b.champion) || a.id - b.id),
      });
    });
    return () => void (live = false);
  }, [lcu, summonerId]);
  return data;
}

/**
 * "A · Janela de identidade": prévia à esquerda, abas com busca à direita. Cada clique aplica na hora (como o client oficial);
 * em erro a prévia volta ao que era. "Pronto" e Esc fecham.
 */
export function IdentityModal({ lcu, puuid, summonerId, name, look, banners, splash, initialTab = 'icons', onChange, onClose }: {
  lcu: Lcu;
  puuid: string;
  summonerId: number | undefined;
  name: string;
  look: Look;
  banners: BannerCatalog | null;
  splash: string | null;
  /** Aba aberta de início (clique no ícone, na borda ou no estandarte da vitrine). */
  initialTab?: Tab;
  onChange: (look: Look) => void;
  onClose: () => void;
}) {
  useEscape(onClose);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState('');
  const data = useIdentityData(lcu, summonerId);
  const [flag, setFlag] = useState<Flag | null>(null);
  useEffect(() => setFlag(data?.flag ?? null), [data]);
  const all = prefs.value.allSplashes;

  const apply = (patch: Partial<Look>, write: (next: Look) => Promise<unknown>) => {
    const next = { ...look, ...patch };
    onChange(next);
    write(next).catch(() => onChange(look));
  };
  const challenges = (next: Look) =>
    save.challenges({ title: next.title, bannerAccent: next.banner, challengeIds: (data?.summary?.topChallenges ?? []).map((c) => c.id!).filter(Boolean) });
  const crest = (next: Look) =>
    save.crest({ preferredCrestType: next.crest, preferredBannerType: data?.regalia?.preferredBannerType ?? 'lastSeasonHighestRank', selectedPrestigeCrest: next.prestige });

  const restore = async () => {
    if (tab === 'borders') apply({ crest: 'prestige', prestige: prestigeTheme(look.level) }, crest);
    if (tab === 'titles') apply({ title: '', titleName: '' }, challenges);
    if (tab === 'banners') apply({ banner: '1' }, challenges);
    if (tab === 'background') {
      // Padrão do client: skin base do campeão de maior maestria.
      const top = (await getJson<Array<{ championId: number; championPoints: number }>>(`/lol-champion-mastery/v1/${encodeURIComponent(puuid)}/champion-mastery`))
        ?.sort((a, b) => b.championPoints - a.championPoints)[0];
      if (top) apply({ skin: top.championId * 1000 }, (n) => save.background(n.skin));
    }
  };

  const q = query.trim();
  const tier = data?.regalia?.lastSeasonHighestRank || data?.regalia?.highestRankedEntry?.tier || look.tier;
  const borders: Array<{ crest: Look['crest']; theme: number }> = [
    ...(tier && tier !== 'UNRANKED' ? [{ crest: 'ranked' as const, theme: look.prestige }] : []),
    ...Array.from({ length: prestigeTheme(look.level) }, (_, i) => ({ crest: 'prestige' as const, theme: prestigeTheme(look.level) - i })),
  ];
  const ownedBanners = Object.entries(banners ?? {}).filter(([, b]) => b.isOwned).map(([id]) => id).sort((a, b) => Number(a) - Number(b));
  const skins = useMemo(() => (data?.skins ?? []).filter((s) => all || s.ownership?.owned), [data, all]);
  const shownSkins = skins.filter((s) => matches(q, s.name, s.champion));
  const groups: Array<[string, typeof shownSkins]> = [];
  for (const s of shownSkins) {
    const last = groups[groups.length - 1];
    if (last && last[0] === s.champion) last[1].push(s);
    else groups.push([s.champion, [s]]);
  }

  return (
    <div class="rlc-veil rlc-idm-veil" role="dialog" aria-modal="true" aria-label={t('profCustomize')}>
      <div class="rlc-idm">
        <div class="rlc-idm-preview">
          <div class="rlc-pf-bg" style={splash ? { backgroundImage: `url("${splash}")` } : undefined} />
          <Badge look={look} banners={banners} onEdit={(k) => (setTab(k), setQuery(''))} />
          <div class="rlc-idm-who">
            <b>{name}</b>
            {look.titleName ? <span class="rlc-pf-title">{look.titleName}</span> : null}
          </div>
        </div>
        <div class="rlc-idm-panel">
          <nav class="rlc-tabs-text">
            {TABS.map(([k, label]) => (
              <button type="button" key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => (setTab(k), setQuery(''))}>
                {t(label)}
              </button>
            ))}
          </nav>
          <input type="search" class="rlc-input" placeholder={t('search')} aria-label={t('search')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
          <div class="rlc-idm-body" data-tab={tab}>
            {!data ? null : tab === 'icons' ? (
              <div class="rlc-idm-grid">
                {data.icons.filter((i) => matches(q, i.name)).map((i) => (
                  <button type="button" key={i.id} class="rlc-idm-icon" aria-pressed={look.icon === i.id} aria-label={i.name} title={i.name} onClick={() => apply({ icon: i.id }, () => save.icon(i.id))}>
                    <img src={iconUrl(i.id)} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            ) : tab === 'borders' ? (
              <div class="rlc-idm-grid">
                {borders
                  .map((b) => ({ ...b, label: borderName(b.crest, b.theme, tier) }))
                  .filter((b) => matches(q, b.label))
                  .map((b) => (
                    <button
                      type="button"
                      key={`${b.crest}${b.theme}`}
                      class="rlc-idm-border"
                      data-crest={b.crest}
                      data-tier={tier.toLowerCase()}
                      aria-pressed={look.crest === b.crest && (b.crest === 'ranked' || look.prestige === b.theme)}
                      aria-label={b.label}
                      onClick={() => apply({ crest: b.crest, prestige: b.theme, tier }, crest)}
                    >
                      {b.crest === 'prestige' ? <img src={borderUrl(b.theme)} alt="" loading="lazy" decoding="async" /> : <span class="rlc-pf-rim" />}
                      <small>{b.label}</small>
                    </button>
                  ))}
              </div>
            ) : tab === 'titles' ? (
              <div class="rlc-chip-row">
                {[{ id: '', name: t('profNoTitle') }, ...data.titles].filter((x) => matches(q, x.name)).map((x) => (
                  <button type="button" key={x.id} class="rlc-queue-chip" aria-pressed={look.title === x.id} onClick={() => apply({ title: x.id, titleName: x.id ? x.name : '' }, challenges)}>
                    {x.name}
                  </button>
                ))}
              </div>
            ) : tab === 'banners' ? (
              <>
                <div class="rlc-idm-grid" data-kind="banners">
                  {ownedBanners.map((id) => ({ id, label: bannerName(banners, id) })).filter((b) => matches(q, b.label)).map((b) => {
                    const img = bannerImage(banners, b.id, tier);
                    return (
                      <button type="button" key={b.id} class="rlc-idm-banner" aria-pressed={look.banner === b.id} aria-label={b.label} title={b.label} onClick={() => apply({ banner: b.id, tier }, challenges)}>
                        <span style={img ? { backgroundImage: `url("${img}")` } : undefined} />
                        <small>{b.label}</small>
                      </button>
                    );
                  })}
                </div>
                {data.flags.length ? <h3 class="rlc-idm-group">{t('profFlags')}</h3> : null}
                <div class="rlc-chip-row">
                  {data.flags.map((f) => ({ f, label: flagName(f) })).filter((x) => matches(q, x.label)).map(({ f, label }) => (
                    <button
                      type="button"
                      key={f.itemId}
                      class="rlc-queue-chip"
                      aria-pressed={flag?.itemId === f.itemId}
                      onClick={() => {
                        const prev = flag;
                        setFlag(f);
                        save.flag(f).catch(() => setFlag(prev));
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {!all ? <p class="rlc-muted">{t('profOwnedOnly')}</p> : null}
                {groups.map(([champion, list]) => (
                  <section key={champion} class="rlc-idm-skins">
                    <h3 class="rlc-idm-group">{champion}</h3>
                    <div class="rlc-idm-grid" data-kind="skins">
                      {list.map((s) => (
                        <button type="button" key={s.id} class="rlc-idm-skin" aria-pressed={look.skin === s.id} aria-label={s.name} title={s.name} onClick={() => apply({ skin: s.id }, () => save.background(s.id))}>
                          {s.tilePath ? <img src={s.tilePath} alt="" loading="lazy" decoding="async" /> : null}
                          <small>{s.name}</small>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </>
            )}
          </div>
          <div class="rlc-dialog-actions">
            <button type="button" class="rlc-button" data-variant="ghost" disabled={tab === 'icons'} onClick={() => void restore()}>
              {t('profRestore')}
            </button>
            <button type="button" class="rlc-button" data-variant="primary" onClick={onClose}>
              {t('profDone')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
