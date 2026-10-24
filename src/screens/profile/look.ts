import { t } from '../../i18n';
import { request } from '../../lcu/request';
import { tierLabel } from './data';

/** O que aparece na identidade do jogador: estandarte, brasão (ícone + borda), título e fundo. */
export interface Look {
  icon: number;
  /** Borda do brasão: por nível (prestígio), pelo elo ou nenhuma. */
  crest: 'none' | 'prestige' | 'ranked';
  /** Tema da borda de prestígio, de 1 a 21 (`selectedPrestigeCrest` da regalia). */
  prestige: number;
  /** Elo usado na borda e no estandarte ranqueados ('' = sem classificação). */
  tier: string;
  /** `bannerAccent` dos desafios (id do estandarte em texto). */
  banner: string;
  /** `itemId` do título em texto; '' = sem título. */
  title: string;
  titleName: string;
  skin: number;
  level: number;
}

export interface Flag {
  itemId: number;
  theme: string;
  level: number;
  seasonId: number;
  earnedDateIso8601: string;
}

/** Item de `/lol-regalia/v3/inventory/REGALIA_BANNER`: um id pode ter variantes por elo (`idSecondary`). */
export interface BannerEntry {
  isOwned: boolean;
  items: Array<{ id: string; idSecondary: string; assetPath: string; localizedName: string }>;
}
export type BannerCatalog = Record<string, BannerEntry>;

/** Resumo dos desafios (`summary-player-data`): título, estandarte, borda e tokens escolhidos. */
export interface ChallengeSummary {
  bannerId?: string;
  crestId?: string;
  prestigeCrestBorderLevel?: number;
  title?: { itemId?: number; name?: string } | null;
  topChallenges?: Array<{ id?: number }>;
}

export const iconUrl = (id: number) => `/lol-game-data/assets/v1/profile-icons/${id}.jpg`;
// Caminho conferido no client (GET 200 para o tema 21).
export const borderUrl = (theme: number) => `/fe/lol-static-assets/images/uikit/themed-borders/theme-${theme}-border.png`;

/** Nível mínimo de cada borda de prestígio: 1, 30, 50, 75, 100... 500. */
export const prestigeLevel = (theme: number) => (theme === 1 ? 1 : theme === 2 ? 30 : 25 * (theme - 1));
/** Maior borda liberada para o nível. */
export const prestigeTheme = (level: number) => (level >= 500 ? 21 : level >= 75 ? Math.floor(level / 25) + 1 : level >= 50 ? 3 : level >= 30 ? 2 : 1);

// `crestId` do resumo de desafios segue a ordem de LolRegaliaRegaliaCrestType ("none" | "prestige" | "ranked"):
// no client, regalia `crestType: "ranked"` veio junto de `crestId: "2"`.
const CRESTS: Look['crest'][] = ['none', 'prestige', 'ranked'];
export const crestFromId = (id: string | undefined): Look['crest'] => CRESTS[Number(id)] ?? 'prestige';

/** Imagem do estandarte; o ranqueado ("2") tem uma variante por elo. */
export function bannerImage(catalog: BannerCatalog | null, id: string, tier: string): string | null {
  const items = catalog?.[id]?.items ?? [];
  return (items.find((i) => i.idSecondary === (tier || 'UNRANKED')) ?? items[0])?.assetPath ?? null;
}
/** Nome do estandarte: o padrão e o ranqueado vêm sem nome da LCU. */
export const bannerName = (catalog: BannerCatalog | null, id: string) =>
  id === '1' ? t('profBannerDefault') : id === '2' ? t('profBannerRanked') : catalog?.[id]?.items[0]?.localizedName || t('profBanner');

export const borderName = (crest: Look['crest'], theme: number, tier: string) =>
  crest === 'ranked' ? `${t('profBorderRanked')}${tierLabel(tier, undefined) ? ` · ${tierLabel(tier, undefined)}` : ''}` : crest === 'none' ? t('profBorderNone') : `${t('level')} ${prestigeLevel(theme)}`;

/** Bandeira sem nome na LCU (só `theme` técnico): mostra nível e ano em que foi ganha. */
export const flagName = (f: Flag) => `${t('profFlag')} · ${t('level')} ${f.level}${f.earnedDateIso8601 ? ` · ${f.earnedDateIso8601.slice(0, 4)}` : ''}`;

// ESCRITAS. Só a do ícone foi confirmada no client (auditoria 2026-10-21); as demais estão NÃO VERIFICADAS
// e seguem os esquemas de docs/dump/lcu (endpoints.json e lcu-types.d.ts).
export const save = {
  /** Confirmada: PUT /lol-summoner/v1/current-summoner/icon, LolSummonerSummonerIcon { profileIconId }. */
  icon: (profileIconId: number) => request('PUT', '/lol-summoner/v1/current-summoner/icon', { profileIconId }),
  /** NÃO VERIFICADA: PostLolSummonerV1CurrentSummonerSummonerProfile, LolSummonerSummonerProfileUpdate { key, value, inventory }. */
  background: (skinId: number) => request('POST', '/lol-summoner/v1/current-summoner/summoner-profile', { key: 'backgroundSkinId', value: skinId }),
  /**
   * NÃO VERIFICADA: PostLolChallengesV1UpdatePlayerPreferences (o dump diz POST, não PUT), LolChallengesChallengesPlayerPreferences
   * { bannerAccent, title, challengeIds, crestBorder, prestigeCrestBorderLevel, signedJWTPayload }. Mandamos título, estandarte e
   * tokens atuais juntos para não zerar o que não mudou; a borda fica com a regalia.
   */
  challenges: (p: { title: string; bannerAccent: string; challengeIds: number[] }) => request('POST', '/lol-challenges/v1/update-player-preferences', p),
  /** NÃO VERIFICADA: PutLolRegaliaV2CurrentSummonerRegalia, LolRegaliaRegaliaPreferences { preferredCrestType, preferredBannerType, selectedPrestigeCrest }. */
  crest: (p: { preferredCrestType: string; preferredBannerType: string; selectedPrestigeCrest: number }) => request('PUT', '/lol-regalia/v2/current-summoner/regalia', p),
  /** NÃO VERIFICADA: PutLolBannersV1CurrentSummonerFlagsEquipped, corpo LolBannersBannerFlag inteiro (como vem de /flags). */
  flag: (f: Flag) => request('PUT', '/lol-banners/v1/current-summoner/flags/equipped', f),
};

/** Busca sem acento e sem caixa. */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const matches = (q: string, ...texts: string[]) => !q || texts.some((x) => fold(x).includes(fold(q)));
