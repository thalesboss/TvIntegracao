  /* Garante conexão ativa com o PostgreSQL na nuvem (Modo Offline desativado) */
  if (typeof isEstacaoConectadaTV === 'function' && !isEstacaoConectadaTV() && typeof conectarComChaveTV === 'function') {
    conectarComChaveTV(atob('QEludGVncmEyNjIw')).then(function() {
      if (typeof carregarEquipamentosStore === 'function') carregarEquipamentosStore();
      if (typeof sincronizarOrcamentoNuvem === 'function') sincronizarOrcamentoNuvem();
      if (typeof sincronizarEquipeNuvem === 'function') sincronizarEquipeNuvem();
    });
  }
  /* ═══════════════════════════════════════════
     FLUXO DE INICIALIZAÇÃO E IDENTIFICAÇÃO DO OPERADOR
  ═══════════════════════════════════════════ */
  /* Render inicial */
  try { if (typeof aplicarModoPraca === 'function') aplicarModoPraca(); } catch(e) {}
  try { carregarFotoPerfilSalva(); } catch(e) {}
  try { loadNotificacoes(); } catch(e) {}
  try { carregarCredenciaisSupabaseConfig(); } catch(e) {}
  try { if (typeof atualizarUIStatusBancoConfig === 'function') atualizarUIStatusBancoConfig(); } catch(e) {}
  try { carregarRascunhoRelatorioTV(); } catch(e) {}
  try { carregarRascunhoRecebimento(); } catch(e) {}
  try { carregarRascunhoCompra(); } catch(e) {}
  try { carregarDashboardMetricsStore(); } catch(e) {}
  try { if (typeof carregarEquipamentosStore === 'function') carregarEquipamentosStore(); } catch(e) {}
  try { carregarOrcamentoStore(); } catch(e) {}
  try { carregarChecklistStore(); } catch(e) {}
  try { if (typeof atualizarSelectsProfissionaisCTRS === 'function') atualizarSelectsProfissionaisCTRS(); } catch(e) {}
  try { if (typeof sincronizarEquipeNuvem === 'function') sincronizarEquipeNuvem(); } catch(e) {}
  try { if (typeof DBService !== 'undefined' && DBService.init) DBService.init(); } catch(e) {}
  renderAll(true);

  // Sincronização inteligente: periódica a cada 2 minutos APENAS se a aba estiver visível e conectada
  setInterval(function() {
    if (document.hidden) return; // Se a aba estiver minimizada ou em segundo plano, economiza tráfego
    if (typeof _isCloudConnected === 'function' && !_isCloudConnected()) {
      return; // Se desconectado, o gerenciador de reconexão já cuida com backoff para não inchar o banco
    }
    if (typeof DBService !== 'undefined' && DBService && typeof DBService.syncRemote === 'function') {
      DBService.syncRemote();
    }
  }, 120000); // 2 minutos

  var lastFocusSync = 0;
  window.addEventListener('focus', function() {
    var now = Date.now();
    if (now - lastFocusSync < 60000) return; // Limite de 1 sincronização por minuto ao alternar abas
    lastFocusSync = now;
    if (typeof _isCloudConnected === 'function' && !_isCloudConnected()) {
      // Ao voltar à aba se estiver desconectado, tenta reconexão imediata
      if (typeof tentarReconectarImediato === 'function') tentarReconectarImediato();
      return;
    }
    if (typeof DBService !== 'undefined' && DBService && typeof DBService.syncRemote === 'function') {
      DBService.syncRemote();
    }
  });

  var savedUserName = localStorage.getItem(USER_NAME_STORAGE_KEY);
  try { if (typeof carregarOperadoresSugeridos === 'function') carregarOperadoresSugeridos(); } catch(e) {}
  try { if (typeof atualizarUIIdentificacaoOperador === 'function') atualizarUIIdentificacaoOperador(); } catch(e) {}

  var identPracaSelect = document.getElementById('ident-operador-praca');
  if (identPracaSelect) {
    if (typeof getPracaAtual === 'function') {
      identPracaSelect.value = getPracaAtual();
    }
    identPracaSelect.addEventListener('change', function() {
      if (typeof setPracaAtual === 'function') {
        setPracaAtual(this.value);
      }
    });
  }

  if (!savedUserName || !savedUserName.trim() || savedUserName.trim() === 'Operador') {
    abrirPopup('popup-identificacao-operador');
    var identEmail = document.getElementById('ident-operador-email');
    var identInput = document.getElementById('ident-operador-nome');
    setTimeout(function() {
      if (identEmail && identEmail.offsetParent !== null) identEmail.focus();
      else if (identInput) identInput.focus();
    }, 180);
  } else {
    atualizarNomeOperadorUI(savedUserName.trim());
    try {
      var sEmail = localStorage.getItem('tv_user_email_v1');
      var sTag   = localStorage.getItem('tv_user_tag_v1');
      var sCargo = localStorage.getItem('tv_user_cargo_v1');
      if (sEmail) {
        var upEm = document.getElementById('up-email'); if (upEm) upEm.textContent = sEmail;
        var cfEm = document.getElementById('cfg-email'); if (cfEm) cfEm.value = sEmail;
      }
      if (sCargo || sTag) {
        var lblC = (sCargo || 'Operações') + (sTag ? ' [' + sTag + ']' : '');
        var upRl = document.getElementById('up-role'); if (upRl) upRl.textContent = lblC;
        var sRl  = document.querySelector('.s-user-role'); if (sRl) sRl.textContent = lblC;
        var cfCg = document.getElementById('cfg-cargo'); if (cfCg) cfCg.value = lblC;
      }
    } catch (e) {}
    try { if (typeof obterOuCriarOperadorPorNome === 'function') obterOuCriarOperadorPorNome(savedUserName.trim()); } catch(e) {}
    abrirPopup('popup-entrada');
  }

}); /* fim DOMContentLoaded */
