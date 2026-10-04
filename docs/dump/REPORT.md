# Relatório do dump

Client 16.19.823.0722, Pengu Loader 1.1.6, capturado em 2026-10-03 e 2026-10-04.

## Resumo

Dos 42 plugins de interface da Riot, 15 serão refeitos, 13 embutidos, 2 cortados e 12 são infraestrutura que continua carregada. O ambiente sustenta o tema Vidro e vídeo de fundo, mas é um Chromium 108: a View Transitions API não existe, e três recursos de CSS que o desenho poderia usar também não (aninhamento, `color-mix`, `popover`). O Pengu Loader 1.1.6 não expõe `PluginFS`, então o plugin não lê pastas do disco, o que muda a forma de instalar temas. O maior risco encontrado é de desempenho: o client ocioso, com os plugins atuais, já usa 1,6 núcleo de CPU e 1,4 GB de memória, e a interface da Riot continuará carregada por baixo da nossa.

Duas entregas ficaram incompletas: a medição sem plugins (exige desativar o Pengu Loader) e a gravação de sessão, que existe mas ainda não foi inspecionada à mão nem commitada, e não cobre o fim de jogo.

## Suposições do desenho

| Suposição da spec | Resultado | Fonte | Consequência |
|---|---|---|---|
| View Transitions API disponível | não | `env.json` `features.viewTransitions` | Transições entre telas por classes CSS e Web Animations API. A cortina diagonal usa `clip-path` animado. |
| `backdrop-filter` disponível (tema Vidro) | sim | `env.json` `features.backdropFilter` | Tema Vidro mantido como desenhado. |
| Vídeo de fundo: H.264 | probably | `env.json` `codecs.h264` | Aceito em temas (`.mp4`). |
| Vídeo de fundo: VP9 (WebM) | probably | `env.json` `codecs.vp9` | Aceito em temas (`.webm`). |
| Vídeo de fundo: AV1 | probably | `env.json` `codecs.av1` | Aceito em temas. |
| WebM com transparência | não medido | a sonda usa `canPlayType`, que não detecta canal alfa | Chromium 108 decodifica VP9 com alfa; confirmar com um arquivo real no subprojeto 1 antes de documentar para criadores de tema. |
| Atalho `Ctrl+Shift+F12` chega a um listener comum | sim | `env/hotkey.json` | Mantido. O Pengu não tem API de atalhos; um `keydown` em fase de captura basta. |
| `fetch` para `http://127.0.0.1` funciona dentro do client | sim | coletor recebeu `env` e `hotkey` | Modo de desenvolvimento com servidor local é viável. A origem da página do client é `https://127.0.0.1:<porta>`. |
| `DataStore` do Pengu disponível | sim: `has`, `get`, `set`, `remove` | `env.json` `pengu.DataStore` | Configuração e tema ativo ficam no `DataStore`, como previsto. |
| `PluginFS` do Pengu disponível | não (`undefined`) | `env.json` `pengu.PluginFS` | O plugin não lê nem lista pastas. Temas do usuário não podem ser "uma pasta no disco" lida em tempo de execução. Ver Riscos, item 2. |
| `init(context)` do Pengu é chamado | sim: `context.rcp` (`pluginRegistry`, `callbacks`), `context.socket` (`observe`, `disconnect`) | `env.json` `penguInit` | O atalho de emergência pode ser registrado em `init`, antes de a interface da Riot carregar. `context.socket.observe` é uma alternativa ao WebSocket próprio. |
| `/swagger` disponível | não (404) | Task 2 | Tipos gerados de `/help?format=Full` e de `/help?target=<nome>&format=Console` por função. |
| Assets `/fe/...` reutilizáveis por referência | sim dentro do client (200), não pela porta HTTP (404) | `env.json` `assetUrls`; Task 3 | Reutilização mantida no plugin. A LCU simulada, que roda em navegador comum, precisa buscar esses arquivos na CDN do CommunityDragon. |

Navegador embutido: CEF 108, equivalente a Chromium 108. O `userAgent` não traz o token `Chrome/`, por isso `env.json` registra `chromium: null`; a versão está em `(CEF 108)`. Outros recursos medidos: `:has()` sim, container queries sim, Web Animations sim, WebGL2 sim, `OffscreenCanvas` sim; aninhamento de CSS não, `color-mix()` não, `popover` não. Janela de 1600x900, `devicePixelRatio` 1.

