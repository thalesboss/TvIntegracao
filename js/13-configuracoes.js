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
      optUser.textContent = nomeExibido + ' (Atribuir a mim)';
    }
    var editOptUser = document.getElementById('edit-opt-user-name');
    if (editOptUser) {
      editOptUser.value = nomeExibido;
      editOptUser.textContent = nomeExibido + ' (Atribuir a mim)';
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
  async function hashSenhaSHA256(texto, emailSalt) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Ambiente inseguro (HTTPS ou localhost obrigatório para criptografia de senha).');
    }
    var enc = new TextEncoder();
    if (emailSalt) {
      var saltNorm = 'TVI_PBKDF2_v2:' + String(emailSalt).trim().toLowerCase();
      var keyMat = await crypto.subtle.importKey('raw', enc.encode(texto), { name: 'PBKDF2' }, false, ['deriveBits']);
      var bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: enc.encode(saltNorm), iterations: 120000, hash: 'SHA-256' },
        keyMat,
        256
      );
      var hexPbkdf2 = Array.prototype.map.call(new Uint8Array(bits), function(x) {
        return ('00' + x.toString(16)).slice(-2);
      }).join('');
      return 'pbkdf2v2$' + hexPbkdf2;
    }
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
    var boxChaveLogin = document.getElementById('ident-box-chave-estacao');
    if (boxChaveLogin) boxChaveLogin.style.display = 'block';
    var chaveInput = document.getElementById('ident-chave-estacao-input');
    var chaveDigitada = chaveInput ? chaveInput.value.trim() : '';
    if (!chaveDigitada) {
      return { ok: false, motivo: 'chave_vazia' };
    }
    var pack = window.ENCRYPTED_TV_CREDENTIALS || (window.ENV_CONFIG && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS);
    if (pack && pack.data && typeof TVCrypto !== 'undefined') {
      try {
        var creds = await TVCrypto.decrypt(chaveDigitada, pack);
        if (creds && creds.url && creds.key) {
          if (boxChaveLogin) boxChaveLogin.style.display = 'none';
          return { ok: true, url: creds.url.replace(/\/+$/, ''), key: creds.key, credsObj: creds };
        }
      } catch (e) {
        return { ok: false, motivo: 'chave_incorreta' };
      }
    }
    return { ok: false };
  }
  async function confirmarIdentificacaoOperador() {
    var msgEl = document.getElementById('ident-chave-msg');
    var btn   = document.getElementById('btn-confirmar-identificacao');
    var emailInput = document.getElementById('ident-operador-email');
      var emailRaw = (emailInput ? emailInput.value : '').trim().toLowerCase();
      var email = emailRaw.replace(/[%*\s]/g, '');
      if (!email || !/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) {
        exibirMsgLogin(msgEl, 'Por favor, digite um <strong>e-mail corporativo</strong> válido (sem caracteres curinga).', 'erro');
        if (emailInput) emailInput.focus();
        return;
      }
      var con = await garantirConexaoBancoParaLogin();
      if (!con.ok) {
        var inChaveEst = document.getElementById('ident-chave-estacao-input');
        if (con.motivo === 'chave_vazia') {
          exibirMsgLogin(msgEl, '🔑 Digite a <strong>Chave de Acesso da Estação</strong> acima para liberar o 1º acesso neste computador.', 'erro');
          if (inChaveEst) inChaveEst.focus();
        } else if (con.motivo === 'chave_incorreta') {
          exibirMsgLogin(msgEl, '❌ <strong>Chave de Acesso da Estação incorreta.</strong> Verifique com a equipe técnica.', 'erro');
          if (inChaveEst) { inChaveEst.focus(); inChaveEst.select(); }
        } else {
          exibirMsgLogin(msgEl, 'Não foi possível conectar ao banco. Verifique a Chave de Acesso da Estação.', 'erro');
        }
        return;
      }
      if (!window._operadorLoginPendente || (window._operadorLoginPendente.email || '').toLowerCase() !== email) {
        if (btn) { btn.disabled = true; btn.textContent = 'Verificando e-mail...'; }
        exibirMsgLogin(msgEl, 'Consultando seu cadastro no banco PostgreSQL...', 'info');
        try {
          var resOp = await fetch(con.url + '/rest/v1/operadores?email=ilike.' + encodeURIComponent(email) + '&select=id,nome,email,cargo,tag_perfil,praca,ativo,senha_hash&limit=1', {
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
              '❌ O e-mail <strong>' + escapeHTML(email) + '</strong> ainda não está cadastrado na tabela <code>operadores</code> do banco.<br><span style="font-size:11px;">Solicite o cadastro do seu e-mail à TI/Administração.</span>',
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
      var opAtivo = window._operadorLoginPendente;
      var primeiroAcesso = !opAtivo.senha_hash || String(opAtivo.senha_hash).trim() === '';
      if (primeiroAcesso) {
        var inChavePrim = document.getElementById('ident-chave-primeiro-acesso');
        var chavePrim = (inChavePrim ? inChavePrim.value : '').trim();
        var packVerif = window.ENCRYPTED_TV_CREDENTIALS || (window.ENV_CONFIG && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS);
        if (packVerif && packVerif.data && typeof TVCrypto !== 'undefined') {
          if (!chavePrim) {
            exibirMsgLogin(msgEl, '🔑 Por segurança, informe a <strong>Chave da Estação</strong> para validar seu 1º acesso e criar sua senha.', 'erro');
            if (inChavePrim) inChavePrim.focus();
            return;
          }
          try {
            await TVCrypto.decrypt(chavePrim, packVerif);
          } catch (eChv) {
            exibirMsgLogin(msgEl, '❌ <strong>Chave da Estação incorreta.</strong> A criação de senha no 1º acesso exige a chave válida da equipe.', 'erro');
            if (inChavePrim) { inChavePrim.focus(); inChavePrim.select(); }
            return;
          }
        }
        var sNova = (document.getElementById('ident-senha-nova') ? document.getElementById('ident-senha-nova').value : '').trim();
        var sConf = (document.getElementById('ident-senha-confirma') ? document.getElementById('ident-senha-confirma').value : '').trim();
        if (sNova.length < 6) {
          exibirMsgLogin(msgEl, 'A senha deve ter pelo menos <strong>6 caracteres</strong>.', 'erro');
          return;
        }
        if (sNova !== sConf) {
          exibirMsgLogin(msgEl, 'As duas senhas digitadas <strong>não conferem</strong>. Digite novamente.', 'erro');
          return;
        }
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando senha...'; }
        var novoHash = await hashSenhaSHA256(sNova, opAtivo.email || email);
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
        var hashArmazenado = String(opAtivo.senha_hash || '');
        var senhaValida = false;
        if (hashArmazenado.indexOf('pbkdf2v2$') === 0) {
          var hashPbkdf2 = await hashSenhaSHA256(sDigitada, opAtivo.email || email);
          senhaValida = (hashPbkdf2 === hashArmazenado);
        } else {
          var hashLegado = await hashSenhaSHA256(sDigitada);
          senhaValida = (hashLegado === hashArmazenado);
          if (senhaValida) {
            try {
              var hashUpgrade = await hashSenhaSHA256(sDigitada, opAtivo.email || email);
              fetch(con.url + '/rest/v1/operadores?id=eq.' + encodeURIComponent(opAtivo.id), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'apikey': con.key, 'Authorization': 'Bearer ' + con.key },
                body: JSON.stringify({ senha_hash: hashUpgrade, atualizado_em: new Date().toISOString() })
              }).catch(function() {});
              opAtivo.senha_hash = hashUpgrade;
            } catch (eUpg) {}
          }
        }
        if (!senhaValida) {
          exibirMsgLogin(msgEl, '❌ <strong>Senha incorreta.</strong> Tente novamente.', 'erro');
          var inAtErr = document.getElementById('ident-senha-atual');
          if (inAtErr) { inAtErr.focus(); inAtErr.select(); }
          return;
        }
      }
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
  window.confirmarIdentificacaoOperador = confirmarIdentificacaoOperador;
  function mutarNotificacoes(mutado) {
    var dot   = document.querySelector('.notif-dot');
    var badge = document.querySelector('.notif-badge');
    if (dot)   dot.style.display   = mutado ? 'none' : '';
    if (badge) badge.style.display = mutado ? 'none' : '';
  }
  window.mutarNotificacoes = mutarNotificacoes;
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
  function salvarConfiguracoes() {
    var btn = event && event.currentTarget;
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
