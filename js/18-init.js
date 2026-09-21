  /* ═══════════════════════════════════════════
     FLUXO DE INICIALIZAÇÃO E IDENTIFICAÇÃO DO OPERADOR
  ═══════════════════════════════════════════ */
  /* Render inicial */
  try { if (typeof aplicarModoPraca === 'function') aplicarModoPraca(); } catch(e) {}
  try { carregarFotoPerfilSalva(); } catch(e) {}
  try { loadNotificacoes(); } catch(e) {}
  try { carregarCredenciaisSupabaseConfig(); } catch(e) {}
  try { carregarRascunhoRelatorioTV(); } catch(e) {}
  try { carregarRascunhoRecebimento(); } catch(e) {}
  try { carregarRascunhoCompra(); } catch(e) {}
  try { carregarDashboardMetricsStore(); } catch(e) {}
  try { carregarOrcamentoStore(); } catch(e) {}
  try { carregarChecklistStore(); } catch(e) {}
  try { if (typeof atualizarSelectsProfissionaisCTRS === 'function') atualizarSelectsProfissionaisCTRS(); } catch(e) {}
  try { if (typeof sincronizarEquipeNuvem === 'function') sincronizarEquipeNuvem(); } catch(e) {}
  try { if (typeof DBService !== 'undefined' && DBService.init) DBService.init(); } catch(e) {}
  renderAll(true);

  // Sincronização inteligente: periódica a cada 2 minutos se a aba estiver visível, e ao focar na janela
  setInterval(function() {
    if (document.hidden) return; // Se a aba estiver minimizada ou em segundo plano, economiza tráfego
    if (typeof DBService !== 'undefined' && DBService && typeof DBService.syncRemote === 'function') {
      DBService.syncRemote();
    }
  }, 120000); // 2 minutos (redução imediata de 96% no consumo de rede)

  var lastFocusSync = 0;
  window.addEventListener('focus', function() {
    var now = Date.now();
    if (now - lastFocusSync < 60000) return; // Limite de 1 sincronização por minuto ao alternar abas
    lastFocusSync = now;
    if (typeof DBService !== 'undefined' && DBService && typeof DBService.syncRemote === 'function') {
      DBService.syncRemote();
    }
  });

  var savedUserName = localStorage.getItem(USER_NAME_STORAGE_KEY);
  try { if (typeof carregarOperadoresSugeridos === 'function') carregarOperadoresSugeridos(); } catch(e) {}
  try { if (typeof atualizarUIIdentificacaoOperador === 'function') atualizarUIIdentificacaoOperador(); } catch(e) {}
  if (!savedUserName || !savedUserName.trim()) {
    abrirPopup('popup-identificacao-operador');
    var identInput = document.getElementById('ident-operador-nome');
    if (identInput) setTimeout(function(){ identInput.focus(); }, 180);
  } else {
    atualizarNomeOperadorUI(savedUserName.trim());
    try { if (typeof obterOuCriarOperadorPorNome === 'function') obterOuCriarOperadorPorNome(savedUserName.trim()); } catch(e) {}
    abrirPopup('popup-entrada');
  }

}); /* fim DOMContentLoaded */
