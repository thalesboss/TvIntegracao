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
      var isRelatorioCTRS = (item.tipo === 'relatorio') && (
        item.subtipo === 'CTRS Transmissão' ||
        item.subtipo === 'Relatório Transmissão' ||
        item.categoria === 'Transmissão CTRS' ||
        (item.id && String(item.id).indexOf('h_ctrs_') === 0)
      );
      var resolucaoBox = '';
      var textoResRaw = item.descResolucao || (item.resolucao && item.resolucao.descRes) || '';
      var textoRes = String(textoResRaw).replace(/<!--CTRS_JSON:[^>]+-->/g, '').trim();
      if (isRelatorioCTRS) {
        resolucaoBox =
          '<div style="margin-top:8px;padding:7px 11px;background:#EFF6FF;border:1px solid #BFDBFE;border-left:3px solid #0071E3;border-radius:6px;font-size:11.5px;color:#1E3A8A;display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
            '<span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;">' +
              '<i data-lucide="file-text" style="width:13px;height:13px;color:#0071E3;"></i>' +
              'Formulário CTRS — Clique para abrir a visualização completa do relatório' +
            '</span>' +
            '<span style="font-size:11px;font-weight:700;color:#0071E3;white-space:nowrap;">👁️ Ver Preview →</span>' +
          '</div>';
      } else if (textoRes) {
        resolucaoBox =
          '<div style="margin-top:6px;padding:6px 10px;background:rgba(16,185,129,0.06);border-left:2.5px solid var(--green);border-radius:4px;font-size:11.5px;color:var(--txt2);line-height:1.4;">' +
            '<strong style="color:var(--green-dk);display:flex;align-items:center;gap:4px;font-size:11px;margin-bottom:2px;">' +
              '<i data-lucide="check-circle-2" style="width:11px;height:11px;"></i> Resolução / Fechamento:' +
            '</strong>' +
            '<span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + escapeHTML(textoRes) + '</span>' +
          '</div>';
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
            '<span><i data-lucide="user" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Criado por: ' + escapeHTML(item.criadoPor || 'Sistema') + '</span>' +
            '<span><i data-lucide="check-circle-2" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Resolvido por: ' + escapeHTML(item.resolvidoPor || 'Pendente') + '</span>' +
            '<span><i data-lucide="calendar" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> ' + escapeHTML(item.dataResolucao || item.dataCriacao || '') + '</span>'
          );
      return (
        '<article class="' + cardClasses + '" onclick="verDetalhesHistorico(\'' + item.id + '\')" onmouseenter="selecionarItemHistorico(\'' + item.id + '\')" style="cursor:pointer;margin-bottom:10px;' + (isSel ? 'border-color:var(--blue);box-shadow:0 0 0 2px rgba(0,113,227,.15);' : '') + '">' +
          '<div class="prio-line ' + plClass + '"></div>' +
          '<div class="oc-body">' +
            '<div class="oc-header"><h3>' + escapeHTML(item.titulo || 'Sem título') + '</h3>' + tagTipo + tagMeu + '</div>' +
            '<p class="oc-desc" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + escapeHTML(String(item.descCriacao || item.desc || 'Sem descrição').replace(/<!--CTRS_JSON:[^>]+-->/g, '').trim()) + '</p>' +
            resolucaoBox +
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
    var historicoEdicoes = item.historicoEdicoes ||
      (item.resolucao && item.resolucao.historicoEdicoes) ||
      (ocFound && ocFound.historicoEdicoes) ||
      (ocFound && ocFound.resolucao && ocFound.resolucao.historicoEdicoes) || [];
    var edicoesHTML = '';
    if (historicoEdicoes && historicoEdicoes.length > 0) {
      edicoesHTML =
        '<div class="form-card" style="margin-bottom:12px;background:var(--bg);border:1px solid var(--border-lt);">' +
          '<h4 style="font-size:12.5px;font-weight:700;color:var(--txt);margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
            '<i data-lucide="history" style="width:14px;height:14px;color:var(--blue);stroke-width:2;"></i>' +
            'Histórico de Edições e Alterações (' + historicoEdicoes.length + ')' +
          '</h4>' +
          '<div style="display:flex;flex-direction:column;gap:10px;">' +
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
                    return '<div style="padding:6px 10px;background:#F8FAFC;border:1px solid var(--border-lt);border-radius:6px;color:var(--txt2);">• ' + escapeHTML(m) + '</div>';
                  }
                }
                return (
                  '<div style="background:#F8FAFC;border:1px solid var(--border-lt);border-radius:8px;padding:8px 10px;">' +
                    '<div style="font-size:11px;font-weight:700;color:var(--txt);margin-bottom:6px;display:flex;align-items:center;gap:5px;">' +
                      '<span style="width:6px;height:6px;border-radius:50%;background:var(--blue);display:inline-block;"></span>' +
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
                '<div style="background:var(--surface);padding:10px 12px;border-radius:var(--r-md);border:1px solid var(--border-lt);font-size:11.5px;line-height:1.5;">' +
                  '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border-lt);">' +
                    '<strong style="color:var(--txt);display:flex;align-items:center;gap:5px;"><i data-lucide="user-check" style="width:13px;height:13px;color:var(--blue);"></i> Editado por: ' + escapeHTML(ed.autor || 'Operador') + '</strong>' +
                    '<span style="color:var(--muted);font-size:11px;font-weight:600;">📅 ' + escapeHTML(ed.dataHora || '') + '</span>' +
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
    descCri = rawDescCriOriginal.replace(/<!--CTRS_JSON:[^>]+-->/g, '').trim();
    descRes = rawDescResOriginal.replace(/<!--CTRS_JSON:[^>]+-->/g, '').trim();
    var isRelatorioCTRSModal = (item.tipo === 'relatorio') && (
      item.subtipo === 'CTRS Transmissão' ||
      item.subtipo === 'Relatório Transmissão' ||
      item.categoria === 'Transmissão CTRS' ||
      (item.id && String(item.id).indexOf('h_ctrs_') === 0)
    );
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
      btnEditarFooter.style.display = isRelatorioCTRSModal ? 'none' : 'inline-flex';
    }
    if (btnExcluirFooter) {
      btnExcluirFooter.innerHTML = isRelatorioCTRSModal
        ? '<i data-lucide="trash-2" style="width:13px;height:13px;stroke-width:2;"></i> Excluir Relatório'
        : '<i data-lucide="trash-2" style="width:13px;height:13px;stroke-width:2;"></i> Excluir Ocorrência';
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
                  '<div style="display:flex;gap:6px;">' +
                    '<button type="button" class="btn btn-sm" onclick="copiarPreviewRelatorioHistorico()" style="background:#FFFFFF;color:#0071E3;border:1px solid #93C5FD;font-weight:700;padding:3px 9px;font-size:11px;display:inline-flex;align-items:center;gap:4px;">' +
                      '<i data-lucide="copy" style="width:11px;height:11px;"></i> Copiar Relatório' +
                    '</button>' +
                    '<button type="button" class="btn btn-sm" onclick="imprimirPreviewRelatorioHistorico()" style="background:#0071E3;color:#FFFFFF;border:1px solid #0071E3;font-weight:700;padding:3px 9px;font-size:11px;display:inline-flex;align-items:center;gap:4px;">' +
                      '<i data-lucide="printer" style="width:11px;height:11px;"></i> Imprimir / PDF' +
                    '</button>' +
                  '</div>' +
                '</div>' +
                '<div id="hist-ctrs-preview-container" style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:10px;padding:16px;box-shadow:0 2px 8px rgba(15,23,42,0.04);overflow-x:auto;">' +
                  htmlPreviewOc +
                '</div>' +
              '</div>';
          }
        }
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
              '<div style="margin-top:8px;padding:10px 12px;background:var(--surface);border-radius:var(--r-md);border:1px solid var(--border-lt);">' +
                '<strong>Descrição da Ocorrência:</strong><br/>' + escapeHTML(descCri) +
                blocoPreviewOcorrenciaHTML +
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
      equipamento:   oc.equipamento || (oc.local ? (oc.local + ' — ' + (oc.cat || 'Equipamento')) : (oc.cat || oc.titulo)),
      categoria:     oc.cat || 'Equipamento',
      local:         oc.local || 'Central Técnica',
      dataCriacao:   formatDataHoraLocal(oc.dataCriacao || oc.criado),
      criadoPor:     oc.resp || 'Sistema',
      descCriacao:   oc.desc || 'Ocorrência registrada no sistema.',
      status:        oc.status === 'resolvida' ? ((oc.resolucao && oc.resolucao.statusRes) ? oc.resolucao.statusRes : 'Resolvido') : (isOcorrenciaVencida(oc) ? 'Prazo Expirado' : 'Aberta'),
      dataResolucao: oc.resolucao ? formatDataHoraLocal(oc.resolucao.data) : 'Pendente de resolução',
      resolvidoPor:  oc.resolucao ? (oc.resolvidoPor || getUsuarioAtual()) : 'Aguardando resolução',
      descResolucao: oc.resolucao ? (oc.resolucao.descRes || 'Ocorrência ativa no turno aguardando tratativa da equipe.') : 'Ocorrência ativa no turno aguardando tratativa da equipe.',
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
    var w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Relatório CTRS — TV Integração</title><style>@page{size:A4 portrait;margin:12mm;}body{font-family:Segoe UI,Arial,sans-serif;margin:0;padding:12px;background:#fff;}</style></head><body>' + container.innerHTML + '<script>setTimeout(function(){window.print();},350);<\/script></body></html>');
    w.document.close();
  }
  window.imprimirPreviewRelatorioHistorico = imprimirPreviewRelatorioHistorico;
