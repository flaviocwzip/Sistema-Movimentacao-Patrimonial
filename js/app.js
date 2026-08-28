/* ============================================================
   app.js — Núcleo do Sistema de Movimentação Patrimonial
   - Camada de API (carregar / salvar / backup)
   - Roteador SPA (sem recarregar a página)
   - Utilidades (toasts, confirmações, formatação, ids)
   - Componente de tabela (busca + ordenação + paginação)
   - Relatórios, Configurações, Backup e Importação
   ============================================================ */

'use strict';

/* ---------- Estado global em memória ---------- */
window.DB = null;                 // banco carregado do JSON
const App = {};                   // namespace compartilhado entre os módulos
window.App = App;

/* ---------- Ícones (SVG inline, sem dependência externa) ---------- */
const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  inventory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7 12 3 4 7v10l8 4 8-4V7z"/><path d="M4 7l8 4 8-4"/><path d="M12 11v10"/></svg>',
  swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4 3 8l4 4"/><path d="M3 8h13"/><path d="M17 20l4-4-4-4"/><path d="M21 16H8"/></svg>',
  report: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  computer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8"/><path d="M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2"/></svg>',
  laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="10" rx="1"/><path d="M2 20h20"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v8a2 2 0 0 1-1 1.7l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.2-2.2z"/></svg>',
  archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>',
  move: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6"/></svg>',
};
App.ICONS = ICONS;

/* ---------- Camada de API ---------- */
const API = {
  base: 'api/',
  async carregar() {
    const r = await fetch(this.base + 'carregar.php', { cache: 'no-store' });
    if (!r.ok) throw new Error('Falha ao carregar dados (HTTP ' + r.status + ').');
    return r.json();
  },
  async salvar(db) {
    const r = await fetch(this.base + 'salvar.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db),
    });
    const data = await r.json().catch(() => ({ ok: false, erro: 'Resposta inválida do servidor.' }));
    if (!r.ok || !data.ok) throw new Error(data.erro || 'Falha ao salvar.');
    return data;
  },
  async backup() {
    const r = await fetch(this.base + 'backup.php', { method: 'POST' });
    const data = await r.json().catch(() => ({ ok: false, erro: 'Resposta inválida do servidor.' }));
    if (!r.ok || !data.ok) throw new Error(data.erro || 'Falha ao gerar backup.');
    return data;
  },
};
App.API = API;

