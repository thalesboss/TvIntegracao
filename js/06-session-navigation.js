  function markDone(id, el) {
    var item = document.getElementById(id);
    if (item && el) item.classList.toggle('done', el.checked);
  }
  window.markDone = markDone;
  function confirmarLogout() {
    var obs = document.getElementById('obs-logout');
    fecharPopup('popup-logout');
    if (obs) obs.value = '';
    loginTime = Date.now();
    try {
      localStorage.removeItem(USER_NAME_STORAGE_KEY);
    } catch(e) {}
    if (typeof atualizarNomeOperadorUI === 'function') {
      atualizarNomeOperadorUI('Operador', false);
    }
    if (typeof mostrarToast === 'function') {
      mostrarToast('Sessão Encerrada', 'Turno finalizado com sucesso. Identifique o próximo operador.', 'info');
    }
    fecharPopup('popup-entrada');
    var identEmail = document.getElementById('ident-operador-email');
    if (identEmail) identEmail.value = '';
    var identInput = document.getElementById('ident-operador-nome');
    if (identInput) {
      identInput.value = '';
    }
    var chaveInput = document.getElementById('ident-chave-acesso');
    if (chaveInput) {
      chaveInput.value = '';
    }
    if (typeof resetarFluxoEmailIdentificacao === 'function') {
      resetarFluxoEmailIdentificacao();
    }
    if (typeof atualizarUIIdentificacaoOperador === 'function') {
      atualizarUIIdentificacaoOperador();
    }
    abrirPopup('popup-identificacao-operador');
    setTimeout(function() {
      if (identEmail && identEmail.offsetParent !== null) identEmail.focus();
      else if (identInput) identInput.focus();
    }, 150);
  }
  window.confirmarLogout = confirmarLogout;
  var loginTime = Date.now();
  function pad(n) { return n < 10 ? '0' + n : n; }
  function getTempoLogadoStr() {
    var diff = Math.floor((Date.now() - loginTime) / 1000);
    if (diff < 0) diff = 0;
    var h = Math.floor(diff / 3600);
    var m = Math.floor((diff % 3600) / 60);
    var s = diff % 60;
    return pad(h) + 'h ' + pad(m) + 'm ' + pad(s) + 's';
  }
  function atualizarTimerLogin() {
    try {
      var timeStr = getTempoLogadoStr();
      var upTimer = document.getElementById('up-timer');
      if (upTimer) upTimer.textContent = timeStr;
      var pageChip = document.getElementById('page-chip');
      var activePage = document.querySelector('.page.active');
      if (pageChip && activePage && activePage.id === 'page-dashboard') {
        pageChip.textContent = 'Logado há: ' + timeStr;
      }
    } catch(err) {
      console.warn('Erro ao atualizar timer de login:', err);
    }
  }
  setInterval(atualizarTimerLogin, 1000);
  atualizarTimerLogin();
  function toggleUserPopover(e) {
    if (e) e.stopPropagation();
    var popover = document.getElementById('user-popover');
    if (!popover) return;
    var isHidden = popover.hasAttribute('hidden');
    if (isHidden) {
      popover.removeAttribute('hidden');
      atualizarTimerLogin();
    } else {
      popover.setAttribute('hidden', '');
    }
  }
  window.toggleUserPopover = toggleUserPopover;
  document.addEventListener('click', function(e) {
    var popover = document.getElementById('user-popover');
    var userBlock = document.getElementById('s-user-block');
    if (popover && !popover.hasAttribute('hidden')) {
      if (!popover.contains(e.target) && (!userBlock || !userBlock.contains(e.target))) {
        popover.setAttribute('hidden', '');
      }
    }
  });
  var pageMap = {
    recebimento:  { page:'page-recebimento',  title:'Recebimento de Materiais',                 chip:'Registro patrimonial e anexo de fotos/vídeos' },
    recebimento1: { page:'page-recebimento',  title:'Recebimento de Materiais',                 chip:'Registro patrimonial e anexo de fotos/vídeos' },
    recebimento2: { page:'page-recebimento',  title:'Recebimento de Materiais',                 chip:'Registro patrimonial e anexo de fotos/vídeos' },
    dashboard:    { page:'page-dashboard',    title:'Ocorrências',                              chip: function() { return 'Logado há: ' + getTempoLogadoStr(); } },
    checklist:    { page:'page-checklist',    title:'Rotinas & Lembretes',                      chip:'Monitoramento preventivo e rotinas do turno' },
    ctrs:         { page:'page-ctrs',         title:'Relatório de Transmissões',                chip:'Preencher após cada jornal' },
    arquivados:   { page:'page-arquivados',   title:'Ocorrências Arquivadas',                   chip:'Verificação e acompanhamento do próximo turno' },
    historico:    { page:'page-historico',    title:'Histórico Geral de Registros',             chip:'Ocorrências, Relatórios e Recebimentos' },
    lixeira:      { page:'page-lixeira',      title:'Lixeira',                                  chip:'Itens excluídos retidos por 7 dias' },
    resolvidas:   { page:'page-resolvidas',   title:'Dashboard Ocorrências — Resolução & Desempenho (Power BI)', chip:'Dashboard de Métricas e Indicadores' },
    dashboard_ocorrencias:  { page:'page-resolvidas',             title:'Dashboard Ocorrências — Resolução & Desempenho (Power BI)', chip:'Dashboard de Métricas e Indicadores' },
    dashboard_transmissoes: { page:'page-dashboard-ocorrencias',  title:'Dashboard Transmissões — Transmissões ao Vivo',  chip:'Transmissões em Tempo Real' },
    compras_vendas:{ page:'page-compras-vendas', title:'Solicitação de Compras',                chip:'Preencher solicitação de compra' },
    orcamento:     { page:'page-orcamento',      title: 'Orçamento Anual', chip: function() { return 'Ciclo ' + (new Date().getFullYear() + 1); } },
    equipamentos:  { page:'page-equipamentos',   title:'Catálogo de Equipamentos & Ficha de Vida', chip:'Inventário técnico integrado ao PostgreSQL' },
    ronda:         { page:'page-ronda',          title:'Relatório Diário — Tecnologia UDI',        chip:'Ronda técnica de plantão e infraestrutura' },
    config:        { page:'page-config',         title:'Configurações',                            chip:'Perfil e preferências'      }
  };
  function irPara(name, el) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.s-btn').forEach(function(b) { b.classList.remove('active'); });
    var cfg = pageMap[name];
    if (!cfg) return;
    document.getElementById(cfg.page).classList.add('active');
    document.getElementById('page-title').textContent = cfg.title;
    var chipText = (typeof cfg.chip === 'function') ? cfg.chip() : cfg.chip;
    document.getElementById('page-chip').textContent  = chipText;
    if (el) el.classList.add('active');
    if (name === 'config') {
      try { carregarCredenciaisSupabaseConfig(); } catch(e) {}
      try { if (typeof atualizarUIStatusBancoConfig === 'function') atualizarUIStatusBancoConfig(); } catch(e) {}
    }
    if (name === 'ctrs' || name === 'relatorio') {
      var ctrsPraca = document.getElementById('ctrs-praca');
      if (ctrsPraca && typeof getPracaAtual === 'function') {
        ctrsPraca.value = getPracaAtual();
      }
      try { atualizarSelectsProfissionaisCTRS(); } catch(e) {}
      try { atualizarSelectsEquipamentosCTRS(); } catch(e) {}
    }
    if (name === 'ronda') {
      try {
        if (typeof carregarRascunhoRonda === 'function') carregarRascunhoRonda();
        if (typeof verificarNaoConformidadesRonda === 'function') verificarNaoConformidadesRonda();
      } catch(e) {}
    }
    if (name === 'orcamento') {
      try {
        if (typeof renderOrcamento === 'function') renderOrcamento();
        if (typeof sincronizarOrcamentoNuvem === 'function') sincronizarOrcamentoNuvem();
      } catch(e) {}
    }
    if (name === 'equipamentos') {
      try {
        if (typeof renderCatalogoEquipamentos === 'function') renderCatalogoEquipamentos();
        if (typeof sincronizarEquipamentosPostgreSQL === 'function') sincronizarEquipamentosPostgreSQL();
      } catch(e) {}
    }
  }
  window.irPara = irPara;
  function togAcc(head) {
    var isOpen = head.classList.contains('open');
    head.classList.toggle('open', !isOpen);
    head.setAttribute('aria-expanded', String(!isOpen));
    head.nextElementSibling.classList.toggle('open', !isOpen);
  }
  window.togAcc = togAcc;
  function filtrar(elOrTipo, tipo) {
    var el = (elOrTipo && typeof elOrTipo === 'object' && elOrTipo.nodeType) ? elOrTipo : null;
    var tipoFinal = typeof elOrTipo === 'string' ? elOrTipo : tipo;
    if (el && typeof el.closest === 'function') {
      var pills = el.closest('.pills');
      if (pills) {
        pills.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('on'); });
        el.classList.add('on');
      }
    } else if (tipoFinal) {
      document.querySelectorAll('#page-dashboard .pills .pill').forEach(function(p) {
        var pText = p.textContent.trim().toLowerCase();
        if (pText === tipoFinal.toLowerCase() || (tipoFinal.toLowerCase() === 'todas' && pText === 'todas')) {
          p.classList.add('on');
        } else {
          p.classList.remove('on');
        }
      });
    }
    filtroOcorrenciasAtivo = (tipoFinal || (el ? el.textContent.trim().toLowerCase() : 'todas')).toLowerCase();
    renderCards();
  }
  window.filtrar = filtrar;
  var CHAVE_PRACA = 'tv_praca_ativa';
  function getPracaAtual() {
    try {
      var salval = localStorage.getItem(CHAVE_PRACA);
      if (salval && (salval === 'Juiz de Fora' || salval === 'Uberlândia' || salval === 'Uberlandia')) {
        return salval === 'Uberlandia' ? 'Uberlândia' : salval;
      }
    } catch(e) {}
    return 'Juiz de Fora';
  }
  window.getPracaAtual = getPracaAtual;
  function setPracaAtual(praca) {
    if (!praca) return;
    var norm = praca.indexOf('Uber') !== -1 ? 'Uberlândia' : 'Juiz de Fora';
    try {
      localStorage.setItem(CHAVE_PRACA, norm);
    } catch(e) {}
    aplicarModoPraca(norm);
  }
  window.setPracaAtual = setPracaAtual;
  function aplicarModoPraca(praca) {
    var p = praca || getPracaAtual();
    var isUberlandia = p.indexOf('Uber') !== -1;
    var nomeEl = document.getElementById('topbar-praca-nome');
    if (nomeEl) {
      nomeEl.textContent = isUberlandia ? 'Uberlândia' : 'Juiz de Fora';
    }
    var ctrsLabel = document.getElementById('sidebar-label-ctrs');
    if (ctrsLabel) {
      ctrsLabel.textContent = 'Relatório Transmissões';
    }
    if (pageMap && pageMap.ctrs) {
      pageMap.ctrs.title = isUberlandia ? 'Relatório de Transmissões' : 'Relatório de Transmissões (CTRS)';
      pageMap.ctrs.chip  = isUberlandia ? 'Preencher após cada transmissão / jornal' : 'Preencher após cada jornal';
    }
    var ctrsPageHeader = document.querySelector('#page-ctrs .sec-header h2');
    if (ctrsPageHeader) {
      ctrsPageHeader.textContent = isUberlandia ? 'Relatório de Transmissões' : 'Relatório de Transmissões (CTRS)';
    }
    var btnRec = document.getElementById('sidebar-btn-recebimento');
    if (btnRec) btnRec.style.display = isUberlandia ? 'none' : '';
    var btnRonda = document.getElementById('sidebar-btn-ronda');
    if (btnRonda) btnRonda.style.display = isUberlandia ? '' : 'none';
    var secCompras = document.getElementById('sidebar-section-compras') || document.getElementById('sidebar-section-recebimento');
    if (secCompras) {
      secCompras.style.display = '';
      secCompras.textContent = isUberlandia ? 'Compras & Orçamento' : 'Suprimentos & Compras';
    }
    var histPillRec = document.getElementById('hist-pill-recebimento');
    if (histPillRec) histPillRec.style.display = isUberlandia ? 'none' : '';
    if (isUberlandia && typeof historicoFiltroCategoria !== 'undefined' && historicoFiltroCategoria === 'recebimento') {
      if (typeof filtrarCategoriaHistorico === 'function') {
        var pillTodos = document.querySelector('#hist-pills button[data-cat="todos"]');
        filtrarCategoriaHistorico('todos', pillTodos);
      }
    }
    var activePage = document.querySelector('.page.active');
    if (isUberlandia && activePage && activePage.id === 'page-recebimento') {
      irPara('dashboard');
    }
    if (!isUberlandia && activePage && activePage.id === 'page-ronda') {
      irPara('dashboard');
    }
    var cfgPraca = document.getElementById('cfg-praca');
    if (cfgPraca) cfgPraca.value = isUberlandia ? 'Uberlândia' : 'Juiz de Fora';
    var identPraca = document.getElementById('ident-operador-praca');
    if (identPraca) identPraca.value = isUberlandia ? 'Uberlândia' : 'Juiz de Fora';
    var ctrsPraca = document.getElementById('ctrs-praca');
    if (ctrsPraca) ctrsPraca.value = isUberlandia ? 'Uberlândia' : 'Juiz de Fora';
    var reqPraca = document.getElementById('req-praca');
    if (reqPraca) reqPraca.value = isUberlandia ? 'Uberlândia' : 'Juiz de Fora';
    var orcPraca = document.getElementById('orc-modal-praca');
    if (orcPraca) orcPraca.value = isUberlandia ? 'Uberlândia' : 'Juiz de Fora';
    var dashTransPraca = document.getElementById('dash-trans-praca');
    if (dashTransPraca) dashTransPraca.textContent = p;
    var dashResolvidasPraca = document.getElementById('dash-resolvidas-praca');
    if (dashResolvidasPraca) dashResolvidasPraca.textContent = p;
    var upPraca = document.getElementById('up-praca');
    if (upPraca) upPraca.textContent = p;
    try {
      if (typeof window.atualizarSelectsEquipamentosCTRS === 'function') {
        window.atualizarSelectsEquipamentosCTRS();
      }
    } catch(eEq) {}
    try {
      if (Array.isArray(window.ocorrencias) && typeof sanitizeOcorrencia === 'function') {
        window.ocorrencias = window.ocorrencias.map(sanitizeOcorrencia).filter(Boolean);
      }
    } catch(eSan) {}
    try {
      if (typeof window.carregarDashboardMetricsStore === 'function') {
        window.carregarDashboardMetricsStore();
      }
      if (typeof window.sincronizarDashboardMetricsComCatalogo === 'function') {
        window.sincronizarDashboardMetricsComCatalogo();
      }
      if (typeof window.renderCatalogoEquipamentos === 'function') {
        window.renderCatalogoEquipamentos();
      }
      if (typeof window.renderAll === 'function') {
        window.renderAll(true);
      } else {
        if (typeof window.renderDashboards === 'function') window.renderDashboards();
        if (typeof window.renderCards === 'function') window.renderCards();
        if (typeof window.renderHistorico === 'function') window.renderHistorico();
        if (typeof window.renderArquivados === 'function') window.renderArquivados();
        if (typeof window.renderOrcamento === 'function') window.renderOrcamento();
        if (typeof window.updateStats === 'function') window.updateStats();
      }
      if (typeof window.renderChecklist === 'function') {
        window.renderChecklist();
      }
      if (typeof window.atualizarBadgesNotificacoes === 'function') {
        window.atualizarBadgesNotificacoes();
      }
    } catch(e) {
      console.warn('Erro ao atualizar views após troca de praça:', e);
    }
  }
  window.aplicarModoPraca = aplicarModoPraca;
  function trocarPracaConfig(novaPraca) {
    setPracaAtual(novaPraca);
    if (typeof mostrarToast === 'function') {
      mostrarToast('Praça Alterada', 'Ambiente de trabalho alternado para ' + novaPraca + '. Dados isolados carregados.', 'info');
    }
  }
  window.trocarPracaConfig = trocarPracaConfig;
