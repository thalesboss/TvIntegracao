(function (window, document, TVApp) {
  'use strict';

  TVApp.registerModule('notificacoes-toasts', function (app) {
    var KEYS           = app.KEYS;
    var Security       = app.Security;
    var Storage        = app.Storage;
    var EventBus       = app.EventBus;
    var Store          = app.Store;
    var escapeHTML     = Security.escapeHTML;
    var escapeJSString = Security.escapeJSString;
    var sanitizeIdAttr = Security.sanitizeIdAttr;

    var _notificacoesNuvemIndisponivel = false;

    function salvarDispensadas() {
      Storage.setJSON(KEYS.NOTIF_DISMISSED, Store.notificacoesDispensadas);
    }

    function loadNotificacoes() {
      var savedDisp = Storage.getJSON(KEYS.NOTIF_DISMISSED, []);
      Store.notificacoesDispensadas = Array.isArray(savedDisp) ? savedDisp : [];
      var saved = Storage.getJSON(KEYS.NOTIF_CACHE, []);
      Store.notificacoesStore = Array.isArray(saved) ? saved : [];
      atualizarBadgesNotificacoes();
      sincronizarNotificacoesNuvem();
    }
    window.loadNotificacoes = loadNotificacoes;

    function saveNotificacoes() {
      Storage.setJSON(KEYS.NOTIF_CACHE, Store.notificacoesStore);
      atualizarBadgesNotificacoes();
    }

    function lerPreferenciasNotificacoes() {
      var prefs = Storage.getJSON(KEYS.CONFIG_PREFS, {});
      return (prefs && typeof prefs === 'object') ? prefs : {};
    }

    function isNotificacoesMutadas() {
      var elMute = document.getElementById('cfg-mute-all');
      if (elMute) return !!elMute.checked;
      return !!lerPreferenciasNotificacoes().muteAll;
    }

    function isNotifPrefAtiva(chave, padrao) {
      var prefs = lerPreferenciasNotificacoes();
      return (typeof prefs[chave] === 'boolean') ? prefs[chave] : padrao;
    }

    function normalizarTipoNotif(tipo) {
      var t = String(tipo || 'info').toLowerCase().trim();
      if (t === 'warning' || t === 'warn' || t === 'alerta') return 'warning';
      if (t === 'danger' || t === 'error') return 'danger';
      if (t === 'success' || t === 'ok') return 'success';
      return 'info';
    }

    function sincronizarNotificacoesNuvem() {
      if (_notificacoesNuvemIndisponivel || !window.DBService) return;
      window.DBService.select('notificacoes', 'select=*&order=id.desc&limit=50')
        .then(function (res) {
          if (res.status === 404) {
            _notificacoesNuvemIndisponivel = true;
            return;
          }
          if (!res.ok || !Array.isArray(res.data)) return;
          var dispensadas = Array.isArray(Store.notificacoesDispensadas) ? Store.notificacoesDispensadas : [];
          var lidasLocais = {};
          (Store.notificacoesStore || []).forEach(function (n) {
            if (n && n.id && n.lida) lidasLocais[n.id] = true;
          });
          var filtradas = res.data.filter(function (n) {
            if (!n || !n.id) return false;
            if (n.chaveAutomatica && dispensadas.indexOf(n.chaveAutomatica) !== -1) return false;
            return true;
          }).map(function (n) {
            if (lidasLocais[n.id]) n.lida = true;
            return n;
          });
          var idsNuvem = {};
          filtradas.forEach(function (n) { idsNuvem[n.id] = true; });
          var apenasLocais = (Store.notificacoesStore || []).filter(function (n) {
            return n && n.id && !idsNuvem[n.id] && (!n.chaveAutomatica || dispensadas.indexOf(n.chaveAutomatica) === -1);
          });
          Store.notificacoesStore = apenasLocais.concat(filtradas).slice(0, 80);
          Storage.setJSON(KEYS.NOTIF_CACHE, Store.notificacoesStore);
          atualizarBadgesNotificacoes();
          renderNotificacoes();
        })
        .catch(function () {});
    }
    window.sincronizarNotificacoesNuvem = sincronizarNotificacoesNuvem;
    EventBus.on('cloud:sync', sincronizarNotificacoesNuvem);

    function salvarNotificacaoNuvem(notif) {
      if (_notificacoesNuvemIndisponivel || !notif || !window.DBService) return;
      window.DBService.upsert('notificacoes', notif).then(function (res) {
        if (res && res.status === 404) _notificacoesNuvemIndisponivel = true;
      }).catch(function () {});
    }
    window.salvarNotificacaoNuvem = salvarNotificacaoNuvem;

    function marcarTodasLidasNuvem() {
      if (_notificacoesNuvemIndisponivel || !window.DBService) return;
      var pracaAtiva = (typeof window.getPracaAtual === 'function') ? window.getPracaAtual() : 'Juiz de Fora';
      window.DBService.patch('notificacoes', 'lida=eq.false&praca=eq.' + encodeURIComponent(pracaAtiva), { lida: true }, 'return=minimal')
        .then(function (res) {
          if (res && res.status === 404) _notificacoesNuvemIndisponivel = true;
        }).catch(function () {});
    }
    window.marcarTodasLidasNuvem = marcarTodasLidasNuvem;

    function deletarNotificacaoNuvem(id) {
      if (_notificacoesNuvemIndisponivel || !id || !window.DBService) return;
      window.DBService.remove('notificacoes', 'id=eq.' + encodeURIComponent(id))
        .then(function (res) {
          if (res && res.status === 404) _notificacoesNuvemIndisponivel = true;
        }).catch(function () {});
    }
    window.deletarNotificacaoNuvem = deletarNotificacaoNuvem;

    function deletarTodasNotificacoesNuvem() {
      if (_notificacoesNuvemIndisponivel || !window.DBService) return;
      var pracaAtiva = (typeof window.getPracaAtual === 'function') ? window.getPracaAtual() : 'Juiz de Fora';
      window.DBService.remove('notificacoes', 'praca=eq.' + encodeURIComponent(pracaAtiva))
        .then(function (res) {
          if (res && res.status === 404) _notificacoesNuvemIndisponivel = true;
        }).catch(function () {});
    }
    window.deletarTodasNotificacoesNuvem = deletarTodasNotificacoesNuvem;

    function mostrarToast(titulo, mensagem, tipo) {
      var container = document.getElementById('toast-container');
      if (!container) return;
      var toastType = normalizarTipoNotif(tipo);
      var iconName = toastType === 'success' ? 'check-circle' : toastType === 'warning' ? 'alert-triangle' : toastType === 'danger' ? 'alert-circle' : 'info';
      while (container.children.length >= 4) {
        container.removeChild(container.firstElementChild);
      }
      var toastEl = document.createElement('div');
      toastEl.className = 'toast toast-' + toastType;
      toastEl.innerHTML =
        '<div class="toast-icon"><i data-lucide="' + iconName + '" style="width:18px;height:18px;stroke-width:2;"></i></div>' +
        '<div class="toast-content">' +
          '<div class="toast-title">' + escapeHTML(titulo || 'Notificação') + '</div>' +
          '<div class="toast-msg">' + escapeHTML(mensagem || '') + '</div>' +
        '</div>' +
        '<button class="toast-close" type="button" aria-label="Fechar notificação">&times;</button>';

      function fecharComAnimacao() {
        toastEl.classList.add('toast-exit');
        setTimeout(function () {
          if (toastEl.parentNode) toastEl.remove();
        }, 380);
      }
      var closeBtn = toastEl.querySelector('.toast-close');
      if (closeBtn) closeBtn.onclick = fecharComAnimacao;
      container.appendChild(toastEl);
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
      setTimeout(function () {
        if (toastEl.parentNode) fecharComAnimacao();
      }, 4500);
    }
    window.mostrarToast = mostrarToast;

    function adicionarNotificacao(titulo, mensagem, tipo, exibirToast, chaveAutomatica) {
      if (chaveAutomatica && Array.isArray(Store.notificacoesDispensadas) && Store.notificacoesDispensadas.includes(chaveAutomatica)) {
        return;
      }
      var tipoNorm = normalizarTipoNotif(tipo);
      var novaNotif = {
        id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        titulo: titulo || 'Notificação do Sistema',
        msg: mensagem || '',
        tempo: window.formatDataHoraLocal(),
        tipo: tipoNorm,
        lida: false,
        chaveAutomatica: chaveAutomatica || null,
        praca: (typeof window.getPracaAtual === 'function') ? window.getPracaAtual() : 'Juiz de Fora'
      };
      var jaExiste = (Store.notificacoesStore || []).some(function (n) {
        return n && (typeof window.pertenceAPracaAtiva !== 'function' || window.pertenceAPracaAtiva(n)) && ((chaveAutomatica && n.chaveAutomatica === chaveAutomatica) || (n.titulo === titulo && n.msg === mensagem));
      });
      if (!jaExiste) {
        Store.notificacoesStore.unshift(novaNotif);
        saveNotificacoes();
        salvarNotificacaoNuvem(novaNotif);
        if (exibirToast !== false && !isNotificacoesMutadas()) {
          mostrarToast(titulo, mensagem, tipoNorm);
        }
      }
    }
    window.adicionarNotificacao = adicionarNotificacao;

    function removerNotificacao(id) {
      var notif = (Store.notificacoesStore || []).find(function (n) { return n && n.id === id; });
      if (notif && notif.chaveAutomatica && !Store.notificacoesDispensadas.includes(notif.chaveAutomatica)) {
        Store.notificacoesDispensadas.push(notif.chaveAutomatica);
        salvarDispensadas();
      }
      Store.notificacoesStore = (Store.notificacoesStore || []).filter(function (n) { return n && n.id !== id; });
      saveNotificacoes();
      deletarNotificacaoNuvem(id);
      renderNotificacoes();
    }
    window.removerNotificacao = removerNotificacao;

    function atualizarBadgesNotificacoes() {
      var badgeSidebar = document.querySelector('.notif-badge');
      var notifDot = document.querySelector('.notif-dot');
      var mutado = isNotificacoesMutadas();
      var naoLidas = (Store.notificacoesStore || []).filter(function (n) {
        return n && !n.lida && (typeof window.pertenceAPracaAtiva !== 'function' || window.pertenceAPracaAtiva(n));
      }).length;
      if (badgeSidebar) {
        if (!mutado && naoLidas > 0) {
          badgeSidebar.textContent = naoLidas;
          badgeSidebar.style.display = 'inline-flex';
        } else {
          badgeSidebar.textContent = '0';
          badgeSidebar.style.display = 'none';
        }
      }
      if (notifDot) {
        notifDot.style.display = (!mutado && naoLidas > 0) ? 'block' : 'none';
      }
    }
    window.atualizarBadgesNotificacoes = atualizarBadgesNotificacoes;

    function verificarNotificacoesAutomaticas() {
      var idsNaLixeira = (Store.lixeiraData || []).map(function (item) { return item.id; });
      if (isNotifPrefAtiva('notifAtrasada', true)) {
        (Store.ocorrencias || []).forEach(function (oc) {
          if (oc && oc.status === 'aberta' && !String(oc.id).startsWith('oc_init_') && !idsNaLixeira.includes(oc.id) && (typeof window.pertenceAPracaAtiva !== 'function' || window.pertenceAPracaAtiva(oc)) && window.isOcorrenciaVencida(oc)) {
            var chaveOc = 'vencida_' + oc.id + '_' + (oc.prazo || '');
            var tit = '⚠️ Prazo Expirado: ' + (oc.titulo || 'Ocorrência');
            var msg = 'A ocorrência para "' + (oc.local || 'Central Técnica') + '" ultrapassou o horário estipulado (' + (oc.prazo || 'Prazo vencido') + ') e requer atenção.';
            adicionarNotificacao(tit, msg, 'warning', false, chaveOc);
          }
        });
      }
      var arquivadas = window.getArquivadas().filter(function (oc) {
        return oc && !String(oc.id).startsWith('oc_init_') && !idsNaLixeira.includes(oc.id) && (typeof window.pertenceAPracaAtiva !== 'function' || window.pertenceAPracaAtiva(oc));
      });
      if (arquivadas.length > 0) {
        var pracaAtualTag = (typeof window.getPracaAtual === 'function') ? window.getPracaAtual() : 'JF';
        var chaveArq = 'arq_status_' + pracaAtualTag + '_' + arquivadas.map(function (a) { return a.id; }).sort().join('_');
        var titArq = '👁️ Equipamentos em Observação no Turno';
        var msgArq = 'Existem ' + arquivadas.length + ' ocorrência(s) em observação pós-reparo aguardando teste e validação da equipe.';
        adicionarNotificacao(titArq, msgArq, 'info', false, chaveArq);
      }
    }
    window.verificarNotificacoesAutomaticas = verificarNotificacoesAutomaticas;

    function renderNotificacoes() {
      var container = document.getElementById('notif-list-body');
      atualizarBadgesNotificacoes();
      if (!container) return;
      var daPraca = (Store.notificacoesStore || []).filter(function (n) {
        return n && (typeof window.pertenceAPracaAtiva !== 'function' || window.pertenceAPracaAtiva(n));
      });
      if (daPraca.length === 0) {
        container.innerHTML =
          '<div style="text-align:center;padding:32px 16px;background:var(--surface);border:1px solid var(--border-lt);border-radius:var(--r-md);">' +
            '<i data-lucide="bell-off" style="width:32px;height:32px;color:var(--muted);stroke-width:1.5;margin-bottom:8px;"></i>' +
            '<p style="color:var(--txt);font-size:13.5px;font-weight:600;">Nenhuma notificação</p>' +
            '<p style="color:var(--muted);font-size:11.5px;margin-top:2px;">Alertas do sistema, prazos de ocorrências e avisos de turno aparecerão aqui.</p>' +
          '</div>';
        if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
        return;
      }
      container.innerHTML = daPraca.map(function (n) {
        var tipoCard  = normalizarTipoNotif(n.tipo);
        var isWarning = tipoCard === 'warning';
        var isDanger  = tipoCard === 'danger';
        var isSuccess = tipoCard === 'success';
        var bgCor     = isDanger ? '#FEF2F2' : isWarning ? '#FFFBEB' : isSuccess ? '#F0FDF4' : '#EFF6FF';
        var borderCor = isDanger ? '#FECACA' : isWarning ? '#FDE68A' : isSuccess ? '#BBF7D0' : '#BFDBFE';
        var txtCor    = isDanger ? '#DC2626' : isWarning ? '#D97706' : isSuccess ? '#16A34A' : '#2563EB';
        var icoNome   = isDanger ? 'alert-circle' : isWarning ? 'alert-triangle' : isSuccess ? 'check-circle-2' : 'info';
        var unreadBadge = !n.lida ? '<span class="tag tag-blue" style="font-size:9.5px;padding:1px 6px;margin-left:6px;font-weight:600;">Nova</span>' : '';
        var safeNotifId = escapeJSString(sanitizeIdAttr(n.id));
        return (
          '<div style="background:' + bgCor + ';border:1px solid ' + borderCor + ';border-radius:var(--r-md);padding:10px 12px;display:flex;gap:10px;align-items:flex-start;position:relative;">' +
            '<div style="color:' + txtCor + ';margin-top:1px;"><i data-lucide="' + icoNome + '" style="width:16px;height:16px;stroke-width:2.2;"></i></div>' +
            '<div style="flex:1;display:flex;flex-direction:column;gap:2px;padding-right:18px;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<div style="display:flex;align-items:center;"><strong style="font-size:12.5px;color:' + txtCor + ';">' + escapeHTML(n.titulo || 'Alerta') + '</strong>' + unreadBadge + '</div>' +
                '<span style="font-size:10.5px;color:var(--muted);white-space:nowrap;margin-left:8px;">' + escapeHTML(n.tempo || '') + '</span>' +
              '</div>' +
              '<span style="font-size:12px;color:var(--txt2);line-height:1.4;">' + escapeHTML(n.msg || '') + '</span>' +
            '</div>' +
            '<button type="button" onclick="removerNotificacao(\'' + safeNotifId + '\')" title="Dispensar notificação" style="position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;">' +
              '<i data-lucide="x" style="width:13px;height:13px;stroke-width:2.2;"></i>' +
            '</button>' +
          '</div>'
        );
      }).join('');
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
    }
    window.renderNotificacoes = renderNotificacoes;

    function abrirNotificacoes() {
      var teveNaoLidas = false;
      (Store.notificacoesStore || []).forEach(function (n) {
        if (n && !n.lida && (typeof window.pertenceAPracaAtiva !== 'function' || window.pertenceAPracaAtiva(n))) {
          n.lida = true;
          teveNaoLidas = true;
        }
      });
      saveNotificacoes();
      atualizarBadgesNotificacoes();
      renderNotificacoes();
      window.abrirPopup('popup-notificacoes');
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
      if (teveNaoLidas) marcarTodasLidasNuvem();
    }
    window.abrirNotificacoes = abrirNotificacoes;

    function limparTodasNotificacoes() {
      var idsNaLixeira = (Store.lixeiraData || []).map(function (item) { return item.id; });
      (Store.ocorrencias || []).forEach(function (oc) {
        if (oc && oc.status === 'aberta' && !idsNaLixeira.includes(oc.id) && (typeof window.pertenceAPracaAtiva !== 'function' || window.pertenceAPracaAtiva(oc))) {
          var chaveOc = 'vencida_' + oc.id + '_' + (oc.prazo || '');
          if (!Store.notificacoesDispensadas.includes(chaveOc)) Store.notificacoesDispensadas.push(chaveOc);
        }
      });
      var arquivadas = window.getArquivadas().filter(function (oc) {
        return oc && !idsNaLixeira.includes(oc.id) && (typeof window.pertenceAPracaAtiva !== 'function' || window.pertenceAPracaAtiva(oc));
      });
      if (arquivadas.length > 0) {
        var pracaAtualTag = (typeof window.getPracaAtual === 'function') ? window.getPracaAtual() : 'JF';
        var chaveArq = 'arq_status_' + pracaAtualTag + '_' + arquivadas.map(function (a) { return a.id; }).sort().join('_');
        if (!Store.notificacoesDispensadas.includes(chaveArq)) Store.notificacoesDispensadas.push(chaveArq);
      }
      (Store.notificacoesStore || []).forEach(function (n) {
        if (n && (typeof window.pertenceAPracaAtiva !== 'function' || window.pertenceAPracaAtiva(n)) && n.chaveAutomatica && !Store.notificacoesDispensadas.includes(n.chaveAutomatica)) {
          Store.notificacoesDispensadas.push(n.chaveAutomatica);
        }
      });
      salvarDispensadas();
      Store.notificacoesStore = (Store.notificacoesStore || []).filter(function (n) {
        return n && typeof window.pertenceAPracaAtiva === 'function' && !window.pertenceAPracaAtiva(n);
      });
      saveNotificacoes();
      deletarTodasNotificacoesNuvem();
      renderNotificacoes();
      mostrarToast('Notificações Limpas', 'O histórico de notificações desta praça foi esvaziado com sucesso.', 'info');
    }
    window.limparTodasNotificacoes = limparTodasNotificacoes;
  });
})(window, document, window.TVApp);