## API LCU

1453 endpoints HTTP, 3605 tipos e 930 eventos. Os tipos TypeScript gerados compilam em modo estrito e nenhum tipo precisou ser declarado como `unknown`.

Backends com mais endpoints: `lol-clash` 88, `lol-lobby` 85, `lol-chat` 58, `lol-champ-select` 52, `lol-gameflow` 51, `lol-lobby-team-builder` 48, `lol-summoner` 39, `lol-loot` 36, `lol-premade-voice` 31. Outros 87 endpoints não pertencem a plugin algum (núcleo do client).

Um achado da gravação afeta o subprojeto 2: neste patch, partida personalizada é uma fila. Criar o lobby exige `queueId` junto de `customGameLobby` (por exemplo 3140 para a Ferramenta de Treino, 3100 para Summoner's Rift às cegas); o formato antigo, só com `customGameLobby`, responde `INVALID_LOBBY`. Iniciar a seleção passa pelas fases `Matchmaking` e `ReadyCheck` no mesmo instante, antes de `ChampSelect`.

## Telas

| Decisão | Plugins | Quais |
|---|---:|---|
| refazer | 15 | Subprojeto 1: navegação. Subprojeto 2: grupos e fila, seleção de campeões, seletor de skins, pós-jogo. Subprojeto 3: perfil, histórico, ligas, coleção, detalhes e estatísticas de campeão, espólios. Subprojeto 4: social. Subprojeto 6: TFT (2 plugins). |
| embutir | 13 | Loja, Sua Loja, janela de compra, central de eventos, missões, Clash, tutorial, voz do grupo, configurações do jogo, planejador de equipe e tesouros do TFT, evento sazonal do TFT (`tft-promethium`), `jade`. |
| cortar | 2 | Assistir a esports e destaques gravados. O usuário os declarou dispensáveis. |
| infra | 12 | Bibliotecas, fontes, sons, textos e assets compartilhados; avisos de sessão encerrada (`kickout`); pesquisa de satisfação (`pft`); coordenação de carregamento (`lock-and-load`). |

`rcp-fe-lol-jade` é a decisão menos segura: os textos indicam uma experiência paralela de "League Classic", mas não se confirmou se está ativa nem como convive com a seleção de campeões. Reavaliar na spec do subprojeto 2.

O mapa é por plugin da Riot, não por tela e modal, e as colunas de backends e endpoints de `screens.md` são estimativa. O levantamento de endpoints por tela é feito na spec de cada subprojeto.

## Assets

Arquivos reutilizáveis por referência, em `global/default`:

| Categoria | Arquivos | Onde se concentram |
|---|---:|---|
| Imagem | 55 429 | `rcp-be-lol-game-data` 48 043, `rcp-fe-lol-static-assets` 2 888, `rcp-fe-lol-loot` 814 |
| Vídeo | 949 | `rcp-be-lol-game-data` 321, `rcp-fe-lol-static-assets` 204, `rcp-fe-lol-loot` 131 |
| Áudio | 2 056 | `rcp-be-lol-game-data` 1 141, `rcp-fe-lol-static-assets` 231, `rcp-fe-lol-collections` 140 |
| Fonte | 27 | `rcp-fe-lol-typekit` 16 (família Beaufort for LoL), `rcp-fe-lol-jade` 8 |

45 plugins inventariados, 7 GB de WADs instalados. A amostra de 40 URLs de `/lol-game-data` respondeu 200 em todas. As quatro URLs `/fe/` testadas pela sonda responderam 200 dentro do client. A listagem vem do CommunityDragon `latest`, que coincidiu com o patch instalado.

Nenhum arquivo da Riot foi copiado para o repositório.

## Medição de base

| Cenário | Processos | Memória de trabalho média (MB) | Memória privada média (MB) | CPU (% de um núcleo) |
|---|---:|---:|---:|---:|
| Sem plugins | não medido | | | |
| Plugins atuais | 8 | 1 365,9 | 2 316,8 | 161,93 |

Medido em 60 s com o client ocioso no lobby, em máquina de 12 núcleos lógicos. A linha "sem plugins" exige desativar o Pengu Loader e reabrir o client; fica pendente.

O número de CPU é alto para um client parado e não pode ser atribuído sem a segunda medição: pode vir dos plugins de tema ativos (fundos em vídeo) ou do próprio client. A interface da Riot continuará carregada, então o custo do ReimaginedLC se soma ao da linha "sem plugins". Até ela existir, não há orçamento de desempenho definido.

## Gravações

`docs/dump/sessions/ferramenta-de-treino.jsonl`: 659 linhas, 4,3 MB, gerada em 2026-10-04. Ainda não commitada: aguarda inspeção manual do dono do repositório.

Fases vistas, em ordem: `Lobby`, `None`, `Lobby`, `Matchmaking`, `ReadyCheck`, `ChampSelect`, `GameStart`, `InProgress`, `Reconnect`, `TerminatedInError`, `None`. A sessão foi conduzida pela API: lobby da Ferramenta de Treino, uma escolha de campeão, partida aberta e processo do jogo encerrado à força.

O que a gravação não cobre, e que o subprojeto 2 precisará gravar:
- fim de jogo (`PreEndOfGame`, `EndOfGame`): a partida foi abandonada e terminou em `TerminatedInError`;
- fila com outros jogadores, aceite de partida real e banimentos;
- troca de runas e de feitiços durante a seleção.

Verificações feitas na saída anonimizada: nenhum JWT, nenhum `Bearer`, nenhum endereço de e-mail, nenhum UUID fora do prefixo substituto (10 062 UUIDs, todos substitutos). As duas barreiras aceitaram o arquivo: a verificação por formato e a lista de bloqueio com 89 entradas (nome do dono e nomes de amigos com 6 ou mais caracteres).

Limitações conhecidas desta gravação:
- 3 MB dos 4,3 MB são o inventário de cosméticos do TFT (`/lol-cosmetics`), sem uso para a LCU simulada. Acrescentar esse prefixo ao filtro de ruído do gravador antes da próxima gravação.
- O anonimizador leva cerca de 3 minutos neste arquivo.
- Nomes de amigos com 3 a 5 letras ficaram fora da lista de bloqueio: como palavras curtas, coincidem com trechos de nomes de cosméticos e de campeões e fariam a barreira recusar um arquivo correto. Esses nomes continuam cobertos pela substituição por chave de identidade.
- O IP do servidor de jogo da Riot aparece em `gameClient.serverIp`. Não é dado pessoal.

## Riscos e ajustes na spec

1. **View Transitions API ausente.** Seção "Motor de temas": as transições passam a ser só por classes CSS e Web Animations API. Aplicado na spec.
2. **`PluginFS` ausente no Pengu 1.1.6.** Seção "Fluxo de dados", item 5, e "Distribuição": temas do usuário não podem ser lidos de uma pasta em tempo de execução. Proposta: importar tema pela tela de configurações (arquivo `.zip` ou `.json` escolhido pelo usuário), guardar o manifesto no `DataStore` e a mídia em IndexedDB; temas embutidos continuam como arquivos do plugin, carregados por URL. Aplicado na spec como decisão a confirmar na spec do subprojeto 5.
3. **Assets `/fe/` só existem dentro do client.** Seção "Testes": a LCU simulada precisa de uma fonte alternativa para esses arquivos. Aplicado na spec.
4. **Custo de base alto e ainda não atribuído.** Seção "Limites conhecidos": sem a medição sem plugins não há orçamento. Pendência registrada, sem mudança de desenho.
5. **Partida personalizada virou fila.** Afeta só a spec do subprojeto 2 (criação de lobby e fases `Matchmaking` e `ReadyCheck` instantâneas). Registrado aqui; a spec geral não muda.
6. **CSS moderno indisponível.** Sem aninhamento, `color-mix()` e `popover` no Chromium 108. O build do Vite deve ter `chrome108` como alvo, e os componentes não podem depender desses recursos. Aplicado na spec.
7. **`init(context)` disponível.** Seção "Tratamento de erros": o atalho de emergência é registrado em `init`, que roda antes de `load`. Aplicado na spec.
