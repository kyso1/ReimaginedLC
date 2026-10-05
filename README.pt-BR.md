# ReimaginedLC

Uma interface nova para o client do League of Legends, feita como plugin do [Pengu Loader](https://pengu.lol). Ela troca as telas do client pelas suas: início, lobby, fila, seleção de campeões, pós-jogo, perfil, coleção, espólios, amigos e chat, configurações com editor de tema e personalização do TFT.

[Read in English](README.md)

> **Projeto não oficial.** O ReimaginedLC não é endossado pela Riot Games nem tem ligação com ela. Modificar o client é zona cinza nos termos da Riot. O Pengu Loader é tolerado hoje, sem garantia. Use por sua conta e risco. O ReimaginedLC nunca dá vantagem no jogo: não revela nomes ocultos, não esquiva sem penalidade, não desbloqueia skins.

## Instalação

1. Instale o [Pengu Loader](https://pengu.lol) e ative-o.
2. Baixe `ReimaginedLC-<versão>.zip` em [Releases](https://github.com/kyso1/ReimaginedLC/releases).
3. Extraia dentro de `Pengu Loader/plugins/`, para ficar `Pengu Loader/plugins/ReimaginedLC/index.js`.
4. Reinicie o client.
5. Aperte **Ctrl+Shift+F12** para ligar a interface nova.

## Desligar

- **Ctrl+Shift+F12** alterna entre o ReimaginedLC e o client original a qualquer momento.
- **Client original**, no fim do trilho da esquerda, faz o mesmo.
- Se uma tela falhar, o ReimaginedLC se desliga sozinho e o client original volta.
- Para desinstalar, apague a pasta `Pengu Loader/plugins/ReimaginedLC`.

O client original continua rodando por baixo, porque é o plano B. Login e loja continuam os da Riot.

## Atualizações

O ReimaginedLC procura uma versão nova uma vez por dia. Quando há, mostra um aviso e um link em **Configurações › Geral**. Ele nunca se atualiza sozinho: baixe o zip novo e troque a pasta.

## Temas

Três temas vêm com o plugin: Vidro, Vidro lúdico (o padrão do TFT) e Editorial. Você pode criar um tema em **Configurações › Aparência › Novo tema** ou importar um arquivo JSON. Veja [o guia de temas](docs/THEMES.md).

## Idioma

Português (Brasil) e inglês, seguindo o idioma do client. Dá para fixar um em **Configurações › Geral**. Nomes de campeões, itens e filas vêm do client, já traduzidos.

## Contribuir

Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

[MIT](LICENSE). O repositório não contém assets da Riot: ícones, splashes e sons são carregados do próprio client em tempo de execução.
