import { t } from '../../i18n';
import { Button } from '../../ui/Button';

/** "16.19.823.0722" vira "16.19". */
export function shortPatch(version: string | null | undefined): string | null {
  const match = /^(\d+)\.(\d+)\./.exec(version ?? '');
  return match ? `${match[1]}.${match[2]}` : null;
}

/** Página de notas do patch no site da Riot, no idioma do client. Locale fora do padrão `xx_YY` cai em inglês. */
export function patchNotesUrl(locale: string | null | undefined): string {
  const safe = /^[a-z]{2}_[A-Z]{2}$/.test(locale ?? '') ? locale!.toLowerCase().replace('_', '-') : 'en-us';
  return `https://www.leagueoflegends.com/${safe}/news/tags/patch-notes/`;
}

export function Home({ version, locale, onPlay, open = (url) => window.open(url, '_blank') }: { version: string | null; locale: string | null; onPlay: () => void; open?: (url: string) => unknown }) {
  const patch = shortPatch(version);
  const openNotes = () => {
    try {
      if (!open(patchNotesUrl(locale))) window.Toast?.error(t('openFailed'));
    } catch {
      window.Toast?.error(t('openFailed'));
    }
  };
  return (
    <section class="rlc-home">
      <div class="rlc-home-play">
        <Button variant="primary" onClick={onPlay}>
          {t('play')}
        </Button>
      </div>
      <div class="rlc-home-patch">
        <Button variant="pill" onClick={openNotes}>
          {patch ? <strong>Patch {patch}</strong> : null}
          {t('patchNotes')}
        </Button>
      </div>
    </section>
  );
}
