/* ============================================================
   dashboard.js — Painel com os indicadores do parque
   ============================================================ */
'use strict';

App.renderDashboard = function (root) {
  const U = App.U, ICONS = App.ICONS;
  const eq = DB.equipamentos;
  const mv = DB.movimentacoes;

  const contaTipo = (t) => eq.filter((e) => e.tipo === t).length;
  const contaSit = (s) => eq.filter((e) => e.situacao === s).length;

  const cards = [
    { num: eq.length,               lbl: 'Total de equipamentos', chip: 'chip-brand',  icon: ICONS.inventory },
    { num: contaTipo('CPU'),        lbl: 'CPUs',                  chip: 'chip-info',   icon: ICONS.computer },
    { num: contaTipo('Monitor'),    lbl: 'Monitores',             chip: 'chip-info',   icon: ICONS.monitor },
    { num: contaTipo('Impressora'), lbl: 'Impressoras',           chip: 'chip-info',   icon: ICONS.print },
    { num: contaTipo('Notebook'),   lbl: 'Notebooks',             chip: 'chip-info',   icon: ICONS.laptop },
    { num: contaSit('Em uso'),      lbl: 'Em uso',                chip: 'chip-info',   icon: ICONS.check },
    { num: contaSit('Disponível'),  lbl: 'Disponíveis',           chip: 'chip-ok',     icon: ICONS.box },
    { num: eq.filter((e) => e.setorAtual === 'TI').length, lbl: 'Na TI', chip: 'chip-brand', icon: ICONS.archive },
    { num: contaSit('Baixado'),     lbl: 'Baixados',              chip: 'chip-muted',  icon: ICONS.archive },
    { num: contaSit('Manutenção'),  lbl: 'Em manutenção',         chip: 'chip-warn',   icon: ICONS.wrench },
  ];

  let html = '<div class="cards-grid">';
  cards.forEach((c) => {
    html += `<div class="stat-card">
      <div class="chip ${c.chip}">${c.icon}</div>
      <div><div class="num">${c.num}</div><div class="lbl">${c.lbl}</div></div>
    </div>`;
  });
  html += '</div>';

  // Últimas movimentações
  const ultimas = mv.slice(-8).reverse();
  html += `<div class="panel">
    <div class="panel__head">
      <h2>Últimas movimentações</h2>
      <div class="spacer"></div>
      <a class="btn btn-outline-soft btn-sm" href="#movimentacoes">${ICONS.history}<span> Ver todas</span></a>
    </div>
    <div class="panel__body">`;
  if (!ultimas.length) {
    html += `<div class="empty-state">${ICONS.history}<p>Nenhuma movimentação registrada ainda.</p></div>`;
  } else {
    html += '<div class="tbl-wrap"><table class="data"><thead><tr><th>Data</th><th>Hora</th><th>Patrimônio</th><th>Origem</th><th>Destino</th><th>Responsável</th><th>Operação</th></tr></thead><tbody>';
    ultimas.forEach((m) => {
      html += `<tr>
        <td class="cell-mono">${U.dataBR(m.data)}</td>
        <td class="cell-mono">${U.esc(m.hora)}</td>
        <td class="cell-strong cell-mono">${U.esc(m.patrimonio)}</td>
        <td>${U.esc(m.origem || '—')}</td>
        <td>${U.esc(m.destino)}</td>
        <td>${U.esc(m.responsavel)}</td>
        <td>${m.operacao ? `<span class="badge-op">${U.esc(m.operacao)}</span>` : '—'}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
  }
  html += '</div></div>';

  root.innerHTML = html;
};
