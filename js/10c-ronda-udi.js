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
    var relatorios = [];
    if (Array.isArray(window.historicoSeedData)) {
      relatorios = window.historicoSeedData.filter(function(h) {
        return h && (h.subtipo === 'Tecnologia UDI' || (h.detalhesRonda && h.praca === 'Uberlândia'));
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
      var d = r.detalhesRonda || {};

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

  function gerarLinhasBarrasConformidade(itens, statusStats) {
    var html = '<div class="vg-bar-list">';
    itens.forEach(function(item) {
      var stat = statusStats[item.id] || { conf: 0, nc: 0, total: 0 };
      var pctC = stat.total > 0 ? stat.conf.toFixed(1) : '0';
      var pctNC = stat.total > 0 ? stat.nc.toFixed(1) : '0';
      var labelMeta = stat.total > 0 ? (pctC + '% C') : '--';
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

  /* ── Exportação Idêntica ao Microsoft Forms (Impressão / PDF) ── */
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

    var dataHoraEmissao = new Date().toLocaleDateString('pt-BR') + ', ' + new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });

    var htmlDoc = '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>RELATÓRIO DIÁRIO - TECNOLOGIA UDI</title>' +
      '<style>' +
      '@page { size: A4 portrait; margin: 10mm 15mm; }' +
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1E293B; margin: 0; padding: 10px; background: #fff; font-size: 11px; }' +
      '.page-header-top { display: flex; justify-content: space-between; font-size: 10px; color: #64748B; margin-bottom: 25px; border-bottom: 1px solid #CBD5E1; padding-bottom: 6px; }' +
      '.page-footer-bot { display: flex; justify-content: space-between; font-size: 9px; color: #94A3B8; margin-top: 30px; border-top: 1px solid #E2E8F0; padding-top: 6px; }' +
      '.page-break { page-break-after: always; break-after: page; }' +
      '.main-title { font-size: 20px; font-weight: 700; color: #0F172A; margin: 0 0 16px 0; }' +
      '.badge-ativo { font-size: 11px; font-weight: 700; color: #15803D; background: #DCFCE7; padding: 2px 8px; border-radius: 10px; vertical-align: middle; margin-left: 8px; }' +
      '.stat-grid { display: flex; gap: 15px; margin-bottom: 25px; }' +
      '.stat-box { flex: 1; border: 1px solid #CBD5E1; border-radius: 8px; padding: 12px 16px; background: #fff; }' +
      '.stat-num { font-size: 26px; font-weight: 800; color: #0F172A; margin-top: 4px; }' +
      '.stat-lbl { font-size: 11px; font-weight: 600; color: #64748B; }' +
      '.q-block { margin-bottom: 24px; }' +
      '.q-title { font-size: 12px; font-weight: 700; color: #1E293B; margin-bottom: 10px; text-transform: uppercase; }' +
      '.legend { font-size: 10px; font-weight: 700; margin-bottom: 10px; display: flex; gap: 14px; }' +
      '.dot-c { width: 8px; height: 8px; border-radius: 50%; background: #E06A3B; display: inline-block; margin-right: 4px; }' +
      '.dot-nc { width: 8px; height: 8px; border-radius: 50%; background: #3B82F6; display: inline-block; margin-right: 4px; }' +
      '.bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }' +
      '.bar-name { width: 140px; font-size: 10.5px; font-weight: 600; color: #475569; text-transform: uppercase; }' +
      '.bar-track { flex: 1; height: 14px; background: #F1F5F9; border-radius: 2px; overflow: hidden; display: flex; }' +
      '.bar-fill-c { background: #E06A3B; height: 100%; }' +
      '.bar-fill-nc { background: #3B82F6; height: 100%; }' +
      '.bar-meta { width: 65px; font-size: 10.5px; font-weight: 700; color: #64748B; text-align: right; }' +
      '.recent-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px; font-size: 10.5px; line-height: 1.5; color: #334155; }' +
      '.no-print { position: fixed; top: 12px; right: 20px; z-index: 9999; display: flex; gap: 10px; }' +
      '@media print { .no-print { display: none !important; } }' +
      '</style></head><body>' +
      '<div class="no-print">' +
        '<button onclick="window.print()" style="padding:9px 18px;background:#2563EB;color:#fff;font-weight:700;border:none;border-radius:6px;cursor:pointer;box-shadow:0 3px 10px rgba(37,99,235,0.3);font-size:13px;">🖨️ Imprimir / Salvar em PDF</button>' +
        '<button onclick="window.close()" style="padding:9px 14px;background:#64748B;color:#fff;font-weight:600;border:none;border-radius:6px;cursor:pointer;font-size:13px;">Fechar</button>' +
      '</div>';

    // ═══ PÁGINA 1 ═══
    var datasPdfHtml = m.datasRecentes.length > 0
      ? m.datasRecentes.map(function(d){ return '&quot;' + d + '&quot;'; }).join('<br/>')
      : 'Nenhuma resposta registrada ainda';

    htmlDoc += '<div class="page-container">' +
      '<div class="page-header-top"><span>' + dataHoraEmissao + '</span><span>RELATÓRIO DIÁRIO - TECNOLOGIA UDI</span></div>' +
      '<div class="main-title">Visão Geral das Respostas <span class="badge-ativo">Ativo</span></div>' +
      '<div class="stat-grid">' +
        '<div class="stat-box"><div class="stat-lbl">Respostas</div><div class="stat-num">' + m.total.toLocaleString('pt-BR') + '</div></div>' +
        '<div class="stat-box"><div class="stat-lbl">Tempo Médio</div><div class="stat-num">' + m.tempoMedio + '</div></div>' +
        '<div class="stat-box"><div class="stat-lbl">Duração</div><div class="stat-num">' + m.duracao + '</div></div>' +
      '</div>' +
      '<div class="q-block">' +
        '<div class="q-title">1. DIA TRABALHADO:</div>' +
        '<div style="display:flex;justify-content:space-between;gap:20px;">' +
          '<div><div style="font-size:24px;font-weight:800;">' + m.total.toLocaleString('pt-BR') + '</div><div style="color:#64748B;">Respostas</div></div>' +
          '<div style="flex:1;"><div style="font-size:10px;font-weight:700;color:#64748B;margin-bottom:4px;">Respostas Mais Recentes</div>' +
            '<div class="recent-box">' + datasPdfHtml + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="q-block">' +
        '<div class="q-title">2. TURNO TRABALHADO:</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-around;gap:20px;">' +
          gerarDonutSvg(m.turnos, totalTurnos) +
          '<div style="display:flex;flex-direction:column;gap:6px;">' +
            m.turnos.map(function(t){
              var pct = totalTurnos > 0 ? Math.round((t.count/totalTurnos)*100) : 0;
              return '<div style="display:flex;align-items:center;gap:8px;font-size:11px;">' +
                '<span style="width:9px;height:9px;border-radius:50%;background:' + t.cor + ';display:inline-block;"></span>' +
                '<span style="width:110px;font-weight:600;">' + t.label + '</span>' +
                '<strong style="color:#475569;">' + t.count + ' (' + pct + '%)</strong>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="q-block">' +
        '<div class="q-title">3. CENTRO EXIBIDOR:</div>' +
        '<div class="legend"><span><span class="dot-c"></span> CONFORME</span><span><span class="dot-nc"></span> NÃO CONFORME</span></div>' +
        gerarLinhasBarrasConformidade(exibItens, m.statusMap) +
      '</div>' +
      '<div class="q-block">' +
        '<div class="q-title">4. TRANSMISSOR:</div>' +
        '<div class="legend"><span><span class="dot-c"></span> CONFORME</span><span><span class="dot-nc"></span> NÃO CONFORME</span></div>' +
        gerarLinhasBarrasConformidade(transItens, m.statusMap) +
      '</div>' +
      '<div class="page-footer-bot"><span>https://forms.cloud.microsoft/...</span><span>1/5</span></div>' +
    '</div><div class="page-break"></div>';

    // ═══ PÁGINA 2 ═══
    var potPdfRecentes = m.potenciasRecentes.length > 0
      ? m.potenciasRecentes.map(function(v){ return '&quot;' + v + '&quot;'; }).join('<br/>')
      : 'Sem leituras registradas';

    var refPdfRecentes = m.refletidasRecentes.length > 0
      ? m.refletidasRecentes.map(function(v){ return '&quot;' + v + '&quot;'; }).join('<br/>')
      : 'Sem leituras registradas';

    var satRedePdfRecentes = m.satRedeRecentes.length > 0
      ? m.satRedeRecentes.map(function(v){ return '&quot;' + v + '&quot;'; }).join('<br/>')
      : 'Sem leituras registradas';

    htmlDoc += '<div class="page-container">' +
      '<div class="page-header-top"><span>' + dataHoraEmissao + '</span><span>RELATÓRIO DIÁRIO - TECNOLOGIA UDI</span></div>' +
      '<div class="q-block">' +
        '<div class="q-title">5. Potência do Transmissor (W):</div>' +
        '<div style="display:flex;justify-content:space-between;gap:20px;">' +
          '<div><div style="font-size:24px;font-weight:800;">' + m.potenciaMedia + '</div><div style="color:#64748B;">' + (m.total > 0 ? 'Média calculada' : 'Sem registros') + '</div></div>' +
          '<div style="flex:1;"><div style="font-size:10px;font-weight:700;color:#64748B;margin-bottom:4px;">Respostas Mais Recentes</div>' +
            '<div class="recent-box">' + potPdfRecentes + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="q-block">' +
        '<div class="q-title">6. Potência Refletida do Transmissor: (W)</div>' +
        '<div style="display:flex;justify-content:space-between;gap:20px;">' +
          '<div><div style="font-size:24px;font-weight:800;">' + m.refletidaMedia + '</div><div style="color:#64748B;">' + (m.total > 0 ? 'Média calculada' : 'Sem registros') + '</div></div>' +
          '<div style="flex:1;"><div style="font-size:10px;font-weight:700;color:#64748B;margin-bottom:4px;">Respostas Mais Recentes</div>' +
            '<div class="recent-box">' + refPdfRecentes + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="q-block">' +
        '<div class="q-title">7. RECEPTORES DE SATÉLITE (VÍDEO E CANAL DE VOZ):</div>' +
        '<div class="legend"><span><span class="dot-c"></span> CONFORME</span><span><span class="dot-nc"></span> NÃO CONFORME</span></div>' +
        gerarLinhasBarrasConformidade(satItens, m.statusMap) +
      '</div>' +
      '<div class="q-block">' +
        '<div class="q-title">8. SAT REDE TIT C/N (dB):</div>' +
        '<div style="display:flex;justify-content:space-between;gap:20px;">' +
          '<div><div style="font-size:24px;font-weight:800;">' + m.satRedeMedia + '</div><div style="color:#64748B;">' + (m.total > 0 ? 'Média calculada' : 'Sem registros') + '</div></div>' +
          '<div style="flex:1;"><div style="font-size:10px;font-weight:700;color:#64748B;margin-bottom:4px;">Respostas Mais Recentes</div>' +
            '<div class="recent-box">' + satRedePdfRecentes + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="page-footer-bot"><span>https://forms.cloud.microsoft/...</span><span>2/5</span></div>' +
    '</div><div class="page-break"></div>';

    // ═══ PÁGINA 3 ═══
    var satBhPdfRecentes = m.satBhRecentes.length > 0
      ? m.satBhRecentes.map(function(v){ return '&quot;' + v + '&quot;'; }).join('<br/>')
      : 'Sem leituras registradas';

    var satSpPdfRecentes = m.satSpRecentes.length > 0
      ? m.satSpRecentes.map(function(v){ return '&quot;' + v + '&quot;'; }).join('<br/>')
      : 'Sem leituras registradas';

    htmlDoc += '<div class="page-container">' +
      '<div class="page-header-top"><span>' + dataHoraEmissao + '</span><span>RELATÓRIO DIÁRIO - TECNOLOGIA UDI</span></div>' +
      '<div class="q-block">' +
        '<div class="q-title">9. SAT BH C/N (dB):</div>' +
        '<div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:12px;">' +
          '<div><div style="font-size:24px;font-weight:800;">' + m.satBhMedia + '</div><div style="color:#64748B;">' + (m.total > 0 ? 'Média calculada' : 'Sem registros') + '</div></div>' +
          '<div style="flex:1;"><div style="font-size:10px;font-weight:700;color:#64748B;margin-bottom:4px;">Respostas Mais Recentes</div>' +
            '<div class="recent-box">' + satBhPdfRecentes + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:6px;padding:12px;font-size:11px;color:#334155;text-align:center;">' +
          'Média das leituras: <strong>' + m.satBhMedia + '</strong>' + (m.total > 0 ? ' (Faixa estável)' : ' (Sem leituras registradas)') +
        '</div>' +
      '</div>' +
      '<div class="q-block">' +
        '<div class="q-title">10. SAT SP C/N (dB):</div>' +
        '<div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:12px;">' +
          '<div><div style="font-size:24px;font-weight:800;">' + m.satSpMedia + '</div><div style="color:#64748B;">' + (m.total > 0 ? 'Média calculada' : 'Sem registros') + '</div></div>' +
          '<div style="flex:1;"><div style="font-size:10px;font-weight:700;color:#64748B;margin-bottom:4px;">Respostas Mais Recentes</div>' +
            '<div class="recent-box">' + satSpPdfRecentes + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:6px;padding:12px;font-size:11px;color:#334155;text-align:center;">' +
          'Média das leituras: <strong>' + m.satSpMedia + '</strong>' + (m.total > 0 ? ' (Qualidade de recepção)' : ' (Sem leituras registradas)') +
        '</div>' +
      '</div>' +
      '<div class="page-footer-bot"><span>https://forms.cloud.microsoft/...</span><span>3/5</span></div>' +
    '</div><div class="page-break"></div>';

    // ═══ PÁGINA 4 ═══
    htmlDoc += '<div class="page-container">' +
      '<div class="page-header-top"><span>' + dataHoraEmissao + '</span><span>RELATÓRIO DIÁRIO - TECNOLOGIA UDI</span></div>' +
      '<div class="q-block">' +
        '<div class="q-title">11. ROTA DE CONTRIBUIÇÃO E RECEPÇÃO DE SINAIS DAS PRAÇAS:</div>' +
        '<div class="legend"><span><span class="dot-c"></span> CONFORME</span><span><span class="dot-nc"></span> NÃO CONFORME</span></div>' +
        gerarLinhasBarrasConformidade(rotasItens, m.statusMap) +
      '</div>' +
      '<div class="q-block">' +
        '<div class="q-title">12. CENTRAL TÉCNICA:</div>' +
        '<div class="legend"><span><span class="dot-c"></span> CONFORME</span><span><span class="dot-nc"></span> NÃO CONFORME</span></div>' +
        gerarLinhasBarrasConformidade(ctItens, m.statusMap) +
      '</div>' +
      '<div class="q-block">' +
        '<div class="q-title">13. CPA:</div>' +
        '<div class="legend"><span><span class="dot-c"></span> CONFORME</span><span><span class="dot-nc"></span> NÃO CONFORME</span></div>' +
        gerarLinhasBarrasConformidade(cpaItens, m.statusMap) +
      '</div>' +
      '<div class="q-block">' +
        '<div class="q-title">14. CADEIA SATÉLITE:</div>' +
        '<div class="legend"><span><span class="dot-c"></span> CONFORME</span><span><span class="dot-nc"></span> NÃO CONFORME</span></div>' +
        gerarLinhasBarrasConformidade(satCadItens, m.statusMap) +
      '</div>' +
      '<div class="page-footer-bot"><span>https://forms.cloud.microsoft/...</span><span>4/5</span></div>' +
    '</div><div class="page-break"></div>';

    // ═══ PÁGINA 5 ═══
    var ncPdfHtml = m.naoConformidades.length > 0
      ? m.naoConformidades.map(function(nc){ return '<div>' + escapeHTML(nc) + '</div>'; }).join('')
      : '<div>Nenhuma não conformidade registrada.</div>';

    htmlDoc += '<div class="page-container">' +
      '<div class="page-header-top"><span>' + dataHoraEmissao + '</span><span>RELATÓRIO DIÁRIO - TECNOLOGIA UDI</span></div>' +
      '<div class="q-block">' +
        '<div class="q-title">15. ENERGIA:</div>' +
        '<div class="legend"><span><span class="dot-c"></span> CONFORME</span><span><span class="dot-nc"></span> NÃO CONFORME</span></div>' +
        gerarLinhasBarrasConformidade(engItens, m.statusMap) +
      '</div>' +
      '<div class="q-block">' +
        '<div class="q-title">16. RELATE AQUI TODAS AS NÃO CONFORMIDADES DO HORÁRIO:</div>' +
        '<div style="font-size:24px;font-weight:800;margin-bottom:8px;">' + m.naoConformidades.length.toLocaleString('pt-BR') + ' Registros</div>' +
        '<div class="recent-box" style="display:flex;flex-direction:column;gap:8px;">' + ncPdfHtml + '</div>' +
      '</div>' +
      '<div style="margin-top:40px;font-size:9.5px;color:#94A3B8;text-align:center;">' +
        'Este conteúdo foi consolidado pelo Sistema de Gestão de Tecnologia da TV Integração — Praça de Uberlândia.' +
      '</div>' +
      '<div class="page-footer-bot"><span>https://forms.cloud.microsoft/...</span><span>5/5</span></div>' +
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

  /* ── Exportação do Formulário Individual do Turno (4 páginas — estilo questionário Forms) ── */
  function exportarFormularioTurnoIndividual() {
    var dataEl = document.getElementById('ronda-data');
    var potEl  = document.getElementById('ronda-pot-direta');
    var refEl  = document.getElementById('ronda-pot-refletida');
    var satRedeDb = document.getElementById('ronda-sat-rede-db');
    var satBhDb   = document.getElementById('ronda-sat-bh-db');
    var satSpDb   = document.getElementById('ronda-sat-sp-db');
    var obsEl  = document.getElementById('ronda-obs');

    var dataVal = (dataEl && dataEl.value) ? dataEl.value : new Date().toISOString().split('T')[0];
    var usuario = getUsuarioAtual();
    var dataHora = new Date().toLocaleDateString('pt-BR') + ', ' + new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });

    // Determina turno pelo horário atual
    var h = new Date().getHours();
    var turnoCheck = [false, false, false, false, false];
    if (h >= 0 && h < 6) turnoCheck[0] = true;
    else if (h >= 6 && h < 12) turnoCheck[1] = true;
    else if (h >= 12 && h < 18) turnoCheck[2] = true;
    else if (h >= 18) turnoCheck[3] = true;
    else turnoCheck[4] = true;

    function renderTabelaForms(itens) {
      var h = '<table style="width:100%;border-collapse:collapse;margin-top:8px;">';
      h += '<thead><tr style="font-size:10.5px;color:#64748B;border-bottom:1px solid #E2E8F0;"><th style="text-align:left;padding:6px 4px;font-weight:600;">SISTEMA / EQUIPAMENTO</th><th style="width:110px;text-align:center;padding:6px 4px;font-weight:700;color:#059669;">CONFORME</th><th style="width:110px;text-align:center;padding:6px 4px;font-weight:700;color:#DC2626;">NÃO CONFORME</th></tr></thead>';
      h += '<tbody>';
      itens.forEach(function(item) {
        var group = document.querySelector('.ronda-toggle-group[data-item-id="' + item.id + '"]');
        var isNc = group && group.querySelector('.ronda-btn-pill.nc.active');
        var isConf = !isNc; // padrão conforme
        h += '<tr style="border-bottom:1px solid #F1F5F9;font-size:11px;">' +
          '<td style="padding:7px 4px;font-weight:600;color:#334155;">' + escapeHTML(item.nome) + '</td>' +
          '<td style="text-align:center;padding:7px 4px;">' + (isConf ? '<span style="color:#059669;font-size:14px;font-weight:800;">●</span>' : '<span style="color:#CBD5E1;font-size:14px;">○</span>') + '</td>' +
          '<td style="text-align:center;padding:7px 4px;">' + (isNc ? '<span style="color:#DC2626;font-size:14px;font-weight:800;">●</span>' : '<span style="color:#CBD5E1;font-size:14px;">○</span>') + '</td>' +
        '</tr>';
      });
      h += '</tbody></table>';
      return h;
    }

    var exibItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'exibidor'; });
    var transItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'transmissor'; });
    var satItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'satelite'; });
    var rotasItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'rotas'; });
    var ctItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'central'; });
    var cpaItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'cpa'; });
    var satCadItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'cadeia_sat'; });
    var engItens = RONDA_ITEMS.filter(function(i){ return i.secao === 'energia'; });

    var htmlDoc = '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>RELATÓRIO DIÁRIO - TECNOLOGIA UDI</title>' +
      '<style>' +
      '@page { size: A4 portrait; margin: 12mm 15mm; }' +
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1E293B; margin: 0; padding: 10px; background: #fff; font-size: 11px; }' +
      '.page-header-top { display: flex; justify-content: space-between; font-size: 10px; color: #64748B; margin-bottom: 20px; border-bottom: 1px solid #CBD5E1; padding-bottom: 6px; }' +
      '.page-footer-bot { display: flex; justify-content: space-between; font-size: 9px; color: #94A3B8; margin-top: 25px; border-top: 1px solid #E2E8F0; padding-top: 6px; }' +
      '.page-break { page-break-after: always; break-after: page; }' +
      '.form-title { font-size: 20px; font-weight: 700; color: #0F172A; text-align: center; margin: 20px 0 25px 0; }' +
      '.q-num { font-size: 12px; font-weight: 700; color: #1E293B; margin-bottom: 6px; margin-top: 16px; }' +
      '.radio-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 11px; }' +
      '.input-line { border: 1px solid #CBD5E1; border-radius: 4px; padding: 7px 10px; font-size: 11.5px; width: 100%; box-sizing: border-box; background: #FAFBFD; margin-top: 4px; }' +
      '.no-print { position: fixed; top: 12px; right: 20px; z-index: 9999; display: flex; gap: 10px; }' +
      '@media print { .no-print { display: none !important; } }' +
      '</style></head><body>' +
      '<div class="no-print">' +
        '<button onclick="window.print()" style="padding:9px 18px;background:#2563EB;color:#fff;font-weight:700;border:none;border-radius:6px;cursor:pointer;box-shadow:0 3px 10px rgba(37,99,235,0.3);font-size:13px;">🖨️ Imprimir / Salvar em PDF</button>' +
        '<button onclick="window.close()" style="padding:9px 14px;background:#64748B;color:#fff;font-weight:600;border:none;border-radius:6px;cursor:pointer;font-size:13px;">Fechar</button>' +
      '</div>';

    // ═══ PÁGINA 1 ═══
    htmlDoc += '<div class="page-container">' +
      '<div class="page-header-top"><span>' + dataHora + '</span><span>RELATÓRIO DIÁRIO - TECNOLOGIA UDI</span></div>' +
      '<div class="form-title">RELATÓRIO DIÁRIO - TECNOLOGIA UDI</div>' +
      '<p style="font-size:10px;color:#64748B;margin:0 0 14px 0;">* Obrigatória<br/>* Operador registrado: <strong>' + escapeHTML(usuario) + '</strong></p>' +
      '<div class="q-num">1. DIA TRABALHADO: *</div>' +
      '<div class="input-line">📅 ' + dataVal + '</div>' +
      '<div class="q-num">2. TURNO TRABALHADO: *</div>' +
      '<div class="radio-row">' + (turnoCheck[0] ? '🔘' : '⚪') + ' 00h00 - 06h00</div>' +
      '<div class="radio-row">' + (turnoCheck[1] ? '🔘' : '⚪') + ' 06h00 - 12h00</div>' +
      '<div class="radio-row">' + (turnoCheck[2] ? '🔘' : '⚪') + ' 12h00 - 18h00</div>' +
      '<div class="radio-row">' + (turnoCheck[3] ? '🔘' : '⚪') + ' 18h00 - 00h00</div>' +
      '<div class="radio-row">' + (turnoCheck[4] ? '🔘' : '⚪') + ' Outra</div>' +
      '<div class="q-num">3. CENTRO EXIBIDOR: *</div>' +
      renderTabelaForms(exibItens) +
      '<div class="q-num">4. TRANSMISSOR: *</div>' +
      renderTabelaForms(transItens) +
      '<div class="page-footer-bot"><span>https://forms.cloud.microsoft/...</span><span>1/4</span></div>' +
    '</div><div class="page-break"></div>';

    // ═══ PÁGINA 2 ═══
    htmlDoc += '<div class="page-container">' +
      '<div class="page-header-top"><span>' + dataHora + '</span><span>RELATÓRIO DIÁRIO - TECNOLOGIA UDI</span></div>' +
      '<div class="q-num">5. Potência do Transmissor (W): *</div>' +
      '<div class="input-line">' + ((potEl && potEl.value) ? (potEl.value + ' W') : '2500 W') + '</div>' +
      '<div class="q-num">6. Potência Refletida do Transmissor: (W) *</div>' +
      '<div class="input-line">' + ((refEl && refEl.value) ? (refEl.value + ' W') : '16 W') + '</div>' +
      '<div class="q-num">7. RECEPTORES DE SATÉLITE (VÍDEO E CANAL DE VOZ): *</div>' +
      renderTabelaForms(satItens) +
      '<div class="q-num">8. SAT REDE TIT C/N (dB): *</div>' +
      '<div class="input-line">' + ((satRedeDb && satRedeDb.value) ? (satRedeDb.value + ' dB') : '13.8 dB') + '</div>' +
      '<div class="q-num">9. SAT BH C/N (dB): *</div>' +
      '<div class="input-line">' + ((satBhDb && satBhDb.value) ? (satBhDb.value + ' dB') : '14.0 dB') + '</div>' +
      '<div class="q-num">10. SAT SP C/N (dB): *</div>' +
      '<div class="input-line">' + ((satSpDb && satSpDb.value) ? (satSpDb.value + ' dB') : '18.2 dB') + '</div>' +
      '<div class="q-num">11. ROTA DE CONTRIBUIÇÃO E RECEPÇÃO DE SINAIS DAS PRAÇAS</div>' +
      renderTabelaForms(rotasItens) +
      '<div class="page-footer-bot"><span>https://forms.cloud.microsoft/...</span><span>2/4</span></div>' +
    '</div><div class="page-break"></div>';

    // ═══ PÁGINA 3 ═══
    htmlDoc += '<div class="page-container">' +
      '<div class="page-header-top"><span>' + dataHora + '</span><span>RELATÓRIO DIÁRIO - TECNOLOGIA UDI</span></div>' +
      '<div class="q-num">12. CENTRAL TÉCNICA:</div>' +
      renderTabelaForms(ctItens) +
      '<div class="q-num">13. CPA:</div>' +
      renderTabelaForms(cpaItens) +
      '<div class="q-num">14. CADEIA SATÉLITE:</div>' +
      renderTabelaForms(satCadItens) +
      '<div class="q-num">15. ENERGIA:</div>' +
      renderTabelaForms(engItens) +
      '<div class="q-num">16. RELATE AQUI TODAS AS NÃO CONFORMIDADES DO HORÁRIO</div>' +
      '<div class="input-line" style="min-height:70px;white-space:pre-wrap;">' + ((obsEl && obsEl.value) ? escapeHTML(obsEl.value) : 'Tudo operando dentro dos parâmetros de conformidade técnica.') + '</div>' +
      '<div class="page-footer-bot"><span>https://forms.cloud.microsoft/...</span><span>3/4</span></div>' +
    '</div><div class="page-break"></div>';

    // ═══ PÁGINA 4 ═══
    htmlDoc += '<div class="page-container">' +
      '<div class="page-header-top"><span>' + dataHora + '</span><span>RELATÓRIO DIÁRIO - TECNOLOGIA UDI</span></div>' +
      '<div style="text-align:center;margin-top:120px;padding:30px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;">' +
        '<div style="font-size:18px;font-weight:700;color:#0F172A;margin-bottom:8px;">Relatório Registrado com Sucesso</div>' +
        '<p style="font-size:11.5px;color:#64748B;line-height:1.6;">' +
          'Os dados deste formulário foram autenticados e transmitidos para a base central de engenharia e tecnologia da TV Integração.<br/>' +
          'Operador Responsável: <strong>' + escapeHTML(usuario) + '</strong> | Praça: <strong>Uberlândia (MG)</strong>' +
        '</p>' +
      '</div>' +
      '<div style="margin-top:100px;font-size:9.5px;color:#94A3B8;text-align:center;">' +
        'Este conteúdo não é criado nem endossado pela Microsoft. Os dados que você enviar serão enviados ao proprietário do formulário.<br/>Microsoft Forms' +
      '</div>' +
      '<div class="page-footer-bot"><span>https://forms.cloud.microsoft/...</span><span>4/4</span></div>' +
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
