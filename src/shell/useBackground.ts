import { useEffect, useState } from 'preact/hooks';
import type { Lcu } from '../lcu';
import { getJson } from '../screens/profile/data';
import { background, getMedia, pickRandom, SESSION_SEED, sourceFor, wantsRandom } from '../theme/background';
import { findHelper, wallpaperUrl } from '../theme/wallpapers';
import { prefs } from './prefs';

/** Fundo personalizado da tela, ou null para usar o do tema. Arquivos do usuário viram URL de objeto. */
export function useBackground(lcu: Lcu, screen: string): { src: string; video: boolean } | null {
  const b = background.value;
  const source = sourceFor(b, screen);
  const sid = lcu.chatMe.value.data?.summonerId;
  const [result, setResult] = useState<{ src: string; video: boolean } | null>(null);
  const random = wantsRandom(b, screen);
  // Plugin de papéis de parede desligado: fundo do auxiliar vira o do tema (sem consultar nada).
  const key = JSON.stringify([source, random, sid, source?.kind === 'local' && prefs.value.wallpapers]);
  // Só a fonte manda: trocar de tela com o mesmo fundo global não relê o arquivo nem pisca o fundo do tema.
  useEffect(() => {
    setResult(null);
    let live = true;
    let objectUrl: string | null = null;
    const done = (r: { src: string; video: boolean } | null) => live && setResult(r);
    if (random && sid) {
      void getJson<Array<{ id: number; ownership?: { owned?: boolean }; isBase?: boolean }>>(`/lol-champions/v1/inventories/${sid}/skins-minimal`)
        .then((skins) => pickRandom((skins ?? []).filter((s) => !s.isBase).map((s) => ({ id: s.id, owned: !!s.ownership?.owned })), SESSION_SEED))
        .then((id) => (id ? lcu.game.splash(id) : null))
        .then((url) => done(url ? { src: url, video: false } : null));
    } else if (source?.kind === 'splash') {
      void lcu.game.splash(source.skinId).then((url) => done(url ? { src: url, video: false } : null));
    } else if (source?.kind === 'local' && prefs.value.wallpapers) {
      // Auxiliar desligado: fica o fundo do tema.
      void findHelper().then((base) => done(base ? { src: wallpaperUrl(base, source.id), video: source.mime.startsWith('video/') } : null));
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
