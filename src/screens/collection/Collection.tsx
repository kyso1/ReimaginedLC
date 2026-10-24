import type { JSX } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import { profileIcon } from '../../shell/RightColumn';
import { Crossfade } from '../../ui/Crossfade';
import { useDecoded } from '../../ui/useDecoded';
import { LANES, type Lane } from '../champselect/Drawer';
import { positionKey } from '../lobby/format';
import { getJson } from '../profile/data';
import { Runes } from './Runes';
import { Chip, facet, Select, tally, useSaved, Vitrine, type VitrineDetail, type VitrineItem } from './Vitrine';

type Cat = 'champions' | 'skins' | 'chromas' | 'icons' | 'wards' | 'emotes' | 'runes' | 'spells';
const SECTIONS: Array<[TextKey, Array<[Cat, TextKey]>]> = [
  ['colSecChampions', [['champions', 'colChampions'], ['skins', 'colSkins'], ['chromas', 'colChromas']]],
  ['colSecCosmetics', [['icons', 'colIcons'], ['wards', 'colWards'], ['emotes', 'colEmotes']]],
  ['colSecGame', [['runes', 'colRunes'], ['spells', 'colSpells']]],
];
// Ícones de traço (viewBox 24) de cada categoria, os mesmos do protótipo.
const ICONS: Record<Cat, JSX.Element> = {
  champions: <><path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7z" /></>,
  skins: <><path d="M4 20 12 4l8 16M8 13h8" /></>,
  chromas: <><circle cx="12" cy="12" r="8" /><path d="M12 4v16M4 12h16" /></>,
  icons: <><circle cx="12" cy="9" r="4" /><path d="M5 20c1-4 4-6 7-6s6 2 7 6" /></>,
  wards: <><path d="M12 3v18M7 8h10l-2 6H9z" /></>,
  emotes: <><circle cx="12" cy="12" r="8" /><path d="M9 10h.01M15 10h.01M8.5 14.5c2 2 5 2 7 0" /></>,
  runes: <><path d="M12 3 20 12 12 21 4 12z" /></>,
  spells: <><path d="M13 3 6 13h5l-1 8 8-11h-5z" /></>,
};
// Raridades do skins.json, da menor para a maior; da lendária para cima conta como "lendária ou mais".
const RARITIES = ['kNoRarity', 'kRare', 'kEpic', 'kLegendary', 'kMythic', 'kUltimate', 'kTranscendent', 'kExalted'] as const;
const TOP_RARITIES = new Set<string>(RARITIES.slice(3));
const rarityOf = (r: string | undefined): string => ((RARITIES as readonly string[]).includes(r ?? '') ? r! : 'kNoRarity');
const CLASSES = ['assassin', 'fighter', 'mage', 'marksman', 'support', 'tank'] as const;
// ponytail: Prestígio não tem campo próprio no skins.json (é kMythic); sai do nome, em pt/en/es.
const PRESTIGE = /prest[ií]g/i;
// Modos com nome traduzido; os demais (testes internos, eventos antigos) não aparecem.
const MODES = ['CLASSIC', 'SWIFTPLAY', 'ARAM', 'CHERRY', 'URF', 'ONEFORALL', 'NEXUSBLITZ', 'ULTBOOK', 'KINGPORO', 'DOOMBOTSTEEMO', 'JADE', 'PRACTICETOOL', 'TUTORIAL'] as const;
const modeNames = (modes: string[]): string[] => MODES.filter((m) => modes.includes(m)).map((m) => t(`colMode_${m}`));

interface Champion {
  id: number;
  name: string;
  title: string;
  roles: string[];
  baseSplashPath: string;
  baseLoadScreenPath?: string;
  squarePortraitPath: string;
  ownership?: { owned?: boolean };
  /** Data da compra (ms); 0 ou ausente quando não tem. */
  purchased?: number;
}
interface Skin {
  id: number;
  championId: number;
  name: string;
  isBase: boolean;
  splashPath: string;
  tilePath: string;
  ownership?: { owned?: boolean };
}
interface Chroma {
  id: number;
  name: string;
  chromaPath: string;
  colors?: string[];
}
/** Entrada de `/lol-game-data/assets/v1/skins.json`: raridade, arte de carregamento e cromas. */
type SkinData = Record<string, { rarity?: string; isLegacy?: boolean; loadScreenPath?: string; chromas?: Chroma[]; skinLines?: Array<{ id: number }> }>;
interface Mastery {
  championId: number;
  championLevel: number;
  championPoints: number;
}
interface Owned {
  itemId: number;
  owned: boolean;
}
interface Ward {
  id: number;
  name: string;
  wardImagePath: string;
  description: string;
  ownership?: { owned?: boolean };
}
interface Emote {
  id: number;
  name: string;
  description?: string;
  inventoryIcon: string;
}
interface IconData {
  id: number;
  title?: string;
  yearReleased?: number;
}
interface IconSet {
  id: number;
  hidden?: boolean;
  displayName: string;
  icons: number[];
}
interface Spell {
  id: number;
  name: string;
  description: string;
  iconPath: string;
  gameModes: string[];
}