/* ---------- Utilidades ---------- */
const U = {
  esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },
  nowParts() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return {
      data: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
      hora: `${p(d.getHours())}:${p(d.getMinutes())}`,
    };
  },
  dataBR(iso) {
    if (!iso) return '';
    const [a, m, d] = iso.split('-');
    return (d && m && a) ? `${d}/${m}/${a}` : iso;
  },
  nextId(chave) {
    if (!DB.seq) DB.seq = {};
    DB.seq[chave] = (DB.seq[chave] || 0) + 1;
    return DB.seq[chave];
  },
  toast(msg, tipo = 'success') {
    Swal.fire({
      toast: true, position: 'top-end', timer: 2600, showConfirmButton: false,
      icon: tipo, title: msg, timerProgressBar: true,
    });
  },
  async confirmar({ titulo, texto, confirmar = 'Confirmar', perigo = false, icon = 'question' }) {
    const r = await Swal.fire({
      title: titulo, text: texto, icon,
      showCancelButton: true, confirmButtonText: confirmar, cancelButtonText: 'Cancelar',
      confirmButtonColor: perigo ? '#D64545' : '#14708E', cancelButtonColor: '#8795a1',
      reverseButtons: true,
    });
    return r.isConfirmed;
  },
  async loading(fn, msg = 'Salvando...') {
    Swal.fire({ title: msg, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try { const res = await fn(); Swal.close(); return res; }
    catch (e) { Swal.close(); throw e; }
  },
  badgeSituacao(sit) {
    const map = {
      'Em uso': 'sit-em-uso', 'Disponível': 'sit-disponivel', 'Manutenção': 'sit-manutencao',
      'Baixado': 'sit-baixado', 'Sucata': 'sit-sucata',
    };
    return `<span class="badge-sit ${map[sit] || 'sit-baixado'}">${U.esc(sit)}</span>`;
  },
};
App.U = U;

/* ---------- Acesso à configuração ---------- */
App.cfg = {
  tipos: () => (DB.config && DB.config.tipos) || [],
  situacoes: () => (DB.config && DB.config.situacoes) || [],
  setores: () => (DB.config && DB.config.setores) || [],
};

App.equipamentoPorPatrimonio = (pat) =>
  DB.equipamentos.find((e) => String(e.patrimonio) === String(pat));

/* ---------- Persistência com feedback ---------- */
App.persistir = async function (msgOk) {
  try {
    await U.loading(() => API.salvar(DB));
    if (msgOk) U.toast(msgOk);
    return true;
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Não foi possível salvar', text: e.message });
    return false;
  }
};

/* ============================================================
   Componente de tabela reutilizável
   colunas: [{ key, label, sortable, className, render(row), sortValue(row), searchValue(row) }]
   ============================================================ */
App.DataTable = function (mountEl, config) {
  const cols = config.columns;
  const pageSize = config.pageSize || 10;
  const emptyText = config.emptyText || 'Nenhum registro encontrado.';
  let rows = config.rows || [];
  let term = '';
  let sortKey = config.defaultSort || null;
  let sortDir = config.defaultSortDir || 1;
  let page = 1;

  const searchOf = (row) =>
    cols.map((c) => (c.searchValue ? c.searchValue(row) : (row[c.key] ?? ''))).join(' \u0001 ').toLowerCase();

  function filtered() {
    let out = rows;
    if (term.trim()) {
      const t = term.trim().toLowerCase();
      out = out.filter((r) => searchOf(r).includes(t));
    }
    if (sortKey) {
      const col = cols.find((c) => c.key === sortKey);
      out = [...out].sort((a, b) => {
        let va = col && col.sortValue ? col.sortValue(a) : a[sortKey];
        let vb = col && col.sortValue ? col.sortValue(b) : b[sortKey];
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return -1 * sortDir;
        if (va > vb) return 1 * sortDir;
        return 0;
      });
    }
    return out;
  }

  function render() {
    const data = filtered();
    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
    if (page > totalPages) page = totalPages;
    const slice = data.slice((page - 1) * pageSize, page * pageSize);

    let html = '<div class="tbl-wrap"><table class="data"><thead><tr>';
    cols.forEach((c) => {
      const sortable = c.sortable !== false;
      const cls = [sortable ? '' : 'no-sort', c.headClass || ''];
      let arrow = '';
      if (sortable) {
        if (sortKey === c.key) { cls.push(sortDir === 1 ? 'sorted-asc' : 'sorted-desc'); arrow = sortDir === 1 ? '▲' : '▼'; }
        else arrow = '▲';
      }
      html += `<th class="${cls.join(' ').trim()}" data-key="${c.key}" data-sortable="${sortable}">${U.esc(c.label)}${sortable ? `<span class="arrow">${arrow}</span>` : ''}</th>`;
    });
    html += '</tr></thead><tbody>';

    if (slice.length === 0) {
      html += `<tr><td colspan="${cols.length}"><div class="empty-state">${ICONS.search}<p>${U.esc(emptyText)}</p></div></td></tr>`;
    } else {
      slice.forEach((row) => {
        html += '<tr>';
        cols.forEach((c) => {
          const val = c.render ? c.render(row) : U.esc(row[c.key] ?? '');
          html += `<td class="${c.className || ''}">${val}</td>`;
        });
        html += '</tr>';
      });
    }
    html += '</tbody></table></div>';

    // Rodapé com contagem e paginação
    html += '<div class="table-foot">';
    html += `<span>${data.length} registro(s)${term.trim() ? ' (filtrado)' : ''}</span>`;
    if (totalPages > 1) {
      html += '<div class="pager">';
      html += `<button data-pg="prev" ${page === 1 ? 'disabled' : ''}>‹</button>`;
      const around = (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1;
      let last = 0;
      for (let n = 1; n <= totalPages; n++) {
        if (!around(n)) continue;
        if (last && n - last > 1) html += '<button disabled>…</button>';
        html += `<button data-pg="${n}" class="${n === page ? 'active' : ''}">${n}</button>`;
        last = n;
      }
      html += `<button data-pg="next" ${page === totalPages ? 'disabled' : ''}>›</button>`;
      html += '</div>';
    }
    html += '</div>';

    mountEl.innerHTML = html;

    // Ordenação por clique no cabeçalho
    mountEl.querySelectorAll('thead th[data-sortable="true"]').forEach((th) => {
      th.addEventListener('click', () => {
        const k = th.dataset.key;
        if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = 1; }
        render();
      });
    });
    // Paginação
    mountEl.querySelectorAll('.pager button[data-pg]').forEach((b) => {
      b.addEventListener('click', () => {
        const v = b.dataset.pg;
        if (v === 'prev') page = Math.max(1, page - 1);
        else if (v === 'next') page = Math.min(totalPages, page + 1);
        else page = parseInt(v, 10);
        render();
      });
    });
    if (config.onRender) config.onRender(mountEl);
  }

  if (config.searchInput) {
    config.searchInput.addEventListener('input', (e) => { term = e.target.value; page = 1; render(); });
  }

  render();
  return {
    setRows(r) { rows = r; page = 1; render(); },
    render,
  };
};

/* ============================================================
   Modal (Bootstrap) reutilizável para formulários
   ============================================================ */
App.modal = (function () {
  let bs = null, currentConfirm = null;
  function el() { return document.getElementById('appModal'); }
  function open({ title, body, confirmText = 'Salvar', size = '', onConfirm }) {
    const m = el();
    m.querySelector('.modal-title').innerHTML = title;
    m.querySelector('.modal-body').innerHTML = body;
    const btn = m.querySelector('#modalConfirm');
    btn.textContent = confirmText;
    btn.style.display = onConfirm ? '' : 'none';
    m.querySelector('.modal-dialog').className = 'modal-dialog modal-dialog-centered ' + size;
    currentConfirm = onConfirm;
    if (!bs) bs = new bootstrap.Modal(m, { backdrop: 'static' });
    bs.show();
    return m.querySelector('.modal-body');
  }
  function close() { if (bs) bs.hide(); }
  document.addEventListener('DOMContentLoaded', () => {
    el().querySelector('#modalConfirm').addEventListener('click', async () => {
      if (currentConfirm) { const keepOpen = await currentConfirm(); if (keepOpen !== false) return; }
      close();
    });
  });
  return { open, close, bodyEl: () => el().querySelector('.modal-body') };
})();

/* ============================================================
   Backup e Importação
   ============================================================ */
App.gerarBackup = async function () {
  const ok = await U.confirmar({
    titulo: 'Gerar backup?', texto: 'Uma cópia do banco atual será salva na pasta backup/.',
    confirmar: 'Gerar backup', icon: 'question',
  });
  if (!ok) return;
  try {
    const res = await U.loading(() => API.backup(), 'Gerando backup...');
    Swal.fire({ icon: 'success', title: 'Backup criado', text: res.arquivo });
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Falha no backup', text: e.message });
  }
};

App.importarJSON = function () {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    let novo;
    try {
      novo = JSON.parse(await file.text());
    } catch {
      Swal.fire({ icon: 'error', title: 'Arquivo inválido', text: 'O arquivo não é um JSON válido.' });
      return;
    }
    if (!Array.isArray(novo.equipamentos) || !Array.isArray(novo.movimentacoes)) {
      Swal.fire({ icon: 'error', title: 'Estrutura inválida', text: 'O JSON precisa conter "equipamentos" e "movimentacoes".' });
      return;
    }
    const ok = await U.confirmar({
      titulo: 'Substituir todos os dados?',
      texto: 'A importação substitui COMPLETAMENTE os dados atuais. Um backup automático será criado antes.',
      confirmar: 'Importar e substituir', perigo: true, icon: 'warning',
    });
    if (!ok) return;
    try {
      await U.loading(() => API.backup(), 'Criando backup de segurança...');
    } catch (e) {
      const seguir = await U.confirmar({
        titulo: 'Backup falhou', texto: 'Não foi possível criar o backup automático (' + e.message + '). Importar mesmo assim?',
        confirmar: 'Importar mesmo assim', perigo: true, icon: 'warning',
      });
      if (!seguir) return;
    }
    // Normaliza estrutura mínima
    if (!novo.config) novo.config = DB.config;
    if (!novo.seq) novo.seq = { equipamento: 0, movimentacao: 0, operacao: 0 };
    DB = novo; window.DB = DB;
    const salvou = await App.persistir('Dados importados com sucesso.');
    if (salvou) App.router.go(location.hash || '#dashboard', true);
  };
  input.click();
};

