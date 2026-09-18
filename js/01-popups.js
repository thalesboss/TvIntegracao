/* ═══════════════════════════════════════════
   POPUP — funções base globais
═══════════════════════════════════════════ */
function abrirPopup(id) {
  var el = document.getElementById(id);
  if (el) {
    el.removeAttribute('hidden');
    el.style.setProperty('display', 'flex', 'important');
    el.style.pointerEvents = 'auto';
  }
  if ((id === 'popup-nova-oc' || id === 'popup-editar-oc') && typeof atualizarSelectEquipamentosNovaOc === 'function') {
    atualizarSelectEquipamentosNovaOc();
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
    if (typeof mostrarToast === 'function') {
      mostrarToast('Atenção', 'Por favor, marque a caixa confirmando que leu as orientações antes de iniciar.', 'warning');
    }
    return;
  }
  fecharPopup('popup-entrada');
  var pop = document.getElementById('popup-entrada');
  if (pop) {
    pop.setAttribute('hidden', '');
    pop.style.setProperty('display', 'none', 'important');
    pop.style.pointerEvents = 'none';
  }
  if (typeof atualizarTimerLogin === 'function') {
    atualizarTimerLogin();
  }
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}
function abrirQuickLook(src, nome) {
  if (!src) return;
  var pop = document.getElementById('popup-quicklook');
  var img = document.getElementById('quicklook-img');
  var nameEl = document.getElementById('quicklook-filename');
  var dlBtn = document.getElementById('quicklook-download-btn');

  if (img) img.src = src;
  if (nameEl) nameEl.textContent = nome || 'Imagem';
  if (dlBtn) {
    dlBtn.href = src;
    dlBtn.download = nome || 'imagem_anexa';
  }

  abrirPopup('popup-quicklook');
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function fecharQuickLook() {
  fecharPopup('popup-quicklook');
  var img = document.getElementById('quicklook-img');
  if (img) img.src = '';
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' || e.keyCode === 27) {
    var ql = document.getElementById('popup-quicklook');
    if (ql && !ql.hasAttribute('hidden') && ql.style.display !== 'none') {
      fecharQuickLook();
    }
  }
});

window.abrirPopup             = abrirPopup;
window.fecharPopup            = fecharPopup;
window.abrirQuickLook         = abrirQuickLook;
window.fecharQuickLook        = fecharQuickLook;
window.toggleBtnIniciarSessao = toggleBtnIniciarSessao;
window.iniciarSessao          = iniciarSessao;

/* Fechar popups clicando fora no overlay escuro */
document.addEventListener('click', function(e) {
  if (e.target && e.target.classList && e.target.classList.contains('overlay') && e.target.id !== 'popup-entrada') {
    fecharPopup(e.target.id);
  }
});
