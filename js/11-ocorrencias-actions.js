  /* ═══════════════════════════════════════════
     POPUP: NOVA OCORRÊNCIA
  ═══════════════════════════════════════════ */

  var novaTitulo  = document.getElementById('nova-titulo');
  var novaDesc    = document.getElementById('nova-desc');
  var novaCounter = document.getElementById('nova-counter');
  var btnCriar    = document.getElementById('btn-criar');
  var novaFile    = document.getElementById('nova-arquivos');
  var novaPrevs   = document.getElementById('nova-previews');

  function validarNova() {
    var ok = novaTitulo && novaDesc &&
             novaTitulo.value.trim().length > 0 &&
             novaDesc.value.length >= 50;
    if (btnCriar) {
      btnCriar.style.opacity = ok ? '1' : '0.38';
      btnCriar.style.cursor  = ok ? 'pointer' : 'not-allowed';
      btnCriar._valido = ok;
    }
  }

  if (btnCriar) { btnCriar.style.opacity = '0.38'; btnCriar.style.cursor = 'not-allowed'; btnCriar._valido = false; }
  if (novaTitulo) novaTitulo.addEventListener('input', validarNova);

  if (novaDesc && novaCounter) {
    novaDesc.addEventListener('input', function() {
      var len = this.value.length;
      if (len >= 50) {
        novaCounter.textContent = '✓ ' + len + ' caracteres — mínimo atingido';
        novaCounter.className = 'char-count ok';
      } else if (len >= 25) {
        novaCounter.textContent = 'Faltam ' + (50-len) + ' caracteres';
        novaCounter.className = 'char-count warn';
      } else {
        novaCounter.textContent = 'Mínimo 50 caracteres (' + len + '/50)';
        novaCounter.className = 'char-count';
      }
      validarNova();
    });
  }

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

    if (descVal.length < 50) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Descrição Curta', 'A descrição deve ter pelo menos 50 caracteres (' + descVal.length + '/50).', 'warning');
      }
      if (novaDesc) novaDesc.focus();
      return;
    }

    var respVal = document.getElementById('nova-resp') ? document.getElementById('nova-resp').value : '';
    var userAtual = getUsuarioAtual();
    var isMine = (respVal === userAtual || respVal === 'Operador' || respVal.indexOf(userAtual) !== -1 || respVal.indexOf('Você') !== -1);

    var anexosFinais = (uploadedFilesStore['nova-previews'] || []).slice();
    var novo = {
      id:          'oc_' + Date.now(),
      titulo:      tituloVal,
      prio:        document.getElementById('nova-prio') ? document.getElementById('nova-prio').value : 'Média',
      cat:         document.getElementById('nova-cat') ? document.getElementById('nova-cat').value : 'Equipamento',
      resp:        respVal || 'Todos do turno',
      local:       document.getElementById('nova-local') ? document.getElementById('nova-local').value.trim() : '',
      prazo:       document.getElementById('nova-prazo') ? document.getElementById('nova-prazo').value : '',
      desc:        descVal,
      mine:        isMine,
      tags:        ['Nova'],
      status:      'aberta',
      criado:      Date.now(),
      dataCriacao: formatDataHoraLocal(),
      resolucao:   anexosFinais.length > 0 ? { statusRes: 'Aberta', anexos: anexosFinais } : null,
      anexos:      anexosFinais,
      praca:       (typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora')
    };

    ocorrencias = [novo].concat(ocorrencias);
    window.ocorrencias = ocorrencias;
    save(ocorrencias, novo, true);
    uploadedFilesStore['nova-previews'] = [];
    fecharPopup('popup-nova-oc');
    adicionarNotificacao('Nova Ocorrência Criada', novo.titulo + ' (' + novo.prio + ' Prioridade)', novo.prio === 'Alta' ? 'warning' : 'info');
    renderAll();

    /* reset */
    if (novaTitulo) novaTitulo.value = '';
    if (novaDesc)   novaDesc.value   = '';
    if (novaFile)   novaFile.value   = '';
    if (novaPrevs)  novaPrevs.innerHTML = '';
    if (novaCounter) { novaCounter.textContent = 'Mínimo 50 caracteres'; novaCounter.className = 'char-count'; }
    if (document.getElementById('nova-prio')) document.getElementById('nova-prio').selectedIndex = 1;
    if (document.getElementById('nova-resp')) document.getElementById('nova-resp').selectedIndex = 0;
    if (document.getElementById('nova-cat'))  document.getElementById('nova-cat').selectedIndex  = 0;
    if (document.getElementById('nova-local')) document.getElementById('nova-local').value = '';
    if (document.getElementById('nova-prazo')) document.getElementById('nova-prazo').value = '';
    validarNova();
  }
  window.criarNovaOcorrencia = criarNovaOcorrencia;

  if (btnCriar) {
    btnCriar.addEventListener('click', criarNovaOcorrencia);
  }

  /* ═══════════════════════════════════════════
     POPUP: RESOLVER OCORRÊNCIA
  ═══════════════════════════════════════════ */

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

    /* reset */
    if (resolverDesc)    resolverDesc.value = '';
    if (resolverFile)    resolverFile.value = '';
    if (resolverPrevs)   resolverPrevs.innerHTML = '';
    uploadedFilesStore['resolver-previews'] = [];
    if (resolverCounter) { resolverCounter.textContent = 'Mínimo 10 caracteres'; resolverCounter.className = 'char-count'; }
    document.getElementById('resolver-status').value = 'Resolvido';
    /* reset pills visuais */
    if (typeof selecionarStatus === 'function') selecionarStatus('Resolvido');
    validarResolver();
    abrirPopup('popup-resolver');
  }
  window.abrirResolver = abrirResolver;

  /* ═══════════════════════════════════════════
     EDIÇÃO DE OCORRÊNCIAS
  ═══════════════════════════════════════════ */
  function abrirEditarOcorrencia(id) {
    var oc = ocorrencias.find(function(o){ return o && o.id === id; });
    if (!oc) return;
    document.getElementById('edit-oc-id').value = oc.id;
    document.getElementById('edit-oc-titulo').value = oc.titulo || '';
    document.getElementById('edit-oc-prio').value = oc.prio || 'Média';
    document.getElementById('edit-oc-cat').value = oc.cat || 'Equipamento';
    document.getElementById('edit-oc-resp').value = oc.resp || 'Todos do turno';
    document.getElementById('edit-oc-local').value = oc.local || '';
    document.getElementById('edit-oc-prazo').value = oc.prazo || '';
    document.getElementById('edit-oc-desc').value = oc.desc || '';

    var subEl = document.getElementById('edit-oc-subtitle');
    if (subEl) subEl.textContent = 'Editando ocorrência: ' + (oc.titulo || oc.id) + ' — aberto para toda a equipe.';

    /* Carrega anexos existentes */
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
    var isMine = (resp === usuarioLogado || resp === 'Operador' || resp.indexOf(usuarioLogado) !== -1 || resp.indexOf('Você') !== -1);
    var anexosAtualizados = (uploadedFilesStore['edit-oc-previews'] || []).slice();

    var resolucaoAtual = Object.assign({}, ocorrencias[idx].resolucao || {});
    if (anexosAtualizados.length > 0) {
      resolucaoAtual.anexos = anexosAtualizados;
    } else {
      delete resolucaoAtual.anexos;
    }

    var anterior = ocorrencias[idx];
    var mudancas = [];
    if (titulo !== (anterior.titulo || '')) mudancas.push('Título alterado de "' + (anterior.titulo || '') + '" para "' + titulo + '"');
    if (prio !== (anterior.prio || '')) mudancas.push('Prioridade alterada de ' + (anterior.prio || 'Média') + ' para ' + prio);
    if (cat !== (anterior.cat || '')) mudancas.push('Categoria alterada de ' + (anterior.cat || '') + ' para ' + cat);
    if (resp !== (anterior.resp || '')) mudancas.push('Responsável alterado de ' + (anterior.resp || '') + ' para ' + resp);
    if (local !== (anterior.local || '')) mudancas.push('Local alterado de "' + (anterior.local || '') + '" para "' + local + '"');
    if (prazo !== (anterior.prazo || '')) mudancas.push('Prazo alterado para ' + (prazo || 'Sem prazo'));
    if (desc !== (anterior.desc || '')) mudancas.push('Descrição detalhada atualizada');
    if (anexosAtualizados.length !== ((anterior.anexos || []).length)) mudancas.push('Anexos atualizados (' + anexosAtualizados.length + ' arquivos)');

    var historicoEdicoes = (anterior.historicoEdicoes && Array.isArray(anterior.historicoEdicoes)) ? anterior.historicoEdicoes.slice() : [];
    if (mudancas.length > 0) {
      historicoEdicoes.unshift({
        autor: usuarioLogado,
        dataHora: formatDataHoraLocal(),
        mudancas: mudancas
      });
    }

    ocorrencias[idx] = Object.assign({}, ocorrencias[idx], {
      titulo:           titulo,
      prio:             prio,
      cat:              cat,
      resp:             resp,
      local:            local,
      prazo:            prazo,
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