/* ============================================================
   Exportação de relatório em documento formal (PDF via navegador)
   ============================================================ */
App.orgInfo = {
  nome: 'Fundação de Saúde Parreiras Horta',
  setor: 'Assessoria de Tecnologia da Informação',
  endereco: 'Aracaju — Sergipe',   // ajuste aqui com o endereço completo, se desejar
};

App.exportarRelatorio = function (titulo, filtro, corpoHtml, totalReg, assinaturaSetor) {
  const { data, hora } = U.nowParts();
  const emissao = `${U.dataBR(data)} às ${hora}`;
  const org = App.orgInfo;
  const meta = [
    `<div><span>Emitido em</span><b>${emissao}</b></div>`,
    filtro ? `<div><span>Filtros aplicados</span><b>${U.esc(filtro)}</b></div>` : '',
    (totalReg != null ? `<div><span>Total de registros</span><b>${totalReg}</b></div>` : ''),
  ].join('');
  const assinatura = assinaturaSetor ? `
      <div class="doc-sign-date">${U.esc(org.endereco || 'Local')}, ______ de ____________________ de 20____.</div>
      <div class="doc-sign">
        <div class="sign-field">
          <div class="sign-line"></div>
          <div class="sign-label">Responsável pelo setor</div>
          <div class="sign-sub">Setor: ${U.esc(assinaturaSetor)}</div>
        </div>
        <div class="sign-field">
          <div class="sign-line"></div>
          <div class="sign-label">Responsável técnico</div>
          <div class="sign-sub">${U.esc(org.setor)}</div>
        </div>
      </div>` : '';
  const area = document.getElementById('printArea');
  area.innerHTML = `
    <div class="doc">
      <div class="doc-head">
        <img class="doc-logo" src="logo.png" alt="" onerror="this.remove()">
        <div class="doc-org">
          <div class="doc-org-name">${U.esc(org.nome)}</div>
          <div class="doc-org-sub">${U.esc(org.setor)}</div>
          ${org.endereco ? `<div class="doc-org-addr">${U.esc(org.endereco)}</div>` : ''}
        </div>
      </div>
      <div class="doc-title-band">${assinaturaSetor ? 'Termo' : 'Relatório'} — ${U.esc(titulo)}</div>
      <div class="doc-meta-box">${meta}</div>
      <div class="doc-body">${corpoHtml}</div>
      ${assinatura}
      <div class="doc-foot">${U.esc(org.nome)} &nbsp;·&nbsp; Sistema de Movimentação Patrimonial &nbsp;·&nbsp; Emitido em ${emissao}</div>
    </div>`;
  window.print();
};

