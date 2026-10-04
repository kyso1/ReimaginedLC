# Subprojeto 1: fundação

Data: 2026-10-04
Status: aguardando revisão
Spec geral: `2026-10-03-reimaginedlc-design.md`. Dados de ambiente: `docs/dump/REPORT.md`.

## Objetivo

Entregar o esqueleto do plugin: ele carrega dentro do client, cobre a janela com a nossa camada, mostra a tela inicial nova no tema Vidro, troca de tema ao vivo e sai da frente com um atalho. Nenhuma tela de jogo é refeita aqui.

Marco: com o plugin instalado, `Ctrl+Shift+F12` liga a camada, a tela inicial aparece com o fundo em imagem ou vídeo do tema, trocar para o tema Editorial muda cores, tipografia e fundo sem recarregar, e `Ctrl+Shift+F12` devolve o client original intacto.

## Decisões desta spec

Três pontos não estavam fechados na spec geral. Escolhi um padrão para cada; trocar qualquer um é barato nesta fase.

| Ponto | Decisão | Alternativa descartada |
|---|---|---|
| Como trocar de tema antes de existir a tela de configurações (subprojeto 5) | Ações na barra de comandos do Pengu (`CommandBar.addAction`): uma por tema instalado, mais ligar e desligar a camada | Um seletor flutuante próprio: seria interface jogada fora no subprojeto 5 |
| O que o botão Jogar faz enquanto o lobby não foi refeito (subprojeto 2) | Desliga a camada e deixa o client original à mostra, para o usuário usar o fluxo da Riot | Criar lobby pela API: é trabalho do subprojeto 2 |
| Ciclo de desenvolvimento | Dois modos: no navegador, contra a LCU simulada; e no client, com build em modo watch copiando para a pasta do Pengu e recarga manual (`Ctrl+Shift+R`) | Recarga automática dentro do client: o Pengu 1.1.6 não oferece gancho para isso |

## Restrições do ambiente

Medidas no dump, valem para todo o código deste subprojeto:

- Chromium 108. Sem View Transitions API, sem aninhamento de CSS, sem `color-mix()`, sem `popover`. Há `backdrop-filter`, `:has()`, container queries e Web Animations API.
- Pengu Loader 1.1.6. Há `init(context)`, `load()`, `DataStore` (`has`, `get`, `set`, `remove`), `CommandBar` (`addAction`, `show`, `update`) e `Toast`. Não há `PluginFS`.
- Assets `/fe/...` e `/lol-game-data/assets/...` respondem dentro do client. Fora dele, só os de `/lol-game-data`.
- Custo de base do client ocioso, sem plugins: 1,6 núcleo de CPU e 1,2 GB de memória de trabalho.

## Estrutura do repositório

```
src/
  index.ts            entrada do plugin: exporta init e load
  shell/              root, roteador por fase, trilho, atalho, error boundary
  lcu/                cliente HTTP, WebSocket único, stores, tipos gerados
  theme/              manifesto, validador, aplicação de tokens, resolução por jogo
  ui/                 componentes base
  screens/home/       tela inicial
themes/               temas embutidos: vidro, vidro-ludico, editorial
tools/mock-lcu/       LCU simulada
tools/dump/           ferramentas do subprojeto 0 (ficam como estão)
```

Os tipos em `docs/dump/lcu/lcu-types.d.ts` são copiados para `src/lcu/types.d.ts` por um script (`npm run lcu:types`), para que `src/` não dependa de `docs/`.

## Build

- Vite com Preact, `@preact/signals` e TypeScript. Alvo `chrome108`.
- Saída: `dist/ReimaginedLC/index.js` (um arquivo, com CSS embutido) e `dist/ReimaginedLC/themes/` com os temas embutidos e sua mídia.
- `npm run build`: build de produção.
- `npm run dev:client`: build em modo watch que copia `dist/ReimaginedLC/` para `<PENGU_DIR>/plugins/ReimaginedLC/`. O usuário recarrega o client com `Ctrl+Shift+R`.
- `npm run dev:mock`: sobe a LCU simulada e o servidor de desenvolvimento do Vite; a interface abre em um navegador comum.
- Dependências de execução: `preact` e `@preact/signals`. Nenhuma biblioteca de animação, de roteamento ou de validação.

