  function markDone(id, el) {
    var item = document.getElementById(id);
    if (item && el) item.classList.toggle('done', el.checked);
  }
  window.markDone = markDone;
  function confirmarLogout() {
    var obs = document.getElementById('obs-logout');
    fecharPopup('popup-logout');
    if (obs) obs.value = '';
    limparTurnoSessaoAtual();
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
    var chaveEstInput = document.getElementById('ident-chave-estacao-input');
    if (chaveEstInput) chaveEstInput.value = '';
    if (typeof resetarFluxoEmailIdentificacao === 'function') {
      resetarFluxoEmailIdentificacao();
    }
    if (typeof atualizarUIIdentificacaoOperador === 'function') {
      atualizarUIIdentificacaoOperador();
    }
    abrirPopup('popup-identificacao-operador');
    setTimeout(function() {
      if (identEmail && identEmail.offsetParent !== null) identEmail.focus();
    }, 150);
  }
  window.confirmarLogout = confirmarLogout;
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  var TURNO_ATUAL_STORAGE_KEY = 'tv_turno_ativo_v1';
  var TURNOS_OFICIAIS_TV = [
    { id: 'T1',     escala: 'semana',  codigo: '1',   horario: '00:00 ~ 03:00 / 03:15 ~ 06:15', inicioMin: 0,    fimMin: 375,  flexivel: false },
    { id: 'T2',     escala: 'semana',  codigo: '2',   horario: '06:00 ~ 09:00 / 09:15 ~ 12:15', inicioMin: 360,  fimMin: 735,  flexivel: false },
    { id: 'T2_AST', escala: 'semana',  codigo: '2*',  horario: '06:00 ~ 10:00 / 11:00 ~ 13:00', inicioMin: 360,  fimMin: 780,  flexivel: false },
    { id: 'T3_M',   escala: 'semana',  codigo: '3',   horario: '08:00 ~ 11:00 / 11:15 ~ 14:15', inicioMin: 480,  fimMin: 855,  flexivel: false },
    { id: 'T3_T',   escala: 'semana',  codigo: '3',   horario: '11:45 ~ 13:45 / 14:00 ~ 18:00', inicioMin: 705,  fimMin: 1080, flexivel: false },
    { id: 'T4',     escala: 'semana',  codigo: '4',   horario: '17:45 ~ 20:45 / 21:00 ~ 00:00', inicioMin: 1065, fimMin: 1440, flexivel: false },
    { id: 'A1',     escala: 'semana',  codigo: 'A1',  horario: '07:30 ~ 11:00 / 11:15 ~ 13:45', inicioMin: 450,  fimMin: 825,  flexivel: true, inicioPadrao: '07:30', p1Min: 210, intMin: 15, p2Min: 150 },
    { id: 'A2',     escala: 'semana',  codigo: 'A2',  horario: '13:45 ~ 16:45 / 17:00 ~ 20:00', inicioMin: 825,  fimMin: 1200, flexivel: true, inicioPadrao: '13:45', p1Min: 180, intMin: 15, p2Min: 180 },
    { id: 'PL1',    escala: 'plantao', codigo: 'PL1', horario: '00:00 ~ 05:00 / 06:00 ~ 08:00', inicioMin: 0,    fimMin: 480,  flexivel: false },
    { id: 'PL2',    escala: 'plantao', codigo: 'PL2', horario: '08:00 ~ 13:00 / 14:00 ~ 16:00', inicioMin: 480,  fimMin: 960,  flexivel: false },
    { id: 'PL3',    escala: 'plantao', codigo: 'PL3', horario: '16:00 ~ 20:00 / 21:00 ~ 00:00', inicioMin: 960,  fimMin: 1440, flexivel: false },
    { id: 'PA',     escala: 'plantao', codigo: 'PA',  horario: '11:00 ~ 13:30 / 14:30 ~ 20:00', inicioMin: 660,  fimMin: 1200, flexivel: false }
  ];
  var escalaTurnoEntradaAtiva = 'semana';
  var turnoSelecionadoEntradaId = 'T2';
  var horaEntradaFlexPorTurno = { A1: '07:30', A2: '13:45' };
  var turnoAtivoSessao = null;
  function getDateKeyHoje() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function ehFimDeSemanaHoje() {
    var dia = new Date().getDay();
    return dia === 0 || dia === 6;
  }
  function minutosParaHHMM(totalMin) {
    var mNorm = ((Math.round(totalMin) % 1440) + 1440) % 1440;
    return pad(Math.floor(mNorm / 60)) + ':' + pad(mNorm % 60);
  }
  function calcularFaixaHorarioFlexivel(turnoObj, horaEntradaStr) {
    if (!turnoObj) return '';
    if (!turnoObj.flexivel) return turnoObj.horario;
    var raw = String(horaEntradaStr || turnoObj.inicioPadrao || '').trim();
    var m = raw.match(/^(\d{1,2}):(\d{2})$/);
    var hh = m ? parseInt(m[1], 10) : parseInt(String(turnoObj.inicioPadrao || '07:30').split(':')[0], 10);
    var mm = m ? parseInt(m[2], 10) : parseInt(String(turnoObj.inicioPadrao || '07:30').split(':')[1], 10);
    if (isNaN(hh) || isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      return turnoObj.horario;
    }
    var mIni = hh * 60 + mm;
    var mP1Fim = mIni + (turnoObj.p1Min || 210);
    var mP2Ini = mP1Fim + (turnoObj.intMin || 15);
    var mFim = mP2Ini + (turnoObj.p2Min || 150);
    return minutosParaHHMM(mIni) + ' ~ ' + minutosParaHHMM(mP1Fim) + ' / ' + minutosParaHHMM(mP2Ini) + ' ~ ' + minutosParaHHMM(mFim);
  }
  function sugerirTurnoPorEscala(escala) {
    var lista = TURNOS_OFICIAIS_TV.filter(function(t) { return t.escala === escala; });
    if (lista.length === 0) return null;
    var agora = new Date();
    var nowMin = agora.getHours() * 60 + agora.getMinutes();
    var dentro = lista.filter(function(t) {
      return nowMin >= t.inicioMin && nowMin < t.fimMin;
    });
    if (dentro.length > 0) {
      dentro.sort(function(a, b) {
        if (!!a.flexivel !== !!b.flexivel) return a.flexivel ? 1 : -1;
        return Math.abs(nowMin - a.inicioMin) - Math.abs(nowMin - b.inicioMin);
      });
      return dentro[0];
    }
    var ordenado = lista.slice().sort(function(a, b) {
      return Math.abs(nowMin - a.inicioMin) - Math.abs(nowMin - b.inicioMin);
    });
    return ordenado[0];
  }
  function atualizarBoxTurnoFlexivel() {
    var boxEl = document.getElementById('entrada-turno-flex-box');
    var inputEl = document.getElementById('entrada-turno-flex-hora');
    var resumoEl = document.getElementById('entrada-turno-flex-resumo');
    if (!boxEl) return;
    var turnoObj = TURNOS_OFICIAIS_TV.find(function(t) { return t.id === turnoSelecionadoEntradaId; });
    if (!turnoObj || !turnoObj.flexivel) {
      boxEl.style.display = 'none';
      return;
    }
    var horaAtual = horaEntradaFlexPorTurno[turnoObj.id] || turnoObj.inicioPadrao || '07:30';
    boxEl.style.display = 'flex';
    if (inputEl && inputEl.value !== horaAtual) {
      inputEl.value = horaAtual;
    }
    if (resumoEl) {
      resumoEl.textContent = calcularFaixaHorarioFlexivel(turnoObj, horaAtual);
    }
  }
  function renderGridTurnosEntrada() {
    var sel = document.getElementById('entrada-turno-select');
    var grid = document.getElementById('entrada-turnos-grid');
    if (!sel && !grid) return;
    var lista = TURNOS_OFICIAIS_TV.filter(function(t) { return t.escala === escalaTurnoEntradaAtiva; });
    var atualValido = lista.some(function(t) { return t.id === turnoSelecionadoEntradaId; });
    if (!atualValido) {
      var sug = sugerirTurnoPorEscala(escalaTurnoEntradaAtiva);
      if (sug) turnoSelecionadoEntradaId = sug.id;
    }
    var agora = new Date();
    var nowMin = agora.getHours() * 60 + agora.getMinutes();
    var isPlantao = (escalaTurnoEntradaAtiva === 'plantao');
    if (sel) {
      sel.innerHTML = lista.map(function(t) {
        var ativo = (t.id === turnoSelecionadoEntradaId);
        var proximo = (nowMin >= (t.inicioMin - 30) && nowMin < t.fimMin);
        var horarioExibir = t.flexivel
          ? calcularFaixaHorarioFlexivel(t, horaEntradaFlexPorTurno[t.id] || t.inicioPadrao)
          : t.horario;
        var prefixo = isPlantao ? 'Plantão ' : 'Turno ';
        var sufixo = t.flexivel ? ' (Horário flexível)' : (proximo ? ' (Horário atual)' : '');
        return '<option value="' + t.id + '"' + (ativo ? ' selected' : '') + '>' + escapeHTML(prefixo + t.codigo + ' — ' + horarioExibir + sufixo) + '</option>';
      }).join('');
      if (turnoSelecionadoEntradaId) sel.value = turnoSelecionadoEntradaId;
      sel.style.borderColor = isPlantao ? '#FCA5A5' : 'var(--blue-border)';
    }
    if (grid) {
      grid.innerHTML = lista.map(function(t) {
        var ativo = (t.id === turnoSelecionadoEntradaId);
        var proximo = (nowMin >= (t.inicioMin - 30) && nowMin < t.fimMin);
        var horarioExibir = t.flexivel
          ? calcularFaixaHorarioFlexivel(t, horaEntradaFlexPorTurno[t.id] || t.inicioPadrao)
          : t.horario;
        var corAcento = isPlantao ? '#DC2626' : '#0071E3';
        var bgCard = ativo ? (isPlantao ? '#FEF2F2' : '#EFF6FF') : '#FFFFFF';
        var bdrCard = ativo ? ('2px solid ' + corAcento) : '1px solid #E2E8F0';
        var badgeBg = isPlantao
          ? (ativo ? '#DC2626' : '#FEE2E2')
          : (ativo ? '#0071E3' : '#DBEAFE');
        var badgeTxt = ativo ? '#FFFFFF' : (isPlantao ? '#B91C1C' : '#1D4ED8');
        var extras = '';
        if (t.flexivel) {
          extras += '<span style="font-size:9.5px;font-weight:700;padding:1px 6px;border-radius:999px;background:#EEF2FF;color:#4338CA;border:1px solid #C7D2FE;">Horário flexível</span>';
        } else if (proximo) {
          extras += '<span style="font-size:9.5px;font-weight:700;padding:1px 6px;border-radius:999px;background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;">Horário atual</span>';
        }
        return (
          '<button type="button" onclick="selecionarTurnoEntrada(\'' + t.id + '\')" style="text-align:left;padding:9px 11px;border-radius:10px;border:' + bdrCard + ';background:' + bgCard + ';cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.14s ease;width:100%;">' +
            '<span style="min-width:34px;height:28px;padding:0 7px;border-radius:7px;background:' + badgeBg + ';color:' + badgeTxt + ';font-size:12px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">' +
              escapeHTML(t.codigo) +
            '</span>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:4px;flex-wrap:wrap;">' +
                '<span style="font-size:11.5px;font-weight:700;color:#0F172A;" id="turno-card-hor-' + t.id + '">' + escapeHTML(horarioExibir) + '</span>' +
              '</div>' +
              (extras ? '<div style="margin-top:3px;display:flex;gap:4px;">' + extras + '</div>' : '') +
            '</div>' +
          '</button>'
        );
      }).join('');
    }
    atualizarBoxTurnoFlexivel();
  }
  function atualizarPillsEscalaEntrada() {
    var pillSem = document.getElementById('pill-escala-semana');
    var pillPla = document.getElementById('pill-escala-plantao');
    if (pillSem) pillSem.classList.toggle('on', escalaTurnoEntradaAtiva === 'semana');
    if (pillPla) pillPla.classList.toggle('on', escalaTurnoEntradaAtiva === 'plantao');
    if (typeof atualizarTodosGlidersPills === 'function') {
      requestAnimationFrame(function() { atualizarTodosGlidersPills(true); });
    }
  }
  function alternarEscalaTurnoEntrada(escala) {
    escalaTurnoEntradaAtiva = (escala === 'plantao') ? 'plantao' : 'semana';
    var atualPertence = TURNOS_OFICIAIS_TV.some(function(t) {
      return t.id === turnoSelecionadoEntradaId && t.escala === escalaTurnoEntradaAtiva;
    });
    if (!atualPertence) {
      var sug = sugerirTurnoPorEscala(escalaTurnoEntradaAtiva);
      if (sug) turnoSelecionadoEntradaId = sug.id;
    }
    atualizarPillsEscalaEntrada();
    renderGridTurnosEntrada();
  }
  window.alternarEscalaTurnoEntrada = alternarEscalaTurnoEntrada;
  function selecionarTurnoEntrada(idTurno) {
    var t = TURNOS_OFICIAIS_TV.find(function(x) { return x.id === idTurno; });
    if (!t) return;
    turnoSelecionadoEntradaId = t.id;
    escalaTurnoEntradaAtiva = t.escala;
    renderGridTurnosEntrada();
  }
  window.selecionarTurnoEntrada = selecionarTurnoEntrada;
  function recalcularHorarioTurnoFlexivel(horaStr) {
    var t = TURNOS_OFICIAIS_TV.find(function(x) { return x.id === turnoSelecionadoEntradaId; });
    if (!t || !t.flexivel) return;
    if (horaStr) horaEntradaFlexPorTurno[t.id] = horaStr;
    var faixa = calcularFaixaHorarioFlexivel(t, horaEntradaFlexPorTurno[t.id] || t.inicioPadrao);
    var resumoEl = document.getElementById('entrada-turno-flex-resumo');
    if (resumoEl) resumoEl.textContent = faixa;
    var cardHorEl = document.getElementById('turno-card-hor-' + t.id);
    if (cardHorEl) cardHorEl.textContent = faixa;
    var selOpt = document.querySelector('#entrada-turno-select option[value="' + t.id + '"]');
    if (selOpt) {
      var prefixo = (t.escala === 'plantao') ? 'Plantão ' : 'Turno ';
      selOpt.textContent = prefixo + t.codigo + ' — ' + faixa + ' (Horário flexível)';
    }
  }
  window.recalcularHorarioTurnoFlexivel = recalcularHorarioTurnoFlexivel;
  function inicializarSeletorTurnoEntrada() {
    var hojeKey = getDateKeyHoje();
    var restaurado = false;
    try {
      var raw = localStorage.getItem(TURNO_ATUAL_STORAGE_KEY);
      if (raw) {
        var obj = JSON.parse(raw);
        if (obj && obj.dateKey === hojeKey && obj.id) {
          var tObj = TURNOS_OFICIAIS_TV.find(function(x) { return x.id === obj.id; });
          if (tObj) {
            escalaTurnoEntradaAtiva = tObj.escala;
            turnoSelecionadoEntradaId = tObj.id;
            if (tObj.flexivel && obj.entradaFlex) {
              horaEntradaFlexPorTurno[tObj.id] = obj.entradaFlex;
            }
            restaurado = true;
          }
        }
      }
    } catch (e) {}
    if (!restaurado) {
      escalaTurnoEntradaAtiva = ehFimDeSemanaHoje() ? 'plantao' : 'semana';
      var sug = sugerirTurnoPorEscala(escalaTurnoEntradaAtiva);
      if (sug) turnoSelecionadoEntradaId = sug.id;
    }
    atualizarPillsEscalaEntrada();
    renderGridTurnosEntrada();
  }
  window.inicializarSeletorTurnoEntrada = inicializarSeletorTurnoEntrada;
  function atualizarUITurnoAtivo() {
    var upTurno = document.getElementById('up-turno');
    if (!upTurno) return;
    if (!turnoAtivoSessao) {
      upTurno.textContent = 'Não selecionado';
      upTurno.style.color = 'var(--blue)';
      upTurno.removeAttribute('title');
      return;
    }
    var prefixo = turnoAtivoSessao.escala === 'plantao' ? 'Plantão ' : 'Turno ';
    upTurno.textContent = turnoAtivoSessao.horario;
    upTurno.style.color = turnoAtivoSessao.escala === 'plantao' ? '#DC2626' : 'var(--blue)';
    upTurno.setAttribute('title', prefixo + turnoAtivoSessao.codigo + ' (' + turnoAtivoSessao.horario + ')');
  }
  function salvarTurnoSessaoAtual() {
    var tObj = TURNOS_OFICIAIS_TV.find(function(x) { return x.id === turnoSelecionadoEntradaId; }) || sugerirTurnoPorEscala(escalaTurnoEntradaAtiva);
    if (!tObj) return;
    var entradaFlex = tObj.flexivel ? (horaEntradaFlexPorTurno[tObj.id] || tObj.inicioPadrao) : '';
    var horarioFinal = tObj.flexivel ? calcularFaixaHorarioFlexivel(tObj, entradaFlex) : tObj.horario;
    turnoAtivoSessao = {
      dateKey: getDateKeyHoje(),
      id: tObj.id,
      escala: tObj.escala,
      codigo: tObj.codigo,
      horario: horarioFinal,
      entradaFlex: entradaFlex
    };
    try {
      localStorage.setItem(TURNO_ATUAL_STORAGE_KEY, JSON.stringify(turnoAtivoSessao));
    } catch (e) {}
    atualizarUITurnoAtivo();
  }
  window.salvarTurnoSessaoAtual = salvarTurnoSessaoAtual;
  function limparTurnoSessaoAtual() {
    turnoAtivoSessao = null;
    try { localStorage.removeItem(TURNO_ATUAL_STORAGE_KEY); } catch (e) {}
    atualizarUITurnoAtivo();
  }
  function obterLabelTurnoAtivoCurto() {
    if (!turnoAtivoSessao) return '';
    var prefixo = turnoAtivoSessao.escala === 'plantao' ? 'Plantão ' : 'Turno ';
    return prefixo + turnoAtivoSessao.codigo + ' (' + turnoAtivoSessao.horario + ')';
  }
  window.obterLabelTurnoAtivoCurto = obterLabelTurnoAtivoCurto;
  function abrirSeletorTurnoRapido() {
    var popover = document.getElementById('user-popover');
    if (popover) popover.setAttribute('hidden', '');
    var chk = document.getElementById('chk-entrada');
    if (chk) {
      chk.checked = true;
      if (typeof toggleBtnIniciarSessao === 'function') toggleBtnIniciarSessao(true);
    }
    abrirPopup('popup-entrada');
  }
  window.abrirSeletorTurnoRapido = abrirSeletorTurnoRapido;
  try {
    var rawTurnoBoot = localStorage.getItem(TURNO_ATUAL_STORAGE_KEY);
    if (rawTurnoBoot) {
      var parsedTurnoBoot = JSON.parse(rawTurnoBoot);
      if (parsedTurnoBoot && parsedTurnoBoot.dateKey === getDateKeyHoje() && parsedTurnoBoot.id) {
        turnoAtivoSessao = parsedTurnoBoot;
        atualizarUITurnoAtivo();
      }
    }
  } catch (eTurnoBoot) {}
  function toggleUserPopover(e) {
    if (e) e.stopPropagation();
    var popover = document.getElementById('user-popover');
    if (!popover) return;
    var isHidden = popover.hasAttribute('hidden');
    if (isHidden) {
      popover.removeAttribute('hidden');
      atualizarUITurnoAtivo();
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
    dashboard:    { page:'page-dashboard',    title:'Ocorrências',                              chip:'Gestão e acompanhamento de ocorrências' },
    checklist:    { page:'page-checklist',    title:'Rotinas & Lembretes',                      chip:'Monitoramento preventivo e rotinas do turno' },
    ctrs:         { page:'page-ctrs',         title:'Relatório de Transmissões',                chip:'Preencher após cada jornal' },
    arquivados:   { page:'page-arquivados',   title:'Em Observação — Monitoramento Pós-Reparo', chip:'Validação de estabilidade entre turnos' },
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
    var pageChipEl = document.getElementById('page-chip');
    if (pageChipEl) pageChipEl.textContent = chipText;
    if (el) el.classList.add('active');
    if (name === 'config') {
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
