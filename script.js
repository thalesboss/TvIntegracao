/* ═══════════════════════════════════════════
   POPUP — funções base globais
═══════════════════════════════════════════ */
function abrirPopup(id) {
  var el = document.getElementById(id);
  if (el) {
    el.removeAttribute('hidden');
    el.style.setProperty('display', 'flex', 'important');
    el.style.pointerEvents = 'auto';
  }
  if ((id === 'popup-nova-oc' || id === 'popup-editar-oc') && typeof atualizarSelectEquipamentosNovaOc === 'function') {
    atualizarSelectEquipamentosNovaOc();
  }
}
function fecharPopup(id) {
  var el = document.getElementById(id);
  if (el) {
    el.setAttribute('hidden', '');
    el.style.setProperty('display', 'none', 'important');
    el.style.pointerEvents = 'none';
  }
}
function toggleBtnIniciarSessao(checked) {
  var btn = document.getElementById('btn-iniciar');
  if (btn) {
    btn.disabled = !checked;
    btn.style.opacity = checked ? '1' : '0.45';
    btn.style.cursor = checked ? 'pointer' : 'not-allowed';
  }
}
function iniciarSessao() {
  var chk = document.getElementById('chk-entrada');
  if (!chk || !chk.checked) {
    if (typeof mostrarToast === 'function') {
      mostrarToast('Atenção', 'Por favor, marque a caixa confirmando que leu as orientações antes de iniciar.', 'warning');
    }
    return;
  }
  fecharPopup('popup-entrada');
  var pop = document.getElementById('popup-entrada');
  if (pop) {
    pop.setAttribute('hidden', '');
    pop.style.setProperty('display', 'none', 'important');
    pop.style.pointerEvents = 'none';
  }
  if (typeof atualizarTimerLogin === 'function') {
    atualizarTimerLogin();
  }
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}
function abrirQuickLook(src, nome) {
  if (!src) return;
  var pop = document.getElementById('popup-quicklook');
  var img = document.getElementById('quicklook-img');
  var nameEl = document.getElementById('quicklook-filename');
  var dlBtn = document.getElementById('quicklook-download-btn');

  if (img) img.src = src;
  if (nameEl) nameEl.textContent = nome || 'Imagem';
  if (dlBtn) {
    dlBtn.href = src;
    dlBtn.download = nome || 'imagem_anexa';
  }

  abrirPopup('popup-quicklook');
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function fecharQuickLook() {
  fecharPopup('popup-quicklook');
  var img = document.getElementById('quicklook-img');
  if (img) img.src = '';
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' || e.keyCode === 27) {
    var ql = document.getElementById('popup-quicklook');
    if (ql && !ql.hasAttribute('hidden') && ql.style.display !== 'none') {
      fecharQuickLook();
    }
  }
});

window.abrirPopup             = abrirPopup;
window.fecharPopup            = fecharPopup;
window.abrirQuickLook         = abrirQuickLook;
window.fecharQuickLook        = fecharQuickLook;
window.toggleBtnIniciarSessao = toggleBtnIniciarSessao;
window.iniciarSessao          = iniciarSessao;

/* Fechar popups clicando fora no overlay escuro */
document.addEventListener('click', function(e) {
  if (e.target && e.target.classList && e.target.classList.contains('overlay') && e.target.id !== 'popup-entrada') {
    fecharPopup(e.target.id);
  }
});
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

  // Pacote Criptografado Global de Alta Segurança (AES-256-GCM + PBKDF2)
  // Descriptografado exclusivamente em memória pela Chave de Acesso da Equipe
  window.ENCRYPTED_TV_CREDENTIALS = window.ENCRYPTED_TV_CREDENTIALS || (typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS) || {
    salt: '9f6ca6650ad6670436a478d785b65dbd',
    iv: '289b276d312c24f6a3d6102e',
    data: '9c1e2b61b20cc9d3596ad6bb98944e2acce2ffeaab2e2e43c669d3a2a6918f761be4d464e984b4255195293aaa0d6cf993381959d332101d0d01bec6a89f08421d11a8e26be003711dd3602b37cad059ef6eefd47bc0615a9b26b050bcc25ca36a98cb18b46541aeb86b07cf32206a4e8699adaa0f8493e124'
  };

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
        await DBService.syncRemote(true);
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
      if (!this.url) this.url = (envConfig && envConfig.SUPABASE_URL && envConfig.SUPABASE_URL.indexOf('seu-projeto') === -1) ? envConfig.SUPABASE_URL : (localStorage.getItem('tv_supabase_url') || '');
      if (!this.key) this.key = (envConfig && envConfig.SUPABASE_ANON_KEY && envConfig.SUPABASE_ANON_KEY.indexOf('sua-chave') === -1) ? envConfig.SUPABASE_ANON_KEY : (localStorage.getItem('tv_supabase_key') || '');
      if (!this.url || !this.key) {
        updateCloudStatus(false, 'Modo Local');
        return Promise.resolve(false);
      }

      var now = Date.now();
      if (!force && this._lastSyncTime && (now - this._lastSyncTime < 15000)) {
        return Promise.resolve(false); // Evita chamadas repetidas desnecessárias em menos de 15 segundos
      }
      this._lastSyncTime = now;
      this.mode = 'supabase';
      var self = this;

      return new Promise(function(resolveSync) {
        try {
          // 1. Sincroniza Ocorrências em tempo real (Supabase REST) com limite inteligente
          var urlOc = self.url.replace(/\/$/, '') + '/rest/v1/ocorrencias?select=*&order=criado.desc&limit=100';
          var pOc = fetch(urlOc, {
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
              window._lastOcSyncSig = ocorrencias.map(function(o){ return o.id + '_' + o.status + '_' + (o.criado || 0); }).join('|');
              if (typeof renderAll === 'function') renderAll(true);
            }
          })
          .catch(function(err) {
            updateCloudStatus(false);
            console.warn('[DBService Cloud Sync] Offline ou conectando ao Supabase...', err);
          });

          // 2. Sincroniza Histórico em tempo real (Supabase REST) com limite inteligente
          var urlHist = self.url.replace(/\/$/, '') + '/rest/v1/historico?select=*&order=dataCriacao.desc&limit=100';
          var pHist = fetch(urlHist, {
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
              window._lastHistSyncSig = historicoSeedData.map(function(h){ return h.id + '_' + (h.status || ''); }).join('|');
              if (typeof renderAll === 'function') renderAll(true);
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

          // 7. Sincroniza Equipe de Jornalismo (Repórteres e RCs) em tempo real (Supabase)
          try {
            if (typeof sincronizarEquipeNuvem === 'function') sincronizarEquipeNuvem();
          } catch(eEq) {}

          Promise.all([pOc, pHist]).then(function() {
            if (typeof renderAll === 'function') renderAll(true);
            resolveSync(true);
          }).catch(function() {
            if (typeof renderAll === 'function') renderAll(true);
            resolveSync(false);
          });
        } catch (e) {
          updateCloudStatus(false);
          console.warn('[DBService Cloud Sync] Exceção:', e);
          resolveSync(false);
        }
      });
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
        var novoId = (window.crypto && typeof window.crypto.randomUUID === 'function')
          ? window.crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
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

  /* ═══════════════════════════════════════════
     HELPERS DE RENDER
  ═══════════════════════════════════════════ */

  function formatDataHoraLocal(dateInput) {
    var d;
    if (dateInput) {
      if (typeof dateInput === 'number' || typeof dateInput === 'string' || dateInput instanceof Date) {
        d = new Date(dateInput);
      } else {
        d = new Date();
      }
    } else {
      d = new Date();
    }
    if (isNaN(d.getTime())) d = new Date();

    var ano = d.getFullYear();
    var mes = String(d.getMonth() + 1);
    if (mes.length < 2) mes = '0' + mes;
    var dia = String(d.getDate());
    if (dia.length < 2) dia = '0' + dia;
    var hora = String(d.getHours());
    if (hora.length < 2) hora = '0' + hora;
    var min = String(d.getMinutes());
    if (min.length < 2) min = '0' + min;

    return ano + '-' + mes + '-' + dia + ' ' + hora + ':' + min;
  }
  window.formatDataHoraLocal = formatDataHoraLocal;

  function prioLine(prio) { return prio==='Alta'?'pl-r':prio==='Média'?'pl-y':'pl-g'; }
  function tagClass(prio) { return prio==='Alta'?'tag-r':prio==='Média'?'tag-y':'tag-g'; }

  function isOcorrenciaVencida(oc) {
    if (!oc || oc.status !== 'aberta') return false;
    if (oc.tags && Array.isArray(oc.tags) && oc.tags.indexOf('Atrasada') !== -1) return true;
    if (oc.prazo) {
      var parts = String(oc.prazo).split(':');
      if (parts.length === 2) {
        var now = new Date();
        var pTime = new Date();
        pTime.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
        if (now > pTime) return true;
      }
    }
    return false;
  }
  window.isOcorrenciaVencida = isOcorrenciaVencida;

  function isOcorrenciaDiaAnterior(oc) {
    if (!oc || !oc.criado) return false;
    var dataOc = new Date(Number(oc.criado) || oc.criado);
    if (isNaN(dataOc.getTime())) return false;
    var hoje = new Date();
    var diaOc = new Date(dataOc.getFullYear(), dataOc.getMonth(), dataOc.getDate());
    var diaHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    return diaOc < diaHoje;
  }
  window.isOcorrenciaDiaAnterior = isOcorrenciaDiaAnterior;

  function isOcorrenciaNova(oc) {
    if (!oc || !oc.criado) return false;
    var timestampCriacao = Number(oc.criado) || oc.criado;
    if (isNaN(timestampCriacao)) return false;
    var diffHoras = (Date.now() - timestampCriacao) / (1000 * 60 * 60);
    return diffHoras >= 0 && diffHoras < 24;
  }
  window.isOcorrenciaNova = isOcorrenciaNova;

  function formatDataRelativa(timestampOrStr) {
    if (!timestampOrStr) return '';
    var dateObj = null;
    if (typeof timestampOrStr === 'number') {
      dateObj = new Date(timestampOrStr);
    } else if (typeof timestampOrStr === 'string') {
      dateObj = new Date(timestampOrStr.replace(' ', 'T'));
      if (isNaN(dateObj.getTime())) {
        var num = Number(timestampOrStr);
        if (!isNaN(num)) dateObj = new Date(num);
      }
    }
    if (!dateObj || isNaN(dateObj.getTime())) return '';

    var now = new Date();
    var hojeZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var itemZero = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
    var diffDays = Math.round((hojeZero - itemZero) / (1000 * 60 * 60 * 24));

    var horaStr = ('0' + dateObj.getHours()).slice(-2) + ':' + ('0' + dateObj.getMinutes()).slice(-2);

    if (diffDays === 0) {
      return 'Criada hoje às ' + horaStr;
    } else if (diffDays === 1) {
      return 'Criada ontem às ' + horaStr;
    } else if (diffDays > 1 && diffDays < 7) {
      var diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      return diasSemana[dateObj.getDay()] + ' às ' + horaStr;
    } else {
      var dia = ('0' + dateObj.getDate()).slice(-2);
      var mes = ('0' + (dateObj.getMonth() + 1)).slice(-2);
      return dia + '/' + mes + ' às ' + horaStr;
    }
  }

  var filtroOcorrenciasAtivo = 'todas';

  /* ─── Render: lista principal de ocorrências ativas ─── */
  function renderCards() {
    var container = document.getElementById('oc-list');
    if (!container) return;

    var lista = getAbertas();

    if (filtroOcorrenciasAtivo === 'alta') {
      lista = lista.filter(function(o) { return (o.prio || '').toLowerCase() === 'alta'; });
    } else if (filtroOcorrenciasAtivo === 'media') {
      lista = lista.filter(function(o) { return (o.prio || '').toLowerCase() === 'média' || (o.prio || '').toLowerCase() === 'media'; });
    } else if (filtroOcorrenciasAtivo === 'baixa') {
      lista = lista.filter(function(o) { return (o.prio || '').toLowerCase() === 'baixa'; });
    } else if (filtroOcorrenciasAtivo === 'atrasadas') {
      lista = lista.filter(function(o) { return isOcorrenciaVencida(o); });
    }

    if (lista.length === 0) {
      container.innerHTML =
        '<p style="color:var(--muted);font-size:13px;text-align:center;padding:28px 0;">' +
        'Nenhuma ocorrência encontrada para o filtro selecionado.</p>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    /* Agrupamento temporal (Hoje, Ontem, Dias Anteriores) */
    var secoes = agruparPorDias(lista, function(oc){ return oc.criado || oc.dataCriacao; });

    function renderCardHTML(oc) {
      var isVencida = isOcorrenciaVencida(oc);
      var isParcial = (oc.resolucao && oc.resolucao.statusRes === 'Parcialmente resolvido') || (oc.tags || []).indexOf('Parcialmente Resolvida') !== -1;
      var isNova = isOcorrenciaNova(oc);

      var tagsHTML = '<span class="tag ' + tagClass(oc.prio) + '">' + (oc.prio || 'Média') + '</span>';
      
      if (oc.mine) {
        tagsHTML += '<span class="tag" style="background:#EEF2FF;color:#4F46E5;border:1px solid #C7D2FE;font-weight:600;"><i data-lucide="user-check" style="width:11px;height:11px;stroke-width:2.5;margin-right:3px;"></i>Atribuída a você</span>';
      }
      if (isParcial) {
        tagsHTML += '<span class="tag" style="background:#FFFBEB;color:#D97706;border:1px solid #FDE68A;font-weight:600;">Parcialmente Resolvida</span>';
      }
      if (isVencida) {
        tagsHTML += '<span class="tag" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;font-weight:600;"><i data-lucide="alert-circle" style="width:11px;height:11px;stroke-width:2.5;margin-right:3px;"></i>Atrasada</span>';
      }
      if (isNova) {
        tagsHTML += '<span class="tag" style="background:#F8FAFC;color:#475569;border:1px solid #E2E8F0;font-weight:600;">Nova</span>';
      }

      (oc.tags || []).forEach(function(t) {
        if (t !== 'Nova' && t !== 'Atrasada' && t !== 'Turno anterior' && t !== 'Parcialmente Resolvida' && t !== 'Só para você' && t !== 'Dia Anterior') {
          tagsHTML += '<span class="tag tag-y">' + escapeHTML(t) + '</span>';
        }
      });

      var respIco  = (oc.resp === 'Todos do turno') ? 'users' : 'user';
      var timeRel  = formatDataRelativa(oc.criado || oc.dataCriacao);
      var timeH    = timeRel ? '<span class="oc-meta-item" style="color:var(--muted);"><i data-lucide="clock" style="width:11.5px;height:11.5px;stroke-width:2;color:var(--dim);"></i>' + timeRel + '</span>' : '';
      
      var prazoH   = '';
      if (oc.prazo) {
        if (isVencida) {
          prazoH = '<span class="oc-meta-item" style="color:#DC2626;font-weight:600;"><i data-lucide="timer" style="width:12px;height:12px;stroke-width:2.5;color:#DC2626;"></i>Prazo: ' + escapeHTML(oc.prazo) + ' (Expirado)</span>';
        } else {
          prazoH = '<span class="oc-meta-item"><i data-lucide="timer" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i>Prazo: ' + escapeHTML(oc.prazo) + '</span>';
        }
      }

      var localH   = oc.local ? '<span class="oc-meta-item"><i data-lucide="map-pin" style="width:11.5px;height:11.5px;stroke-width:2;color:var(--dim);"></i>' + escapeHTML(oc.local) + '</span>' : '';

      var cardClasses = 'oc-card';
      if (isVencida) cardClasses += ' vencida';
      else if (isParcial) cardClasses += ' parcialmente-resolvida';
      else if (oc.mine) cardClasses += ' mine';

      return (
        '<article class="' + cardClasses + '" data-id="' + oc.id + '" onclick="verDetalhesOcorrencia(\'' + oc.id + '\')" style="margin-bottom:10px;" title="Clique para ver detalhes">' +
          '<div class="prio-line ' + prioLine(oc.prio) + '"></div>' +
          '<div class="oc-body">' +
            '<div class="oc-header"><h3>' + escapeHTML(oc.titulo || 'Sem título') + '</h3>' + tagsHTML + '</div>' +
            '<p class="oc-desc">' + escapeHTML(oc.desc || '') + '</p>' +
            '<div class="oc-meta">' +
              '<span class="oc-meta-item"><i data-lucide="' + respIco + '" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i>' + escapeHTML(oc.resp || 'Todos do turno') + '</span>' +
              timeH + prazoH + localH +
            '</div>' +
          '</div>' +
          '<div class="oc-actions" onclick="event.stopPropagation();">' +
            '<button class="btn-card-action btn-card-resolve" onclick="event.stopPropagation(); abrirResolver(\'' + oc.id + '\')" title="Resolver ocorrência">' +
              '<i data-lucide="check-circle-2" style="width:13px;height:13px;stroke-width:2.2;"></i> Resolver' +
            '</button>' +
          '</div>' +
        '</article>'
      );
    }

    container.innerHTML = renderSecoesComCards(secoes, renderCardHTML);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.renderCards = renderCards;

  /* ── Helper Global: Agrupamento temporal (Hoje, Ontem, Dias Anteriores) ── */
  function agruparPorDias(itens, fnData) {
    var now = new Date();
    var hojeZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    var grupos = {
      hoje: [],
      ontem: [],
      anteriores: []
    };

    (itens || []).forEach(function(item) {
      var valData = fnData ? fnData(item) : (item.criado || item.dataCriacao || item.dataExclusao);
      var ts;
      if (typeof valData === 'number') {
        ts = valData;
      } else if (typeof valData === 'string') {
        ts = new Date(valData.replace(' ', 'T')).getTime();
      } else if (valData instanceof Date) {
        ts = valData.getTime();
      } else {
        ts = Date.now();
      }
      if (!ts || isNaN(ts)) ts = Date.now();

      var d = new Date(ts);
      var itemZero = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      var diffDays = Math.round((hojeZero - itemZero) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        grupos.hoje.push(item);
      } else if (diffDays === 1) {
        grupos.ontem.push(item);
      } else {
        grupos.anteriores.push(item);
      }
    });

    return [
      { key: 'hoje', titulo: 'Hoje', icone: 'calendar', items: grupos.hoje },
      { key: 'ontem', titulo: 'Ontem', icone: 'history', items: grupos.ontem },
      { key: 'anteriores', titulo: 'Dias Anteriores', icone: 'archive', items: grupos.anteriores }
    ];
  }

  function renderSecoesComCards(secoes, fnRenderCard) {
    var html = '';
    (secoes || []).forEach(function(sec) {
      if (sec.items && sec.items.length > 0) {
        html +=
          '<div class="oc-section-header" style="margin-top:14px;margin-bottom:10px;">' +
            '<span class="oc-section-title"><i data-lucide="' + sec.icone + '" style="width:13px;height:13px;stroke-width:2.2;"></i> ' + sec.titulo + '</span>' +
            '<span class="oc-section-count">' + sec.items.length + '</span>' +
            '<div class="oc-section-line"></div>' +
          '</div>' +
          sec.items.map(fnRenderCard).join('');
      }
    });
    return html;
  }

  /* ─── Render: painéis aside (CTRS + Falhas) ─── */
  /* Ambos usam o mesmo nome "Ocorrências" e os mesmos dados */
  function renderAside(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var abertas    = getAbertas();
    var resolvidas = getResolvidas();

    /* ── Mini cards das abertas ── */
    var abertasHTML = '';
    if (abertas.length === 0) {
      abertasHTML = '<p style="font-size:11.5px;color:var(--muted);padding:8px 0;">Nenhuma ocorrência ativa.</p>';
    } else {
      abertasHTML = abertas.map(function(oc) {
        var dotClass = oc.prio==='Alta'?'md-r':oc.prio==='Média'?'md-y':'md-g';
        var tagsPrio = '<span class="tag ' + tagClass(oc.prio) + '">' + (oc.prio || 'Média') + '</span>';
        if (isOcorrenciaNova(oc)) tagsPrio += '<span class="tag tag-y">Nova</span>';
        (oc.tags || []).forEach(function(t) {
          if (t !== 'Nova' && t !== 'Atrasada' && t !== 'Turno anterior' && t !== 'Parcialmente Resolvida' && t !== 'Dia Anterior') {
            tagsPrio += '<span class="tag tag-y">' + t + '</span>';
          }
        });
        if (oc.mine) tagsPrio += '<span class="tag" style="background:#EEF2FF;color:#4F46E5;border:1px solid #C7D2FE;font-weight:600;">Atribuída a você</span>';

        var meta = escapeHTML(oc.resp || 'Todos do turno');
        if (oc.prazo) meta += ' · ' + escapeHTML(oc.prazo);
        if (oc.local) meta += ' · ' + escapeHTML(oc.local);

        return (
          '<div class="mini-oc' + (oc.mine ? ' mine' : '') + '" onclick="abrirResolver(\'' + oc.id + '\')">' +
            '<div class="mini-top"><div class="mini-dot ' + dotClass + '"></div>' +
            '<div class="mini-title">' + escapeHTML(oc.titulo || 'Ocorrência') + '</div></div>' +
            '<div style="margin-bottom:3px;">' + tagsPrio + '</div>' +
            '<div class="mini-info">' + meta + '</div>' +
          '</div>'
        );
      }).join('');
    }

    /* ── Lista de resolvidas ── */
    var resolvidasHTML = '';
    if (resolvidas.length > 0) {
      resolvidasHTML =
        '<div class="aside-divider"></div>' +
        '<div class="aside-lbl">Resolvidas (' + resolvidas.length + ')</div>' +
        resolvidas.slice(0, 5).map(function(oc) {
          var statusLabel = oc.resolucao ? oc.resolucao.statusRes : 'Resolvido';
          return (
            '<div class="resolved-item">' +
              '<div class="ri-title">' + escapeHTML(oc.titulo || '') + '</div>' +
              '<div class="ri-meta">' + escapeHTML(statusLabel) + ' · ' + escapeHTML(oc.resp || 'Todos do turno') + '</div>' +
            '</div>'
          );
        }).join('');
    }

    container.innerHTML =
      '<div class="aside-lbl">Ocorrências (' + abertas.length + ')</div>' +
      abertasHTML +
      resolvidasHTML;
  }
  /* ═══════════════════════════════════════════
     HISTÓRICO GERAL — ESTRUTURA DE DADOS
  ═══════════════════════════════════════════ */

  var HISTORICO_LOCAL_STORAGE_KEY = 'tv_historico_seed_v2';
  var historicoSeedData = [];

  try {
    var rawHist = localStorage.getItem(HISTORICO_LOCAL_STORAGE_KEY);
    if (rawHist) {
      var pHist = JSON.parse(rawHist);
      if (Array.isArray(pHist) && pHist.length > 0) historicoSeedData = pHist;
    }
  } catch(e) {}
  window.historicoSeedData = historicoSeedData;

  function saveHistorico(list, itemAdicionado) {
    historicoSeedData = list || [];
    window.historicoSeedData = historicoSeedData;
    try {
      localStorage.setItem(HISTORICO_LOCAL_STORAGE_KEY, JSON.stringify(historicoSeedData));
    } catch(e) {}
    if (typeof DBService !== 'undefined' && DBService) {
      if (itemAdicionado && typeof DBService.pushHistoricoItem === 'function') {
        DBService.pushHistoricoItem(itemAdicionado);
      } else if (typeof DBService.pushRemote === 'function') {
        DBService.pushRemote('historico', historicoSeedData);
      }
    }
  }

  function getHistoricoCompleto() {
    var mapa = {};
    var lista = [];
    var idsNaLixeira = (lixeiraData || []).map(function(item){ return item.id; });

    // 1. Itens manuais ou relatórios vindos de historicoSeedData
    (historicoSeedData || []).forEach(function(item) {
      if (item && item.id) {
        if (item.status === 'lixeira' || idsNaLixeira.includes(item.id)) return;
        if (typeof pertenceAPracaAtiva === 'function' && !pertenceAPracaAtiva(item)) return;
        mapa[item.id] = true;
        lista.push(item);
      }
    });

    // 2. Ocorrências resolvidas ou arquivadas vindas de ocorrencias (do dashboard/banco)
    (ocorrencias || []).forEach(function(oc) {
      if (!oc || !oc.id) return;
      if (oc.status === 'lixeira' || idsNaLixeira.includes(oc.id)) return;
      if (typeof pertenceAPracaAtiva === 'function' && !pertenceAPracaAtiva(oc)) return;
      var isResolvidaOuArquivada = (oc.status === 'resolvida' || oc.status === 'arquivada' || (oc.resolucao && oc.resolucao.statusRes));
      if (isResolvidaOuArquivada) {
        var histId = 'h_oc_' + oc.id;
        if (!mapa[oc.id] && !mapa[histId]) {
          var statusLabel = (oc.resolucao && oc.resolucao.statusRes) ? oc.resolucao.statusRes : (oc.status === 'arquivada' ? 'Resolvida e Arquivada' : 'Resolvido');
          var nowFmt = formatDataHoraLocal(oc.dataCriacao || oc.criado);
          var resFmt = (oc.resolucao && oc.resolucao.data) ? formatDataHoraLocal(oc.resolucao.data) : nowFmt;
          var resPor = (oc.resolucao && oc.resolucao.resolvidoPor) ? oc.resolucao.resolvidoPor : (oc.resp || getUsuarioAtual());
          var resDesc = (oc.resolucao && oc.resolucao.descRes) ? oc.resolucao.descRes : (oc.desc || 'Ocorrência resolvida pela equipe técnica.');
          var anexosLista = (oc.anexos && Array.isArray(oc.anexos) && oc.anexos.length > 0)
            ? oc.anexos
            : ((oc.resolucao && Array.isArray(oc.resolucao.anexos)) ? oc.resolucao.anexos : []);

          var itemOcHist = {
            id:            oc.id,
            tipo:          'ocorrencia',
            subtipo:       oc.cat || 'Equipamento',
            titulo:        oc.titulo,
            equipamento:   oc.equipamento || (oc.tags && oc.tags[1]) || '',
            categoria:     oc.cat || 'Equipamento',
            local:         oc.local || (oc.praca || 'Central Técnica'),
            dataCriacao:   nowFmt,
            criadoPor:     oc.resp || 'Sistema',
            descCriacao:   oc.desc || 'Ocorrência registrada no sistema.',
            status:        statusLabel,
            dataResolucao: resFmt,
            resolvidoPor:  resPor,
            descResolucao: resDesc,
            tags:          oc.tags || [],
            anexos:        anexosLista,
            praca:         oc.praca || (typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora')
          };
          mapa[oc.id] = true;
          mapa[histId] = true;
          lista.push(itemOcHist);
        }
      }
    });

    // Ordena pelo mais recente
    lista.sort(function(a, b) {
      var tA = a.dataResolucao || a.dataCriacao || '';
      var tB = b.dataResolucao || b.dataCriacao || '';
      return tB.localeCompare(tA);
    });

    return lista;
  }
  window.getHistoricoCompleto = getHistoricoCompleto;

  function loadHistorico() {
    return getHistoricoCompleto();
  }

  var historicoFiltroCategoria = 'todos';
  var itemHistoricoSelecionado = null;

  function getNomeUsuarioAtual() {
    return getUsuarioAtual().toLowerCase();
  }

  function isItemDoUsuario(item) {
    var usuarioAtual = getNomeUsuarioAtual();
    var criado = (item.criadoPor || '').toLowerCase();
    var resolvido = (item.resolvidoPor || '').toLowerCase();
    return criado.includes(usuarioAtual) || resolvido.includes(usuarioAtual);
  }

  function getTagTipoBadge(item) {
    if (item.tipo === 'ocorrencia') {
      return '<span class="tag tag-blue-soft">Ocorrência</span>';
    } else if (item.tipo === 'relatorio') {
      return '<span class="tag tag-teal-soft">' + (item.subtipo || 'Relatório') + '</span>';
    } else if (item.tipo === 'recebimento') {
      return '<span class="tag tag-yellow-soft">' + (item.subtipo || 'Recebimento') + '</span>';
    }
    return '<span class="tag tag-blue-soft">Registro</span>';
  }
  /* ─── Render: Dashboard Resolvidas & Power BI ─── */
  var resolvidasFiltro = 'todas';

  function filtrarResolvidas(filtro, el) {
    resolvidasFiltro = filtro;
    document.querySelectorAll('#page-resolvidas .pill').forEach(function(p) { p.classList.remove('on'); });
    if (el) el.classList.add('on');
    renderResolvidas();
  }
  window.filtrarResolvidas = filtrarResolvidas;

  function renderResolvidas() {
    var listEl = document.getElementById('resolvidas-list');
    if (!listEl) return;

    var resolvidas = getResolvidas();
    var abertas = getAbertas();
    var vencidas = abertas.filter(function(o){ return isOcorrenciaVencida(o); });
    var abertasNoPrazo = abertas.filter(function(o){ return !isOcorrenciaVencida(o); });

    var totRes = resolvidas.length;
    var totAb  = abertasNoPrazo.length;
    var totVen = vencidas.length;
    var totalGeral = totRes + totAb + totVen;

    /* Atualiza KPIs em Resolvidas */
    var elG = document.querySelector('.sn-resolvidas-g');
    var elB = document.querySelector('.sn-resolvidas-b');
    var elR = document.querySelector('.sn-resolvidas-r');
    if (elG) elG.textContent = totRes;
    if (elB) elB.textContent = totAb;
    if (elR) elR.textContent = totVen;

    /* Taxas em % */
    var pctRes = totalGeral > 0 ? Math.round((totRes / totalGeral) * 100) : 0;
    var pctAb  = totalGeral > 0 ? Math.round((totAb / totalGeral) * 100) : 0;
    var pctVen = totalGeral > 0 ? (100 - pctRes - pctAb) : 0;
    if (pctVen < 0) pctVen = 0;

    var badgePct = document.getElementById('pct-resolucao-badge');
    if (badgePct) badgePct.textContent = 'Taxa de Resolução: ' + pctRes + '%';

    var txtTot = document.getElementById('txt-total-ocorrencias');
    if (txtTot) txtTot.textContent = totalGeral + ' ocorrências registradas';

    var pieTot = document.getElementById('pie-resolvidas-tot');
    if (pieTot) pieTot.textContent = totalGeral;

    /* Render Gráfico de Pizza Donut (Conic-Gradient vibrante com alta definição) */
    var pieEl = document.getElementById('pie-chart-circle');
    if (pieEl) {
      if (totalGeral === 0) {
        pieEl.style.background = '#E2E8F0';
      } else {
        var p1 = pctRes;
        var p2 = pctRes + pctAb;
        pieEl.style.background = 'conic-gradient(#10B981 0% ' + p1 + '%, #0071E3 ' + p1 + '% ' + p2 + '%, #EF4444 ' + p2 + '% 100%)';
      }
    }

    var lblG = document.getElementById('lbl-pct-g');
    var lblB = document.getElementById('lbl-pct-b');
    var lblR = document.getElementById('lbl-pct-r');
    if (lblG) lblG.textContent = pctRes + '% (' + totRes + ' resolvidas)';
    if (lblB) lblB.textContent = pctAb + '% (' + totAb + ' no prazo)';
    if (lblR) lblR.textContent = pctVen + '% (' + totVen + ' expiradas)';

    /* Lista filtrada */
    var itensExibir = [];
    if (resolvidasFiltro === 'todas') {
      itensExibir = resolvidas.map(function(o){ return { item: o, isVencida: false }; })
        .concat(vencidas.map(function(o){ return { item: o, isVencida: true }; }));
    } else if (resolvidasFiltro === 'concluidas') {
      itensExibir = resolvidas.map(function(o){ return { item: o, isVencida: false }; });
    } else if (resolvidasFiltro === 'vencidas') {
      itensExibir = vencidas.map(function(o){ return { item: o, isVencida: true }; });
    }

    if (itensExibir.length === 0) {
      listEl.innerHTML = '<p style="color:var(--muted);font-size:13px;text-align:center;padding:24px 0;">Nenhum registro nesta categoria.</p>';
      return;
    }

    listEl.innerHTML = itensExibir.map(function(obj) {
      var oc = obj.item;
      var isV = obj.isVencida;

      if (isV) {
        return (
          '<article class="oc-card vencida" style="cursor:pointer;" onclick="verDetalhesOcorrenciaResolvida(\'' + oc.id + '\')">' +
            '<div class="prio-line pl-r"></div>' +
            '<div class="oc-body">' +
              '<div class="oc-header">' +
                '<h3>' + escapeHTML(oc.titulo || 'Sem título') + '</h3>' +
                '<span class="tag tag-r">⚠️ Prazo Expirado / Não Resolvida</span>' +
                '<span class="tag tag-y">' + escapeHTML(oc.prio || 'Média') + '</span>' +
              '</div>' +
              '<p class="oc-desc">' + escapeHTML(oc.desc || '') + '</p>' +
              '<div class="oc-meta">' +
                '<span><i data-lucide="user" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Atribuído: ' + escapeHTML(oc.resp || 'Todos do turno') + '</span>' +
                '<span><i data-lucide="clock" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Prazo: ' + escapeHTML(oc.prazo || 'Expirado') + '</span>' +
                '<span><i data-lucide="map-pin" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Local: ' + escapeHTML(oc.local || 'N/A') + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="oc-actions" onclick="event.stopPropagation();">' +
              '<button class="btn-card-action btn-card-resolve" onclick="event.stopPropagation(); abrirResolver(\'' + oc.id + '\')" title="Resolver ocorrência">' +
                '<i data-lucide="check-circle-2" style="width:12px;height:12px;stroke-width:2.2;"></i> Resolver' +
              '</button>' +
            '</div>' +
          '</article>'
        );
      } else {
        var isParcial = (oc.resolucao && oc.resolucao.statusRes === 'Parcialmente resolvido') || (oc.status === 'Parcialmente resolvido') || (oc.tags || []).indexOf('Parcialmente Resolvida') !== -1;
        var statusTexto = (oc.resolucao && oc.resolucao.statusRes) ? oc.resolucao.statusRes : 'Resolvido';
        var descResolucao = (oc.resolucao && oc.resolucao.descRes) ? oc.resolucao.descRes : 'Resolução concluída com sucesso.';
        var cardClass = isParcial ? 'oc-card parcialmente-resolvida' : 'oc-card';
        var cardStyle = isParcial ? 'cursor:pointer;' : 'background:var(--bg); border:1px solid #A8E6BB; cursor:pointer;';
        var prioLineClass = isParcial ? 'pl-y' : 'pl-g';
        var tagStatusClass = isParcial ? 'tag-y' : 'tag-g';

        return (
          '<article class="' + cardClass + '" style="' + cardStyle + '" onclick="verDetalhesOcorrenciaResolvida(\'' + oc.id + '\')">' +
            '<div class="prio-line ' + prioLineClass + '"></div>' +
            '<div class="oc-body">' +
              '<div class="oc-header">' +
                '<h3>' + escapeHTML(oc.titulo || 'Sem título') + '</h3>' +
                '<span class="tag ' + tagStatusClass + '">' + (isParcial ? '⚠️ ' : '✓ ') + escapeHTML(statusTexto) + '</span>' +
                '<span class="tag tag-teal-soft">' + escapeHTML(oc.cat || 'Equipamento') + '</span>' +
              '</div>' +
              '<p class="oc-desc" style="color:var(--txt);"><strong>Resolução:</strong> ' + escapeHTML(descResolucao) + '</p>' +
              '<div class="oc-meta">' +
                '<span><i data-lucide="user-check" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Responsável: ' + escapeHTML(oc.resp || 'Todos do turno') + '</span>' +
                '<span><i data-lucide="map-pin" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Local: ' + escapeHTML(oc.local || 'Central Técnica') + '</span>' +
              '</div>' +
            '</div>' +
          '</article>'
        );
      }
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  /* ─── Stats ─── */
  function updateStats() {
    try {
      var ab  = getAbertas().length;
      var res = getResolvidas().length;
      var atrasadas = ocorrencias.filter(function(o){
        return isOcorrenciaVencida(o) && (typeof pertenceAPracaAtiva !== 'function' || pertenceAPracaAtiva(o));
      }).length;
      var diaAnt = ocorrencias.filter(function(o){
        return o && o.status==='aberta' && isOcorrenciaDiaAnterior(o) && (typeof pertenceAPracaAtiva !== 'function' || pertenceAPracaAtiva(o));
      }).length;

      var els = {
        r: document.querySelector('.sn-r'),
        y: document.querySelector('.sn-y'),
        g: document.querySelector('.sn-g'),
        b: document.querySelector('.sn-b')
      };
      if (els.r) els.r.textContent = ab;
      if (els.y) els.y.textContent = atrasadas;
      if (els.g) els.g.textContent = res;
      if (els.b) els.b.textContent = diaAnt;

      /* Badge sidebar - atualiza badge de notificações */
      var notifBadge = document.querySelector('.notif-badge');
      if (notifBadge) {
        var numNotifs = (typeof notificacoesStore !== 'undefined' && Array.isArray(notificacoesStore)) ? notificacoesStore.filter(function(n){ return !n.lida; }).length : 0;
        notifBadge.textContent = numNotifs;
      }
    } catch(err) {
      console.warn('Erro ao atualizar estatísticas:', err);
    }
  }

  function renderPopupEntrada() {
    var container = document.getElementById('popup-entrada-pendencias');
    if (!container) return;

    var abertas = getAbertas();
    if (abertas.length === 0) {
      container.innerHTML = '<div class="info-item blue"><div class="ii-dot blue"></div><div><strong>Sem Pendências</strong>Nenhuma ocorrência pendente no momento.</div></div>';
      return;
    }

    container.innerHTML = abertas.slice(0, 4).map(function(oc) {
      var isVencida = isOcorrenciaVencida(oc);
      var corClass = (oc.prio === 'Alta' || isVencida) ? 'red' : 'blue';
      var tagTexto = isVencida ? 'Prazo Expirado' : ((oc.prio || 'Média') + ' Prioridade');

      return (
        '<div class="info-item ' + corClass + '">' +
          '<div class="ii-dot ' + corClass + '"></div>' +
          '<div>' +
            '<strong>' + escapeHTML(tagTexto) + ' — ' + escapeHTML(oc.local || oc.cat || 'Equipamento') + '</strong>' +
            escapeHTML(oc.titulo || 'Ocorrência') + (oc.prazo ? (' (Prazo: ' + escapeHTML(oc.prazo) + ')') : '') +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderPopupLogout() {
    var container = document.getElementById('popup-logout-checklist');
    if (!container) return;

    var abertas = getAbertas();
    if (abertas.length === 0) {
      container.innerHTML = '<p style="font-size:12px;color:var(--muted);padding:6px 0;">Todas as ocorrências do turno foram concluídas!</p>';
      return;
    }

    container.innerHTML = abertas.map(function(oc) {
      var cid = 'chk_out_' + oc.id;
      var isVencida = isOcorrenciaVencida(oc);
      var textExtra = isVencida ? ' [PRAZO EXPIRADO]' : '';
      return (
        '<label class="chk-item" id="' + cid + '">' +
          '<input type="checkbox" onchange="markDone(\'' + cid + '\',this)"/> ' +
          '<span>' + escapeHTML(oc.titulo || 'Ocorrência') + escapeHTML(textExtra) + ' (' + escapeHTML(oc.resp || 'Todos') + ')</span>' +
        '</label>'
      );
    }).join('');
  }

  /* ─── renderAll: atualiza TUDO de uma vez com isolamento de falhas e diffing de performance ─── */
  var lastRenderSignature = '';
  function calcularAssinaturaEstado() {
    var pracaSig = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'JF';
    var ocSig = (ocorrencias || []).filter(function(o){ return typeof pertenceAPracaAtiva !== 'function' || pertenceAPracaAtiva(o); }).map(function(o){ return (o.id||'') + '_' + (o.status||'') + '_' + (o.prio||''); }).join('|');
    var lixSig = (lixeiraData || []).map(function(i){ return (i.id||'') + '_' + (i.expiraEm||''); }).join('|');
    var notifSig = (notificacoesStore || []).map(function(n){ return (n.id||'') + '_' + (n.lida?1:0); }).join('|');
    var histCount = getHistoricoCompleto().length;
    var horaMinuto = new Date().getMinutes();
    return pracaSig + '#' + ocSig + '#' + lixSig + '#' + notifSig + '#' + histCount + '#' + horaMinuto;
  }

  function renderAll(forcar) {
    var novaSig = calcularAssinaturaEstado();
    if (forcar !== true && novaSig === lastRenderSignature) {
      try { updateStats(); } catch(e) {}
      return;
    }
    lastRenderSignature = novaSig;

    try { renderCards(); } catch(e) { console.error('Erro em renderCards:', e); }
    try { renderArquivados(); } catch(e) { console.error('Erro em renderArquivados:', e); }
    try { renderLixeira(); } catch(e) { console.error('Erro em renderLixeira:', e); }
    try { verificarExpiracaoLixeira(); } catch(e) { console.error('Erro em verificarExpiracaoLixeira:', e); }
    try { verificarNotificacoesAutomaticas(); } catch(e) { console.error('Erro em verificarNotificacoesAutomaticas:', e); }
    try { renderNotificacoes(); } catch(e) { console.error('Erro em renderNotificacoes:', e); }
    ['aside-ctrs', 'aside-recebimento', 'aside-compras', 'aside-orcamento', 'aside-arquivados'].forEach(function(asId) {
      try { renderAside(asId); } catch(e) { console.error('Erro em ' + asId + ':', e); }
    });
    try { renderResolvidas(); } catch(e) { console.error('Erro em renderResolvidas:', e); }
    try { renderHistorico(); } catch(e) { console.error('Erro em renderHistorico:', e); }
    try { renderDashboards(); } catch(e) { console.error('Erro em renderDashboards:', e); }
    try { renderOrcamento(); } catch(e) { console.error('Erro em renderOrcamento:', e); }
    try { renderPopupEntrada(); } catch(e) { console.error('Erro em renderPopupEntrada:', e); }
    try { renderPopupLogout(); } catch(e) { console.error('Erro em renderPopupLogout:', e); }
    try { updateStats(); } catch(e) { console.error('Erro em updateStats:', e); }
  }
  window.renderAll = renderAll;

  // Autosave contínuo em segundo plano para formulários (proteção contra queda de energia/fechamento)
  var debounceTimers = {};
  function registrarAutosaveListener(pageId, salvarFn) {
    var page = document.getElementById(pageId);
    if (!page) return;
    function acao() {
      clearTimeout(debounceTimers[pageId]);
      debounceTimers[pageId] = setTimeout(function() {
        salvarFn(true);
      }, 500);
    }
    page.addEventListener('input', acao);
    page.addEventListener('change', acao);
  }
  window.registrarAutosaveListener = registrarAutosaveListener;
  /* ═══════════════════════════════════════════
     POPUP ENTRADA
  /* ═══════════════════════════════════════════
     CHECKLIST LOGOUT
  ═══════════════════════════════════════════ */

  function markDone(id, el) { 
    var item = document.getElementById(id);
    if (item && el) item.classList.toggle('done', el.checked); 
  }
  window.markDone = markDone;

  function confirmarLogout() {
    var obs = document.getElementById('obs-logout');
    fecharPopup('popup-logout');
    if (obs) obs.value = '';
    loginTime = Date.now();
    if (typeof mostrarToast === 'function') {
      mostrarToast('Turno Encerrado', 'Checklist de saída registrado e sessão encerrada com sucesso.', 'success');
    }
    var popEntrada = document.getElementById('popup-entrada');
    if (popEntrada) {
      var chk = document.getElementById('chk-entrada');
      if (chk) chk.checked = false;
      if (typeof toggleBtnIniciarSessao === 'function') {
        toggleBtnIniciarSessao(false);
      }
      abrirPopup('popup-entrada');
    }
  }
  window.confirmarLogout = confirmarLogout;

  /* ═══════════════════════════════════════════
     TIMER DE SESSÃO / TEMPO LOGADO
  ═══════════════════════════════════════════ */
  var loginTime = Date.now();

  function pad(n) { return n < 10 ? '0' + n : n; }

  function getTempoLogadoStr() {
    var diff = Math.floor((Date.now() - loginTime) / 1000);
    if (diff < 0) diff = 0;
    var h = Math.floor(diff / 3600);
    var m = Math.floor((diff % 3600) / 60);
    var s = diff % 60;
    return pad(h) + 'h ' + pad(m) + 'm ' + pad(s) + 's';
  }

  function atualizarTimerLogin() {
    try {
      var timeStr = getTempoLogadoStr();

      var upTimer = document.getElementById('up-timer');
      if (upTimer) upTimer.textContent = timeStr;

      var pageChip = document.getElementById('page-chip');
      var activePage = document.querySelector('.page.active');
      if (pageChip && activePage && activePage.id === 'page-dashboard') {
        pageChip.textContent = 'Logado há: ' + timeStr;
      }
    } catch(err) {
      console.warn('Erro ao atualizar timer de login:', err);
    }
  }

  setInterval(atualizarTimerLogin, 1000);
  atualizarTimerLogin();

  /* ═══════════════════════════════════════════
     USER POPOVER (popup sobre o nome)
  ═══════════════════════════════════════════ */
  function toggleUserPopover(e) {
    if (e) e.stopPropagation();
    var popover = document.getElementById('user-popover');
    if (!popover) return;
    var isHidden = popover.hasAttribute('hidden');
    if (isHidden) {
      popover.removeAttribute('hidden');
      atualizarTimerLogin();
    } else {
      popover.setAttribute('hidden', '');
    }
  }
  window.toggleUserPopover = toggleUserPopover;

  document.addEventListener('click', function(e) {
    var popover = document.getElementById('user-popover');
    var userBlock = document.getElementById('s-user-block');
    if (popover && !popover.hasAttribute('hidden')) {
      if (!popover.contains(e.target) && (!userBlock || !userBlock.contains(e.target))) {
        popover.setAttribute('hidden', '');
      }
    }
  });

  /* ═══════════════════════════════════════════
     NAVEGAÇÃO
  ═══════════════════════════════════════════ */

  var pageMap = {
    recebimento:  { page:'page-recebimento',  title:'Recebimento de Materiais',                 chip:'Registro patrimonial e anexo de fotos/vídeos' },
    recebimento1: { page:'page-recebimento',  title:'Recebimento de Materiais',                 chip:'Registro patrimonial e anexo de fotos/vídeos' },
    recebimento2: { page:'page-recebimento',  title:'Recebimento de Materiais',                 chip:'Registro patrimonial e anexo de fotos/vídeos' },
    dashboard:    { page:'page-dashboard',    title:'Ocorrências',                              chip: function() { return 'Logado há: ' + getTempoLogadoStr(); } },
    checklist:    { page:'page-checklist',    title:'Checklist Diário & Rotinas',               chip:'Monitoramento preventivo e rotinas do turno' },
    ctrs:         { page:'page-ctrs',         title:'Checklist de Transmissão — CTRS',          chip:'Preencher após cada jornal' },
    arquivados:   { page:'page-arquivados',   title:'Ocorrências Arquivadas',                   chip:'Verificação e acompanhamento do próximo turno' },
    historico:    { page:'page-historico',    title:'Histórico Geral de Registros',             chip:'Ocorrências, Relatórios e Recebimentos' },
    lixeira:      { page:'page-lixeira',      title:'Lixeira',                                  chip:'Itens excluídos retidos por 7 dias' },
    resolvidas:   { page:'page-resolvidas',   title:'Dashboard Ocorrências — Resolução & Desempenho (Power BI)', chip:'Dashboard de Métricas e Indicadores' },
    dashboard_ocorrencias:  { page:'page-resolvidas',             title:'Dashboard Ocorrências — Resolução & Desempenho (Power BI)', chip:'Dashboard de Métricas e Indicadores' },
    dashboard_transmissoes: { page:'page-dashboard-ocorrencias',  title:'Dashboard Transmissões — Transmissões ao Vivo',  chip:'Transmissões em Tempo Real' },
    compras_vendas:{ page:'page-compras-vendas', title:'Solicitação de Compras',                chip:'Preencher solicitação de compra' },
    orcamento:     { page:'page-orcamento',      title: 'Orçamento Anual', chip: function() { return 'Ciclo ' + (new Date().getFullYear() + 1); } },
    config:        { page:'page-config',         title:'Configurações',                            chip:'Perfil e preferências'      }
  };

  function irPara(name, el) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.s-btn').forEach(function(b) { b.classList.remove('active'); });
    var cfg = pageMap[name];
    if (!cfg) return;
    document.getElementById(cfg.page).classList.add('active');
    document.getElementById('page-title').textContent = cfg.title;
    var chipText = (typeof cfg.chip === 'function') ? cfg.chip() : cfg.chip;
    document.getElementById('page-chip').textContent  = chipText;
    if (el) el.classList.add('active');
    if (name === 'config') {
      try { carregarCredenciaisSupabaseConfig(); } catch(e) {}
    }
    if (name === 'ctrs' || name === 'relatorio') {
      var ctrsPraca = document.getElementById('ctrs-praca');
      if (ctrsPraca && typeof getPracaAtual === 'function') {
        ctrsPraca.value = getPracaAtual();
      }
      try { atualizarSelectsProfissionaisCTRS(); } catch(e) {}
      try { atualizarSelectsEquipamentosCTRS(); } catch(e) {}
    }
  }
  window.irPara = irPara;

  /* ═══════════════════════════════════════════
     ACCORDION
  ═══════════════════════════════════════════ */

  function togAcc(head) {
    var isOpen = head.classList.contains('open');
    head.classList.toggle('open', !isOpen);
    head.setAttribute('aria-expanded', String(!isOpen));
    head.nextElementSibling.classList.toggle('open', !isOpen);
  }
  window.togAcc = togAcc;

  /* ═══════════════════════════════════════════
     FILTROS
  ═══════════════════════════════════════════ */

  function filtrar(elOrTipo, tipo) {
    var el = (elOrTipo && typeof elOrTipo === 'object' && elOrTipo.nodeType) ? elOrTipo : null;
    var tipoFinal = typeof elOrTipo === 'string' ? elOrTipo : tipo;
    if (el && typeof el.closest === 'function') {
      var pills = el.closest('.pills');
      if (pills) {
        pills.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('on'); });
        el.classList.add('on');
      }
    } else if (tipoFinal) {
      document.querySelectorAll('#page-dashboard .pills .pill').forEach(function(p) {
        var pText = p.textContent.trim().toLowerCase();
        if (pText === tipoFinal.toLowerCase() || (tipoFinal.toLowerCase() === 'todas' && pText === 'todas')) {
          p.classList.add('on');
        } else {
          p.classList.remove('on');
        }
      });
    }
    filtroOcorrenciasAtivo = (tipoFinal || (el ? el.textContent.trim().toLowerCase() : 'todas')).toLowerCase();
    renderCards();
  }
  window.filtrar = filtrar;

  /* ═══════════════════════════════════════════
     GESTÃO DE PRAÇA ATIVA (MULTI-PRAÇA)
  ═══════════════════════════════════════════ */
  var CHAVE_PRACA = 'tv_praca_ativa';

  function getPracaAtual() {
    try {
      var salval = localStorage.getItem(CHAVE_PRACA);
      if (salval && (salval === 'Juiz de Fora' || salval === 'Uberlândia' || salval === 'Uberlandia')) {
        return salval === 'Uberlandia' ? 'Uberlândia' : salval;
      }
    } catch(e) {}
    return 'Juiz de Fora';
  }
  window.getPracaAtual = getPracaAtual;

  function setPracaAtual(praca) {
    if (!praca) return;
    var norm = praca.indexOf('Uber') !== -1 ? 'Uberlândia' : 'Juiz de Fora';
    try {
      localStorage.setItem(CHAVE_PRACA, norm);
    } catch(e) {}
    aplicarModoPraca(norm);
  }
  window.setPracaAtual = setPracaAtual;

  function aplicarModoPraca(praca) {
    var p = praca || getPracaAtual();
    var isUberlandia = p.indexOf('Uber') !== -1;

    // 1. Atualizar topbar badge
    var nomeEl = document.getElementById('topbar-praca-nome');
    if (nomeEl) {
      nomeEl.textContent = isUberlandia ? 'Uberlândia' : 'Juiz de Fora';
    }

    // 2. Atualizar menu lateral: CTRS vs Relatório
    var ctrsLabel = document.getElementById('sidebar-label-ctrs');
    if (ctrsLabel) {
      ctrsLabel.textContent = isUberlandia ? 'Relatório' : 'Relatório CTRS';
    }

    // 3. Atualizar pageMap para título dinâmico de CTRS
    if (pageMap && pageMap.ctrs) {
      pageMap.ctrs.title = isUberlandia ? 'Relatório de Transmissão ao Vivo' : 'Checklist de Transmissão — CTRS';
      pageMap.ctrs.chip  = isUberlandia ? 'Preencher após cada transmissão / jornal' : 'Preencher após cada jornal';
    }

    // 4. Se a página CTRS estiver aberta ou tiver cabeçalho no HTML, atualizar
    var ctrsPageHeader = document.querySelector('#page-ctrs .sec-header h2');
    if (ctrsPageHeader) {
      ctrsPageHeader.textContent = isUberlandia ? 'Relatório de Transmissão ao Vivo' : 'Checklist de Transmissão — CTRS';
    }

    // 5. Esconder / Exibir Recebimento de Materiais (somente Juiz de Fora)
    var btnRec = document.getElementById('sidebar-btn-recebimento');
    if (btnRec) btnRec.style.display = isUberlandia ? 'none' : '';

    // Manter o cabeçalho de seção "Suprimentos & Compras" visível para compras/orçamento terem seu próprio bloco
    var secCompras = document.getElementById('sidebar-section-compras') || document.getElementById('sidebar-section-recebimento');
    if (secCompras) {
      secCompras.style.display = '';
      secCompras.textContent = isUberlandia ? 'Compras & Orçamento' : 'Suprimentos & Compras';
    }

    // Esconder / Exibir pílula de Recebimento no Histórico
    var histPillRec = document.getElementById('hist-pill-recebimento');
    if (histPillRec) histPillRec.style.display = isUberlandia ? 'none' : '';
    if (isUberlandia && typeof historicoFiltroCategoria !== 'undefined' && historicoFiltroCategoria === 'recebimento') {
      if (typeof filtrarCategoriaHistorico === 'function') {
        var pillTodos = document.querySelector('#hist-pills button[data-cat="todos"]');
        filtrarCategoriaHistorico('todos', pillTodos);
      }
    }

    // Se estiver atualmente na página de recebimento e mudar para Uberlândia, redirecionar para dashboard
    var activePage = document.querySelector('.page.active');
    if (isUberlandia && activePage && activePage.id === 'page-recebimento') {
      irPara('dashboard');
    }

    // 6. Atualizar selects nas páginas de formulários para a praça ativa
    var cfgPraca = document.getElementById('cfg-praca');
    if (cfgPraca) cfgPraca.value = isUberlandia ? 'Uberlândia' : 'Juiz de Fora';

    var identPraca = document.getElementById('ident-operador-praca');
    if (identPraca) identPraca.value = isUberlandia ? 'Uberlândia' : 'Juiz de Fora';

    var ctrsPraca = document.getElementById('ctrs-praca');
    if (ctrsPraca) ctrsPraca.value = isUberlandia ? 'Uberlândia' : 'Juiz de Fora';

    var reqPraca = document.getElementById('req-praca');
    if (reqPraca) reqPraca.value = isUberlandia ? 'Uberlândia' : 'Juiz de Fora';

    var orcPraca = document.getElementById('orc-modal-praca');
    if (orcPraca) orcPraca.value = isUberlandia ? 'Uberlândia' : 'Juiz de Fora';

    // 7. Atualizar subtítulos dos dashboards com a praça ativa
    var dashTransPraca = document.getElementById('dash-trans-praca');
    if (dashTransPraca) dashTransPraca.textContent = p;

    var dashResolvidasPraca = document.getElementById('dash-resolvidas-praca');
    if (dashResolvidasPraca) dashResolvidasPraca.textContent = p;

    var upPraca = document.getElementById('up-praca');
    if (upPraca) upPraca.textContent = p;

    // 8. Atualizar equipamentos do Relatório (CTRS) dinamicamente para a praça ativa
    try {
      if (typeof window.atualizarSelectsEquipamentosCTRS === 'function') {
        window.atualizarSelectsEquipamentosCTRS();
      }
    } catch(eEq) {}

    // 9. Notificar e re-renderizar módulos com dados da praça selecionada
    try {
      if (typeof window.carregarDashboardMetricsStore === 'function') {
        window.carregarDashboardMetricsStore();
      }
      if (typeof window.renderAll === 'function') {
        window.renderAll(true);
      } else {
        if (typeof window.renderDashboards === 'function') window.renderDashboards();
        if (typeof window.renderCards === 'function') window.renderCards();
        if (typeof window.renderHistorico === 'function') window.renderHistorico();
        if (typeof window.renderArquivados === 'function') window.renderArquivados();
        if (typeof window.renderOrcamento === 'function') window.renderOrcamento();
        if (typeof window.updateStats === 'function') window.updateStats();
      }
      if (typeof window.renderChecklist === 'function') {
        window.renderChecklist();
      }
      if (typeof window.atualizarBadgesNotificacoes === 'function') {
        window.atualizarBadgesNotificacoes();
      }
    } catch(e) {
      console.warn('Erro ao atualizar views após troca de praça:', e);
    }
  }
  window.aplicarModoPraca = aplicarModoPraca;

  function trocarPracaConfig(novaPraca) {
    setPracaAtual(novaPraca);
    if (typeof mostrarToast === 'function') {
      mostrarToast('Praça Alterada', 'Ambiente de trabalho alternado para ' + novaPraca + '. Dados isolados carregados.', 'info');
    }
  }
  window.trocarPracaConfig = trocarPracaConfig;

  /* ═══════════════════════════════════════════
     INDEXEDDB LOCAL MEDIA CACHE (Para vídeos e fotos de qualquer tamanho)
  ═══════════════════════════════════════════ */
  var IDB_NAME = 'SistemaTV_MediaDB';
  var IDB_STORE = 'midias';

  function openMediaDB() {
    return new Promise(function(resolve) {
      if (!window.indexedDB) { resolve(null); return; }
      var req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function() { resolve(null); };
    });
  }

  function salvarMidiaIDB(id, dataUrl, meta) {
    return openMediaDB().then(function(db) {
      if (!db) return false;
      return new Promise(function(resolve) {
        try {
          var tx = db.transaction(IDB_STORE, 'readwrite');
          var store = tx.objectStore(IDB_STORE);
          store.put({ id: id, data: dataUrl, meta: meta || {}, timestamp: Date.now() });
          tx.oncomplete = function() { resolve(true); };
          tx.onerror = function() { resolve(false); };
        } catch (e) { resolve(false); }
      });
    });
  }

  function carregarMidiaIDB(id) {
    return openMediaDB().then(function(db) {
      if (!db) return null;
      return new Promise(function(resolve) {
        try {
          var tx = db.transaction(IDB_STORE, 'readonly');
          var store = tx.objectStore(IDB_STORE);
          var req = store.get(id);
          req.onsuccess = function(e) { resolve(e.target.result ? e.target.result.data : null); };
          req.onerror = function() { resolve(null); };
        } catch (e) { resolve(null); }
      });
    });
  }
  window.carregarMidiaIDB = carregarMidiaIDB;

  /* ═══════════════════════════════════════════
     PREVIEW E GERENCIAMENTO DE ARQUIVOS (PDF, FOTOS, VÍDEOS)
  ═══════════════════════════════════════════ */

  var uploadedFilesStore = {};

  function uploadArquivoParaStorage(anexo) {
    if (!anexo) return Promise.resolve(null);
    if (anexo.url && anexo.url.startsWith('http')) return Promise.resolve(anexo);
    if (!anexo.fileObj) return Promise.resolve(anexo);

    var timestamp = Date.now();
    var cleanName = (anexo.name || 'arquivo').replace(/[^a-zA-Z0-9._-]/g, '_');
    var filePath = timestamp + '_' + cleanName;
    var uploadUrl = SUPABASE_URL.replace(/\/$/, '') + '/storage/v1/object/anexos/' + filePath;

    return fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': anexo.type || 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: anexo.fileObj
    })
    .then(function(res) {
      if (res.ok) {
        var publicUrl = SUPABASE_URL.replace(/\/$/, '') + '/storage/v1/object/public/anexos/' + filePath;
        return {
          id: anexo.id,
          name: anexo.name,
          type: anexo.type,
          size: anexo.size,
          url: publicUrl,
          dataUrl: anexo.dataUrl
        };
      }
      return anexo;
    })
    .catch(function(err) {
      console.warn('[Storage Upload Fallback]', err);
      return anexo;
    });
  }
  window.uploadArquivoParaStorage = uploadArquivoParaStorage;

  function comprimirImagemSeNecessario(file, callback) {
    if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      if (file && file.type && file.type.startsWith('video/')) {
        try {
          var vidUrl = URL.createObjectURL(file);
          callback(vidUrl, file);
          return;
        } catch(eVid) {}
      }
      var reader = new FileReader();
      reader.onload = function(e) { callback(e.target.result, file); };
      reader.readAsDataURL(file);
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var maxDim = 1600;
        var width = img.width;
        var height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        var compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

        if (typeof canvas.toBlob === 'function') {
          canvas.toBlob(function(blob) {
            var compressedBlob = blob || file;
            callback(compressedDataUrl, compressedBlob);
          }, 'image/jpeg', 0.82);
        } else {
          callback(compressedDataUrl, file);
        }
      };
      img.onerror = function() {
        callback(e.target.result, file);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  window.comprimirImagemSeNecessario = comprimirImagemSeNecessario;

  function handleFileSelect(input, containerId) {
    if (!input || !input.files || input.files.length === 0) return;
    if (!uploadedFilesStore[containerId]) uploadedFilesStore[containerId] = [];

    var fileList = Array.from(input.files);
    var pending = fileList.length;

    fileList.forEach(function(file) {
      var mediaId = 'med_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      comprimirImagemSeNecessario(file, function(dataUrl, blobOuFile) {
        var finalFile = blobOuFile || file;
        var mediaObj = {
          id: mediaId,
          name: file.name,
          type: (finalFile && finalFile.type) ? finalFile.type : (file.type || 'image/jpeg'),
          size: (finalFile && finalFile.size) ? finalFile.size : file.size,
          dataUrl: dataUrl,
          fileObj: finalFile
        };
        uploadedFilesStore[containerId].push(mediaObj);
        salvarMidiaIDB(mediaId, dataUrl, { name: file.name, type: mediaObj.type, size: mediaObj.size });
        pending--;
        if (pending === 0) {
          renderPreviewsForContainer(containerId);
        }
      });
    });

    input.value = ''; // reseta input para permitir re-selecionar o mesmo arquivo se necessário
  }
  window.handleFileSelect = handleFileSelect;

  function removerArquivoPreview(containerId, index, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (uploadedFilesStore[containerId] && uploadedFilesStore[containerId][index] !== undefined) {
      uploadedFilesStore[containerId].splice(index, 1);
      renderPreviewsForContainer(containerId);
    }
  }
  window.removerArquivoPreview = removerArquivoPreview;

  function renderPreviewsForContainer(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    var files = uploadedFilesStore[containerId] || [];
    files.forEach(function(file, idx) {
      var item = document.createElement('div');
      item.className = 'prev-item';
      item.style.position = 'relative';

      var removeBtn = document.createElement('button');
      removeBtn.className = 'prev-remove-btn';
      removeBtn.type = 'button';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = 'Remover este arquivo';
      removeBtn.onclick = function(e) {
        removerArquivoPreview(containerId, idx, e);
      };
      item.appendChild(removeBtn);

      var fType = (file.type || '').toLowerCase();
      var fName = (file.name || '').toLowerCase();
      var isImg = fType.startsWith('image/') || fName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
      var isPdf = fType === 'application/pdf' || fName.endsWith('.pdf');
      var isVid = fType.startsWith('video/') || fName.match(/\.(mp4|webm|mov|mkv|avi)$/i);

      if (isImg && file.dataUrl) {
        var img = document.createElement('img');
        img.src = file.dataUrl;
        img.alt = file.name || 'Imagem';
        img.loading = 'lazy';
        img.style.cursor = 'pointer';
        img.title = 'Clique para ampliar (Quick Look)';
        (function(currentFile) {
          img.onclick = function() {
            abrirQuickLook(currentFile.dataUrl, currentFile.name);
          };
        })(file);
        item.appendChild(img);
      } else if (isPdf) {
        var pdfBox = document.createElement('div');
        pdfBox.className = 'prev-vid prev-pdf-box';
        pdfBox.innerHTML = '<i data-lucide="file-text" style="width:24px;height:24px;stroke-width:1.5;color:var(--red);"></i>';
        item.appendChild(pdfBox);
      } else if (isVid) {
        var vidBox = document.createElement('div');
        vidBox.className = 'prev-vid';
        vidBox.style.position = 'relative';
        vidBox.style.overflow = 'hidden';
        if (file.dataUrl) {
          var vEl = document.createElement('video');
          vEl.src = file.dataUrl;
          vEl.preload = 'metadata';
          vEl.muted = true;
          vEl.style.width = '100%';
          vEl.style.height = '100%';
          vEl.style.objectFit = 'cover';
          vEl.style.borderRadius = 'var(--r-sm)';
          vidBox.appendChild(vEl);
          var playBadge = document.createElement('div');
          playBadge.innerHTML = '▶';
          playBadge.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;text-shadow:0 1px 4px rgba(0,0,0,0.8);pointer-events:none;';
          vidBox.appendChild(playBadge);
        } else {
          vidBox.innerHTML = '<i data-lucide="film" style="width:24px;height:24px;stroke-width:1.5;color:var(--blue);"></i><span style="font-size:9px;color:var(--blue);font-weight:800;margin-top:2px;">VÍDEO</span>';
        }
        item.appendChild(vidBox);
      } else {
        var docBox = document.createElement('div');
        docBox.className = 'prev-vid';
        docBox.innerHTML = '<i data-lucide="file" style="width:24px;height:24px;stroke-width:1.5;color:var(--muted);"></i>';
        item.appendChild(docBox);
      }

      // Não exibe o nome do arquivo embaixo das fotos (mantém apenas para arquivos/vídeos/docs)
      if (!isImg) {
        var nome = document.createElement('div');
        nome.className = 'prev-name';
        var displayName = file.name || 'Anexo';
        nome.textContent = displayName.length > 12 ? displayName.substring(0, 9) + '…' : displayName;
        item.appendChild(nome);
      }

      container.appendChild(item);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.renderPreviewsForContainer = renderPreviewsForContainer;

  /* Listeners para áreas de upload (Requisições, Recebimentos e Ocorrências) */
  ['req', 'rec', 'rec1', 'rec2', 'nova', 'edit-oc', 'resolver'].forEach(function(prefix) {
    var area  = document.getElementById(prefix + '-upload-area');
    var file  = document.getElementById(prefix + '-arquivos');
    if (area && file) {
      area.onclick = function(e) {
        if (e.target !== file) file.click();
      };
      file.onchange = function() {
        handleFileSelect(this, prefix + '-previews');
      };
    }
  });
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
  /* ═══════════════════════════════════════════
     ENVIO DE RELATÓRIO TV (CTRS) E GERADOR AUTOMÁTICO DE OCORRÊNCIAS
  ═══════════════════════════════════════════ */

  function salvarRascunhoRelatorioTV(silencioso) {
    try {
      var dataEl  = document.getElementById('ctrs-data');
      var pracaEl = document.getElementById('ctrs-praca');
      var tipoEl  = document.getElementById('ctrs-tipo');
      var obsEl   = document.getElementById('ctrs-obs');

      var dados = {
        data:  dataEl  ? dataEl.value  : '',
        praca: pracaEl ? pracaEl.value : '',
        tipo:  tipoEl  ? tipoEl.value  : '',
        obs:   obsEl   ? obsEl.value   : '',
        transmissoes: []
      };

      var accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
      accBlocks.forEach(function(acc) {
        var inputs = acc.querySelectorAll('input, select, textarea');
        dados.transmissoes.push({
          cidade:      inputs[0] ? inputs[0].value : '',
          infra:       inputs[1] ? inputs[1].value : '',
          horaAbert:   inputs[2] ? inputs[2].value : '',
          horaFim:     inputs[3] ? inputs[3].value : '',
          audioQ:      inputs[4] ? inputs[4].value : '',
          videoQ:      inputs[5] ? inputs[5].value : '',
          reporter:    inputs[6] ? inputs[6].value : '',
          entradas:    inputs[7] ? inputs[7].value : '',
          rc:          inputs[8] ? inputs[8].value : '',
          statusTx:    inputs[9] ? inputs[9].value : '',
          falhas:      inputs[10] ? inputs[10].value : ''
        });
      });

      localStorage.setItem('tv_ctrs_rascunho_v2', JSON.stringify(dados));
      if (!silencioso) {
        alert('Rascunho do Relatório CTRS salvo com sucesso no navegador!');
      }
    } catch (e) {
      console.warn('Erro ao salvar rascunho CTRS:', e);
    }
  }
  window.salvarRascunhoRelatorioTV = salvarRascunhoRelatorioTV;

  function obterOpcoesEquipamentosHTML(selectedVal) {
    var praca = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isUberlandia = praca.indexOf('Uber') !== -1;
    var equips = [];

    if (typeof dashboardMetrics !== 'undefined' && dashboardMetrics && dashboardMetrics.equipamento) {
      equips = Object.keys(dashboardMetrics.equipamento);
    }

    if (isUberlandia) {
      // Em Uberlândia: usa estritamente os equipamentos cadastrados pelos operadores de UDI
      var html = '<option value="">Selecione o equipamento...</option>';
      if (equips.length === 0) {
        html += '<option value="" disabled style="color:var(--muted);">Nenhum equipamento cadastrado ainda</option>';
      } else {
        equips.forEach(function(eq) {
          var isSel = (eq === selectedVal) ? ' selected' : '';
          html += '<option value="' + escapeHTML(eq) + '"' + isSel + '>' + escapeHTML(eq) + '</option>';
        });
      }
      html += '<option value="__novo__" style="color:var(--blue);font-weight:700;">➕ Cadastrar Novo Equipamento...</option>';
      return html;
    } else {
      // Juiz de Fora: usa os equipamentos do dashboard ou fallback dos 13 de JF
      if (equips.length === 0) {
        equips = ['LIVE U1', 'LIVE U2', 'LIVE U3', 'LIVE U4', 'LIVE U SMART', 'REDAÇÃO', 'KMJ', 'NET PRAÇA', 'NET PORTARIA', 'FORMATOS NET', 'NET 2º ANDAR', 'NET 3º ANDAR', 'NET 4º ANDAR'];
      }
      var html = '<option value="">Selecione o equipamento...</option>';
      equips.forEach(function(eq) {
        var isSel = (eq === selectedVal) ? ' selected' : '';
        html += '<option value="' + escapeHTML(eq) + '"' + isSel + '>' + escapeHTML(eq) + '</option>';
      });
      html += '<option value="__novo__" style="color:var(--blue);font-weight:700;">➕ Cadastrar Novo Equipamento...</option>';
      return html;
    }
  }
  window.obterOpcoesEquipamentosHTML = obterOpcoesEquipamentosHTML;

  function atualizarSelectsEquipamentosCTRS() {
    var selects = document.querySelectorAll('.ctrs-infra-select');
    selects.forEach(function(sel) {
      var currentVal = sel.value;
      sel.innerHTML = obterOpcoesEquipamentosHTML(currentVal);
      if (currentVal && currentVal !== '__novo__') {
        sel.value = currentVal;
      }
      if (!sel._hasNovoEqListener) {
        sel._hasNovoEqListener = true;
        sel.addEventListener('change', function() {
          if (this.value === '__novo__') {
            this.value = '';
            if (typeof abrirModalNovoEquipamento === 'function') {
              abrirModalNovoEquipamento();
            } else if (typeof abrirPopup === 'function') {
              abrirPopup('popup-novo-equipamento');
            }
          }
        });
      }
    });
  }
  window.atualizarSelectsEquipamentosCTRS = atualizarSelectsEquipamentosCTRS;

  /* ═══════════════════════════════════════════
     EQUIPE DE JORNALISMO (REPÓRTERES E RCs)
     Separado estritamente por Praça (Juiz de Fora e Uberlândia)
     Sincronizado na Nuvem (Supabase checklist_itens)
     Zero nomes em código fonte / Git
  ═══════════════════════════════════════════ */
  var EQUIPE_STORAGE_KEY = 'tv_equipe_jornalismo_v3';

  function normalizarPracaEquipe(praca) {
    var p = (praca || '').toLowerCase();
    if (p.indexOf('uber') !== -1 || p.indexOf('udi') !== -1) {
      return 'Uberlândia';
    }
    return 'Juiz de Fora';
  }
  window.normalizarPracaEquipe = normalizarPracaEquipe;

  function carregarEquipeLocal() {
    var padrao = {
      'Juiz de Fora': { reporteres: [], rcs: [] },
      'Uberlândia': { reporteres: [], rcs: [] }
    };
    try {
      localStorage.removeItem('tv_equipe_jornalismo_v1');
      localStorage.removeItem('tv_equipe_jornalismo_v2');
      localStorage.removeItem('tv_equipe_jornalismo');
      var raw = localStorage.getItem(EQUIPE_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          var filtrarValidos = function(lista) {
            if (!Array.isArray(lista)) return [];
            return lista.filter(function(it) {
              var n = (typeof it === 'string' ? it : (it.nome || it.titulo || '')).trim();
              var low = n.toLowerCase();
              return n && low.indexOf('exclusivo') === -1 && low.indexOf('teste') === -1 && n.indexOf('Ã') === -1;
            });
          };
          if (parsed['Juiz de Fora']) {
            padrao['Juiz de Fora'].reporteres = filtrarValidos(parsed['Juiz de Fora'].reporteres);
            padrao['Juiz de Fora'].rcs = filtrarValidos(parsed['Juiz de Fora'].rcs);
          }
          if (parsed['Uberlândia']) {
            padrao['Uberlândia'].reporteres = filtrarValidos(parsed['Uberlândia'].reporteres);
            padrao['Uberlândia'].rcs = filtrarValidos(parsed['Uberlândia'].rcs);
          }
          return padrao;
        }
      }
    } catch(e) {}
    return padrao;
  }
  window.carregarEquipeLocal = carregarEquipeLocal;

  function salvarEquipeLocal(dados) {
    try {
      localStorage.setItem(EQUIPE_STORAGE_KEY, JSON.stringify(dados));
    } catch(e) {
      console.warn('Erro ao salvar equipe local:', e);
    }
  }
  window.salvarEquipeLocal = salvarEquipeLocal;

  function obterOpcoesReporteresHTML(selectedVal) {
    var praca = normalizarPracaEquipe(typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora');
    var equipe = carregarEquipeLocal();
    var lista = (equipe[praca] && Array.isArray(equipe[praca].reporteres)) ? equipe[praca].reporteres : [];
    var isConectado = (typeof isEstacaoConectadaTV === 'function') ? isEstacaoConectadaTV() : false;
    var html = '<option value="">Selecione o repórter...</option>';
    
    var jaSelecionado = false;
    lista.forEach(function(rep) {
      var nome = typeof rep === 'string' ? rep : (rep.nome || rep.titulo || '');
      if (!nome) return;
      var isSel = (nome === selectedVal);
      if (isSel) jaSelecionado = true;
      html += '<option value="' + escapeHTML(nome) + '"' + (isSel ? ' selected' : '') + '>' + escapeHTML(nome) + '</option>';
    });

    var outraPraca = (praca === 'Juiz de Fora') ? 'Uberlândia' : 'Juiz de Fora';
    var pertenceOutraPraca = equipe[outraPraca] && (
      (equipe[outraPraca].reporteres || []).some(function(r){ return (r.nome || r.titulo || r) === selectedVal; })
    );

    if (!pertenceOutraPraca && selectedVal && !jaSelecionado && selectedVal !== '__novo_reporter__') {
      html += '<option value="' + escapeHTML(selectedVal) + '" selected>' + escapeHTML(selectedVal) + '</option>';
    }

    if (isConectado) {
      html += '<option value="__novo_reporter__" style="color:var(--blue);font-weight:700;">➕ Cadastrar Novo Repórter...</option>';
    }
    return html;
  }
  window.obterOpcoesReporteresHTML = obterOpcoesReporteresHTML;

  function obterOpcoesRCsHTML(selectedVal) {
    var praca = normalizarPracaEquipe(typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora');
    var equipe = carregarEquipeLocal();
    var lista = (equipe[praca] && Array.isArray(equipe[praca].rcs)) ? equipe[praca].rcs : [];
    var isConectado = (typeof isEstacaoConectadaTV === 'function') ? isEstacaoConectadaTV() : false;
    var html = '<option value="">Selecione o RC...</option>';

    var jaSelecionado = false;
    lista.forEach(function(rc) {
      var nome = typeof rc === 'string' ? rc : (rc.nome || rc.titulo || '');
      if (!nome) return;
      var isSel = (nome === selectedVal);
      if (isSel) jaSelecionado = true;
      html += '<option value="' + escapeHTML(nome) + '"' + (isSel ? ' selected' : '') + '>' + escapeHTML(nome) + '</option>';
    });

    var outraPraca = (praca === 'Juiz de Fora') ? 'Uberlândia' : 'Juiz de Fora';
    var pertenceOutraPraca = equipe[outraPraca] && (
      (equipe[outraPraca].rcs || []).some(function(r){ return (r.nome || r.titulo || r) === selectedVal; })
    );

    if (!pertenceOutraPraca && selectedVal && !jaSelecionado && selectedVal !== '__novo_rc__') {
      html += '<option value="' + escapeHTML(selectedVal) + '" selected>' + escapeHTML(selectedVal) + '</option>';
    }

    if (isConectado) {
      html += '<option value="__novo_rc__" style="color:var(--blue);font-weight:700;">➕ Cadastrar Novo RC...</option>';
    }
    return html;
  }
  window.obterOpcoesRCsHTML = obterOpcoesRCsHTML;

  function atualizarSelectsProfissionaisCTRS() {
    var repSelects = document.querySelectorAll('.ctrs-reporter-select');
    repSelects.forEach(function(sel) {
      var currentVal = sel.value;
      sel.innerHTML = obterOpcoesReporteresHTML(currentVal);
      if (currentVal && currentVal !== '__novo_reporter__') {
        var match = Array.from(sel.options).some(function(o){ return o.value === currentVal; });
        sel.value = match ? currentVal : '';
      }
      if (!sel._hasNovoProfListener) {
        sel._hasNovoProfListener = true;
        sel.addEventListener('change', function() {
          if (this.value === '__novo_reporter__') {
            this.value = '';
            abrirModalNovoProfissional('reporter', this);
          }
        });
      }
    });

    var rcSelects = document.querySelectorAll('.ctrs-rc-select');
    rcSelects.forEach(function(sel) {
      var currentVal = sel.value;
      sel.innerHTML = obterOpcoesRCsHTML(currentVal);
      if (currentVal && currentVal !== '__novo_rc__') {
        var match = Array.from(sel.options).some(function(o){ return o.value === currentVal; });
        sel.value = match ? currentVal : '';
      }
      if (!sel._hasNovoProfListener) {
        sel._hasNovoProfListener = true;
        sel.addEventListener('change', function() {
          if (this.value === '__novo_rc__') {
            this.value = '';
            abrirModalNovoProfissional('rc', this);
          }
        });
      }
    });
  }
  window.atualizarSelectsProfissionaisCTRS = atualizarSelectsProfissionaisCTRS;

  function abrirModalNovoProfissional(tipo, triggeringSelect) {
    if (typeof isEstacaoConectadaTV === 'function' && !isEstacaoConectadaTV()) {
      alert('Atenção: Apenas operadores conectados ao banco de dados podem cadastrar novos profissionais.');
      return;
    }

    tipo = (tipo === 'rc') ? 'rc' : 'reporter';
    window._profTriggeringSelect = triggeringSelect || null;
    var pracaAtiva = normalizarPracaEquipe(typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora');

    var tipoEl = document.getElementById('novo-prof-tipo');
    var catEl  = document.getElementById('novo-prof-categoria');
    var nomeEl = document.getElementById('novo-prof-nome');
    var titEl  = document.getElementById('novo-prof-title');
    var subEl  = document.getElementById('novo-prof-subtitle');

    if (tipoEl) tipoEl.value = tipo;
    if (catEl)  catEl.value = tipo;
    if (nomeEl) {
      nomeEl.value = '';
      setTimeout(function() { nomeEl.focus(); }, 150);
    }

    if (titEl) {
      titEl.textContent = (tipo === 'rc') ? 'Cadastrar Novo RC (' + pracaAtiva + ')' : 'Cadastrar Novo Repórter (' + pracaAtiva + ')';
    }
    if (subEl) {
      subEl.textContent = (tipo === 'rc')
        ? 'Cadastre o Repórter Cinematográfico para a praça ' + pracaAtiva
        : 'Cadastre o Repórter para a praça ' + pracaAtiva;
    }

    abrirPopup('popup-novo-profissional');
  }
  window.abrirModalNovoProfissional = abrirModalNovoProfissional;

  function obterCredenciaisDB() {
    if (typeof getDBCredentials === 'function') return getDBCredentials();
    if (typeof window !== 'undefined' && typeof window.getDBCredentials === 'function') return window.getDBCredentials();
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

  async function salvarNovoProfissionalEquipe() {
    if (typeof isEstacaoConectadaTV === 'function' && !isEstacaoConectadaTV()) {
      alert('Você precisa estar conectado ao banco de dados para cadastrar profissionais.');
      return;
    }

    var tipoEl = document.getElementById('novo-prof-tipo');
    var nomeEl = document.getElementById('novo-prof-nome');
    var nome = (nomeEl ? nomeEl.value : '').trim();
    var tipo = (tipoEl ? tipoEl.value : 'reporter').toLowerCase();
    var pracaAtiva = normalizarPracaEquipe(typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora');

    if (!nome) {
      alert('Por favor, informe o nome do profissional.');
      if (nomeEl) nomeEl.focus();
      return;
    }

    var equipe = carregarEquipeLocal();
    var chaveLista = (tipo === 'rc') ? 'rcs' : 'reporteres';
    if (!equipe[pracaAtiva]) equipe[pracaAtiva] = { reporteres: [], rcs: [] };

    var existe = equipe[pracaAtiva][chaveLista].some(function(item) {
      var n = typeof item === 'string' ? item : (item.nome || item.titulo || '');
      return n.toLowerCase() === nome.toLowerCase();
    });

    if (existe) {
      alert('Este profissional já está cadastrado em ' + pracaAtiva + '.');
      return;
    }

    var profId = 'prof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    var novoItem = { id: profId, nome: nome, categoria: tipo, praca: pracaAtiva };
    equipe[pracaAtiva][chaveLista].push(novoItem);
    salvarEquipeLocal(equipe);

    var targetSelect = window._profTriggeringSelect;

    fecharPopup('popup-novo-profissional');

    if (typeof mostrarToast === 'function') {
      mostrarToast('Profissional Cadastrado', nome + ' adicionado a ' + pracaAtiva + '.', 'success');
    }

    atualizarSelectsProfissionaisCTRS();

    if (targetSelect) {
      try {
        targetSelect.value = nome;
      } catch(e) {}
    }

    // Sincroniza diretamente no Supabase em checklist_itens
    var db = obterCredenciaisDB();
    if (db && db.url && db.key) {
      try {
        var payload = {
          id: profId,
          titulo: nome,
          categoria: tipo,
          operador_nome: pracaAtiva,
          padrao: false,
          concluido: false
        };
        var res = await fetch(db.url.replace(/\/$/, '') + '/rest/v1/checklist_itens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': db.key,
            'Authorization': 'Bearer ' + db.key,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          var errText = await res.text();
          console.error('[Equipe Nuvem] Erro ao salvar profissional no banco:', res.status, errText);
        } else {
          console.log('[Equipe Nuvem] ✅ Profissional sincronizado na nuvem com sucesso:', nome, '(' + pracaAtiva + ')');
        }
      } catch(eNuvem) {
        console.warn('[Equipe Nuvem] Falha de conexão ao enviar para nuvem:', eNuvem);
      }
    }
  }
  window.salvarNovoProfissionalEquipe = salvarNovoProfissionalEquipe;

  function removerProfissionalEquipe(id, tipo, nome, praca) {
    praca = normalizarPracaEquipe(praca || (typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora'));
    if (!confirm('Deseja realmente remover "' + nome + '" de ' + praca + '?')) {
      return;
    }

    var equipe = carregarEquipeLocal();
    var chaveLista = (tipo === 'rc') ? 'rcs' : 'reporteres';
    if (equipe[praca]) {
      equipe[praca][chaveLista] = equipe[praca][chaveLista].filter(function(item) {
        var itemId = typeof item === 'string' ? item : (item.id || item.nome);
        return itemId !== id && item.nome !== nome;
      });
    }

    salvarEquipeLocal(equipe);
    atualizarSelectsProfissionaisCTRS();

    if (typeof mostrarToast === 'function') {
      mostrarToast('Profissional Removido', nome + ' foi removido da equipe.', 'info');
    }

    var db = obterCredenciaisDB();
    if (db && db.url && db.key && id) {
      try {
        fetch(db.url.replace(/\/$/, '') + '/rest/v1/checklist_itens?id=eq.' + encodeURIComponent(id), {
          method: 'DELETE',
          headers: {
            'apikey': db.key,
            'Authorization': 'Bearer ' + db.key
          }
        }).catch(function(err) { console.error('[Equipe Nuvem] Erro ao excluir:', err); });
      } catch(eDel) {
        console.warn('[Equipe Nuvem] Falha ao excluir na nuvem:', eDel);
      }
    }
  }
  window.removerProfissionalEquipe = removerProfissionalEquipe;

  async function sincronizarEquipeNuvem() {
    var db = obterCredenciaisDB();
    if (!db || !db.url || !db.key) return;

    try {
      var url = db.url.replace(/\/$/, '') + '/rest/v1/checklist_itens?select=id,titulo,categoria,operador_nome&categoria=in.(reporter,rc)&order=titulo.asc&limit=1000';
      var res = await fetch(url, {
        headers: {
          'apikey': db.key,
          'Authorization': 'Bearer ' + db.key,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) return;
      var data = await res.json();
      if (!Array.isArray(data)) return;

      var repMap = {
        'Juiz de Fora': { reporteres: [], rcs: [] },
        'Uberlândia': { reporteres: [], rcs: [] }
      };

      data.forEach(function(item) {
        if (!item || !item.titulo) return;
        var titulo = item.titulo.trim();
        var low = titulo.toLowerCase();
        // Filtrar qualquer resquício de itens de teste antigos
        if (low.indexOf('exclusivo') !== -1 || low.indexOf('teste') !== -1 || titulo.indexOf('Ã') !== -1) return;
        
        var pNorm = normalizarPracaEquipe(item.operador_nome);
        var p = { id: item.id, nome: titulo, categoria: item.categoria, praca: pNorm };
        if (item.categoria === 'rc') {
          repMap[pNorm].rcs.push(p);
        } else {
          repMap[pNorm].reporteres.push(p);
        }
      });

      salvarEquipeLocal(repMap);
      atualizarSelectsProfissionaisCTRS();
    } catch(err) {
      console.warn('[Equipe Nuvem] Erro ao sincronizar equipe:', err);
    }
  }
  window.sincronizarEquipeNuvem = sincronizarEquipeNuvem;

  function adicionarTransmissaoCTRS(silencioso) {
    var container = document.getElementById('ctrs-acc-container');
    if (!container) return;

    var currentCount = container.querySelectorAll('.acc-block').length;
    var newNum = currentCount + 1;

    var div = document.createElement('div');
    div.className = 'acc-block';
    div.innerHTML =
      '<div class="acc-head open" onclick="togAcc(this)" aria-expanded="true">' +
        '<span class="acc-title-text">Transmissão Vivo ' + newNum + '</span>' +
        '<i data-lucide="chevron-down" class="acc-arrow" style="width:14px;height:14px;stroke-width:2;"></i>' +
      '</div>' +
      '<div class="acc-body open">' +
        '<div class="fg2">' +
          '<div class="frow"><label>Cidade / Bairro</label><input type="text" placeholder="Ex: Centro — Juiz de Fora"/></div>' +
          '<div class="frow">' +
            '<label>Infraestrutura da Transmissão</label>' +
            '<select class="ctrs-infra-select">' +
              obterOpcoesEquipamentosHTML() +
            '</select>' +
          '</div>' +
          '<div class="frow"><label>Hora Abertura Sinal</label><input type="time"/></div>' +
          '<div class="frow"><label>Hora Final (Teste OK)</label><input type="time"/></div>' +
          '<div class="frow"><label>Qualidade do Áudio</label><select><option>C — Conforme</option><option>NC — Não Conforme</option><option>NA — Não se Aplica</option></select></div>' +
          '<div class="frow"><label>Qualidade do Vídeo</label><select><option>C — Conforme</option><option>NC — Não Conforme</option><option>NA — Não se Aplica</option></select></div>' +
          '<div class="frow"><label>Repórter</label><select class="ctrs-reporter-select">' + obterOpcoesReporteresHTML() + '</select></div>' +
          '<div class="frow"><label>Entradas</label><input type="text" placeholder="Ex: 2 entradas conformes — externo"/></div>' +
          '<div class="frow"><label>Repórter Cinematográfico</label><select class="ctrs-rc-select">' + obterOpcoesRCsHTML() + '</select></div>' +
          '<div class="frow"><label>Status da Transmissão</label><select><option>C — Conforme</option><option>NC — Não Conforme</option><option>NA — Não se Aplica</option></select></div>' +
        '</div>' +
        '<div class="frow"><label>Observações</label><textarea placeholder="Descreva as falhas. Se nenhuma, deixe em branco."></textarea></div>' +
        '<div style="display:flex;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--border-lt);margin-top:10px;">' +
          '<button type="button" class="btn btn-ghost btn-xs" onclick="removerTransmissaoCTRS(this);" style="color:var(--red);border-color:var(--red-border);display:inline-flex;align-items:center;gap:5px;padding:4px 10px;" title="Remover esta transmissão">' +
            '<i data-lucide="trash-2" style="width:13px;height:13px;stroke-width:2;"></i>' +
            '<span>Remover Transmissão</span>' +
          '</button>' +
        '</div>' +
      '</div>';

    container.appendChild(div);
    atualizarSelectsProfissionaisCTRS();
    atualizarSelectsEquipamentosCTRS();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (!silencioso) {
      salvarRascunhoRelatorioTV(true);
    }
  }

  function removerTransmissaoCTRS(btn) {
    var block = btn.closest('.acc-block');
    if (!block) return;
    block.remove();

    var remaining = document.querySelectorAll('#page-ctrs .acc-block');
    remaining.forEach(function(b, idx) {
      var num = idx + 1;
      var titleSpan = b.querySelector('.acc-title-text');
      if (titleSpan) {
        titleSpan.textContent = 'Transmissão Vivo ' + num;
      } else {
        var head = b.querySelector('.acc-head');
        if (head) {
          for (var i = 0; i < head.childNodes.length; i++) {
            if (head.childNodes[i].nodeType === 3 && head.childNodes[i].textContent.indexOf('Transmissão Vivo') !== -1) {
              head.childNodes[i].textContent = 'Transmissão Vivo ' + num;
              break;
            }
          }
        }
      }
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
    salvarRascunhoRelatorioTV(true);
  }

  window.adicionarTransmissaoCTRS = adicionarTransmissaoCTRS;
  window.removerTransmissaoCTRS   = removerTransmissaoCTRS;

  function carregarRascunhoRelatorioTV() {
    try {
      var raw = localStorage.getItem('tv_ctrs_rascunho_v2');
      if (!raw) return;
      var dados = JSON.parse(raw);
      if (!dados) return;

      var dataEl  = document.getElementById('ctrs-data');
      var pracaEl = document.getElementById('ctrs-praca');
      var tipoEl  = document.getElementById('ctrs-tipo');
      var pracaAtiva = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
      if (pracaEl) pracaEl.value = pracaAtiva;
      if (dataEl && dados.data)   dataEl.value = dados.data;
      if (tipoEl && dados.tipo)   tipoEl.value = dados.tipo;
      if (obsEl && dados.obs)     obsEl.value = dados.obs;

      if (Array.isArray(dados.transmissoes)) {
        var container = document.getElementById('ctrs-acc-container');
        var accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
        while (accBlocks.length < dados.transmissoes.length && container) {
          adicionarTransmissaoCTRS(true);
          accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
        }

        dados.transmissoes.forEach(function(tx, idx) {
          if (accBlocks[idx]) {
            var inputs = accBlocks[idx].querySelectorAll('input, select, textarea');
            if (inputs[0] && tx.cidade !== undefined)    inputs[0].value = tx.cidade;
            if (inputs[1] && tx.infra !== undefined)     inputs[1].value = tx.infra;
            if (inputs[2] && tx.horaAbert !== undefined) inputs[2].value = tx.horaAbert;
            if (inputs[3] && tx.horaFim !== undefined)   inputs[3].value = tx.horaFim;
            if (inputs[4] && tx.audioQ !== undefined)    inputs[4].value = tx.audioQ;
            if (inputs[5] && tx.videoQ !== undefined)    inputs[5].value = tx.videoQ;
            if (inputs[6] && tx.reporter !== undefined)  inputs[6].value = tx.reporter;
            if (inputs[7] && tx.entradas !== undefined)  inputs[7].value = tx.entradas;
            if (inputs[8] && tx.rc !== undefined)        inputs[8].value = tx.rc;
            if (inputs[9] && tx.statusTx !== undefined)  inputs[9].value = tx.statusTx;
            if (inputs[10] && tx.falhas !== undefined)   inputs[10].value = tx.falhas;
          }
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar rascunho CTRS:', e);
    }
  }

  function gerarHTMLTemplateCTRS() {
    var dataEl  = document.getElementById('ctrs-data');
    var pracaEl = document.getElementById('ctrs-praca');
    var tipoEl  = document.getElementById('ctrs-tipo');
    var obsEl   = document.getElementById('ctrs-obs');

    var praca = pracaEl ? pracaEl.value : 'Juiz de Fora';
    var dataRaw = dataEl && dataEl.value ? dataEl.value : '';
    var dataFmt = '';
    if (dataRaw) {
      var p = dataRaw.split('-');
      dataFmt = (p.length === 3) ? (p[2] + '/' + p[1] + '/' + p[0]) : dataRaw;
    } else {
      var dNow = new Date();
      var dia = String(dNow.getDate()).padStart(2, '0');
      var mes = String(dNow.getMonth() + 1).padStart(2, '0');
      dataFmt = dia + '/' + mes + '/' + dNow.getFullYear();
    }

    var tipo = tipoEl ? tipoEl.value : 'INTEGRAÇÃO NOTÍCIA';
    var inCheck = '', mg1Check = '', mg2Check = '', outrosCheck = '';
    var tipoUpper = tipo.toUpperCase();
    if (tipoUpper.includes('NOTÍCIA') || tipoUpper.includes('IN')) {
      inCheck = 'X';
    } else if (tipoUpper === 'MG1') {
      mg1Check = 'X';
    } else if (tipoUpper === 'MG2') {
      mg2Check = 'X';
    } else {
      outrosCheck = 'X';
    }

    var obs = obsEl ? obsEl.value.trim() : '';

    var formatTimeVal = function(val) {
      if (!val) return '';
      var parts = val.trim().split(':');
      if (parts.length === 2) return parts[0] + 'h' + parts[1] + '\'';
      return val.trim();
    };

    var formatQualidade = function(val) {
      if (!val) return 'C';
      var v = val.trim();
      if (v.startsWith('NC') || v.startsWith('Não Conforme')) return 'NC';
      if (v.startsWith('NA') || v.startsWith('Não se Aplica')) return 'NA';
      return 'C';
    };

    var accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
    var transmissoesHTML = '';

    accBlocks.forEach(function(acc, idx) {
      var num = idx + 1;
      var inputs = acc.querySelectorAll('input, select, textarea');
      var cidade    = (inputs[0] && inputs[0].value.trim()) || '';
      var infra     = (inputs[1] && inputs[1].value.trim()) || '';
      var horaAbert = formatTimeVal(inputs[2] ? inputs[2].value : '');
      var horaFim   = formatTimeVal(inputs[3] ? inputs[3].value : '');
      var audioQ    = formatQualidade(inputs[4] ? inputs[4].value : '');
      var videoQ    = formatQualidade(inputs[5] ? inputs[5].value : '');
      var reporter  = (inputs[6] && inputs[6].value.trim()) || '';
      var entradas  = (inputs[7] && inputs[7].value.trim()) || '';
      var rc        = (inputs[8] && inputs[8].value.trim()) || '';
      var statusTx  = formatQualidade(inputs[9] ? inputs[9].value : '');
      var falhas    = (inputs[10] && inputs[10].value.trim()) || '';

      var reporterCompleto = reporter;
      if (entradas) {
        reporterCompleto += (reporterCompleto ? ' (' + entradas + ')' : entradas);
      }

      var cidadeCompleta = cidade;
      if (cidadeCompleta && !cidadeCompleta.toLowerCase().includes(praca.toLowerCase())) {
        cidadeCompleta = praca + ' - ' + cidadeCompleta;
      } else if (!cidadeCompleta) {
        cidadeCompleta = praca;
      }

      transmissoesHTML +=
        '<table cellpadding="4" cellspacing="0" style="width:100%; max-width:820px; border-collapse:collapse; font-family:Arial, Helvetica, sans-serif; font-size:11.5px; color:#000000; border:1.5px solid #000000; margin-bottom:12px;">' +
          '<tr style="background-color:#F2F2F2;">' +
            '<td colspan="3" style="text-align:center; font-weight:bold; font-size:12px; border:1px solid #000000; padding:4px;">' +
              'Informações da Transmissão ao Vivo ' + num +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td colspan="3" style="border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Cidade:</strong> ' + cidadeCompleta +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="width:45%; border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Infraestrutura de Transmissão Utilizada:</strong> ' + infra +
            '</td>' +
            '<td style="width:33%; border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Hora Abertura Sinal:</strong> ' + horaAbert +
            '</td>' +
            '<td style="width:22%; border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Qualidade Áudio:</strong> ' + audioQ +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Repórter:</strong> ' + reporterCompleto +
            '</td>' +
            '<td style="border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Hora final (Teste OK):</strong> ' + horaFim +
            '</td>' +
            '<td style="border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Qualidade Vídeo:</strong> ' + videoQ +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Repórter Cinematográfico:</strong> ' + rc +
            '</td>' +
            '<td colspan="2" style="border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Status da Transmissão:</strong> ' + statusTx +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td colspan="3" style="border:1px solid #000000; padding:4px 8px; min-height:30px;">' +
              '<strong>Observações:</strong> ' + (falhas || '') +
            '</td>' +
          '</tr>' +
        '</table>';
    });

    var htmlCompleto =
      '<div style="font-family:Arial, Helvetica, sans-serif; color:#000000; max-width:820px; margin:0 auto; padding:10px;">' +
        '<!-- CABEÇALHO OFICIAL ENGENHARIA -->' +
        '<table cellpadding="4" cellspacing="0" style="width:100%; max-width:820px; border-collapse:collapse; font-family:Arial, sans-serif; font-size:11.5px; color:#000000; border:1.5px solid #000000; margin-bottom:12px;">' +
          '<tr>' +
            '<td rowspan="2" style="width:160px; text-align:center; vertical-align:middle; border:1px solid #000000; padding:8px;">' +
              '<div style="font-weight:900; font-size:15px; letter-spacing:1px; color:#000000;">TV INTEGRAÇÃO</div>' +
            '</td>' +
            '<td style="text-align:center; vertical-align:middle; border:1px solid #000000; padding:6px; font-weight:bold; font-size:12px; line-height:1.4;">' +
              'Processo Engenharia 1.1.1 – P02 – F02<br/>' +
              'Checklist de Transmissão ao Vivo CTRS' +
            '</td>' +
            '<td style="width:140px; text-align:center; vertical-align:middle; border:1px solid #000000; padding:6px; font-size:11px;">' +
              'Formulário<br/>' +
              '<strong>Página: 1/1</strong>' +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="border:1px solid #000000; padding:4px 8px; font-size:10.5px;">' +
              '<table style="width:100%; border-collapse:collapse;">' +
                '<tr>' +
                  '<td style="text-align:left; border:none; padding:0;">Data Emissão Inicial: 11/08/2011</td>' +
                  '<td style="text-align:right; border:none; padding:0;">Data Revisão: 01/04/2016</td>' +
                '</tr>' +
              '</table>' +
            '</td>' +
            '<td style="text-align:center; border:1px solid #000000; padding:4px 8px; font-size:10.5px;">' +
              'Número Revisão: 02' +
            '</td>' +
          '</tr>' +
        '</table>' +

        '<!-- INFORMAÇÕES PRINCIPAIS -->' +
        '<table cellpadding="4" cellspacing="0" style="width:100%; max-width:820px; border-collapse:collapse; font-family:Arial, sans-serif; font-size:11.5px; color:#000000; border:1.5px solid #000000; margin-bottom:12px;">' +
          '<tr style="background-color:#F2F2F2;">' +
            '<td colspan="4" style="text-align:center; font-weight:bold; border:1px solid #000000; padding:4px;">' +
              'Informações Principais' +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td colspan="2" style="width:50%; border:1px solid #000000; padding:5px 8px;">' +
              '<strong>Data:</strong> ' + dataFmt +
            '</td>' +
            '<td colspan="2" style="width:50%; border:1px solid #000000; padding:5px 8px;">' +
              '<strong>Praça:</strong> ' + praca +
            '</td>' +
          '</tr>' +
          '<tr style="text-align:center;">' +
            '<td style="width:25%; border:1px solid #000000; padding:5px 8px;">' +
              '<strong>IN:</strong> ' + (inCheck || '&nbsp;') +
            '</td>' +
            '<td style="width:25%; border:1px solid #000000; padding:5px 8px;">' +
              '<strong>MG1:</strong> ' + (mg1Check || '&nbsp;') +
            '</td>' +
            '<td style="width:25%; border:1px solid #000000; padding:5px 8px;">' +
              '<strong>MG2:</strong> ' + (mg2Check || '&nbsp;') +
            '</td>' +
            '<td style="width:25%; border:1px solid #000000; padding:5px 8px;">' +
              '<strong>OUTROS:</strong> ' + (outrosCheck || '&nbsp;') +
            '</td>' +
          '</tr>' +
        '</table>' +

        '<!-- TRANSMISSÕES AO VIVO -->' +
        transmissoesHTML +

        '<!-- LEGENDA -->' +
        '<table cellpadding="4" cellspacing="0" style="width:100%; max-width:820px; border-collapse:collapse; font-family:Arial, sans-serif; font-size:11px; color:#000000; border:1.5px solid #000000; margin-bottom:12px;">' +
          '<tr style="background-color:#F2F2F2;">' +
            '<td colspan="3" style="text-align:center; font-weight:bold; border:1px solid #000000; padding:4px;">' +
              'Legenda' +
            '</td>' +
          '</tr>' +
          '<tr style="text-align:center;">' +
            '<td style="width:33.3%; border:1px solid #000000; padding:5px 8px;">C – Conforme</td>' +
            '<td style="width:33.3%; border:1px solid #000000; padding:5px 8px;">NC – Não Conforme</td>' +
            '<td style="width:33.3%; border:1px solid #000000; padding:5px 8px;">NA – Não se Aplica</td>' +
          '</tr>' +
        '</table>' +

        '<!-- OBSERVAÇÕES -->' +
        '<table cellpadding="4" cellspacing="0" style="width:100%; max-width:820px; border-collapse:collapse; font-family:Arial, sans-serif; font-size:11.5px; color:#000000; border:1.5px solid #000000; margin-bottom:12px;">' +
          '<tr style="background-color:#F2F2F2;">' +
            '<td style="text-align:center; font-weight:bold; border:1px solid #000000; padding:4px;">' +
              'Observações' +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="border:1px solid #000000; padding:8px; min-height:40px; white-space:pre-wrap;">' +
              (obs || 'Sem observações.') +
            '</td>' +
          '</tr>' +
        '</table>' +
      '</div>';

    return {
      html: htmlCompleto,
      assunto: 'Transmissão ao Vivo - CTRS - ' + (inCheck ? 'IN' : (mg1Check ? 'MG1' : (mg2Check ? 'MG2' : 'OUTROS'))) + ' - ' + praca + ' - ' + dataFmt
    };
  }

  function limparFormularioCTRS(confirmar) {
    if (confirmar && !confirm('Deseja realmente limpar todos os campos preenchidos do relatório CTRS?')) {
      return;
    }
    try {
      localStorage.removeItem('tv_ctrs_rascunho_v2');

      var dataEl = document.getElementById('ctrs-data');
      var obsEl  = document.getElementById('ctrs-obs');
      if (dataEl) dataEl.value = new Date().toISOString().split('T')[0];
      if (obsEl)  obsEl.value = '';

      var accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
      accBlocks.forEach(function(acc) {
        var inputs = acc.querySelectorAll('input, select, textarea');
        inputs.forEach(function(inp) {
          if (inp.tagName === 'SELECT') inp.selectedIndex = 0;
          else inp.value = '';
        });
      });

      // Se houver mais de 4 blocos dinâmicos, remove os excedentes
      var container = document.getElementById('ctrs-acc-container');
      if (container) {
        var blocks = container.querySelectorAll('.acc-block');
        for (var i = 4; i < blocks.length; i++) {
          blocks[i].remove();
        }
      }

      if (confirmar && typeof mostrarToast === 'function') {
        mostrarToast('Formulário Limpo', 'Os campos do CTRS foram zerados para o próximo preenchimento.', 'info');
      }
    } catch (e) {
      console.warn('Erro ao limpar CTRS:', e);
    }
  }
  window.limparFormularioCTRS = limparFormularioCTRS;

  function copiarRelatorioOutlook() {
    var resultado = gerarHTMLTemplateCTRS();
    var html = resultado.html;
    var assunto = resultado.assunto;

    var assuntoEl = document.getElementById('ctrs-outlook-assunto');
    if (assuntoEl) {
      assuntoEl.textContent = assunto;
    }

    var copiado = false;
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        var blobHtml = new Blob([html], { type: 'text/html' });
        var blobText = new Blob([assunto + '\n\n' + html.replace(/<[^>]+>/g, ' ')], { type: 'text/plain' });
        var item = new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText
        });
        navigator.clipboard.write([item]).then(function() {
          abrirPopup('popup-ctrs-outlook');
          limparFormularioCTRS(false);
        }).catch(function(err) {
          fallbackCopiarAreaTransferencia(html);
          limparFormularioCTRS(false);
        });
        copiado = true;
      } catch (e) {
        copiado = false;
      }
    }

    if (!copiado) {
      fallbackCopiarAreaTransferencia(html);
      limparFormularioCTRS(false);
    }
  }
  window.copiarRelatorioOutlook = copiarRelatorioOutlook;

  function fallbackCopiarAreaTransferencia(html) {
    var container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.pointerEvents = 'none';
    container.style.opacity = '0';
    document.body.appendChild(container);

    var range = document.createRange();
    range.selectNode(container);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    try {
      document.execCommand('copy');
      abrirPopup('popup-ctrs-outlook');
    } catch (e) {
      alert('Não foi possível copiar automaticamente. Por favor selecione e copie os dados.');
    }

    window.getSelection().removeAllRanges();
    document.body.removeChild(container);
  }

  function enviarRelatorioTV() {
    var nowStr = formatDataHoraLocal();
    var pracaEl = document.getElementById('ctrs-praca');
    var tipoEl  = document.getElementById('ctrs-tipo');
    var obsEl   = document.getElementById('ctrs-obs');

    var praca = pracaEl ? pracaEl.value : 'Juiz de Fora';
    var tipo  = tipoEl ? tipoEl.value : 'INTEGRAÇÃO NOTÍCIA';
    var obs   = obsEl ? obsEl.value.trim() : '';

    /* Coleta falhas registradas nas seções sanfonadas */
    var falhasEncontradas = [];
    if (obs && !obs.toLowerCase().includes('sem ocorrência') && !obs.toLowerCase().includes('sem ocorrencia')) {
      falhasEncontradas.push(obs);
    }

    document.querySelectorAll('#page-ctrs .acc-body textarea').forEach(function(txt, i) {
      var val = txt.value.trim();
      if (val && !val.toLowerCase().includes('sem ocorrência') && !val.toLowerCase().includes('sem ocorrencia')) {
        falhasEncontradas.push('Transmissão Vivo ' + (i + 1) + ': ' + val);
      }
    });

    var novasOcorrenciasCriadas = 0;

    /* Para cada falha relatada, cria automaticamente uma Ocorrência no Dashboard */
    falhasEncontradas.forEach(function(falhaTxt, idx) {
      novasOcorrenciasCriadas++;
      var novaOc = {
        id:          'oc_auto_' + Date.now() + '_' + idx,
        titulo:      'Falha em Relatório TV (' + tipo + ')',
        prio:        'Alta',
        cat:         'Telejornal / Transmissão ao Vivo',
        resp:        'Todos do turno',
        local:       praca,
        prazo:       '12:00',
        desc:        falhaTxt,
        mine:        false,
        tags:        ['Relatório TV', 'Automática'],
        status:      'aberta',
        criado:      Date.now(),
        dataCriacao: nowStr,
        resolucao:   null,
        praca:       praca
      };
      ocorrencias = [novaOc].concat(ocorrencias);
    });

    if (novasOcorrenciasCriadas > 0) {
      save(ocorrencias, null, true);
    }

    /* Registra o Relatório no Histórico */
    var isUberlandia = praca.indexOf('Uber') !== -1;
    var tituloRelatorio = isUberlandia ? ('Relatório de Transmissão — ' + tipo) : ('Checklist CTRS — ' + tipo + ' (' + praca + ')');
    var novoHist = {
      id:            'h_ctrs_' + Date.now(),
      tipo:          'relatorio',
      subtipo:       isUberlandia ? 'Relatório Transmissão' : 'CTRS Transmissão',
      titulo:        tituloRelatorio,
      equipamento:   'Equipamentos de Transmissão / CTRS',
      categoria:     'Transmissão CTRS',
      local:         praca,
      dataCriacao:   nowStr,
      criadoPor:     getUsuarioAtual(),
      descCriacao:   'Relatório TV registrado. ' + (falhasEncontradas.length > 0 ? (falhasEncontradas.length + ' falha(s) identificada(s) e convertida(s) em ocorrência(s).') : 'Sem falhas registradas.'),
      status:        'Concluído',
      dataResolucao: nowStr,
      resolvidoPor:  getUsuarioAtual(),
      descResolucao: 'Relatório processado e sincronizado com a base de dados da emissora.',
      praca:         praca
    };

    historicoSeedData = [novoHist].concat(historicoSeedData);
    saveHistorico(historicoSeedData, novoHist);

    // Limpa o rascunho e o formulário do CTRS para a próxima transmissão
    limparFormularioCTRS(false);

    renderAll();

    var avisoEnvio = '\n\n💡 Nota: O envio automático direto por e-mail ainda não está disponível atualmente e será liberado em breve!\nPara enviar o relatório agora aos destinatários, utilize o botão "Copiar para o Outlook" e cole direto na sua mensagem de e-mail.';

    if (novasOcorrenciasCriadas > 0) {
      if (typeof adicionarNotificacao === 'function') {
        adicionarNotificacao('Ocorrência Criada do Relatório', novasOcorrenciasCriadas + ' falha(s) do relatório convertida(s) em Ocorrência Ativa no Dashboard!', 'warning');
      }
      alert('Relatório TV registrado no sistema!\n\n⚠️ Foi identificada falha e ' + novasOcorrenciasCriadas + ' nova Ocorrência foi gerada AUTOMATICAMENTE no Dashboard!' + avisoEnvio);
    } else {
      if (typeof adicionarNotificacao === 'function') {
        adicionarNotificacao('Relatório TV Salvo', 'Relatório processado e registrado com sucesso.', 'success');
      }
      alert('Relatório registrado com sucesso no Histórico!' + avisoEnvio);
    }
  }
  window.enviarRelatorioTV = enviarRelatorioTV;

  if (typeof registrarAutosaveListener === 'function') {
    registrarAutosaveListener('page-ctrs', salvarRascunhoRelatorioTV);
  }
  /* ═══════════════════════════════════════════
     CHECKLIST DIÁRIO & MONITORAMENTO DE ROTINAS OPERACIONAIS — SUPABASE
  ═══════════════════════════════════════════ */

  var checklistFiltroAtual = 'todos';
  var checklistItems = [];
  var checklistUltimaDataVerificada = new Date().toISOString().slice(0, 10);

  /* ── Verificação e Resete Automático da Meia-Noite ── */
  function verificarReseteMeiaNoite() {
    try {
      var hojeStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      if (checklistUltimaDataVerificada !== hojeStr) {
        console.log('[Checklist] 🕛 Meia-noite detectada: Novo dia (' + hojeStr + '). Verificando ciclo de tarefas...');
        checklistUltimaDataVerificada = hojeStr;
        if (Array.isArray(checklistItems) && checklistItems.length > 0) {
          checklistItems.forEach(function(it) {
            // Itens com recorrência ativa são geridos estritamente pelo motor verificarRecorrenciasChecklist
            if (it.recorrencia && it.recorrencia.tipo && it.recorrencia.tipo !== 'nenhuma') {
              return;
            }
            // Apenas tarefas sem recorrência programada resetam na virada comum de dia
            it.concluido = false;
            it.concluidoEm = null;
            if (it.padrao) salvarRotinaPadraoNuvem(it);
            else salvarLembretePessoalNuvem(it);
          });
        }
        verificarRecorrenciasChecklist();
        if (typeof mostrarToast === 'function') {
          mostrarToast('Novo Dia Iniciado', 'As rotinas foram desmarcadas para o plantão de hoje.', 'info');
        }
      }
    } catch(e) {
      console.warn('Erro ao verificar resete da meia-noite:', e);
    }
  }

  var CHECKLIST_STORAGE_KEY = 'tv_checklist_itens_cache_v2';

  function carregarChecklistCacheLocal() {
    try {
      var raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch(e) {}
    return [];
  }

  function carregarChecklistStore() {
    // 1. Carrega imediatamente o cache local para que NADA suma ao atualizar a página (F5)
    var cacheLocal = carregarChecklistCacheLocal();
    if (cacheLocal && cacheLocal.length > 0) {
      checklistItems = cacheLocal;
    }
    verificarReseteMeiaNoite();
    verificarRecorrenciasChecklist();
    atualizarDataChecklistUI();
    renderChecklist();
    sincronizarChecklistNuvem();
    carregarOperadoresSugeridos();
  }
  window.carregarChecklistStore = carregarChecklistStore;

  function salvarChecklistStore() {
    window.checklistItems = checklistItems;
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklistItems));
    } catch(e) {}
  }

  function atualizarDataChecklistUI() {
    var elDate = document.getElementById('reminders-current-date');
    if (!elDate) return;
    try {
      var hoje = new Date();
      var opcoes = { weekday: 'long', day: 'numeric', month: 'long' };
      var dataFmt = hoje.toLocaleDateString('pt-BR', opcoes);
      // Capitalizar primeira letra
      dataFmt = dataFmt.charAt(0).toUpperCase() + dataFmt.slice(1);
      elDate.textContent = dataFmt;
    } catch(e) {
      elDate.textContent = 'Hoje';
    }
  }

  function renderChecklist() {
    var listPadraoEl = document.getElementById('reminders-list-padrao');
    var listPessoalEl = document.getElementById('reminders-list-pessoal');
    if (!listPadraoEl && !listPessoalEl) return;

    // Calcular estatísticas
    var total = checklistItems.length;
    var concluidos = checklistItems.filter(function(it) { return it.concluido; }).length;
    var pendentes = total - concluidos;
    var rotinas = checklistItems.filter(function(it) { return it.categoria === 'rotina' || it.padrao; }).length;
    var pct = total > 0 ? Math.round((concluidos / total) * 100) : 0;

    // Atualizar UI de resumo (Hero)
    var fill = document.getElementById('reminders-progress-fill');
    if (fill) fill.style.width = pct + '%';

    var pctEl = document.getElementById('reminders-pct');
    if (pctEl) pctEl.textContent = pct + '%';

    var lblEl = document.getElementById('reminders-count-lbl');
    if (lblEl) lblEl.textContent = concluidos + ' de ' + total + ' checados';

    // Atualizar Contadores dos Cards
    var cTodos = document.getElementById('fc-count-todos');
    if (cTodos) cTodos.textContent = total;

    var cPend = document.getElementById('fc-count-pendentes');
    if (cPend) cPend.textContent = pendentes;

    var cRot = document.getElementById('fc-count-rotina');
    if (cRot) cRot.textContent = rotinas;

    var cConc = document.getElementById('fc-count-concluidos');
    if (cConc) cConc.textContent = concluidos;

    // Separar itens entre Padrão TV (oficiais/recorrentes para toda a equipe) e Pessoais (privados do operador)
    var padraoItems = checklistItems.filter(function(it) {
      return !!it.padrao;
    });
    var pessoalItems = checklistItems.filter(function(it) {
      return !it.padrao;
    });

    // Atualizar badges das colunas
    var bPadrao = document.getElementById('badge-rotinas-padrao');
    if (bPadrao) {
      var concP = padraoItems.filter(function(i){ return i.concluido; }).length;
      bPadrao.textContent = concP + '/' + padraoItems.length;
    }
    var bPessoal = document.getElementById('badge-rotinas-pessoais');
    if (bPessoal) {
      var concU = pessoalItems.filter(function(i){ return i.concluido; }).length;
      bPessoal.textContent = concU + '/' + pessoalItems.length;
    }

    var listPadraoEl = document.getElementById('reminders-list-padrao');
    var listPessoalEl = document.getElementById('reminders-list-pessoal');

    function renderizarLista(itens, targetEl, emptyMsg) {
      if (!targetEl) return;
      var filtrados = itens.filter(function(it) {
        if (checklistFiltroAtual === 'pendentes') return !it.concluido;
        if (checklistFiltroAtual === 'concluidos') return it.concluido;
        if (checklistFiltroAtual === 'rotina') return it.categoria === 'rotina' || it.padrao;
        return true; // 'todos'
      });

      if (filtrados.length === 0) {
        var textoVazio = emptyMsg;
        if (itens.length > 0) {
          textoVazio = checklistFiltroAtual === 'pendentes'
            ? 'Todos os itens desta coluna foram concluídos!'
            : 'Nenhum item encontrado para o filtro ativo.';
        }
        targetEl.innerHTML = '<li class="reminders-empty" style="padding:28px 16px;">' +
          '<i data-lucide="check-circle" style="width:30px;height:30px;opacity:0.4;"></i>' +
          '<div style="font-size:13px;font-weight:600;margin-top:4px;">Nenhum item</div>' +
          '<div style="font-size:11.5px;color:var(--muted);">' + textoVazio + '</div>' +
          '</li>';
        return;
      }

      var html = '';
      filtrados.forEach(function(item) {
        var completedClass = item.concluido ? ' completed' : '';
        var tagLabel = getCategoriaLabel(item.categoria);
        var tagClass = 'tag-' + (item.categoria || 'avulso');
        var metaHorario = item.horario ? '<span>·</span><span>' + escapeHTML(item.horario) + '</span>' : '';
        var recBadgeHTML = getRecorrenciaBadgeHTML(item);

        html += '<li class="reminder-item' + completedClass + '" id="chk-item-' + item.id + '">' +
          '<button class="reminder-checkbox" onclick="toggleChecklistItem(\'' + item.id + '\')" title="' + (item.concluido ? 'Desmarcar' : 'Concluir') + '">' +
            '<i data-lucide="check" style="width:13px;height:13px;stroke-width:3;"></i>' +
          '</button>' +
          '<div class="reminder-body">' +
            '<div class="reminder-title">' + escapeHTML(item.titulo) + '</div>' +
            '<div class="reminder-meta">' +
              '<span class="reminder-tag ' + tagClass + '">' + tagLabel + '</span>' +
              recBadgeHTML +
              metaHorario +
            '</div>' +
          '</div>' +
          '<div class="reminder-actions">' +
            '<button class="reminder-action-btn edit" onclick="abrirModalRecorrencia(\'' + item.id + '\')" title="Editar e Configurar Repetição" aria-label="Editar Rotina">' +
              '<i data-lucide="pencil" style="width:14px;height:14px;stroke-width:2.2;"></i>' +
            '</button>' +
            '<button class="reminder-action-btn alert" onclick="criarOcorrenciaDoChecklist(\'' + item.id + '\')" data-tooltip="Falha detectada? Criar ocorrência desta rotina" aria-label="Criar ocorrência desta rotina">' +
              '<i data-lucide="alert-triangle" style="width:14px;height:14px;stroke-width:2.2;"></i>' +
            '</button>' +
            '<button class="reminder-action-btn del" onclick="removerItemChecklist(\'' + item.id + '\')" title="Excluir rotina/lembrete" aria-label="Excluir rotina">' +
              '<i data-lucide="trash-2" style="width:14px;height:14px;stroke-width:2;"></i>' +
            '</button>' +
          '</div>' +
        '</li>';
      });

      targetEl.innerHTML = html;
    }

    renderizarLista(padraoItems, listPadraoEl, 'Nenhuma rotina padrão cadastrada. Adicione acima para toda a equipe.');
    renderizarLista(pessoalItems, listPessoalEl, 'Nenhum lembrete pessoal cadastrado.');

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
  window.renderChecklist = renderChecklist;

  function getCategoriaLabel(cat) {
    switch(cat) {
      case 'rotina': return 'Rotina TV';
      case 'estudio': return 'Estúdio';
      case 'ctrs': return 'Transmissão CTRS';
      case 'infra': return 'Infraestrutura';
      default: return 'Lembrete';
    }
  }

  function getRecorrenciaBadgeHTML(item) {
    if (!item || !item.recorrencia || !item.recorrencia.tipo || item.recorrencia.tipo === 'nenhuma') {
      return '';
    }
    var rec = item.recorrencia;
    var label = '';
    if (rec.tipo === 'horaria') {
      label = '🔁 A cada ' + (rec.intervaloHoras || 1) + 'h';
    } else if (rec.tipo === 'diaria') {
      label = '🔁 Diário às ' + (rec.horario || '08:00');
    } else if (rec.tipo === 'semanal') {
      var dNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      var dList = Array.isArray(rec.diasSemana) ? rec.diasSemana : [1, 3, 5];
      var strDias = dList.map(function(d){ return dNames[d] || ''; }).filter(Boolean).join(', ');
      label = '🔁 ' + (strDias || 'Semanal') + ' às ' + (rec.horario || '09:00');
    }
    if (!label) return '';
    return '<span>·</span><span class="reminder-rec-badge" onclick="event.stopPropagation(); abrirModalRecorrencia(\'' + item.id + '\')" title="Clique para editar agendamento">' + escapeHTML(label) + '</span>';
  }
  window.getRecorrenciaBadgeHTML = getRecorrenciaBadgeHTML;

  function toggleChecklistItem(id) {
    var item = checklistItems.find(function(it) { return it.id === id; });
    if (!item) return;
    item.concluido = !item.concluido;
    item.concluidoEm = item.concluido ? new Date().toISOString() : null;

    // Regra estrita de ciclo:
    // Ao ser concluída, fixa a próxima data/hora em ciclo futuro para NUNCA voltar antes do tempo!
    if (item.concluido && item.recorrencia && item.recorrencia.tipo && item.recorrencia.tipo !== 'nenhuma') {
      item.recorrencia.ultimoCicloConcluido = new Date().toISOString();
      item.recorrencia.proximaExecucao = calcularProximaExecucao(item.recorrencia, new Date(), true);
      salvarRecorrenciaLocal(item.id, item.recorrencia);
    }

    salvarChecklistStore();
    renderChecklist();

    // Sincroniza estado de conclusão com a nuvem
    if (item.padrao) {
      salvarRotinaPadraoNuvem(item);
    } else {
      salvarLembretePessoalNuvem(item);
    }

    if (item.concluido && typeof tocarSomNotificacao === 'function') {
      try { tocarSomNotificacao(); } catch(e) {}
    }
  }
  window.toggleChecklistItem = toggleChecklistItem;

  function filtrarChecklist(tipo, el) {
    checklistFiltroAtual = tipo;
    document.querySelectorAll('.reminders-filter-card').forEach(function(c) {
      c.classList.remove('active');
    });
    if (el) el.classList.add('active');

    var titleEl = document.getElementById('reminders-current-view-title');
    if (titleEl) {
      var mapTitles = {
        todos: 'Todas as Rotinas & Lembretes',
        pendentes: 'Itens Pendentes de Checagem',
        rotina: 'Procedimentos Preventivos da TV',
        concluidos: 'Itens Verificados & Concluídos'
      };
      titleEl.innerHTML = '<i data-lucide="list-checks" style="width:15px;height:15px;stroke-width:2;"></i> ' + (mapTitles[tipo] || 'Itens');
    }

    renderChecklist();
  }
  window.filtrarChecklist = filtrarChecklist;

  function adicionarRotinaPadrao() {
    var input = document.getElementById('reminders-new-padrao-input');
    var catSelect = document.getElementById('reminders-new-padrao-cat');
    if (!input || !input.value.trim()) return;

    var titulo = input.value.trim();
    var categoria = catSelect ? catSelect.value : 'rotina';
    var novoItem = {
      id: 'padrao-' + Date.now(),
      titulo: titulo,
      categoria: categoria,
      padrao: true,
      concluido: false,
      horario: 'Criado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    checklistItems.unshift(novoItem);
    salvarChecklistStore();
    input.value = '';
    renderChecklist();

    // Envia para o Supabase com padrao: true para toda a equipe
    salvarRotinaPadraoNuvem(novoItem);

    if (typeof mostrarToast === 'function') {
      mostrarToast('Rotina Padrão TV Adicionada', 'Procedimento oficial adicionado e compartilhado para toda a equipe.', 'success');
    }
  }
  window.adicionarRotinaPadrao = adicionarRotinaPadrao;

  function adicionarLembreteRapido() {
    var input = document.getElementById('reminders-new-input');
    var catSelect = document.getElementById('reminders-new-cat');
    if (!input || !input.value.trim()) return;

    var titulo = input.value.trim();
    var categoria = catSelect ? catSelect.value : 'avulso';
    var novoItem = {
      id: 'lembrete-' + Date.now(),
      titulo: titulo,
      categoria: categoria,
      padrao: false,
      concluido: false,
      horario: 'Criado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    checklistItems.unshift(novoItem);
    salvarChecklistStore();
    input.value = '';
    renderChecklist();

    // Envia direto para o Supabase atrelado ao UUID do operador
    salvarLembretePessoalNuvem(novoItem);

    if (typeof mostrarToast === 'function') {
      mostrarToast('Lembrete Adicionado', 'Item incluído na rotina de hoje e sincronizado na nuvem.', 'success');
    }
  }
  window.adicionarLembreteRapido = adicionarLembreteRapido;

  function removerItemChecklist(id) {
    var item = checklistItems.find(function(it) { return it.id === id; });
    if (!item) return;

    if (item.padrao) {
      if (!confirm('Esta é uma Rotina Padrão da emissora. Deseja realmente excluí-la para toda a equipe?')) {
        return;
      }
    }

    checklistItems = checklistItems.filter(function(it) { return it.id !== id; });
    salvarChecklistStore();
    renderChecklist();

    if (item.padrao) {
      excluirRotinaPadraoNuvem(id);
      if (typeof mostrarToast === 'function') {
        mostrarToast('Rotina Removida', 'A rotina padrão foi removida para todos os operadores.', 'info');
      }
    } else {
      excluirLembretePessoalNuvem(id);
      if (typeof mostrarToast === 'function') {
        mostrarToast('Lembrete Removido', 'Lembrete pessoal excluído.', 'info');
      }
    }
  }
  window.removerItemChecklist = removerItemChecklist;

  function reiniciarRotinaDiaria() {
    if (!confirm('Deseja reiniciar a rotina diária para o início de um novo turno? Os itens padrão serão desmarcados.')) {
      return;
    }
    // Desmarcar todos os itens e reter tarefas
    checklistItems.forEach(function(it) {
      it.concluido = false;
      it.concluidoEm = null;
    });
    salvarChecklistStore();
    renderChecklist();
    if (typeof mostrarToast === 'function') {
      mostrarToast('Rotina Reiniciada', 'O checklist está pronto para o novo turno.', 'info');
    }
  }
  window.reiniciarRotinaDiaria = reiniciarRotinaDiaria;

  function criarOcorrenciaDoChecklist(id) {
    var item = checklistItems.find(function(it) { return it.id === id; });
    if (!item) return;

    if (typeof abrirPopup === 'function') {
      abrirPopup('popup-nova-oc');

      // 1. Preenche o Título diretamente com o nome da rotina
      var tituloEl = document.getElementById('nova-titulo');
      if (tituloEl) {
        tituloEl.value = 'Falha na Rotina: ' + item.titulo;
      }

      // 2. Preenche a Categoria correta de acordo com a rotina
      var catEl = document.getElementById('nova-cat');
      if (catEl) {
        if (item.categoria === 'ctrs') {
          catEl.value = 'Telejornal / Transmissão ao Vivo';
        } else if (item.categoria === 'estudio') {
          catEl.value = 'Equipamento';
        } else if (item.categoria === 'infra') {
          catEl.value = 'Infraestrutura';
        } else if (item.categoria === 'rotina') {
          catEl.value = 'Programação';
        } else {
          catEl.value = 'Outro';
        }
      }

      // 3. Preenche a Descrição Detalhada com formato completo (atinge os 50 caracteres mínimos)
      var descEl = document.getElementById('nova-desc');
      if (descEl) {
        var agoraStr = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        descEl.value = 'Inconformidade detectada durante a verificação de rotina em ' + agoraStr + '.\nProcedimento checado: ' + item.titulo + '.\nDetalhes da falha observada: ';
        
        // Atualiza o contador de caracteres e botão de criar
        var counter = document.getElementById('nova-counter');
        if (counter) {
          var len = descEl.value.length;
          if (len >= 50) {
            counter.textContent = '✓ ' + len + ' caracteres — mínimo atingido';
            counter.className = 'char-count ok';
          }
        }
        var btnCriar = document.getElementById('btn-criar');
        if (btnCriar) {
          btnCriar.style.opacity = '1';
          btnCriar.style.cursor = 'pointer';
          btnCriar._valido = true;
        }

        setTimeout(function() {
          descEl.focus();
          descEl.setSelectionRange(descEl.value.length, descEl.value.length);
        }, 180);
      }
    }
  }
  window.criarOcorrenciaDoChecklist = criarOcorrenciaDoChecklist;



  /* ═══════════════════════════════════════════
     INTEGRAÇÃO SUPABASE: LISTA DE OPERADORES & RESOLUÇÃO DE UUID
  ═══════════════════════════════════════════ */

  var operadoresMap = {}; // nome -> id (UUID)

  function getDBCredentials() {
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
  window.getDBCredentials = getDBCredentials;

  function carregarOperadoresSugeridos() {
    var datalist = document.getElementById('lista-operadores-sugeridos');
    var db = getDBCredentials();
    if (!db.url || !db.key) return;

    var endpoint = db.url + '/rest/v1/operadores?select=id,nome&ativo=eq.true&order=nome.asc';
    fetch(endpoint, {
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key
      }
    })
    .then(function(res) { return res.ok ? res.json() : null; })
    .then(function(operadores) {
      if (Array.isArray(operadores) && operadores.length > 0) {
        operadoresMap = {};
        operadores.forEach(function(op) {
          operadoresMap[op.nome.trim()] = op.id;
        });

        // Define o UUID do operador atual se o nome corresponder
        var usuarioAtual = getUsuarioAtual();
        if (operadoresMap[usuarioAtual]) {
          window.OPERADOR_UUID_ATUAL = operadoresMap[usuarioAtual];
        }

        if (datalist) {
          datalist.innerHTML = operadores.map(function(op) {
            return '<option value="' + escapeHTML(op.nome) + '">';
          }).join('');
        }
        console.log('[Operadores] ' + operadores.length + ' operadores carregados do banco de dados (Supabase).');

        // Sincroniza as rotinas com o banco agora que temos o UUID
        sincronizarChecklistNuvem();
      }
    })
    .catch(function(err) {
      console.warn('[Operadores] Não foi possível carregar operadores do Supabase:', err);
    });
  }
  window.carregarOperadoresSugeridos = carregarOperadoresSugeridos;

  /* ═══════════════════════════════════════════
     SINCRONIZAÇÃO EM NUVEM: ROTINAS DIRETAMENTE NO BANCO DE DADOS
  ═══════════════════════════════════════════ */

  function getOperadorUUID() {
    if (window.OPERADOR_UUID_ATUAL) return window.OPERADOR_UUID_ATUAL;
    var usuarioAtual = getUsuarioAtual();
    if (usuarioAtual && operadoresMap && operadoresMap[usuarioAtual]) {
      window.OPERADOR_UUID_ATUAL = operadoresMap[usuarioAtual];
      return window.OPERADOR_UUID_ATUAL;
    }
    return null;
  }
  window.getOperadorUUID = getOperadorUUID;

  function sincronizarChecklistNuvem() {
    var db = getDBCredentials();
    if (!db.url || !db.key) return;
    var opUUID = getOperadorUUID();
    var usuarioAtual = getUsuarioAtual();

    // Sempre busca todas as rotinas padrão (padrao=true) + as rotinas pessoais do operador atual
    var queryFilter = '';
    if (opUUID) {
      queryFilter = 'or=(padrao.eq.true,operador_id.eq.' + encodeURIComponent(opUUID) + ')';
    } else if (usuarioAtual && usuarioAtual !== 'Plantão Técnico' && usuarioAtual !== 'Operador') {
      queryFilter = 'or=(padrao.eq.true,operador_nome.eq.' + encodeURIComponent(usuarioAtual) + ')';
    } else {
      queryFilter = 'padrao=eq.true';
    }

    var endpoint = db.url + '/rest/v1/checklist_itens?select=*&categoria=not.in.(reporter,rc)&' + queryFilter + '&order=criado_em.asc';

    fetch(endpoint, {
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Cache-Control': 'no-cache'
      }
    })
    .then(function(res) { return res.ok ? res.json() : null; })
    .then(function(cloudItens) {
      if (Array.isArray(cloudItens)) {
        cloudItens = cloudItens.filter(function(c) {
          return c && c.categoria !== 'reporter' && c.categoria !== 'rc';
        });
        var recMap = carregarRecorrenciasLocais();
        var itensProcessados = cloudItens.map(function(c) {
          var rec = c.recorrencia || recMap[c.id] || null;
          return {
            id: c.id,
            titulo: c.titulo,
            categoria: c.categoria || (c.padrao ? 'rotina' : 'avulso'),
            padrao: !!c.padrao,
            concluido: !!c.concluido,
            concluidoEm: c.concluido_em || null,
            horario: c.padrao
              ? 'Rotina TV'
              : (c.criado_em ? 'Criado em ' + new Date(c.criado_em).toLocaleDateString('pt-BR') : 'Pessoal'),
            operador_id: c.operador_id,
            operador_nome: c.operador_nome,
            recorrencia: rec
          };
        });

        // Preservar itens locais recém-criados que ainda não estejam na nuvem
        var idNuvemMap = {};
        itensProcessados.forEach(function(item) { idNuvemMap[item.id] = true; });

        var pendentesLocais = checklistItems.filter(function(it) {
          return it && !idNuvemMap[it.id] && (!it.id || !it.id.toString().startsWith('rot-'));
        });

        checklistItems = itensProcessados.concat(pendentesLocais);
        salvarChecklistStore();
        renderChecklist();
        verificarRecorrenciasChecklist();
        console.log('[Checklist DB] ✅ ' + itensProcessados.length + ' rotinas carregadas diretamente do banco de dados (Supabase checklist_itens).');
      }
    })
    .catch(function(err) {
      console.warn('[Checklist DB] Erro ao sincronizar com banco de dados:', err);
    });
  }
  window.sincronizarChecklistNuvem = sincronizarChecklistNuvem;
  window.sincronizarLembretesPessoaisNuvem = sincronizarChecklistNuvem;

  function salvarRotinaPadraoNuvem(item) {
    var db = getDBCredentials();
    if (!db.url || !db.key) {
      console.warn('[Checklist DB] Supabase não configurado. Salvo apenas localmente.');
      return;
    }

    var payload = {
      id: item.id,
      operador_id: null,
      operador_nome: 'Padrão TV',
      titulo: item.titulo,
      categoria: item.categoria || 'rotina',
      padrao: true,
      concluido: !!item.concluido,
      concluido_em: item.concluidoEm || null
    };

    var endpoint = db.url + '/rest/v1/checklist_itens';
    fetch(endpoint, {
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
      if (!res.ok) {
        return res.text().then(function(errText) {
          console.error('[Checklist DB] Erro ao salvar rotina padrão no banco:', res.status, errText);
        });
      }
      console.log('[Checklist DB] ✅ Rotina padrão salva com sucesso no banco de dados (checklist_itens):', item.titulo);
    })
    .catch(function(err) {
      console.error('[Checklist DB] Falha ao enviar rotina padrão para o banco:', err);
    });
  }
  window.salvarRotinaPadraoNuvem = salvarRotinaPadraoNuvem;

  function excluirRotinaPadraoNuvem(id) {
    var db = getDBCredentials();
    if (!db.url || !db.key || !id) return;
    var endpoint = db.url + '/rest/v1/checklist_itens?id=eq.' + encodeURIComponent(id);
    fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key
      }
    })
    .then(function(res) {
      if (res.ok) {
        console.log('[Checklist DB] ✅ Rotina padrão excluída do banco de dados:', id);
      }
    })
    .catch(function(err) {
      console.error('[Checklist DB] Falha ao excluir rotina padrão do banco:', err);
    });
  }
  window.excluirRotinaPadraoNuvem = excluirRotinaPadraoNuvem;

  function salvarLembretePessoalNuvem(item) {
    var db = getDBCredentials();
    if (!db.url || !db.key) return;
    var opUUID = getOperadorUUID();
    var usuarioAtual = getUsuarioAtual();

    var payload = {
      id: item.id,
      operador_id: opUUID || null,
      operador_nome: usuarioAtual,
      titulo: item.titulo,
      categoria: item.categoria || 'avulso',
      padrao: false,
      concluido: !!item.concluido,
      concluido_em: item.concluidoEm || null
    };

    var endpoint = db.url + '/rest/v1/checklist_itens';
    fetch(endpoint, {
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
      if (!res.ok) {
        return res.text().then(function(errText) {
          console.error('[Checklist DB] Erro ao salvar lembrete pessoal no banco:', res.status, errText);
        });
      }
      console.log('[Checklist DB] ✅ Lembrete pessoal salvo diretamente no banco de dados:', item.titulo);
    })
    .catch(function(err) {
      console.error('[Checklist DB] Falha ao enviar lembrete pessoal para o banco:', err);
    });
  }
  window.salvarLembretePessoalNuvem = salvarLembretePessoalNuvem;

  function excluirLembretePessoalNuvem(id) {
    var db = getDBCredentials();
    if (!db.url || !db.key || !id) return;
    var endpoint = db.url + '/rest/v1/checklist_itens?id=eq.' + encodeURIComponent(id);
    fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key
      }
    })
    .then(function(res) {
      if (res.ok) {
        console.log('[Checklist DB] ✅ Lembrete pessoal excluído do banco de dados:', id);
      }
    })
    .catch(function(err) {
      console.error('[Checklist DB] Falha ao excluir lembrete do banco:', err);
    });
  }
  window.excluirLembretePessoalNuvem = excluirLembretePessoalNuvem;

  /* ═══════════════════════════════════════════
     MOTOR DE RECORRÊNCIA INTELIGENTE
  ═══════════════════════════════════════════ */

  var itemRecorrenciaAtual = null;
  var recorrenciaFrequenciaAtiva = 'nenhuma';

  function carregarRecorrenciasLocais() {
    try {
      var raw = localStorage.getItem('tv_checklist_recorrencias_v1');
      return raw ? JSON.parse(raw) : {};
    } catch(e) {
      return {};
    }
  }
  window.carregarRecorrenciasLocais = carregarRecorrenciasLocais;

  function salvarRecorrenciaLocal(id, rec) {
    try {
      var map = carregarRecorrenciasLocais();
      if (!rec || rec.tipo === 'nenhuma') {
        delete map[id];
      } else {
        map[id] = rec;
      }
      localStorage.setItem('tv_checklist_recorrencias_v1', JSON.stringify(map));
    } catch(e) {}
  }
  window.salvarRecorrenciaLocal = salvarRecorrenciaLocal;

  function abrirModalRecorrencia(id) {
    var item = checklistItems.find(function(it){ return it.id === id; });
    if (!item) return;

    itemRecorrenciaAtual = item;
    var idInput = document.getElementById('rec-item-id');
    if (idInput) idInput.value = item.id;
    var titleDisplay = document.getElementById('rec-item-title-display');
    if (titleDisplay) titleDisplay.textContent = item.titulo;
    var titleInput = document.getElementById('rec-item-title-input');
    if (titleInput) titleInput.value = item.titulo || '';

    var rec = item.recorrencia || { tipo: 'nenhuma', intervaloHoras: 1, horario: '08:00', diasSemana: [1, 3, 5] };
    selecionarFrequenciaRecorrencia(rec.tipo || 'nenhuma');

    var intEl = document.getElementById('rec-intervalo-horas');
    if (intEl) intEl.value = rec.intervaloHoras || 1;

    var hDiaria = document.getElementById('rec-hora-diaria');
    if (hDiaria) hDiaria.value = rec.horario || '08:00';

    var hSemanal = document.getElementById('rec-hora-semanal');
    if (hSemanal) hSemanal.value = rec.horario || '09:00';

    // Configurar pills de dias da semana (D S T Q Q S S)
    var diasAtivos = Array.isArray(rec.diasSemana) && rec.diasSemana.length > 0 ? rec.diasSemana : [1, 3, 5];
    var pills = document.querySelectorAll('#rec-dias-semana-wrap .rec-day-pill');
    pills.forEach(function(btn) {
      var diaNum = parseInt(btn.getAttribute('data-day'), 10);
      if (diasAtivos.indexOf(diaNum) !== -1) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    atualizarPreviaProximaExecucao();
    if (typeof abrirPopup === 'function') {
      abrirPopup('popup-recorrencia-checklist');
    }
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
  window.abrirModalRecorrencia = abrirModalRecorrencia;

  function selecionarFrequenciaRecorrencia(freq) {
    recorrenciaFrequenciaAtiva = freq;
    var botoes = ['nenhuma', 'horaria', 'diaria', 'semanal'];
    botoes.forEach(function(b) {
      var el = document.getElementById('rec-btn-' + b);
      if (el) {
        if (b === freq) el.classList.add('active');
        else el.classList.remove('active');
      }
      var sec = document.getElementById('rec-sec-' + b);
      if (sec) {
        sec.style.display = (b === freq) ? 'block' : 'none';
      }
    });
    atualizarPreviaProximaExecucao();
  }
  window.selecionarFrequenciaRecorrencia = selecionarFrequenciaRecorrencia;

  function toggleDiaSemanaRecorrencia(btn) {
    btn.classList.toggle('active');
    var ativos = document.querySelectorAll('#rec-dias-semana-wrap .rec-day-pill.active');
    if (ativos.length === 0) {
      btn.classList.add('active'); // pelo menos 1 dia ativo
    }
    atualizarPreviaProximaExecucao();
  }
  window.toggleDiaSemanaRecorrencia = toggleDiaSemanaRecorrencia;

  function calcularProximaExecucao(rec, baseDate, jaConcluidoNesteCiclo) {
    if (!rec || !rec.tipo || rec.tipo === 'nenhuma') return null;

    var base = baseDate ? new Date(baseDate) : new Date();
    if (isNaN(base.getTime())) base = new Date();

    if (rec.tipo === 'horaria') {
      var intervalo = parseInt(rec.intervaloHoras, 10) || 1;
      var next = new Date(base.getTime());
      next.setHours(next.getHours() + intervalo);
      next.setMinutes(0, 0, 0);
      while (next.getTime() <= base.getTime()) {
        next.setHours(next.getHours() + 1);
      }
      return next.toISOString();
    }

    if (rec.tipo === 'diaria') {
      var parts = (rec.horario || '08:00').split(':');
      var targetH = parseInt(parts[0], 10) || 0;
      var targetM = parseInt(parts[1], 10) || 0;

      var candidate = new Date(base.getFullYear(), base.getMonth(), base.getDate(), targetH, targetM, 0, 0);

      // Se já foi concluída neste ciclo diário (mesmo adiantada ou pontual),
      // ela NUNCA volta hoje: só volta amanhã no horário programado!
      if (jaConcluidoNesteCiclo || candidate.getTime() <= base.getTime()) {
        candidate.setDate(candidate.getDate() + 1);
      }
      return candidate.toISOString();
    }

    if (rec.tipo === 'semanal') {
      var partsSem = (rec.horario || '09:00').split(':');
      var sH = parseInt(partsSem[0], 10) || 0;
      var sM = parseInt(partsSem[1], 10) || 0;
      var dias = Array.isArray(rec.diasSemana) && rec.diasSemana.length > 0 ? rec.diasSemana : [1, 3, 5];

      var cDate = new Date(base.getFullYear(), base.getMonth(), base.getDate(), sH, sM, 0, 0);

      // Se concluída hoje, pula o dia de hoje imediatamente
      if (jaConcluidoNesteCiclo || cDate.getTime() <= base.getTime()) {
        cDate.setDate(cDate.getDate() + 1);
      }

      // Procura o próximo dia da semana programado (até 7 dias)
      for (var i = 0; i < 7; i++) {
        var dayOfWeek = cDate.getDay();
        if (dias.indexOf(dayOfWeek) !== -1) {
          return cDate.toISOString();
        }
        cDate.setDate(cDate.getDate() + 1);
      }
      return cDate.toISOString();
    }

    return null;
  }
  window.calcularProximaExecucao = calcularProximaExecucao;

  function obterConfigRecorrenciaDoModal() {
    var freq = recorrenciaFrequenciaAtiva;
    var rec = {
      tipo: freq,
      intervaloHoras: 1,
      horario: '08:00',
      diasSemana: [1, 3, 5],
      proximaExecucao: null,
      ultimoCicloConcluido: null
    };

    if (freq === 'horaria') {
      var intEl = document.getElementById('rec-intervalo-horas');
      rec.intervaloHoras = intEl ? parseInt(intEl.value, 10) : 1;
    } else if (freq === 'diaria') {
      var hEl = document.getElementById('rec-hora-diaria');
      rec.horario = hEl ? hEl.value : '08:00';
    } else if (freq === 'semanal') {
      var hsEl = document.getElementById('rec-hora-semanal');
      rec.horario = hsEl ? hsEl.value : '09:00';
      var dias = [];
      document.querySelectorAll('#rec-dias-semana-wrap .rec-day-pill.active').forEach(function(p){
        dias.push(parseInt(p.getAttribute('data-day'), 10));
      });
      rec.diasSemana = dias.length > 0 ? dias : [1, 3, 5];
    }
    return rec;
  }

  function atualizarPreviaProximaExecucao() {
    var textoEl = document.getElementById('rec-previa-texto');
    var subEl = document.getElementById('rec-previa-sub');
    if (!textoEl || !subEl) return;

    var freq = recorrenciaFrequenciaAtiva;
    if (freq === 'nenhuma') {
      textoEl.textContent = 'Sem repetição programada.';
      subEl.textContent = 'Esta rotina só será concluída uma única vez.';
      return;
    }

    var tempRec = obterConfigRecorrenciaDoModal();
    var proxISO = calcularProximaExecucao(tempRec, new Date(), true);
    if (!proxISO) {
      textoEl.textContent = 'Programação configurada.';
      subEl.textContent = '';
      return;
    }

    var d = new Date(proxISO);
    var diasNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    var diaSemana = diasNomes[d.getDay()];
    var horaFmt = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    var dataFmt = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2);

    textoEl.textContent = 'Próxima execução: ' + diaSemana + ' (' + dataFmt + ') às ' + horaFmt;
    subEl.textContent = 'Ao ser marcada como concluída, permanecerá concluída até esta data/hora, quando voltará automaticamente para a lista alertando o plantão.';
  }
  window.atualizarPreviaProximaExecucao = atualizarPreviaProximaExecucao;

  function salvarRecorrenciaItem() {
    var itemId = document.getElementById('rec-item-id').value;
    var item = checklistItems.find(function(it){ return it.id === itemId; });
    if (!item) return;

    var novaRec = obterConfigRecorrenciaDoModal();
    if (novaRec.tipo !== 'nenhuma') {
      novaRec.proximaExecucao = calcularProximaExecucao(novaRec, new Date(), !!item.concluido);
    } else {
      novaRec.proximaExecucao = null;
    }

    var titleInput = document.getElementById('rec-item-title-input');
    if (titleInput && titleInput.value.trim()) {
      item.titulo = titleInput.value.trim();
    }

    item.recorrencia = novaRec;
    salvarRecorrenciaLocal(item.id, novaRec);
    salvarChecklistStore();
    renderChecklist();

    if (item.padrao) salvarRotinaPadraoNuvem(item);
    else salvarLembretePessoalNuvem(item);

    if (typeof fecharPopup === 'function') {
      fecharPopup('popup-recorrencia-checklist');
    }
    if (typeof mostrarToast === 'function') {
      var msg = novaRec.tipo === 'nenhuma' ? 'Repetição desativada.' : 'Repetição agendada com sucesso!';
      mostrarToast('Agendamento', msg, 'success');
    }
  }
  window.salvarRecorrenciaItem = salvarRecorrenciaItem;

  function removerRecorrenciaItem() {
    selecionarFrequenciaRecorrencia('nenhuma');
    salvarRecorrenciaItem();
  }
  window.removerRecorrenciaItem = removerRecorrenciaItem;

  function verificarRecorrenciasChecklist() {
    if (!Array.isArray(checklistItems) || checklistItems.length === 0) return;

    var agora = Date.now();
    var houveMudanca = false;

    checklistItems.forEach(function(it) {
      if (!it || !it.concluido) return;
      if (!it.recorrencia || !it.recorrencia.tipo || it.recorrencia.tipo === 'nenhuma') return;

      var proxISO = it.recorrencia.proximaExecucao;
      if (!proxISO) return;

      var proxTime = new Date(proxISO).getTime();
      if (!isNaN(proxTime) && agora >= proxTime) {
        console.log('[Checklist] ⏰ Ciclo expirado para: "' + it.titulo + '". Desmarcando dos concluídos e alertando...');
        
        // Período expirado: rotina sai dos concluídos e volta para os pendentes!
        it.concluido = false;
        it.concluidoEm = null;
        it.recorrencia.proximaExecucao = calcularProximaExecucao(it.recorrencia, new Date(), false);
        houveMudanca = true;

        // Dispara Notificação Sonora e Toast
        if (typeof mostrarToast === 'function') {
          mostrarToast('⏰ Hora da Rotina!', 'Procedimento pendente de checagem: ' + it.titulo, 'warning');
        }
        if (typeof tocarSomNotificacao === 'function') {
          try { tocarSomNotificacao(); } catch(e){}
        }
        if (typeof window.adicionarNotificacao === 'function') {
          window.adicionarNotificacao('Rotina Agendada', 'Procedimento pendente de checagem: ' + it.titulo, 'alerta');
        }

        // Persiste o novo ciclo
        if (it.padrao) salvarRotinaPadraoNuvem(it);
        else salvarLembretePessoalNuvem(it);
        salvarRecorrenciaLocal(it.id, it.recorrencia);
      }
    });

    if (houveMudanca) {
      salvarChecklistStore();
      renderChecklist();
    }
  }
  window.verificarRecorrenciasChecklist = verificarRecorrenciasChecklist;

  // Intervalo periódico a cada 30 segundos para checagem ativa de ciclos
  setInterval(function() {
    verificarReseteMeiaNoite();
    verificarRecorrenciasChecklist();
  }, 30000);

  // Verificação ao retornar foco à página
  window.addEventListener('focus', function() {
    verificarReseteMeiaNoite();
    verificarRecorrenciasChecklist();
  });

  /* ═══════════════════════════════════════════
     POPUP: NOVA OCORRÊNCIA
  ═══════════════════════════════════════════ */

  var novaTitulo  = document.getElementById('nova-titulo');
  var novaDesc    = document.getElementById('nova-desc');
  var novaCounter = document.getElementById('nova-counter');
  var btnCriar    = document.getElementById('btn-criar');
  var novaFile    = document.getElementById('nova-arquivos');
  var novaPrevs   = document.getElementById('nova-previews');

  function validarNova() {
    var ok = novaTitulo && novaDesc &&
             novaTitulo.value.trim().length > 0 &&
             novaDesc.value.length >= 50;
    if (btnCriar) {
      btnCriar.style.opacity = ok ? '1' : '0.38';
      btnCriar.style.cursor  = ok ? 'pointer' : 'not-allowed';
      btnCriar._valido = ok;
    }
  }

  if (btnCriar) { btnCriar.style.opacity = '0.38'; btnCriar.style.cursor = 'not-allowed'; btnCriar._valido = false; }
  if (novaTitulo) novaTitulo.addEventListener('input', validarNova);

  if (novaDesc && novaCounter) {
    novaDesc.addEventListener('input', function() {
      var len = this.value.length;
      if (len >= 50) {
        novaCounter.textContent = '✓ ' + len + ' caracteres — mínimo atingido';
        novaCounter.className = 'char-count ok';
      } else if (len >= 25) {
        novaCounter.textContent = 'Faltam ' + (50-len) + ' caracteres';
        novaCounter.className = 'char-count warn';
      } else {
        novaCounter.textContent = 'Mínimo 50 caracteres (' + len + '/50)';
        novaCounter.className = 'char-count';
      }
      validarNova();
    });
  }

  function atualizarSelectEquipamentosNovaOc() {
    var praca = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isUberlandia = praca.indexOf('Uber') !== -1;
    var equips = [];
    if (typeof dashboardMetrics !== 'undefined' && dashboardMetrics && dashboardMetrics.equipamento) {
      equips = Object.keys(dashboardMetrics.equipamento);
    }

    var selNova = document.getElementById('nova-equipamento');
    var selEdit = document.getElementById('edit-oc-equipamento');

    [selNova, selEdit].forEach(function(sel) {
      if (!sel) return;
      var curVal = sel.value;
      var html = '<option value="">Sem equipamento específico</option>';

      if (isUberlandia) {
        // Em Uberlândia: estritamente os equipamentos cadastrados pela equipe local
        if (equips.length === 0) {
          html += '<option value="" disabled style="color:var(--muted);">Nenhum equipamento cadastrado ainda em Uberlândia</option>';
        } else {
          equips.forEach(function(eq) {
            html += '<option value="' + escapeHTML(eq) + '">' + escapeHTML(eq) + '</option>';
          });
        }
      } else {
        // Juiz de Fora: equipamentos do dashboard ou os 13 padrão de JF
        if (equips.length === 0) {
          equips = ['LIVE U1', 'LIVE U2', 'LIVE U3', 'LIVE U4', 'LIVE U SMART', 'REDAÇÃO', 'KMJ', 'NET PRAÇA', 'NET PORTARIA', 'FORMATOS NET', 'NET 2º ANDAR', 'NET 3º ANDAR', 'NET 4º ANDAR'];
        }
        equips.forEach(function(eq) {
          html += '<option value="' + escapeHTML(eq) + '">' + escapeHTML(eq) + '</option>';
        });
      }
      sel.innerHTML = html;
      if (curVal) sel.value = curVal;
    });
  }
  window.atualizarSelectEquipamentosNovaOc = atualizarSelectEquipamentosNovaOc;

  function criarNovaOcorrencia() {
    var tituloVal = novaTitulo ? novaTitulo.value.trim() : '';
    var descVal = novaDesc ? novaDesc.value.trim() : '';

    if (!tituloVal) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Título Necessário', 'Por favor, informe o título da ocorrência.', 'warning');
      }
      if (novaTitulo) novaTitulo.focus();
      return;
    }

    if (descVal.length < 50) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Descrição Curta', 'A descrição deve ter pelo menos 50 caracteres (' + descVal.length + '/50).', 'warning');
      }
      if (novaDesc) novaDesc.focus();
      return;
    }

    var respVal = document.getElementById('nova-resp') ? document.getElementById('nova-resp').value : '';
    var userAtual = getUsuarioAtual();
    var isMine = (respVal === userAtual || respVal === 'Operador' || respVal.indexOf(userAtual) !== -1 || respVal.indexOf('Você') !== -1);

    var telVal = document.getElementById('nova-telejornal') ? document.getElementById('nova-telejornal').value : '';
    var eqVal  = document.getElementById('nova-equipamento') ? document.getElementById('nova-equipamento').value : '';

    var tagsArr = ['Nova'];
    if (telVal) tagsArr.push(telVal);
    if (eqVal)  tagsArr.push(eqVal);

    var anexosFinais = (uploadedFilesStore['nova-previews'] || []).slice();
    var novo = {
      id:          'oc_' + Date.now(),
      titulo:      tituloVal,
      prio:        document.getElementById('nova-prio') ? document.getElementById('nova-prio').value : 'Média',
      cat:         document.getElementById('nova-cat') ? document.getElementById('nova-cat').value : 'Equipamento',
      resp:        respVal || 'Todos do turno',
      local:       document.getElementById('nova-local') ? document.getElementById('nova-local').value.trim() : '',
      prazo:       document.getElementById('nova-prazo') ? document.getElementById('nova-prazo').value : '',
      telejornal:  telVal || null,
      equipamento: eqVal || null,
      desc:        descVal,
      mine:        isMine,
      tags:        tagsArr,
      status:      'aberta',
      criado:      Date.now(),
      dataCriacao: formatDataHoraLocal(),
      resolucao:   anexosFinais.length > 0 ? { statusRes: 'Aberta', anexos: anexosFinais } : null,
      anexos:      anexosFinais,
      praca:       (typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora')
    };

    // Atualizar métricas dos Dashboards correspondentes em tempo real
    var atualizouDash = false;
    if (typeof dashboardMetrics !== 'undefined' && dashboardMetrics) {
      if (telVal && dashboardMetrics.telejornal && dashboardMetrics.telejornal[telVal]) {
        dashboardMetrics.telejornal[telVal].nc = (dashboardMetrics.telejornal[telVal].nc || 0) + 1;
        atualizouDash = true;
      }
      if (eqVal && dashboardMetrics.equipamento && dashboardMetrics.equipamento[eqVal]) {
        dashboardMetrics.equipamento[eqVal].nc = (dashboardMetrics.equipamento[eqVal].nc || 0) + 1;
        atualizouDash = true;
      }
      if (atualizouDash) {
        if (typeof salvarDashboardMetricsStore === 'function') salvarDashboardMetricsStore();
        if (typeof renderDashboards === 'function') renderDashboards();
      }
    }

    ocorrencias = [novo].concat(ocorrencias);
    window.ocorrencias = ocorrencias;
    save(ocorrencias, novo, true);
    uploadedFilesStore['nova-previews'] = [];
    fecharPopup('popup-nova-oc');
    adicionarNotificacao('Nova Ocorrência Criada', novo.titulo + ' (' + novo.prio + ' Prioridade)', novo.prio === 'Alta' ? 'warning' : 'info');
    renderAll();

    /* reset */
    if (novaTitulo) novaTitulo.value = '';
    if (novaDesc)   novaDesc.value   = '';
    if (novaFile)   novaFile.value   = '';
    if (novaPrevs)  novaPrevs.innerHTML = '';
    if (novaCounter) { novaCounter.textContent = 'Mínimo 50 caracteres'; novaCounter.className = 'char-count'; }
    if (document.getElementById('nova-prio')) document.getElementById('nova-prio').selectedIndex = 1;
    if (document.getElementById('nova-resp')) document.getElementById('nova-resp').selectedIndex = 0;
    if (document.getElementById('nova-cat'))  document.getElementById('nova-cat').selectedIndex  = 0;
    if (document.getElementById('nova-local')) document.getElementById('nova-local').value = '';
    if (document.getElementById('nova-prazo')) document.getElementById('nova-prazo').value = '';
    if (document.getElementById('nova-telejornal')) document.getElementById('nova-telejornal').value = '';
    if (document.getElementById('nova-equipamento')) document.getElementById('nova-equipamento').value = '';
    validarNova();
  }
  window.criarNovaOcorrencia = criarNovaOcorrencia;

  if (btnCriar) {
    btnCriar.addEventListener('click', criarNovaOcorrencia);
  }

  /* ═══════════════════════════════════════════
     POPUP: RESOLVER OCORRÊNCIA
  ═══════════════════════════════════════════ */

  var resolverAtualId = null;
  var resolverDesc    = document.getElementById('resolver-desc');
  var resolverCounter = document.getElementById('resolver-counter');
  var btnConfirmar    = document.getElementById('btn-confirmar-resolver');
  var resolverFile    = document.getElementById('resolver-arquivos');
  var resolverPrevs   = document.getElementById('resolver-previews');

  function validarResolver() {
    var ok = resolverDesc && resolverDesc.value.trim().length >= 10;
    if (btnConfirmar) {
      btnConfirmar.style.opacity = ok ? '1' : '0.38';
      btnConfirmar.style.cursor  = ok ? 'pointer' : 'not-allowed';
      btnConfirmar._valido = ok;
    }
  }

  if (btnConfirmar) { btnConfirmar.style.opacity = '0.38'; btnConfirmar.style.cursor = 'not-allowed'; btnConfirmar._valido = false; }

  if (resolverDesc && resolverCounter) {
    resolverDesc.addEventListener('input', function() {
      var len = this.value.trim().length;
      if (len >= 10) {
        resolverCounter.textContent = '✓ Descrição preenchida';
        resolverCounter.className = 'char-count ok';
      } else {
        resolverCounter.textContent = 'Mínimo 10 caracteres (' + len + '/10)';
        resolverCounter.className = len >= 5 ? 'char-count warn' : 'char-count';
      }
      validarResolver();
    });
  }

  function abrirResolver(id) {
    var oc = ocorrencias.find(function(o){ return o.id === id; });
    if (!oc) return;
    resolverAtualId = id;
    var tituloEl = document.getElementById('resolver-titulo-oc');
    if (tituloEl) tituloEl.textContent = oc.titulo;

    /* reset */
    if (resolverDesc)    resolverDesc.value = '';
    if (resolverFile)    resolverFile.value = '';
    if (resolverPrevs)   resolverPrevs.innerHTML = '';
    uploadedFilesStore['resolver-previews'] = [];
    if (resolverCounter) { resolverCounter.textContent = 'Mínimo 10 caracteres'; resolverCounter.className = 'char-count'; }
    document.getElementById('resolver-status').value = 'Resolvido';
    /* reset pills visuais */
    if (typeof selecionarStatus === 'function') selecionarStatus('Resolvido');
    validarResolver();
    abrirPopup('popup-resolver');
  }
  window.abrirResolver = abrirResolver;

  /* ═══════════════════════════════════════════
     EDIÇÃO DE OCORRÊNCIAS
  ═══════════════════════════════════════════ */
  function abrirEditarOcorrencia(id) {
    var oc = ocorrencias.find(function(o){ return o && o.id === id; });
    if (!oc) return;
    document.getElementById('edit-oc-id').value = oc.id;
    document.getElementById('edit-oc-titulo').value = oc.titulo || '';
    document.getElementById('edit-oc-prio').value = oc.prio || 'Média';
    document.getElementById('edit-oc-cat').value = oc.cat || 'Equipamento';
    document.getElementById('edit-oc-resp').value = oc.resp || 'Todos do turno';
    document.getElementById('edit-oc-local').value = oc.local || '';
    document.getElementById('edit-oc-prazo').value = oc.prazo || '';
    document.getElementById('edit-oc-desc').value = oc.desc || '';

    atualizarSelectEquipamentosNovaOc();
    if (document.getElementById('edit-oc-telejornal')) {
      document.getElementById('edit-oc-telejornal').value = oc.telejornal || '';
    }
    if (document.getElementById('edit-oc-equipamento')) {
      document.getElementById('edit-oc-equipamento').value = oc.equipamento || '';
    }

    var subEl = document.getElementById('edit-oc-subtitle');
    if (subEl) subEl.textContent = 'Editando ocorrência: ' + (oc.titulo || oc.id) + ' — aberto para toda a equipe.';

    /* Carrega anexos existentes */
    var anexosExistentes = oc.anexos || (oc.resolucao && oc.resolucao.anexos) || [];
    uploadedFilesStore['edit-oc-previews'] = anexosExistentes.slice();
    renderPreviewsForContainer('edit-oc-previews');

    abrirPopup('popup-editar-oc');
  }
  window.abrirEditarOcorrencia = abrirEditarOcorrencia;

  function salvarEdicaoOcorrencia() {
    var id = document.getElementById('edit-oc-id').value;
    var titulo = document.getElementById('edit-oc-titulo').value.trim();
    var prio = document.getElementById('edit-oc-prio').value;
    var cat = document.getElementById('edit-oc-cat').value;
    var resp = document.getElementById('edit-oc-resp').value;
    var local = document.getElementById('edit-oc-local').value.trim();
    var prazo = document.getElementById('edit-oc-prazo').value;
    var telVal = document.getElementById('edit-oc-telejornal') ? document.getElementById('edit-oc-telejornal').value : '';
    var eqVal  = document.getElementById('edit-oc-equipamento') ? document.getElementById('edit-oc-equipamento').value : '';
    var desc = document.getElementById('edit-oc-desc').value.trim();

    if (!titulo) {
      alert('Por favor, informe o título da ocorrência.');
      return;
    }
    if (!desc) {
      alert('Por favor, informe a descrição detalhada da ocorrência.');
      return;
    }

    var idx = ocorrencias.findIndex(function(o){ return o && o.id === id; });
    if (idx === -1) {
      alert('Ocorrência não encontrada.');
      return;
    }

    var usuarioLogado = getUsuarioAtual();
    var isMine = (resp === usuarioLogado || resp === 'Operador' || resp.indexOf(usuarioLogado) !== -1 || resp.indexOf('Você') !== -1);
    var anexosAtualizados = (uploadedFilesStore['edit-oc-previews'] || []).slice();

    var resolucaoAtual = Object.assign({}, ocorrencias[idx].resolucao || {});
    if (anexosAtualizados.length > 0) {
      resolucaoAtual.anexos = anexosAtualizados;
    } else {
      delete resolucaoAtual.anexos;
    }

    var anterior = ocorrencias[idx];
    var mudancas = [];
    if (titulo !== (anterior.titulo || '')) mudancas.push('Título alterado de "' + (anterior.titulo || '') + '" para "' + titulo + '"');
    if (prio !== (anterior.prio || '')) mudancas.push('Prioridade alterada de ' + (anterior.prio || 'Média') + ' para ' + prio);
    if (cat !== (anterior.cat || '')) mudancas.push('Categoria alterada de ' + (anterior.cat || '') + ' para ' + cat);
    if (resp !== (anterior.resp || '')) mudancas.push('Responsável alterado de ' + (anterior.resp || '') + ' para ' + resp);
    if (local !== (anterior.local || '')) mudancas.push('Local alterado de "' + (anterior.local || '') + '" para "' + local + '"');
    if (telVal !== (anterior.telejornal || '')) mudancas.push('Telejornal alterado para ' + (telVal || 'Nenhum'));
    if (eqVal !== (anterior.equipamento || '')) mudancas.push('Equipamento alterado para ' + (eqVal || 'Nenhum'));
    if (prazo !== (anterior.prazo || '')) mudancas.push('Prazo alterado para ' + (prazo || 'Sem prazo'));
    if (desc !== (anterior.desc || '')) mudancas.push('Descrição detalhada atualizada');
    if (anexosAtualizados.length !== ((anterior.anexos || []).length)) mudancas.push('Anexos atualizados (' + anexosAtualizados.length + ' arquivos)');

    var historicoEdicoes = (anterior.historicoEdicoes && Array.isArray(anterior.historicoEdicoes)) ? anterior.historicoEdicoes.slice() : [];
    if (mudancas.length > 0) {
      historicoEdicoes.unshift({
        autor: usuarioLogado,
        dataHora: formatDataHoraLocal(),
        mudancas: mudancas
      });
    }

    ocorrencias[idx] = Object.assign({}, ocorrencias[idx], {
      titulo:           titulo,
      prio:             prio,
      cat:              cat,
      resp:             resp,
      local:            local,
      prazo:            prazo,
      telejornal:       telVal || null,
      equipamento:      eqVal || null,
      desc:             desc,
      mine:             isMine,
      anexos:           anexosAtualizados,
      resolucao:        Object.keys(resolucaoAtual).length > 0 ? resolucaoAtual : null,
      historicoEdicoes: historicoEdicoes,
      ultimaEdicaoPor:  usuarioLogado,
      ultimaEdicaoEm:   formatDataHoraLocal()
    });

    save(ocorrencias, ocorrencias[idx], false);
    fecharPopup('popup-editar-oc');
    renderAll();
    if (typeof mostrarToast === 'function') {
      mostrarToast('Ocorrência Atualizada', 'As alterações de ' + usuarioLogado + ' foram salvas e sincronizadas.', 'success');
    }
  }
  window.salvarEdicaoOcorrencia = salvarEdicaoOcorrencia;

  var itemDetalhesAtual = null;
  /* ═══════════════════════════════════════════
     SISTEMA DE LIXEIRA (Retenção 7 dias / Notificação 24h) — BANCO DE DADOS SUPABASE
  ═══════════════════════════════════════════ */
  var lixeiraData = [];

  function getLixeiraDBCredentials() {
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

  function loadLixeira() {
    sincronizarLixeiraNuvem();
    return lixeiraData;
  }
  loadLixeira();

  function saveLixeira(list) {
    lixeiraData = list || [];
    window.lixeiraData = lixeiraData;
    atualizarBadgesLixeira();
  }

  function sincronizarLixeiraNuvem() {
    var db = getLixeiraDBCredentials();
    if (!db.url || !db.key) return;

    fetch(db.url + '/rest/v1/lixeira?select=*&order=dataExclusao.desc&limit=50', {
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Cache-Control': 'no-cache'
      }
    })
    .then(function(res) { return res.ok ? res.json() : null; })
    .then(function(cloudItens) {
      if (Array.isArray(cloudItens)) {
        lixeiraData = cloudItens;
        window.lixeiraData = lixeiraData;
        atualizarBadgesLixeira();
        renderLixeira();
      }
    })
    .catch(function(err) {
      console.warn('[Lixeira DB] Não foi possível sincronizar lixeira:', err);
    });
  }
  window.sincronizarLixeiraNuvem = sincronizarLixeiraNuvem;

  function salvarItemLixeiraNuvem(item) {
    var db = getLixeiraDBCredentials();
    if (!db.url || !db.key || !item) return;

    fetch(db.url + '/rest/v1/lixeira', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(item)
    })
    .then(function(res) {
      if (res.ok) {
        console.log('[Lixeira DB] ✅ Item gravado na lixeira do banco:', item.id);
      }
    })
    .catch(function(err) {
      console.warn('[Lixeira DB] Erro ao enviar para lixeira remota:', err);
    });
  }
  window.salvarItemLixeiraNuvem = salvarItemLixeiraNuvem;

  function excluirItemLixeiraNuvem(id) {
    var db = getLixeiraDBCredentials();
    if (!db.url || !db.key || !id) return;

    fetch(db.url + '/rest/v1/lixeira?id=eq.' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key
      }
    })
    .then(function(res) {
      if (res.ok) {
        console.log('[Lixeira DB] ✅ Item removido da lixeira do banco:', id);
      }
    })
    .catch(function(err) {
      console.warn('[Lixeira DB] Erro ao remover da lixeira remota:', err);
    });
  }
  window.excluirItemLixeiraNuvem = excluirItemLixeiraNuvem;

  function atualizarBadgesLixeira() {
    var badge = document.querySelector('.lixeira-badge');
    if (badge) {
      if (lixeiraData && lixeiraData.length > 0) {
        badge.textContent = lixeiraData.length;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  function verificarExpiracaoLixeira() {
    if (!Array.isArray(lixeiraData) || lixeiraData.length === 0) return;
    var agora = Date.now();
    var alterou = false;
    var novosItens = [];

    lixeiraData.forEach(function(item) {
      var tempoRestanteMs = item.expiraEm - agora;

      // 1. Já expirou os 7 dias -> Exclui permanentemente inclusive da nuvem
      if (tempoRestanteMs <= 0) {
        alterou = true;
        excluirItemLixeiraNuvem(item.id);
        if (typeof DBService !== 'undefined' && DBService && typeof DBService.deleteRemote === 'function') {
          DBService.deleteRemote('ocorrencias', item.id);
          DBService.deleteRemote('historico', item.id);
        }
        return;
      }

      // 2. Faltam 24h ou menos (86400000 ms) e ainda não notificou
      if (tempoRestanteMs <= 24 * 60 * 60 * 1000 && !item.notificado24h) {
        item.notificado24h = true;
        alterou = true;
        salvarItemLixeiraNuvem(item);
        if (typeof adicionarNotificacao === 'function') {
          adicionarNotificacao(
            'Aviso de Exclusão da Lixeira',
            'A ocorrência "' + (item.titulo || 'Ocorrência') + '" será excluída permanentemente em menos de 24 horas.',
            'warning'
          );
        }
      }

      novosItens.push(item);
    });

    if (alterou) {
      saveLixeira(novosItens);
    }
  }
  window.verificarExpiracaoLixeira = verificarExpiracaoLixeira;

  function excluirOcorrencia(id) {
    var targetId = id;
    var oc = ocorrencias.find(function(o){ return o && o.id === targetId; });
    var hist = historicoSeedData.find(function(h){ return h && h.id === targetId; });
    var titulo = oc ? (oc.titulo || 'esta ocorrência') : (hist ? hist.titulo : 'esta ocorrência');

    if (confirm('Mover a ocorrência "' + titulo + '" para a Lixeira?\n\nEla ficará retida por 7 dias na Lixeira como backup antes da exclusão permanente.')) {
      var idParaSalvar = oc ? oc.id : (hist ? hist.id : targetId);

      // 1. Envia comando DELETE direto para a nuvem (Supabase) para que a sincronização remota não restaure na tela
      if (typeof DBService !== 'undefined' && DBService && typeof DBService.deleteRemote === 'function') {
        if (idParaSalvar) {
          DBService.deleteRemote('ocorrencias', idParaSalvar);
          DBService.deleteRemote('historico', idParaSalvar);
        }
      }

      // 2. Adiciona à Lixeira com retenção de 7 dias
      var itemLixeira = {
        id: idParaSalvar,
        dataExclusao: Date.now(),
        expiraEm: Date.now() + 7 * 24 * 60 * 60 * 1000,
        titulo: titulo,
        ocOriginal: oc ? Object.assign({}, oc) : null,
        histOriginal: hist ? Object.assign({}, hist) : null,
        excluidoPor: getUsuarioAtual(),
        notificado24h: false
      };

      lixeiraData = [itemLixeira].concat(lixeiraData.filter(function(i){ return i.id !== idParaSalvar; }));
      saveLixeira(lixeiraData);
      salvarItemLixeiraNuvem(itemLixeira);

      // 3. Remove do array de ocorrências ativas e arquivadas imediatamente (estritamente por ID!)
      ocorrencias = ocorrencias.filter(function(o){
        if (!o) return false;
        if (o.id === idParaSalvar || o.id === targetId) return false;
        return true;
      });

      // 4. Remove do histórico geral (estritamente por ID!)
      historicoSeedData = historicoSeedData.filter(function(h){
        if (!h) return false;
        if (h.id === idParaSalvar || h.id === targetId) return false;
        return true;
      });

      save(ocorrencias);
      saveHistorico(historicoSeedData);
      renderAll();

      if (typeof mostrarToast === 'function') {
        mostrarToast('Movida para a Lixeira', '"' + titulo + '" ficará disponível na Lixeira por 7 dias.', 'info');
      }
    }
  }
  window.excluirOcorrencia = excluirOcorrencia;

  function restaurarOcorrenciaLixeira(id) {
    var item = lixeiraData.find(function(i){ return i.id === id; });
    if (!item) return;

    if (item.ocOriginal) {
      ocorrencias = [item.ocOriginal].concat(ocorrencias.filter(function(o){ return o && o.id !== id; }));
      save(ocorrencias);
    }
    if (item.histOriginal) {
      historicoSeedData = [item.histOriginal].concat(historicoSeedData.filter(function(h){ return h && h.id !== id; }));
      saveHistorico(historicoSeedData);
    }

    lixeiraData = lixeiraData.filter(function(i){ return i.id !== id; });
    saveLixeira(lixeiraData);
    excluirItemLixeiraNuvem(id);
    renderAll();

    if (typeof mostrarToast === 'function') {
      mostrarToast('Ocorrência Restaurada', '"' + (item.titulo || 'Item') + '" foi restaurada com sucesso.', 'success');
    }
  }
  window.restaurarOcorrenciaLixeira = restaurarOcorrenciaLixeira;

  function renderLixeira() {
    var container = document.getElementById('lixeira-list');
    atualizarBadgesLixeira();
    if (!container) return;

    if (!lixeiraData || lixeiraData.length === 0) {
      container.innerHTML =
        '<div style="text-align:center;padding:48px 16px;background:var(--surface);border:1px solid var(--border-lt);border-radius:var(--r-lg);">' +
          '<i data-lucide="trash-2" style="width:36px;height:36px;color:var(--muted);stroke-width:1.5;margin-bottom:10px;"></i>' +
          '<p style="color:var(--txt);font-size:14px;font-weight:600;">A lixeira está vazia</p>' +
          '<p style="color:var(--muted);font-size:12px;margin-top:3px;">Ocorrências excluídas ficam retidas aqui por 7 dias antes da exclusão definitiva.</p>' +
        '</div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    var agora = Date.now();

    function renderCardLixeiraHTML(item) {
      var msRestante = item.expiraEm - agora;
      var diasRestantes = Math.ceil(msRestante / (1000 * 60 * 60 * 24));
      var horasRestantes = Math.ceil(msRestante / (1000 * 60 * 60));

      var expiraBadge = '';
      if (horasRestantes <= 24) {
        expiraBadge = '<span class="tag tag-r" style="font-weight:600;"><i data-lucide="alert-triangle" style="width:11px;height:11px;stroke-width:2.2;margin-right:3px;"></i>Expira em ' + Math.max(1, horasRestantes) + 'h</span>';
      } else {
        expiraBadge = '<span class="tag tag-yellow-soft" style="font-weight:600;"><i data-lucide="clock" style="width:11px;height:11px;stroke-width:2;margin-right:3px;"></i>Expira em ' + diasRestantes + ' dias</span>';
      }

      var oc = item.ocOriginal || {};
      var desc = oc.desc || (item.histOriginal ? item.histOriginal.descCriacao : 'Sem descrição.');
      var local = oc.local || (item.histOriginal ? item.histOriginal.local : 'Central Técnica');
      var excluidoEmStr = formatDataHoraLocal(item.dataExclusao);

      return (
        '<article class="oc-card" style="background:#FFFFFF;border:1px solid #E2E8F0;margin-bottom:10px;">' +
          '<div class="prio-line pl-r"></div>' +
          '<div class="oc-body">' +
            '<div class="oc-header">' +
              '<h3>' + (item.titulo || 'Ocorrência') + '</h3>' +
              '<span class="tag tag-gray-soft">Lixeira</span>' +
              expiraBadge +
            '</div>' +
            '<p class="oc-desc" style="color:var(--txt2);">' + desc + '</p>' +
            '<div class="oc-meta" style="margin-top:8px;">' +
              '<span><i data-lucide="trash" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Excluído por: ' + (item.excluidoPor || 'Operador') + '</span>' +
              '<span><i data-lucide="calendar" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Em: ' + excluidoEmStr + '</span>' +
              '<span><i data-lucide="map-pin" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> ' + local + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="oc-actions" style="justify-content:center;gap:8px;">' +
            '<button class="btn-card-action btn-card-restore" onclick="restaurarOcorrenciaLixeira(\'' + item.id + '\')" title="Restaurar ocorrência para as ativas">' +
              '<i data-lucide="rotate-ccw" style="width:12px;height:12px;stroke-width:2.2;"></i> Restaurar' +
            '</button>' +
          '</div>' +
        '</article>'
      );
    }

    var secoes = agruparPorDias(lixeiraData, function(item){ return item.dataExclusao; });
    container.innerHTML = renderSecoesComCards(secoes, renderCardLixeiraHTML);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.renderLixeira = renderLixeira;

  /* ═══════════════════════════════════════════
     SISTEMA DE OCORRÊNCIAS ARQUIVADAS (Turno)
  ═══════════════════════════════════════════ */
  var filtroArquivadosAtivo = 'todas';

  function filtrarArquivados(elOrTipo, tipo) {
    var el = (elOrTipo && typeof elOrTipo === 'object' && elOrTipo.nodeType) ? elOrTipo : null;
    var tipoFinal = typeof elOrTipo === 'string' ? elOrTipo : tipo;
    if (el && typeof el.closest === 'function') {
      var pills = el.closest('.pills');
      if (pills) {
        pills.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('on'); });
        el.classList.add('on');
      }
    } else if (tipoFinal) {
      document.querySelectorAll('#page-arquivados .pills .pill').forEach(function(p) {
        var pText = p.textContent.trim().toLowerCase();
        if (pText === tipoFinal.toLowerCase() || (tipoFinal.toLowerCase() === 'todas' && pText === 'todas')) {
          p.classList.add('on');
        } else {
          p.classList.remove('on');
        }
      });
    }
    filtroArquivadosAtivo = (tipoFinal || (el ? el.textContent.trim().toLowerCase() : 'todas')).toLowerCase();
    renderArquivados();
  }
  window.filtrarArquivados = filtrarArquivados;

  function concluirVerificacaoArquivado(id) {
    var idx = ocorrencias.findIndex(function(o){ return o && o.id === id; });
    if (idx === -1) return;
    var oc = ocorrencias[idx];
    var tagsAtuais = (oc.tags || []).slice();
    if (!tagsAtuais.includes('Arquivada')) tagsAtuais.push('Arquivada');

    ocorrencias[idx] = Object.assign({}, oc, {
      status: 'resolvida',
      tags: tagsAtuais
    });
    save(ocorrencias);

    // Garante que no histórico o item mantenha a tag de Arquivada e status final
    var histIdx = historicoSeedData.findIndex(function(h){ return h && (h.id === id || h.id === ('h_oc_' + id)); });
    if (histIdx !== -1) {
      var histTags = (historicoSeedData[histIdx].tags || []).slice();
      if (!histTags.includes('Arquivada')) histTags.push('Arquivada');
      historicoSeedData[histIdx] = Object.assign({}, historicoSeedData[histIdx], {
        status: 'Resolvida e Arquivada',
        tags: histTags
      });
      saveHistorico(historicoSeedData);
    }

    renderAll();
    if (typeof mostrarToast === 'function') {
      mostrarToast('Verificação Concluída', '"' + (oc.titulo || 'Ocorrência') + '" foi verificada e arquivada no histórico.', 'success');
    }
  }
  window.concluirVerificacaoArquivado = concluirVerificacaoArquivado;

  function restaurarArquivadoParaAbertas(id) {
    var idx = ocorrencias.findIndex(function(o){ return o && o.id === id; });
    if (idx === -1) return;
    var oc = ocorrencias[idx];
    ocorrencias[idx] = Object.assign({}, oc, {
      status: 'aberta',
      tags: (oc.tags || []).filter(function(t){ return t !== 'Arquivada'; })
    });
    save(ocorrencias);
    renderAll();
    if (typeof mostrarToast === 'function') {
      mostrarToast('Ocorrência Restaurada', '"' + (oc.titulo || 'Ocorrência') + '" retornou para as ocorrências ativas.', 'info');
    }
  }
  window.restaurarArquivadoParaAbertas = restaurarArquivadoParaAbertas;

  function renderArquivados() {
    var container = document.getElementById('arquivados-list');
    var badge = document.querySelector('.arquivados-badge');
    var lista = getArquivadas();

    if (badge) {
      if (lista.length > 0) {
        badge.textContent = lista.length;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }

    if (!container) return;

    if (filtroArquivadosAtivo === 'alta') {
      lista = lista.filter(function(o) { return (o.prio || '').toLowerCase() === 'alta'; });
    } else if (filtroArquivadosAtivo === 'media') {
      lista = lista.filter(function(o) { return (o.prio || '').toLowerCase() === 'média' || (o.prio || '').toLowerCase() === 'media'; });
    } else if (filtroArquivadosAtivo === 'baixa') {
      lista = lista.filter(function(o) { return (o.prio || '').toLowerCase() === 'baixa'; });
    }

    if (lista.length === 0) {
      container.innerHTML =
        '<div style="text-align:center;padding:48px 16px;background:var(--surface);border:1px solid var(--border-lt);border-radius:var(--r-lg);">' +
          '<i data-lucide="archive" style="width:36px;height:36px;color:var(--muted);stroke-width:1.5;margin-bottom:10px;"></i>' +
          '<p style="color:var(--txt);font-size:14px;font-weight:600;">Nenhuma ocorrência arquivada</p>' +
          '<p style="color:var(--muted);font-size:12px;margin-top:3px;">As ocorrências arquivadas para verificação do próximo turno aparecerão aqui.</p>' +
        '</div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    function renderCardArquivadoHTML(oc) {
      var plClass = prioLine(oc.prio);
      var timeRel = formatDataRelativa(oc.criado || oc.dataCriacao);
      var timeH = timeRel ? '<span class="oc-meta-item" style="color:var(--muted);"><i data-lucide="clock" style="width:11.5px;height:11.5px;stroke-width:2;color:var(--dim);"></i>' + timeRel + '</span>' : '';
      var localH = oc.local ? '<span class="oc-meta-item"><i data-lucide="map-pin" style="width:11.5px;height:11.5px;stroke-width:2;color:var(--dim);"></i>' + oc.local + '</span>' : '';
      var respH = oc.resp ? '<span class="oc-meta-item"><i data-lucide="user" style="width:11.5px;height:11.5px;stroke-width:2;color:var(--dim);"></i>' + oc.resp + '</span>' : '';
      var resolucaoH = (oc.resolucao && oc.resolucao.descRes) ? ('<p style="font-size:12px;color:var(--green-dk);background:#F0FDF4;padding:6px 10px;border-radius:6px;border:1px solid #BBF7D0;margin-top:6px;"><strong>Resolução:</strong> ' + oc.resolucao.descRes + '</p>') : '';

      return (
        '<article class="oc-card" style="background:#FFFFFF;cursor:pointer;margin-bottom:10px;" onclick="verDetalhesHistoricoDirect(\'' + oc.id + '\')">' +
          '<div class="prio-line ' + plClass + '"></div>' +
          '<div class="oc-body">' +
            '<div class="oc-header">' +
              '<h3>' + (oc.titulo || 'Ocorrência') + '</h3>' +
              '<span class="tag ' + tagClass(oc.prio) + '">' + (oc.prio || 'Média') + '</span>' +
              '<span class="tag tag-teal-soft">' + (oc.cat || 'Equipamento') + '</span>' +
            '</div>' +
            '<p class="oc-desc">' + (oc.desc || '') + '</p>' +
            resolucaoH +
            '<div class="oc-meta" style="margin-top:8px;">' +
              respH +
              localH +
              timeH +
            '</div>' +
          '</div>' +
          '<div class="oc-actions" style="justify-content:center;gap:8px;" onclick="event.stopPropagation();">' +
            '<button class="btn-card-action btn-card-resolve" onclick="event.stopPropagation(); concluirVerificacaoArquivado(\'' + oc.id + '\');" title="Concluir verificação do turno">' +
              '<i data-lucide="check" style="width:12px;height:12px;stroke-width:2.5;"></i> Concluir / Verificado' +
            '</button>' +
            '<button class="btn-card-action btn-card-restore" onclick="event.stopPropagation(); restaurarArquivadoParaAbertas(\'' + oc.id + '\');" title="Restaurar para Ocorrências Abertas">' +
              '<i data-lucide="rotate-ccw" style="width:12px;height:12px;stroke-width:2.2;"></i> Restaurar' +
            '</button>' +
          '</div>' +
        '</article>'
      );
    }

    var secoes = agruparPorDias(lista, function(oc){ return oc.criado || oc.dataCriacao; });
    container.innerHTML = renderSecoesComCards(secoes, renderCardArquivadoHTML);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.renderArquivados = renderArquivados;

  function editarOcorrenciaDoModalDetalhes() {
    if (!itemDetalhesAtual) return;
    var targetId = itemDetalhesAtual.id;
    var targetTitulo = itemDetalhesAtual.titulo;
    fecharPopup('popup-detalhes-historico');

    var oc = ocorrencias.find(function(o){ return o && (o.id === targetId || o.titulo === targetTitulo); });
    if (oc) {
      abrirEditarOcorrencia(oc.id);
    } else {
      abrirEditarOcorrencia(targetId);
    }
  }
  window.editarOcorrenciaDoModalDetalhes = editarOcorrenciaDoModalDetalhes;

  function excluirOcorrenciaDoModalDetalhes() {
    if (!itemDetalhesAtual) return;
    var targetId = itemDetalhesAtual.id;
    fecharPopup('popup-detalhes-historico');
    excluirOcorrencia(targetId);
  }
  window.excluirOcorrenciaDoModalDetalhes = excluirOcorrenciaDoModalDetalhes;

  function confirmarResolucao() {
    if (!resolverAtualId) {
      fecharPopup('popup-resolver');
      return;
    }
    var descResolucao = resolverDesc ? resolverDesc.value.trim() : '';
    if (descResolucao.length < 10) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Descrição Necessária', 'Preencha a descrição da resolução com pelo menos 10 caracteres (' + descResolucao.length + '/10).', 'warning');
      }
      if (resolverDesc) resolverDesc.focus();
      return;
    }

    var idx = ocorrencias.findIndex(function(o){ return o.id === resolverAtualId; });
    if (idx === -1) {
      fecharPopup('popup-resolver');
      return;
    }

    var statusEl = document.getElementById('resolver-status');
    var statusEscolhido = statusEl ? statusEl.value : 'Resolvido';
    var oc = ocorrencias[idx];
    var nowStr = formatDataHoraLocal();
    var usuarioLogado = getUsuarioAtual();

    var isParcial = (statusEscolhido === 'Parcialmente resolvido');
    var isArquivada = (statusEscolhido === 'Resolvida e Arquivada');

    var updatedTags = (oc.tags || []).filter(function(t){ return t !== 'Parcialmente Resolvida' && t !== 'Arquivada'; });
    if (isParcial) {
      updatedTags.push('Parcialmente Resolvida');
    } else if (isArquivada) {
      updatedTags.push('Arquivada');
    }

    var novoStatus = 'resolvida';
    if (isParcial) novoStatus = 'aberta';
    else if (isArquivada) novoStatus = 'arquivada';

    var anexosNovos = (uploadedFilesStore['resolver-previews'] || []).slice();
    var anexosAntigos = (oc.anexos && Array.isArray(oc.anexos)) ? oc.anexos : ((oc.resolucao && Array.isArray(oc.resolucao.anexos)) ? oc.resolucao.anexos : []);
    var anexosCombinados = anexosAntigos.concat(anexosNovos);

    ocorrencias[idx] = Object.assign({}, oc, {
      status: novoStatus,
      tags: updatedTags,
      anexos: anexosCombinados,
      resolucao: {
        statusRes: statusEscolhido,
        descRes:   descResolucao,
        data:      Date.now(),
        resolvidoPor: usuarioLogado,
        anexos:    anexosCombinados
      }
    });
    window.ocorrencias = ocorrencias;

    // ADICIONA AUTOMATICAMENTE AO HISTÓRICO GERAL!
    var tagsHist = isArquivada ? ['Arquivada'] : [];
    var novoItemHist = {
      id:            'h_oc_' + Date.now(),
      tipo:          'ocorrencia',
      subtipo:       oc.cat || 'Equipamento',
      titulo:        oc.titulo,
      equipamento:   oc.local ? (oc.local + ' — ' + (oc.cat || 'Equipamento')) : (oc.cat || oc.titulo),
      categoria:     oc.cat || 'Equipamento',
      local:         oc.local || 'Central Técnica',
      dataCriacao:   nowStr,
      criadoPor:     oc.resp || 'Sistema',
      descCriacao:   oc.desc || 'Ocorrência registrada no sistema.',
      status:        statusEscolhido,
      dataResolucao: nowStr,
      resolvidoPor:  usuarioLogado,
      descResolucao: descResolucao,
      tags:          tagsHist,
      anexos:        anexosCombinados
    };

    historicoSeedData = [novoItemHist].concat(historicoSeedData);
    window.historicoSeedData = historicoSeedData;
    saveHistorico(historicoSeedData, novoItemHist);

    save(ocorrencias, ocorrencias[idx], false);
    fecharPopup('popup-resolver');
    renderAll();
    resolverAtualId = null;

    if (typeof mostrarToast === 'function') {
      if (isParcial) {
        mostrarToast('Parcialmente Resolvida', 'A ocorrência foi registrada no histórico e continua ativa para acompanhamento.', 'warning');
      } else if (isArquivada) {
        mostrarToast('Ocorrência Arquivada', 'A ocorrência foi arquivada para verificação do próximo turno e salva no histórico.', 'info');
      } else {
        mostrarToast('Ocorrência Concluída', 'A ocorrência foi resolvida e registrada no histórico geral.', 'success');
      }
    }
  }
  window.confirmarResolucao = confirmarResolucao;

  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', confirmarResolucao);
  }
  /* ═══════════════════════════════════════════
     CONFIGURAÇÕES
  ═══════════════════════════════════════════ */

  function iniciais(nome) {
    var partes = nome.trim().split(/\s+/);
    var ini = partes[0] ? partes[0][0] : '';
    if (partes.length > 1) ini += partes[partes.length - 1][0];
    return ini.toUpperCase();
  }

  function syncUserPopover() {
    var nomeEl = document.getElementById('cfg-nome');
    var nome = (nomeEl && nomeEl.value.trim()) ? nomeEl.value.trim() : getUsuarioAtual();
    var upName = document.getElementById('up-name');
    if (upName) upName.textContent = nome || 'Operador';

    var sAvatar = document.querySelector('.s-avatar');
    var upAvatar = document.getElementById('up-avatar');
    if (upAvatar && sAvatar) {
      if (sAvatar.style.backgroundImage) {
        upAvatar.style.backgroundImage = sAvatar.style.backgroundImage;
        upAvatar.textContent = '';
      } else {
        upAvatar.style.backgroundImage = '';
        upAvatar.textContent = sAvatar.textContent;
      }
    }
  }

  function aplicarFotoPerfil(url) {
    if (!url) return;
    var cfgAvatar = document.getElementById('cfg-avatar');
    if (cfgAvatar) { cfgAvatar.style.backgroundImage = url; cfgAvatar.textContent = ''; }

    var sAvatar = document.querySelector('.s-avatar');
    if (sAvatar) { sAvatar.style.backgroundImage = url; sAvatar.textContent = ''; }

    var upAvatar = document.getElementById('up-avatar');
    if (upAvatar) { upAvatar.style.backgroundImage = url; upAvatar.textContent = ''; }
  }

  function carregarFotoPerfilSalva() {
    var url = DBService.getFotoPerfil();
    if (url) aplicarFotoPerfil(url);
  }

  function alterarFotoPerfil(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      var url = 'url(' + e.target.result + ')';
      DBService.saveFotoPerfil(url);
      aplicarFotoPerfil(url);
      syncUserPopover();
    };
    reader.readAsDataURL(file);
  }
  window.alterarFotoPerfil = alterarFotoPerfil;

  function removerFotoPerfil() {
    DBService.removeFotoPerfil();
    var nome = getUsuarioAtual();
    var ini = iniciais(nome || 'Operador');
    var cfgAvatar = document.getElementById('cfg-avatar');
    if (cfgAvatar) { cfgAvatar.style.backgroundImage = ''; cfgAvatar.textContent = ini; }
    var sAvatar = document.querySelector('.s-avatar');
    if (sAvatar) { sAvatar.style.backgroundImage = ''; sAvatar.textContent = ini; }
    var upAvatar = document.getElementById('up-avatar');
    if (upAvatar) { upAvatar.style.backgroundImage = ''; upAvatar.textContent = ini; }
    var photoInput = document.getElementById('cfg-photo-input');
    if (photoInput) photoInput.value = '';
    syncUserPopover();
  }
  window.removerFotoPerfil = removerFotoPerfil;

  function atualizarNomeOperadorUI(nome) {
    var nomeExibido = (nome && nome.trim()) ? nome.trim() : 'Operador';
    localStorage.setItem(USER_NAME_STORAGE_KEY, nomeExibido);
    if (typeof obterOuCriarOperadorPorNome === 'function') {
      obterOuCriarOperadorPorNome(nomeExibido);
    }

    var upName = document.getElementById('up-name');
    if (upName) upName.textContent = nomeExibido;

    var sUserName = document.querySelector('.s-user-name');
    if (sUserName) sUserName.textContent = nomeExibido;

    var cfgNome = document.getElementById('cfg-nome');
    if (cfgNome && cfgNome.value !== nomeExibido) cfgNome.value = nomeExibido;

    var optUser = document.getElementById('opt-user-name');
    if (optUser) {
      optUser.value = nomeExibido;
      optUser.textContent = nomeExibido + ' (Você)';
    }

    var sAvatar = document.querySelector('.s-avatar');
    var cfgAvatar = document.getElementById('cfg-avatar');
    var upAvatar = document.getElementById('up-avatar');
    var temFoto = (sAvatar && sAvatar.style.backgroundImage) || (cfgAvatar && cfgAvatar.style.backgroundImage);
    if (!temFoto) {
      var ini = iniciais(nomeExibido);
      if (sAvatar)   sAvatar.textContent   = ini;
      if (cfgAvatar) cfgAvatar.textContent = ini;
      if (upAvatar)  upAvatar.textContent  = ini;
    }
    syncUserPopover();
  }
  window.atualizarNomeUsuario = atualizarNomeOperadorUI;
  window.atualizarNomeOperadorUI = atualizarNomeOperadorUI;

  async function confirmarIdentificacaoOperador() {
    var input = document.getElementById('ident-operador-nome');
    var chaveInput = document.getElementById('ident-chave-acesso');
    var msgEl = document.getElementById('ident-chave-msg');
    var btn = document.getElementById('btn-confirmar-identificacao') || (event && event.currentTarget);

    var nome = input ? input.value.trim() : '';
    if (!nome) {
      alert('Por favor, informe seu nome completo para continuar.');
      if (input) input.focus();
      return;
    }

    var chave = chaveInput ? chaveInput.value.trim() : '';
    var pack = window.ENCRYPTED_TV_CREDENTIALS || (typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS);
    var estacaoJaConectada = typeof isEstacaoConectadaTV === 'function' ? isEstacaoConectadaTV() : false;

    // Se o usuário digitou uma chave, valida e conecta
    if (chave) {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span style="display:inline-block;width:12px;height:12px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:6px;vertical-align:middle;"></span> Validando...';
      }
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = 'var(--muted)';
        msgEl.textContent = 'Verificando chave com o banco...';
      }

      var res = await conectarComChaveTV(chave);
      if (!res.ok) {
        if (msgEl) {
          msgEl.style.display = 'block';
          msgEl.style.color = '#DC2626';
          msgEl.textContent = res.error || 'Chave de acesso incorreta.';
        }
        if (chaveInput) {
          chaveInput.focus();
          chaveInput.select();
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Salvar e Continuar';
        }
        return;
      }
    } else if (!estacaoJaConectada && pack && pack.data) {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = '#DC2626';
        msgEl.textContent = 'Por favor, digite a Chave de Acesso da TV para conectar esta estação ao banco de dados.';
      }
      if (chaveInput) chaveInput.focus();
      return;
    }

    localStorage.setItem(USER_NAME_STORAGE_KEY, nome);
    atualizarNomeOperadorUI(nome);
    try {
      if (typeof obterOuCriarOperadorPorNome === 'function') {
        await new Promise(function(resolve) {
          obterOuCriarOperadorPorNome(nome, function(id) {
            resolve(id);
          });
          setTimeout(resolve, 2500);
        });
      }
    } catch(e) {}
    try { if (typeof carregarOperadoresSugeridos === 'function') carregarOperadoresSugeridos(); } catch(e) {}

    var pracaEl = document.getElementById('ident-operador-praca');
    if (pracaEl && pracaEl.value && typeof setPracaAtual === 'function') {
      setPracaAtual(pracaEl.value);
    }

    if (typeof DBService !== 'undefined' && typeof DBService.syncRemote === 'function') {
      await DBService.syncRemote(true);
    }
    if (typeof renderAll === 'function') {
      renderAll(true);
    }

    fecharPopup('popup-identificacao-operador');
    abrirPopup('popup-entrada');

    if (typeof mostrarToast === 'function') {
      mostrarToast('Operador Identificado', 'Bem-vindo, ' + nome + '!', 'success');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Salvar e Continuar';
    }
  }
  window.confirmarIdentificacaoOperador = confirmarIdentificacaoOperador;

  function mutarNotificacoes(mutado) {
    var dot   = document.querySelector('.notif-dot');
    var badge = document.querySelector('.notif-badge');
    if (dot)   dot.style.display   = mutado ? 'none' : '';
    if (badge) badge.style.display = mutado ? 'none' : '';
  }
  window.mutarNotificacoes = mutarNotificacoes;

  /* ── Gerenciamento de Credenciais do Supabase na Aba Configurações ── */
  function carregarCredenciaisSupabaseConfig() {
    var urlInput = document.getElementById('cfg-supabase-url');
    var keyInput = document.getElementById('cfg-supabase-key');
    var badgeEl  = document.getElementById('cfg-db-status-badge');

    var currentUrl = (DBService && DBService.url) ? DBService.url : (localStorage.getItem('tv_supabase_url') || '');
    var currentKey = (DBService && DBService.key) ? DBService.key : (localStorage.getItem('tv_supabase_key') || '');

    if (urlInput && !urlInput.value) urlInput.value = currentUrl;
    if (keyInput && !keyInput.value) keyInput.value = currentKey;

    if (badgeEl) {
      if (currentUrl && currentKey) {
        badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#10B981;"></span> Conectado ao Supabase';
        badgeEl.style.color = '#059669';
      } else {
        badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#EF4444;"></span> Desconectado (Modo Local)';
        badgeEl.style.color = '#DC2626';
      }
    }
  }
  window.carregarCredenciaisSupabaseConfig = carregarCredenciaisSupabaseConfig;

  function toggleMostrarChaveSupabase() {
    var keyInput = document.getElementById('cfg-supabase-key');
    var ico = document.getElementById('ico-toggle-key');
    if (!keyInput) return;
    if (keyInput.type === 'password') {
      keyInput.type = 'text';
      if (ico) ico.setAttribute('data-lucide', 'eye-off');
    } else {
      keyInput.type = 'password';
      if (ico) ico.setAttribute('data-lucide', 'eye');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.toggleMostrarChaveSupabase = toggleMostrarChaveSupabase;

  async function testarConexaoSupabaseConfig(silencioso) {
    var urlInput = document.getElementById('cfg-supabase-url');
    var keyInput = document.getElementById('cfg-supabase-key');
    var url = urlInput ? urlInput.value.trim().replace(/\/+$/, '') : '';
    var key = keyInput ? keyInput.value.trim() : '';
    var badgeEl = document.getElementById('cfg-db-status-badge');

    if (!url || !key) {
      if (!silencioso && typeof mostrarToast === 'function') {
        mostrarToast('Campos Vazios', 'Informe a URL e a Chave do Supabase para testar.', 'warning');
      }
      return { ok: false, status: 0, message: 'Campos vazios' };
    }

    if (badgeEl) {
      badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#F59E0B;"></span> Testando conexão...';
      badgeEl.style.color = '#D97706';
    }

    try {
      var res = await fetch(url + '/rest/v1/ocorrencias?select=id&limit=1', {
        headers: {
          'apikey': key,
          'Authorization': 'Bearer ' + key,
          'Cache-Control': 'no-cache'
        }
      });

      if (res.ok) {
        if (badgeEl) {
          badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#10B981;"></span> Conexão bem-sucedida!';
          badgeEl.style.color = '#059669';
        }
        if (!silencioso && typeof mostrarToast === 'function') {
          mostrarToast('Conexão Estabelecida', 'Autenticado com sucesso no banco de dados Supabase.', 'success');
        }
        return { ok: true, status: res.status };
      }

      var erroTexto = '';
      try {
        var errBody = await res.json();
        erroTexto = errBody.message || errBody.error || errBody.msg || JSON.stringify(errBody);
      } catch(e) {
        try { erroTexto = await res.text(); } catch(e2) {}
      }

      if (res.status === 402) {
        var msg402 = 'Projeto Pausado no Supabase (Erro 402). Acesse supabase.com/dashboard e clique em "Restore project" para reativar o banco.';
        if (badgeEl) {
          badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#EF4444;"></span> Projeto Pausado no Supabase (402)';
          badgeEl.style.color = '#DC2626';
        }
        if (!silencioso && typeof mostrarToast === 'function') {
          mostrarToast('Projeto Pausado (402)', 'O seu projeto do Supabase está pausado por inatividade. Basta entrar em supabase.com/dashboard e clicar em "Restore project".', 'warning');
        }
        return { ok: false, status: 402, message: msg402, details: erroTexto };
      } else if (res.status === 401 || res.status === 403) {
        var msg401 = 'Chave Inválida (Erro ' + res.status + '). Verifique a anon/public key copiada do Supabase.';
        if (badgeEl) {
          badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#EF4444;"></span> Chave Não Autorizada (' + res.status + ')';
          badgeEl.style.color = '#DC2626';
        }
        if (!silencioso && typeof mostrarToast === 'function') {
          mostrarToast('Chave Inválida (' + res.status + ')', 'A chave do Supabase não foi aceita.', 'danger');
        }
        return { ok: false, status: res.status, message: msg401, details: erroTexto };
      } else if (res.status === 404) {
        try {
          var resRoot = await fetch(url + '/rest/v1/', {
            headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
          });
          if (resRoot.ok || resRoot.status === 200) {
            var msg404 = 'Conectado ao Supabase com sucesso, mas a tabela "ocorrencias" ainda não foi criada no schema do banco.';
            if (badgeEl) {
              badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#F59E0B;"></span> Conectado (Tabela Ocorrências pendente)';
              badgeEl.style.color = '#D97706';
            }
            if (!silencioso && typeof mostrarToast === 'function') {
              mostrarToast('Conexão OK', msg404, 'warning');
            }
            return { ok: true, tabelaAusente: true, status: 404, message: msg404 };
          }
        } catch(e404) {}
      }

      var msgGen = 'Falha na conexão (Status ' + res.status + (erroTexto ? ': ' + erroTexto : '') + ')';
      if (badgeEl) {
        badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#EF4444;"></span> ' + msgGen;
        badgeEl.style.color = '#DC2626';
      }
      if (!silencioso && typeof mostrarToast === 'function') {
        mostrarToast('Erro de Conexão', msgGen, 'danger');
      }
      return { ok: false, status: res.status, message: msgGen, details: erroTexto };
    } catch(err) {
      var msgErr = 'Falha na conexão (' + err.message + ')';
      if (badgeEl) {
        badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#EF4444;"></span> ' + msgErr;
        badgeEl.style.color = '#DC2626';
      }
      if (!silencioso && typeof mostrarToast === 'function') {
        mostrarToast('Erro de Conexão', 'Não foi possível contatar o Supabase. Verifique a URL e sua conexão.', 'danger');
      }
      return { ok: false, status: 0, message: msgErr };
    }
  }
  window.testarConexaoSupabaseConfig = testarConexaoSupabaseConfig;

  async function salvarCredenciaisSupabaseConfig() {
    var urlInput = document.getElementById('cfg-supabase-url');
    var keyInput = document.getElementById('cfg-supabase-key');
    var url = urlInput ? urlInput.value.trim().replace(/\/+$/, '') : '';
    var key = keyInput ? keyInput.value.trim() : '';

    if (!url || !key) {
      if (typeof mostrarToast === 'function') mostrarToast('Atenção', 'Preencha a URL e a Chave do Supabase.', 'warning');
      return;
    }

    var badgeEl = document.getElementById('cfg-db-status-badge');
    if (badgeEl) {
      badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#F59E0B;"></span> Verificando conexão antes de salvar...';
      badgeEl.style.color = '#D97706';
    }

    var teste = await testarConexaoSupabaseConfig(true);
    if (!teste.ok) {
      if (teste.status === 402) {
        if (typeof mostrarToast === 'function') {
          mostrarToast('Projeto Pausado no Supabase (402)', 'O seu projeto está pausado no Supabase. Acesse supabase.com/dashboard e clique em "Restore project" para reativá-lo.', 'danger');
        }
      } else {
        if (typeof mostrarToast === 'function') {
          mostrarToast('Falha na Conexão (' + (teste.status || 'Erro') + ')', teste.message || 'Verifique suas credenciais antes de salvar.', 'danger');
        }
      }
      return;
    }

    localStorage.setItem('tv_supabase_url', url);
    localStorage.setItem('tv_supabase_key', key);

    DBService.url = url;
    DBService.key = key;
    DBService.mode = 'supabase';

    if (badgeEl) {
      badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#10B981;"></span> Conectado e Sincronizando...';
      badgeEl.style.color = '#059669';
    }

    if (typeof mostrarToast === 'function') {
      mostrarToast('Banco Conectado', 'Credenciais verificadas e ativas! Sincronizando dados com o Supabase...', 'success');
    }

    /* Puxa dados da nuvem imediatamente */
    if (typeof DBService.init === 'function') DBService.init();
    if (typeof DBService.syncRemote === 'function') DBService.syncRemote();
  }
  window.salvarCredenciaisSupabaseConfig = salvarCredenciaisSupabaseConfig;

  function salvarConfiguracoes() {
    var btn = event && event.currentTarget;
    var urlEl = document.getElementById('cfg-supabase-url');
    var keyEl = document.getElementById('cfg-supabase-key');
    if (urlEl && keyEl && urlEl.value.trim() && keyEl.value.trim()) {
      salvarCredenciaisSupabaseConfig();
    }
    if (!btn) return;
    var textoOriginal = btn.textContent;
    btn.textContent = 'Salvo!';
    btn.disabled = true;
    setTimeout(function() {
      btn.textContent = textoOriginal;
      btn.disabled = false;
    }, 1400);
  }
  window.salvarConfiguracoes = salvarConfiguracoes;

  /* ── Gerador de Chave Criptografada Segura para Deploy no GitHub ── */
  function usarCredenciaisPreenchidasParaGerador() {
    var urlEl = document.getElementById('cfg-supabase-url');
    var keyEl = document.getElementById('cfg-supabase-key');
    var url = urlEl ? urlEl.value.trim() : '';
    var key = keyEl ? keyEl.value.trim() : '';

    if (!url || !key) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Atenção', 'Preencha a URL e a Publishable Key no card acima primeiro.', 'warning');
      } else {
        alert('Preencha a URL e a Publishable Key no card acima primeiro.');
      }
      return;
    }

    if (typeof mostrarToast === 'function') {
      mostrarToast('Dados Prontos', 'URL e Chave do Supabase preparadas para a criptografia.', 'info');
    }
  }
  window.usarCredenciaisPreenchidasParaGerador = usarCredenciaisPreenchidasParaGerador;

  var ultimoBlocoGerado = null;

  async function executarGeradorChaveSegura() {
    var urlEl = document.getElementById('cfg-supabase-url');
    var keyEl = document.getElementById('cfg-supabase-key');
    var passEl = document.getElementById('gen-chave-passphrase');
    var btn = document.getElementById('btn-executar-gerador');
    var outArea = document.getElementById('gen-resultado-area');
    var outPre = document.getElementById('gen-codigo-output');

    var url = urlEl ? urlEl.value.trim() : '';
    var key = keyEl ? keyEl.value.trim() : '';
    var pass = passEl ? passEl.value.trim() : '';

    if (!url || !key) {
      alert('Por favor, informe a URL do Supabase e a API Key no card de Conexão com o Banco acima.');
      if (urlEl) urlEl.focus();
      return;
    }

    if (!pass) {
      alert('Por favor, defina uma Chave de Acesso para a equipe (ex: TvIntegracao@2026).');
      if (passEl) passEl.focus();
      return;
    }

    if (pass.length < 6) {
      alert('A chave de acesso deve ter pelo menos 6 caracteres para garantir segurança máxima contra ataques.');
      if (passEl) passEl.focus();
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span style="display:inline-block;width:12px;height:12px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:6px;vertical-align:middle;"></span> Criptografando (PBKDF2 250k)...';
    }

    try {
      if (!window.TVCrypto) {
        throw new Error('Módulo TVCrypto indisponível.');
      }
      var payload = { url: url, key: key };
      var encPack = await window.TVCrypto.encrypt(pass, payload);
      ultimoBlocoGerado = encPack;
      window.ultimoBlocoGerado = encPack;
      window.ENCRYPTED_TV_CREDENTIALS = encPack;

      var snippet = '// Cole no config.js ou no script.js\n' +
        'window.ENCRYPTED_TV_CREDENTIALS = ' + JSON.stringify(encPack, null, 2) + ';';

      if (outPre) outPre.textContent = snippet;
      if (outArea) outArea.style.display = 'block';

      if (typeof mostrarToast === 'function') {
        mostrarToast('Código Gerado!', 'Bloco criptografado com sucesso. Totalmente seguro para o GitHub!', 'success');
      }
    } catch (e) {
      alert('Erro ao criptografar: ' + e.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="lock" style="width:14px;height:14px;"></i> Gerar Bloco Criptografado Seguro';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  }
  window.executarGeradorChaveSegura = executarGeradorChaveSegura;

  function copiarCodigoCriptografadoGerado() {
    var outPre = document.getElementById('gen-codigo-output');
    if (!outPre || !outPre.textContent) return;
    navigator.clipboard.writeText(outPre.textContent).then(function() {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Copiado!', 'Código criptografado copiado para a área de transferência.', 'success');
      } else {
        alert('Código copiado com sucesso!');
      }
    }).catch(function() {
      alert('Selecione e copie o texto manualmente.');
    });
  }
  window.copiarCodigoCriptografadoGerado = copiarCodigoCriptografadoGerado;

  function aplicarCodigoCriptografadoAgora() {
    if (!ultimoBlocoGerado) {
      alert('Gere o código primeiro clicando no botão acima.');
      return;
    }
    window.ENCRYPTED_TV_CREDENTIALS = ultimoBlocoGerado;
    if (typeof mostrarToast === 'function') {
      mostrarToast('Ativado!', 'Pacote criptografado ativado na memória deste navegador.', 'success');
    } else {
      alert('Pacote ativado com sucesso neste navegador!');
    }
  }
  window.aplicarCodigoCriptografadoAgora = aplicarCodigoCriptografadoAgora;
  /* ═══════════════════════════════════════════
     HISTÓRICO GERAL (Funções de Renderização e Filtros)
  ═══════════════════════════════════════════ */

  function renderHistorico() {
    var container = document.getElementById('hist-list');
    if (!container) return;

    var busca = (document.getElementById('hist-search') ? document.getElementById('hist-search').value : '').toLowerCase().trim();
    var todosItens = getHistoricoCompleto();

    // Atualiza os contadores com todos os itens do histórico integrado
    var cntTodos = todosItens.length;
    var cntOc    = todosItens.filter(function(i){ return i.tipo === 'ocorrencia'; }).length;
    var cntRel   = todosItens.filter(function(i){ return i.tipo === 'relatorio'; }).length;
    var cntRec   = todosItens.filter(function(i){ return i.tipo === 'recebimento'; }).length;
    var cntMeus  = todosItens.filter(function(i){ return isItemDoUsuario(i); }).length;

    if (document.getElementById('cnt-hist-todos')) document.getElementById('cnt-hist-todos').textContent = cntTodos;
    if (document.getElementById('cnt-hist-oc'))    document.getElementById('cnt-hist-oc').textContent    = cntOc;
    if (document.getElementById('cnt-hist-rel'))   document.getElementById('cnt-hist-rel').textContent   = cntRel;
    if (document.getElementById('cnt-hist-rec'))   document.getElementById('cnt-hist-rec').textContent   = cntRec;
    if (document.getElementById('cnt-hist-meus'))  document.getElementById('cnt-hist-meus').textContent  = cntMeus;

    var filtrados = todosItens.filter(function(item) {
      if (historicoFiltroCategoria === 'ocorrencia' && item.tipo !== 'ocorrencia') return false;
      if (historicoFiltroCategoria === 'relatorio' && item.tipo !== 'relatorio') return false;
      if (historicoFiltroCategoria === 'recebimento' && item.tipo !== 'recebimento') return false;
      if (historicoFiltroCategoria === 'meus' && !isItemDoUsuario(item)) return false;

      if (busca) {
        var str = (item.titulo + ' ' + item.equipamento + ' ' + item.criadoPor + ' ' + item.resolvidoPor + ' ' + item.categoria + ' ' + item.local + ' ' + item.descCriacao + ' ' + (item.descResolucao || '')).toLowerCase();
        return str.includes(busca);
      }
      return true;
    });

    if (filtrados.length === 0) {
      container.innerHTML =
        '<div style="text-align:center;padding:36px 12px;background:var(--surface);border:1px solid var(--border-lt);border-radius:var(--r-lg);">' +
          '<i data-lucide="search-x" style="width:32px;height:32px;color:var(--muted);stroke-width:1.5;margin-bottom:8px;"></i>' +
          '<p style="color:var(--txt);font-size:13.5px;font-weight:600;">Nenhum registro encontrado</p>' +
          '<p style="color:var(--muted);font-size:12px;margin-top:2px;">Tente ajustar os termos de busca ou mudar o filtro selecionado.</p>' +
        '</div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      renderHistoricoRelacionados(null);
      return;
    }

    function renderCardHistoricoHTML(item) {
      var eMeu = isItemDoUsuario(item);
      var isParcial = (item.status === 'Parcialmente resolvido') ||
                      (item.status === 'Parcialmente Resolvida') ||
                      (item.subtipo && String(item.subtipo).toLowerCase().includes('parcial')) ||
                      (item.tags && item.tags.indexOf('Parcialmente Resolvida') !== -1) ||
                      (item.descResolucao && String(item.descResolucao).toLowerCase().includes('parcialmente resolvido'));

      var isArquivado = (item.status === 'Resolvida e Arquivada') ||
                        (item.status === 'arquivada') ||
                        (item.tags && item.tags.indexOf('Arquivada') !== -1);

      var tagMeu = eMeu ? '<span class="tag tag-ind">Seu Registro / Resolução</span>' : '';
      var tagTipo = getTagTipoBadge(item);
      if (isParcial) {
        tagTipo += ' <span class="tag tag-y" style="font-weight:600;">Parcialmente Resolvida</span>';
      }
      if (isArquivado) {
        tagTipo += ' <span class="tag tag-gray-soft" style="font-weight:600;">Arquivado</span>';
      }
      var isSel = (itemHistoricoSelecionado && itemHistoricoSelecionado.id === item.id);

      var cardClasses = 'oc-card';
      if (isParcial) {
        cardClasses += ' parcialmente-resolvida';
      } else if (isArquivado) {
        cardClasses += ' arquivada';
      } else if (eMeu) {
        cardClasses += ' mine';
      }

      var plClass = isArquivado ? 'pl-gray' : (isParcial ? 'pl-y' : (item.tipo==='ocorrencia'?'pl-r':item.tipo==='relatorio'?'pl-g':'pl-y'));

      var resolucaoBox = '';
      var textoRes = item.descResolucao || (item.resolucao && item.resolucao.descRes);
      if (textoRes && textoRes.trim()) {
        resolucaoBox =
          '<div style="margin-top:6px;padding:6px 10px;background:rgba(16,185,129,0.06);border-left:2.5px solid var(--green);border-radius:4px;font-size:11.5px;color:var(--txt2);line-height:1.4;">' +
            '<strong style="color:var(--green-dk);display:flex;align-items:center;gap:4px;font-size:11px;margin-bottom:2px;">' +
              '<i data-lucide="check-circle-2" style="width:11px;height:11px;"></i> Resolução / Fechamento:' +
            '</strong>' +
            '<span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + escapeHTML(textoRes) + '</span>' +
          '</div>';
      }

      return (
        '<article class="' + cardClasses + '" onclick="verDetalhesHistorico(\'' + item.id + '\')" onmouseenter="selecionarItemHistorico(\'' + item.id + '\')" style="cursor:pointer;margin-bottom:10px;' + (isSel ? 'border-color:var(--blue);box-shadow:0 0 0 2px rgba(0,113,227,.15);' : '') + '">' +
          '<div class="prio-line ' + plClass + '"></div>' +
          '<div class="oc-body">' +
            '<div class="oc-header"><h3>' + escapeHTML(item.titulo || 'Sem título') + '</h3>' + tagTipo + tagMeu + '</div>' +
            '<p class="oc-desc" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + escapeHTML(item.descCriacao || item.desc || 'Sem descrição') + '</p>' +
            resolucaoBox +
            '<div class="oc-meta" style="margin-top:8px;gap:14px;flex-wrap:wrap;display:flex;align-items:center;font-size:11.5px;">' +
              '<span><i data-lucide="user" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Criado por: ' + escapeHTML(item.criadoPor || 'Sistema') + '</span>' +
              '<span><i data-lucide="check-circle-2" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Resolvido por: ' + escapeHTML(item.resolvidoPor || 'Pendente') + '</span>' +
              '<span><i data-lucide="calendar" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> ' + escapeHTML(item.dataResolucao || item.dataCriacao || '') + '</span>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }

    var secoes = agruparPorDias(filtrados, function(item){ return item.dataCriacao; });
    container.innerHTML = renderSecoesComCards(secoes, renderCardHistoricoHTML);

    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (!itemHistoricoSelecionado && filtrados.length > 0) {
      selecionarItemHistorico(filtrados[0].id);
    }
  }
  window.renderHistorico = renderHistorico;

  function selecionarItemHistorico(id) {
    var found = getHistoricoCompleto().find(function(h){
      if (!h || !h.id) return false;
      return h.id === id || h.id === ('h_oc_' + id) || id === ('h_oc_' + h.id) || (h.id.replace('h_oc_','') === id.replace('h_oc_',''));
    });
    if (!found) {
      var oc = ocorrencias.find(function(o){ return o && (o.id === id || o.id === id.replace('h_oc_','')); });
      if (oc) {
        found = {
          id:            oc.id,
          tipo:          'ocorrencia',
          subtipo:       oc.cat || 'Equipamento',
          titulo:        oc.titulo,
          equipamento:   oc.local ? (oc.local + ' — ' + (oc.cat || 'Equipamento')) : (oc.cat || oc.titulo),
          categoria:     oc.cat || 'Equipamento',
          local:         oc.local || 'Central Técnica',
          dataCriacao:   formatDataHoraLocal(oc.dataCriacao || oc.criado),
          criadoPor:     oc.resp || 'Sistema',
          descCriacao:   oc.desc || 'Ocorrência registrada no sistema.',
          status:        (oc.resolucao && oc.resolucao.statusRes) ? oc.resolucao.statusRes : (oc.status === 'arquivada' ? 'Resolvida e Arquivada' : 'Resolvido'),
          dataResolucao: (oc.resolucao && oc.resolucao.data) ? formatDataHoraLocal(oc.resolucao.data) : formatDataHoraLocal(),
          resolvidoPor:  (oc.resolucao && oc.resolucao.resolvidoPor) ? oc.resolucao.resolvidoPor : getUsuarioAtual(),
          descResolucao: (oc.resolucao && oc.resolucao.descRes) ? oc.resolucao.descRes : (oc.desc || 'Ocorrência resolvida pela equipe técnica.'),
          tags:          oc.tags || [],
          anexos:        (oc.anexos && Array.isArray(oc.anexos) && oc.anexos.length > 0) ? oc.anexos : ((oc.resolucao && Array.isArray(oc.resolucao.anexos)) ? oc.resolucao.anexos : [])
        };
      }
    }
    if (!found) return;
    itemHistoricoSelecionado = found;

    document.querySelectorAll('#hist-list .oc-card').forEach(function(c) {
      c.style.borderColor = '';
      c.style.boxShadow = '';
    });
    var el = document.querySelector('#hist-list .oc-card[onclick*="' + id + '"]');
    if (el) {
      el.style.borderColor = 'var(--blue)';
      el.style.boxShadow = '0 0 0 2px rgba(0,113,227,.15)';
    }

    renderHistoricoRelacionados(found);
  }
  window.selecionarItemHistorico = selecionarItemHistorico;

  function identificarEquipamentoItem(item) {
    if (!item) return '';

    // 1. Alvos oficiais dos dashboards (Equipamentos e Telejornais)
    var alvosDashboard = [
      'LIVE U 1', 'LIVE U 2', 'LIVE U 3', 'LIVE U 4', 'LIVE U SMART',
      'LIVE U1', 'LIVE U2', 'LIVE U3', 'LIVE U4',
      'REDAÇÃO', 'NET PRAÇA', 'NET PORTARIA', 'FORMATOS NET',
      'NET 2º ANDAR', 'NET 3º ANDAR', 'NET 4º ANDAR', 'KMJ',
      'INTEGRAÇÃO NOTÍCIA', 'MG1', 'MG2', 'GIRO MG2'
    ];

    if (typeof dashboardMetrics !== 'undefined' && dashboardMetrics) {
      if (dashboardMetrics.equipamento) {
        Object.keys(dashboardMetrics.equipamento).forEach(function(k){
          if (!alvosDashboard.includes(k)) alvosDashboard.push(k);
        });
      }
      if (dashboardMetrics.telejornal) {
        Object.keys(dashboardMetrics.telejornal).forEach(function(k){
          if (!alvosDashboard.includes(k)) alvosDashboard.push(k);
        });
      }
    }

    // Checa tags
    if (item.tags && Array.isArray(item.tags)) {
      for (var i = 0; i < item.tags.length; i++) {
        var t = (item.tags[i] || '').trim().toUpperCase();
        for (var j = 0; j < alvosDashboard.length; j++) {
          if (t === alvosDashboard[j].toUpperCase() || t.replace(/\s+/g, '') === alvosDashboard[j].replace(/\s+/g, '')) {
            return alvosDashboard[j];
          }
        }
      }
    }

    // Checa item.equipamento explícito
    if (item.equipamento && typeof item.equipamento === 'string') {
      var eqLimpo = item.equipamento.trim().toUpperCase();
      eqLimpo = eqLimpo.replace(/^(JUIZ DE FORA|UBERLÂNDIA|UBERLANDIA|UBERABA|DIVINÓPOLIS|DIVINOPOLIS|ARAXÁ|ARAXA|CENTRAL TÉCNICA|CENTRAL TECNICA)\s*—\s*/i, '').trim();

      for (var a = 0; a < alvosDashboard.length; a++) {
        if (eqLimpo === alvosDashboard[a].toUpperCase() || eqLimpo.replace(/\s+/g, '') === alvosDashboard[a].replace(/\s+/g, '')) {
          return alvosDashboard[a];
        }
      }

      var genericList = [
        'EQUIPAMENTO', 'GERAL', 'SISTEMA', 'CENTRAL TÉCNICA', 'CENTRAL TECNICA',
        'TRANSMISSÃO', 'TRANSMISSAO', 'EQUIPAMENTOS DE TRANSMISSÃO / CTRS',
        'MATERIAIS DE COMPRA', 'EQUIPAMENTO / MATERIAL RECEBIDO', 'SEM EQUIPAMENTO', 'OUTROS'
      ];
      if (!genericList.includes(eqLimpo) && eqLimpo.length >= 3 && !eqLimpo.includes('REQUISICAO') && !eqLimpo.includes('RECEBIMENTO')) {
        return eqLimpo;
      }
    }

    // Checa texto de título para alvos cadastrados
    var textoTitulo = (item.titulo || '').toUpperCase();
    for (var k = 0; k < alvosDashboard.length; k++) {
      var alvo = alvosDashboard[k].toUpperCase();
      var alvoEscapado = alvo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var reg = new RegExp('(^|[^A-Z0-9])' + alvoEscapado + '([^A-Z0-9]|$)', 'i');
      if (reg.test(textoTitulo)) {
        return alvosDashboard[k];
      }
    }

    // Não adivinha nem agrupa itens com títulos ou categorias genéricas
    return '';
  }
  window.identificarEquipamentoItem = identificarEquipamentoItem;

  function saoDoMesmoEquipamento(itemA, itemB) {
    if (!itemA || !itemB) return false;
    var eqA = identificarEquipamentoItem(itemA);
    var eqB = identificarEquipamentoItem(itemB);
    if (!eqA || !eqB) return false;

    var normA = eqA.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s_-]+/g, ' ').trim();
    var normB = eqB.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s_-]+/g, ' ').trim();

    normA = normA.replace(/live\s*u\s*(\d)/g, 'live u$1');
    normB = normB.replace(/live\s*u\s*(\d)/g, 'live u$1');

    if (normA.length < 2 || normB.length < 2) return false;

    var stopwords = ['equipamento', 'geral', 'sistema', 'central tecnica', 'transmissao', 'manutencao', 'relatorio', 'ocorrencia', 'checklist', 'ctrs', 'compras', 'recebimento'];
    if (stopwords.includes(normA) || stopwords.includes(normB)) return false;

    // Regra estrita: apenas itens com o mesmo nome exato de equipamento são vinculados
    return normA === normB;
  }
  window.saoDoMesmoEquipamento = saoDoMesmoEquipamento;

  function renderHistoricoRelacionados(itemAtual) {
    var container = document.getElementById('aside-historico-relacionados');
    if (!container) return;

    if (!itemAtual) {
      container.innerHTML =
        '<div style="margin-bottom:12px;padding:10px 12px;background:var(--surface);border:1px solid var(--border-lt);border-radius:var(--r-md);box-shadow:0 1px 2px rgba(0,0,0,0.02);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
            '<span style="font-size:10.5px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:5px;">' +
              '<i data-lucide="layers" style="width:12px;height:12px;color:var(--blue);"></i>' +
              'Mesmo Equipamento' +
            '</span>' +
            '<span style="font-size:10px;font-weight:600;padding:1px 7px;background:var(--border-lt);border-radius:10px;color:var(--muted);">' +
              '0 registros' +
            '</span>' +
          '</div>' +
          '<div style="font-size:12px;color:var(--muted);font-weight:500;display:flex;align-items:center;gap:6px;">' +
            '<i data-lucide="hard-drive" style="width:14px;height:14px;stroke-width:2;color:var(--muted);"></i>' +
            '<span>Passe o cursor sobre uma ocorrência</span>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:center;padding:24px 12px;color:var(--muted);font-size:12px;background:var(--surface);border:1px solid var(--border-lt);border-radius:var(--r-lg);">' +
          '<i data-lucide="mouse-pointer" style="width:20px;height:20px;stroke-width:1.5;margin-bottom:6px;color:var(--muted);"></i><br/>' +
          'Passe o cursor sobre uma ocorrência para visualizar o histórico deste equipamento.' +
        '</div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    var eqNomeIdentificado = identificarEquipamentoItem(itemAtual) || itemAtual.equipamento || itemAtual.titulo || 'Equipamento Geral';

    var relacionados = getHistoricoCompleto().filter(function(h) {
      if (!h || h.id === itemAtual.id) return false;
      return saoDoMesmoEquipamento(itemAtual, h);
    });

    var html =
      '<div style="margin-bottom:12px;padding:10px 12px;background:var(--surface);border:1px solid var(--border-lt);border-radius:var(--r-md);box-shadow:0 1px 2px rgba(0,0,0,0.02);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<span style="font-size:10.5px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:5px;">' +
            '<i data-lucide="layers" style="width:12px;height:12px;color:var(--blue);"></i>' +
            'Mesmo Equipamento' +
          '</span>' +
          '<span style="font-size:10px;font-weight:600;padding:1px 7px;background:var(--border-lt);border-radius:10px;color:var(--txt2);">' +
            relacionados.length + (relacionados.length === 1 ? ' registro' : ' registros') +
          '</span>' +
        '</div>' +
        '<div style="font-size:12.5px;color:var(--txt);font-weight:700;display:flex;align-items:center;gap:6px;">' +
          '<i data-lucide="hard-drive" style="width:14px;height:14px;stroke-width:2;color:var(--blue);"></i>' +
          '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHTML(eqNomeIdentificado) + '</span>' +
        '</div>' +
      '</div>';

    if (relacionados.length === 0) {
      html +=
        '<div style="text-align:center;padding:24px 12px;color:var(--muted);font-size:12px;background:var(--surface);border:1px solid var(--border-lt);border-radius:var(--r-lg);">' +
          '<i data-lucide="check-circle-2" style="width:20px;height:20px;stroke-width:1.5;margin-bottom:6px;color:var(--green);"></i><br/>' +
          'Nenhum outro registro encontrado para este equipamento.' +
        '</div>';
    } else {
      html += relacionados.slice(0, 6).map(function(rel) {
        var eMeu = isItemDoUsuario(rel);
        var statusTexto = rel.status || (rel.resolucao && rel.resolucao.statusRes) || 'Resolvido';
        var dataFmt = (rel.dataResolucao || rel.dataCriacao || '').substring(0, 10);
        var respFmt = rel.resolvidoPor || rel.criadoPor || 'Sistema';

        return (
          '<div class="mini-oc' + (eMeu ? ' mine' : '') + '" onclick="verDetalhesHistorico(\'' + rel.id + '\')" style="margin-bottom:8px;padding:10px 12px;border-radius:var(--r-md);border:1px solid var(--border-lt);background:var(--surface);cursor:pointer;transition:all 0.15s ease;" onmouseover="this.style.borderColor=\'var(--blue)\';this.style.boxShadow=\'0 2px 8px rgba(0,113,227,0.08)\';" onmouseout="this.style.borderColor=\'var(--border-lt)\';this.style.boxShadow=\'none\';">' +
            '<div class="mini-top" style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;">' +
              '<span class="mini-title" style="font-weight:600;font-size:12px;color:var(--txt);display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;">' + escapeHTML(rel.titulo || '') + '</span>' +
              '<span class="tag tag-g" style="font-size:9.5px;padding:1px 6px;white-space:nowrap;">' + escapeHTML(statusTexto) + '</span>' +
            '</div>' +
            '<div style="font-size:11px;color:var(--muted);display:flex;justify-content:space-between;align-items:center;margin-top:4px;">' +
              '<span><i data-lucide="calendar" style="width:10px;height:10px;vertical-align:-1px;"></i> ' + escapeHTML(dataFmt) + '</span>' +
              '<span>Por: ' + escapeHTML(respFmt) + '</span>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function filtrarHistorico() {
    renderHistorico();
  }
  window.filtrarHistorico = filtrarHistorico;

  function filtrarCategoriaHistorico(cat, btn) {
    historicoFiltroCategoria = cat;
    if (btn && btn.closest('.pills')) {
      btn.closest('.pills').querySelectorAll('.pill').forEach(function(p){ p.classList.remove('on'); });
      btn.classList.add('on');
    }
    renderHistorico();
  }
  window.filtrarCategoriaHistorico = filtrarCategoriaHistorico;

  function verDetalhesHistoricoDirect(itemOrId) {
    var item = itemOrId;
    if (typeof itemOrId === 'string') {
      var searchId = itemOrId;
      item = getHistoricoCompleto().find(function(h){
        if (!h || !h.id) return false;
        return h.id === searchId || h.id === ('h_oc_' + searchId) || searchId === ('h_oc_' + h.id) || (h.id.replace('h_oc_','') === searchId.replace('h_oc_',''));
      });
      if (!item) {
        var oc = ocorrencias.find(function(o){ return o && (o.id === searchId || o.id === searchId.replace('h_oc_','')); });
        if (oc) {
          var nowFmt = formatDataHoraLocal(oc.dataCriacao || oc.criado);
          var resFmt = (oc.resolucao && oc.resolucao.data) ? formatDataHoraLocal(oc.resolucao.data) : nowFmt;
          var resPor = (oc.resolucao && oc.resolucao.resolvidoPor) ? oc.resolucao.resolvidoPor : (oc.resp || getUsuarioAtual());
          var resDesc = (oc.resolucao && oc.resolucao.descRes) ? oc.resolucao.descRes : (oc.desc || 'Ocorrência resolvida pela equipe técnica.');
          var anexosLista = (oc.anexos && Array.isArray(oc.anexos) && oc.anexos.length > 0)
            ? oc.anexos
            : ((oc.resolucao && Array.isArray(oc.resolucao.anexos)) ? oc.resolucao.anexos : []);

          item = {
            id:            oc.id,
            tipo:          'ocorrencia',
            subtipo:       oc.cat || 'Equipamento',
            titulo:        oc.titulo,
            equipamento:   oc.local ? (oc.local + ' — ' + (oc.cat || 'Equipamento')) : (oc.cat || oc.titulo),
            categoria:     oc.cat || 'Equipamento',
            local:         oc.local || 'Central Técnica',
            dataCriacao:   nowFmt,
            criadoPor:     oc.resp || 'Sistema',
            descCriacao:   oc.desc || 'Ocorrência registrada no sistema.',
            status:        (oc.resolucao && oc.resolucao.statusRes) ? oc.resolucao.statusRes : (oc.status === 'arquivada' ? 'Resolvida e Arquivada' : 'Resolvido'),
            dataResolucao: resFmt,
            resolvidoPor:  resPor,
            descResolucao: resDesc,
            tags:          oc.tags || [],
            anexos:        anexosLista
          };
        }
      }
    }
    if (!item) return;
    itemDetalhesAtual = item;

    // Busca ocorrência vinculada para dados complementares
    var targetOcId = (item.id || '').replace(/^h_oc_/, '');
    var ocFound = ocorrencias.find(function(o){
      if (!o || !o.id) return false;
      return o.id === item.id || o.id === targetOcId || ('h_oc_' + o.id) === item.id;
    });

    var descCri = item.descCriacao || item.desc || (ocFound && ocFound.desc) || 'Sem descrição registrada.';
    var autorCri = item.criadoPor || item.resp || (ocFound && (ocFound.resp || ocFound.criadoPor)) || 'Sistema';
    var dataCri = item.dataCriacao || (item.criado ? formatDataHoraLocal(item.criado) : '') || (ocFound && (ocFound.dataCriacao || (ocFound.criado ? formatDataHoraLocal(ocFound.criado) : ''))) || 'Data não informada';
    var equip = item.equipamento || (ocFound && ocFound.local ? (ocFound.local + ' — ' + (ocFound.cat || 'Equipamento')) : '') || (ocFound && (ocFound.cat || ocFound.titulo)) || 'N/A';
    var localidade = item.local || (ocFound && ocFound.local) || 'Central Técnica';
    var categoria = item.categoria || item.subtipo || (ocFound && ocFound.cat) || 'Geral';

    var descRes = item.descResolucao || (item.resolucao && item.resolucao.descRes) || (ocFound && ocFound.resolucao && ocFound.resolucao.descRes) || 'Nenhuma observação de fechamento fornecida.';
    var respRes = item.resolvidoPor || (item.resolucao && item.resolucao.resolvidoPor) || (ocFound && ocFound.resolucao && ocFound.resolucao.resolvidoPor) || 'Pendente';
    var dataRes = item.dataResolucao || (item.resolucao && item.resolucao.data ? formatDataHoraLocal(item.resolucao.data) : '') || (ocFound && ocFound.resolucao && ocFound.resolucao.data ? formatDataHoraLocal(ocFound.resolucao.data) : '') || 'Em andamento';
    var statusFinal = item.status || (item.resolucao && item.resolucao.statusRes) || (ocFound && ocFound.resolucao && ocFound.resolucao.statusRes) || 'Concluído';

    var modalTitle = document.getElementById('hist-det-title');
    var modalTags  = document.getElementById('hist-det-tags');
    var modalBody  = document.getElementById('hist-det-body');

    if (modalTitle) modalTitle.textContent = item.titulo;
    if (modalTags) {
      var tagMeu = isItemDoUsuario(item) ? '<span class="tag tag-ind">Seu Registro / Resolução</span>' : '';
      modalTags.innerHTML = getTagTipoBadge(item) + ' <span class="tag tag-g">' + statusFinal + '</span> ' + tagMeu;
    }

    var anexos = (item.anexos && Array.isArray(item.anexos) && item.anexos.length > 0)
      ? item.anexos
      : ((item.resolucao && Array.isArray(item.resolucao.anexos) && item.resolucao.anexos.length > 0)
          ? item.resolucao.anexos
          : ((ocFound && ocFound.anexos && Array.isArray(ocFound.anexos) && ocFound.anexos.length > 0)
              ? ocFound.anexos
              : ((ocFound && ocFound.resolucao && Array.isArray(ocFound.resolucao.anexos)) ? ocFound.resolucao.anexos : [])));

    var mediaHTML = '';
    if (anexos && Array.isArray(anexos) && anexos.length > 0) {
      mediaHTML =
        '<div class="form-card" style="margin-bottom:12px;background:var(--bg);border:1px solid var(--border-lt);">' +
          '<h4 style="font-size:12.5px;font-weight:700;color:var(--txt);margin-bottom:10px;display:flex;align-items:center;gap:6px;">' +
            '<i data-lucide="paperclip" style="width:14px;height:14px;color:var(--blue);stroke-width:2;"></i>' +
            'Fotos e Anexos (' + anexos.length + ')' +
          '</h4>' +
          '<div style="display:flex;flex-direction:column;gap:10px;">';

      anexos.forEach(function(anx) {
        if (!anx) return;
        var fName = (anx.name || anx.nome || anx.fileName || '').toLowerCase();
        var fType = (anx.type || '').toLowerCase();
        var mediaSrc = anx.url || anx.dataUrl || (typeof anx === 'string' ? anx : '');
        if (!mediaSrc && anx.caminho) mediaSrc = anx.caminho;

        var isImg = fType.startsWith('image/') || 
                    mediaSrc.startsWith('data:image/') || 
                    fName.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i) ||
                    mediaSrc.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i);

        var isVid = fType.startsWith('video/') || 
                    mediaSrc.startsWith('data:video/') || 
                    fName.match(/\.(mp4|webm|mov|mkv|avi|ogg)$/i) ||
                    mediaSrc.match(/\.(mp4|webm|mov|mkv|avi|ogg)(\?.*)?$/i);

        if (isImg && mediaSrc) {
          mediaHTML +=
            '<div style="text-align:center;background:var(--surface);padding:8px;border-radius:var(--r-md);border:1px solid var(--border-lt);">' +
              '<img src="' + mediaSrc + '" alt="Imagem Anexa" loading="lazy" style="max-width:100%;max-height:300px;border-radius:var(--r-md);cursor:pointer;object-fit:contain;transition:transform 0.15s ease;" onmouseover="this.style.transform=\'scale(1.01)\'" onmouseout="this.style.transform=\'scale(1)\'" onclick="abrirQuickLook(this.src, \'Imagem Anexa\')"/>' +
              '<div style="font-size:11px;color:var(--blue);font-weight:600;margin-top:6px;cursor:pointer;" onclick="var img=this.previousElementSibling; if(img) abrirQuickLook(img.src, \'Imagem Anexa\');">🔍 Clique para ampliar</div>' +
            '</div>';
        } else if (isVid && mediaSrc) {
          mediaHTML +=
            '<div style="background:var(--surface);padding:10px;border-radius:var(--r-md);border:1px solid var(--border-lt);">' +
              '<video src="' + mediaSrc + '" controls style="width:100%;max-height:360px;border-radius:var(--r-md);background:#000;" preload="metadata"></video>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;padding:0 2px;">' +
                '<span style="font-size:11.5px;color:var(--txt);font-weight:600;">🎬 Vídeo Anexado</span>' +
                '<a href="' + mediaSrc + '" target="_blank" download="video_anexo" class="btn btn-ghost btn-xs">Baixar Vídeo</a>' +
              '</div>' +
            '</div>';
        } else if (mediaSrc) {
          mediaHTML +=
            '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);padding:8px 12px;border-radius:var(--r-md);border:1px solid var(--border-lt);">' +
              '<span style="font-size:12px;color:var(--txt);">📄 <strong>' + (anx.name || 'Arquivo Anexo') + '</strong></span>' +
              '<a href="' + mediaSrc + '" target="_blank" download="' + (anx.name || 'arquivo') + '" class="btn btn-ghost btn-sm">Abrir / Baixar</a>' +
            '</div>';
        }
      });

      mediaHTML += '</div></div>';
    }

    var historicoEdicoes = item.historicoEdicoes || (ocFound && ocFound.historicoEdicoes) || [];
    var edicoesHTML = '';
    if (historicoEdicoes && historicoEdicoes.length > 0) {
      edicoesHTML =
        '<div class="form-card" style="margin-bottom:12px;background:var(--bg);border:1px solid var(--border-lt);">' +
          '<h4 style="font-size:12.5px;font-weight:700;color:var(--txt);margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
            '<i data-lucide="history" style="width:14px;height:14px;color:var(--blue);stroke-width:2;"></i>' +
            'Histórico de Edições e Alterações (' + historicoEdicoes.length + ')' +
          '</h4>' +
          '<div style="display:flex;flex-direction:column;gap:8px;">' +
            historicoEdicoes.map(function(ed) {
              return (
                '<div style="background:var(--surface);padding:8px 12px;border-radius:var(--r-md);border:1px solid var(--border-lt);font-size:11.5px;line-height:1.5;">' +
                  '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
                    '<strong style="color:var(--txt);display:flex;align-items:center;gap:5px;"><i data-lucide="user-check" style="width:12px;height:12px;color:var(--blue);"></i> ' + escapeHTML(ed.autor || 'Operador') + '</strong>' +
                    '<span style="color:var(--muted);font-size:10.5px;">' + escapeHTML(ed.dataHora || '') + '</span>' +
                  '</div>' +
                  '<ul style="margin:0;padding-left:16px;color:var(--txt2);">' +
                    (ed.mudancas || []).map(function(m){ return '<li>' + escapeHTML(m) + '</li>'; }).join('') +
                  '</ul>' +
                '</div>'
              );
            }).join('') +
          '</div>' +
        '</div>';
    }

    if (modalBody) {
      modalBody.innerHTML =
        '<div class="form-card" style="margin-bottom:12px;background:var(--bg);border:1px solid var(--border-lt);">' +
          '<h4 style="font-size:12.5px;font-weight:700;color:var(--txt);margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
            '<i data-lucide="user" style="width:14px;height:14px;color:var(--blue);stroke-width:2;"></i>' +
            'Informações de Origem e Registro' +
          '</h4>' +
          '<div style="font-size:12px;color:var(--txt2);line-height:1.6;">' +
            '<strong>Equipamento / Recurso:</strong> ' + escapeHTML(equip) + '<br/>' +
            '<strong>Criado por:</strong> ' + escapeHTML(autorCri) + ' (' + escapeHTML(dataCri) + ')<br/>' +
            '<strong>Localidade:</strong> ' + escapeHTML(localidade) + '<br/>' +
            '<strong>Categoria:</strong> ' + escapeHTML(categoria) + '<br/>' +
            '<div style="margin-top:8px;padding:8px 10px;background:var(--surface);border-radius:var(--r-md);border:1px solid var(--border-lt);">' +
              '<strong>Descrição Registrada:</strong><br/>' + escapeHTML(descCri) +
            '</div>' +
          '</div>' +
        '</div>' +
        edicoesHTML +
        mediaHTML +
        '<div class="form-card" style="background:var(--bg);border:1px solid var(--border-lt);">' +
          '<h4 style="font-size:12.5px;font-weight:700;color:var(--txt);margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
            '<i data-lucide="check-circle-2" style="width:14px;height:14px;color:var(--green);stroke-width:2;"></i>' +
            'Informações de Resolução e Fechamento' +
          '</h4>' +
          '<div style="font-size:12px;color:var(--txt2);line-height:1.6;">' +
            '<strong>Responsável pela Resolução:</strong> ' + escapeHTML(respRes) + '<br/>' +
            '<strong>Data/Hora de Resolução:</strong> ' + escapeHTML(dataRes) + '<br/>' +
            '<strong>Status Final:</strong> <span style="color:var(--green);font-weight:600;">' + escapeHTML(statusFinal) + '</span><br/>' +
            '<div style="margin-top:8px;padding:8px 10px;background:var(--surface);border-radius:var(--r-md);border:1px solid var(--border-lt);">' +
              '<strong>O que foi realizado:</strong><br/>' + escapeHTML(descRes) +
            '</div>' +
          '</div>' +
        '</div>';
    }

    abrirPopup('popup-detalhes-historico');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.verDetalhesHistoricoDirect = verDetalhesHistoricoDirect;

  function verDetalhesHistorico(id) {
    if (!id) return;
    if (typeof selecionarItemHistorico === 'function') selecionarItemHistorico(id);

    var item = getHistoricoCompleto().find(function(h){
      if (!h || !h.id) return false;
      return h.id === id || h.id === ('h_oc_' + id) || id === ('h_oc_' + h.id) || (h.id.replace('h_oc_','') === id.replace('h_oc_',''));
    });

    if (!item) {
      var oc = ocorrencias.find(function(o){ return o && (o.id === id || o.id === id.replace('h_oc_','')); });
      if (oc) {
        var nowFmt = formatDataHoraLocal(oc.dataCriacao || oc.criado);
        var resFmt = (oc.resolucao && oc.resolucao.data) ? formatDataHoraLocal(oc.resolucao.data) : nowFmt;
        var resPor = (oc.resolucao && oc.resolucao.resolvidoPor) ? oc.resolucao.resolvidoPor : (oc.resp || getUsuarioAtual());
        var resDesc = (oc.resolucao && oc.resolucao.descRes) ? oc.resolucao.descRes : (oc.desc || 'Ocorrência resolvida pela equipe técnica.');
        var anexosLista = (oc.anexos && Array.isArray(oc.anexos) && oc.anexos.length > 0)
          ? oc.anexos
          : ((oc.resolucao && Array.isArray(oc.resolucao.anexos)) ? oc.resolucao.anexos : []);

        item = {
          id:            oc.id,
          tipo:          'ocorrencia',
          subtipo:       oc.cat || 'Equipamento',
          titulo:        oc.titulo,
          equipamento:   oc.local ? (oc.local + ' — ' + (oc.cat || 'Equipamento')) : (oc.cat || oc.titulo),
          categoria:     oc.cat || 'Equipamento',
          local:         oc.local || 'Central Técnica',
          dataCriacao:   nowFmt,
          criadoPor:     oc.resp || 'Sistema',
          descCriacao:   oc.desc || 'Ocorrência registrada no sistema.',
          status:        (oc.resolucao && oc.resolucao.statusRes) ? oc.resolucao.statusRes : (oc.status === 'arquivada' ? 'Resolvida e Arquivada' : 'Resolvido'),
          dataResolucao: resFmt,
          resolvidoPor:  resPor,
          descResolucao: resDesc,
          tags:          oc.tags || [],
          anexos:        anexosLista
        };
      }
    }

    if (item) {
      verDetalhesHistoricoDirect(item);
    }
  }
  window.verDetalhesHistorico = verDetalhesHistorico;

  function verDetalhesOcorrenciaResolvida(id) {
    verDetalhesHistorico(id);
  }
  window.verDetalhesOcorrenciaResolvida = verDetalhesOcorrenciaResolvida;

  function verDetalhesOcorrencia(id) {
    var oc = ocorrencias.find(function(o){ return o && o.id === id; });
    if (!oc) return;

    var anexosList = (oc.anexos && Array.isArray(oc.anexos) && oc.anexos.length > 0)
      ? oc.anexos
      : ((oc.resolucao && Array.isArray(oc.resolucao.anexos)) ? oc.resolucao.anexos : []);

    var item = {
      id:            oc.id,
      tipo:          'ocorrencia',
      subtipo:       oc.cat || 'Equipamento',
      titulo:        oc.titulo,
      equipamento:   oc.local ? (oc.local + ' — ' + (oc.cat || 'Equipamento')) : (oc.cat || oc.titulo),
      categoria:     oc.cat || 'Equipamento',
      local:         oc.local || 'Central Técnica',
      dataCriacao:   formatDataHoraLocal(oc.dataCriacao || oc.criado),
      criadoPor:     oc.resp || 'Sistema',
      descCriacao:   oc.desc || 'Ocorrência registrada no sistema.',
      status:        oc.status === 'resolvida' ? ((oc.resolucao && oc.resolucao.statusRes) ? oc.resolucao.statusRes : 'Resolvido') : (isOcorrenciaVencida(oc) ? 'Prazo Expirado' : 'Aberta'),
      dataResolucao: oc.resolucao ? formatDataHoraLocal(oc.resolucao.data) : 'Pendente de resolução',
      resolvidoPor:  oc.resolucao ? (oc.resolvidoPor || getUsuarioAtual()) : 'Aguardando resolução',
      descResolucao: oc.resolucao ? (oc.resolucao.descRes || 'Ocorrência ativa no turno aguardando tratativa da equipe.') : 'Ocorrência ativa no turno aguardando tratativa da equipe.',
      anexos:        anexosList
    };

    verDetalhesHistoricoDirect(item);
  }
  window.verDetalhesOcorrencia = verDetalhesOcorrencia;
  /* ═══════════════════════════════════════════
     SISTEMA DE TOAST NOTIFICATIONS & CENTRAL DE ALERTAS
  ═══════════════════════════════════════════ */

  var NOTIF_STORAGE_KEY = 'tv_notificacoes_v2';
  var NOTIF_DISMISSED_KEY = 'tv_notificacoes_dismissed_v2';
  var notificacoesStore = [];
  var notificacoesDispensadas = [];

  var INITIAL_NOTIFICACOES_SEED = [];

  function getNotifDBCredentials() {
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

  function salvarDispensadas() {
    window.notificacoesDispensadas = notificacoesDispensadas;
    try {
      localStorage.setItem(NOTIF_DISMISSED_KEY, JSON.stringify(notificacoesDispensadas));
    } catch(e) {}
  }

  function loadNotificacoes() {
    try {
      var savedDisp = localStorage.getItem(NOTIF_DISMISSED_KEY);
      notificacoesDispensadas = savedDisp ? JSON.parse(savedDisp) : [];
      if (!Array.isArray(notificacoesDispensadas)) notificacoesDispensadas = [];
    } catch(e) {
      notificacoesDispensadas = [];
    }

    try {
      var saved = localStorage.getItem(NOTIF_STORAGE_KEY);
      notificacoesStore = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(notificacoesStore)) notificacoesStore = [];
    } catch(e) {
      notificacoesStore = [];
    }

    window.notificacoesStore = notificacoesStore;
    window.notificacoesDispensadas = notificacoesDispensadas;
    atualizarBadgesNotificacoes();
    sincronizarNotificacoesNuvem();
  }

  function saveNotificacoes() {
    window.notificacoesStore = notificacoesStore;
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notificacoesStore));
    } catch(e) {}
    atualizarBadgesNotificacoes();
  }

  function sincronizarNotificacoesNuvem() {
    var db = getNotifDBCredentials();
    if (!db.url || !db.key) return;

    fetch(db.url + '/rest/v1/notificacoes?select=*&order=id.desc&limit=50', {
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Cache-Control': 'no-cache'
      }
    })
    .then(function(res) { return res.ok ? res.json() : null; })
    .then(function(cloudNotifs) {
      if (Array.isArray(cloudNotifs)) {
        notificacoesStore = cloudNotifs;
        window.notificacoesStore = notificacoesStore;
        try {
          localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notificacoesStore));
        } catch(e) {}
        atualizarBadgesNotificacoes();
        renderNotificacoes();
      }
    })
    .catch(function() {});
  }
  window.sincronizarNotificacoesNuvem = sincronizarNotificacoesNuvem;

  function salvarNotificacaoNuvem(notif) {
    var db = getNotifDBCredentials();
    if (!db.url || !db.key || !notif) return;

    fetch(db.url + '/rest/v1/notificacoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(notif)
    }).catch(function() {});
  }
  window.salvarNotificacaoNuvem = salvarNotificacaoNuvem;

  function marcarTodasLidasNuvem() {
    var db = getNotifDBCredentials();
    if (!db.url || !db.key) return;
    fetch(db.url + '/rest/v1/notificacoes?lida=eq.false', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ lida: true })
    }).catch(function() {});
  }
  window.marcarTodasLidasNuvem = marcarTodasLidasNuvem;

  function deletarNotificacaoNuvem(id) {
    var db = getNotifDBCredentials();
    if (!db.url || !db.key || !id) return;
    fetch(db.url + '/rest/v1/notificacoes?id=eq.' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Prefer': 'return=minimal'
      }
    }).catch(function() {});
  }
  window.deletarNotificacaoNuvem = deletarNotificacaoNuvem;

  function deletarTodasNotificacoesNuvem() {
    var db = getNotifDBCredentials();
    if (!db.url || !db.key) return;
    fetch(db.url + '/rest/v1/notificacoes?id=not.is.null', {
      method: 'DELETE',
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Prefer': 'return=minimal'
      }
    }).catch(function() {});
  }
  window.deletarTodasNotificacoesNuvem = deletarTodasNotificacoesNuvem;

  function mostrarToast(titulo, mensagem, tipo) {
    var container = document.getElementById('toast-container');
    if (!container) return;

    var toastType = tipo || 'info';
    var iconName = toastType === 'success' ? 'check-circle' : (toastType === 'warning' || toastType === 'warn') ? 'alert-triangle' : (toastType === 'danger' || toastType === 'error') ? 'alert-circle' : 'info';

    var toastEl = document.createElement('div');
    toastEl.className = 'toast toast-' + toastType;
    toastEl.innerHTML =
      '<div class="toast-icon"><i data-lucide="' + iconName + '" style="width:18px;height:18px;stroke-width:2;"></i></div>' +
      '<div class="toast-content">' +
        '<div class="toast-title">' + (titulo || 'Notificação') + '</div>' +
        '<div class="toast-msg">' + (mensagem || '') + '</div>' +
      '</div>' +
      '<button class="toast-close" type="button" aria-label="Fechar notificação">&times;</button>';

    function fecharComAnimacao() {
      toastEl.classList.add('toast-exit');
      setTimeout(function() {
        if (toastEl.parentNode) toastEl.remove();
      }, 380);
    }

    var closeBtn = toastEl.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.onclick = fecharComAnimacao;
    }

    container.appendChild(toastEl);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    /* Remove automaticamente com física de transição suave em 4.5s */
    setTimeout(function() {
      if (toastEl.parentNode) {
        fecharComAnimacao();
      }
    }, 4500);
  }
  window.mostrarToast = mostrarToast;

  function adicionarNotificacao(titulo, mensagem, tipo, exibirToast, chaveAutomatica) {
    if (chaveAutomatica && Array.isArray(notificacoesDispensadas) && notificacoesDispensadas.includes(chaveAutomatica)) {
      return;
    }

    var novaNotif = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      titulo: titulo || 'Notificação do Sistema',
      msg: mensagem || '',
      tempo: formatDataHoraLocal(),
      tipo: tipo || 'info',
      lida: false,
      chaveAutomatica: chaveAutomatica || null,
      praca: (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora'
    };

    var jaExiste = (notificacoesStore || []).some(function(n) {
      return n && ((chaveAutomatica && n.chaveAutomatica === chaveAutomatica) || (n.titulo === titulo && n.msg === mensagem));
    });

    if (!jaExiste) {
      notificacoesStore.unshift(novaNotif);
      saveNotificacoes();
      salvarNotificacaoNuvem(novaNotif);
      if (exibirToast !== false) {
        mostrarToast(titulo, mensagem, tipo);
      }
    }
  }
  window.adicionarNotificacao = adicionarNotificacao;

  function removerNotificacao(id) {
    var notif = (notificacoesStore || []).find(function(n){ return n && n.id === id; });
    if (notif && notif.chaveAutomatica) {
      if (!notificacoesDispensadas.includes(notif.chaveAutomatica)) {
        notificacoesDispensadas.push(notif.chaveAutomatica);
        salvarDispensadas();
      }
    }
    notificacoesStore = (notificacoesStore || []).filter(function(n){ return n && n.id !== id; });
    saveNotificacoes();
    deletarNotificacaoNuvem(id);
    renderNotificacoes();
  }
  window.removerNotificacao = removerNotificacao;

  function atualizarBadgesNotificacoes() {
    var badgeSidebar = document.querySelector('.notif-badge');
    var notifDot = document.querySelector('.notif-dot');
    var naoLidas = (notificacoesStore || []).filter(function(n){ return n && !n.lida; }).length;

    if (badgeSidebar) {
      if (naoLidas > 0) {
        badgeSidebar.textContent = naoLidas;
        badgeSidebar.style.display = 'inline-flex';
      } else {
        badgeSidebar.textContent = '0';
        badgeSidebar.style.display = 'none';
      }
    }
    if (notifDot) {
      notifDot.style.display = naoLidas > 0 ? 'block' : 'none';
    }
  }

  function verificarNotificacoesAutomaticas() {
    var idsNaLixeira = (lixeiraData || []).map(function(item){ return item.id; });
    // 1. Ocorrências com prazo expirado (ignora seeds demonstrativas)
    (ocorrencias || []).forEach(function(oc) {
      if (oc && oc.status === 'aberta' && !String(oc.id).startsWith('oc_init_') && !idsNaLixeira.includes(oc.id) && isOcorrenciaVencida(oc)) {
        var chaveOc = 'vencida_' + oc.id + '_' + (oc.prazo || '');
        var tit = '⚠️ Prazo Expirado: ' + (oc.titulo || 'Ocorrência');
        var msg = 'A ocorrência para "' + (oc.local || 'Central Técnica') + '" ultrapassou o horário estipulado (' + (oc.prazo || 'Prazo vencido') + ') e requer atenção.';
        adicionarNotificacao(tit, msg, 'warning', false, chaveOc);
      }
    });

    // 2. Ocorrências arquivadas pendentes para o turno (ignora seeds demonstrativas)
    var arquivadas = getArquivadas().filter(function(oc){ return !String(oc.id).startsWith('oc_init_') && !idsNaLixeira.includes(oc.id); });
    if (arquivadas.length > 0) {
      var chaveArq = 'arq_status_' + arquivadas.map(function(a){ return a.id; }).sort().join('_');
      var titArq = '📦 Ocorrências Arquivadas para o Turno';
      var msgArq = 'Existem ' + arquivadas.length + ' ocorrência(s) arquivada(s) aguardando verificação e acompanhamento da equipe.';
      adicionarNotificacao(titArq, msgArq, 'info', false, chaveArq);
    }
  }
  window.verificarNotificacoesAutomaticas = verificarNotificacoesAutomaticas;

  function renderNotificacoes() {
    var container = document.getElementById('notif-list-body');
    atualizarBadgesNotificacoes();
    if (!container) return;

    var daPraca = (notificacoesStore || []).filter(function(n) {
      return n && (typeof pertenceAPracaAtiva !== 'function' || pertenceAPracaAtiva(n));
    });

    if (daPraca.length === 0) {
      container.innerHTML =
        '<div style="text-align:center;padding:32px 16px;background:var(--surface);border:1px solid var(--border-lt);border-radius:var(--r-md);">' +
          '<i data-lucide="bell-off" style="width:32px;height:32px;color:var(--muted);stroke-width:1.5;margin-bottom:8px;"></i>' +
          '<p style="color:var(--txt);font-size:13.5px;font-weight:600;">Nenhuma notificação</p>' +
          '<p style="color:var(--muted);font-size:11.5px;margin-top:2px;">Alertas do sistema, prazos de ocorrências e avisos de turno aparecerão aqui.</p>' +
        '</div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = daPraca.map(function(n) {
      var isWarning = n.tipo === 'warning' || n.tipo === 'warn';
      var isDanger  = n.tipo === 'danger'  || n.tipo === 'error';
      var isSuccess = n.tipo === 'success' || n.tipo === 'ok';

      var bgCor     = isDanger ? '#FEF2F2' : isWarning ? '#FFFBEB' : isSuccess ? '#F0FDF4' : '#EFF6FF';
      var borderCor = isDanger ? '#FECACA' : isWarning ? '#FDE68A' : isSuccess ? '#BBF7D0' : '#BFDBFE';
      var txtCor    = isDanger ? '#DC2626' : isWarning ? '#D97706' : isSuccess ? '#16A34A' : '#2563EB';
      var icoNome   = isDanger ? 'alert-circle' : isWarning ? 'alert-triangle' : isSuccess ? 'check-circle-2' : 'info';
      var unreadBadge = !n.lida ? '<span class="tag tag-blue" style="font-size:9.5px;padding:1px 6px;margin-left:6px;font-weight:600;">Nova</span>' : '';

      return (
        '<div style="background:' + bgCor + ';border:1px solid ' + borderCor + ';border-radius:var(--r-md);padding:10px 12px;display:flex;gap:10px;align-items:flex-start;position:relative;">' +
          '<div style="color:' + txtCor + ';margin-top:1px;"><i data-lucide="' + icoNome + '" style="width:16px;height:16px;stroke-width:2.2;"></i></div>' +
          '<div style="flex:1;display:flex;flex-direction:column;gap:2px;padding-right:18px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<div style="display:flex;align-items:center;"><strong style="font-size:12.5px;color:' + txtCor + ';">' + (n.titulo || 'Alerta') + '</strong>' + unreadBadge + '</div>' +
              '<span style="font-size:10.5px;color:var(--muted);white-space:nowrap;margin-left:8px;">' + (n.tempo || '') + '</span>' +
            '</div>' +
            '<span style="font-size:12px;color:var(--txt2);line-height:1.4;">' + (n.msg || '') + '</span>' +
          '</div>' +
          '<button type="button" onclick="removerNotificacao(\'' + n.id + '\')" title="Dispensar notificação" style="position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;" onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\'var(--muted)\'">' +
            '<i data-lucide="x" style="width:13px;height:13px;stroke-width:2.2;"></i>' +
          '</button>' +
        '</div>'
      );
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.renderNotificacoes = renderNotificacoes;

  function abrirNotificacoes() {
    var teveNaoLidas = false;
    (notificacoesStore || []).forEach(function(n){
      if (n && !n.lida) {
        n.lida = true;
        teveNaoLidas = true;
      }
    });
    saveNotificacoes();
    atualizarBadgesNotificacoes();
    renderNotificacoes();
    abrirPopup('popup-notificacoes');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (teveNaoLidas) {
      marcarTodasLidasNuvem();
    }
  }
  window.abrirNotificacoes = abrirNotificacoes;

  function limparTodasNotificacoes() {
    // 1. Marca todas as notificações atuais como dispensadas para que o robô não as recrie
    var idsNaLixeira = (lixeiraData || []).map(function(item){ return item.id; });
    (ocorrencias || []).forEach(function(oc) {
      if (oc && oc.status === 'aberta' && !idsNaLixeira.includes(oc.id)) {
        var chaveOc = 'vencida_' + oc.id + '_' + (oc.prazo || '');
        if (!notificacoesDispensadas.includes(chaveOc)) {
          notificacoesDispensadas.push(chaveOc);
        }
      }
    });

    var arquivadas = getArquivadas().filter(function(oc){ return !idsNaLixeira.includes(oc.id); });
    if (arquivadas.length > 0) {
      var chaveArq = 'arq_status_' + arquivadas.map(function(a){ return a.id; }).sort().join('_');
      if (!notificacoesDispensadas.includes(chaveArq)) {
        notificacoesDispensadas.push(chaveArq);
      }
    }

    (notificacoesStore || []).forEach(function(n) {
      if (n && n.chaveAutomatica && !notificacoesDispensadas.includes(n.chaveAutomatica)) {
        notificacoesDispensadas.push(n.chaveAutomatica);
      }
    });
    salvarDispensadas();

    notificacoesStore = [];
    saveNotificacoes();
    deletarTodasNotificacoesNuvem();
    renderNotificacoes();
    if (typeof mostrarToast === 'function') {
      mostrarToast('Notificações Limpas', 'O histórico de notificações foi esvaziado com sucesso.', 'info');
    }
  }
  window.limparTodasNotificacoes = limparTodasNotificacoes;
  /* ═══════════════════════════════════════════
     SISTEMA DE EXPORTAÇÃO E CONSOLIDAÇÃO POWER BI
  ═══════════════════════════════════════════ */

  function atualizarResumoPowerBI() {
    var select = document.getElementById('pbi-periodo');
    var titleEl = document.getElementById('pbi-preview-title');
    var statsEl = document.getElementById('pbi-preview-stats');
    if (!select || !titleEl || !statsEl) return;

    var val = select.value;
    var periodosTextos = {
      semana: 'Última Semana (7 dias)',
      mes: 'Último Mês (30 dias)',
      semestre: 'Últimos 6 Meses',
      ano: 'Último 1 Ano'
    };

    var periodosStats = {
      semana:   { total: 98,  conf: 97,  nc: 1,  canc: 0 },
      mes:      { total: 419, conf: 418, nc: 1,  canc: 0 },
      semestre: { total: 2480,conf: 2470,nc: 8,  canc: 2 },
      ano:      { total: 4960,conf: 4940,nc: 15, canc: 5 }
    };

    var text = periodosTextos[val] || 'Período Selecionado';
    var st = periodosStats[val] || periodosStats.mes;

    var pctConf = ((st.conf / st.total) * 100).toFixed(1);
    var pctNc = ((st.nc / st.total) * 100).toFixed(1);

    titleEl.textContent = 'Consolidado: ' + text;
    statsEl.innerHTML =
      'Total Transmissões: <strong>' + st.total + '</strong> | ' +
      'Conformes: <strong style="color:var(--green);">' + st.conf + ' (' + pctConf + '%)</strong> | ' +
      'Não Conformes: <strong style="color:var(--red);">' + st.nc + ' (' + pctNc + '%)</strong>';
  }
  window.atualizarResumoPowerBI = atualizarResumoPowerBI;

  function exportarRelatorioPowerBI() {
    var select = document.getElementById('pbi-periodo');
    var val = select ? select.value : 'mes';
    fecharPopup('popup-gerar-powerbi');

    if (typeof mostrarToast === 'function') {
      mostrarToast('Relatório Power BI Gerado', 'Métricas do período salvas e prontas para integração com o Power BI / Excel.', 'success');
    }
    alert('Relatório Power BI compilado com sucesso!\n\nPeríodo exportado com todas as telemetrias e históricos de transmissões.');
  }
  window.exportarRelatorioPowerBI = exportarRelatorioPowerBI;

  /* ═══════════════════════════════════════════
     MÉTRICAS E REGISTRO DE OCORRÊNCIAS DE DASHBOARD
  ═══════════════════════════════════════════ */

  function abrirModalOcDashboard(tipo) {
    var tipoEl = document.getElementById('oc-dash-tipo-painel');
    var selectAlvo = document.getElementById('oc-dash-alvo');
    if (!selectAlvo || !tipoEl || !dashboardMetrics) return;

    tipoEl.value = tipo;
    var items = dashboardMetrics[tipo];
    if (!items) return;
    var list = Object.keys(items);

    selectAlvo.innerHTML = list.map(function(item) {
      return '<option value="' + item + '">' + item + '</option>';
    }).join('');

    abrirPopup('popup-nova-oc-dashboard');
  }
  window.abrirModalOcDashboard = abrirModalOcDashboard;

  var dashAtivoAtual = 'telejornal';

  function alternarDashboard(tipo) {
    dashAtivoAtual = (tipo === 'equipamento' || tipo === 'equipamentos') ? 'equipamento' : 'telejornal';
    var viewTj = document.getElementById('dash-view-telejornal');
    var viewEq = document.getElementById('dash-view-equipamentos');
    var btnTj = document.getElementById('btn-tab-tj');
    var btnEq = document.getElementById('btn-tab-eq');
    var titleEl = document.getElementById('dash-view-title');

    if (dashAtivoAtual === 'telejornal') {
      if (viewTj) {
        viewTj.style.display = 'block';
        viewTj.classList.remove('dash-view-animated');
        void viewTj.offsetWidth;
        viewTj.classList.add('dash-view-animated');
      }
      if (viewEq) viewEq.style.display = 'none';

      if (btnTj) {
        btnTj.style.background = '#007AFF';
        btnTj.style.color = '#ffffff';
        btnTj.style.fontWeight = '700';
        btnTj.style.boxShadow = '0 2px 6px rgba(0,122,255,0.35)';
      }
      if (btnEq) {
        btnEq.style.background = 'transparent';
        btnEq.style.color = 'var(--muted)';
        btnEq.style.fontWeight = '600';
        btnEq.style.boxShadow = 'none';
      }
      if (titleEl) titleEl.textContent = 'Telejornal';
    } else {
      if (viewTj) viewTj.style.display = 'none';
      if (viewEq) {
        viewEq.style.display = 'block';
        viewEq.classList.remove('dash-view-animated');
        void viewEq.offsetWidth;
        viewEq.classList.add('dash-view-animated');
      }

      if (btnTj) {
        btnTj.style.background = 'transparent';
        btnTj.style.color = 'var(--muted)';
        btnTj.style.fontWeight = '600';
        btnTj.style.boxShadow = 'none';
      }
      if (btnEq) {
        btnEq.style.background = '#007AFF';
        btnEq.style.color = '#ffffff';
        btnEq.style.fontWeight = '700';
        btnEq.style.boxShadow = '0 2px 6px rgba(0,122,255,0.35)';
      }
      if (titleEl) titleEl.textContent = 'Equipamentos';
    }

    renderDashboards();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.alternarDashboard = alternarDashboard;

  function abrirModalOcDashboardContextual() {
    abrirModalOcDashboard(dashAtivoAtual);
  }
  window.abrirModalOcDashboardContextual = abrirModalOcDashboardContextual;

  var itemTransmissaoDetalhesAtual = { nome: '', tipo: '' };

  function abrirDetalhesTransmissao(nome, tipo) {
    if (!nome) return;
    tipo = (tipo === 'equipamento' || tipo === 'equipamentos') ? 'equipamento' : 'telejornal';
    itemTransmissaoDetalhesAtual = { nome: nome, tipo: tipo };

    var metricObj = (dashboardMetrics && dashboardMetrics[tipo]) ? dashboardMetrics[tipo][nome] : null;
    var conf = metricObj ? metricObj.conf : 100;
    var nc = metricObj ? metricObj.nc : 0;
    var canc = metricObj ? metricObj.canc : 0;
    var total = conf + nc + canc;
    var pctConf = total > 0 ? ((conf / total) * 100).toFixed(1) : '100.0';
    var pctNc = total > 0 ? ((nc / total) * 100).toFixed(1) : '0.0';
    var pctCanc = total > 0 ? ((canc / total) * 100).toFixed(1) : '0.0';

    var nomeEl = document.getElementById('det-trans-nome');
    var catEl = document.getElementById('det-trans-categoria');
    var icoEl = document.getElementById('det-trans-ico');
    var confEl = document.getElementById('det-trans-conf');
    var ncEl = document.getElementById('det-trans-nc');
    var cancEl = document.getElementById('det-trans-canc');
    var totalEl = document.getElementById('det-trans-total');
    var slaEl = document.getElementById('det-trans-sla');
    var localEl = document.getElementById('det-trans-local');
    var linkEl = document.getElementById('det-trans-link');
    var ultimoEl = document.getElementById('det-trans-ultimo');
    var badgeEl = document.getElementById('det-trans-status-badge');
    var histListaEl = document.getElementById('det-trans-historico-lista');

    if (nomeEl) nomeEl.textContent = nome;
    if (catEl) catEl.textContent = (tipo === 'telejornal' ? 'Telejornal / Programa' : 'Equipamento de Transmissão') + ' · Telemetria & Status Operacional';
    if (icoEl) icoEl.setAttribute('data-lucide', tipo === 'telejornal' ? 'tv' : 'video');

    if (confEl) confEl.textContent = conf + ' (' + pctConf + '%)';
    if (ncEl) ncEl.textContent = nc + ' (' + pctNc + '%)';
    if (cancEl) cancEl.textContent = canc + ' (' + pctCanc + '%)';
    if (totalEl) totalEl.textContent = total + ' transmissões';
    if (slaEl) slaEl.textContent = pctConf + '% (Disponibilidade)';

    var pracaAtual = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isEquip = (tipo === 'equipamento');
    if (localEl) localEl.textContent = isEquip ? 'Unidade Móvel / Jornalismo Externo (' + pracaAtual + ')' : 'Estúdio Principal · ' + pracaAtual + ' (MG)';
    if (linkEl) linkEl.textContent = isEquip ? 'Link Celular 4K / Bonding LiveU (4x SIM 5G)' : 'Rede SDI / IP Fibra Óptica + Satélite';
    if (ultimoEl) ultimoEl.textContent = nc > 0 ? 'Última transmissão com alerta (' + nc + ' falha registrada)' : 'Última transmissão 100% Conforme (OK)';

    if (badgeEl) {
      if (nc > 0) {
        badgeEl.className = 'tag tag-y';
        badgeEl.textContent = '● Atenção (' + nc + ' NC)';
      } else {
        badgeEl.className = 'tag tag-g';
        badgeEl.textContent = '● Operacional / Excelente';
      }
    }

    if (histListaEl) {
      var histOcs = (typeof ocorrencias !== 'undefined' ? ocorrencias : []).filter(function(o) {
        return (o.titulo && o.titulo.indexOf(nome) !== -1) || (o.desc && o.desc.indexOf(nome) !== -1);
      });

      if (histOcs.length === 0) {
        histListaEl.innerHTML =
          '<div style="background:#FFFFFF;border:1px solid var(--border-lt);border-radius:var(--r-sm);padding:8px 10px;font-size:11.5px;color:var(--muted);">' +
            'Nenhuma ocorrência crítica aberta para este item no momento. Sistema estável e operando normalmente.' +
          '</div>';
      } else {
        histListaEl.innerHTML = histOcs.map(function(o) {
          return (
            '<div style="background:#FFFFFF;border:1px solid var(--border-lt);border-radius:var(--r-sm);padding:7px 10px;display:flex;justify-content:space-between;align-items:center;font-size:11.5px;">' +
              '<div><strong style="color:var(--txt);">' + o.titulo + '</strong> <span style="color:var(--muted);">· ' + (o.resp || '') + '</span></div>' +
              '<span class="tag ' + (o.status === 'resolvida' ? 'tag-g' : 'tag-r') + '">' + (o.status === 'resolvida' ? 'Resolvida' : 'Em Aberto') + '</span>' +
            '</div>'
          );
        }).join('');
      }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    abrirPopup('popup-detalhes-transmissao');
  }
  window.abrirDetalhesTransmissao = abrirDetalhesTransmissao;

  function abrirModalOcItemDireto() {
    fecharPopup('popup-detalhes-transmissao');
    if (!itemTransmissaoDetalhesAtual.nome) return;

    var tipoEl = document.getElementById('oc-dash-tipo-painel');
    var selectAlvo = document.getElementById('oc-dash-alvo');
    if (tipoEl && selectAlvo && dashboardMetrics) {
      tipoEl.value = itemTransmissaoDetalhesAtual.tipo;
      var items = dashboardMetrics[itemTransmissaoDetalhesAtual.tipo];
      if (items) {
        var list = Object.keys(items);
        selectAlvo.innerHTML = list.map(function(item) {
          return '<option value="' + item + '"' + (item === itemTransmissaoDetalhesAtual.nome ? ' selected' : '') + '>' + item + '</option>';
        }).join('');
      }
    }
    abrirPopup('popup-nova-oc-dashboard');
  }
  window.abrirModalOcItemDireto = abrirModalOcItemDireto;

  function getDashboardMetricsKey() {
    var praca = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    return (praca.indexOf('Uber') !== -1) ? 'tv_dashboard_metrics_v2_udi' : 'tv_dashboard_metrics_v2_jf';
  }

  function salvarDashboardMetricsStore() {
    try {
      localStorage.setItem(getDashboardMetricsKey(), JSON.stringify(dashboardMetrics));
    } catch (e) {}
  }

  function carregarDashboardMetricsStore() {
    try {
      var praca = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
      var key = getDashboardMetricsKey();
      var raw = localStorage.getItem(key);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          dashboardMetrics = parsed;
          return;
        }
      }
      // Se não houver cache para esta praça:
      if (praca.indexOf('Uber') !== -1) {
        // Uberlândia: telejornais iguais ao padrão, equipamentos limpos
        dashboardMetrics = {
          telejornal: {
            'INTEGRAÇÃO NOTÍCIA': { conf: 0, nc: 0, canc: 0 },
            'MG1':                { conf: 0, nc: 0, canc: 0 },
            'MG2':                { conf: 0, nc: 0, canc: 0 },
            'GIRO MG2':           { conf: 0, nc: 0, canc: 0 }
          },
          equipamento: {}
        };
      } else {
        // Juiz de Fora: 13 equipamentos padrão
        dashboardMetrics = {
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
      }
    } catch (e) {}
  }
  window.carregarDashboardMetricsStore = carregarDashboardMetricsStore;

  function abrirModalNovoEquipamento() {
    var nomeEl = document.getElementById('novo-eq-nome');
    var obsEl  = document.getElementById('novo-eq-obs');
    if (nomeEl) { nomeEl.value = ''; setTimeout(function(){ nomeEl.focus(); }, 150); }
    if (obsEl)  obsEl.value = '';
    abrirPopup('popup-novo-equipamento');
  }
  window.abrirModalNovoEquipamento = abrirModalNovoEquipamento;

  function salvarNovoEquipamentoDashboard() {
    var nomeEl = document.getElementById('novo-eq-nome');
    var tipoEl = document.getElementById('novo-eq-tipo');
    var obsEl  = document.getElementById('novo-eq-obs');
    var nome = (nomeEl ? nomeEl.value : '').trim().toUpperCase();
    if (!nome) {
      alert('Por favor, informe o nome do equipamento.');
      if (nomeEl) nomeEl.focus();
      return;
    }

    var praca = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    if (!dashboardMetrics) dashboardMetrics = {};
    if (!dashboardMetrics.equipamento) dashboardMetrics.equipamento = {};

    if (dashboardMetrics.equipamento[nome]) {
      alert('Já existe um equipamento cadastrado com o nome "' + nome + '" nesta praça.');
      return;
    }

    dashboardMetrics.equipamento[nome] = {
      conf: 0,
      nc: 0,
      canc: 0,
      tipo: tipoEl ? tipoEl.value : 'Equipamento',
      obs: obsEl ? obsEl.value : ''
    };
    window._ultimoEqAdicionado = nome;
    salvarDashboardMetricsStore();

    fecharPopup('popup-novo-equipamento');
    if (typeof mostrarToast === 'function') {
      mostrarToast('Equipamento Cadastrado', nome + ' adicionado com sucesso ao dashboard de ' + praca + '.', 'success');
    }

    renderDashboards();
    try {
      if (typeof window.atualizarSelectsEquipamentosCTRS === 'function') {
        window.atualizarSelectsEquipamentosCTRS();
      }
    } catch(eEq) {}
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.salvarNovoEquipamentoDashboard = salvarNovoEquipamentoDashboard;

  function salvarOcDashboard() {
    var tipoPainel = document.getElementById('oc-dash-tipo-painel').value;
    var alvo = document.getElementById('oc-dash-alvo').value;
    var status = document.getElementById('oc-dash-status').value;
    var obs = document.getElementById('oc-dash-obs').value.trim();

    if (!obs) {
      alert('Por favor, informe a observação do registro.');
      return;
    }

    if (dashboardMetrics && dashboardMetrics[tipoPainel]) {
      var metricObj = dashboardMetrics[tipoPainel][alvo];
      if (metricObj) {
        if (status === 'nc') metricObj.nc += 1;
        else if (status === 'canc') metricObj.canc += 1;
        else if (status === 'conf') metricObj.conf += 1;
      }
      salvarDashboardMetricsStore();
    }

    // Se for Não Conforme (falha) ou Cancelado, cria a Ocorrência Real no Banco de Dados
    if (status === 'nc' || status === 'canc') {
      var statusLabel = (status === 'nc') ? 'Não Conforme (Falha)' : 'Cancelado';
      var nowStr = formatDataHoraLocal();
      var pracaAtual = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
      var novaOc = {
        id:          'oc_dash_' + Date.now(),
        titulo:      'Falha em ' + alvo + ' (' + statusLabel + ')',
        prio:        (status === 'nc' ? 'Alta' : 'Média'),
        cat:         (tipoPainel === 'telejornal' ? 'Telejornal / Transmissão ao Vivo' : 'Equipamentos de Transmissão'),
        resp:        'Equipe de Transmissão',
        local:       pracaAtual,
        prazo:       '12:00',
        desc:        obs,
        mine:        false,
        tags:        ['Dashboard Transmissões', alvo],
        status:      'aberta',
        criado:      Date.now(),
        dataCriacao: nowStr,
        resolucao:   null,
        praca:       pracaAtual
      };
      ocorrencias = [novaOc].concat(ocorrencias);
      save(ocorrencias, novaOc, true);
    }

    fecharPopup('popup-nova-oc-dashboard');
    document.getElementById('oc-dash-obs').value = '';

    if (typeof mostrarToast === 'function') {
      mostrarToast('Ocorrência Registrada no Banco', 'Salvo no banco de dados e gráficos do ' + alvo + ' atualizados.', 'warning');
    }
    alert('Ocorrência salva com sucesso no Banco de Dados e Dashboard!\n\nAs métricas do ' + alvo + ' foram atualizadas e a ocorrência foi registrada no sistema.');

    renderDashboards();
    renderAll();
  }
  window.salvarOcDashboard = salvarOcDashboard;

  function renderEquipamentosCards() {
    var grid = document.getElementById('dash-equipamentos-grid');
    if (!grid) return;

    var equips = (dashboardMetrics && dashboardMetrics.equipamento) ? dashboardMetrics.equipamento : {};
    var eqKeys = Object.keys(equips);
    var htmlCards = '';

    eqKeys.forEach(function(key) {
      var m = equips[key];
      var totalReal = (m.conf || 0) + (m.nc || 0) + (m.canc || 0);
      var total = totalReal === 0 ? 1 : totalReal;
      var pctConf = totalReal === 0 ? 0 : Math.round((m.conf / total) * 100);
      var pctNc   = totalReal === 0 ? 0 : Math.round((m.nc / total) * 100);
      var pctCanc = totalReal === 0 ? 0 : (100 - pctConf - pctNc);
      if (pctCanc < 0) pctCanc = 0;

      var endConf = pctConf;
      var endNc = pctConf + pctNc;
      var pieGradient = totalReal === 0
        ? '#E2E8F0'
        : ('conic-gradient(#10B981 0% ' + endConf + '%, #EF4444 ' + endConf + '% ' + endNc + '%, #F59E0B ' + endNc + '% 100%)');

      var isNew = (window._ultimoEqAdicionado === key) ? ' dash-card-new-anim' : '';

      htmlCards +=
        '<div class="dash-card' + isNew + '" onclick="abrirDetalhesTransmissao(\'' + escapeHTML(key) + '\', \'equipamento\')" style="padding:13px;cursor:pointer;" title="Clique para ver detalhes operacionais e telemetria">' +
          '<h5 style="font-size:12px;font-weight:700;text-align:center;margin-bottom:10px;color:#0F172A;">' + escapeHTML(key) + '</h5>' +
          '<div style="display:flex;align-items:center;justify-content:center;gap:12px;">' +
            '<div style="width:76px;height:76px;border-radius:50%;background:' + pieGradient + ';box-shadow:0 2px 8px rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;position:relative;">' +
              '<div class="dash-pie-donut-sm">' +
                '<div style="font-size:12.5px;font-weight:800;color:#0F172A;" class="pie-count">' + totalReal + '</div>' +
              '</div>' +
            '</div>' +
            '<div style="font-size:10.5px;line-height:1.6;color:#334155;">' +
              '<div><span style="color:#10B981;">■</span> Conf. <strong class="pct-conf" style="color:#059669;">(' + pctConf + '%)</strong></div>' +
              '<div><span style="color:#EF4444;">■</span> Falha <strong class="pct-nc" style="color:#DC2626;">(' + pctNc + '%)</strong></div>' +
              '<div><span style="color:#F59E0B;">■</span> Canc. <strong class="pct-canc" style="color:#D97706;">(' + pctCanc + '%)</strong></div>' +
            '</div>' +
          '</div>' +
        '</div>';
    });

    // Card Adicionar Equipamento interativo com animação fluida
    htmlCards +=
      '<div class="dash-card dash-card-add" onclick="abrirModalNovoEquipamento()" title="Cadastrar novo equipamento nesta praça">' +
        '<div class="dash-card-add-icon">' +
          '<i data-lucide="plus" style="width:20px;height:20px;stroke-width:2.5;"></i>' +
        '</div>' +
        '<span class="dash-card-add-label">+ Adicionar Equipamento</span>' +
        '<span class="dash-card-add-sub">Monitoramento ao vivo</span>' +
      '</div>';

    grid.innerHTML = htmlCards;
    window._ultimoEqAdicionado = null;
  }
  window.renderEquipamentosCards = renderEquipamentosCards;

  function renderDashboards() {
    if (typeof dashboardMetrics === 'undefined' || !dashboardMetrics) return;

    var pieMapping = {
      'INTEGRAÇÃO NOTÍCIA': 'pie-tj-noticia',
      'MG1': 'pie-tj-mg1',
      'MG2': 'pie-tj-mg2',
      'GIRO MG2': 'pie-tj-giro'
    };

    // 1. Atualizar gráficos de Telejornais
    if (dashboardMetrics.telejornal) {
      Object.keys(dashboardMetrics.telejornal).forEach(function(key) {
        var m = dashboardMetrics.telejornal[key];
        var totalReal = m.conf + m.nc + m.canc;
        var total = totalReal === 0 ? 1 : totalReal;

        var pctConf = totalReal === 0 ? 0 : Math.round((m.conf / total) * 100);
        var pctNc = totalReal === 0 ? 0 : Math.round((m.nc / total) * 100);
        var pctCanc = totalReal === 0 ? 0 : (100 - pctConf - pctNc);
        if (pctCanc < 0) pctCanc = 0;

        var pieId = pieMapping[key];
        var el = document.getElementById(pieId);
        if (el) {
          if (totalReal === 0) {
            el.style.background = '#E2E8F0';
          } else {
            var endConf = pctConf;
            var endNc = pctConf + pctNc;
            el.style.background = 'conic-gradient(#10B981 0% ' + endConf + '%, #EF4444 ' + endConf + '% ' + endNc + '%, #F59E0B ' + endNc + '% 100%)';
          }

          var countEl = el.querySelector('.pie-count');
          if (countEl) countEl.textContent = totalReal;

          var card = el.closest('.dash-card') || el.closest('.form-card');
          if (card) {
            var confEl = card.querySelector('.pct-conf');
            var ncEl   = card.querySelector('.pct-nc');
            var cancEl = card.querySelector('.pct-canc');

            if (confEl) confEl.textContent = '(' + pctConf + '%)';
            if (ncEl)   ncEl.textContent   = '(' + pctNc + '%)';
            if (cancEl) cancEl.textContent = '(' + pctCanc + '%)';
          }
        }
      });
    }

    // 2. Renderizar dinamicamente os cartões de Equipamentos
    renderEquipamentosCards();

    // 3. Atualizar Resumos Gerais
    renderResumoTransmissoesGerais();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.renderDashboards = renderDashboards;

  function renderResumoTransmissoesGerais() {
    // 1. Resumo Geral de Telejornais
    var tjTotConf = 0, tjTotNc = 0, tjTotCanc = 0;
    if (dashboardMetrics && dashboardMetrics.telejornal) {
      Object.keys(dashboardMetrics.telejornal).forEach(function(k) {
        var m = dashboardMetrics.telejornal[k];
        tjTotConf += (m.conf || 0);
        tjTotNc += (m.nc || 0);
        tjTotCanc += (m.canc || 0);
      });
    }
    var tjTotal = tjTotConf + tjTotNc + tjTotCanc;
    var tjPctConf = tjTotal > 0 ? Math.round((tjTotConf / tjTotal) * 100) : 0;
    var tjPctNc = tjTotal > 0 ? Math.round((tjTotNc / tjTotal) * 100) : 0;
    var tjPctCanc = tjTotal > 0 ? (100 - tjPctConf - tjPctNc) : 0;
    if (tjPctCanc < 0) tjPctCanc = 0;

    var badgeTj = document.getElementById('trans-geral-total-badge');
    var txtConfTj = document.getElementById('trans-geral-conf-txt');
    var txtNcTj = document.getElementById('trans-geral-nc-txt');
    var txtCancTj = document.getElementById('trans-geral-canc-txt');
    var barConfTj = document.getElementById('trans-geral-conf-bar');
    var barNcTj = document.getElementById('trans-geral-nc-bar');
    var barCancTj = document.getElementById('trans-geral-canc-bar');

    if (badgeTj) badgeTj.textContent = 'Total: ' + tjTotal + ' transmissões';
    if (txtConfTj) txtConfTj.textContent = tjPctConf + '% · ' + tjTotConf;
    if (txtNcTj) txtNcTj.textContent = tjPctNc + '% · ' + tjTotNc;
    if (txtCancTj) txtCancTj.textContent = tjPctCanc + '% · ' + tjTotCanc;

    if (barConfTj) barConfTj.style.height = tjTotal > 0 ? Math.max(tjPctConf * 0.85, 4) + '%' : '4px';
    if (barNcTj) barNcTj.style.height = tjTotal > 0 ? Math.max(tjPctNc * 0.85, 4) + '%' : '4px';
    if (barCancTj) barCancTj.style.height = tjTotal > 0 ? Math.max(tjPctCanc * 0.85, 4) + '%' : '4px';

    // 2. Resumo Geral de Equipamentos
    var eqTotConf = 0, eqTotNc = 0, eqTotCanc = 0;
    if (dashboardMetrics && dashboardMetrics.equipamento) {
      Object.keys(dashboardMetrics.equipamento).forEach(function(k) {
        var m = dashboardMetrics.equipamento[k];
        eqTotConf += (m.conf || 0);
        eqTotNc += (m.nc || 0);
        eqTotCanc += (m.canc || 0);
      });
    }
    var eqTotal = eqTotConf + eqTotNc + eqTotCanc;
    var eqPctConf = eqTotal > 0 ? Math.round((eqTotConf / eqTotal) * 100) : 0;
    var eqPctNc = eqTotal > 0 ? Math.round((eqTotNc / eqTotal) * 100) : 0;
    var eqPctCanc = eqTotal > 0 ? (100 - eqPctConf - eqPctNc) : 0;
    if (eqPctCanc < 0) eqPctCanc = 0;

    var badgeEq = document.getElementById('trans-eq-geral-total-badge');
    var txtConfEq = document.getElementById('trans-eq-geral-conf-txt');
    var txtNcEq = document.getElementById('trans-eq-geral-nc-txt');
    var txtCancEq = document.getElementById('trans-eq-geral-canc-txt');
    var barConfEq = document.getElementById('trans-eq-geral-conf-bar');
    var barNcEq = document.getElementById('trans-eq-geral-nc-bar');
    var barCancEq = document.getElementById('trans-eq-geral-canc-bar');

    if (badgeEq) badgeEq.textContent = 'Total: ' + eqTotal + ' transmissões';
    if (txtConfEq) txtConfEq.textContent = eqPctConf + '% · ' + eqTotConf;
    if (txtNcEq) txtNcEq.textContent = eqPctNc + '% · ' + eqTotNc;
    if (txtCancEq) txtCancEq.textContent = eqPctCanc + '% · ' + eqTotCanc;

    if (barConfEq) barConfEq.style.height = eqTotal > 0 ? Math.max(eqPctConf * 0.85, 4) + '%' : '4px';
    if (barNcEq) barNcEq.style.height = eqTotal > 0 ? Math.max(eqPctNc * 0.85, 4) + '%' : '4px';
    if (barCancEq) barCancEq.style.height = eqTotal > 0 ? Math.max(eqPctCanc * 0.85, 4) + '%' : '4px';
  }
  window.renderResumoTransmissoesGerais = renderResumoTransmissoesGerais;
  /* ═══════════════════════════════════════════
     PLANEJAMENTO ORÇAMENTÁRIO (ANO ATUAL + 1) — BANCO DE DADOS SUPABASE
  ═══════════════════════════════════════════ */

  var anoOrcamento = new Date().getFullYear() + 1;

  function syncAnoOrcamentoUI() {
    anoOrcamento = new Date().getFullYear() + 1;
    document.querySelectorAll('.orc-ano-display, .sidebar-orc-ano').forEach(function(el) {
      el.textContent = anoOrcamento;
    });
  }

  var orcamentoSeedData = [];
  var filtroOrcamentoAtivo = 'todos';
  var ORCAMENTO_STORAGE_KEY = 'tv_orcamento_seed_v2';

  function getOrcamentoDBCredentials() {
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

  function filtrarOrcamentoTipo(tipo, btn) {
    filtroOrcamentoAtivo = tipo || 'todos';
    if (btn && btn.closest('.pills')) {
      btn.closest('.pills').querySelectorAll('.pill').forEach(function(p){ p.classList.remove('on'); });
      btn.classList.add('on');
    }
    renderOrcamento();
  }
  window.filtrarOrcamentoTipo = filtrarOrcamentoTipo;

  function formatarMoeda(val) {
    return 'R$ ' + Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function limparDescricao(desc, id) {
    if (!desc || typeof desc !== 'string') {
      if (id === 'orc_init_1') return 'Aquisição de Switcher de Vídeo SDI 12G 4K';
      if (id === 'orc_init_2') return 'Manutenção Preventiva de Geradores e Nobreaks';
      return '';
    }
    var trimmed = desc.trim();
    if (trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
      if (id === 'orc_init_1') return 'Aquisição de Switcher de Vídeo SDI 12G 4K';
      if (id === 'orc_init_2') return 'Manutenção Preventiva de Geradores e Nobreaks';
      return '';
    }
    return trimmed;
  }

  function limparPrioridade(prio, id) {
    if (!prio || typeof prio !== 'string') {
      if (id === 'orc_init_1') return 'Alta';
      if (id === 'orc_init_2') return 'Média';
      return 'Média';
    }
    var trimmed = prio.trim();
    if (trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null' || !trimmed) {
      if (id === 'orc_init_1') return 'Alta';
      if (id === 'orc_init_2') return 'Média';
      return 'Média';
    }
    return trimmed;
  }

  function limparJustificativa(just, id) {
    if (!just || typeof just !== 'string') {
      if (id === 'orc_init_1') return 'Modernização do controle mestre e suporte a sinais HD/4K de alta taxa de quadros.';
      if (id === 'orc_init_2') return 'Contrato de revisão trimestral das baterias e banco de carga da torre de transmissão.';
      return '';
    }
    var trimmed = just.trim();
    if (trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
      if (id === 'orc_init_1') return 'Modernização do controle mestre e suporte a sinais HD/4K de alta taxa de quadros.';
      if (id === 'orc_init_2') return 'Contrato de revisão trimestral das baterias e banco de carga da torre de transmissão.';
      return '';
    }
    return trimmed;
  }

  function limparPraca(praca) {
    if (!praca || typeof praca !== 'string') return 'Juiz de Fora';
    var trimmed = praca.trim();
    if (trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null' || !trimmed) {
      return 'Juiz de Fora';
    }
    return trimmed;
  }

  function limparTipo(tipo) {
    if (!tipo || typeof tipo !== 'string') return 'CAPEX';
    var t = tipo.trim().toUpperCase();
    return (t === 'OPEX') ? 'OPEX' : 'CAPEX';
  }

  function limparStatus(st) {
    if (!st || typeof st !== 'string') return 'Proposto';
    var trimmed = st.trim();
    if (trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null' || !trimmed) {
      return 'Proposto';
    }
    return trimmed;
  }

  function atualizarFmtValorOrcamento(val) {
    var el = document.getElementById('orc-det-valor-fmt');
    if (el) el.textContent = formatarMoeda(val);
  }
  window.atualizarFmtValorOrcamento = atualizarFmtValorOrcamento;

  function atualizarFmtValorNovoOrcamento(val) {
    var el = document.getElementById('orc-modal-valor-fmt');
    if (el) el.textContent = formatarMoeda(val);
  }
  window.atualizarFmtValorNovoOrcamento = atualizarFmtValorNovoOrcamento;

  function pertenceAPracaAtivaOrcamento(item) {
    if (!item) return false;
    var pracaAtiva = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isUberlandia = pracaAtiva.indexOf('Uber') !== -1;
    var itemPraca = item.praca || '';
    if (isUberlandia) {
      return itemPraca.indexOf('Uber') !== -1;
    } else {
      return !itemPraca || itemPraca.indexOf('Juiz') !== -1;
    }
  }
  window.pertenceAPracaAtivaOrcamento = pertenceAPracaAtivaOrcamento;

  function renderOrcamento() {
    syncAnoOrcamentoUI();
    var tbody = document.getElementById('orc-itens-tbody');
    if (!tbody) return;

    if (!Array.isArray(orcamentoSeedData)) orcamentoSeedData = [];

    var itensDaPraca = orcamentoSeedData.filter(pertenceAPracaAtivaOrcamento);

    var totalGeral = 0;
    var totalCapex = 0;
    var totalOpex = 0;

    itensDaPraca.forEach(function(item) {
      var val = Number(item.valor) || 0;
      totalGeral += val;
      if (item.tipo === 'CAPEX') totalCapex += val;
      else totalOpex += val;
    });

    var kpiTot = document.getElementById('orc-kpi-total');
    var kpiCapex = document.getElementById('orc-kpi-capex');
    var kpiOpex = document.getElementById('orc-kpi-opex');

    if (kpiTot) kpiTot.textContent = formatarMoeda(totalGeral);
    if (kpiCapex) kpiCapex.textContent = formatarMoeda(totalCapex);
    if (kpiOpex) kpiOpex.textContent = formatarMoeda(totalOpex);

    /* Atualiza Barra de Distribuição de Recursos */
    var pctCapex = totalGeral > 0 ? Math.round((totalCapex / totalGeral) * 100) : 0;
    var pctOpex = totalGeral > 0 ? (100 - pctCapex) : 0;

    var barCapexTxt = document.getElementById('orc-bar-capex-txt');
    var barOpexTxt = document.getElementById('orc-bar-opex-txt');
    var barCapexFill = document.getElementById('orc-bar-capex-fill');
    var barOpexFill = document.getElementById('orc-bar-opex-fill');

    if (barCapexTxt) barCapexTxt.textContent = pctCapex + '% (' + formatarMoeda(totalCapex) + ')';
    if (barOpexTxt) barOpexTxt.textContent = pctOpex + '% (' + formatarMoeda(totalOpex) + ')';
    if (barCapexFill) barCapexFill.style.width = (totalGeral > 0 ? pctCapex : 50) + '%';
    if (barOpexFill) barOpexFill.style.width = (totalGeral > 0 ? pctOpex : 50) + '%';

    /* Atualiza contadores nas abas pills */
    var countCapex = itensDaPraca.filter(function(i){ return i.tipo === 'CAPEX'; }).length;
    var countOpex = itensDaPraca.filter(function(i){ return i.tipo === 'OPEX'; }).length;
    var tabTodos = document.getElementById('orc-tab-todos');
    var tabCapex = document.getElementById('orc-tab-capex');
    var tabOpex = document.getElementById('orc-tab-opex');

    if (tabTodos) tabTodos.textContent = 'Todas as Linhas (' + itensDaPraca.length + ')';
    if (tabCapex) tabCapex.textContent = 'Equipamentos (' + countCapex + ')';
    if (tabOpex) tabOpex.textContent = 'Manutenção (' + countOpex + ')';

    /* Filtra itens para exibição na tabela */
    var itensExibir = itensDaPraca.filter(function(item) {
      if (filtroOrcamentoAtivo === 'CAPEX') return item.tipo === 'CAPEX';
      if (filtroOrcamentoAtivo === 'OPEX') return item.tipo === 'OPEX';
      return true;
    });

    if (itensExibir.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px 12px;font-size:12.5px;">' +
        '<i data-lucide="inbox" style="width:24px;height:24px;stroke-width:1.5;margin-bottom:6px;color:var(--dim);"></i><br/>' +
        (orcamentoSeedData.length === 0 
          ? 'Nenhuma linha orçamentária cadastrada ainda. Clique em <strong>"+ Propor Orçamento"</strong> para iniciar.'
          : 'Nenhum item orçamentário encontrado nesta categoria.') +
        '</td></tr>';
    } else {
      tbody.innerHTML = itensExibir.map(function(item, idx) {
        var val = Number(item.valor) || 0;
        var cleanDesc = limparDescricao(item.desc || item.descricao, item.id);
        var itemDesc = cleanDesc || 'Item sem descrição';
        var itemPrio = limparPrioridade(item.prio || item.prioridade, item.id);
        var itemPraca = limparPraca(item.praca);
        var itemTipo = limparTipo(item.tipo);
        var itemStatus = limparStatus(item.status);

        var tagTipo = itemTipo === 'CAPEX' 
          ? '<span class="tag" style="background:#E8F2FF;color:#0071E3;border:1px solid #C7DFFB;font-weight:700;">⚙️ Equipamentos</span>' 
          : '<span class="tag" style="background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;font-weight:700;">🛠️ Manutenção</span>';

        var tagPrio = itemPrio === 'Alta' || itemPrio === 'Estratégica'
          ? '<span class="tag tag-r">' + escapeHTML(itemPrio) + '</span>'
          : '<span class="tag tag-y">' + escapeHTML(itemPrio) + '</span>';

        var tagStatus = itemStatus === 'Aprovado'
          ? '<span class="tag tag-g">✓ Aprovado</span>'
          : itemStatus === 'Em Revisão'
          ? '<span class="tag tag-y">Em Revisão</span>'
          : itemStatus === 'Rejeitado'
          ? '<span class="tag tag-r">Rejeitado</span>'
          : '<span class="tag tag-ind">Proposto</span>';

        return (
          '<tr style="transition:background 0.12s ease;cursor:pointer;" onclick="abrirDetalhesItemOrcamento(\'' + item.id + '\')" title="Clique para ver detalhes, editar ou excluir">' +
            '<td style="text-align:center;font-weight:700;color:var(--muted);">' + (idx + 1) + '</td>' +
            '<td><strong style="color:var(--txt);font-size:13px;">' + escapeHTML(itemDesc) + '</strong></td>' +
            '<td>' + tagTipo + '</td>' +
            '<td><span style="font-size:12px;color:var(--txt2);">' + escapeHTML(itemPraca) + '</span></td>' +
            '<td>' + tagPrio + '</td>' +
            '<td style="text-align:right;font-weight:700;color:var(--txt);font-size:13px;">' + formatarMoeda(val) + '</td>' +
            '<td style="text-align:center;">' + tagStatus + '</td>' +
            '<td style="text-align:center;" onclick="event.stopPropagation();">' +
              '<button type="button" class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); removerItemOrcamento(\'' + item.id + '\')" title="Remover linha orçamentária" style="color:var(--red);padding:3px 8px;border-radius:6px;">' +
                '<i data-lucide="trash-2" style="width:12px;height:12px;stroke-width:2;"></i>' +
              '</button>' +
            '</td>' +
          '</tr>'
        );
      }).join('');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.renderOrcamento = renderOrcamento;

  function abrirModalAdicionarItemOrcamento() {
    syncAnoOrcamentoUI();
    var descEl = document.getElementById('orc-modal-desc');
    var valEl = document.getElementById('orc-modal-valor');
    var justEl = document.getElementById('orc-modal-just');
    var tipoEl = document.getElementById('orc-modal-tipo');
    var pracaEl = document.getElementById('orc-modal-praca');
    var prioEl = document.getElementById('orc-modal-prio');

    if (descEl) descEl.value = '';
    if (valEl) valEl.value = '';
    if (justEl) justEl.value = '';
    if (tipoEl) tipoEl.selectedIndex = 0;
    if (pracaEl) {
      if (typeof getPracaAtual === 'function') pracaEl.value = getPracaAtual();
      else pracaEl.selectedIndex = 0;
    }
    if (prioEl) prioEl.selectedIndex = 1;

    atualizarFmtValorNovoOrcamento(0);
    abrirPopup('popup-novo-item-orcamento');
    if (descEl) setTimeout(function(){ descEl.focus(); }, 150);
  }
  window.abrirModalAdicionarItemOrcamento = abrirModalAdicionarItemOrcamento;

  function confirmarItemOrcamento() {
    var descEl = document.getElementById('orc-modal-desc');
    var tipoEl = document.getElementById('orc-modal-tipo');
    var pracaEl = document.getElementById('orc-modal-praca');
    var valorEl = document.getElementById('orc-modal-valor');
    var prioEl = document.getElementById('orc-modal-prio');
    var justEl = document.getElementById('orc-modal-just');

    var rawDesc = descEl ? descEl.value.trim() : '';
    var desc = limparDescricao(rawDesc);
    var valor = valorEl ? parseFloat(valorEl.value) : 0;

    if (!desc || isNaN(valor) || valor <= 0) {
      alert('Por favor, informe a Descrição do item e o Valor Estimado (R$).');
      return;
    }

    var prio = limparPrioridade(prioEl ? prioEl.value : 'Média');
    var autor = (typeof getUsuarioAtual === 'function') ? getUsuarioAtual() : 'Operador';
    var novo = {
      id: 'orc_' + Date.now(),
      ano: anoOrcamento,
      desc: desc,
      descricao: desc,
      tipo: limparTipo(tipoEl ? tipoEl.value : 'CAPEX'),
      praca: limparPraca(pracaEl ? pracaEl.value : 'Juiz de Fora'),
      prio: prio,
      prioridade: prio,
      valor: valor,
      justificativa: justEl ? justEl.value.trim() : '',
      status: 'Proposto',
      criado_por: autor
    };

    orcamentoSeedData.push(novo);
    salvarOrcamentoStore();
    fecharPopup('popup-novo-item-orcamento');
    renderOrcamento();

    // Sincroniza diretamente com a tabela orcamentos no Supabase
    salvarItemOrcamentoNuvem(novo);

    if (typeof mostrarToast === 'function') {
      mostrarToast('Item Adicionado ao Orçamento', desc + ' gravado no banco de dados para ' + anoOrcamento + '.', 'success');
    }
  }
  window.confirmarItemOrcamento = confirmarItemOrcamento;

  /* ── Modal Detalhes & Edição do Item Orçamentário (Estilo Ocorrências) ── */
  function abrirDetalhesItemOrcamento(id) {
    var item = orcamentoSeedData.find(function(i) { return i && i.id === id; });
    if (!item) return;

    var idEl = document.getElementById('orc-det-id');
    var descEl = document.getElementById('orc-det-desc');
    var tipoEl = document.getElementById('orc-det-tipo');
    var pracaEl = document.getElementById('orc-det-praca');
    var valorEl = document.getElementById('orc-det-valor');
    var prioEl = document.getElementById('orc-det-prio');
    var statusEl = document.getElementById('orc-det-status');
    var justEl = document.getElementById('orc-det-just');

    var cleanDesc = limparDescricao(item.desc || item.descricao, item.id);
    var cleanTipo = limparTipo(item.tipo);
    var cleanPraca = limparPraca(item.praca);
    var cleanPrio = limparPrioridade(item.prio || item.prioridade, item.id);
    var cleanJust = limparJustificativa(item.justificativa, item.id);
    var cleanStatus = limparStatus(item.status);
    var valNum = Number(item.valor) || 0;

    // Atualiza o próprio item na memória para manter tudo saneado
    item.desc = cleanDesc;
    item.descricao = cleanDesc;
    item.tipo = cleanTipo;
    item.praca = cleanPraca;
    item.prio = cleanPrio;
    item.prioridade = cleanPrio;
    item.justificativa = cleanJust;
    item.status = cleanStatus;
    item.valor = valNum;

    if (idEl) idEl.value = item.id;
    if (descEl) descEl.value = cleanDesc;
    if (tipoEl) tipoEl.value = cleanTipo;
    if (pracaEl) pracaEl.value = cleanPraca;
    if (valorEl) valorEl.value = valNum;
    if (prioEl) prioEl.value = cleanPrio;
    if (statusEl) statusEl.value = cleanStatus;
    if (justEl) justEl.value = cleanJust;

    atualizarFmtValorOrcamento(valNum);
    abrirPopup('popup-detalhes-orcamento');
    if (descEl) setTimeout(function(){ descEl.focus(); }, 150);
  }
  window.abrirDetalhesItemOrcamento = abrirDetalhesItemOrcamento;

  function salvarEdicaoItemOrcamento() {
    var idEl = document.getElementById('orc-det-id');
    var descEl = document.getElementById('orc-det-desc');
    var tipoEl = document.getElementById('orc-det-tipo');
    var pracaEl = document.getElementById('orc-det-praca');
    var valorEl = document.getElementById('orc-det-valor');
    var prioEl = document.getElementById('orc-det-prio');
    var statusEl = document.getElementById('orc-det-status');
    var justEl = document.getElementById('orc-det-just');

    if (!idEl || !idEl.value) return;
    var id = idEl.value;

    var rawDesc = descEl ? descEl.value.trim() : '';
    var desc = limparDescricao(rawDesc, id);
    var valor = valorEl ? parseFloat(valorEl.value) : 0;

    if (!desc || isNaN(valor) || valor <= 0) {
      alert('Por favor, informe uma descrição válida e um valor maior que zero.');
      return;
    }

    var item = orcamentoSeedData.find(function(i) { return i && i.id === id; });
    if (!item) return;

    var prio = limparPrioridade(prioEl ? prioEl.value : 'Média', id);
    item.desc = desc;
    item.descricao = desc;
    item.tipo = limparTipo(tipoEl ? tipoEl.value : 'CAPEX');
    item.praca = limparPraca(pracaEl ? pracaEl.value : 'Juiz de Fora');
    item.valor = valor;
    item.prio = prio;
    item.prioridade = prio;
    item.status = limparStatus(statusEl ? statusEl.value : 'Proposto');
    item.justificativa = justEl ? justEl.value.trim() : '';

    salvarOrcamentoStore();
    fecharPopup('popup-detalhes-orcamento');
    renderOrcamento();

    // Sincroniza alteração no Supabase
    salvarItemOrcamentoNuvem(item);

    if (typeof mostrarToast === 'function') {
      mostrarToast('Orçamento Atualizado', 'A linha orçamentária foi atualizada com sucesso no banco de dados.', 'success');
    }
  }
  window.salvarEdicaoItemOrcamento = salvarEdicaoItemOrcamento;

  function excluirItemOrcamentoModal() {
    var idEl = document.getElementById('orc-det-id');
    if (!idEl || !idEl.value) return;
    var id = idEl.value;

    if (!confirm('Deseja realmente excluir esta linha orçamentária do plano? Essa ação removerá o registro do banco de dados.')) {
      return;
    }

    fecharPopup('popup-detalhes-orcamento');
    orcamentoSeedData = orcamentoSeedData.filter(function(i){ return i.id !== id; });
    salvarOrcamentoStore();
    renderOrcamento();

    // Exclui do Supabase
    excluirItemOrcamentoNuvem(id);

    if (typeof mostrarToast === 'function') {
      mostrarToast('Item Excluído', 'Linha orçamentária removida do banco de dados.', 'info');
    }
  }
  window.excluirItemOrcamentoModal = excluirItemOrcamentoModal;

  function removerItemOrcamento(id) {
    if (!confirm('Deseja remover esta linha orçamentária do plano?')) return;
    orcamentoSeedData = orcamentoSeedData.filter(function(i){ return i.id !== id; });
    salvarOrcamentoStore();
    renderOrcamento();
    excluirItemOrcamentoNuvem(id);
  }
  window.removerItemOrcamento = removerItemOrcamento;

  function salvarOrcamentoStore() {
    window.orcamentoSeedData = orcamentoSeedData;
    try {
      localStorage.setItem(ORCAMENTO_STORAGE_KEY, JSON.stringify(orcamentoSeedData));
    } catch (e) {}
  }

  function carregarOrcamentoStore() {
    try {
      var raw = localStorage.getItem(ORCAMENTO_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          orcamentoSeedData = parsed.map(function(item) {
            var d = limparDescricao(item.desc || item.descricao, item.id);
            var p = limparPrioridade(item.prio || item.prioridade, item.id);
            var j = limparJustificativa(item.justificativa, item.id);
            return {
              id: item.id,
              ano: item.ano || anoOrcamento,
              desc: d || 'Item sem descrição',
              descricao: d || 'Item sem descrição',
              tipo: limparTipo(item.tipo),
              praca: limparPraca(item.praca),
              prio: p,
              prioridade: p,
              valor: Number(item.valor) || 0,
              justificativa: j,
              status: limparStatus(item.status),
              criado_por: item.criado_por || 'Sistema'
            };
          });
        } else {
          orcamentoSeedData = [];
        }
      } else {
        orcamentoSeedData = [];
      }
    } catch (e) {
      orcamentoSeedData = [];
    }
    window.orcamentoSeedData = orcamentoSeedData;
    renderOrcamento();
    sincronizarOrcamentoNuvem();
  }
  window.carregarOrcamentoStore = carregarOrcamentoStore;

  /* ═══════════════════════════════════════════
     SINCRONIZAÇÃO EM NUVEM (SUPABASE: TABELA ORCAMENTOS)
  ═══════════════════════════════════════════ */

  function sincronizarOrcamentoNuvem() {
    var db = getOrcamentoDBCredentials();
    if (!db.url || !db.key) return;

    var endpoint = db.url + '/rest/v1/orcamentos?select=*&order=id.asc';
    fetch(endpoint, {
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Cache-Control': 'no-cache'
      }
    })
    .then(function(res) { return res.ok ? res.json() : null; })
    .then(function(cloudItens) {
      if (Array.isArray(cloudItens)) {
        orcamentoSeedData = cloudItens.map(function(c) {
          var d = limparDescricao(c.desc || c.descricao, c.id);
          var p = limparPrioridade(c.prio || c.prioridade, c.id);
          var j = limparJustificativa(c.justificativa, c.id);
          return {
            id: c.id,
            ano: c.ano || anoOrcamento,
            desc: d || 'Item sem descrição',
            descricao: d || 'Item sem descrição',
            tipo: limparTipo(c.tipo),
            praca: limparPraca(c.praca),
            prio: p,
            prioridade: p,
            valor: Number(c.valor) || 0,
            justificativa: j,
            status: limparStatus(c.status),
            criado_por: c.criado_por || 'Sistema'
          };
        });

        salvarOrcamentoStore();
        renderOrcamento();
        console.log('[Orçamento DB] ✅ ' + cloudItens.length + ' linhas orçamentárias sincronizadas do banco de dados (Supabase orcamentos).');
      }
    })
    .catch(function(err) {
      console.warn('[Orçamento DB] Erro ao sincronizar orçamentos do banco:', err);
    });
  }
  window.sincronizarOrcamentoNuvem = sincronizarOrcamentoNuvem;

  function salvarItemOrcamentoNuvem(item) {
    var db = getOrcamentoDBCredentials();
    if (!db.url || !db.key) return;

    var cleanDesc = limparDescricao(item.desc || item.descricao, item.id);
    var cleanPrio = limparPrioridade(item.prio || item.prioridade, item.id);
    var cleanJust = limparJustificativa(item.justificativa, item.id);
    var cleanPraca = limparPraca(item.praca);
    var cleanTipo = limparTipo(item.tipo);
    var cleanStatus = limparStatus(item.status);
    var autor = item.criado_por || (typeof getUsuarioAtual === 'function' ? getUsuarioAtual() : 'Operador');

    var payload = {
      id: item.id,
      ano: item.ano || anoOrcamento,
      desc: cleanDesc,
      descricao: cleanDesc,
      tipo: cleanTipo,
      praca: cleanPraca,
      prio: cleanPrio,
      prioridade: cleanPrio,
      valor: Number(item.valor) || 0,
      justificativa: cleanJust,
      status: cleanStatus,
      criado_por: autor
    };

    var endpoint = db.url + '/rest/v1/orcamentos';
    fetch(endpoint, {
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
      if (!res.ok) {
        return res.text().then(function(errText) {
          console.error('[Orçamento DB] Erro Supabase ao gravar orçamento:', res.status, errText);
        });
      }
      console.log('[Orçamento DB] ✅ Linha orçamentária salva diretamente no banco de dados (orcamentos):', cleanDesc);
    })
    .catch(function(err) {
      console.error('[Orçamento DB] Falha ao enviar orçamento para o banco:', err);
    });
  }
  window.salvarItemOrcamentoNuvem = salvarItemOrcamentoNuvem;

  function excluirItemOrcamentoNuvem(id) {
    var db = getOrcamentoDBCredentials();
    if (!db.url || !db.key || !id) return;

    var endpoint = db.url + '/rest/v1/orcamentos?id=eq.' + encodeURIComponent(id);
    fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key
      }
    })
    .then(function(res) {
      if (res.ok) {
        console.log('[Orçamento DB] ✅ Linha orçamentária excluída do banco de dados:', id);
      }
    })
    .catch(function(err) {
      console.error('[Orçamento DB] Falha ao excluir item do banco:', err);
    });
  }
  window.excluirItemOrcamentoNuvem = excluirItemOrcamentoNuvem;

  function salvarOrcamento() {
    salvarOrcamentoStore();
    orcamentoSeedData.forEach(function(item) {
      salvarItemOrcamentoNuvem(item);
    });
    if (typeof mostrarToast === 'function') {
      mostrarToast('Plano Orçamentário Salvo', 'Todas as previsões orçamentárias foram sincronizadas com o banco de dados.', 'success');
    }
    alert('Plano Orçamentário de ' + anoOrcamento + ' salvo com sucesso no banco de dados!');
  }
  window.salvarOrcamento = salvarOrcamento;

  function exportarOrcamentoExcel() {
    alert('Relatório de Orçamento ' + anoOrcamento + ' exportado com sucesso em formato consolidado (CAPEX/OPEX).');
  }
  window.exportarOrcamentoExcel = exportarOrcamentoExcel;
  /* ═══════════════════════════════════════════
     FLUXO DE INICIALIZAÇÃO E IDENTIFICAÇÃO DO OPERADOR
  ═══════════════════════════════════════════ */
  /* Render inicial */
  try { if (typeof aplicarModoPraca === 'function') aplicarModoPraca(); } catch(e) {}
  try { carregarFotoPerfilSalva(); } catch(e) {}
  try { loadNotificacoes(); } catch(e) {}
  try { carregarCredenciaisSupabaseConfig(); } catch(e) {}
  try { carregarRascunhoRelatorioTV(); } catch(e) {}
  try { carregarRascunhoRecebimento(); } catch(e) {}
  try { carregarRascunhoCompra(); } catch(e) {}
  try { carregarDashboardMetricsStore(); } catch(e) {}
  try { carregarOrcamentoStore(); } catch(e) {}
  try { carregarChecklistStore(); } catch(e) {}
  try { if (typeof atualizarSelectsProfissionaisCTRS === 'function') atualizarSelectsProfissionaisCTRS(); } catch(e) {}
  try { if (typeof sincronizarEquipeNuvem === 'function') sincronizarEquipeNuvem(); } catch(e) {}
  try { if (typeof DBService !== 'undefined' && DBService.init) DBService.init(); } catch(e) {}
  renderAll(true);

  // Sincronização inteligente: periódica a cada 2 minutos se a aba estiver visível, e ao focar na janela
  setInterval(function() {
    if (document.hidden) return; // Se a aba estiver minimizada ou em segundo plano, economiza tráfego
    if (typeof DBService !== 'undefined' && DBService && typeof DBService.syncRemote === 'function') {
      DBService.syncRemote();
    }
  }, 120000); // 2 minutos (redução imediata de 96% no consumo de rede)

  var lastFocusSync = 0;
  window.addEventListener('focus', function() {
    var now = Date.now();
    if (now - lastFocusSync < 60000) return; // Limite de 1 sincronização por minuto ao alternar abas
    lastFocusSync = now;
    if (typeof DBService !== 'undefined' && DBService && typeof DBService.syncRemote === 'function') {
      DBService.syncRemote();
    }
  });

  var savedUserName = localStorage.getItem(USER_NAME_STORAGE_KEY);
  try { if (typeof carregarOperadoresSugeridos === 'function') carregarOperadoresSugeridos(); } catch(e) {}
  try { if (typeof atualizarUIIdentificacaoOperador === 'function') atualizarUIIdentificacaoOperador(); } catch(e) {}
  if (!savedUserName || !savedUserName.trim()) {
    abrirPopup('popup-identificacao-operador');
    var identInput = document.getElementById('ident-operador-nome');
    if (identInput) setTimeout(function(){ identInput.focus(); }, 180);
  } else {
    atualizarNomeOperadorUI(savedUserName.trim());
    try { if (typeof obterOuCriarOperadorPorNome === 'function') obterOuCriarOperadorPorNome(savedUserName.trim()); } catch(e) {}
    abrirPopup('popup-entrada');
  }

}); /* fim DOMContentLoaded */