function gerarMapaSDFBevelLiquidGL(w, h, radiusPx, bevelWidth, bevelDepth, refraction) {
    var cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    var ctx = cv.getContext('2d');
    var img = ctx.createImageData(w, h);
    var data = img.data;
    var bx = 0.5 * w;
    var by = 0.5 * h;
    var bevelPx = bevelWidth * Math.min(w, h);
    var aspect = w / h;

    function smoothstep(e0, e1, x) {
      var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
      return t * t * (3 - 2 * t);
    }

    for (var y = 0; y < h; y++) {
      var uvY = (y + 0.5) / h;
      var py = (uvY - 0.5) * h;
      for (var x = 0; x < w; x++) {
        var uvX = (x + 0.5) / w;
        var px = (uvX - 0.5) * w;
        var mx = Math.max(Math.abs(px) - bx + radiusPx, 0);
        var my = Math.max(Math.abs(py) - by + radiusPx, 0);
        var lenM = Math.hypot(mx, my);
        var d = -(lenM - radiusPx);
        var edge = 1.0 - smoothstep(0.0, bevelPx, d);
        var offsetAmt = edge * refraction + Math.pow(edge, 10.0) * bevelDepth;
        var pNormX = (uvX - 0.5) * aspect;
        var pNormY = uvY - 0.5;
        var pLen = Math.hypot(pNormX, pNormY);
        var centreBlend = smoothstep(0.15, 0.45, pLen);
        var fbLen = pLen > 1e-5 ? pLen : 1.0;
        var dirX = pNormX / fbLen;
        var dirY = pNormY / fbLen;
        if (lenM > 0) {
          var wCorner = smoothstep(0.0, Math.max(radiusPx * 0.5, 1.0), Math.min(mx, my));
          if (wCorner > 0) {
            var cx = (px < 0 ? -1.0 : 1.0) * (mx / lenM);
            var cy = (py < 0 ? -1.0 : 1.0) * (my / lenM);
            var mixX = dirX * (1 - wCorner) + cx * wCorner;
            var mixY = dirY * (1 - wCorner) + cy * wCorner;
            var mixLen = Math.hypot(mixX, mixY) || 1.0;
            dirX = mixX / mixLen;
            dirY = mixY / mixLen;
          }
        }
        var scaleNorm = offsetAmt * centreBlend / Math.max(bevelDepth + refraction, 0.001);
        var idx = (y * w + x) * 4;
        data[idx] = Math.round(Math.max(0, Math.min(255, 128 + dirX * scaleNorm * 127)));
        data[idx + 1] = Math.round(Math.max(0, Math.min(255, 128 + dirY * scaleNorm * 127)));
        data[idx + 2] = 128;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return cv.toDataURL('image/png');
  }

  function inicializarMapasLiquidGL() {
    try {
      var fePill = document.getElementById('liquidgl-map-pill');
      if (fePill) {
        var pillMapUrl = gerarMapaSDFBevelLiquidGL(192, 56, 28, 0.211, 0.052, 0.02);
        fePill.setAttribute('href', pillMapUrl);
        fePill.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', pillMapUrl);
      }
    } catch (e) {}
  }

  function posicionarGliderEmPills(pillsEl, animarStretch) {
    if (!pillsEl) return;
    var activePill = pillsEl.querySelector('.pill.on');
    var glider = pillsEl.querySelector('.expo-glass-glider');
    if (!activePill) {
      if (glider) glider.style.opacity = '0';
      return;
    }
    if (!glider) {
      glider = document.createElement('span');
      glider.className = 'expo-glass-glider';
      glider.setAttribute('aria-hidden', 'true');
      pillsEl.insertBefore(glider, pillsEl.firstChild);
    }
    var w = activePill.offsetWidth;
    var x = activePill.offsetLeft;
    if (w <= 0) return;
    pillsEl.classList.add('has-glider');
    glider.style.opacity = '1';
    glider.style.width = w + 'px';
    if (animarStretch) {
      glider.classList.add('glider-moving');
      glider.style.transform = 'translate3d(' + x + 'px, 0, 0) scaleX(1.06) scaleY(1.12)';
      clearTimeout(glider._stretchTimer);
      glider._stretchTimer = setTimeout(function() {
        glider.style.transform = 'translate3d(' + x + 'px, 0, 0) scaleX(1) scaleY(1)';
        glider.classList.remove('glider-moving');
      }, 280);
    } else {
      glider.style.transform = 'translate3d(' + x + 'px, 0, 0) scaleX(1) scaleY(1)';
    }
  }

  function atualizarTodosGlidersPills(animarStretch) {
    var lista = document.querySelectorAll('.pills');
    for (var i = 0; i < lista.length; i++) {
      posicionarGliderEmPills(lista[i], animarStretch);
    }
  }
  window.atualizarTodosGlidersPills = atualizarTodosGlidersPills;

  var _lqglStartTime = Date.now();
  function atualizarLuzEspecularLiquidGL() {
    if (document.hidden) return;
    var uTime = (Date.now() - _lqglStartTime) / 1000;
    var root = document.documentElement.style;
    root.setProperty('--lqgl-lp1-x', ((Math.sin(uTime * 0.2) * 0.6 + 0.5) * 100).toFixed(1) + '%');
    root.setProperty('--lqgl-lp1-y', ((Math.cos(uTime * 0.3) * 0.6 + 0.5) * 100).toFixed(1) + '%');
    root.setProperty('--lqgl-lp2-x', ((Math.sin(uTime * -0.4 + 1.5) * 0.6 + 0.5) * 100).toFixed(1) + '%');
    root.setProperty('--lqgl-lp2-y', ((Math.cos(uTime * 0.25 - 0.5) * 0.6 + 0.5) * 100).toFixed(1) + '%');
  }
  setInterval(atualizarLuzEspecularLiquidGL, 90);

  var _activeDragPills = null;

  document.addEventListener('pointerdown', function(e) {
    var pillsEl = e.target && e.target.closest ? e.target.closest('.pills') : null;
    if (!pillsEl) return;
    _activeDragPills = pillsEl;
    var glider = pillsEl.querySelector('.expo-glass-glider');
    if (glider) glider.classList.add('glider-moving');
  });

  document.addEventListener('pointermove', function(e) {
    if (_activeDragPills) {
      var elUnder = document.elementFromPoint(e.clientX, e.clientY);
      var pillOver = elUnder && elUnder.closest ? elUnder.closest('.pill') : null;
      if (pillOver && _activeDragPills.contains(pillOver) && !pillOver.classList.contains('on')) {
        pillOver.click();
      }
    }
  }, { passive: true });

  document.addEventListener('pointerup', function() {
    if (_activeDragPills) {
      var p = _activeDragPills;
      _activeDragPills = null;
      posicionarGliderEmPills(p, false);
      var glider = p.querySelector('.expo-glass-glider');
      if (glider) glider.classList.remove('glider-moving');
    }
  });

  document.addEventListener('click', function(e) {
    var pillBtn = e.target && e.target.closest ? e.target.closest('.pill') : null;
    if (pillBtn) {
      var parentPills = pillBtn.closest('.pills');
      requestAnimationFrame(function() {
        posicionarGliderEmPills(parentPills, true);
      });
      return;
    }
    var navItem = e.target && e.target.closest ? e.target.closest('.s-item') : null;
    if (navItem) {
      setTimeout(function() { atualizarTodosGlidersPills(false); }, 40);
    }
  });

  window.addEventListener('resize', function() {
    atualizarTodosGlidersPills(false);
  });

  setTimeout(function() {
    inicializarMapasLiquidGL();
    atualizarLuzEspecularLiquidGL();
    atualizarTodosGlidersPills(false);
  }, 80);
