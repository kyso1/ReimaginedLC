import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Spell } from '../../data/gamedata';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolPerksPerkPageResource, LolPerksPlayerInventory } from '../../lcu/types';
import { Confirm } from '../../shell/overlays/Confirm';
import { prefs } from '../../shell/prefs';
import { Crossfade } from '../../ui/Crossfade';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { changePrimary, changeSub, fromIds, fromPage, isComplete, pickSecondary, plain, selectedIds, slotsOf, type Draft, type Perk, type Style } from '../collection/runeLogic';
import { getJson } from '../profile/data';
import { useDecoded } from '../../ui/useDecoded';
import { opggPosition, OPGG_REGION, OPGG_POSITIONS, recommendVs, type OpggPosition, type Rec } from './opgg';

type Page = LolPerksPerkPageResource;
type Me = { spell1Id: number; spell2Id: number };

// Escritas de runas: endpoints listados na LCU, corpo ainda não conferido no client ao vivo.
const PAGES = '/lol-perks/v1/pages';
const CURRENT = '/lol-perks/v1/currentpage';
const INVENTORY = '/lol-perks/v1/inventory';
const MY_SELECTION = '/lol-champ-select/v1/session/my-selection';
const FLASH = 4;

const POS_TEXT: Record<OpggPosition, TextKey> = { TOP: 'posTOP', JUNGLE: 'posJUNGLE', MID: 'posMIDDLE', ADC: 'posBOTTOM', SUPPORT: 'posUTILITY' };

/** O que a seleção de campeões passa para o painel de recomendações. */
export interface RecoContext {
  championId: number;
  /** Posição atribuída (`middle`) ou a recomendada para o campeão (`MIDDLE`). */
  position: string;
  /** Campeões do time inimigo; 0 = vaga ainda escolhendo. */
  enemies: number[];
  /** Adversário da rota já confirmado (0 = ainda não se sabe). */
  laneEnemy: number;
  champions: Map<number, { name: string; icon?: string }>;
  spells: Map<number, Spell>;
  me: Me;
}

/** Feitiços na ordem da recomendação, mas com o Flash na tecla que o jogador já usa. */
export function spellOrder([a, b]: [number, number], me: Me) {
  const swap = (me.spell2Id === FLASH && a === FLASH) || (me.spell1Id === FLASH && b === FLASH);
  return swap ? { spell1Id: b, spell2Id: a } : { spell1Id: a, spell2Id: b };
}

const regionOf = (_lcu: Lcu) => OPGG_REGION;

const fold = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const escape = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Campeão do fundo fora da seleção: o que aparece no nome da página ("Yasuo Topo"; vale o nome mais longo, palavra
 * inteira, sem acento), senão o de maior maestria. 0 = nenhum (o fundo fica só nas cores das árvores).
 */
export function backdropChampion(pageName: string, champions: Map<number, { name: string }>, mastery: Array<{ championId: number; championPoints: number }>): number {
  const name = fold(pageName);
  let best: { id: number; len: number } | null = null;
  for (const [id, c] of champions) {
    const n = fold(c.name);
    if (n && (!best || n.length > best.len) && new RegExp(`(^|[^a-z0-9])${escape(n)}($|[^a-z0-9])`).test(name)) best = { id, len: n.length };
  }
  if (best) return best.id;
  return mastery.reduce<{ championId: number; championPoints: number } | null>((a, m) => (!a || m.championPoints > a.championPoints ? m : a), null)?.championId ?? 0;
}

