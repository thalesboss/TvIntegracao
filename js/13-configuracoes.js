  /* ═══════════════════════════════════════════
     CONFIGURAÇÕES
  ═══════════════════════════════════════════ */

  function iniciais(nome) {
    var partes = nome.trim().split(/\s+/);
    var ini = partes[0] ? partes[0][0] : '';
    if (partes.length > 1) ini += partes[partes.length - 1][0];
    return ini.toUpperCase();
  }

  function syncUserPopover() {
    var nomeEl = document.getElementById('cfg-nome');
    var nome = (nomeEl && nomeEl.value.trim()) ? nomeEl.value.trim() : getUsuarioAtual();
    var upName = document.getElementById('up-name');
    if (upName) upName.textContent = nome || 'Operador';

    var sAvatar = document.querySelector('.s-avatar');
    var upAvatar = document.getElementById('up-avatar');
    if (upAvatar && sAvatar) {
      if (sAvatar.style.backgroundImage) {
        upAvatar.style.backgroundImage = sAvatar.style.backgroundImage;
        upAvatar.textContent = '';
      } else {
        upAvatar.style.backgroundImage = '';
        upAvatar.textContent = sAvatar.textContent;
      }
    }
  }

  function aplicarFotoPerfil(url) {
    if (!url) return;
    var cfgAvatar = document.getElementById('cfg-avatar');
    if (cfgAvatar) { cfgAvatar.style.backgroundImage = url; cfgAvatar.textContent = ''; }

    var sAvatar = document.querySelector('.s-avatar');
    if (sAvatar) { sAvatar.style.backgroundImage = url; sAvatar.textContent = ''; }

    var upAvatar = document.getElementById('up-avatar');
    if (upAvatar) { upAvatar.style.backgroundImage = url; upAvatar.textContent = ''; }
  }

  function carregarFotoPerfilSalva() {
    var url = DBService.getFotoPerfil();
    if (url) aplicarFotoPerfil(url);
  }

  function alterarFotoPerfil(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      var url = 'url(' + e.target.result + ')';
      DBService.saveFotoPerfil(url);
      aplicarFotoPerfil(url);
      syncUserPopover();
    };
    reader.readAsDataURL(file);
  }
  window.alterarFotoPerfil = alterarFotoPerfil;

  function removerFotoPerfil() {
    DBService.removeFotoPerfil();
    var nome = getUsuarioAtual();
    var ini = iniciais(nome || 'Operador');
    var cfgAvatar = document.getElementById('cfg-avatar');
    if (cfgAvatar) { cfgAvatar.style.backgroundImage = ''; cfgAvatar.textContent = ini; }
    var sAvatar = document.querySelector('.s-avatar');
    if (sAvatar) { sAvatar.style.backgroundImage = ''; sAvatar.textContent = ini; }
    var upAvatar = document.getElementById('up-avatar');
    if (upAvatar) { upAvatar.style.backgroundImage = ''; upAvatar.textContent = ini; }
    var photoInput = document.getElementById('cfg-photo-input');
    if (photoInput) photoInput.value = '';
    syncUserPopover();
  }
  window.removerFotoPerfil = removerFotoPerfil;

  function atualizarNomeOperadorUI(nome) {
    var nomeExibido = (nome && nome.trim()) ? nome.trim() : 'Operador';
    localStorage.setItem(USER_NAME_STORAGE_KEY, nomeExibido);
    if (typeof obterOuCriarOperadorPorNome === 'function') {
      obterOuCriarOperadorPorNome(nomeExibido);
    }

    var upName = document.getElementById('up-name');
    if (upName) upName.textContent = nomeExibido;

    var sUserName = document.querySelector('.s-user-name');
    if (sUserName) sUserName.textContent = nomeExibido;

    var cfgNome = document.getElementById('cfg-nome');
    if (cfgNome && cfgNome.value !== nomeExibido) cfgNome.value = nomeExibido;

    var optUser = document.getElementById('opt-user-name');
    if (optUser) {
      optUser.value = nomeExibido;
      optUser.textContent = nomeExibido + ' (Você)';
    }

    var sAvatar = document.querySelector('.s-avatar');
    var cfgAvatar = document.getElementById('cfg-avatar');
    var upAvatar = document.getElementById('up-avatar');
    var temFoto = (sAvatar && sAvatar.style.backgroundImage) || (cfgAvatar && cfgAvatar.style.backgroundImage);
    if (!temFoto) {
      var ini = iniciais(nomeExibido);
      if (sAvatar)   sAvatar.textContent   = ini;
      if (cfgAvatar) cfgAvatar.textContent = ini;
      if (upAvatar)  upAvatar.textContent  = ini;
    }
    syncUserPopover();
  }
  window.atualizarNomeUsuario = atualizarNomeOperadorUI;
  window.atualizarNomeOperadorUI = atualizarNomeOperadorUI;

  async function confirmarIdentificacaoOperador(entrarModoLocal) {
    var input = document.getElementById('ident-operador-nome');
    var chaveInput = document.getElementById('ident-chave-acesso');
    var msgEl = document.getElementById('ident-chave-msg');
    var btn = document.getElementById('btn-confirmar-identificacao') || (event && event.currentTarget);

    var nome = input ? input.value.trim() : '';
    if (!nome) {
      alert('Por favor, informe seu nome completo para continuar.');
      if (input) input.focus();
      return;
    }

    var pracaEl = document.getElementById('ident-operador-praca');
    if (pracaEl && pracaEl.value && typeof setPracaAtual === 'function') {
      setPracaAtual(pracaEl.value);
    }

    var chave = chaveInput ? chaveInput.value.trim() : '';
    var pack = window.ENCRYPTED_TV_CREDENTIALS || (typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS);
    var estacaoJaConectada = typeof isEstacaoConectadaTV === 'function' ? isEstacaoConectadaTV() : false;

    // Se optou conscientemente por entrar em Modo Local
    if (entrarModoLocal) {
      localStorage.removeItem('tv_supabase_url');
      localStorage.removeItem('tv_supabase_key');
      if (typeof DBService !== 'undefined' && DBService) {
        DBService.url = '';
        DBService.key = '';
        DBService.mode = 'local';
      }
      if (typeof updateCloudStatus === 'function') {
        updateCloudStatus(false, 'Modo Local');
      }
    } else if (chave) {
      // Se digitou uma chave, valida e conecta
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span style="display:inline-block;width:12px;height:12px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:6px;vertical-align:middle;"></span> Validando...';
      }
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = 'var(--muted)';
        msgEl.textContent = 'Verificando chave com o banco...';
      }

      var res = await conectarComChaveTV(chave);
      if (!res.ok) {
        if (msgEl) {
          msgEl.style.display = 'block';
          msgEl.style.color = '#DC2626';
          msgEl.textContent = res.error || 'Chave de acesso incorreta.';
        }
        if (chaveInput) {
          chaveInput.focus();
          chaveInput.select();
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Salvar e Continuar';
        }
        return;
      }
    } else if (!estacaoJaConectada && pack && pack.data) {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = '#DC2626';
        msgEl.innerHTML = 'Por favor, digite a Chave de Acesso para conectar à nuvem ou clique em <strong>"Entrar em Modo Local"</strong>.';
      }
      if (chaveInput) chaveInput.focus();
      return;
    }

    localStorage.setItem(USER_NAME_STORAGE_KEY, nome);
    atualizarNomeOperadorUI(nome);
    try {
      if (typeof obterOuCriarOperadorPorNome === 'function') {
        await new Promise(function(resolve) {
          obterOuCriarOperadorPorNome(nome, function(id) {
            resolve(id);
          });
          setTimeout(resolve, 2500);
        });
      }
    } catch(e) {}
    try { if (typeof carregarOperadoresSugeridos === 'function') carregarOperadoresSugeridos(); } catch(e) {}

    if (typeof DBService !== 'undefined' && typeof DBService.syncRemote === 'function') {
      await DBService.syncRemote(true);
    }
    if (typeof renderAll === 'function') {
      renderAll(true);
    }

    fecharPopup('popup-identificacao-operador');
    abrirPopup('popup-entrada');

    if (typeof mostrarToast === 'function') {
      mostrarToast('Operador Identificado', 'Bem-vindo, ' + nome + '!', 'success');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Salvar e Continuar';
    }
  }
  window.confirmarIdentificacaoOperador = confirmarIdentificacaoOperador;

  function mutarNotificacoes(mutado) {
    var dot   = document.querySelector('.notif-dot');
    var badge = document.querySelector('.notif-badge');
    if (dot)   dot.style.display   = mutado ? 'none' : '';
    if (badge) badge.style.display = mutado ? 'none' : '';
  }
  /* ── Gerenciamento de Conexão com o Banco de Dados (Supabase / Modo Local) ── */
  function abrirModalConectarBanco() {
    var input = document.getElementById('conectar-banco-chave');
    var msg = document.getElementById('conectar-banco-msg');
    var btn = document.getElementById('btn-executar-conectar-banco');
    if (input) {
      input.value = '';
      input.type = 'password';
    }
    var ico = document.getElementById('ico-toggle-conectar-chave');
    if (ico) ico.setAttribute('data-lucide', 'eye');
    if (msg) {
      msg.style.display = 'none';
      msg.textContent = '';
    }
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="cloud" style="width:14px;height:14px;stroke-width:2.2;"></i><span>Conectar ao Banco</span>';
    }
    abrirPopup('popup-conectar-banco');
    if (input) {
      setTimeout(function() { input.focus(); }, 150);
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.abrirModalConectarBanco = abrirModalConectarBanco;

  function toggleMostrarChaveConectarBanco() {
    var keyInput = document.getElementById('conectar-banco-chave');
    var ico = document.getElementById('ico-toggle-conectar-chave');
    if (!keyInput) return;
    if (keyInput.type === 'password') {
      keyInput.type = 'text';
      if (ico) ico.setAttribute('data-lucide', 'eye-off');
    } else {
      keyInput.type = 'password';
      if (ico) ico.setAttribute('data-lucide', 'eye');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.toggleMostrarChaveConectarBanco = toggleMostrarChaveConectarBanco;

  async function executarConexaoBanco() {
    var input = document.getElementById('conectar-banco-chave');
    var msg = document.getElementById('conectar-banco-msg');
    var btn = document.getElementById('btn-executar-conectar-banco');
    var chave = input ? input.value.trim() : '';

    if (!chave) {
      if (msg) {
        msg.style.display = 'block';
        msg.style.color = '#DC2626';
        msg.textContent = 'Por favor, digite a Chave de Acesso da TV.';
      }
      if (input) input.focus();
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span style="display:inline-block;width:12px;height:12px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:6px;vertical-align:middle;"></span> Conectando...';
    }
    if (msg) {
      msg.style.display = 'block';
      msg.style.color = 'var(--muted)';
      msg.textContent = 'Validando chave e autenticando no banco de dados...';
    }

    try {
      var res = await conectarComChaveTV(chave);
      if (!res.ok) {
        if (msg) {
          msg.style.display = 'block';
          msg.style.color = '#DC2626';
          msg.textContent = res.error || 'Chave de acesso incorreta. Verifique com a equipe técnica.';
        }
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i data-lucide="cloud" style="width:14px;height:14px;stroke-width:2.2;"></i><span>Conectar ao Banco</span>';
        }
        if (input) {
          input.focus();
          input.select();
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
      }

      fecharPopup('popup-conectar-banco');
      if (typeof updateCloudStatus === 'function') {
        updateCloudStatus(true, 'Nuvem Conectada');
      }
      atualizarUIStatusBancoConfig();

      if (typeof sincronizarEquipeNuvem === 'function') {
        sincronizarEquipeNuvem();
      }
      if (typeof mostrarToast === 'function') {
        mostrarToast('Banco de Dados Conectado', 'Esta estação agora está sincronizada com a nuvem em tempo real!', 'success');
      }
    } catch(err) {
      if (msg) {
        msg.style.display = 'block';
        msg.style.color = '#DC2626';
        msg.textContent = 'Erro ao conectar: ' + err.message;
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="cloud" style="width:14px;height:14px;stroke-width:2.2;"></i><span>Conectar ao Banco</span>';
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }
  window.executarConexaoBanco = executarConexaoBanco;

  function desconectarBancoModoLocal(confirmar) {
    if (confirmar && !confirm('Deseja realmente desconectar do banco de dados e entrar em Modo Local?\n\nOs novos registros ficarão salvos apenas neste computador até você conectar novamente.')) {
      return;
    }
    try {
      localStorage.removeItem('tv_supabase_url');
      localStorage.removeItem('tv_supabase_key');
      if (typeof DBService !== 'undefined' && DBService) {
        DBService.url = '';
        DBService.key = '';
        DBService.mode = 'local';
      }
      if (typeof updateCloudStatus === 'function') {
        updateCloudStatus(false, 'Modo Local');
      }
      atualizarUIStatusBancoConfig();
      if (typeof mostrarToast === 'function') {
        mostrarToast('Modo Local Ativado', 'Estação desconectada da nuvem. Operando em modo offline.', 'info');
      }
    } catch(e) {
      console.warn('Erro ao desconectar banco:', e);
    }
  }
  window.desconectarBancoModoLocal = desconectarBancoModoLocal;

  function atualizarUIStatusBancoConfig() {
    var dotEl = document.getElementById('cfg-db-status-dot');
    var textEl = document.getElementById('cfg-db-status-text');
    var subEl = document.getElementById('cfg-db-status-sub');
    var actionsEl = document.getElementById('cfg-db-actions');
    if (!dotEl || !textEl || !actionsEl) return;

    var conectado = typeof isEstacaoConectadaTV === 'function' ? isEstacaoConectadaTV() : false;

    if (conectado) {
      dotEl.style.background = '#10B981';
      dotEl.style.boxShadow = '0 0 8px rgba(16,185,129,0.5)';
      textEl.textContent = 'Conectado ao Supabase';
      textEl.style.color = 'var(--txt)';
      if (subEl) subEl.textContent = 'Sincronização em nuvem ativa em tempo real';

      actionsEl.innerHTML =
        '<button type="button" class="btn btn-ghost btn-sm" onclick="abrirModalConectarBanco()" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;" title="Alterar Chave de Acesso">' +
          '<i data-lucide="key" style="width:13px;height:13px;"></i>' +
          '<span>Alterar Chave</span>' +
        '</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" onclick="desconectarBancoModoLocal(true)" style="color:var(--red);border-color:var(--red-border);display:inline-flex;align-items:center;gap:5px;font-size:12px;" title="Desconectar e alternar para Modo Local">' +
          '<i data-lucide="power" style="width:13px;height:13px;"></i>' +
          '<span>Desconectar (Modo Local)</span>' +
        '</button>';
    } else {
      dotEl.style.background = '#EF4444';
      dotEl.style.boxShadow = '0 0 8px rgba(239,68,68,0.5)';
      textEl.textContent = 'Desconectado (Modo Local)';
      textEl.style.color = '#DC2626';
      if (subEl) subEl.textContent = 'Operando localmente. Os novos registros ficam salvos apenas neste computador.';

      actionsEl.innerHTML =
        '<button type="button" class="btn btn-primary btn-sm" onclick="abrirModalConectarBanco()" style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;" title="Conectar ao banco de dados Supabase">' +
          '<i data-lucide="database" style="width:14px;height:14px;stroke-width:2.2;"></i>' +
          '<span>Conectar ao Banco de Dados</span>' +
        '</button>';
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.atualizarUIStatusBancoConfig = atualizarUIStatusBancoConfig;

  /* ── Gerenciamento de Credenciais do Supabase na Aba Configurações ── */
  function carregarCredenciaisSupabaseConfig() {
    var urlInput = document.getElementById('cfg-supabase-url');
    var keyInput = document.getElementById('cfg-supabase-key');
    var badgeEl  = document.getElementById('cfg-db-status-badge');

    var currentUrl = (DBService && DBService.url) ? DBService.url : (localStorage.getItem('tv_supabase_url') || '');
    var currentKey = (DBService && DBService.key) ? DBService.key : (localStorage.getItem('tv_supabase_key') || '');

    if (urlInput && !urlInput.value) urlInput.value = currentUrl;
    if (keyInput && !keyInput.value) keyInput.value = currentKey;

    if (badgeEl) {
      if (currentUrl && currentKey) {
        badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#10B981;"></span> Conectado ao Supabase';
        badgeEl.style.color = '#059669';
      } else {
        badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#EF4444;"></span> Desconectado (Modo Local)';
        badgeEl.style.color = '#DC2626';
      }
    }
  }
  window.carregarCredenciaisSupabaseConfig = carregarCredenciaisSupabaseConfig;

  function toggleMostrarChaveSupabase() {
    var keyInput = document.getElementById('cfg-supabase-key');
    var ico = document.getElementById('ico-toggle-key');
    if (!keyInput) return;
    if (keyInput.type === 'password') {
      keyInput.type = 'text';
      if (ico) ico.setAttribute('data-lucide', 'eye-off');
    } else {
      keyInput.type = 'password';
      if (ico) ico.setAttribute('data-lucide', 'eye');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.toggleMostrarChaveSupabase = toggleMostrarChaveSupabase;

  async function testarConexaoSupabaseConfig(silencioso) {
    var urlInput = document.getElementById('cfg-supabase-url');
    var keyInput = document.getElementById('cfg-supabase-key');
    var url = urlInput ? urlInput.value.trim().replace(/\/+$/, '') : '';
    var key = keyInput ? keyInput.value.trim() : '';
    var badgeEl = document.getElementById('cfg-db-status-badge');

    if (!url || !key) {
      if (!silencioso && typeof mostrarToast === 'function') {
        mostrarToast('Campos Vazios', 'Informe a URL e a Chave do Supabase para testar.', 'warning');
      }
      return { ok: false, status: 0, message: 'Campos vazios' };
    }

    if (badgeEl) {
      badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#F59E0B;"></span> Testando conexão...';
      badgeEl.style.color = '#D97706';
    }

    try {
      var res = await fetch(url + '/rest/v1/ocorrencias?select=id&limit=1', {
        headers: {
          'apikey': key,
          'Authorization': 'Bearer ' + key,
          'Cache-Control': 'no-cache'
        }
      });

      if (res.ok) {
        if (badgeEl) {
          badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#10B981;"></span> Conexão bem-sucedida!';
          badgeEl.style.color = '#059669';
        }
        if (!silencioso && typeof mostrarToast === 'function') {
          mostrarToast('Conexão Estabelecida', 'Autenticado com sucesso no banco de dados Supabase.', 'success');
        }
        return { ok: true, status: res.status };
      }

      var erroTexto = '';
      try {
        var errBody = await res.json();
        erroTexto = errBody.message || errBody.error || errBody.msg || JSON.stringify(errBody);
      } catch(e) {
        try { erroTexto = await res.text(); } catch(e2) {}
      }

      if (res.status === 402) {
        var msg402 = 'Projeto Pausado no Supabase (Erro 402). Acesse supabase.com/dashboard e clique em "Restore project" para reativar o banco.';
        if (badgeEl) {
          badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#EF4444;"></span> Projeto Pausado no Supabase (402)';
          badgeEl.style.color = '#DC2626';
        }
        if (!silencioso && typeof mostrarToast === 'function') {
          mostrarToast('Projeto Pausado (402)', 'O seu projeto do Supabase está pausado por inatividade. Basta entrar em supabase.com/dashboard e clicar em "Restore project".', 'warning');
        }
        return { ok: false, status: 402, message: msg402, details: erroTexto };
      } else if (res.status === 401 || res.status === 403) {
        var msg401 = 'Chave Inválida (Erro ' + res.status + '). Verifique a anon/public key copiada do Supabase.';
        if (badgeEl) {
          badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#EF4444;"></span> Chave Não Autorizada (' + res.status + ')';
          badgeEl.style.color = '#DC2626';
        }
        if (!silencioso && typeof mostrarToast === 'function') {
          mostrarToast('Chave Inválida (' + res.status + ')', 'A chave do Supabase não foi aceita.', 'danger');
        }
        return { ok: false, status: res.status, message: msg401, details: erroTexto };
      } else if (res.status === 404) {
        try {
          var resRoot = await fetch(url + '/rest/v1/', {
            headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
          });
          if (resRoot.ok || resRoot.status === 200) {
            var msg404 = 'Conectado ao Supabase com sucesso, mas a tabela "ocorrencias" ainda não foi criada no schema do banco.';
            if (badgeEl) {
              badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#F59E0B;"></span> Conectado (Tabela Ocorrências pendente)';
              badgeEl.style.color = '#D97706';
            }
            if (!silencioso && typeof mostrarToast === 'function') {
              mostrarToast('Conexão OK', msg404, 'warning');
            }
            return { ok: true, tabelaAusente: true, status: 404, message: msg404 };
          }
        } catch(e404) {}
      }

      var msgGen = 'Falha na conexão (Status ' + res.status + (erroTexto ? ': ' + erroTexto : '') + ')';
      if (badgeEl) {
        badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#EF4444;"></span> ' + msgGen;
        badgeEl.style.color = '#DC2626';
      }
      if (!silencioso && typeof mostrarToast === 'function') {
        mostrarToast('Erro de Conexão', msgGen, 'danger');
      }
      return { ok: false, status: res.status, message: msgGen, details: erroTexto };
    } catch(err) {
      var msgErr = 'Falha na conexão (' + err.message + ')';
      if (badgeEl) {
        badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#EF4444;"></span> ' + msgErr;
        badgeEl.style.color = '#DC2626';
      }
      if (!silencioso && typeof mostrarToast === 'function') {
        mostrarToast('Erro de Conexão', 'Não foi possível contatar o Supabase. Verifique a URL e sua conexão.', 'danger');
      }
      return { ok: false, status: 0, message: msgErr };
    }
  }
  window.testarConexaoSupabaseConfig = testarConexaoSupabaseConfig;

  async function salvarCredenciaisSupabaseConfig() {
    var urlInput = document.getElementById('cfg-supabase-url');
    var keyInput = document.getElementById('cfg-supabase-key');
    var url = urlInput ? urlInput.value.trim().replace(/\/+$/, '') : '';
    var key = keyInput ? keyInput.value.trim() : '';

    if (!url || !key) {
      if (typeof mostrarToast === 'function') mostrarToast('Atenção', 'Preencha a URL e a Chave do Supabase.', 'warning');
      return;
    }

    var badgeEl = document.getElementById('cfg-db-status-badge');
    if (badgeEl) {
      badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#F59E0B;"></span> Verificando conexão antes de salvar...';
      badgeEl.style.color = '#D97706';
    }

    var teste = await testarConexaoSupabaseConfig(true);
    if (!teste.ok) {
      if (teste.status === 402) {
        if (typeof mostrarToast === 'function') {
          mostrarToast('Projeto Pausado no Supabase (402)', 'O seu projeto está pausado no Supabase. Acesse supabase.com/dashboard e clique em "Restore project" para reativá-lo.', 'danger');
        }
      } else {
        if (typeof mostrarToast === 'function') {
          mostrarToast('Falha na Conexão (' + (teste.status || 'Erro') + ')', teste.message || 'Verifique suas credenciais antes de salvar.', 'danger');
        }
      }
      return;
    }

    localStorage.setItem('tv_supabase_url', url);
    localStorage.setItem('tv_supabase_key', key);

    DBService.url = url;
    DBService.key = key;
    DBService.mode = 'supabase';

    if (badgeEl) {
      badgeEl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#10B981;"></span> Conectado e Sincronizando...';
      badgeEl.style.color = '#059669';
    }

    if (typeof mostrarToast === 'function') {
      mostrarToast('Banco Conectado', 'Credenciais verificadas e ativas! Sincronizando dados com o Supabase...', 'success');
    }

    /* Puxa dados da nuvem imediatamente */
    if (typeof DBService.init === 'function') DBService.init();
    if (typeof DBService.syncRemote === 'function') DBService.syncRemote();
  }
  window.salvarCredenciaisSupabaseConfig = salvarCredenciaisSupabaseConfig;

  function salvarConfiguracoes() {
    var btn = event && event.currentTarget;
    var urlEl = document.getElementById('cfg-supabase-url');
    var keyEl = document.getElementById('cfg-supabase-key');
    if (urlEl && keyEl && urlEl.value.trim() && keyEl.value.trim()) {
      salvarCredenciaisSupabaseConfig();
    }
    if (!btn) return;
    var textoOriginal = btn.textContent;
    btn.textContent = 'Salvo!';
    btn.disabled = true;
    setTimeout(function() {
      btn.textContent = textoOriginal;
      btn.disabled = false;
    }, 1400);
  }
  window.salvarConfiguracoes = salvarConfiguracoes;

  /* ── Gerador de Chave Criptografada Segura para Deploy no GitHub ── */
  function usarCredenciaisPreenchidasParaGerador() {
    var urlEl = document.getElementById('cfg-supabase-url');
    var keyEl = document.getElementById('cfg-supabase-key');
    var url = urlEl ? urlEl.value.trim() : '';
    var key = keyEl ? keyEl.value.trim() : '';

    if (!url || !key) {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Atenção', 'Preencha a URL e a Publishable Key no card acima primeiro.', 'warning');
      } else {
        alert('Preencha a URL e a Publishable Key no card acima primeiro.');
      }
      return;
    }

    if (typeof mostrarToast === 'function') {
      mostrarToast('Dados Prontos', 'URL e Chave do Supabase preparadas para a criptografia.', 'info');
    }
  }
  window.usarCredenciaisPreenchidasParaGerador = usarCredenciaisPreenchidasParaGerador;

  var ultimoBlocoGerado = null;

  async function executarGeradorChaveSegura() {
    var urlEl = document.getElementById('cfg-supabase-url');
    var keyEl = document.getElementById('cfg-supabase-key');
    var passEl = document.getElementById('gen-chave-passphrase');
    var btn = document.getElementById('btn-executar-gerador');
    var outArea = document.getElementById('gen-resultado-area');
    var outPre = document.getElementById('gen-codigo-output');

    var url = urlEl ? urlEl.value.trim() : '';
    var key = keyEl ? keyEl.value.trim() : '';
    var pass = passEl ? passEl.value.trim() : '';

    if (!url || !key) {
      alert('Por favor, informe a URL do Supabase e a API Key no card de Conexão com o Banco acima.');
      if (urlEl) urlEl.focus();
      return;
    }

    if (!pass) {
      alert('Por favor, defina uma Chave de Acesso para a equipe (ex: TvIntegracao@2026).');
      if (passEl) passEl.focus();
      return;
    }

    if (pass.length < 6) {
      alert('A chave de acesso deve ter pelo menos 6 caracteres para garantir segurança máxima contra ataques.');
      if (passEl) passEl.focus();
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span style="display:inline-block;width:12px;height:12px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:6px;vertical-align:middle;"></span> Criptografando (PBKDF2 250k)...';
    }

    try {
      if (!window.TVCrypto) {
        throw new Error('Módulo TVCrypto indisponível.');
      }
      var payload = { url: url, key: key };
      var encPack = await window.TVCrypto.encrypt(pass, payload);
      ultimoBlocoGerado = encPack;
      window.ultimoBlocoGerado = encPack;
      window.ENCRYPTED_TV_CREDENTIALS = encPack;

      var snippet = '// Cole no config.js ou no script.js\n' +
        'window.ENCRYPTED_TV_CREDENTIALS = ' + JSON.stringify(encPack, null, 2) + ';';

      if (outPre) outPre.textContent = snippet;
      if (outArea) outArea.style.display = 'block';

      if (typeof mostrarToast === 'function') {
        mostrarToast('Código Gerado!', 'Bloco criptografado com sucesso. Totalmente seguro para o GitHub!', 'success');
      }
    } catch (e) {
      alert('Erro ao criptografar: ' + e.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="lock" style="width:14px;height:14px;"></i> Gerar Bloco Criptografado Seguro';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  }
  window.executarGeradorChaveSegura = executarGeradorChaveSegura;

  function copiarCodigoCriptografadoGerado() {
    var outPre = document.getElementById('gen-codigo-output');
    if (!outPre || !outPre.textContent) return;
    navigator.clipboard.writeText(outPre.textContent).then(function() {
      if (typeof mostrarToast === 'function') {
        mostrarToast('Copiado!', 'Código criptografado copiado para a área de transferência.', 'success');
      } else {
        alert('Código copiado com sucesso!');
      }
    }).catch(function() {
      alert('Selecione e copie o texto manualmente.');
    });
  }
  window.copiarCodigoCriptografadoGerado = copiarCodigoCriptografadoGerado;

  function aplicarCodigoCriptografadoAgora() {
    if (!ultimoBlocoGerado) {
      alert('Gere o código primeiro clicando no botão acima.');
      return;
    }
    window.ENCRYPTED_TV_CREDENTIALS = ultimoBlocoGerado;
    if (typeof mostrarToast === 'function') {
      mostrarToast('Ativado!', 'Pacote criptografado ativado na memória deste navegador.', 'success');
    } else {
      alert('Pacote ativado com sucesso neste navegador!');
    }
  }
  window.aplicarCodigoCriptografadoAgora = aplicarCodigoCriptografadoAgora;