  var EQUIPAMENTOS_STORAGE_KEY = 'tv_equipamentos_catalogo_v1';
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
  var catalogoEquipamentos = [];
  var filtroEquipamentoTag = 'todos';
  var tagsSelecionadasModalEq = [];
  function getEquipamentosDBCredentials() {
    var url = (typeof DBService !== 'undefined' && DBService && DBService.url) ? DBService.url : (localStorage.getItem('tv_supabase_url') || '');
    var key = (typeof DBService !== 'undefined' && DBService && DBService.key) ? DBService.key : (localStorage.getItem('tv_supabase_key') || '');
    if ((!url || url.indexOf('seu-projeto') !== -1) && typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG.SUPABASE_URL && window.ENV_CONFIG.SUPABASE_URL.indexOf('seu-projeto') === -1) {
      url = window.ENV_CONFIG.SUPABASE_URL;
    }
    if ((!key || key.indexOf('sua-chave') !== -1) && typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG.SUPABASE_ANON_KEY && window.ENV_CONFIG.SUPABASE_ANON_KEY.indexOf('sua-chave') === -1) {
      key = window.ENV_CONFIG.SUPABASE_ANON_KEY;
    }
    return { url: url ? url.replace(/\/+$/, '') : '', key: key };
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
    var metObj = {
      conf: metRaw.conf || 0,
      nc: metRaw.nc || 0,
      canc: metRaw.canc || 0
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
      obs_tecnicas: (eq.obs_tecnicas || eq.obs || '').trim(),
      ordem: ordemVal,
      metricas: metObj,
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
  function obterListaNomesEquipamentosOrdenados(pracaOpcional) {
    aplicarOrdemPersonalizadaNoCatalogo();
    var pracaAtiva = pracaOpcional || ((typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora');
    var isUdi = String(pracaAtiva).indexOf('Uber') !== -1;
    var ativos = (catalogoEquipamentos || []).filter(function(eq) {
      if (!eq || eq.status_operacional === 'lixeira') return false;
      return isUdi ? (eq.praca === 'Uberlândia') : (eq.praca === 'Juiz de Fora');
    });
    if (ativos.length > 0) {
      return ativos.map(function(eq) { return eq.nome; });
    }
    if (typeof dashboardMetrics !== 'undefined' && dashboardMetrics && dashboardMetrics.equipamento) {
      return Object.keys(dashboardMetrics.equipamento);
    }
    return [];
  }
  window.obterListaNomesEquipamentosOrdenados = obterListaNomesEquipamentosOrdenados;
  function salvarCatalogoEquipamentosLocal() {
    window.catalogoEquipamentos = catalogoEquipamentos;
    try {
      localStorage.setItem(EQUIPAMENTOS_STORAGE_KEY, JSON.stringify(catalogoEquipamentos));
    } catch (e) {}
    sincronizarDashboardMetricsComCatalogo();
  }
  function sincronizarDashboardMetricsComCatalogo() {
    if (typeof dashboardMetrics === 'undefined' || !dashboardMetrics) return;
    if (!dashboardMetrics.equipamento || Object.keys(dashboardMetrics.equipamento).length === 0) {
      if (typeof carregarDashboardMetricsStore === 'function') {
        try { carregarDashboardMetricsStore(); } catch (eLoad) {}
      }
      if (!dashboardMetrics.equipamento) dashboardMetrics.equipamento = {};
    }
    aplicarOrdemPersonalizadaNoCatalogo();
    var pracaAtiva = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isUdi = pracaAtiva.indexOf('Uber') !== -1;
    var ativosDaPraca = (catalogoEquipamentos || []).filter(function(eq) {
      if (!eq || eq.status_operacional === 'lixeira') return false;
      return isUdi ? (eq.praca === 'Uberlândia') : (eq.praca === 'Juiz de Fora');
    });
    var novoMapaEq = {};
    ativosDaPraca.forEach(function(eq) {
      var existente = dashboardMetrics.equipamento[eq.nome];
      var metBanco = (eq.metricas && typeof eq.metricas === 'object') ? eq.metricas : {};
      novoMapaEq[eq.nome] = {
        conf: existente && typeof existente.conf === 'number' ? existente.conf : (metBanco.conf || 0),
        nc:   existente && typeof existente.nc   === 'number' ? existente.nc   : (metBanco.nc   || 0),
        canc: existente && typeof existente.canc === 'number' ? existente.canc : (metBanco.canc || 0),
        id: eq.id,
        codigo_patrimonio: eq.codigo_patrimonio,
        numero_serie: eq.numero_serie,
        tipo: eq.categoria,
        obs: eq.obs_tecnicas
      };
    });
    dashboardMetrics.equipamento = novoMapaEq;
    if (typeof salvarDashboardMetricsStore === 'function') {
      salvarDashboardMetricsStore();
    }
    try {
      if (typeof atualizarSelectsEquipamentosCTRS === 'function') atualizarSelectsEquipamentosCTRS();
      if (typeof atualizarSelectEquipamentosNovaOc === 'function') atualizarSelectEquipamentosNovaOc();
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
    salvarCatalogoEquipamentosLocal();
    renderCatalogoEquipamentos();
    sincronizarEquipamentosPostgreSQL();
  }
  window.carregarEquipamentosStore = carregarEquipamentosStore;
  function sincronizarEquipamentosPostgreSQL() {
    var db = getEquipamentosDBCredentials();
    if (!db.url || !db.key) return;
    fetch(db.url + '/rest/v1/equipamentos?select=*&order=criado_em.asc', {
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Cache-Control': 'no-cache'
      }
    })
    .then(function(res) { return res.ok ? res.json() : null; })
    .then(function(remotos) {
      if (!Array.isArray(remotos)) return;
      var mapaRemoto = {};
      var listaRemota = [];
      var mapaLocalOrdem = {};
      (catalogoEquipamentos || []).forEach(function(locEq) {
        if (locEq && locEq.id && typeof locEq.ordem === 'number') {
          mapaLocalOrdem[locEq.id] = locEq.ordem;
        }
      });
      remotos.forEach(function(rawRem) {
        var tinhaHash = Array.isArray(rawRem.tags) && rawRem.tags.some(function(t) { return String(t).indexOf('#') !== -1; });
        var san = sanitizarEquipamento(rawRem);
        if (san) {
          if (typeof san.ordem !== 'number' && typeof mapaLocalOrdem[san.id] === 'number') {
            san.ordem = mapaLocalOrdem[san.id];
            if (!san.metricas || typeof san.metricas !== 'object') san.metricas = { conf: 0, nc: 0, canc: 0 };
            san.metricas.ordem = san.ordem;
          }
          listaRemota.push(san);
          mapaRemoto[san.id] = san;
          if (tinhaHash) {
            salvarEquipamentoPostgreSQL(san);
          }
        }
      });
      var pendentesLocais = (catalogoEquipamentos || []).filter(function(loc) {
        return loc && loc.id && !mapaRemoto[loc.id];
      });
      if (pendentesLocais.length > 0) {
        pendentesLocais.forEach(function(p) { salvarEquipamentoPostgreSQL(p); });
      }
      if (listaRemota.length > 0 || pendentesLocais.length > 0) {
        catalogoEquipamentos = listaRemota.concat(pendentesLocais);
        aplicarOrdemPersonalizadaNoCatalogo();
        salvarCatalogoEquipamentosLocal();
        renderCatalogoEquipamentos();
        if (typeof renderDashboards === 'function') renderDashboards();
      }
    })
    .catch(function(err) {
      console.warn('[PostgreSQL Equipamentos] Tabela equipamentos ainda não criada ou modo local ativo:', err);
    });
  }
  window.sincronizarEquipamentosPostgreSQL = sincronizarEquipamentosPostgreSQL;
  function salvarEquipamentoPostgreSQL(eq) {
    var db = getEquipamentosDBCredentials();
    if (!db.url || !db.key || !eq) return;
    var payload = {
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
      metricas: (eq.metricas && typeof eq.metricas === 'object') ? eq.metricas : { conf: 0, nc: 0, canc: 0 },
      criado_por: eq.criado_por || 'Operador',
      criado_em: eq.criado_em || Date.now()
    };
    fetch(db.url + '/rest/v1/equipamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    })
    .then(function(res) {
      if (res.ok) {
      }
    })
    .catch(function(err) {
      console.warn('[PostgreSQL Equipamentos] Erro ao gravar equipamento:', err);
    });
  }
  window.salvarEquipamentoPostgreSQL = salvarEquipamentoPostgreSQL;
  function obterOcorrenciasDoEquipamento(eq) {
    if (!eq) return [];
    var nomeBusca = (eq.nome || '').toUpperCase();
    var idBusca = eq.id || '';
    var todasOcs = (typeof ocorrencias !== 'undefined' && Array.isArray(ocorrencias)) ? ocorrencias : [];
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
    return temAberta ? 'atencao' : 'operacional';
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
      else if (st === 'atencao') totAtencao++;
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
        var texto = [
          eq.nome,
          eq.codigo_patrimonio,
          eq.numero_serie,
          eq.fabricante_modelo,
          eq.categoria,
          eq.setor_local,
          (eq.tags || []).join(' ')
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
        : '<span class="tag tag-g">🟢 Operacional</span>';
      var borderStyle = st === 'atencao'
        ? 'border-color:#FDE68A;background:#FFFBEB;'
        : st === 'manutencao'
        ? 'border-color:#FECACA;background:#FEF2F2;'
        : '';
      var tagsHTML = (Array.isArray(eq.tags) && eq.tags.length > 0)
        ? eq.tags.map(function(t) {
            return '<span style="font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:12px;background:#EFF6FF;color:#0071E3;border:1px solid #BFDBFE;">' + escapeHTML(t) + '</span>';
          }).join('')
        : '<span style="font-size:10.5px;color:var(--muted);">Sem tags</span>';
      return (
        '<div class="dash-card eq-draggable-card" data-eq-id="' + escapeHTML(eq.id) + '" ' +
          'onpointerdown="iniciarArrastoEquipamento(event, \'' + escapeHTML(eq.id) + '\')" ' +
          'style="padding:16px;display:flex;flex-direction:column;justify-content:space-between;gap:12px;cursor:grab;user-select:none;-webkit-user-select:none;transition:box-shadow .15s ease, border-color .15s ease;' + borderStyle + '" ' +
          'onclick="if(!window._arrastandoEqAgora) abrirFichaVidaEquipamento(\'' + escapeHTML(eq.id) + '\')" ' +
          'title="Segure e arraste o card para mudar a ordem, ou clique para abrir o Ficheiro de Vida">' +
          '<div>' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">' +
              '<div style="display:flex;align-items:flex-start;gap:6px;">' +
                '<span title="Segure e arraste para reordenar" style="color:var(--muted);cursor:grab;display:inline-flex;align-items:center;margin-top:2px;opacity:0.85;"><i data-lucide="grip-vertical" style="width:15px;height:15px;"></i></span>' +
                '<div>' +
                  '<div style="font-size:14px;font-weight:800;color:var(--txt);letter-spacing:-0.01em;">' + escapeHTML(eq.nome) + '</div>' +
                  '<div style="font-size:11.5px;color:var(--muted);margin-top:1px;">' + escapeHTML(eq.fabricante_modelo || eq.categoria) + '</div>' +
                '</div>' +
              '</div>' +
              badgeStatus +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;background:rgba(255,255,255,0.75);border:1px solid var(--border-lt);border-radius:8px;padding:8px 10px;font-size:11px;margin-bottom:10px;">' +
              '<div><span style="color:var(--muted);display:block;font-size:10px;">ID / PATRIMÔNIO</span><strong style="color:var(--txt);font-family:monospace;">' + escapeHTML(eq.codigo_patrimonio || 'Não inf.') + '</strong></div>' +
              '<div><span style="color:var(--muted);display:block;font-size:10px;">Nº DE SÉRIE</span><strong style="color:var(--txt);font-family:monospace;">' + escapeHTML(eq.numero_serie || 'Não inf.') + '</strong></div>' +
            '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px;">' +
              tagsHTML +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border-lt);font-size:11.5px;" onclick="event.stopPropagation();">' +
            '<button type="button" class="btn btn-ghost btn-xs" onclick="abrirFichaVidaEquipamento(\'' + escapeHTML(eq.id) + '\')" style="color:var(--blue);font-weight:600;padding:4px 8px;display:inline-flex;align-items:center;gap:4px;">' +
              '<i data-lucide="file-text" style="width:12px;height:12px;"></i> Ficheiro de Vida (' + ocs.length + ')' +
            '</button>' +
            '<div style="display:flex;gap:4px;">' +
              '<button type="button" class="btn btn-ghost btn-xs" onclick="abrirOcorrenciaDiretaEquipamento(\'' + escapeHTML(eq.id) + '\')" title="Abrir Ocorrência para este equipamento" style="color:#D97706;padding:4px 7px;">' +
                '<i data-lucide="alert-triangle" style="width:13px;height:13px;"></i>' +
              '</button>' +
              '<button type="button" class="btn btn-ghost btn-xs" onclick="abrirModalCadastroEquipamento(\'' + escapeHTML(eq.id) + '\')" title="Modificar equipamento" style="color:var(--txt2);padding:4px 7px;">' +
                '<i data-lucide="edit-3" style="width:13px;height:13px;"></i>' +
              '</button>' +
              '<button type="button" class="btn btn-ghost btn-xs" onclick="excluirEquipamentoParaLixeira(\'' + escapeHTML(eq.id) + '\')" title="Mover equipamento para a Lixeira" style="color:var(--red);padding:4px 7px;">' +
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
  function renderSeletorTagsModalEq() {
    var container = document.getElementById('eq-modal-tags- selector') || document.getElementById('eq-modal-tags-selector');
    if (!container) return;
    container.innerHTML = TAGS_PADRAO_EQUIPAMENTOS.map(function(tag) {
      var ativa = tagsSelecionadasModalEq.indexOf(tag) !== -1;
      var st = ativa
        ? 'background:#0071E3;color:#FFFFFF;border-color:#0071E3;font-weight:700;'
        : 'background:#F8FAFC;color:var(--txt2);border-color:var(--border);font-weight:500;';
      return (
        '<button type="button" onclick="toggleTagModalEquipamento(\'' + tag + '\')" style="border:1px solid;border-radius:16px;padding:4px 11px;font-size:11.5px;cursor:pointer;transition:all .12s;' + st + '">' +
          (ativa ? '✓ ' : '+ ') + escapeHTML(tag) +
        '</button>'
      );
    }).join('');
  }
  function toggleTagModalEquipamento(tag) {
    var idx = tagsSelecionadasModalEq.indexOf(tag);
    if (idx === -1) tagsSelecionadasModalEq.push(tag);
    else tagsSelecionadasModalEq.splice(idx, 1);
    renderSeletorTagsModalEq();
  }
  window.toggleTagModalEquipamento = toggleTagModalEquipamento;
  function abrirModalCadastroEquipamento(idEdicao) {
    var idEl     = document.getElementById('novo-eq-id');
    var nomeEl   = document.getElementById('novo-eq-nome');
    var patEl    = document.getElementById('novo-eq-patrimonio');
    var serieEl  = document.getElementById('novo-eq-serie');
    var modEl    = document.getElementById('novo-eq-modelo');
    var tipoEl   = document.getElementById('novo-eq-tipo');
    var setorEl  = document.getElementById('novo-eq-setor');
    var statusEl = document.getElementById('novo-eq-status');
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
      if (obsEl)    obsEl.value    = eqExistente.obs_tecnicas || '';
      tagsSelecionadasModalEq = Array.isArray(eqExistente.tags) ? eqExistente.tags.slice() : ['Transmissão'];
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
      if (obsEl)    obsEl.value    = '';
      tagsSelecionadasModalEq = ['Transmissão'];
    }
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
    var obsEl    = document.getElementById('novo-eq-obs');
    var idEdicao = idEl ? idEl.value.trim() : '';
    var nome = (nomeEl ? nomeEl.value : '').trim().toUpperCase();
    if (!nome) {
      alert('Por favor, informe o Nome de Identificação do equipamento.');
      if (nomeEl) nomeEl.focus();
      return;
    }
    var praca = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var duplicado = (catalogoEquipamentos || []).find(function(e) {
      return e.status_operacional !== 'lixeira' && e.praca === praca && e.nome === nome && e.id !== idEdicao;
    });
    if (duplicado) {
      alert('Já existe um equipamento ativo com o nome "' + nome + '" na praça de ' + praca + '.');
      return;
    }
    var itemSalvo = null;
    if (idEdicao) {
      catalogoEquipamentos = catalogoEquipamentos.map(function(e) {
        if (e.id === idEdicao) {
          e.nome               = nome;
          e.codigo_patrimonio  = patEl ? patEl.value.trim() : '';
          e.numero_serie       = serieEl ? serieEl.value.trim() : '';
          e.fabricante_modelo  = modEl ? modEl.value.trim() : '';
          e.categoria          = tipoEl ? tipoEl.value : 'Mochilink / LiveU';
          e.setor_local        = setorEl ? setorEl.value.trim() : '';
          e.status_operacional = statusEl ? statusEl.value : 'operacional';
          e.obs_tecnicas       = obsEl ? obsEl.value.trim() : '';
          e.tags               = tagsSelecionadasModalEq.slice();
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
        obs_tecnicas: obsEl ? obsEl.value.trim() : '',
        tags: tagsSelecionadasModalEq.slice(),
        criado_por: (typeof getUsuarioAtual === 'function') ? getUsuarioAtual() : 'Operador',
        criado_em: Date.now()
      });
      catalogoEquipamentos.push(itemSalvo);
    }
    window._ultimoEqAdicionado = nome;
    salvarCatalogoEquipamentosLocal();
    if (itemSalvo) salvarEquipamentoPostgreSQL(itemSalvo);
    if (window._eqTriggeringSelect) {
      try {
        window._eqTriggeringSelect.value = nome;
      } catch (eSel) {}
      window._eqTriggeringSelect = null;
    }
    fecharPopup('popup-novo-equipamento');
    renderCatalogoEquipamentos();
    if (typeof renderDashboards === 'function') renderDashboards();
    if (typeof mostrarToast === 'function') {
      mostrarToast(
        idEdicao ? 'Equipamento Atualizado' : 'Equipamento Cadastrado',
        nome + ' salvo no banco de dados e integrado aos relatórios.',
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
    salvarCatalogoEquipamentosLocal();
    salvarEquipamentoPostgreSQL(eq);
    if (typeof lixeiraData !== 'undefined' && Array.isArray(lixeiraData)) {
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
        excluidoPor: (typeof getUsuarioAtual === 'function') ? getUsuarioAtual() : 'Operador',
        notificado24h: false,
        praca: eq.praca
      };
      lixeiraData = [itemLixeira].concat(lixeiraData.filter(function(i) { return i.id !== eq.id; }));
      if (typeof saveLixeira === 'function') saveLixeira(lixeiraData);
      if (typeof salvarItemLixeiraNuvem === 'function') salvarItemLixeiraNuvem(itemLixeira);
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
      if (selEq) selEq.value = eq.nome;
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
  function abrirFichaVidaEquipamento(idOuNome) {
    var eq = (catalogoEquipamentos || []).find(function(e) {
      return e.status_operacional !== 'lixeira' && (e.id === idOuNome || e.nome === idOuNome);
    });
    if (!eq) return;
    var ocs = obterOcorrenciasDoEquipamento(eq);
    var abertas = ocs.filter(function(o) { return o.status === 'aberta'; });
    var resolvidas = ocs.filter(function(o) { return o.status !== 'aberta'; });
    var metricObj = (typeof dashboardMetrics !== 'undefined' && dashboardMetrics.equipamento)
      ? dashboardMetrics.equipamento[eq.nome]
      : null;
    var txConf = metricObj ? (metricObj.conf || 0) : 0;
    var txNc   = metricObj ? (metricObj.nc   || 0) : 0;
    var txCanc = metricObj ? (metricObj.canc || 0) : 0;
    var txTot  = txConf + txNc + txCanc;
    var saudePct = txTot > 0 ? ((txConf / txTot) * 100).toFixed(1) + '%' : (abertas.length === 0 ? '100%' : 'Atenção');
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
            return '<span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:14px;background:#EFF6FF;color:#0071E3;border:1px solid #BFDBFE;">' + escapeHTML(t) + '</span>';
          }).join('')
        : '<span style="font-size:11.5px;color:var(--muted);">Sem tags associadas</span>';
    }
    if (elKpiOcs)   elKpiOcs.textContent   = ocs.length;
    if (elKpiRes)   elKpiRes.textContent   = resolvidas.length;
    if (elKpiTx)    elKpiTx.textContent    = txTot;
    if (elKpiSaude) elKpiSaude.textContent = saudePct;
    var btnEdit = document.getElementById('btn-ficha-editar');
    var btnDel  = document.getElementById('btn-ficha-excluir');
    var btnNova = document.getElementById('btn-ficha-nova-oc');
    if (btnEdit) btnEdit.onclick = function() { fecharPopup('popup-ficha-vida-equipamento'); abrirModalCadastroEquipamento(eq.id); };
    if (btnDel)  btnDel.onclick  = function() { excluirEquipamentoParaLixeira(eq.id); };
    if (btnNova) btnNova.onclick = function() { abrirOcorrenciaDiretaEquipamento(eq.id); };
    if (elTimeline) {
      var nomeEqUp = String(eq.nome || '').toUpperCase().trim();
      var relsEq = (typeof historicoSeedData !== 'undefined' && Array.isArray(historicoSeedData) ? historicoSeedData : []).filter(function(h) {
        if (!h || h.tipo !== 'relatorio') return false;
        var dH = h.dadosCTRS;
        if (!dH && h.descResolucao && h.descResolucao.indexOf('<!--CTRS_JSON:') !== -1) {
          try {
            var mH = h.descResolucao.match(/<!--CTRS_JSON:([^>]+)-->/);
            if (mH && mH[1]) dH = JSON.parse(decodeURIComponent(mH[1]));
          } catch (e) {}
        }
        if (dH && Array.isArray(dH.transmissoes) && dH.transmissoes.some(function(tx){ return tx && tx.infra && String(tx.infra).toUpperCase().trim() === nomeEqUp; })) return true;
        if (h.equipamento && String(h.equipamento).toUpperCase().indexOf(nomeEqUp) !== -1) return true;
        return false;
      });
      if (ocs.length === 0 && relsEq.length === 0) {
        elTimeline.innerHTML =
          '<div style="text-align:center;padding:24px 14px;background:#F8FAFC;border:1px dashed var(--border);border-radius:10px;color:var(--muted);font-size:12px;">' +
            'Nenhuma ocorrência ou relatório registrado no histórico de vida deste equipamento.' +
          '</div>';
      } else {
        var htmlOcs = ocs.map(function(oc) {
          var isRes = oc.status !== 'aberta';
          var corBorda = isRes ? '#10B981' : '#EF4444';
          var tagSt = isRes
            ? '<span class="tag tag-g">✓ Resolvida</span>'
            : '<span class="tag tag-r">● Em Aberto</span>';
          var descLimpa = String(oc.desc || '').replace(/<!--CTRS_JSON:[^>]+-->/g, '').trim();
          var descResLimpa = (oc.resolucao && oc.resolucao.descRes)
            ? String(oc.resolucao.descRes).replace(/<!--CTRS_JSON:[^>]+-->/g, '').trim()
            : '';
          var descRes = descResLimpa
            ? '<div style="margin-top:6px;padding:6px 10px;background:#F0FDF4;border-radius:6px;font-size:11.5px;color:#166534;"><strong>Solução aplicada:</strong> ' + escapeHTML(descResLimpa) + '</div>'
            : '';
          var temPreviewOc = !!(oc.htmlRelatorio || oc.dadosCTRS || (oc.desc && String(oc.desc).indexOf('<!--CTRS_JSON:') !== -1));
          var previewBtn = temPreviewOc
            ? '<span style="font-size:10.5px;font-weight:700;color:#0071E3;background:#EFF6FF;border:1px solid #BFDBFE;padding:2px 8px;border-radius:10px;">👁️ Ver Relatório na Descrição</span>'
            : '';
          return (
            '<div onclick=\"fecharPopup(\'popup-ficha-vida-equipamento\'); verDetalhesOcorrencia(\'' + oc.id + '\')\" style=\"background:#FFFFFF;border:1px solid var(--border-lt);border-left:3.5px solid ' + corBorda + ';border-radius:8px;padding:10px 14px;cursor:pointer;transition:all .15s ease;\" onmouseover=\"this.style.borderColor=\'var(--blue)\';\" onmouseout=\"this.style.borderColor=\'var(--border-lt)\';\" title=\"Clique para abrir a ocorrência completa com o preview do relatório\">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
                '<strong style="font-size:12.5px;color:var(--txt);">' + escapeHTML(oc.titulo) + '</strong>' +
                '<div style="display:flex;align-items:center;gap:6px;">' + previewBtn + tagSt + '</div>' +
              '</div>' +
              '<div style="font-size:11.5px;color:var(--txt2);margin-top:4px;">' + escapeHTML(descLimpa) + '</div>' +
              descRes +
              '<div style="font-size:10.5px;color:var(--muted);margin-top:6px;display:flex;gap:12px;">' +
                '<span>📅 ' + escapeHTML(oc.dataCriacao || '') + '</span>' +
                '<span>👤 Resp: ' + escapeHTML(oc.resp || 'Equipe') + '</span>' +
              '</div>' +
            '</div>'
          );
        }).join('');
        var htmlRels = relsEq.map(function(r) {
          var descRelLimpa = String(r.descCriacao || '').replace(/<!--CTRS_JSON:[^>]+-->/g, '').trim();
          var isNC = r.status && String(r.status).toLowerCase().indexOf('não conform') !== -1;
          return (
            '<div onclick=\"fecharPopup(\'popup-ficha-vida-equipamento\'); verDetalhesHistoricoDirect(\'' + r.id + '\')\" style=\"background:#F8FAFC;border:1px solid #BFDBFE;border-left:3.5px solid #0071E3;border-radius:8px;padding:10px 14px;cursor:pointer;transition:all .15s ease;\" onmouseover=\"this.style.borderColor=\'#0071E3\';\" onmouseout=\"this.style.borderColor=\'#BFDBFE\';\" title=\"Clique para abrir o Preview Completo do Relatório CTRS\">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
                '<strong style="font-size:12.5px;color:#1E3A8A;">📄 ' + escapeHTML(r.titulo) + '</strong>' +
                '<div style="display:flex;align-items:center;gap:6px;">' +
                  '<span style="font-size:10.5px;font-weight:700;color:#0071E3;background:#EFF6FF;border:1px solid #93C5FD;padding:2px 8px;border-radius:10px;">👁️ Ver Preview CTRS</span>' +
                  '<span class="tag ' + (isNC ? 'tag-y' : 'tag-g') + '">' + escapeHTML(r.status || 'Conforme') + '</span>' +
                '</div>' +
              '</div>' +
              '<div style="font-size:11.5px;color:var(--txt2);margin-top:4px;">' + escapeHTML(descRelLimpa) + '</div>' +
              '<div style="font-size:10.5px;color:var(--muted);margin-top:6px;display:flex;gap:12px;">' +
                '<span>📅 ' + escapeHTML(r.dataCriacao || '') + '</span>' +
                '<span>👤 Emitido por: ' + escapeHTML(r.criadoPor || 'Operador') + '</span>' +
              '</div>' +
            '</div>'
          );
        }).join('');
        elTimeline.innerHTML = htmlOcs + htmlRels;
      }
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    abrirPopup('popup-ficha-vida-equipamento');
  }
  window.abrirFichaVidaEquipamento = abrirFichaVidaEquipamento;