/** Leitura sob demanda com cache por URL enquanto a Coleção está aberta. */
function useJson<T>(url: string | null): T | null {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    setValue(null);
    if (!url) return;
    let live = true;
    void getJson<T>(url).then((v) => live && setValue(v));
    return () => void (live = false);
  }, [url]);
  return value;
}

const compact = () => new Intl.NumberFormat(locale(), { notation: 'compact' });
const masteryLine = (m: Mastery) => `${t('profileMastery')} ${m.championLevel} · ${compact().format(m.championPoints)}`;
const stripTags = (s: string) => s.replace(/<[^>]*>/g, '');

/** Coleção: barra lateral com o campeão de maior maestria, totais e categorias; vitrine com detalhe em gaveta. */
export function Collection({ lcu }: { lcu: Lcu }) {
  const [cat, setCat] = useState<Cat>('champions');
  const me = lcu.chatMe.value.data;
  const sid = me?.summonerId;
  // A lista traz variantes de modo (Jade_Ahri, id 60103) com o mesmo nome; campeões de verdade têm id abaixo de 10000.
  // ponytail: corte por id; trocar por champion-summary se a Riot passar de 9999 campeões.
  const champions = (useJson<Champion[]>(sid ? `/lol-champions/v1/inventories/${sid}/champions-minimal` : null) ?? []).filter((c) => c.id > 0 && c.id < 10000);
  const skins = useJson<Skin[]>(sid ? `/lol-champions/v1/inventories/${sid}/skins-minimal` : null) ?? [];
  const mastery = useJson<Mastery[]>(me?.puuid ? `/lol-champion-mastery/v1/${encodeURIComponent(me.puuid)}/champion-mastery` : null) ?? [];
  const skinData = useJson<SkinData>('/lol-game-data/assets/v1/skins.json') ?? {};
  // Cromas são itens CHAMPION_SKIN no inventário; é daqui que sai a posse de cada uma.
  const skinInv = useJson<Owned[]>('/lol-inventory/v2/inventory/CHAMPION_SKIN') ?? [];
  const icons = useJson<Owned[]>('/lol-inventory/v2/inventory/SUMMONER_ICON') ?? [];
  const wards = useJson<Ward[]>(sid ? `/lol-collections/v1/inventories/${sid}/ward-skins` : null) ?? [];
  const emotesOwned = useJson<Owned[]>('/lol-inventory/v1/inventory/emotes') ?? [];
  const emoteData = useJson<Emote[]>('/lol-game-data/assets/v1/summoner-emotes.json') ?? [];
  const spellData = useJson<Spell[]>('/lol-game-data/assets/v1/summoner-spells.json') ?? [];
  const pages = useJson<Array<{ isEditable?: boolean }>>('/lol-perks/v1/pages') ?? [];

  const ownedInv = new Set(skinInv.filter((i) => i.owned).map((i) => i.itemId));
  const ownedSkins = skins.filter((s) => !s.isBase && s.ownership?.owned);
  const ownedSkinIds = new Set(ownedSkins.map((s) => s.id));
  const ownedChromas = ownedSkins.flatMap((s) => skinData[s.id]?.chromas ?? []).filter((c) => ownedInv.has(c.id));
  const ownedIcons = icons.filter((i) => i.owned);
  const emoteById = new Map(emoteData.map((e) => [e.id, e]));
  const emotes = emotesOwned.filter((e) => e.owned && emoteById.has(e.itemId)).map((e) => emoteById.get(e.itemId)!);
  const spells = spellData.filter((s) => s.name && modeNames(s.gameModes).length);
  const top = [...mastery].sort((a, b) => b.championPoints - a.championPoints)[0];
  const favorite = top ? champions.find((c) => c.id === top.championId) : undefined;
  const n = compact();

  const counts: Record<Cat, number> = {
    champions: champions.filter((c) => c.ownership?.owned).length,
    skins: ownedSkins.length,
    chromas: ownedChromas.length,
    icons: ownedIcons.length,
    wards: wards.filter((w) => w.ownership?.owned).length,
    emotes: emotes.length,
    runes: pages.filter((p) => p.isEditable !== false).length,
    spells: spells.length,
  };
  const stats: Array<[string, TextKey]> = [
    [`${counts.champions}/${champions.length}`, 'colStatChampions'],
    [n.format(counts.skins), 'colStatSkins'],
    [n.format(mastery.reduce((sum, m) => sum + m.championLevel, 0)), 'colStatMastery'],
    [n.format(ownedSkins.filter((s) => TOP_RARITIES.has(skinData[s.id]?.rarity ?? '')).length), 'colStatLegendary'],
  ];

  // Realce de vidro desliza até a categoria escolhida.
  const nav = useRef<HTMLElement>(null);
  const [mark, setMark] = useState<{ top: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const el = nav.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el) setMark({ top: el.offsetTop, height: el.offsetHeight });
  }, [cat]);
  const heroArt = useDecoded(favorite?.baseSplashPath);

  const shared = { lcu, champions, skins, skinData, ownedInv, mastery };
  return (
    <section class="rlc-collection rlc-cv">
      <aside class="rlc-cv-side">
        <div class="rlc-cv-hero">
          <Crossfade src={heroArt} position="center 22%" />
          {favorite && top ? (
            <div class="rlc-cv-hero-in">
              <small>{t('colTopMastery')}</small>
              <b>{favorite.name}</b>
              <small>{masteryLine(top)}</small>
            </div>
          ) : null}
        </div>
        <div class="rlc-cv-stats">
          {stats.map(([v, k]) => (
            <div key={k}>
              <b>{v}</b>
              <small>{t(k)}</small>
            </div>
          ))}
        </div>
        <nav class="rlc-cv-nav" ref={nav}>
          {mark ? <span class="rlc-cv-mark" style={{ top: `${mark.top}px`, height: `${mark.height}px` }} /> : null}
          {SECTIONS.map(([sec, cats]) => [
            <small key={sec} class="rlc-cv-sec">
              {t(sec)}
            </small>,
            ...cats.map(([k, label]) => (
              <button type="button" key={k} aria-current={cat === k ? 'page' : undefined} onClick={() => setCat(k)}>
                <svg class="rlc-cv-ic" viewBox="0 0 24 24" aria-hidden="true">
                  {ICONS[k]}
                </svg>
                {t(label)}
                <small>{n.format(counts[k])}</small>
              </button>
            )),
          ])}
        </nav>
      </aside>
      <div class="rlc-cv-main" key={cat}>
        {cat === 'champions' ? <ChampionsTab {...shared} /> : null}
        {cat === 'skins' ? <SkinsTab {...shared} /> : null}
        {cat === 'chromas' ? <ChromasTab {...shared} ownedSkinIds={ownedSkinIds} /> : null}
        {cat === 'icons' ? <IconsTab owned={new Set(ownedIcons.map((i) => i.itemId))} /> : null}
        {cat === 'wards' ? <WardsTab wards={wards} /> : null}
        {cat === 'emotes' ? <EmotesTab emotes={emoteData} owned={new Set(emotes.map((e) => e.id))} /> : null}
        {cat === 'runes' ? <Runes lcu={lcu} /> : null}
        {cat === 'spells' ? <SpellsTab spells={spells} /> : null}
      </div>
    </section>
  );
}

