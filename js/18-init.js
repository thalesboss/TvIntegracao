  /* ═══════════════════════════════════════════
     FLUXO DE INICIALIZAÇÃO E IDENTIFICAÇÃO DO OPERADOR
  ═══════════════════════════════════════════ */
  /* Render inicial */
  try { carregarFotoPerfilSalva(); } catch(e) {}
  try { loadNotificacoes(); } catch(e) {}
  try { carregarCredenciaisSupabaseConfig(); } catch(e) {}
  try { carregarRascunhoRelatorioTV(); } catch(e) {}
  try { carregarRascunhoRecebimento(); } catch(e) {}
  try { carregarRascunhoCompra(); } catch(e) {}
  try { carregarDashboardMetricsStore(); } catch(e) {}
  try { carregarOrcamentoStore(); } catch(e) {}
  try { carregarChecklistStore(); } catch(e) {}
  try { if (typeof DBService !== 'undefined' && DBService.init) DBService.init(); } catch(e) {}
  renderAll(true);

  DBService.syncRemote();

  // Sincronização periódica em tempo real (a cada 5 segundos) e imediata ao focar na janela
  setInterval(function() {
    if (typeof DBService !== 'undefined' && DBService && typeof DBService.syncRemote === 'function') {
      DBService.syncRemote();
    }
  }, 5000);

  window.addEventListener('focus', function() {
    if (typeof DBService !== 'undefined' && DBService && typeof DBService.syncRemote === 'function') {
      DBService.syncRemote();
    }
  });

  var savedUserName = localStorage.getItem(USER_NAME_STORAGE_KEY);
  try { if (typeof carregarOperadoresSugeridos === 'function') carregarOperadoresSugeridos(); } catch(e) {}
  if (!savedUserName || !savedUserName.trim()) {
    abrirPopup('popup-identificacao-operador');
    var identInput = document.getElementById('ident-operador-nome');
    if (identInput) setTimeout(function(){ identInput.focus(); }, 180);
  } else {
    atualizarNomeOperadorUI(savedUserName.trim());
    abrirPopup('popup-entrada');
  }

}); /* fim DOMContentLoaded */