/** Splash do fundo: a skin que a seleção passa ou, sem ela, a base do campeão escolhido por `backdropChampion`. */
function useBackdrop(lcu: Lcu, pageName: string, artSkin: number | null | undefined): string | null {
  const [champions, setChampions] = useState<Map<number, { name: string }>>(new Map());
  const [mastery, setMastery] = useState<Array<{ championId: number; championPoints: number }>>([]);
  const puuid = artSkin ? null : lcu.chatMe.value.data?.puuid;
  useEffect(() => {
    if (artSkin) return;
    let live = true;
    void lcu.game.champions().then((c) => live && setChampions(c)).catch(() => {});
    if (puuid) void getJson<Array<{ championId: number; championPoints: number }>>(`/lol-champion-mastery/v1/${encodeURIComponent(puuid)}/champion-mastery`).then((m) => live && setMastery(m ?? []));
    return () => void (live = false);
  }, [!artSkin, puuid]);
  const champion = artSkin ? 0 : backdropChampion(pageName, champions, mastery);
  const skin = artSkin || champion * 1000;
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(null);
    if (!skin) return;
    let live = true;
    void lcu.game.splash(skin).then((u) => live && setUrl(u)).catch(() => {});
    return () => void (live = false);
  }, [skin]);
  return useDecoded(url);
}
const recName = (reco: RecoContext, pos: OpggPosition) => `${reco.champions.get(reco.championId)?.name ?? ''} ${t(POS_TEXT[pos])}`.trim();
const pct = (x: number) => new Intl.NumberFormat(locale(), { style: 'percent', maximumFractionDigits: 1 }).format(x);

/** Página editável que recebe a recomendação quando não cabe uma nova: a preferida, a atual ou a primeira. */
function target(pages: Page[], prefer: number | null): Page | null {
  const editable = pages.filter((p) => p.isEditable);
  return editable.find((p) => p.id === prefer) ?? editable.find((p) => p.current) ?? editable[0] ?? null;
}

/**
 * Grava a recomendação: página nova se ainda cabe, senão sobrescreve a editável. Com `me`, troca também os feitiços.
 * Devolve o id da página gravada. (POST/PUT de páginas a confirmar no client ao vivo.)
 */
export async function applyRec(rec: Rec, opts: { name: string; pages: Page[]; prefer: number | null; me?: Me | null }): Promise<number | null> {
  const body = { name: opts.name, primaryStyleId: rec.primary, subStyleId: rec.sub, selectedPerkIds: rec.perks, current: true };
  const inventory = await getJson<LolPerksPlayerInventory>(INVENTORY);
  let id: number | null = null;
  if (inventory?.canAddCustomPage) {
    id = (await request<Page>('POST', PAGES, body))?.id ?? null;
  } else {
    const page = target(opts.pages, opts.prefer);
    if (page) {
      await request('PUT', `${PAGES}/${page.id}`, { ...page, ...body });
      if (!page.current) await request('PUT', CURRENT, page.id);
      id = page.id;
    }
  }
  if (opts.me && rec.spells) await request('PATCH', MY_SELECTION, spellOrder(rec.spells, opts.me));
  return id;
}

/**
 * Com `runesApplyOnLock`, aplica a melhor recomendação quando o campeão do jogador é confirmado; com `runesMatchup`,
 * aplica de novo uma vez quando o adversário da rota aparece depois (a matchup que não tem amostra cai na geral).
 */
export function useApplyOnLock(lcu: Lcu, reco: RecoContext | null, locked: boolean, sessionId: string) {
  const done = useRef<string | null>(null);
  const championId = reco?.championId ?? 0;
  const enemy = prefs.value.runesMatchup ? (reco?.laneEnemy ?? 0) : 0;
  useEffect(() => {
    if (!reco || !locked || championId <= 0 || !prefs.value.runesApplyOnLock) return;
    const key = `${sessionId}/${championId}/${enemy}`;
    if (done.current === key) return;
    done.current = key;
    const pos = opggPosition(reco.position) ?? 'MID';
    void recommendVs(regionOf(lcu), championId, pos, enemy)
      .then(({ recs }) => (recs?.[0] ? applyRec(recs[0], { name: recName(reco, pos), pages: lcu.perkPages.value.data ?? [], prefer: lcu.currentPerkPage.value.data?.id ?? null, me: reco.me }) : null))
      .catch(() => {});
  }, [locked, championId, sessionId, enemy]);
}

/**
 * Editor de runas no padrão do editor oficial: nome e ações no topo; principal com a trilha e as pedras-chave;
 * secundária com 2 escolhas e os fragmentos; nome e descrição da escolha ao lado de cada linha. Ao fundo, a splash do
 * campeão desfocada e tingida nas cores das duas árvores (`artSkin` na seleção; na Coleção, `backdropChampion`).
 * `overlay` cobre o centro e a direita da seleção; `full` ocupa a tela da Coleção.
 */
