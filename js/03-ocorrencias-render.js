(function (window, document, TVApp) {
  'use strict';

  TVApp.registerModule('ocorrencias-render', function (app) {
    var Security       = app.Security;
    var Markers        = app.Markers;
    var Session        = app.Session;
    var escapeHTML     = Security.escapeHTML;
    var escapeJSString = Security.escapeJSString;
    var sanitizeIdAttr = Security.sanitizeIdAttr;

    function formatDataHoraLocal(dateInput) {
      var d = (dateInput && (typeof dateInput === 'number' || typeof dateInput === 'string' || dateInput instanceof Date))
        ? new Date(dateInput)
        : new Date();
      if (isNaN(d.getTime())) d = new Date();
      var p2 = function (n) { return n < 10 ? '0' + n : String(n); };
      return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
    }
    window.formatDataHoraLocal = formatDataHoraLocal;

    function prioLine(prio) { return prio === 'Alta' ? 'pl-r' : prio === 'Média' ? 'pl-y' : 'pl-g'; }
    function tagClass(prio) { return prio === 'Alta' ? 'tag-r' : prio === 'Média' ? 'tag-y' : 'tag-g'; }
    window.prioLine = prioLine;
    window.tagClass = tagClass;

    function isOcorrenciaVencida(oc) {
      if (!oc || oc.status !== 'aberta') return false;
      if (Array.isArray(oc.tags) && oc.tags.indexOf('Atrasada') !== -1) return true;
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

    function parseDataSegura(val) {
      if (!val) return null;
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      if (typeof val === 'number') {
        var dNum = new Date(val);
        return isNaN(dNum.getTime()) ? null : dNum;
      }
      if (typeof val === 'string') {
        var s = val.trim();
        if (!s) return null;
        if (/^\d+$/.test(s)) {
          var dTs = new Date(Number(s));
          return isNaN(dTs.getTime()) ? null : dTs;
        }
        var mBr = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[\s·]+(\d{2}):(\d{2}))?/);
        if (mBr) {
          var dBr = new Date(parseInt(mBr[3], 10), parseInt(mBr[2], 10) - 1, parseInt(mBr[1], 10), parseInt(mBr[4] || '0', 10), parseInt(mBr[5] || '0', 10), 0);
          return isNaN(dBr.getTime()) ? null : dBr;
        }
        var dIso = new Date(s.replace(' ', 'T'));
        if (!isNaN(dIso.getTime())) return dIso;
      }
      return null;
    }
    window.parseDataSegura = parseDataSegura;

    function formatarDataHoraBR(val, fallback) {
      var d = parseDataSegura(val);
      if (!d) return (fallback !== undefined ? fallback : (typeof val === 'string' ? val : ''));
      var p2 = function (n) { return n < 10 ? '0' + n : String(n); };
      return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + ' · ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
    }
    window.formatarDataHoraBR = formatarDataHoraBR;

    function formatarTempoEmAberto(oc) {
      if (!oc || oc.status !== 'aberta') return null;
      var d = parseDataSegura(oc.criado || oc.dataCriacao);
      if (!d) return null;
      var diffMs = Math.max(0, Date.now() - d.getTime());
      var diffMin = Math.floor(diffMs / 60000);
      var diffHoras = Math.floor(diffMs / 3600000);
      var diffDias = Math.floor(diffHoras / 24);
      var label = '';
      if (diffHoras < 1) {
        label = 'Aberta há ' + Math.max(1, diffMin) + ' min';
      } else if (diffHoras < 24) {
        label = 'Aberta há ' + diffHoras + 'h';
      } else if (diffDias < 7) {
        var remH = diffHoras % 24;
        label = 'Aberta há ' + diffDias + 'd' + (remH > 0 ? (' ' + remH + 'h') : '');
      } else {
        label = 'Aberta há ' + diffDias + 'd';
      }
      var vencida = isOcorrenciaVencida(oc);
      if (vencida || diffHoras >= 48) {
        return { label: label, color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', level: 'high' };
      }
      if (diffHoras >= 12) {
        return { label: label, color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', level: 'med' };
      }
      return { label: label, color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', level: 'low' };
    }
    window.formatarTempoEmAberto = formatarTempoEmAberto;

    function formatDataRelativa(timestampOrStr) {
      var dateObj = parseDataSegura(timestampOrStr);
      if (!dateObj) return '';
      var now = new Date();
      var hojeZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      var itemZero = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
      var diffDays = Math.round((hojeZero - itemZero) / (1000 * 60 * 60 * 24));
      var p2 = function (n) { return n < 10 ? '0' + n : String(n); };
      var horaStr = p2(dateObj.getHours()) + ':' + p2(dateObj.getMinutes());
      if (diffDays === 0) return 'Hoje · ' + horaStr;
      if (diffDays === 1) return 'Ontem · ' + horaStr;
      return p2(dateObj.getDate()) + '/' + p2(dateObj.getMonth() + 1) + '/' + dateObj.getFullYear() + ' · ' + horaStr;
    }
    window.formatDataRelativa = formatDataRelativa;

    var filtroOcorrenciasAtivo = 'todas';
    window.setFiltroOcorrenciasAtivo = function (val) {
      filtroOcorrenciasAtivo = val || 'todas';
    };

    function renderCards() {
      var container = document.getElementById('oc-list');
      if (!container) return;
      var lista = window.getAbertas();
      if (filtroOcorrenciasAtivo === 'alta') {
        lista = lista.filter(function (o) { return (o.prio || '').toLowerCase() === 'alta'; });
      } else if (filtroOcorrenciasAtivo === 'media') {
        lista = lista.filter(function (o) { return (o.prio || '').toLowerCase() === 'média' || (o.prio || '').toLowerCase() === 'media'; });
      } else if (filtroOcorrenciasAtivo === 'baixa') {
        lista = lista.filter(function (o) { return (o.prio || '').toLowerCase() === 'baixa'; });
      } else if (filtroOcorrenciasAtivo === 'atrasadas') {
        lista = lista.filter(function (o) { return isOcorrenciaVencida(o); });
      }
      if (lista.length === 0) {
        container.innerHTML =
          '<p style="color:var(--muted);font-size:13px;text-align:center;padding:28px 0;">' +
          'Nenhuma ocorrência encontrada para o filtro selecionado.</p>';
        if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
        return;
      }
      var secoes = agruparPorDias(lista, function (oc) { return oc.criado || oc.dataCriacao; });

      function renderCardHTML(oc) {
        var isVencida = isOcorrenciaVencida(oc);
        var isParcial = (oc.resolucao && oc.resolucao.statusRes === 'Parcialmente resolvido') || (oc.tags || []).indexOf('Parcialmente Resolvida') !== -1;
        var isNova = isOcorrenciaNova(oc);
        var tagsHTML = '<span class="tag ' + tagClass(oc.prio) + '">' + escapeHTML(oc.prio || 'Média') + '</span>';
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
        var tempoAberto = formatarTempoEmAberto(oc);
        if (tempoAberto) {
          tagsHTML += '<span class="tag" style="background:' + tempoAberto.bg + ';color:' + tempoAberto.color + ';border:1px solid ' + tempoAberto.border + ';font-weight:700;display:inline-flex;align-items:center;gap:3px;"><i data-lucide="hourglass" style="width:10.5px;height:10.5px;stroke-width:2.3;"></i>' + escapeHTML(tempoAberto.label) + '</span>';
        }
        (oc.tags || []).forEach(function (t) {
          if (t === 'Reincidente') {
            tagsHTML += '<span class="tag tag-r" style="font-weight:700;display:inline-flex;align-items:center;gap:3px;"><i data-lucide="rotate-ccw" style="width:11px;height:11px;stroke-width:2.4;"></i>Reincidente</span>';
          } else if (t !== 'Nova' && t !== 'Atrasada' && t !== 'Turno anterior' && t !== 'Parcialmente Resolvida' && t !== 'Só para você' && t !== 'Dia Anterior' && t !== 'Em Observação' && t !== 'Arquivada') {
            tagsHTML += '<span class="tag tag-y">' + escapeHTML(t) + '</span>';
          }
        });
        var respExibido = typeof window.formatarAtribuicaoResp === 'function' ? window.formatarAtribuicaoResp(oc.resp) : (oc.resp || 'Equipe do Turno (Todos)');
        var respIco  = (respExibido === 'Equipe do Turno (Todos)' || oc.resp === 'Todos do turno') ? 'users' : 'user';
        var criadorNome = typeof window.obterCriadorOcorrencia === 'function' ? window.obterCriadorOcorrencia(oc) : (oc.criadoPor || Session.getUserName());
        var criadorH = '<span class="oc-meta-item" title="Criado pelo operador conectado"><i data-lucide="user-check" style="width:12px;height:12px;stroke-width:2;color:var(--blue);"></i>Criado por: <strong style="color:var(--txt);font-weight:600;">' + escapeHTML(criadorNome) + '</strong></span>';
        var timeRel  = formatDataRelativa(oc.criado || oc.dataCriacao);
        var timeH    = timeRel ? '<span class="oc-meta-item" style="color:var(--muted);"><i data-lucide="clock" style="width:11.5px;height:11.5px;stroke-width:2;color:var(--dim);"></i>' + escapeHTML(timeRel) + '</span>' : '';
        var prazoH   = '';
        if (oc.prazo) {
          prazoH = isVencida
            ? '<span class="oc-meta-item" style="color:#DC2626;font-weight:600;"><i data-lucide="timer" style="width:12px;height:12px;stroke-width:2.5;color:#DC2626;"></i>Prazo: ' + escapeHTML(oc.prazo) + ' (Expirado)</span>'
            : '<span class="oc-meta-item"><i data-lucide="timer" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i>Prazo: ' + escapeHTML(oc.prazo) + '</span>';
        }
        var localH   = oc.local ? '<span class="oc-meta-item"><i data-lucide="map-pin" style="width:11.5px;height:11.5px;stroke-width:2;color:var(--dim);"></i>' + escapeHTML(oc.local) + '</span>' : '';
        var cardClasses = 'oc-card';
        if (isVencida) cardClasses += ' vencida';
        else if (isParcial) cardClasses += ' parcialmente-resolvida';
        else if (oc.mine) cardClasses += ' mine';
        var safeId = sanitizeIdAttr(oc.id);
        var safeJsId = escapeJSString(safeId);
        var cleanDesc = Markers.strip(oc.desc || '');
        return (
          '<article class="' + cardClasses + '" data-id="' + safeId + '" tabindex="0" role="button" onclick="verDetalhesOcorrencia(\'' + safeJsId + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();verDetalhesOcorrencia(\'' + safeJsId + '\');}" style="margin-bottom:10px;" title="Clique para ver detalhes">' +
            '<div class="prio-line ' + prioLine(oc.prio) + '"></div>' +
            '<div class="oc-body">' +
              '<div class="oc-header"><h3>' + escapeHTML(oc.titulo || 'Sem título') + '</h3>' + tagsHTML + '</div>' +
              '<p class="oc-desc">' + (typeof window.formatarTextoComLinks === 'function' ? window.formatarTextoComLinks(cleanDesc, true) : escapeHTML(cleanDesc)) + '</p>' +
              ((oc.link || (oc.resolucao && oc.resolucao.link)) && typeof window.renderBotaoLinkExterno === 'function'
                ? '<div style="margin-top:4px;margin-bottom:6px;">' + window.renderBotaoLinkExterno(oc.link || (oc.resolucao && oc.resolucao.link), null, true) + '</div>'
                : '') +
              ((oc.htmlRelatorio || oc.dadosCTRS || (oc.desc && String(oc.desc).indexOf('<!--CTRS_JSON:') !== -1) || (oc.tags && oc.tags.indexOf('Relatório TV') !== -1))
                ? '<div style="margin-top:6px;padding:5px 10px;background:#EFF6FF;border:1px solid #BFDBFE;border-left:3px solid #0071E3;border-radius:6px;font-size:11px;color:#1E3A8A;display:inline-flex;align-items:center;gap:6px;font-weight:700;"><i data-lucide="file-text" style="width:12px;height:12px;color:#0071E3;"></i> Contém Preview do Relatório CTRS na Descrição — Clique para visualizar</div>'
                : '') +
              '<div class="oc-meta">' +
                criadorH +
                '<span class="oc-meta-item" title="Atribuído para"><i data-lucide="' + respIco + '" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i>' + escapeHTML(respExibido) + '</span>' +
                timeH + prazoH + localH +
              '</div>' +
            '</div>' +
            '<div class="oc-actions" onclick="event.stopPropagation();">' +
              '<button class="btn-card-action btn-card-resolve" onclick="event.stopPropagation(); abrirResolver(\'' + safeJsId + '\')" title="Resolver ocorrência">' +
                '<i data-lucide="check-circle-2" style="width:13px;height:13px;stroke-width:2.2;"></i> Resolver' +
              '</button>' +
            '</div>' +
          '</article>'
        );
      }

      container.innerHTML = renderSecoesComCards(secoes, renderCardHTML);
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
    }
    window.renderCards = renderCards;

    function agruparPorDias(itens, fnData) {
      var now = new Date();
      var hojeZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      var grupos = { hoje: [], ontem: [], anteriores: [] };
      (itens || []).forEach(function (item) {
        var valData = fnData ? fnData(item) : (item.criado || item.dataCriacao || item.dataExclusao);
        var dParsed = parseDataSegura(valData);
        var ts = dParsed ? dParsed.getTime() : Date.now();
        var d = new Date(ts);
        var itemZero = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        var diffDays = Math.round((hojeZero - itemZero) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) grupos.hoje.push(item);
        else if (diffDays === 1) grupos.ontem.push(item);
        else grupos.anteriores.push(item);
      });
      return [
        { key: 'hoje', titulo: 'Hoje', icone: 'calendar', items: grupos.hoje },
        { key: 'ontem', titulo: 'Ontem', icone: 'history', items: grupos.ontem },
        { key: 'anteriores', titulo: 'Dias Anteriores', icone: 'archive', items: grupos.anteriores }
      ];
    }
    window.agruparPorDias = agruparPorDias;

    function renderSecoesComCards(secoes, fnRenderCard) {
      var html = '';
      (secoes || []).forEach(function (sec) {
        if (sec.items && sec.items.length > 0) {
          html +=
            '<div class="oc-section-header" style="margin-top:14px;margin-bottom:10px;">' +
              '<span class="oc-section-title"><i data-lucide="' + escapeHTML(sec.icone) + '" style="width:13px;height:13px;stroke-width:2.2;"></i> ' + escapeHTML(sec.titulo) + '</span>' +
              '<span class="oc-section-count">' + sec.items.length + '</span>' +
              '<div class="oc-section-line"></div>' +
            '</div>' +
            sec.items.map(fnRenderCard).join('');
        }
      });
      return html;
    }
    window.renderSecoesComCards = renderSecoesComCards;

    function renderAside(containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      var abertas    = window.getAbertas();
      var resolvidas = window.getResolvidas();
      var abertasHTML = '';
      if (abertas.length === 0) {
        abertasHTML = '<p style="font-size:11.5px;color:var(--muted);padding:8px 0;">Nenhuma ocorrência ativa.</p>';
      } else {
        abertasHTML = abertas.map(function (oc) {
          var dotClass = oc.prio === 'Alta' ? 'md-r' : oc.prio === 'Média' ? 'md-y' : 'md-g';
          var tagsPrio = '<span class="tag ' + tagClass(oc.prio) + '">' + escapeHTML(oc.prio || 'Média') + '</span>';
          if (isOcorrenciaNova(oc)) tagsPrio += '<span class="tag tag-y">Nova</span>';
          (oc.tags || []).forEach(function (t) {
            if (t !== 'Nova' && t !== 'Atrasada' && t !== 'Turno anterior' && t !== 'Parcialmente Resolvida' && t !== 'Dia Anterior') {
              tagsPrio += '<span class="tag tag-y">' + escapeHTML(t) + '</span>';
            }
          });
          if (oc.mine) tagsPrio += '<span class="tag" style="background:#EEF2FF;color:#4F46E5;border:1px solid #C7D2FE;font-weight:600;">Atribuída a você</span>';
          var meta = escapeHTML(oc.resp || 'Todos do turno');
          if (oc.prazo) meta += ' · ' + escapeHTML(oc.prazo);
          if (oc.local) meta += ' · ' + escapeHTML(oc.local);
          var safeOcId = escapeJSString(sanitizeIdAttr(oc.id));
          return (
            '<div class="mini-oc' + (oc.mine ? ' mine' : '') + '" onclick="abrirResolver(\'' + safeOcId + '\')">' +
              '<div class="mini-top"><div class="mini-dot ' + dotClass + '"></div>' +
              '<div class="mini-title">' + escapeHTML(oc.titulo || 'Ocorrência') + '</div></div>' +
              '<div style="margin-bottom:3px;">' + tagsPrio + '</div>' +
              '<div class="mini-info">' + meta + '</div>' +
            '</div>'
          );
        }).join('');
      }
      var resolvidasHTML = '';
      if (resolvidas.length > 0) {
        resolvidasHTML =
          '<div class="aside-divider"></div>' +
          '<div class="aside-lbl">Resolvidas (' + resolvidas.length + ')</div>' +
          resolvidas.slice(0, 5).map(function (oc) {
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
    window.renderAside = renderAside;
  });
})(window, document, window.TVApp);
