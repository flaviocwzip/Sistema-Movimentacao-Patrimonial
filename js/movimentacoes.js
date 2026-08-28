/* ============================================================
   movimentacoes.js — Histórico e registro de movimentações
   Regras: registrar sempre, nunca apagar histórico, atualizar
   setor e situação automaticamente (TI→Disponível, senão Em uso),
   data/hora automáticas, responsável obrigatório.
   Melhoria: TROCA como operação única (OP) ligando novo e antigo.
   ============================================================ */
'use strict';

App.renderMovimentacoes = function (root) {
  const U = App.U, ICONS = App.ICONS;

  root.innerHTML = `
    <div class="panel">
      <div class="panel__head">
        <h2>Histórico de movimentações</h2>
        <div class="spacer"></div>
        <div class="toolbar">
          <div class="search-box">${ICONS.search}<input type="text" id="buscaMov" placeholder="Pesquisar patrimônio, setor, responsável, operação..."></div>
          <button class="btn btn-outline-soft btn-sm" id="btnNovaMov">${ICONS.swap}<span> Nova movimentação</span></button>
          <button class="btn btn-brand btn-sm" id="btnNovaTroca">${ICONS.move}<span> Nova troca</span></button>
        </div>
      </div>
      <div class="panel__body"><div id="tabelaMov"></div></div>
    </div>`;

  const mount = root.querySelector('#tabelaMov');
  const busca = root.querySelector('#buscaMov');

  // As movimentações mais recentes aparecem primeiro (id desc por padrão)
  App.tabelaMov = App.DataTable(mount, {
    searchInput: busca,
    defaultSort: 'id', defaultSortDir: -1,
    emptyText: 'Nenhuma movimentação registrada.',
    rows: DB.movimentacoes,
    columns: [
      { key: 'data', label: 'Data', className: 'cell-mono',
        render: (m) => U.dataBR(m.data), sortValue: (m) => m.data + ' ' + (m.hora || '') },
      { key: 'hora', label: 'Hora', className: 'cell-mono' },
      { key: 'patrimonio', label: 'Patrimônio', className: 'cell-strong cell-mono',
        sortValue: (m) => String(m.patrimonio) },
      { key: 'origem', label: 'Origem', render: (m) => U.esc(m.origem || '—') },
      { key: 'destino', label: 'Destino' },
      { key: 'responsavel', label: 'Responsável' },
      { key: 'motivo', label: 'Motivo', render: (m) => U.esc(m.motivo || '—') },
      { key: 'operacao', label: 'Operação',
        render: (m) => m.operacao ? `<span class="badge-op">${U.esc(m.operacao)}</span>` : '—' },
    ],
  });

  root.querySelector('#btnNovaMov').onclick = () => App.abrirMovimentacao(null);
  root.querySelector('#btnNovaTroca').onclick = () => abrirTroca();
};

/* -------- Helpers compartilhados -------- */
function aplicarSituacaoPorDestino(destino) {
  // Regra 07 / 08
  return destino === 'TI' ? 'Disponível' : 'Em uso';
}

function optionsEquipamentos(selecionado) {
  return DB.equipamentos.map((e) =>
    `<option value="${App.U.esc(e.patrimonio)}" ${String(e.patrimonio) === String(selecionado) ? 'selected' : ''}>${App.U.esc(e.patrimonio)} — ${App.U.esc(e.modelo)} (${App.U.esc(e.setorAtual)})</option>`
  ).join('');
}
function optionsSetores(selecionado) {
  return App.cfg.setores().map((s) =>
    `<option value="${App.U.esc(s)}" ${s === selecionado ? 'selected' : ''}>${App.U.esc(s)}</option>`
  ).join('');
}

function proximoIdOperacao() {
  const hoje = App.U.nowParts().data.replace(/-/g, ''); // AAAAMMDD
  const prefixo = 'OP-' + hoje + '-';
  const doDia = new Set(
    DB.movimentacoes.filter((m) => m.operacao && m.operacao.startsWith(prefixo)).map((m) => m.operacao)
  );
  const seq = String(doDia.size + 1).padStart(3, '0');
  return prefixo + seq;
}

/* ============================================================
   Movimentação simples
   ============================================================ */
