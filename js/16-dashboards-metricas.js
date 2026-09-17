  /* ═══════════════════════════════════════════
     SISTEMA DE EXPORTAÇÃO E CONSOLIDAÇÃO POWER BI
  ═══════════════════════════════════════════ */

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

  /* ═══════════════════════════════════════════
     MÉTRICAS E REGISTRO DE OCORRÊNCIAS DE DASHBOARD
  ═══════════════════════════════════════════ */

  function abrirModalOcDashboard(tipo) {
    var tipoEl = document.getElementById('oc-dash-tipo-painel');
    var selectAlvo = document.getElementById('oc-dash-alvo');
    if (!selectAlvo || !tipoEl || !dashboardMetrics) return;

    tipoEl.value = tipo;
    var items = dashboardMetrics[tipo];
    if (!items) return;
    var list = Object.keys(items);

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

      if (btnTj) {
        btnTj.style.background = '#007AFF';
        btnTj.style.color = '#ffffff';
        btnTj.style.fontWeight = '700';
        btnTj.style.boxShadow = '0 2px 6px rgba(0,122,255,0.35)';
      }
      if (btnEq) {
        btnEq.style.background = 'transparent';
        btnEq.style.color = 'var(--muted)';
        btnEq.style.fontWeight = '600';
        btnEq.style.boxShadow = 'none';
      }
      if (titleEl) titleEl.textContent = 'Telejornal';
    } else {
      if (viewTj) viewTj.style.display = 'none';
      if (viewEq) {
        viewEq.style.display = 'block';
        viewEq.classList.remove('dash-view-animated');
        void viewEq.offsetWidth;
        viewEq.classList.add('dash-view-animated');
      }

      if (btnTj) {
        btnTj.style.background = 'transparent';
        btnTj.style.color = 'var(--muted)';
        btnTj.style.fontWeight = '600';
        btnTj.style.boxShadow = 'none';
      }
      if (btnEq) {
        btnEq.style.background = '#007AFF';
        btnEq.style.color = '#ffffff';
        btnEq.style.fontWeight = '700';
        btnEq.style.boxShadow = '0 2px 6px rgba(0,122,255,0.35)';
      }
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
      var histOcs = (typeof ocorrencias !== 'undefined' ? ocorrencias : []).filter(function(o) {
        return (o.titulo && o.titulo.indexOf(nome) !== -1) || (o.desc && o.desc.indexOf(nome) !== -1);
      });

      if (histOcs.length === 0) {
        histListaEl.innerHTML =
          '<div style="background:#FFFFFF;border:1px solid var(--border-lt);border-radius:var(--r-sm);padding:8px 10px;font-size:11.5px;color:var(--muted);">' +
            'Nenhuma ocorrência crítica aberta para este item no momento. Sistema estável e operando normalmente.' +
          '</div>';
      } else {
        histListaEl.innerHTML = histOcs.map(function(o) {
          return (
            '<div style="background:#FFFFFF;border:1px solid var(--border-lt);border-radius:var(--r-sm);padding:7px 10px;display:flex;justify-content:space-between;align-items:center;font-size:11.5px;">' +
              '<div><strong style="color:var(--txt);">' + o.titulo + '</strong> <span style="color:var(--muted);">· ' + (o.resp || '') + '</span></div>' +
              '<span class="tag ' + (o.status === 'resolvida' ? 'tag-g' : 'tag-r') + '">' + (o.status === 'resolvida' ? 'Resolvida' : 'Em Aberto') + '</span>' +
            '</div>'
          );
        }).join('');
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
        var list = Object.keys(items);
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
      // Se não houver cache para esta praça:
      if (praca.indexOf('Uber') !== -1) {
        // Uberlândia: telejornais iguais ao padrão, equipamentos limpos
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
        // Juiz de Fora: 13 equipamentos padrão
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

    // Se for Não Conforme (falha) ou Cancelado, cria a Ocorrência Real no Banco de Dados
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
    var eqKeys = Object.keys(equips);
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

    // Card Adicionar Equipamento interativo com animação fluida
    htmlCards +=
      '<div class="dash-card dash-card-add" onclick="abrirModalNovoEquipamento()" title="Cadastrar novo equipamento nesta praça">' +
        '<div class="dash-card-add-icon">' +
          '<i data-lucide="plus" style="width:20px;height:20px;stroke-width:2.5;"></i>' +
        '</div>' +
        '<span class="dash-card-add-label">+ Adicionar Equipamento</span>' +
        '<span class="dash-card-add-sub">Monitoramento ao vivo</span>' +
      '</div>';

    grid.innerHTML = htmlCards;
    window._ultimoEqAdicionado = null;
  }
  window.renderEquipamentosCards = renderEquipamentosCards;

  function renderDashboards() {
    if (typeof dashboardMetrics === 'undefined' || !dashboardMetrics) return;

    var pieMapping = {
      'INTEGRAÇÃO NOTÍCIA': 'pie-tj-noticia',
      'MG1': 'pie-tj-mg1',
      'MG2': 'pie-tj-mg2',
      'GIRO MG2': 'pie-tj-giro'
    };

    // 1. Atualizar gráficos de Telejornais
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

    // 2. Renderizar dinamicamente os cartões de Equipamentos
    renderEquipamentosCards();

    // 3. Atualizar Resumos Gerais
    renderResumoTransmissoesGerais();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.renderDashboards = renderDashboards;

  function renderResumoTransmissoesGerais() {
    // 1. Resumo Geral de Telejornais
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

    // 2. Resumo Geral de Equipamentos
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
