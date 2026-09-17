  /* ═══════════════════════════════════════════
     RECEBIMENTOS DE EQUIPAMENTOS
  ═══════════════════════════════════════════ */

  function adicionarLinhaMaterial(tabelaId) {
    var tbody = document.querySelector('#' + (tabelaId || 'tb-rec') + ' tbody');
    if (!tbody) return;
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td style="text-align:center;"><input type="number" class="item-quant" min="1" value="" placeholder="" style="text-align:center;font-weight:600;width:55px;" /></td>' +
      '<td><input type="text" class="item-desc" placeholder="Descrição do equipamento/material..."/></td>' +
      '<td><input type="text" class="item-plaq" placeholder="Plaqueta..."/></td>' +
      '<td><input type="text" class="item-serie" placeholder="Nº Série..."/></td>' +
      '<td><input type="text" class="item-local" placeholder="Ex: Juiz de Fora"/></td>' +
      '<td style="text-align:center;">' +
        '<button type="button" class="btn btn-ghost btn-xs" onclick="removerLinhaMaterial(this)" style="color:var(--red);padding:3px 6px;display:inline-flex;align-items:center;justify-content:center;" title="Remover item">' +
          '<i data-lucide="trash-2" style="width:13px;height:13px;stroke-width:2;"></i>' +
        '</button>' +
      '</td>';
    tbody.appendChild(tr);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.adicionarLinhaMaterial = adicionarLinhaMaterial;

  function removerLinhaMaterial(btn) {
    var tr = btn.closest('tr');
    if (tr) tr.remove();
    try { salvarRascunhoRecebimento(true); } catch(e) {}
  }
  window.removerLinhaMaterial = removerLinhaMaterial;

  function selecionarFormaPagamento(labelEl) {
    var group = labelEl.closest('.rec-payment-group');
    if (!group) return;
    group.querySelectorAll('.rec-pay-option').forEach(function(opt) {
      opt.classList.remove('selected');
      var radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = false;
    });
    labelEl.classList.add('selected');
    var currentRadio = labelEl.querySelector('input[type="radio"]');
    if (currentRadio) currentRadio.checked = true;
  }
  window.selecionarFormaPagamento = selecionarFormaPagamento;

  function salvarRascunhoRecebimento(silencioso) {
    try {
      var remEl = document.getElementById('rec-remetente');
      var nfEl  = document.getElementById('rec-nf');
      var recEl = document.getElementById('rec-recebedor');
      var obsEl = document.getElementById('rec-obs');

      var materiais = [];
      var tbody = document.querySelector('#rec-materiais-tbody') || document.querySelector('#tb-rec tbody');
      if (tbody) {
        var rows = tbody.querySelectorAll('tr');
        rows.forEach(function(tr) {
          var qEl = tr.querySelector('.item-quant');
          var dEl = tr.querySelector('.item-desc');
          var pEl = tr.querySelector('.item-plaq');
          var sEl = tr.querySelector('.item-serie');
          var lEl = tr.querySelector('.item-local');
          var quant = qEl ? qEl.value : '';
          var desc  = dEl ? dEl.value : '';
          var plaq  = pEl ? pEl.value : '';
          var serie = sEl ? sEl.value : '';
          var local = lEl ? lEl.value : '';
          if (quant || desc || plaq || serie || local) {
            materiais.push({ quant: quant, desc: desc, plaq: plaq, serie: serie, local: local });
          }
        });
      }

      var dados = {
        remetente: remEl ? remEl.value : '',
        nf:        nfEl ? nfEl.value : '',
        recebedor: recEl ? recEl.value : '',
        obs:       obsEl ? obsEl.value : '',
        materiais: materiais
      };
      localStorage.setItem('tv_recebimento_rascunho_v1', JSON.stringify(dados));
      if (!silencioso && typeof mostrarToast === 'function') {
        mostrarToast('Rascunho Salvo', 'Dados de recebimento salvos com sucesso.', 'info');
      }
    } catch (e) {}
  }
  window.salvarRascunhoRecebimento = salvarRascunhoRecebimento;

  function carregarRascunhoRecebimento() {
    try {
      var raw = localStorage.getItem('tv_recebimento_rascunho_v1');
      if (!raw) return;
      var dados = JSON.parse(raw);
      if (!dados) return;

      var remEl = document.getElementById('rec-remetente');
      var nfEl  = document.getElementById('rec-nf');
      var recEl = document.getElementById('rec-recebedor');
      var obsEl = document.getElementById('rec-obs');

      if (remEl && dados.remetente !== undefined) remEl.value = dados.remetente;
      if (nfEl && dados.nf !== undefined)        nfEl.value = dados.nf;
      if (recEl && dados.recebedor !== undefined) recEl.value = dados.recebedor;
      if (obsEl && dados.obs !== undefined)      obsEl.value = dados.obs;

      if (Array.isArray(dados.materiais) && dados.materiais.length > 0) {
        var tbody = document.querySelector('#rec-materiais-tbody') || document.querySelector('#tb-rec tbody');
        if (tbody) {
          tbody.innerHTML = '';
          dados.materiais.forEach(function(item) {
            adicionarLinhaMaterial();
            var lastRow = tbody.lastElementChild;
            if (lastRow) {
              var qEl = lastRow.querySelector('.item-quant');
              var dEl = lastRow.querySelector('.item-desc');
              var pEl = lastRow.querySelector('.item-plaq');
              var sEl = lastRow.querySelector('.item-serie');
              var lEl = lastRow.querySelector('.item-local');
              if (qEl && item.quant !== undefined) qEl.value = item.quant;
              if (dEl && item.desc !== undefined)  dEl.value = item.desc;
              if (pEl && item.plaq !== undefined)  pEl.value = item.plaq;
              if (sEl && item.serie !== undefined) sEl.value = item.serie;
              if (lEl && item.local !== undefined) lEl.value = item.local;
            }
          });
        }
      }
    } catch (e) {}
  }
  window.carregarRascunhoRecebimento = carregarRascunhoRecebimento;

  function limparFormularioRecebimento(confirmar) {
    if (confirmar && !confirm('Deseja realmente limpar todos os campos do recebimento?')) {
      return;
    }
    try {
      localStorage.removeItem('tv_recebimento_rascunho_v1');
      var page = document.getElementById('page-recebimento');
      if (page) {
        page.querySelectorAll('input:not([type="radio"]), textarea').forEach(function(el) { el.value = ''; });
        page.querySelectorAll('select').forEach(function(el) { el.selectedIndex = 0; });
        var prev = document.getElementById('rec-previews');
        if (prev) prev.innerHTML = '';
        var tbody = document.querySelector('#rec-materiais-tbody') || document.querySelector('#tb-rec tbody');
        if (tbody) {
          tbody.innerHTML = '';
          if (typeof adicionarLinhaMaterial === 'function') {
            adicionarLinhaMaterial();
          }
        }
      }
      if (confirmar && typeof mostrarToast === 'function') {
        mostrarToast('Formulário Limpo', 'Campos de recebimento zerados.', 'info');
      }
    } catch (e) {}
  }
  window.limparFormularioRecebimento = limparFormularioRecebimento;

  function enviarRecebimento(modelo) {
    var nowStr = formatDataHoraLocal();
    var m = (modelo !== undefined && modelo !== null) ? modelo : '';

    var remEl = document.getElementById('rec' + m + '-remetente') || document.getElementById('rec-remetente');
    var nfEl  = document.getElementById('rec' + m + '-nf') || document.getElementById('rec-nf');
    var recEl = document.getElementById('rec' + m + '-recebedor') || document.getElementById('rec-recebedor');
    var obsEl = document.getElementById('rec' + m + '-obs') || document.getElementById('rec-obs');

    var remetente = remEl ? remEl.value.trim() : '';
    var nf        = nfEl ? nfEl.value.trim() : '';
    var recebedor = (recEl && recEl.value.trim()) ? recEl.value.trim() : getUsuarioAtual();
    var obs       = obsEl ? obsEl.value.trim() : '';

    /* Validação e coleta de itens de recebimento */
    var tbody = document.querySelector('#rec-materiais-tbody') || document.querySelector('#tb-rec tbody');
    var linhas = tbody ? tbody.querySelectorAll('tr') : [];
    var itensResumo = [];
    var erroValidacao = false;

    linhas.forEach(function(tr) {
      var qInput = tr.querySelector('.item-quant');
      var dInput = tr.querySelector('.item-desc');
      var q = qInput ? qInput.value.trim() : '';
      var d = dInput ? dInput.value.trim() : '';
      var p = tr.querySelector('.item-plaq') ? tr.querySelector('.item-plaq').value.trim() : '';
      var s = tr.querySelector('.item-serie') ? tr.querySelector('.item-serie').value.trim() : '';
      var loc = tr.querySelector('.item-local') ? tr.querySelector('.item-local').value.trim() : '';

      if (d || p || s || loc || q) {
        if (!q || parseInt(q, 10) <= 0 || isNaN(parseInt(q, 10))) {
          erroValidacao = true;
          if (qInput) {
            qInput.style.borderColor = '#EF4444';
            qInput.focus();
          }
        } else {
          if (qInput) qInput.style.borderColor = '';
          itensResumo.push(q + 'x ' + (d || 'Material') + (p ? (' [Plaq: ' + p + ']') : '') + (s ? (' [Série: ' + s + ']') : ''));
        }
      }
    });

    if (erroValidacao) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Quantidade Obrigatória', 'Por favor, informe uma quantidade válida (número maior que 0) para o material recebido.', 'warning');
      } else {
        alert('Por favor, informe uma quantidade válida (número maior que 0) para os materiais.');
      }
      return;
    }

    var titulo = 'Recebimento N.F ' + (nf || 'S/N') + (remetente ? (' — ' + remetente) : '');

    var novoHist = {
      id:            'h_rec_' + Date.now(),
      tipo:          'recebimento',
      subtipo:       'Recebimento Equipamentos',
      titulo:        titulo,
      equipamento:   (itensResumo.length > 0 ? itensResumo[0] : (remetente || 'Equipamento / Material Recebido')),
      categoria:     'Investimento / Reg. Fotográfico',
      local:         'Juiz de Fora',
      dataCriacao:   nowStr,
      criadoPor:     recebedor,
      descCriacao:   'Recebimento registrado. Remetente: ' + (remetente || 'N/A') + '. N.F: ' + (nf || 'N/A') + '. ' + (itensResumo.length > 0 ? ('Itens: ' + itensResumo.join('; ') + '. ') : '') + (obs || ''),
      status:        'Processado',
      dataResolucao: nowStr,
      resolvidoPor:  recebedor,
      descResolucao: 'Conferido e integrado automaticamente ao sistema patrimonial e relatórios.'
    };

    historicoSeedData = [novoHist].concat(historicoSeedData);
    saveHistorico(historicoSeedData, novoHist);

    // Limpa o rascunho e o formulário para o próximo recebimento
    limparFormularioRecebimento(false);

    renderAll();
    if (typeof mostrarToast === 'function') {
      mostrarToast('Recebimento Registrado', 'Salvo no Histórico. O envio por e-mail ainda não está disponível.', 'info');
    }
    alert('Recebimento de Equipamentos registrado com sucesso no Histórico!\n\nNota: A função de envio por e-mail ainda não está disponível.');
  }
  window.enviarRecebimento = enviarRecebimento;

  if (typeof registrarAutosaveListener === 'function') {
    registrarAutosaveListener('page-recebimento', salvarRascunhoRecebimento);
  }