App.abrirMovimentacao = function (patrimonioFixo) {
  const U = App.U;
  if (!DB.equipamentos.length) {
    Swal.fire({ icon: 'info', title: 'Sem equipamentos', text: 'Cadastre um equipamento antes de movimentar.' });
    return;
  }
  const fixo = patrimonioFixo != null;
  const eqInicial = fixo ? App.equipamentoPorPatrimonio(patrimonioFixo) : DB.equipamentos[0];
  const { data, hora } = U.nowParts();

  const body = `
    <div class="form-grid">
      <div class="field full">
        <label>Equipamento <span class="req">*</span></label>
        <select id="mEquip" ${fixo ? 'disabled' : ''}>${optionsEquipamentos(eqInicial.patrimonio)}</select>
      </div>
      <div class="field">
        <label>Origem (setor atual)</label>
        <input id="mOrigem" value="${U.esc(eqInicial.setorAtual)}" disabled>
      </div>
      <div class="field">
        <label>Destino <span class="req">*</span></label>
        <select id="mDestino"><option value="">Selecione...</option>${optionsSetores()}</select>
        <div class="err">Selecione o destino.</div>
      </div>
      <div class="field">
        <label>Responsável <span class="req">*</span></label>
        <input id="mResp" placeholder="Quem realizou a movimentação">
        <div class="err">Informe o responsável.</div>
      </div>
      <div class="field">
        <label>Motivo</label>
        <input id="mMotivo" placeholder="Ex.: Substituição, realocação...">
      </div>
      <div class="field full">
        <label>Observação</label>
        <textarea id="mObs" placeholder="Opcional"></textarea>
      </div>
      <div class="field full">
        <div class="op-link-note">Data e hora serão registradas automaticamente: <b>${U.dataBR(data)} ${hora}</b>. A situação passará para <b>Disponível</b> se o destino for a TI, ou <b>Em uso</b> nos demais setores.</div>
      </div>
    </div>`;

  App.modal.open({
    title: App.ICONS.swap + ' Nova movimentação',
    body, confirmText: 'Registrar movimentação', size: 'modal-lg',
    onConfirm: () => registrar(),
  });

  // Atualiza origem ao trocar de equipamento
  if (!fixo) {
    document.getElementById('mEquip').addEventListener('change', (ev) => {
      const e = App.equipamentoPorPatrimonio(ev.target.value);
      document.getElementById('mOrigem').value = e ? e.setorAtual : '';
    });
  }

  async function registrar() {
    const patrimonio = document.getElementById('mEquip').value;
    const e = App.equipamentoPorPatrimonio(patrimonio);
    const destino = document.getElementById('mDestino').value;
    const responsavel = document.getElementById('mResp').value.trim();
    const motivo = document.getElementById('mMotivo').value.trim();
    const obs = document.getElementById('mObs').value.trim();

    let ok = true;
    document.getElementById('mDestino').closest('.field').classList.toggle('invalid', !destino);
    document.getElementById('mResp').closest('.field').classList.toggle('invalid', !responsavel);
    if (!destino || !responsavel) ok = false;
    if (ok && destino === e.setorAtual) {
      Swal.fire({ icon: 'info', title: 'Mesmo setor', text: 'O destino é igual ao setor atual do equipamento.' });
      return true;
    }
    if (!ok) return true;

    registrarMovimentacao(e, destino, responsavel, motivo, obs, null);
    const salvou = await App.persistir('Movimentação registrada.');
    if (salvou) {
      App.modal.close();
      if (App.tabelaMov) App.tabelaMov.setRows(DB.movimentacoes);
      if (App.tabelaEquip) App.tabelaEquip.setRows(DB.equipamentos);
      return false;
    }
    return true;
  }
};

/* Cria o registro de movimentação e atualiza o equipamento (Regras 05/06/07/08/09) */
function registrarMovimentacao(equip, destino, responsavel, motivo, obs, operacao) {
  const { data, hora } = App.U.nowParts();
  DB.movimentacoes.push({
    id: App.U.nextId('movimentacao'),
    patrimonio: equip.patrimonio,
    origem: equip.setorAtual,
    destino,
    data, hora,
    responsavel,
    motivo: motivo || '',
    observacao: obs || '',
    operacao: operacao || null,
  });
  equip.setorAtual = destino;
  equip.situacao = aplicarSituacaoPorDestino(destino);
}

/* ============================================================
   Troca vinculada (uma operação OP ligando dois equipamentos)
   ============================================================ */
