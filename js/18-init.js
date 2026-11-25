(function (window, document, TVApp) {
  'use strict';

  TVApp.registerModule('init', function (app) {
    var KEYS    = app.KEYS;
    var Storage = app.Storage;

    function safeRun(fn) {
      if (typeof fn === 'function') {
        try { fn(); } catch (e) { console.warn('[TVApp.init] Erro parcial na inicialização:', e); }
      }
    }

    safeRun(window.carregarDashboardMetricsStore);
    safeRun(window.aplicarModoPraca);
    safeRun(window.carregarConfiguracoesSalvas);
    safeRun(window.carregarFotoPerfilSalva);
    safeRun(window.loadNotificacoes);
    safeRun(window.atualizarUIStatusBancoConfig);
    safeRun(window.carregarRascunhoRelatorioTV);
    safeRun(window.carregarRascunhoRecebimento);
    safeRun(window.carregarRascunhoCompra);
    safeRun(window.carregarEquipamentosStore);
    safeRun(window.carregarOrcamentoStore);
    safeRun(window.carregarChecklistStore);
    safeRun(window.atualizarSelectsProfissionaisCTRS);
    safeRun(window.sincronizarEquipeNuvem);
    if (window.DBService && typeof window.DBService.init === 'function') {
      try { window.DBService.init(); } catch (e) {}
    }
    if (typeof window.renderAll === 'function') {
      window.renderAll(true);
    }

    /* Sincronização periódica em segundo plano (respeita aba inativa e backoff) */
    setInterval(function () {
      if (document.hidden) return;
      if (typeof window._isCloudConnected === 'function' && !window._isCloudConnected()) {
        return;
      }
      if (window.DBService && typeof window.DBService.syncRemote === 'function') {
        window.DBService.syncRemote();
      }
    }, 30000);

    var lastFocusSync = 0;
    window.addEventListener('focus', function () {
      var now = Date.now();
      if (now - lastFocusSync < 20000) return;
      lastFocusSync = now;
      if (typeof window._isCloudConnected === 'function' && !window._isCloudConnected()) {
        if (typeof window.tentarReconectarImediato === 'function') window.tentarReconectarImediato();
        return;
      }
      if (window.DBService && typeof window.DBService.syncRemote === 'function') {
        window.DBService.syncRemote();
      }
    });

    var savedUserName = Storage.getText(KEYS.USER_NAME, '').trim();
    safeRun(window.carregarOperadoresSugeridos);
    safeRun(window.atualizarUIIdentificacaoOperador);

    var estacaoConectadaInit = (typeof window.isEstacaoConectadaTV === 'function') ? window.isEstacaoConectadaTV() : true;
    if (!estacaoConectadaInit || !savedUserName || savedUserName === 'Operador') {
      if (typeof window.abrirPopup === 'function') window.abrirPopup('popup-identificacao-operador');
      var identEmail = document.getElementById('ident-operador-email');
      setTimeout(function () {
        if (identEmail && identEmail.offsetParent !== null) identEmail.focus();
      }, 180);
    } else {
      if (typeof window.atualizarNomeOperadorUI === 'function') {
        window.atualizarNomeOperadorUI(savedUserName);
      }
      var sEmail = Storage.getText(KEYS.USER_EMAIL, '');
      var sTag   = Storage.getText(KEYS.USER_TAG, '');
      var sCargo = Storage.getText(KEYS.USER_CARGO, '');
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
      if (typeof window.obterOuCriarOperadorPorNome === 'function') {
        try { window.obterOuCriarOperadorPorNome(savedUserName); } catch (e) {}
      }
      if (typeof window.abrirPopup === 'function') window.abrirPopup('popup-entrada');
    }
  });
})(window, document, window.TVApp);