export function RuneEditor({ lcu, mode, initialPageId = null, reco = null, artSkin = null, onClose }: { lcu: Lcu; mode: 'overlay' | 'full'; initialPageId?: number | null; reco?: RecoContext | null; artSkin?: number | null; onClose: () => void }) {
  const [styles, setStyles] = useState<Style[]>([]);
  const [perks, setPerks] = useState<Map<number, Perk>>(new Map());
  const [inventory, setInventory] = useState<LolPerksPlayerInventory | null>(null);
  const loadInventory = () => void getJson<LolPerksPlayerInventory>(INVENTORY).then(setInventory);
  useEffect(() => {
    let live = true;
    void getJson<Style[]>('/lol-perks/v1/styles').then((s) => live && setStyles(s ?? []));
    void getJson<Perk[]>('/lol-perks/v1/perks').then((p) => live && setPerks(new Map((p ?? []).map((x) => [x.id, x]))));
    loadInventory();
    return () => void (live = false);
  }, []);

  const pages = lcu.perkPages.value.data ?? [];
  const [pageId, setPageId] = useState<number | null>(initialPageId);
  const page = pages.find((p) => p.id === pageId) ?? pages.find((p) => p.current) ?? pages[0] ?? null;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [name, setName] = useState('');
  useEffect(() => {
    if (!styles.length) return;
    if (page) {
      setDraft(fromPage(page, styles));
      setName(page.name);
    } else {
      const s = styles[0]!;
      setDraft(fromIds(s.id, s.defaultSubStyle, s.defaultPerks));
      setName('');
    }
  }, [page?.id, page?.lastModified, styles.length]);

  const [detail, setDetail] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [recoOpen, setRecoOpen] = useState(!!reco && prefs.value.runesAuto);
  const [deleting, setDeleting] = useState(false);
  const [tip, setTip] = useState<{ id: number; x: number; y: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  // Com o diálogo de apagar aberto, o Escape fecha só o diálogo.
  useEscape(() => !deleting && onClose());

  const save = useAction(() => request('PUT', `${PAGES}/${page!.id}`, { ...page, name: name.trim() || page!.name, primaryStyleId: draft!.primary, subStyleId: draft!.sub, selectedPerkIds: selectedIds(draft!) }));
  const create = useAction(async () => {
    const created = await request<Page>('POST', PAGES, { name: t('newPage'), primaryStyleId: draft?.primary, subStyleId: draft?.sub, selectedPerkIds: draft ? selectedIds(draft) : [], current: true });
    if (created?.id) setPageId(created.id);
    loadInventory();
  });
  const choose = useAction((id: number) => request('PUT', CURRENT, id));
  const canCreate = inventory?.canAddCustomPage !== false;

  const primary = styles.find((s) => s.id === draft?.primary);
  const sub = styles.find((s) => s.id === draft?.sub);
  const art = useBackdrop(lcu, name || page?.name || '', artSkin);

  const showTip = (id: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const b = root.current?.getBoundingClientRect();
    setTip({ id, x: r.right - (b?.left ?? 0) + 10, y: r.top - (b?.top ?? 0) });
  };
  const rune = (id: number, on: boolean, onPick: () => void, kind?: 'key' | 'shard', key: string | number = id) => {
    const p = perks.get(id);
    return (
      <button type="button" key={key} class="rlc-re-rune" data-kind={kind} data-id={id} aria-pressed={on} aria-label={p?.name ?? ''} onMouseEnter={(e) => showTip(id, e.currentTarget)} onMouseLeave={() => setTip(null)} onFocus={(e) => showTip(id, e.currentTarget)} onBlur={() => setTip(null)} onClick={onPick}>
        {p?.iconPath ? <img src={p.iconPath} alt="" /> : null}
      </button>
    );
  };
  const desc = (id: number | undefined) => {
    const p = id ? perks.get(id) : undefined;
    return p ? (
      <span class="rlc-re-desc">
        <b>{p.name}</b>
        <span>{plain(detail ? (p.longDesc ?? p.shortDesc) : (p.shortDesc ?? p.longDesc))}</span>
      </span>
    ) : null;
  };
  const slot = (ids: number[], selected: number | undefined, buttons: ComponentChildren, key: string, kind?: string) => (
    <div class="rlc-re-slot" data-kind={kind} data-done={selected ? ids.includes(selected) : false} key={key}>
      {buttons}
      {kind === 'shard' ? null : desc(selected && ids.includes(selected) ? selected : undefined)}
    </div>
  );
  const treeIcon = (s: Style | undefined) => (s?.iconPath ? <img src={s.iconPath} alt="" /> : null);
  const pickers = (options: Style[], onPick: (id: number) => void) =>
    options.map((s) => (
      <button type="button" key={s.id} class="rlc-re-tree-pick" aria-label={s.name} title={s.name} onClick={() => onPick(s.id)}>
        {treeIcon(s)}
      </button>
    ));

  const tipPerk = tip ? perks.get(tip.id) : undefined;

  return (
    <div class="rlc-re" data-mode={mode} ref={root} role="dialog" aria-label={t('runePages')}>
      <div class="rlc-re-art" data-primary={draft?.primary} data-sub={draft?.sub} aria-hidden="true">
        <Crossfade src={art} class="rlc-re-art-splash" />
      </div>
      <header class="rlc-re-top">
        <div class="rlc-re-name">
          <span aria-hidden="true">✎</span>
          <input class="rlc-re-name-input" aria-label={t('pageName')} value={name} maxLength={50} disabled={!page?.isEditable} onInput={(e) => setName(e.currentTarget.value)} />
          <button type="button" class="rlc-re-list-toggle" aria-label={t('runePages')} aria-expanded={listOpen} onClick={() => setListOpen(!listOpen)}>
            ▾
          </button>
          {listOpen ? (
            <div class="rlc-re-list" role="menu">
              {pages.map((p) => (
                <button
                  type="button"
                  role="menuitemradio"
                  key={p.id}
                  class="rlc-re-list-item"
                  aria-checked={p === page}
                  disabled={choose.pending}
                  onClick={() => {
                    setListOpen(false);
                    setPageId(p.id);
                    if (!p.current) choose.run(p.id);
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button type="button" class="rlc-button" data-variant="primary" disabled={!page?.isEditable || !draft || !isComplete(draft) || save.pending} onClick={() => save.run()}>
          {t('save')}
        </button>
        <button type="button" class="rlc-button" data-variant="pill" disabled={!canCreate || !draft || create.pending} title={canCreate ? undefined : t('runeFull')} onClick={() => create.run()}>
          {t('runeNew')}
        </button>
        <button type="button" class="rlc-button" data-variant="pill" disabled={!page?.isDeletable} onClick={() => setDeleting(true)}>
          {t('runeDelete')}
        </button>
        {reco ? (
          <button type="button" class="rlc-re-chip" aria-pressed={recoOpen} onClick={() => setRecoOpen(!recoOpen)}>
            {t('runeRecommended')}
          </button>
        ) : null}
        <button type="button" class="rlc-re-close" aria-label={t('close')} title={t('close')} onClick={onClose}>
          ✕
        </button>
      </header>

      {draft && primary ? (
        <div class="rlc-re-cols">
          <div class="rlc-re-col" data-tree={primary.id}>
            <div class="rlc-re-trees">
              <span class="rlc-re-tree-big">{treeIcon(primary)}</span>
              <b class="rlc-re-tree-name">{primary.name}</b>
              {pickers(styles.filter((s) => s.id !== primary.id), (id) => setDraft(changePrimary(draft, id, styles)))}
            </div>
            <div class="rlc-re-rows">
              <div class="rlc-re-label">{t('runeKeystones')}</div>
              {slot(slotsOf(primary).keystone, draft.keystone, slotsOf(primary).keystone.map((id) => rune(id, draft.keystone === id, () => setDraft({ ...draft, keystone: id }), 'key')), 'k')}
              {slotsOf(primary).rows.map((row, i) =>
                slot(
                  row,
                  draft.primaryPerks[i],
                  row.map((id) =>
                    rune(id, draft.primaryPerks[i] === id, () => {
                      const next = [...draft.primaryPerks];
                      next[i] = id;
                      setDraft({ ...draft, primaryPerks: next });
                    }),
                  ),
                  `p${i}`,
                ),
              )}
            </div>
          </div>
          <div class="rlc-re-col" data-tree={sub?.id ?? 0} data-side="sub">
            <div class="rlc-re-trees">
              <span class="rlc-re-tree-big">{treeIcon(sub)}</span>
              <b class="rlc-re-tree-name">{sub?.name ?? ''}</b>
            </div>
            <div class="rlc-re-trees">{pickers(styles.filter((s) => s.id !== draft.sub && primary.allowedSubStyles.includes(s.id)), (id) => setDraft(changeSub(draft, id)))}</div>
            <div class="rlc-re-rows">
              {(sub ? slotsOf(sub).rows : []).map((row, i) =>
                slot(
                  row,
                  draft.secondary.find((p) => row.includes(p)),
                  row.map((id) => rune(id, draft.secondary.includes(id), () => setDraft(pickSecondary(draft, id, styles)))),
                  `s${i}`,
                ),
              )}
              <div class="rlc-re-shards">
                {slotsOf(primary).shards.map((row, i) =>
                  slot(
                    row,
                    draft.shards[i],
                    row.map((id) =>
                      rune(
                        id,
                        draft.shards[i] === id,
                        () => {
                          const next = [...draft.shards];
                          next[i] = id;
                          setDraft({ ...draft, shards: next });
                        },
                        'shard',
                        `${i}-${id}`,
                      ),
                    ),
                    `f${i}`,
                    'shard',
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {reco && recoOpen ? <RecoPanel lcu={lcu} reco={reco} perks={perks} prefer={page?.id ?? null} onApplied={(id) => id && setPageId(id)} /> : null}

      <label class="rlc-re-foot">
        <input type="checkbox" checked={detail} onChange={(e) => setDetail(e.currentTarget.checked)} />
        {t('runeDetailed')}
      </label>

      {tipPerk && tip ? (
        <div class="rlc-re-tip" role="tooltip" style={{ left: `${tip.x}px`, top: `${tip.y}px` }}>
          <b>{tipPerk.name}</b>
          <span>{plain(tipPerk.longDesc ?? tipPerk.shortDesc)}</span>
        </div>
      ) : null}

      {deleting && page ? (
        <Confirm
          message={`${t('deletePageConfirm')} ${page.name}`}
          confirmLabel={t('runeDelete')}
          onConfirm={() => {
            void request('DELETE', `${PAGES}/${page.id}`)
              .then(loadInventory)
              .catch(() => {});
            setDeleting(false);
            setPageId(null);
          }}
          onCancel={() => setDeleting(false)}
        />
      ) : null}
    </div>
  );
}

/** Painel "Recomendadas" (OP.GG): rota, "Contra" só com inimigos já escolhidos, 3 páginas e Aplicar. */
function RecoPanel({ lcu, reco, perks, prefer, onApplied }: { lcu: Lcu; reco: RecoContext; perks: Map<number, Perk>; prefer: number | null; onApplied: (id: number | null) => void }) {
  const [pos, setPos] = useState<OpggPosition>(opggPosition(reco.position) ?? 'MID');
  // null = segue o adversário da rota; 0 = Geral escolhido à mão; id = inimigo escolhido à mão.
  const [vs, setVs] = useState<number | null>(null);
  const [sel, setSel] = useState(0);
  // undefined = carregando; null = sem recomendações.
  const [recs, setRecs] = useState<Rec[] | null | undefined>(undefined);
  const [general, setGeneral] = useState(false);
  const matchup = prefs.value.runesMatchup;
  const wanted = vs ?? reco.laneEnemy;
  const enemy = matchup && wanted > 0 && reco.enemies.includes(wanted) ? wanted : 0;
  const region = regionOf(lcu);
  useEffect(() => {
    if (reco.championId <= 0) return;
    let live = true;
    setRecs(undefined);
    setSel(0);
    void recommendVs(region, reco.championId, pos, enemy).then((r) => {
      if (!live) return;
      setRecs(r.recs);
      setGeneral(r.general);
    });
    return () => void (live = false);
  }, [reco.championId, pos, enemy, region]);
  // Inimigos sem posição e nenhum palpite: o jogador escolhe o adversário entre os já confirmados.
  const askVs = matchup && vs === null && enemy === 0 && reco.enemies.some((id) => id > 0);
  const apply = useAction(async () => {
    const r = recs?.[sel];
    if (r) onApplied(await applyRec(r, { name: recName(reco, pos), pages: lcu.perkPages.value.data ?? [], prefer, me: reco.me }));
  });
  const champ = reco.champions.get(reco.championId);
  const icon = (id: number) => perks.get(id)?.iconPath;

  let body;
  if (reco.championId <= 0) body = <p class="rlc-re-reco-note">{t('runeRecoNoChamp')}</p>;
  else if (recs === undefined) body = <p class="rlc-re-reco-note">{t('runeRecoLoading')}</p>;
  else if (!recs?.length) body = <p class="rlc-re-reco-note">{t('runeRecoNone')}</p>;
  else
    body = recs.map((r, i) => (
      <button type="button" key={i} class="rlc-re-rec" aria-pressed={i === sel} onClick={() => setSel(i)}>
        <span class="rlc-re-rec-hd">
          {icon(r.perks[0]!) ? <img src={icon(r.perks[0]!)} alt="" /> : null}
          <b>{perks.get(r.perks[0]!)?.name ?? ''}</b>
          <span class="rlc-re-rec-wr" title={t('runeWinRate')}>
            {pct(r.win)}
          </span>
        </span>
        <span class="rlc-re-rec-mini">
          {r.perks.slice(1, 6).map((id, j) => (icon(id) ? <img key={j} src={icon(id)} alt={perks.get(id)?.name ?? ''} /> : null))}
          <span class="rlc-re-muted">
            {pct(r.pick)} {t('runeUsage')}
          </span>
        </span>
        {r.spells ? (
          <span class="rlc-re-rec-mini">
            {r.spells.map((id) => {
              const s = reco.spells.get(id);
              return s?.icon ? <img key={id} class="rlc-re-spell" src={s.icon} alt={s.name} /> : null;
            })}
            <span class="rlc-re-muted">{t('runeSpells')}</span>
          </span>
        ) : null}
      </button>
    ));

  return (
    <aside class="rlc-re-reco">
      <div class="rlc-re-reco-hd">
        <b>{t('runeRecoTitle')}</b>
        <span class="rlc-re-muted">OP.GG</span>
      </div>
      <div class="rlc-re-reco-sel">
        {champ ? (
          <span class="rlc-re-champ">
            {champ.icon ? <img src={champ.icon} alt="" /> : null}
            {champ.name}
          </span>
        ) : null}
        <select class="rlc-input rlc-re-lane" aria-label={t('runeLane')} value={pos} onChange={(e) => setPos(e.currentTarget.value as OpggPosition)}>
          {OPGG_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {t(POS_TEXT[p])}
            </option>
          ))}
        </select>
      </div>
      {matchup ? (
        <>
          <div class="rlc-re-muted">{t('runeVs')}</div>
          <div class="rlc-re-vs">
            <button type="button" class="rlc-re-vs-all" aria-pressed={enemy === 0} onClick={() => setVs(0)}>
              {t('runeVsAll')}
            </button>
            {reco.enemies.map((id, i) => {
              if (id <= 0) return <span key={`e${i}`} class="rlc-re-vs-empty" title={t('runeVsPicking')} />;
              const c = reco.champions.get(id);
              return (
                <button type="button" key={id} class="rlc-re-vs-champ" aria-pressed={enemy === id} aria-label={c?.name ?? ''} title={c?.name} onClick={() => setVs(id)}>
                  {c?.icon ? <img src={c.icon} alt="" /> : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
      <div class="rlc-re-muted">{enemy > 0 && !general ? `${t('runeRecoAgainst')} ${reco.champions.get(enemy)?.name ?? ''}` : t('runeRecoGeneral')}</div>
      {askVs ? <p class="rlc-re-reco-note">{t('runeRecoPickVs')}</p> : null}
      {enemy > 0 && general && recs?.length ? <p class="rlc-re-reco-note">{t('runeRecoFew')}</p> : null}
      <div class="rlc-re-recs">{body}</div>
      <button type="button" class="rlc-button" data-variant="primary" disabled={!recs?.[sel] || apply.pending} onClick={() => apply.run()}>
        {t('runeApply')}
      </button>
    </aside>
  );
}
