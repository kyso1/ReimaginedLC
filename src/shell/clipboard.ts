/** Copia texto e avisa com um toast. Sem a API de área de transferência, cai no `execCommand` de uma textarea escondida. */
export async function copyText(text: string, done: string): Promise<boolean> {
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
  }
  if (ok) window.Toast?.success(done);
  return ok;
}