function abrirTroca() {
  const U = App.U;
  if (DB.equipamentos.length < 2) {
    Swal.fire({ icon: 'info', title: 'Equipamentos insuficientes', text: 'A troca exige pelo menos dois equipamentos cadastrados.' });
    return;
  }
  const opId = proximoIdOperacao();

  const body = `
    <div class="op-link-note">Uma troca registra <b>duas movimentações vinculadas</b> ao mesmo ID de operação <span class="badge-op">${opId}</span>, permitindo consultar depois qual equipamento substituiu qual.</div>
    <h3 class="section-title" style="margin-top:6px">Equipamento novo (entra no setor)</h3>
    <div class="form-grid">
      <div class="field full">
        <label>Equipamento <span class="req">*</span></label>
        <select id="tNovo">${optionsEquipamentos(DB.equipamentos[0].patrimonio)}</select>
      </div>
      <div class="field">
        <label>Origem atual</label>
        <input id="tNovoOrigem" value="${U.esc(DB.equipamentos[0].setorAtual)}" disabled>
      </div>
      <div class="field">
        <label>Vai para o setor <span class="req">*</span></label>
        <select id="tDestinoNovo"><option value="">Selecione...</option>${optionsSetores()}</select>
        <div class="err">Selecione o setor de destino.</div>
      </div>
    </div>
    <h3 class="section-title" style="margin-top:14px">Equipamento antigo (sai do setor)</h3>
    <div class="form-grid">
      <div class="field full">
        <label>Equipamento <span class="req">*</span></label>
        <select id="tAntigo">${optionsEquipamentos(DB.equipamentos[1] ? DB.equipamentos[1].patrimonio : '')}</select>
      </div>
      <div class="field">
        <label>Origem atual</label>
        <input id="tAntigoOrigem" value="${U.esc((DB.equipamentos[1] || {}).setorAtual || '')}" disabled>
      </div>
      <div class="field">
        <label>Vai para o setor <span class="req">*</span></label>
        <select id="tDestinoAntigo">${optionsSetores('TI')}</select>
        <div class="hint">Normalmente retorna à TI, mas pode ir direto a outro setor.</div>
      </div>
    </div>
    <h3 class="section-title" style="margin-top:14px">Dados da operação</h3>
    <div class="form-grid">
      <div class="field">
        <label>Responsável <span class="req">*</span></label>
        <input id="tResp" placeholder="Quem realizou a troca">
        <div class="err">Informe o responsável.</div>
      </div>
      <div class="field">
        <label>Motivo</label>
        <input id="tMotivo" placeholder="Ex.: Renovação de parque">
      </div>
      <div class="field full">
        <label>Observação</label>
        <textarea id="tObs" placeholder="Opcional"></textarea>
      </div>
    </div>`;

  App.modal.open({
    title: App.ICONS.move + ' Nova troca',
    body, confirmText: 'Registrar troca', size: 'modal-lg',
    onConfirm: () => registrarTroca(opId),
  });

  const bindOrigem = (selId, inpId) =>
    document.getElementById(selId).addEventListener('change', (ev) => {
      const e = App.equipamentoPorPatrimonio(ev.target.value);
      document.getElementById(inpId).value = e ? e.setorAtual : '';
    });
  bindOrigem('tNovo', 'tNovoOrigem');
  bindOrigem('tAntigo', 'tAntigoOrigem');

  async function registrarTroca(operacao) {
    const patNovo = document.getElementById('tNovo').value;
    const patAntigo = document.getElementById('tAntigo').value;
    const destNovo = document.getElementById('tDestinoNovo').value;
    const destAntigo = document.getElementById('tDestinoAntigo').value;
    const responsavel = document.getElementById('tResp').value.trim();
    const motivo = document.getElementById('tMotivo').value.trim();
    const obs = document.getElementById('tObs').value.trim();

    let ok = true;
    document.getElementById('tDestinoNovo').closest('.field').classList.toggle('invalid', !destNovo);
    document.getElementById('tResp').closest('.field').classList.toggle('invalid', !responsavel);
    if (!destNovo || !responsavel) ok = false;
    if (patNovo === patAntigo) {
      Swal.fire({ icon: 'error', title: 'Equipamentos iguais', text: 'Escolha equipamentos diferentes para a troca.' });
      return true;
    }
    if (!ok) return true;

    const eqNovo = App.equipamentoPorPatrimonio(patNovo);
    const eqAntigo = App.equipamentoPorPatrimonio(patAntigo);

    // Duas movimentações vinculadas à mesma operação
    registrarMovimentacao(eqNovo, destNovo, responsavel, motivo || 'Troca de equipamento', obs, operacao);
    registrarMovimentacao(eqAntigo, destAntigo, responsavel, motivo || 'Troca de equipamento', obs, operacao);

    const salvou = await App.persistir('Troca registrada (' + operacao + ').');
    if (salvou) {
      App.modal.close();
      if (App.tabelaMov) App.tabelaMov.setRows(DB.movimentacoes);
      if (App.tabelaEquip) App.tabelaEquip.setRows(DB.equipamentos);
      return false;
    }
    return true;
  }
}
