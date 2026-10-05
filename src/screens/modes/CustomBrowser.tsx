import { useEffect, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolLobbyLobbyCustomGame } from '../../lcu/types';
import { Button } from '../../ui/Button';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { customLobbyBody, customModes, type CustomForm } from './queues';

const MAP: Record<number, TextKey> = { 11: 'modeSr', 12: 'modeAram', 22: 'modeTft' };
const SPECTATORS: Array<[CustomForm['spectators'], TextKey]> = [
  ['NotAllowed', 'specNone'],
  ['LobbyAllowed', 'specLobby'],
  ['AllAllowed', 'specAll'],
];

/** Lista de salas personalizadas abertas e criação de sala. Abre pela tela de modos. */
export function CustomBrowser({ lcu, onClose }: { lcu: Lcu; onClose: () => void }) {
  useEscape(onClose);
  useEffect(() => void lcu.customGames.refresh(), [lcu]);
  const games = lcu.customGames.state.value.data ?? [];
  const modes = customModes(lcu.queues.value.data ?? []);

  return (
    <div class="rlc-veil rlc-modes rlc-custom" role="dialog" aria-modal="true" aria-label={t('modeCustom')}>
      <h2>{t('modeCustom')}</h2>
      <div class="rlc-custom-panels">
        <RoomList games={games} refresh={lcu.customGames.refresh} onJoined={onClose} />
        <CreateRoom modes={modes} onCreated={onClose} />
      </div>
      <div class="rlc-modes-actions">
        <Button onClick={onClose}>{t('back')}</Button>
      </div>
    </div>
  );
}

function RoomList({ games, refresh, onJoined }: { games: LolLobbyLobbyCustomGame[]; refresh: () => Promise<void>; onJoined: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const room = games.find((g) => g.id === selected) ?? null;
  const join = useAction(async () => {
    await request('POST', `/lol-lobby/v1/custom-games/${room!.id}/join`, room!.hasPassword ? { password } : {});
    onJoined();
  });
  const reload = useAction(refresh);
  return (
    <section class="rlc-panel rlc-rooms">
      <header>
        <strong>{t('rooms')}</strong>
        <button type="button" class="rlc-button" data-variant="pill" disabled={reload.pending} onClick={() => reload.run()}>
          ↻ {t('refresh')}
        </button>
      </header>
      <div class="rlc-room-list">
        {games.length === 0 ? <p class="rlc-muted">{t('noRooms')}</p> : null}
        {games.map((g) => (
          <button
            type="button"
            key={g.id}
            class="rlc-room"
            aria-pressed={g.id === selected}
            onClick={() => {
              setSelected(g.id);
              setPassword('');
            }}
          >
            <span class="rlc-room-name">{g.lobbyName}</span>
            <span>{MAP[g.mapId] ? t(MAP[g.mapId]!) : `#${g.mapId}`}</span>
            <span>
              {g.filledPlayerSlots}/{g.maxPlayerSlots}
            </span>
            <span aria-hidden="true">{g.hasPassword ? '🔒' : ''}</span>
          </button>
        ))}
      </div>
      <footer>
        {room?.hasPassword ? (
          <input type="password" class="rlc-input" aria-label={t('roomPassword')} placeholder={t('roomPassword')} value={password} onInput={(e) => setPassword(e.currentTarget.value)} />
        ) : null}
        <button type="button" class="rlc-button" data-variant="primary" disabled={!room || join.pending} onClick={() => join.run()}>
          {t('join')}
        </button>
      </footer>
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
      <input class="rlc-input" aria-label={t('roomName')} placeholder={t('roomName')} maxLength={60} value={form.name} onInput={(e) => set({ name: e.currentTarget.value })} />
      <input type="password" class="rlc-input" aria-label={t('password')} placeholder={t('password')} value={form.password} onInput={(e) => set({ password: e.currentTarget.value })} />
      <select class="rlc-input" aria-label={t('mode')} value={mode?.id ?? ''} onChange={(e) => setModeId(Number(e.currentTarget.value))}>
        {modes.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <select class="rlc-input" aria-label={t('teamSize')} value={form.teamSize} onChange={(e) => set({ teamSize: Number(e.currentTarget.value) })}>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}x{n}
          </option>
        ))}
      </select>
      <select class="rlc-input" aria-label={t('spectators')} value={form.spectators} onChange={(e) => set({ spectators: e.currentTarget.value as CustomForm['spectators'] })}>
        {SPECTATORS.map(([value, key]) => (
          <option key={value} value={value}>
            {t('spectators')}: {t(key)}
          </option>
        ))}
      </select>
      <button type="button" class="rlc-button" data-variant="primary" disabled={!form.name.trim() || !mode || create.pending} onClick={() => create.run()}>
        {t('create')}
      </button>
    </section>
  );
}
