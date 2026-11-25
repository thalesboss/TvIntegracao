(function (window, document, TVApp) {
  'use strict';

  TVApp.registerModule('ocorrencias-actions', function (app) {
    var Security   = app.Security;
    var Markers    = app.Markers;
    var Session    = app.Session;
    var Store      = app.Store;
    var escapeHTML = Security.escapeHTML;

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

    if (btnCriar) {
      btnCriar.style.opacity = '0.38';
      btnCriar.style.cursor = 'not-allowed';
      btnCriar._valido = false;
    }
    if (novaTitulo) novaTitulo.addEventListener('input', validarNova);
    if (novaDesc && novaCounter) {
      novaDesc.addEventListener('input', function () {
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
      var praca = (typeof window.getPracaAtual === 'function') ? window.getPracaAtual() : 'Juiz de Fora';
      var isUberlandia = praca.indexOf('Uber') !== -1;
      var equips = [];
      if (typeof window.obterListaNomesEquipamentosOrdenados === 'function') {
        equips = window.obterListaNomesEquipamentosOrdenados(praca);
      } else if (Store.dashboardMetrics && Store.dashboardMetrics.equipamento) {
        equips = Object.keys(Store.dashboardMetrics.equipamento);
      }
      var selNova = document.getElementById('nova-equipamento');
      var selEdit = document.getElementById('edit-oc-equipamento');
      [selNova, selEdit].forEach(function (sel) {
        if (!sel) return;
        var curVal = sel.value;
        var html = '<option value="">Sem equipamento específico</option>';
        if (!isUberlandia && equips.length === 0) {
          equips = ['LIVE U1', 'LIVE U2', 'LIVE U3', 'LIVE U4', 'LIVE U SMART', 'REDAÇÃO', 'KMJ', 'NET PRAÇA', 'NET PORTARIA', 'FORMATOS NET', 'NET 2º ANDAR', 'NET 3º ANDAR', 'NET 4º ANDAR'];
        }
        equips.forEach(function (eq) {
          html += '<option value="' + escapeHTML(eq) + '">' + escapeHTML(eq) + '</option>';
        });
        html += '<option value="__novo__" style="color:var(--blue);font-weight:700;">➕ Cadastrar Novo Equipamento...</option>';
        sel.innerHTML = html;
        if (curVal && curVal !== '__novo__') sel.value = curVal;
        if (!sel._hasNovoEqListener) {
          sel._hasNovoEqListener = true;
          sel.addEventListener('change', function () {
            if (this.value === '__novo__') {
              this.value = '';
              window._eqTriggeringSelect = this;
              if (typeof window.abrirModalCadastroEquipamento === 'function') window.abrirModalCadastroEquipamento();
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
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Título Necessário', 'Por favor, informe o título da ocorrência.', 'warning');
        }
        if (novaTitulo) novaTitulo.focus();
        return;
      }
      if (descVal.length < 10) {
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Descrição Curta', 'A descrição deve ter pelo menos 10 caracteres (' + descVal.length + '/10).', 'warning');
        }
        if (novaDesc) novaDesc.focus();
        return;
      }
      var respVal = document.getElementById('nova-resp') ? document.getElementById('nova-resp').value : '';
      var userAtual = Session.getUserName();
      if (respVal === 'Operador' && userAtual) respVal = userAtual;
      var isMine = (respVal === userAtual || respVal === 'Operador' || respVal.indexOf(userAtual) !== -1 || respVal.indexOf('Você') !== -1 || respVal.indexOf('Atribuir a mim') !== -1);
      var telVal = document.getElementById('nova-telejornal') ? document.getElementById('nova-telejornal').value : '';
      var eqVal  = document.getElementById('nova-equipamento') ? document.getElementById('nova-equipamento').value : '';
      var tagsArr = ['Nova'];
      if (telVal) tagsArr.push(telVal);
      if (eqVal)  tagsArr.push(eqVal);
      var anexosFinais = (Store.uploadedFilesStore['nova-previews'] || []).slice();
      var linkValRaw = document.getElementById('nova-link') ? document.getElementById('nova-link').value.trim() : '';
      var linkVal = linkValRaw ? Security.sanitizeExternalUrl(linkValRaw) : '';
      var resInicial = { statusRes: 'Aberta', criadoPor: userAtual };
      if (anexosFinais.length > 0) resInicial.anexos = anexosFinais;
      if (linkVal) resInicial.link = linkVal;

      var novo = {
        id:           'oc_' + Date.now(),
        titulo:       tituloVal,
        prio:         document.getElementById('nova-prio') ? document.getElementById('nova-prio').value : 'Média',
        cat:          document.getElementById('nova-cat') ? document.getElementById('nova-cat').value : 'Equipamento',
        resp:         respVal || 'Equipe do Turno (Todos)',
        criadoPor:    userAtual,
        local:        document.getElementById('nova-local') ? document.getElementById('nova-local').value.trim() : '',
        prazo:        document.getElementById('nova-prazo') ? document.getElementById('nova-prazo').value : '',
        link:         linkVal || '',
        telejornal:   telVal || null,
        equipamento:  eqVal || null,
        desc:         descVal,
        mine:         isMine,
        tags:         tagsArr,
        status:       'aberta',
        criado:       Date.now(),
        dataCriacao:  window.formatDataHoraLocal(),
        resolucao:    resInicial,
        anexos:       anexosFinais,
        praca:        (typeof window.getPracaAtual === 'function' ? window.getPracaAtual() : 'Juiz de Fora'),
        _pendingSync: true
      };

      var atualizouDash = false;
      if (Store.dashboardMetrics) {
        if (telVal && Store.dashboardMetrics.telejornal && Store.dashboardMetrics.telejornal[telVal]) {
          Store.dashboardMetrics.telejornal[telVal].nc = (Store.dashboardMetrics.telejornal[telVal].nc || 0) + 1;
          atualizouDash = true;
        }
        if (eqVal && Store.dashboardMetrics.equipamento && Store.dashboardMetrics.equipamento[eqVal]) {
          Store.dashboardMetrics.equipamento[eqVal].nc = (Store.dashboardMetrics.equipamento[eqVal].nc || 0) + 1;
          atualizouDash = true;
        }
        if (atualizouDash) {
          if (typeof window.salvarDashboardMetricsStore === 'function') window.salvarDashboardMetricsStore();
          if (typeof window.renderDashboards === 'function') window.renderDashboards();
        }
      }

      Store.ocorrencias = [novo].concat(Store.ocorrencias);
      window.save(Store.ocorrencias, novo, true);
      Store.uploadedFilesStore['nova-previews'] = [];
      window.fecharPopup('popup-nova-oc');
      if (typeof window.adicionarNotificacao === 'function') {
        window.adicionarNotificacao('Nova Ocorrência Criada', novo.titulo + ' (' + novo.prio + ' Prioridade)', novo.prio === 'Alta' ? 'warning' : 'info');
      }
      window.renderAll(true);

      if (novaTitulo) novaTitulo.value = '';
      if (novaDesc)   novaDesc.value   = '';
      if (novaFile)   novaFile.value   = '';
      if (novaPrevs)  novaPrevs.innerHTML = '';
      if (novaCounter) { novaCounter.textContent = 'Mínimo 10 caracteres'; novaCounter.className = 'char-count'; }
      if (document.getElementById('nova-prio')) document.getElementById('nova-prio').selectedIndex = 1;
      if (document.getElementById('nova-resp')) document.getElementById('nova-resp').selectedIndex = 0;
      if (document.getElementById('nova-cat'))  document.getElementById('nova-cat').selectedIndex  = 0;
      ['nova-local', 'nova-prazo', 'nova-link', 'nova-telejornal', 'nova-equipamento'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
      });
      validarNova();
    }
    window.criarNovaOcorrencia = criarNovaOcorrencia;

    /* ─── Controles do Modal de Resolução (incluindo Pills de Status) ─── */
    var resolverDesc    = document.getElementById('resolver-desc');
    var resolverCounter = document.getElementById('resolver-counter');
    var btnConfirmar    = document.getElementById('btn-confirmar-resolver');
    var resolverFile    = document.getElementById('resolver-arquivos');
    var resolverPrevs   = document.getElementById('resolver-previews');

    function selecionarStatus(valor) {
      var inputEl = document.getElementById('resolver-status');
      if (inputEl) inputEl.value = valor;
      var pills = [
        { id: 'pill-ok', val: 'Resolvido', cls: 'selected-ok' },
        { id: 'pill-parcial', val: 'Parcialmente resolvido', cls: 'selected-warn' },
        { id: 'pill-enc', val: 'Em Observação', cls: 'selected-fwd' }
      ];
      var isObs = (valor === 'Em Observação' || valor === 'Resolvida e Arquivada' || valor === 'Encaminhado');
      pills.forEach(function (p) {
        var el = document.getElementById(p.id);
        if (!el) return;
        el.classList.remove('selected-ok', 'selected-warn', 'selected-fwd');
        if (p.val === valor || (p.id === 'pill-enc' && isObs)) {
          el.classList.add(p.cls);
        }
      });
      var boxTempo = document.getElementById('resolver-obs-tempo-box');
      if (boxTempo) boxTempo.style.display = isObs ? 'block' : 'none';
    }
    window.selecionarStatus = selecionarStatus;

    function toggleInputObsPersonalizado(val) {
      var wrap = document.getElementById('resolver-obs-custom-wrap');
      if (!wrap) return;
      wrap.style.display = (val === 'custom') ? 'flex' : 'none';
      if (val === 'custom') {
        var inp = document.getElementById('resolver-obs-custom-val');
        if (inp) setTimeout(function () { inp.focus(); inp.select(); }, 50);
      }
    }
    window.toggleInputObsPersonalizado = toggleInputObsPersonalizado;

    function validarResolver() {
      var ok = resolverDesc && resolverDesc.value.trim().length >= 10;
      if (btnConfirmar) {
        btnConfirmar.style.opacity = ok ? '1' : '0.38';
        btnConfirmar.style.cursor  = ok ? 'pointer' : 'not-allowed';
        btnConfirmar._valido = ok;
      }
    }
    if (btnConfirmar) {
      btnConfirmar.style.opacity = '0.38';
      btnConfirmar.style.cursor = 'not-allowed';
      btnConfirmar._valido = false;
    }
    if (resolverDesc && resolverCounter) {
      resolverDesc.addEventListener('input', function () {
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
      var oc = (Store.ocorrencias || []).find(function (o) { return o && o.id === id; });
      if (!oc) return;
      Store.resolverAtualId = id;
      var tituloEl = document.getElementById('resolver-titulo-oc');
      if (tituloEl) tituloEl.textContent = oc.titulo;
      if (resolverDesc)  resolverDesc.value = '';
      if (resolverFile)  resolverFile.value = '';
      if (resolverPrevs) resolverPrevs.innerHTML = '';
      Store.uploadedFilesStore['resolver-previews'] = [];
      if (resolverCounter) { resolverCounter.textContent = 'Mínimo 10 caracteres'; resolverCounter.className = 'char-count'; }
      var stEl = document.getElementById('resolver-status');
      if (stEl) stEl.value = 'Resolvido';
      var obsHorasEl = document.getElementById('resolver-obs-horas');
      if (obsHorasEl) obsHorasEl.value = '24';
      var obsCustomWrap = document.getElementById('resolver-obs-custom-wrap');
      if (obsCustomWrap) obsCustomWrap.style.display = 'none';
      var obsCustomVal = document.getElementById('resolver-obs-custom-val');
      if (obsCustomVal) obsCustomVal.value = '36';
      var obsCustomUnit = document.getElementById('resolver-obs-custom-unit');
      if (obsCustomUnit) obsCustomUnit.value = 'horas';
      var obsBoxEl = document.getElementById('resolver-obs-tempo-box');
      if (obsBoxEl) obsBoxEl.style.display = 'none';
      selecionarStatus('Resolvido');
      validarResolver();
      window.abrirPopup('popup-resolver');
    }
    window.abrirResolver = abrirResolver;

    /* ─── Edição de Ocorrência com Auditoria de Mudanças ─── */
    function abrirEditarOcorrencia(id) {
      var oc = (Store.ocorrencias || []).find(function (o) { return o && o.id === id; });
      if (!oc) return;
      document.getElementById('edit-oc-id').value = oc.id;
      document.getElementById('edit-oc-titulo').value = oc.titulo || '';
      document.getElementById('edit-oc-prio').value = oc.prio || 'Média';
      document.getElementById('edit-oc-cat').value = oc.cat || 'Equipamento';
      var editOptUser = document.getElementById('edit-opt-user-name');
      var userLogadoEdit = Session.getUserName();
      if (editOptUser && userLogadoEdit) {
        editOptUser.value = userLogadoEdit;
        editOptUser.textContent = userLogadoEdit + ' (Atribuir a mim)';
      }
      var respNorm = typeof window.formatarAtribuicaoResp === 'function' ? window.formatarAtribuicaoResp(oc.resp) : (oc.resp || 'Equipe do Turno (Todos)');
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
      document.getElementById('edit-oc-desc').value = Markers.strip(oc.desc || '');
      atualizarSelectEquipamentosNovaOc();
      if (document.getElementById('edit-oc-telejornal')) document.getElementById('edit-oc-telejornal').value = oc.telejornal || '';
      if (document.getElementById('edit-oc-equipamento')) document.getElementById('edit-oc-equipamento').value = oc.equipamento || '';
      var subEl = document.getElementById('edit-oc-subtitle');
      if (subEl) subEl.textContent = 'Editando ocorrência: ' + (oc.titulo || oc.id) + ' — aberto para toda a equipe.';
      var anexosExistentes = oc.anexos || (oc.resolucao && oc.resolucao.anexos) || [];
      Store.uploadedFilesStore['edit-oc-previews'] = anexosExistentes.slice();
      window.renderPreviewsForContainer('edit-oc-previews');
      window.abrirPopup('popup-editar-oc');
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
      var linkVal = linkRaw ? Security.sanitizeExternalUrl(linkRaw) : '';
      var telVal = document.getElementById('edit-oc-telejornal') ? document.getElementById('edit-oc-telejornal').value : '';
      var eqVal  = document.getElementById('edit-oc-equipamento') ? document.getElementById('edit-oc-equipamento').value : '';
      var desc = document.getElementById('edit-oc-desc').value.trim();
      if (!titulo) {
        if (typeof window.mostrarToast === 'function') window.mostrarToast('Campo Obrigatório', 'Por favor, informe o título da ocorrência.', 'warning');
        return;
      }
      if (!desc) {
        if (typeof window.mostrarToast === 'function') window.mostrarToast('Campo Obrigatório', 'Por favor, informe a descrição detalhada da ocorrência.', 'warning');
        return;
      }
      var idx = (Store.ocorrencias || []).findIndex(function (o) { return o && o.id === id; });
      if (idx === -1) {
        if (typeof window.mostrarToast === 'function') window.mostrarToast('Não Encontrada', 'Ocorrência não encontrada.', 'danger');
        return;
      }
      var usuarioLogado = Session.getUserName();
      if (resp === 'Operador' && usuarioLogado) resp = usuarioLogado;
      var isMine = (resp === usuarioLogado || resp === 'Operador' || resp.indexOf(usuarioLogado) !== -1 || resp.indexOf('Você') !== -1 || resp.indexOf('Atribuir a mim') !== -1);
      var anexosAtualizados = (Store.uploadedFilesStore['edit-oc-previews'] || []).slice();
      var anterior = Store.ocorrencias[idx];
      var mudancas = [];

      function regMudanca(campo, valAntes, valDepois, textoPadraoVazio) {
        var vA = (valAntes !== undefined && valAntes !== null && String(valAntes).trim() !== '') ? String(valAntes).trim() : (textoPadraoVazio || 'Não informado');
        var vD = (valDepois !== undefined && valDepois !== null && String(valDepois).trim() !== '') ? String(valDepois).trim() : (textoPadraoVazio || 'Não informado');
        if (vA !== vD) {
          mudancas.push({ campo: campo, antes: vA, depois: vD, resumo: campo + ': de "' + vA + '" para "' + vD + '"' });
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

      var ctrsObjExistente = Markers.extract(String(anterior.desc || ''), 'CTRS');
      var descAntLimpa = Markers.strip(anterior.desc || '');
      regMudanca('Descrição Detalhada', descAntLimpa, desc, 'Sem descrição');
      if (ctrsObjExistente && desc.indexOf('<!--CTRS_JSON:') === -1) {
        desc = desc + Markers.encode('CTRS', ctrsObjExistente);
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

      var historicoEdicoes = Array.isArray(anterior.historicoEdicoes)
        ? anterior.historicoEdicoes.slice()
        : ((anterior.resolucao && Array.isArray(anterior.resolucao.historicoEdicoes)) ? anterior.resolucao.historicoEdicoes.slice() : []);
      if (mudancas.length > 0) {
        historicoEdicoes.unshift({ autor: usuarioLogado, dataHora: window.formatDataHoraLocal(), mudancas: mudancas });
      }

      var resolucaoAtual = Object.assign({}, anterior.resolucao || {});
      if (anexosAtualizados.length > 0) resolucaoAtual.anexos = anexosAtualizados;
      else delete resolucaoAtual.anexos;
      if (historicoEdicoes.length > 0) resolucaoAtual.historicoEdicoes = historicoEdicoes;
      if (linkVal) resolucaoAtual.link = linkVal;
      else delete resolucaoAtual.link;
      var criadorPreservado = typeof window.obterCriadorOcorrencia === 'function' ? window.obterCriadorOcorrencia(anterior) : (anterior.criadoPor || usuarioLogado);
      resolucaoAtual.criadoPor = criadorPreservado;

      Store.ocorrencias[idx] = Object.assign({}, anterior, {
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
        ultimaEdicaoEm:   window.formatDataHoraLocal()
      });
      window.save(Store.ocorrencias, Store.ocorrencias[idx], false);
      window.fecharPopup('popup-editar-oc');
      window.renderAll(true);
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Ocorrência Atualizada', 'As alterações de ' + usuarioLogado + ' foram salvas e sincronizadas.', 'success');
      }
    }
    window.salvarEdicaoOcorrencia = salvarEdicaoOcorrencia;
  });
})(window, document, window.TVApp);
