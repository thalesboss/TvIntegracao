  /* ═══════════════════════════════════════════
     POPUP ENTRADA
  /* ═══════════════════════════════════════════
     CHECKLIST LOGOUT
  ═══════════════════════════════════════════ */

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
    if (typeof mostrarToast === 'function') {
      mostrarToast('Turno Encerrado', 'Checklist de saída registrado e sessão encerrada com sucesso.', 'success');
    }
    var popEntrada = document.getElementById('popup-entrada');
    if (popEntrada) {
      var chk = document.getElementById('chk-entrada');
      if (chk) chk.checked = false;
      if (typeof toggleBtnIniciarSessao === 'function') {
        toggleBtnIniciarSessao(false);
      }
      abrirPopup('popup-entrada');
    }
  }
  window.confirmarLogout = confirmarLogout;

  /* ═══════════════════════════════════════════
     TIMER DE SESSÃO / TEMPO LOGADO
  ═══════════════════════════════════════════ */
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

  /* ═══════════════════════════════════════════
     USER POPOVER (popup sobre o nome)
  ═══════════════════════════════════════════ */
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

  /* ═══════════════════════════════════════════
     NAVEGAÇÃO
  ═══════════════════════════════════════════ */

  var pageMap = {
    recebimento:  { page:'page-recebimento',  title:'Recebimento de Materiais',                 chip:'Registro patrimonial e anexo de fotos/vídeos' },
    recebimento1: { page:'page-recebimento',  title:'Recebimento de Materiais',                 chip:'Registro patrimonial e anexo de fotos/vídeos' },
    recebimento2: { page:'page-recebimento',  title:'Recebimento de Materiais',                 chip:'Registro patrimonial e anexo de fotos/vídeos' },
    dashboard:    { page:'page-dashboard',    title:'Ocorrências',                              chip: function() { return 'Logado há: ' + getTempoLogadoStr(); } },
    checklist:    { page:'page-checklist',    title:'Checklist Diário & Rotinas',               chip:'Monitoramento preventivo e rotinas do turno' },
    ctrs:         { page:'page-ctrs',         title:'Checklist de Transmissão — CTRS',          chip:'Preencher após cada jornal' },
    arquivados:   { page:'page-arquivados',   title:'Ocorrências Arquivadas',                   chip:'Verificação e acompanhamento do próximo turno' },
    historico:    { page:'page-historico',    title:'Histórico Geral de Registros',             chip:'Ocorrências, Relatórios e Recebimentos' },
    lixeira:      { page:'page-lixeira',      title:'Lixeira',                                  chip:'Itens excluídos retidos por 7 dias' },
    resolvidas:   { page:'page-resolvidas',   title:'Dashboard Ocorrências — Resolução & Desempenho (Power BI)', chip:'Dashboard de Métricas e Indicadores' },
    dashboard_ocorrencias:  { page:'page-resolvidas',             title:'Dashboard Ocorrências — Resolução & Desempenho (Power BI)', chip:'Dashboard de Métricas e Indicadores' },
    dashboard_transmissoes: { page:'page-dashboard-ocorrencias',  title:'Dashboard Transmissões — Transmissões ao Vivo',  chip:'Juiz de Fora' },
    compras_vendas:{ page:'page-compras-vendas', title:'Solicitação de Compras',                chip:'Preencher solicitação de compra' },
    orcamento:     { page:'page-orcamento',      title: 'Orçamento Anual', chip: function() { return 'Ciclo ' + (new Date().getFullYear() + 1); } },
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
    }
  }
  window.irPara = irPara;

  /* ═══════════════════════════════════════════
     ACCORDION
  ═══════════════════════════════════════════ */

  function togAcc(head) {
    var isOpen = head.classList.contains('open');
    head.classList.toggle('open', !isOpen);
    head.setAttribute('aria-expanded', String(!isOpen));
    head.nextElementSibling.classList.toggle('open', !isOpen);
  }
  window.togAcc = togAcc;

  /* ═══════════════════════════════════════════
     FILTROS
  ═══════════════════════════════════════════ */

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