/* ============================================================
   Relatórios
   ============================================================ */
App.renderRelatorios = function (root) {
  const tipos = [
    { id: 'setor', nome: 'Equipamentos por setor' },
    { id: 'disponiveis', nome: 'Equipamentos disponíveis' },
    { id: 'ti', nome: 'Equipamentos na TI' },
    { id: 'baixados', nome: 'Equipamentos baixados' },
    { id: 'historico', nome: 'Histórico de movimentações' },
    { id: 'periodo', nome: 'Movimentações por período' },
    { id: 'patrimonio', nome: 'Movimentações por patrimônio' },
  ];
  root.innerHTML = `
    <div class="panel">
      <div class="panel__head"><h2>Relatórios</h2></div>
      <div class="panel__body pad">
        <div class="grid-2">
          <div class="field">
            <label>Tipo de relatório</label>
            <select id="relTipo">${tipos.map((t) => `<option value="${t.id}">${t.nome}</option>`).join('')}</select>
          </div>
          <div class="field" id="relFiltroWrap"></div>
        </div>
        <div id="relSaida" style="margin-top:14px"></div>
      </div>
    </div>`;

  const selTipo = root.querySelector('#relTipo');
  const filtroWrap = root.querySelector('#relFiltroWrap');
  const saida = root.querySelector('#relSaida');

  function montarFiltro() {
    const t = selTipo.value;
    if (t === 'setor') {
      filtroWrap.innerHTML = `<label>Setor</label>
        <select id="relSetor"><option value="">Todos os setores (consolidado)</option>${App.cfg.setores().map((s) => `<option value="${U.esc(s)}">${U.esc(s)}</option>`).join('')}</select>
        <div class="hint">Escolha um setor específico para gerar o termo com campos de assinatura.</div>`;
    } else if (t === 'periodo') {
      const { data } = U.nowParts();
      filtroWrap.innerHTML = `
        <label>Período (data inicial / final)</label>
        <div style="display:flex; gap:8px">
          <input type="date" id="relDe" value="${data}"><input type="date" id="relAte" value="${data}">
        </div>`;
    } else if (t === 'patrimonio') {
      filtroWrap.innerHTML = `<label>Patrimônio</label>
        <input list="relPatList" id="relPat" placeholder="Digite o patrimônio">
        <datalist id="relPatList">${DB.equipamentos.map((e) => `<option value="${U.esc(e.patrimonio)}">`).join('')}</datalist>`;
    } else {
      filtroWrap.innerHTML = '<label>&nbsp;</label><div class="muted" style="padding-top:8px">Sem filtros adicionais.</div>';
    }
  }

  function tabelaEquip(lista) {
    if (!lista.length) return '<div class="empty-state">' + ICONS.box + '<p>Nenhum equipamento neste relatório.</p></div>';
    let h = '<div class="tbl-wrap"><table class="data"><thead><tr><th>Patrimônio</th><th>Tipo</th><th>Modelo</th><th>Nº Série</th><th>Setor</th><th>Situação</th></tr></thead><tbody>';
    lista.forEach((e) => {
      h += `<tr><td class="cell-strong cell-mono">${U.esc(e.patrimonio)}</td><td><span class="badge-tipo">${U.esc(e.tipo)}</span></td><td>${U.esc(e.modelo)}</td><td class="cell-mono">${U.esc(e.numeroSerie || '—')}</td><td>${U.esc(e.setorAtual)}</td><td>${U.badgeSituacao(e.situacao)}</td></tr>`;
    });
    return h + '</tbody></table></div>';
  }
  function tabelaMov(lista) {
    if (!lista.length) return '<div class="empty-state">' + ICONS.history + '<p>Nenhuma movimentação neste relatório.</p></div>';
    let h = '<div class="tbl-wrap"><table class="data"><thead><tr><th>Data</th><th>Hora</th><th>Patrimônio</th><th>Origem</th><th>Destino</th><th>Responsável</th><th>Operação</th></tr></thead><tbody>';
    lista.slice().reverse().forEach((m) => {
      h += `<tr><td class="cell-mono">${U.dataBR(m.data)}</td><td class="cell-mono">${U.esc(m.hora)}</td><td class="cell-strong cell-mono">${U.esc(m.patrimonio)}</td><td>${U.esc(m.origem || '—')}</td><td>${U.esc(m.destino)}</td><td>${U.esc(m.responsavel)}</td><td>${m.operacao ? `<span class="badge-op">${U.esc(m.operacao)}</span>` : '—'}</td></tr>`;
    });
    return h + '</tbody></table></div>';
  }

  function gerar() {
    const t = selTipo.value;
    const tituloRel = selTipo.options[selTipo.selectedIndex].text;
    const eq = DB.equipamentos, mv = DB.movimentacoes;
    let out = '';
    let filtroDesc = '';
    let totalReg = 0;
    let assinaturaSetor = null;
    if (t === 'setor') {
      const setorSel = (root.querySelector('#relSetor') || {}).value || '';
      if (setorSel) {
        const lista = eq.filter((e) => e.setorAtual === setorSel);
        totalReg = lista.length;
        out = tabelaEquip(lista);
        filtroDesc = `Setor: ${setorSel}`;
        assinaturaSetor = setorSel;
      } else {
        const grupos = {};
        eq.forEach((e) => { (grupos[e.setorAtual] = grupos[e.setorAtual] || []).push(e); });
        const setores = Object.keys(grupos).sort();
        totalReg = eq.length;
        out = setores.length ? setores.map((s) =>
          `<h3 class="section-title" style="margin-top:16px">${U.esc(s)} — ${grupos[s].length} item(ns)</h3>${tabelaEquip(grupos[s])}`).join('')
          : '<div class="empty-state">' + ICONS.box + '<p>Nenhum equipamento cadastrado.</p></div>';
      }
    } else if (t === 'disponiveis') {
      const l = eq.filter((e) => e.situacao === 'Disponível'); totalReg = l.length;
      out = tabelaEquip(l);
    } else if (t === 'ti') {
      const l = eq.filter((e) => e.setorAtual === 'TI'); totalReg = l.length;
      out = tabelaEquip(l);
    } else if (t === 'baixados') {
      const l = eq.filter((e) => e.situacao === 'Baixado'); totalReg = l.length;
      out = tabelaEquip(l);
    } else if (t === 'historico') {
      totalReg = mv.length;
      out = tabelaMov(mv);
    } else if (t === 'periodo') {
      const de = root.querySelector('#relDe').value, ate = root.querySelector('#relAte').value;
      const l = mv.filter((m) => (!de || m.data >= de) && (!ate || m.data <= ate)); totalReg = l.length;
      out = tabelaMov(l);
      filtroDesc = `Período: ${U.dataBR(de) || '—'} a ${U.dataBR(ate) || '—'}`;
    } else if (t === 'patrimonio') {
      const pat = (root.querySelector('#relPat').value || '').trim();
      const l = pat ? mv.filter((m) => String(m.patrimonio) === pat) : [];
      totalReg = l.length;
      out = pat ? tabelaMov(l) : '<div class="muted">Informe um patrimônio.</div>';
      if (pat) filtroDesc = `Patrimônio: ${pat}`;
    }
    saida.innerHTML = `<div style="display:flex;justify-content:flex-end;margin-bottom:8px">
        <button class="btn btn-brand btn-sm" id="relPrint">${ICONS.print}<span> Exportar PDF / Imprimir</span></button></div>${out}`;
    const pb = root.querySelector('#relPrint');
    if (pb) pb.onclick = () => App.exportarRelatorio(tituloRel, filtroDesc, out, totalReg, assinaturaSetor);
  }

  selTipo.addEventListener('change', () => { montarFiltro(); gerar(); });
  filtroWrap.addEventListener('input', gerar);
  montarFiltro();
  gerar();
};

