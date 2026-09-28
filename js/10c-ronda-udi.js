/* ═══════════════════════════════════════════
   RELATÓRIO DIÁRIO — TECNOLOGIA UDI (RONDA TÉCNICA)
   Módulo exclusivo da praça de Uberlândia para acompanhamento de
   Centro Exibidor, Transmissores, Recepção Satélite, CPA, Central e Energia.
═══════════════════════════════════════════ */

(function () {
  var RONDA_DRAFT_KEY = 'tv_rascunho_ronda_udi_v1';

  var RONDA_ITEMS = [
    // Centro Exibidor
    { id: 'exib_signa',      secao: 'exibidor',     nome: 'SIGNA (Automação / Exibição)' },
    { id: 'exib_smartware',  secao: 'exibidor',     nome: 'SMARTWARE' },
    { id: 'exib_multiview',  secao: 'exibidor',     nome: 'MULTIVIEW' },
    { id: 'exib_clearcom',   secao: 'exibidor',     nome: 'CLEARCOM (Intercomunicação)' },
    { id: 'exib_globoplay',  secao: 'exibidor',     nome: 'GLOBOPLAY (Sinal OTT)' },

    // Transmissor & RF
    { id: 'trans_temp',      secao: 'transmissor',  nome: 'TEMPERATURA DO TRANSMISSOR' },

    // Receptores de Satélite
    { id: 'sat_rede_tit',    secao: 'satelite',     nome: 'SAT REDE TIT' },
    { id: 'sat_sp_tit',      secao: 'satelite',     nome: 'SAT SP TIT' },
    { id: 'sat_bh_tit',      secao: 'satelite',     nome: 'SAT BH TIT' },
    { id: 'sat_eventos',     secao: 'satelite',     nome: 'SAT EVENTOS' },

    // Rotas de Contribuição e Recepção
    { id: 'rota_makito',     secao: 'rotas',        nome: 'SRT (MAKITO)' },
    { id: 'rota_mpls',       secao: 'rotas',        nome: 'SINAIS VIA MPLS' },
    { id: 'rota_l2l',        secao: 'rotas',        nome: 'SINAIS VIA L2L' },

    // Central Técnica
    { id: 'ct_frames',       secao: 'central',      nome: 'FRAMES' },
    { id: 'ct_multiview',    secao: 'central',      nome: 'MULTIVIEW' },
    { id: 'ct_clearcom',     secao: 'central',      nome: 'CLEARCOM' },
    { id: 'ct_temp',         secao: 'central',      nome: 'TEMPERATURA CENTRAL' },

    // CPA (Controle de Produção e Áudio)
    { id: 'cpa_frames',      secao: 'cpa',          nome: 'FRAMES CPA' },
    { id: 'cpa_multiview',   secao: 'cpa',          nome: 'MULTIVIEW CPA' },
    { id: 'cpa_retorno',     secao: 'cpa',          nome: 'RETORNO VIVOS' },
    { id: 'cpa_mochilinks',  secao: 'cpa',          nome: 'MOCHILINKS (LiveU / Links)' },

    // Cadeia Satélite (Uplink)
    { id: 'sat_mux',         secao: 'cadeia_sat',   nome: 'MUX' },
    { id: 'sat_modulador',   secao: 'cadeia_sat',   nome: 'MODULADOR' },
    { id: 'sat_encoder',     secao: 'cadeia_sat',   nome: 'ENCODER' },
    { id: 'sat_buc',         secao: 'cadeia_sat',   nome: 'BUC (Block Upconverter)' },

    // Infraestrutura e Energia
    { id: 'eng_gerador',     secao: 'energia',      nome: 'GERADOR' },
    { id: 'eng_nobreak',     secao: 'energia',      nome: 'NO-BREAK' }
  ];

  window.RONDA_ITEMS_UDI = RONDA_ITEMS;

  function setRondaStatus(btn, status) {
    if (!btn) return;
    var group = btn.closest('.ronda-toggle-group');
    if (!group) return;
    var parentItem = btn.closest('.ronda-item');

    var buttons = group.querySelectorAll('.ronda-btn-pill');
    buttons.forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');

    if (parentItem) {
      if (status === 'nc') {
        parentItem.classList.add('has-nc');
      } else {
        parentItem.classList.remove('has-nc');
      }
    }

    verificarNaoConformidadesRonda();
    salvarRascunhoRondaDebounced();
  }
  window.setRondaStatus = setRondaStatus;

  function marcarTudoConformeRonda() {
    var container = document.getElementById('page-ronda');
    if (!container) return;

    var confButtons = container.querySelectorAll('.ronda-btn-pill.conf');
    confButtons.forEach(function (btn) {
      var group = btn.closest('.ronda-toggle-group');
      if (group) {
        group.querySelectorAll('.ronda-btn-pill').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      }
      var parentItem = btn.closest('.ronda-item');
      if (parentItem) parentItem.classList.remove('has-nc');
    });

    verificarNaoConformidadesRonda();
    salvarRascunhoRondaDebounced();

    if (typeof mostrarToast === 'function') {
      mostrarToast('Ronda Técnica', 'Todos os sistemas marcados como Conforme.', 'success');
    }
  }
  window.marcarTudoConformeRonda = marcarTudoConformeRonda;

  function limparFormularioRonda() {
    var container = document.getElementById('page-ronda');
    if (!container) return;

    if (!confirm('Deseja limpar todos os campos do Relatório Diário de Tecnologia?')) return;

    container.querySelectorAll('.ronda-btn-pill').forEach(function (btn) {
      btn.classList.remove('active');
    });
    container.querySelectorAll('.ronda-item').forEach(function (it) {
      it.classList.remove('has-nc');
    });

    var numInputs = container.querySelectorAll('input[type="number"], textarea');
    numInputs.forEach(function (inp) { inp.value = ''; });

    try { localStorage.removeItem(RONDA_DRAFT_KEY); } catch(e) {}
    verificarNaoConformidadesRonda();

    if (typeof mostrarToast === 'function') {
      mostrarToast('Formulário Limpo', 'Os campos foram reiniciados.', 'info');
    }
  }
  window.limparFormularioRonda = limparFormularioRonda;

  function obterNaoConformidadesRonda() {
    var container = document.getElementById('page-ronda');
    if (!container) return [];

    var ncs = [];
    var ncButtons = container.querySelectorAll('.ronda-btn-pill.nc.active');
    ncButtons.forEach(function (btn) {
      var group = btn.closest('.ronda-toggle-group');
      var itemKey = group ? group.getAttribute('data-item-id') : null;
      var parentItem = btn.closest('.ronda-item');
      var labelEl = parentItem ? parentItem.querySelector('.ronda-item-label') : null;
      var nome = labelEl ? labelEl.textContent.trim() : (itemKey || 'Item');
      ncs.push({ id: itemKey, nome: nome });
    });
    return ncs;
  }
  window.obterNaoConformidadesRonda = obterNaoConformidadesRonda;

  function verificarNaoConformidadesRonda() {
    var ncs = obterNaoConformidadesRonda();
    var banner = document.getElementById('ronda-nc-alert');
    var badge = document.getElementById('ronda-nc-count-badge');
    var listTxt = document.getElementById('ronda-nc-list-txt');

    if (!banner) return;

    if (ncs.length > 0) {
      banner.style.display = 'flex';
      if (badge) badge.textContent = ncs.length + (ncs.length === 1 ? ' não conformidade' : ' não conformidades');
      if (listTxt) {
        listTxt.textContent = 'Detectado em: ' + ncs.map(function (n) { return n.nome; }).join(', ');
      }
    } else {
      banner.style.display = 'none';
    }
  }
  window.verificarNaoConformidadesRonda = verificarNaoConformidadesRonda;

  function gerarOcorrenciaNaoConformidadesRonda() {
    var ncs = obterNaoConformidadesRonda();
    if (ncs.length === 0) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Tudo Conforme', 'Nenhuma não conformidade detectada para abertura de ocorrência.', 'info');
      }
      return;
    }

    var nomesStr = ncs.map(function (n) { return n.nome; }).join(', ');
    var descAuto = 'Não conformidade técnica registrada na Ronda Diária de Tecnologia (Uberlândia) pelo operador ' +
      getUsuarioAtual() + ' em ' + formatDataHoraLocal() + '.\n\nSistemas afetados:\n- ' +
      ncs.map(function (n) { return n.nome; }).join('\n- ') +
      '\n\nFavor verificar parâmetros e atuar na normalização dos equipamentos.';

    var popNova = document.getElementById('popup-nova-oc');
    if (popNova && typeof abrirPopup === 'function') {
      abrirPopup('popup-nova-oc');
      var titEl = document.getElementById('nova-titulo');
      var catEl = document.getElementById('nova-cat');
      var locEl = document.getElementById('nova-local');
      var descEl = document.getElementById('nova-desc');
      var prioEl = document.getElementById('nova-prio');

      if (titEl) titEl.value = 'Falha / Anomalia na Ronda UDI: ' + (ncs[0] ? ncs[0].nome : 'Sistemas');
      if (catEl) catEl.value = 'Equipamento';
      if (locEl) locEl.value = 'Uberlândia — Central / Transmissor';
      if (prioEl) prioEl.value = 'Alta';
      if (descEl) descEl.value = descAuto;
      if (titEl) setTimeout(function(){ titEl.focus(); }, 150);
    }
  }
  window.gerarOcorrenciaNaoConformidadesRonda = gerarOcorrenciaNaoConformidadesRonda;

  function salvarRelatorioRonda() {
    var dataEl = document.getElementById('ronda-data');
    var obsEl  = document.getElementById('ronda-obs');
    var potEl  = document.getElementById('ronda-pot-direta');
    var refEl  = document.getElementById('ronda-pot-refletida');
    var satRedeDb = document.getElementById('ronda-sat-rede-db');
    var satBhDb   = document.getElementById('ronda-sat-bh-db');
    var satSpDb   = document.getElementById('ronda-sat-sp-db');

    var dataVal = (dataEl && dataEl.value) ? dataEl.value : (new Date().toISOString().split('T')[0]);
    var obsVal  = obsEl ? obsEl.value.trim() : '';
    var potVal  = potEl ? potEl.value.trim() : '';
    var refVal  = refEl ? refEl.value.trim() : '';
    var ncs     = obterNaoConformidadesRonda();
    var usuario = getUsuarioAtual();
    var nowFmt  = formatDataHoraLocal();

    // Mapeamento dos status de todos os itens
    var statusMap = {};
    RONDA_ITEMS.forEach(function (item) {
      var group = document.querySelector('.ronda-toggle-group[data-item-id="' + item.id + '"]');
      if (group) {
        var activeBtn = group.querySelector('.ronda-btn-pill.active');
        if (activeBtn) {
          statusMap[item.id] = activeBtn.classList.contains('nc') ? 'NC' : 'C';
        } else {
          statusMap[item.id] = 'C'; // Padrão conforme
        }
      }
    });

    var resumoItens = [];
    if (potVal) resumoItens.push('Potência: ' + potVal + ' W (Refletida: ' + (refVal || '0') + ' W)');
    if (satRedeDb && satRedeDb.value) resumoItens.push('SAT Rede C/N: ' + satRedeDb.value + ' dB');
    if (ncs.length > 0) {
      resumoItens.push('⚠️ Não conformidades: ' + ncs.map(function(n){ return n.nome; }).join(', '));
    } else {
      resumoItens.push('✅ Todos os 26 sistemas avaliados em conformidade operacional.');
    }

    var descFinal = 'Relatório diário de tecnologia e ronda de infraestrutura executado em Uberlândia.\n\n' +
      resumoItens.join('\n') +
      (obsVal ? ('\n\nObservações do plantão:\n' + obsVal) : '');

    var novoRelatorio = {
      id:            'rel_udi_' + Date.now(),
      tipo:          'relatorio',
      subtipo:       'Tecnologia UDI',
      titulo:        'Relatório Diário — Tecnologia UDI (' + dataVal + ')',
      equipamento:   'Infraestrutura & Transmissão UDI',
      categoria:     'Ronda Técnica',
      local:         'Uberlândia',
      praca:         'Uberlândia',
      dataCriacao:   nowFmt,
      criadoPor:     usuario,
      descCriacao:   descFinal,
      status:        ncs.length > 0 ? 'Com Não Conformidade' : 'Conforme',
      tags:          ['Ronda Técnica', 'Uberlândia', ncs.length > 0 ? 'NC' : '100% Conforme'],
      detalhesRonda: {
        data: dataVal,
        operador: usuario,
        tempoSessao: (typeof getTempoLogadoStr === 'function') ? getTempoLogadoStr() : '',
        potenciaW: potVal,
        refletidaW: refVal,
        satRedeDb: satRedeDb ? satRedeDb.value : '',
        satBhDb: satBhDb ? satBhDb.value : '',
        satSpDb: satSpDb ? satSpDb.value : '',
        statusSistemas: statusMap,
        naoConformidades: ncs.map(function(n){ return n.nome; }),
        obs: obsVal
      }
    };

    // 1. Salvar no histórico de Uberlândia
    if (Array.isArray(window.historicoSeedData)) {
      window.historicoSeedData = [novoRelatorio].concat(window.historicoSeedData);
      if (typeof saveHistorico === 'function') {
        saveHistorico(window.historicoSeedData, novoRelatorio);
      }
    }

    // 2. Limpar rascunho
    try { localStorage.removeItem(RONDA_DRAFT_KEY); } catch(e) {}

    // 3. Notificar sucesso e re-renderizar histórico
    if (typeof renderAll === 'function') renderAll(true);

    if (typeof mostrarToast === 'function') {
      mostrarToast('Relatório Registrado', 'Relatório Diário de Tecnologia UDI gravado no Histórico com sucesso!', 'success');
    }

    // 4. Se houver NC, sugerir abrir ocorrência
    if (ncs.length > 0) {
      setTimeout(function () {
        if (confirm('O relatório foi salvo contendo ' + ncs.length + ' não conformidade(s).\n\nDeseja registrar uma ocorrência no Dashboard agora?')) {
          gerarOcorrenciaNaoConformidadesRonda();
        }
      }, 500);
    }
  }
  window.salvarRelatorioRonda = salvarRelatorioRonda;

  /* ── Rascunho Automático Local (Autosave para não perder nada ao fechar ou atualizar) ── */
  var saveDraftTimeout = null;
  function salvarRascunhoRondaDebounced() {
    clearTimeout(saveDraftTimeout);
    saveDraftTimeout = setTimeout(salvarRascunhoRonda, 400);
  }

  function salvarRascunhoRonda() {
    var container = document.getElementById('page-ronda');
    if (!container) return;

    var statusMap = {};
    RONDA_ITEMS.forEach(function (item) {
      var group = container.querySelector('.ronda-toggle-group[data-item-id="' + item.id + '"]');
      if (group) {
        var active = group.querySelector('.ronda-btn-pill.active');
        if (active) statusMap[item.id] = active.classList.contains('nc') ? 'nc' : 'conf';
      }
    });

    var draft = {
      data: document.getElementById('ronda-data') ? document.getElementById('ronda-data').value : '',
      obs: document.getElementById('ronda-obs') ? document.getElementById('ronda-obs').value : '',
      pot: document.getElementById('ronda-pot-direta') ? document.getElementById('ronda-pot-direta').value : '',
      ref: document.getElementById('ronda-pot-refletida') ? document.getElementById('ronda-pot-refletida').value : '',
      satRede: document.getElementById('ronda-sat-rede-db') ? document.getElementById('ronda-sat-rede-db').value : '',
      satBh: document.getElementById('ronda-sat-bh-db') ? document.getElementById('ronda-sat-bh-db').value : '',
      satSp: document.getElementById('ronda-sat-sp-db') ? document.getElementById('ronda-sat-sp-db').value : '',
      status: statusMap
    };

    try {
      localStorage.setItem(RONDA_DRAFT_KEY, JSON.stringify(draft));
    } catch(e) {}
  }

  function carregarRascunhoRonda() {
    var container = document.getElementById('page-ronda');
    if (!container) return;

    // Atualiza data atual se vazia
    var dataEl = document.getElementById('ronda-data');
    if (dataEl && !dataEl.value) {
      dataEl.value = new Date().toISOString().split('T')[0];
    }

    // Atualiza nome do operador se vazio
    var opEl = document.getElementById('ronda-operador-badge');
    if (opEl) {
      opEl.textContent = getUsuarioAtual();
    }

    try {
      var raw = localStorage.getItem(RONDA_DRAFT_KEY);
      if (!raw) return;
      var draft = JSON.parse(raw);
      if (!draft) return;

      if (draft.data && dataEl) dataEl.value = draft.data;
      if (draft.obs && document.getElementById('ronda-obs')) document.getElementById('ronda-obs').value = draft.obs;
      if (draft.pot && document.getElementById('ronda-pot-direta')) document.getElementById('ronda-pot-direta').value = draft.pot;
      if (draft.ref && document.getElementById('ronda-pot-refletida')) document.getElementById('ronda-pot-refletida').value = draft.ref;
      if (draft.satRede && document.getElementById('ronda-sat-rede-db')) document.getElementById('ronda-sat-rede-db').value = draft.satRede;
      if (draft.satBh && document.getElementById('ronda-sat-bh-db')) document.getElementById('ronda-sat-bh-db').value = draft.satBh;
      if (draft.satSp && document.getElementById('ronda-sat-sp-db')) document.getElementById('ronda-sat-sp-db').value = draft.satSp;

      if (draft.status && typeof draft.status === 'object') {
        Object.keys(draft.status).forEach(function (id) {
          var val = draft.status[id];
          var group = container.querySelector('.ronda-toggle-group[data-item-id="' + id + '"]');
          if (group) {
            var btn = group.querySelector('.ronda-btn-pill.' + val);
            if (btn) {
              group.querySelectorAll('.ronda-btn-pill').forEach(function(b){ b.classList.remove('active'); });
              btn.classList.add('active');
              var parent = group.closest('.ronda-item');
              if (parent) {
                if (val === 'nc') parent.classList.add('has-nc');
                else parent.classList.remove('has-nc');
              }
            }
          }
        });
      }
      verificarNaoConformidadesRonda();
    } catch(e) {}
  }
  window.carregarRascunhoRonda = carregarRascunhoRonda;

  // Registrar listeners de input para autosave nos campos numéricos
  document.addEventListener('DOMContentLoaded', function () {
    var container = document.getElementById('page-ronda');
    if (container) {
      container.addEventListener('input', salvarRascunhoRondaDebounced);
    }
  });

})();