interface Shared {
  lcu: Lcu;
  champions: Champion[];
  skins: Skin[];
  skinData: SkinData;
  ownedInv: Set<number>;
  mastery: Mastery[];
}

type Cmp<T> = (a: T, b: T) => number;
const ownTest = (own: string, owned: boolean) => own === 'all' || (own === 'owned') === owned;
const rarityName = (k: string) => t(`colRarity_${k}` as TextKey);

/** Filtro de posse (Todos, Possuo, Não possuo), igual em todas as seções, com contadores. */
function OwnSelect<T>({ value, rows, owned, onChange }: { value: string; rows: T[]; owned: (r: T) => boolean; onChange: (v: string) => void }) {
  const n = rows.filter(owned).length;
  return (
    <Select
      label={t('colOwnFilter')}
      value={value}
      options={[
        ['all', t('colOwnAll'), rows.length],
        ['owned', t('colOwnOwned'), n],
        ['missing', t('colOwnMissing'), rows.length - n],
      ]}
      onChange={onChange}
    />
  );
}

/** Opções com contador; somem as zeradas, menos a escolhida (para o filtro salvo não sumir da lista). */
const counted = (keys: readonly string[], n: Map<string, number>, label: (k: string) => string, chosen: string): Array<[string, string, number]> =>
  keys.filter((k) => n.get(k) || k === chosen).map((k) => [k, label(k), n.get(k) ?? 0]);