/* ============================================================
   Configurações (setores, tipos, situações — guardados no JSON)
   ============================================================ */
App.renderConfig = function (root) {
  function bloco(titulo, chave, descricao) {
    const itens = DB.config[chave] || [];
    return `
      <div class="panel">
        <div class="panel__head"><h2>${titulo}</h2></div>
        <div class="panel__body pad">
          <p class="muted mb0" style="margin-bottom:12px">${descricao}</p>
          <div class="chips" id="chips-${chave}">
            ${itens.map((v, i) => `<span class="chip-tag">${U.esc(v)}<button data-chave="${chave}" data-idx="${i}" title="Remover">${ICONS.trash}</button></span>`).join('') || '<span class="muted">Nenhum item.</span>'}
          </div>
          <div style="display:flex; gap:8px; margin-top:14px; max-width:420px">
            <input type="text" class="cfg-add-input" data-chave="${chave}" placeholder="Adicionar novo..." style="flex:1; padding:8px 11px; border:1px solid var(--border-strong); border-radius:7px">
            <button class="btn btn-brand btn-sm cfg-add-btn" data-chave="${chave}">${ICONS.add}<span> Adicionar</span></button>
          </div>
        </div>
      </div>`;
  }
  root.innerHTML =
    bloco('Setores', 'setores', 'Locais para onde os equipamentos podem ser movimentados.') +
    bloco('Tipos de equipamento', 'tipos', 'Categorias disponíveis no cadastro (ex.: adicione Switch, Access Point, Nobreak no futuro).') +
    bloco('Situações', 'situacoes', 'Estados possíveis de um equipamento.');

  root.querySelectorAll('.cfg-add-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const chave = btn.dataset.chave;
      const inp = root.querySelector(`.cfg-add-input[data-chave="${chave}"]`);
      const val = (inp.value || '').trim();
      if (!val) return;
      if (DB.config[chave].some((v) => v.toLowerCase() === val.toLowerCase())) {
        U.toast('Esse item já existe.', 'warning'); return;
      }
      DB.config[chave].push(val);
      if (await App.persistir('Item adicionado.')) App.renderConfig(root);
    });
  });
  root.querySelectorAll('.chip-tag button').forEach((b) => {
    b.addEventListener('click', async () => {
      const chave = b.dataset.chave, idx = parseInt(b.dataset.idx, 10);
      const val = DB.config[chave][idx];
      const ok = await U.confirmar({ titulo: 'Remover item?', texto: `"${val}" será removido da lista.`, confirmar: 'Remover', perigo: true });
      if (!ok) return;
      DB.config[chave].splice(idx, 1);
      if (await App.persistir('Item removido.')) App.renderConfig(root);
    });
  });
};

