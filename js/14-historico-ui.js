  function renderHistorico() {
    var container = document.getElementById('hist-list');
    if (!container) return;
    var busca = (document.getElementById('hist-search') ? document.getElementById('hist-search').value : '').toLowerCase().trim();
    var todosItens = getHistoricoCompleto();
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
      var stItemLow = String(item.status || '').toLowerCase();
      var isReaberta = (item.tipo === 'ocorrencia') && (
        stItemLow.indexOf('reaberta') !== -1 ||
        stItemLow === 'aberta' ||
        (stItemLow.indexOf('reincidente') !== -1 && stItemLow.indexOf('resolvido') === -1)
      );
      var isParcial = !isReaberta && (
                      (item.status === 'Parcialmente resolvido') ||
                      (item.status === 'Parcialmente Resolvida') ||
                      (item.subtipo && String(item.subtipo).toLowerCase().includes('parcial')) ||
                      (item.tags && item.tags.indexOf('Parcialmente Resolvida') !== -1) ||
                      (item.descResolucao && String(item.descResolucao).toLowerCase().includes('parcialmente resolvido'))
      );
      var isArquivado = !isReaberta && (
                        (item.status === 'Em Observação') ||
                        (item.status === 'Resolvida e Arquivada') ||
                        (item.status === 'arquivada') ||
                        (item.tags && (item.tags.indexOf('Em Observação') !== -1 || item.tags.indexOf('Arquivada') !== -1))
      );
      var isValidadaPosReparo = !isReaberta && !isArquivado && (
        stItemLow.indexOf('validado') !== -1 ||
        (item.tags && item.tags.indexOf('Validada Pós-Reparo') !== -1) ||
        !!item.concluidoObservacaoPor
      );
      var tagMeu = eMeu ? '<span class="tag tag-ind">Seu Registro / Resolução</span>' : '';
      var tagTipo = getTagTipoBadge(item);
      if (item.tipo === 'relatorio') {
        if (item.status) {
          var isNCRel = String(item.status).toLowerCase().indexOf('não conform') !== -1;
          tagTipo += ' <span class="tag ' + (isNCRel ? 'tag-y' : 'tag-g') + '" style="font-weight:600;display:inline-flex;align-items:center;gap:3px;"><i data-lucide="' + (isNCRel ? 'alert-triangle' : 'check-circle-2') + '" style="width:11px;height:11px;stroke-width:2.2;"></i>' + escapeHTML(item.status) + '</span>';
        }
      } else if (item.tipo === 'ocorrencia') {
        if (isReaberta) {
          tagTipo += ' <span class="tag tag-r" style="font-weight:600;display:inline-flex;align-items:center;gap:3px;"><i data-lucide="alert-triangle" style="width:11px;height:11px;stroke-width:2.2;"></i>Reaberta (Reincidente)</span>';
        } else if (isParcial) {
          tagTipo += ' <span class="tag tag-y" style="font-weight:600;">Parcialmente Resolvida</span>';
        } else if (isArquivado) {
          tagTipo += ' <span class="tag tag-ind" style="font-weight:600;display:inline-flex;align-items:center;gap:3px;"><i data-lucide="eye" style="width:11px;height:11px;stroke-width:2.2;"></i>Em Observação</span>';
        } else if (isValidadaPosReparo) {
          tagTipo += ' <span class="tag tag-g" style="font-weight:600;display:inline-flex;align-items:center;gap:3px;"><i data-lucide="shield-check" style="width:11px;height:11px;stroke-width:2.2;"></i>Validada Pós-Reparo</span>';
        } else {
          tagTipo += ' <span class="tag tag-g" style="font-weight:600;display:inline-flex;align-items:center;gap:3px;"><i data-lucide="check-circle-2" style="width:11px;height:11px;stroke-width:2.2;"></i>Resolvida</span>';
        }
      }
      var isSel = (itemHistoricoSelecionado && itemHistoricoSelecionado.id === item.id);
      var cardClasses = 'oc-card';
      var plClass = 'pl-g';
      if (item.tipo === 'relatorio') {
        cardClasses += ' hist-card-rel';
        plClass = 'pl-b';
      } else if (item.tipo === 'recebimento') {
        cardClasses += ' hist-card-rec';
        plClass = 'pl-y';
      } else if (isReaberta) {
        cardClasses += ' hist-card-oc-aberta';
        plClass = 'pl-r';
      } else if (isArquivado) {
        cardClasses += ' hist-card-oc-obs';
        plClass = 'pl-ind';
      } else if (isParcial) {
        cardClasses += ' hist-card-oc-parc';
        plClass = 'pl-y';
      } else {
        cardClasses += ' hist-card-oc-res';
        plClass = 'pl-g';
      }
      var isRelatorioCTRS = (item.tipo === 'relatorio') && (
        item.subtipo === 'CTRS Transmissão' ||
        item.subtipo === 'Relatório Transmissão' ||
        item.categoria === 'Transmissão CTRS' ||
        (item.id && String(item.id).indexOf('h_ctrs_') === 0)
      );
      var isRecebimentoCard = (item.tipo === 'recebimento') || (item.id && String(item.id).indexOf('h_rec_') === 0);
      var resolucaoBox = '';
      var textoResRaw = item.descResolucao || (item.resolucao && item.resolucao.descRes) || '';
      var textoRes = String(textoResRaw).replace(/<!--(?:CTRS|RONDA|REC)_JSON:[^>]+-->/g, '').trim();
      if (isRelatorioCTRS) {
        resolucaoBox =
          '<div style="margin-top:8px;padding:7px 11px;background:#FFFFFF;border:1px solid #93C5FD;border-left:3px solid #0071E3;border-radius:6px;font-size:11.5px;color:#1E3A8A;display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
            '<span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;">' +
              '<i data-lucide="file-text" style="width:13px;height:13px;color:#0071E3;"></i>' +
              'Formulário CTRS — Clique para abrir a visualização completa do relatório' +
            '</span>' +
            '<span style="font-size:11px;font-weight:700;color:#0071E3;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="eye" style="width:12px;height:12px;"></i>Ver Preview</span>' +
          '</div>';
      } else if (isRecebimentoCard) {
        var dRecCard = extrairDadosRecebimentoDeItemHistorico(item);
        var qtdAnxCard = (dRecCard && Array.isArray(dRecCard.anexos)) ? dRecCard.anexos.length : 0;
        var chipAnxCard = qtdAnxCard > 0
          ? '<span style="font-size:10.5px;font-weight:700;color:#B45309;background:#FEF3C7;border:1px solid #FDE68A;padding:1px 7px;border-radius:10px;display:inline-flex;align-items:center;gap:3px;"><i data-lucide="paperclip" style="width:10px;height:10px;"></i>' + qtdAnxCard + ' anexo(s)</span>'
          : '';
        resolucaoBox =
          '<div style="margin-top:8px;padding:7px 11px;background:#FFFFFF;border:1px solid #FDE68A;border-left:3px solid #D97706;border-radius:6px;font-size:11.5px;color:#92400E;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">' +
            '<span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;">' +
              '<i data-lucide="package-check" style="width:13px;height:13px;color:#D97706;"></i>' +
              'Guia de Recebimento Patrimonial — Clique para ver nota fiscal, itens e fotos/PDF' +
            '</span>' +
            '<span style="display:inline-flex;align-items:center;gap:8px;">' +
              chipAnxCard +
              '<span style="font-size:11px;font-weight:700;color:#D97706;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="eye" style="width:12px;height:12px;"></i>Ver Guia</span>' +
            '</span>' +
          '</div>';
      } else if (textoRes) {
        var resBoxBorda = isReaberta ? '#EF4444' : (isArquivado ? '#4F46E5' : (isParcial ? '#F59E0B' : 'var(--green)'));
        var resBoxTituloCor = isReaberta ? '#B91C1C' : (isArquivado ? '#3730A3' : (isParcial ? '#B45309' : 'var(--green-dk)'));
        resolucaoBox =
          '<div style="margin-top:6px;padding:6px 10px;background:#FFFFFF;border:1px solid rgba(0,0,0,0.06);border-left:3px solid ' + resBoxBorda + ';border-radius:6px;font-size:11.5px;color:var(--txt2);line-height:1.4;">' +
            '<strong style="color:' + resBoxTituloCor + ';display:flex;align-items:center;gap:4px;font-size:11px;margin-bottom:2px;">' +
              '<i data-lucide="check-circle-2" style="width:11px;height:11px;"></i> Resolução / Fechamento:' +
            '</strong>' +
            '<span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + escapeHTML(textoRes) + '</span>' +
          '</div>';
      }
      var observacaoLogsHTML = '';
      if (item.tipo === 'ocorrencia') {
        var valsTurno = Array.isArray(item.validacoesTurno) ? item.validacoesTurno : [];
        var reincArr = Array.isArray(item.reincidencias) ? item.reincidencias : [];
        if (valsTurno.length > 0 || item.concluidoObservacaoPor || reincArr.length > 0) {
          observacaoLogsHTML = '<div style="margin-top:6px;display:flex;flex-direction:column;gap:4px;">';
          valsTurno.forEach(function(v) {
            var turnoHistTxt = v.turno ? (' (' + escapeHTML(v.turno) + ')') : '';
            observacaoLogsHTML +=
              '<div style="font-size:11px;color:#047857;background:#FFFFFF;border:1px solid #A7F3D0;border-left:3px solid #10B981;border-radius:6px;padding:4px 8px;display:flex;align-items:center;gap:5px;">' +
                '<i data-lucide="shield-check" style="width:12px;height:12px;stroke-width:2.3;flex-shrink:0;"></i>' +
                '<span>Avaliado no turno' + turnoHistTxt + ' por <strong>' + escapeHTML(v.operador || 'Operador') + '</strong> (' + escapeHTML(v.dataHora || '') + ')</span>' +
              '</div>';
          });
          if (item.concluidoObservacaoPor) {
            observacaoLogsHTML +=
              '<div style="font-size:11px;color:#065F46;background:#ECFDF5;border:1px solid #6EE7B7;border-left:3px solid #059669;border-radius:6px;padding:4px 8px;display:flex;align-items:center;gap:5px;">' +
                '<i data-lucide="check-circle-2" style="width:12px;height:12px;stroke-width:2.3;flex-shrink:0;"></i>' +
                '<span>Observação concluída definitivamente por <strong>' + escapeHTML(item.concluidoObservacaoPor) + '</strong> (' + escapeHTML(item.concluidoObservacaoEm || '') + ')</span>' +
              '</div>';
          }
          reincArr.forEach(function(rc) {
            observacaoLogsHTML +=
              '<div style="font-size:11px;color:#B91C1C;background:#FFFFFF;border:1px solid #FECACA;border-left:3px solid #EF4444;border-radius:6px;padding:4px 8px;display:flex;align-items:center;gap:5px;">' +
                '<i data-lucide="alert-triangle" style="width:12px;height:12px;stroke-width:2.3;flex-shrink:0;"></i>' +
                '<span>Voltou a falhar por <strong>' + escapeHTML(rc.operador || 'Operador') + '</strong> (' + escapeHTML(rc.dataHora || '') + '): ' + escapeHTML(rc.motivo || '') + '</span>' +
              '</div>';
          });
          observacaoLogsHTML += '</div>';
        }
      }
      var metaFooterHTML = isRelatorioCTRS
        ? (
            '<span><i data-lucide="user" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Emitido por: ' + escapeHTML(item.criadoPor || 'Operador') + '</span>' +
            (item.equipamento && item.equipamento !== 'Equipamentos de Transmissão / CTRS'
              ? '<span><i data-lucide="radio" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Equipamento(s): ' + escapeHTML(item.equipamento) + '</span>'
              : '') +
            '<span><i data-lucide="calendar" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> ' + escapeHTML(item.dataCriacao || item.dataResolucao || '') + '</span>'
          )
        : (
            '<span><i data-lucide="user-check" style="width:12px;height:12px;stroke-width:2;color:var(--blue);"></i> Criado por: <strong style="color:var(--txt);">' + escapeHTML(typeof obterCriadorOcorrencia === 'function' ? obterCriadorOcorrencia(item) : (item.criadoPor || getUsuarioAtual())) + '</strong></span>' +
            '<span><i data-lucide="check-circle-2" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Resolvido por: ' + escapeHTML(item.resolvidoPor || 'Pendente') + '</span>' +
            '<span><i data-lucide="calendar" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> ' + escapeHTML(item.dataResolucao || item.dataCriacao || '') + '</span>'
          );
      return (
        '<article class="' + cardClasses + '" onclick="verDetalhesHistorico(\'' + item.id + '\')" onmouseenter="selecionarItemHistorico(\'' + item.id + '\')" style="cursor:pointer;margin-bottom:10px;' + (isSel ? 'border-color:var(--blue);box-shadow:0 0 0 2px rgba(0,113,227,.15);' : '') + '">' +
          '<div class="prio-line ' + plClass + '"></div>' +
          '<div class="oc-body">' +
            '<div class="oc-header"><h3>' + escapeHTML(item.titulo || 'Sem título') + '</h3>' + tagTipo + tagMeu + '</div>' +
            '<p class="oc-desc" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + escapeHTML(String(item.descCriacao || item.desc || 'Sem descrição').replace(/<!--(?:CTRS|RONDA|REC)_JSON:[^>]+-->/g, '').trim()) + '</p>' +
            resolucaoBox +
            observacaoLogsHTML +
            '<div class="oc-meta" style="margin-top:8px;gap:14px;flex-wrap:wrap;display:flex;align-items:center;font-size:11.5px;">' +
              metaFooterHTML +
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
          criadoPor:     (typeof obterCriadorOcorrencia === 'function') ? obterCriadorOcorrencia(oc) : (oc.criadoPor || getUsuarioAtual()),
          resp:          (typeof formatarAtribuicaoResp === 'function') ? formatarAtribuicaoResp(oc.resp) : (oc.resp || 'Equipe do Turno (Todos)'),
          descCriacao:   oc.desc || 'Ocorrência registrada no sistema.',
          status:        (oc.resolucao && oc.resolucao.statusRes) ? oc.resolucao.statusRes : (oc.status === 'arquivada' ? 'Em Observação' : 'Resolvido'),
          dataResolucao: (oc.resolucao && oc.resolucao.data) ? formatDataHoraLocal(oc.resolucao.data) : formatDataHoraLocal(),
          resolvidoPor:  (oc.resolucao && oc.resolucao.resolvidoPor) ? oc.resolucao.resolvidoPor : getUsuarioAtual(),
          descResolucao: (oc.resolucao && oc.resolucao.descRes) ? oc.resolucao.descRes : (oc.desc || 'Ocorrência resolvida pela equipe técnica.'),
          link:          oc.link || (oc.resolucao && oc.resolucao.link) || '',
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
    var textoTitulo = (item.titulo || '').toUpperCase();
    for (var k = 0; k < alvosDashboard.length; k++) {
      var alvo = alvosDashboard[k].toUpperCase();
      var alvoEscapado = alvo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var reg = new RegExp('(^|[^A-Z0-9])' + alvoEscapado + '([^A-Z0-9]|$)', 'i');
      if (reg.test(textoTitulo)) {
        return alvosDashboard[k];
      }
    }
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
        var stRel = obterEstiloSemanticoHistoricoItem(rel);
        var statusTexto = rel.status || (rel.resolucao && rel.resolucao.statusRes) || stRel.statusLabel;
        var dataFmt = (rel.dataResolucao || rel.dataCriacao || '').substring(0, 10);
        var respFmt = rel.resolvidoPor || rel.criadoPor || 'Sistema';
        var tipoMiniBadge = rel.tipo === 'relatorio'
          ? '<span style="font-size:9px;font-weight:700;color:#1D4ED8;background:#DBEAFE;border:1px solid #93C5FD;padding:1px 6px;border-radius:999px;white-space:nowrap;">Relatório</span>'
          : (rel.tipo === 'recebimento'
              ? '<span style="font-size:9px;font-weight:700;color:#B45309;background:#FEF3C7;border:1px solid #FDE68A;padding:1px 6px;border-radius:999px;white-space:nowrap;">Recebimento</span>'
              : '<span style="font-size:9px;font-weight:700;color:#B91C1C;background:#FEE2E2;border:1px solid #FECACA;padding:1px 6px;border-radius:999px;white-space:nowrap;">Ocorrência</span>');
        return (
          '<div class="mini-oc" onclick="verDetalhesHistorico(\'' + rel.id + '\')" style="margin-bottom:8px;padding:10px 12px;border-radius:var(--r-md);border:1px solid ' + stRel.border + ';border-left:3.5px solid ' + stRel.left + ';background:' + stRel.bg + ';cursor:pointer;transition:all 0.15s ease;" onmouseover="this.style.borderColor=\'' + stRel.hover + '\';this.style.boxShadow=\'0 2px 8px rgba(0,113,227,0.10)\';" onmouseout="this.style.borderColor=\'' + stRel.border + '\';this.style.boxShadow=\'none\';">' +
            '<div class="mini-top" style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;">' +
              tipoMiniBadge +
              '<span class="tag ' + stRel.tagCls + '" style="font-size:9.5px;padding:1px 6px;white-space:nowrap;">' + escapeHTML(statusTexto) + '</span>' +
            '</div>' +
            '<div class="mini-title" style="font-weight:700;font-size:12px;color:' + stRel.tituloColor + ';display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:4px;">' + escapeHTML(rel.titulo || '') + '</div>' +
            '<div style="font-size:10.5px;color:var(--muted);display:flex;justify-content:space-between;align-items:center;">' +
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
  function obterUrlSeguraParaPDF(mediaSrc) {
    if (!mediaSrc || typeof mediaSrc !== 'string') return '';
    if (mediaSrc.indexOf('data:application/pdf;base64,') !== 0) return mediaSrc;
    window._pdfBlobUrlCache = window._pdfBlobUrlCache || {};
    var key = mediaSrc.length + '_' + mediaSrc.slice(28, 64) + '_' + mediaSrc.slice(-24);
    if (window._pdfBlobUrlCache[key]) return window._pdfBlobUrlCache[key];
    try {
      var base64 = mediaSrc.split(',')[1];
      var binStr = atob(base64);
      var bytes = new Uint8Array(binStr.length);
      for (var i = 0; i < binStr.length; i++) {
        bytes[i] = binStr.charCodeAt(i);
      }
      var blob = new Blob([bytes], { type: 'application/pdf' });
      var blobUrl = URL.createObjectURL(blob);
      window._pdfBlobUrlCache[key] = blobUrl;
      return blobUrl;
    } catch (ePdf) {
      return mediaSrc;
    }
  }
  function extrairDadosRecebimentoDeItemHistorico(item) {
    if (!item) return null;
    var d = item.dadosRecebimento ? Object.assign({}, item.dadosRecebimento) : null;
    if (!d) {
      var rawSrc = (item.descResolucao && String(item.descResolucao).indexOf('<!--REC_JSON:') !== -1)
        ? String(item.descResolucao)
        : ((item.descCriacao && String(item.descCriacao).indexOf('<!--REC_JSON:') !== -1) ? String(item.descCriacao) : '');
      if (rawSrc) {
        try {
          var mR = rawSrc.match(/<!--REC_JSON:([^>]+)-->/);
          if (mR && mR[1]) d = JSON.parse(decodeURIComponent(mR[1]));
        } catch (eR) {}
      }
    }
    if (!d) {
      var tit = String(item.titulo || '');
      var desc = String(item.descCriacao || '').replace(/<!--(?:CTRS|RONDA|REC)_JSON:[^>]+-->/g, '').trim();
      var nfMatch = tit.match(/N\.?F\s+([^\s—]+)/i) || desc.match(/N\.?F:\s*([^.\n]+)/i);
      var remParts = tit.split('—');
      var remDesc = desc.match(/Remetente:\s*([^.\n]+(?:\.[^.\n]+)*?)(?:\.\s*N\.?F:|$)/i);
      var itensParsed = [];
      var idxItens = desc.indexOf('Itens:');
      var obsRestante = '';
      if (idxItens !== -1) {
        var apos = desc.slice(idxItens + 6).trim();
        var mFim = apos.match(/\.\s+(?![0-9A-Za-zÀ-ÿ_-]*\])/);
        var blocoItens = mFim ? apos.slice(0, mFim.index) : apos.replace(/\.\s*$/, '');
        if (mFim) obsRestante = apos.slice(mFim.index + 1).trim();
        blocoItens.split(';').forEach(function(rawI) {
          var s = rawI.trim();
          if (!s) return;
          var qM = s.match(/^(\d+)\s*x\s+(.+)$/i);
          var quant = qM ? qM[1] : '1';
          var resto = qM ? qM[2].trim() : s;
          var plaq = '—', serie = '—';
          var mP = resto.match(/\[Plaq:\s*([^\]]+)\]/i);
          if (mP) { plaq = mP[1].trim(); resto = resto.replace(mP[0], '').trim(); }
          var mS = resto.match(/\[S[eé]rie:\s*([^\]]+)\]/i);
          if (mS) { serie = mS[1].trim(); resto = resto.replace(mS[0], '').trim(); }
          if (resto) {
            itensParsed.push({ quant: quant, desc: resto, plaq: plaq, serie: serie, local: item.local || 'Juiz de Fora', exibirNosRelatorios: false });
          }
        });
      }
      d = {
        remetente: remParts.length > 1 ? remParts.slice(1).join('—').trim() : (remDesc ? remDesc[1].trim() : '—'),
        nf: nfMatch ? nfMatch[1].trim() : 'S/N',
        valor: 'Não informado',
        operacao: 'Não informado',
        dataRecebimento: (item.dataCriacao || '').split(' ')[0] || '—',
        volumes: '—',
        recebedor: item.criadoPor || item.resolvidoPor || 'Operador',
        dataFaturamento: '—',
        formaPagamento: 'Não informado',
        ordemCompra: '—',
        obs: obsRestante,
        praca: item.praca || item.local || 'Juiz de Fora',
        dataCriacao: item.dataCriacao || '',
        materiais: itensParsed,
        anexos: []
      };
    }
    var listaAnexos = [];
    var vistosAnx = {};
    [d.anexos, item.anexos, item.resolucao && item.resolucao.anexos].forEach(function(arr) {
      if (!Array.isArray(arr)) return;
      arr.forEach(function(a) {
        if (!a) return;
        var src = a.url || a.dataUrl || (typeof a === 'string' ? a : '');
        if (!src) return;
        var k = (a.name || '') + '|' + src.slice(0, 80) + '|' + src.length;
        if (!vistosAnx[k]) {
          vistosAnx[k] = true;
          listaAnexos.push(a);
        }
      });
    });
    d.anexos = listaAnexos;
    return d;
  }
  function gerarHTMLPreviewRecebimentoDados(item) {
    var d = extrairDadosRecebimentoDeItemHistorico(item);
    if (!d) return '';
    function valOuTraco(v) {
      var s = (v !== undefined && v !== null) ? String(v).trim() : '';
      return s ? escapeHTML(s) : '—';
    }
    var linhasMat = Array.isArray(d.materiais) ? d.materiais : [];
    var rowsHTML = linhasMat.length > 0
      ? linhasMat.map(function(m, idx) {
          var badgeDest = (m.exibirNosRelatorios === true)
            ? '<span style="display:inline-block;padding:2px 7px;border-radius:10px;background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;font-size:10px;font-weight:700;">Equipamentos + Relatórios</span>'
            : '<span style="display:inline-block;padding:2px 7px;border-radius:10px;background:#F1F5F9;color:#475569;border:1px solid #CBD5E1;font-size:10px;font-weight:700;">Equipamentos (Catálogo)</span>';
          return (
            '<tr style="border-bottom:1px solid #E2E8F0;background:' + (idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC') + ';">' +
              '<td style="padding:7px 8px;text-align:center;color:#64748B;font-weight:700;font-size:11px;">' + (idx + 1) + '</td>' +
              '<td style="padding:7px 8px;text-align:center;font-weight:800;color:#0F172A;font-size:12px;">' + valOuTraco(m.quant) + '</td>' +
              '<td style="padding:7px 8px;font-weight:700;color:#0F172A;font-size:12px;">' + valOuTraco(m.desc) + '</td>' +
              '<td style="padding:7px 8px;font-family:monospace;color:#334155;font-size:11.5px;">' + valOuTraco(m.plaq) + '</td>' +
              '<td style="padding:7px 8px;font-family:monospace;color:#334155;font-size:11.5px;">' + valOuTraco(m.serie) + '</td>' +
              '<td style="padding:7px 8px;color:#334155;font-size:11.5px;">' + valOuTraco(m.local || d.praca) + '</td>' +
              '<td style="padding:7px 8px;text-align:center;">' + badgeDest + '</td>' +
            '</tr>'
          );
        }).join('')
      : '<tr><td colspan="7" style="padding:14px;text-align:center;color:#64748B;font-size:11.5px;">Nenhum item discriminado na tabela de materiais.</td></tr>';
    var fotosHTML = '';
    var pdfsHTML = '';
    var outrosHTML = '';
    var qtdFotos = 0, qtdPdfs = 0, qtdOutros = 0;
    (d.anexos || []).forEach(function(anx) {
      var fName = (anx.name || anx.nome || anx.fileName || 'Anexo').toLowerCase();
      var fType = (anx.type || '').toLowerCase();
      var mediaSrcRaw = anx.url || anx.dataUrl || (typeof anx === 'string' ? anx : '');
      var mediaSrc = typeof sanitizeMediaUrl === 'function' ? sanitizeMediaUrl(mediaSrcRaw) : escapeHTML(mediaSrcRaw);
      if (!mediaSrc) return;
      var safeName = escapeHTML(anx.name || anx.nome || 'Arquivo Anexo');
      var isImg = fType.startsWith('image/') || mediaSrc.indexOf('data:image/') === 0 || /\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(fName);
      var isPdf = fType === 'application/pdf' || mediaSrc.indexOf('data:application/pdf') === 0 || /\.pdf(\?.*)?$/i.test(fName);
      var isVid = fType.startsWith('video/') || mediaSrc.indexOf('data:video/') === 0 || /\.(mp4|webm|mov|mkv|avi|ogg)(\?.*)?$/i.test(fName);
      if (isImg) {
        qtdFotos++;
        fotosHTML +=
          '<div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.05);display:flex;flex-direction:column;">' +
            '<div style="background:#F8FAFC;height:185px;display:flex;align-items:center;justify-content:center;padding:6px;cursor:pointer;" onclick="abrirQuickLook(this.querySelector(\'img\').src, this.querySelector(\'img\').alt)" title="Clique para ampliar em tela cheia">' +
              '<img src="' + mediaSrc + '" alt="' + safeName + '" loading="lazy" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:6px;" />' +
            '</div>' +
            '<div style="padding:8px 10px;border-top:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:11px;">' +
              '<span style="font-weight:700;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + safeName + '">' + safeName + '</span>' +
              '<div style="display:flex;gap:6px;flex-shrink:0;">' +
                '<a href="' + mediaSrc + '" download="' + safeName + '" style="color:#0071E3;font-weight:700;text-decoration:none;">Baixar</a>' +
              '</div>' +
            '</div>' +
          '</div>';
      } else if (isPdf) {
        qtdPdfs++;
        var pdfUrl = obterUrlSeguraParaPDF(mediaSrc);
        pdfsHTML +=
          '<div style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(15,23,42,0.05);">' +
            '<div style="padding:9px 12px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
              '<span style="font-size:12px;font-weight:700;color:#0F172A;display:inline-flex;align-items:center;gap:6px;">' +
                '<span style="display:inline-block;padding:2px 6px;border-radius:4px;background:#FEE2E2;color:#DC2626;font-size:10px;font-weight:800;">PDF</span>' +
                safeName +
              '</span>' +
              '<div style="display:flex;gap:6px;">' +
                '<a href="' + escapeHTML(pdfUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-xs" style="background:#EFF6FF;color:#0071E3;border:1px solid #93C5FD;font-weight:700;text-decoration:none;padding:4px 9px;border-radius:6px;font-size:11px;">Abrir em Nova Guia</a>' +
                '<a href="' + escapeHTML(pdfUrl) + '" download="' + safeName + '" class="btn btn-xs" style="background:#FFFFFF;color:#334155;border:1px solid #CBD5E1;font-weight:700;text-decoration:none;padding:4px 9px;border-radius:6px;font-size:11px;">Baixar PDF</a>' +
              '</div>' +
            '</div>' +
            '<iframe src="' + escapeHTML(pdfUrl) + '" title="' + safeName + '" style="width:100%;height:420px;border:none;display:block;background:#F1F5F9;"></iframe>' +
          '</div>';
      } else if (isVid) {
        qtdOutros++;
        outrosHTML +=
          '<div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;padding:10px;">' +
            '<video src="' + mediaSrc + '" controls preload="metadata" style="width:100%;max-height:280px;border-radius:6px;background:#000;"></video>' +
            '<div style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;font-size:11.5px;">' +
              '<strong>' + safeName + '</strong>' +
              '<a href="' + mediaSrc + '" download="' + safeName + '" style="color:#0071E3;font-weight:700;text-decoration:none;">Baixar Vídeo</a>' +
            '</div>' +
          '</div>';
      } else {
        qtdOutros++;
        outrosHTML +=
          '<div style="display:flex;align-items:center;justify-content:space-between;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:8px 12px;font-size:12px;">' +
            '<strong>' + safeName + '</strong>' +
            '<a href="' + mediaSrc + '" download="' + safeName + '" style="color:#0071E3;font-weight:700;text-decoration:none;">Baixar Arquivo</a>' +
          '</div>';
      }
    });
    var anexosBlocoHTML = '';
    if (qtdFotos === 0 && qtdPdfs === 0 && qtdOutros === 0) {
      anexosBlocoHTML =
        '<div style="padding:14px;background:#F8FAFC;border:1px dashed #CBD5E1;border-radius:8px;text-align:center;font-size:11.5px;color:#64748B;">' +
          'Nenhuma foto ou documento PDF anexado a este recebimento.' +
        '</div>';
    } else {
      if (qtdFotos > 0) {
        anexosBlocoHTML +=
          '<div style="margin-bottom:12px;">' +
            '<div style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px;">Registros Fotográficos do Bem (' + qtdFotos + ')</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(210px, 1fr));gap:10px;">' + fotosHTML + '</div>' +
          '</div>';
      }
      if (qtdPdfs > 0) {
        anexosBlocoHTML +=
          '<div style="margin-bottom:12px;display:flex;flex-direction:column;gap:10px;">' +
            '<div style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.04em;">Documentos PDF / Notas Fiscais (' + qtdPdfs + ')</div>' +
            pdfsHTML +
          '</div>';
      }
      if (qtdOutros > 0) {
        anexosBlocoHTML += '<div style="display:flex;flex-direction:column;gap:8px;">' + outrosHTML + '</div>';
      }
    }
    return (
      '<div style="font-family:Segoe UI,Arial,sans-serif;color:#0F172A;">' +
        '<div style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%);color:#FFFFFF;border-radius:8px;padding:14px 18px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">' +
          '<div>' +
            '<div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#FDE68A;">TV Integração · Controle Patrimonial & Engenharia</div>' +
            '<div style="font-size:15.5px;font-weight:800;margin-top:2px;">GUIA DE RECEBIMENTO DE EQUIPAMENTOS E MATERIAIS</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="display:inline-block;background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.28);border-radius:8px;padding:5px 12px;font-size:12px;font-weight:800;">N.F / INVOICE: ' + valOuTraco(d.nf) + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-bottom:12px;">' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:9px 12px;"><div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Empresa Remetente</div><div style="font-size:12.5px;font-weight:700;color:#0F172A;margin-top:2px;">' + valOuTraco(d.remetente) + '</div></div>' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:9px 12px;"><div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Valor Total (R$)</div><div style="font-size:12.5px;font-weight:700;color:#059669;margin-top:2px;">' + valOuTraco(d.valor) + '</div></div>' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:9px 12px;"><div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Nat. da Operação</div><div style="font-size:12.5px;font-weight:600;color:#0F172A;margin-top:2px;">' + valOuTraco(d.operacao) + '</div></div>' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:9px 12px;"><div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Data Recebimento</div><div style="font-size:12.5px;font-weight:600;color:#0F172A;margin-top:2px;">' + valOuTraco(d.dataRecebimento) + '</div></div>' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:9px 12px;"><div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Quant. Volumes</div><div style="font-size:12.5px;font-weight:600;color:#0F172A;margin-top:2px;">' + valOuTraco(d.volumes) + '</div></div>' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:9px 12px;"><div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Recebido por</div><div style="font-size:12.5px;font-weight:700;color:#0071E3;margin-top:2px;">' + valOuTraco(d.recebedor) + '</div></div>' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:9px 12px;"><div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Data Faturamento</div><div style="font-size:12.5px;font-weight:600;color:#0F172A;margin-top:2px;">' + valOuTraco(d.dataFaturamento) + '</div></div>' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:9px 12px;"><div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Forma de Pagamento</div><div style="font-size:12.5px;font-weight:600;color:#0F172A;margin-top:2px;">' + valOuTraco(d.formaPagamento) + '</div></div>' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:9px 12px;"><div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Nº Ordem de Compra</div><div style="font-size:12.5px;font-weight:600;color:#0F172A;margin-top:2px;">' + valOuTraco(d.ordemCompra) + '</div></div>' +
        '</div>' +
        '<div style="margin-bottom:14px;border:1px solid #CBD5E1;border-radius:8px;overflow:hidden;">' +
          '<div style="background:#F1F5F9;padding:8px 12px;font-size:11px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #CBD5E1;">Materiais e Equipamentos Recebidos (' + linhasMat.length + ')</div>' +
          '<div style="overflow-x:auto;">' +
            '<table style="width:100%;border-collapse:collapse;min-width:600px;">' +
              '<thead><tr style="background:#F8FAFC;border-bottom:1px solid #CBD5E1;font-size:10.5px;color:#475569;text-transform:uppercase;text-align:left;">' +
                '<th style="padding:7px 8px;text-align:center;width:36px;">#</th>' +
                '<th style="padding:7px 8px;text-align:center;width:55px;">Qtd</th>' +
                '<th style="padding:7px 8px;">Descrição</th>' +
                '<th style="padding:7px 8px;">Plaqueta</th>' +
                '<th style="padding:7px 8px;">Nº Série</th>' +
                '<th style="padding:7px 8px;">Localidade</th>' +
                '<th style="padding:7px 8px;text-align:center;">Destino no Sistema</th>' +
              '</tr></thead>' +
              '<tbody>' + rowsHTML + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
        (d.obs && String(d.obs).trim()
          ? '<div style="margin-bottom:14px;padding:10px 12px;background:#FFFBEB;border:1px solid #FDE68A;border-left:3.5px solid #D97706;border-radius:8px;font-size:12px;color:#78350F;"><strong>Observações do Recebimento:</strong><div style="margin-top:4px;white-space:pre-wrap;">' + escapeHTML(d.obs) + '</div></div>'
          : '') +
        anexosBlocoHTML +
      '</div>'
    );
  }
  window.gerarHTMLPreviewRecebimentoDados = gerarHTMLPreviewRecebimentoDados;
  function gerarHTMLPreviewOcorrenciaDados(item, ocFound, dadosExtras) {
    var d = dadosExtras || {};
    var prioRaw = d.prio || (ocFound && ocFound.prio) || (item && item.prio) || '';
    if (!prioRaw && item && Array.isArray(item.tags)) {
      if (item.tags.indexOf('Alta') !== -1) prioRaw = 'Alta';
      else if (item.tags.indexOf('Média') !== -1) prioRaw = 'Média';
      else if (item.tags.indexOf('Baixa') !== -1) prioRaw = 'Baixa';
    }
    var prioBadgeHTML = '';
    if (prioRaw) {
      var pLow = String(prioRaw).toLowerCase();
      var pBg = pLow === 'alta' ? 'rgba(239,68,68,0.24)' : (pLow === 'baixa' ? 'rgba(16,185,129,0.24)' : 'rgba(245,158,11,0.24)');
      var pBdr = pLow === 'alta' ? 'rgba(252,165,165,0.65)' : (pLow === 'baixa' ? 'rgba(110,231,183,0.65)' : 'rgba(253,230,138,0.65)');
      var pTxt = pLow === 'alta' ? '#FEE2E2' : (pLow === 'baixa' ? '#D1FAE5' : '#FEF3C7');
      prioBadgeHTML = '<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:' + pBg + ';border:1px solid ' + pBdr + ';color:' + pTxt + ';font-size:11px;font-weight:800;">Prioridade: ' + escapeHTML(prioRaw) + '</span>';
    }
    var statusFinal = d.statusFinal || 'Concluído';
    var stLow = String(statusFinal).toLowerCase();
    var resAccent = '#059669';
    var resHeaderBg = '#ECFDF5';
    var resHeaderBdr = '#A7F3D0';
    var resTitleTxt = '#065F46';
    var stBannerBg = 'rgba(16,185,129,0.24)';
    var stBannerBdr = 'rgba(110,231,183,0.65)';
    var stBannerTxt = '#ECFDF5';
    if (stLow.indexOf('abert') !== -1 || stLow.indexOf('reinc') !== -1 || stLow.indexOf('expir') !== -1 || stLow.indexOf('penden') !== -1) {
      resAccent = '#DC2626';
      resHeaderBg = '#FEF2F2';
      resHeaderBdr = '#FECACA';
      resTitleTxt = '#991B1B';
      stBannerBg = 'rgba(239,68,68,0.28)';
      stBannerBdr = 'rgba(252,165,165,0.65)';
      stBannerTxt = '#FEF2F2';
    } else if (stLow.indexOf('observ') !== -1 || stLow.indexOf('arquiv') !== -1) {
      resAccent = '#4F46E5';
      resHeaderBg = '#EEF2FF';
      resHeaderBdr = '#C7D2FE';
      resTitleTxt = '#3730A3';
      stBannerBg = 'rgba(99,102,241,0.32)';
      stBannerBdr = 'rgba(199,210,254,0.65)';
      stBannerTxt = '#EEF2FF';
    } else if (stLow.indexOf('parcial') !== -1) {
      resAccent = '#D97706';
      resHeaderBg = '#FFFBEB';
      resHeaderBdr = '#FDE68A';
      resTitleTxt = '#92400E';
      stBannerBg = 'rgba(245,158,11,0.26)';
      stBannerBdr = 'rgba(253,230,138,0.65)';
      stBannerTxt = '#FFFBEB';
    }
    var tituloOc = (item && item.titulo) || (ocFound && ocFound.titulo) || 'Registro de Ocorrência';
    var descCriHTML = (typeof formatarTextoComLinks === 'function') ? formatarTextoComLinks(d.descCri || '', false) : escapeHTML(d.descCri || '');
    var descResHTML = (typeof formatarTextoComLinks === 'function') ? formatarTextoComLinks(d.descRes || '', false) : escapeHTML(d.descRes || '');
    var linkHTML = (d.linkRel && typeof renderBotaoLinkExterno === 'function')
      ? '<div style="margin-top:10px;padding-top:8px;border-top:1px dashed #CBD5E1;display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><strong style="font-size:11.5px;color:#0F172A;">Link Relacionado:</strong> ' + renderBotaoLinkExterno(d.linkRel, null, false) + '</div>'
      : '';
    return (
      '<div style="font-family:Segoe UI,Arial,sans-serif;color:#0F172A;">' +
        '<div style="background:linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%);color:#FFFFFF;padding:14px 18px;border-radius:8px;margin-bottom:14px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;">' +
          '<div style="flex:1;min-width:220px;">' +
            '<div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#93C5FD;">TV INTEGRAÇÃO — ENGENHARIA E OPERAÇÕES</div>' +
            '<div style="font-size:15px;font-weight:800;margin-top:2px;letter-spacing:.01em;">FICHA TÉCNICA DE OCORRÊNCIA E MANUTENÇÃO</div>' +
            '<div style="font-size:12.5px;font-weight:600;color:#E2E8F0;margin-top:4px;">' + escapeHTML(tituloOc) + '</div>' +
          '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:flex-end;">' +
            '<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:' + stBannerBg + ';border:1px solid ' + stBannerBdr + ';color:' + stBannerTxt + ';font-size:11px;font-weight:800;">' + escapeHTML(statusFinal) + '</span>' +
            prioBadgeHTML +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(170px, 1fr));gap:10px;margin-bottom:14px;">' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:9px 12px;">' +
            '<div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Equipamento / Recurso</div>' +
            '<div style="font-size:12.5px;font-weight:700;color:#0F172A;margin-top:2px;word-break:break-word;">' + escapeHTML(d.equip || 'N/A') + '</div>' +
          '</div>' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:9px 12px;">' +
            '<div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Localidade / Praça</div>' +
            '<div style="font-size:12.5px;font-weight:700;color:#0F172A;margin-top:2px;">' + escapeHTML(d.localidade || 'Central Técnica') + '</div>' +
          '</div>' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:9px 12px;">' +
            '<div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Categoria Técnica</div>' +
            '<div style="font-size:12.5px;font-weight:700;color:#0071E3;margin-top:2px;">' + escapeHTML(d.categoria || 'Geral') + '</div>' +
          '</div>' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:9px 12px;">' +
            '<div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Atribuído para</div>' +
            '<div style="font-size:12.5px;font-weight:700;color:#0F172A;margin-top:2px;">' + escapeHTML(d.atribuidoPara || 'Equipe do Turno (Todos)') + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="border:1px solid #CBD5E1;border-left:4px solid #DC2626;border-radius:8px;overflow:hidden;background:#FFFFFF;margin-bottom:14px;">' +
          '<div style="background:#FEF2F2;border-bottom:1px solid #FECACA;padding:9px 14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
            '<span style="font-size:11px;font-weight:800;color:#991B1B;text-transform:uppercase;letter-spacing:.04em;display:inline-flex;align-items:center;gap:6px;">' +
              '<i data-lucide="alert-circle" style="width:13px;height:13px;color:#DC2626;stroke-width:2.3;"></i>' +
              'Registro de Abertura — Problema Relatado' +
            '</span>' +
            '<span style="font-size:11px;color:#7F1D1D;font-weight:600;">Aberto por <strong>' + escapeHTML(d.autorCri || 'Operador') + '</strong> · ' + escapeHTML(d.dataCri || '') + '</span>' +
          '</div>' +
          '<div style="padding:12px 14px;">' +
            '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:10px 12px;font-size:12.5px;line-height:1.6;color:#0F172A;overflow-wrap:anywhere;word-break:break-word;">' +
              '<div style="font-size:10px;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;">Descrição do Problema Relatado</div>' +
              descCriHTML +
              linkHTML +
            '</div>' +
            (d.blocoPreviewOcorrenciaHTML || '') +
          '</div>' +
        '</div>' +
        '<div style="border:1px solid #CBD5E1;border-left:4px solid ' + resAccent + ';border-radius:8px;overflow:hidden;background:#FFFFFF;margin-bottom:14px;">' +
          '<div style="background:' + resHeaderBg + ';border-bottom:1px solid ' + resHeaderBdr + ';padding:9px 14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
            '<span style="font-size:11px;font-weight:800;color:' + resTitleTxt + ';text-transform:uppercase;letter-spacing:.04em;display:inline-flex;align-items:center;gap:6px;">' +
              '<i data-lucide="check-circle-2" style="width:13px;height:13px;color:' + resAccent + ';stroke-width:2.3;"></i>' +
              'Diagnóstico Técnico e Solução Aplicada (Fechamento)' +
            '</span>' +
            '<span style="font-size:11px;color:' + resTitleTxt + ';font-weight:700;">' + escapeHTML(statusFinal) + '</span>' +
          '</div>' +
          '<div style="padding:12px 14px;">' +
            '<div style="display:flex;flex-wrap:wrap;gap:14px;font-size:11.5px;color:#475569;margin-bottom:10px;">' +
              '<span><strong>Responsável Técnico:</strong> <span style="color:#0F172A;font-weight:600;">' + escapeHTML(d.respRes || 'Pendente') + '</span></span>' +
              '<span><strong>Data/Hora de Fechamento:</strong> <span style="color:#0F172A;font-weight:600;">' + escapeHTML(d.dataRes || 'Em andamento') + '</span></span>' +
            '</div>' +
            '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:10px 12px;font-size:12.5px;line-height:1.6;color:#0F172A;overflow-wrap:anywhere;word-break:break-word;">' +
              '<div style="font-size:10px;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;">Diagnóstico / O que foi realizado</div>' +
              descResHTML +
            '</div>' +
            (d.obsDetHTML || '') +
          '</div>' +
        '</div>' +
        (d.mediaHTML || '') +
        (d.edicoesHTML || '') +
      '</div>'
    );
  }
  window.gerarHTMLPreviewOcorrenciaDados = gerarHTMLPreviewOcorrenciaDados;
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
            criadoPor:     (typeof obterCriadorOcorrencia === 'function') ? obterCriadorOcorrencia(oc) : (oc.criadoPor || getUsuarioAtual()),
            resp:          (typeof formatarAtribuicaoResp === 'function') ? formatarAtribuicaoResp(oc.resp) : (oc.resp || 'Equipe do Turno (Todos)'),
            descCriacao:   oc.desc || 'Ocorrência registrada no sistema.',
            status:        (oc.resolucao && oc.resolucao.statusRes) ? oc.resolucao.statusRes : (oc.status === 'arquivada' ? 'Em Observação' : 'Resolvido'),
            dataResolucao: resFmt,
            resolvidoPor:  resPor,
            descResolucao: resDesc,
            link:          oc.link || (oc.resolucao && oc.resolucao.link) || '',
      tags:          oc.tags || [],
            anexos:        anexosLista
          };
        }
      }
    }
    if (!item) return;
    itemDetalhesAtual = item;
    var targetOcId = item.ocId || (item.id || '').replace(/^h_oc_/, '');
    var ocFound = ocorrencias.find(function(o){
      if (!o || !o.id) return false;
      return o.id === item.id || o.id === targetOcId || ('h_oc_' + o.id) === item.id;
    });
    var descCri = item.descCriacao || item.desc || (ocFound && ocFound.desc) || 'Sem descrição registrada.';
    var autorCri = (typeof obterCriadorOcorrencia === 'function')
      ? obterCriadorOcorrencia(ocFound || item)
      : (item.criadoPor || (ocFound && ocFound.criadoPor) || getUsuarioAtual());
    var atribuidoPara = (typeof formatarAtribuicaoResp === 'function')
      ? formatarAtribuicaoResp((ocFound && ocFound.resp) || item.resp)
      : ((ocFound && ocFound.resp) || item.resp || 'Equipe do Turno (Todos)');
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
      var stDet = obterEstiloSemanticoHistoricoItem(item);
      var tagMeu = isItemDoUsuario(item) ? '<span class="tag tag-ind">Seu Registro / Resolução</span>' : '';
      modalTags.innerHTML = getTagTipoBadge(item) + ' <span class="tag ' + stDet.tagCls + '">' + escapeHTML(statusFinal) + '</span> ' + tagMeu;
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
      var ocFotosHTML = '';
      var ocPdfsHTML = '';
      var ocOutrosHTML = '';
      var qtdOcFotos = 0, qtdOcPdfs = 0, qtdOcOutros = 0;
      anexos.forEach(function(anx) {
        if (!anx) return;
        var fName = (anx.name || anx.nome || anx.fileName || '').toLowerCase();
        var fType = (anx.type || '').toLowerCase();
        var mediaSrcRaw = anx.url || anx.dataUrl || (typeof anx === 'string' ? anx : '');
        if (!mediaSrcRaw && anx.caminho) mediaSrcRaw = anx.caminho;
        var mediaSrc = typeof sanitizeMediaUrl === 'function' ? sanitizeMediaUrl(mediaSrcRaw) : escapeHTML(mediaSrcRaw);
        if (!mediaSrc) return;
        var safeAnxName = escapeHTML(anx.name || anx.nome || anx.fileName || 'Arquivo Anexo');
        var isImg = fType.startsWith('image/') ||
                    mediaSrc.startsWith('data:image/') ||
                    fName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ||
                    mediaSrc.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i);
        var isPdf = fType === 'application/pdf' ||
                    mediaSrc.indexOf('data:application/pdf') === 0 ||
                    fName.match(/\.pdf(\?.*)?$/i) ||
                    mediaSrc.match(/\.pdf(\?.*)?$/i);
        var isVid = fType.startsWith('video/') ||
                    mediaSrc.startsWith('data:video/') ||
                    fName.match(/\.(mp4|webm|mov|mkv|avi|ogg)$/i) ||
                    mediaSrc.match(/\.(mp4|webm|mov|mkv|avi|ogg)(\?.*)?$/i);
        if (isImg && mediaSrc) {
          qtdOcFotos++;
          ocFotosHTML +=
            '<div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.05);display:flex;flex-direction:column;">' +
              '<div style="background:#F8FAFC;height:185px;display:flex;align-items:center;justify-content:center;padding:6px;cursor:pointer;" onclick="abrirQuickLook(this.querySelector(\'img\').src, this.querySelector(\'img\').alt)" title="Clique para ampliar em tela cheia">' +
                '<img src="' + mediaSrc + '" alt="' + safeAnxName + '" loading="lazy" style="max-width:100%;max-height:100%;border-radius:6px;object-fit:contain;" />' +
              '</div>' +
              '<div style="padding:7px 10px;border-top:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:11px;">' +
                '<span style="font-weight:700;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + safeAnxName + '">' + safeAnxName + '</span>' +
                '<a href="' + mediaSrc + '" download="' + safeAnxName + '" style="color:#0071E3;font-weight:700;text-decoration:none;flex-shrink:0;">Baixar</a>' +
              '</div>' +
            '</div>';
        } else if (isPdf && mediaSrc) {
          qtdOcPdfs++;
          var pdfSafeUrl = (typeof obterUrlSeguraParaPDF === 'function') ? obterUrlSeguraParaPDF(mediaSrc) : mediaSrc;
          ocPdfsHTML +=
            '<div style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(15,23,42,0.05);">' +
              '<div style="padding:9px 12px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
                '<span style="font-size:12px;font-weight:700;color:#0F172A;display:inline-flex;align-items:center;gap:6px;">' +
                  '<span style="display:inline-block;padding:2px 6px;border-radius:4px;background:#FEE2E2;color:#DC2626;font-size:10px;font-weight:800;">PDF</span>' +
                  safeAnxName +
                '</span>' +
                '<div style="display:flex;gap:6px;">' +
                  '<a href="' + escapeHTML(pdfSafeUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-xs" style="background:#EFF6FF;color:#0071E3;border:1px solid #93C5FD;font-weight:700;text-decoration:none;padding:4px 9px;border-radius:6px;font-size:11px;">Abrir em Nova Guia</a>' +
                  '<a href="' + escapeHTML(pdfSafeUrl) + '" download="' + safeAnxName + '" class="btn btn-xs" style="background:#FFFFFF;color:#334155;border:1px solid #CBD5E1;font-weight:700;text-decoration:none;padding:4px 9px;border-radius:6px;font-size:11px;">Baixar PDF</a>' +
                '</div>' +
              '</div>' +
              '<iframe src="' + escapeHTML(pdfSafeUrl) + '#toolbar=1&navpanes=0" title="' + safeAnxName + '" style="width:100%;height:380px;border:none;display:block;background:#F8FAFC;"></iframe>' +
            '</div>';
        } else if (isVid && mediaSrc) {
          qtdOcOutros++;
          ocOutrosHTML +=
            '<div style="background:#FFFFFF;padding:10px;border-radius:10px;border:1px solid #E2E8F0;">' +
              '<video src="' + mediaSrc + '" controls style="width:100%;max-height:320px;border-radius:6px;background:#000;" preload="metadata"></video>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;padding:0 2px;font-size:11.5px;">' +
                '<strong style="color:#0F172A;">' + safeAnxName + '</strong>' +
                '<a href="' + mediaSrc + '" target="_blank" rel="noopener noreferrer" download="' + safeAnxName + '" style="color:#0071E3;font-weight:700;text-decoration:none;">Baixar Vídeo</a>' +
              '</div>' +
            '</div>';
        } else if (mediaSrc) {
          qtdOcOutros++;
          ocOutrosHTML +=
            '<div style="display:flex;align-items:center;justify-content:space-between;background:#F8FAFC;padding:8px 12px;border-radius:8px;border:1px solid #E2E8F0;font-size:12px;">' +
              '<strong style="color:#0F172A;">📄 ' + safeAnxName + '</strong>' +
              '<a href="' + mediaSrc + '" target="_blank" rel="noopener noreferrer" download="' + safeAnxName + '" class="btn btn-ghost btn-sm" style="color:#0071E3;font-weight:700;">Abrir / Baixar</a>' +
            '</div>';
        }
      });
      if (qtdOcFotos > 0 || qtdOcPdfs > 0 || qtdOcOutros > 0) {
        mediaHTML =
          '<div style="margin-bottom:14px;border:1px solid #CBD5E1;border-radius:8px;overflow:hidden;background:#FFFFFF;">' +
            '<div style="background:#F1F5F9;padding:8px 12px;font-size:11px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #CBD5E1;display:flex;align-items:center;gap:6px;">' +
              '<i data-lucide="paperclip" style="width:13px;height:13px;color:#0071E3;"></i>' +
              'Evidências, Fotos e Documentos Anexados (' + (qtdOcFotos + qtdOcPdfs + qtdOcOutros) + ')' +
            '</div>' +
            '<div style="padding:12px;display:flex;flex-direction:column;gap:12px;">' +
              (qtdOcFotos > 0 ? '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(210px, 1fr));gap:10px;">' + ocFotosHTML + '</div>' : '') +
              (qtdOcPdfs > 0 ? '<div style="display:flex;flex-direction:column;gap:10px;">' + ocPdfsHTML + '</div>' : '') +
              (qtdOcOutros > 0 ? '<div style="display:flex;flex-direction:column;gap:8px;">' + ocOutrosHTML + '</div>' : '') +
            '</div>' +
          '</div>';
      }
    }
    var historicoEdicoes = item.historicoEdicoes ||
      (item.resolucao && item.resolucao.historicoEdicoes) ||
      (ocFound && ocFound.historicoEdicoes) ||
      (ocFound && ocFound.resolucao && ocFound.resolucao.historicoEdicoes) || [];
    var edicoesHTML = '';
    if (historicoEdicoes && historicoEdicoes.length > 0) {
      edicoesHTML =
        '<div style="margin-bottom:14px;border:1px solid #CBD5E1;border-radius:8px;overflow:hidden;background:#FFFFFF;">' +
          '<div style="background:#F1F5F9;padding:8px 12px;font-size:11px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #CBD5E1;display:flex;align-items:center;gap:6px;">' +
            '<i data-lucide="history" style="width:13px;height:13px;color:#0071E3;"></i>' +
            'Histórico de Edições e Alterações (' + historicoEdicoes.length + ')' +
          '</div>' +
          '<div style="padding:12px;display:flex;flex-direction:column;gap:10px;">' +
            historicoEdicoes.map(function(ed) {
              var listaMudancasHTML = (ed.mudancas || []).map(function(m) {
                var campoM = '', antesM = '', depoisM = '';
                if (m && typeof m === 'object' && m.campo) {
                  campoM = m.campo;
                  antesM = m.antes !== undefined ? String(m.antes) : '—';
                  depoisM = m.depois !== undefined ? String(m.depois) : '—';
                } else if (typeof m === 'string') {
                  var matchDePara = m.match(/^(.+?)\s+alterad[oa]\s+de\s+"?([^"]*)"?\s+para\s+"?([^"]*)"?$/i);
                  if (matchDePara) {
                    campoM = matchDePara[1].trim();
                    antesM = matchDePara[2].trim() || 'Não informado';
                    depoisM = matchDePara[3].trim() || 'Não informado';
                  } else {
                    return '<div style="padding:6px 10px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;color:#334155;">• ' + escapeHTML(m) + '</div>';
                  }
                }
                return (
                  '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:8px 10px;">' +
                    '<div style="font-size:11px;font-weight:700;color:#0F172A;margin-bottom:6px;display:flex;align-items:center;gap:5px;">' +
                      '<span style="width:6px;height:6px;border-radius:50%;background:#0071E3;display:inline-block;"></span>' +
                      escapeHTML(campoM) +
                    '</div>' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
                      '<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;padding:6px 8px;">' +
                        '<div style="font-size:9.5px;font-weight:800;color:#991B1B;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;">Antes</div>' +
                        '<div style="font-size:11.5px;color:#7F1D1D;word-break:break-word;white-space:pre-wrap;">' + escapeHTML(antesM) + '</div>' +
                      '</div>' +
                      '<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:6px;padding:6px 8px;">' +
                        '<div style="font-size:9.5px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;">Depois</div>' +
                        '<div style="font-size:11.5px;color:#14532D;font-weight:600;word-break:break-word;white-space:pre-wrap;">' + escapeHTML(depoisM) + '</div>' +
                      '</div>' +
                    '</div>' +
                  '</div>'
                );
              }).join('');
              return (
                '<div style="background:#FFFFFF;padding:10px 12px;border-radius:8px;border:1px solid #E2E8F0;font-size:11.5px;line-height:1.5;">' +
                  '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #F1F5F9;">' +
                    '<strong style="color:#0F172A;display:flex;align-items:center;gap:5px;"><i data-lucide="user-check" style="width:13px;height:13px;color:#0071E3;"></i> Editado por: ' + escapeHTML(ed.autor || 'Operador') + '</strong>' +
                    '<span style="color:#64748B;font-size:11px;font-weight:600;">📅 ' + escapeHTML(ed.dataHora || '') + '</span>' +
                  '</div>' +
                  '<div style="display:flex;flex-direction:column;gap:6px;">' +
                    listaMudancasHTML +
                  '</div>' +
                '</div>'
              );
            }).join('') +
          '</div>' +
        '</div>';
    }
    var rawDescCriOriginal = String(descCri || '');
    var rawDescResOriginal = String(descRes || '');
    descCri = rawDescCriOriginal.replace(/<!--(?:CTRS|RONDA|REC)_JSON:[^>]+-->/g, '').trim();
    descRes = rawDescResOriginal.replace(/<!--(?:CTRS|RONDA|REC)_JSON:[^>]+-->/g, '').trim();
    var isRelatorioCTRSModal = (item.tipo === 'relatorio') && (
      item.subtipo === 'CTRS Transmissão' ||
      item.subtipo === 'Relatório Transmissão' ||
      item.categoria === 'Transmissão CTRS' ||
      (item.id && String(item.id).indexOf('h_ctrs_') === 0)
    );
    var isRecebimentoModal = (item.tipo === 'recebimento') || (item.id && String(item.id).indexOf('h_rec_') === 0);
    var fonteCTRS = null;
    if (item.htmlRelatorio || item.dadosCTRS || rawDescCriOriginal.indexOf('<!--CTRS_JSON:') !== -1 || rawDescResOriginal.indexOf('<!--CTRS_JSON:') !== -1) {
      fonteCTRS = item;
    } else if (ocFound && (ocFound.htmlRelatorio || ocFound.dadosCTRS || (ocFound.desc && String(ocFound.desc).indexOf('<!--CTRS_JSON:') !== -1))) {
      fonteCTRS = ocFound;
    } else if (typeof historicoSeedData !== 'undefined' && Array.isArray(historicoSeedData)) {
      var idBuscaOc = (ocFound && ocFound.id) ? ocFound.id : String(item.id || '').replace(/^h_oc_/, '');
      var relVinc = historicoSeedData.find(function(h) {
        if (!h || h.tipo !== 'relatorio') return false;
        var dH = h.dadosCTRS;
        if (!dH && h.descResolucao && h.descResolucao.indexOf('<!--CTRS_JSON:') !== -1) {
          try {
            var mH = h.descResolucao.match(/<!--CTRS_JSON:([^>]+)-->/);
            if (mH && mH[1]) dH = JSON.parse(decodeURIComponent(mH[1]));
          } catch (e) {}
        }
        if (dH && Array.isArray(dH.idsOcorrenciasGeradas) && dH.idsOcorrenciasGeradas.indexOf(idBuscaOc) !== -1) return true;
        return false;
      });
      if (relVinc) fonteCTRS = relVinc;
    }
    var btnEditarFooter = document.getElementById('btn-hist-det-editar');
    var btnExcluirFooter = document.getElementById('btn-hist-det-excluir');
    if (btnEditarFooter) {
      btnEditarFooter.style.display = (isRelatorioCTRSModal || isRecebimentoModal) ? 'none' : 'inline-flex';
    }
    if (btnExcluirFooter) {
      btnExcluirFooter.innerHTML = isRelatorioCTRSModal
        ? '<i data-lucide="trash-2" style="width:13px;height:13px;stroke-width:2;"></i> Excluir Relatório'
        : (isRecebimentoModal
            ? '<i data-lucide="trash-2" style="width:13px;height:13px;stroke-width:2;"></i> Excluir Recebimento'
            : '<i data-lucide="trash-2" style="width:13px;height:13px;stroke-width:2;"></i> Excluir Ocorrência');
    }
    if (modalBody) {
      if (isRelatorioCTRSModal && typeof gerarHTMLPreviewCTRSDados === 'function') {
        var htmlPreviewCTRS = gerarHTMLPreviewCTRSDados(fonteCTRS || item);
        modalBody.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:10px 14px;margin-bottom:12px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;font-size:12px;color:#1E3A8A;">' +
            '<div>' +
              '<strong>Emitido por:</strong> ' + escapeHTML(autorCri) + ' &nbsp;·&nbsp; ' +
              '<strong>Enviado em:</strong> ' + escapeHTML(dataCri) + ' &nbsp;·&nbsp; ' +
              '<strong>Praça:</strong> ' + escapeHTML(localidade) +
            '</div>' +
            '<div style="display:flex;gap:6px;">' +
              '<button type="button" class="btn btn-sm" onclick="copiarPreviewRelatorioHistorico()" style="background:#FFFFFF;color:#0071E3;border:1px solid #93C5FD;font-weight:700;padding:4px 10px;font-size:11.5px;display:inline-flex;align-items:center;gap:5px;">' +
                '<i data-lucide="copy" style="width:12px;height:12px;"></i> Copiar Relatório' +
              '</button>' +
              '<button type="button" class="btn btn-sm" onclick="imprimirPreviewRelatorioHistorico()" style="background:#0071E3;color:#FFFFFF;border:1px solid #0071E3;font-weight:700;padding:4px 10px;font-size:11.5px;display:inline-flex;align-items:center;gap:5px;">' +
                '<i data-lucide="printer" style="width:12px;height:12px;"></i> Imprimir / PDF' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div id="hist-ctrs-preview-container" style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:10px;padding:16px;box-shadow:0 2px 8px rgba(15,23,42,0.04);overflow-x:auto;">' +
            htmlPreviewCTRS +
          '</div>';
      } else if (isRecebimentoModal) {
        var htmlPreviewRec = gerarHTMLPreviewRecebimentoDados(item);
        modalBody.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:10px 14px;margin-bottom:12px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;font-size:12px;color:#92400E;">' +
            '<div>' +
              '<strong>Recebido por:</strong> ' + escapeHTML(autorCri) + ' &nbsp;·&nbsp; ' +
              '<strong>Registrado em:</strong> ' + escapeHTML(dataCri) + ' &nbsp;·&nbsp; ' +
              '<strong>Praça:</strong> ' + escapeHTML(localidade) +
            '</div>' +
            '<div style="display:flex;gap:6px;">' +
              '<button type="button" class="btn btn-sm" onclick="copiarPreviewRelatorioHistorico()" style="background:#FFFFFF;color:#B45309;border:1px solid #FCD34D;font-weight:700;padding:4px 10px;font-size:11.5px;display:inline-flex;align-items:center;gap:5px;">' +
                '<i data-lucide="copy" style="width:12px;height:12px;"></i> Copiar Guia' +
              '</button>' +
              '<button type="button" class="btn btn-sm" onclick="imprimirPreviewRelatorioHistorico()" style="background:#D97706;color:#FFFFFF;border:1px solid #D97706;font-weight:700;padding:4px 10px;font-size:11.5px;display:inline-flex;align-items:center;gap:5px;">' +
                '<i data-lucide="printer" style="width:12px;height:12px;"></i> Imprimir / PDF' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div id="hist-ctrs-preview-container" style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:10px;padding:16px;box-shadow:0 2px 8px rgba(15,23,42,0.04);overflow-x:auto;">' +
            htmlPreviewRec +
          '</div>';
      } else {
        var blocoPreviewOcorrenciaHTML = '';
        if (fonteCTRS && typeof gerarHTMLPreviewCTRSDados === 'function') {
          var htmlPreviewOc = gerarHTMLPreviewCTRSDados(fonteCTRS);
          if (htmlPreviewOc) {
            blocoPreviewOcorrenciaHTML =
              '<div style="margin-top:12px;border-top:1px dashed #CBD5E1;padding-top:12px;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">' +
                  '<span style="font-size:11.5px;font-weight:700;color:#1E3A8A;display:inline-flex;align-items:center;gap:6px;">' +
                    '<i data-lucide="file-text" style="width:14px;height:14px;color:#0071E3;"></i>' +
                    'Preview do Relatório de Transmissão CTRS (Origem da Ocorrência)' +
                  '</span>' +
                '</div>' +
                '<div class="hist-ctrs-embedded-preview" style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:10px;padding:14px;box-shadow:0 1px 4px rgba(15,23,42,0.04);overflow-x:auto;">' +
                  htmlPreviewOc +
                '</div>' +
              '</div>';
          }
        }
        var valsObsDet = Array.isArray(item.validacoesTurno)
          ? item.validacoesTurno
          : ((ocFound && ocFound.resolucao && Array.isArray(ocFound.resolucao.validacoesTurno)) ? ocFound.resolucao.validacoesTurno : []);
        var concObsPorDet = item.concluidoObservacaoPor || (ocFound && ocFound.resolucao && ocFound.resolucao.concluidoObservacaoPor) || '';
        var concObsEmDet = item.concluidoObservacaoEm || (ocFound && ocFound.resolucao && ocFound.resolucao.concluidoObservacaoEm) || '';
        var obsDetHTML = '';
        if (valsObsDet.length > 0 || concObsPorDet) {
          obsDetHTML = '<div style="margin-top:10px;display:flex;flex-direction:column;gap:5px;">' +
            valsObsDet.map(function(v) {
              var turnoDetTxt = v.turno ? (' [' + escapeHTML(v.turno) + ']') : '';
              return '<div style="font-size:11.5px;color:#047857;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:6px;padding:6px 10px;display:flex;align-items:center;gap:6px;"><i data-lucide="shield-check" style="width:13px;height:13px;flex-shrink:0;"></i><span>Avaliado no turno' + turnoDetTxt + ' por <strong>' + escapeHTML(v.operador || 'Operador') + '</strong> (' + escapeHTML(v.dataHora || '') + ')</span></div>';
            }).join('') +
            (concObsPorDet ? '<div style="font-size:11.5px;color:#065F46;background:#D1FAE5;border:1px solid #6EE7B7;border-radius:6px;padding:6px 10px;display:flex;align-items:center;gap:6px;"><i data-lucide="check-circle-2" style="width:13px;height:13px;flex-shrink:0;"></i><span>Observação concluída definitivamente por <strong>' + escapeHTML(concObsPorDet) + '</strong> (' + escapeHTML(concObsEmDet) + ')</span></div>' : '') +
          '</div>';
        }
        var linkRelOc = item.link || (ocFound && (ocFound.link || (ocFound.resolucao && ocFound.resolucao.link))) || '';
        var htmlPreviewOcorrencia = gerarHTMLPreviewOcorrenciaDados(item, ocFound, {
          autorCri: autorCri,
          dataCri: dataCri,
          atribuidoPara: atribuidoPara,
          equip: equip,
          localidade: localidade,
          categoria: categoria,
          descCri: descCri,
          respRes: respRes,
          dataRes: dataRes,
          descRes: descRes,
          statusFinal: statusFinal,
          prio: (ocFound && ocFound.prio) || item.prio || '',
          linkRel: linkRelOc,
          blocoPreviewOcorrenciaHTML: blocoPreviewOcorrenciaHTML,
          obsDetHTML: obsDetHTML,
          mediaHTML: mediaHTML,
          edicoesHTML: edicoesHTML
        });
        modalBody.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:10px 14px;margin-bottom:12px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;font-size:12px;color:#1E3A8A;">' +
            '<div>' +
              '<strong>Registrado por:</strong> ' + escapeHTML(autorCri) + ' &nbsp;·&nbsp; ' +
              '<strong>Data:</strong> ' + escapeHTML(dataCri) + ' &nbsp;·&nbsp; ' +
              '<strong>Praça:</strong> ' + escapeHTML(localidade) +
            '</div>' +
            '<div style="display:flex;gap:6px;">' +
              '<button type="button" class="btn btn-sm" onclick="copiarPreviewRelatorioHistorico()" style="background:#FFFFFF;color:#0071E3;border:1px solid #93C5FD;font-weight:700;padding:4px 10px;font-size:11.5px;display:inline-flex;align-items:center;gap:5px;">' +
                '<i data-lucide="copy" style="width:12px;height:12px;"></i> Copiar Ficha' +
              '</button>' +
              '<button type="button" class="btn btn-sm" onclick="imprimirPreviewRelatorioHistorico()" style="background:#0071E3;color:#FFFFFF;border:1px solid #0071E3;font-weight:700;padding:4px 10px;font-size:11.5px;display:inline-flex;align-items:center;gap:5px;">' +
                '<i data-lucide="printer" style="width:12px;height:12px;"></i> Imprimir / PDF' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div id="hist-ctrs-preview-container" style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:10px;padding:16px;box-shadow:0 2px 8px rgba(15,23,42,0.04);overflow-x:auto;">' +
            htmlPreviewOcorrencia +
          '</div>';
      }
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
          criadoPor:     (typeof obterCriadorOcorrencia === 'function') ? obterCriadorOcorrencia(oc) : (oc.criadoPor || getUsuarioAtual()),
          resp:          (typeof formatarAtribuicaoResp === 'function') ? formatarAtribuicaoResp(oc.resp) : (oc.resp || 'Equipe do Turno (Todos)'),
          descCriacao:   oc.desc || 'Ocorrência registrada no sistema.',
          status:        (oc.resolucao && oc.resolucao.statusRes) ? oc.resolucao.statusRes : (oc.status === 'arquivada' ? 'Em Observação' : 'Resolvido'),
          dataResolucao: resFmt,
          resolvidoPor:  resPor,
          descResolucao: resDesc,
          link:          oc.link || (oc.resolucao && oc.resolucao.link) || '',
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
      equipamento:   oc.equipamento || (oc.local ? (oc.local + ' — ' + (oc.cat || 'Equipamento')) : (oc.cat || oc.titulo)),
      categoria:     oc.cat || 'Equipamento',
      local:         oc.local || 'Central Técnica',
      dataCriacao:   formatDataHoraLocal(oc.dataCriacao || oc.criado),
      criadoPor:     (typeof obterCriadorOcorrencia === 'function') ? obterCriadorOcorrencia(oc) : (oc.criadoPor || getUsuarioAtual()),
      resp:          (typeof formatarAtribuicaoResp === 'function') ? formatarAtribuicaoResp(oc.resp) : (oc.resp || 'Equipe do Turno (Todos)'),
      descCriacao:   oc.desc || 'Ocorrência registrada no sistema.',
      status:        oc.status === 'resolvida' ? ((oc.resolucao && oc.resolucao.statusRes) ? oc.resolucao.statusRes : 'Resolvido') : (isOcorrenciaVencida(oc) ? 'Prazo Expirado' : 'Aberta'),
      dataResolucao: oc.resolucao ? formatDataHoraLocal(oc.resolucao.data) : 'Pendente de resolução',
      resolvidoPor:  oc.resolucao ? (oc.resolvidoPor || getUsuarioAtual()) : 'Aguardando resolução',
      descResolucao: oc.resolucao ? (oc.resolucao.descRes || 'Ocorrência ativa no turno aguardando tratativa da equipe.') : 'Ocorrência ativa no turno aguardando tratativa da equipe.',
      link:          oc.link || (oc.resolucao && oc.resolucao.link) || '',
      tags:          oc.tags || [],
      historicoEdicoes: oc.historicoEdicoes || (oc.resolucao && oc.resolucao.historicoEdicoes) || [],
      htmlRelatorio: oc.htmlRelatorio || null,
      dadosCTRS:     oc.dadosCTRS || null,
      anexos:        anexosList
    };
    verDetalhesHistoricoDirect(item);
  }
  window.verDetalhesOcorrencia = verDetalhesOcorrencia;
  function copiarPreviewRelatorioHistorico() {
    var container = document.getElementById('hist-ctrs-preview-container');
    if (!container) return;
    var html = container.innerHTML;
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        var blobHtml = new Blob([html], { type: 'text/html' });
        var blobText = new Blob([container.innerText || ''], { type: 'text/plain' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })]).then(function() {
          if (typeof mostrarToast === 'function') {
            mostrarToast('Relatório Copiado', 'O relatório formatado foi copiado para a área de transferência.', 'success');
          }
        });
        return;
      } catch (e) {}
    }
    if (typeof mostrarToast === 'function') {
      mostrarToast('Relatório Copiado', 'O relatório foi copiado para a área de transferência.', 'success');
    }
  }
  window.copiarPreviewRelatorioHistorico = copiarPreviewRelatorioHistorico;
  function imprimirPreviewRelatorioHistorico() {
    var container = document.getElementById('hist-ctrs-preview-container');
    if (!container) return;
    var htmlPrint = container.innerHTML || '';
    var isRecPrint = htmlPrint.indexOf('GUIA DE RECEBIMENTO') !== -1;
    var isOcPrint = htmlPrint.indexOf('FICHA TÉCNICA DE OCORRÊNCIA') !== -1;
    var docTitle = isRecPrint
      ? 'Guia de Recebimento — TV Integração'
      : (isOcPrint ? 'Ficha Técnica de Ocorrência — TV Integração' : 'Relatório CTRS — TV Integração');
    var w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"/><title>' + docTitle + '</title><style>@page{size:A4 portrait;margin:12mm;}body{font-family:Segoe UI,Arial,sans-serif;margin:0;padding:12px;background:#fff;}</style></head><body>' + container.innerHTML + '<script>setTimeout(function(){window.print();},350);<\/script></body></html>');
    w.document.close();
  }
  window.imprimirPreviewRelatorioHistorico = imprimirPreviewRelatorioHistorico;
