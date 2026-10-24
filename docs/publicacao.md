# Publicação e atualização automática

## Peças

- **Carregador** (`loader/index.ts` → `dist-loader/ReimaginedLC/index.js`, ~5 kB, sem Preact): é o `index.js` da pasta de plugins do Pengu. Quase nunca muda.
- **Cópia local** (`app/` dentro da pasta do plugin): o build normal (`dist/ReimaginedLC`, com chunks), entregue no zip. Serve no primeiro uso, sem rede ou quando a versão guardada falha.
- **Bundle do CDN** (`npm run build:cdn` → `dist-cdn/ReimaginedLC`): o mesmo app num arquivo só, publicado na tag `cdn-v{versão}` e servido pelo jsDelivr (`https://cdn.jsdelivr.net/gh/kyso1/ReimaginedLC@cdn-v{versão}/`).

O repositório fica numa constante só: `REPO` em `loader/index.ts`. Ele precisa ser público para o jsDelivr e a API do GitHub responderem.

## Como o carregador escolhe

1. `init(context)` (síncrono): registra já os `postInit` que o bundle usa (`EARLY_APIS`: `rcp-fe-lol-paw`, `rcp-fe-lol-shared-components`) e entrega ao bundle um contexto que repassa essas APIs quando chegam. Outros nomes vão direto ao Pengu (podem chegar tarde para plugins da loja).
2. Lê a versão da cópia local (`app/manifest.json`) e a versão guardada no IndexedDB (`rlc-loader`). Se a guardada for mais nova, **re-verifica** assinatura e sha256 e importa os bytes por `blob:`. Senão importa `app/index.js`.
3. Publica `window.__rlcLoader = { version, base, ready }` antes do import (`base` é de onde o bundle busca fontes e temas: jsDelivr versionado ou `app/`).
4. No início e a cada 6 h consulta `releases/latest` do GitHub (60 req/h sem login). Versão mais nova: baixa `manifest.json`, `manifest.sig` e `index.js`, verifica, guarda no IndexedDB e emite `rlc:update-ready`.
5. O bundle (`src/shell/update.ts`) mostra "Atualização pronta" com **Recarregar** em Configurações → Geral (e um Toast). O botão só fica ativo nas fases None, Lobby, PreEndOfGame, WaitingForStats e EndOfGame. Nunca recarrega sozinho.

Segurança: o carregador só executa bytes que ele mesmo verificou (ECDSA P-256 / SHA-256 sobre o `manifest.json`, chave pública em `PUBLIC_KEY`, depois sha256 do `index.js`). Nunca faz `import()` de URL remota. Fontes e temas (não são código) vêm por URL versionada. Qualquer falha (rede, assinatura, hash) cai para a cópia local e só loga no console.

## Como lançar uma versão

1. Suba `version` no `package.json` (ex.: `0.2.0`) e faça commit.
2. `git tag v0.2.0 && git push origin master v0.2.0`.
3. O workflow `release.yml`: confere tag = package.json, roda `npm test`, `npm run build`, `build:loader`, `build:cdn`; gera e assina `manifest.json`/`manifest.sig` (`scripts/manifest.ts`, chave no secret `RLC_SIGNING_KEY`) em `dist-cdn` e em `dist`; cria um commit órfão só com `dist-cdn/ReimaginedLC` e empurra a tag `cdn-v0.2.0`; monta o zip (`ReimaginedLC/index.js` = carregador, `ReimaginedLC/app/` = cópia local) e cria a release. Tag com `-` (ex.: `v0.3.0-beta.1`) vira pré-lançamento e não é oferecida pela atualização.

Instalação manual: extrair o zip na pasta `plugins` do Pengu. Atenção: `npm run dev:client` copia o build direto para a pasta e substitui o carregador (normal em desenvolvimento).

Testar a assinatura local: `node scripts/manifest.ts <pasta> <versão> <chave.pem>`.

## Chave

- Privada: `C:\Users\Admin\.reimaginedlc\signing-key.pem` (fora do repo; `*.pem` está no `.gitignore`). Cadastrar: `gh secret set RLC_SIGNING_KEY < C:\Users\Admin\.reimaginedlc\signing-key.pem`.
- Trocar: gere um par novo (`node -e "const {generateKeyPairSync:g}=require('crypto');const k=g('ec',{namedCurve:'P-256'});require('fs').writeFileSync('nova.pem',k.privateKey.export({type:'pkcs8',format:'pem'}));console.log(JSON.stringify(k.publicKey.export({format:'jwk'})))"`), troque `x`/`y` de `PUBLIC_KEY` em `loader/index.ts`, atualize o secret e lance uma versão. O carregador novo só chega por instalação manual (o zip): carregadores antigos rejeitam versões assinadas com a chave nova e ficam na cópia local, sem quebrar.
