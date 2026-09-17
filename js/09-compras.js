  /* ═══════════════════════════════════════════
     REQUISIÇÃO DE COMPRAS E VENDAS
  ═══════════════════════════════════════════ */

  function adicionarLinhaItemCompra() {
    var tbody = document.getElementById('req-itens-tbody');
    if (!tbody) return;
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td style="text-align:center;"><input type="number" class="item-quant" min="1" value="" placeholder="" style="text-align:center;font-weight:600;width:55px;" /></td>' +
      '<td><input type="text" class="item-desc" placeholder="Ex: Descrição do material..." /></td>' +
      '<td><input type="text" class="item-cod" placeholder="Código ex: P4-120" /></td>' +
      '<td><input type="text" class="item-fab" placeholder="Marca ou fabricante" /></td>' +
      '<td><input type="url" class="item-link" placeholder="https://link-do-produto.com..." /></td>' +
      '<td style="text-align:center;">' +
        '<button type="button" class="btn btn-ghost btn-xs" onclick="removerLinhaItemCompra(this)" title="Remover item" style="color:var(--red);padding:3px 6px;display:inline-flex;align-items:center;justify-content:center;">' +
          '<i data-lucide="trash-2" style="width:13px;height:13px;stroke-width:2;"></i>' +
        '</button>' +
      '</td>';
    tbody.appendChild(tr);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.adicionarLinhaItemCompra = adicionarLinhaItemCompra;

  function removerLinhaItemCompra(btn) {
    var tr = btn.closest('tr');
    if (tr) tr.remove();
    try { salvarRascunhoCompra(true); } catch(e) {}
  }
  window.removerLinhaItemCompra = removerLinhaItemCompra;

  function salvarRascunhoCompra(silencioso) {
    try {
      var pracaEl       = document.getElementById('req-praca');
      var caraterEl     = document.getElementById('req-carater');
      var solicitanteEl = document.getElementById('req-solicitante');
      var motivoEl      = document.getElementById('req-motivo');
      var destinoEl     = document.getElementById('req-destino');
      var centroEl      = document.getElementById('req-centrocusto');
      var projetoEl     = document.getElementById('req-projeto');

      var itens = [];
      var tbody = document.getElementById('req-itens-tbody');
      if (tbody) {
        var rows = tbody.querySelectorAll('tr');
        rows.forEach(function(tr) {
          var qEl = tr.querySelector('.item-quant');
          var dEl = tr.querySelector('.item-desc');
          var cEl = tr.querySelector('.item-cod');
          var fEl = tr.querySelector('.item-fab');
          var lEl = tr.querySelector('.item-link');
          var quant = qEl ? qEl.value : '';
          var desc  = dEl ? dEl.value : '';
          var cod   = cEl ? cEl.value : '';
          var fab   = fEl ? fEl.value : '';
          var link  = lEl ? lEl.value : '';
          if (quant || desc || cod || fab || link) {
            itens.push({ quant: quant, desc: desc, cod: cod, fab: fab, link: link });
          }
        });
      }

      var dados = {
        praca:       pracaEl ? pracaEl.value : '',
        carater:     caraterEl ? caraterEl.value : '',
        solicitante: solicitanteEl ? solicitanteEl.value : '',
        motivo:      motivoEl ? motivoEl.value : '',
        destino:     destinoEl ? destinoEl.value : '',
        centro:      centroEl ? centroEl.value : '',
        projeto:     projetoEl ? projetoEl.value : '',
        itens:       itens
      };
      localStorage.setItem('tv_compras_rascunho_v1', JSON.stringify(dados));
      if (!silencioso && typeof mostrarToast === 'function') {
        mostrarToast('Rascunho Salvo', 'Dados de compras salvos com sucesso.', 'info');
      }
    } catch (e) {}
  }
  window.salvarRascunhoCompra = salvarRascunhoCompra;

  function carregarRascunhoCompra() {
    try {
      var raw = localStorage.getItem('tv_compras_rascunho_v1');
      if (!raw) return;
      var dados = JSON.parse(raw);
      if (!dados) return;

      var pracaEl       = document.getElementById('req-praca');
      var caraterEl     = document.getElementById('req-carater');
      var solicitanteEl = document.getElementById('req-solicitante');
      var motivoEl      = document.getElementById('req-motivo');
      var destinoEl     = document.getElementById('req-destino');
      var centroEl      = document.getElementById('req-centrocusto');
      var projetoEl     = document.getElementById('req-projeto');

      if (pracaEl && dados.praca !== undefined)             pracaEl.value = dados.praca;
      if (caraterEl && dados.carater !== undefined)         caraterEl.value = dados.carater;
      if (solicitanteEl && dados.solicitante !== undefined) solicitanteEl.value = dados.solicitante;
      if (motivoEl && dados.motivo !== undefined)           motivoEl.value = dados.motivo;
      if (destinoEl && dados.destino !== undefined)         destinoEl.value = dados.destino;
      if (centroEl && dados.centro !== undefined)           centroEl.value = dados.centro;
      if (projetoEl && dados.projeto !== undefined)         projetoEl.value = dados.projeto;

      if (Array.isArray(dados.itens) && dados.itens.length > 0) {
        var tbody = document.getElementById('req-itens-tbody');
        if (tbody) {
          tbody.innerHTML = '';
          dados.itens.forEach(function(item) {
            adicionarLinhaItemCompra();
            var lastRow = tbody.lastElementChild;
            if (lastRow) {
              var qEl = lastRow.querySelector('.item-quant');
              var dEl = lastRow.querySelector('.item-desc');
              var cEl = lastRow.querySelector('.item-cod');
              var fEl = lastRow.querySelector('.item-fab');
              var lEl = lastRow.querySelector('.item-link');
              if (qEl && item.quant !== undefined) qEl.value = item.quant;
              if (dEl && item.desc !== undefined)  dEl.value = item.desc;
              if (cEl && item.cod !== undefined)   cEl.value = item.cod;
              if (fEl && item.fab !== undefined)   fEl.value = item.fab;
              if (lEl && item.link !== undefined)  lEl.value = item.link;
            }
          });
        }
      }
    } catch (e) {}
  }
  window.carregarRascunhoCompra = carregarRascunhoCompra;

  function limparFormularioCompras(confirmar) {
    if (confirmar && !confirm('Deseja realmente limpar a requisição de compras?')) {
      return;
    }
    try {
      localStorage.removeItem('tv_compras_rascunho_v1');
      var page = document.getElementById('page-compras');
      if (page) {
        page.querySelectorAll('input:not([type="radio"]), textarea').forEach(function(el) { el.value = ''; });
        page.querySelectorAll('select').forEach(function(el) { el.selectedIndex = 0; });
        var prev = document.getElementById('req-previews');
        if (prev) prev.innerHTML = '';
        var tbody = document.getElementById('req-itens-tbody');
        if (tbody) {
          tbody.innerHTML = '';
          if (typeof adicionarLinhaItemCompra === 'function') {
            adicionarLinhaItemCompra();
          }
        }
        var pEl = document.getElementById('req-praca');
        if (pEl && typeof getPracaAtual === 'function') pEl.value = getPracaAtual();
        var sEl = document.getElementById('req-solicitante');
        if (sEl && typeof getUsuarioAtual === 'function') sEl.value = getUsuarioAtual();
      }
      if (confirmar && typeof mostrarToast === 'function') {
        mostrarToast('Formulário Limpo', 'Campos de compras zerados.', 'info');
      }
    } catch (e) {}
  }
  window.limparFormularioCompras = limparFormularioCompras;

  function enviarRequisicaoCompra() {
    var nowStr = formatDataHoraLocal();
    var pracaEl       = document.getElementById('req-praca');
    var caraterEl     = document.getElementById('req-carater');
    var solicitanteEl = document.getElementById('req-solicitante');
    var motivoEl      = document.getElementById('req-motivo');
    var destinoEl     = document.getElementById('req-destino');
    var centroEl      = document.getElementById('req-centrocusto');
    var projetoEl     = document.getElementById('req-projeto');

    var praca       = pracaEl ? pracaEl.value : 'Juiz de Fora';
    var carater     = caraterEl ? caraterEl.value : 'Normal';
    var solicitante = (solicitanteEl && solicitanteEl.value.trim()) ? solicitanteEl.value.trim() : getUsuarioAtual();
    var motivo      = motivoEl ? motivoEl.value.trim() : '';
    var destino     = destinoEl ? destinoEl.value.trim() : '';
    var centro      = centroEl ? centroEl.value : 'Manutenção Técnica - JF';
    var projeto     = projetoEl ? projetoEl.value.trim() : 'Padrão';

    if (!motivo || !destino) {
      alert('Por favor, preencha a Justificativa/Motivo e o Uso a que se destina antes de enviar.');
      return;
    }

    /* Coleta itens com validação estrita de quantidade */
    var tbody = document.getElementById('req-itens-tbody');
    var linhas = tbody ? tbody.querySelectorAll('tr') : [];
    var itensResumo = [];
    var erroValidacao = false;

    linhas.forEach(function(tr) {
      var qInput = tr.querySelector('.item-quant');
      var dInput = tr.querySelector('.item-desc');
      var q = qInput ? qInput.value.trim() : '';
      var d = dInput ? dInput.value.trim() : '';
      var c = tr.querySelector('.item-cod') ? tr.querySelector('.item-cod').value.trim() : '';
      var f = tr.querySelector('.item-fab') ? tr.querySelector('.item-fab').value.trim() : '';
      var l = tr.querySelector('.item-link') ? tr.querySelector('.item-link').value.trim() : '';

      if (d || c || f || l || q) {
        if (!q || parseInt(q, 10) <= 0 || isNaN(parseInt(q, 10))) {
          erroValidacao = true;
          if (qInput) {
            qInput.style.borderColor = '#EF4444';
            qInput.focus();
          }
        } else {
          if (qInput) qInput.style.borderColor = '';
          itensResumo.push(q + 'x ' + (d || 'Item') + (c ? (' [Cód: ' + c + ']') : '') + (f ? (' (' + f + ')') : '') + (l ? (' [' + l + ']') : ''));
        }
      }
    });

    if (erroValidacao) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Quantidade Obrigatória', 'Por favor, informe uma quantidade válida (número maior que 0) para o material solicitado.', 'warning');
      } else {
        alert('Por favor, informe uma quantidade válida (número maior que 0) para todos os itens da requisição.');
      }
      return;
    }

    var titulo = 'Requisição de Compra — ' + praca + ' (' + carater + ')';
    var descCompleta = 'Justificativa: ' + motivo + '\n' +
                       'Itens: ' + (itensResumo.length > 0 ? itensResumo.join('; ') : 'Material/Equipamento solicitado') + '\n' +
                       'Aplicação: ' + destino + ' | Centro de Custo: ' + centro + ' | Projeto: ' + projeto;

    var novoHist = {
      id:            'h_req_' + Date.now(),
      tipo:          'compra',
      subtipo:       'Requisição de Compra (' + carater + ')',
      titulo:        titulo,
      equipamento:   itensResumo[0] || 'Materiais de Compra',
      categoria:     centro || 'Compras / Vendas',
      local:         praca,
      dataCriacao:   nowStr,
      criadoPor:     solicitante,
      descCriacao:   descCompleta,
      status:        'Aguardando Aprovação',
      dataResolucao: 'Encaminhado para a chefia',
      resolvidoPor:  'Chefia / Setor de Compras',
      descResolucao: 'Solicitação registrada no sistema. Aguardando validação do chefe imediato para envio à gerência e compras.',
      praca:         praca
    };

    historicoSeedData = [novoHist].concat(historicoSeedData);
    saveHistorico(historicoSeedData, novoHist);

    // Limpa o rascunho e o formulário para a próxima requisição
    limparFormularioCompras(false);

    renderAll();

    if (typeof adicionarNotificacao === 'function') {
      adicionarNotificacao('Requisição de Compra Enviada', titulo + ' cadastrada para aprovação.', 'success');
    }

    alert('Requisição de Compra cadastrada com sucesso no Histórico!\n\nNota: A função de envio por e-mail ainda não está disponível.');
  }
  window.enviarRequisicaoCompra = enviarRequisicaoCompra;

  if (typeof registrarAutosaveListener === 'function') {
    registrarAutosaveListener('page-compras', salvarRascunhoCompra);
  }