// Faixas de maestria do filtro (nível 10+ existe desde a maestria sem teto).
const band = (level: number) => (level >= 10 ? '10' : level >= 5 ? '5' : level >= 1 ? '1' : '0');
const BANDS = ['10', '5', '1', '0'];

function ChampionsTab({ lcu, champions, skins, skinData, ownedInv, mastery }: Shared) {
  const [f, set] = useSaved('champions', { lane: '', role: '', own: 'all', mastery: '', sort: 'name' });
  const [sel, setSel] = useState<number | null>(null);
  const lanes = lcu.lanes.value.data ?? {};
  const masteryOf = new Map(mastery.map((m) => [m.championId, m]));
  const points = (id: number) => masteryOf.get(id)?.championPoints ?? 0;
  const levelBand = (c: Champion) => band(masteryOf.get(c.id)?.championLevel ?? 0);
  const laneOf = (c: Champion): string[] => lanes[String(c.id)]?.recommendedPositions ?? [];
  const tests = {
    own: (c: Champion) => ownTest(f.own, !!c.ownership?.owned),
    lane: (c: Champion) => !f.lane || laneOf(c).includes(f.lane),
    role: (c: Champion) => !f.role || c.roles.includes(f.role),
    mastery: (c: Champion) => !f.mastery || levelBand(c) === f.mastery,
  };
  const laneRows = facet(champions, tests, 'lane');
  const laneN = tally(laneRows, laneOf);
  const sorts: Record<string, Cmp<Champion>> = { name: () => 0, mastery: (a, b) => points(b.id) - points(a.id), recent: (a, b) => (b.purchased ?? 0) - (a.purchased ?? 0) };
  const list = facet(champions, tests).sort((a, b) => (sorts[f.sort] ?? sorts.name!)(a, b) || a.name.localeCompare(b.name));
  const items: VitrineItem[] = list.map((c) => {
    const m = masteryOf.get(c.id);
    return { id: c.id, name: c.name, art: c.baseLoadScreenPath || c.squarePortraitPath, owned: !!c.ownership?.owned, pill: !c.ownership?.owned ? t('colNotOwned') : m ? `M${m.championLevel}` : undefined };
  });
  const c = sel === null ? undefined : champions.find((x) => x.id === sel);
  const m = c && masteryOf.get(c.id);
  const detail: VitrineDetail | null = c
    ? {
        splash: c.baseSplashPath,
        name: c.name,
        kicker: c.title,
        body: (
          <>
            <p class="rlc-vt-line">{c.roles.map((r) => t(`role_${r}` as TextKey)).join(' · ')}</p>
            {m ? <p class="rlc-vt-line">{masteryLine(m)}</p> : null}
            {!c.ownership?.owned ? <p class="rlc-vt-line">{t('colNotOwned')}</p> : null}
            <h3 class="rlc-vt-sub">{t('colOwnedSkins')}</h3>
            <SkinRow skins={skins.filter((s) => s.championId === c.id && !s.isBase && s.ownership?.owned)} skinData={skinData} ownedInv={ownedInv} />
          </>
        ),
      }
    : null;
  return (
    <Vitrine
      items={items}
      placeholder={t('searchChampion')}
      onPick={(i) => setSel(Number(i.id))}
      detail={detail}
      onClose={() => setSel(null)}
      tools={
        <>
          <Chip on={!f.lane} count={laneRows.length} onClick={() => set({ lane: '' })}>
            {t('colAll')}
          </Chip>
          {LANES.map((l) => (
            <Chip key={l} on={f.lane === l} count={laneN.get(l) ?? 0} onClick={() => set({ lane: f.lane === l ? '' : l })}>
              {t(positionKey(l)!)}
            </Chip>
          ))}
          <span class="rlc-vt-sep" />
          <OwnSelect value={f.own} rows={facet(champions, tests, 'own')} owned={(x) => !!x.ownership?.owned} onChange={(own) => set({ own })} />
          <Select label={t('colClass')} value={f.role} options={[['', t('colAllClasses')], ...counted(CLASSES, tally(facet(champions, tests, 'role'), (x) => x.roles), (r) => t(`role_${r}` as TextKey), f.role)]} onChange={(role) => set({ role })} />
          <Select label={t('colMasteryFilter')} value={f.mastery} options={[['', t('colMasteryAny')], ...counted(BANDS, tally(facet(champions, tests, 'mastery'), levelBand), (b) => t(`colMastery${b}` as TextKey), f.mastery)]} onChange={(mastery) => set({ mastery })} />
          <Select
            label={t('colSort')}
            value={f.sort}
            options={[
              ['name', t('colSortName')],
              ['mastery', t('colSortMastery')],
              ['recent', t('colSortPurchase')],
            ]}
            onChange={(sort) => set({ sort })}
          />
        </>
      }
    />
  );
}

