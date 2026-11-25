(function (window, document) {
  'use strict';

  var KEYS = Object.freeze({
    USER_NAME:          'tv_user_name_v1',
    USER_EMAIL:         'tv_user_email_v1',
    USER_TAG:           'tv_user_tag_v1',
    USER_CARGO:         'tv_user_cargo_v1',
    USER_PHOTO:         'tv_user_photo_v1',
    PRACA:              'tv_praca_ativa',
    TURNO_ATIVO:        'tv_turno_ativo_v1',
    OCORRENCIAS_CACHE:  'tv_ocorrencias_cache_v2',
    HISTORICO_CACHE:    'tv_historico_seed_v2',
    ORCAMENTO_CACHE:    'tv_orcamento_seed_v2',
    EQUIPAMENTOS_CACHE: 'tv_equipamentos_catalogo_v1',
    EQUIPAMENTOS_ORDEM: 'tv_equipamentos_ordem_custom_v1',
    CHECKLIST_CACHE:    'tv_checklist_itens_cache_v2',
    CHECKLIST_REC:      'tv_checklist_recorrencias_v1',
    NOTIF_CACHE:        'tv_notificacoes_v2',
    NOTIF_DISMISSED:    'tv_notificacoes_dismissed_v2',
    CONFIG_PREFS:       'tv_config_prefs_v1',
    EQUIPE_JORNALISMO:  'tv_equipe_jornalismo_v3',
    SUPABASE_URL:       'tv_supabase_url',
    SUPABASE_KEY:       'tv_supabase_key'
  });

  /* ─── 1. Camada de Segurança (XSS, Sanitização DOM, URLs e Impressão Segura) ─── */
  var Security = {
    escapeHTML: function (str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /* Segura para interpolar dentro de onclick="fn('...')" em atributos HTML */
    escapeJSString: function (str) {
      if (str === null || str === undefined) return '';
      var jsEscaped = String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
      return Security.escapeHTML(jsEscaped);
    },

    sanitizeIdAttr: function (id) {
      if (id === null || id === undefined) return '';
      return String(id).replace(/[^a-zA-Z0-9_.:-]/g, '');
    },

    sanitizeMediaUrl: function (urlStr) {
      if (!urlStr || typeof urlStr !== 'string') return '';
      var u = urlStr.trim();
      if (/^https?:\/\//i.test(u)) return Security.escapeHTML(u);
      if (/^data:(image\/(jpeg|jpg|png|gif|webp|bmp)|video\/(mp4|webm|ogg|quicktime)|application\/pdf);base64,[a-z0-9+/=\s]+$/i.test(u)) {
        return u.replace(/\s+/g, '');
      }
      if (/^blob:https?:\/\//i.test(u) || /^blob:null\//i.test(u)) return Security.escapeHTML(u);
      return '';
    },

    sanitizeCssBgUrl: function (rawCssUrl) {
      if (!rawCssUrl || typeof rawCssUrl !== 'string') return '';
      var m = rawCssUrl.trim().match(/^url\(\s*['"]?([^'")]+)['"]?\s*\)$/i);
      var inner = m ? m[1] : rawCssUrl.trim();
      var safe = Security.sanitizeMediaUrl(inner);
      if (!safe) return '';
      return 'url("' + safe.replace(/"/g, '') + '")';
    },

    sanitizeExternalUrl: function (urlStr) {
      if (!urlStr || typeof urlStr !== 'string') return '';
      var u = urlStr.trim();
      if (!u) return '';
      if (/^(javascript|vbscript|data|file|blob):/i.test(u)) return '';
      if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
      try {
        var parsed = new URL(u);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
        return parsed.href;
      } catch (e) {
        return '';
      }
    },

    /* Sanitiza HTML de relatórios persistidos removendo scripts, iframes e event handlers inline */
    sanitizeReportHTML: function (dirtyHtml) {
      if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';
      if (typeof DOMParser === 'undefined') {
        return Security.escapeHTML(dirtyHtml);
      }
      try {
        var doc = new DOMParser().parseFromString(dirtyHtml, 'text/html');
        var blockedTags = doc.querySelectorAll('script, iframe, object, embed, applet, meta, link, base, form, svg, math');
        blockedTags.forEach(function (el) { el.remove(); });
        var allEls = doc.body ? doc.body.querySelectorAll('*') : [];
        allEls.forEach(function (el) {
          Array.prototype.slice.call(el.attributes).forEach(function (attr) {
            var name = attr.name.toLowerCase();
            var val = String(attr.value || '').trim();
            if (name.indexOf('on') === 0 || name === 'srcdoc') {
              el.removeAttribute(attr.name);
            } else if ((name === 'href' || name === 'src' || name === 'xlink:href' || name === 'action') && /^(javascript|vbscript|data:text\/html)/i.test(val)) {
              el.removeAttribute(attr.name);
            } else if (name === 'style' && /(expression\s*\(|javascript:|url\s*\(\s*['"]?\s*javascript:)/i.test(val)) {
              el.removeAttribute(attr.name);
            }
          });
        });
        return doc.body ? doc.body.innerHTML : '';
      } catch (e) {
        return Security.escapeHTML(dirtyHtml);
      }
    },

    /* Abre janela isolada (sem acesso a window.opener) para impressão/PDF */
    openSafePrintWindow: function (htmlDoc, autoPrintDelayMs) {
      var w = window.open('', '_blank');
      if (!w) {
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Pop-up Bloqueado', 'Permita pop-ups no navegador para visualizar e salvar o PDF.', 'warning');
        }
        return null;
      }
      try { w.opener = null; } catch (e) {}
      w.document.open();
      w.document.write(htmlDoc);
      w.document.close();
      if (autoPrintDelayMs && autoPrintDelayMs > 0) {
        setTimeout(function () {
          try { w.focus(); w.print(); } catch (eP) {}
        }, autoPrintDelayMs);
      }
      return w;
    }
  };

  /* ─── 2. Utilitário Coeso de Marcadores JSON Legados (CTRS / RONDA / REC) ─── */
  var Markers = {
    REGEX_ALL: /<!--(?:CTRS|RONDA|REC)_JSON:[^>]+-->/g,

    strip: function (text) {
      if (text === null || text === undefined) return '';
      return String(text).replace(Markers.REGEX_ALL, '').trim();
    },

    encode: function (kind, obj) {
      if (!kind || !obj || typeof obj !== 'object') return '';
      try {
        return '<!--' + String(kind).toUpperCase() + '_JSON:' + encodeURIComponent(JSON.stringify(obj)) + '-->';
      } catch (e) {
        return '';
      }
    },

    extract: function (text, kind) {
      if (!text || typeof text !== 'string' || !kind) return null;
      var tag = '<!--' + String(kind).toUpperCase() + '_JSON:';
      if (text.indexOf(tag) === -1) return null;
      try {
        var re = new RegExp('<!--' + String(kind).toUpperCase() + '_JSON:([^>]+)-->');
        var m = text.match(re);
        return (m && m[1]) ? JSON.parse(decodeURIComponent(m[1])) : null;
      } catch (e) {
        return null;
      }
    }
  };

  /* ─── 3. Camada Segura de Persistência Local (localStorage) ─── */
  var Storage = {
    getText: function (key, fallback) {
      try {
        var val = localStorage.getItem(key);
        return (val !== null && val !== undefined) ? val : (fallback !== undefined ? fallback : '');
      } catch (e) {
        return fallback !== undefined ? fallback : '';
      }
    },
    setText: function (key, val) {
      try {
        localStorage.setItem(key, String(val));
        return true;
      } catch (e) {
        return false;
      }
    },
    getJSON: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return fallback;
        var parsed = JSON.parse(raw);
        return (parsed !== null && parsed !== undefined) ? parsed : fallback;
      } catch (e) {
        return fallback;
      }
    },
    setJSON: function (key, val) {
      try {
        localStorage.setItem(key, JSON.stringify(val));
        return true;
      } catch (e) {
        return false;
      }
    },
    remove: function (key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    }
  };

  /* ─── 4. Barramento de Eventos (EventBus) para Baixo Acoplamento ─── */
  var _listeners = {};
  var EventBus = {
    on: function (event, fn) {
      if (!event || typeof fn !== 'function') return;
      if (!_listeners[event]) _listeners[event] = [];
      _listeners[event].push(fn);
    },
    off: function (event, fn) {
      if (!_listeners[event]) return;
      _listeners[event] = _listeners[event].filter(function (h) { return h !== fn; });
    },
    emit: function (event, payload) {
      var list = _listeners[event];
      if (!list || list.length === 0) return;
      list.slice().forEach(function (fn) {
        try { fn(payload); } catch (err) {
          console.warn('[TVApp.EventBus] Erro em listener de "' + event + '":', err);
        }
      });
    }
  };

  /* ─── 5. Sessão & Controle de Acesso Baseado em Perfil (RBAC) ─── */
  var Session = {
    getUserName: function () {
      var stored = Storage.getText(KEYS.USER_NAME, '').trim();
      if (stored) return stored;
      var upName = document.getElementById('up-name');
      if (upName && upName.textContent && upName.textContent.trim()) {
        return upName.textContent.trim();
      }
      return 'Operador';
    },
    getUserEmail: function () {
      return Storage.getText(KEYS.USER_EMAIL, '').trim();
    },
    getUserTag: function () {
      return Storage.getText(KEYS.USER_TAG, 'Tecnico').trim() || 'Tecnico';
    },
    getUserCargo: function () {
      return Storage.getText(KEYS.USER_CARGO, 'Técnico de Operações').trim();
    },
    hasRole: function (allowedRoles, actionLabel, silent) {
      var currentTag = Session.getUserTag();
      var list = Array.isArray(allowedRoles) ? allowedRoles : ['TI/ADM', 'Gestor'];
      var ok = list.some(function (r) { return String(r).toLowerCase() === currentTag.toLowerCase(); });
      if (!ok && !silent && typeof window.mostrarToast === 'function') {
        window.mostrarToast(
          'Permissão Restrita',
          'A ação "' + (actionLabel || 'solicitada') + '" requer perfil ' + list.join(' ou ') + ' (seu perfil: ' + currentTag + ').',
          'warning'
        );
      }
      return ok;
    },
    clearUserSession: function () {
      Storage.remove(KEYS.USER_NAME);
      Storage.remove(KEYS.USER_EMAIL);
      Storage.remove(KEYS.USER_TAG);
      Storage.remove(KEYS.USER_CARGO);
      Storage.remove(KEYS.TURNO_ATIVO);
      Store.operadorUuidAtual = null;
      window._operadorLoginPendente = null;
    }
  };

  /* ─── 6. Estado Centralizado da Aplicação (Single Source of Truth) ─── */
  var Store = {
    ocorrencias: [],
    historicoSeedData: [],
    lixeiraData: [],
    notificacoesStore: [],
    notificacoesDispensadas: [],
    uploadedFilesStore: {},
    catalogoEquipamentos: [],
    orcamentoSeedData: [],
    checklistItems: [],
    itemDetalhesAtual: null,
    resolverAtualId: null,
    operadorUuidAtual: null,
    historicoFiltroCategoria: 'todos',
    dashboardMetrics: {
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
    }
  };

  /* Mantém compatibilidade bidirecional segura com referências legadas em window.* */
  [
    ['ocorrencias', 'ocorrencias'],
    ['historicoSeedData', 'historicoSeedData'],
    ['lixeiraData', 'lixeiraData'],
    ['notificacoesStore', 'notificacoesStore'],
    ['notificacoesDispensadas', 'notificacoesDispensadas'],
    ['uploadedFilesStore', 'uploadedFilesStore'],
    ['catalogoEquipamentos', 'catalogoEquipamentos'],
    ['orcamentoSeedData', 'orcamentoSeedData'],
    ['checklistItems', 'checklistItems'],
    ['dashboardMetrics', 'dashboardMetrics'],
    ['OPERADOR_UUID_ATUAL', 'operadorUuidAtual']
  ].forEach(function (pair) {
    var winProp = pair[0];
    var storeProp = pair[1];
    try {
      Object.defineProperty(window, winProp, {
        configurable: true,
        enumerable: true,
        get: function () { return Store[storeProp]; },
        set: function (v) { Store[storeProp] = v; }
      });
    } catch (e) {}
  });

  /* Pacote Criptografado Oficial da Estação (único ponto centralizado de fallback) */
  var DEFAULT_ENCRYPTED_CREDENTIALS = Object.freeze({
    salt: 'f37eefee9195919adb5b14e12f9bb900',
    iv: 'b0e029893d4f1f0ee49d624b',
    data: '8eeb4d7fd875a35c8abad781fcbe3e75f0dd0ed777735a5f79619486690b4a1c48951c48f6f7ee6d277195ada6873a13314618584d00b688c8e4096a39f687d74c7b815644a7e8e01497277b761991442ff16fdf10cf0722b1cfdb621a400ae045bbbfc5131d46e18539a6e2af19c2c8741a8a5bc48860751a'
  });

  window.ENCRYPTED_TV_CREDENTIALS = window.ENCRYPTED_TV_CREDENTIALS ||
    (window.ENV_CONFIG && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS.data
      ? window.ENV_CONFIG.ENCRYPTED_CREDENTIALS
      : DEFAULT_ENCRYPTED_CREDENTIALS);

  /* ─── 7. Gerenciador de Módulos Independentes (Ciclo de Vida Desacoplado) ─── */
  var _modules = [];
  var _booted = false;

  function registerModule(name, initFn) {
    if (typeof initFn !== 'function') return;
    if (_booted) {
      try { initFn(TVApp); } catch (err) {
        console.error('[TVApp] Falha ao iniciar módulo tardio "' + name + '":', err);
      }
      return;
    }
    _modules.push({ name: name, init: initFn });
  }

  function boot() {
    if (_booted) return;
    _booted = true;
    for (var i = 0; i < _modules.length; i++) {
      try {
        _modules[i].init(TVApp);
      } catch (err) {
        console.error('[TVApp] Erro ao inicializar módulo "' + _modules[i].name + '":', err);
      }
    }
    if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (e) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    setTimeout(boot, 0);
  }

  var TVApp = {
    KEYS: KEYS,
    Security: Security,
    Markers: Markers,
    Storage: Storage,
    EventBus: EventBus,
    Session: Session,
    Store: Store,
    registerModule: registerModule,
    boot: boot
  };

  /* Aliases globais utilitários usados pelos templates e módulos */
  window.TVApp = TVApp;
  window.escapeHTML = Security.escapeHTML;
  window.escapeJSString = Security.escapeJSString;
  window.sanitizeIdAttr = Security.sanitizeIdAttr;
  window.sanitizeMediaUrl = Security.sanitizeMediaUrl;
  window.sanitizeReportHTML = Security.sanitizeReportHTML;
  window.openSafePrintWindow = Security.openSafePrintWindow;
  window.obterTagPerfilAtual = Session.getUserTag;
  window.verificarPermissaoPerfil = Session.hasRole;
  window.getUsuarioAtual = Session.getUserName;
})(window, document);
