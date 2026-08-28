# Sistema de Movimentação Patrimonial — TI

Sistema web simples para controle de movimentação de equipamentos de informática.
Sem banco de dados tradicional: toda a persistência é feita em um único arquivo
`data/banco.json`. Front-end em HTML5 + CSS3 + JavaScript ES6 e backend mínimo em PHP.

## Como colocar no ar

O sistema precisa de um servidor com **PHP** (o navegador sozinho não grava o JSON).

1. Copie a pasta `Sistema/` inteira para o servidor (ou para a pasta compartilhada
   servida por Apache/Nginx com PHP).
2. Garanta permissão de **escrita** para o servidor web nas pastas:
   - `data/`  (grava o `banco.json`)
   - `backup/` (grava as cópias de segurança)

   No Linux, algo como:
   ```bash
   sudo chown -R www-data:www-data data backup
   sudo chmod -R 775 data backup
   ```
3. Acesse pelo navegador: `http://SERVIDOR/Sistema/`

### Teste rápido local (opcional)

Com PHP instalado, dá para testar sem Apache, direto da pasta:
```bash
cd Sistema
php -S 0.0.0.0:8080
```
E abrir `http://localhost:8080/` no navegador.

## Estrutura

```
Sistema/
├── index.html          Interface (SPA, sem recarregar página)
├── css/style.css       Estilo corporativo (tema claro)
├── js/
│   ├── app.js          Núcleo: API, roteador, tabelas, relatórios, backup/import
│   ├── dashboard.js    Painel de indicadores
│   ├── equipamentos.js Cadastro/edição/baixa
│   └── movimentacoes.js Movimentações e trocas vinculadas
├── api/
│   ├── carregar.php    Lê o banco.json
│   ├── salvar.php      Grava o banco.json (escrita atômica)
│   └── backup.php      Cria backup_AAAA-MM-DD_HH-MM.json
├── libs/               Bootstrap e SweetAlert2 (locais, sem CDN)
├── data/banco.json     Banco de dados (JSON)
└── backup/             Backups gerados
```

## Observações

- **Bibliotecas locais:** Bootstrap e SweetAlert2 ficam em `libs/`, então o sistema
  funciona mesmo sem internet ou atrás de proxy autenticado.
- **Setores, tipos e situações** ficam dentro do `banco.json` e podem ser editados
  na tela **Configurações** — sem mexer no código. É assim que você adiciona no
  futuro Switch, Access Point, Telefone IP etc.
- **Troca vinculada:** ao registrar uma troca, o sistema cria duas movimentações
  ligadas a um mesmo ID de operação (ex.: `OP-20260707-001`), permitindo saber qual
  equipamento substituiu qual.
- **Segurança dos dados:** nada é excluído. Equipamentos saem de circulação pela
  baixa (situação "Baixado") e o histórico de movimentações nunca é apagado.
- **Proteção do JSON (opcional):** se quiser impedir download direto de
  `data/banco.json` pela URL, bloqueie a pasta `data/` no Apache/Nginx. Não é
  obrigatório para uso interno.
```
