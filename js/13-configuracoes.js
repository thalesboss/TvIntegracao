(function (window, document, TVApp) {
  'use strict';

  TVApp.registerModule('configuracoes', function (app) {
    var KEYS     = app.KEYS;
    var Security = app.Security;
    var Storage  = app.Storage;
    var Session  = app.Session;
    var escapeHTML = Security.escapeHTML;

    var _uuidLookupTimer = null;

    function iniciais(nome) {
      var partes = String(nome || 'Operador').trim().split(/\s+/);
      var ini = partes[0] ? partes[0][0] : '';
      if (partes.length > 1) ini += partes[partes.length - 1][0];
      return ini.toUpperCase();
    }

    function syncUserPopover() {
      var nomeEl = document.getElementById('cfg-nome');
      var nome = (nomeEl && nomeEl.value.trim()) ? nomeEl.value.trim() : Session.getUserName();
      var upName = document.getElementById('up-name');
      if (upName) upName.textContent = nome || 'Operador';
      var sAvatar = document.querySelector('.s-avatar');
      var upAvatar = document.getElementById('up-avatar');
      if (upAvatar && sAvatar) {
        if (sAvatar.style.backgroundImage) {
          upAvatar.style.backgroundImage = sAvatar.style.backgroundImage;
          upAvatar.style.backgroundColor = '#FFFFFF';
          upAvatar.style.backgroundSize = 'cover';
          upAvatar.style.backgroundPosition = 'center';
          upAvatar.style.backgroundRepeat = 'no-repeat';
          upAvatar.classList.add('has-photo');
          upAvatar.textContent = '';
        } else {
          upAvatar.style.backgroundImage = '';
          upAvatar.style.backgroundColor = '';
          upAvatar.classList.remove('has-photo');
          upAvatar.textContent = sAvatar.textContent;
        }
      }
    }

    function setAvatarFotoEstado(el, cssUrl) {
      if (!el) return;
      var safeCssUrl = Security.sanitizeCssBgUrl(cssUrl);
      if (!safeCssUrl) return;
      el.style.backgroundImage = safeCssUrl;
      el.style.backgroundColor = '#FFFFFF';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
      el.classList.add('has-photo');
      el.textContent = '';
    }

    function limparAvatarFotoEstado(el, ini) {
      if (!el) return;
      el.style.backgroundImage = '';
      el.style.backgroundColor = '';
      el.classList.remove('has-photo');
      el.textContent = ini;
    }

    function aplicarFotoPerfil(url) {
      var safeCssUrl = Security.sanitizeCssBgUrl(url);
      if (!safeCssUrl) return;
      setAvatarFotoEstado(document.getElementById('cfg-avatar'), safeCssUrl);
      setAvatarFotoEstado(document.querySelector('.s-avatar'), safeCssUrl);
      setAvatarFotoEstado(document.getElementById('up-avatar'), safeCssUrl);
    }

    function carregarFotoPerfilSalva() {
      if (typeof window.DBService !== 'undefined' && window.DBService.getFotoPerfil) {
        var url = window.DBService.getFotoPerfil();
        if (url) aplicarFotoPerfil(url);
      }
    }
    window.carregarFotoPerfilSalva = carregarFotoPerfilSalva;

    function alterarFotoPerfil(input) {
      var file = input && input.files && input.files[0];
      if (!file) return;
      if (!file.type || !/^image\/(jpeg|jpg|png|gif|webp|bmp)$/i.test(file.type)) {
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Formato Inválido', 'Selecione uma imagem JPG, PNG ou WEBP para o perfil.', 'warning');
        }
        input.value = '';
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var dataUrl = e.target && e.target.result;
        if (!dataUrl) return;
        var finalizar = function (finalDataUrl) {
          var cssUrl = Security.sanitizeCssBgUrl('url("' + finalDataUrl + '")');
          if (!cssUrl) return;
          try {
            window.DBService.saveFotoPerfil(cssUrl);
          } catch (errStorage) {
            if (typeof window.mostrarToast === 'function') {
              window.mostrarToast('Imagem muito grande', 'Não foi possível salvar a foto no navegador. Tente uma imagem menor.', 'warning');
            }
            return;
          }
          aplicarFotoPerfil(cssUrl);
          syncUserPopover();
          if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('Foto Atualizada', 'Foto de perfil atualizada com sucesso.', 'success');
          }
        };
        var img = new Image();
        img.onload = function () {
          try {
            var size = 256;
            var canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);
            var minSide = Math.min(img.width || size, img.height || size);
            var sx = Math.max(0, ((img.width || size) - minSide) / 2);
            var sy = Math.max(0, ((img.height || size) - minSide) / 2);
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
            finalizar(canvas.toDataURL('image/jpeg', 0.88));
          } catch (errCanvas) {
            finalizar(dataUrl);
          }
        };
        img.onerror = function () { finalizar(dataUrl); };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
    window.alterarFotoPerfil = alterarFotoPerfil;

    function removerFotoPerfil() {
      if (typeof window.DBService !== 'undefined') window.DBService.removeFotoPerfil();
      var ini = iniciais(Session.getUserName() || 'Operador');
      limparAvatarFotoEstado(document.getElementById('cfg-avatar'), ini);
      limparAvatarFotoEstado(document.querySelector('.s-avatar'), ini);
      limparAvatarFotoEstado(document.getElementById('up-avatar'), ini);
      var photoInput = document.getElementById('cfg-photo-input');
      if (photoInput) photoInput.value = '';
      syncUserPopover();
    }
    window.removerFotoPerfil = removerFotoPerfil;

    function atualizarNomeOperadorUI(nome, salvarStorage) {
      var nomeExibido = (nome && String(nome).trim()) ? String(nome).trim().slice(0, 80) : 'Operador';
      if (salvarStorage !== false && nomeExibido !== 'Operador') {
        Storage.setText(KEYS.USER_NAME, nomeExibido);
      }
      /* Debounce na consulta de UUID para não disparar requisições a cada tecla digitada */
      clearTimeout(_uuidLookupTimer);
      if (nomeExibido !== 'Operador') {
        _uuidLookupTimer = setTimeout(function () {
          if (typeof window.obterOuCriarOperadorPorNome === 'function') {
            window.obterOuCriarOperadorPorNome(nomeExibido);
          }
        }, 500);
      }
      var upName = document.getElementById('up-name');
      if (upName) upName.textContent = nomeExibido;
      var sUserName = document.querySelector('.s-user-name');
      if (sUserName) sUserName.textContent = nomeExibido;
      var cfgNome = document.getElementById('cfg-nome');
      if (cfgNome && cfgNome.value !== nomeExibido) cfgNome.value = nomeExibido;
      /* Bloqueia edição manual do nome quando autenticado via e-mail corporativo para evitar falsificação de autoria */
      if (cfgNome) {
        var emailAutenticado = Session.getUserEmail();
        var bloqueadoPorAuth = Boolean(emailAutenticado && nomeExibido !== 'Operador');
        cfgNome.readOnly = bloqueadoPorAuth;
        cfgNome.style.background = bloqueadoPorAuth ? '#F1F5F9' : '';
        cfgNome.style.cursor = bloqueadoPorAuth ? 'not-allowed' : '';
        cfgNome.title = bloqueadoPorAuth ? 'Nome vinculado ao seu cadastro corporativo no banco de dados' : '';
      }
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

    /* ─── Hashing PBKDF2-SHA256 de Senha do Operador ─── */
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
        var hexPbkdf2 = Array.prototype.map.call(new Uint8Array(bits), function (x) {
          return ('00' + x.toString(16)).slice(-2);
        }).join('');
        return 'pbkdf2v2$' + hexPbkdf2;
      }
      var buf = await crypto.subtle.digest('SHA-256', enc.encode(texto));
      return Array.prototype.map.call(new Uint8Array(buf), function (x) {
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
      Storage.setText(KEYS.USER_NAME, nome);
      Storage.setText(KEYS.USER_EMAIL, email);
      Storage.setText(KEYS.USER_TAG, tag);
      Storage.setText(KEYS.USER_CARGO, cargo);
      if (op.id) app.Store.operadorUuidAtual = op.id;
      if (typeof window.setPracaAtual === 'function') {
        window.setPracaAtual(praca);
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

    function exibirMsgLogin(msgEl, htmlSeguro, tipo) {
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
      msgEl.innerHTML = htmlSeguro;
    }

    async function garantirConexaoBancoParaLogin() {
      if (typeof window.isEstacaoConectadaTV === 'function' && window.isEstacaoConectadaTV()) {
        var credsAtuais = window.getDBCredentials();
        return { ok: true, url: credsAtuais.url, key: credsAtuais.key };
      }
      var boxChaveLogin = document.getElementById('ident-box-chave-estacao');
      if (boxChaveLogin) boxChaveLogin.style.display = 'block';
      var chaveInput = document.getElementById('ident-chave-estacao-input');
      var chaveDigitada = chaveInput ? chaveInput.value.trim() : '';
      if (!chaveDigitada) {
        return { ok: false, motivo: 'chave_vazia' };
      }
      var pack = window.ENCRYPTED_TV_CREDENTIALS || (window.ENV_CONFIG && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS);
      if (pack && pack.data && typeof window.TVCrypto !== 'undefined') {
        try {
          var creds = await window.TVCrypto.decrypt(chaveDigitada, pack);
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

      var reqOpts = { baseUrl: con.url, apiKey: con.key };

      if (!window._operadorLoginPendente || (window._operadorLoginPendente.email || '').toLowerCase() !== email) {
        if (btn) { btn.disabled = true; btn.textContent = 'Verificando e-mail...'; }
        exibirMsgLogin(msgEl, 'Consultando seu cadastro no banco PostgreSQL...', 'info');
        try {
          var usouViewSegura = true;
          var resOp = await window.DBService.select(
            'operadores_publico',
            'email=ilike.' + encodeURIComponent(email) + '&select=id,nome,email,cargo,tag_perfil,praca,ativo,possui_senha&limit=1',
            reqOpts
          );
          if (resOp.status === 404) {
            usouViewSegura = false;
            resOp = await window.DBService.select(
              'operadores',
              'email=ilike.' + encodeURIComponent(email) + '&select=id,nome,email,cargo,tag_perfil,praca,ativo,senha_hash&limit=1',
              reqOpts
            );
          }
          if (!resOp.ok) {
            window.DBService.setCredentials('', '');
            var boxChaveErr = document.getElementById('ident-box-chave-estacao');
            if (boxChaveErr) boxChaveErr.style.display = 'block';
            var inChaveErr = document.getElementById('ident-chave-estacao-input');
            exibirMsgLogin(
              msgEl,
              '🔑 As credenciais salvas nesta estação expiraram ou são inválidas (HTTP ' + Number(resOp.status || 0) + '). Digite a <strong>Chave de Acesso da Estação</strong> acima e clique em Continuar.',
              'erro'
            );
            if (inChaveErr) inChaveErr.focus();
            if (btn) { btn.disabled = false; btn.textContent = 'Continuar'; }
            return;
          }
          var listaOp = resOp.data;
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
          op._usouViewSegura = usouViewSegura;
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

          var semSenha = op._usouViewSegura ? !op.possui_senha : (!op.senha_hash || String(op.senha_hash).trim() === '');
          var boxCriar = document.getElementById('ident-box-criar-senha');
          var boxDig   = document.getElementById('ident-box-digitar-senha');
          if (semSenha) {
            if (boxCriar) boxCriar.style.display = 'flex';
            if (boxDig)   boxDig.style.display   = 'none';
            var inNova = document.getElementById('ident-senha-nova');
            var inConf = document.getElementById('ident-senha-confirma');
            if (inNova) { inNova.value = ''; setTimeout(function () { inNova.focus(); }, 100); }
            if (inConf) inConf.value = '';
            if (btn) { btn.disabled = false; btn.textContent = 'Salvar Senha e Entrar'; }
          } else {
            if (boxCriar) boxCriar.style.display = 'none';
            if (boxDig)   boxDig.style.display   = 'flex';
            var inAt = document.getElementById('ident-senha-atual');
            if (inAt) { inAt.value = ''; setTimeout(function () { inAt.focus(); }, 100); }
            if (btn) { btn.disabled = false; btn.textContent = 'Entrar no Sistema'; }
          }
          return;
        } catch (errFetch) {
          window.DBService.setCredentials('', '');
          var boxChaveNet = document.getElementById('ident-box-chave-estacao');
          if (boxChaveNet) boxChaveNet.style.display = 'block';
          var inChaveNet = document.getElementById('ident-chave-estacao-input');
          exibirMsgLogin(
            msgEl,
            '🔑 Falha de conexão com as credenciais salvas (' + escapeHTML(errFetch.message || 'erro de rede') + '). Confira sua internet ou digite a <strong>Chave de Acesso da Estação</strong> acima e clique em Continuar.',
            'erro'
          );
          if (inChaveNet) inChaveNet.focus();
          if (btn) { btn.disabled = false; btn.textContent = 'Continuar'; }
          return;
        }
      }

      var opAtivo = window._operadorLoginPendente;
      var primeiroAcesso = opAtivo._usouViewSegura ? !opAtivo.possui_senha : (!opAtivo.senha_hash || String(opAtivo.senha_hash).trim() === '');

      if (primeiroAcesso) {
        var inChavePrim = document.getElementById('ident-chave-primeiro-acesso');
        var chavePrim = (inChavePrim ? inChavePrim.value : '').trim();
        var packVerif = window.ENCRYPTED_TV_CREDENTIALS || (window.ENV_CONFIG && window.ENV_CONFIG.ENCRYPTED_CREDENTIALS);
        if (packVerif && packVerif.data && typeof window.TVCrypto !== 'undefined') {
          if (!chavePrim) {
            exibirMsgLogin(msgEl, '🔑 Por segurança, informe a <strong>Chave da Estação</strong> para validar seu 1º acesso e criar sua senha.', 'erro');
            if (inChavePrim) inChavePrim.focus();
            return;
          }
          try {
            await window.TVCrypto.decrypt(chavePrim, packVerif);
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
          /* Prioriza RPC segura SECURITY DEFINER; mantém fallback PATCH apenas caso o banco ainda não tenha a RPC */
          var resRpcSet = await window.DBService.rpc(
            'definir_senha_primeiro_acesso',
            { p_email: opAtivo.email || email, p_senha_hash: novoHash },
            reqOpts
          );
          var salvouOk = (resRpcSet.ok && resRpcSet.data === true);
          if (resRpcSet.status === 404) {
            var resPatch = await window.DBService.patch(
              'operadores',
              'id=eq.' + encodeURIComponent(opAtivo.id),
              { senha_hash: novoHash, atualizado_em: new Date().toISOString() },
              '',
              reqOpts
            );
            salvouOk = resPatch.ok;
          }
          if (!salvouOk) {
            exibirMsgLogin(msgEl, 'Não foi possível salvar a senha no banco. Verifique com a equipe de TI.', 'erro');
            if (btn) { btn.disabled = false; btn.textContent = 'Salvar Senha e Entrar'; }
            return;
          }
          opAtivo.possui_senha = true;
        } catch (errP) {
          exibirMsgLogin(msgEl, 'Erro de rede ao salvar senha: ' + escapeHTML(errP.message || 'falha de conexão'), 'erro');
          if (btn) { btn.disabled = false; btn.textContent = 'Salvar Senha e Entrar'; }
          return;
        }
      } else {
        var sDigitada = (document.getElementById('ident-senha-atual') ? document.getElementById('ident-senha-atual').value : '').trim();
        if (!sDigitada) {
          exibirMsgLogin(msgEl, 'Por favor, digite sua <strong>senha pessoal</strong>.', 'erro');
          return;
        }
        var senhaValida = false;
        var usarFallbackHashLocal = !opAtivo._usouViewSegura;
        if (opAtivo._usouViewSegura) {
          var hashPbkdf2Rpc = await hashSenhaSHA256(sDigitada, opAtivo.email || email);
          var resRpc = await window.DBService.rpc(
            'autenticar_operador',
            { p_email: opAtivo.email || email, p_senha_hash: hashPbkdf2Rpc },
            reqOpts
          );
          if (resRpc.status === 404) {
            usarFallbackHashLocal = true;
            var resOpLegacy = await window.DBService.select(
              'operadores',
              'id=eq.' + encodeURIComponent(opAtivo.id) + '&select=senha_hash&limit=1',
              reqOpts
            );
            if (resOpLegacy.ok && Array.isArray(resOpLegacy.data) && resOpLegacy.data[0]) {
              opAtivo.senha_hash = resOpLegacy.data[0].senha_hash;
            }
          } else if (resRpc.ok) {
            var rowsRpc = resRpc.data;
            if (Array.isArray(rowsRpc) && rowsRpc[0] && rowsRpc[0].autenticado === true) {
              senhaValida = true;
            } else {
              var hashLegadoRpc = await hashSenhaSHA256(sDigitada);
              var resRpcLeg = await window.DBService.rpc(
                'autenticar_operador',
                { p_email: opAtivo.email || email, p_senha_hash: hashLegadoRpc },
                reqOpts
              );
              if (resRpcLeg.ok && Array.isArray(resRpcLeg.data) && resRpcLeg.data[0] && resRpcLeg.data[0].autenticado === true) {
                senhaValida = true;
                window.DBService.rpc(
                  'atualizar_hash_legado_operador',
                  { p_email: opAtivo.email || email, p_hash_antigo: hashLegadoRpc, p_hash_novo: hashPbkdf2Rpc },
                  reqOpts
                ).catch(function () {});
              }
            }
          }
        }
        if (usarFallbackHashLocal) {
          var hashArmazenado = String(opAtivo.senha_hash || '');
          if (hashArmazenado.indexOf('pbkdf2v2$') === 0) {
            var hashPbkdf2 = await hashSenhaSHA256(sDigitada, opAtivo.email || email);
            senhaValida = (hashPbkdf2 === hashArmazenado);
          } else if (hashArmazenado) {
            var hashLegado = await hashSenhaSHA256(sDigitada);
            senhaValida = (hashLegado === hashArmazenado);
            if (senhaValida) {
              try {
                var hashUpgrade = await hashSenhaSHA256(sDigitada, opAtivo.email || email);
                window.DBService.rpc(
                  'atualizar_hash_legado_operador',
                  { p_email: opAtivo.email || email, p_hash_antigo: hashLegado, p_hash_novo: hashUpgrade },
                  reqOpts
                ).catch(function () {});
              } catch (eUpg) {}
            }
          }
        }
        if (!senhaValida) {
          exibirMsgLogin(msgEl, '❌ <strong>Senha incorreta.</strong> Tente novamente.', 'erro');
          var inAtErr = document.getElementById('ident-senha-atual');
          if (inAtErr) { inAtErr.focus(); inAtErr.select(); }
          return;
        }
      }

      window.DBService.setCredentials(con.url, con.key);
      if (typeof window.updateCloudStatus === 'function') window.updateCloudStatus(true);
      aplicarPerfilOperadorAutenticado(opAtivo);
      window._operadorLoginPendente = null;
      await window.DBService.syncRemote(true);
      if (typeof window.renderAll === 'function') window.renderAll(true);
      window.fecharPopup('popup-identificacao-operador');
      window.abrirPopup('popup-entrada');
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Acesso Autorizado', 'Bem-vindo(a), ' + opAtivo.nome + ' (' + (opAtivo.tag_perfil || 'Tecnico') + ')!', 'success');
      }
      if (btn) { btn.disabled = false; btn.textContent = 'Continuar'; }
    }
    window.confirmarIdentificacaoOperador = confirmarIdentificacaoOperador;

    /* ─── Preferências & Modal de Conexão do Banco ─── */
    function mutarNotificacoes(mutado) {
      var prefs = Storage.getJSON(KEYS.CONFIG_PREFS, {});
      if (!prefs || typeof prefs !== 'object') prefs = {};
      prefs.muteAll = !!mutado;
      Storage.setJSON(KEYS.CONFIG_PREFS, prefs);
      if (typeof window.atualizarBadgesNotificacoes === 'function') {
        window.atualizarBadgesNotificacoes();
        return;
      }
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
      window.abrirPopup('popup-conectar-banco');
      if (input) setTimeout(function () { input.focus(); }, 150);
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
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
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
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
        var res = await window.conectarComChaveTV(chave);
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
          if (input) { input.focus(); input.select(); }
          if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
          return;
        }
        window.fecharPopup('popup-conectar-banco');
        if (typeof window.updateCloudStatus === 'function') {
          window.updateCloudStatus(true, 'Nuvem Conectada');
        }
        atualizarUIStatusBancoConfig();
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Sincronização Ativa', 'Esta estação agora está conectada e compartilhando informações em tempo real!', 'success');
        }
      } catch (err) {
        if (msg) {
          msg.style.display = 'block';
          msg.style.color = '#DC2626';
          msg.textContent = 'Erro ao conectar: ' + (err.message || 'falha de rede');
        }
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i data-lucide="cloud" style="width:14px;height:14px;stroke-width:2.2;"></i><span>Ativar Sincronização</span>';
        }
        if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
      }
    }
    window.executarConexaoBanco = executarConexaoBanco;

    function atualizarUIStatusBancoConfig() {
      var dotEl = document.getElementById('cfg-db-status-dot');
      var textEl = document.getElementById('cfg-db-status-text');
      var subEl = document.getElementById('cfg-db-status-sub');
      var actionsEl = document.getElementById('cfg-db-actions');
      if (!dotEl || !textEl || !actionsEl) return;
      var conectado = typeof window.isEstacaoConectadaTV === 'function' ? window.isEstacaoConectadaTV() : false;
      var onlineAgora = (typeof window._isCloudConnected === 'function') ? window._isCloudConnected() : true;
      if (conectado && onlineAgora) {
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
      } else if (conectado && !onlineAgora) {
        dotEl.style.background = '#F59E0B';
        dotEl.style.boxShadow = '0 0 8px rgba(245,158,11,0.5)';
        textEl.textContent = 'Sem conexão com a internet (Reconectando...)';
        textEl.style.color = '#D97706';
        if (subEl) subEl.textContent = 'Estação configurada, mas o servidor não respondeu. O sistema reconectará automaticamente.';
        actionsEl.innerHTML =
          '<button type="button" class="btn btn-primary btn-sm" onclick="if(typeof tentarReconectarImediato===\'function\')tentarReconectarImediato();" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;">' +
            '<i data-lucide="refresh-cw" style="width:13px;height:13px;"></i>' +
            '<span>Tentar Reconectar Agora</span>' +
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
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
    }
    window.atualizarUIStatusBancoConfig = atualizarUIStatusBancoConfig;

    function aplicarTemaSistema() {
      document.documentElement.removeAttribute('data-theme');
    }
    window.aplicarTemaSistema = aplicarTemaSistema;

    function carregarConfiguracoesSalvas() {
      document.documentElement.removeAttribute('data-theme');
      var prefs = Storage.getJSON(KEYS.CONFIG_PREFS, null);
      if (!prefs || typeof prefs !== 'object') return;
      if (prefs.tema && prefs.tema !== 'claro') {
        prefs.tema = 'claro';
        Storage.setJSON(KEYS.CONFIG_PREFS, prefs);
      }
      var elMute = document.getElementById('cfg-mute-all');
      var elNova = document.getElementById('cfg-notif-nova');
      var elAtr  = document.getElementById('cfg-notif-atrasada');
      var elMail = document.getElementById('cfg-notif-email');
      if (elMute && typeof prefs.muteAll === 'boolean') elMute.checked = prefs.muteAll;
      if (elNova && typeof prefs.notifNova === 'boolean') elNova.checked = prefs.notifNova;
      if (elAtr  && typeof prefs.notifAtrasada === 'boolean') elAtr.checked = prefs.notifAtrasada;
      if (elMail && typeof prefs.notifEmail === 'boolean') elMail.checked = prefs.notifEmail;
    }
    window.carregarConfiguracoesSalvas = carregarConfiguracoesSalvas;

    function salvarConfiguracoes(btnEl) {
      var elMute = document.getElementById('cfg-mute-all');
      var elNova = document.getElementById('cfg-notif-nova');
      var elAtr  = document.getElementById('cfg-notif-atrasada');
      var elMail = document.getElementById('cfg-notif-email');
      var prefs = {
        tema: 'claro',
        muteAll: elMute ? !!elMute.checked : false,
        notifNova: elNova ? !!elNova.checked : true,
        notifAtrasada: elAtr ? !!elAtr.checked : true,
        notifEmail: elMail ? !!elMail.checked : false
      };
      Storage.setJSON(KEYS.CONFIG_PREFS, prefs);
      document.documentElement.removeAttribute('data-theme');
      if (typeof window.atualizarBadgesNotificacoes === 'function') window.atualizarBadgesNotificacoes();
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Configurações Salvas', 'Suas preferências de alertas foram salvas neste computador.', 'success');
      }
      var btn = btnEl;
      if (!btn) return;
      var textoOriginal = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = textoOriginal;
        btn.disabled = false;
      }, 1500);
    }
    window.salvarConfiguracoes = salvarConfiguracoes;
  });
})(window, document, window.TVApp);