/** Skins adquiridas do campeão na gaveta, com as cromas como bolinhas de cor. */
function SkinRow({ skins, skinData, ownedInv }: { skins: Skin[]; skinData: SkinData; ownedInv: Set<number> }) {
  if (!skins.length) return <p class="rlc-muted">{t('colNoSkins')}</p>;
  return (
    <div class="rlc-vt-skins">
      {skins.map((s) => (
        <figure key={s.id} class="rlc-vt-skin">
          <img src={s.tilePath} alt="" loading="lazy" decoding="async" />
          <figcaption>{s.name}</figcaption>
          <Dots chromas={skinData[s.id]?.chromas ?? []} ownedInv={ownedInv} />
        </figure>
      ))}
    </div>
  );
}

function Dots({ chromas, ownedInv }: { chromas: Chroma[]; ownedInv: Set<number> }) {
  if (!chromas.length) return null;
  return (
    <div class="rlc-vt-dots">
      {chromas.map((c) => (
        <span key={c.id} class="rlc-vt-dot" title={c.name} aria-label={c.name} data-owned={ownedInv.has(c.id) ? 'true' : 'false'} style={c.colors?.[0] ? { background: c.colors[0] } : undefined} />
      ))}
    </div>
  );
}

// Selos extras do filtro de raridade, depois das raridades de verdade.
const RARITY_TAGS = [...RARITIES, 'prestige', 'legacy'];

