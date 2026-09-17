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