/* ============================================================
   Roteador SPA
   ============================================================ */
App.router = (function () {
  const rotas = {
    dashboard:     { titulo: 'Painel', sub: 'Visão geral do parque', render: (r) => App.renderDashboard(r) },
    equipamentos:  { titulo: 'Equipamentos', sub: 'Cadastro e situação', render: (r) => App.renderEquipamentos(r) },
    movimentacoes: { titulo: 'Movimentações', sub: 'Histórico e novas movimentações', render: (r) => App.renderMovimentacoes(r) },
    relatorios:    { titulo: 'Relatórios', sub: 'Consultas e impressão', render: (r) => App.renderRelatorios(r) },
    configuracoes: { titulo: 'Configurações', sub: 'Setores, tipos e situações', render: (r) => App.renderConfig(r) },
  };
  function go(hash, forcar) {
    const nome = (hash || '#dashboard').replace('#', '').split('?')[0] || 'dashboard';
    const rota = rotas[nome] || rotas.dashboard;
    // Atualiza barra superior
    document.querySelector('.topbar__title').innerHTML = `${rota.titulo}<small>${rota.sub}</small>`;
    // Atualiza item ativo do menu
    document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.rota === nome));
    // Renderiza conteúdo
    const root = document.getElementById('view');
    root.innerHTML = '';
    rota.render(root);
    // Fecha o menu no mobile
    fecharSidebarMobile();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', () => go(location.hash));
  return { go, ir: (nome) => { location.hash = '#' + nome; } };
})();