## Entrada do plugin

`init(context)` faz uma única coisa: registra o atalho de emergência (`keydown` em fase de captura na `window`). Assim o atalho funciona mesmo que todo o resto falhe.

`load()` monta o root, conecta a `lcu/`, carrega o tema ativo e registra as ações na barra de comandos. Qualquer exceção em `load()` é capturada: a camada fica desligada e um `Toast` avisa.

## Shell

- **Root.** Um `div#rlc-root` fixo, cobrindo a janela, acima de tudo, anexado ao `body`. Todo o nosso CSS é prefixado por `#rlc-root` para não vazar para a interface da Riot nem herdar dela.
- **Camada ligada ou desligada.** Estado guardado no `DataStore` (`rlc.enabled`). Padrão: desligada, até o fim do subprojeto 2. Desligada, o root tem `display: none` e a interface da Riot aparece e funciona normalmente.
- **Interface da Riot com a camada ligada.** Continua carregada, com `visibility: hidden` no elemento raiz dela, para não pintar por baixo. O efeito disso na CPU de base é medido neste subprojeto (ver Desempenho); se piorar ou quebrar algo, a alternativa é deixá-la visível atrás do nosso root opaco.
- **Atalho de emergência.** `Ctrl+Shift+F12` alterna a camada e mostra um `Toast` com o novo estado.
- **Roteador.** Um signal com a fase do gameflow decide a tela. Neste subprojeto só `None` tem tela nossa (a inicial). Para qualquer outra fase a camada se oculta sozinha e volta quando a fase retorna a `None`. Isso já é o comportamento de fallback da spec geral: fase sem tela nossa mostra o client original.
- **Trilho lateral.** Dois itens: Início e "Client original" (desliga a camada). Os demais itens entram conforme as telas forem refeitas.
- **Error boundary.** Envolve a tela ativa. Exceção ao renderizar: a camada se desliga, um `Toast` informa, o erro vai para o console.
- **Barra de comandos.** Ações: "ReimaginedLC: ligar/desligar", "ReimaginedLC: tema <nome>" para cada tema instalado.

## LCU

- Um `WebSocket` aberto a partir de `link[rel="riot:plugins:websocket"]`, inscrito em `OnJsonApiEvent`. Reconexão com espera crescente (1 s, 2 s, 4 s, até 30 s); ao reconectar, cada store ativo refaz seu `GET`.
- `createStore(uri)`: devolve um signal `{ status: 'loading' | 'ready' | 'unavailable', data }`. Faz um `GET` inicial e se atualiza pelos eventos daquela URI. Resposta 404 no `GET` inicial é estado válido (`data: null`), não erro.
- Stores deste subprojeto: `gameflowPhase` (`/lol-gameflow/v1/gameflow-phase`), `currentSummoner` (`/lol-summoner/v1/current-summoner`), `build` (`/system/v1/builds`).
- Nenhuma tela chama `fetch` nem abre socket. Nenhuma ação de escrita na LCU neste subprojeto.

## Motor de temas

Manifesto `theme.json`:

```json
{
  "name": "vidro",
  "label": "Vidro",
  "version": 1,
  "extends": null,
  "tokens": {
    "color.bg": "#0b1020",
    "color.surface": "rgba(255,255,255,0.12)",
    "color.border": "rgba(255,255,255,0.22)",
    "color.text": "#ffffff",
    "color.textMuted": "rgba(255,255,255,0.75)",
    "color.accent": "#ffffff",
    "color.onAccent": "#1b1b2a",
    "font.body": "system-ui, sans-serif",
    "font.display": "system-ui, sans-serif",
    "font.displayWeight": "650",
    "radius.sm": "6px",
    "radius.md": "10px",
    "radius.pill": "999px",
    "blur.surface": "10px",
    "motion.duration": "320ms",
    "motion.easing": "cubic-bezier(0.7, 0, 0.2, 1)"
  },
  "transition": "wipe",
  "backgrounds": { "default": "media/fundo.webm", "home": "media/home.webm" },
  "layouts": {}
}
```

