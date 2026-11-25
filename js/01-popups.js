(function (window, document, TVApp) {
  'use strict';

  var Security = TVApp.Security;

  function abrirPopup(id) {
    var el = document.getElementById(id);
    if (el) {
      el.removeAttribute('hidden');
      el.style.setProperty('display', 'flex', 'important');
      el.style.pointerEvents = 'auto';
    }
    if ((id === 'popup-nova-oc' || id === 'popup-editar-oc') && typeof window.atualizarSelectEquipamentosNovaOc === 'function') {
      window.atualizarSelectEquipamentosNovaOc();
    }
    if (id === 'popup-entrada' && typeof window.inicializarSeletorTurnoEntrada === 'function') {
      window.inicializarSeletorTurnoEntrada();
    }
    if (typeof window.atualizarTodosGlidersPills === 'function') {
      requestAnimationFrame(function () { window.atualizarTodosGlidersPills(false); });
      setTimeout(function () { window.atualizarTodosGlidersPills(false); }, 40);
    }
  }

  function fecharPopup(id) {
    var el = document.getElementById(id);
    if (el) {
      el.setAttribute('hidden', '');
      el.style.setProperty('display', 'none', 'important');
      el.style.pointerEvents = 'none';
    }
  }

  function toggleBtnIniciarSessao(checked) {
    var btn = document.getElementById('btn-iniciar');
    if (btn) {
      btn.disabled = !checked;
      btn.style.opacity = checked ? '1' : '0.45';
      btn.style.cursor = checked ? 'pointer' : 'not-allowed';
    }
  }

  function iniciarSessao() {
    var chk = document.getElementById('chk-entrada');
    if (!chk || !chk.checked) {
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Atenção', 'Por favor, marque a caixa confirmando que leu as orientações antes de iniciar.', 'warning');
      }
      return;
    }
    fecharPopup('popup-entrada');
    if (typeof window.salvarTurnoSessaoAtual === 'function') {
      window.salvarTurnoSessaoAtual();
    }
    if (typeof window.lucide !== 'undefined') {
      window.lucide.createIcons();
    }
  }

  function abrirQuickLook(src, nome) {
    var safeSrc = Security.sanitizeMediaUrl(src);
    if (!safeSrc) return;
    /* Desfaz entidades HTML caso a URL venha escapada de um atributo */
    var rawSafeUrl = safeSrc.replace(/&amp;/g, '&');
    var img = document.getElementById('quicklook-img');
    var nameEl = document.getElementById('quicklook-filename');
    var dlBtn = document.getElementById('quicklook-download-btn');
    if (img) img.src = rawSafeUrl;
    if (nameEl) nameEl.textContent = nome || 'Imagem';
    if (dlBtn) {
      dlBtn.href = rawSafeUrl;
      dlBtn.download = nome || 'imagem_anexa';
    }
    abrirPopup('popup-quicklook');
    if (typeof window.lucide !== 'undefined') {
      window.lucide.createIcons();
    }
  }

  function fecharQuickLook() {
    fecharPopup('popup-quicklook');
    var img = document.getElementById('quicklook-img');
    if (img) img.src = '';
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      var ql = document.getElementById('popup-quicklook');
      if (ql && !ql.hasAttribute('hidden') && ql.style.display !== 'none') {
        fecharQuickLook();
      }
    }
  });

  document.addEventListener('click', function (e) {
    if (
      e.target &&
      e.target.classList &&
      e.target.classList.contains('overlay') &&
      e.target.id !== 'popup-entrada' &&
      e.target.id !== 'popup-identificacao-operador'
    ) {
      fecharPopup(e.target.id);
    }
  });

  window.abrirPopup             = abrirPopup;
  window.fecharPopup            = fecharPopup;
  window.abrirQuickLook         = abrirQuickLook;
  window.fecharQuickLook        = fecharQuickLook;
  window.toggleBtnIniciarSessao = toggleBtnIniciarSessao;
  window.iniciarSessao          = iniciarSessao;
})(window, document, window.TVApp);