function fecharSidebarMobile() {
  document.querySelector('.sidebar').classList.remove('open');
  document.querySelector('.side-overlay').classList.remove('show');
}

/* ============================================================
   Montagem inicial (layout + carregamento dos dados)
   ============================================================ */
async function boot() {
  // Monta a sidebar
  const nav = document.getElementById('sidebarNav');
  const grupos = [
    { label: 'Principal', itens: [
      { rota: 'dashboard', icon: ICONS.dashboard, nome: 'Painel' },
      { rota: 'equipamentos', icon: ICONS.inventory, nome: 'Equipamentos' },
      { rota: 'movimentacoes', icon: ICONS.swap, nome: 'Movimentações' },
    ]},
    { label: 'Gestão', itens: [
      { rota: 'relatorios', icon: ICONS.report, nome: 'Relatórios' },
      { rota: 'configuracoes', icon: ICONS.settings, nome: 'Configurações' },
    ]},
  ];
  nav.innerHTML = grupos.map((g) =>
    `<div class="nav-group-label">${g.label}</div>` +
    g.itens.map((i) => `<a class="nav-item" data-rota="${i.rota}" href="#${i.rota}">${i.icon}<span>${i.nome}</span></a>`).join('')
  ).join('');

  // Botões da barra superior
  document.getElementById('btnBackup').addEventListener('click', App.gerarBackup);
  document.getElementById('btnImportar').addEventListener('click', App.importarJSON);

  // Menu mobile
  document.getElementById('burger').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
    document.querySelector('.side-overlay').classList.toggle('show');
  });
  document.querySelector('.side-overlay').addEventListener('click', fecharSidebarMobile);

  // Carrega os dados
  try {
    DB = await API.carregar();
    window.DB = DB;
  } catch (e) {
    document.getElementById('view').innerHTML =
      `<div class="panel"><div class="panel__body pad text-center">
        <h2 style="color:var(--danger)">Não foi possível carregar os dados</h2>
        <p class="muted">${U.esc(e.message)}</p>
        <p class="muted">Verifique se o sistema está sendo servido por um servidor com PHP e se a pasta <b>data/</b> tem permissão de escrita.</p>
      </div></div>`;
    return;
  }

  // Garante estruturas mínimas
  DB.config = DB.config || { tipos: [], situacoes: [], setores: [] };
  DB.equipamentos = DB.equipamentos || [];
  DB.movimentacoes = DB.movimentacoes || [];
  DB.seq = DB.seq || { equipamento: 0, movimentacao: 0, operacao: 0 };

  App.router.go(location.hash || '#dashboard');
}

document.addEventListener('DOMContentLoaded', boot);
