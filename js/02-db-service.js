document.addEventListener('DOMContentLoaded', function () {
  console.log('✅ [Sistema TV] Versão 7.9 — Blindagem de Testes: Sincronização Otimizada, Anti-XSS e Cache Resiliente');

  /* ═══════════════════════════════════════════
     BANCO DE DADOS & SERVIÇO DE ARMAZENAMENTO (DB ADAPTER SERVICE)
     Interface modular para transição transparente entre LocalStorage e Backend API (Supabase/Firebase/REST)
  ═══════════════════════════════════════════ */

  var USER_NAME_STORAGE_KEY    = 'tv_user_name_v1';
  var PHOTO_STORAGE_KEY        = 'tv_user_photo_v1';
  var OCORRENCIAS_CACHE_KEY    = 'tv_ocorrencias_cache_v2';

  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  window.escapeHTML = escapeHTML;

  function getUsuarioAtual() {
    var stored = localStorage.getItem(USER_NAME_STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
    var upName = document.getElementById('up-name');
    if (upName && upName.textContent && upName.textContent.trim()) return upName.textContent.trim();
    return 'Operador';
  }

  var dashboardMetrics = {
    telejornal: {
      'INTEGRAÇÃO NOTÍCIA': { conf: 0, nc: 0, canc: 0 },
      'MG1':                { conf: 0, nc: 0, canc: 0 },
      'MG2':                { conf: 0, nc: 0, canc: 0 },
      'GIRO MG2':           { conf: 0, nc: 0, canc: 0 }
    },
    equipamento: {
      'LIVE U1':      { conf: 0, nc: 0, canc: 0 },
      'LIVE U2':      { conf: 0, nc: 0, canc: 0 },
      'LIVE U3':      { conf: 0, nc: 0, canc: 0 },
      'LIVE U SMART': { conf: 0, nc: 0, canc: 0 },
      'REDAÇÃO':      { conf: 0, nc: 0, canc: 0 },
      'LIVE U4':      { conf: 0, nc: 0, canc: 0 },
      'NET PRAÇA':    { conf: 0, nc: 0, canc: 0 },
      'NET PORTARIA': { conf: 0, nc: 0, canc: 0 },
      'FORMATOS NET': { conf: 0, nc: 0, canc: 0 },
      'NET 2º ANDAR': { conf: 0, nc: 0, canc: 0 },
      'NET 3º ANDAR': { conf: 0, nc: 0, canc: 0 },
      'NET 4º ANDAR': { conf: 0, nc: 0, canc: 0 },
      'KMJ':          { conf: 0, nc: 0, canc: 0 }
    }
  };

  var envConfig = (typeof window !== 'undefined' && window.ENV_CONFIG) ? window.ENV_CONFIG : {};
  var SUPABASE_URL = (envConfig.SUPABASE_URL && envConfig.SUPABASE_URL.indexOf('seu-projeto') === -1)
    ? envConfig.SUPABASE_URL
    : (localStorage.getItem('tv_supabase_url') || '');
  var SUPABASE_ANON_KEY = (envConfig.SUPABASE_ANON_KEY && envConfig.SUPABASE_ANON_KEY.indexOf('sua-chave') === -1)
    ? envConfig.SUPABASE_ANON_KEY
    : (localStorage.getItem('tv_supabase_key') || '');

  var DBService = {
    mode: (SUPABASE_URL && SUPABASE_ANON_KEY) ? 'supabase' : 'local',
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY,

    getOcorrencias: function() { return load(); },
    saveOcorrencias: function(list) { 
      save(list);
      this.pushRemote('ocorrencias', list);
    },

    getHistorico: function() { return loadHistorico(); },
    saveHistorico: function(list) { 
      saveHistorico(list);
      this.pushRemote('historico', list);
    },

    getFotoPerfil: function() { return localStorage.getItem(PHOTO_STORAGE_KEY); },
    saveFotoPerfil: function(url) { localStorage.setItem(PHOTO_STORAGE_KEY, url); },
    removeFotoPerfil: function() { localStorage.removeItem(PHOTO_STORAGE_KEY); },

    enviarNotificacaoEmail: function(assunto, corpo, destinatarios) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('E-mail', 'Essa função de envio de e-mail ainda não está disponível.', 'info');
      }
    },

    deleteRemote: function(table, id) {
      if (!this.url || !this.key || !id) return;
      var self = this;
      try {
        var endpoint = this.url.replace(/\/$/, '') + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(id);
        fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'apikey': this.key,
            'Authorization': 'Bearer ' + this.key
          }
        }).then(function(res) {
          console.log('[DBService Cloud] Registro excluído com sucesso do Supabase (' + table + '):', id);
        }).catch(function(err) {
          console.warn('[DBService Cloud] Falha ao excluir registro do Supabase:', err);
        });
      } catch(e) {
        console.warn('[DBService Cloud] Exceção no deleteRemote:', e);
      }
    },

    pushRemote: function(table, data) {
      if (!this.url || !this.key) return;
      if (!Array.isArray(data) || data.length === 0) return;
      var self = this;
      try {
        var endpoint = this.url.replace(/\/$/, '') + '/rest/v1/' + table;
        var payload = data;
        if (table === 'ocorrencias') {
          payload = data.map(function(item) {
            var resObj = item.resolucao ? Object.assign({}, item.resolucao) : {};
            var anxList = (item.anexos && Array.isArray(item.anexos) && item.anexos.length > 0)
              ? item.anexos
              : ((resObj.anexos && Array.isArray(resObj.anexos)) ? resObj.anexos : []);
            if (anxList.length > 0) {
              resObj.anexos = anxList.map(function(anx) {
                if (!anx) return null;
                var a = Object.assign({}, anx);
                // Se já possui URL no Storage, descarta o base64 (dataUrl) pesado do banco de dados
                if (a.url && a.url.startsWith('http')) {
                  delete a.dataUrl;
                }
                return a;
              }).filter(Boolean);
            }
            return {
              id: item.id,
              titulo: item.titulo,
              prio: item.prio,
              cat: item.cat,
              resp: item.resp,
              local: item.local || '',
              prazo: item.prazo || '',
              desc: item.desc || '',
              mine: !!item.mine,
              tags: item.tags || [],
              status: item.status || 'aberta',
              criado: item.criado || Date.now(),
              dataCriacao: item.dataCriacao || '',
              resolucao: Object.keys(resObj).length > 0 ? resObj : null
            };
          });
        }
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.key,
            'Authorization': 'Bearer ' + this.key,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        }).then(function() {
          self.syncRemote();
        }).catch(function(err) {
          console.warn('[DBService Cloud] Falha ao enviar dados para o Supabase:', err);
        });
      } catch (e) {
        console.warn('[DBService Cloud] Exceção no push remoto:', e);
      }
    },

    init: function() {
      this.syncRemote();
    },

    syncRemote: function(force) {
      var now = Date.now();
      if (!force && this._lastSyncTime && (now - this._lastSyncTime < 15000)) {
        return; // Evita chamadas repetidas desnecessárias em menos de 15 segundos
      }
      this._lastSyncTime = now;

      if (!this.url) this.url = (envConfig && envConfig.SUPABASE_URL && envConfig.SUPABASE_URL.indexOf('seu-projeto') === -1) ? envConfig.SUPABASE_URL : (localStorage.getItem('tv_supabase_url') || '');
      if (!this.key) this.key = (envConfig && envConfig.SUPABASE_ANON_KEY && envConfig.SUPABASE_ANON_KEY.indexOf('sua-chave') === -1) ? envConfig.SUPABASE_ANON_KEY : (localStorage.getItem('tv_supabase_key') || '');
      if (!this.url || !this.key) {
        updateCloudStatus(false, 'Modo Local');
        return;
      }
      this.mode = 'supabase';
      var self = this;
      try {
        // 1. Sincroniza Ocorrências em tempo real (Supabase REST) com limite inteligente
        var urlOc = self.url.replace(/\/$/, '') + '/rest/v1/ocorrencias?select=*&order=criado.desc&limit=100';
        fetch(urlOc, {
          headers: {
            'apikey': self.key,
            'Authorization': 'Bearer ' + self.key,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-cache'
        })
        .then(function(res) {
          if (res.ok) {
            updateCloudStatus(true);
            return res.json();
          }
          updateCloudStatus(false);
          return null;
        })
        .then(function(remoteData) {
          if (Array.isArray(remoteData)) {
            var idsNaLixeira = (lixeiraData || []).map(function(item){ return item.id; });
            var clean = remoteData.map(sanitizeOcorrencia).filter(Boolean);
            clean.sort(function(a, b) { return (b.criado || 0) - (a.criado || 0); });
            ocorrencias = clean.filter(function(o){
              if (!o) return false;
              if (o.status === 'lixeira') return false;
              if (idsNaLixeira.includes(o.id)) return false;
              return true;
            });
            try {
              localStorage.setItem(OCORRENCIAS_CACHE_KEY, JSON.stringify(ocorrencias));
            } catch(e) {}
            var oldSig = (window._lastOcSyncSig || '');
            var newSig = ocorrencias.map(function(o){ return o.id + '_' + o.status + '_' + (o.criado || 0); }).join('|');
            if (oldSig !== newSig) {
              window._lastOcSyncSig = newSig;
              if (typeof renderAll === 'function') renderAll();
            }
          }
        })
        .catch(function(err) {
          updateCloudStatus(false);
          console.warn('[DBService Cloud Sync] Offline ou conectando ao Supabase...', err);
        });

        // 2. Sincroniza Histórico em tempo real (Supabase REST) com limite inteligente
        var urlHist = self.url.replace(/\/$/, '') + '/rest/v1/historico?select=*&order=dataCriacao.desc&limit=100';
        fetch(urlHist, {
          headers: {
            'apikey': self.key,
            'Authorization': 'Bearer ' + self.key,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-cache'
        })
        .then(function(res) { return res.ok ? res.json() : null; })
        .then(function(remoteHist) {
          if (Array.isArray(remoteHist)) {
            var idsNaLixeira = (lixeiraData || []).map(function(item){ return item.id; });
            var remoteFiltered = remoteHist.filter(function(h){
              if (!h) return false;
              if (h.status === 'lixeira') return false;
              if (idsNaLixeira.includes(h.id)) return false;
              return true;
            });
            var mapHist = {};
            remoteFiltered.forEach(function(h){ mapHist[h.id] = h; });
            (historicoSeedData || []).forEach(function(localH){
              if (localH && localH.id && !mapHist[localH.id]) {
                if (!idsNaLixeira.includes(localH.id) && localH.status !== 'lixeira') {
                  remoteFiltered.push(localH);
                }
              }
            });
            historicoSeedData = remoteFiltered;
            try {
              localStorage.setItem(HISTORICO_LOCAL_STORAGE_KEY, JSON.stringify(historicoSeedData));
            } catch(e) {}
            var oldHistSig = (window._lastHistSyncSig || '');
            var newHistSig = historicoSeedData.map(function(h){ return h.id + '_' + (h.status || ''); }).join('|');
            if (oldHistSig !== newHistSig) {
              window._lastHistSyncSig = newHistSig;
              if (typeof renderAll === 'function') renderAll();
            }
          }
        })
        .catch(function(err) {
          console.warn('[DBService Cloud Sync Hist] Offline ou conectando ao Supabase...', err);
        });

        // 3. Sincroniza Checklist e Rotinas em tempo real (Supabase)
        try {
          if (typeof sincronizarChecklistNuvem === 'function') sincronizarChecklistNuvem();
        } catch(eChk) {}

        // 4. Sincroniza Orçamentos em tempo real (Supabase)
        try {
          if (typeof sincronizarOrcamentoNuvem === 'function') sincronizarOrcamentoNuvem();
        } catch(eOrc) {}

        // 5. Sincroniza Lixeira em tempo real (Supabase)
        try {
          if (typeof sincronizarLixeiraNuvem === 'function') sincronizarLixeiraNuvem();
        } catch(eLix) {}

        // 6. Sincroniza Notificações em tempo real (Supabase)
        try {
          if (typeof sincronizarNotificacoesNuvem === 'function') sincronizarNotificacoesNuvem();
        } catch(eNot) {}
      } catch (e) {
        updateCloudStatus(false);
        console.warn('[DBService Cloud Sync] Exceção:', e);
      }
    }
  };
  window.DBService = DBService;

  /* ═══════════════════════════════════════════
     RESOLUÇÃO INTELIGENTE DE OPERADOR POR NOME (MULTI-PC & MULTI-NAVEGADOR)
  ═══════════════════════════════════════════ */
  window.OPERADOR_UUID_ATUAL = null;

  function obterOuCriarOperadorPorNome(nome, callback) {
    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      if (typeof callback === 'function') callback(null);
      return;
    }
    var nomeNorm = nome.trim();
    var dbUrl = (DBService && DBService.url) ? DBService.url.replace(/\/+$/, '') : '';
    var dbKey = (DBService && DBService.key) ? DBService.key : '';

    if (!dbUrl || !dbKey) {
      if (typeof callback === 'function') callback(null);
      return;
    }

    var endpoint = dbUrl + '/rest/v1/operadores?nome=eq.' + encodeURIComponent(nomeNorm) + '&select=id,nome,ativo';
    fetch(endpoint, {
      headers: {
        'apikey': dbKey,
        'Authorization': 'Bearer ' + dbKey,
        'Cache-Control': 'no-cache'
      }
    })
    .then(function(res) { return res.ok ? res.json() : []; })
    .then(function(ops) {
      if (Array.isArray(ops) && ops.length > 0) {
        var op = ops[0];
        window.OPERADOR_UUID_ATUAL = op.id;
        console.log('[Operador DB] ✅ Operador reconhecido por nome no Supabase:', op.nome, op.id);
        if (typeof callback === 'function') callback(op.id);
        if (typeof sincronizarChecklistNuvem === 'function') sincronizarChecklistNuvem();
      } else {
        var novoId = 'op_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        var payload = { id: novoId, nome: nomeNorm, ativo: true };
        fetch(dbUrl + '/rest/v1/operadores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': dbKey,
            'Authorization': 'Bearer ' + dbKey,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        })
        .then(function() {
          window.OPERADOR_UUID_ATUAL = novoId;
          console.log('[Operador DB] ✅ Novo operador cadastrado no Supabase:', nomeNorm, novoId);
          if (typeof callback === 'function') callback(novoId);
          if (typeof sincronizarChecklistNuvem === 'function') sincronizarChecklistNuvem();
        })
        .catch(function(err) {
          console.warn('[Operador DB] Falha ao registrar novo operador:', err);
          if (typeof callback === 'function') callback(null);
        });
      }
    })
    .catch(function(err) {
      console.warn('[Operador DB] Falha ao consultar operador por nome:', err);
      if (typeof callback === 'function') callback(null);
    });
  }
  window.obterOuCriarOperadorPorNome = obterOuCriarOperadorPorNome;

  function updateCloudStatus(isOnline, customText) {
    var indicator = document.getElementById('cloud-status-indicator');
    if (!indicator) return;
    if (isOnline) {
      indicator.className = 'cloud-status online';
      indicator.title = 'Conectado ao Supabase em tempo real';
      indicator.innerHTML = '<span class="cloud-dot"></span><span class="cloud-text">' + (customText || 'Nuvem Conectada') + '</span>';
    } else {
      indicator.className = 'cloud-status offline';
      indicator.title = 'Offline ou sem conexão com a nuvem (dados salvos localmente)';
      indicator.innerHTML = '<span class="cloud-dot"></span><span class="cloud-text">' + (customText || 'Modo Offline') + '</span>';
    }
  }
  window.updateCloudStatus = updateCloudStatus;

  window.addEventListener('online', function() {
    updateCloudStatus(true);
    if (typeof DBService !== 'undefined' && DBService.syncRemote) DBService.syncRemote();
  });
  window.addEventListener('offline', function() {
    updateCloudStatus(false);
  });

  function sanitizeOcorrencia(o) {
    if (!o || typeof o !== 'object') return null;
    var userAtual = getUsuarioAtual();
    var isMine = !!o.mine;
    if (o.resp && (o.resp === userAtual || o.resp.indexOf(userAtual) !== -1 || o.resp.indexOf('Você') !== -1)) {
      isMine = true;
    }
    var res = o.resolucao || null;
    var anx = (o.anexos && Array.isArray(o.anexos) && o.anexos.length > 0)
      ? o.anexos
      : ((res && Array.isArray(res.anexos) && res.anexos.length > 0) ? res.anexos : []);

    if (anx.length > 0) {
      if (!res) res = { statusRes: (o.status === 'aberta' ? 'Aberta' : 'Resolvido'), anexos: anx };
      else if (!res.anexos || res.anexos.length === 0) res.anexos = anx;
    }

    return {
      id: o.id || ('oc_' + Date.now()),
      titulo: o.titulo || 'Ocorrência sem título',
      prio: o.prio || 'Média',
      cat: o.cat || 'Equipamento',
      resp: o.resp || 'Todos do turno',
      local: o.local || '',
      prazo: o.prazo || '',
      desc: o.desc || '',
      mine: isMine,
      tags: Array.isArray(o.tags) ? o.tags : [],
      status: o.status || 'aberta',
      criado: o.criado || Date.now(),
      dataCriacao: o.dataCriacao || formatDataHoraLocal(o.criado),
      resolucao: res,
      anexos: anx
    };
  }

  function load() {
    if (!ocorrencias || ocorrencias.length === 0) {
      try {
        var rawCache = localStorage.getItem(OCORRENCIAS_CACHE_KEY);
        if (rawCache) {
          var parsed = JSON.parse(rawCache);
          if (Array.isArray(parsed) && parsed.length > 0) {
            ocorrencias = parsed.map(sanitizeOcorrencia).filter(Boolean);
          }
        }
      } catch(e) {}
    }
    return ocorrencias || [];
  }

  function save(list) {
    ocorrencias = list || [];
    window.ocorrencias = ocorrencias;
    try {
      localStorage.setItem(OCORRENCIAS_CACHE_KEY, JSON.stringify(ocorrencias));
    } catch(e) {}
    if (typeof DBService !== 'undefined' && DBService && typeof DBService.pushRemote === 'function') {
      DBService.pushRemote('ocorrencias', ocorrencias);
    }
  }

  var INITIAL_OCORRENCIAS_SEED = [
    {
      id: 'oc_init_1',
      titulo: 'Oscilação no Sinal do Transmissor Principal',
      prio: 'Alta',
      cat: 'Transmissão',
      resp: 'Todos do turno',
      local: 'Torre Central — Juiz de Fora',
      prazo: '12:00',
      desc: 'Identificada flutuação de potência no transmissor VHF canal 5 durante a abertura do turno. Necessário verificar acoplador e cabos coaxiais da antena transmissora.',
      mine: false,
      tags: ['Prioritário', 'Transmissão'],
      status: 'aberta',
      criado: Date.now() - 3600000,
      dataCriacao: formatDataHoraLocal(Date.now() - 3600000),
      resolucao: null,
      anexos: []
    },
    {
      id: 'oc_init_2',
      titulo: 'Verificação de Cabos SDI da Mesa de Produção',
      prio: 'Média',
      cat: 'Equipamento',
      resp: 'Carlos Silva',
      local: 'Estúdio 1 — switcher principal',
      prazo: '15:30',
      desc: 'Cabo SDI da câmera 2 apresentando ruído intermitente quando movimentado pelo operador de câmera. Necessário substituir o patch cord de 5 metros.',
      mine: true,
      tags: ['Equipamento', 'Estúdio'],
      status: 'aberta',
      criado: Date.now() - 7200000,
      dataCriacao: formatDataHoraLocal(Date.now() - 7200000),
      resolucao: null,
      anexos: []
    },
    {
      id: 'oc_init_3',
      titulo: 'Backup de Mídia da Ilha de Edição 3',
      prio: 'Baixa',
      cat: 'TI / Redes',
      resp: 'Operador',
      local: 'Central Técnica',
      prazo: '18:00',
      desc: 'Realizar rotina de backup dos arquivos brutos das matérias do telejornal para o storage secundário de arquivo permanente.',
      mine: false,
      tags: ['Arquivada'],
      status: 'arquivada',
      criado: Date.now() - 86400000,
      dataCriacao: formatDataHoraLocal(Date.now() - 86400000),
      resolucao: null,
      anexos: []
    },
    {
      id: 'oc_init_4',
      titulo: 'Receptor de Satélite — Calibração FEC',
      prio: 'Média',
      cat: 'Transmissão',
      resp: 'Carlos Silva',
      local: 'Sala de Receptores',
      prazo: '10:00',
      desc: 'Frequência de downlink do feed nacional reajustada no receptor digital com parâmetros FEC corrigidos.',
      mine: false,
      tags: ['Concluída'],
      status: 'resolvida',
      criado: Date.now() - 10800000,
      dataCriacao: formatDataHoraLocal(Date.now() - 10800000),
      resolucao: {
        statusRes: 'Resolvido',
        descRes: 'Parâmetros de modulação e FEC reconfigurados no decodificador. Nível de sinal estabilizado em 14.8 dB.',
        data: Date.now() - 5400000,
        resolvidoPor: 'Carlos Silva',
        anexos: []
      },
      anexos: []
    }
  ];

  var ocorrencias = (function() {
    try {
      var rawCache = localStorage.getItem(OCORRENCIAS_CACHE_KEY);
      if (rawCache) {
        var parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(sanitizeOcorrencia).filter(Boolean);
        }
      }
    } catch(e) {}
    return INITIAL_OCORRENCIAS_SEED.map(sanitizeOcorrencia).filter(Boolean);
  })();
  window.ocorrencias = ocorrencias;

  function getAbertas()    { return ocorrencias.filter(function(o){ return o && o.status === 'aberta'; }); }
  function getArquivadas() { return ocorrencias.filter(function(o){ return o && o.status === 'arquivada'; }); }
  function getResolvidas() { return ocorrencias.filter(function(o){ return o && o.status === 'resolvida'; }); }