Regras:

- Só dados. Nenhum campo aceita CSS livre, seletor ou script. Valores de token passam por uma lista de formatos permitidos por tipo: cor (`#hex`, `rgb()`, `rgba()`, `hsl()`, `hsla()`), comprimento (`px`, `rem`, `%`), duração (`ms`, `s`), peso numérico, `cubic-bezier()`, e família de fonte sem `url(`. Um valor fora do formato invalida o tema.
- `extends` aponta para outro tema instalado; os tokens do filho sobrescrevem os do pai. Profundidade máxima 3, ciclos invalidam o tema.
- Caminhos de mídia são relativos à pasta do tema, sem `..`, sem esquema e sem barra inicial. Extensões aceitas: `.png`, `.jpg`, `.webp`, `.gif`, `.webm`, `.mp4`.
- `transition` é um de `wipe`, `fade`, `slide`, `zoom`. Implementadas por classes CSS e Web Animations API. A intensidade (`completa`, `reduzida`, `desligada`) é configuração do usuário; `prefers-reduced-motion` força `reduzida`.
- Tema inválido: o tema Vidro é aplicado e um `Toast` diz qual campo falhou.
- Tokens viram variáveis CSS em `#rlc-root` (`color.bg` vira `--rlc-color-bg`). Componentes só usam variáveis.
- Temas embutidos: `vidro`; `vidro-ludico` (`extends: "vidro"`, raios maiores, dourado quente, botões com volume); `editorial` (`extends: "vidro"`, `blur.surface: 0px`, fundo sólido, tipografia maior). Lidos por `fetch` da pasta `themes/` do plugin; a lista de temas embutidos é fixada no build.
- Tema ativo por jogo no `DataStore`: `rlc.theme = { "lol": "vidro", "tft": "vidro-ludico" }`. Neste subprojeto só o de `lol` é exercitado; a troca automática por fila entra com o lobby, no subprojeto 2.
- Temas importados pelo usuário ficam para o subprojeto 5.

## Componentes base

Só os que a tela inicial e o shell usam: `Button`, `IconButton`, `Surface` (painel de vidro), `Rail`, `MediaBackground`, `Toast` (fino, sobre o do Pengu).

`MediaBackground` recebe um caminho de mídia do tema e escolhe `<img>` ou `<video muted loop playsinline>` pela extensão. Vídeo pausa quando a janela perde o foco, quando a camada está desligada e quando a fase não é `None`. Falha ao carregar: mostra `color.bg`.

## Tela inicial

Layout escolhido no brainstorming: mídia de fundo em tela cheia, botão Jogar e um atalho discreto para as notas do patch.

- **Jogar:** desliga a camada (ver Decisões).
- **Notas do patch:** um botão em forma de pílula com a versão curta do client (por exemplo "Patch 16.19", derivada de `build.version`) que abre a página de notas da Riot no navegador padrão. O endereço é montado a partir do locale do client; se a abertura falhar, um `Toast` informa.
- **Saudação:** nenhuma. Nome do invocador não aparece na tela inicial.

## LCU simulada

`tools/mock-lcu/` é um servidor Node que lê uma gravação de `docs/dump/sessions/` e a reproduz:

- HTTP: responde `GET` com o `snapshot` daquela URI ou com o último `event` já reproduzido para ela; URI desconhecida responde 404.
- WebSocket: aceita a inscrição `[5, "OnJsonApiEvent"]` e emite os eventos na ordem gravada. Controles por linha de comando: velocidade (`--speed`), pausar em uma fase (`--until ChampSelect`) e avançar por tecla.
- Assets: `/lol-game-data/assets/*` e `/fe/*` são redirecionados para a CDN do CommunityDragon.
- No modo `dev:mock`, a página expõe o mesmo `link[rel="riot:plugins:websocket"]` e imitações mínimas de `DataStore`, `CommandBar` e `Toast`, para o plugin rodar sem alteração.

A gravação atual cobre lobby, seleção, partida em andamento e reconexão; não cobre fim de jogo. Para este subprojeto basta a fase `None`.

