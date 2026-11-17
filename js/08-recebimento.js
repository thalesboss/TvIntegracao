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
        '<label style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--txt2);cursor:pointer;user-select:none;" title="Se marcado, este equipamento também aparecerá nas listas de opções dos relatórios e popups de transmissão">' +
          '<input type="checkbox" class="item-exibir-rel" style="width:14px;height:14px;accent-color:var(--blue);cursor:pointer;" />' +
          '<span>Incluir nos Relatórios</span>' +
        '</label>' +
      '</td>' +
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
      var remEl   = document.getElementById('rec-remetente');
      var nfEl    = document.getElementById('rec-nf');
      var valEl   = document.getElementById('rec-valor');
      var opEl    = document.getElementById('rec-operacao');
      var dtEl    = document.getElementById('rec-data');
      var volEl   = document.getElementById('rec-volumes');
      var recEl   = document.getElementById('rec-recebedor');
      var dtFatEl = document.getElementById('rec-data-fat');
      var ordEl   = document.getElementById('rec-ordem');
      var obsEl   = document.getElementById('rec-obs');
      var pagEl   = document.querySelector('input[name="rec-pagamento"]:checked');
      var materiais = [];
      var tbody = document.querySelector('#rec-materiais-tbody') || document.querySelector('#tb-rec tbody');
      if (tbody) {
        var rows = tbody.querySelectorAll('tr');
        rows.forEach(function(tr) {
          var qEl  = tr.querySelector('.item-quant');
          var dEl  = tr.querySelector('.item-desc');
          var pEl  = tr.querySelector('.item-plaq');
          var sEl  = tr.querySelector('.item-serie');
          var lEl  = tr.querySelector('.item-local');
          var exEl = tr.querySelector('.item-exibir-rel');
          var quant = qEl ? qEl.value : '';
          var desc  = dEl ? dEl.value : '';
          var plaq  = pEl ? pEl.value : '';
          var serie = sEl ? sEl.value : '';
          var local = lEl ? lEl.value : '';
          var exibirNosRelatorios = exEl ? !!exEl.checked : false;
          if (quant || desc || plaq || serie || local || exibirNosRelatorios) {
            materiais.push({ quant: quant, desc: desc, plaq: plaq, serie: serie, local: local, exibirNosRelatorios: exibirNosRelatorios });
          }
        });
      }
      var dados = {
        remetente:        remEl ? remEl.value : '',
        nf:               nfEl ? nfEl.value : '',
        valor:            valEl ? valEl.value : '',
        operacao:         opEl ? opEl.value : '',
        dataRecebimento:  dtEl ? dtEl.value : '',
        volumes:          volEl ? volEl.value : '',
        recebedor:        recEl ? recEl.value : '',
        dataFaturamento:  dtFatEl ? dtFatEl.value : '',
        formaPagamento:   pagEl ? pagEl.value : '',
        ordemCompra:      ordEl ? ordEl.value : '',
        obs:              obsEl ? obsEl.value : '',
        materiais:        materiais
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
      var mapInputs = {
        'rec-remetente': dados.remetente,
        'rec-nf':        dados.nf,
        'rec-valor':     dados.valor,
        'rec-operacao':  dados.operacao,
        'rec-data':      dados.dataRecebimento,
        'rec-volumes':   dados.volumes,
        'rec-recebedor': dados.recebedor,
        'rec-data-fat':  dados.dataFaturamento,
        'rec-ordem':     dados.ordemCompra,
        'rec-obs':       dados.obs
      };
      Object.keys(mapInputs).forEach(function(idEl) {
        var el = document.getElementById(idEl);
        if (el && mapInputs[idEl] !== undefined) el.value = mapInputs[idEl];
      });
      if (dados.formaPagamento) {
        document.querySelectorAll('input[name="rec-pagamento"]').forEach(function(r) {
          var opt = r.closest('.rec-pay-option');
          if (r.value === dados.formaPagamento) {
            r.checked = true;
            if (opt) opt.classList.add('selected');
          } else {
            r.checked = false;
            if (opt) opt.classList.remove('selected');
          }
        });
      }
      if (Array.isArray(dados.materiais) && dados.materiais.length > 0) {
        var tbody = document.querySelector('#rec-materiais-tbody') || document.querySelector('#tb-rec tbody');
        if (tbody) {
          tbody.innerHTML = '';
          dados.materiais.forEach(function(item) {
            adicionarLinhaMaterial();
            var lastRow = tbody.lastElementChild;
            if (lastRow) {
              var qEl  = lastRow.querySelector('.item-quant');
              var dEl  = lastRow.querySelector('.item-desc');
              var pEl  = lastRow.querySelector('.item-plaq');
              var sEl  = lastRow.querySelector('.item-serie');
              var lEl  = lastRow.querySelector('.item-local');
              var exEl = lastRow.querySelector('.item-exibir-rel');
              if (qEl && item.quant !== undefined) qEl.value = item.quant;
              if (dEl && item.desc !== undefined)  dEl.value = item.desc;
              if (pEl && item.plaq !== undefined)  pEl.value = item.plaq;
              if (sEl && item.serie !== undefined) sEl.value = item.serie;
              if (lEl && item.local !== undefined) lEl.value = item.local;
              if (exEl) exEl.checked = !!item.exibirNosRelatorios;
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
      if (typeof uploadedFilesStore !== 'undefined') uploadedFilesStore['rec-previews'] = [];
      var page = document.getElementById('page-recebimento');
      if (page) {
        page.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), textarea').forEach(function(el) { el.value = ''; });
        page.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(function(el) { el.checked = false; });
        page.querySelectorAll('.rec-pay-option.selected').forEach(function(el) { el.classList.remove('selected'); });
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
    var remEl   = document.getElementById('rec' + m + '-remetente') || document.getElementById('rec-remetente');
    var nfEl    = document.getElementById('rec' + m + '-nf') || document.getElementById('rec-nf');
    var valEl   = document.getElementById('rec-valor');
    var opEl    = document.getElementById('rec-operacao');
    var dtEl    = document.getElementById('rec-data');
    var volEl   = document.getElementById('rec-volumes');
    var recEl   = document.getElementById('rec' + m + '-recebedor') || document.getElementById('rec-recebedor');
    var dtFatEl = document.getElementById('rec-data-fat');
    var pagEl   = document.querySelector('input[name="rec-pagamento"]:checked');
    var ordEl   = document.getElementById('rec-ordem');
    var obsEl   = document.getElementById('rec' + m + '-obs') || document.getElementById('rec-obs');
    var remetente = remEl ? remEl.value.trim() : '';
    var nf        = nfEl ? nfEl.value.trim() : '';
    var valor     = valEl ? valEl.value.trim() : '';
    var operacao  = opEl ? opEl.value.trim() : '';
    var dataRec   = dtEl ? dtEl.value : '';
    var volumes   = volEl ? volEl.value.trim() : '';
    var recebedor = (recEl && recEl.value.trim()) ? recEl.value.trim() : getUsuarioAtual();
    var dataFat   = dtFatEl ? dtFatEl.value : '';
    var pagamento = pagEl ? pagEl.value : '';
    var ordem     = ordEl ? ordEl.value.trim() : '';
    var obs       = obsEl ? obsEl.value.trim() : '';
    var tbody = document.querySelector('#rec-materiais-tbody') || document.querySelector('#tb-rec tbody');
    var linhas = tbody ? tbody.querySelectorAll('tr') : [];
    var itensResumo = [];
    var materiaisDetalhados = [];
    var erroValidacao = false;
    linhas.forEach(function(tr) {
      var qInput = tr.querySelector('.item-quant');
      var dInput = tr.querySelector('.item-desc');
      var q = qInput ? qInput.value.trim() : '';
      var d = dInput ? dInput.value.trim() : '';
      var p = tr.querySelector('.item-plaq') ? tr.querySelector('.item-plaq').value.trim() : '';
      var s = tr.querySelector('.item-serie') ? tr.querySelector('.item-serie').value.trim() : '';
      var loc = tr.querySelector('.item-local') ? tr.querySelector('.item-local').value.trim() : '';
      var exRelEl = tr.querySelector('.item-exibir-rel');
      var exRel = exRelEl ? !!exRelEl.checked : false;
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
          materiaisDetalhados.push({
            quant: q,
            desc: d || 'Material',
            plaq: p,
            serie: s,
            local: loc,
            exibirNosRelatorios: exRel
          });
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
    var anexosBrutos = (typeof uploadedFilesStore !== 'undefined' && Array.isArray(uploadedFilesStore['rec-previews']))
      ? uploadedFilesStore['rec-previews']
      : [];
    var anexosRec = anexosBrutos.map(function(a) {
      return {
        id: a.id || ('med_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
        name: a.name || 'Arquivo Anexo',
        type: a.type || '',
        size: a.size || 0,
        dataUrl: a.dataUrl || a.url || ''
      };
    }).filter(function(a) { return !!a.dataUrl; });
    var pracaRec = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var dadosRecebimento = {
      remetente:        remetente,
      nf:               nf,
      valor:            valor,
      operacao:         operacao,
      dataRecebimento:  dataRec,
      volumes:          volumes,
      recebedor:        recebedor,
      dataFaturamento:  dataFat,
      formaPagamento:   pagamento,
      ordemCompra:      ordem,
      obs:              obs,
      praca:            pracaRec,
      dataCriacao:      nowStr,
      materiais:        materiaisDetalhados,
      anexos:           anexosRec
    };
    var marcadorRecJson = '';
    try {
      marcadorRecJson = ' <!--REC_JSON:' + encodeURIComponent(JSON.stringify(dadosRecebimento)) + '-->';
    } catch (eJsonRec) {}
    var titulo = 'Recebimento N.F ' + (nf || 'S/N') + (remetente ? (' — ' + remetente) : '');
    var descResBase = 'Conferido e integrado automaticamente ao sistema patrimonial e relatórios.';
    var novoHist = {
      id:               'h_rec_' + Date.now(),
      tipo:             'recebimento',
      subtipo:          'Recebimento Equipamentos',
      titulo:           titulo,
      equipamento:      (itensResumo.length > 0 ? itensResumo[0] : (remetente || 'Equipamento / Material Recebido')),
      categoria:        'Investimento / Reg. Fotográfico',
      local:            pracaRec,
      praca:            pracaRec,
      dataCriacao:      nowStr,
      criadoPor:        recebedor,
      descCriacao:      'Recebimento registrado. Remetente: ' + (remetente || 'N/A') + '. N.F: ' + (nf || 'N/A') + '. ' + (itensResumo.length > 0 ? ('Itens: ' + itensResumo.join('; ') + '. ') : '') + (obs || ''),
      status:           'Processado',
      dataResolucao:    nowStr,
      resolvidoPor:     recebedor,
      descResolucao:    descResBase + marcadorRecJson,
      dadosRecebimento: dadosRecebimento,
      anexos:           anexosRec
    };
    historicoSeedData = [novoHist].concat(historicoSeedData);
    saveHistorico(historicoSeedData, novoHist);
    var qtdCatalogo = 0;
    if (typeof registrarMateriaisRecebidosNoCatalogo === 'function') {
      qtdCatalogo = registrarMateriaisRecebidosNoCatalogo(materiaisDetalhados, dadosRecebimento, false) || 0;
    }
    limparFormularioRecebimento(false);
    renderAll(true);
    var msgExtraCat = qtdCatalogo > 0 ? (' e ' + qtdCatalogo + ' equipamento(s) cadastrado(s) na aba Equipamentos.') : '.';
    if (typeof mostrarToast === 'function') {
      mostrarToast('Recebimento Registrado', 'Salvo no Histórico com anexos' + msgExtraCat, 'success');
    }
  }
  window.enviarRecebimento = enviarRecebimento;
  if (typeof registrarAutosaveListener === 'function') {
    registrarAutosaveListener('page-recebimento', salvarRascunhoRecebimento);
  }
