(function (window, document, TVApp) {
  'use strict';

  TVApp.registerModule('db-service', function (app) {
    var KEYS     = app.KEYS;
    var Security = app.Security;
    var Markers  = app.Markers;
    var Storage  = app.Storage;
    var EventBus = app.EventBus;
    var Session  = app.Session;
    var Store    = app.Store;

    var escapeHTML        = Security.escapeHTML;
    var IGNORED_LEGACY_OC_IDS = ['oc_1787932348110'];
    var JF_EXCLUSIVOS = ['NET PRAÇA', 'NET PORTARIA', 'FORMATOS NET', 'NET 2º ANDAR', 'NET 3º ANDAR', 'NET 4º ANDAR', 'KMJ'];

    function isIdLegadoIgnorado(id) {
      if (!id) return false;
      var s = String(id);
      return s.indexOf('oc_init_') === 0 || IGNORED_LEGACY_OC_IDS.indexOf(s) !== -1;
    }
    window.isIdLegadoIgnorado = isIdLegadoIgnorado;

    function normalizarUrlExterna(urlStr) {
      return Security.sanitizeExternalUrl(urlStr);
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
      return '<a href="' + escapeHTML(u) + '" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" style="display:inline-flex;align-items:center;gap:6px;padding:' + pad + ';background:#EFF6FF;color:#0071E3;border:1px solid #BFDBFE;border-radius:8px;font-size:' + fz + ';font-weight:700;text-decoration:none;max-width:100%;box-sizing:border-box;transition:all 0.15s ease;" title="' + escapeHTML(u) + '">' +
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

    /* ─── Criptografia AES-256-GCM + PBKDF2 (Web Crypto API) ─── */
    var TVCrypto = {
      buf2hex: function (buffer) {
        return Array.prototype.map.call(new Uint8Array(buffer), function (x) {
          return ('00' + x.toString(16)).slice(-2);
        }).join('');
      },
      hex2buf: function (hex) {
        var clean = (hex || '').trim().replace(/^0x/, '');
        var bytes = new Uint8Array(clean.length / 2);
        for (var i = 0; i < clean.length; i += 2) {
          bytes[i / 2] = parseInt(clean.substr(i, 2), 16);
        }
        return bytes.buffer;
      },
      deriveAesKey: async function (passphrase, saltBytes) {
        if (!window.crypto || !window.crypto.subtle) {
          throw new Error('Web Crypto API indisponível neste navegador.');
        }
        var enc = new TextEncoder();
        var keyMaterial = await crypto.subtle.importKey(
          'raw',
          enc.encode(passphrase),
          { name: 'PBKDF2' },
          false,
          ['deriveKey']
        );
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: saltBytes, iterations: 250000, hash: 'SHA-256' },
          keyMaterial,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      },
      encrypt: async function (passphrase, payload) {
        var enc = new TextEncoder();
        var salt = crypto.getRandomValues(new Uint8Array(16));
        var iv = crypto.getRandomValues(new Uint8Array(12));
        var key = await this.deriveAesKey(passphrase, salt);
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
      decrypt: async function (passphrase, pack) {
        if (!pack || !pack.salt || !pack.iv || !pack.data) {
          throw new Error('Pacote criptografado ausente ou incompleto.');
        }
        var salt = new Uint8Array(this.hex2buf(pack.salt));
        var iv = new Uint8Array(this.hex2buf(pack.iv));
        var cipherBuf = this.hex2buf(pack.data);
        var key = await this.deriveAesKey(passphrase, salt);
        var decBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, cipherBuf);
        return JSON.parse(new TextDecoder().decode(decBuf));
      }
    };
    window.TVCrypto = TVCrypto;

    /* ─── Resolução de Credenciais da Estação ─── */
    var envConfig = window.ENV_CONFIG || {};
    var initialUrl = (envConfig.SUPABASE_URL && envConfig.SUPABASE_URL.indexOf('seu-projeto') === -1)
      ? envConfig.SUPABASE_URL
      : Storage.getText(KEYS.SUPABASE_URL, '');
    var initialKey = (envConfig.SUPABASE_ANON_KEY && envConfig.SUPABASE_ANON_KEY.indexOf('sua-chave') === -1)
      ? envConfig.SUPABASE_ANON_KEY
      : Storage.getText(KEYS.SUPABASE_KEY, '');

    function getDBCredentials() {
      var url = (DBService && DBService.url) ? DBService.url : Storage.getText(KEYS.SUPABASE_URL, '');
      var key = (DBService && DBService.key) ? DBService.key : Storage.getText(KEYS.SUPABASE_KEY, '');
      var cfg = window.ENV_CONFIG || {};
      if ((!url || url.indexOf('seu-projeto') !== -1) && cfg.SUPABASE_URL && cfg.SUPABASE_URL.indexOf('seu-projeto') === -1) {
        url = cfg.SUPABASE_URL;
      }
      if ((!key || key.indexOf('sua-chave') !== -1) && cfg.SUPABASE_ANON_KEY && cfg.SUPABASE_ANON_KEY.indexOf('sua-chave') === -1) {
        key = cfg.SUPABASE_ANON_KEY;
      }
      return { url: url ? url.replace(/\/+$/, '') : '', key: key };
    }
    window.getDBCredentials = getDBCredentials;

    function isEstacaoConectadaTV() {
      var creds = getDBCredentials();
      return Boolean(creds.url && creds.key && creds.url.indexOf('seu-projeto') === -1 && creds.key.indexOf('sua-chave') === -1);
    }
    window.isEstacaoConectadaTV = isEstacaoConectadaTV;

    function atualizarUIIdentificacaoOperador() {
      var conectada = isEstacaoConectadaTV();
      var boxChaveLogin = document.getElementById('ident-box-chave-estacao');
      if (boxChaveLogin) {
        boxChaveLogin.style.display = conectada ? 'none' : 'block';
      }
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
    }
    window.atualizarUIIdentificacaoOperador = atualizarUIIdentificacaoOperador;

    async function conectarComChaveTV(passphrase) {
      var pack = window.ENCRYPTED_TV_CREDENTIALS || (window.ENV_CONFIG && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS);
      if (!passphrase || !passphrase.trim()) {
        return { ok: false, error: 'Por favor, informe a Chave de Acesso da TV.' };
      }
      if (!pack || !pack.data) {
        return { ok: false, error: 'Nenhum pacote criptografado configurado. Configure no config.js.' };
      }
      try {
        var creds = await TVCrypto.decrypt(passphrase.trim(), pack);
        if (!creds || !creds.url || !creds.key) {
          return { ok: false, error: 'Pacote criptográfico não contém URL ou chave válidas.' };
        }
        var cleanUrl = creds.url.replace(/\/+$/, '');
        DBService.setCredentials(cleanUrl, creds.key);
        updateCloudStatus(true);
        await DBService.syncRemote(true);
        return { ok: true, creds: creds };
      } catch (err) {
        console.warn('[TVCrypto] Falha de autenticação:', err);
        return { ok: false, error: 'Chave de acesso incorreta. Verifique com a equipe técnica.' };
      }
    }
    window.conectarComChaveTV = conectarComChaveTV;

    /* ─── Regras de Negócio de Praça e Atribuição ─── */
    function normalizarPracaOcorrencia(praca, local, titulo, equipamento) {
      var l = (local || '').toString();
      var t = (titulo || '').toString();
      var p = (praca || '').toString().trim();
      var eq = (equipamento || '').toString().toUpperCase();
      if (l.indexOf('Juiz') !== -1 || t.indexOf('Juiz') !== -1) return 'Juiz de Fora';
      if (l.indexOf('Uber') !== -1 || t.indexOf('Uber') !== -1) return 'Uberlândia';
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
      if (!item) return Session.getUserName();
      var c = item.criadoPor || (item.resolucao && item.resolucao.criadoPor) || '';
      if (c && !isValorAtribuicaoGenerico(c)) {
        return String(c).replace(/\s*\((Você|Atribuir a mim)\)\s*/i, '').trim();
      }
      if (item.resp && !isValorAtribuicaoGenerico(item.resp)) {
        return String(item.resp).replace(/\s*\((Você|Atribuir a mim)\)\s*/i, '').trim();
      }
      if (Array.isArray(item.historicoEdicoes) && item.historicoEdicoes.length > 0) {
        var ult = item.historicoEdicoes[item.historicoEdicoes.length - 1];
        if (ult && ult.autor && !isValorAtribuicaoGenerico(ult.autor)) return ult.autor;
      }
      return Session.getUserName();
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

    /* ─── Cliente HTTP Unificado e Serviço de Dados (DBService) ─── */
    var DBService = {
      mode: (initialUrl && initialKey) ? 'supabase' : 'local',
      url: initialUrl ? initialUrl.replace(/\/+$/, '') : '',
      key: initialKey || '',
      _lastSyncTime: 0,

      setCredentials: function (url, key) {
        var cleanUrl = (url || '').replace(/\/+$/, '');
        this.url = cleanUrl;
        this.key = key || '';
        this.mode = (cleanUrl && key) ? 'supabase' : 'local';
        if (cleanUrl && key) {
          Storage.setText(KEYS.SUPABASE_URL, cleanUrl);
          Storage.setText(KEYS.SUPABASE_KEY, key);
        } else {
          Storage.remove(KEYS.SUPABASE_URL);
          Storage.remove(KEYS.SUPABASE_KEY);
        }
      },

      /* Cliente REST/RPC centralizado para evitar duplicação de fetch e headers em outros módulos */
      request: async function (path, opts) {
        var creds = getDBCredentials();
        var baseUrl = (opts && opts.baseUrl) ? opts.baseUrl.replace(/\/+$/, '') : creds.url;
        var apiKey  = (opts && opts.apiKey)  ? opts.apiKey : creds.key;
        if (!baseUrl || !apiKey) {
          return { ok: false, status: 0, data: null };
        }
        var options = opts || {};
        var method = options.method || 'GET';
        var headers = {
          'apikey': apiKey,
          'Authorization': 'Bearer ' + apiKey
        };
        if (options.noCache !== false && method === 'GET') {
          headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
          headers['Pragma'] = 'no-cache';
        }
        if (options.prefer) {
          headers['Prefer'] = options.prefer;
        }
        var fetchInit = {
          method: method,
          headers: headers
        };
        if (options.noCache !== false && method === 'GET') {
          fetchInit.cache = 'no-cache';
        }
        if (options.body !== undefined) {
          headers['Content-Type'] = 'application/json';
          fetchInit.body = JSON.stringify(options.body);
        }
        var endpoint = baseUrl + (path.indexOf('/') === 0 ? path : '/' + path);
        var res = await fetch(endpoint, fetchInit);
        var data = null;
        if (options.parseJson !== false && res.status !== 204) {
          var text = await res.text();
          if (text) {
            try { data = JSON.parse(text); } catch (e) { data = text; }
          }
        }
        return { ok: res.ok, status: res.status, data: data, raw: res };
      },

      select: function (table, queryStr, opts) {
        var qs = queryStr ? ('?' + queryStr.replace(/^\?/, '')) : '';
        return this.request('/rest/v1/' + table + qs, opts);
      },

      upsert: function (table, payload, preferExtra) {
        var prefer = preferExtra || 'resolution=merge-duplicates';
        return this.request('/rest/v1/' + table, {
          method: 'POST',
          prefer: prefer,
          body: payload,
          parseJson: prefer.indexOf('return=representation') !== -1
        });
      },

      patch: function (table, filterQuery, payload, preferExtra) {
        var qs = filterQuery ? ('?' + filterQuery.replace(/^\?/, '')) : '';
        var prefer = preferExtra || '';
        return this.request('/rest/v1/' + table + qs, {
          method: 'PATCH',
          prefer: prefer,
          body: payload,
          parseJson: prefer.indexOf('return=representation') !== -1
        });
      },

      remove: function (table, filterQuery) {
        var qs = filterQuery ? ('?' + filterQuery.replace(/^\?/, '')) : '';
        return this.request('/rest/v1/' + table + qs, {
          method: 'DELETE',
          prefer: 'return=minimal',
          parseJson: false
        });
      },

      rpc: function (fnName, params, opts) {
        var extra = Object.assign({}, opts || {}, {
          method: 'POST',
          body: params || {}
        });
        return this.request('/rest/v1/rpc/' + fnName, extra);
      },

      getOcorrencias: function () { return load(); },

      formatOcorrenciaPayload: function (item) {
        if (!item) return null;
        var resObj = item.resolucao ? Object.assign({}, item.resolucao) : {};
        var anxList = (Array.isArray(item.anexos) && item.anexos.length > 0)
          ? item.anexos
          : (Array.isArray(resObj.anexos) ? resObj.anexos : []);
        if (anxList.length > 0) {
          resObj.anexos = anxList.map(function (anx) {
            if (!anx) return null;
            var a = Object.assign({}, anx);
            if (a.url && a.url.indexOf('http') === 0) {
              delete a.dataUrl;
            }
            return a;
          }).filter(Boolean);
        }
        if (Array.isArray(item.historicoEdicoes) && item.historicoEdicoes.length > 0) {
          resObj.historicoEdicoes = item.historicoEdicoes;
        }
        if (item.link) resObj.link = item.link;
        if (item.criadoPor) resObj.criadoPor = item.criadoPor;
        if (item.equipamento) resObj.equipamento = item.equipamento;
        if (item.equipamento_id) resObj.equipamento_id = item.equipamento_id;
        if (item.telejornal) resObj.telejornal = item.telejornal;
        if (item.ultimaEdicaoPor) resObj.ultimaEdicaoPor = item.ultimaEdicaoPor;
        if (item.ultimaEdicaoEm) resObj.ultimaEdicaoEm = item.ultimaEdicaoEm;
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

      saveOcorrencias: function (list, itemModificado, isNovo) {
        save(list, itemModificado, isNovo);
      },

      getHistorico: function () {
        return typeof window.getHistoricoCompleto === 'function' ? window.getHistoricoCompleto() : Store.historicoSeedData;
      },

      saveHistorico: function (list, itemAdicionado) {
        if (typeof window.saveHistorico === 'function') {
          window.saveHistorico(list, itemAdicionado);
        }
      },

      getFotoPerfil: function () {
        return Security.sanitizeCssBgUrl(Storage.getText(KEYS.USER_PHOTO, ''));
      },
      saveFotoPerfil: function (url) {
        var safe = Security.sanitizeCssBgUrl(url);
        if (!safe) throw new Error('Formato de imagem inválido.');
        localStorage.setItem(KEYS.USER_PHOTO, safe);
      },
      removeFotoPerfil: function () { Storage.remove(KEYS.USER_PHOTO); },

      enviarNotificacaoEmail: function () {
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('E-mail', 'Essa função de envio de e-mail ainda não está disponível.', 'info');
        }
      },

      deleteRemote: function (table, id) {
        if (!id) return;
        this.remove(table, 'id=eq.' + encodeURIComponent(id)).catch(function (err) {
          console.warn('[DBService Cloud] Falha ao excluir registro do Supabase:', err);
        });
      },

      upsertOcorrenciaRemota: function (item, isNovo) {
        if (!item || !item.id) return;
        var payload = this.formatOcorrenciaPayload(item);
        if (!payload) return;
        var prom = isNovo
          ? this.upsert('ocorrencias', payload)
          : this.patch('ocorrencias', 'id=eq.' + encodeURIComponent(item.id), payload);
        prom.then(function (res) {
          if (res && !res.ok && res.status !== 0) {
            console.warn('[DBService Cloud] Falha ao sincronizar ocorrência pontual (' + res.status + '):', item.id);
          }
        }).catch(function (err) {
          console.warn('[DBService Cloud] Erro no envio pontual da ocorrência:', err);
        });
      },

      formatHistoricoPayload: function (h) {
        if (!h || !h.id) return null;
        var descRes = h.descResolucao || '';
        if (h.detalhesRonda && typeof h.detalhesRonda === 'object' && descRes.indexOf('<!--RONDA_JSON:') === -1) {
          descRes = (descRes ? descRes + ' ' : '') + Markers.encode('RONDA', h.detalhesRonda);
        }
        if (h.dadosRecebimento && typeof h.dadosRecebimento === 'object' && descRes.indexOf('<!--REC_JSON:') === -1) {
          descRes = (descRes ? descRes + ' ' : '') + Markers.encode('REC', h.dadosRecebimento);
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

      pushHistoricoItem: function (histItem) {
        if (!histItem) return;
        var payload = this.formatHistoricoPayload(histItem);
        if (!payload) return;
        this.upsert('historico', payload).then(function (res) {
          if (res && !res.ok && res.status !== 0) {
            console.warn('[DBService Cloud] Falha ao enviar item de histórico (' + res.status + '):', histItem.id);
          }
        }).catch(function (err) {
          console.warn('[DBService Cloud] Erro no pushHistoricoItem:', err);
        });
      },

      pushRemote: function (table, data) {
        if (!Array.isArray(data) || data.length === 0) return;
        var self = this;
        var payload = data;
        if (table === 'ocorrencias') {
          payload = data.map(function (item) { return self.formatOcorrenciaPayload(item); }).filter(Boolean);
        } else if (table === 'historico') {
          payload = data.map(function (item) { return self.formatHistoricoPayload(item); }).filter(Boolean);
        }
        this.upsert(table, payload).then(function (res) {
          if (res && !res.ok && res.status !== 0) {
            console.warn('[DBService Cloud] Falha no pushRemote (' + table + ' - ' + res.status + ')');
          }
        }).catch(function (err) {
          console.warn('[DBService Cloud] Falha ao enviar dados para o Supabase:', err);
        });
      },

      init: function () {
        this.syncRemote();
      },

      syncRemote: function (force) {
        var creds = getDBCredentials();
        this.url = creds.url;
        this.key = creds.key;
        if (!this.url || !this.key) {
          updateCloudStatus(false, 'Modo Local');
          return Promise.resolve(false);
        }
        var now = Date.now();
        if (!force && this._lastSyncTime && (now - this._lastSyncTime < 15000)) {
          return Promise.resolve(false);
        }
        this._lastSyncTime = now;
        this.mode = 'supabase';
        var self = this;

        var pOc = self.select('ocorrencias', 'select=*&order=criado.desc&limit=500')
          .then(function (res) {
            if (res.ok && Array.isArray(res.data)) {
              updateCloudStatus(true);
              var idsNaLixeira = (Store.lixeiraData || []).map(function (item) { return item.id; });
              Store.ocorrencias = mesclarOcorrencias(Store.ocorrencias, res.data, idsNaLixeira);
              Storage.setJSON(KEYS.OCORRENCIAS_CACHE, Store.ocorrencias);
              window._lastOcSyncSig = Store.ocorrencias.map(function (o) {
                return o.id + '_' + o.status + '_' + (o.criado || 0);
              }).join('|');
              if (typeof window.renderAll === 'function') window.renderAll(true);
              return true;
            }
            updateCloudStatus(false);
            return false;
          })
          .catch(function (err) {
            updateCloudStatus(false);
            console.warn('[DBService Cloud Sync] Offline ou conectando ao Supabase...', err);
            return false;
          });

        var pHist = self.select('historico', 'select=*&order=dataCriacao.desc&limit=500')
          .then(function (res) {
            if (!res.ok || !Array.isArray(res.data)) return;
            var idsNaLixeira = (Store.lixeiraData || []).map(function (item) { return item.id; });
            var remoteFiltered = res.data.filter(function (h) {
              return h && h.status !== 'lixeira' && !idsNaLixeira.includes(h.id);
            });
            var mapHist = {};
            remoteFiltered.forEach(function (h) {
              if (!h.detalhesRonda && h.descResolucao) {
                h.detalhesRonda = Markers.extract(String(h.descResolucao), 'RONDA');
              }
              if (!h.dadosCTRS && h.descResolucao) {
                h.dadosCTRS = Markers.extract(String(h.descResolucao), 'CTRS');
              }
              if (!h.dadosRecebimento && h.descResolucao) {
                h.dadosRecebimento = Markers.extract(String(h.descResolucao), 'REC');
              }
              if (h.dadosRecebimento && Array.isArray(h.dadosRecebimento.anexos) && (!h.anexos || h.anexos.length === 0)) {
                h.anexos = h.dadosRecebimento.anexos;
              }
              mapHist[h.id] = h;
            });
            (Store.historicoSeedData || []).forEach(function (localH) {
              if (!localH || !localH.id) return;
              var target = mapHist[localH.id];
              if (target) {
                if (localH.htmlRelatorio && !target.htmlRelatorio) target.htmlRelatorio = localH.htmlRelatorio;
                if (localH.dadosCTRS && !target.dadosCTRS) target.dadosCTRS = localH.dadosCTRS;
                if (localH.detalhesRonda && !target.detalhesRonda) target.detalhesRonda = localH.detalhesRonda;
                if (localH.dadosRecebimento && !target.dadosRecebimento) target.dadosRecebimento = localH.dadosRecebimento;
                if (Array.isArray(localH.anexos) && localH.anexos.length > 0 && (!target.anexos || target.anexos.length === 0)) {
                  target.anexos = localH.anexos;
                }
              } else if (!idsNaLixeira.includes(localH.id) && localH.status !== 'lixeira') {
                remoteFiltered.push(localH);
              }
            });
            Store.historicoSeedData = remoteFiltered;
            Storage.setJSON(KEYS.HISTORICO_CACHE, Store.historicoSeedData);
            window._lastHistSyncSig = Store.historicoSeedData.map(function (h) {
              return h.id + '_' + (h.status || '');
            }).join('|');
            if (typeof window.sincronizarRecebimentosExistentesNoCatalogo === 'function') {
              try { window.sincronizarRecebimentosExistentesNoCatalogo(false); } catch (eRec) {}
            }
            if (typeof window.renderAll === 'function') window.renderAll(true);
          })
          .catch(function (err) {
            console.warn('[DBService Cloud Sync Hist] Offline ou conectando ao Supabase...', err);
          });

        /* Notifica todos os módulos desacoplados inscritos no EventBus */
        EventBus.emit('cloud:sync', { force: !!force });

        return Promise.all([pOc, pHist]).then(function (results) {
          if (typeof window.renderAll === 'function') window.renderAll(true);
          return Boolean(results[0]);
        }).catch(function () {
          if (typeof window.renderAll === 'function') window.renderAll(true);
          return false;
        });
      }
    };
    window.DBService = DBService;

    /* Consulta segura de UUID de operador (apenas leitura — sem auto-criação arbitrária no banco) */
    function obterOuCriarOperadorPorNome(nome, callback) {
      if (!nome || typeof nome !== 'string' || !nome.trim() || nome.trim() === 'Operador') {
        if (typeof callback === 'function') callback(null);
        return;
      }
      var nomeNorm = nome.trim();
      if (!isEstacaoConectadaTV()) {
        if (typeof callback === 'function') callback(null);
        return;
      }
      DBService.select('operadores_publico', 'nome=eq.' + encodeURIComponent(nomeNorm) + '&ativo=eq.true&select=id,nome&limit=1')
        .then(function (res) {
          if (res.status === 404) {
            return DBService.select('operadores', 'nome=eq.' + encodeURIComponent(nomeNorm) + '&ativo=eq.true&select=id,nome&limit=1');
          }
          return res;
        })
        .then(function (res) {
          var ops = (res && res.ok && Array.isArray(res.data)) ? res.data : [];
          if (ops.length > 0 && ops[0].id) {
            Store.operadorUuidAtual = ops[0].id;
            if (typeof callback === 'function') callback(ops[0].id);
            EventBus.emit('operador:uuid-resolved', ops[0].id);
          } else {
            if (typeof callback === 'function') callback(null);
          }
        })
        .catch(function (err) {
          console.warn('[Operador DB] Falha ao consultar operador por nome:', err);
          if (typeof callback === 'function') callback(null);
        });
    }
    window.obterOuCriarOperadorPorNome = obterOuCriarOperadorPorNome;

    /* ─── Reconexão Automática com Backoff Exponencial ─── */
    var _cloudConnected = true;
    var _reconnectTimer = null;
    var _reconnectAttempt = 0;
    var _isReconnecting = false;

    function iniciarReconexaoAutomatica() {
      if (_cloudConnected || _reconnectTimer || _isReconnecting) return;
      _reconnectAttempt++;
      var delayMs = Math.min(10000 * Math.pow(1.5, _reconnectAttempt - 1), 60000);
      _reconnectTimer = setTimeout(async function () {
        _reconnectTimer = null;
        if (_cloudConnected) return;
        _isReconnecting = true;
        try {
          var ok = await DBService.syncRemote(true);
          if (ok !== false) {
            _cloudConnected = true;
            _reconnectAttempt = 0;
            _isReconnecting = false;
            updateCloudStatus(true, 'Sincronizado');
            if (typeof window.mostrarToast === 'function') {
              window.mostrarToast('Conexão Restabelecida', 'O sistema foi reconectado e seus dados estão sincronizados em tempo real.', 'success');
            }
            return;
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
      var offBanner = document.getElementById('offline-status-banner');
      var offBannerTxt = document.getElementById('offline-status-banner-txt');
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
          indicator.innerHTML = '<span class="cloud-dot"></span><span class="cloud-text">' + escapeHTML(customText || 'Sincronizado') + '</span>';
        }
        if (btnTopbar) btnTopbar.style.display = 'none';
        if (offBanner) offBanner.style.display = 'none';
      } else {
        _cloudConnected = false;
        var estaConfigurado = isEstacaoConectadaTV();
        var texto = customText || (estaConfigurado ? 'Reconectando...' : 'Modo Offline');
        if (indicator) {
          indicator.className = 'cloud-status offline';
          indicator.title = estaConfigurado
            ? 'Desconectado da rede — reconectando automaticamente... (Clique para gerenciar)'
            : 'Modo Offline (Clique para conectar à rede)';
          indicator.innerHTML = '<span class="cloud-dot"></span><span class="cloud-text">' + escapeHTML(texto) + '</span>';
        }
        if (btnTopbar) btnTopbar.style.display = 'inline-flex';
        if (offBanner) {
          offBanner.style.display = 'inline-flex';
          if (offBannerTxt) {
            offBannerTxt.textContent = estaConfigurado
              ? 'Conexão instável com o banco (' + texto + ') — operando em cache local'
              : 'Modo Offline — alterações salvas apenas neste computador';
          }
        }
        if (estaConfigurado) iniciarReconexaoAutomatica();
      }
      EventBus.emit('cloud:status-changed', { online: !!isOnline });
      if (typeof window.atualizarUIStatusBancoConfig === 'function') {
        try { window.atualizarUIStatusBancoConfig(); } catch (eUI) {}
      }
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
    }
    window.updateCloudStatus = updateCloudStatus;
    window._isCloudConnected = function () { return _cloudConnected; };

    window.addEventListener('online', tentarReconectarImediato);
    window.addEventListener('offline', function () { updateCloudStatus(false, 'Modo Local'); });

    /* ─── Domínio de Ocorrências (Sanitização, Mesclagem e Seletores) ─── */
    function formatFallbackDate(ts) {
      if (typeof window.formatDataHoraLocal === 'function') return window.formatDataHoraLocal(ts);
      var d = ts ? new Date(ts) : new Date();
      if (isNaN(d.getTime())) d = new Date();
      var p2 = function (n) { return n < 10 ? '0' + n : String(n); };
      return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
    }

    function sanitizeOcorrencia(o) {
      if (!o || typeof o !== 'object') return null;
      var userAtual = Session.getUserName();
      var isMine = !!o.mine;
      if (o.resp && (o.resp === userAtual || o.resp.indexOf(userAtual) !== -1 || o.resp.indexOf('Você') !== -1 || o.resp.indexOf('Atribuir a mim') !== -1)) {
        isMine = true;
      }
      var res = o.resolucao || null;
      var criadorExtraido = o.criadoPor || (res && res.criadoPor) || '';
      var anx = (Array.isArray(o.anexos) && o.anexos.length > 0)
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
        link: normalizarUrlExterna(o.link || (res && res.link) || ''),
        desc: o.desc || '',
        mine: isMine,
        tags: Array.isArray(o.tags) ? o.tags : [],
        status: o.status || 'aberta',
        criado: o.criado || Date.now(),
        dataCriacao: o.dataCriacao || formatFallbackDate(o.criado),
        equipamento: o.equipamento || (res && res.equipamento) || null,
        equipamento_id: o.equipamento_id || (res && res.equipamento_id) || '',
        telejornal: o.telejornal || (res && res.telejornal) || null,
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
    window.sanitizeOcorrencia = sanitizeOcorrencia;

    function mesclarOcorrencias(locais, remotas, idsNaLixeira) {
      var lixeiraArr = idsNaLixeira || [];
      var mapa = {};
      (remotas || []).forEach(function (rRaw) {
        var r = sanitizeOcorrencia(rRaw);
        if (!r || !r.id || r.status === 'lixeira' || lixeiraArr.indexOf(r.id) !== -1 || isIdLegadoIgnorado(r.id)) return;
        r._synced = true;
        delete r._pendingSync;
        mapa[r.id] = r;
      });
      (locais || []).forEach(function (l) {
        if (!l || !l.id || l.status === 'lixeira' || lixeiraArr.indexOf(l.id) !== -1 || isIdLegadoIgnorado(l.id)) return;
        var r = mapa[l.id];
        if (!r) {
          if (l._synced) return;
          mapa[l.id] = l;
          DBService.upsertOcorrenciaRemota(l, true);
        } else {
          var localStatusAvancado = ((l.status === 'resolvida' || l.status === 'arquivada') && r.status === 'aberta');
          var editLocalRecente = (l.ultimaEdicaoEm && (!r.ultimaEdicaoEm || l.ultimaEdicaoEm > r.ultimaEdicaoEm));
          if (localStatusAvancado || editLocalRecente) {
            mapa[l.id] = Object.assign({}, r, l);
          }
        }
      });
      var resultado = Object.keys(mapa).map(function (k) { return mapa[k]; });
      resultado.sort(function (a, b) { return (b.criado || 0) - (a.criado || 0); });
      return resultado;
    }
    window.mesclarOcorrencias = mesclarOcorrencias;

    function load() {
      if (!Store.ocorrencias || Store.ocorrencias.length === 0) {
        var parsed = Storage.getJSON(KEYS.OCORRENCIAS_CACHE, []);
        if (Array.isArray(parsed) && parsed.length > 0) {
          Store.ocorrencias = parsed.filter(function (o) {
            return o && !isIdLegadoIgnorado(o.id);
          }).map(sanitizeOcorrencia).filter(Boolean);
        }
      } else {
        Store.ocorrencias = Store.ocorrencias.filter(function (o) {
          return o && !isIdLegadoIgnorado(o.id);
        }).map(sanitizeOcorrencia).filter(Boolean);
      }
      return Store.ocorrencias;
    }

    function save(list, itemModificado, isNovo) {
      Store.ocorrencias = (list || []).filter(function (o) {
        return o && !isIdLegadoIgnorado(o.id);
      });
      Storage.setJSON(KEYS.OCORRENCIAS_CACHE, Store.ocorrencias);
      if (itemModificado) {
        DBService.upsertOcorrenciaRemota(itemModificado, isNovo);
      } else {
        DBService.pushRemote('ocorrencias', Store.ocorrencias);
      }
    }
    window.save = save;

    /* Inicializa cache local de ocorrências ao subir o módulo */
    (function initOcorrenciasCache() {
      var parsed = Storage.getJSON(KEYS.OCORRENCIAS_CACHE, []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        var sanitizados = parsed.filter(function (o) {
          return o && !isIdLegadoIgnorado(o.id);
        }).map(sanitizeOcorrencia).filter(Boolean);
        Store.ocorrencias = sanitizados;
        Storage.setJSON(KEYS.OCORRENCIAS_CACHE, sanitizados);
      }
    })();

    function pertenceAPracaAtiva(item) {
      if (!item) return false;
      var pracaAtiva = (typeof window.getPracaAtual === 'function') ? window.getPracaAtual() : 'Juiz de Fora';
      var isUberlandia = pracaAtiva.indexOf('Uber') !== -1;
      var itemPraca = normalizarPracaOcorrencia(item.praca, item.local, item.titulo, item.equipamento || (item.tags && item.tags[1]));
      return isUberlandia ? (itemPraca === 'Uberlândia') : (itemPraca === 'Juiz de Fora');
    }
    window.pertenceAPracaAtiva = pertenceAPracaAtiva;

    function getAbertas() {
      return Store.ocorrencias.filter(function (o) { return o && o.status === 'aberta' && pertenceAPracaAtiva(o); });
    }
    function getArquivadas() {
      return Store.ocorrencias.filter(function (o) { return o && o.status === 'arquivada' && pertenceAPracaAtiva(o); });
    }
    function getResolvidas() {
      return Store.ocorrencias.filter(function (o) { return o && o.status === 'resolvida' && pertenceAPracaAtiva(o); });
    }
    window.getAbertas = getAbertas;
    window.getArquivadas = getArquivadas;
    window.getResolvidas = getResolvidas;
  });
})(window, document, window.TVApp);
