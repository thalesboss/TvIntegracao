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
