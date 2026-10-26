import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolPremadeVoicePremadeVoiceParticipantDto, LolPremadeVoiceSessionResource, LolPremadeVoiceVoiceAvailability } from '../../lcu/types';
import { useAction } from '../../ui/useAction';
import { getJson } from '../profile/data';

const VOICE = '/lol-premade-voice/v1';

interface VoiceState {
  availability: LolPremadeVoiceVoiceAvailability | null;
  session: LolPremadeVoiceSessionResource | null;
  settings: { inputMode?: string; localMicMuted?: boolean; pttKey?: string } | null;
  participants: LolPremadeVoicePremadeVoiceParticipantDto[];
}

/** Estado da voz do grupo: lido no início e de novo a cada evento do plugin de voz. */
function useVoice(lcu: Lcu): VoiceState {
  const [state, setState] = useState<VoiceState>({ availability: null, session: null, settings: null, participants: [] });
  useEffect(() => {
    let live = true;
    const load = () =>
      void Promise.all([
        getJson<LolPremadeVoiceVoiceAvailability>(`${VOICE}/availability`),
        getJson<LolPremadeVoiceSessionResource>(`${VOICE}/session`),
        getJson<VoiceState['settings']>(`${VOICE}/settings`),
        getJson<LolPremadeVoicePremadeVoiceParticipantDto[]>(`${VOICE}/participants`),
      ]).then(([availability, session, settings, participants]) => live && setState({ availability, session, settings, participants: participants ?? [] }));
    load();
    // Fala (isSpeaking) chega muitas vezes por segundo: uma leitura por quadro de 250 ms basta.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const off = lcu.events.onPrefix(`${VOICE}/`, () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        load();
      }, 250);
    });
    return () => {
      live = false;
      off();
      if (timer) clearTimeout(timer);
    };
  }, [lcu]);
  return state;
}

/**
 * Voz do grupo, como no lobby do client: entrar e sair do canal, e mutar o microfone. Em aperte-para-falar o mudo
 * não vale (o client também desliga) e o botão mostra a tecla. Só aparece com a voz ligada na conta.
 */
export function Voice({ lcu }: { lcu: Lcu }) {
  const v = useVoice(lcu);
  const join = useAction(() => request('POST', `${VOICE}/session`));
  const leave = useAction(() => request('DELETE', `${VOICE}/session`));
  const mute = useAction((muted: boolean) => request('PUT', `${VOICE}/self/mute`, muted ? 1 : 0));
  if (!v.availability?.enabled || !v.availability.showUI) return null;
  const inside = !!v.session?.id;
  if (!inside) {
    const can = v.availability.voiceChannelAvailable;
    return (
      <button type="button" class="rlc-button rlc-voice" data-variant="pill" disabled={!can || join.pending} title={can ? t('voiceJoin') : t('voiceAlone')} onClick={() => join.run()}>
        <MicIcon />
        {t('voiceJoin')}
      </button>
    );
  }
  const ptt = v.settings?.inputMode === 'pushToTalk';
  const muted = v.settings?.localMicMuted ?? v.session?.isMuted ?? false;
  const speaking = v.participants.filter((p) => p.isSpeaking).map((p) => p.displayName);
  return (
    <div class="rlc-voice-group" role="group" aria-label={t('voiceName')}>
      <button
        type="button"
        class="rlc-button rlc-voice"
        data-variant="pill"
        data-muted={muted && !ptt ? 'true' : undefined}
        aria-pressed={!ptt ? muted : undefined}
        disabled={ptt || mute.pending}
        title={ptt ? `${t('voicePtt')}: ${(v.settings?.pttKey ?? '').replace(/[[\]]/g, '')}` : muted ? t('voiceUnmute') : t('voiceMute')}
        onClick={() => mute.run(!muted)}
      >
        <MicIcon off={muted && !ptt} />
        <span class="rlc-voice-count" title={speaking.join(', ') || undefined} data-speaking={speaking.length ? 'true' : undefined}>
          {v.participants.length}
        </span>
      </button>
      <button type="button" class="rlc-button rlc-voice-leave" data-variant="pill" aria-label={t('voiceLeave')} title={t('voiceLeave')} disabled={leave.pending} onClick={() => leave.run()}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M3 15c5-5 13-5 18 0l-2.5 2.5-3-1.5v-2.5c-2-.7-5-.7-7 0V16l-3 1.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function MicIcon({ off = false }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v4m-3 0h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      {off ? <path d="M4 4l16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /> : null}
    </svg>
  );
}
