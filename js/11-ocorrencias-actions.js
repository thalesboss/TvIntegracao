  var novaTitulo  = document.getElementById('nova-titulo');
  var novaDesc    = document.getElementById('nova-desc');
  var novaCounter = document.getElementById('nova-counter');
  var btnCriar    = document.getElementById('btn-criar');
  var novaFile    = document.getElementById('nova-arquivos');
  var novaPrevs   = document.getElementById('nova-previews');
  function validarNova() {
    var tituloVal = novaTitulo ? novaTitulo.value.trim() : '';
    var descVal   = novaDesc ? novaDesc.value.trim() : '';
    var ok = (tituloVal.length > 0 && descVal.length >= 10);
    if (btnCriar) {
      btnCriar.style.opacity = ok ? '1' : '0.38';
      btnCriar.style.cursor  = ok ? 'pointer' : 'not-allowed';
      btnCriar._valido = ok;
    }
  }
  window.validarNova = validarNova;
  if (btnCriar) { btnCriar.style.opacity = '0.38'; btnCriar.style.cursor = 'not-allowed'; btnCriar._valido = false; }
  if (novaTitulo) novaTitulo.addEventListener('input', validarNova);
  if (novaDesc && novaCounter) {
    novaDesc.addEventListener('input', function() {
      var len = this.value.trim().length;
      if (len >= 10) {
        novaCounter.textContent = '✓ ' + len + ' caracteres — pronto para criar';
        novaCounter.className = 'char-count ok';
      } else if (len > 0) {
        novaCounter.textContent = 'Mínimo 10 caracteres (' + len + '/10)';
        novaCounter.className = 'char-count warn';
      } else {
        novaCounter.textContent = 'Mínimo 10 caracteres';
        novaCounter.className = 'char-count';
      }
      validarNova();
    });
  }
  function atualizarSelectEquipamentosNovaOc() {
    var praca = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isUberlandia = praca.indexOf('Uber') !== -1;
    var equips = [];
    if (typeof obterListaNomesEquipamentosOrdenados === 'function') {
      equips = obterListaNomesEquipamentosOrdenados(praca);
    } else if (typeof dashboardMetrics !== 'undefined' && dashboardMetrics && dashboardMetrics.equipamento) {
      equips = Object.keys(dashboardMetrics.equipamento);
    }
    var selNova = document.getElementById('nova-equipamento');
    var selEdit = document.getElementById('edit-oc-equipamento');
    [selNova, selEdit].forEach(function(sel) {
      if (!sel) return;
      var curVal = sel.value;
      var html = '<option value="">Sem equipamento específico</option>';
      if (isUberlandia) {
        equips.forEach(function(eq) {
          html += '<option value="' + escapeHTML(eq) + '">' + escapeHTML(eq) + '</option>';
        });
      } else {
        if (equips.length === 0) {
          equips = ['LIVE U1', 'LIVE U2', 'LIVE U3', 'LIVE U4', 'LIVE U SMART', 'REDAÇÃO', 'KMJ', 'NET PRAÇA', 'NET PORTARIA', 'FORMATOS NET', 'NET 2º ANDAR', 'NET 3º ANDAR', 'NET 4º ANDAR'];
        }
        equips.forEach(function(eq) {
          html += '<option value="' + escapeHTML(eq) + '">' + escapeHTML(eq) + '</option>';
        });
      }
      html += '<option value="__novo__" style="color:var(--blue);font-weight:700;">➕ Cadastrar Novo Equipamento...</option>';
      sel.innerHTML = html;
      if (curVal && curVal !== '__novo__') sel.value = curVal;
      if (!sel._hasNovoEqListener) {
        sel._hasNovoEqListener = true;
        sel.addEventListener('change', function() {
          if (this.value === '__novo__') {
            this.value = '';
            window._eqTriggeringSelect = this;
            if (typeof abrirModalCadastroEquipamento === 'function') abrirModalCadastroEquipamento();
          }
        });
      }
    });
  }
  window.atualizarSelectEquipamentosNovaOc = atualizarSelectEquipamentosNovaOc;
  function criarNovaOcorrencia() {
    var tituloVal = novaTitulo ? novaTitulo.value.trim() : '';
    var descVal = novaDesc ? novaDesc.value.trim() : '';
    if (!tituloVal) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Título Necessário', 'Por favor, informe o título da ocorrência.', 'warning');
      }
      if (novaTitulo) novaTitulo.focus();
      return;
    }
    if (descVal.length < 10) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Descrição Curta', 'A descrição deve ter pelo menos 10 caracteres (' + descVal.length + '/10).', 'warning');
      }
      if (novaDesc) novaDesc.focus();
      return;
    }
    var respVal = document.getElementById('nova-resp') ? document.getElementById('nova-resp').value : '';
    var userAtual = getUsuarioAtual();
    if (respVal === 'Operador' && userAtual) respVal = userAtual;
    var isMine = (respVal === userAtual || respVal === 'Operador' || respVal.indexOf(userAtual) !== -1 || respVal.indexOf('Você') !== -1 || respVal.indexOf('Atribuir a mim') !== -1);
    var telVal = document.getElementById('nova-telejornal') ? document.getElementById('nova-telejornal').value : '';
    var eqVal  = document.getElementById('nova-equipamento') ? document.getElementById('nova-equipamento').value : '';
    var tagsArr = ['Nova'];
    if (telVal) tagsArr.push(telVal);
    if (eqVal)  tagsArr.push(eqVal);
    var anexosFinais = (uploadedFilesStore['nova-previews'] || []).slice();
    var linkValRaw = document.getElementById('nova-link') ? document.getElementById('nova-link').value.trim() : '';
    var linkVal = (linkValRaw && typeof normalizarUrlExterna === 'function') ? normalizarUrlExterna(linkValRaw) : linkValRaw;
    var resInicial = { statusRes: 'Aberta', criadoPor: userAtual };
    if (anexosFinais.length > 0) resInicial.anexos = anexosFinais;
    if (linkVal) resInicial.link = linkVal;
    var novo = {
      id:          'oc_' + Date.now(),
      titulo:      tituloVal,
      prio:        document.getElementById('nova-prio') ? document.getElementById('nova-prio').value : 'Média',
      cat:         document.getElementById('nova-cat') ? document.getElementById('nova-cat').value : 'Equipamento',
      resp:        respVal || 'Equipe do Turno (Todos)',
      criadoPor:   userAtual,
      local:       document.getElementById('nova-local') ? document.getElementById('nova-local').value.trim() : '',
      prazo:       document.getElementById('nova-prazo') ? document.getElementById('nova-prazo').value : '',
      link:        linkVal || '',
      telejornal:  telVal || null,
      equipamento: eqVal || null,
      desc:        descVal,
      mine:        isMine,
      tags:        tagsArr,
      status:      'aberta',
      criado:      Date.now(),
      dataCriacao: formatDataHoraLocal(),
      resolucao:   resInicial,
      anexos:      anexosFinais,
      praca:       (typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora'),
      _pendingSync: true
    };
    var atualizouDash = false;
    if (typeof dashboardMetrics !== 'undefined' && dashboardMetrics) {
      if (telVal && dashboardMetrics.telejornal && dashboardMetrics.telejornal[telVal]) {
        dashboardMetrics.telejornal[telVal].nc = (dashboardMetrics.telejornal[telVal].nc || 0) + 1;
        atualizouDash = true;
      }
      if (eqVal && dashboardMetrics.equipamento && dashboardMetrics.equipamento[eqVal]) {
        dashboardMetrics.equipamento[eqVal].nc = (dashboardMetrics.equipamento[eqVal].nc || 0) + 1;
        atualizouDash = true;
      }
      if (atualizouDash) {
        if (typeof salvarDashboardMetricsStore === 'function') salvarDashboardMetricsStore();
        if (typeof renderDashboards === 'function') renderDashboards();
      }
    }
    ocorrencias = [novo].concat(ocorrencias);
    window.ocorrencias = ocorrencias;
    save(ocorrencias, novo, true);
    uploadedFilesStore['nova-previews'] = [];
    fecharPopup('popup-nova-oc');
    adicionarNotificacao('Nova Ocorrência Criada', novo.titulo + ' (' + novo.prio + ' Prioridade)', novo.prio === 'Alta' ? 'warning' : 'info');
    renderAll();
    if (novaTitulo) novaTitulo.value = '';
    if (novaDesc)   novaDesc.value   = '';
    if (novaFile)   novaFile.value   = '';
    if (novaPrevs)  novaPrevs.innerHTML = '';
    if (novaCounter) { novaCounter.textContent = 'Mínimo 10 caracteres'; novaCounter.className = 'char-count'; }
    if (document.getElementById('nova-prio')) document.getElementById('nova-prio').selectedIndex = 1;
    if (document.getElementById('nova-resp')) document.getElementById('nova-resp').selectedIndex = 0;
    if (document.getElementById('nova-cat'))  document.getElementById('nova-cat').selectedIndex  = 0;
    if (document.getElementById('nova-local')) document.getElementById('nova-local').value = '';
    if (document.getElementById('nova-prazo')) document.getElementById('nova-prazo').value = '';
    if (document.getElementById('nova-link')) document.getElementById('nova-link').value = '';
    if (document.getElementById('nova-telejornal')) document.getElementById('nova-telejornal').value = '';
    if (document.getElementById('nova-equipamento')) document.getElementById('nova-equipamento').value = '';
    validarNova();
  }
  window.criarNovaOcorrencia = criarNovaOcorrencia;
  if (btnCriar) {
    btnCriar.addEventListener('click', criarNovaOcorrencia);
  }
  var resolverAtualId = null;
  var resolverDesc    = document.getElementById('resolver-desc');
  var resolverCounter = document.getElementById('resolver-counter');
  var btnConfirmar    = document.getElementById('btn-confirmar-resolver');
  var resolverFile    = document.getElementById('resolver-arquivos');
  var resolverPrevs   = document.getElementById('resolver-previews');
  function validarResolver() {
    var ok = resolverDesc && resolverDesc.value.trim().length >= 10;
    if (btnConfirmar) {
      btnConfirmar.style.opacity = ok ? '1' : '0.38';
      btnConfirmar.style.cursor  = ok ? 'pointer' : 'not-allowed';
      btnConfirmar._valido = ok;
    }
  }
  if (btnConfirmar) { btnConfirmar.style.opacity = '0.38'; btnConfirmar.style.cursor = 'not-allowed'; btnConfirmar._valido = false; }
  if (resolverDesc && resolverCounter) {
    resolverDesc.addEventListener('input', function() {
      var len = this.value.trim().length;
      if (len >= 10) {
        resolverCounter.textContent = '✓ Descrição preenchida';
        resolverCounter.className = 'char-count ok';
      } else {
        resolverCounter.textContent = 'Mínimo 10 caracteres (' + len + '/10)';
        resolverCounter.className = len >= 5 ? 'char-count warn' : 'char-count';
      }
      validarResolver();
    });
  }
  function abrirResolver(id) {
    var oc = ocorrencias.find(function(o){ return o.id === id; });
    if (!oc) return;
    resolverAtualId = id;
    var tituloEl = document.getElementById('resolver-titulo-oc');
    if (tituloEl) tituloEl.textContent = oc.titulo;
    if (resolverDesc)    resolverDesc.value = '';
    if (resolverFile)    resolverFile.value = '';
    if (resolverPrevs)   resolverPrevs.innerHTML = '';
    uploadedFilesStore['resolver-previews'] = [];
    if (resolverCounter) { resolverCounter.textContent = 'Mínimo 10 caracteres'; resolverCounter.className = 'char-count'; }
    document.getElementById('resolver-status').value = 'Resolvido';
    if (typeof selecionarStatus === 'function') selecionarStatus('Resolvido');
    validarResolver();
    abrirPopup('popup-resolver');
  }
  window.abrirResolver = abrirResolver;
  function abrirEditarOcorrencia(id) {
    var oc = ocorrencias.find(function(o){ return o && o.id === id; });
    if (!oc) return;
    document.getElementById('edit-oc-id').value = oc.id;
    document.getElementById('edit-oc-titulo').value = oc.titulo || '';
    document.getElementById('edit-oc-prio').value = oc.prio || 'Média';
    document.getElementById('edit-oc-cat').value = oc.cat || 'Equipamento';
    var editOptUser = document.getElementById('edit-opt-user-name');
    var userLogadoEdit = getUsuarioAtual();
    if (editOptUser && userLogadoEdit) {
      editOptUser.value = userLogadoEdit;
      editOptUser.textContent = userLogadoEdit + ' (Atribuir a mim)';
    }
    var respNorm = typeof formatarAtribuicaoResp === 'function' ? formatarAtribuicaoResp(oc.resp) : (oc.resp || 'Equipe do Turno (Todos)');
    var selEditResp = document.getElementById('edit-oc-resp');
    if (selEditResp) {
      selEditResp.value = respNorm;
      if (!selEditResp.value) selEditResp.value = 'Equipe do Turno (Todos)';
    }
    document.getElementById('edit-oc-local').value = oc.local || '';
    document.getElementById('edit-oc-prazo').value = oc.prazo || '';
    if (document.getElementById('edit-oc-link')) {
      document.getElementById('edit-oc-link').value = oc.link || (oc.resolucao && oc.resolucao.link) || '';
    }
    document.getElementById('edit-oc-desc').value = String(oc.desc || '').replace(/<!--CTRS_JSON:[^>]+-->/g, '').trim();
    atualizarSelectEquipamentosNovaOc();
    if (document.getElementById('edit-oc-telejornal')) {
      document.getElementById('edit-oc-telejornal').value = oc.telejornal || '';
    }
    if (document.getElementById('edit-oc-equipamento')) {
      document.getElementById('edit-oc-equipamento').value = oc.equipamento || '';
    }
    var subEl = document.getElementById('edit-oc-subtitle');
    if (subEl) subEl.textContent = 'Editando ocorrência: ' + (oc.titulo || oc.id) + ' — aberto para toda a equipe.';
    var anexosExistentes = oc.anexos || (oc.resolucao && oc.resolucao.anexos) || [];
    uploadedFilesStore['edit-oc-previews'] = anexosExistentes.slice();
    renderPreviewsForContainer('edit-oc-previews');
    abrirPopup('popup-editar-oc');
  }
  window.abrirEditarOcorrencia = abrirEditarOcorrencia;
  function salvarEdicaoOcorrencia() {
    var id = document.getElementById('edit-oc-id').value;
    var titulo = document.getElementById('edit-oc-titulo').value.trim();
    var prio = document.getElementById('edit-oc-prio').value;
    var cat = document.getElementById('edit-oc-cat').value;
    var resp = document.getElementById('edit-oc-resp').value;
    var local = document.getElementById('edit-oc-local').value.trim();
    var prazo = document.getElementById('edit-oc-prazo').value;
    var linkRaw = document.getElementById('edit-oc-link') ? document.getElementById('edit-oc-link').value.trim() : '';
    var linkVal = (linkRaw && typeof normalizarUrlExterna === 'function') ? normalizarUrlExterna(linkRaw) : linkRaw;
    var telVal = document.getElementById('edit-oc-telejornal') ? document.getElementById('edit-oc-telejornal').value : '';
    var eqVal  = document.getElementById('edit-oc-equipamento') ? document.getElementById('edit-oc-equipamento').value : '';
    var desc = document.getElementById('edit-oc-desc').value.trim();
    if (!titulo) {
      alert('Por favor, informe o título da ocorrência.');
      return;
    }
    if (!desc) {
      alert('Por favor, informe a descrição detalhada da ocorrência.');
      return;
    }
    var idx = ocorrencias.findIndex(function(o){ return o && o.id === id; });
    if (idx === -1) {
      alert('Ocorrência não encontrada.');
      return;
    }
    var usuarioLogado = getUsuarioAtual();
    if (resp === 'Operador' && usuarioLogado) resp = usuarioLogado;
    var isMine = (resp === usuarioLogado || resp === 'Operador' || resp.indexOf(usuarioLogado) !== -1 || resp.indexOf('Você') !== -1 || resp.indexOf('Atribuir a mim') !== -1);
    var anexosAtualizados = (uploadedFilesStore['edit-oc-previews'] || []).slice();
    var anterior = ocorrencias[idx];
    var mudancas = [];
    function regMudanca(campo, valAntes, valDepois, textoPadraoVazio) {
      var vA = (valAntes !== undefined && valAntes !== null && String(valAntes).trim() !== '') ? String(valAntes).trim() : (textoPadraoVazio || 'Não informado');
      var vD = (valDepois !== undefined && valDepois !== null && String(valDepois).trim() !== '') ? String(valDepois).trim() : (textoPadraoVazio || 'Não informado');
      if (vA !== vD) {
        mudancas.push({
          campo: campo,
          antes: vA,
          depois: vD,
          resumo: campo + ': de "' + vA + '" para "' + vD + '"'
        });
      }
    }
    regMudanca('Título', anterior.titulo || '', titulo, 'Sem título');
    regMudanca('Prioridade', anterior.prio || 'Média', prio, 'Média');
    regMudanca('Categoria', anterior.cat || 'Equipamento', cat, 'Equipamento');
    regMudanca('Atribuído para', anterior.resp || 'Equipe do Turno (Todos)', resp, 'Equipe do Turno (Todos)');
    regMudanca('Local / Praça', anterior.local || '', local, 'Não informado');
    regMudanca('Telejornal', anterior.telejornal || '', telVal || '', 'Sem telejornal');
    regMudanca('Equipamento', anterior.equipamento || '', eqVal || '', 'Sem equipamento');
    regMudanca('Prazo Estimado', anterior.prazo || '', prazo || '', 'Sem prazo');
    regMudanca('Link / URL', anterior.link || (anterior.resolucao && anterior.resolucao.link) || '', linkVal || '', 'Sem link');
    var ctrsMarkerExistente = '';
    if (anterior.desc && String(anterior.desc).indexOf('<!--CTRS_JSON:') !== -1) {
      var mCtrs = String(anterior.desc).match(/(<!--CTRS_JSON:[^>]+-->)/);
      if (mCtrs && mCtrs[1]) ctrsMarkerExistente = mCtrs[1];
    }
    var descAntLimpa = String(anterior.desc || '').replace(/<!--CTRS_JSON:[^>]+-->/g, '').trim();
    regMudanca('Descrição Detalhada', descAntLimpa, desc, 'Sem descrição');
    if (ctrsMarkerExistente && desc.indexOf('<!--CTRS_JSON:') === -1) {
      desc = desc + ctrsMarkerExistente;
    }
    var qtdAnxAntes = (anterior.anexos || []).length;
    var qtdAnxDepois = anexosAtualizados.length;
    if (qtdAnxAntes !== qtdAnxDepois) {
      mudancas.push({
        campo: 'Anexos',
        antes: qtdAnxAntes + (qtdAnxAntes === 1 ? ' arquivo' : ' arquivos'),
        depois: qtdAnxDepois + (qtdAnxDepois === 1 ? ' arquivo' : ' arquivos'),
        resumo: 'Anexos: de "' + qtdAnxAntes + ' arquivo(s)" para "' + qtdAnxDepois + ' arquivo(s)"'
      });
    }
    var historicoEdicoes = (anterior.historicoEdicoes && Array.isArray(anterior.historicoEdicoes))
      ? anterior.historicoEdicoes.slice()
      : ((anterior.resolucao && Array.isArray(anterior.resolucao.historicoEdicoes)) ? anterior.resolucao.historicoEdicoes.slice() : []);
    if (mudancas.length > 0) {
      historicoEdicoes.unshift({
        autor: usuarioLogado,
        dataHora: formatDataHoraLocal(),
        mudancas: mudancas
      });
    }
    var resolucaoAtual = Object.assign({}, ocorrencias[idx].resolucao || {});
    if (anexosAtualizados.length > 0) {
      resolucaoAtual.anexos = anexosAtualizados;
    } else {
      delete resolucaoAtual.anexos;
    }
    if (historicoEdicoes.length > 0) {
      resolucaoAtual.historicoEdicoes = historicoEdicoes;
    }
    if (linkVal) {
      resolucaoAtual.link = linkVal;
    } else {
      delete resolucaoAtual.link;
    }
    var criadorPreservado = typeof obterCriadorOcorrencia === 'function' ? obterCriadorOcorrencia(anterior) : (anterior.criadoPor || usuarioLogado);
    resolucaoAtual.criadoPor = criadorPreservado;
    ocorrencias[idx] = Object.assign({}, ocorrencias[idx], {
      titulo:           titulo,
      prio:             prio,
      cat:              cat,
      resp:             resp,
      criadoPor:        criadorPreservado,
      local:            local,
      prazo:            prazo,
      link:             linkVal || '',
      telejornal:       telVal || null,
      equipamento:      eqVal || null,
      desc:             desc,
      mine:             isMine,
      anexos:           anexosAtualizados,
      resolucao:        Object.keys(resolucaoAtual).length > 0 ? resolucaoAtual : null,
      historicoEdicoes: historicoEdicoes,
      ultimaEdicaoPor:  usuarioLogado,
      ultimaEdicaoEm:   formatDataHoraLocal()
    });
    save(ocorrencias, ocorrencias[idx], false);
    fecharPopup('popup-editar-oc');
    renderAll();
    if (typeof mostrarToast === 'function') {
      mostrarToast('Ocorrência Atualizada', 'As alterações de ' + usuarioLogado + ' foram salvas e sincronizadas.', 'success');
    }
  }
  window.salvarEdicaoOcorrencia = salvarEdicaoOcorrencia;
  var itemDetalhesAtual = null;
