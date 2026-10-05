import { useEffect, useState } from 'preact/hooks';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import { profileIcon } from '../../shell/RightColumn';
import { LANES, type Lane } from '../champselect/Drawer';
import { positionKey } from '../lobby/format';
import { getJson } from '../profile/data';
import { Chip, Cinema, type CinemaItem } from './Cinema';
import { Loot } from './Loot';
import { Runes } from './Runes';

type Tab = 'champions' | 'skins' | 'runes' | 'spells' | 'icons' | 'wards' | 'emotes' | 'loot';
const TABS: Array<[Tab, TextKey]> = [
  ['champions', 'colChampions'],
  ['skins', 'colSkins'],
  ['runes', 'colRunes'],
  ['spells', 'colSpells'],
  ['icons', 'colIcons'],
  ['wards', 'colWards'],
  ['emotes', 'colEmotes'],
  ['loot', 'colLoot'],
];

interface Champion {
  id: number;
  name: string;
  title: string;
  roles: string[];
  baseSplashPath: string;
  squarePortraitPath: string;
  ownership?: { owned?: boolean };
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

/** Coleção: campeões, skins, runas, feitiços, ícones, sentinelas, emotes e espólios, na linguagem cinematográfica. */
export function Collection({ lcu }: { lcu: Lcu }) {
  const [tab, setTab] = useState<Tab>('champions');
  const [skinChampion, setSkinChampion] = useState<number | null>(null);
  const me = lcu.chatMe.value.data;
  const sid = me?.summonerId;
  // A lista traz variantes de modo (Jade_Ahri, id 60103) com o mesmo nome; campeões de verdade têm id abaixo de 10000.
  // ponytail: corte por id; trocar por champion-summary se a Riot passar de 9999 campeões.
  const champions = (useJson<Champion[]>(sid ? `/lol-champions/v1/inventories/${sid}/champions-minimal` : null) ?? []).filter((c) => c.id < 10000);
  const skins = useJson<Skin[]>(sid ? `/lol-champions/v1/inventories/${sid}/skins-minimal` : null) ?? [];
  const mastery = useJson<Array<{ championId: number; championLevel: number; championPoints: number }>>(me?.puuid ? `/lol-champion-mastery/v1/${encodeURIComponent(me.puuid)}/champion-mastery` : null) ?? [];

  return (
    <section class="rlc-collection">
      <nav class="rlc-tabs-text">
        {TABS.map(([k, label]) => (
          <button
            type="button"
            key={k}
            aria-current={tab === k ? 'page' : undefined}
            onClick={() => {
              setTab(k);
              if (k !== 'skins') setSkinChampion(null);
            }}
          >
            {t(label)}
          </button>
        ))}
      </nav>
      {tab === 'champions' ? (
        <ChampionsTab
          lcu={lcu}
          champions={champions}
          skins={skins}
          mastery={mastery}
          onEnter={(id) => {
            setSkinChampion(id);
            setTab('skins');
          }}
        />
      ) : null}
      {tab === 'skins' ? <SkinsTab sid={sid} champions={champions} skins={skins} champion={skinChampion} onClearChampion={() => setSkinChampion(null)} /> : null}
      {tab === 'runes' ? <Runes lcu={lcu} /> : null}
      {tab === 'spells' ? <SpellsTab lcu={lcu} /> : null}
      {tab === 'icons' ? <IconsTab /> : null}
      {tab === 'wards' ? <WardsTab sid={sid} /> : null}
      {tab === 'emotes' ? <EmotesTab /> : null}
      {tab === 'loot' ? <Loot lcu={lcu} /> : null}
    </section>
  );
}

type ChampSection = 'favorites' | 'mastery' | 'all';

function ChampionsTab({ lcu, champions, skins, mastery, onEnter }: { lcu: Lcu; champions: Champion[]; skins: Skin[]; mastery: Array<{ championId: number; championLevel: number; championPoints: number }>; onEnter: (id: number) => void }) {
  const [section, setSection] = useState<ChampSection>('all');
  const [mine, setMine] = useState(false);
  const [lane, setLane] = useState<Lane | null>(null);
  const lanes = lcu.lanes.value.data ?? {};
  const favorites = new Set((lcu.gridChampions.value.data ?? []).filter((c) => (c.positionsFavorited ?? []).length).map((c) => c.id));
  const masteryOf = new Map(mastery.map((m) => [m.championId, m]));
  const n = new Intl.NumberFormat(locale(), { notation: 'compact' });
  let list = champions.filter((c) => c.id > 0 && (!mine || c.ownership?.owned) && (!lane || (lanes[String(c.id)]?.recommendedPositions ?? []).includes(lane)));
  if (section === 'favorites') list = list.filter((c) => favorites.has(c.id));
  list =
    section === 'mastery'
      ? list.filter((c) => masteryOf.has(c.id)).sort((a, b) => masteryOf.get(b.id)!.championPoints - masteryOf.get(a.id)!.championPoints)
      : [...list].sort((a, b) => a.name.localeCompare(b.name));
  const items: CinemaItem[] = list.map((c) => {
    const m = masteryOf.get(c.id);
    const owned = skins.filter((s) => s.championId === c.id && !s.isBase && s.ownership?.owned).length;
    return {
      id: c.id,
      name: c.name,
      tile: c.squarePortraitPath,
      splash: c.baseSplashPath,
      owned: !!c.ownership?.owned,
      kicker: c.title,
      detail: [c.roles.map((r) => t(`role_${r}` as TextKey)).join(' · '), m ? `${t('profileMastery')} ${m.championLevel} · ${n.format(m.championPoints)}` : '', `${owned} ${t('skinsOwned')}`].filter(Boolean).join(' · '),
    };
  });
  return (
    <Cinema
      items={items}
      onEnter={(i) => onEnter(Number(i.id))}
      chips={
        <>
          {favorites.size ? (
            <Chip on={section === 'favorites'} onClick={() => setSection('favorites')}>
              {t('favorites')}
            </Chip>
          ) : null}
          <Chip on={section === 'mastery'} onClick={() => setSection('mastery')}>
            {t('topMastery')}
          </Chip>
          <Chip on={section === 'all'} onClick={() => setSection('all')}>
            {t('allChampions')}
          </Chip>
          <span class="rlc-cn-sep" />
          <Chip on={mine} onClick={() => setMine(!mine)}>
            {t('onlyMine')}
          </Chip>
          {LANES.map((l) => (
            <Chip key={l} on={lane === l} onClick={() => setLane(lane === l ? null : l)}>
              {t(positionKey(l)!)}
            </Chip>
          ))}
        </>
      }
    />
  );
}

function SkinsTab({ sid, champions, skins, champion, onClearChampion }: { sid: number | undefined; champions: Champion[]; skins: Skin[]; champion: number | null; onClearChampion: () => void }) {
  const [all, setAll] = useState(false);
  const name = new Map(champions.map((c) => [c.id, c.name]));
  const list = skins
    .filter((s) => (all || s.ownership?.owned) && (champion === null || s.championId === champion))
    .sort((a, b) => (name.get(a.championId) ?? '').localeCompare(name.get(b.championId) ?? '') || Number(b.isBase) - Number(a.isBase) || a.name.localeCompare(b.name));
  const items: CinemaItem[] = list.map((s) => ({ id: s.id, name: s.name, tile: s.tilePath, splash: s.splashPath, owned: !!s.ownership?.owned, kicker: name.get(s.championId) }));
  return (
    <Cinema
      items={items}
      extra={(i) => <Chromas sid={sid} skin={skins.find((s) => s.id === i.id)} />}
      chips={
        <>
          <Chip on={!all} onClick={() => setAll(false)}>
            {t('onlyMineSkins')}
          </Chip>
          <Chip on={all} onClick={() => setAll(true)}>
            {t('allSkins')}
          </Chip>
          {champion !== null ? (
            <Chip on onClick={onClearChampion}>
              {`${name.get(champion) ?? ''} ✕`}
            </Chip>
          ) : null}
        </>
      }
    />
  );
}

/** Cromas da skin em foco como bolinhas de cor. */
function Chromas({ sid, skin }: { sid: number | undefined; skin: Skin | undefined }) {
  const list = useJson<Array<{ id: number; name: string; colors?: string[]; ownership?: { owned?: boolean } }>>(sid && skin && !skin.isBase ? `/lol-champions/v1/inventories/${sid}/champions/${skin.championId}/skins/${skin.id}/chromas` : null) ?? [];
  if (!list.length) return null;
  return (
    <div class="rlc-cn-chromas">
      {list.map((c) => (
        <span key={c.id} class="rlc-cn-chroma" aria-label={c.name} title={c.name} data-owned={c.ownership?.owned ? 'true' : 'false'} style={c.colors?.[0] ? { background: c.colors[0] } : undefined} />
      ))}
    </div>
  );
}

function SpellsTab({ lcu }: { lcu: Lcu }) {
  const [spells, setSpells] = useState<Awaited<ReturnType<Lcu['game']['spells']>>>(new Map());
  useEffect(() => {
    let live = true;
    void lcu.game.spells().then((m) => live && setSpells(m));
    return () => void (live = false);
  }, [lcu]);
  const items: CinemaItem[] = [...spells.values()].sort((a, b) => a.name.localeCompare(b.name)).map((s) => ({ id: s.id, name: s.name, tile: s.icon, owned: true, detail: s.gameModes.join(' · ') }));
  return <Cinema square items={items} chips={null} />;
}

function IconsTab() {
  const list = useJson<Array<{ itemId: number; owned: boolean }>>('/lol-inventory/v2/inventory/SUMMONER_ICON') ?? [];
  const equip = (id: number) => void request('PUT', '/lol-summoner/v1/current-summoner/icon', { profileIconId: id }).catch(() => {});
  const items: CinemaItem[] = list.filter((i) => i.owned).sort((a, b) => b.itemId - a.itemId).map((i) => ({ id: i.itemId, name: String(i.itemId), tile: profileIcon(i.itemId), owned: true }));
  return <Cinema square items={items} chips={<small class="rlc-muted">{t('clickToEquip')}</small>} onEnter={(i) => equip(Number(i.id))} />;
}

function WardsTab({ sid }: { sid: number | undefined }) {
  const [all, setAll] = useState(false);
  const list = useJson<Array<{ id: number; name: string; wardImagePath: string; description: string; ownership?: { owned?: boolean } }>>(sid ? `/lol-collections/v1/inventories/${sid}/ward-skins` : null) ?? [];
  const items: CinemaItem[] = list.filter((w) => all || w.ownership?.owned).map((w) => ({ id: w.id, name: w.name, tile: w.wardImagePath, owned: !!w.ownership?.owned, detail: w.description }));
  return (
    <Cinema
      square
      items={items}
      chips={
        <>
          <Chip on={!all} onClick={() => setAll(false)}>
            {t('onlyMine')}
          </Chip>
          <Chip on={all} onClick={() => setAll(true)}>
            {t('allChampions')}
          </Chip>
        </>
      }
    />
  );
}

function EmotesTab() {
  const owned = useJson<Array<{ itemId: number; owned: boolean }>>('/lol-inventory/v1/inventory/emotes') ?? [];
  const data = useJson<Array<{ id: number; name: string; inventoryIcon: string }>>('/lol-game-data/assets/v1/summoner-emotes.json') ?? [];
  const byId = new Map(data.map((e) => [e.id, e]));
  const items: CinemaItem[] = owned
    .filter((e) => e.owned && byId.has(e.itemId))
    .map((e) => ({ id: e.itemId, name: byId.get(e.itemId)!.name, tile: byId.get(e.itemId)!.inventoryIcon, owned: true }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return <Cinema square items={items} chips={null} />;
}
