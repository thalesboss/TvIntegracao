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
      var atrasadas = ocorrencias.filter(function(o){ return isOcorrenciaVencida(o); }).length;
      var diaAnt    = ocorrencias.filter(function(o){ return o && o.status==='aberta' && isOcorrenciaDiaAnterior(o); }).length;

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
    var ocSig = (ocorrencias || []).map(function(o){ return (o.id||'') + '_' + (o.status||'') + '_' + (o.prio||''); }).join('|');
    var lixSig = (lixeiraData || []).map(function(i){ return (i.id||'') + '_' + (i.expiraEm||''); }).join('|');
    var notifSig = (notificacoesStore || []).map(function(n){ return (n.id||'') + '_' + (n.lida?1:0); }).join('|');
    var histCount = getHistoricoCompleto().length;
    var horaMinuto = new Date().getMinutes();
    return ocSig + '#' + lixSig + '#' + notifSig + '#' + histCount + '#' + horaMinuto;
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
