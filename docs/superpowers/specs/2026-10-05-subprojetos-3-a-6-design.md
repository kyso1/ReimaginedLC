# Subprojetos 3 a 6: social, perfil, coleção, configurações e TFT

Data: 2026-10-05
Status: design aprovado pelo dono em conversa; implementação direta, revisão do dono no fim
Spec geral: `2026-10-03-reimaginedlc-design.md`. Antecessores: 2a, 2b e seus REPORTs.

## Processo combinado

O dono decidiu o design em conversa, com prévias no navegador (`docs/mockups/3a6-*.html`). Daqui em diante a implementação é direta, sem novas rodadas de design nem aprovações intermediárias; o dono vê tudo no fim. Dúvidas que dependem só de dados da API são resolvidas pelo executor e registradas no relatório. Uma revisão final única por subagente cobre todas as frentes.

## Decisões de design

### Shell

- **Coluna da direita** (estilo do client atual): recolhida, é uma coluna fina com o ícone do jogador no topo e os amigos online como avatares com bolinha de status. Ao passar o mouse, ou ao abrir uma conversa, expande por cima da tela (não empurra o conteúdo) com perfil (ícone, nome, status, nível), pedidos de amizade, e a lista completa por grupos: Jogando, Online, Ausente, Offline (recolhido).
- **Moedas**: chip no topo, à esquerda da coluna da direita, sempre visível: Essência Azul, RP e Essência Laranja quando houver (`/lol-inventory/v1/wallet`).
- **Trilho esquerdo** ganha Perfil, Coleção e Configurações (além de Início, Lobby e os itens de fase do 2b). Esses três são navegáveis em qualquer momento fora do fluxo de partida; durante seleção, partida, honra e pós-jogo o trilho continua indicando a fase.

### Social (subprojeto 4)

- **Conversas 1:1** em abas na base da tela, à esquerda da coluna da direita. Uma janela aberta por vez (320x380), as outras como abas. Aba com mensagem não lida pisca uma vez e mostra um ponto. Histórico da LCU com hora; links como texto (não abrem). Fechar a aba não apaga a conversa. Abrir uma conversa expande a coluna da direita.
- **Chat de lobby, seleção de campeões e sala pós-jogo** (pré e pós-jogo): painel recolhível no canto inferior esquerdo; recolhido por padrão no lobby e no pós-jogo, aberto na seleção (acima da gaveta de campeões). Mensagens de sistema em cinza; contador de não lidas recolhido; Enter envia, Esc sai do campo.
- **Amigos**: busca, convidar para o lobby (menu do amigo), abrir perfil, abrir conversa, remover amigo (com confirmação).
- **Pedidos**: recebidos (aceitar, recusar) e enviados (cancelar); adicionar por Riot ID (`Nome#TAG`).
- **Status**: online, ausente, invisível; mensagem de status editável.
- **Fora**: bloquear, notas, grupos personalizados, emojis e figurinhas, arquivos, comandos. O chat de clube não existe mais.

### Perfil (subprojeto 3)

- **Resumo ("vitrine")**: splash de fundo escolhida no perfil da Riot, nome grande e uma linha (elo, nível, taxa de vitórias). Nada mais.
- **Abas em texto** no topo: Resumo, Histórico, Ranqueadas, Maestria. Fundo da vitrine escurecido nas abas.
- **Histórico**: uma linha por partida (campeão, marca de vitória/derrota, KDA, fila, duração, quando); filtro por fila; 20 por vez com "carregar mais". Clicar faz **zoom**: a linha cresce até a tela inteira com a splash do campeão daquela partida ao fundo; abas Placar (nome, campeão, KDA, itens, dano), Estatísticas (dano, ouro, visão, objetivos por jogador), Gráficos (ouro e dano ao longo do tempo, da linha do tempo da partida). "‹ Histórico" encolhe de volta.
- **Ranqueadas**: três cartões iguais (Solo/Duo, Flex, TFT) com emblema, elo, PdL, vitórias e derrotas; linha com temporadas anteriores.
- **Maestria**: grade de campeões com nível e pontos, ordenação por pontos/nível/nome, busca.
- Clicar num amigo abre o perfil dele com as mesmas abas.

### Coleção (subprojeto 3)

- **Linguagem cinematográfica**: o item em foco ocupa a tela (splash real, nome grande, linha de detalhe); trilho de cartões altos na base; passar o mouse troca o fundo com esmaecimento; chips trocam a seção do trilho; o que não se possui aparece em cinza.
- **Abas**: Campeões, Skins, Runas, Feitiços, Ícones, Sentinelas, Emotes, Espólios.
- **Campeões**: seções Favoritos, Maior maestria, Todos; filtro por rota (o mesmo da seleção); clicar entra no campeão (skins dele e maestria).
- **Skins**: seções Recentes e por campeão; foco com raridade e cromas como bolinhas de cor (passar o mouse mostra a croma).
- **Feitiços, Ícones, Sentinelas, Emotes**: mesmo padrão cinematográfico, com busca. Ícone e sentinela podem ser equipados.
- **Runas (opção B)**: uma coluna em linhas, rótulo por linha à esquerda (Principal + pedra angular, três linhas, Secundária, duas linhas, Fragmentos), runas alinhadas; descrição da runa em foco à direita; páginas como abas na base com "+ nova"; salvar, renomear, apagar, "recomendada" (páginas sugeridas pela Riot para campeão e rota).
- **Espólios**: item em foco grande com o brilho da raridade, quantidade e as ações do menu de contexto da LCU (abrir, desencantar, reformar, combinar, ativar); chips por categoria; revelação animada ao abrir; moedas no chip do topo.

