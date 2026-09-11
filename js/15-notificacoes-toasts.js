  /* ═══════════════════════════════════════════
     SISTEMA DE TOAST NOTIFICATIONS & CENTRAL DE ALERTAS
  ═══════════════════════════════════════════ */

  var NOTIF_STORAGE_KEY = 'tv_notificacoes_v2';
  var NOTIF_DISMISSED_KEY = 'tv_notificacoes_dismissed_v2';
  var notificacoesStore = [];
  var notificacoesDispensadas = [];

  var INITIAL_NOTIFICACOES_SEED = [
    {
      id: 'notif_init_1',
      titulo: 'Boas-vindas ao Turno TV Integração',
      msg: 'Sistema operacional ativo. Verifique os checklists diários de CTRS e as transmissões ao vivo agendadas.',
      tempo: formatDataHoraLocal(),
      tipo: 'info',
      lida: false,
      chaveAutomatica: 'seed_welcome'
    },
    {
      id: 'notif_init_2',
      titulo: 'Atenção: Transmissor VHF',
      msg: 'Ocorrência aberta na Torre Central requer acompanhamento dos níveis de potência.',
      tempo: formatDataHoraLocal(),
      tipo: 'warning',
      lida: false,
      chaveAutomatica: 'seed_transmissor'
    }
  ];

  function getNotifDBCredentials() {
    var url = (typeof DBService !== 'undefined' && DBService && DBService.url) ? DBService.url : (localStorage.getItem('tv_supabase_url') || '');
    var key = (typeof DBService !== 'undefined' && DBService && DBService.key) ? DBService.key : (localStorage.getItem('tv_supabase_key') || '');
    if ((!url || url.indexOf('seu-projeto') !== -1) && typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG.SUPABASE_URL && window.ENV_CONFIG.SUPABASE_URL.indexOf('seu-projeto') === -1) {
      url = window.ENV_CONFIG.SUPABASE_URL;
    }
    if ((!key || key.indexOf('sua-chave') !== -1) && typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG.SUPABASE_ANON_KEY && window.ENV_CONFIG.SUPABASE_ANON_KEY.indexOf('sua-chave') === -1) {
      key = window.ENV_CONFIG.SUPABASE_ANON_KEY;
    }
    return { url: url ? url.replace(/\/+$/, '') : '', key: key };
  }

  function loadNotificacoes() {
    notificacoesStore = INITIAL_NOTIFICACOES_SEED.slice();
    window.notificacoesStore = notificacoesStore;
    sincronizarNotificacoesNuvem();
  }

  function saveNotificacoes() {
    window.notificacoesStore = notificacoesStore;
    atualizarBadgesNotificacoes();
  }

  function sincronizarNotificacoesNuvem() {
    var db = getNotifDBCredentials();
    if (!db.url || !db.key) return;

    fetch(db.url + '/rest/v1/notificacoes?select=*&order=id.desc&limit=50', {
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Cache-Control': 'no-cache'
      }
    })
    .then(function(res) { return res.ok ? res.json() : null; })
    .then(function(cloudNotifs) {
      if (Array.isArray(cloudNotifs) && cloudNotifs.length > 0) {
        notificacoesStore = cloudNotifs;
        window.notificacoesStore = notificacoesStore;
        atualizarBadgesNotificacoes();
        renderNotificacoes();
      }
    })
    .catch(function() {});
  }
  window.sincronizarNotificacoesNuvem = sincronizarNotificacoesNuvem;

  function salvarNotificacaoNuvem(notif) {
    var db = getNotifDBCredentials();
    if (!db.url || !db.key || !notif) return;

    fetch(db.url + '/rest/v1/notificacoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(notif)
    }).catch(function() {});
  }
  window.salvarNotificacaoNuvem = salvarNotificacaoNuvem;

  function mostrarToast(titulo, mensagem, tipo) {
    var container = document.getElementById('toast-container');
    if (!container) return;

    var toastType = tipo || 'info';
    var iconName = toastType === 'success' ? 'check-circle' : (toastType === 'warning' || toastType === 'warn') ? 'alert-triangle' : (toastType === 'danger' || toastType === 'error') ? 'alert-circle' : 'info';

    var toastEl = document.createElement('div');
    toastEl.className = 'toast toast-' + toastType;
    toastEl.innerHTML =
      '<div class="toast-icon"><i data-lucide="' + iconName + '" style="width:18px;height:18px;stroke-width:2;"></i></div>' +
      '<div class="toast-content">' +
        '<div class="toast-title">' + (titulo || 'Notificação') + '</div>' +
        '<div class="toast-msg">' + (mensagem || '') + '</div>' +
      '</div>' +
      '<button class="toast-close" type="button" aria-label="Fechar notificação">&times;</button>';

    function fecharComAnimacao() {
      toastEl.classList.add('toast-exit');
      setTimeout(function() {
        if (toastEl.parentNode) toastEl.remove();
      }, 380);
    }

    var closeBtn = toastEl.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.onclick = fecharComAnimacao;
    }

    container.appendChild(toastEl);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    /* Remove automaticamente com física de transição suave em 4.5s */
    setTimeout(function() {
      if (toastEl.parentNode) {
        fecharComAnimacao();
      }
    }, 4500);
  }
  window.mostrarToast = mostrarToast;

  function adicionarNotificacao(titulo, mensagem, tipo, exibirToast, chaveAutomatica) {
    if (chaveAutomatica && Array.isArray(notificacoesDispensadas) && notificacoesDispensadas.includes(chaveAutomatica)) {
      return;
    }

    var novaNotif = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      titulo: titulo || 'Notificação do Sistema',
      msg: mensagem || '',
      tempo: formatDataHoraLocal(),
      tipo: tipo || 'info',
      lida: false,
      chaveAutomatica: chaveAutomatica || null
    };

    var jaExiste = (notificacoesStore || []).some(function(n) {
      return n && ((chaveAutomatica && n.chaveAutomatica === chaveAutomatica) || (n.titulo === titulo && n.msg === mensagem));
    });

    if (!jaExiste) {
      notificacoesStore = [novaNotif].concat(notificacoesStore || []).slice(0, 50);
      saveNotificacoes();
      if (exibirToast !== false) {
        mostrarToast(titulo, mensagem, tipo);
      }
      renderNotificacoes();
    }
  }
  window.adicionarNotificacao = adicionarNotificacao;

  function removerNotificacao(id) {
    var notif = (notificacoesStore || []).find(function(n){ return n && n.id === id; });
    if (notif && notif.chaveAutomatica) {
      if (!notificacoesDispensadas.includes(notif.chaveAutomatica)) {
        notificacoesDispensadas.push(notif.chaveAutomatica);
      }
    }
    notificacoesStore = (notificacoesStore || []).filter(function(n){ return n && n.id !== id; });
    saveNotificacoes();
    renderNotificacoes();
  }
  window.removerNotificacao = removerNotificacao;

  function atualizarBadgesNotificacoes() {
    var badgeSidebar = document.querySelector('.notif-badge');
    var notifDot = document.querySelector('.notif-dot');
    var naoLidas = (notificacoesStore || []).filter(function(n){ return n && !n.lida; }).length;

    if (badgeSidebar) {
      if (naoLidas > 0) {
        badgeSidebar.textContent = naoLidas;
        badgeSidebar.style.display = 'inline-flex';
      } else {
        badgeSidebar.textContent = '0';
        badgeSidebar.style.display = 'none';
      }
    }
    if (notifDot) {
      notifDot.style.display = naoLidas > 0 ? 'block' : 'none';
    }
  }

  function verificarNotificacoesAutomaticas() {
    var idsNaLixeira = (lixeiraData || []).map(function(item){ return item.id; });
    // 1. Ocorrências com prazo expirado
    (ocorrencias || []).forEach(function(oc) {
      if (oc && oc.status === 'aberta' && !idsNaLixeira.includes(oc.id) && isOcorrenciaVencida(oc)) {
        var chaveOc = 'vencida_' + oc.id + '_' + (oc.prazo || '');
        var tit = '⚠️ Prazo Expirado: ' + (oc.titulo || 'Ocorrência');
        var msg = 'A ocorrência para "' + (oc.local || 'Central Técnica') + '" ultrapassou o horário estipulado (' + (oc.prazo || 'Prazo vencido') + ') e requer atenção.';
        adicionarNotificacao(tit, msg, 'warning', false, chaveOc);
      }
    });

    // 2. Ocorrências arquivadas pendentes para o turno
    var arquivadas = getArquivadas().filter(function(oc){ return !idsNaLixeira.includes(oc.id); });
    if (arquivadas.length > 0) {
      var chaveArq = 'arq_status_' + arquivadas.map(function(a){ return a.id; }).sort().join('_');
      var titArq = '📦 Ocorrências Arquivadas para o Turno';
      var msgArq = 'Existem ' + arquivadas.length + ' ocorrência(s) arquivada(s) aguardando verificação e acompanhamento da equipe.';
      adicionarNotificacao(titArq, msgArq, 'info', false, chaveArq);
    }
  }
  window.verificarNotificacoesAutomaticas = verificarNotificacoesAutomaticas;

  function renderNotificacoes() {
    var container = document.getElementById('notif-list-body');
    atualizarBadgesNotificacoes();
    if (!container) return;

    if (!notificacoesStore || notificacoesStore.length === 0) {
      container.innerHTML =
        '<div style="text-align:center;padding:32px 16px;background:var(--surface);border:1px solid var(--border-lt);border-radius:var(--r-md);">' +
          '<i data-lucide="bell-off" style="width:32px;height:32px;color:var(--muted);stroke-width:1.5;margin-bottom:8px;"></i>' +
          '<p style="color:var(--txt);font-size:13.5px;font-weight:600;">Nenhuma notificação</p>' +
          '<p style="color:var(--muted);font-size:11.5px;margin-top:2px;">Alertas do sistema, prazos de ocorrências e avisos de turno aparecerão aqui.</p>' +
        '</div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = notificacoesStore.map(function(n) {
      var isWarning = n.tipo === 'warning' || n.tipo === 'warn';
      var isDanger  = n.tipo === 'danger'  || n.tipo === 'error';
      var isSuccess = n.tipo === 'success' || n.tipo === 'ok';

      var bgCor     = isDanger ? '#FEF2F2' : isWarning ? '#FFFBEB' : isSuccess ? '#F0FDF4' : '#EFF6FF';
      var borderCor = isDanger ? '#FECACA' : isWarning ? '#FDE68A' : isSuccess ? '#BBF7D0' : '#BFDBFE';
      var txtCor    = isDanger ? '#DC2626' : isWarning ? '#D97706' : isSuccess ? '#16A34A' : '#2563EB';
      var icoNome   = isDanger ? 'alert-circle' : isWarning ? 'alert-triangle' : isSuccess ? 'check-circle-2' : 'info';
      var unreadBadge = !n.lida ? '<span class="tag tag-blue" style="font-size:9.5px;padding:1px 6px;margin-left:6px;font-weight:600;">Nova</span>' : '';

      return (
        '<div style="background:' + bgCor + ';border:1px solid ' + borderCor + ';border-radius:var(--r-md);padding:10px 12px;display:flex;gap:10px;align-items:flex-start;position:relative;">' +
          '<div style="color:' + txtCor + ';margin-top:1px;"><i data-lucide="' + icoNome + '" style="width:16px;height:16px;stroke-width:2.2;"></i></div>' +
          '<div style="flex:1;display:flex;flex-direction:column;gap:2px;padding-right:18px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<div style="display:flex;align-items:center;"><strong style="font-size:12.5px;color:' + txtCor + ';">' + (n.titulo || 'Alerta') + '</strong>' + unreadBadge + '</div>' +
              '<span style="font-size:10.5px;color:var(--muted);white-space:nowrap;margin-left:8px;">' + (n.tempo || '') + '</span>' +
            '</div>' +
            '<span style="font-size:12px;color:var(--txt2);line-height:1.4;">' + (n.msg || '') + '</span>' +
          '</div>' +
          '<button type="button" onclick="removerNotificacao(\'' + n.id + '\')" title="Dispensar notificação" style="position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;" onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\'var(--muted)\'">' +
            '<i data-lucide="x" style="width:13px;height:13px;stroke-width:2.2;"></i>' +
          '</button>' +
        '</div>'
      );
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.renderNotificacoes = renderNotificacoes;

  function abrirNotificacoes() {
    renderNotificacoes();
    abrirPopup('popup-notificacoes');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(function() {
      (notificacoesStore || []).forEach(function(n){ if (n) n.lida = true; });
      saveNotificacoes();
      atualizarBadgesNotificacoes();
    }, 1200);
  }
  window.abrirNotificacoes = abrirNotificacoes;

  function limparTodasNotificacoes() {
    // 1. Marca todas as notificações atuais como dispensadas para que o robô não as recrie
    var idsNaLixeira = (lixeiraData || []).map(function(item){ return item.id; });
    (ocorrencias || []).forEach(function(oc) {
      if (oc && oc.status === 'aberta' && !idsNaLixeira.includes(oc.id)) {
        var chaveOc = 'vencida_' + oc.id + '_' + (oc.prazo || '');
        if (!notificacoesDispensadas.includes(chaveOc)) {
          notificacoesDispensadas.push(chaveOc);
        }
      }
    });

    var arquivadas = getArquivadas().filter(function(oc){ return !idsNaLixeira.includes(oc.id); });
    if (arquivadas.length > 0) {
      var chaveArq = 'arq_status_' + arquivadas.map(function(a){ return a.id; }).sort().join('_');
      if (!notificacoesDispensadas.includes(chaveArq)) {
        notificacoesDispensadas.push(chaveArq);
      }
    }

    (notificacoesStore || []).forEach(function(n) {
      if (n && n.chaveAutomatica && !notificacoesDispensadas.includes(n.chaveAutomatica)) {
        notificacoesDispensadas.push(n.chaveAutomatica);
      }
    });

    notificacoesStore = [];
    saveNotificacoes();
    renderNotificacoes();
    if (typeof mostrarToast === 'function') {
      mostrarToast('Notificações Limpas', 'O histórico de notificações foi esvaziado com sucesso.', 'info');
    }
  }
  window.limparTodasNotificacoes = limparTodasNotificacoes;