function SkinsTab({ champions, skins, skinData, ownedInv }: Shared) {
  const [f, set] = useSaved('skins', { own: 'owned', rarity: '', group: 'champion', sort: 'name' });
  const [sel, setSel] = useState<number | null>(null);
  const lines = new Map((useJson<Array<{ id: number; name: string }>>('/lol-game-data/assets/v1/skinlines.json') ?? []).filter((l) => l.name).map((l) => [l.id, l.name]));
  const champ = new Map(champions.map((c) => [c.id, c.name]));
  const rarity = (s: Skin) => rarityOf(skinData[s.id]?.rarity);
  const rank = (s: Skin) => RARITIES.indexOf(rarity(s) as (typeof RARITIES)[number]);
  const line = (s: Skin) => lines.get(skinData[s.id]?.skinLines?.[0]?.id ?? 0) ?? '';
  const tags = (s: Skin) => [rarity(s), ...(PRESTIGE.test(s.name) ? ['prestige'] : []), ...(skinData[s.id]?.isLegacy ? ['legacy'] : [])];
  const rows = skins.filter((s) => !s.isBase && champ.has(s.championId));
  const tests = { own: (s: Skin) => ownTest(f.own, !!s.ownership?.owned), rarity: (s: Skin) => !f.rarity || tags(s).includes(f.rarity) };
  const rarityRows = facet(rows, tests, 'rarity');
  const rarityN = tally(rarityRows, tags);
  const groups: Record<string, (s: Skin) => string> = { champion: (s) => champ.get(s.championId)!, line: (s) => line(s) || t('colNoLine'), rarity: (s) => rarityName(rarity(s)), none: () => '' };
  const group = groups[f.group] ?? groups.champion!;
  const byGroup: Cmp<Skin> = f.group === 'rarity' ? (a, b) => rank(b) - rank(a) : (a, b) => group(a).localeCompare(group(b));
  const within: Cmp<Skin> = f.sort === 'rarity' ? (a, b) => rank(b) - rank(a) : () => 0;
  const list = facet(rows, tests).sort((a, b) => byGroup(a, b) || within(a, b) || a.name.localeCompare(b.name));
  const items: VitrineItem[] = list.map((s) => ({
    id: s.id,
    name: s.name,
    art: skinData[s.id]?.loadScreenPath || s.tilePath,
    owned: !!s.ownership?.owned,
    pill: s.ownership?.owned ? undefined : t('colNotOwned'),
    group: group(s) || undefined,
    search: `${champ.get(s.championId)} ${line(s)}`,
  }));
  const s = sel === null ? undefined : skins.find((x) => x.id === sel);
  const detail: VitrineDetail | null = s
    ? {
        splash: s.splashPath,
        name: s.name,
        kicker: champ.get(s.championId),
        body: (
          <>
            <p class="rlc-vt-line">{[rarityName(rarity(s)), line(s)].filter(Boolean).join(' · ')}</p>
            <Dots chromas={skinData[s.id]?.chromas ?? []} ownedInv={ownedInv} />
          </>
        ),
      }
    : null;
  return (
    <Vitrine
      items={items}
      placeholder={t('colSearchSkin')}
      onPick={(i) => setSel(Number(i.id))}
      detail={detail}
      onClose={() => setSel(null)}
      tools={
        <>
          <Chip on={!f.rarity} count={rarityRows.length} onClick={() => set({ rarity: '' })}>
            {t('colAllRarities')}
          </Chip>
          {counted(RARITY_TAGS, rarityN, rarityName, f.rarity).map(([k, label, n]) => (
            <Chip key={k} on={f.rarity === k} count={n} onClick={() => set({ rarity: f.rarity === k ? '' : k })}>
              {label}
            </Chip>
          ))}
          <span class="rlc-vt-sep" />
          <OwnSelect value={f.own} rows={facet(rows, tests, 'own')} owned={(x) => !!x.ownership?.owned} onChange={(own) => set({ own })} />
          <Select
            label={t('colGroup')}
            value={f.group}
            options={[
              ['champion', t('colGroupChampion')],
              ['line', t('colGroupLine')],
              ['rarity', t('colGroupRarity')],
              ['none', t('colGroupNone')],
            ]}
            onChange={(g) => set({ group: g })}
          />
          <Select
            label={t('colSort')}
            value={f.sort}
            options={[
              ['name', t('colSortName')],
              ['rarity', t('colSortRarity')],
            ]}
            onChange={(sort) => set({ sort })}
          />
        </>
      }
    />
  );
}

/** Cromas das skins que o jogador tem, agrupadas por campeão; "Todos" mostra também as que faltam. */
function ChromasTab({ champions, skins, skinData, ownedInv, ownedSkinIds }: Shared & { ownedSkinIds: Set<number> }) {
  const [f, set] = useSaved('chromas', { own: 'owned' });
  const [sel, setSel] = useState<number | null>(null);
  const champ = new Map(champions.map((c) => [c.id, c.name]));
  const all = skins
    .filter((s) => ownedSkinIds.has(s.id))
    .flatMap((s) => (skinData[s.id]?.chromas ?? []).map((c) => ({ c, s, who: champ.get(s.championId) ?? '' })))
    .sort((a, b) => a.who.localeCompare(b.who) || a.s.name.localeCompare(b.s.name) || a.c.name.localeCompare(b.c.name));
  const rows = all.filter(({ c }) => ownTest(f.own, ownedInv.has(c.id)));
  const items: VitrineItem[] = rows.map(({ c, s, who }) => ({ id: c.id, name: c.name, art: c.chromaPath, owned: ownedInv.has(c.id), group: who || undefined, search: `${s.name} ${who}` }));
  const row = rows.find(({ c }) => c.id === sel);
  const detail: VitrineDetail | null = row ? { splash: row.s.splashPath, name: row.c.name, kicker: row.s.name, body: <Dots chromas={[row.c]} ownedInv={ownedInv} /> } : null;
  return (
    <Vitrine
      square
      items={items}
      placeholder={t('colSearchSkin')}
      onPick={(i) => setSel(Number(i.id))}
      detail={detail}
      onClose={() => setSel(null)}
      tools={<OwnSelect value={f.own} rows={all} owned={({ c }) => ownedInv.has(c.id)} onChange={(own) => set({ own })} />}
    />
  );
}

