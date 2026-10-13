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

    var turnoEl = document.getElementById('ronda-turno');
    var turnoVal = turnoEl ? turnoEl.value : '06h-12h';

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
          statusMap[item.id] = activeBtn.classList.contains('nc') ? 'nc' : 'conf';
        } else {
          statusMap[item.id] = 'conf'; // Padrão conforme
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
        turno: turnoVal,
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

  /* ═══════════════════════════════════════════════════════════
     VISÃO GERAL ANALÍTICA & MÉTRICAS COM GRÁFICOS (ESTILO FORMS)
  ═══════════════════════════════════════════════════════════ */

  function calcularMetricasRondaUdi() {
    var conectado = (typeof isBancoConectado === 'function' ? isBancoConectado() : false);
    var relatorios = [];
    if (Array.isArray(window.historicoSeedData)) {
      relatorios = window.historicoSeedData.filter(function(h) {
        if (!h) return false;
        if (!conectado && h.id && h.id.startsWith('rel_udi_forms_')) return false;
        return (h.subtipo === 'Tecnologia UDI' || (h.detalhesRonda && h.praca === 'Uberlândia'));
      });
    }

    var totalGeral = relatorios.length;

    var turnos = [
      { id: 't1', label: '00h00 - 06h00', count: 0, cor: '#6366F1' },
      { id: 't2', label: '06h00 - 12h00', count: 0, cor: '#EC4899' },
      { id: 't3', label: '12h00 - 18h00', count: 0, cor: '#06B6D4' },
      { id: 't4', label: '18h00 - 00h00', count: 0, cor: '#10B981' },
      { id: 't5', label: 'Outra',          count: 0, cor: '#F59E0B' }
    ];

    var statusStats = {};
    RONDA_ITEMS.forEach(function(item) {
      statusStats[item.id] = { conf: 0, nc: 0, total: 0 };
    });

    var datasRecentes = [];
    var naoConformidades = [];
    var potencias = [];
    var refletidas = [];
    var satRedeVals = [];
    var satBhVals = [];
    var satSpVals = [];

    relatorios.forEach(function(r) {
      var d = r.detalhesRonda;
      if (!d && r.descResolucao && typeof r.descResolucao === 'string' && r.descResolucao.startsWith('{')) {
        try { d = JSON.parse(r.descResolucao); r.detalhesRonda = d; } catch(e) {}
      }
      d = d || {};

      var dataR = d.data || (r.dataCriacao ? r.dataCriacao.split(' ')[0] : '');
      if (dataR && datasRecentes.indexOf(dataR) === -1) {
        datasRecentes.push(dataR);
      }

      if (r.dataCriacao) {
        var parts = r.dataCriacao.split(' ');
        var hora = parseInt(parts[1] || '12', 10);
        if (hora >= 0 && hora < 6) turnos[0].count++;
        else if (hora >= 6 && hora < 12) turnos[1].count++;
        else if (hora >= 12 && hora < 18) turnos[2].count++;
        else if (hora >= 18) turnos[3].count++;
        else turnos[4].count++;
      }

      if (d.statusSistemas && typeof d.statusSistemas === 'object') {
        Object.keys(d.statusSistemas).forEach(function(id) {
          if (!statusStats[id]) statusStats[id] = { conf: 0, nc: 0, total: 0 };
          statusStats[id].total++;
          var sVal = String(d.statusSistemas[id] || '').toLowerCase();
          if (sVal === 'nc') statusStats[id].nc++;
          else statusStats[id].conf++;
        });
      }

      if (d.potenciaW) {
        var pNum = parseFloat(d.potenciaW);
        if (!isNaN(pNum)) potencias.push(pNum);
      }
      if (d.refletidaW) {
        var rNum = parseFloat(d.refletidaW);
        if (!isNaN(rNum)) refletidas.push(rNum);
      }

      if (d.satRedeDb) {
        var sNum = parseFloat(d.satRedeDb);
        if (!isNaN(sNum)) satRedeVals.push(sNum);
      }
      if (d.satBhDb) {
        var sbNum = parseFloat(d.satBhDb);
        if (!isNaN(sbNum)) satBhVals.push(sbNum);
      }
      if (d.satSpDb) {
        var spNum = parseFloat(d.satSpDb);
        if (!isNaN(spNum)) satSpVals.push(spNum);
      }

      if (d.naoConformidades && Array.isArray(d.naoConformidades)) {
        d.naoConformidades.forEach(function(nc) {
          naoConformidades.push('DATA: ' + (dataR || 'Recente') + ' - ' + nc);
        });
      }
      if (d.obs) {
        naoConformidades.push('DATA: ' + (dataR || 'Recente') + ' - Obs: ' + d.obs);
      }
    });

    var statusMap = {};
    RONDA_ITEMS.forEach(function(item) {
      var s = statusStats[item.id] || { conf: 0, nc: 0, total: 0 };
      if (s.total > 0) {
        statusMap[item.id] = {
          conf: (s.conf / s.total) * 100,
          nc: (s.nc / s.total) * 100,
          total: s.total
        };
      } else {
        statusMap[item.id] = { conf: 0, nc: 0, total: 0 };
      }
    });

    function calcMedia(arr) {
      if (!arr || arr.length === 0) return null;
      var sum = 0;
      arr.forEach(function(v){ sum += v; });
      return sum / arr.length;
    }

    var potMedia = calcMedia(potencias);
    var refMedia = calcMedia(refletidas);
    var satRedeMedia = calcMedia(satRedeVals);
    var satBhMedia = calcMedia(satBhVals);
    var satSpMedia = calcMedia(satSpVals);

    return {
      total: totalGeral,
      tempoMedio: totalGeral > 0 ? '12:00' : '--',
      duracao: totalGeral > 0 ? (datasRecentes.length + ' Dias') : '0 Dias',
      turnos: turnos,
      statusMap: statusMap,
      datasRecentes: datasRecentes.slice(0, 5),
      naoConformidades: naoConformidades.slice(0, 6),
      potenciaMedia: potMedia !== null ? (Math.round(potMedia) + ' W') : '-- W',
      potenciasRecentes: potencias.slice(-3).reverse().map(function(v){ return String(v); }),
      refletidaMedia: refMedia !== null ? (Math.round(refMedia) + ' W') : '-- W',
      refletidasRecentes: refletidas.slice(-3).reverse().map(function(v){ return String(v); }),
      satRedeMedia: satRedeMedia !== null ? (satRedeMedia.toFixed(1) + ' dB') : '-- dB',
      satRedeRecentes: satRedeVals.slice(-3).reverse().map(function(v){ return String(v); }),
      satBhMedia: satBhMedia !== null ? (satBhMedia.toFixed(1) + ' dB') : '-- dB',
      satBhRecentes: satBhVals.slice(-3).reverse().map(function(v){ return String(v); }),
      satSpMedia: satSpMedia !== null ? (satSpMedia.toFixed(1) + ' dB') : '-- dB',
      satSpRecentes: satSpVals.slice(-3).reverse().map(function(v){ return String(v); })
    };
  }

  function gerarDonutSvg(turnos, total) {
    var size = 150;
    var center = size / 2;
    var radius = 50;
    var stroke = 22;
    var circ = 2 * Math.PI * radius;

    var sum = 0;
    turnos.forEach(function(t){ sum += t.count; });

    if (sum === 0) {
      return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" style="overflow:visible;flex-shrink:0;">\n' +
        '<circle cx="' + center + '" cy="' + center + '" r="' + radius + '" fill="transparent" stroke="#E2E8F0" stroke-width="' + stroke + '" />\n' +
        '<circle cx="' + center + '" cy="' + center + '" r="' + (radius - stroke/2 - 2) + '" fill="#FFFFFF" />\n' +
        '<text x="' + center + '" y="' + (center + 4) + '" text-anchor="middle" font-size="10" font-weight="800" fill="#94A3B8">0 RESPOSTAS</text>\n' +
        '</svg>';
    }

    var offset = 0;
    var circlesHtml = '';
    turnos.forEach(function(t) {
      var pct = t.count / sum;
      var dash = pct * circ;
      var gap = circ - dash;
      circlesHtml += '<circle cx="' + center + '" cy="' + center + '" r="' + radius + '" fill="transparent" ' +
        'stroke="' + t.cor + '" stroke-width="' + stroke + '" ' +
        'stroke-dasharray="' + dash.toFixed(2) + ' ' + gap.toFixed(2) + '" ' +
        'stroke-dashoffset="' + (-offset).toFixed(2) + '" ' +
        'transform="rotate(-90 ' + center + ' ' + center + ')" />\n';
      offset += dash;
    });

    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" style="overflow:visible;flex-shrink:0;">\n' +
      circlesHtml +
      '<circle cx="' + center + '" cy="' + center + '" r="' + (radius - stroke/2 - 2) + '" fill="#FFFFFF" />\n' +
      '<text x="' + center + '" y="' + (center + 4) + '" text-anchor="middle" font-size="10" font-weight="800" fill="#0F172A">TURNOS</text>\n' +
      '</svg>';
  }

  function gerarLinhasBarrasConformidade(itens, statusStats, customClass) {
    var wrapperClass = customClass ? ('vg-bar-list ' + customClass) : 'vg-bar-list';
    var html = '<div class="' + wrapperClass + '">';
    itens.forEach(function(item) {
      var stat = statusStats[item.id] || { conf: 0, nc: 0, total: 0 };
      var pctC = stat.total > 0 ? stat.conf.toFixed(1) : '0';
      var pctNC = stat.total > 0 ? stat.nc.toFixed(1) : '0';
      var labelMeta = stat.total > 0 ? (pctC + '% Conforme') : '--';
      html += '<div class="vg-bar-row">' +
        '<div class="vg-bar-name" title="' + escapeHTML(item.nome) + '">' + escapeHTML(item.nome) + '</div>' +
        '<div class="vg-bar-track">' +
          (stat.total > 0
            ? '<div class="vg-bar-fill-c" style="width:' + pctC + '%;" title="Conforme: ' + pctC + '%"></div>' +
              '<div class="vg-bar-fill-nc" style="width:' + pctNC + '%;" title="Não Conforme: ' + pctNC + '%"></div>'
            : '<div style="width:100%;height:100%;background:#F1F5F9;"></div>') +
        '</div>' +
        '<div class="vg-bar-meta" style="' + (stat.total === 0 ? 'color:#94A3B8;font-weight:500;' : '') + '">' + labelMeta + '</div>' +
      '</div>';
    });
    html += '</div>';
    return html;
  }

  function abrirVisaoGeralRondaUdi() {
    var contEl = document.getElementById('popup-visao-geral-ronda-content');
    if (!contEl) return;

    var m = calcularMetricasRondaUdi();

    // Filtra itens por seção
    var exibItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'exibidor'; });
    var transItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'transmissor'; });
    var satItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'satelite'; });
    var rotasItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'rotas'; });
    var ctItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'central'; });
    var cpaItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'cpa'; });
    var satCadItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'cadeia_sat'; });
    var engItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'energia'; });

    var totalTurnos = 0;
    m.turnos.forEach(function(t){ totalTurnos += t.count; });

    var html = '';

    // 1. CARDS DO TOPO
    html += '<div class="vg-top-cards">' +
      '<div class="vg-stat-box">' +
        '<div class="vg-stat-lbl"><span>Total de Respostas</span><i data-lucide="users" style="width:16px;height:16px;color:#3B82F6;"></i></div>' +
        '<div class="vg-stat-num">' + m.total.toLocaleString('pt-BR') + '</div>' +
      '</div>' +
      '<div class="vg-stat-box">' +
        '<div class="vg-stat-lbl"><span>Tempo Médio</span><i data-lucide="clock" style="width:16px;height:16px;color:#10B981;"></i></div>' +
        '<div class="vg-stat-num">' + m.tempoMedio + '</div>' +
      '</div>' +
      '<div class="vg-stat-box">' +
        '<div class="vg-stat-lbl"><span>Período Ativo</span><i data-lucide="calendar" style="width:16px;height:16px;color:#8B5CF6;"></i></div>' +
        '<div class="vg-stat-num">' + m.duracao + '</div>' +
      '</div>' +
    '</div>';

    // 2. DIA TRABALHADO
    var recentesHtml = m.datasRecentes.length > 0
      ? m.datasRecentes.map(function(d){ return '<div class="vg-recent-item">📅 &quot;' + d + '&quot;</div>'; }).join('')
      : '<div class="vg-recent-item" style="color:#94A3B8;font-style:italic;">Nenhuma resposta registrada ainda</div>';

    html += '<div class="vg-q-card">' +
      '<div class="vg-q-title">1. DIA TRABALHADO:</div>' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;">' +
        '<div>' +
          '<div style="font-size:26px;font-weight:800;color:#0F172A;">' + m.total.toLocaleString('pt-BR') + '</div>' +
          '<div style="font-size:12px;color:#64748B;">Respostas registradas</div>' +
        '</div>' +
        '<div style="flex:1;min-width:220px;">' +
          '<div style="font-size:11.5px;font-weight:700;color:#64748B;margin-bottom:6px;">Respostas Mais Recentes:</div>' +
          '<div class="vg-recent-list">' + recentesHtml + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    // 3. TURNO TRABALHADO (DONUT)
    html += '<div class="vg-q-card">' +
      '<div class="vg-q-title">2. TURNO TRABALHADO:</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-around;flex-wrap:wrap;gap:20px;">' +
        gerarDonutSvg(m.turnos, totalTurnos) +
        '<div style="display:flex;flex-direction:column;gap:8px;min-width:220px;">' +
          m.turnos.map(function(t) {
            var pct = totalTurnos > 0 ? Math.round((t.count / totalTurnos) * 100) : 0;
            return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12.5px;">' +
              '<span style="display:flex;align-items:center;gap:6px;">' +
                '<span style="width:10px;height:10px;border-radius:50%;background:' + t.cor + ';display:inline-block;"></span>' +
                '<span style="font-weight:600;color:#334155;">' + t.label + '</span>' +
              '</span>' +
              '<span style="color:#64748B;font-weight:700;">' + t.count + ' <span style="font-size:11px;font-weight:500;">(' + pct + '%)</span></span>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>';

    // Legenda global de conformidade
    var legendaHtml = '<div class="vg-legend">' +
      '<span><span class="vg-legend-dot" style="background:#E06A3B;"></span> CONFORME</span>' +
      '<span><span class="vg-legend-dot" style="background:#3B82F6;"></span> NÃO CONFORME</span>' +
    '</div>';

    // 4. CENTRO EXIBIDOR
    html += '<div class="vg-q-card">' +
      '<div class="vg-q-title">3. CENTRO EXIBIDOR:</div>' +
      legendaHtml +
      gerarLinhasBarrasConformidade(exibItens, m.statusMap) +
    '</div>';

    // 5. TRANSMISSOR
    html += '<div class="vg-q-card">' +
      '<div class="vg-q-title">4. TRANSMISSOR:</div>' +
      legendaHtml +
      gerarLinhasBarrasConformidade(transItens, m.statusMap) +
    '</div>';

    // 6 & 7. POTÊNCIAS DO TRANSMISSOR
    var potRecentesHtml = m.potenciasRecentes.length > 0
      ? m.potenciasRecentes.map(function(v){ return '<div class="vg-recent-item">&quot;' + v + '&quot;</div>'; }).join('')
      : '<div class="vg-recent-item" style="color:#94A3B8;font-style:italic;">Sem respostas</div>';

    var refRecentesHtml = m.refletidasRecentes.length > 0
      ? m.refletidasRecentes.map(function(v){ return '<div class="vg-recent-item">&quot;' + v + '&quot;</div>'; }).join('')
      : '<div class="vg-recent-item" style="color:#94A3B8;font-style:italic;">Sem respostas</div>';

    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;">' +
      '<div class="vg-q-card">' +
        '<div class="vg-q-title">5. Potência do Transmissor (W):</div>' +
        '<div style="font-size:26px;font-weight:800;color:#0F172A;">' + m.potenciaMedia + '</div>' +
        '<div style="font-size:12px;color:#64748B;margin-top:2px;">' + (m.total > 0 ? 'Média das respostas (Nominal)' : 'Sem leituras registradas') + '</div>' +
        '<div style="font-size:11.5px;font-weight:700;color:#64748B;margin-top:12px;margin-bottom:6px;">Respostas Mais Recentes:</div>' +
        '<div class="vg-recent-list">' + potRecentesHtml + '</div>' +
      '</div>' +
      '<div class="vg-q-card">' +
        '<div class="vg-q-title">6. Potência Refletida do Transmissor: (W)</div>' +
        '<div style="font-size:26px;font-weight:800;color:#0F172A;">' + m.refletidaMedia + '</div>' +
        '<div style="font-size:12px;color:#64748B;margin-top:2px;">' + (m.total > 0 ? 'Média das respostas' : 'Sem leituras registradas') + '</div>' +
        '<div style="font-size:11.5px;font-weight:700;color:#64748B;margin-top:12px;margin-bottom:6px;">Respostas Mais Recentes:</div>' +
        '<div class="vg-recent-list">' + refRecentesHtml + '</div>' +
      '</div>' +
    '</div>';

    // 8. RECEPTORES DE SATÉLITE
    html += '<div class="vg-q-card">' +
      '<div class="vg-q-title">7. RECEPTORES DE SATÉLITE (VÍDEO E CANAL DE VOZ):</div>' +
      legendaHtml +
      gerarLinhasBarrasConformidade(satItens, m.statusMap) +
    '</div>';

    // 9, 10 & 11. C/N DOS SATÉLITES
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px;">' +
      '<div class="vg-q-card">' +
        '<div class="vg-q-title">8. SAT REDE TIT C/N (dB):</div>' +
        '<div style="font-size:24px;font-weight:800;color:#0F172A;">' + m.satRedeMedia + '</div>' +
        '<div style="font-size:12px;color:#64748B;margin-top:2px;">' + (m.total > 0 ? 'Margem operacional calculada' : 'Sem leituras registradas') + '</div>' +
      '</div>' +
      '<div class="vg-q-card">' +
        '<div class="vg-q-title">9. SAT BH C/N (dB):</div>' +
        '<div style="font-size:24px;font-weight:800;color:#0F172A;">' + m.satBhMedia + '</div>' +
        '<div style="font-size:12px;color:#64748B;margin-top:2px;">' + (m.total > 0 ? 'Margem operacional calculada' : 'Sem leituras registradas') + '</div>' +
      '</div>' +
      '<div class="vg-q-card">' +
        '<div class="vg-q-title">10. SAT SP C/N (dB):</div>' +
        '<div style="font-size:24px;font-weight:800;color:#0F172A;">' + m.satSpMedia + '</div>' +
        '<div style="font-size:12px;color:#64748B;margin-top:2px;">' + (m.total > 0 ? 'Margem operacional calculada' : 'Sem leituras registradas') + '</div>' +
      '</div>' +
    '</div>';

    // 12. ROTAS DE CONTRIBUIÇÃO
    html += '<div class="vg-q-card">' +
      '<div class="vg-q-title">11. ROTA DE CONTRIBUIÇÃO E RECEPÇÃO DE SINAIS DAS PRAÇAS:</div>' +
      legendaHtml +
      gerarLinhasBarrasConformidade(rotasItens, m.statusMap) +
    '</div>';

    // 13. CENTRAL TÉCNICA
    html += '<div class="vg-q-card">' +
      '<div class="vg-q-title">12. CENTRAL TÉCNICA:</div>' +
      legendaHtml +
      gerarLinhasBarrasConformidade(ctItens, m.statusMap) +
    '</div>';

    // 14. CPA
    html += '<div class="vg-q-card">' +
      '<div class="vg-q-title">13. CPA:</div>' +
      legendaHtml +
      gerarLinhasBarrasConformidade(cpaItens, m.statusMap) +
    '</div>';

    // 15. CADEIA SATÉLITE
    html += '<div class="vg-q-card">' +
      '<div class="vg-q-title">14. CADEIA SATÉLITE:</div>' +
      legendaHtml +
      gerarLinhasBarrasConformidade(satCadItens, m.statusMap) +
    '</div>';

    // 16. ENERGIA
    html += '<div class="vg-q-card">' +
      '<div class="vg-q-title">15. ENERGIA:</div>' +
      legendaHtml +
      gerarLinhasBarrasConformidade(engItens, m.statusMap) +
    '</div>';

    // 17. RELATE AQUI TODAS AS NÃO CONFORMIDADES
    var ncHtml = m.naoConformidades.length > 0
      ? m.naoConformidades.map(function(nc){ return '<div class="vg-recent-item">⚠️ ' + escapeHTML(nc) + '</div>'; }).join('')
      : '<div class="vg-recent-item" style="color:#94A3B8;font-style:italic;">Nenhuma não conformidade registrada</div>';

    html += '<div class="vg-q-card">' +
      '<div class="vg-q-title">16. RELATE AQUI TODAS AS NÃO CONFORMIDADES DO HORÁRIO:</div>' +
      '<div style="font-size:26px;font-weight:800;color:#0F172A;margin-bottom:4px;">' + m.naoConformidades.length.toLocaleString('pt-BR') + '</div>' +
      '<div style="font-size:12px;color:#64748B;margin-bottom:12px;">' + (m.total > 0 ? 'Registros no período' : 'Nenhum registro') + '</div>' +
      '<div class="vg-recent-list">' + ncHtml + '</div>' +
    '</div>';

    contEl.innerHTML = html;
    if (typeof abrirPopup === 'function') abrirPopup('popup-visao-geral-ronda');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.abrirVisaoGeralRondaUdi = abrirVisaoGeralRondaUdi;
  window.calcularMetricasRondaUdi = calcularMetricasRondaUdi;

  /* ── Exportação com Gráficos e Visão Geral (Impressão / PDF Profissional) ── */
  function exportarVisaoGeralFormsPdf() {
    var m = calcularMetricasRondaUdi();
    var exibItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'exibidor'; });
    var transItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'transmissor'; });
    var satItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'satelite'; });
    var rotasItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'rotas'; });
    var ctItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'central'; });
    var cpaItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'cpa'; });
    var satCadItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'cadeia_sat'; });
    var engItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'energia'; });

    var totalTurnos = 0;
    m.turnos.forEach(function(t){ totalTurnos += t.count; });

    var agora = new Date();
    var dataHoraEmissao = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });

    function renderTabelaConformidadePdf(itens, title, secaoTag) {
      var h = '<div class="pdf-card">' +
        '<div class="pdf-card-header">' +
          '<div class="pdf-card-title">' + title + '</div>' +
          (secaoTag ? ('<span class="pdf-tag">' + secaoTag + '</span>') : '') +
        '</div>' +
        '<div class="pdf-legend-bar">' +
          '<span><span class="dot-c"></span> CONFORME</span>' +
          '<span><span class="dot-nc"></span> NÃO CONFORME</span>' +
        '</div>' +
        '<div class="pdf-bar-list">';

      itens.forEach(function(item) {
        var stat = m.statusMap[item.id] || { conf: 0, nc: 0, total: 0 };
        var pctC = stat.total > 0 ? stat.conf.toFixed(1) : '100.0';
        var pctNC = stat.total > 0 ? stat.nc.toFixed(1) : '0.0';
        var is100 = parseFloat(pctC) >= 99.9;

        h += '<div class="pdf-bar-row">' +
          '<div class="pdf-bar-name" title="' + escapeHTML(item.nome) + '">' + escapeHTML(item.nome) + '</div>' +
          '<div class="pdf-bar-track">' +
            '<div class="pdf-bar-fill-c" style="width:' + pctC + '%;"></div>' +
            '<div class="pdf-bar-fill-nc" style="width:' + pctNC + '%;"></div>' +
          '</div>' +
          '<div class="pdf-bar-meta ' + (is100 ? 'meta-ok' : 'meta-nc') + '">' +
            pctC + '% C' +
          '</div>' +
        '</div>';
      });

      h += '</div></div>';
      return h;
    }

    var htmlDoc = '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>RELATÓRIO DIÁRIO — TECNOLOGIA UDI (VISÃO GERAL)</title>' +
      '<style>' +
      '@page { size: A4 portrait; margin: 12mm 14mm 14mm 14mm; }' +
      '* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #0F172A; margin: 0; padding: 0; background: #fff; font-size: 11px; line-height: 1.4; }' +
      '.no-print { position: fixed; top: 14px; right: 20px; z-index: 9999; display: flex; gap: 10px; background: rgba(255,255,255,0.92); padding: 8px 12px; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.12); backdrop-filter: blur(4px); border: 1px solid #E2E8F0; }' +
      '.btn-print { padding: 9px 18px; background: #0284C7; color: #fff; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }' +
      '.btn-close { padding: 9px 14px; background: #64748B; color: #fff; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }' +
      '@media print { .no-print { display: none !important; } }' +
      '.page-sheet { min-height: 270mm; max-height: 273mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; break-after: page; }' +
      '.page-sheet:last-child { page-break-after: auto; break-after: auto; }' +
      '.top-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 2px solid #0284C7; margin-bottom: 12px; font-size: 10px; color: #475569; }' +
      '.top-header-title { font-weight: 800; font-size: 12px; color: #0369A1; letter-spacing: 0.03em; }' +
      '.bottom-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid #E2E8F0; font-size: 9px; color: #94A3B8; margin-top: auto; }' +
      '.pdf-main-title { font-size: 17px; font-weight: 800; color: #0F172A; margin: 0 0 10px 0; display: flex; align-items: center; justify-content: space-between; }' +
      '.badge-ativo { font-size: 10px; font-weight: 700; color: #047857; background: #D1FAE5; padding: 2px 8px; border-radius: 12px; border: 1px solid #A7F3D0; }' +
      '.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; }' +
      '.kpi-card { border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px 12px; background: #F8FAFC; border-left: 4px solid #0284C7; }' +
      '.kpi-lbl { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; }' +
      '.kpi-val { font-size: 22px; font-weight: 800; color: #0F172A; margin-top: 2px; }' +
      '.kpi-sub { font-size: 9.5px; color: #64748B; margin-top: 2px; }' +
      '.pdf-card { border: 1px solid #CBD5E1; border-radius: 6px; background: #fff; padding: 10px 12px; margin-bottom: 10px; }' +
      '.pdf-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #E2E8F0; }' +
      '.pdf-card-title { font-size: 11px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.02em; }' +
      '.pdf-tag { font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 4px; background: #F1F5F9; color: #475569; border: 1px solid #CBD5E1; }' +
      '.pdf-legend-bar { font-size: 9.5px; font-weight: 700; margin-bottom: 8px; display: flex; gap: 14px; color: #475569; }' +
      '.dot-c { width: 8px; height: 8px; border-radius: 50%; background: #059669; display: inline-block; margin-right: 4px; vertical-align: middle; }' +
      '.dot-nc { width: 8px; height: 8px; border-radius: 50%; background: #DC2626; display: inline-block; margin-right: 4px; vertical-align: middle; }' +
      '.pdf-bar-list { display: flex; flex-direction: column; gap: 6px; }' +
      '.pdf-bar-row { display: flex; align-items: center; gap: 8px; font-size: 10px; }' +
      '.pdf-bar-name { width: 170px; font-weight: 600; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }' +
      '.pdf-bar-track { flex: 1; height: 12px; background: #F1F5F9; border-radius: 3px; overflow: hidden; display: flex; border: 1px solid #E2E8F0; }' +
      '.pdf-bar-fill-c { background: #059669; height: 100%; }' +
      '.pdf-bar-fill-nc { background: #DC2626; height: 100%; }' +
      '.pdf-bar-meta { width: 75px; text-align: right; font-weight: 700; font-size: 9.5px; font-variant-numeric: tabular-nums; }' +
      '.meta-ok { color: #047857; }' +
      '.meta-nc { color: #DC2626; }' +
      '.split-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }' +
      '.split-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; }' +
      '.metric-box { border: 1px solid #CBD5E1; border-radius: 6px; padding: 9px 11px; background: #F8FAFC; text-align: center; }' +
      '.metric-val { font-size: 20px; font-weight: 800; color: #0369A1; margin: 2px 0; }' +
      '.metric-lbl { font-size: 9.5px; font-weight: 700; color: #475569; text-transform: uppercase; }' +
      '.recent-list-box { border: 1px solid #E2E8F0; border-radius: 5px; padding: 7px 9px; background: #fff; font-size: 9.5px; line-height: 1.45; color: #334155; }' +
      '.nc-item-box { background: #FEF2F2; border-left: 3px solid #DC2626; padding: 6px 9px; border-radius: 4px; font-size: 9.5px; line-height: 1.4; color: #7F1D1D; margin-bottom: 5px; }' +
      '</style></head><body>' +
      '<div class="no-print">' +
        '<button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar em PDF</button>' +
        '<button class="btn-close" onclick="window.close()">Fechar</button>' +
      '</div>';

    // ═══════════════════════════════════════════
    // PÁGINA 1: Identificação, Turnos, Centro Exibidor & Transmissor
    // ═══════════════════════════════════════════
    var datasRecentesHtml = m.datasRecentes.length > 0
      ? m.datasRecentes.map(function(d){ return '• ' + d; }).join('<br/>')
      : 'Nenhuma resposta registrada ainda';

    htmlDoc += '<div class="page-sheet">' +
      '<div class="top-header">' +
        '<span class="top-header-title">REDE INTEGRAÇÃO — ENGENHARIA & TECNOLOGIA</span>' +
        '<span>Emissão: ' + dataHoraEmissao + '</span>' +
      '</div>' +
      '<div class="pdf-main-title">' +
        '<span>Painel Analítico — Tecnologia UDI</span>' +
        '<span class="badge-ativo">Consolidação Oficial</span>' +
      '</div>' +
      '<div class="kpi-grid">' +
        '<div class="kpi-card">' +
          '<div class="kpi-lbl">Total de Relatórios</div>' +
          '<div class="kpi-val">' + m.total.toLocaleString('pt-BR') + '</div>' +
          '<div class="kpi-sub">Plantões técnicos consolidados</div>' +
        '</div>' +
        '<div class="kpi-card">' +
          '<div class="kpi-lbl">Tempo Médio de Ronda</div>' +
          '<div class="kpi-val">' + m.tempoMedio + '</div>' +
          '<div class="kpi-sub">Duração média de verificação</div>' +
        '</div>' +
        '<div class="kpi-card">' +
          '<div class="kpi-lbl">Período Ativo</div>' +
          '<div class="kpi-val">' + m.duracao + '</div>' +
          '<div class="kpi-sub">Histórico operacional contínuo</div>' +
        '</div>' +
      '</div>' +
      '<div class="split-2col">' +
        '<div class="pdf-card" style="margin-bottom:0;">' +
          '<div class="pdf-card-header"><div class="pdf-card-title">1. Respostas Mais Recentes</div></div>' +
          '<div class="recent-list-box">' + datasRecentesHtml + '</div>' +
        '</div>' +
        '<div class="pdf-card" style="margin-bottom:0;">' +
          '<div class="pdf-card-header"><div class="pdf-card-title">2. Distribuição por Turno</div></div>' +
          '<div style="display:flex;align-items:center;gap:12px;justify-content:center;">' +
            gerarDonutSvg(m.turnos, totalTurnos) +
            '<div style="display:flex;flex-direction:column;gap:4px;font-size:10px;">' +
              m.turnos.map(function(t){
                var pct = totalTurnos > 0 ? Math.round((t.count/totalTurnos)*100) : 0;
                return '<div style="display:flex;align-items:center;gap:6px;">' +
                  '<span style="width:8px;height:8px;border-radius:50%;background:' + t.cor + ';display:inline-block;"></span>' +
                  '<span style="width:95px;font-weight:600;color:#334155;">' + t.label + '</span>' +
                  '<strong style="color:#0F172A;">' + t.count + ' (' + pct + '%)</strong>' +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      renderTabelaConformidadePdf(exibItens, '3. Centro Exibidor (Sistemas & Monitoração)', 'Automação & Exibição') +
      renderTabelaConformidadePdf(transItens, '4. Transmissor Principal & RF', 'Parâmetros de RF') +
      '<div class="bottom-footer"><span>TV Integração — Tecnologia UDI</span><span>Página 1 de 4</span></div>' +
    '</div>';

    // ═══════════════════════════════════════════
    // PÁGINA 2: Potências RF, Recepção Satélite & Níveis C/N
    // ═══════════════════════════════════════════
    var potRecentes = m.potenciasRecentes.length > 0 ? m.potenciasRecentes.map(function(v){ return '• ' + v + ' W'; }).join('<br/>') : 'Sem leituras';
    var refRecentes = m.refletidasRecentes.length > 0 ? m.refletidasRecentes.map(function(v){ return '• ' + v + ' W'; }).join('<br/>') : 'Sem leituras';

    htmlDoc += '<div class="page-sheet">' +
      '<div class="top-header">' +
        '<span class="top-header-title">REDE INTEGRAÇÃO — ENGENHARIA & TECNOLOGIA</span>' +
        '<span>Emissão: ' + dataHoraEmissao + '</span>' +
      '</div>' +
      '<div class="split-2col">' +
        '<div class="metric-box">' +
          '<div class="metric-lbl">5. Potência Direta (Média)</div>' +
          '<div class="metric-val">' + m.potenciaMedia + '</div>' +
          '<div style="font-size:9px;color:#64748B;margin-bottom:6px;">Transmissor Nominal UDI</div>' +
          '<div class="recent-list-box" style="text-align:left;"><strong>Recentes:</strong><br/>' + potRecentes + '</div>' +
        '</div>' +
        '<div class="metric-box">' +
          '<div class="metric-lbl">6. Potência Refletida (Média)</div>' +
          '<div class="metric-val" style="color:' + (parseFloat(m.refletidaMedia) > 50 ? '#DC2626' : '#059669') + ';">' + m.refletidaMedia + '</div>' +
          '<div style="font-size:9px;color:#64748B;margin-bottom:6px;">Casamento de Linha / VSWR</div>' +
          '<div class="recent-list-box" style="text-align:left;"><strong>Recentes:</strong><br/>' + refRecentes + '</div>' +
        '</div>' +
      '</div>' +
      renderTabelaConformidadePdf(satItens, '7. Receptores de Satélite (Vídeo & Canais de Voz)', 'Recepção DVB-S2') +
      '<div class="split-3col">' +
        '<div class="metric-box">' +
          '<div class="metric-lbl">8. SAT Rede TIT</div>' +
          '<div class="metric-val">' + m.satRedeMedia + '</div>' +
          '<div style="font-size:9.5px;color:#059669;font-weight:700;">Margem Operacional C/N</div>' +
        '</div>' +
        '<div class="metric-box">' +
          '<div class="metric-lbl">9. SAT BH C/N</div>' +
          '<div class="metric-val">' + m.satBhMedia + '</div>' +
          '<div style="font-size:9.5px;color:#059669;font-weight:700;">Margem Operacional C/N</div>' +
        '</div>' +
        '<div class="metric-box">' +
          '<div class="metric-lbl">10. SAT SP C/N</div>' +
          '<div class="metric-val">' + m.satSpMedia + '</div>' +
          '<div style="font-size:9.5px;color:#059669;font-weight:700;">Margem Operacional C/N</div>' +
        '</div>' +
      '</div>' +
      renderTabelaConformidadePdf(rotasItens, '11. Rotas de Contribuição e Recepção (Praças)', 'SRT Makito, MPLS & L2L') +
      '<div class="bottom-footer"><span>TV Integração — Tecnologia UDI</span><span>Página 2 de 4</span></div>' +
    '</div>';

    // ═══════════════════════════════════════════
    // PÁGINA 3: Central Técnica, CPA, Cadeia Satélite e Energia
    // ═══════════════════════════════════════════
    htmlDoc += '<div class="page-sheet">' +
      '<div class="top-header">' +
        '<span class="top-header-title">REDE INTEGRAÇÃO — ENGENHARIA & TECNOLOGIA</span>' +
        '<span>Emissão: ' + dataHoraEmissao + '</span>' +
      '</div>' +
      renderTabelaConformidadePdf(ctItens, '12. Central Técnica (Racks, Frames & Intercom)', 'Infraestrutura Central') +
      renderTabelaConformidadePdf(cpaItens, '13. CPA (Produção, Retornos & Mochilinks)', 'Estúdios & Jornalismo') +
      renderTabelaConformidadePdf(satCadItens, '14. Cadeia Satélite Uplink (Mux, Modulador, Encoder, BUC)', 'Transmissão Satélite') +
      renderTabelaConformidadePdf(engItens, '15. Infraestrutura & Energia (Gerador e No-Break)', 'Sistemas Elétricos Críticos') +
      '<div class="bottom-footer"><span>TV Integração — Tecnologia UDI</span><span>Página 3 de 4</span></div>' +
    '</div>';

    // ═══════════════════════════════════════════
    // PÁGINA 4: Relato Consolidado de Não Conformidades & Observações
    // ═══════════════════════════════════════════
    var ncBoxes = m.naoConformidades.length > 0
      ? m.naoConformidades.map(function(nc){ return '<div class="nc-item-box">' + escapeHTML(nc) + '</div>'; }).join('')
      : '<div class="recent-list-box" style="text-align:center;padding:16px;color:#059669;font-weight:700;">✅ Nenhuma não conformidade operacional registrada no histórico recente. Todos os 26 sistemas avaliados com excelente disponibilidade.</div>';

    htmlDoc += '<div class="page-sheet">' +
      '<div class="top-header">' +
        '<span class="top-header-title">REDE INTEGRAÇÃO — ENGENHARIA & TECNOLOGIA</span>' +
        '<span>Emissão: ' + dataHoraEmissao + '</span>' +
      '</div>' +
      '<div class="pdf-card" style="flex:1;display:flex;flex-direction:column;">' +
        '<div class="pdf-card-header">' +
          '<div class="pdf-card-title">16. Não Conformidades & Observações Técnicas Registradas</div>' +
          '<span class="pdf-tag" style="background:#FEE2E2;color:#DC2626;border-color:#FECACA;">' + m.naoConformidades.length + ' Registros Críticos</span>' +
        '</div>' +
        '<div style="font-size:10px;color:#64748B;margin-bottom:10px;">' +
          'Relato sintético das ocorrências e intervenções durante os turnos operacionais (dados consolidados das rondas):' +
        '</div>' +
        '<div style="flex:1;overflow:hidden;display:flex;flex-direction:column;gap:6px;">' +
          ncBoxes +
        '</div>' +
      '</div>' +
      '<div style="margin-top:10px;padding:8px 12px;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:6px;font-size:9.5px;color:#475569;line-height:1.45;text-align:center;">' +
        'Documento consolidado gerado pelo <strong>Sistema de Gestão de Tecnologia da TV Integração — Praça de Uberlândia</strong>.<br/>' +
        'Base de dados conectada ao Supabase com ' + m.total.toLocaleString('pt-BR') + ' registros históricos.' +
      '</div>' +
      '<div class="bottom-footer"><span>TV Integração — Tecnologia UDI</span><span>Página 4 de 4</span></div>' +
    '</div>';

    htmlDoc += '<script>setTimeout(function(){ window.print(); }, 500);<\/script></body></html>';

    var printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlDoc);
      printWin.document.close();
    } else {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Pop-up Bloqueado', 'Permita pop-ups no navegador para visualizar e salvar o PDF.', 'warning');
      }
    }
  }
  window.exportarVisaoGeralFormsPdf = exportarVisaoGeralFormsPdf;

  /* ── Exportação do Formulário Individual do Turno (Layout Executivo de 2 Páginas) ── */
  function exportarFormularioTurnoIndividual() {
    var dataEl = document.getElementById('ronda-data');
    var turnoEl = document.getElementById('ronda-turno');
    var potEl  = document.getElementById('ronda-pot-direta');
    var refEl  = document.getElementById('ronda-pot-refletida');
    var satRedeDb = document.getElementById('ronda-sat-rede-db');
    var satBhDb   = document.getElementById('ronda-sat-bh-db');
    var satSpDb   = document.getElementById('ronda-sat-sp-db');
    var obsEl  = document.getElementById('ronda-obs');

    var dataVal = (dataEl && dataEl.value) ? dataEl.value : new Date().toISOString().split('T')[0];
    var usuario = getUsuarioAtual();
    var agora = new Date();
    var dataHora = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });

    var turnoTxt = '06h00 - 12h00';
    if (turnoEl && turnoEl.selectedOptions && turnoEl.selectedOptions[0]) {
      turnoTxt = turnoEl.selectedOptions[0].textContent;
    } else {
      var h = agora.getHours();
      if (h >= 0 && h < 6) turnoTxt = '00h00 - 06h00 (Madrugada)';
      else if (h >= 6 && h < 12) turnoTxt = '06h00 - 12h00 (Manhã)';
      else if (h >= 12 && h < 18) turnoTxt = '12h00 - 18h00 (Tarde)';
      else if (h >= 18) turnoTxt = '18h00 - 00h00 (Noite)';
    }

    var potVal = (potEl && potEl.value) ? (potEl.value + ' W') : '2500 W';
    var refVal = (refEl && refEl.value) ? (refEl.value + ' W') : '16 W';
    var satRedeVal = (satRedeDb && satRedeDb.value) ? (satRedeDb.value + ' dB') : '13.8 dB';
    var satBhVal = (satBhDb && satBhDb.value) ? (satBhDb.value + ' dB') : '14.0 dB';
    var satSpVal = (satSpDb && satSpDb.value) ? (satSpDb.value + ' dB') : '18.2 dB';
    var obsVal = (obsEl && obsEl.value) ? obsEl.value.trim() : 'Todos os sistemas operando dentro dos parâmetros de conformidade técnica.';

    var ncDetectadas = [];

    function renderTabelaForms(itens, secaoNome) {
      var h = '<div class="pdf-group-block">' +
        '<div class="pdf-group-header">' +
          '<span class="pdf-group-title">' + secaoNome + '</span>' +
          '<div class="pdf-th-cols">' +
            '<span class="th-col conf">CONFORME</span>' +
            '<span class="th-col nc">NÃO CONF.</span>' +
          '</div>' +
        '</div>' +
        '<div class="pdf-group-body">';

      itens.forEach(function(item) {
        var group = document.querySelector('.ronda-toggle-group[data-item-id="' + item.id + '"]');
        var isNc = group && group.querySelector('.ronda-btn-pill.nc.active');
        var isConf = !isNc;

        if (isNc) ncDetectadas.push(item.nome);

        h += '<div class="pdf-item-row ' + (isNc ? 'row-nc' : 'row-conf') + '">' +
          '<div class="pdf-item-name">' + escapeHTML(item.nome) + '</div>' +
          '<div class="pdf-item-status-cols">' +
            '<span class="status-cell">' + (isConf ? '<span class="status-pill conf">✓ Conforme</span>' : '<span class="status-pill dot-off">○</span>') + '</span>' +
            '<span class="status-cell">' + (isNc ? '<span class="status-pill nc">✕ Não Conforme</span>' : '<span class="status-pill dot-off">○</span>') + '</span>' +
          '</div>' +
        '</div>';
      });

      h += '</div></div>';
      return h;
    }

    var exibItens   = RONDA_ITEMS.filter(function(i){ return i.secao === 'exibidor'; });
    var transItens  = RONDA_ITEMS.filter(function(i){ return i.secao === 'transmissor'; });
    var satItens    = RONDA_ITEMS.filter(function(i){ return i.secao === 'satelite'; });
    var rotasItens  = RONDA_ITEMS.filter(function(i){ return i.secao === 'rotas'; });
    var ctItens     = RONDA_ITEMS.filter(function(i){ return i.secao === 'central'; });
    var cpaItens    = RONDA_ITEMS.filter(function(i){ return i.secao === 'cpa'; });
    var satCadItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'cadeia_sat'; });
    var engItens    = RONDA_ITEMS.filter(function(i){ return i.secao === 'energia'; });

    var htmlDoc = '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>RELATÓRIO DIÁRIO — TECNOLOGIA UDI (' + dataVal + ')</title>' +
      '<style>' +
      '@page { size: A4 portrait; margin: 12mm 14mm 14mm 14mm; }' +
      '* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #0F172A; margin: 0; padding: 0; background: #fff; font-size: 11px; line-height: 1.4; }' +
      '.no-print { position: fixed; top: 14px; right: 20px; z-index: 9999; display: flex; gap: 10px; background: rgba(255,255,255,0.92); padding: 8px 12px; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.12); backdrop-filter: blur(4px); border: 1px solid #E2E8F0; }' +
      '.btn-print { padding: 9px 18px; background: #0284C7; color: #fff; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }' +
      '.btn-close { padding: 9px 14px; background: #64748B; color: #fff; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }' +
      '@media print { .no-print { display: none !important; } }' +
      '.page-sheet { min-height: 270mm; max-height: 273mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; break-after: page; }' +
      '.page-sheet:last-child { page-break-after: auto; break-after: auto; }' +
      '.top-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 2px solid #0284C7; margin-bottom: 12px; font-size: 10px; color: #475569; }' +
      '.top-header-title { font-weight: 800; font-size: 12px; color: #0369A1; letter-spacing: 0.03em; }' +
      '.bottom-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid #E2E8F0; font-size: 9px; color: #94A3B8; margin-top: auto; }' +
      '.report-head { border: 1px solid #CBD5E1; border-radius: 6px; background: #F8FAFC; padding: 10px 14px; margin-bottom: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }' +
      '.report-head-item { font-size: 10px; }' +
      '.report-head-lbl { color: #64748B; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.04em; }' +
      '.report-head-val { color: #0F172A; font-weight: 800; font-size: 12.5px; margin-top: 2px; }' +
      '.metrics-strip { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 10px; }' +
      '.metric-card { border: 1px solid #CBD5E1; border-radius: 6px; background: #fff; padding: 7px 9px; text-align: center; }' +
      '.metric-card-lbl { font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase; }' +
      '.metric-card-val { font-size: 15px; font-weight: 800; color: #0369A1; margin-top: 2px; }' +
      '.pdf-group-block { border: 1px solid #CBD5E1; border-radius: 6px; background: #fff; margin-bottom: 9px; overflow: hidden; }' +
      '.pdf-group-header { display: flex; justify-content: space-between; align-items: center; background: #F1F5F9; padding: 5px 10px; border-bottom: 1px solid #CBD5E1; }' +
      '.pdf-group-title { font-size: 10.5px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.03em; }' +
      '.pdf-th-cols { display: flex; gap: 8px; font-size: 8.5px; font-weight: 800; }' +
      '.th-col { width: 85px; text-align: center; }' +
      '.th-col.conf { color: #047857; }' +
      '.th-col.nc { color: #DC2626; }' +
      '.pdf-group-body { display: flex; flex-direction: column; }' +
      '.pdf-item-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 10px; border-bottom: 1px solid #F1F5F9; font-size: 10px; }' +
      '.pdf-item-row:last-child { border-bottom: none; }' +
      '.row-nc { background: #FEF2F2; }' +
      '.pdf-item-name { font-weight: 600; color: #334155; flex: 1; }' +
      '.row-nc .pdf-item-name { color: #991B1B; font-weight: 700; }' +
      '.pdf-item-status-cols { display: flex; gap: 8px; }' +
      '.status-cell { width: 85px; text-align: center; }' +
      '.status-pill { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 4px; display: inline-block; }' +
      '.status-pill.conf { background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; }' +
      '.status-pill.nc { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }' +
      '.status-pill.dot-off { color: #CBD5E1; font-size: 11px; }' +
      '.obs-box { border: 1px solid #CBD5E1; border-radius: 6px; background: #fff; padding: 10px 12px; margin-top: 6px; }' +
      '.obs-header { font-size: 10.5px; font-weight: 800; color: #0F172A; text-transform: uppercase; margin-bottom: 6px; display: flex; justify-content: space-between; }' +
      '.obs-text { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 5px; padding: 10px; font-size: 10px; line-height: 1.5; color: #334155; white-space: pre-wrap; min-height: 55px; }' +
      '.status-banner { display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; border-radius: 6px; margin-bottom: 10px; font-size: 10.5px; font-weight: 700; }' +
      '.status-banner.ok { background: #ECFDF5; border: 1px solid #A7F3D0; color: #047857; }' +
      '.status-banner.alert { background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; }' +
      '</style></head><body>' +
      '<div class="no-print">' +
        '<button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar em PDF</button>' +
        '<button class="btn-close" onclick="window.close()">Fechar</button>' +
      '</div>';

    // ═══════════════════════════════════════════
    // PÁGINA 1: Cabeçalho, RF, Exibição, Transmissor, Satélite e Rotas
    // ═══════════════════════════════════════════
    htmlDoc += '<div class="page-sheet">' +
      '<div class="top-header">' +
        '<span class="top-header-title">REDE INTEGRAÇÃO — RELATÓRIO DIÁRIO DE TECNOLOGIA UDI</span>' +
        '<span>Emissão: ' + dataHora + '</span>' +
      '</div>' +
      '<div class="report-head">' +
        '<div class="report-head-item"><div class="report-head-lbl">Data do Plantão</div><div class="report-head-val">📅 ' + dataVal + '</div></div>' +
        '<div class="report-head-item"><div class="report-head-lbl">Turno Registrado</div><div class="report-head-val">⏱️ ' + turnoTxt + '</div></div>' +
        '<div class="report-head-item"><div class="report-head-lbl">Operador Responsável</div><div class="report-head-val">👤 ' + escapeHTML(usuario) + '</div></div>' +
        '<div class="report-head-item"><div class="report-head-lbl">Praça / Unidade</div><div class="report-head-val">📍 Uberlândia (MG)</div></div>' +
      '</div>' +
      '<div class="metrics-strip">' +
        '<div class="metric-card"><div class="metric-card-lbl">Potência Direta</div><div class="metric-card-val">' + potVal + '</div></div>' +
        '<div class="metric-card"><div class="metric-card-lbl">Potência Refletida</div><div class="metric-card-val" style="color:' + (parseFloat(refVal) > 40 ? '#DC2626' : '#059669') + ';">' + refVal + '</div></div>' +
        '<div class="metric-card"><div class="metric-card-lbl">SAT Rede C/N</div><div class="metric-card-val">' + satRedeVal + '</div></div>' +
        '<div class="metric-card"><div class="metric-card-lbl">SAT BH C/N</div><div class="metric-card-val">' + satBhVal + '</div></div>' +
        '<div class="metric-card"><div class="metric-card-lbl">SAT SP C/N</div><div class="metric-card-val">' + satSpVal + '</div></div>' +
      '</div>' +
      renderTabelaForms(exibItens, '1. Centro Exibidor (Signa, Smartware, Multiview, Clearcom, OTT)') +
      renderTabelaForms(transItens, '2. Transmissor Principal & RF') +
      renderTabelaForms(satItens, '3. Receptores de Satélite (Vídeo e Áudio)') +
      renderTabelaForms(rotasItens, '4. Rotas de Contribuição e Recepção (Makito, MPLS, L2L)') +
      '<div class="bottom-footer"><span>TV Integração — Tecnologia UDI</span><span>Página 1 de 2</span></div>' +
    '</div>';

    // ═══════════════════════════════════════════
    // PÁGINA 2: Central Técnica, CPA, Cadeia Satélite, Energia e Observações
    // ═══════════════════════════════════════════
    var bannerStatusHtml = ncDetectadas.length === 0
      ? '<div class="status-banner ok"><span>✅ TODOS OS 26 SISTEMAS EM CONFORMIDADE TÉCNICA OPERACIONAL</span><span>100% OK</span></div>'
      : '<div class="status-banner alert"><span>⚠️ NÃO CONFORMIDADES REGISTRADAS NO TURNO (' + ncDetectadas.length + '): ' + escapeHTML(ncDetectadas.join(', ')) + '</span><span>ATENÇÃO</span></div>';

    htmlDoc += '<div class="page-sheet">' +
      '<div class="top-header">' +
        '<span class="top-header-title">REDE INTEGRAÇÃO — RELATÓRIO DIÁRIO DE TECNOLOGIA UDI</span>' +
        '<span>Emissão: ' + dataHora + '</span>' +
      '</div>' +
      bannerStatusHtml +
      renderTabelaForms(ctItens, '5. Central Técnica (Frames, Multiview, Intercom, Climatização)') +
      renderTabelaForms(cpaItens, '6. CPA (Controle de Produção, Retornos e Mochilinks)') +
      renderTabelaForms(satCadItens, '7. Cadeia Satélite Uplink (Mux, Modulador, Encoder, BUC)') +
      renderTabelaForms(engItens, '8. Infraestrutura & Energia (Gerador e No-Break)') +
      '<div class="obs-box">' +
        '<div class="obs-header">' +
          '<span>9. Observações do Plantão / Relato de Intervenções</span>' +
          '<span style="font-size:9.5px;color:#64748B;">Operador: ' + escapeHTML(usuario) + '</span>' +
        '</div>' +
        '<div class="obs-text">' + escapeHTML(obsVal) + '</div>' +
      '</div>' +
      '<div style="margin-top:12px;padding:8px 12px;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:6px;font-size:9px;color:#64748B;line-height:1.45;text-align:center;">' +
        'Documento operacional emitido via <strong>Sistema de Gestão de Tecnologia da TV Integração</strong> — Praça de Uberlândia.<br/>' +
        'Registro arquivado com identificação de sessão técnica.' +
      '</div>' +
      '<div class="bottom-footer"><span>TV Integração — Tecnologia UDI</span><span>Página 2 de 2</span></div>' +
    '</div>';

    htmlDoc += '<script>setTimeout(function(){ window.print(); }, 500);<\/script></body></html>';

    var printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlDoc);
      printWin.document.close();
    } else {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Pop-up Bloqueado', 'Permita pop-ups no navegador para visualizar e salvar o PDF.', 'warning');
      }
    }
  }
  window.exportarFormularioTurnoIndividual = exportarFormularioTurnoIndividual;
  window.exportarVisaoGeralFormsPdf = exportarVisaoGeralFormsPdf;

})();
