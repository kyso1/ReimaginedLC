import { useEffect, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import { request } from '../../lcu/request';
import { getJson } from '../profile/data';
import { pct, Range, Row, Seg, Switch } from './controls';

// Configurações do client e do jogo vindas da LCU: esquema do jogo, chat e teclas.

type Schema = Record<string, Record<string, { default: unknown }>>;
type Values = Record<string, Record<string, unknown>>;
type Input = Record<string, Record<string, unknown>>;
export interface GameData {
  schema: Schema | null;
  values: Values;
  chat: Record<string, unknown> | null;
  input: Input | null;
}
export type GameArea = 'sound' | 'notif' | 'chat' | 'game' | 'keys';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Carrega tudo uma vez ao abrir as configurações (os resumos dos painéis já precisam). */
export function useGameData(): [GameData, (fn: (d: GameData) => GameData) => void] {
  const [data, setData] = useState<GameData>({ schema: null, values: {}, chat: null, input: null });
  useEffect(() => {
    void getJson<Schema>('/lol-game-settings/v1/game-settings-schema').then((schema) => isRecord(schema) && setData((d) => ({ ...d, schema })));
    void getJson<Values>('/lol-game-settings/v1/game-settings').then((values) => isRecord(values) && setData((d) => ({ ...d, values })));
    void getJson<Record<string, unknown>>('/lol-chat/v1/settings').then((chat) => isRecord(chat) && setData((d) => ({ ...d, chat })));
    void getJson<Input>('/lol-game-settings/v1/input-settings').then((input) => isRecord(input) && setData((d) => ({ ...d, input })));
  }, []);
  return [data, setData];
}

/** Nome legível para chave sem tradução: tira prefixos e sufixos técnicos, separa palavras, só a primeira maiúscula. */
export function humanize(key: string): string {
  const s = key
    .replace(/^evt/, '')
    .replace(/_?Enabled$/, '')
    .replace(/^(Enable|Show|Is|Use)(?=[A-Z])/, '')
    .replace(/_/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const named = (prefix: string, key: string) => t(`${prefix}${key}` as TextKey) || humanize(key);
export const fieldLabel = (key: string) => named('stGk_', key);
export const sectionLabel = (cat: string) => named('stGs_', cat);

// Chaves da interface do jogo que pertencem a "Chat e amigos" e não a "Jogo".
const CHAT_HUD = new Set(['ShowAlliedChat', 'ShowAllChannelChat', 'ShowTimestamps', 'ChatScale', 'ChatChannelVisibility', 'HideEnemySummonerEmotes', 'HideReciprocityFist', 'EmotePopupUIDisplayMode', 'EmoteSize']);
export function areaOf(cat: string, key: string): GameArea {
  if (cat === 'Volume') return 'sound';
  if (cat === 'FloatingText' || cat === 'LossOfControl') return 'notif';
  if (cat === 'Voice' || CHAT_HUD.has(key)) return 'chat';
  return 'game';
}

// Números que são escolha entre opções. ponytail: só o modo de janela tem rótulos; os outros enumerados seguem como número.
const ENUMS: Record<string, TextKey[]> = { WindowMode: ['stWin0', 'stWin1', 'stWin2'] };

// Ajustes do chat do client (PUT /lol-chat/v1/settings). `invert`: a LCU guarda o contrário do que a linha mostra.
const CHAT_ROWS: Record<'notif' | 'chat', Array<{ key: string; name: TextKey; desc?: TextKey; invert?: boolean }>> = {
  notif: [
    { key: 'friendRequestToastsDisabled', name: 'stChatFriendToasts', desc: 'stChatFriendToastsDesc', invert: true },
    { key: 'messageNotificationsEnabled', name: 'stChatMsgToasts', desc: 'stChatMsgToastsDesc' },
  ],
  chat: [
    { key: 'chatGroupOffline', name: 'stChatOffline', desc: 'stChatOfflineDesc' },
    { key: 'showWhenTypingEnabled', name: 'stChatTyping' },
    { key: 'linkClickWarningEnabled', name: 'stChatLinks' },
    { key: 'chatFilterDisabled', name: 'stChatFilter', desc: 'stChatFilterDesc', invert: true },
  ],
};

// Teclas mostradas (só leitura) e em que ordem; o resto do mapa de teclas fica para o jogo.
const BINDS = ['evtCastSpell1', 'evtCastSpell2', 'evtCastSpell3', 'evtCastSpell4', 'evtCastAvatarSpell1', 'evtCastAvatarSpell2', 'evtCastRoleBound', 'evtUseItem1', 'evtUseItem2', 'evtUseItem3', 'evtUseItem4', 'evtUseItem5', 'evtUseItem6', 'evtUseVisionItem', 'evtUseItem7', 'evtOpenShop', 'evtHoldShowScoreBoard', 'evtCameraLockToggle', 'evtPlayerAttackMove', 'evtPlayerStopPosition', 'evtPlayerHoldPosition', 'evtPlayerPingCursor', 'evtSelectSelf', 'evtShowCharacterMenu', 'evtChatHistory', 'evtSysMenu'];
const bindLabel = (evt: string) => named('stKb_', evt);

/** "[Ctrl][q],[e]" vira "Ctrl + Q / E"; sem tecla vira "Sem tecla". */
export function formatBind(raw: unknown): string {
  if (typeof raw !== 'string') return t('stUnbound');
  const alts = raw
    .split(',')
    .map((alt) => [...alt.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]!).filter((k) => k !== '<Unbound>'))
    .filter((keys) => keys.length)
    .map((keys) => keys.map((k) => (k.length === 1 ? k.toUpperCase() : k.replace(/^Button (\d)$/, 'Mouse $1'))).join(' + '));
  return alts.length ? alts.join(' / ') : t('stUnbound');
}

/** Campos de uma área, agrupados pela seção do esquema. */
function fieldsOf(data: GameData, area: GameArea): Array<[string, Array<[string, unknown]>]> {
  if (!data.schema) return [];
  return Object.entries(data.schema)
    .map(([cat, fields]): [string, Array<[string, unknown]>] => [cat, Object.entries(fields ?? {}).filter(([key]) => areaOf(cat, key) === area).map(([key, def]) => [key, def?.default])])
    .filter(([, list]) => list.length);
}

/** Nomes das linhas de cada área, para a busca. */
export function searchNames(data: GameData): Array<[GameArea, string]> {
  const out: Array<[GameArea, string]> = [];
  for (const area of ['sound', 'notif', 'chat', 'game'] as const) for (const [, list] of fieldsOf(data, area)) for (const [key] of list) out.push([area, fieldLabel(key)]);
  for (const area of ['notif', 'chat'] as const) for (const r of CHAT_ROWS[area]) out.push([area, t(r.name)]);
  for (const evt of BINDS) out.push(['keys', bindLabel(evt)]);
  return out;
}

/** Resumo do painel: ligados/total nas caixas da área (e o modo de janela no Jogo). */
export function gamePeeks(data: GameData, area: GameArea): string[] {
  if (area === 'keys') {
    const q = Object.values(data.input?.Quickbinds ?? {});
    return data.input ? [`${t('stQuickcast')} ${q.filter((v) => v === true).length}/${q.length}`] : [t('stPeekLoading')];
  }
  if (!data.schema) return [t('stPeekLoading')];
  const peeks: string[] = [];
  if (area === 'game') {
    const mode = data.values.General?.WindowMode ?? data.schema.General?.WindowMode?.default;
    const label = ENUMS.WindowMode![Number(mode)];
    if (label) peeks.push(t(label));
  }
  let on = 0;
  let total = 0;
  for (const [cat, list] of fieldsOf(data, area))
    for (const [key, def] of list)
      if (typeof def === 'boolean') {
        total++;
        if ((data.values[cat]?.[key] ?? def) === true) on++;
      }
  if (area === 'notif' || area === 'chat')
    for (const r of CHAT_ROWS[area])
      if (data.chat && typeof data.chat[r.key] === 'boolean') {
        total++;
        if ((data.chat[r.key] === true) !== !!r.invert) on++;
      }
  if (total) peeks.push(`${on}/${total} ${t('stPeekOn')}`);
  else if (area === 'sound') peeks.push(sectionLabel('Volume'));
  return peeks;
}

// O navegador já mudou o controle quando a LCU recusa: volta ao valor que ela tem.
function revert(el: HTMLInputElement, previous: unknown) {
  if (el.type === 'checkbox') el.checked = previous === true;
  else el.value = String(previous);
}

/** Linhas do esquema do jogo de uma área; cada mudança grava (PATCH + save). */
export function GameFields({ data, setData, area }: { data: GameData; setData: (fn: (d: GameData) => GameData) => void; area: GameArea }) {
  const { schema, values } = data;
  if (!schema) return <p class="rlc-muted">{t('stPeekLoading')}</p>;
  const save = async (cat: string, key: string, value: unknown, el?: HTMLInputElement) => {
    const previous = values[cat]?.[key] ?? schema[cat]?.[key]?.default;
    try {
      await request('PATCH', '/lol-game-settings/v1/game-settings', { [cat]: { [key]: value } });
      await request('POST', '/lol-game-settings/v1/save');
      setData((d) => ({ ...d, values: { ...d.values, [cat]: { ...(d.values[cat] ?? {}), [key]: value } } }));
    } catch {
      // O Toast já saiu em `request`.
      if (el) revert(el, previous);
    }
  };
  return (
    <>
      {fieldsOf(data, area).map(([cat, list]) => (
        <section key={cat} class="rlc-st-card">
          <h3>{sectionLabel(cat)}</h3>
          {list.map(([key, def]) => {
            const name = fieldLabel(key);
            const current = values[cat]?.[key] ?? def;
            const dataKey = `${cat}.${key}`;
            if (typeof def === 'boolean')
              return (
                <Row key={key} name={name}>
                  <Switch label={name} dataKey={dataKey} checked={current === true} onChange={(on, el) => void save(cat, key, on, el)} />
                </Row>
              );
            if (typeof def !== 'number') return null;
            const options = ENUMS[key];
            if (options)
              return (
                <Row key={key} name={name}>
                  <Seg label={name} dataKey={dataKey} value={Number(current)} options={options.map((k, i) => [i, t(k)])} onPick={(v) => void save(cat, key, v)} />
                </Row>
              );
            if (!Number.isInteger(def) || /(Volume|Scale)$/.test(key)) {
              const n = Number(current);
              const max = def > 1 || n > 1 ? 100 : 1;
              return (
                <Row key={key} name={name}>
                  <Range label={name} dataKey={dataKey} value={n} min={0} max={max} step={max === 1 ? 0.01 : 1} text={max === 1 ? pct(n) : String(Math.round(n))} onChange={(v, el) => void save(cat, key, v, el)} />
                </Row>
              );
            }
            return (
              <Row key={key} name={name}>
                <input
                  type="number"
                  class="rlc-st-number"
                  aria-label={name}
                  data-key={dataKey}
                  value={Number(current)}
                  step={1}
                  onChange={(e) => {
                    // Campo vazio vira 0 em Number(''): não grava. Campo de inteiro (modos, índices) grava inteiro.
                    const raw = e.currentTarget.value.trim();
                    const n = Number(raw);
                    if (raw === '' || !Number.isFinite(n)) return void (e.currentTarget.value = String(current));
                    void save(cat, key, Math.round(n), e.currentTarget);
                  }}
                />
              </Row>
            );
          })}
        </section>
      ))}
    </>
  );
}

/** Ajustes do chat do client. A LCU recebe o objeto inteiro de volta com a mudança. */
export function ChatRows({ data, setData, area }: { data: GameData; setData: (fn: (d: GameData) => GameData) => void; area: 'notif' | 'chat' }) {
  const chat = data.chat;
  const rows = CHAT_ROWS[area].filter((r) => chat && typeof chat[r.key] === 'boolean');
  if (!chat || !rows.length) return null;
  const save = async (key: string, value: boolean, el: HTMLInputElement, invert: boolean) => {
    const previous = chat[key];
    try {
      await request('PUT', '/lol-chat/v1/settings', { ...chat, [key]: value });
      setData((d) => ({ ...d, chat: { ...(d.chat ?? {}), [key]: value } }));
    } catch {
      el.checked = (previous === true) !== invert;
    }
  };
  return (
    <section class="rlc-st-card">
      <h3>{t('stInClient')}</h3>
      {rows.map((r) => (
        <Row key={r.key} name={t(r.name)} desc={r.desc ? t(r.desc) : undefined}>
          <input
            type="checkbox"
            role="switch"
            class="rlc-st-switch"
            aria-label={t(r.name)}
            data-key={`chat.${r.key}`}
            checked={(chat[r.key] === true) !== !!r.invert}
            onChange={(e) => void save(r.key, e.currentTarget.checked !== !!r.invert, e.currentTarget, !!r.invert)}
          />
        </Row>
      ))}
    </section>
  );
}

/** Atalhos: conjuração rápida por tecla (grava) e as teclas principais (só leitura). */
export function KeysArea({ data, setData }: { data: GameData; setData: (fn: (d: GameData) => GameData) => void }) {
  const input = data.input;
  if (!input) return <p class="rlc-muted">{t('stPeekLoading')}</p>;
  const quick = Object.entries(input.Quickbinds ?? {}).filter(([, v]) => typeof v === 'boolean');
  const save = async (key: string, value: boolean, el: HTMLInputElement) => {
    try {
      await request('PATCH', '/lol-game-settings/v1/input-settings', { Quickbinds: { [key]: value } });
      await request('POST', '/lol-game-settings/v1/save');
      setData((d) => ({ ...d, input: { ...(d.input ?? {}), Quickbinds: { ...(d.input?.Quickbinds ?? {}), [key]: value } } }));
    } catch {
      el.checked = !value;
    }
  };
  const bind = (evt: string) => input.GameEvents?.[evt] ?? input.HUDEvents?.[evt];
  return (
    <>
      {quick.length ? (
        <section class="rlc-st-card">
          <h3>{t('stQuickcast')}</h3>
          <p class="rlc-muted">{t('stQuickcastDesc')}</p>
          {quick.map(([key, on]) => {
            const evt = key.replace(/smart$/, '');
            const name = bindLabel(evt);
            return (
              <Row key={key} name={name}>
                <span class="rlc-st-key">{formatBind(bind(evt))}</span>
                <Switch label={`${t('stQuickcast')}: ${name}`} dataKey={`Quickbinds.${key}`} checked={on === true} onChange={(v, el) => void save(key, v, el)} />
              </Row>
            );
          })}
        </section>
      ) : null}
      <section class="rlc-st-card">
        <h3>{t('stBinds')}</h3>
        <p class="rlc-muted">{t('stBindsNote')}</p>
        {BINDS.filter((evt) => bind(evt) !== undefined).map((evt) => (
          <Row key={evt} name={bindLabel(evt)}>
            <span class="rlc-st-key">{formatBind(bind(evt))}</span>
          </Row>
        ))}
      </section>
    </>
  );
}
