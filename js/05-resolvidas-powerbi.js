(function (window, document, TVApp) {
  'use strict';

  TVApp.registerModule('resolvidas-powerbi', function (app) {
    var Security       = app.Security;
    var Store          = app.Store;
    var escapeHTML     = Security.escapeHTML;
    var escapeJSString = Security.escapeJSString;
    var sanitizeIdAttr = Security.sanitizeIdAttr;

    var resolvidasFiltro = 'todas';
    function filtrarResolvidas(filtro, el) {
      resolvidasFiltro = filtro;
      document.querySelectorAll('#page-resolvidas .pill').forEach(function (p) { p.classList.remove('on'); });
      if (el) el.classList.add('on');
      renderResolvidas();
    }
    window.filtrarResolvidas = filtrarResolvidas;

    function renderResolvidas() {
      var listEl = document.getElementById('resolvidas-list');
      if (!listEl) return;
      var resolvidas = window.getResolvidas();
      var abertas = window.getAbertas();
      var vencidas = abertas.filter(function (o) { return window.isOcorrenciaVencida(o); });
      var abertasNoPrazo = abertas.filter(function (o) { return !window.isOcorrenciaVencida(o); });
      var totRes = resolvidas.length;
      var totAb  = abertasNoPrazo.length;
      var totVen = vencidas.length;
      var totalGeral = totRes + totAb + totVen;

      var elG = document.querySelector('.sn-resolvidas-g');
      var elB = document.querySelector('.sn-resolvidas-b');
      var elR = document.querySelector('.sn-resolvidas-r');
      if (elG) elG.textContent = totRes;
      if (elB) elB.textContent = totAb;
      if (elR) elR.textContent = totVen;

      var pctRes = totalGeral > 0 ? Math.round((totRes / totalGeral) * 100) : 0;
      var pctAb  = totalGeral > 0 ? Math.round((totAb / totalGeral) * 100) : 0;
      var pctVen = totalGeral > 0 ? Math.max(0, 100 - pctRes - pctAb) : 0;

      var badgePct = document.getElementById('pct-resolucao-badge');
      if (badgePct) badgePct.textContent = 'Taxa de Resolução: ' + pctRes + '%';
      var txtTot = document.getElementById('txt-total-ocorrencias');
      if (txtTot) txtTot.textContent = totalGeral + ' ocorrências registradas';
      var pieTot = document.getElementById('pie-resolvidas-tot');
      if (pieTot) pieTot.textContent = totalGeral;
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

      var itensExibir = [];
      if (resolvidasFiltro === 'todas') {
        itensExibir = resolvidas.map(function (o) { return { item: o, isVencida: false }; })
          .concat(vencidas.map(function (o) { return { item: o, isVencida: true }; }));
      } else if (resolvidasFiltro === 'concluidas') {
        itensExibir = resolvidas.map(function (o) { return { item: o, isVencida: false }; });
      } else if (resolvidasFiltro === 'vencidas') {
        itensExibir = vencidas.map(function (o) { return { item: o, isVencida: true }; });
      }
      if (itensExibir.length === 0) {
        listEl.innerHTML = '<p style="color:var(--muted);font-size:13px;text-align:center;padding:24px 0;">Nenhum registro nesta categoria.</p>';
        return;
      }
      listEl.innerHTML = itensExibir.map(function (obj) {
        var oc = obj.item;
        var isV = obj.isVencida;
        var safeOcId = escapeJSString(sanitizeIdAttr(oc.id));
        if (isV) {
          return (
            '<article class="oc-card vencida" tabindex="0" role="button" style="cursor:pointer;" onclick="verDetalhesOcorrenciaResolvida(\'' + safeOcId + '\')">' +
              '<div class="prio-line pl-r"></div>' +
              '<div class="oc-body">' +
                '<div class="oc-header">' +
                  '<h3>' + escapeHTML(oc.titulo || 'Sem título') + '</h3>' +
                  '<span class="tag tag-r">⚠️ Prazo Expirado / Não Resolvida</span>' +
                  '<span class="tag tag-y">' + escapeHTML(oc.prio || 'Média') + '</span>' +
                '</div>' +
                '<p class="oc-desc">' + escapeHTML(app.Markers.strip(oc.desc || '')) + '</p>' +
                '<div class="oc-meta">' +
                  '<span><i data-lucide="user" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Atribuído: ' + escapeHTML(oc.resp || 'Todos do turno') + '</span>' +
                  '<span><i data-lucide="clock" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Prazo: ' + escapeHTML(oc.prazo || 'Expirado') + '</span>' +
                  '<span><i data-lucide="map-pin" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Local: ' + escapeHTML(oc.local || 'N/A') + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="oc-actions" onclick="event.stopPropagation();">' +
                '<button class="btn-card-action btn-card-resolve" onclick="event.stopPropagation(); abrirResolver(\'' + safeOcId + '\')" title="Resolver ocorrência">' +
                  '<i data-lucide="check-circle-2" style="width:12px;height:12px;stroke-width:2.2;"></i> Resolver' +
                '</button>' +
              '</div>' +
            '</article>'
          );
        }
        var isParcial = (oc.resolucao && oc.resolucao.statusRes === 'Parcialmente resolvido') || (oc.status === 'Parcialmente resolvido') || (oc.tags || []).indexOf('Parcialmente Resolvida') !== -1;
        var statusTexto = (oc.resolucao && oc.resolucao.statusRes) ? oc.resolucao.statusRes : 'Resolvido';
        var descResolucao = (oc.resolucao && oc.resolucao.descRes) ? oc.resolucao.descRes : 'Resolução concluída com sucesso.';
        var cardClass = isParcial ? 'oc-card parcialmente-resolvida' : 'oc-card';
        var cardStyle = isParcial ? 'cursor:pointer;' : 'background:var(--bg); border:1px solid #A8E6BB; cursor:pointer;';
        var prioLineClass = isParcial ? 'pl-y' : 'pl-g';
        var tagStatusClass = isParcial ? 'tag-y' : 'tag-g';
        return (
          '<article class="' + cardClass + '" tabindex="0" role="button" style="' + cardStyle + '" onclick="verDetalhesOcorrenciaResolvida(\'' + safeOcId + '\')">' +
            '<div class="prio-line ' + prioLineClass + '"></div>' +
            '<div class="oc-body">' +
              '<div class="oc-header">' +
                '<h3>' + escapeHTML(oc.titulo || 'Sem título') + '</h3>' +
                '<span class="tag ' + tagStatusClass + '">' + (isParcial ? '⚠️ ' : '✓ ') + escapeHTML(statusTexto) + '</span>' +
                '<span class="tag tag-teal-soft">' + escapeHTML(oc.cat || 'Equipamento') + '</span>' +
              '</div>' +
              '<p class="oc-desc" style="color:var(--txt);"><strong>Resolução:</strong> ' + escapeHTML(app.Markers.strip(descResolucao)) + '</p>' +
              '<div class="oc-meta">' +
                '<span><i data-lucide="user-check" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Responsável: ' + escapeHTML(oc.resp || 'Todos do turno') + '</span>' +
                '<span><i data-lucide="map-pin" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Local: ' + escapeHTML(oc.local || 'Central Técnica') + '</span>' +
              '</div>' +
            '</div>' +
          '</article>'
        );
      }).join('');
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
    }
    window.renderResolvidas = renderResolvidas;

    function updateStats() {
      try {
        var ab  = window.getAbertas().length;
        var res = window.getResolvidas().length;
        var atrasadas = (Store.ocorrencias || []).filter(function (o) {
          return window.isOcorrenciaVencida(o) && (typeof window.pertenceAPracaAtiva !== 'function' || window.pertenceAPracaAtiva(o));
        }).length;
        var diaAnt = (Store.ocorrencias || []).filter(function (o) {
          return o && o.status === 'aberta' && window.isOcorrenciaDiaAnterior(o) && (typeof window.pertenceAPracaAtiva !== 'function' || window.pertenceAPracaAtiva(o));
        }).length;
        var rEl = document.querySelector('.sn-r');
        var yEl = document.querySelector('.sn-y');
        var gEl = document.querySelector('.sn-g');
        var bEl = document.querySelector('.sn-b');
        if (rEl) rEl.textContent = ab;
        if (yEl) yEl.textContent = atrasadas;
        if (gEl) gEl.textContent = res;
        if (bEl) bEl.textContent = diaAnt;
        var notifBadge = document.querySelector('.notif-badge');
        if (notifBadge) {
          var numNotifs = Array.isArray(Store.notificacoesStore) ? Store.notificacoesStore.filter(function (n) { return !n.lida; }).length : 0;
          notifBadge.textContent = numNotifs;
        }
      } catch (err) {
        console.warn('Erro ao atualizar estatísticas:', err);
      }
    }
    window.updateStats = updateStats;

    function renderPopupEntrada() {
      var container = document.getElementById('popup-entrada-pendencias');
      if (!container) return;
      var abertas = window.getAbertas();
      var emObs = (typeof window.getArquivadas === 'function') ? window.getArquivadas() : [];
      if (abertas.length === 0 && emObs.length === 0) {
        container.innerHTML = '<div class="info-item blue"><div class="ii-dot blue"></div><div><strong>Sem Pendências</strong>Nenhuma ocorrência pendente ou em observação no momento.</div></div>';
        return;
      }
      var htmlAbertas = abertas.slice(0, 4).map(function (oc) {
        var isVencida = window.isOcorrenciaVencida(oc);
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
      var htmlObs = '';
      if (emObs.length > 0) {
        htmlObs =
          '<div style="margin-top:10px;padding-top:8px;border-top:1px dashed var(--border);">' +
            '<div style="font-size:11px;font-weight:700;color:#4F46E5;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px;">👁️ Equipamentos / Sistemas em Observação (' + emObs.length + ')</div>' +
            emObs.slice(0, 3).map(function (oc) {
              return (
                '<div class="info-item" style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:8px;padding:7px 10px;margin-bottom:5px;">' +
                  '<div class="ii-dot" style="background:#4F46E5;"></div>' +
                  '<div style="color:#1E1B4B;">' +
                    '<strong>' + escapeHTML(oc.equipamento || oc.local || oc.cat || 'Sistema') + ' — ⏳ Em observação</strong>' +
                    escapeHTML(oc.titulo || 'Ocorrência') + ' <span style="color:#4338CA;font-weight:600;">(validar neste turno)</span>' +
                  '</div>' +
                '</div>'
              );
            }).join('') +
          '</div>';
      }
      container.innerHTML = htmlAbertas + htmlObs;
    }
    window.renderPopupEntrada = renderPopupEntrada;

    function renderPopupLogout() {
      var container = document.getElementById('popup-logout-checklist');
      if (!container) return;
      var abertas = window.getAbertas();
      if (abertas.length === 0) {
        container.innerHTML = '<p style="font-size:12px;color:var(--muted);padding:6px 0;">Todas as ocorrências do turno foram concluídas!</p>';
        return;
      }
      container.innerHTML = abertas.map(function (oc) {
        var cid = sanitizeIdAttr('chk_out_' + oc.id);
        var isVencida = window.isOcorrenciaVencida(oc);
        var textExtra = isVencida ? ' [PRAZO EXPIRADO]' : '';
        return (
          '<label class="chk-item" id="' + cid + '">' +
            '<input type="checkbox" onchange="markDone(\'' + escapeJSString(cid) + '\',this)"/> ' +
            '<span>' + escapeHTML(oc.titulo || 'Ocorrência') + escapeHTML(textExtra) + ' (' + escapeHTML(oc.resp || 'Todos') + ')</span>' +
          '</label>'
        );
      }).join('');
    }
    window.renderPopupLogout = renderPopupLogout;

    var lastRenderSignature = '';
    function calcularAssinaturaEstado() {
      var pracaSig = (typeof window.getPracaAtual === 'function') ? window.getPracaAtual() : 'JF';
      var ocSig = (Store.ocorrencias || []).filter(function (o) {
        return typeof window.pertenceAPracaAtiva !== 'function' || window.pertenceAPracaAtiva(o);
      }).map(function (o) { return (o.id || '') + '_' + (o.status || '') + '_' + (o.prio || ''); }).join('|');
      var lixSig = (Store.lixeiraData || []).map(function (i) { return (i.id || '') + '_' + (i.expiraEm || ''); }).join('|');
      var notifSig = (Store.notificacoesStore || []).map(function (n) { return (n.id || '') + '_' + (n.lida ? 1 : 0); }).join('|');
      var histCount = window.getHistoricoCompleto().length;
      var horaMinuto = new Date().getMinutes();
      return pracaSig + '#' + ocSig + '#' + lixSig + '#' + notifSig + '#' + histCount + '#' + horaMinuto;
    }

    function renderAll(forcar) {
      var novaSig = calcularAssinaturaEstado();
      if (forcar !== true && novaSig === lastRenderSignature) {
        updateStats();
        return;
      }
      lastRenderSignature = novaSig;
      var steps = [
        window.renderCards,
        window.renderArquivados,
        window.renderLixeira,
        window.verificarExpiracaoLixeira,
        window.verificarNotificacoesAutomaticas,
        window.renderNotificacoes
      ];
      steps.forEach(function (fn) {
        if (typeof fn === 'function') {
          try { fn(); } catch (e) { console.error('[renderAll] Erro:', e); }
        }
      });
      ['aside-ctrs', 'aside-recebimento', 'aside-compras', 'aside-orcamento', 'aside-arquivados'].forEach(function (asId) {
        if (typeof window.renderAside === 'function') {
          try { window.renderAside(asId); } catch (e) { console.error('[renderAside] Erro em ' + asId + ':', e); }
        }
      });
      [
        renderResolvidas,
        window.renderHistorico,
        window.renderDashboards,
        window.renderCatalogoEquipamentos,
        window.renderOrcamento,
        renderPopupEntrada,
        renderPopupLogout,
        updateStats
      ].forEach(function (fn) {
        if (typeof fn === 'function') {
          try { fn(); } catch (e) { console.error('[renderAll] Erro:', e); }
        }
      });
    }
    window.renderAll = renderAll;

    var debounceTimers = {};
    function registrarAutosaveListener(pageId, salvarFn) {
      var page = document.getElementById(pageId);
      if (!page) return;
      function acao() {
        clearTimeout(debounceTimers[pageId]);
        debounceTimers[pageId] = setTimeout(function () { salvarFn(true); }, 500);
      }
      page.addEventListener('input', acao);
      page.addEventListener('change', acao);
    }
    window.registrarAutosaveListener = registrarAutosaveListener;
  });
})(window, document, window.TVApp);
