import { useEffect, useRef, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolLobbyLobbyCustomGame } from '../../lcu/types';
import { Button } from '../../ui/Button';
import { PillSelect } from '../../ui/PillMenu';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { useDrawerClose } from './Modes';
import { customLobbyBody, customModes, type CustomForm } from './queues';

const MAP: Record<number, TextKey> = { 11: 'modeSr', 12: 'modeAram', 22: 'modeTft', 30: 'mapArena', 453: 'mapClassicRift' };
const SPECTATORS: Array<[CustomForm['spectators'], TextKey]> = [
  ['NotAllowed', 'specNone'],
  ['LobbyAllowed', 'specLobby'],
  ['AllAllowed', 'specAll'],
];

/** Lista de salas personalizadas abertas e criação de sala. Abre pela tela de modos. */
export function CustomBrowser({ lcu, onClose }: { lcu: Lcu; onClose: () => void }) {
  const sheet = useRef<HTMLDivElement>(null);
  const close = useDrawerClose(sheet, onClose);
  useEscape(close);
  useEffect(() => void lcu.customGames.refresh(), [lcu]);
  const games = lcu.customGames.state.value.data ?? [];
  const modes = customModes(lcu.queues.value.data ?? []);

  return (
    <div class="rlc-veil rlc-modes rlc-custom" role="dialog" aria-modal="true" aria-label={t('modeCustom')} ref={sheet}>
      <h2>{t('modeCustom')}</h2>
      <div class="rlc-custom-panels">
        <RoomList games={games} refresh={lcu.customGames.refresh} onJoined={onClose} />
        <CreateRoom modes={modes} onCreated={onClose} />
      </div>
      <div class="rlc-modes-actions">
        <Button onClick={close}>{t('back')}</Button>
      </div>
    </div>
  );
}

type Room = LolLobbyLobbyCustomGame & { partyId?: string };
// O client atual devolve id 0 em todas as salas; o partyId é o que as distingue.
const roomKey = (g: Room) => g.partyId || String(g.id);

function RoomList({ games, refresh, onJoined }: { games: LolLobbyLobbyCustomGame[]; refresh: () => Promise<void>; onJoined: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const room: Room | null = games.find((g) => roomKey(g) === selected) ?? null;
  const join = useAction(async () => {
    // Salas novas entram pelo grupo (`partyId`), como no client atual; as antigas, pelo id da sala.
    const party = room!.partyId;
    if (party) await request('POST', `/lol-lobby/v2/party/${encodeURIComponent(party)}/join`, { asSpectator: false, ...(room!.hasPassword ? { lobbyPassword: password } : {}) });
    else await request('POST', `/lol-lobby/v1/custom-games/${room!.id}/join`, { asSpectator: false, ...(room!.hasPassword ? { password } : {}) });
    onJoined();
  });
  const reload = useAction(refresh);
  return (
    <section class="rlc-panel rlc-rooms">
      <header>
        <strong>{t('rooms')}</strong>
        {room?.hasPassword ? (
          <input type="password" class="rlc-input" aria-label={t('roomPassword')} placeholder={t('roomPassword')} value={password} onInput={(e) => setPassword(e.currentTarget.value)} />
        ) : null}
        <button type="button" class="rlc-button" data-variant="pill" disabled={reload.pending} onClick={() => reload.run()}>
          ↻ {t('refresh')}
        </button>
        <button type="button" class="rlc-button" data-variant="primary" disabled={!room || join.pending} onClick={() => join.run()}>
          {t('join')}
        </button>
      </header>
      <div class="rlc-room-list">
        {games.length === 0 ? <p class="rlc-muted">{t('noRooms')}</p> : null}
        {games.map((g) => (
          <button
            type="button"
            key={roomKey(g)}
            class="rlc-room"
            aria-pressed={roomKey(g) === selected}
            onClick={() => {
              setSelected(roomKey(g));
              setPassword('');
            }}
          >
            <span class="rlc-room-name">{g.lobbyName}</span>
            <span>{t(MAP[g.mapId] ?? 'mapOther')}</span>
            <span>
              {g.filledPlayerSlots}/{g.maxPlayerSlots}
            </span>
            <span aria-hidden="true">{g.hasPassword ? '🔒' : ''}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function CreateRoom({ modes, onCreated }: { modes: ReturnType<typeof customModes>; onCreated: () => void }) {
  const [form, setForm] = useState<CustomForm>({ name: '', password: '', teamSize: 5, spectators: 'NotAllowed' });
  const [modeId, setModeId] = useState<number | null>(null);
  const mode = modes.find((m) => m.id === modeId) ?? modes[0] ?? null;
  const create = useAction(async () => {
    await request('POST', '/lol-lobby/v2/lobby', customLobbyBody(mode!, form));
    onCreated();
  });
  const set = (patch: Partial<CustomForm>) => setForm({ ...form, ...patch });
  return (
    <section class="rlc-panel rlc-create">
      <header>
        <strong>{t('createRoom')}</strong>
      </header>
      <label class="rlc-field">
        <span>{t('roomName')}</span>
        <input class="rlc-input" aria-label={t('roomName')} maxLength={60} value={form.name} onInput={(e) => set({ name: e.currentTarget.value })} />
      </label>
      <label class="rlc-field">
        <span>{t('password')}</span>
        <input type="password" class="rlc-input" aria-label={t('password')} value={form.password} onInput={(e) => set({ password: e.currentTarget.value })} />
      </label>
      <div class="rlc-field">
        <span>{t('mode')}</span>
        <PillSelect label={t('mode')} options={modes.map((m) => [String(m.id), m.name])} value={String(mode?.id ?? '')} onChange={(v) => setModeId(Number(v))} />
      </div>
      <div class="rlc-field-row">
        <div class="rlc-field">
          <span>{t('teamSize')}</span>
          <PillSelect label={t('teamSize')} options={[1, 2, 3, 4, 5].map((n) => [String(n), `${n}x${n}`])} value={String(form.teamSize)} onChange={(v) => set({ teamSize: Number(v) })} />
        </div>
        <div class="rlc-field">
          <span>{t('spectators')}</span>
          <PillSelect label={t('spectators')} options={SPECTATORS.map(([v, key]) => [v, t(key)])} value={form.spectators} onChange={(spectators) => set({ spectators })} />
        </div>
      </div>
      <button type="button" class="rlc-button" data-variant="primary" disabled={!form.name.trim() || !mode || create.pending} onClick={() => create.run()}>
        {t('create')}
      </button>
    </section>
  );
}
