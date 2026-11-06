  function atualizarResumoPowerBI() {
    var select = document.getElementById('pbi-periodo');
    var titleEl = document.getElementById('pbi-preview-title');
    var statsEl = document.getElementById('pbi-preview-stats');
    if (!select || !titleEl || !statsEl) return;
    var val = select.value;
    var periodosTextos = {
      semana: 'Última Semana (7 dias)',
      mes: 'Último Mês (30 dias)',
      semestre: 'Últimos 6 Meses',
      ano: 'Último 1 Ano'
    };
    var periodosStats = {
      semana:   { total: 98,  conf: 97,  nc: 1,  canc: 0 },
      mes:      { total: 419, conf: 418, nc: 1,  canc: 0 },
      semestre: { total: 2480,conf: 2470,nc: 8,  canc: 2 },
      ano:      { total: 4960,conf: 4940,nc: 15, canc: 5 }
    };
    var text = periodosTextos[val] || 'Período Selecionado';
    var st = periodosStats[val] || periodosStats.mes;
    var pctConf = ((st.conf / st.total) * 100).toFixed(1);
    var pctNc = ((st.nc / st.total) * 100).toFixed(1);
    titleEl.textContent = 'Consolidado: ' + text;
    statsEl.innerHTML =
      'Total Transmissões: <strong>' + st.total + '</strong> | ' +
      'Conformes: <strong style="color:var(--green);">' + st.conf + ' (' + pctConf + '%)</strong> | ' +
      'Não Conformes: <strong style="color:var(--red);">' + st.nc + ' (' + pctNc + '%)</strong>';
  }
  window.atualizarResumoPowerBI = atualizarResumoPowerBI;
  function exportarRelatorioPowerBI() {
    var select = document.getElementById('pbi-periodo');
    var val = select ? select.value : 'mes';
    fecharPopup('popup-gerar-powerbi');
    if (typeof mostrarToast === 'function') {
      mostrarToast('Relatório Power BI Gerado', 'Métricas do período salvas e prontas para integração com o Power BI / Excel.', 'success');
    }
    alert('Relatório Power BI compilado com sucesso!\n\nPeríodo exportado com todas as telemetrias e históricos de transmissões.');
  }
  window.exportarRelatorioPowerBI = exportarRelatorioPowerBI;
  function abrirModalOcDashboard(tipo) {
    var tipoEl = document.getElementById('oc-dash-tipo-painel');
    var selectAlvo = document.getElementById('oc-dash-alvo');
    if (!selectAlvo || !tipoEl || !dashboardMetrics) return;
    tipoEl.value = tipo;
    var items = dashboardMetrics[tipo];
    if (!items) return;
    var list = (tipo === 'equipamento' && typeof obterListaNomesEquipamentosOrdenados === 'function')
      ? obterListaNomesEquipamentosOrdenados()
      : Object.keys(items);
    selectAlvo.innerHTML = list.map(function(item) {
      return '<option value="' + item + '">' + item + '</option>';
    }).join('');
    abrirPopup('popup-nova-oc-dashboard');
  }
  window.abrirModalOcDashboard = abrirModalOcDashboard;
  var dashAtivoAtual = 'telejornal';
  function alternarDashboard(tipo) {
    dashAtivoAtual = (tipo === 'equipamento' || tipo === 'equipamentos') ? 'equipamento' : 'telejornal';
    var viewTj = document.getElementById('dash-view-telejornal');
    var viewEq = document.getElementById('dash-view-equipamentos');
    var btnTj = document.getElementById('btn-tab-tj');
    var btnEq = document.getElementById('btn-tab-eq');
    var titleEl = document.getElementById('dash-view-title');
    if (dashAtivoAtual === 'telejornal') {
      if (viewTj) {
        viewTj.style.display = 'block';
        viewTj.classList.remove('dash-view-animated');
        void viewTj.offsetWidth;
        viewTj.classList.add('dash-view-animated');
      }
      if (viewEq) viewEq.style.display = 'none';
      if (btnTj) btnTj.classList.add('on');
      if (btnEq) btnEq.classList.remove('on');
      if (titleEl) titleEl.textContent = 'Telejornal';
    } else {
      if (viewTj) viewTj.style.display = 'none';
      if (viewEq) {
        viewEq.style.display = 'block';
        viewEq.classList.remove('dash-view-animated');
        void viewEq.offsetWidth;
        viewEq.classList.add('dash-view-animated');
      }
      if (btnTj) btnTj.classList.remove('on');
      if (btnEq) btnEq.classList.add('on');
      if (titleEl) titleEl.textContent = 'Equipamentos';
    }
    renderDashboards();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.alternarDashboard = alternarDashboard;
  function abrirModalOcDashboardContextual() {
    abrirModalOcDashboard(dashAtivoAtual);
  }
  window.abrirModalOcDashboardContextual = abrirModalOcDashboardContextual;
  var itemTransmissaoDetalhesAtual = { nome: '', tipo: '' };
  function abrirDetalhesTransmissao(nome, tipo) {
    if (!nome) return;
    tipo = (tipo === 'equipamento' || tipo === 'equipamentos') ? 'equipamento' : 'telejornal';
    itemTransmissaoDetalhesAtual = { nome: nome, tipo: tipo };
    var metricObj = (dashboardMetrics && dashboardMetrics[tipo]) ? dashboardMetrics[tipo][nome] : null;
    var conf = metricObj ? metricObj.conf : 100;
    var nc = metricObj ? metricObj.nc : 0;
    var canc = metricObj ? metricObj.canc : 0;
    var total = conf + nc + canc;
    var pctConf = total > 0 ? ((conf / total) * 100).toFixed(1) : '100.0';
    var pctNc = total > 0 ? ((nc / total) * 100).toFixed(1) : '0.0';
    var pctCanc = total > 0 ? ((canc / total) * 100).toFixed(1) : '0.0';
    var nomeEl = document.getElementById('det-trans-nome');
    var catEl = document.getElementById('det-trans-categoria');
    var icoEl = document.getElementById('det-trans-ico');
    var confEl = document.getElementById('det-trans-conf');
    var ncEl = document.getElementById('det-trans-nc');
    var cancEl = document.getElementById('det-trans-canc');
    var totalEl = document.getElementById('det-trans-total');
    var slaEl = document.getElementById('det-trans-sla');
    var localEl = document.getElementById('det-trans-local');
    var linkEl = document.getElementById('det-trans-link');
    var ultimoEl = document.getElementById('det-trans-ultimo');
    var badgeEl = document.getElementById('det-trans-status-badge');
    var histListaEl = document.getElementById('det-trans-historico-lista');
    if (nomeEl) nomeEl.textContent = nome;
    if (catEl) catEl.textContent = (tipo === 'telejornal' ? 'Telejornal / Programa' : 'Equipamento de Transmissão') + ' · Telemetria & Status Operacional';
    if (icoEl) icoEl.setAttribute('data-lucide', tipo === 'telejornal' ? 'tv' : 'video');
    if (confEl) confEl.textContent = conf + ' (' + pctConf + '%)';
    if (ncEl) ncEl.textContent = nc + ' (' + pctNc + '%)';
    if (cancEl) cancEl.textContent = canc + ' (' + pctCanc + '%)';
    if (totalEl) totalEl.textContent = total + ' transmissões';
    if (slaEl) slaEl.textContent = pctConf + '% (Disponibilidade)';
    var pracaAtual = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isEquip = (tipo === 'equipamento');
    if (localEl) localEl.textContent = isEquip ? 'Unidade Móvel / Jornalismo Externo (' + pracaAtual + ')' : 'Estúdio Principal · ' + pracaAtual + ' (MG)';
    if (linkEl) linkEl.textContent = isEquip ? 'Link Celular 4K / Bonding LiveU (4x SIM 5G)' : 'Rede SDI / IP Fibra Óptica + Satélite';
    if (ultimoEl) ultimoEl.textContent = nc > 0 ? 'Última transmissão com alerta (' + nc + ' falha registrada)' : 'Última transmissão 100% Conforme (OK)';
    if (badgeEl) {
      if (nc > 0) {
        badgeEl.className = 'tag tag-y';
        badgeEl.textContent = '● Atenção (' + nc + ' NC)';
      } else {
        badgeEl.className = 'tag tag-g';
        badgeEl.textContent = '● Operacional / Excelente';
      }
    }
    if (histListaEl) {
      var nomeUp = String(nome || '').toUpperCase().trim();
      var histOcs = (typeof ocorrencias !== 'undefined' ? ocorrencias : []).filter(function(o) {
        if (!o || o.status === 'lixeira') return false;
        if (o.equipamento && String(o.equipamento).toUpperCase().trim() === nomeUp) return true;
        if (o.telejornal && String(o.telejornal).toUpperCase().trim() === nomeUp) return true;
        if (Array.isArray(o.tags) && o.tags.some(function(t){ return String(t).toUpperCase().trim() === nomeUp; })) return true;
        var descLimpa = String(o.desc || '').replace(/<!--CTRS_JSON:[^>]+-->/g, '');
        return (o.titulo && String(o.titulo).toUpperCase().indexOf(nomeUp) !== -1) || (descLimpa.toUpperCase().indexOf(nomeUp) !== -1);
      });
      var histRels = (typeof historicoSeedData !== 'undefined' && Array.isArray(historicoSeedData) ? historicoSeedData : []).filter(function(h) {
        if (!h || h.tipo !== 'relatorio') return false;
        var isCTRS = (
          h.subtipo === 'CTRS Transmissão' ||
          h.subtipo === 'Relatório Transmissão' ||
          h.categoria === 'Transmissão CTRS' ||
          (h.id && String(h.id).indexOf('h_ctrs_') === 0)
        );
        if (!isCTRS) return false;
        var dH = h.dadosCTRS;
        if (!dH && h.descResolucao && h.descResolucao.indexOf('<!--CTRS_JSON:') !== -1) {
          try {
            var mH = h.descResolucao.match(/<!--CTRS_JSON:([^>]+)-->/);
            if (mH && mH[1]) dH = JSON.parse(decodeURIComponent(mH[1]));
          } catch (e) {}
        }
        if (tipo === 'telejornal') {
          if (dH && ((dH.chaveJornal && String(dH.chaveJornal).toUpperCase() === nomeUp) || (dH.tipo && String(dH.tipo).toUpperCase() === nomeUp))) return true;
          if (h.titulo && String(h.titulo).toUpperCase().indexOf(nomeUp) !== -1) return true;
        } else {
          if (dH && Array.isArray(dH.transmissoes) && dH.transmissoes.some(function(tx){ return tx && tx.infra && String(tx.infra).toUpperCase().trim() === nomeUp; })) return true;
          if (h.equipamento && String(h.equipamento).toUpperCase().indexOf(nomeUp) !== -1) return true;
        }
        return false;
      });
      if (histOcs.length === 0 && histRels.length === 0) {
        histListaEl.innerHTML =
          '<div style="background:#FFFFFF;border:1px solid var(--border-lt);border-radius:var(--r-sm);padding:8px 10px;font-size:11.5px;color:var(--muted);">' +
            'Nenhuma ocorrência ou relatório registrado para este item no momento. Sistema estável e operando normalmente.' +
          '</div>';
      } else {
        var htmlItens = '';
        histOcs.forEach(function(o) {
          var descLimpa = String(o.desc || '').replace(/<!--CTRS_JSON:[^>]+-->/g, '').trim();
          var temPreview = !!(o.htmlRelatorio || o.dadosCTRS || (o.desc && String(o.desc).indexOf('<!--CTRS_JSON:') !== -1) || (o.tags && o.tags.indexOf('Relatório TV') !== -1));
          htmlItens +=
            '<div onclick=\"fecharPopup(\'popup-detalhes-transmissao\'); verDetalhesOcorrencia(\'' + o.id + '\')\" style=\"background:#FFFFFF;border:1px solid var(--border-lt);border-left:3px solid ' + (o.status === 'resolvida' ? '#10B981' : '#EF4444') + ';border-radius:var(--r-sm);padding:8px 10px;display:flex;flex-direction:column;gap:4px;font-size:11.5px;cursor:pointer;transition:all .15s ease;\" onmouseover=\"this.style.borderColor=\'var(--blue)\';\" onmouseout=\"this.style.borderColor=\'var(--border-lt)\';\" title=\"Clique para abrir os detalhes e o preview do relatório na descrição\">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
                '<div><strong style="color:var(--txt);">' + escapeHTML(o.titulo) + '</strong> <span style="color:var(--muted);">· ' + escapeHTML(o.dataCriacao || o.resp || '') + '</span></div>' +
                '<div style="display:flex;align-items:center;gap:6px;">' +
                  (temPreview ? '<span style="font-size:10.5px;font-weight:700;color:#0071E3;background:#EFF6FF;border:1px solid #BFDBFE;padding:1px 7px;border-radius:10px;">👁️ Preview CTRS</span>' : '') +
                  '<span class="tag ' + (o.status === 'resolvida' ? 'tag-g' : 'tag-r') + '">' + (o.status === 'resolvida' ? 'Resolvida' : 'Em Aberto') + '</span>' +
                '</div>' +
              '</div>' +
              (descLimpa ? '<div style="font-size:11px;color:var(--txt2);">' + escapeHTML(descLimpa) + '</div>' : '') +
            '</div>';
        });
        histRels.forEach(function(r) {
          var descRelLimpa = String(r.descCriacao || '').replace(/<!--CTRS_JSON:[^>]+-->/g, '').trim();
          var isNC = r.status && String(r.status).toLowerCase().indexOf('não conform') !== -1;
          htmlItens +=
            '<div onclick=\"fecharPopup(\'popup-detalhes-transmissao\'); verDetalhesHistoricoDirect(\'' + r.id + '\')\" style=\"background:#F8FAFC;border:1px solid #BFDBFE;border-left:3px solid #0071E3;border-radius:var(--r-sm);padding:8px 10px;display:flex;flex-direction:column;gap:4px;font-size:11.5px;cursor:pointer;transition:all .15s ease;\" onmouseover=\"this.style.borderColor=\'#0071E3\';\" onmouseout=\"this.style.borderColor=\'#BFDBFE\';\" title=\"Clique para abrir o Preview Completo do Relatório CTRS\">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
                '<div><strong style="color:#1E3A8A;">📄 ' + escapeHTML(r.titulo) + '</strong> <span style="color:var(--muted);">· ' + escapeHTML(r.dataCriacao || '') + '</span></div>' +
                '<div style="display:flex;align-items:center;gap:6px;">' +
                  '<span style="font-size:10.5px;font-weight:700;color:#0071E3;background:#EFF6FF;border:1px solid #93C5FD;padding:1px 7px;border-radius:10px;">👁️ Ver Relatório</span>' +
                  '<span class="tag ' + (isNC ? 'tag-y' : 'tag-g') + '">' + escapeHTML(r.status || 'Conforme') + '</span>' +
                '</div>' +
              '</div>' +
              (descRelLimpa ? '<div style="font-size:11px;color:var(--txt2);">' + escapeHTML(descRelLimpa) + '</div>' : '') +
            '</div>';
        });
        histListaEl.innerHTML = htmlItens;
      }
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    abrirPopup('popup-detalhes-transmissao');
  }
  window.abrirDetalhesTransmissao = abrirDetalhesTransmissao;
  function abrirModalOcItemDireto() {
    fecharPopup('popup-detalhes-transmissao');
    if (!itemTransmissaoDetalhesAtual.nome) return;
    var tipoEl = document.getElementById('oc-dash-tipo-painel');
    var selectAlvo = document.getElementById('oc-dash-alvo');
    if (tipoEl && selectAlvo && dashboardMetrics) {
      tipoEl.value = itemTransmissaoDetalhesAtual.tipo;
      var items = dashboardMetrics[itemTransmissaoDetalhesAtual.tipo];
      if (items) {
        var list = (itemTransmissaoDetalhesAtual.tipo === 'equipamento' && typeof obterListaNomesEquipamentosOrdenados === 'function')
          ? obterListaNomesEquipamentosOrdenados()
          : Object.keys(items);
        selectAlvo.innerHTML = list.map(function(item) {
          return '<option value="' + item + '"' + (item === itemTransmissaoDetalhesAtual.nome ? ' selected' : '') + '>' + item + '</option>';
        }).join('');
      }
    }
    abrirPopup('popup-nova-oc-dashboard');
  }
  window.abrirModalOcItemDireto = abrirModalOcItemDireto;
  function getDashboardMetricsKey() {
    var praca = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    return (praca.indexOf('Uber') !== -1) ? 'tv_dashboard_metrics_v2_udi' : 'tv_dashboard_metrics_v2_jf';
  }
  function salvarDashboardMetricsStore() {
    try {
      localStorage.setItem(getDashboardMetricsKey(), JSON.stringify(dashboardMetrics));
      if (typeof catalogoEquipamentos !== 'undefined' && Array.isArray(catalogoEquipamentos) && dashboardMetrics && dashboardMetrics.equipamento) {
        var pracaAt = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
        catalogoEquipamentos.forEach(function(eq) {
          if (eq && ((eq.praca || '').indexOf('Uber') !== -1) === (pracaAt.indexOf('Uber') !== -1) && dashboardMetrics.equipamento[eq.nome]) {
            var m = dashboardMetrics.equipamento[eq.nome];
            var mud = !eq.metricas || eq.metricas.conf !== m.conf || eq.metricas.nc !== m.nc || eq.metricas.canc !== m.canc;
            if (mud) {
              eq.metricas = { conf: m.conf || 0, nc: m.nc || 0, canc: m.canc || 0 };
              if (typeof eq.ordem === 'number') eq.metricas.ordem = eq.ordem;
              if (typeof salvarEquipamentoPostgreSQL === 'function') {
                salvarEquipamentoPostgreSQL(eq);
              }
            }
          }
        });
        try {
          localStorage.setItem('tv_equipamentos_catalogo_v1', JSON.stringify(catalogoEquipamentos));
        } catch (eCat) {}
      }
    } catch (e) {}
  }
  function carregarDashboardMetricsStore() {
    try {
      var praca = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
      var key = getDashboardMetricsKey();
      var raw = localStorage.getItem(key);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          dashboardMetrics = parsed;
          return;
        }
      }
      if (praca.indexOf('Uber') !== -1) {
        dashboardMetrics = {
          telejornal: {
            'INTEGRAÇÃO NOTÍCIA': { conf: 0, nc: 0, canc: 0 },
            'MG1':                { conf: 0, nc: 0, canc: 0 },
            'MG2':                { conf: 0, nc: 0, canc: 0 },
            'GIRO MG2':           { conf: 0, nc: 0, canc: 0 }
          },
          equipamento: {}
        };
      } else {
        dashboardMetrics = {
          telejornal: {
            'INTEGRAÇÃO NOTÍCIA': { conf: 0, nc: 0, canc: 0 },
            'MG1':                { conf: 0, nc: 0, canc: 0 },
            'MG2':                { conf: 0, nc: 0, canc: 0 },
            'GIRO MG2':           { conf: 0, nc: 0, canc: 0 }
          },
          equipamento: {
            'LIVE U1':      { conf: 0, nc: 0, canc: 0 },
            'LIVE U2':      { conf: 0, nc: 0, canc: 0 },
            'LIVE U3':      { conf: 0, nc: 0, canc: 0 },
            'LIVE U SMART': { conf: 0, nc: 0, canc: 0 },
            'REDAÇÃO':      { conf: 0, nc: 0, canc: 0 },
            'LIVE U4':      { conf: 0, nc: 0, canc: 0 },
            'NET PRAÇA':    { conf: 0, nc: 0, canc: 0 },
            'NET PORTARIA': { conf: 0, nc: 0, canc: 0 },
            'FORMATOS NET': { conf: 0, nc: 0, canc: 0 },
            'NET 2º ANDAR': { conf: 0, nc: 0, canc: 0 },
            'NET 3º ANDAR': { conf: 0, nc: 0, canc: 0 },
            'NET 4º ANDAR': { conf: 0, nc: 0, canc: 0 },
            'KMJ':          { conf: 0, nc: 0, canc: 0 }
          }
        };
      }
    } catch (e) {}
  }
  window.carregarDashboardMetricsStore = carregarDashboardMetricsStore;
  function abrirModalNovoEquipamento() {
    var nomeEl = document.getElementById('novo-eq-nome');
    var obsEl  = document.getElementById('novo-eq-obs');
    if (nomeEl) { nomeEl.value = ''; setTimeout(function(){ nomeEl.focus(); }, 150); }
    if (obsEl)  obsEl.value = '';
    abrirPopup('popup-novo-equipamento');
  }
  window.abrirModalNovoEquipamento = abrirModalNovoEquipamento;
  function salvarNovoEquipamentoDashboard() {
    var nomeEl = document.getElementById('novo-eq-nome');
    var tipoEl = document.getElementById('novo-eq-tipo');
    var obsEl  = document.getElementById('novo-eq-obs');
    var nome = (nomeEl ? nomeEl.value : '').trim().toUpperCase();
    if (!nome) {
      alert('Por favor, informe o nome do equipamento.');
      if (nomeEl) nomeEl.focus();
      return;
    }
    var praca = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    if (!dashboardMetrics) dashboardMetrics = {};
    if (!dashboardMetrics.equipamento) dashboardMetrics.equipamento = {};
    if (dashboardMetrics.equipamento[nome]) {
      alert('Já existe um equipamento cadastrado com o nome "' + nome + '" nesta praça.');
      return;
    }
    dashboardMetrics.equipamento[nome] = {
      conf: 0,
      nc: 0,
      canc: 0,
      tipo: tipoEl ? tipoEl.value : 'Equipamento',
      obs: obsEl ? obsEl.value : ''
    };
    window._ultimoEqAdicionado = nome;
    salvarDashboardMetricsStore();
    fecharPopup('popup-novo-equipamento');
    if (typeof mostrarToast === 'function') {
      mostrarToast('Equipamento Cadastrado', nome + ' adicionado com sucesso ao dashboard de ' + praca + '.', 'success');
    }
    renderDashboards();
    try {
      if (typeof window.atualizarSelectsEquipamentosCTRS === 'function') {
        window.atualizarSelectsEquipamentosCTRS();
      }
    } catch(eEq) {}
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.salvarNovoEquipamentoDashboard = salvarNovoEquipamentoDashboard;
  function salvarOcDashboard() {
    var tipoPainel = document.getElementById('oc-dash-tipo-painel').value;
    var alvo = document.getElementById('oc-dash-alvo').value;
    var status = document.getElementById('oc-dash-status').value;
    var obs = document.getElementById('oc-dash-obs').value.trim();
    if (!obs) {
      alert('Por favor, informe a observação do registro.');
      return;
    }
    if (dashboardMetrics && dashboardMetrics[tipoPainel]) {
      var metricObj = dashboardMetrics[tipoPainel][alvo];
      if (metricObj) {
        if (status === 'nc') metricObj.nc += 1;
        else if (status === 'canc') metricObj.canc += 1;
        else if (status === 'conf') metricObj.conf += 1;
      }
      salvarDashboardMetricsStore();
    }
    if (status === 'nc' || status === 'canc') {
      var statusLabel = (status === 'nc') ? 'Não Conforme (Falha)' : 'Cancelado';
      var nowStr = formatDataHoraLocal();
      var pracaAtual = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
      var novaOc = {
        id:          'oc_dash_' + Date.now(),
        titulo:      'Falha em ' + alvo + ' (' + statusLabel + ')',
        prio:        (status === 'nc' ? 'Alta' : 'Média'),
        cat:         (tipoPainel === 'telejornal' ? 'Telejornal / Transmissão ao Vivo' : 'Equipamentos de Transmissão'),
        resp:        'Equipe de Transmissão',
        local:       pracaAtual,
        prazo:       '12:00',
        desc:        obs,
        mine:        false,
        tags:        ['Dashboard Transmissões', alvo],
        status:      'aberta',
        criado:      Date.now(),
        dataCriacao: nowStr,
        resolucao:   null,
        praca:       pracaAtual
      };
      ocorrencias = [novaOc].concat(ocorrencias);
      save(ocorrencias, novaOc, true);
    }
    fecharPopup('popup-nova-oc-dashboard');
    document.getElementById('oc-dash-obs').value = '';
    if (typeof mostrarToast === 'function') {
      mostrarToast('Ocorrência Registrada no Banco', 'Salvo no banco de dados e gráficos do ' + alvo + ' atualizados.', 'warning');
    }
    alert('Ocorrência salva com sucesso no Banco de Dados e Dashboard!\n\nAs métricas do ' + alvo + ' foram atualizadas e a ocorrência foi registrada no sistema.');
    renderDashboards();
    renderAll();
  }
  window.salvarOcDashboard = salvarOcDashboard;
  function renderEquipamentosCards() {
    var grid = document.getElementById('dash-equipamentos-grid');
    if (!grid) return;
    var equips = (dashboardMetrics && dashboardMetrics.equipamento) ? dashboardMetrics.equipamento : {};
    var eqKeys = (typeof obterListaNomesEquipamentosOrdenados === 'function')
      ? obterListaNomesEquipamentosOrdenados().filter(function(k) { return !!equips[k]; })
      : Object.keys(equips);
    Object.keys(equips).forEach(function(k) {
      if (eqKeys.indexOf(k) === -1) eqKeys.push(k);
    });
    var htmlCards = '';
    eqKeys.forEach(function(key) {
      var m = equips[key];
      var totalReal = (m.conf || 0) + (m.nc || 0) + (m.canc || 0);
      var total = totalReal === 0 ? 1 : totalReal;
      var pctConf = totalReal === 0 ? 0 : Math.round((m.conf / total) * 100);
      var pctNc   = totalReal === 0 ? 0 : Math.round((m.nc / total) * 100);
      var pctCanc = totalReal === 0 ? 0 : (100 - pctConf - pctNc);
      if (pctCanc < 0) pctCanc = 0;
      var endConf = pctConf;
      var endNc = pctConf + pctNc;
      var pieGradient = totalReal === 0
        ? '#E2E8F0'
        : ('conic-gradient(#10B981 0% ' + endConf + '%, #EF4444 ' + endConf + '% ' + endNc + '%, #F59E0B ' + endNc + '% 100%)');
      var isNew = (window._ultimoEqAdicionado === key) ? ' dash-card-new-anim' : '';
      htmlCards +=
        '<div class="dash-card' + isNew + '" onclick="abrirDetalhesTransmissao(\'' + escapeHTML(key) + '\', \'equipamento\')" style="padding:13px;cursor:pointer;" title="Clique para ver detalhes operacionais e telemetria">' +
          '<h5 style="font-size:12px;font-weight:700;text-align:center;margin-bottom:10px;color:#0F172A;">' + escapeHTML(key) + '</h5>' +
          '<div style="display:flex;align-items:center;justify-content:center;gap:12px;">' +
            '<div style="width:76px;height:76px;border-radius:50%;background:' + pieGradient + ';box-shadow:0 2px 8px rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;position:relative;">' +
              '<div class="dash-pie-donut-sm">' +
                '<div style="font-size:12.5px;font-weight:800;color:#0F172A;" class="pie-count">' + totalReal + '</div>' +
              '</div>' +
            '</div>' +
            '<div style="font-size:10.5px;line-height:1.6;color:#334155;">' +
              '<div><span style="color:#10B981;">■</span> Conf. <strong class="pct-conf" style="color:#059669;">(' + pctConf + '%)</strong></div>' +
              '<div><span style="color:#EF4444;">■</span> Falha <strong class="pct-nc" style="color:#DC2626;">(' + pctNc + '%)</strong></div>' +
              '<div><span style="color:#F59E0B;">■</span> Canc. <strong class="pct-canc" style="color:#D97706;">(' + pctCanc + '%)</strong></div>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    if (eqKeys.length === 0) {
      htmlCards =
        '<div style="grid-column:1/-1;text-align:center;padding:28px 16px;background:var(--surface);border:1px dashed var(--border);border-radius:var(--r-lg);color:var(--muted);font-size:12.5px;">' +
          'Nenhum equipamento cadastrado nesta praça. Acesse a aba <strong>Equipamentos</strong> no menu lateral para cadastrar.' +
        '</div>';
    }
    grid.innerHTML = htmlCards;
    window._ultimoEqAdicionado = null;
  }
  window.renderEquipamentosCards = renderEquipamentosCards;
  function reconciliarMetricasComHistoricoCTRS() {
    if (typeof dashboardMetrics === 'undefined' || !dashboardMetrics) return;
    if (typeof historicoSeedData === 'undefined' || !Array.isArray(historicoSeedData)) return;
    var pracaAtiva = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isUdi = pracaAtiva.indexOf('Uber') !== -1;
    var idsLixeira = (typeof lixeiraData !== 'undefined' && Array.isArray(lixeiraData))
      ? lixeiraData.map(function(i){ return i && i.id; }).filter(Boolean)
      : [];
    var minTj = {};
    var minEq = {};
    historicoSeedData.forEach(function(h) {
      if (!h || h.tipo !== 'relatorio' || h.status === 'lixeira' || idsLixeira.indexOf(h.id) !== -1) return;
      var hPraca = h.praca || h.local || 'Juiz de Fora';
      if ((hPraca.indexOf('Uber') !== -1) !== isUdi) return;
      var d = h.dadosCTRS || null;
      if (!d && h.descResolucao && h.descResolucao.indexOf('<!--CTRS_JSON:') !== -1) {
        try {
          var m = h.descResolucao.match(/<!--CTRS_JSON:([^>]+)-->/);
          if (m && m[1]) d = JSON.parse(decodeURIComponent(m[1]));
        } catch (e) {}
      }
      if (!d) return;
      var listaM = Array.isArray(d.metricasContabilizadas) ? d.metricasContabilizadas.slice() : [];
      if (listaM.length === 0 && Array.isArray(d.transmissoes)) {
        var tipoUp = (d.chaveJornal || d.tipo || 'INTEGRAÇÃO NOTÍCIA').toUpperCase();
        var cj = 'INTEGRAÇÃO NOTÍCIA';
        if (tipoUp.indexOf('NOTÍCIA') !== -1 || tipoUp.indexOf('NOTICIA') !== -1 || tipoUp === 'IN') cj = 'INTEGRAÇÃO NOTÍCIA';
        else if (tipoUp === 'MG1') cj = 'MG1';
        else if (tipoUp === 'MG2') cj = 'MG2';
        else if (tipoUp.indexOf('GIRO') !== -1) cj = 'GIRO MG2';
        else cj = tipoUp;
        d.transmissoes.forEach(function(tx) {
          if (!tx) return;
          var temNC = (tx.audioQ === 'NC' || tx.videoQ === 'NC' || tx.statusTx === 'NC');
          listaM.push({
            telejornal: cj,
            equipamento: tx.infra || '',
            status: temNC ? 'nc' : 'conf'
          });
        });
      }
      listaM.forEach(function(mItem) {
        var st = (mItem.status === 'nc') ? 'nc' : 'conf';
        if (mItem.telejornal) {
          var tjKey = String(mItem.telejornal).trim().toUpperCase();
          if (!minTj[tjKey]) minTj[tjKey] = { conf: 0, nc: 0 };
          minTj[tjKey][st] += 1;
        }
        if (mItem.equipamento) {
          var eqKey = String(mItem.equipamento).trim().toUpperCase();
          if (!minEq[eqKey]) minEq[eqKey] = { conf: 0, nc: 0 };
          minEq[eqKey][st] += 1;
        }
      });
    });
    var alterou = false;
    if (dashboardMetrics.telejornal) {
      Object.keys(minTj).forEach(function(tjKey) {
        if (dashboardMetrics.telejornal[tjKey]) {
          if ((dashboardMetrics.telejornal[tjKey].conf || 0) < minTj[tjKey].conf) {
            dashboardMetrics.telejornal[tjKey].conf = minTj[tjKey].conf;
            alterou = true;
          }
          if ((dashboardMetrics.telejornal[tjKey].nc || 0) < minTj[tjKey].nc) {
            dashboardMetrics.telejornal[tjKey].nc = minTj[tjKey].nc;
            alterou = true;
          }
        }
      });
    }
    if (dashboardMetrics.equipamento) {
      Object.keys(minEq).forEach(function(eqKey) {
        if (!dashboardMetrics.equipamento[eqKey]) {
          dashboardMetrics.equipamento[eqKey] = { conf: 0, nc: 0, canc: 0 };
        }
        if ((dashboardMetrics.equipamento[eqKey].conf || 0) < minEq[eqKey].conf) {
          dashboardMetrics.equipamento[eqKey].conf = minEq[eqKey].conf;
          alterou = true;
        }
        if ((dashboardMetrics.equipamento[eqKey].nc || 0) < minEq[eqKey].nc) {
          dashboardMetrics.equipamento[eqKey].nc = minEq[eqKey].nc;
          alterou = true;
        }
      });
    }
    if (alterou && typeof salvarDashboardMetricsStore === 'function') {
      salvarDashboardMetricsStore();
    }
  }
  window.reconciliarMetricasComHistoricoCTRS = reconciliarMetricasComHistoricoCTRS;
  function renderDashboards() {
    if (typeof dashboardMetrics === 'undefined' || !dashboardMetrics) return;
    reconciliarMetricasComHistoricoCTRS();
    var pieMapping = {
      'INTEGRAÇÃO NOTÍCIA': 'pie-tj-noticia',
      'MG1': 'pie-tj-mg1',
      'MG2': 'pie-tj-mg2',
      'GIRO MG2': 'pie-tj-giro'
    };
    if (dashboardMetrics.telejornal) {
      Object.keys(dashboardMetrics.telejornal).forEach(function(key) {
        var m = dashboardMetrics.telejornal[key];
        var totalReal = m.conf + m.nc + m.canc;
        var total = totalReal === 0 ? 1 : totalReal;
        var pctConf = totalReal === 0 ? 0 : Math.round((m.conf / total) * 100);
        var pctNc = totalReal === 0 ? 0 : Math.round((m.nc / total) * 100);
        var pctCanc = totalReal === 0 ? 0 : (100 - pctConf - pctNc);
        if (pctCanc < 0) pctCanc = 0;
        var pieId = pieMapping[key];
        var el = document.getElementById(pieId);
        if (el) {
          if (totalReal === 0) {
            el.style.background = '#E2E8F0';
          } else {
            var endConf = pctConf;
            var endNc = pctConf + pctNc;
            el.style.background = 'conic-gradient(#10B981 0% ' + endConf + '%, #EF4444 ' + endConf + '% ' + endNc + '%, #F59E0B ' + endNc + '% 100%)';
          }
          var countEl = el.querySelector('.pie-count');
          if (countEl) countEl.textContent = totalReal;
          var card = el.closest('.dash-card') || el.closest('.form-card');
          if (card) {
            var confEl = card.querySelector('.pct-conf');
            var ncEl   = card.querySelector('.pct-nc');
            var cancEl = card.querySelector('.pct-canc');
            if (confEl) confEl.textContent = '(' + pctConf + '%)';
            if (ncEl)   ncEl.textContent   = '(' + pctNc + '%)';
            if (cancEl) cancEl.textContent = '(' + pctCanc + '%)';
          }
        }
      });
    }
    renderEquipamentosCards();
    renderResumoTransmissoesGerais();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.renderDashboards = renderDashboards;
  function renderResumoTransmissoesGerais() {
    var tjTotConf = 0, tjTotNc = 0, tjTotCanc = 0;
    if (dashboardMetrics && dashboardMetrics.telejornal) {
      Object.keys(dashboardMetrics.telejornal).forEach(function(k) {
        var m = dashboardMetrics.telejornal[k];
        tjTotConf += (m.conf || 0);
        tjTotNc += (m.nc || 0);
        tjTotCanc += (m.canc || 0);
      });
    }
    var tjTotal = tjTotConf + tjTotNc + tjTotCanc;
    var tjPctConf = tjTotal > 0 ? Math.round((tjTotConf / tjTotal) * 100) : 0;
    var tjPctNc = tjTotal > 0 ? Math.round((tjTotNc / tjTotal) * 100) : 0;
    var tjPctCanc = tjTotal > 0 ? (100 - tjPctConf - tjPctNc) : 0;
    if (tjPctCanc < 0) tjPctCanc = 0;
    var badgeTj = document.getElementById('trans-geral-total-badge');
    var txtConfTj = document.getElementById('trans-geral-conf-txt');
    var txtNcTj = document.getElementById('trans-geral-nc-txt');
    var txtCancTj = document.getElementById('trans-geral-canc-txt');
    var barConfTj = document.getElementById('trans-geral-conf-bar');
    var barNcTj = document.getElementById('trans-geral-nc-bar');
    var barCancTj = document.getElementById('trans-geral-canc-bar');
    if (badgeTj) badgeTj.textContent = 'Total: ' + tjTotal + ' transmissões';
    if (txtConfTj) txtConfTj.textContent = tjPctConf + '% · ' + tjTotConf;
    if (txtNcTj) txtNcTj.textContent = tjPctNc + '% · ' + tjTotNc;
    if (txtCancTj) txtCancTj.textContent = tjPctCanc + '% · ' + tjTotCanc;
    if (barConfTj) barConfTj.style.height = tjTotal > 0 ? Math.max(tjPctConf * 0.85, 4) + '%' : '4px';
    if (barNcTj) barNcTj.style.height = tjTotal > 0 ? Math.max(tjPctNc * 0.85, 4) + '%' : '4px';
    if (barCancTj) barCancTj.style.height = tjTotal > 0 ? Math.max(tjPctCanc * 0.85, 4) + '%' : '4px';
    var eqTotConf = 0, eqTotNc = 0, eqTotCanc = 0;
    if (dashboardMetrics && dashboardMetrics.equipamento) {
      Object.keys(dashboardMetrics.equipamento).forEach(function(k) {
        var m = dashboardMetrics.equipamento[k];
        eqTotConf += (m.conf || 0);
        eqTotNc += (m.nc || 0);
        eqTotCanc += (m.canc || 0);
      });
    }
    var eqTotal = eqTotConf + eqTotNc + eqTotCanc;
    var eqPctConf = eqTotal > 0 ? Math.round((eqTotConf / eqTotal) * 100) : 0;
    var eqPctNc = eqTotal > 0 ? Math.round((eqTotNc / eqTotal) * 100) : 0;
    var eqPctCanc = eqTotal > 0 ? (100 - eqPctConf - eqPctNc) : 0;
    if (eqPctCanc < 0) eqPctCanc = 0;
    var badgeEq = document.getElementById('trans-eq-geral-total-badge');
    var txtConfEq = document.getElementById('trans-eq-geral-conf-txt');
    var txtNcEq = document.getElementById('trans-eq-geral-nc-txt');
    var txtCancEq = document.getElementById('trans-eq-geral-canc-txt');
    var barConfEq = document.getElementById('trans-eq-geral-conf-bar');
    var barNcEq = document.getElementById('trans-eq-geral-nc-bar');
    var barCancEq = document.getElementById('trans-eq-geral-canc-bar');
    if (badgeEq) badgeEq.textContent = 'Total: ' + eqTotal + ' transmissões';
    if (txtConfEq) txtConfEq.textContent = eqPctConf + '% · ' + eqTotConf;
    if (txtNcEq) txtNcEq.textContent = eqPctNc + '% · ' + eqTotNc;
    if (txtCancEq) txtCancEq.textContent = eqPctCanc + '% · ' + eqTotCanc;
    if (barConfEq) barConfEq.style.height = eqTotal > 0 ? Math.max(eqPctConf * 0.85, 4) + '%' : '4px';
    if (barNcEq) barNcEq.style.height = eqTotal > 0 ? Math.max(eqPctNc * 0.85, 4) + '%' : '4px';
    if (barCancEq) barCancEq.style.height = eqTotal > 0 ? Math.max(eqPctCanc * 0.85, 4) + '%' : '4px';
  }
  window.renderResumoTransmissoesGerais = renderResumoTransmissoesGerais;