function IconsTab({ owned }: { owned: Set<number> }) {
  const [f, set] = useSaved('icons', { own: 'owned', set: '', year: '', sort: 'recent' });
  // Os nomes vêm do game data; ícone sem nome fica sem legenda (nunca o id).
  const data = useJson<IconData[]>('/lol-game-data/assets/v1/summoner-icons.json') ?? [];
  const sets = (useJson<IconSet[]>('/lol-game-data/assets/v1/summoner-icon-sets.json') ?? []).filter((x) => !x.hidden && x.displayName).sort((a, b) => a.displayName.localeCompare(b.displayName));
  const setsOf = new Map<number, string[]>();
  for (const x of sets) for (const id of x.icons) setsOf.set(id, [...(setsOf.get(id) ?? []), String(x.id)]);
  const setKeys = (i: IconData) => setsOf.get(i.id) ?? ['none'];
  const year = (i: IconData) => (i.yearReleased ? String(i.yearReleased) : '');
  const tests = {
    own: (i: IconData) => ownTest(f.own, owned.has(i.id)),
    set: (i: IconData) => !f.set || setKeys(i).includes(f.set),
    year: (i: IconData) => !f.year || year(i) === f.year,
  };
  const setN = tally(facet(data, tests, 'set'), setKeys);
  const yearN = tally(facet(data, tests, 'year'), year);
  const recent = f.sort !== 'name';
  const list = facet(data, tests).sort(recent ? (a, b) => (b.yearReleased ?? 0) - (a.yearReleased ?? 0) || b.id - a.id : (a, b) => (a.title || '￿').localeCompare(b.title || '￿'));
  const items: VitrineItem[] = list.map((i) => ({ id: i.id, name: i.title ?? '', art: profileIcon(i.id), owned: owned.has(i.id), pill: owned.has(i.id) ? undefined : t('colNotOwned'), group: recent ? year(i) || undefined : undefined }));
  // Só equipa ícone que o jogador tem; os outros ficam apagados com o selo.
  const equip = (id: number) => owned.has(id) && void request('PUT', '/lol-summoner/v1/current-summoner/icon', { profileIconId: id }).catch(() => {});
  const setName = new Map(sets.map((x) => [String(x.id), x.displayName]));
  return (
    <Vitrine
      square
      items={items}
      placeholder={t('search')}
      onPick={(i) => equip(Number(i.id))}
      detail={null}
      onClose={() => {}}
      tools={
        <>
          <OwnSelect value={f.own} rows={facet(data, tests, 'own')} owned={(i) => owned.has(i.id)} onChange={(own) => set({ own })} />
          <Select label={t('colIconSet')} value={f.set} options={[['', t('colAllSets')], ...counted([...setName.keys(), 'none'], setN, (k) => setName.get(k) ?? t('colNoSet'), f.set)]} onChange={(s) => set({ set: s })} />
          <Select label={t('colYear')} value={f.year} options={[['', t('colAllYears')], ...counted([...yearN.keys()].filter(Boolean).sort().reverse(), yearN, (y) => y, f.year)]} onChange={(y) => set({ year: y })} />
          <Select
            label={t('colSort')}
            value={f.sort}
            options={[
              ['recent', t('colSortRecent')],
              ['name', t('colSortName')],
            ]}
            onChange={(sort) => set({ sort })}
          />
          <small class="rlc-muted">{t('clickToEquip')}</small>
        </>
      }
    />
  );
}

/** Busca, posse e ordem (nome ou mais recentes, pelo id) para seções sem outras facetas. */
function SortSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select
      label={t('colSort')}
      value={value}
      options={[
        ['name', t('colSortName')],
        ['recent', t('colSortRecent')],
      ]}
      onChange={onChange}
    />
  );
}
const byNameOrRecent = <T extends { id: number; name: string }>(sort: string): Cmp<T> => (sort === 'recent' ? (a, b) => b.id - a.id : (a, b) => a.name.localeCompare(b.name));

