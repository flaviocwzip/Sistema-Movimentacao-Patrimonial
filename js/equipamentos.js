/* ============================================================
   equipamentos.js — Cadastro e situação dos equipamentos
   Regras: patrimônio único, nº de série único, setor e situação
   obrigatórios, nunca excluir (usar "Baixado").
   ============================================================ */
'use strict';

App.renderEquipamentos = function (root) {
  const U = App.U, ICONS = App.ICONS;

  root.innerHTML = `
    <div class="panel">
      <div class="panel__head">
        <h2>Equipamentos</h2>
        <div class="spacer"></div>
        <div class="toolbar">
          <div class="search-box">${ICONS.search}<input type="text" id="buscaEquip" placeholder="Pesquisar patrimônio, modelo, série, tipo, setor..."></div>
          <button class="btn btn-brand btn-sm" id="btnNovoEquip">${ICONS.add}<span> Novo equipamento</span></button>
        </div>
      </div>
      <div class="panel__body"><div id="tabelaEquip"></div></div>
    </div>`;

  const mount = root.querySelector('#tabelaEquip');
  const busca = root.querySelector('#buscaEquip');

  App.tabelaEquip = App.DataTable(mount, {
    searchInput: busca,
    defaultSort: 'patrimonio',
    emptyText: 'Nenhum equipamento cadastrado. Clique em "Novo equipamento".',
    rows: DB.equipamentos,
    columns: [
      { key: 'patrimonio', label: 'Patrimônio', className: 'cell-strong cell-mono',
        sortValue: (e) => String(e.patrimonio) },
      { key: 'tipo', label: 'Tipo', render: (e) => `<span class="badge-tipo">${U.esc(e.tipo)}</span>` },
      { key: 'modelo', label: 'Modelo' },
      { key: 'numeroSerie', label: 'Nº Série', className: 'cell-mono',
        render: (e) => U.esc(e.numeroSerie || '—') },
      { key: 'setorAtual', label: 'Setor atual' },
      { key: 'situacao', label: 'Situação', render: (e) => U.badgeSituacao(e.situacao) },
      { key: 'acoes', label: '', sortable: false, className: 'row-actions', headClass: 'no-sort',
        render: (e) => `
          <button class="icon-btn" title="Nova movimentação" data-mov="${U.esc(e.patrimonio)}">${ICONS.swap}</button>
          <button class="icon-btn" title="Editar" data-edit="${U.esc(e.patrimonio)}">${ICONS.edit}</button>
          <button class="icon-btn danger" title="Dar baixa" data-baixa="${U.esc(e.patrimonio)}">${ICONS.archive}</button>` },
    ],
    onRender(el) {
      el.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => abrirForm(b.dataset.edit));
      el.querySelectorAll('[data-baixa]').forEach((b) => b.onclick = () => darBaixa(b.dataset.baixa));
      el.querySelectorAll('[data-mov]').forEach((b) => b.onclick = () => App.abrirMovimentacao(b.dataset.mov));
    },
  });

  root.querySelector('#btnNovoEquip').onclick = () => abrirForm(null);

  /* -------- Formulário (modal) -------- */
  function abrirForm(patrimonio) {
    const edit = patrimonio != null;
    const e = edit ? App.equipamentoPorPatrimonio(patrimonio) : {};
    const opt = (arr, sel) => arr.map((v) => `<option value="${U.esc(v)}" ${v === sel ? 'selected' : ''}>${U.esc(v)}</option>`).join('');

    const body = `
      <div class="form-grid">
        <div class="field">
          <label>Patrimônio <span class="req">*</span></label>
          <input id="fPatrimonio" value="${U.esc(e.patrimonio || '')}" ${edit ? 'disabled' : ''} placeholder="Ex.: 1005000">
          <div class="err">Informe um patrimônio único.</div>
          ${edit ? '<div class="hint">O patrimônio não pode ser alterado.</div>' : ''}
        </div>
        <div class="field">
          <label>Tipo <span class="req">*</span></label>
          <select id="fTipo"><option value="">Selecione...</option>${opt(App.cfg.tipos(), e.tipo)}</select>
          <div class="err">Selecione o tipo.</div>
        </div>
        <div class="field full">
          <label>Modelo <span class="req">*</span></label>
          <input id="fModelo" value="${U.esc(e.modelo || '')}" placeholder="Ex.: Dell OptiPlex 3080">
          <div class="err">Informe o modelo.</div>
        </div>
        <div class="field">
          <label>Número de série</label>
          <input id="fSerie" value="${U.esc(e.numeroSerie || '')}" placeholder="Opcional, mas único">
          <div class="err">Este número de série já está cadastrado.</div>
        </div>
        <div class="field">
          <label>Setor atual <span class="req">*</span></label>
          <select id="fSetor"><option value="">Selecione...</option>${opt(App.cfg.setores(), e.setorAtual)}</select>
          <div class="err">Selecione o setor.</div>
        </div>
        <div class="field">
          <label>Situação <span class="req">*</span></label>
          <select id="fSituacao"><option value="">Selecione...</option>${opt(App.cfg.situacoes(), e.situacao)}</select>
          <div class="err">Selecione a situação.</div>
        </div>
        <div class="field full">
          <label>Observação</label>
          <textarea id="fObs" placeholder="Opcional">${U.esc(e.observacao || '')}</textarea>
        </div>
      </div>`;

    App.modal.open({
      title: (edit ? App.ICONS.edit + ' Editar equipamento' : App.ICONS.add + ' Novo equipamento'),
      body, confirmText: 'Salvar equipamento', size: 'modal-lg',
      onConfirm: () => salvar(edit, e),
    });
  }

  function marcarErro(id, mostrar) {
    const el = document.getElementById(id).closest('.field');
    el.classList.toggle('invalid', mostrar);
  }

  async function salvar(edit, original) {
    const patrimonio = edit ? original.patrimonio : document.getElementById('fPatrimonio').value.trim();
    const tipo = document.getElementById('fTipo').value;
    const modelo = document.getElementById('fModelo').value.trim();
    const serie = document.getElementById('fSerie').value.trim();
    const setor = document.getElementById('fSetor').value;
    const situacao = document.getElementById('fSituacao').value;
    const obs = document.getElementById('fObs').value.trim();

    let ok = true;
    // Patrimônio obrigatório e único (Regra 01)
    if (!edit) {
      const vazio = !patrimonio;
      const dup = patrimonio && App.equipamentoPorPatrimonio(patrimonio);
      marcarErro('fPatrimonio', vazio || !!dup);
      if (dup) document.querySelector('#fPatrimonio').closest('.field').querySelector('.err').textContent = 'Já existe um equipamento com este patrimônio.';
      if (vazio || dup) ok = false;
    }
    // Número de série único (Regra 02)
    if (serie) {
      const dupSerie = DB.equipamentos.some((x) =>
        String(x.numeroSerie || '').toLowerCase() === serie.toLowerCase() &&
        String(x.patrimonio) !== String(patrimonio));
      marcarErro('fSerie', dupSerie);
      if (dupSerie) ok = false;
    } else { marcarErro('fSerie', false); }
    // Tipo, modelo, setor (Regra 03), situação (Regra 04)
    marcarErro('fTipo', !tipo);
    marcarErro('fModelo', !modelo);
    marcarErro('fSetor', !setor);
    marcarErro('fSituacao', !situacao);
    if (!tipo || !modelo || !setor || !situacao) ok = false;

    if (!ok) return true; // mantém modal aberto

    if (edit) {
      Object.assign(original, { tipo, modelo, numeroSerie: serie, setorAtual: setor, situacao, observacao: obs });
    } else {
      DB.equipamentos.push({
        id: U.nextId('equipamento'),
        patrimonio, tipo, modelo, numeroSerie: serie,
        setorAtual: setor, situacao, observacao: obs,
      });
    }
    const salvou = await App.persistir(edit ? 'Equipamento atualizado.' : 'Equipamento cadastrado.');
    if (salvou) {
      App.modal.close();
      App.tabelaEquip.setRows(DB.equipamentos);
      return false;
    }
    return true;
  }

  /* -------- Baixa (nunca exclui — Regra 11) -------- */
  async function darBaixa(patrimonio) {
    const e = App.equipamentoPorPatrimonio(patrimonio);
    if (!e) return;
    if (e.situacao === 'Baixado') { U.toast('Este equipamento já está baixado.', 'info'); return; }
    const ok = await U.confirmar({
      titulo: 'Dar baixa no equipamento?',
      texto: `O patrimônio ${patrimonio} terá a situação alterada para "Baixado". Ele não é excluído e permanece no histórico.`,
      confirmar: 'Dar baixa', perigo: true, icon: 'warning',
    });
    if (!ok) return;
    e.situacao = 'Baixado';
    if (await App.persistir('Equipamento baixado.')) App.tabelaEquip.setRows(DB.equipamentos);
  }
};
