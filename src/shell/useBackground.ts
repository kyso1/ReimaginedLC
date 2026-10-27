import { useEffect, useRef, useState } from 'preact/hooks';
import type { Lcu } from '../lcu';
import { getJson } from '../screens/profile/data';
import { background, getMedia, pickRandom, SESSION_SEED, sourceFor, wantsRandom } from '../theme/background';
import { findHelper, resetHelper, wallpaperUrl } from '../theme/wallpapers';
import { prefs } from './prefs';

/** Esperas entre novas tentativas de um fundo do auxiliar que falhou (ele pode estar reiniciando). */
export const LOCAL_RETRY_MS = [1500, 4000, 10000, 30000];

export interface CustomBg {
  src: string;
  video: boolean;
  /** Imagem do mesmo fundo (prévia do Wallpaper Engine), para quando o vídeo carrega ou não decodifica. */
  poster?: string;
  /** Fundo do auxiliar que não carregou: procura o auxiliar de novo (código novo) e tenta outra vez. */
  retry?: () => void;
}

/** Fundo personalizado da tela, ou null para usar o do tema. Arquivos do usuário viram URL de objeto. */
export function useBackground(lcu: Lcu, screen: string): CustomBg | null {
  const b = background.value;
  const source = sourceFor(b, screen);
  const sid = lcu.chatMe.value.data?.summonerId;
  const [result, setResult] = useState<CustomBg | null>(null);
  // Tentativa atual de um fundo do auxiliar; volta a 0 quando a fonte muda.
  const [attempt, setAttempt] = useState(0);
  const random = wantsRandom(b, screen);
  // Plugin de papéis de parede desligado: fundo do auxiliar vira o do tema (sem consultar nada).
  const sourceKey = JSON.stringify([source, random, sid, source?.kind === 'local' && prefs.value.wallpapers]);
  useEffect(() => setAttempt(0), [sourceKey]);
  const key = `${sourceKey}#${attempt}`;
  const loaded = useRef('');
  // Só a fonte manda: trocar de tela com o mesmo fundo global não relê o arquivo nem pisca o fundo do tema.
  useEffect(() => {
    // Nova tentativa da mesma fonte: o fundo atual fica até a próxima URL (sem piscar o do tema entre tentativas).
    if (loaded.current !== sourceKey) setResult(null);
    loaded.current = sourceKey;
    let live = true;
    let objectUrl: string | null = null;
    const done = (r: CustomBg | null) => live && setResult(r);
    if (random && sid) {
      void getJson<Array<{ id: number; ownership?: { owned?: boolean }; isBase?: boolean }>>(`/lol-champions/v1/inventories/${sid}/skins-minimal`)
        .then((skins) => pickRandom((skins ?? []).filter((s) => !s.isBase).map((s) => ({ id: s.id, owned: !!s.ownership?.owned })), SESSION_SEED))
        .then((id) => (id ? lcu.game.splash(id) : null))
        .then((url) => done(url ? { src: url, video: false } : null));
    } else if (source?.kind === 'splash') {
      void lcu.game.splash(source.skinId).then((url) => done(url ? { src: url, video: false } : null));
    } else if (source?.kind === 'local' && prefs.value.wallpapers) {
      // Auxiliar desligado: fica o fundo do tema. Falhou (auxiliar reiniciou e trocou o código, ou está subindo): procura de
      // novo e tenta outra vez, com espera crescente.
      const retry = () => {
        const wait = LOCAL_RETRY_MS[attempt];
        if (wait === undefined) return;
        resetHelper();
        setTimeout(() => live && setAttempt((n) => n + 1), wait);
      };
      const video = source.mime.startsWith('video/');
      // Prévia só existe para os do Wallpaper Engine (id `e…`); imagem da pasta do usuário já é a própria imagem.
      const poster = (base: string) => (video && source.id.startsWith('e') ? wallpaperUrl(base, source.id, 'thumb') : undefined);
      void findHelper().then((base) => done(base ? { src: wallpaperUrl(base, source.id) + (attempt ? `&r=${attempt}` : ''), video, poster: poster(base), retry } : (retry(), null)));
    } else if (source?.kind === 'file') {
      void getMedia(source.key).then((blob) => {
        if (!blob || !live) return;
        objectUrl = URL.createObjectURL(blob);
        done({ src: objectUrl, video: source.mime.startsWith('video/') });
      });
    }
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key]);
  return result;
}
