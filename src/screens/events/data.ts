import type { TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { supports } from '../../lcu/capabilities';
import { request } from '../../lcu/request';
import { choiceOf, selectChoice, type Choice, type RewardGrant as Grant } from '../../shell/overlays/Rewards';

export type { Choice, Grant };

/** Leitura silenciosa da LCU (sem Toast): aba sem dados some, nunca vira erro de tela. */
export const getJson = async <T,>(url: string): Promise<T | null> => {
  try {
    const r = await fetch(url);
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
};

// Modelo comum da trilha: o passe do LoL e o do TFT viram a mesma coisa na tela.
export interface Reward {
  name: string;
  description: string;
  icon: string;
  /** Tipo traduzido (Ícone, Emote...); sem tipo conhecido fica de fora. */
  kind?: TextKey;
  premium: boolean;
  claimed: boolean;
  /** Precisa do passe (premium sem passe comprado). */
  locked: boolean;
  /** Liberado e esperando o Resgatar. */
  ready: boolean;
  /** Recompensa de escolha: abre o seletor em vez de resgatar direto. */
  choice?: Choice;
}

/** Estado visual do bloco: resgatado, pronto, preso ao passe ou a um nível futuro. */
export type RewardState = 'claimed' | 'ready' | 'pass' | 'level';
export const rewardState = (r: Reward): RewardState => (r.claimed ? 'claimed' : r.ready ? 'ready' : r.locked ? 'pass' : 'level');
export interface Level { level: number; free?: Reward; premium?: Reward }
export interface Pass {
  id: string;
  game: 'lol' | 'tft';
  name: string;
  endsAt: number | null;
  background: string | null;
  level: number;
  xp: number;
  xpTotal: number;
  levels: Level[];
  /** Ícone da moeda da trilha (Fama no ARAM Caos); sem ele, a trilha conta em XP. */
  xpIcon?: string;
  purchased: boolean;
  /** Há pacote de passe à venda. */
  buyable: boolean;
  unclaimed: number;
}

// ---- Passe do LoL (central de eventos) ----

export interface HubEvent {
  eventId: string;
  eventInfo: {
    eventName: string; localizedShortName?: string; eventType: string; seasonPassSubType?: string; startDate: string; endDate: string; progressEndDate?: string;
    isPassPurchased: boolean; unclaimedRewardCount: number; eventPassBundles?: unknown[];
  };
}
interface RewardOption {
  rewardGroupId?: string; headerType: string; rewardName: string; rewardDescription: string; thumbIconPath: string; splashImagePath?: string;
  rewardInventoryTypes?: string[]; state: string;
}
export interface TrackItem { threshold: string; rewardOptions: RewardOption[] }
export interface TrackProgress { level: number; currentLevelXP: number; totalLevelXP: number; totalLevels: number }

const KINDS: Record<string, TextKey> = {
  SUMMONER_ICON: 'evKindIcon', EMOTE: 'evKindEmote', CURRENCY: 'evKindCurrency', HEXTECH_CRAFTING: 'evKindLoot', CHAMPION_PERMANENT: 'evKindChampion',
  CHAMPION_SKIN: 'evKindSkin', REGALIA_BANNER: 'evKindBanner', ACHIEVEMENT_TITLE: 'evKindTitle', TFT_COMPANION: 'evKindTactician',
};

/** Eventos que viram aba: no período, fora dos marcos do centro de atividades e do Passe Clássico (que a LCU só expõe com dados de teste). */
export const activeEvents = (events: HubEvent[], now = Date.now()) =>
  events.filter((e) => !['kActivityCenterMilestones', 'kDemaciaPass'].includes(e.eventInfo.eventType) && Date.parse(e.eventInfo.startDate) <= now && now < Date.parse(e.eventInfo.endDate));

/**
 * Eventos do menu, como o client monta o dele: `/lol-event-hub/v1/navigation-button-data`, na ordem dele, ligado a
 * `/events` pelo `activeEventId` (lista vazia esconde o menu). Sem resposta, fica o filtro de `activeEvents`.
 */
export const menuEvents = (events: HubEvent[], nav: Array<{ activeEventId?: string }> | null) =>
  Array.isArray(nav) ? nav.map((b) => events.find((e) => e.eventId === b.activeEventId)).filter((e): e is HubEvent => !!e) : activeEvents(events);

/** Passe com hub próprio (Mayhem): o client mostra o plugin `rcp-fe-lol-kiwi-hub` (`getRouteByEventHubType`). */
export const isKiwiHub = (e: HubEvent) => e.eventInfo.eventType === 'kSeasonPass' && e.eventInfo.seasonPassSubType === 'MayhemCustomHub';

export const loadMenuEvents = async () => {
  const [events, nav] = await Promise.all([getJson<HubEvent[]>('/lol-event-hub/v1/events'), getJson<Array<{ activeEventId?: string }>>('/lol-event-hub/v1/navigation-button-data')]);
  return menuEvents(events ?? [], nav);
};

/** Escolhas pendentes por grupo de recompensa. */
export function pendingChoices(grants: Grant[]): Map<string, Choice> {
  const map = new Map<string, Choice>();
  for (const g of grants) {
    const c = choiceOf(g);
    if (c) map.set(c.rewardGroupId, c);
  }
  return map;
}

/**
 * Trilha da central de eventos. Cada nível traz uma ou mais opções; a primeira com nome vale (as sem nome são
 * extras escondidos, como bênçãos do ARAM). `headerType` diz a fila. Estados da LCU (os mesmos do client oficial):
 * Selected = resgatado, Unselected = liberado esperando resgate, Unlocked = nível futuro, Locked = precisa do passe.
 */
export function eventPass(e: HubEvent, items: TrackItem[], progress: TrackProgress | null, background: string | null, choices = new Map<string, Choice>(), extra: { unclaimed?: number | null; xpIcon?: string } = {}): Pass {
  const purchased = e.eventInfo.isPassPurchased;
  const levels = items.map((it): Level => {
    const level: Level = { level: Number(it.threshold) };
    for (const o of it.rewardOptions) {
      // Sem nome ou com texto de teste da Riot ("DO NOT TRANSLATE", usado no Passe Clássico pela LCU): fica de fora.
      if (!o.rewardName || /DO NOT TRANSLATE/i.test(o.rewardName)) continue;
      const premium = o.headerType === 'PREMIUM';
      const row = premium ? 'premium' : 'free';
      if (level[row]) continue;
      const kind = o.rewardInventoryTypes?.map((k) => KINDS[k]).find(Boolean);
      level[row] = {
        name: o.rewardName, description: o.rewardDescription.trim(), icon: o.thumbIconPath, kind, premium,
        claimed: o.state === 'Selected', locked: premium && !purchased, ready: o.state === 'Unselected',
        choice: o.state === 'Unselected' && o.rewardGroupId ? choices.get(o.rewardGroupId) : undefined,
      };
    }
    return level;
  });
  return {
    id: e.eventId, game: 'lol', name: e.eventInfo.localizedShortName || e.eventInfo.eventName,
    endsAt: Date.parse(e.eventInfo.progressEndDate || e.eventInfo.endDate) || null, background,
    level: progress?.level ?? 0, xp: progress?.currentLevelXP ?? 0, xpTotal: progress?.totalLevelXP ?? 0,
    // A contagem do `eventInfo` fica velha (o ARAM Caos dizia 7 com nada a resgatar): vale a da trilha quando vem.
    levels, purchased, buyable: !purchased && !!e.eventInfo.eventPassBundles?.length, unclaimed: extra.unclaimed ?? e.eventInfo.unclaimedRewardCount, xpIcon: extra.xpIcon || undefined,
  };
}

// ---- Passe do TFT ----

interface TftMilestone {
  level: number; title: string; description: string; iconImageUrl: string; isPaid: boolean; isLocked: boolean; status: string;
  pointsEarnedForMilestone: number; pointsNeededForMilestone: number;
}
export interface TftPass {
  info: { passId: string; title: string; endDate: number; premium: boolean };
  currentLevel: number;
  activeMilestone?: TftMilestone | null;
  milestones: TftMilestone[];
}

/** Passe do TFT: um marco por nível e fila (`isPaid`). COMPLETE é resgatado; REWARDABLE sem cadeado espera o Resgatar. */
export function tftPass(p: TftPass): Pass {
  const byLevel = new Map<number, Level>();
  for (const m of p.milestones) {
    const level = byLevel.get(m.level) ?? { level: m.level };
    const row = m.isPaid ? 'premium' : 'free';
    level[row] ??= {
      name: m.title, description: m.description, icon: m.iconImageUrl, premium: m.isPaid,
      claimed: m.status === 'COMPLETE', locked: m.isPaid && !p.info.premium, ready: m.status === 'REWARDABLE' && !m.isLocked,
    };
    byLevel.set(m.level, level);
  }
  return {
    id: p.info.passId, game: 'tft', name: p.info.title, endsAt: p.info.endDate || null, background: null,
    level: p.currentLevel, xp: p.activeMilestone?.pointsEarnedForMilestone ?? 0, xpTotal: p.activeMilestone?.pointsNeededForMilestone ?? 0,
    levels: [...byLevel.values()].sort((a, b) => a.level - b.level), purchased: p.info.premium, buyable: !p.info.premium,
    unclaimed: p.milestones.filter((m) => m.status === 'REWARDABLE' && !m.isLocked).length,
  };
}

/** Passes do TFT ativos; sem a lista, cai no passe de batalha único. */
export async function loadTftPasses(): Promise<Pass[]> {
  const list = await getJson<TftPass[]>('/lol-tft-pass/v1/active-passes');
  const passes = list?.length ? list : [await getJson<TftPass>('/lol-tft-pass/v1/battle-pass')].filter((p): p is TftPass => !!p?.info);
  return passes.filter((p) => p.milestones?.length).map(tftPass);
}

// ---- Escritas ----

/**
 * Resgata tudo o que está pendente. O client oficial (rcp-fe-lol-event-hub) usa o mesmo POST claim-all tanto no
 * botão Resgatar quanto no clique de um item liberado; não há resgate de item avulso.
 * TFT: PUT claimAllRewards tirado de docs/dump/lcu/endpoints.json, não conferido no JS oficial.
 */
export const claimAll = (p: Pass) =>
  p.game === 'lol'
    ? request('POST', `/lol-event-hub/v1/events/${encodeURIComponent(p.id)}/reward-track/claim-all`)
    : request('PUT', `/lol-tft-pass/v1/pass/${encodeURIComponent(p.id)}/milestone/claimAllRewards`);

export { selectChoice };

/**
 * Compra do passe. Nunca compramos pela nossa interface: a compra tem de ser confirmada na janela da Riot.
 * TODO: abrir o purchase widget da Riot para o pacote do evento (`/pass-bundles`, offerId) quando a rota for conhecida.
 * Até lá a tela mostra o aviso de usar o client original.
 */
export function openPassPurchase(eventId: string): boolean {
  void eventId;
  return false;
}

/** Recompensas esperando resgate em todos os passes (para o ponto dourado do trilho). */
export async function pendingClaims(lcu: Lcu): Promise<number> {
  void lcu; // a leitura é por fetch; o parâmetro fica para o integrador trocar por stores se quiser
  const [events, tft] = await Promise.all([loadMenuEvents(), loadTftPasses().catch(() => [])]);
  const lol = events.reduce((n, e) => n + (e.eventInfo.unclaimedRewardCount || 0), 0);
  return lol + tft.reduce((n, p) => n + p.unclaimed, 0);
}

// ---- Missões ----

interface Mission {
  title: string; description?: string; status: string; startTime: number; endTime: number;
  objectives: Array<{ description: string; progress: { currentProgress: number; totalCount: number } }>;
  rewards: Array<{ description: string; iconUrl?: string }>;
}
export interface ObjectiveCategory { id: string; objectives: Array<{ localizedTitle?: string[]; missions: Mission[] }> }
export interface MissionCard { group: string; title: string; lines: Array<{ text: string; current: number; total: number }>; reward: string; done: boolean }

// A Riot põe HTML (links) e marcas internas "(DNT)" nas descrições.
const clean = (s: string) => s.replace(/<[^>]*>/g, '').replace(/\(DNT\)\s*/g, '').trim();

/**
 * Missões vigentes do evento, pendentes primeiro. Entram também as de outras categorias que levam o nome do evento no
 * título ou na descrição (num grupo com o nome dele): as do "Journey to Stardom" (ARAM Caos) moram na categoria da temporada.
 * ponytail: casa pelo nome do evento; se a Riot passar a ligar missão a evento por id, trocar por ele.
 */
export function missionCards(categories: ObjectiveCategory[], eventId: string, now = Date.now(), eventName = ''): MissionCard[] {
  const cat = categories.find((c) => c.id === eventId);
  const named = (m: Mission) => !!eventName && `${m.title} ${m.description ?? ''}`.includes(eventName);
  const borrowed = categories.filter((c) => c !== cat).flatMap((c) => c.objectives.map((g) => ({ localizedTitle: [eventName], missions: g.missions.filter(named) }))).filter((g) => g.missions.length);
  const cards = [...(cat?.objectives ?? []), ...borrowed].flatMap((g) =>
    g.missions
      .filter((m) => m.startTime <= now && (m.endTime <= 0 || now < m.endTime))
      .map((m): MissionCard => {
        const lines = m.objectives.map((o) => ({ text: clean(o.description), current: o.progress.currentProgress, total: o.progress.totalCount }));
        return {
          group: g.localizedTitle?.[0] ?? '', title: clean(m.title), lines,
          reward: m.rewards.map((r) => r.description).filter(Boolean).join(' · '), done: m.status === 'COMPLETED',
        };
      }),
  );
  return cards.sort((a, b) => Number(a.done) - Number(b.done));
}

// ---- Reinos dos Tesouros e Clash ----

export interface Trove {
  id: string; name: string; backgroundTexture: string; thumbnailTexture: string; startDate: string; endDate: string; pullCost: number;
  /** Compra pela loja (giro v2, o atual do client); sem eles, o giro antigo pela oferta e tabela de sorteio. */
  storeId?: string; catalogEntryId?: string; paymentOptionsKeys?: string[]; rollOffer?: string; status?: { dropTableId?: string };
}

/** Moeda dos giros dos Reinos na carteira. */
export const TROVE_TOKEN = 'TFT_TREASURE_TROVE_TOKEN';

const ROLL_V2 = '/lol-tft-troves/v2/roll';
const ROLL_V1 = '/lol-tft-troves/v1/roll';
/** Giro que este client aceita para o banner: v2 (pela oferta da loja) quando há os dois, v1 como reserva; null sem nenhum. */
export const trovesRoll = (b: Trove): 'v2' | 'v1' | null => (b.storeId && b.catalogEntryId && supports('POST', ROLL_V2) ? 'v2' : supports('POST', ROLL_V1) ? 'v1' : null);

/** Gira um Reino `count` vezes, gastando fichas: o mesmo pedido do client. */
export function rollTrove(b: Trove, count: number) {
  if (trovesRoll(b) === 'v2') return request('POST', ROLL_V2, { storeId: b.storeId, catalogEntryId: b.catalogEntryId, paymentOptionsKeys: b.paymentOptionsKeys ?? [], quantity: count });
  return request('POST', ROLL_V1, { offerId: b.rollOffer || b.id, numberOfRolls: count, dropTableId: b.status?.dropTableId || b.id });
}

/** Nomes do que saiu no giro (`roll-rewards` chega depois do pedido); vazio se não vier a tempo. Limpa depois de ler, como o client. */
export async function trovesRewards(wait: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)), tries = 8): Promise<Array<{ name: string; icon: string }>> {
  for (let i = 0; i < tries; i++) {
    const got = await getJson<unknown>('/lol-tft-troves/v1/roll-rewards');
    const list = (Array.isArray(got) ? got : ((got as { rewards?: unknown[] } | null)?.rewards ?? [])) as Array<Record<string, unknown>>;
    if (list.length) {
      void request('DELETE', '/lol-tft-troves/v1/roll-rewards').catch(() => {});
      return list.map((r) => ({ name: String(r.name ?? r.itemName ?? r.rewardName ?? r.localizedName ?? ''), icon: String(r.iconPath ?? r.loadoutsIcon ?? r.imagePath ?? '') })).filter((r) => r.name);
    }
    await wait(1000);
  }
  return [];
}
export interface ClashPlayer { tier: number; tickets?: Record<string, number>; isClashBanned?: boolean }
/** Torneio de `/lol-clash/v1/all-tournaments` (formato do dump; lista vazia quando não há torneio). */
export interface ClashTournament { id: number; startTimeMs?: number; phases?: Array<{ id: number; cancelled?: boolean; lockinStartTime?: number }> }

/** Datas dos dias de torneio que ainda vêm, em ordem. */
export const clashDates = (list: ClashTournament[], now = Date.now()) =>
  list
    .flatMap((t) => (t.phases ?? []).filter((p) => !p.cancelled && (p.lockinStartTime ?? 0) > now).map((p) => p.lockinStartTime!))
    .sort((a, b) => a - b);

/** Dias inteiros até a data (arredonda para cima; nunca negativo). */
export const daysLeft = (end: number, now = Date.now()) => Math.max(0, Math.ceil((end - now) / 86_400_000));