### Configurações e temas (subprojeto 5)

- **Abas**: Aparência, Layouts, Geral, Jogo.
- **Aparência**: temas em miniaturas grandes, grupo LoL e grupo TFT; clicar aplica na hora; importar (.zip ou .json); ⋯ em cada tema: editar, duplicar, exportar (.zip), apagar. Transições (completa, reduzida, desligada) e vídeo de fundo.
- **Fundo personalizado** (por cima do tema, sem alterá-lo, e exportado junto): fonte = splash de qualquer campeão ou skin (com busca, trilho cinematográfico), arquivo próprio (imagem, gif, vídeo; guardado em IndexedDB), ou fundos animados da Riot existentes no client; alcance = global ou por tela (Início, Lobby, Perfil, Coleção, Pós-jogo; seleção e Palco seguem com splashes de campeões); ajustes de escurecer, desfocar e enquadramento (arrastar na prévia); opção aleatória entre skins possuídas a cada abertura.
- **Editor de tema**: painel à esquerda (Cores, Tipografia, Formas, Mídia por tela, Movimento); o resto da tela é a pré-visualização ao vivo da tela escolhida (Início, Lobby, Seleção…); salvar e desfazer.
- **Layouts**: seleção de campeões Cinemática ou Clássica (aliados à esquerda, inimigos à direita, grade no centro; spec geral).
- **Geral**: idioma (automático, pt-BR, en-US), camada ligada ao abrir o client, atalho.
- **Jogo**: configurações do jogo a partir de `/lol-game-settings/v1/game-settings-schema` e `input-settings-schema`, como formulário gerado (PATCH e `save`). Se o esquema não permitir um formulário fiel, a aba vira um botão que mostra as configurações da Riot (camada desligada) e o motivo vai ao relatório.

### TFT (subprojeto 6)

- **Tema Vidro lúdico** aplicado automaticamente em lobby de TFT (spec geral).
- **Palco do TFT**: cada coluna mostra a Pequena Lenda equipada do jogador no lugar da splash.
- **Personalizar** na barra do lobby abre uma gaveta com abas: Pequena Lenda, Arena, Explosão, Zoom, Manual, Pilar. Cada aba: busca no topo e seções horizontais (Favoritos primeiro, depois os grupos do inventário da LCU), cada seção com rolagem lateral. Equipar por `PUT /lol-cosmetics/v1/selection/{tipo}`.

## Defeitos e pendências a resolver junto

- Animações travando (exemplo do dono: o "banner carregando ao entrar numa sala"): medir e corrigir; a causa provável é o Palco aplicando splashes grandes sem pré-carregamento e transições de fundo; investigar com o client.
- Pendências menores registradas nos REPORTs do 2a e 2b, quando baratas.

## Dados (principais endpoints)

- Chat: `/lol-chat/v1/me`, `friends`, `friend-requests`, `conversations`, `conversations/{id}/messages`.
- Carteira: `/lol-inventory/v1/wallet`.
- Histórico: `/lol-match-history/v1/products/lol/{puuid}/matches`, `games/{gameId}`, `game-timelines/{gameId}`.
- Ranqueadas: `/lol-ranked/v1/ranked-stats/{puuid}`.
- Maestria: `/lol-champion-mastery/v1/{puuid}/champion-mastery`.
- Coleção: `/lol-champions/v1/inventories/{summonerId}/champions`, `skins-minimal`, chromas; `/lol-collections/v1/inventories/{summonerId}/ward-skins`, `spells`; `/lol-inventory/v1/inventory/emotes`; ícones pelo inventário e `PUT /lol-summoner/v1/current-summoner/icon`.
- Runas: `/lol-perks/v1/perks`, `styles`, `pages`, `recommended-pages/...`.
- Espólios: `/lol-loot/v1/player-loot`, `player-loot/{id}/context-menu`, `recipes/{name}/craft`.
- Configurações do jogo: `/lol-game-settings/v1/*`.
- TFT: `/lol-cosmetics/v1/inventories/{set}/*`, `/lol-cosmetics/v1/selection/*`.

Formatos reais são conferidos no client antes de escrever código contra eles (lição do 2a e 2b), e divergências vão ao relatório.

## Restrições

As mesmas do 2a e 2b: `chrome108`; só variáveis `--rlc-*` (teste em `styles.test.ts`); texto externo como texto; sem atualização otimista; ações por `request` e `useAction`; i18n pt-BR e en-US; fixtures neutras; commits com a identidade noreply.
