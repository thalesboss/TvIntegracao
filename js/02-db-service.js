document.addEventListener('DOMContentLoaded', function () {
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
  function sanitizeIdAttr(id) {
    if (id === null || id === undefined) return '';
    return String(id).replace(/[^a-zA-Z0-9_.:-]/g, '');
  }
  window.sanitizeIdAttr = sanitizeIdAttr;
  function sanitizeMediaUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return '';
    var u = urlStr.trim();
    if (/^https?:\/\//i.test(u)) return escapeHTML(u);
    if (/^data:(image\/(jpeg|jpg|png|gif|webp|bmp)|video\/(mp4|webm|ogg|quicktime)|application\/pdf);base64,/i.test(u)) return u;
    if (/^blob:/i.test(u)) return escapeHTML(u);
    return '';
  }
  window.sanitizeMediaUrl = sanitizeMediaUrl;
  function obterTagPerfilAtual() {
    var tag = localStorage.getItem('tv_user_tag_v1') || 'Tecnico';
    return String(tag).trim();
  }
  window.obterTagPerfilAtual = obterTagPerfilAtual;
  function verificarPermissaoPerfil(perfisPermitidos, acaoLabel) {
    var tagAtual = obterTagPerfilAtual();
    var lista = Array.isArray(perfisPermitidos) ? perfisPermitidos : ['TI/ADM', 'Gestor'];
    var permitido = lista.some(function(p) { return p.toLowerCase() === tagAtual.toLowerCase(); });
    if (!permitido) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Permissão Restrita', 'A ação "' + (acaoLabel || 'solicitada') + '" requer perfil ' + lista.join(' ou ') + ' (seu perfil: ' + tagAtual + ').', 'warning');
      }
      return false;
    }
    return true;
  }
  window.verificarPermissaoPerfil = verificarPermissaoPerfil;
  var IGNORED_LEGACY_OC_IDS = ['oc_1787932348110'];
  function isIdLegadoIgnorado(id) {
    if (!id) return false;
    var s = String(id);
    return s.indexOf('oc_init_') === 0 || IGNORED_LEGACY_OC_IDS.indexOf(s) !== -1;
  }
  window.isIdLegadoIgnorado = isIdLegadoIgnorado;
  function normalizarUrlExterna(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return '';
    var u = urlStr.trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    return u;
  }
  window.normalizarUrlExterna = normalizarUrlExterna;
  function renderBotaoLinkExterno(urlStr, labelTexto, compact) {
    var u = normalizarUrlExterna(urlStr);
    if (!u) return '';
    var lbl = labelTexto || 'Abrir Link Anexo';
    try {
      var parsed = new URL(u);
      var host = parsed.hostname.replace(/^www\./i, '');
      if (host.indexOf('sharepoint.com') !== -1) lbl = 'Abrir Planilha / SharePoint (' + host + ')';
      else if (host.indexOf('docs.google.com') !== -1 || host.indexOf('drive.google.com') !== -1) lbl = 'Abrir Google Drive / Docs (' + host + ')';
      else if (!labelTexto) lbl = 'Abrir Link (' + host + ')';
    } catch (e) {}
    var pad = compact ? '4px 10px' : '6px 12px';
    var fz = compact ? '11px' : '11.5px';
    return '<a href="' + escapeHTML(u) + '" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" style="display:inline-flex;align-items:center;gap:6px;padding:' + pad + ';background:#EFF6FF;color:#0071E3;border:1px solid #BFDBFE;border-radius:8px;font-size:' + fz + ';font-weight:700;text-decoration:none;max-width:100%;box-sizing:border-box;transition:all 0.15s ease;" onmouseover="this.style.background=\'#DBEAFE\';this.style.borderColor=\'#93C5FD\';" onmouseout="this.style.background=\'#EFF6FF\';this.style.borderColor=\'#BFDBFE\';" title="' + escapeHTML(u) + '">' +
      '<i data-lucide="external-link" style="width:13px;height:13px;flex-shrink:0;color:#0071E3;stroke-width:2.2;"></i>' +
      '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHTML(lbl) + '</span>' +
    '</a>';
  }
  window.renderBotaoLinkExterno = renderBotaoLinkExterno;
  function formatarTextoComLinks(str, stopProp) {
    if (str === null || str === undefined) return '';
    var texto = String(str);
    var regexUrl = /(https?:\/\/[^\s<>"']+)/gi;
    var partes = texto.split(regexUrl);
    if (partes.length === 1) return escapeHTML(texto);
    var out = '';
    for (var i = 0; i < partes.length; i++) {
      var p = partes[i];
      if (!p) continue;
      if (/^https?:\/\//i.test(p)) {
        var cleanUrl = p.replace(/[.,;!?)]+$/, '');
        var trailing = p.slice(cleanUrl.length);
        out += renderBotaoLinkExterno(cleanUrl, null, stopProp) + escapeHTML(trailing);
      } else {
        out += escapeHTML(p);
      }
    }
    return out;
  }
  window.formatarTextoComLinks = formatarTextoComLinks;
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
    var conectada = isEstacaoConectadaTV();
    var boxChaveLogin = document.getElementById('ident-box-chave-estacao');
    if (boxChaveLogin) {
      boxChaveLogin.style.display = conectada ? 'none' : 'block';
    }
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
  var JF_EXCLUSIVOS = ['NET PRAÇA', 'NET PORTARIA', 'FORMATOS NET', 'NET 2º ANDAR', 'NET 3º ANDAR', 'NET 4º ANDAR', 'KMJ'];
  function normalizarPracaOcorrencia(praca, local, titulo, equipamento) {
    var l = (local || '').toString();
    var t = (titulo || '').toString();
    var p = (praca || '').toString().trim();
    var eq = (equipamento || '').toString().toUpperCase();
    if (l.indexOf('Juiz') !== -1 || t.indexOf('Juiz') !== -1) {
      return 'Juiz de Fora';
    }
    if (l.indexOf('Uber') !== -1 || t.indexOf('Uber') !== -1) {
      return 'Uberlândia';
    }
    for (var i = 0; i < JF_EXCLUSIVOS.length; i++) {
      if (eq === JF_EXCLUSIVOS[i] || t.toUpperCase().indexOf(JF_EXCLUSIVOS[i]) !== -1) {
        return 'Juiz de Fora';
      }
    }
    if (p) {
      return p.indexOf('Uber') !== -1 ? 'Uberlândia' : 'Juiz de Fora';
    }
    return 'Juiz de Fora';
  }
  window.normalizarPracaOcorrencia = normalizarPracaOcorrencia;
  function isValorAtribuicaoGenerico(val) {
    if (!val) return true;
    var v = String(val).trim().toLowerCase();
    return v === 'todos do turno' ||
           v === 'equipe do turno (todos)' ||
           v === 'equipe do turno' ||
           v === 'técnico de turno' ||
           v === 'tecnico de turno' ||
           v === 'supervisão' ||
           v === 'supervisao' ||
           v === 'coordenação & supervisão' ||
           v === 'supervisão & coordenação' ||
           v === 'suporte de ti' ||
           v === 'tecnologia da informação (ti)' ||
           v === 'sistema' ||
           v === 'operador';
  }
  window.isValorAtribuicaoGenerico = isValorAtribuicaoGenerico;
  function obterCriadorOcorrencia(item) {
    if (!item) return getUsuarioAtual();
    var c = item.criadoPor || (item.resolucao && item.resolucao.criadoPor) || '';
    if (c && !isValorAtribuicaoGenerico(c)) {
      return String(c).replace(/\s*\((Você|Atribuir a mim)\)\s*/i, '').trim();
    }
    if (item.resp && !isValorAtribuicaoGenerico(item.resp)) {
      return String(item.resp).replace(/\s*\((Você|Atribuir a mim)\)\s*/i, '').trim();
    }
    if (item.historicoEdicoes && Array.isArray(item.historicoEdicoes) && item.historicoEdicoes.length > 0) {
      var ult = item.historicoEdicoes[item.historicoEdicoes.length - 1];
      if (ult && ult.autor && !isValorAtribuicaoGenerico(ult.autor)) return ult.autor;
    }
    return getUsuarioAtual();
  }
  window.obterCriadorOcorrencia = obterCriadorOcorrencia;
  function formatarAtribuicaoResp(resp) {
    if (!resp) return 'Equipe do Turno (Todos)';
    var r = String(resp).trim();
    if (r === 'Todos do turno' || r === 'Técnico de Turno') return 'Equipe do Turno (Todos)';
    if (r === 'Supervisão') return 'Coordenação & Supervisão';
    if (r === 'Suporte de TI') return 'Tecnologia da Informação (TI)';
    return r;
  }
  window.formatarAtribuicaoResp = formatarAtribuicaoResp;
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
      if (item.historicoEdicoes && Array.isArray(item.historicoEdicoes) && item.historicoEdicoes.length > 0) {
        resObj.historicoEdicoes = item.historicoEdicoes;
      }
      if (item.link) {
        resObj.link = item.link;
      }
      if (item.criadoPor) {
        resObj.criadoPor = item.criadoPor;
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
        praca: normalizarPracaOcorrencia(item.praca, item.local, item.titulo, item.equipamento || (item.tags && item.tags[1]))
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
          }
        }).catch(function(err) {
          console.warn('[DBService Cloud] Erro no envio pontual da ocorrência:', err);
        });
      } catch(e) {
        console.warn('[DBService Cloud] Exceção em upsertOcorrenciaRemota:', e);
      }
    },
    formatHistoricoPayload: function(h) {
      if (!h || !h.id) return null;
      var descRes = h.descResolucao || '';
      if (h.detalhesRonda && typeof h.detalhesRonda === 'object' && descRes.indexOf('<!--RONDA_JSON:') === -1) {
        try {
          descRes = (descRes ? descRes + ' ' : '') + '<!--RONDA_JSON:' + encodeURIComponent(JSON.stringify(h.detalhesRonda)) + '-->';
        } catch (eRonda) {}
      }
      return {
        id: h.id,
        tipo: h.tipo || 'relatorio',
        subtipo: h.subtipo || '',
        titulo: h.titulo || '',
        equipamento: h.equipamento || '',
        categoria: h.categoria || '',
        local: h.local || 'Juiz de Fora',
        dataCriacao: h.dataCriacao || '',
        criadoPor: h.criadoPor || 'Operador',
        descCriacao: h.descCriacao || '',
        status: h.status || 'Concluído',
        dataResolucao: h.dataResolucao || h.dataCriacao || '',
        resolvidoPor: h.resolvidoPor || h.criadoPor || '',
        descResolucao: descRes,
        praca: h.praca || h.local || 'Juiz de Fora'
      };
    },
    pushHistoricoItem: function(histItem) {
      if (!this.url || !this.key || !histItem) return;
      try {
        var payload = this.formatHistoricoPayload(histItem);
        if (!payload) return;
        var endpoint = this.url.replace(/\/$/, '') + '/rest/v1/historico';
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
            console.warn('[DBService Cloud] Falha ao enviar item de histórico (' + res.status + '):', histItem.id);
          } else {
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
        } else if (table === 'historico') {
          payload = data.map(function(item) {
            return self.formatHistoricoPayload(item);
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
          var urlOc = self.url.replace(/\/$/, '') + '/rest/v1/ocorrencias?select=*&order=criado.desc&limit=500';
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
          var urlHist = self.url.replace(/\/$/, '') + '/rest/v1/historico?select=*&order=dataCriacao.desc&limit=500';
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
              remoteFiltered.forEach(function(h){
                if (h && !h.detalhesRonda && h.descResolucao && String(h.descResolucao).indexOf('<!--RONDA_JSON:') !== -1) {
                  try {
                    var mRonda = String(h.descResolucao).match(/<!--RONDA_JSON:([^>]+)-->/);
                    if (mRonda && mRonda[1]) h.detalhesRonda = JSON.parse(decodeURIComponent(mRonda[1]));
                  } catch (eR) {}
                }
                if (h && !h.dadosCTRS && h.descResolucao && String(h.descResolucao).indexOf('<!--CTRS_JSON:') !== -1) {
                  try {
                    var mCtrs = String(h.descResolucao).match(/<!--CTRS_JSON:([^>]+)-->/);
                    if (mCtrs && mCtrs[1]) h.dadosCTRS = JSON.parse(decodeURIComponent(mCtrs[1]));
                  } catch (eC) {}
                }
                mapHist[h.id] = h;
              });
              (historicoSeedData || []).forEach(function(localH){
                if (localH && localH.id) {
                  if (mapHist[localH.id]) {
                    if (localH.htmlRelatorio && !mapHist[localH.id].htmlRelatorio) {
                      mapHist[localH.id].htmlRelatorio = localH.htmlRelatorio;
                    }
                    if (localH.dadosCTRS && !mapHist[localH.id].dadosCTRS) {
                      mapHist[localH.id].dadosCTRS = localH.dadosCTRS;
                    }
                    if (localH.detalhesRonda && !mapHist[localH.id].detalhesRonda) {
                      mapHist[localH.id].detalhesRonda = localH.detalhesRonda;
                    }
                  } else if (!idsNaLixeira.includes(localH.id) && localH.status !== 'lixeira') {
                    remoteFiltered.push(localH);
                  }
                }
              });
              historicoSeedData = remoteFiltered;
              window.historicoSeedData = historicoSeedData;
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
          try {
            if (typeof sincronizarChecklistNuvem === 'function') sincronizarChecklistNuvem();
          } catch(eChk) {}
          try {
            if (typeof sincronizarOrcamentoNuvem === 'function') sincronizarOrcamentoNuvem();
          } catch(eOrc) {}
          try {
            if (typeof sincronizarLixeiraNuvem === 'function') sincronizarLixeiraNuvem();
          } catch(eLix) {}
          try {
            if (typeof sincronizarNotificacoesNuvem === 'function') sincronizarNotificacoesNuvem();
          } catch(eNot) {}
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
  var _cloudConnected = true;
  var _reconnectTimer = null;
  var _reconnectAttempt = 0;
  var _isReconnecting = false;
  function iniciarReconexaoAutomatica() {
    if (_cloudConnected || _reconnectTimer || _isReconnecting) return;
    _reconnectAttempt++;
    var delayMs = Math.min(10000 * Math.pow(1.5, _reconnectAttempt - 1), 60000);
    _reconnectTimer = setTimeout(async function() {
      _reconnectTimer = null;
      if (_cloudConnected) return;
      _isReconnecting = true;
      try {
        if (typeof DBService !== 'undefined' && DBService && typeof DBService.syncRemote === 'function') {
          var ok = await DBService.syncRemote(true);
          if (ok !== false) {
            _cloudConnected = true;
            _reconnectAttempt = 0;
            _isReconnecting = false;
            updateCloudStatus(true, 'Sincronizado');
            if (typeof mostrarToast === 'function') {
              mostrarToast('Conexão Restabelecida', 'O sistema foi reconectado e seus dados estão sincronizados em tempo real.', 'success');
            }
            return;
          }
        }
      } catch (err) {
        console.warn('[DBService] Tentativa de reconexão falhou:', err);
      }
      _isReconnecting = false;
      if (!_cloudConnected) {
        iniciarReconexaoAutomatica();
      }
    }, delayMs);
  }
  function tentarReconectarImediato() {
    if (_cloudConnected) return;
    if (_reconnectTimer) {
      clearTimeout(_reconnectTimer);
      _reconnectTimer = null;
    }
    _reconnectAttempt = 0;
    iniciarReconexaoAutomatica();
  }
  window.tentarReconectarImediato = tentarReconectarImediato;
  function updateCloudStatus(isOnline, customText) {
    var indicator = document.getElementById('cloud-status-indicator');
    var btnTopbar = document.getElementById('btn-conectar-nuvem-topbar');
    if (isOnline) {
      _cloudConnected = true;
      _reconnectAttempt = 0;
      if (_reconnectTimer) {
        clearTimeout(_reconnectTimer);
        _reconnectTimer = null;
      }
      if (indicator) {
        indicator.className = 'cloud-status online';
        indicator.title = 'Sincronização ativa em tempo real (Clique para gerenciar)';
        indicator.innerHTML = '<span class="cloud-dot"></span><span class="cloud-text">' + (customText || 'Sincronizado') + '</span>';
      }
      if (btnTopbar) {
        btnTopbar.style.display = 'none';
      }
    } else {
      _cloudConnected = false;
      var estaConfigurado = typeof isEstacaoConectadaTV === 'function' ? isEstacaoConectadaTV() : false;
      var texto = customText || (estaConfigurado ? 'Reconectando...' : 'Modo Offline');
      if (indicator) {
        indicator.className = 'cloud-status offline';
        indicator.title = estaConfigurado
          ? 'Desconectado da rede — reconectando automaticamente... (Clique para gerenciar)'
          : 'Modo Offline (Clique para conectar à rede)';
        indicator.innerHTML = '<span class="cloud-dot"></span><span class="cloud-text">' + texto + '</span>';
      }
      if (btnTopbar) {
        btnTopbar.style.display = 'inline-flex';
      }
      if (estaConfigurado) {
        iniciarReconexaoAutomatica();
      }
    }
    try {
      if (typeof window.atualizarUIStatusBancoConfig === 'function') {
        window.atualizarUIStatusBancoConfig();
      }
    } catch(eUI) {}
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.updateCloudStatus = updateCloudStatus;
  window._isCloudConnected = function() { return _cloudConnected; };
  window.addEventListener('online', function() {
    tentarReconectarImediato();
  });
  window.addEventListener('offline', function() {
    updateCloudStatus(false, 'Modo Local');
  });
  function sanitizeOcorrencia(o) {
    if (!o || typeof o !== 'object') return null;
    var userAtual = getUsuarioAtual();
    var isMine = !!o.mine;
    if (o.resp && (o.resp === userAtual || o.resp.indexOf(userAtual) !== -1 || o.resp.indexOf('Você') !== -1 || o.resp.indexOf('Atribuir a mim') !== -1)) {
      isMine = true;
    }
    var res = o.resolucao || null;
    var criadorExtraido = o.criadoPor || (res && res.criadoPor) || '';
    var anx = (o.anexos && Array.isArray(o.anexos) && o.anexos.length > 0)
      ? o.anexos
      : ((res && Array.isArray(res.anexos) && res.anexos.length > 0) ? res.anexos : []);
    if (anx.length > 0) {
      if (!res) res = { statusRes: (o.status === 'aberta' ? 'Aberta' : 'Resolvido'), anexos: anx };
      else if (!res.anexos || res.anexos.length === 0) res.anexos = anx;
    }
    if (criadorExtraido && res && !res.criadoPor) {
      res.criadoPor = criadorExtraido;
    }
    return {
      id: o.id || ('oc_' + Date.now()),
      titulo: o.titulo || 'Ocorrência sem título',
      prio: o.prio || 'Média',
      cat: o.cat || 'Equipamento',
      resp: formatarAtribuicaoResp(o.resp || 'Equipe do Turno (Todos)'),
      criadoPor: criadorExtraido,
      local: o.local || '',
      prazo: o.prazo || '',
      link: o.link || (res && res.link) || '',
      desc: o.desc || '',
      mine: isMine,
      tags: Array.isArray(o.tags) ? o.tags : [],
      status: o.status || 'aberta',
      criado: o.criado || Date.now(),
      dataCriacao: o.dataCriacao || formatDataHoraLocal(o.criado),
      equipamento: o.equipamento || null,
      equipamento_id: o.equipamento_id || '',
      telejornal: o.telejornal || null,
      historicoEdicoes: Array.isArray(o.historicoEdicoes) ? o.historicoEdicoes : ((res && Array.isArray(res.historicoEdicoes)) ? res.historicoEdicoes : []),
      ultimaEdicaoPor: o.ultimaEdicaoPor || (res && res.ultimaEdicaoPor) || null,
      ultimaEdicaoEm: o.ultimaEdicaoEm || (res && res.ultimaEdicaoEm) || null,
      htmlRelatorio: o.htmlRelatorio || null,
      dadosCTRS: o.dadosCTRS || null,
      resolucao: res,
      anexos: anx,
      praca: normalizarPracaOcorrencia(o.praca, o.local, o.titulo, o.equipamento || (o.tags && o.tags[1])),
      _synced: !!o._synced,
      _pendingSync: !!o._pendingSync
    };
  }
  function mesclarOcorrencias(locais, remotas, idsNaLixeira) {
    var lixeiraArr = idsNaLixeira || [];
    var mapa = {};
    var now = Date.now();
    (remotas || []).forEach(function(rRaw) {
      var r = sanitizeOcorrencia(rRaw);
      if (!r || !r.id || r.status === 'lixeira' || lixeiraArr.indexOf(r.id) !== -1 || isIdLegadoIgnorado(r.id)) return;
      r._synced = true;
      delete r._pendingSync;
      mapa[r.id] = r;
    });
    (locais || []).forEach(function(l) {
      if (!l || !l.id || l.status === 'lixeira' || lixeiraArr.indexOf(l.id) !== -1 || isIdLegadoIgnorado(l.id)) return;
      var r = mapa[l.id];
      if (!r) {
        if (l._synced) return;
        mapa[l.id] = l;
        try {
          if (typeof DBService !== 'undefined' && DBService && typeof DBService.upsertOcorrenciaRemota === 'function') {
            DBService.upsertOcorrenciaRemota(l, true);
          }
        } catch (eSync) {}
      } else {
        var localResolvida = (l.status === 'resolvida' && r.status !== 'resolvida');
        var editLocalRecente = (l.ultimaEdicaoEm && (!r.ultimaEdicaoEm || l.ultimaEdicaoEm > r.ultimaEdicaoEm));
        if (localResolvida || editLocalRecente) {
          mapa[l.id] = Object.assign({}, r, l);
        }
      }
    });
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
            ocorrencias = parsed.filter(function(o){ return o && !String(o.id).startsWith('oc_init_') && o.id !== 'oc_1787932348110'; }).map(sanitizeOcorrencia).filter(Boolean);
          }
        }
      } catch(e) {}
    } else {
      ocorrencias = ocorrencias.filter(function(o){ return o && o.id !== 'oc_1787932348110'; }).map(sanitizeOcorrencia).filter(Boolean);
    }
    return ocorrencias || [];
  }
  function save(list, itemModificado, isNovo) {
    ocorrencias = (list || []).filter(function(o){ return o && o.id !== 'oc_1787932348110'; });
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
          var limpos = parsed.filter(function(o){ return o && !String(o.id).startsWith('oc_init_') && o.id !== 'oc_1787932348110'; });
          var sanitizados = limpos.map(sanitizeOcorrencia).filter(Boolean);
          try {
            localStorage.setItem(OCORRENCIAS_CACHE_KEY, JSON.stringify(sanitizados));
          } catch(eClean) {}
          return sanitizados;
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
    var itemPraca = normalizarPracaOcorrencia(item.praca, item.local, item.titulo, item.equipamento || (item.tags && item.tags[1]));
    return isUberlandia ? (itemPraca === 'Uberlândia') : (itemPraca === 'Juiz de Fora');
  }
  window.pertenceAPracaAtiva = pertenceAPracaAtiva;
  function getAbertas()    { return ocorrencias.filter(function(o){ return o && o.status === 'aberta' && pertenceAPracaAtiva(o); }); }
  function getArquivadas() { return ocorrencias.filter(function(o){ return o && o.status === 'arquivada' && pertenceAPracaAtiva(o); }); }
  function getResolvidas() { return ocorrencias.filter(function(o){ return o && o.status === 'resolvida' && pertenceAPracaAtiva(o); }); }
  window.getAbertas = getAbertas;
  window.getArquivadas = getArquivadas;
  window.getResolvidas = getResolvidas;
