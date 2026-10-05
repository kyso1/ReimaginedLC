import { useEffect, useState } from 'preact/hooks';
import type { Lcu } from '../lcu';
import { getJson } from '../screens/profile/data';
import { background, getMedia, pickRandom, SESSION_SEED, sourceFor } from '../theme/background';

/** Fundo personalizado da tela, ou null para usar o do tema. Arquivos do usuário viram URL de objeto. */
export function useBackground(lcu: Lcu, screen: string): { src: string; video: boolean } | null {
  const b = background.value;
  const source = sourceFor(b, screen);
  const sid = lcu.chatMe.value.data?.summonerId;
  const [result, setResult] = useState<{ src: string; video: boolean } | null>(null);
  const key = JSON.stringify([source, b.random && b.scope === 'global', sid]);
  useEffect(() => {
    setResult(null);
    let live = true;
    let objectUrl: string | null = null;
    const done = (r: { src: string; video: boolean } | null) => live && setResult(r);
    if (b.random && sid && (b.scope === 'global' || !source)) {
      void getJson<Array<{ id: number; ownership?: { owned?: boolean }; isBase?: boolean }>>(`/lol-champions/v1/inventories/${sid}/skins-minimal`)
        .then((skins) => pickRandom((skins ?? []).filter((s) => !s.isBase).map((s) => ({ id: s.id, owned: !!s.ownership?.owned })), SESSION_SEED))
        .then((id) => (id ? lcu.game.splash(id) : null))
        .then((url) => done(url ? { src: url, video: false } : null));
    } else if (source?.kind === 'splash') {
      void lcu.game.splash(source.skinId).then((url) => done(url ? { src: url, video: false } : null));
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
  }, [key, screen]);
  return result;
}
