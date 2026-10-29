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

  function atualizarNomeOperadorUI(nome, salvarStorage) {
    var nomeExibido = (nome && nome.trim()) ? nome.trim() : 'Operador';
    if (salvarStorage !== false && nomeExibido !== 'Operador') {
      localStorage.setItem(USER_NAME_STORAGE_KEY, nomeExibido);
    }
    if (typeof obterOuCriarOperadorPorNome === 'function' && nomeExibido !== 'Operador') {
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

  async function hashSenhaSHA256(texto) {
    if (!window.crypto || !window.crypto.subtle) {
      return btoa(unescape(encodeURIComponent(texto)));
    }
    var enc = new TextEncoder();
    var buf = await crypto.subtle.digest('SHA-256', enc.encode(texto));
    return Array.prototype.map.call(new Uint8Array(buf), function(x) {
      return ('00' + x.toString(16)).slice(-2);
    }).join('');
  }
  window.hashSenhaSHA256 = hashSenhaSHA256;

  function aplicarPerfilOperadorAutenticado(op) {
    if (!op) return;
    var nome  = (op.nome || 'Operador').trim();
    var email = (op.email || '').trim();
    var cargo = (op.cargo || 'Técnico de Operações').trim();
    var tag   = (op.tag_perfil || 'Tecnico').trim();
    var praca = (op.praca && op.praca.indexOf('Uber') !== -1) ? 'Uberlândia' : 'Juiz de Fora';

    try {
      localStorage.setItem(USER_NAME_STORAGE_KEY, nome);
      localStorage.setItem('tv_user_email_v1', email);
      localStorage.setItem('tv_user_tag_v1', tag);
      localStorage.setItem('tv_user_cargo_v1', cargo);
    } catch (e) {}

    if (typeof setPracaAtual === 'function') {
      setPracaAtual(praca);
    }
    atualizarNomeOperadorUI(nome, true);

    var labelCargo = cargo + ' [' + tag + ']';
    var upEmail = document.getElementById('up-email');
    if (upEmail && email) upEmail.textContent = email;
    var cfgEmail = document.getElementById('cfg-email');
    if (cfgEmail && email) cfgEmail.value = email;

    var upRole = document.getElementById('up-role');
    if (upRole) upRole.textContent = labelCargo;
    var sRole = document.querySelector('.s-user-role');
    if (sRole) sRole.textContent = labelCargo;
    var cfgCargo = document.getElementById('cfg-cargo');
    if (cfgCargo) cfgCargo.value = labelCargo;
  }
  window.aplicarPerfilOperadorAutenticado = aplicarPerfilOperadorAutenticado;

  function resetarFluxoEmailIdentificacao() {
    window._operadorLoginPendente = null;
    var emailInput = document.getElementById('ident-operador-email');
    var cardEl     = document.getElementById('ident-operador-card');
    var boxCriar   = document.getElementById('ident-box-criar-senha');
    var boxDigitar = document.getElementById('ident-box-digitar-senha');
    var msgEl      = document.getElementById('ident-chave-msg');
    var btn        = document.getElementById('btn-confirmar-identificacao');

    if (emailInput) {
      emailInput.disabled = false;
      emailInput.style.background = 'var(--surface)';
      emailInput.focus();
    }
    if (cardEl)     cardEl.style.display     = 'none';
    if (boxCriar)   boxCriar.style.display   = 'none';
    if (boxDigitar) boxDigitar.style.display = 'none';
    if (msgEl)      msgEl.style.display      = 'none';
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Continuar';
    }
  }
  window.resetarFluxoEmailIdentificacao = resetarFluxoEmailIdentificacao;

  function alternarModoLoginManual() {
    var wrapEmail  = document.getElementById('ident-step-email-wrap');
    var wrapManual = document.getElementById('ident-step-manual-wrap');
    var linkEl     = document.getElementById('link-alternar-modo-login');
    var msgEl      = document.getElementById('ident-chave-msg');
    var btn        = document.getElementById('btn-confirmar-identificacao');
    if (!wrapEmail || !wrapManual) return;

    var indoParaManual = (wrapManual.style.display === 'none');
    wrapEmail.style.display  = indoParaManual ? 'none' : 'flex';
    wrapManual.style.display = indoParaManual ? 'flex' : 'none';
    if (msgEl) msgEl.style.display = 'none';

    if (indoParaManual) {
      if (linkEl) linkEl.textContent = 'Voltar para Login por E-mail Corporativo';
      if (btn) btn.textContent = 'Salvar e Continuar';
      var nomeIn = document.getElementById('ident-operador-nome');
      if (nomeIn) setTimeout(function() { nomeIn.focus(); }, 100);
    } else {
      if (linkEl) linkEl.textContent = 'Entrar com Chave da Estação (Sem e-mail)';
      resetarFluxoEmailIdentificacao();
    }
  }
  window.alternarModoLoginManual = alternarModoLoginManual;

  function exibirMsgLogin(msgEl, texto, tipo) {
    if (!msgEl) return;
    msgEl.style.display = 'block';
    if (tipo === 'erro') {
      msgEl.style.background = '#FEF2F2';
      msgEl.style.border     = '1px solid #FECACA';
      msgEl.style.color      = '#DC2626';
    } else if (tipo === 'ok') {
      msgEl.style.background = '#F0FDF4';
      msgEl.style.border     = '1px solid #BBF7D0';
      msgEl.style.color      = '#15803D';
    } else {
      msgEl.style.background = '#F8FAFC';
      msgEl.style.border     = '1px solid var(--border)';
      msgEl.style.color      = 'var(--muted)';
    }
    msgEl.innerHTML = texto;
  }

  async function garantirConexaoBancoParaLogin() {
    var jaConectado = (typeof isEstacaoConectadaTV === 'function') && isEstacaoConectadaTV();
    if (jaConectado) {
      var u = (typeof DBService !== 'undefined' && DBService.url) ? DBService.url : localStorage.getItem('tv_supabase_url');
      var k = (typeof DBService !== 'undefined' && DBService.key) ? DBService.key : localStorage.getItem('tv_supabase_key');
      return { ok: true, url: u.replace(/\/+$/, ''), key: k };
    }
    var pack = window.ENCRYPTED_TV_CREDENTIALS || (window.ENV_CONFIG && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS);
    if (pack && pack.data && typeof TVCrypto !== 'undefined') {
      try {
        var creds = await TVCrypto.decrypt(atob('QEludGVncmEyNjIw'), pack);
        if (creds && creds.url && creds.key) {
          return { ok: true, url: creds.url.replace(/\/+$/, ''), key: creds.key, credsObj: creds };
        }
      } catch (e) {}
    }
    return { ok: false };
  }

  async function confirmarIdentificacaoOperador(entrarModoLocal) {
    var wrapManual = document.getElementById('ident-step-manual-wrap');
    var modoManualAtivo = wrapManual && wrapManual.style.display !== 'none';
    var msgEl = document.getElementById('ident-chave-msg');
    var btn   = document.getElementById('btn-confirmar-identificacao');

    // Se escolheu trabalhar Offline
    if (entrarModoLocal) {
      var nomeOff = (document.getElementById('ident-operador-nome') && document.getElementById('ident-operador-nome').value.trim())
        || (document.getElementById('ident-operador-email') && document.getElementById('ident-operador-email').value.split('@')[0])
        || 'Operador';
      localStorage.removeItem('tv_supabase_url');
      localStorage.removeItem('tv_supabase_key');
      if (typeof DBService !== 'undefined' && DBService) {
        DBService.url = '';
        DBService.key = '';
        DBService.mode = 'local';
      }
      if (typeof updateCloudStatus === 'function') updateCloudStatus(false, 'Modo Local');
      localStorage.setItem(USER_NAME_STORAGE_KEY, nomeOff);
      atualizarNomeOperadorUI(nomeOff);
      fecharPopup('popup-identificacao-operador');
      abrirPopup('popup-entrada');
      return;
    }

    // ══════════════════════════════════════════════════════════════════
    // FLUXO 1: LOGIN POR E-MAIL CORPORATIVO + SENHA (POSTGRESQL / SUPABASE)
    // ══════════════════════════════════════════════════════════════════
    if (!modoManualAtivo) {
      var emailInput = document.getElementById('ident-operador-email');
      var email = (emailInput ? emailInput.value : '').trim().toLowerCase();

      if (!email || email.indexOf('@') === -1) {
        exibirMsgLogin(msgEl, 'Por favor, digite seu <strong>e-mail corporativo</strong> válido.', 'erro');
        if (emailInput) emailInput.focus();
        return;
      }

      var con = await garantirConexaoBancoParaLogin();
      if (!con.ok) {
        exibirMsgLogin(msgEl, 'Não foi possível conectar ao banco. Use a opção de Chave da Estação abaixo.', 'erro');
        return;
      }

      // ETAPA 1: Ainda não buscou o operador no banco para este e-mail
      if (!window._operadorLoginPendente || (window._operadorLoginPendente.email || '').toLowerCase() !== email) {
        if (btn) { btn.disabled = true; btn.textContent = 'Verificando e-mail...'; }
        exibirMsgLogin(msgEl, 'Consultando seu cadastro no banco PostgreSQL...', 'info');

        try {
          var resOp = await fetch(con.url + '/rest/v1/operadores?email=ilike.' + encodeURIComponent(email) + '&select=*&limit=1', {
            headers: {
              'apikey': con.key,
              'Authorization': 'Bearer ' + con.key,
              'Cache-Control': 'no-cache'
            }
          });

          if (!resOp.ok) {
            exibirMsgLogin(msgEl, 'Erro ao consultar tabela <code>operadores</code>. Verifique se o SQL foi executado no Supabase.', 'erro');
            if (btn) { btn.disabled = false; btn.textContent = 'Continuar'; }
            return;
          }

          var listaOp = await resOp.json();
          if (!Array.isArray(listaOp) || listaOp.length === 0) {
            exibirMsgLogin(
              msgEl,
              '❌ O e-mail <strong>' + escapeHTML(email) + '</strong> ainda não está cadastrado na tabela <code>operadores</code> do banco.<br><span style="font-size:11px;">Solicite o cadastro à TI/Administração ou use "Entrar com Chave da Estação" abaixo.</span>',
              'erro'
            );
            if (btn) { btn.disabled = false; btn.textContent = 'Continuar'; }
            return;
          }

          var op = listaOp[0];
          if (op.ativo === false) {
            exibirMsgLogin(msgEl, '❌ Este perfil de operador encontra-se desativado no sistema.', 'erro');
            if (btn) { btn.disabled = false; btn.textContent = 'Continuar'; }
            return;
          }

          window._operadorLoginPendente = op;
          if (emailInput) {
            emailInput.disabled = true;
            emailInput.style.background = '#F1F5F9';
          }

          var cardEl    = document.getElementById('ident-operador-card');
          var cardNome  = document.getElementById('ident-card-nome');
          var cardTag   = document.getElementById('ident-card-tag');
          var cardPraca = document.getElementById('ident-card-praca');
          if (cardNome)  cardNome.textContent  = '👤 ' + (op.nome || 'Operador');
          if (cardTag)   cardTag.textContent   = op.tag_perfil || 'Tecnico';
          if (cardPraca) cardPraca.textContent = 'Praça: ' + (op.praca || 'Juiz de Fora') + ' · ' + (op.cargo || 'Operações');
          if (cardEl)    cardEl.style.display  = 'block';

          if (msgEl) msgEl.style.display = 'none';

          // Verifica se é PRIMEIRO ACESSO (senha_hash nulo ou vazio)
          if (!op.senha_hash || String(op.senha_hash).trim() === '') {
            var boxCriar = document.getElementById('ident-box-criar-senha');
            var boxDig   = document.getElementById('ident-box-digitar-senha');
            if (boxCriar) boxCriar.style.display = 'flex';
            if (boxDig)   boxDig.style.display   = 'none';
            var inNova = document.getElementById('ident-senha-nova');
            var inConf = document.getElementById('ident-senha-confirma');
            if (inNova) { inNova.value = ''; setTimeout(function() { inNova.focus(); }, 100); }
            if (inConf) inConf.value = '';
            if (btn) { btn.disabled = false; btn.textContent = 'Salvar Senha e Entrar'; }
          } else {
            var boxCriar2 = document.getElementById('ident-box-criar-senha');
            var boxDig2   = document.getElementById('ident-box-digitar-senha');
            if (boxCriar2) boxCriar2.style.display = 'none';
            if (boxDig2)   boxDig2.style.display   = 'flex';
            var inAt = document.getElementById('ident-senha-atual');
            if (inAt) { inAt.value = ''; setTimeout(function() { inAt.focus(); }, 100); }
            if (btn) { btn.disabled = false; btn.textContent = 'Entrar no Sistema'; }
          }
          return;
        } catch (errFetch) {
          exibirMsgLogin(msgEl, 'Falha de conexão com o banco: ' + errFetch.message, 'erro');
          if (btn) { btn.disabled = false; btn.textContent = 'Continuar'; }
          return;
        }
      }

      // ETAPA 2: Operador já foi identificado; agora cria a senha (1º acesso) ou valida a senha existente
      var opAtivo = window._operadorLoginPendente;
      var primeiroAcesso = !opAtivo.senha_hash || String(opAtivo.senha_hash).trim() === '';

      if (primeiroAcesso) {
        var sNova = (document.getElementById('ident-senha-nova') ? document.getElementById('ident-senha-nova').value : '').trim();
        var sConf = (document.getElementById('ident-senha-confirma') ? document.getElementById('ident-senha-confirma').value : '').trim();

        if (sNova.length < 4) {
          exibirMsgLogin(msgEl, 'A senha deve ter pelo menos <strong>4 caracteres</strong>.', 'erro');
          return;
        }
        if (sNova !== sConf) {
          exibirMsgLogin(msgEl, 'As duas senhas digitadas <strong>não conferem</strong>. Digite novamente.', 'erro');
          return;
        }

        if (btn) { btn.disabled = true; btn.textContent = 'Salvando senha...'; }
        var novoHash = await hashSenhaSHA256(sNova);

        try {
          var resPatch = await fetch(con.url + '/rest/v1/operadores?id=eq.' + encodeURIComponent(opAtivo.id), {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': con.key,
              'Authorization': 'Bearer ' + con.key
            },
            body: JSON.stringify({
              senha_hash: novoHash,
              atualizado_em: new Date().toISOString()
            })
          });

          if (!resPatch.ok) {
            exibirMsgLogin(msgEl, 'Não foi possível salvar a senha no banco. Verifique se a coluna <code>senha_hash</code> foi criada.', 'erro');
            if (btn) { btn.disabled = false; btn.textContent = 'Salvar Senha e Entrar'; }
            return;
          }
          opAtivo.senha_hash = novoHash;
        } catch (errP) {
          exibirMsgLogin(msgEl, 'Erro de rede ao salvar senha: ' + errP.message, 'erro');
          if (btn) { btn.disabled = false; btn.textContent = 'Salvar Senha e Entrar'; }
          return;
        }
      } else {
        var sDigitada = (document.getElementById('ident-senha-atual') ? document.getElementById('ident-senha-atual').value : '').trim();
        if (!sDigitada) {
          exibirMsgLogin(msgEl, 'Por favor, digite sua <strong>senha pessoal</strong>.', 'erro');
          return;
        }
        var hashDigitado = await hashSenhaSHA256(sDigitada);
        if (hashDigitado !== opAtivo.senha_hash && sDigitada !== opAtivo.senha_hash) {
          exibirMsgLogin(msgEl, '❌ <strong>Senha incorreta.</strong> Tente novamente.', 'erro');
          var inAtErr = document.getElementById('ident-senha-atual');
          if (inAtErr) { inAtErr.focus(); inAtErr.select(); }
          return;
        }
      }

      // Login aprovado! Ativa a conexão da estação e aplica perfil completo do banco
      localStorage.setItem('tv_supabase_url', con.url);
      localStorage.setItem('tv_supabase_key', con.key);
      if (typeof DBService !== 'undefined' && DBService) {
        DBService.url  = con.url;
        DBService.key  = con.key;
        DBService.mode = 'supabase';
      }
      if (typeof updateCloudStatus === 'function') updateCloudStatus(true);

      aplicarPerfilOperadorAutenticado(opAtivo);
      window._operadorLoginPendente = null;

      if (typeof DBService !== 'undefined' && typeof DBService.syncRemote === 'function') {
        await DBService.syncRemote(true);
      }
      if (typeof renderAll === 'function') renderAll(true);

      fecharPopup('popup-identificacao-operador');
      abrirPopup('popup-entrada');

      if (typeof mostrarToast === 'function') {
        mostrarToast('Acesso Autorizado', 'Bem-vindo(a), ' + opAtivo.nome + ' (' + (opAtivo.tag_perfil || 'Tecnico') + ')!', 'success');
      }
      if (btn) { btn.disabled = false; btn.textContent = 'Continuar'; }
      return;
    }

    // ══════════════════════════════════════════════════════════════════
    // FLUXO 2: MODO MANUAL POR NOME + CHAVE DA ESTAÇÃO (FALLBACK)
    // ══════════════════════════════════════════════════════════════════
    var input = document.getElementById('ident-operador-nome');
    var chaveInput = document.getElementById('ident-chave-acesso');
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

    if (chave) {
      if (btn) { btn.disabled = true; btn.textContent = 'Validando...'; }
      var res = await conectarComChaveTV(chave);
      if (!res.ok) {
        exibirMsgLogin(msgEl, res.error || 'Chave de acesso incorreta.', 'erro');
        if (btn) { btn.disabled = false; btn.textContent = 'Salvar e Continuar'; }
        return;
      }
    } else if (!estacaoJaConectada && pack && pack.data) {
      exibirMsgLogin(msgEl, 'Digite a Chave de Acesso da Estação ou clique em "Trabalhar Offline".', 'erro');
      return;
    }

    localStorage.setItem(USER_NAME_STORAGE_KEY, nome);
    atualizarNomeOperadorUI(nome);
    if (typeof DBService !== 'undefined' && typeof DBService.syncRemote === 'function') {
      await DBService.syncRemote(true);
    }
    if (typeof renderAll === 'function') renderAll(true);

    fecharPopup('popup-identificacao-operador');
    abrirPopup('popup-entrada');
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar e Continuar'; }
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
        mostrarToast('Sincronização Ativa', 'Esta estação agora está conectada e compartilhando informações em tempo real!', 'success');
      }
    } catch(err) {
      if (msg) {
        msg.style.display = 'block';
        msg.style.color = '#DC2626';
        msg.textContent = 'Erro ao conectar: ' + err.message;
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="cloud" style="width:14px;height:14px;stroke-width:2.2;"></i><span>Ativar Sincronização</span>';
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }
  window.executarConexaoBanco = executarConexaoBanco;

  function desconectarBancoModoLocal(confirmar) {
    if (confirmar && !confirm('Deseja realmente desconectar e trabalhar offline?\n\nOs novos registros ficarão salvos com segurança neste computador até você reconectar.')) {
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
        updateCloudStatus(false, 'Modo Offline');
      }
      atualizarUIStatusBancoConfig();
      if (typeof mostrarToast === 'function') {
        mostrarToast('Modo Offline Ativado', 'Estação desconectada da rede. Operando localmente neste computador.', 'info');
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
      textEl.textContent = 'Sistema Conectado';
      textEl.style.color = 'var(--txt)';
      if (subEl) subEl.textContent = 'Sincronização ativa em tempo real com todos os computadores da TV.';

      actionsEl.innerHTML =
        '<button type="button" class="btn btn-primary btn-sm" onclick="if(window.DBService&&DBService.syncRemote)DBService.syncRemote(true);" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;" title="Sincronizar todos os dados com o banco PostgreSQL agora">' +
          '<i data-lucide="refresh-cw" style="width:13px;height:13px;"></i>' +
          '<span>Sincronizar Banco Agora</span>' +
        '</button>';
    } else {
      dotEl.style.background = '#EF4444';
      dotEl.style.boxShadow = '0 0 8px rgba(239,68,68,0.5)';
      textEl.textContent = 'Modo Offline (Apenas este computador)';
      textEl.style.color = '#DC2626';
      if (subEl) subEl.textContent = 'Operando localmente. Seus registros ficam salvos neste computador até reconectar.';

      actionsEl.innerHTML =
        '<button type="button" class="btn btn-primary btn-sm" onclick="abrirModalConectarBanco()" style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;" title="Ativar sincronização com a rede da emissora">' +
          '<i data-lucide="cloud" style="width:14px;height:14px;stroke-width:2.2;"></i>' +
          '<span>Ativar Sincronização</span>' +
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