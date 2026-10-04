# Mapa de telas do client

Uma linha por plugin de interface da Riot (`rcp-fe-*`). Gerado por `npm run dump:screens` a partir de `tools/dump/decisions.json`.

- **refazer**: tela nova do ReimaginedLC.
- **embutir**: a tela original da Riot é mostrada num painel.
- **cortar**: não aparece no ReimaginedLC.
- **infra**: não é tela; continua carregado por baixo.

| Plugin | Decisão | Subprojeto | Fase do gameflow | Backends LCU | Endpoints | Nota |
|---|---|---:|---|---|---:|---|
| rcp-fe-lol-navigation | refazer | 1 | todas |  | 0 | Barra de navegação e tela inicial. Vira o shell de trilho lateral. |
| rcp-fe-lol-champ-select | refazer | 2 | ChampSelect | lol-champ-select | 52 | Seleção de campeões, banimentos, feitiços, runas rápidas. |
| rcp-fe-lol-parties | refazer | 2 | Lobby, Matchmaking, ReadyCheck | lol-gameflow, lol-lobby, lol-matchmaking | 145 | Seleção de modo, lobby, fila e aceite de partida. |
| rcp-fe-lol-postgame | refazer | 2 | PreEndOfGame, EndOfGame | lol-end-of-game, lol-honor-v2, lol-pre-end-of-game | 34 | Tela de fim de jogo, honra, placar. |
| rcp-fe-lol-skins-picker | refazer | 2 | ChampSelect |  | 0 | Seletor de skin dentro da seleção de campeões. |
| rcp-fe-lol-champion-details | refazer | 3 | None |  | 0 | Detalhe de campeão na coleção. |
| rcp-fe-lol-champion-statistics | refazer | 3 | None |  | 0 | Estatísticas por campeão no perfil. |
| rcp-fe-lol-collections | refazer | 3 | None | lol-collections | 4 | Coleção: campeões, skins, runas, feitiços, itens. |
| rcp-fe-lol-leagues | refazer | 3 | None |  | 0 | Ranqueadas e ligas. |
| rcp-fe-lol-loot | refazer | 3 | None | lol-loot | 36 | Espólios e criação. |
| rcp-fe-lol-match-history | refazer | 3 | None | lol-match-history | 6 | Histórico de partidas. |
| rcp-fe-lol-profiles | refazer | 3 | None | lol-ranked, lol-summoner-profiles | 28 | Perfil do jogador. |
| rcp-fe-lol-premade-voice | embutir | 4 | Lobby, ChampSelect | lol-premade-voice | 31 | Chat de voz do grupo. Reavaliar no subprojeto 4. |
| rcp-fe-lol-social | refazer | 4 | todas | lol-chat | 58 | Lista de amigos, chat, convites. Vira a gaveta de amigos. |
| rcp-fe-lol-settings | embutir | 5 | todas | lol-settings | 20 | Configurações do jogo e do client. As configurações do ReimaginedLC são uma tela nova à parte. |
| rcp-fe-lol-tft | refazer | 6 | None | lol-tft | 10 | Central do TFT. |
| rcp-fe-lol-tft-team-planner | embutir | 6 | None | lol-tft-team-planner | 31 | Planejador de equipe do TFT. Reavaliar no subprojeto 6. |
| rcp-fe-tft | refazer | 6 | None |  | 0 | Telas do TFT. |
| rcp-fe-audio | infra |  | todas |  | 0 | Motor de som do client. |
| rcp-fe-common-libs | infra |  | todas |  | 0 | Bibliotecas compartilhadas da interface da Riot. |
| rcp-fe-ember-libs | infra |  | todas |  | 0 | Ember da interface da Riot. |
| rcp-fe-lol-clash | embutir |  | None | lol-clash | 88 | Clash. Fluxo próprio e raro. |
| rcp-fe-lol-esports-spectate | cortar |  | None |  | 0 | Assistir a partidas de esports. |
| rcp-fe-lol-event-hub | embutir |  | None | lol-event-hub | 28 | Central de eventos e passes. |
| rcp-fe-lol-highlights | cortar |  | None | lol-highlights | 9 | Destaques gravados. |
| rcp-fe-lol-jade | embutir |  | None |  | 0 | Experiência alternativa "League Classic" (JADE) com tela inicial, loja, coleção, runas, seleção de campeões e conselho de votação. Finalidade confirmada pelos textos; se está ativa neste client e como convive com rcp-fe-lol-champ-select não foi confirmado, reavaliar no subprojeto 2. |
| rcp-fe-lol-kickout | infra |  | todas | lol-kickout | 1 | Diálogos de expulsão do client e de aviso antivício (anti-addiction) via /lol-kickout; sem interface própria de uso diário. Plugin sem trans.json: finalidade lida do código. |
| rcp-fe-lol-l10n | infra |  | todas | lol-l10n | 1 | Textos localizados da Riot. |
| rcp-fe-lol-lock-and-load | infra |  | None | lol-lock-and-load | 3 | Coordena a espera do carregamento dos plugins e das home hubs no início (/lol-lock-and-load); não tem tela. |
| rcp-fe-lol-new-player-experience | embutir |  | None |  | 0 | Tutorial de conta nova. |
| rcp-fe-lol-objectives | embutir |  | None | lol-objectives | 3 | Missões e objetivos. |
| rcp-fe-lol-paw | embutir |  | todas |  | 0 | Janela de compra. Envolve pagamento; sempre a original. |
| rcp-fe-lol-pft | infra |  | todas | lol-pft | 3 | Componente de pesquisa de satisfação (escala Likert e botão Enviar); sem tela própria de uso diário. |
| rcp-fe-lol-shared-components | infra |  | todas |  | 0 | Componentes compartilhados da Riot. |
| rcp-fe-lol-static-assets | infra |  | todas |  | 0 | Principal fonte de imagens, vídeos e sons reutilizáveis. |
| rcp-fe-lol-store | embutir |  | None | lol-store | 25 | Loja. Páginas web da Riot; fora de escopo refazer. |
| rcp-fe-lol-tft-promethium | embutir |  | None |  | 0 | Hub do evento de TFT "Ascensão de Ao Shin" (guias, zonas, trilha da jornada, pacote). Evento sazonal; mantém a tela original. |
| rcp-fe-lol-tft-troves | embutir |  | None | lol-tft-troves | 11 | Tesouros do TFT. Envolve compra. |
| rcp-fe-lol-typekit | infra |  | todas |  | 0 | Fontes. Candidatas a reutilização por referência. |
| rcp-fe-lol-uikit | infra |  | todas |  | 0 | Componentes visuais da Riot. Fonte de ícones e sons. |
| rcp-fe-lol-yourshop | embutir |  | None | lol-yourshop | 9 | Sua Loja. Evento sazonal de compra. |
| rcp-fe-plugin-runner | infra |  | todas |  | 0 | Carregador de plugins do client. |