## Desempenho

Orçamento em ociosidade, medido com `npm run dump:baseline`, sobre a linha de base sem plugins (1 210 MB, 157% de um núcleo): até 300 MB e até 15 pontos de CPU a mais com a camada ligada na tela inicial e fundo em vídeo.

Três medições entram no relatório deste subprojeto: camada desligada; camada ligada com a interface da Riot visível por baixo; camada ligada com a interface da Riot em `visibility: hidden`. A terceira decide se esconder a interface da Riot reduz o custo de base.

## Testes

Vitest, ambiente `jsdom`.

- `lcu/`: store popula no `GET`, atualiza por evento, trata 404, refaz o `GET` ao reconectar; espera crescente da reconexão.
- `theme/`: validador (cada formato permitido e um caso inválido por tipo, `extends` com ciclo e com profundidade excedida, caminho de mídia com `..`, com esquema e com extensão proibida), herança de tokens, conversão em variáveis CSS, resolução por jogo.
- `shell/`: roteador (fase `None` mostra a tela inicial; outra fase oculta a camada; retorno a `None` a mostra de novo), atalho alterna e persiste o estado, error boundary desliga a camada quando a tela lança.
- `screens/home`: renderiza com o tema Vidro; Jogar desliga a camada; versão curta do patch derivada de `16.19.823.0722`.
- `tools/mock-lcu`: reproduz um trecho sintético de gravação por HTTP e por WebSocket.
- No client real: checklist manual do marco, mais as três medições de desempenho.

## Fora de escopo

Lobby, fila, seleção de campeões, pós-jogo; tela de configurações; importação de temas; gaveta de amigos; troca automática de tema por jogo; i18n além de um arquivo de textos em `pt-BR` e `en-US` escolhido pelo locale do client; publicação no GitHub.

## Riscos

- `visibility: hidden` na interface da Riot pode interromper algo que ela faz só quando visível. Mitigação: é uma das três medições, e a alternativa (deixá-la visível atrás do root) está prevista.
- A interface da Riot recria o próprio DOM ao trocar de fase. O root é anexado ao `body`, fora da árvore dela, e um teste no client confirma que ele sobrevive a um ciclo de fases.
- WebM com transparência não foi medido no dump. Os temas embutidos não dependem dele.

## Alterações na implementação

Mudanças em relação ao texto acima, registradas em 2026-10-04 (detalhes em `docs/fundacao/REPORT.md`):

- Temas embutidos ficam em `public/themes/`, que é a pasta que o Vite copia para o bundle.
- Mídia de tema aceita, além de caminho relativo à pasta do tema, URL de asset do próprio client (`/fe/...`, `/lol-game-data/assets/...`). Valor vazio significa "sem mídia" e anula o fundo herdado.
- Há um quarto store, `regionLocale` (`/riotclient/region-locale`), usado para o idioma dos textos e para o endereço das notas do patch.
- O modo navegador usa dois comandos em terminais separados: `npm run mock` e `npm run dev:mock`.
- O validador de temas ficou mais rígido que o descrito: cores só em hexadecimal de 3, 4, 6 ou 8 dígitos ou em `rgb()`, `rgba()`, `hsl()`, `hsla()` com 3 componentes e alfa opcional; famílias de fonte como lista de nomes ou textos entre aspas balanceadas; valores de token limitados a 200 caracteres.
- A inicialização do client substitui os filhos do `body` cerca de 1,2 s após o carregamento, removendo o nosso elemento raiz. `start()` observa o `body`, remove clones, reanexa o elemento verdadeiro e manda o `App` ressincronizar a visibilidade da Riot.
- A visibilidade da camada e da interface da Riot é sincronizada antes da pintura (efeito de layout), não no quadro seguinte.
- `rlc.hideRiot` fica `true` por padrão: medido no client, esconder a interface da Riot reduz a CPU em cerca de 25 pontos.
- Pendências que passam para o subprojeto 2: controles de janela e região de arraste próprios; forma de abrir as notas do patch, já que `window.open` é bloqueado no client.