function WardsTab({ wards }: { wards: Ward[] }) {
  const [f, set] = useSaved('wards', { own: 'owned', sort: 'name' });
  const [sel, setSel] = useState<number | null>(null);
  const items: VitrineItem[] = wards
    .filter((w) => ownTest(f.own, !!w.ownership?.owned))
    .sort(byNameOrRecent(f.sort))
    .map((w) => ({ id: w.id, name: w.name, art: w.wardImagePath, owned: !!w.ownership?.owned, pill: w.ownership?.owned ? undefined : t('colNotOwned'), search: stripTags(w.description ?? '') }));
  const w = wards.find((x) => x.id === sel);
  const detail: VitrineDetail | null = w ? { splash: w.wardImagePath, name: w.name, body: w.description ? <p class="rlc-vt-line">{stripTags(w.description)}</p> : null } : null;
  return (
    <Vitrine
      square
      items={items}
      placeholder={t('search')}
      onPick={(i) => setSel(Number(i.id))}
      detail={detail}
      onClose={() => setSel(null)}
      tools={
        <>
          <OwnSelect value={f.own} rows={wards} owned={(x) => !!x.ownership?.owned} onChange={(own) => set({ own })} />
          <SortSelect value={f.sort} onChange={(sort) => set({ sort })} />
        </>
      }
    />
  );
}

function EmotesTab({ emotes, owned }: { emotes: Emote[]; owned: Set<number> }) {
  const [f, set] = useSaved('emotes', { own: 'owned', sort: 'name' });
  const [sel, setSel] = useState<number | null>(null);
  // Entradas sem nome ou sem arte (pasta vazia) são internas do jogo.
  const rows = emotes.filter((e) => e.name && e.inventoryIcon && !e.inventoryIcon.endsWith('/'));
  const items: VitrineItem[] = rows
    .filter((e) => ownTest(f.own, owned.has(e.id)))
    .sort(byNameOrRecent(f.sort))
    .map((e) => ({ id: e.id, name: e.name, art: e.inventoryIcon, owned: owned.has(e.id), pill: owned.has(e.id) ? undefined : t('colNotOwned'), search: stripTags(e.description ?? '') }));
  const e = rows.find((x) => x.id === sel);
  const detail: VitrineDetail | null = e ? { splash: e.inventoryIcon, name: e.name, body: e.description ? <p class="rlc-vt-line">{stripTags(e.description)}</p> : null } : null;
  return (
    <Vitrine
      square
      items={items}
      placeholder={t('search')}
      onPick={(i) => setSel(Number(i.id))}
      detail={detail}
      onClose={() => setSel(null)}
      tools={
        <>
          <OwnSelect value={f.own} rows={rows} owned={(x) => owned.has(x.id)} onChange={(own) => set({ own })} />
          <SortSelect value={f.sort} onChange={(sort) => set({ sort })} />
        </>
      }
    />
  );
}

function SpellsTab({ spells }: { spells: Spell[] }) {
  const [f, set] = useSaved('spells', { mode: '' });
  const [sel, setSel] = useState<number | null>(null);
  const modeN = tally(spells, (s) => s.gameModes);
  const items: VitrineItem[] = spells
    .filter((s) => !f.mode || s.gameModes.includes(f.mode))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => ({ id: s.id, name: s.name, art: s.iconPath, owned: true }));
  const s = spells.find((x) => x.id === sel);
  const detail: VitrineDetail | null = s
    ? {
        splash: s.iconPath,
        name: s.name,
        body: (
          <>
            <p class="rlc-vt-line">{stripTags(s.description)}</p>
            <h3 class="rlc-vt-sub">{t('colModes')}</h3>
            <div class="rlc-vt-modes">
              {modeNames(s.gameModes).map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </>
        ),
      }
    : null;
  return (
    <Vitrine
      square
      items={items}
      placeholder={t('search')}
      onPick={(i) => setSel(Number(i.id))}
      detail={detail}
      onClose={() => setSel(null)}
      tools={<Select label={t('colModes')} value={f.mode} options={[['', t('colAllModes'), spells.length], ...counted(MODES, modeN, (m) => t(`colMode_${m}` as TextKey), f.mode)]} onChange={(mode) => set({ mode })} />}
    />
  );
}
