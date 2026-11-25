(function (window, document, TVApp) {
  'use strict';

  TVApp.registerModule('equipamentos', function (app) {
    var KEYS     = app.KEYS;
    var Security = app.Security;
    var Markers  = app.Markers;
    var Storage  = app.Storage;
    var EventBus = app.EventBus;
    var Session  = app.Session;
    var Store    = app.Store;
    var escapeHTML        = Security.escapeHTML;
    var escapeJSString    = Security.escapeJSString;
    var sanitizeMediaUrl  = Security.sanitizeMediaUrl;

    function getPracaAtual() { return typeof window.getPracaAtual === 'function' ? window.getPracaAtual() : 'Juiz de Fora'; }
    function getUsuarioAtual() { return Session.getUserName(); }
    function formatDataHoraLocal(v) { return typeof window.formatDataHoraLocal === 'function' ? window.formatDataHoraLocal(v) : new Date().toLocaleString('pt-BR'); }
    function abrirPopup(id) { if (typeof window.abrirPopup === 'function') window.abrirPopup(id); }
    function fecharPopup(id) { if (typeof window.fecharPopup === 'function') window.fecharPopup(id); }
    function mostrarToast(t, m, tp) { if (typeof window.mostrarToast === 'function') window.mostrarToast(t, m, tp); }
    function carregarDashboardMetricsStore() { if (typeof window.carregarDashboardMetricsStore === 'function') window.carregarDashboardMetricsStore(); }
    function salvarDashboardMetricsStore() { if (typeof window.salvarDashboardMetricsStore === 'function') window.salvarDashboardMetricsStore(); }
    function atualizarSelectsEquipamentosCTRS() { if (typeof window.atualizarSelectsEquipamentosCTRS === 'function') window.atualizarSelectsEquipamentosCTRS(); }
    function atualizarSelectEquipamentosNovaOc() { if (typeof window.atualizarSelectEquipamentosNovaOc === 'function') window.atualizarSelectEquipamentosNovaOc(); }
    function renderDashboards() { if (typeof window.renderDashboards === 'function') window.renderDashboards(); }
    function renderLixeira() { if (typeof window.renderLixeira === 'function') window.renderLixeira(); }
    function saveLixeira(l) { if (typeof window.saveLixeira === 'function') window.saveLixeira(l); }
    function salvarItemLixeiraNuvem(it) { return typeof window.salvarItemLixeiraNuvem === 'function' ? window.salvarItemLixeiraNuvem(it) : Promise.resolve(false); }
    function validarNova() { if (typeof window.validarNova === 'function') window.validarNova(); }
    function atualizarBotoesFiltroTimelineModal(a, b, c, d, e) { if (typeof window.atualizarBotoesFiltroTimelineModal === 'function') window.atualizarBotoesFiltroTimelineModal(a, b, c, d, e); }
    function renderCardsTimelineMistaHTML(a, b, c, d, e) { return typeof window.renderCardsTimelineMistaHTML === 'function' ? window.renderCardsTimelineMistaHTML(a, b, c, d, e) : ''; }

  var EQUIPAMENTOS_STORAGE_KEY = KEYS.EQUIPAMENTOS_CACHE;
  window._equipamentosSyncInicialConcluido = false;
  var TAGS_PADRAO_EQUIPAMENTOS = ['LiveU', 'Transmissão', 'Estúdio', 'Áudio', 'Vídeo', 'RF', 'Rede/Fibra', 'Satélite', 'Energia'];
  var EQUIPAMENTOS_SEED_JF = [
    { id: 'eq_jf_liveu1',  codigo_patrimonio: 'PAT-JF-001', numero_serie: 'SN-LU600-01', nome: 'LIVE U1',      categoria: 'Mochilink / LiveU', fabricante_modelo: 'LiveU LU600 HEVC',       praca: 'Juiz de Fora', setor_local: 'Jornalismo Externo', tags: ['LiveU', 'Transmissão'], status_operacional: 'operacional', obs_tecnicas: 'Unidade móvel principal para entradas ao vivo externas.' },
    { id: 'eq_jf_liveu2',  codigo_patrimonio: 'PAT-JF-002', numero_serie: 'SN-LU600-02', nome: 'LIVE U2',      categoria: 'Mochilink / LiveU', fabricante_modelo: 'LiveU LU600 HEVC',       praca: 'Juiz de Fora', setor_local: 'Jornalismo Externo', tags: ['LiveU', 'Transmissão'], status_operacional: 'operacional', obs_tecnicas: 'Unidade móvel de reportagem externa.' },
    { id: 'eq_jf_liveu3',  codigo_patrimonio: 'PAT-JF-003', numero_serie: 'SN-LU600-03', nome: 'LIVE U3',      categoria: 'Mochilink / LiveU', fabricante_modelo: 'LiveU LU600 HEVC',       praca: 'Juiz de Fora', setor_local: 'Jornalismo Externo', tags: ['LiveU', 'Transmissão'], status_operacional: 'operacional', obs_tecnicas: 'Unidade móvel de reportagem externa.' },
    { id: 'eq_jf_liveu4',  codigo_patrimonio: 'PAT-JF-004', numero_serie: 'SN-LU300-04', nome: 'LIVE U4',      categoria: 'Mochilink / LiveU', fabricante_modelo: 'LiveU LU300 Compact',    praca: 'Juiz de Fora', setor_local: 'Jornalismo Externo', tags: ['LiveU', 'Transmissão'], status_operacional: 'operacional', obs_tecnicas: 'Mochilink compacto para transmissões ágeis.' },
    { id: 'eq_jf_lusmart', codigo_patrimonio: 'PAT-JF-005', numero_serie: 'SN-SMART-01', nome: 'LIVE U SMART', categoria: 'Mochilink / LiveU', fabricante_modelo: 'LiveU Smart Mobile',     praca: 'Juiz de Fora', setor_local: 'Jornalismo Externo', tags: ['LiveU', 'Transmissão'], status_operacional: 'operacional', obs_tecnicas: 'Licença de transmissão via smartphone para plantão.' },
    { id: 'eq_jf_redacao', codigo_patrimonio: 'PAT-JF-006', numero_serie: 'SN-STUDIO-01',nome: 'REDAÇÃO',      categoria: 'Câmera / Estúdio',  fabricante_modelo: 'Ponto Fixo SDI Redação', praca: 'Juiz de Fora', setor_local: 'Redação Jornalismo', tags: ['Estúdio', 'Vídeo'],     status_operacional: 'operacional', obs_tecnicas: 'Ponto de câmera fixa e áudio no estúdio da redação.' },
    { id: 'eq_jf_kmj',     codigo_patrimonio: 'PAT-JF-007', numero_serie: 'SN-KMJ-001',  nome: 'KMJ',          categoria: 'Infraestrutura',    fabricante_modelo: 'Enlace Dedicado KMJ',    praca: 'Juiz de Fora', setor_local: 'Central Técnica / MCR', tags: ['Rede/Fibra', 'Transmissão'], status_operacional: 'operacional', obs_tecnicas: 'Rota de contribuição e enlace dedicado.' },
    { id: 'eq_jf_netpraca',codigo_patrimonio: 'PAT-JF-008', numero_serie: 'SN-NET-001',  nome: 'NET PRAÇA',    categoria: 'Link de Internet',  fabricante_modelo: 'Fibra Dedicada Praça',   praca: 'Juiz de Fora', setor_local: 'Externo / Praça',   tags: ['Rede/Fibra'],            status_operacional: 'operacional', obs_tecnicas: 'Ponto de rede externa para transmissões na praça.' },
    { id: 'eq_jf_netport', codigo_patrimonio: 'PAT-JF-009', numero_serie: 'SN-NET-002',  nome: 'NET PORTARIA', categoria: 'Link de Internet',  fabricante_modelo: 'Ponto Rede Portaria',    praca: 'Juiz de Fora', setor_local: 'Portaria Principal', tags: ['Rede/Fibra'],            status_operacional: 'operacional', obs_tecnicas: 'Ponto de conectividade próximo à portaria.' },
    { id: 'eq_jf_fmtnet',  codigo_patrimonio: 'PAT-JF-010', numero_serie: 'SN-NET-003',  nome: 'FORMATOS NET', categoria: 'Link de Internet',  fabricante_modelo: 'Codec / Link IP Formatos',praca: 'Juiz de Fora', setor_local: 'Central Técnica',   tags: ['Rede/Fibra', 'Vídeo'],  status_operacional: 'operacional', obs_tecnicas: 'Recepção e envio de formatos via rede IP.' },
    { id: 'eq_jf_net2',    codigo_patrimonio: 'PAT-JF-011', numero_serie: 'SN-SW-2AND',  nome: 'NET 2º ANDAR', categoria: 'Link de Internet',  fabricante_modelo: 'Switch / Ponto 2º Andar',praca: 'Juiz de Fora', setor_local: '2º Andar',          tags: ['Rede/Fibra'],            status_operacional: 'operacional', obs_tecnicas: 'Infraestrutura de rede do 2º andar.' },
    { id: 'eq_jf_net3',    codigo_patrimonio: 'PAT-JF-012', numero_serie: 'SN-SW-3AND',  nome: 'NET 3º ANDAR', categoria: 'Link de Internet',  fabricante_modelo: 'Switch / Ponto 3º Andar',praca: 'Juiz de Fora', setor_local: '3º Andar',          tags: ['Rede/Fibra'],            status_operacional: 'operacional', obs_tecnicas: 'Infraestrutura de rede do 3º andar.' },
    { id: 'eq_jf_net4',    codigo_patrimonio: 'PAT-JF-013', numero_serie: 'SN-SW-4AND',  nome: 'NET 4º ANDAR', categoria: 'Link de Internet',  fabricante_modelo: 'Switch / Ponto 4º Andar',praca: 'Juiz de Fora', setor_local: '4º Andar',          tags: ['Rede/Fibra'],            status_operacional: 'operacional', obs_tecnicas: 'Infraestrutura de rede do 4º andar.' }
  ];
  var catalogoEquipamentos = Store.catalogoEquipamentos || [];
  var filtroEquipamentoTag = 'todos';
  var tagsSelecionadasModalEq = [];
  var fotoUrlModalEq = '';
  var dadosTagsModalEq = {};
  var eqFichaAbertaId = null;
  var liveuModalTargetEqId = null;
  var liveuSlotsDraft = [];
  var redeModalTargetEqId = null;
  function safeEqMedia(src) {
    if (!src || typeof src !== 'string') return '';
    return (typeof sanitizeMediaUrl === 'function') ? sanitizeMediaUrl(src) : escapeHTML(src);
  }
  function normalizarDadosLiveU(raw) {
    if (!raw || typeof raw !== 'object') {
      return { chips_modens_tv: '', obs_geral: '', slots: [] };
    }
    var slotsArr = Array.isArray(raw.slots) ? raw.slots.map(function(s) {
      if (!s || typeof s !== 'object') return null;
      return {
        operadora: String(s.operadora || 'Vivo').trim(),
        numero_chip: String(s.numero_chip || '').trim(),
        telefone: String(s.telefone || '').trim(),
        imei: String(s.imei || '').trim(),
        inserido: String(s.inserido || 'Desconhecido').trim(),
        imagens: Array.isArray(s.imagens) ? s.imagens.filter(Boolean) : []
      };
    }).filter(Boolean) : [];
    return {
      chips_modens_tv: String(raw.chips_modens_tv || '').trim(),
      obs_geral: String(raw.obs_geral || '').trim(),
      slots: slotsArr
    };
  }
  function normalizarDadosRede(raw) {
    if (!raw || typeof raw !== 'object') {
      return {
        ip_gerencia: '',
        gateway_vlan: '',
        switch_porta: '',
        provedor_circuito: '',
        velocidade: '',
        obs_rede: ''
      };
    }
    return {
      ip_gerencia: String(raw.ip_gerencia || '').trim(),
      gateway_vlan: String(raw.gateway_vlan || '').trim(),
      switch_porta: String(raw.switch_porta || '').trim(),
      provedor_circuito: String(raw.provedor_circuito || '').trim(),
      velocidade: String(raw.velocidade || '').trim(),
      obs_rede: String(raw.obs_rede || '').trim()
    };
  }
  function normalizarTagsEquipamento(tagsRaw) {
    if (!Array.isArray(tagsRaw)) return [];
    var vistos = {};
    var limpas = [];
    tagsRaw.forEach(function(t) {
      var limpa = String(t || '').replace(/^#+/, '').trim();
      if (!limpa) return;
      var chave = limpa.toLowerCase();
      if (!vistos[chave]) {
        vistos[chave] = true;
        limpas.push(limpa);
      }
    });
    return limpas;
  }
  function sanitizarEquipamento(eq) {
    if (!eq || !eq.nome) return null;
    var nomeUp = String(eq.nome).trim().toUpperCase();
    var p = (eq.praca && String(eq.praca).indexOf('Uber') !== -1) ? 'Uberlândia' : 'Juiz de Fora';
    var tagsArr = normalizarTagsEquipamento(eq.tags);
    var metRaw = (eq.metricas && typeof eq.metricas === 'object') ? eq.metricas : { conf: 0, nc: 0, canc: 0 };
    var ordemVal = (typeof eq.ordem === 'number') ? eq.ordem : (typeof metRaw.ordem === 'number' ? metRaw.ordem : undefined);
    var exibirRel = (typeof eq.exibir_nos_relatorios === 'boolean')
      ? eq.exibir_nos_relatorios
      : ((typeof metRaw.exibir_nos_relatorios === 'boolean') ? metRaw.exibir_nos_relatorios : true);
    var fotoVal = String(eq.foto_url || metRaw.foto_url || '').trim();
    var dadosTagsRaw = (eq.dados_tags && typeof eq.dados_tags === 'object')
      ? eq.dados_tags
      : ((metRaw.dados_tags && typeof metRaw.dados_tags === 'object') ? metRaw.dados_tags : {});
    var dadosTagsClean = {};
    if (dadosTagsRaw.liveu) {
      dadosTagsClean.liveu = normalizarDadosLiveU(dadosTagsRaw.liveu);
    }
    if (dadosTagsRaw.rede) {
      dadosTagsClean.rede = normalizarDadosRede(dadosTagsRaw.rede);
    }
    var histEdRaw = Array.isArray(eq.historico_edicoes)
      ? eq.historico_edicoes
      : (Array.isArray(metRaw.historico_edicoes) ? metRaw.historico_edicoes : []);
    var numMetAt = Number(metRaw.atualizado_em || 0);
    var numEqAt = (typeof eq.atualizado_em === 'number') ? eq.atualizado_em : (Date.parse(eq.atualizado_em || '') || 0);
    var atualizadoVal = Math.max(isNaN(numMetAt) ? 0 : numMetAt, isNaN(numEqAt) ? 0 : numEqAt);
    var metObj = {
      conf: metRaw.conf || 0,
      nc: metRaw.nc || 0,
      canc: metRaw.canc || 0,
      exibir_nos_relatorios: exibirRel,
      foto_url: fotoVal,
      dados_tags: dadosTagsClean,
      historico_edicoes: histEdRaw,
      atualizado_em: atualizadoVal
    };
    if (typeof ordemVal === 'number') {
      metObj.ordem = ordemVal;
    }
    return {
      id: eq.id || ('eq_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
      codigo_patrimonio: (eq.codigo_patrimonio || eq.plaqueta || '').trim(),
      numero_serie: (eq.numero_serie || eq.serie || '').trim(),
      nome: nomeUp,
      categoria: eq.categoria || eq.tipo || 'Mochilink / LiveU',
      fabricante_modelo: (eq.fabricante_modelo || eq.modelo || '').trim(),
      praca: p,
      setor_local: (eq.setor_local || eq.local || 'Central Técnica').trim(),
      tags: tagsArr,
      status_operacional: eq.status_operacional || 'operacional',
      exibir_nos_relatorios: exibirRel,
      foto_url: fotoVal,
      dados_tags: dadosTagsClean,
      historico_edicoes: histEdRaw,
      atualizado_em: atualizadoVal,
      obs_tecnicas: (eq.obs_tecnicas || eq.obs || '').trim(),
      ordem: ordemVal,
      metricas: metObj,
      _dirtyLocal: !!eq._dirtyLocal,
      criado_por: eq.criado_por || 'Sistema',
      criado_em: eq.criado_em || Date.now()
    };
  }
  var ORDEM_EQUIPAMENTOS_STORAGE_KEY = 'tv_equipamentos_ordem_custom_v1';
  function salvarOrdemPersonalizadaEquipamentos(pracaAtiva, listaNomes) {
    try {
      var isUdi = String(pracaAtiva || '').indexOf('Uber') !== -1;
      var chavePraca = isUdi ? 'udi' : 'jf';
      var raw = localStorage.getItem(ORDEM_EQUIPAMENTOS_STORAGE_KEY);
      var obj = raw ? JSON.parse(raw) : {};
      if (!obj || typeof obj !== 'object') obj = {};
      obj[chavePraca] = listaNomes;
      localStorage.setItem(ORDEM_EQUIPAMENTOS_STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {}
  }
  function aplicarOrdemPersonalizadaNoCatalogo() {
    var posSeedJF = {};
    EQUIPAMENTOS_SEED_JF.forEach(function(s, i) { posSeedJF[s.nome] = i; });
    var temOrdemCustomJF = false;
    var temOrdemCustomUDI = false;
    try {
      var raw = localStorage.getItem(ORDEM_EQUIPAMENTOS_STORAGE_KEY);
      var obj = raw ? JSON.parse(raw) : null;
      if (obj && typeof obj === 'object') {
        ['jf', 'udi'].forEach(function(chavePraca) {
          var lista = obj[chavePraca];
          if (Array.isArray(lista) && lista.length > 0) {
            if (chavePraca === 'jf') temOrdemCustomJF = true;
            if (chavePraca === 'udi') temOrdemCustomUDI = true;
            catalogoEquipamentos.forEach(function(eq) {
              if (!eq) return;
              var eqUdi = String(eq.praca || '').indexOf('Uber') !== -1;
              if ((chavePraca === 'udi') === eqUdi) {
                var idx = lista.indexOf(eq.nome);
                if (idx !== -1) {
                  eq.ordem = idx;
                  if (!eq.metricas || typeof eq.metricas !== 'object') eq.metricas = { conf: 0, nc: 0, canc: 0 };
                  eq.metricas.ordem = idx;
                }
              }
            });
          }
        });
      }
    } catch (e) {}
    var itensJF = (catalogoEquipamentos || []).filter(function(eq) {
      return eq && String(eq.praca || '').indexOf('Uber') === -1;
    });
    var algumSemOrdemJF = itensJF.some(function(eq) { return typeof eq.ordem !== 'number'; });
    if (!temOrdemCustomJF && algumSemOrdemJF) {
      itensJF.forEach(function(eq) {
        if (posSeedJF[eq.nome] !== undefined) {
          eq.ordem = posSeedJF[eq.nome];
          if (!eq.metricas || typeof eq.metricas !== 'object') eq.metricas = { conf: 0, nc: 0, canc: 0 };
          eq.metricas.ordem = eq.ordem;
        }
      });
    }
    catalogoEquipamentos.sort(function(a, b) {
      if (!a || !b) return 0;
      var oa = (typeof a.ordem === 'number') ? a.ordem : (posSeedJF[a.nome] !== undefined ? posSeedJF[a.nome] : 999999);
      var ob = (typeof b.ordem === 'number') ? b.ordem : (posSeedJF[b.nome] !== undefined ? posSeedJF[b.nome] : 999999);
      if (oa !== ob) return oa - ob;
      return (a.criado_em || 0) - (b.criado_em || 0);
    });
  }
  function obterListaNomesEquipamentosOrdenados(pracaOpcional, incluirTodosCatalogo) {
    aplicarOrdemPersonalizadaNoCatalogo();
    var pracaAtiva = pracaOpcional || ((typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora');
    var isUdi = String(pracaAtiva).indexOf('Uber') !== -1;
    var ativos = (catalogoEquipamentos || []).filter(function(eq) {
      if (!eq || eq.status_operacional === 'lixeira') return false;
      if (!incluirTodosCatalogo && eq.exibir_nos_relatorios === false) return false;
      return isUdi ? (eq.praca === 'Uberlândia') : (eq.praca === 'Juiz de Fora');
    });
    if (ativos.length > 0) {
      return ativos.map(function(eq) { return eq.nome; });
    }
    if (!incluirTodosCatalogo && catalogoEquipamentos && catalogoEquipamentos.length > 0) {
      return [];
    }
    if (Store.dashboardMetrics && Store.dashboardMetrics.equipamento) {
      return Object.keys(Store.dashboardMetrics.equipamento);
    }
    return [];
  }
  window.obterListaNomesEquipamentosOrdenados = obterListaNomesEquipamentosOrdenados;
  function salvarCatalogoEquipamentosLocal() {
    Store.catalogoEquipamentos = catalogoEquipamentos;
    try {
      localStorage.setItem(EQUIPAMENTOS_STORAGE_KEY, JSON.stringify(catalogoEquipamentos));
    } catch (e) {
      console.warn('[Equipamentos] localStorage cheio ao salvar catálogo completo, tentando cache compacto:', e);
      try {
        var compacto = (catalogoEquipamentos || []).map(function(eq) {
          if (!eq) return eq;
          var copy = Object.assign({}, eq);
          copy.foto_url = '';
          if (copy.metricas && typeof copy.metricas === 'object') {
            copy.metricas = Object.assign({}, copy.metricas, { foto_url: '' });
          }
          return copy;
        });
        localStorage.setItem(EQUIPAMENTOS_STORAGE_KEY, JSON.stringify(compacto));
      } catch (e2) {}
    }
    sincronizarDashboardMetricsComCatalogo();
  }
  function sincronizarDashboardMetricsComCatalogo() {
    var metrics = Store.dashboardMetrics;
    if (!metrics) return;
    if (!metrics.equipamento || Object.keys(metrics.equipamento).length === 0) {
      try { carregarDashboardMetricsStore(); } catch (eLoad) {}
      metrics = Store.dashboardMetrics;
      if (!metrics.equipamento) metrics.equipamento = {};
    }
    aplicarOrdemPersonalizadaNoCatalogo();
    var pracaAtiva = getPracaAtual();
    var isUdi = pracaAtiva.indexOf('Uber') !== -1;
    var ativosDaPraca = (catalogoEquipamentos || []).filter(function(eq) {
      if (!eq || eq.status_operacional === 'lixeira') return false;
      if (eq.exibir_nos_relatorios === false) return false;
      return isUdi ? (eq.praca === 'Uberlândia') : (eq.praca === 'Juiz de Fora');
    });
    var novoMapaEq = {};
    ativosDaPraca.forEach(function(eq) {
      var existente = metrics.equipamento[eq.nome];
      var metBanco = (eq.metricas && typeof eq.metricas === 'object') ? eq.metricas : {};
      var cConf = existente && typeof existente.conf === 'number' ? existente.conf : (metBanco.conf || 0);
      var cNc   = existente && typeof existente.nc   === 'number' ? existente.nc   : (metBanco.nc   || 0);
      var cCanc = existente && typeof existente.canc === 'number' ? existente.canc : (metBanco.canc || 0);
      if (!eq.metricas || typeof eq.metricas !== 'object') eq.metricas = {};
      eq.metricas.conf = cConf;
      eq.metricas.nc   = cNc;
      eq.metricas.canc = cCanc;
      novoMapaEq[eq.nome] = {
        conf: cConf,
        nc:   cNc,
        canc: cCanc,
        id: eq.id,
        codigo_patrimonio: eq.codigo_patrimonio,
        numero_serie: eq.numero_serie,
        tipo: eq.categoria,
        obs: eq.obs_tecnicas
      };
    });
    metrics.equipamento = novoMapaEq;
    salvarDashboardMetricsStore();
    try {
      atualizarSelectsEquipamentosCTRS();
      atualizarSelectEquipamentosNovaOc();
    } catch (e) {}
  }
  window.sincronizarDashboardMetricsComCatalogo = sincronizarDashboardMetricsComCatalogo;
  function carregarEquipamentosStore() {
    try {
      var raw = localStorage.getItem(EQUIPAMENTOS_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          catalogoEquipamentos = parsed.map(sanitizarEquipamento).filter(Boolean);
        }
      }
    } catch (e) {}
    var temJF = catalogoEquipamentos.some(function(e) { return e.praca === 'Juiz de Fora'; });
    if (!temJF) {
      catalogoEquipamentos = EQUIPAMENTOS_SEED_JF.map(sanitizarEquipamento).concat(catalogoEquipamentos);
    }
    try {
      ['tv_dashboard_metrics_v2_jf', 'tv_dashboard_metrics_v2_udi'].forEach(function(k) {
        var mRaw = localStorage.getItem(k);
        if (!mRaw) return;
        var mObj = JSON.parse(mRaw);
        if (mObj && mObj.equipamento) {
          var pr = k.indexOf('_udi') !== -1 ? 'Uberlândia' : 'Juiz de Fora';
          Object.keys(mObj.equipamento).forEach(function(nomeEq) {
            var jaExiste = catalogoEquipamentos.some(function(e) { return e.nome === nomeEq && e.praca === pr; });
            if (!jaExiste) {
              var info = mObj.equipamento[nomeEq] || {};
              catalogoEquipamentos.push(sanitizarEquipamento({
                id: 'eq_' + pr.toLowerCase().replace(/\s+/g, '') + '_' + nomeEq.toLowerCase().replace(/[^a-z0-9]/g, ''),
                codigo_patrimonio: info.codigo_patrimonio || '',
                numero_serie: info.numero_serie || '',
                nome: nomeEq,
                categoria: info.tipo || 'Mochilink / LiveU',
                praca: pr,
                tags: ['Transmissão'],
                obs_tecnicas: info.obs || ''
              }));
            }
          });
        }
      });
    } catch (eMig) {}
    Store.catalogoEquipamentos = catalogoEquipamentos;
    sincronizarRecebimentosExistentesNoCatalogo(true);
    deduplicarEquipamentosCatalogo();
    salvarCatalogoEquipamentosLocal();
    renderCatalogoEquipamentos();
    sincronizarEquipamentosPostgreSQL();
  }
  window.carregarEquipamentosStore = carregarEquipamentosStore;
  function removerEquipamentoDuplicadoRemoto(idDup) {
    if (!idDup || !window.DBService || typeof window.DBService.remove !== 'function') return;
    window.DBService.remove('equipamentos', 'id=eq.' + encodeURIComponent(idDup))
      .then(function(res) {
        if (!res || !res.ok) {
          window.DBService.patch('equipamentos', 'id=eq.' + encodeURIComponent(idDup), { status_operacional: 'lixeira' }).catch(function() {});
        }
      })
      .catch(function() {});
  }
  function deduplicarEquipamentosCatalogo() {
    if (!Array.isArray(catalogoEquipamentos) || catalogoEquipamentos.length === 0) return false;
    var gruposAtivos = {};
    var idsParaRemover = {};
    var removeuAlgo = false;
    function scoreEquipamento(e) {
      var s = 0;
      if (e.foto_url) s += 10;
      if (e.dados_tags && e.dados_tags.liveu && Array.isArray(e.dados_tags.liveu.slots) && e.dados_tags.liveu.slots.length > 0) s += 10;
      if (e.codigo_patrimonio) s += 3;
      if (e.numero_serie) s += 3;
      if (e.fabricante_modelo) s += 2;
      if (Array.isArray(e.historico_edicoes) && e.historico_edicoes.length > 0) s += 4;
      if (String(e.id || '').indexOf('eq_rec_') === 0 && !/^eq_rec_\d{10,}/.test(String(e.id))) s += 5;
      return s;
    }
    catalogoEquipamentos.forEach(function(e) {
      if (!e || !e.id) return;
      if (e.status_operacional === 'lixeira') return;
      var chave = (e.praca || 'Juiz de Fora') + '|' + String(e.nome || '').trim().toUpperCase();
      if (!gruposAtivos[chave]) {
        gruposAtivos[chave] = [e];
      } else {
        gruposAtivos[chave].push(e);
      }
    });
    Object.keys(gruposAtivos).forEach(function(chave) {
      var arr = gruposAtivos[chave];
      if (arr.length <= 1) return;
      arr.sort(function(a, b) {
        var diff = scoreEquipamento(b) - scoreEquipamento(a);
        if (diff !== 0) return diff;
        return Number(a.criado_em || 0) - Number(b.criado_em || 0);
      });
      for (var i = 1; i < arr.length; i++) {
        idsParaRemover[arr[i].id] = true;
        removeuAlgo = true;
        removerEquipamentoDuplicadoRemoto(arr[i].id);
      }
    });
    if (removeuAlgo) {
      catalogoEquipamentos = catalogoEquipamentos.filter(function(e) {
        return e && !idsParaRemover[e.id];
      });
      Store.catalogoEquipamentos = catalogoEquipamentos;
    }
    return removeuAlgo;
  }
  function registrarMateriaisRecebidosNoCatalogo(materiais, metaRec, silencioso) {
    if (!Array.isArray(materiais) || materiais.length === 0) return 0;
    var meta = metaRec || {};
    var pracaPadrao = meta.praca || ((typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora');
    var pracaNorm = (String(pracaPadrao).indexOf('Uber') !== -1) ? 'Uberlândia' : 'Juiz de Fora';
    var adicionados = [];
    materiais.forEach(function(item) {
      if (!item || !item.desc) return;
      var nomeUp = String(item.desc).trim().toUpperCase();
      if (!nomeUp) return;
      var plaqLimpa = (item.plaq && String(item.plaq).trim() !== '-') ? String(item.plaq).trim() : '';
      var serieLimpa = (item.serie && String(item.serie).trim() !== '-') ? String(item.serie).trim() : '';
      var slugPraca = (pracaNorm.indexOf('Uber') !== -1) ? 'udi' : 'jf';
      var slugNome = nomeUp.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'item';
      var slugSerie = serieLimpa ? ('_' + serieLimpa.toLowerCase().replace(/[^a-z0-9]+/g, '')) : '';
      var idDeterministico = 'eq_rec_' + slugPraca + '_' + slugNome + slugSerie;
      var jaExiste = (catalogoEquipamentos || []).some(function(e) {
        if (!e) return false;
        if (e.id === idDeterministico) return true;
        if (e.praca !== pracaNorm) return false;
        if (e.nome === nomeUp) return true;
        if (serieLimpa && e.numero_serie && String(e.numero_serie).trim().toUpperCase() === serieLimpa.toUpperCase()) return true;
        return false;
      });
      if (jaExiste) return;
      var exibirRel = (typeof item.exibirNosRelatorios === 'boolean') ? item.exibirNosRelatorios : false;
      var obsRec = 'Recebido em ' + (meta.dataRecebimento || meta.dataCriacao || formatDataHoraLocal()).split(' ')[0] +
                   ' · N.F: ' + (meta.nf || 'S/N') +
                   (meta.remetente ? (' · Remetente: ' + meta.remetente) : '') +
                   (item.quant && Number(item.quant) > 1 ? (' · Qtd: ' + item.quant) : '');
      var novoEq = sanitizarEquipamento({
        id: idDeterministico,
        nome: nomeUp,
        codigo_patrimonio: plaqLimpa,
        numero_serie: serieLimpa,
        categoria: 'Infraestrutura',
        fabricante_modelo: '',
        praca: pracaNorm,
        setor_local: (item.local && String(item.local).trim()) ? String(item.local).trim() : 'Recebimento / Almoxarifado',
        status_operacional: 'operacional',
        exibir_nos_relatorios: exibirRel,
        obs_tecnicas: obsRec,
        tags: exibirRel ? ['Transmissão', 'Recebimento'] : ['Recebimento'],
        criado_por: meta.recebedor || meta.criadoPor || ((typeof getUsuarioAtual === 'function') ? getUsuarioAtual() : 'Sistema'),
        criado_em: Date.now()
      });
      if (novoEq) {
        catalogoEquipamentos.push(novoEq);
        adicionados.push(novoEq);
      }
    });
    if (adicionados.length > 0) {
      salvarCatalogoEquipamentosLocal();
      adicionados.forEach(function(eq) { salvarEquipamentoPostgreSQL(eq, false); });
      if (!silencioso) {
        renderCatalogoEquipamentos();
        if (typeof renderDashboards === 'function') renderDashboards();
      }
    }
    return adicionados.length;
  }
  window.registrarMateriaisRecebidosNoCatalogo = registrarMateriaisRecebidosNoCatalogo;
  function parseItensLegadoRecebimento(descCriacao) {
    var txt = String(descCriacao || '');
    var idxItens = txt.indexOf('Itens:');
    if (idxItens === -1) return [];
    var apos = txt.slice(idxItens + 6).trim();
    var mFimObs = apos.match(/\.\s+(?![0-9A-Za-zÀ-ÿ_-]*\])/);
    var blocoItens = mFimObs ? apos.slice(0, mFimObs.index) : apos.replace(/\.\s*$/, '');
    return blocoItens.split(';').map(function(rawItem) {
      var s = rawItem.trim();
      if (!s) return null;
      var qMatch = s.match(/^(\d+)\s*x\s+(.+)$/i);
      var quant = qMatch ? qMatch[1] : '1';
      var resto = qMatch ? qMatch[2].trim() : s;
      var plaq = '';
      var serie = '';
      var mP = resto.match(/\[Plaq:\s*([^\]]+)\]/i);
      if (mP) { plaq = mP[1].trim(); resto = resto.replace(mP[0], '').trim(); }
      var mS = resto.match(/\[S[eé]rie:\s*([^\]]+)\]/i);
      if (mS) { serie = mS[1].trim(); resto = resto.replace(mS[0], '').trim(); }
      if (!resto) return null;
      return { quant: quant, desc: resto, plaq: plaq, serie: serie, local: '', exibirNosRelatorios: false };
    }).filter(Boolean);
  }
  function sincronizarRecebimentosExistentesNoCatalogo(evitarRender) {
    var listaHist = Array.isArray(Store.historicoSeedData) ? Store.historicoSeedData : [];
    var adicionadosTotal = 0;
    listaHist.forEach(function(h) {
      if (!h || h.tipo !== 'recebimento' || h.status === 'lixeira') return;
      var dRec = h.dadosRecebimento || Markers.extract(String(h.descResolucao || ''), 'REC');
      var materiais = (dRec && Array.isArray(dRec.materiais) && dRec.materiais.length > 0)
        ? dRec.materiais
        : parseItensLegadoRecebimento(h.descCriacao);
      if (materiais.length === 0) return;
      var nfMatch = String(h.titulo || '').match(/N\.?F\s+([^\s—]+)/i);
      var remMatch = String(h.titulo || '').split('—');
      var metaRec = dRec || {
        nf: nfMatch ? nfMatch[1] : 'S/N',
        remetente: remMatch.length > 1 ? remMatch.slice(1).join('—').trim() : '',
        praca: h.praca || h.local || 'Juiz de Fora',
        dataCriacao: h.dataCriacao || '',
        recebedor: h.criadoPor || ''
      };
      adicionadosTotal += registrarMateriaisRecebidosNoCatalogo(materiais, metaRec, true);
    });
    if (adicionadosTotal > 0 && !evitarRender) {
      renderCatalogoEquipamentos();
      renderDashboards();
    }
  }
  window.sincronizarRecebimentosExistentesNoCatalogo = sincronizarRecebimentosExistentesNoCatalogo;
  var _eqPendingSaveIds = {};
  function calcularAssinaturaListaEquipamentos(lista) {
    if (!Array.isArray(lista)) return '';
    return lista.map(function(e) {
      if (!e) return '';
      var mLen = e.metricas ? JSON.stringify(e.metricas).length : 0;
      return [
        e.id, e.nome, e.status_operacional, e.codigo_patrimonio, e.numero_serie,
        e.fabricante_modelo, e.categoria, e.setor_local, (e.tags || []).join(','),
        e.exibir_nos_relatorios, e.atualizado_em || 0, mLen
      ].join('|');
    }).join(';;');
  }
  function sincronizarEquipamentosPostgreSQL() {
    if (!window.DBService || typeof window.DBService.select !== 'function') return;
    catalogoEquipamentos = Store.catalogoEquipamentos || catalogoEquipamentos;
    window.DBService.select('equipamentos', 'select=*&order=criado_em.asc')
    .then(function(res) {
      if (!res || !res.ok || !Array.isArray(res.data)) return;
      var remotos = res.data;
      window._equipamentosSyncInicialConcluido = true;
      var mapaLocal = {};
      var mapaLocalOrdem = {};
      (catalogoEquipamentos || []).forEach(function(locEq) {
        if (locEq && locEq.id) {
          mapaLocal[locEq.id] = locEq;
          if (typeof locEq.ordem === 'number') mapaLocalOrdem[locEq.id] = locEq.ordem;
        }
      });
      var mapaRemoto = {};
      var listaRemota = [];
      var agoraMs = Date.now();
      remotos.forEach(function(rawRem) {
        var tinhaHash = Array.isArray(rawRem.tags) && rawRem.tags.some(function(t) { return String(t).indexOf('#') !== -1; });
        var san = sanitizarEquipamento(rawRem);
        if (san) {
          san._dirtyLocal = false;
          var pendTs = _eqPendingSaveIds[san.id] || 0;
          var locExist = mapaLocal[san.id];
          if (locExist && ((pendTs && (agoraMs - pendTs) < 10000) || locExist._dirtyLocal === true)) {
            san = locExist;
            if (locExist._dirtyLocal === true && !pendTs) {
              salvarEquipamentoPostgreSQL(locExist, true);
            }
          }
          if (typeof san.ordem !== 'number' && typeof mapaLocalOrdem[san.id] === 'number') {
            san.ordem = mapaLocalOrdem[san.id];
            if (!san.metricas || typeof san.metricas !== 'object') san.metricas = { conf: 0, nc: 0, canc: 0 };
            san.metricas.ordem = san.ordem;
          }
          listaRemota.push(san);
          mapaRemoto[san.id] = san;
          if (tinhaHash) {
            salvarEquipamentoPostgreSQL(san, true);
          }
        }
      });
      var pendentesLocais = (catalogoEquipamentos || []).filter(function(loc) {
        return loc && loc.id && !mapaRemoto[loc.id];
      });
      if (pendentesLocais.length > 0) {
        pendentesLocais.forEach(function(p) { salvarEquipamentoPostgreSQL(p, false); });
      }
      if (listaRemota.length > 0 || pendentesLocais.length > 0) {
        var novaLista = listaRemota.concat(pendentesLocais);
        var sigAntes = calcularAssinaturaListaEquipamentos(catalogoEquipamentos);
        catalogoEquipamentos = novaLista;
        Store.catalogoEquipamentos = catalogoEquipamentos;
        deduplicarEquipamentosCatalogo();
        aplicarOrdemPersonalizadaNoCatalogo();
        var sigDepois = calcularAssinaturaListaEquipamentos(catalogoEquipamentos);
        if (sigAntes !== sigDepois) {
          salvarCatalogoEquipamentosLocal();
          renderCatalogoEquipamentos();
          renderDashboards();
          var fichaPop = document.getElementById('popup-ficha-vida-equipamento');
          if (eqFichaAbertaId && fichaPop && !fichaPop.hasAttribute('hidden')) {
            abrirFichaVidaEquipamento(eqFichaAbertaId, true);
          }
        }
      }
    })
    .catch(function(err) {
      console.warn('[PostgreSQL Equipamentos] Tabela equipamentos ainda não criada ou modo local ativo:', err);
    });
  }
  window.sincronizarEquipamentosPostgreSQL = sincronizarEquipamentosPostgreSQL;
  function montarPayloadEquipamentoPostgreSQL(eq) {
    var met = (eq.metricas && typeof eq.metricas === 'object') ? Object.assign({}, eq.metricas) : { conf: 0, nc: 0, canc: 0 };
    met.exibir_nos_relatorios = (eq.exibir_nos_relatorios !== false);
    met.foto_url = eq.foto_url || '';
    met.dados_tags = (eq.dados_tags && typeof eq.dados_tags === 'object') ? eq.dados_tags : {};
    met.historico_edicoes = Array.isArray(eq.historico_edicoes) ? eq.historico_edicoes : [];
    met.atualizado_em = eq.atualizado_em || Date.now();
    if (typeof eq.ordem === 'number') met.ordem = eq.ordem;
    eq.metricas = met;
    return {
      id: eq.id,
      codigo_patrimonio: eq.codigo_patrimonio || '',
      numero_serie: eq.numero_serie || '',
      nome: eq.nome,
      categoria: eq.categoria || 'Transmissão',
      fabricante_modelo: eq.fabricante_modelo || '',
      praca: eq.praca || 'Juiz de Fora',
      setor_local: eq.setor_local || 'Central Técnica',
      tags: Array.isArray(eq.tags) ? eq.tags : [],
      status_operacional: eq.status_operacional || 'operacional',
      obs_tecnicas: eq.obs_tecnicas || '',
      metricas: met,
      criado_por: eq.criado_por || 'Operador',
      criado_em: eq.criado_em || Date.now()
    };
  }
  function salvarEquipamentoPostgreSQL(eq, isEdicao, callback) {
    if (!eq || !window.DBService || typeof window.DBService.upsert !== 'function') {
      if (typeof callback === 'function') callback(false);
      return;
    }
    eq.atualizado_em = eq.atualizado_em || Date.now();
    _eqPendingSaveIds[eq.id] = Date.now();
    var payload = montarPayloadEquipamentoPostgreSQL(eq);
    var patchPayload = Object.assign({}, payload);
    delete patchPayload.id;
    delete patchPayload.criado_em;
    var fazerPostUpsert = function() {
      return window.DBService.upsert('equipamentos', payload, 'resolution=merge-duplicates,return=representation');
    };
    var promessa = isEdicao
      ? window.DBService.patch('equipamentos', 'id=eq.' + encodeURIComponent(eq.id), patchPayload, 'return=representation')
          .then(function(res) {
            if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
              return fazerPostUpsert();
            }
            return res;
          })
          .catch(function() {
            return fazerPostUpsert();
          })
      : fazerPostUpsert();
    promessa
      .then(function(res) {
        delete _eqPendingSaveIds[eq.id];
        if (!res || !res.ok) {
          if (res && res.status) {
            var stCode = res.status;
            mostrarToast('Erro ao Salvar no Banco (' + stCode + ')', 'Equipamento ' + eq.nome + ' não foi gravado no servidor.', 'warning');
          }
          if (typeof callback === 'function') callback(false);
          return;
        }
        eq._dirtyLocal = false;
        Storage.setJSON(EQUIPAMENTOS_STORAGE_KEY, catalogoEquipamentos);
        if (typeof callback === 'function') callback(true);
      })
      .catch(function(err) {
        delete _eqPendingSaveIds[eq.id];
        console.warn('[PostgreSQL Equipamentos] Erro ao gravar equipamento:', err);
        if (typeof callback === 'function') callback(false);
      });
  }
  window.salvarEquipamentoPostgreSQL = salvarEquipamentoPostgreSQL;
  function obterOcorrenciasDoEquipamento(eq) {
    if (!eq) return [];
    var nomeBusca = (eq.nome || '').toUpperCase();
    var idBusca = eq.id || '';
    var todasOcs = Array.isArray(Store.ocorrencias) ? Store.ocorrencias : [];
    return todasOcs.filter(function(oc) {
      if (!oc || oc.status === 'lixeira') return false;
      if (idBusca && oc.equipamento_id === idBusca) return true;
      if (oc.equipamento && String(oc.equipamento).toUpperCase() === nomeBusca) return true;
      if (Array.isArray(oc.tags) && oc.tags.some(function(t){ return String(t).toUpperCase() === nomeBusca; })) return true;
      if (oc.titulo && String(oc.titulo).toUpperCase().indexOf(nomeBusca) !== -1) return true;
      return false;
    });
  }
  window.obterOcorrenciasDoEquipamento = obterOcorrenciasDoEquipamento;
  function calcularStatusEquipamentoDinamico(eq) {
    if (!eq) return 'operacional';
    if (eq.status_operacional === 'manutencao') return 'manutencao';
    var ocs = obterOcorrenciasDoEquipamento(eq);
    var temAberta = ocs.some(function(o) { return o.status === 'aberta'; });
    if (temAberta) return 'atencao';
    var temObs = ocs.some(function(o) { return o.status === 'arquivada'; });
    if (temObs) return 'observacao';
    return 'operacional';
  }
  function filtrarEquipamentosPorTag(tag, btn) {
    filtroEquipamentoTag = tag ? String(tag).replace(/^#+/, '').trim() : 'todos';
    if (btn && btn.closest('.pills')) {
      btn.closest('.pills').querySelectorAll('.pill').forEach(function(p) { p.classList.remove('on'); });
      btn.classList.add('on');
    }
    renderCatalogoEquipamentos();
  }
  window.filtrarEquipamentosPorTag = filtrarEquipamentosPorTag;
  function renderCatalogoEquipamentos() {
    var grid = document.getElementById('equipamentos-catalogo-grid');
    if (!grid) return;
    aplicarOrdemPersonalizadaNoCatalogo();
    var pracaAtiva = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isUdi = pracaAtiva.indexOf('Uber') !== -1;
    var pracaBadge = document.getElementById('eq-catalogo-praca-badge');
    if (pracaBadge) pracaBadge.textContent = isUdi ? 'Uberlândia' : 'Juiz de Fora';
    var buscaInput = document.getElementById('eq-catalogo-search');
    var termo = buscaInput ? buscaInput.value.trim().toLowerCase() : '';
    var doCatalogoPraca = (catalogoEquipamentos || []).filter(function(eq) {
      if (!eq || eq.status_operacional === 'lixeira') return false;
      return isUdi ? (eq.praca === 'Uberlândia') : (eq.praca === 'Juiz de Fora');
    });
    var totEq = doCatalogoPraca.length;
    var totOp = 0, totAtencao = 0, totManut = 0;
    doCatalogoPraca.forEach(function(eq) {
      var st = calcularStatusEquipamentoDinamico(eq);
      if (st === 'manutencao') totManut++;
      else if (st === 'atencao' || st === 'observacao') totAtencao++;
      else totOp++;
    });
    var kpiTot = document.getElementById('eq-kpi-total');
    var kpiOp  = document.getElementById('eq-kpi-operacional');
    var kpiAt  = document.getElementById('eq-kpi-atencao');
    if (kpiTot) kpiTot.textContent = totEq;
    if (kpiOp)  kpiOp.textContent  = totOp;
    if (kpiAt)  kpiAt.textContent  = (totAtencao + totManut);
    var filtrados = doCatalogoPraca.filter(function(eq) {
      if (filtroEquipamentoTag !== 'todos') {
        var tagsEq = Array.isArray(eq.tags) ? eq.tags : [];
        if (tagsEq.indexOf(filtroEquipamentoTag) === -1 && eq.categoria !== filtroEquipamentoTag) return false;
      }
      if (termo) {
        var liveuBusca = '';
        if (eq.dados_tags && eq.dados_tags.liveu) {
          var lu = eq.dados_tags.liveu;
          liveuBusca = [
            lu.chips_modens_tv || '',
            lu.obs_geral || '',
            (lu.slots || []).map(function(s) {
              return [s.operadora, s.numero_chip, s.telefone, s.imei, s.inserido].join(' ');
            }).join(' ')
          ].join(' ');
        }
        var redeBusca = '';
        if (eq.dados_tags && eq.dados_tags.rede) {
          var rdB = eq.dados_tags.rede;
          redeBusca = [rdB.ip_gerencia, rdB.gateway_vlan, rdB.switch_porta, rdB.provedor_circuito, rdB.velocidade, rdB.obs_rede].join(' ');
        }
        var texto = [
          eq.nome,
          eq.codigo_patrimonio,
          eq.numero_serie,
          eq.fabricante_modelo,
          eq.categoria,
          eq.setor_local,
          eq.obs_tecnicas,
          (eq.tags || []).join(' '),
          liveuBusca,
          redeBusca
        ].join(' ').toLowerCase();
        return texto.indexOf(termo) !== -1;
      }
      return true;
    });
    if (filtrados.length === 0) {
      grid.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:42px 20px;background:var(--surface);border:1px solid var(--border-lt);border-radius:var(--r-lg);">' +
          '<i data-lucide="cpu" style="width:36px;height:36px;color:var(--muted);stroke-width:1.5;margin-bottom:10px;"></i>' +
          '<p style="color:var(--txt);font-size:14px;font-weight:700;margin:0;">Nenhum equipamento encontrado nesta visualização</p>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 14px 0;">Clique em "+ Cadastrar Equipamento" para adicionar com ID, Nº de Série e Tags.</p>' +
          '<button type="button" class="btn btn-primary btn-sm" onclick="abrirModalCadastroEquipamento()">+ Cadastrar Primeiro Equipamento</button>' +
        '</div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }
    grid.innerHTML = filtrados.map(function(eq) {
      var st = calcularStatusEquipamentoDinamico(eq);
      var ocs = obterOcorrenciasDoEquipamento(eq);
      var abertasCount = ocs.filter(function(o){ return o.status === 'aberta'; }).length;
      var badgeStatus = st === 'manutencao'
        ? '<span class="tag tag-r">🔴 Em Manutenção</span>'
        : st === 'atencao'
        ? '<span class="tag tag-y">🟡 ' + abertasCount + ' Ocorrência(s)</span>'
        : st === 'observacao'
        ? '<span class="tag" style="background:#EEF2FF;color:#4F46E5;border:1px solid #C7D2FE;font-weight:700;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="eye" style="width:11px;height:11px;stroke-width:2.2;"></i>Em Observação</span>'
        : '<span class="tag tag-g">🟢 Operacional</span>';
      var borderStyle = st === 'atencao'
        ? 'border-color:#FDE68A;background:#FFFBEB;'
        : st === 'manutencao'
        ? 'border-color:#FECACA;background:#FEF2F2;'
        : st === 'observacao'
        ? 'border-color:#C7D2FE;background:#F8FAFF;'
        : '';
      var tagsHTML = (Array.isArray(eq.tags) && eq.tags.length > 0)
        ? eq.tags.map(function(t) {
            return '<span style="font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:12px;background:#EFF6FF;color:#0071E3;border:1px solid #BFDBFE;">' + escapeHTML(t) + '</span>';
          }).join('')
        : '<span style="font-size:10.5px;color:var(--muted);">Sem tags</span>';
      var badgeVisibilidadeRel = (eq.exibir_nos_relatorios === false)
        ? '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;background:#F1F5F9;color:#475569;border:1px solid #CBD5E1;" title="Este equipamento aparece apenas no Catálogo de Equipamentos">Apenas Catálogo</span>'
        : '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;" title="Este equipamento aparece nas opções dos relatórios e popups de transmissão">Nos Relatórios</span>';
      var liveuResumoCardHTML = '';
      var liveuBlocoCardHTML = '';
      var isLiveUCard = (Array.isArray(eq.tags) && eq.tags.indexOf('LiveU') !== -1) || (eq.dados_tags && eq.dados_tags.liveu && Array.isArray(eq.dados_tags.liveu.slots) && eq.dados_tags.liveu.slots.length > 0);
      if (isLiveUCard) {
        var luObjCard = (eq.dados_tags && eq.dados_tags.liveu) ? normalizarDadosLiveU(eq.dados_tags.liveu) : { chips_modens_tv: '', slots: [] };
        var luSlots = luObjCard.slots || [];
        if (luSlots.length > 0) {
          var cntInt = luSlots.filter(function(s){ return s.inserido === 'Interno'; }).length;
          var cntExt = luSlots.filter(function(s){ return s.inserido === 'Externo'; }).length;
          var cntDesc = luSlots.filter(function(s){ return s.inserido !== 'Interno' && s.inserido !== 'Externo'; }).length;
          liveuResumoCardHTML = '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;background:#EEF2FF;color:#3730A3;border:1px solid #C7D2FE;">' + luSlots.length + ' Chip(s) · ' + cntInt + ' Int / ' + cntExt + ' Ext</span>';
          if (cntDesc > 0) {
            liveuResumoCardHTML += '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;background:#FFFBEB;color:#B45309;border:1px solid #FDE68A;">⚠ ' + cntDesc + ' Desconhecido</span>';
          }
          var linhasSlotsCard = luSlots.slice(0, 4).map(function(s, sIdx) {
            var corIns = s.inserido === 'Interno' ? '#047857' : (s.inserido === 'Externo' ? '#1D4ED8' : '#B45309');
            var infoNum = s.telefone || s.imei || s.numero_chip || 'Sem número';
            return '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:10.5px;color:#334155;">' +
              '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><strong>#' + (sIdx + 1) + ' ' + escapeHTML(s.operadora) + '</strong> · <span style="font-family:monospace;">' + escapeHTML(infoNum) + '</span></span>' +
              '<span style="font-weight:700;color:' + corIns + ';flex-shrink:0;">' + escapeHTML(s.inserido) + '</span>' +
            '</div>';
          }).join('');
          var maisSlotsTxt = luSlots.length > 4 ? '<div style="font-size:10px;color:#0071E3;font-weight:700;margin-top:2px;">+ ' + (luSlots.length - 4) + ' chip(s) na Ficha de Vida</div>' : '';
          liveuBlocoCardHTML =
            '<div style="margin-top:8px;padding:7px 9px;background:rgba(239,246,255,0.7);border:1px solid #BFDBFE;border-radius:8px;display:flex;flex-direction:column;gap:3px;">' +
              (luObjCard.chips_modens_tv ? '<div style="font-size:10px;font-weight:800;color:#1E3A8A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHTML(luObjCard.chips_modens_tv) + '</div>' : '') +
              linhasSlotsCard +
              maisSlotsTxt +
            '</div>';
        } else {
          liveuResumoCardHTML = '<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:12px;background:#F8FAFC;color:#64748B;border:1px dashed #CBD5E1;">LiveU · Sem chips</span>';
        }
      }
      var redeResumoCardHTML = '';
      var isRedeCard = (Array.isArray(eq.tags) && eq.tags.indexOf('Rede/Fibra') !== -1) || (eq.dados_tags && eq.dados_tags.rede && (eq.dados_tags.rede.ip_gerencia || eq.dados_tags.rede.provedor_circuito || eq.dados_tags.rede.switch_porta));
      if (isRedeCard) {
        var rdObjCard = normalizarDadosRede(eq.dados_tags && eq.dados_tags.rede);
        var rdParts = [rdObjCard.ip_gerencia, rdObjCard.provedor_circuito].filter(Boolean);
        if (rdParts.length > 0) {
          redeResumoCardHTML = '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;background:#ECFDF5;color:#065F46;border:1px solid #A7F3D0;">🌐 ' + escapeHTML(rdParts.join(' · ')) + '</span>';
        } else {
          redeResumoCardHTML = '<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:12px;background:#F8FAFC;color:#64748B;border:1px dashed #CBD5E1;">Rede/Fibra · Sem IP/Link</span>';
        }
      }
      var safeFotoCard = safeEqMedia(eq.foto_url);
      var fotoCardHTML = safeFotoCard
        ? '<img src="' + safeFotoCard + '" alt="' + escapeHTML(eq.nome) + '" style="width:42px;height:42px;border-radius:9px;object-fit:cover;border:1px solid var(--border);flex-shrink:0;background:#fff;" />'
        : '<div style="width:42px;height:42px;border-radius:9px;background:#EFF6FF;border:1px solid #BFDBFE;display:flex;align-items:center;justify-content:center;color:#0071E3;flex-shrink:0;"><i data-lucide="' + (isLiveUCard ? 'radio' : 'cpu') + '" style="width:18px;height:18px;"></i></div>';
      var safeEqJsId = escapeJSString(eq.id);
      return (
        '<div class="dash-card eq-draggable-card" data-eq-id="' + escapeHTML(eq.id) + '" ' +
          'onpointerdown="iniciarArrastoEquipamento(event, \'' + safeEqJsId + '\')" ' +
          'style="padding:16px;display:flex;flex-direction:column;justify-content:space-between;gap:12px;cursor:grab;user-select:none;-webkit-user-select:none;transition:box-shadow .15s ease, border-color .15s ease;' + borderStyle + '" ' +
          'onclick="if(!window._arrastandoEqAgora) abrirFichaVidaEquipamento(\'' + safeEqJsId + '\')" ' +
          'title="Segure e arraste o card para mudar a ordem, ou clique para abrir o Ficheiro de Vida">' +
          '<div>' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">' +
              '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
                '<span title="Segure e arraste para reordenar" style="color:var(--muted);cursor:grab;display:inline-flex;align-items:center;opacity:0.85;flex-shrink:0;"><i data-lucide="grip-vertical" style="width:15px;height:15px;"></i></span>' +
                fotoCardHTML +
                '<div style="min-width:0;">' +
                  '<div style="font-size:14px;font-weight:800;color:var(--txt);letter-spacing:-0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHTML(eq.nome) + '</div>' +
                  '<div style="font-size:11.5px;color:var(--muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHTML(eq.fabricante_modelo || eq.categoria) + '</div>' +
                '</div>' +
              '</div>' +
              badgeStatus +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;background:rgba(255,255,255,0.75);border:1px solid var(--border-lt);border-radius:8px;padding:8px 10px;font-size:11px;margin-bottom:10px;">' +
              '<div><span style="color:var(--muted);display:block;font-size:10px;">ID / PATRIMÔNIO</span><strong style="color:var(--txt);font-family:monospace;">' + escapeHTML(eq.codigo_patrimonio || 'Não inf.') + '</strong></div>' +
              '<div><span style="color:var(--muted);display:block;font-size:10px;">Nº DE SÉRIE</span><strong style="color:var(--txt);font-family:monospace;">' + escapeHTML(eq.numero_serie || 'Não inf.') + '</strong></div>' +
            '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px;">' +
              tagsHTML + badgeVisibilidadeRel + liveuResumoCardHTML + redeResumoCardHTML +
            '</div>' +
            liveuBlocoCardHTML +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border-lt);font-size:11.5px;" onclick="event.stopPropagation();">' +
            '<button type="button" class="btn btn-ghost btn-xs" onclick="abrirFichaVidaEquipamento(\'' + safeEqJsId + '\')" style="color:var(--blue);font-weight:600;padding:4px 8px;display:inline-flex;align-items:center;gap:4px;">' +
              '<i data-lucide="file-text" style="width:12px;height:12px;"></i> Ficheiro de Vida (' + ocs.length + ')' +
            '</button>' +
            '<div style="display:flex;gap:4px;">' +
              '<button type="button" class="btn btn-ghost btn-xs" onclick="abrirOcorrenciaDiretaEquipamento(\'' + safeEqJsId + '\')" title="Abrir Ocorrência para este equipamento" style="color:#D97706;padding:4px 7px;">' +
                '<i data-lucide="alert-triangle" style="width:13px;height:13px;"></i>' +
              '</button>' +
              '<button type="button" class="btn btn-ghost btn-xs" onclick="abrirModalCadastroEquipamento(\'' + safeEqJsId + '\')" title="Modificar equipamento" style="color:var(--txt2);padding:4px 7px;">' +
                '<i data-lucide="edit-3" style="width:13px;height:13px;"></i>' +
              '</button>' +
              '<button type="button" class="btn btn-ghost btn-xs" onclick="excluirEquipamentoParaLixeira(\'' + safeEqJsId + '\')" title="Mover equipamento para a Lixeira" style="color:var(--red);padding:4px 7px;">' +
                '<i data-lucide="trash-2" style="width:13px;height:13px;"></i>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('') + (
      '<div class="dash-card dash-card-add" onclick="abrirModalCadastroEquipamento()" style="min-height:190px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;border:2px dashed #93C5FD;background:#F8FAFC;transition:all .18s ease;" title="Clique para cadastrar um novo equipamento na praça">' +
        '<div style="width:44px;height:44px;border-radius:50%;background:#EFF6FF;color:#0071E3;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,113,227,0.15);">' +
          '<i data-lucide="plus" style="width:22px;height:22px;stroke-width:2.5;"></i>' +
        '</div>' +
        '<div style="text-align:center;">' +
          '<div style="font-size:13.5px;font-weight:800;color:#0071E3;">+ Adicionar Novo Equipamento</div>' +
          '<div style="font-size:11.5px;color:var(--muted);margin-top:2px;">Cadastrar com ID, Nº de Série e Tags</div>' +
        '</div>' +
      '</div>'
    );
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.renderCatalogoEquipamentos = renderCatalogoEquipamentos;
  var _eqDragState = null;
  window._arrastandoEqAgora = false;
  function animarFlipCardsGrid(grid, rectsAntes, cardIgnorado) {
    if (!grid || !rectsAntes) return;
    var cards = grid.querySelectorAll('.eq-draggable-card, .dash-card-add');
    cards.forEach(function(c) {
      if (c === cardIgnorado) return;
      var idKey = c.getAttribute('data-eq-id') || '__add_card__';
      var antes = rectsAntes[idKey];
      if (!antes) return;
      var depois = c.getBoundingClientRect();
      var dx = antes.left - depois.left;
      var dy = antes.top - depois.top;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        c.style.transition = 'none';
        c.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
        void c.offsetWidth;
        c.style.transition = 'transform 220ms cubic-bezier(0.2, 0, 0, 1)';
        c.style.transform = '';
      }
    });
  }
  function capturarRectsGrid(grid, cardIgnorado) {
    var mapa = {};
    if (!grid) return mapa;
    var cards = grid.querySelectorAll('.eq-draggable-card, .dash-card-add');
    cards.forEach(function(c) {
      if (c === cardIgnorado) return;
      var idKey = c.getAttribute('data-eq-id') || '__add_card__';
      mapa[idKey] = c.getBoundingClientRect();
    });
    return mapa;
  }
  function iniciarArrastoEquipamento(ev, eqId) {
    if (!ev || (typeof ev.button === 'number' && ev.button !== 0)) return;
    if (ev.target && ev.target.closest('button, a, input, select, textarea')) return;
    var card = ev.currentTarget;
    var grid = document.getElementById('equipamentos-catalogo-grid');
    if (!card || !grid) return;
    var rect = card.getBoundingClientRect();
    _eqDragState = {
      eqId: eqId,
      card: card,
      grid: grid,
      startX: ev.clientX,
      startY: ev.clientY,
      offsetX: ev.clientX - rect.left,
      offsetY: ev.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      started: false,
      movedOrder: false,
      placeholder: null,
      origStyle: card.getAttribute('style') || ''
    };
    document.addEventListener('pointermove', moverArrastoEquipamento, { passive: false });
    document.addEventListener('pointerup', encerrarArrastoEquipamento);
    document.addEventListener('pointercancel', encerrarArrastoEquipamento);
  }
  window.iniciarArrastoEquipamento = iniciarArrastoEquipamento;
  function moverArrastoEquipamento(ev) {
    if (!_eqDragState) return;
    var st = _eqDragState;
    var dx = ev.clientX - st.startX;
    var dy = ev.clientY - st.startY;
    if (!st.started) {
      if (Math.hypot(dx, dy) < 6) return;
      st.started = true;
      window._arrastandoEqAgora = true;
      var ph = document.createElement('div');
      ph.className = 'eq-drag-placeholder';
      ph.style.width = '100%';
      ph.style.height = st.height + 'px';
      ph.style.minHeight = st.height + 'px';
      ph.style.border = '2px dashed #3B82F6';
      ph.style.borderRadius = 'var(--r-lg, 14px)';
      ph.style.background = 'rgba(239, 246, 255, 0.65)';
      ph.style.boxSizing = 'border-box';
      var bgComp = window.getComputedStyle(st.card).backgroundColor;
      st.grid.replaceChild(ph, st.card);
      document.body.appendChild(st.card);
      st.placeholder = ph;
      var c = st.card;
      c.style.position = 'fixed';
      c.style.left = (ev.clientX - st.offsetX) + 'px';
      c.style.top = (ev.clientY - st.offsetY) + 'px';
      c.style.width = st.width + 'px';
      c.style.height = st.height + 'px';
      c.style.margin = '0';
      c.style.zIndex = '99999';
      c.style.opacity = '1';
      if (bgComp && bgComp !== 'rgba(0, 0, 0, 0)') {
        c.style.backgroundColor = bgComp;
      } else {
        c.style.backgroundColor = '#FFFFFF';
      }
      c.style.pointerEvents = 'none';
      c.style.cursor = 'grabbing';
      c.style.transform = 'scale(1.025)';
      c.style.boxShadow = '0 22px 44px rgba(15, 23, 42, 0.24), 0 0 0 2px #0071E3';
      c.style.transition = 'transform 120ms ease, box-shadow 120ms ease';
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }
    if (ev.cancelable) ev.preventDefault();
    st.card.style.left = (ev.clientX - st.offsetX) + 'px';
    st.card.style.top = (ev.clientY - st.offsetY) + 'px';
    var scrollContainer = st.grid.closest('.scroll-area') || document.documentElement;
    if (scrollContainer) {
      var scRect = scrollContainer.getBoundingClientRect ? scrollContainer.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
      if (ev.clientY < scRect.top + 60) {
        scrollContainer.scrollTop -= 10;
      } else if (ev.clientY > scRect.bottom - 60) {
        scrollContainer.scrollTop += 10;
      }
    }
    var elemAbaixo = document.elementFromPoint(ev.clientX, ev.clientY);
    if (!elemAbaixo) return;
    var cardAlvo = elemAbaixo.closest('#equipamentos-catalogo-grid .eq-draggable-card');
    if (!cardAlvo || cardAlvo === st.card) return;
    var Filhos = Array.prototype.slice.call(st.grid.children);
    var idxPh = Filhos.indexOf(st.placeholder);
    var idxAlvo = Filhos.indexOf(cardAlvo);
    if (idxPh === -1 || idxAlvo === -1 || idxPh === idxAlvo) return;
    var rectsAntes = capturarRectsGrid(st.grid, st.card);
    if (idxPh < idxAlvo) {
      st.grid.insertBefore(st.placeholder, cardAlvo.nextSibling);
    } else {
      st.grid.insertBefore(st.placeholder, cardAlvo);
    }
    st.movedOrder = true;
    animarFlipCardsGrid(st.grid, rectsAntes, st.card);
  }
  function encerrarArrastoEquipamento(ev) {
    document.removeEventListener('pointermove', moverArrastoEquipamento);
    document.removeEventListener('pointerup', encerrarArrastoEquipamento);
    document.removeEventListener('pointercancel', encerrarArrastoEquipamento);
    if (!_eqDragState) return;
    var st = _eqDragState;
    _eqDragState = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    if (!st.started) {
      window._arrastandoEqAgora = false;
      return;
    }
    var phRect = st.placeholder ? st.placeholder.getBoundingClientRect() : null;
    var c = st.card;
    var finalizarPosicao = function() {
      if (st.placeholder && st.placeholder.parentNode === st.grid) {
        st.grid.replaceChild(c, st.placeholder);
      } else if (c.parentNode !== st.grid) {
        st.grid.appendChild(c);
      }
      c.setAttribute('style', st.origStyle);
      if (st.movedOrder) {
        persistirNovaOrdemGridEquipamentos(st.grid);
      }
      setTimeout(function() {
        window._arrastandoEqAgora = false;
      }, 60);
    };
    if (phRect) {
      c.style.transition = 'left 150ms cubic-bezier(0.2, 0, 0, 1), top 150ms cubic-bezier(0.2, 0, 0, 1), transform 150ms ease, box-shadow 150ms ease';
      c.style.left = phRect.left + 'px';
      c.style.top = phRect.top + 'px';
      c.style.transform = 'scale(1)';
      c.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.08)';
      setTimeout(finalizarPosicao, 155);
    } else {
      finalizarPosicao();
    }
  }
  function persistirNovaOrdemGridEquipamentos(grid) {
    if (!grid) return;
    var cardsNoDom = Array.prototype.slice.call(grid.querySelectorAll('.eq-draggable-card'));
    var idsOrdenadosVisiveis = cardsNoDom.map(function(el) {
      return el.getAttribute('data-eq-id');
    }).filter(Boolean);
    if (idsOrdenadosVisiveis.length < 2) return;
    var mapaPorId = {};
    catalogoEquipamentos.forEach(function(eq) {
      if (eq && eq.id) mapaPorId[eq.id] = eq;
    });
    var posicoesOriginais = [];
    for (var i = 0; i < catalogoEquipamentos.length; i++) {
      var item = catalogoEquipamentos[i];
      if (item && idsOrdenadosVisiveis.indexOf(item.id) !== -1) {
        posicoesOriginais.push(i);
      }
    }
    for (var j = 0; j < posicoesOriginais.length; j++) {
      var novoEq = mapaPorId[idsOrdenadosVisiveis[j]];
      if (novoEq) {
        catalogoEquipamentos[posicoesOriginais[j]] = novoEq;
      }
    }
    var pracaAtiva = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isUdi = pracaAtiva.indexOf('Uber') !== -1;
    var ordemCounter = 0;
    var nomesNaNovaOrdem = [];
    catalogoEquipamentos.forEach(function(eq) {
      if (!eq || eq.status_operacional === 'lixeira') return;
      var mesmaPraca = isUdi ? (eq.praca === 'Uberlândia') : (eq.praca === 'Juiz de Fora');
      if (mesmaPraca) {
        eq.ordem = ordemCounter++;
        nomesNaNovaOrdem.push(eq.nome);
        if (!eq.metricas || typeof eq.metricas !== 'object') {
          eq.metricas = { conf: 0, nc: 0, canc: 0 };
        }
        eq.metricas.ordem = eq.ordem;
        salvarEquipamentoPostgreSQL(eq);
      }
    });
    salvarOrdemPersonalizadaEquipamentos(pracaAtiva, nomesNaNovaOrdem);
    salvarCatalogoEquipamentosLocal();
    if (typeof renderDashboards === 'function') renderDashboards();
    if (typeof mostrarToast === 'function') {
      mostrarToast('Ordem Atualizada', 'A nova ordem dos equipamentos foi aplicada em todos os menus.', 'info');
    }
  }
  function comprimirImagemEquipamento(file, maxDim, quality, callback) {
    if (!file) { callback(''); return; }
    if (/svg|html|xml/i.test(String(file.type || '')) || /\.(svg|svgz|html|htm|xhtml|xml)$/i.test(String(file.name || ''))) {
      mostrarToast('Formato Bloqueado', 'Imagens SVG/HTML não são permitidas por motivos de segurança. Envie PNG, JPG ou WebP.', 'warning');
      callback('');
      return;
    }
    var reader = new FileReader();
    reader.onload = function(ev) {
      var rawUrl = ev && ev.target ? ev.target.result : '';
      if (!rawUrl || String(rawUrl).indexOf('data:image/svg') === 0) {
        callback('');
        return;
      }
      var img = new Image();
      img.onload = function() {
        try {
          var w = img.width || maxDim;
          var h = img.height || maxDim;
          if (w > maxDim || h > maxDim) {
            if (w >= h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          callback(canvas.toDataURL('image/jpeg', quality || 0.8));
        } catch (eC) {
          callback(rawUrl);
        }
      };
      img.onerror = function() { callback(rawUrl); };
      img.src = rawUrl;
    };
    reader.onerror = function() { callback(''); };
    reader.readAsDataURL(file);
  }
  function atualizarPreviewFotoModalEq() {
    var prev = document.getElementById('novo-eq-foto-preview');
    var btnRem = document.getElementById('btn-remover-foto-eq');
    if (prev) {
      var safeFotoModal = safeEqMedia(fotoUrlModalEq);
      if (safeFotoModal) {
        prev.innerHTML = '<img src="' + safeFotoModal + '" alt="Foto Equipamento" style="width:100%;height:100%;object-fit:cover;cursor:pointer;" onclick="abrirQuickLook(this.src, \'Foto do Equipamento\')" />';
      } else {
        prev.innerHTML = '<i data-lucide="camera" style="width:22px;height:22px;"></i>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
    if (btnRem) btnRem.style.display = fotoUrlModalEq ? 'inline-flex' : 'none';
  }
  function processarFotoEquipamentoInput(input) {
    var file = input && input.files && input.files[0];
    if (!file) return;
    comprimirImagemEquipamento(file, 640, 0.82, function(dataUrl) {
      fotoUrlModalEq = dataUrl || '';
      atualizarPreviewFotoModalEq();
      if (input) input.value = '';
    });
  }
  window.processarFotoEquipamentoInput = processarFotoEquipamentoInput;
  function removerFotoEquipamentoModal() {
    fotoUrlModalEq = '';
    atualizarPreviewFotoModalEq();
  }
  window.removerFotoEquipamentoModal = removerFotoEquipamentoModal;
  function atualizarBarraTagLiveUNoModal() {
    var bar = document.getElementById('eq-modal-tag-liveu-bar');
    var res = document.getElementById('eq-modal-liveu-resumo');
    if (!bar) return;
    var temLiveU = tagsSelecionadasModalEq.indexOf('LiveU') !== -1;
    bar.style.display = temLiveU ? 'flex' : 'none';
    if (temLiveU && res) {
      var lu = normalizarDadosLiveU(dadosTagsModalEq && dadosTagsModalEq.liveu);
      if (lu.slots.length > 0) {
        var cInt = lu.slots.filter(function(s){ return s.inserido === 'Interno'; }).length;
        var cExt = lu.slots.filter(function(s){ return s.inserido === 'Externo'; }).length;
        res.textContent = lu.slots.length + ' chip(s)/modem(s) (' + cInt + ' interno, ' + cExt + ' externo)';
      } else if (lu.chips_modens_tv) {
        res.textContent = lu.chips_modens_tv;
      } else {
        res.textContent = 'Nenhum chip/modem configurado';
      }
    }
  }
  function renderSeletorTagsModalEq() {
    var container = document.getElementById('eq-modal-tags-selector');
    if (!container) return;
    container.innerHTML = TAGS_PADRAO_EQUIPAMENTOS.map(function(tag) {
      var ativa = tagsSelecionadasModalEq.indexOf(tag) !== -1;
      var st = ativa
        ? 'background:#0071E3;color:#FFFFFF;border-color:#0071E3;font-weight:700;'
        : 'background:#F8FAFC;color:var(--txt2);border-color:var(--border);font-weight:500;';
      return (
        '<button type="button" onclick="toggleTagModalEquipamento(\'' + escapeJSString(tag) + '\')" style="border:1px solid;border-radius:16px;padding:4px 11px;font-size:11.5px;cursor:pointer;transition:all .12s;' + st + '">' +
          (ativa ? '✓ ' : '+ ') + escapeHTML(tag) +
        '</button>'
      );
    }).join('');
    atualizarBarraTagLiveUNoModal();
    atualizarBarraTagRedeNoModal();
  }
  function atualizarBarraTagRedeNoModal() {
    var bar = document.getElementById('eq-modal-tag-rede-bar');
    var resumoEl = document.getElementById('eq-modal-rede-resumo');
    if (!bar) return;
    var temTagRede = tagsSelecionadasModalEq.indexOf('Rede/Fibra') !== -1;
    var rd = normalizarDadosRede(dadosTagsModalEq && dadosTagsModalEq.rede);
    var temDadosRede = Boolean(rd.ip_gerencia || rd.gateway_vlan || rd.switch_porta || rd.provedor_circuito || rd.velocidade || rd.obs_rede);
    bar.style.display = (temTagRede || temDadosRede) ? 'flex' : 'none';
    if (resumoEl) {
      var partes = [rd.ip_gerencia, rd.provedor_circuito, rd.switch_porta].filter(Boolean);
      resumoEl.textContent = partes.length > 0 ? partes.join(' · ') : 'Nenhum dado de rede configurado';
    }
  }
  function abrirModalTagRede(eqIdOpcional) {
    redeModalTargetEqId = eqIdOpcional || null;
    var dados = {};
    var subTxt = 'Endereçamento IP, gateway/VLAN, porta do switch, provedor e circuito dedicado';
    if (redeModalTargetEqId) {
      var eqAlvo = (catalogoEquipamentos || []).find(function(e) { return e.id === redeModalTargetEqId; });
      if (eqAlvo) {
        dados = normalizarDadosRede(eqAlvo.dados_tags && eqAlvo.dados_tags.rede);
        subTxt = eqAlvo.nome + ' · Endereçamento IP, switch, VLAN e circuito';
      }
    } else {
      dados = normalizarDadosRede(dadosTagsModalEq && dadosTagsModalEq.rede);
    }
    var subEl = document.getElementById('rede-modal-subtitle');
    if (subEl) subEl.textContent = subTxt;
    var setVal = function(id, v) {
      var el = document.getElementById(id);
      if (el) el.value = v || '';
    };
    setVal('rede-ip-gerencia', dados.ip_gerencia);
    setVal('rede-gateway-vlan', dados.gateway_vlan);
    setVal('rede-switch-porta', dados.switch_porta);
    setVal('rede-provedor-circuito', dados.provedor_circuito);
    setVal('rede-velocidade', dados.velocidade);
    setVal('rede-obs', dados.obs_rede);
    abrirPopup('popup-eq-tag-rede');
    var ipEl = document.getElementById('rede-ip-gerencia');
    if (ipEl) setTimeout(function() { ipEl.focus(); }, 120);
  }
  window.abrirModalTagRede = abrirModalTagRede;
  function salvarDadosModalTagRede() {
    var getVal = function(id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    var novoRede = normalizarDadosRede({
      ip_gerencia: getVal('rede-ip-gerencia'),
      gateway_vlan: getVal('rede-gateway-vlan'),
      switch_porta: getVal('rede-switch-porta'),
      provedor_circuito: getVal('rede-provedor-circuito'),
      velocidade: getVal('rede-velocidade'),
      obs_rede: getVal('rede-obs')
    });
    if (redeModalTargetEqId) {
      var eqAlvo = (catalogoEquipamentos || []).find(function(e) { return e.id === redeModalTargetEqId; });
      if (eqAlvo) {
        var antesRede = normalizarDadosRede(eqAlvo.dados_tags && eqAlvo.dados_tags.rede);
        if (!eqAlvo.dados_tags || typeof eqAlvo.dados_tags !== 'object') eqAlvo.dados_tags = {};
        eqAlvo.dados_tags.rede = novoRede;
        if (JSON.stringify(antesRede) !== JSON.stringify(novoRede)) {
          if (!Array.isArray(eqAlvo.historico_edicoes)) eqAlvo.historico_edicoes = [];
          eqAlvo.historico_edicoes.unshift({
            autor: (typeof getUsuarioAtual === 'function') ? getUsuarioAtual() : 'Operador',
            dataHora: (typeof formatDataHoraLocal === 'function') ? formatDataHoraLocal() : new Date().toLocaleString('pt-BR'),
            mudancas: [{
              campo: 'Ficha Rede/Fibra',
              antes: [antesRede.ip_gerencia, antesRede.provedor_circuito].filter(Boolean).join(' · ') || 'Sem dados',
              depois: [novoRede.ip_gerencia, novoRede.provedor_circuito].filter(Boolean).join(' · ') || 'Atualizado'
            }]
          });
          if (eqAlvo.historico_edicoes.length > 30) eqAlvo.historico_edicoes = eqAlvo.historico_edicoes.slice(0, 30);
        }
        eqAlvo.atualizado_em = Date.now();
        eqAlvo._dirtyLocal = true;
        if (!eqAlvo.metricas || typeof eqAlvo.metricas !== 'object') eqAlvo.metricas = { conf: 0, nc: 0, canc: 0 };
        eqAlvo.metricas.dados_tags = eqAlvo.dados_tags;
        eqAlvo.metricas.historico_edicoes = eqAlvo.historico_edicoes;
        eqAlvo.metricas.atualizado_em = eqAlvo.atualizado_em;
        salvarCatalogoEquipamentosLocal();
        salvarEquipamentoPostgreSQL(eqAlvo, true);
        renderCatalogoEquipamentos();
        if (eqFichaAbertaId === eqAlvo.id) {
          abrirFichaVidaEquipamento(eqAlvo.id, true);
        }
      }
      if (!dadosTagsModalEq || typeof dadosTagsModalEq !== 'object') dadosTagsModalEq = {};
      var idEditModal = document.getElementById('novo-eq-id');
      if (idEditModal && idEditModal.value.trim() === redeModalTargetEqId) {
        dadosTagsModalEq.rede = novoRede;
        atualizarBarraTagRedeNoModal();
      }
      if (typeof mostrarToast === 'function') {
        mostrarToast('Dados Rede/Fibra Atualizados', 'Informações de rede e fibra salvas na Ficha de Vida.', 'success');
      }
    } else {
      if (!dadosTagsModalEq || typeof dadosTagsModalEq !== 'object') dadosTagsModalEq = {};
      dadosTagsModalEq.rede = novoRede;
      atualizarBarraTagRedeNoModal();
      if (typeof mostrarToast === 'function') {
        mostrarToast('Rede/Fibra Aplicado', 'Clique em "Salvar Equipamento" para gravar definitivamente no catálogo.', 'info');
      }
    }
    redeModalTargetEqId = null;
    fecharPopup('popup-eq-tag-rede');
  }
  window.salvarDadosModalTagRede = salvarDadosModalTagRede;
  function renderSecaoRedeFicha(eq) {
    var sec = document.getElementById('ficha-eq-rede-section');
    if (!sec || !eq) return;
    var temTagRede = Array.isArray(eq.tags) && eq.tags.indexOf('Rede/Fibra') !== -1;
    var rd = normalizarDadosRede(eq.dados_tags && eq.dados_tags.rede);
    var temDados = Boolean(rd.ip_gerencia || rd.gateway_vlan || rd.switch_porta || rd.provedor_circuito || rd.velocidade || rd.obs_rede);
    if (!temTagRede && !temDados) {
      sec.style.display = 'none';
      sec.innerHTML = '';
      return;
    }
    sec.style.display = 'block';
    sec.innerHTML =
      '<div style="padding:10px 14px;background:#ECFDF5;border-bottom:1px solid #A7F3D0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
        '<div style="display:flex;align-items:center;gap:7px;font-size:12px;font-weight:800;color:#065F46;">' +
          '<i data-lucide="network" style="width:14px;height:14px;"></i>' +
          '<span>Ficha Técnica — Rede &amp; Fibra</span>' +
        '</div>' +
        '<button type="button" class="btn btn-sm" onclick="abrirModalTagRede(\'' + escapeJSString(eq.id) + '\')" style="background:#059669;color:#FFFFFF;border:none;font-size:11px;font-weight:700;padding:4px 10px;">Editar Rede/Fibra</button>' +
      '</div>' +
      (temDados
        ? '<div style="padding:12px 14px;display:grid;grid-template-columns:repeat(auto-fit, minmax(175px, 1fr));gap:10px;font-size:12px;">' +
            '<div><span style="color:var(--muted);display:block;font-size:10.5px;">IP Gerência / Link</span><strong style="font-family:monospace;color:var(--txt);">' + escapeHTML(rd.ip_gerencia || 'Não informado') + '</strong></div>' +
            '<div><span style="color:var(--muted);display:block;font-size:10.5px;">Gateway / VLAN / Máscara</span><strong style="color:var(--txt);">' + escapeHTML(rd.gateway_vlan || 'Não informado') + '</strong></div>' +
            '<div><span style="color:var(--muted);display:block;font-size:10.5px;">Switch / Porta / DIO</span><strong style="color:var(--txt);">' + escapeHTML(rd.switch_porta || 'Não informado') + '</strong></div>' +
            '<div><span style="color:var(--muted);display:block;font-size:10.5px;">Provedor / Circuito</span><strong style="color:var(--txt);">' + escapeHTML(rd.provedor_circuito || 'Não informado') + '</strong></div>' +
            '<div><span style="color:var(--muted);display:block;font-size:10.5px;">Velocidade / Banda</span><strong style="color:var(--txt);">' + escapeHTML(rd.velocidade || 'Não informado') + '</strong></div>' +
            '<div><span style="color:var(--muted);display:block;font-size:10.5px;">Observações de Rede</span><span style="color:var(--txt2);">' + escapeHTML(rd.obs_rede || '—') + '</span></div>' +
          '</div>'
        : '<div style="padding:12px 14px;font-size:12px;color:var(--muted);">Nenhum parâmetro de rede/fibra cadastrado ainda. Clique em <strong>Editar Rede/Fibra</strong> para informar IP, VLAN, porta de switch e operadora.</div>');
  }
  function toggleTagModalEquipamento(tag) {
    var idx = tagsSelecionadasModalEq.indexOf(tag);
    if (idx === -1) tagsSelecionadasModalEq.push(tag);
    else tagsSelecionadasModalEq.splice(idx, 1);
    renderSeletorTagsModalEq();
  }
  window.toggleTagModalEquipamento = toggleTagModalEquipamento;
  function gerarDiffEquipamento(antes, depois) {
    var mudancas = [];
    if (!antes || !depois) return mudancas;
    var campos = [
      { k: 'nome', label: 'Nome' },
      { k: 'codigo_patrimonio', label: 'ID / Patrimônio' },
      { k: 'numero_serie', label: 'Nº de Série' },
      { k: 'fabricante_modelo', label: 'Fabricante / Modelo' },
      { k: 'categoria', label: 'Categoria' },
      { k: 'setor_local', label: 'Setor / Local' },
      { k: 'status_operacional', label: 'Status Operacional' },
      { k: 'obs_tecnicas', label: 'Observações Técnicas' }
    ];
    campos.forEach(function(c) {
      var vA = String(antes[c.k] || '').trim() || '—';
      var vD = String(depois[c.k] || '').trim() || '—';
      if (vA !== vD) {
        mudancas.push({ campo: c.label, antes: vA, depois: vD });
      }
    });
    var exA = (antes.exibir_nos_relatorios !== false) ? 'Sim' : 'Não';
    var exD = (depois.exibir_nos_relatorios !== false) ? 'Sim' : 'Não';
    if (exA !== exD) mudancas.push({ campo: 'Exibir nos Relatórios', antes: exA, depois: exD });
    var tA = (antes.tags || []).join(', ') || '—';
    var tD = (depois.tags || []).join(', ') || '—';
    if (tA !== tD) mudancas.push({ campo: 'Tags', antes: tA, depois: tD });
    var fA = antes.foto_url ? 'Com foto' : 'Sem foto';
    var fD = depois.foto_url ? 'Com foto' : 'Sem foto';
    if (antes.foto_url !== depois.foto_url) mudancas.push({ campo: 'Foto do Equipamento', antes: fA, depois: fD });
    var luA = JSON.stringify((antes.dados_tags && antes.dados_tags.liveu) || {});
    var luD = JSON.stringify((depois.dados_tags && depois.dados_tags.liveu) || {});
    if (luA !== luD) {
      var sA = (antes.dados_tags && antes.dados_tags.liveu && Array.isArray(antes.dados_tags.liveu.slots)) ? antes.dados_tags.liveu.slots.length : 0;
      var sD = (depois.dados_tags && depois.dados_tags.liveu && Array.isArray(depois.dados_tags.liveu.slots)) ? depois.dados_tags.liveu.slots.length : 0;
      mudancas.push({ campo: 'Ficha LiveU (Chips/Modens)', antes: sA + ' slot(s)', depois: sD + ' slot(s) atualizado(s)' });
    }
    var rdA = normalizarDadosRede(antes.dados_tags && antes.dados_tags.rede);
    var rdD = normalizarDadosRede(depois.dados_tags && depois.dados_tags.rede);
    if (JSON.stringify(rdA) !== JSON.stringify(rdD)) {
      mudancas.push({
        campo: 'Ficha Rede/Fibra',
        antes: [rdA.ip_gerencia, rdA.provedor_circuito].filter(Boolean).join(' · ') || 'Sem dados',
        depois: [rdD.ip_gerencia, rdD.provedor_circuito].filter(Boolean).join(' · ') || 'Atualizado'
      });
    }
    return mudancas;
  }
  function abrirModalCadastroEquipamento(idEdicao) {
    var idEl     = document.getElementById('novo-eq-id');
    var nomeEl   = document.getElementById('novo-eq-nome');
    var patEl    = document.getElementById('novo-eq-patrimonio');
    var serieEl  = document.getElementById('novo-eq-serie');
    var modEl    = document.getElementById('novo-eq-modelo');
    var tipoEl   = document.getElementById('novo-eq-tipo');
    var setorEl  = document.getElementById('novo-eq-setor');
    var statusEl = document.getElementById('novo-eq-status');
    var exRelEl  = document.getElementById('novo-eq-exibir-relatorios');
    var obsEl    = document.getElementById('novo-eq-obs');
    var titleEl  = document.getElementById('novo-eq-title');
    var eqExistente = idEdicao
      ? (catalogoEquipamentos || []).find(function(e) { return e.id === idEdicao || e.nome === idEdicao; })
      : null;
    if (eqExistente) {
      if (titleEl)  titleEl.textContent = 'Modificar Equipamento · ' + eqExistente.nome;
      if (idEl)     idEl.value     = eqExistente.id;
      if (nomeEl)   nomeEl.value   = eqExistente.nome;
      if (patEl)    patEl.value    = eqExistente.codigo_patrimonio || '';
      if (serieEl)  serieEl.value  = eqExistente.numero_serie || '';
      if (modEl)    modEl.value    = eqExistente.fabricante_modelo || '';
      if (tipoEl)   tipoEl.value   = eqExistente.categoria || 'Mochilink / LiveU';
      if (setorEl)  setorEl.value  = eqExistente.setor_local || '';
      if (statusEl) statusEl.value = eqExistente.status_operacional || 'operacional';
      if (exRelEl)  exRelEl.checked = (eqExistente.exibir_nos_relatorios !== false);
      if (obsEl)    obsEl.value    = eqExistente.obs_tecnicas || '';
      tagsSelecionadasModalEq = Array.isArray(eqExistente.tags) ? eqExistente.tags.slice() : ['Transmissão'];
      fotoUrlModalEq = eqExistente.foto_url || '';
      dadosTagsModalEq = JSON.parse(JSON.stringify(eqExistente.dados_tags || {}));
    } else {
      if (titleEl)  titleEl.textContent = 'Cadastrar Novo Equipamento';
      if (idEl)     idEl.value     = '';
      if (nomeEl)   nomeEl.value   = '';
      if (patEl)    patEl.value    = '';
      if (serieEl)  serieEl.value  = '';
      if (modEl)    modEl.value    = '';
      if (tipoEl)   tipoEl.selectedIndex = 0;
      if (setorEl)  setorEl.value  = 'Estúdio / Central Técnica';
      if (statusEl) statusEl.value = 'operacional';
      if (exRelEl)  exRelEl.checked = true;
      if (obsEl)    obsEl.value    = '';
      tagsSelecionadasModalEq = ['Transmissão'];
      fotoUrlModalEq = '';
      dadosTagsModalEq = {};
    }
    atualizarPreviewFotoModalEq();
    renderSeletorTagsModalEq();
    abrirPopup('popup-novo-equipamento');
    if (nomeEl) setTimeout(function() { nomeEl.focus(); }, 150);
  }
  window.abrirModalCadastroEquipamento = abrirModalCadastroEquipamento;
  window.abrirModalNovoEquipamento = abrirModalCadastroEquipamento;
  function salvarNovoEquipamentoDashboard() {
    var idEl     = document.getElementById('novo-eq-id');
    var nomeEl   = document.getElementById('novo-eq-nome');
    var patEl    = document.getElementById('novo-eq-patrimonio');
    var serieEl  = document.getElementById('novo-eq-serie');
    var modEl    = document.getElementById('novo-eq-modelo');
    var tipoEl   = document.getElementById('novo-eq-tipo');
    var setorEl  = document.getElementById('novo-eq-setor');
    var statusEl = document.getElementById('novo-eq-status');
    var exRelEl  = document.getElementById('novo-eq-exibir-relatorios');
    var obsEl    = document.getElementById('novo-eq-obs');
    var exibirRelVal = exRelEl ? !!exRelEl.checked : true;
    var idEdicao = idEl ? idEl.value.trim() : '';
    var nome = (nomeEl ? nomeEl.value : '').trim().toUpperCase();
    if (!nome) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Campo Obrigatório', 'Por favor, informe o Nome de Identificação do equipamento.', 'warning');
      }
      if (nomeEl) nomeEl.focus();
      return;
    }
    var praca = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var duplicado = (catalogoEquipamentos || []).find(function(e) {
      return e.status_operacional !== 'lixeira' && e.praca === praca && e.nome === nome && e.id !== idEdicao;
    });
    if (duplicado) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Equipamento Duplicado', 'Já existe um equipamento ativo com o nome "' + nome + '" na praça de ' + praca + '.', 'warning');
      }
      return;
    }
    var itemSalvo = null;
    var operadorAtual = (typeof getUsuarioAtual === 'function') ? getUsuarioAtual() : 'Operador';
    var dadosTagsFinal = JSON.parse(JSON.stringify(dadosTagsModalEq || {}));
    if (dadosTagsFinal.liveu) dadosTagsFinal.liveu = normalizarDadosLiveU(dadosTagsFinal.liveu);
    if (dadosTagsFinal.rede) dadosTagsFinal.rede = normalizarDadosRede(dadosTagsFinal.rede);
    if (idEdicao) {
      catalogoEquipamentos = catalogoEquipamentos.map(function(e) {
        if (e.id === idEdicao) {
          var snapshotAntes = JSON.parse(JSON.stringify(e));
          e.nome               = nome;
          e.codigo_patrimonio  = patEl ? patEl.value.trim() : '';
          e.numero_serie       = serieEl ? serieEl.value.trim() : '';
          e.fabricante_modelo  = modEl ? modEl.value.trim() : '';
          e.categoria          = tipoEl ? tipoEl.value : 'Mochilink / LiveU';
          e.setor_local        = setorEl ? setorEl.value.trim() : '';
          e.status_operacional = statusEl ? statusEl.value : 'operacional';
          e.exibir_nos_relatorios = exibirRelVal;
          e.foto_url           = fotoUrlModalEq || '';
          e.dados_tags         = dadosTagsFinal;
          e.obs_tecnicas       = obsEl ? obsEl.value.trim() : '';
          e.tags               = tagsSelecionadasModalEq.slice();
          e.atualizado_em      = Date.now();
          e._dirtyLocal        = true;
          var mudancas = gerarDiffEquipamento(snapshotAntes, e);
          if (mudancas.length > 0) {
            if (!Array.isArray(e.historico_edicoes)) e.historico_edicoes = [];
            e.historico_edicoes.unshift({
              autor: operadorAtual,
              dataHora: (typeof formatDataHoraLocal === 'function') ? formatDataHoraLocal() : new Date().toLocaleString('pt-BR'),
              mudancas: mudancas
            });
            if (e.historico_edicoes.length > 30) e.historico_edicoes = e.historico_edicoes.slice(0, 30);
          }
          if (!e.metricas || typeof e.metricas !== 'object') e.metricas = { conf: 0, nc: 0, canc: 0 };
          e.metricas.exibir_nos_relatorios = exibirRelVal;
          e.metricas.foto_url = e.foto_url;
          e.metricas.dados_tags = e.dados_tags;
          e.metricas.historico_edicoes = e.historico_edicoes;
          e.metricas.atualizado_em = e.atualizado_em;
          itemSalvo = e;
        }
        return e;
      });
    } else {
      itemSalvo = sanitizarEquipamento({
        id: 'eq_' + Date.now(),
        nome: nome,
        codigo_patrimonio: patEl ? patEl.value.trim() : '',
        numero_serie: serieEl ? serieEl.value.trim() : '',
        fabricante_modelo: modEl ? modEl.value.trim() : '',
        categoria: tipoEl ? tipoEl.value : 'Mochilink / LiveU',
        praca: praca,
        setor_local: setorEl ? setorEl.value.trim() : 'Central Técnica',
        status_operacional: statusEl ? statusEl.value : 'operacional',
        exibir_nos_relatorios: exibirRelVal,
        foto_url: fotoUrlModalEq || '',
        dados_tags: dadosTagsFinal,
        historico_edicoes: [],
        atualizado_em: Date.now(),
        obs_tecnicas: obsEl ? obsEl.value.trim() : '',
        tags: tagsSelecionadasModalEq.slice(),
        _dirtyLocal: true,
        criado_por: operadorAtual,
        criado_em: Date.now()
      });
      catalogoEquipamentos.push(itemSalvo);
    }
    window._ultimoEqAdicionado = nome;
    salvarCatalogoEquipamentosLocal();
    if (itemSalvo) salvarEquipamentoPostgreSQL(itemSalvo, !!idEdicao);
    if (window._eqTriggeringSelect) {
      try {
        window._eqTriggeringSelect.value = nome;
      } catch (eSel) {}
      window._eqTriggeringSelect = null;
    }
    fecharPopup('popup-novo-equipamento');
    renderCatalogoEquipamentos();
    if (typeof renderDashboards === 'function') renderDashboards();
    if (eqFichaAbertaId && itemSalvo && eqFichaAbertaId === itemSalvo.id) {
      var fichaPop = document.getElementById('popup-ficha-vida-equipamento');
      if (fichaPop && !fichaPop.hasAttribute('hidden')) {
        abrirFichaVidaEquipamento(itemSalvo.id, true);
      }
    }
    if (typeof mostrarToast === 'function') {
      mostrarToast(
        idEdicao ? 'Equipamento Atualizado' : 'Equipamento Cadastrado',
        nome + ' salvo no banco de dados e sincronizado em tempo real.',
        'success'
      );
    }
  }
  window.salvarNovoEquipamentoDashboard = salvarNovoEquipamentoDashboard;
  function excluirEquipamentoParaLixeira(idEq) {
    var eq = (catalogoEquipamentos || []).find(function(e) { return e.id === idEq || e.nome === idEq; });
    if (!eq) return;
    if (!confirm('Deseja mover o equipamento "' + eq.nome + '" para a Lixeira?\n\nEle deixará de aparecer nos novos relatórios, mas seu histórico será preservado na Lixeira por 7 dias.')) {
      return;
    }
    eq.status_operacional = 'lixeira';
    eq.atualizado_em = Date.now();
    eq._dirtyLocal = true;
    salvarCatalogoEquipamentosLocal();
    salvarEquipamentoPostgreSQL(eq, true);
    if (Array.isArray(Store.lixeiraData)) {
      var itemLixeira = {
        id: eq.id,
        dataExclusao: Date.now(),
        expiraEm: Date.now() + 7 * 24 * 60 * 60 * 1000,
        titulo: '[EQUIPAMENTO] ' + eq.nome + (eq.codigo_patrimonio ? ' (' + eq.codigo_patrimonio + ')' : ''),
        ocOriginal: null,
        histOriginal: {
          id: eq.id,
          tipo: 'equipamento',
          titulo: '[EQUIPAMENTO] ' + eq.nome,
          descCriacao: 'ID/Patrimônio: ' + (eq.codigo_patrimonio || 'N/A') + ' · Nº Série: ' + (eq.numero_serie || 'N/A') + ' · Modelo: ' + (eq.fabricante_modelo || eq.categoria),
          local: eq.setor_local || eq.praca,
          praca: eq.praca,
          eqOriginal: Object.assign({}, eq)
        },
        excluidoPor: getUsuarioAtual(),
        notificado24h: false,
        praca: eq.praca
      };
      Store.lixeiraData = [itemLixeira].concat(Store.lixeiraData.filter(function(i) { return i.id !== eq.id; }));
      saveLixeira(Store.lixeiraData);
      salvarItemLixeiraNuvem(itemLixeira);
    }
    fecharPopup('popup-ficha-vida-equipamento');
    renderCatalogoEquipamentos();
    if (typeof renderDashboards === 'function') renderDashboards();
    if (typeof renderLixeira === 'function') renderLixeira();
    if (typeof mostrarToast === 'function') {
      mostrarToast('Equipamento na Lixeira', eq.nome + ' foi movido para a Lixeira.', 'info');
    }
  }
  window.excluirEquipamentoParaLixeira = excluirEquipamentoParaLixeira;
  function abrirOcorrenciaDiretaEquipamento(idOuNome) {
    var eq = (catalogoEquipamentos || []).find(function(e) { return e.id === idOuNome || e.nome === idOuNome; });
    fecharPopup('popup-ficha-vida-equipamento');
    abrirPopup('popup-nova-oc');
    if (eq) {
      var selEq = document.getElementById('nova-equipamento');
      if (selEq) {
        var existeOpt = Array.prototype.some.call(selEq.options || [], function(op) { return op.value === eq.nome; });
        if (!existeOpt) {
          var novaOpt = document.createElement('option');
          novaOpt.value = eq.nome;
          novaOpt.textContent = eq.nome;
          selEq.appendChild(novaOpt);
        }
        selEq.value = eq.nome;
      }
      var catEl = document.getElementById('nova-cat');
      if (catEl) catEl.value = 'Equipamento';
      var locEl = document.getElementById('nova-local');
      if (locEl && !locEl.value) locEl.value = (eq.setor_local ? eq.setor_local + ' — ' : '') + eq.praca;
      var titEl = document.getElementById('nova-titulo');
      if (titEl && !titEl.value) {
        titEl.value = 'Manutenção / Falha em ' + eq.nome;
        if (typeof validarNova === 'function') validarNova();
      }
    }
  }
  window.abrirOcorrenciaDiretaEquipamento = abrirOcorrenciaDiretaEquipamento;
  var filtroFichaEqAtual = 'todos';
  var dadosTimelineFichaEqAtual = { ocs: [], rels: [] };
  function renderTimelineFichaEquipamento() {
    var elTimeline = document.getElementById('ficha-eq-timeline');
    if (!elTimeline) return;
    var ocs = dadosTimelineFichaEqAtual.ocs || [];
    var rels = dadosTimelineFichaEqAtual.rels || [];
    if (typeof atualizarBotoesFiltroTimelineModal === 'function') {
      atualizarBotoesFiltroTimelineModal(
        {
          cntTodos: 'ficha-eq-cnt-todos',
          cntOc: 'ficha-eq-cnt-oc',
          cntRel: 'ficha-eq-cnt-rel',
          btnTodos: 'btn-ficha-eq-todos',
          btnOc: 'btn-ficha-eq-oc',
          btnRel: 'btn-ficha-eq-rel'
        },
        filtroFichaEqAtual,
        ocs.length + rels.length,
        ocs.length,
        rels.length
      );
    }
    var emptyAll = 'Nenhuma ocorrência ou relatório registrado no histórico de vida deste equipamento.';
    elTimeline.innerHTML = (typeof renderCardsTimelineMistaHTML === 'function')
      ? renderCardsTimelineMistaHTML(ocs, rels, filtroFichaEqAtual, 'popup-ficha-vida-equipamento', (ocs.length === 0 && rels.length === 0) ? emptyAll : '')
      : '';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  function filtrarTimelineFichaEquipamento(filtro) {
    filtroFichaEqAtual = filtro || 'todos';
    renderTimelineFichaEquipamento();
  }
  window.filtrarTimelineFichaEquipamento = filtrarTimelineFichaEquipamento;
  function renderSecaoLiveUFicha(eq) {
    var sec = document.getElementById('ficha-eq-liveu-section');
    if (!sec) return;
    var temTagLiveU = Array.isArray(eq.tags) && eq.tags.indexOf('LiveU') !== -1;
    var lu = (eq.dados_tags && eq.dados_tags.liveu) ? normalizarDadosLiveU(eq.dados_tags.liveu) : null;
    if (!temTagLiveU && (!lu || (!lu.chips_modens_tv && lu.slots.length === 0))) {
      sec.style.display = 'none';
      sec.innerHTML = '';
      return;
    }
    var slots = lu ? lu.slots : [];
    var cntInt = slots.filter(function(s){ return s.inserido === 'Interno'; }).length;
    var cntExt = slots.filter(function(s){ return s.inserido === 'Externo'; }).length;
    var cntDesc = slots.filter(function(s){ return s.inserido !== 'Interno' && s.inserido !== 'Externo'; }).length;
    var slotsHTML = slots.length > 0
      ? slots.map(function(s, idx) {
          var badgeIns = s.inserido === 'Interno'
            ? '<span style="padding:2px 8px;border-radius:999px;background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;font-size:10.5px;font-weight:700;">Interno</span>'
            : (s.inserido === 'Externo'
                ? '<span style="padding:2px 8px;border-radius:999px;background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;font-size:10.5px;font-weight:700;">Externo</span>'
                : '<span style="padding:2px 8px;border-radius:999px;background:#FFFBEB;color:#B45309;border:1px solid #FDE68A;font-size:10.5px;font-weight:700;">Desconhecido</span>');
          var imgsHTML = (s.imagens && s.imagens.length > 0)
            ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">' +
                s.imagens.map(function(imgSrc) {
                  var safeChipSrc = safeEqMedia(imgSrc);
                  if (!safeChipSrc) return '';
                  var lblSlot = 'Slot ' + (idx + 1) + ' — ' + escapeHTML(s.operadora || 'Chip');
                  return '<img src="' + safeChipSrc + '" alt="Chip Slot ' + (idx + 1) + '" data-ql-label="' + lblSlot + '" onclick="abrirQuickLook(this.src, this.getAttribute(\'data-ql-label\'))" style="width:54px;height:54px;object-fit:cover;border-radius:7px;border:1px solid #CBD5E1;cursor:pointer;" title="Clique para ampliar imagem do chip/modem" />';
                }).join('') +
              '</div>'
            : '';
          return (
            '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px 12px;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;flex-wrap:wrap;">' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                  '<span style="font-size:11px;font-weight:800;color:#0071E3;background:#DBEAFE;padding:2px 8px;border-radius:6px;">Slot ' + (idx + 1) + '</span>' +
                  '<strong style="font-size:12.5px;color:#0F172A;">' + escapeHTML(s.operadora || 'Operadora N/I') + '</strong>' +
                '</div>' +
                badgeIns +
              '</div>' +
              '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(145px, 1fr));gap:8px;font-size:11.5px;">' +
                '<div><span style="color:#64748B;font-size:10px;display:block;">Numeração do Chip (ICCID)</span><strong style="font-family:monospace;color:#0F172A;">' + escapeHTML(s.numero_chip || '—') + '</strong></div>' +
                '<div><span style="color:#64748B;font-size:10px;display:block;">Número de Telefone</span><strong style="font-family:monospace;color:#0F172A;">' + escapeHTML(s.telefone || '—') + '</strong></div>' +
                '<div><span style="color:#64748B;font-size:10px;display:block;">IMEI Modem</span><strong style="font-family:monospace;color:#0F172A;">' + escapeHTML(s.imei || '—') + '</strong></div>' +
              '</div>' +
              imgsHTML +
            '</div>'
          );
        }).join('')
      : '<div style="padding:12px;text-align:center;font-size:12px;color:#64748B;background:#F8FAFC;border:1px dashed #CBD5E1;border-radius:8px;">Nenhum chip ou modem cadastrado neste LiveU. Clique em <strong>Configurar Chips &amp; Modens</strong> para preencher.</div>';
    sec.style.display = 'block';
    sec.innerHTML =
      '<div style="background:#EFF6FF;padding:10px 14px;border-bottom:1px solid #BFDBFE;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
          '<i data-lucide="radio" style="width:15px;height:15px;color:#0071E3;"></i>' +
          '<span style="font-size:11.5px;font-weight:800;color:#1E3A8A;text-transform:uppercase;letter-spacing:.04em;">Ficha Técnica LiveU · Chips &amp; Modens</span>' +
          (slots.length > 0 ? '<span style="font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:999px;background:#FFFFFF;color:#1D4ED8;border:1px solid #93C5FD;">' + slots.length + ' Slot(s) · ' + cntInt + ' Int / ' + cntExt + ' Ext' + (cntDesc > 0 ? ' / ' + cntDesc + ' Desc' : '') + '</span>' : '') +
        '</div>' +
        '<div style="display:flex;gap:6px;">' +
          '<button type="button" class="btn btn-xs" onclick="copiarDadosLiveUFicha(\'' + escapeJSString(eq.id) + '\')" style="background:#FFFFFF;color:#0071E3;border:1px solid #93C5FD;font-weight:700;padding:4px 9px;font-size:11px;display:inline-flex;align-items:center;gap:4px;">' +
            '<i data-lucide="copy" style="width:11px;height:11px;"></i> Copiar Chips/IMEIs' +
          '</button>' +
          '<button type="button" class="btn btn-xs" onclick="abrirModalTagLiveU(\'' + escapeJSString(eq.id) + '\')" style="background:#0071E3;color:#FFFFFF;border:1px solid #0071E3;font-weight:700;padding:4px 10px;font-size:11px;display:inline-flex;align-items:center;gap:4px;">' +
            '<i data-lucide="sliders" style="width:11px;height:11px;"></i> Configurar Chips &amp; Modens' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div style="padding:12px 14px;display:flex;flex-direction:column;gap:10px;">' +
        ((lu && (lu.chips_modens_tv || lu.obs_geral))
          ? '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:8px;font-size:11.5px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:8px 12px;">' +
              '<div><span style="color:#64748B;font-size:10px;display:block;">Chips e Modens TV</span><strong style="color:#0F172A;">' + escapeHTML((lu && lu.chips_modens_tv) || '—') + '</strong></div>' +
              '<div><span style="color:#64748B;font-size:10px;display:block;">Observações Gerais LiveU</span><strong style="color:#0F172A;">' + escapeHTML((lu && lu.obs_geral) || '—') + '</strong></div>' +
            '</div>'
          : '') +
        slotsHTML +
      '</div>';
  }
  function renderSecaoAuditoriaFicha(eq) {
    var sec = document.getElementById('ficha-eq-audit-section');
    if (!sec) return;
    var hist = Array.isArray(eq.historico_edicoes) ? eq.historico_edicoes : [];
    if (hist.length === 0) {
      sec.style.display = 'none';
      sec.innerHTML = '';
      return;
    }
    sec.style.display = 'block';
    sec.innerHTML =
      '<div style="background:#F8FAFC;padding:9px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">' +
        '<span style="font-size:11px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:.04em;display:inline-flex;align-items:center;gap:6px;">' +
          '<i data-lucide="file-clock" style="width:13px;height:13px;color:#0071E3;"></i>' +
          'Histórico de Alterações do Equipamento (' + hist.length + ')' +
        '</span>' +
      '</div>' +
      '<div style="padding:10px 14px;max-height:190px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">' +
        hist.slice(0, 10).map(function(ed) {
          var muds = (ed.mudancas || []).map(function(m) {
            return '<div style="font-size:11px;color:#334155;">• <strong>' + escapeHTML(m.campo || '') + ':</strong> <span style="color:#991B1B;">' + escapeHTML(m.antes || '—') + '</span> → <span style="color:#166534;font-weight:600;">' + escapeHTML(m.depois || '—') + '</span></div>';
          }).join('');
          return (
            '<div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:8px 10px;">' +
              '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">' +
                '<strong style="color:#0F172A;">' + escapeHTML(ed.autor || 'Operador') + '</strong>' +
                '<span style="color:#64748B;">' + escapeHTML(ed.dataHora || '') + '</span>' +
              '</div>' +
              muds +
            '</div>'
          );
        }).join('') +
      '</div>';
  }
  function abrirFichaVidaEquipamento(idOuNome, evitarAbrirPopup) {
    var eq = (catalogoEquipamentos || []).find(function(e) {
      return e.status_operacional !== 'lixeira' && (e.id === idOuNome || e.nome === idOuNome);
    });
    if (!eq) return;
    eqFichaAbertaId = eq.id;
    var ocs = obterOcorrenciasDoEquipamento(eq);
    var abertas = ocs.filter(function(o) { return o.status === 'aberta'; });
    var resolvidas = ocs.filter(function(o) { return o.status !== 'aberta'; });
    var metricObj = (Store.dashboardMetrics && Store.dashboardMetrics.equipamento)
      ? Store.dashboardMetrics.equipamento[eq.nome]
      : null;
    var txConf = metricObj ? (metricObj.conf || 0) : 0;
    var txNc   = metricObj ? (metricObj.nc   || 0) : 0;
    var txCanc = metricObj ? (metricObj.canc || 0) : 0;
    var txTot  = txConf + txNc + txCanc;
    var saudePct = txTot > 0 ? ((txConf / txTot) * 100).toFixed(1) + '%' : (abertas.length === 0 ? '100%' : 'Atenção');
    var elFoto   = document.getElementById('ficha-eq-foto-wrap');
    var elNome   = document.getElementById('ficha-eq-nome');
    var elSub    = document.getElementById('ficha-eq-sub');
    var elBadge  = document.getElementById('ficha-eq-status-badge');
    var elPat    = document.getElementById('ficha-eq-patrimonio');
    var elSerie  = document.getElementById('ficha-eq-serie');
    var elModelo = document.getElementById('ficha-eq-modelo');
    var elLocal  = document.getElementById('ficha-eq-local');
    var elObs    = document.getElementById('ficha-eq-obs');
    var elTags   = document.getElementById('ficha-eq-tags');
    var elKpiOcs   = document.getElementById('ficha-kpi-ocs');
    var elKpiRes   = document.getElementById('ficha-kpi-resolvidas');
    var elKpiTx    = document.getElementById('ficha-kpi-tx');
    var elKpiSaude = document.getElementById('ficha-kpi-saude');
    var elTimeline = document.getElementById('ficha-eq-timeline');
    if (elFoto) {
      var safeFotoFicha = safeEqMedia(eq.foto_url);
      if (safeFotoFicha) {
        elFoto.style.background = '#FFFFFF';
        elFoto.style.border = '1px solid var(--border)';
        elFoto.innerHTML = '<img src="' + safeFotoFicha + '" alt="' + escapeHTML(eq.nome) + '" onclick="abrirQuickLook(this.src, this.alt)" style="width:100%;height:100%;object-fit:cover;cursor:pointer;" title="Clique para ampliar foto" />';
      } else {
        elFoto.style.background = '#0071E3';
        elFoto.style.border = 'none';
        elFoto.innerHTML = '<i data-lucide="cpu" style="width:20px;height:20px;color:#fff;stroke-width:2;"></i>';
      }
    }
    if (elNome)   elNome.textContent   = eq.nome;
    if (elSub)    elSub.textContent    = (eq.categoria || 'Equipamento') + ' · ' + eq.praca;
    if (elPat)    elPat.textContent    = eq.codigo_patrimonio || 'Não cadastrado';
    if (elSerie)  elSerie.textContent  = eq.numero_serie || 'Não cadastrado';
    if (elModelo) elModelo.textContent = eq.fabricante_modelo || eq.categoria || 'Padrão';
    if (elLocal)  elLocal.textContent  = (eq.setor_local || 'Central Técnica') + ' (' + eq.praca + ')';
    if (elObs)    elObs.textContent    = eq.obs_tecnicas || 'Nenhuma observação técnica registrada para este equipamento.';
    var st = calcularStatusEquipamentoDinamico(eq);
    if (elBadge) {
      if (st === 'manutencao') {
        elBadge.className = 'tag tag-r';
        elBadge.textContent = '🔴 Em Manutenção';
      } else if (st === 'atencao') {
        elBadge.className = 'tag tag-y';
        elBadge.textContent = '🟡 Com Ocorrência Aberta (' + abertas.length + ')';
      } else {
        elBadge.className = 'tag tag-g';
        elBadge.textContent = '🟢 Operacional';
      }
    }
    if (elTags) {
      var tList = Array.isArray(eq.tags) ? eq.tags : [];
      elTags.innerHTML = tList.length > 0
        ? tList.map(function(t) {
            if (t === 'LiveU') {
              return '<button type="button" onclick="abrirModalTagLiveU(\'' + escapeJSString(eq.id) + '\')" title="Clique para gerenciar Chips & Modens LiveU" style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:14px;background:#0071E3;color:#FFFFFF;border:1px solid #0071E3;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">LiveU ⚙</button>';
            }
            if (t === 'Rede/Fibra') {
              return '<button type="button" onclick="abrirModalTagRede(\'' + escapeJSString(eq.id) + '\')" title="Clique para gerenciar Dados de Rede / Fibra" style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:14px;background:#059669;color:#FFFFFF;border:1px solid #059669;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">Rede/Fibra ⚙</button>';
            }
            return '<span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:14px;background:#EFF6FF;color:#0071E3;border:1px solid #BFDBFE;">' + escapeHTML(t) + '</span>';
          }).join('')
        : '<span style="font-size:11.5px;color:var(--muted);">Sem tags associadas</span>';
    }
    if (elKpiOcs)   elKpiOcs.textContent   = ocs.length;
    if (elKpiRes)   elKpiRes.textContent   = resolvidas.length;
    if (elKpiTx)    elKpiTx.textContent    = txTot;
    if (elKpiSaude) elKpiSaude.textContent = saudePct;
    renderSecaoLiveUFicha(eq);
    renderSecaoRedeFicha(eq);
    renderSecaoAuditoriaFicha(eq);
    var btnEdit = document.getElementById('btn-ficha-editar');
    var btnToggle = document.getElementById('btn-ficha-toggle-status');
    var btnDel  = document.getElementById('btn-ficha-excluir');
    var btnNova = document.getElementById('btn-ficha-nova-oc');
    if (btnEdit) btnEdit.onclick = function() { fecharPopup('popup-ficha-vida-equipamento'); abrirModalCadastroEquipamento(eq.id); };
    if (btnToggle) {
      var emManut = (eq.status_operacional === 'manutencao');
      btnToggle.innerHTML = emManut
        ? '<i data-lucide="check-circle-2" style="width:13px;height:13px;color:#059669;"></i> Marcar Operacional'
        : '<i data-lucide="wrench" style="width:13px;height:13px;color:#DC2626;"></i> Colocar em Manutenção';
      btnToggle.onclick = function() { alternarStatusManutencaoEquipamento(eq.id); };
    }
    if (btnDel)  btnDel.onclick  = function() { excluirEquipamentoParaLixeira(eq.id); };
    if (btnNova) btnNova.onclick = function() { abrirOcorrenciaDiretaEquipamento(eq.id); };
    if (elTimeline) {
      var nomeEqUp = String(eq.nome || '').toUpperCase().trim();
      var relsEq = (Array.isArray(Store.historicoSeedData) ? Store.historicoSeedData : []).filter(function(h) {
        if (!h || h.tipo !== 'relatorio') return false;
        var dH = h.dadosCTRS || Markers.extract(h.descResolucao || '', 'CTRS');
        if (dH && Array.isArray(dH.transmissoes) && dH.transmissoes.some(function(tx){ return tx && tx.infra && String(tx.infra).toUpperCase().trim() === nomeEqUp; })) return true;
        if (h.equipamento && String(h.equipamento).toUpperCase().indexOf(nomeEqUp) !== -1) return true;
        return false;
      });
      dadosTimelineFichaEqAtual = { ocs: ocs, rels: relsEq };
      filtroFichaEqAtual = 'todos';
      renderTimelineFichaEquipamento();
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (!evitarAbrirPopup) {
      abrirPopup('popup-ficha-vida-equipamento');
    }
  }
  window.abrirFichaVidaEquipamento = abrirFichaVidaEquipamento;
  function alternarStatusManutencaoEquipamento(idEq) {
    var eq = (catalogoEquipamentos || []).find(function(e) { return e.id === idEq; });
    if (!eq) return;
    var antesStatus = eq.status_operacional || 'operacional';
    var novoStatus = (antesStatus === 'manutencao') ? 'operacional' : 'manutencao';
    eq.status_operacional = novoStatus;
    eq.atualizado_em = Date.now();
    eq._dirtyLocal = true;
    if (!Array.isArray(eq.historico_edicoes)) eq.historico_edicoes = [];
    eq.historico_edicoes.unshift({
      autor: (typeof getUsuarioAtual === 'function') ? getUsuarioAtual() : 'Operador',
      dataHora: (typeof formatDataHoraLocal === 'function') ? formatDataHoraLocal() : new Date().toLocaleString('pt-BR'),
      mudancas: [{ campo: 'Status Operacional', antes: antesStatus, depois: novoStatus }]
    });
    if (eq.historico_edicoes.length > 30) eq.historico_edicoes = eq.historico_edicoes.slice(0, 30);
    salvarCatalogoEquipamentosLocal();
    salvarEquipamentoPostgreSQL(eq, true);
    renderCatalogoEquipamentos();
    if (typeof renderDashboards === 'function') renderDashboards();
    abrirFichaVidaEquipamento(eq.id, true);
    if (typeof mostrarToast === 'function') {
      mostrarToast('Status Atualizado', eq.nome + ' marcado como ' + (novoStatus === 'manutencao' ? 'Em Manutenção' : 'Operacional') + '.', 'info');
    }
  }
  window.alternarStatusManutencaoEquipamento = alternarStatusManutencaoEquipamento;
  function renderSlotsLiveUModal() {
    var cont = document.getElementById('liveu-slots-container');
    if (!cont) return;
    if (!Array.isArray(liveuSlotsDraft) || liveuSlotsDraft.length === 0) {
      cont.innerHTML =
        '<div style="padding:22px 14px;text-align:center;background:#F8FAFC;border:1px dashed #CBD5E1;border-radius:10px;font-size:12px;color:#64748B;">' +
          'Nenhum slot adicionado ainda. Clique em <strong>"+ Adicionar Chip / Modem"</strong> acima para cadastrar.' +
        '</div>';
      return;
    }
    var operadoras = ['Vivo', 'Claro', 'Tim', 'Algar', 'Oi', 'Outra'];
    var inseridosOpts = ['Interno', 'Externo', 'Desconhecido'];
    cont.innerHTML = liveuSlotsDraft.map(function(slot, idx) {
      var opOpts = operadoras.map(function(op) {
        return '<option value="' + op + '"' + (slot.operadora === op ? ' selected' : '') + '>' + op + '</option>';
      }).join('');
      var insOpts = inseridosOpts.map(function(ins) {
        return '<option value="' + ins + '"' + (slot.inserido === ins ? ' selected' : '') + '>' + ins + '</option>';
      }).join('');
      var imgs = Array.isArray(slot.imagens) ? slot.imagens : [];
      var imgsListHTML = imgs.map(function(src, imgIdx) {
        var safeThumb = safeEqMedia(src);
        if (!safeThumb) return '';
        return (
          '<div style="position:relative;width:58px;height:58px;border-radius:8px;overflow:hidden;border:1px solid #CBD5E1;background:#fff;">' +
            '<img src="' + safeThumb + '" alt="Slot ' + (idx + 1) + '" onclick="abrirQuickLook(this.src, this.alt)" style="width:100%;height:100%;object-fit:cover;cursor:pointer;" />' +
            '<button type="button" onclick="removerFotoSlotLiveU(' + idx + ',' + imgIdx + ')" title="Remover imagem" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;border:none;background:rgba(15,23,42,0.75);color:#fff;font-size:11px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button>' +
          '</div>'
        );
      }).join('');
      return (
        '<div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:10px;padding:12px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
            '<span style="font-size:11.5px;font-weight:800;color:#0071E3;background:#DBEAFE;padding:2px 9px;border-radius:6px;">Slot #' + (idx + 1) + '</span>' +
            '<button type="button" class="btn btn-ghost btn-xs" onclick="removerSlotLiveU(' + idx + ')" style="color:#EF4444;font-weight:600;">Remover Slot</button>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(145px, 1fr));gap:8px;">' +
            '<div class="frow" style="margin:0;">' +
              '<label style="font-size:11px;">Operadora Chip</label>' +
              '<select onchange="atualizarCampoSlotLiveU(' + idx + ',\'operadora\',this.value)">' + opOpts + '</select>' +
            '</div>' +
            '<div class="frow" style="margin:0;">' +
              '<label style="font-size:11px;">Inseridos</label>' +
              '<select onchange="atualizarCampoSlotLiveU(' + idx + ',\'inserido\',this.value)">' + insOpts + '</select>' +
            '</div>' +
            '<div class="frow" style="margin:0;">' +
              '<label style="font-size:11px;">Número de Telefone</label>' +
              '<input type="text" value="' + escapeHTML(slot.telefone || '') + '" oninput="atualizarCampoSlotLiveU(' + idx + ',\'telefone\',this.value)" placeholder="(32) 99999-0000" style="font-family:monospace;" />' +
            '</div>' +
            '<div class="frow" style="margin:0;">' +
              '<label style="font-size:11px;">Numeração do Chip (ICCID)</label>' +
              '<input type="text" value="' + escapeHTML(slot.numero_chip || '') + '" oninput="atualizarCampoSlotLiveU(' + idx + ',\'numero_chip\',this.value)" placeholder="8955..." style="font-family:monospace;" />' +
            '</div>' +
            '<div class="frow" style="margin:0;">' +
              '<label style="font-size:11px;">IMEI Modem</label>' +
              '<input type="text" value="' + escapeHTML(slot.imei || '') + '" oninput="atualizarCampoSlotLiveU(' + idx + ',\'imei\',this.value)" placeholder="35..." style="font-family:monospace;" />' +
            '</div>' +
          '</div>' +
          '<div style="margin-top:10px;padding-top:8px;border-top:1px dashed #CBD5E1;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
            imgsListHTML +
            '<label style="padding:6px 10px;background:#FFFFFF;border:1px dashed #93C5FD;border-radius:8px;color:#0071E3;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;">' +
              '<input type="file" accept="image/*" multiple hidden onchange="anexarFotoSlotLiveU(' + idx + ', this)" />' +
              '<i data-lucide="image-plus" style="width:13px;height:13px;"></i> Imagem do Chip / Modem' +
            '</label>' +
          '</div>' +
        '</div>'
      );
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  function abrirModalTagLiveU(idEqDireto) {
    liveuModalTargetEqId = idEqDireto || null;
    var dados = { chips_modens_tv: '', obs_geral: '', slots: [] };
    var nomeSub = '';
    if (liveuModalTargetEqId) {
      var eq = (catalogoEquipamentos || []).find(function(e) { return e.id === liveuModalTargetEqId; });
      if (!eq) return;
      nomeSub = eq.nome;
      dados = normalizarDadosLiveU(eq.dados_tags && eq.dados_tags.liveu);
    } else {
      var nomeInput = document.getElementById('novo-eq-nome');
      nomeSub = (nomeInput && nomeInput.value.trim()) ? nomeInput.value.trim().toUpperCase() : 'Novo Equipamento';
      dados = normalizarDadosLiveU(dadosTagsModalEq && dadosTagsModalEq.liveu);
    }
    var subEl = document.getElementById('liveu-modal-subtitle');
    if (subEl) subEl.textContent = nomeSub + ' · Gerencie operadoras, numeração de chips, IMEI dos modens, inserção e fotos';
    var tvEl = document.getElementById('liveu-chips-modens-tv');
    var obsEl = document.getElementById('liveu-obs-geral');
    if (tvEl) tvEl.value = dados.chips_modens_tv || '';
    if (obsEl) obsEl.value = dados.obs_geral || '';
    liveuSlotsDraft = JSON.parse(JSON.stringify(dados.slots || []));
    renderSlotsLiveUModal();
    abrirPopup('popup-eq-tag-liveu');
  }
  window.abrirModalTagLiveU = abrirModalTagLiveU;
  function adicionarSlotLiveU() {
    liveuSlotsDraft.push({
      operadora: 'Vivo',
      numero_chip: '',
      telefone: '',
      imei: '',
      inserido: 'Interno',
      imagens: []
    });
    renderSlotsLiveUModal();
  }
  window.adicionarSlotLiveU = adicionarSlotLiveU;
  function removerSlotLiveU(idx) {
    liveuSlotsDraft.splice(idx, 1);
    renderSlotsLiveUModal();
  }
  window.removerSlotLiveU = removerSlotLiveU;
  function atualizarCampoSlotLiveU(idx, campo, val) {
    if (!liveuSlotsDraft[idx]) return;
    liveuSlotsDraft[idx][campo] = val;
  }
  window.atualizarCampoSlotLiveU = atualizarCampoSlotLiveU;
  function anexarFotoSlotLiveU(idx, input) {
    if (!liveuSlotsDraft[idx] || !input || !input.files) return;
    var files = Array.prototype.slice.call(input.files);
    files.forEach(function(f) {
      comprimirImagemEquipamento(f, 800, 0.8, function(dataUrl) {
        if (!dataUrl || !liveuSlotsDraft[idx]) return;
        if (!Array.isArray(liveuSlotsDraft[idx].imagens)) liveuSlotsDraft[idx].imagens = [];
        liveuSlotsDraft[idx].imagens.push(dataUrl);
        renderSlotsLiveUModal();
      });
    });
    input.value = '';
  }
  window.anexarFotoSlotLiveU = anexarFotoSlotLiveU;
  function removerFotoSlotLiveU(idx, imgIdx) {
    if (!liveuSlotsDraft[idx] || !Array.isArray(liveuSlotsDraft[idx].imagens)) return;
    liveuSlotsDraft[idx].imagens.splice(imgIdx, 1);
    renderSlotsLiveUModal();
  }
  window.removerFotoSlotLiveU = removerFotoSlotLiveU;
  function salvarDadosModalTagLiveU() {
    var tvEl = document.getElementById('liveu-chips-modens-tv');
    var obsEl = document.getElementById('liveu-obs-geral');
    var novoLiveU = normalizarDadosLiveU({
      chips_modens_tv: tvEl ? tvEl.value : '',
      obs_geral: obsEl ? obsEl.value : '',
      slots: liveuSlotsDraft
    });
    if (!dadosTagsModalEq || typeof dadosTagsModalEq !== 'object') dadosTagsModalEq = {};
    dadosTagsModalEq.liveu = novoLiveU;
    var idAlvoSalvar = liveuModalTargetEqId;
    if (!idAlvoSalvar) {
      var idEdicaoParent = document.getElementById('novo-eq-id');
      if (idEdicaoParent && idEdicaoParent.value && idEdicaoParent.value.trim()) {
        idAlvoSalvar = idEdicaoParent.value.trim();
      }
    }
    if (idAlvoSalvar) {
      var eq = (catalogoEquipamentos || []).find(function(e) { return e.id === idAlvoSalvar; });
      if (eq) {
        var snap = JSON.parse(JSON.stringify(eq));
        if (!eq.dados_tags || typeof eq.dados_tags !== 'object') eq.dados_tags = {};
        eq.dados_tags.liveu = novoLiveU;
        eq.atualizado_em = Date.now();
        eq._dirtyLocal = true;
        var muds = gerarDiffEquipamento(snap, eq);
        if (muds.length > 0) {
          if (!Array.isArray(eq.historico_edicoes)) eq.historico_edicoes = [];
          eq.historico_edicoes.unshift({
            autor: (typeof getUsuarioAtual === 'function') ? getUsuarioAtual() : 'Operador',
            dataHora: (typeof formatDataHoraLocal === 'function') ? formatDataHoraLocal() : new Date().toLocaleString('pt-BR'),
            mudancas: muds
          });
          if (eq.historico_edicoes.length > 30) eq.historico_edicoes = eq.historico_edicoes.slice(0, 30);
        }
        salvarCatalogoEquipamentosLocal();
        salvarEquipamentoPostgreSQL(eq, true);
        renderCatalogoEquipamentos();
        if (liveuModalTargetEqId) {
          abrirFichaVidaEquipamento(eq.id, true);
        }
        if (typeof mostrarToast === 'function') {
          mostrarToast('Dados LiveU Salvos', 'Chips e modens de ' + eq.nome + ' atualizados no banco.', 'success');
        }
      }
    }
    if (!liveuModalTargetEqId) {
      atualizarBarraTagLiveUNoModal();
    }
    fecharPopup('popup-eq-tag-liveu');
  }
  window.salvarDadosModalTagLiveU = salvarDadosModalTagLiveU;
  function copiarTextoEquipamentoHelper(texto, tituloToast) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(function() {
        if (typeof mostrarToast === 'function') mostrarToast(tituloToast, 'Copiado para a área de transferência.', 'success');
      }).catch(function() {});
    }
  }
  function copiarDadosLiveUFicha(idEq) {
    var eq = (catalogoEquipamentos || []).find(function(e) { return e.id === idEq; });
    if (!eq) return;
    var lu = normalizarDadosLiveU(eq.dados_tags && eq.dados_tags.liveu);
    var linhas = [
      'LIVEU: ' + eq.nome + (eq.codigo_patrimonio ? ' (' + eq.codigo_patrimonio + ')' : ''),
      lu.chips_modens_tv ? ('Chips e Modens TV: ' + lu.chips_modens_tv) : '',
      lu.obs_geral ? ('Obs: ' + lu.obs_geral) : ''
    ].filter(Boolean);
    lu.slots.forEach(function(s, i) {
      linhas.push('Slot ' + (i + 1) + ': ' + s.operadora + ' | Tel: ' + (s.telefone || '—') + ' | Chip: ' + (s.numero_chip || '—') + ' | IMEI: ' + (s.imei || '—') + ' | Inserido: ' + s.inserido);
    });
    copiarTextoEquipamentoHelper(linhas.join('\n'), 'Dados LiveU Copiados');
  }
  window.copiarDadosLiveUFicha = copiarDadosLiveUFicha;
  function copiarFichaEquipamento() {
    var eq = (catalogoEquipamentos || []).find(function(e) { return e.id === eqFichaAbertaId; });
    if (!eq) return;
    var linhas = [
      'EQUIPAMENTO: ' + eq.nome,
      'Categoria: ' + (eq.categoria || '—') + ' | Praça: ' + eq.praca,
      'Patrimônio: ' + (eq.codigo_patrimonio || '—') + ' | Nº Série: ' + (eq.numero_serie || '—'),
      'Modelo: ' + (eq.fabricante_modelo || '—') + ' | Local: ' + (eq.setor_local || '—'),
      'Obs: ' + (eq.obs_tecnicas || '—')
    ];
    if (eq.dados_tags && eq.dados_tags.liveu) {
      var lu = normalizarDadosLiveU(eq.dados_tags.liveu);
      if (lu.chips_modens_tv) linhas.push('Chips e Modens TV: ' + lu.chips_modens_tv);
      lu.slots.forEach(function(s, i) {
        linhas.push('Slot ' + (i + 1) + ' (' + s.operadora + ' / ' + s.inserido + '): Tel ' + (s.telefone || '—') + ' | Chip ' + (s.numero_chip || '—') + ' | IMEI ' + (s.imei || '—'));
      });
    }
    copiarTextoEquipamentoHelper(linhas.join('\n'), 'Ficha Copiada');
  }
  window.copiarFichaEquipamento = copiarFichaEquipamento;
  function imprimirFichaEquipamento() {
    var eq = (catalogoEquipamentos || []).find(function(e) { return e.id === eqFichaAbertaId; });
    if (!eq) return;
    var lu = (eq.dados_tags && eq.dados_tags.liveu) ? normalizarDadosLiveU(eq.dados_tags.liveu) : null;
    var liveuPrint = '';
    if (lu && (lu.chips_modens_tv || lu.slots.length > 0)) {
      var rows = lu.slots.map(function(s, i) {
        return '<tr><td style="padding:6px;border:1px solid #CBD5E1;">' + (i + 1) + '</td><td style="padding:6px;border:1px solid #CBD5E1;">' + escapeHTML(s.operadora) + '</td><td style="padding:6px;border:1px solid #CBD5E1;font-family:monospace;">' + escapeHTML(s.numero_chip || '—') + '</td><td style="padding:6px;border:1px solid #CBD5E1;font-family:monospace;">' + escapeHTML(s.telefone || '—') + '</td><td style="padding:6px;border:1px solid #CBD5E1;font-family:monospace;">' + escapeHTML(s.imei || '—') + '</td><td style="padding:6px;border:1px solid #CBD5E1;">' + escapeHTML(s.inserido) + '</td></tr>';
      }).join('');
      liveuPrint = '<h3 style="margin:16px 0 8px 0;font-size:13px;color:#1E3A8A;">Chips &amp; Modens (LiveU)</h3>' +
        (lu.chips_modens_tv ? '<p style="font-size:12px;margin:0 0 8px 0;"><strong>Chips e Modens TV:</strong> ' + escapeHTML(lu.chips_modens_tv) + '</p>' : '') +
        (lu.slots.length > 0 ? '<table style="width:100%;border-collapse:collapse;font-size:11.5px;"><thead><tr style="background:#F1F5F9;"><th style="padding:6px;border:1px solid #CBD5E1;">Slot</th><th style="padding:6px;border:1px solid #CBD5E1;">Operadora</th><th style="padding:6px;border:1px solid #CBD5E1;">Chip (ICCID)</th><th style="padding:6px;border:1px solid #CBD5E1;">Telefone</th><th style="padding:6px;border:1px solid #CBD5E1;">IMEI</th><th style="padding:6px;border:1px solid #CBD5E1;">Inserido</th></tr></thead><tbody>' + rows + '</tbody></table>' : '');
    }
    Security.openSafePrintWindow(
      '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Ficha Técnica — ' + escapeHTML(eq.nome) + '</title><style>@page{size:A4 portrait;margin:14mm;}body{font-family:Segoe UI,Arial,sans-serif;color:#0F172A;}</style></head><body>' +
      '<div style="background:#0F172A;color:#fff;padding:14px 18px;border-radius:8px;display:flex;align-items:center;gap:14px;">' +
        (safeEqMedia(eq.foto_url) ? '<img src="' + safeEqMedia(eq.foto_url) + '" style="width:56px;height:56px;border-radius:8px;object-fit:cover;background:#fff;" />' : '') +
        '<div><div style="font-size:10px;text-transform:uppercase;color:#93C5FD;font-weight:700;">TV Integração · Ficha Técnica de Equipamento</div><div style="font-size:18px;font-weight:800;">' + escapeHTML(eq.nome) + '</div><div style="font-size:12px;color:#CBD5E1;">' + escapeHTML(eq.categoria) + ' · ' + escapeHTML(eq.praca) + '</div></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;font-size:12px;">' +
        '<div style="padding:8px 10px;border:1px solid #E2E8F0;border-radius:6px;"><strong>Patrimônio:</strong> ' + escapeHTML(eq.codigo_patrimonio || '—') + '</div>' +
        '<div style="padding:8px 10px;border:1px solid #E2E8F0;border-radius:6px;"><strong>Nº de Série:</strong> ' + escapeHTML(eq.numero_serie || '—') + '</div>' +
        '<div style="padding:8px 10px;border:1px solid #E2E8F0;border-radius:6px;"><strong>Modelo:</strong> ' + escapeHTML(eq.fabricante_modelo || '—') + '</div>' +
        '<div style="padding:8px 10px;border:1px solid #E2E8F0;border-radius:6px;"><strong>Local:</strong> ' + escapeHTML(eq.setor_local || '—') + '</div>' +
      '</div>' +
      (eq.obs_tecnicas ? '<div style="margin-top:10px;padding:10px;border:1px solid #E2E8F0;border-radius:6px;font-size:12px;"><strong>Observações:</strong><br/>' + escapeHTML(eq.obs_tecnicas) + '</div>' : '') +
      liveuPrint +
      '</body></html>',
      350
    );
  }
  window.imprimirFichaEquipamento = imprimirFichaEquipamento;

  EventBus.on('cloud:sync', sincronizarEquipamentosPostgreSQL);
  });
})(window, document, window.TVApp);
