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

  /* ═══════════════════════════════════════════
     CRIPTOGRAFIA DE ALTA SEGURANÇA (AES-GCM 256 + PBKDF2 250.000 ITERAÇÕES)
     Permite deploy seguro no GitHub público protegendo as credenciais do Supabase
  ═══════════════════════════════════════════ */
  var TVCrypto = {
    buf2hex: function(buffer) {
      return Array.prototype.map.call(new Uint8Array(buffer), function(x) {
        return ('00' + x.toString(16)).slice(-2);
      }).join('');
    },
    hex2buf: function(hex) {
      var clean = (hex || '').trim().replace(/^0x/, '');
      var bytes = new Uint8Array(clean.length / 2);
      for (var i = 0; i < clean.length; i += 2) {
        bytes[i / 2] = parseInt(clean.substr(i, 2), 16);
      }
      return bytes.buffer;
    },
    encrypt: async function(passphrase, payload) {
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API indisponível neste navegador.');
      }
      var enc = new TextEncoder();
      var salt = crypto.getRandomValues(new Uint8Array(16));
      var iv = crypto.getRandomValues(new Uint8Array(12));
      var keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      var key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 250000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      var cipherBuf = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        enc.encode(JSON.stringify(payload))
      );
      return {
        salt: this.buf2hex(salt),
        iv: this.buf2hex(iv),
        data: this.buf2hex(cipherBuf)
      };
    },
    decrypt: async function(passphrase, pack) {
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API indisponível neste navegador.');
      }
      if (!pack || !pack.salt || !pack.iv || !pack.data) {
        throw new Error('Pacote criptografado ausente ou incompleto.');
      }
      var enc = new TextEncoder();
      var salt = new Uint8Array(this.hex2buf(pack.salt));
      var iv = new Uint8Array(this.hex2buf(pack.iv));
      var cipherBuf = this.hex2buf(pack.data);
      var keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      var key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 250000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      var decBuf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        cipherBuf
      );
      var dec = new TextDecoder();
      return JSON.parse(dec.decode(decBuf));
    }
  };
  window.TVCrypto = TVCrypto;

  // Pacote Criptografado Global (pode ser definido em config.js, no script ou via localStorage)
  window.ENCRYPTED_TV_CREDENTIALS = window.ENCRYPTED_TV_CREDENTIALS || (typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS) || null;

  function isEstacaoConectadaTV() {
    var u = (typeof DBService !== 'undefined' && DBService && DBService.url) ? DBService.url : (localStorage.getItem('tv_supabase_url') || '');
    var k = (typeof DBService !== 'undefined' && DBService && DBService.key) ? DBService.key : (localStorage.getItem('tv_supabase_key') || '');
    return Boolean(u && k && u.indexOf('seu-projeto') === -1 && k.indexOf('sua-chave') === -1);
  }
  window.isEstacaoConectadaTV = isEstacaoConectadaTV;

  function atualizarUIIdentificacaoOperador() {
    var group = document.getElementById('ident-chave-group');
    var label = document.getElementById('ident-chave-label');
    var hint  = document.getElementById('ident-chave-hint');
    var input = document.getElementById('ident-chave-acesso');
    var msg   = document.getElementById('ident-chave-msg');
    if (!group) return;

    var conectada = isEstacaoConectadaTV();
    var pack = window.ENCRYPTED_TV_CREDENTIALS || (typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS);

    if (conectada) {
      if (label) label.innerHTML = 'Chave de Acesso <span style="font-weight:400;color:var(--muted);font-size:11px;">(Opcional neste computador)</span>';
      if (hint)  hint.innerHTML  = '';
      if (input) input.placeholder = 'Deixe em branco para manter a sessão';
      if (msg)   msg.style.display = 'none';
    } else if (pack && pack.data) {
      if (label) label.innerHTML = 'Chave de Acesso *';
      if (hint)  hint.textContent = 'Senha de acesso';
      if (input) input.placeholder = 'Digite sua chave de acesso...';
      if (msg)   msg.style.display = 'none';
    } else {
      if (label) label.innerHTML = 'Chave de Acesso <span style="font-weight:400;color:var(--muted);font-size:11px;">(Opcional)</span>';
      if (hint)  hint.textContent = '';
      if (input) input.placeholder = 'Digite sua chave ou deixe em branco';
      if (msg)   msg.style.display = 'none';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.atualizarUIIdentificacaoOperador = atualizarUIIdentificacaoOperador;

  async function conectarComChaveTV(passphrase) {
    var pack = window.ENCRYPTED_TV_CREDENTIALS || (typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS);
    if (!passphrase || !passphrase.trim()) {
      return { ok: false, error: 'Por favor, informe a Chave de Acesso da TV.' };
    }

    if (!pack || !pack.data) {
      return { ok: false, error: 'Nenhum pacote criptografado configurado. Configure no config.js ou na aba Configurações.' };
    }

    try {
      var creds = await TVCrypto.decrypt(passphrase.trim(), pack);
      if (!creds || !creds.url || !creds.key) {
        return { ok: false, error: 'Pacote criptográfico não contém URL ou chave válidas.' };
      }

      SUPABASE_URL = creds.url;
      SUPABASE_ANON_KEY = creds.key;
      DBService.url = creds.url;
      DBService.key = creds.key;
      DBService.mode = 'supabase';

      localStorage.setItem('tv_supabase_url', creds.url);
      localStorage.setItem('tv_supabase_key', creds.key);

      updateCloudStatus(true);
      if (typeof carregarCredenciaisSupabaseConfig === 'function') {
        carregarCredenciaisSupabaseConfig();
      }
      if (typeof DBService.syncRemote === 'function') {
        DBService.syncRemote();
      }

      return { ok: true, creds: creds };
    } catch (err) {
      console.warn('[TVCrypto] Falha de autenticação:', err);
      return { ok: false, error: 'Chave de acesso incorreta. Verifique com a equipe técnica.' };
    }
  }
  window.conectarComChaveTV = conectarComChaveTV;

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
    formatOcorrenciaPayload: function(item) {
      if (!item) return null;
      var resObj = item.resolucao ? Object.assign({}, item.resolucao) : {};
      var anxList = (item.anexos && Array.isArray(item.anexos) && item.anexos.length > 0)
        ? item.anexos
        : ((resObj.anexos && Array.isArray(resObj.anexos)) ? resObj.anexos : []);
      if (anxList.length > 0) {
        resObj.anexos = anxList.map(function(anx) {
          if (!anx) return null;
          var a = Object.assign({}, anx);
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
        resolucao: Object.keys(resObj).length > 0 ? resObj : null,
        praca: item.praca || (typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora')
      };
    },

    saveOcorrencias: function(list, itemModificado, isNovo) { 
      save(list, itemModificado, isNovo);
    },

    getHistorico: function() { return loadHistorico(); },
    saveHistorico: function(list, itemAdicionado) { 
      saveHistorico(list, itemAdicionado);
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

    upsertOcorrenciaRemota: function(item, isNovo) {
      if (!this.url || !this.key || !item || !item.id) return;
      try {
        var payload = this.formatOcorrenciaPayload(item);
        if (!payload) return;
        var endpoint, method, headers;
        if (isNovo) {
          endpoint = this.url.replace(/\/$/, '') + '/rest/v1/ocorrencias';
          method = 'POST';
          headers = {
            'Content-Type': 'application/json',
            'apikey': this.key,
            'Authorization': 'Bearer ' + this.key,
            'Prefer': 'resolution=merge-duplicates'
          };
        } else {
          endpoint = this.url.replace(/\/$/, '') + '/rest/v1/ocorrencias?id=eq.' + encodeURIComponent(item.id);
          method = 'PATCH';
          headers = {
            'Content-Type': 'application/json',
            'apikey': this.key,
            'Authorization': 'Bearer ' + this.key
          };
        }
        fetch(endpoint, {
          method: method,
          headers: headers,
          body: JSON.stringify(payload)
        }).then(function(res) {
          if (!res.ok) {
            console.warn('[DBService Cloud] Falha ao sincronizar ocorrência pontual (' + res.status + '):', item.id);
          } else {
            console.log('[DBService Cloud] ✅ Ocorrência sincronizada pontualmente (' + method + '):', item.id);
          }
        }).catch(function(err) {
          console.warn('[DBService Cloud] Erro no envio pontual da ocorrência:', err);
        });
      } catch(e) {
        console.warn('[DBService Cloud] Exceção em upsertOcorrenciaRemota:', e);
      }
    },

    pushHistoricoItem: function(histItem) {
      if (!this.url || !this.key || !histItem) return;
      try {
        var endpoint = this.url.replace(/\/$/, '') + '/rest/v1/historico';
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.key,
            'Authorization': 'Bearer ' + this.key,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(histItem)
        }).then(function(res) {
          if (!res.ok) {
            console.warn('[DBService Cloud] Falha ao enviar item de histórico (' + res.status + '):', histItem.id);
          } else {
            console.log('[DBService Cloud] ✅ Histórico sincronizado pontualmente (POST):', histItem.id);
          }
        }).catch(function(err) {
          console.warn('[DBService Cloud] Erro no pushHistoricoItem:', err);
        });
      } catch(e) {
        console.warn('[DBService Cloud] Exceção em pushHistoricoItem:', e);
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
            return self.formatOcorrenciaPayload(item);
          }).filter(Boolean);
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
        }).then(function(res) {
          if (!res.ok) {
            console.warn('[DBService Cloud] Falha no pushRemote (' + table + ' - ' + res.status + ')');
          }
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
            ocorrencias = mesclarOcorrencias(ocorrencias, remoteData, idsNaLixeira);
            window.ocorrencias = ocorrencias;
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
      indicator.title = 'Offline ou sem conexão com a nuvem (dados salvos localmente no cache)';
      indicator.innerHTML = '<span class="cloud-dot"></span><span class="cloud-text">' + (customText || 'Modo Local') + '</span>';
    }
  }
  window.updateCloudStatus = updateCloudStatus;

  window.addEventListener('online', function() {
    updateCloudStatus(true, 'Nuvem Conectada');
    if (typeof DBService !== 'undefined' && DBService.syncRemote) DBService.syncRemote();
  });
  window.addEventListener('offline', function() {
    updateCloudStatus(false, 'Modo Local');
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
      anexos: anx,
      praca: o.praca || (typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora')
    };
  }

  function mesclarOcorrencias(locais, remotas, idsNaLixeira) {
    var lixeiraArr = idsNaLixeira || [];
    var mapa = {};
    var now = Date.now();

    // 1. Indexa itens remotos saneados
    (remotas || []).forEach(function(rRaw) {
      var r = sanitizeOcorrencia(rRaw);
      if (!r || !r.id || r.status === 'lixeira' || lixeiraArr.indexOf(r.id) !== -1) return;
      mapa[r.id] = r;
    });

    // 2. Mescla com itens locais para concorrência segura (multi-operador)
    (locais || []).forEach(function(l) {
      if (!l || !l.id || l.status === 'lixeira' || lixeiraArr.indexOf(l.id) !== -1) return;
      var r = mapa[l.id];
      if (!r) {
        // Ocorrência criada localmente que ainda não constava no select remoto (ex: criada nos últimos 3 minutos)
        var idadeLocal = now - (l.criado || 0);
        if (idadeLocal < 180000) {
          mapa[l.id] = l;
        }
      } else {
        // Ambas existem: se status ou resolução mudou recentemente no local, preserva o local
        var localResolvida = (l.status === 'resolvida' && r.status !== 'resolvida');
        var editLocalRecente = (l.ultimaEdicaoEm && (!r.ultimaEdicaoEm || l.ultimaEdicaoEm > r.ultimaEdicaoEm));
        if (localResolvida || editLocalRecente) {
          mapa[l.id] = Object.assign({}, r, l);
        }
      }
    });

    // 3. Converte para lista ordenada decrescente por criado
    var ids = Object.keys(mapa);
    var resultado = [];
    for (var i = 0; i < ids.length; i++) {
      resultado.push(mapa[ids[i]]);
    }
    resultado.sort(function(a, b) {
      return (b.criado || 0) - (a.criado || 0);
    });
    return resultado;
  }
  window.mesclarOcorrencias = mesclarOcorrencias;

  function load() {
    if (!ocorrencias || ocorrencias.length === 0) {
      try {
        var rawCache = localStorage.getItem(OCORRENCIAS_CACHE_KEY);
        if (rawCache) {
          var parsed = JSON.parse(rawCache);
          if (Array.isArray(parsed) && parsed.length > 0) {
            ocorrencias = parsed.filter(function(o){ return o && !String(o.id).startsWith('oc_init_'); }).map(sanitizeOcorrencia).filter(Boolean);
          }
        }
      } catch(e) {}
    }
    return ocorrencias || [];
  }

  function save(list, itemModificado, isNovo) {
    ocorrencias = list || [];
    window.ocorrencias = ocorrencias;
    try {
      localStorage.setItem(OCORRENCIAS_CACHE_KEY, JSON.stringify(ocorrencias));
    } catch(e) {}
    if (typeof DBService !== 'undefined' && DBService) {
      if (itemModificado && typeof DBService.upsertOcorrenciaRemota === 'function') {
        DBService.upsertOcorrenciaRemota(itemModificado, isNovo);
      } else if (typeof DBService.pushRemote === 'function') {
        DBService.pushRemote('ocorrencias', ocorrencias);
      }
    }
  }
  window.save = save;

  var INITIAL_OCORRENCIAS_SEED = [];

  var ocorrencias = (function() {
    try {
      var rawCache = localStorage.getItem(OCORRENCIAS_CACHE_KEY);
      if (rawCache) {
        var parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed) && parsed.length > 0) {
          var limpos = parsed.filter(function(o){ return o && !String(o.id).startsWith('oc_init_'); });
          if (limpos.length !== parsed.length) {
            try {
              localStorage.setItem(OCORRENCIAS_CACHE_KEY, JSON.stringify(limpos));
            } catch(eClean) {}
          }
          return limpos.map(sanitizeOcorrencia).filter(Boolean);
        }
      }
    } catch(e) {}
    return [];
  })();
  window.ocorrencias = ocorrencias;

  function pertenceAPracaAtiva(item) {
    if (!item) return false;
    var pracaAtiva = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isUberlandia = pracaAtiva.indexOf('Uber') !== -1;
    var itemPraca = item.praca || item.local || '';
    if (isUberlandia) {
      return itemPraca.indexOf('Uber') !== -1;
    } else {
      // Juiz de Fora: item.praca contém 'Juiz' ou não possui praça preenchida (legado)
      return !itemPraca || itemPraca.indexOf('Juiz') !== -1;
    }
  }
  window.pertenceAPracaAtiva = pertenceAPracaAtiva;

  function getAbertas()    { return ocorrencias.filter(function(o){ return o && o.status === 'aberta' && pertenceAPracaAtiva(o); }); }
  function getArquivadas() { return ocorrencias.filter(function(o){ return o && o.status === 'arquivada' && pertenceAPracaAtiva(o); }); }
  function getResolvidas() { return ocorrencias.filter(function(o){ return o && o.status === 'resolvida' && pertenceAPracaAtiva(o); }); }

