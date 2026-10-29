  /* ═══════════════════════════════════════════
     ENVIO DE RELATÓRIO TV (CTRS) E GERADOR AUTOMÁTICO DE OCORRÊNCIAS
  ═══════════════════════════════════════════ */

  function salvarRascunhoRelatorioTV(silencioso) {
    try {
      var dataEl  = document.getElementById('ctrs-data');
      var pracaEl = document.getElementById('ctrs-praca');
      var tipoEl  = document.getElementById('ctrs-tipo');
      var obsEl   = document.getElementById('ctrs-obs');

      var dados = {
        data:  dataEl  ? dataEl.value  : '',
        praca: pracaEl ? pracaEl.value : '',
        tipo:  tipoEl  ? tipoEl.value  : '',
        obs:   obsEl   ? obsEl.value   : '',
        transmissoes: []
      };

      var accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
      accBlocks.forEach(function(acc) {
        var inputs = acc.querySelectorAll('input, select, textarea');
        dados.transmissoes.push({
          cidade:      inputs[0] ? inputs[0].value : '',
          infra:       inputs[1] ? inputs[1].value : '',
          horaAbert:   inputs[2] ? inputs[2].value : '',
          horaFim:     inputs[3] ? inputs[3].value : '',
          audioQ:      inputs[4] ? inputs[4].value : '',
          videoQ:      inputs[5] ? inputs[5].value : '',
          reporter:    inputs[6] ? inputs[6].value : '',
          entradas:    inputs[7] ? inputs[7].value : '',
          rc:          inputs[8] ? inputs[8].value : '',
          statusTx:    inputs[9] ? inputs[9].value : '',
          falhas:      inputs[10] ? inputs[10].value : ''
        });
      });

      localStorage.setItem('tv_ctrs_rascunho_v2', JSON.stringify(dados));
      if (!silencioso) {
        alert('Rascunho do Relatório CTRS salvo com sucesso no navegador!');
      }
    } catch (e) {
      console.warn('Erro ao salvar rascunho CTRS:', e);
    }
  }
  window.salvarRascunhoRelatorioTV = salvarRascunhoRelatorioTV;

  function obterOpcoesEquipamentosHTML(selectedVal) {
    var praca = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isUberlandia = praca.indexOf('Uber') !== -1;
    var equips = [];

    if (typeof dashboardMetrics !== 'undefined' && dashboardMetrics && dashboardMetrics.equipamento) {
      equips = Object.keys(dashboardMetrics.equipamento);
    }

    if (isUberlandia) {
      // Em Uberlândia: usa estritamente os equipamentos cadastrados pelos operadores de UDI
      var html = '<option value="">Selecione o equipamento...</option>';
      equips.forEach(function(eq) {
        var isSel = (eq === selectedVal) ? ' selected' : '';
        html += '<option value="' + escapeHTML(eq) + '"' + isSel + '>' + escapeHTML(eq) + '</option>';
      });
      html += '<option value="__novo__" style="color:var(--blue);font-weight:700;">➕ Cadastrar Novo Equipamento...</option>';
      return html;
    } else {
      // Juiz de Fora: usa os equipamentos do catálogo ou fallback dos 13 de JF
      if (equips.length === 0) {
        equips = ['LIVE U1', 'LIVE U2', 'LIVE U3', 'LIVE U4', 'LIVE U SMART', 'REDAÇÃO', 'KMJ', 'NET PRAÇA', 'NET PORTARIA', 'FORMATOS NET', 'NET 2º ANDAR', 'NET 3º ANDAR', 'NET 4º ANDAR'];
      }
      var html = '<option value="">Selecione o equipamento...</option>';
      equips.forEach(function(eq) {
        var isSel = (eq === selectedVal) ? ' selected' : '';
        html += '<option value="' + escapeHTML(eq) + '"' + isSel + '>' + escapeHTML(eq) + '</option>';
      });
      html += '<option value="__novo__" style="color:var(--blue);font-weight:700;">➕ Cadastrar Novo Equipamento...</option>';
      return html;
    }
  }
  window.obterOpcoesEquipamentosHTML = obterOpcoesEquipamentosHTML;

  function atualizarSelectsEquipamentosCTRS() {
    var selects = document.querySelectorAll('.ctrs-infra-select');
    selects.forEach(function(sel) {
      var currentVal = sel.value;
      sel.innerHTML = obterOpcoesEquipamentosHTML(currentVal);
      if (currentVal && currentVal !== '__novo__') {
        sel.value = currentVal;
      }
      if (!sel._hasNovoEqListener) {
        sel._hasNovoEqListener = true;
        sel.addEventListener('change', function() {
          if (this.value === '__novo__') {
            this.value = '';
            window._eqTriggeringSelect = this;
            if (typeof abrirModalCadastroEquipamento === 'function') abrirModalCadastroEquipamento();
            else if (typeof abrirModalNovoEquipamento === 'function') abrirModalNovoEquipamento();
          }
        });
      }
    });
  }
  window.atualizarSelectsEquipamentosCTRS = atualizarSelectsEquipamentosCTRS;

  /* ═══════════════════════════════════════════
     EQUIPE DE JORNALISMO (REPÓRTERES E RCs)
     Separado estritamente por Praça (Juiz de Fora e Uberlândia)
     Sincronizado na Nuvem (Supabase checklist_itens) com Fallback Local
  ═══════════════════════════════════════════ */
  var EQUIPE_STORAGE_KEY = 'tv_equipe_jornalismo_v3';

  var EQUIPE_PADRAO_JF = {
    reporteres: [
      'Ana Paula Cruzeiro',
      'Ariane',
      'Bruno',
      'Elton',
      'Ester',
      'Érica',
      'Gabriel',
      'Inácio',
      'Kailaine',
      'Landim',
      'Larissa',
      'Letícia Damasceno',
      'Letícia Nery',
      'Marcus',
      'Maria',
      'Nayara',
      '- (Sem Repórter)'
    ],
    rcs: [
      'Evandro',
      'Humberto',
      'Rodrigo Neves',
      'Rodrigo Soares',
      'Rodrigo Souza',
      'Sidney',
      'Wesley',
      '- (Sem Cinegrafista)'
    ]
  };

  function normalizarNomeProfissional(nome) {
    var n = (nome || '').trim();
    if (n.toLowerCase() === 'letícia nary' || n.toLowerCase() === 'leticia nary') {
      return 'Letícia Nery';
    }
    return n;
  }

  function ordenarListaProfissionais(lista, opSem) {
    var semItem = null;
    var normais = [];
    var vistos = {};
    (lista || []).forEach(function(it) {
      var nome = normalizarNomeProfissional(typeof it === 'string' ? it : (it.nome || it.titulo || ''));
      if (!nome) return;
      if (nome.indexOf('- (Sem ') === 0) {
        semItem = opSem || nome;
        return;
      }
      var chave = nome.toLowerCase();
      if (!vistos[chave]) {
        vistos[chave] = true;
        if (typeof it === 'object' && it !== null) {
          it.nome = nome;
          if (it.titulo) it.titulo = nome;
          normais.push(it);
        } else {
          normais.push(nome);
        }
      }
    });
    normais.sort(function(a, b) {
      var na = (typeof a === 'string' ? a : (a.nome || a.titulo || '')).toLowerCase();
      var nb = (typeof b === 'string' ? b : (b.nome || b.titulo || '')).toLowerCase();
      return na.localeCompare(nb, 'pt-BR');
    });
    if (semItem || opSem) {
      normais.push(semItem || opSem);
    }
    return normais;
  }

  function normalizarPracaEquipe(praca) {
    var p = (praca || '').toLowerCase();
    if (p.indexOf('uber') !== -1 || p.indexOf('udi') !== -1) {
      return 'Uberlândia';
    }
    return 'Juiz de Fora';
  }
  window.normalizarPracaEquipe = normalizarPracaEquipe;

  function carregarEquipeLocal() {
    var padrao = {
      'Juiz de Fora': {
        reporteres: EQUIPE_PADRAO_JF.reporteres.slice(),
        rcs: EQUIPE_PADRAO_JF.rcs.slice()
      },
      'Uberlândia': { reporteres: [], rcs: [] }
    };
    try {
      localStorage.removeItem('tv_equipe_jornalismo_v1');
      localStorage.removeItem('tv_equipe_jornalismo_v2');
      localStorage.removeItem('tv_equipe_jornalismo');
      var raw = localStorage.getItem(EQUIPE_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          var filtrarValidos = function(lista) {
            if (!Array.isArray(lista)) return [];
            return lista.filter(function(it) {
              var n = (typeof it === 'string' ? it : (it.nome || it.titulo || '')).trim();
              var low = n.toLowerCase();
              return n && low.indexOf('exclusivo') === -1 && low.indexOf('teste') === -1 && n.indexOf('Ã') === -1;
            });
          };

          if (parsed['Juiz de Fora']) {
            var jfRep = filtrarValidos(parsed['Juiz de Fora'].reporteres);
            var jfRC  = filtrarValidos(parsed['Juiz de Fora'].rcs);

            var repCombined = EQUIPE_PADRAO_JF.reporteres.concat(jfRep);
            padrao['Juiz de Fora'].reporteres = ordenarListaProfissionais(repCombined, '- (Sem Repórter)');

            var rcCombined = EQUIPE_PADRAO_JF.rcs.concat(jfRC);
            padrao['Juiz de Fora'].rcs = ordenarListaProfissionais(rcCombined, '- (Sem Cinegrafista)');
          }

          if (parsed['Uberlândia']) {
            padrao['Uberlândia'].reporteres = ordenarListaProfissionais(filtrarValidos(parsed['Uberlândia'].reporteres), '- (Sem Repórter)');
            padrao['Uberlândia'].rcs = ordenarListaProfissionais(filtrarValidos(parsed['Uberlândia'].rcs), '- (Sem Cinegrafista)');
          }
          return padrao;
        }
      }
    } catch(e) {}
    return padrao;
  }
  window.carregarEquipeLocal = carregarEquipeLocal;

  function salvarEquipeLocal(dados) {
    try {
      localStorage.setItem(EQUIPE_STORAGE_KEY, JSON.stringify(dados));
    } catch(e) {
      console.warn('Erro ao salvar equipe local:', e);
    }
  }
  window.salvarEquipeLocal = salvarEquipeLocal;

  function obterOpcoesReporteresHTML(selectedVal) {
    var praca = normalizarPracaEquipe(typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora');
    var equipe = carregarEquipeLocal();
    var lista = (equipe[praca] && Array.isArray(equipe[praca].reporteres)) ? equipe[praca].reporteres : [];
    var html = '<option value="">Selecione o repórter...</option>';
    
    var jaSelecionado = false;
    lista.forEach(function(rep) {
      var nome = typeof rep === 'string' ? rep : (rep.nome || rep.titulo || '');
      if (!nome) return;
      var isSel = (nome === selectedVal);
      if (isSel) jaSelecionado = true;
      html += '<option value="' + escapeHTML(nome) + '"' + (isSel ? ' selected' : '') + '>' + escapeHTML(nome) + '</option>';
    });

    var outraPraca = (praca === 'Juiz de Fora') ? 'Uberlândia' : 'Juiz de Fora';
    var pertenceOutraPraca = equipe[outraPraca] && (
      (equipe[outraPraca].reporteres || []).some(function(r){ return (r.nome || r.titulo || r) === selectedVal; })
    );

    if (!pertenceOutraPraca && selectedVal && !jaSelecionado && selectedVal !== '__novo_reporter__') {
      html += '<option value="' + escapeHTML(selectedVal) + '" selected>' + escapeHTML(selectedVal) + '</option>';
    }

    html += '<option value="__novo_reporter__" style="color:var(--blue);font-weight:700;">➕ Cadastrar Novo Repórter...</option>';
    return html;
  }
  window.obterOpcoesReporteresHTML = obterOpcoesReporteresHTML;

  function obterOpcoesRCsHTML(selectedVal) {
    var praca = normalizarPracaEquipe(typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora');
    var equipe = carregarEquipeLocal();
    var lista = (equipe[praca] && Array.isArray(equipe[praca].rcs)) ? equipe[praca].rcs : [];
    var html = '<option value="">Selecione o RC...</option>';

    var jaSelecionado = false;
    lista.forEach(function(rc) {
      var nome = typeof rc === 'string' ? rc : (rc.nome || rc.titulo || '');
      if (!nome) return;
      var isSel = (nome === selectedVal);
      if (isSel) jaSelecionado = true;
      html += '<option value="' + escapeHTML(nome) + '"' + (isSel ? ' selected' : '') + '>' + escapeHTML(nome) + '</option>';
    });

    var outraPraca = (praca === 'Juiz de Fora') ? 'Uberlândia' : 'Juiz de Fora';
    var pertenceOutraPraca = equipe[outraPraca] && (
      (equipe[outraPraca].rcs || []).some(function(r){ return (r.nome || r.titulo || r) === selectedVal; })
    );

    if (!pertenceOutraPraca && selectedVal && !jaSelecionado && selectedVal !== '__novo_rc__') {
      html += '<option value="' + escapeHTML(selectedVal) + '" selected>' + escapeHTML(selectedVal) + '</option>';
    }

    html += '<option value="__novo_rc__" style="color:var(--blue);font-weight:700;">➕ Cadastrar Novo RC...</option>';
    return html;
  }
  window.obterOpcoesRCsHTML = obterOpcoesRCsHTML;

  function atualizarSelectsProfissionaisCTRS() {
    var repSelects = document.querySelectorAll('.ctrs-reporter-select');
    repSelects.forEach(function(sel) {
      var currentVal = sel.value;
      sel.innerHTML = obterOpcoesReporteresHTML(currentVal);
      if (currentVal && currentVal !== '__novo_reporter__') {
        var match = Array.from(sel.options).some(function(o){ return o.value === currentVal; });
        sel.value = match ? currentVal : '';
      }
      if (!sel._hasNovoProfListener) {
        sel._hasNovoProfListener = true;
        sel.addEventListener('change', function() {
          if (this.value === '__novo_reporter__') {
            this.value = '';
            abrirModalNovoProfissional('reporter', this);
          }
        });
      }
    });

    var rcSelects = document.querySelectorAll('.ctrs-rc-select');
    rcSelects.forEach(function(sel) {
      var currentVal = sel.value;
      sel.innerHTML = obterOpcoesRCsHTML(currentVal);
      if (currentVal && currentVal !== '__novo_rc__') {
        var match = Array.from(sel.options).some(function(o){ return o.value === currentVal; });
        sel.value = match ? currentVal : '';
      }
      if (!sel._hasNovoProfListener) {
        sel._hasNovoProfListener = true;
        sel.addEventListener('change', function() {
          if (this.value === '__novo_rc__') {
            this.value = '';
            abrirModalNovoProfissional('rc', this);
          }
        });
      }
    });
  }
  window.atualizarSelectsProfissionaisCTRS = atualizarSelectsProfissionaisCTRS;

  function abrirModalNovoProfissional(tipo, triggeringSelect) {
    tipo = (tipo === 'rc') ? 'rc' : 'reporter';
    window._profTriggeringSelect = triggeringSelect || null;
    var pracaAtiva = normalizarPracaEquipe(typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora');

    var tipoEl = document.getElementById('novo-prof-tipo');
    var catEl  = document.getElementById('novo-prof-categoria');
    var nomeEl = document.getElementById('novo-prof-nome');
    var titEl  = document.getElementById('novo-prof-title');
    var subEl  = document.getElementById('novo-prof-subtitle');

    if (tipoEl) tipoEl.value = tipo;
    if (catEl)  catEl.value = tipo;
    if (nomeEl) {
      nomeEl.value = '';
      setTimeout(function() { nomeEl.focus(); }, 150);
    }

    if (titEl) {
      titEl.textContent = (tipo === 'rc') ? 'Cadastrar Novo RC (' + pracaAtiva + ')' : 'Cadastrar Novo Repórter (' + pracaAtiva + ')';
    }
    if (subEl) {
      subEl.textContent = (tipo === 'rc')
        ? 'Cadastre o Repórter Cinematográfico para a praça ' + pracaAtiva
        : 'Cadastre o Repórter para a praça ' + pracaAtiva;
    }

    abrirPopup('popup-novo-profissional');
  }
  window.abrirModalNovoProfissional = abrirModalNovoProfissional;

  function obterCredenciaisDB() {
    if (typeof getDBCredentials === 'function') return getDBCredentials();
    if (typeof window !== 'undefined' && typeof window.getDBCredentials === 'function') return window.getDBCredentials();
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

  async function salvarNovoProfissionalEquipe() {
    var tipoEl = document.getElementById('novo-prof-tipo');
    var nomeEl = document.getElementById('novo-prof-nome');
    var nome = (nomeEl ? nomeEl.value : '').trim();
    var tipo = (tipoEl ? tipoEl.value : 'reporter').toLowerCase();
    var pracaAtiva = normalizarPracaEquipe(typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora');

    if (!nome) {
      alert('Por favor, informe o nome do profissional.');
      if (nomeEl) nomeEl.focus();
      return;
    }

    var equipe = carregarEquipeLocal();
    var chaveLista = (tipo === 'rc') ? 'rcs' : 'reporteres';
    if (!equipe[pracaAtiva]) equipe[pracaAtiva] = { reporteres: [], rcs: [] };

    var existe = equipe[pracaAtiva][chaveLista].some(function(item) {
      var n = typeof item === 'string' ? item : (item.nome || item.titulo || '');
      return n.toLowerCase() === nome.toLowerCase();
    });

    if (existe) {
      alert('Este profissional já está cadastrado em ' + pracaAtiva + '.');
      return;
    }

    var profId = 'prof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    var novoItem = { id: profId, nome: nome, categoria: tipo, praca: pracaAtiva };
    equipe[pracaAtiva][chaveLista].push(novoItem);
    salvarEquipeLocal(equipe);

    var targetSelect = window._profTriggeringSelect;

    fecharPopup('popup-novo-profissional');

    if (typeof mostrarToast === 'function') {
      mostrarToast('Profissional Cadastrado', nome + ' adicionado a ' + pracaAtiva + '.', 'success');
    }

    atualizarSelectsProfissionaisCTRS();

    if (targetSelect) {
      try {
        targetSelect.value = nome;
      } catch(e) {}
    }

    // Sincroniza diretamente no Supabase em checklist_itens
    var db = obterCredenciaisDB();
    if (db && db.url && db.key) {
      try {
        var payload = {
          id: profId,
          titulo: nome,
          categoria: tipo,
          operador_nome: pracaAtiva,
          padrao: false,
          concluido: false
        };
        var res = await fetch(db.url.replace(/\/$/, '') + '/rest/v1/checklist_itens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': db.key,
            'Authorization': 'Bearer ' + db.key,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          var errText = await res.text();
          console.error('[Equipe Nuvem] Erro ao salvar profissional no banco:', res.status, errText);
        } else {
          console.log('[Equipe Nuvem] ✅ Profissional sincronizado na nuvem com sucesso:', nome, '(' + pracaAtiva + ')');
        }
      } catch(eNuvem) {
        console.warn('[Equipe Nuvem] Falha de conexão ao enviar para nuvem:', eNuvem);
      }
    }
  }
  window.salvarNovoProfissionalEquipe = salvarNovoProfissionalEquipe;

  function removerProfissionalEquipe(id, tipo, nome, praca) {
    praca = normalizarPracaEquipe(praca || (typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora'));
    if (!confirm('Deseja realmente remover "' + nome + '" de ' + praca + '?')) {
      return;
    }

    var equipe = carregarEquipeLocal();
    var chaveLista = (tipo === 'rc') ? 'rcs' : 'reporteres';
    if (equipe[praca]) {
      equipe[praca][chaveLista] = equipe[praca][chaveLista].filter(function(item) {
        var itemId = typeof item === 'string' ? item : (item.id || item.nome);
        return itemId !== id && item.nome !== nome;
      });
    }

    salvarEquipeLocal(equipe);
    atualizarSelectsProfissionaisCTRS();

    if (typeof mostrarToast === 'function') {
      mostrarToast('Profissional Removido', nome + ' foi removido da equipe.', 'info');
    }

    var db = obterCredenciaisDB();
    if (db && db.url && db.key && id) {
      try {
        fetch(db.url.replace(/\/$/, '') + '/rest/v1/checklist_itens?id=eq.' + encodeURIComponent(id), {
          method: 'DELETE',
          headers: {
            'apikey': db.key,
            'Authorization': 'Bearer ' + db.key
          }
        }).catch(function(err) { console.error('[Equipe Nuvem] Erro ao excluir:', err); });
      } catch(eDel) {
        console.warn('[Equipe Nuvem] Falha ao excluir na nuvem:', eDel);
      }
    }
  }
  window.removerProfissionalEquipe = removerProfissionalEquipe;

  async function sincronizarEquipeNuvem() {
    var db = obterCredenciaisDB();
    if (!db || !db.url || !db.key) return;

    try {
      var url = db.url.replace(/\/$/, '') + '/rest/v1/checklist_itens?select=id,titulo,categoria,operador_nome&categoria=in.(reporter,rc)&order=titulo.asc&limit=1000';
      var res = await fetch(url, {
        headers: {
          'apikey': db.key,
          'Authorization': 'Bearer ' + db.key,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) return;
      var data = await res.json();
      if (!Array.isArray(data)) return;

      var repMap = {
        'Juiz de Fora': { reporteres: [], rcs: [] },
        'Uberlândia': { reporteres: [], rcs: [] }
      };

      data.forEach(function(item) {
        if (!item || !item.titulo) return;
        var titulo = item.titulo.trim();
        var low = titulo.toLowerCase();
        // Filtrar qualquer resquício de itens de teste antigos
        if (low.indexOf('exclusivo') !== -1 || low.indexOf('teste') !== -1 || titulo.indexOf('Ã') !== -1) return;
        
        var pNorm = normalizarPracaEquipe(item.operador_nome);
        var p = { id: item.id, nome: titulo, categoria: item.categoria, praca: pNorm };
        if (item.categoria === 'rc') {
          repMap[pNorm].rcs.push(p);
        } else {
          repMap[pNorm].reporteres.push(p);
        }
      });

      salvarEquipeLocal(repMap);
      atualizarSelectsProfissionaisCTRS();
    } catch(err) {
      console.warn('[Equipe Nuvem] Erro ao sincronizar equipe:', err);
    }
  }
  window.sincronizarEquipeNuvem = sincronizarEquipeNuvem;

  function adicionarTransmissaoCTRS(silencioso) {
    var container = document.getElementById('ctrs-acc-container');
    if (!container) return;

    var currentCount = container.querySelectorAll('.acc-block').length;
    var newNum = currentCount + 1;

    var div = document.createElement('div');
    div.className = 'acc-block';
    div.innerHTML =
      '<div class="acc-head open" onclick="togAcc(this)" aria-expanded="true">' +
        '<span class="acc-title-text">Transmissão Vivo ' + newNum + '</span>' +
        '<i data-lucide="chevron-down" class="acc-arrow" style="width:14px;height:14px;stroke-width:2;"></i>' +
      '</div>' +
      '<div class="acc-body open">' +
        '<div class="fg2">' +
          '<div class="frow"><label>Cidade / Bairro</label><input type="text" placeholder="Ex: Centro — Juiz de Fora"/></div>' +
          '<div class="frow">' +
            '<label>Infraestrutura da Transmissão</label>' +
            '<select class="ctrs-infra-select">' +
              obterOpcoesEquipamentosHTML() +
            '</select>' +
          '</div>' +
          '<div class="frow"><label>Hora Abertura Sinal</label><input type="time"/></div>' +
          '<div class="frow"><label>Hora Final (Teste OK)</label><input type="time"/></div>' +
          '<div class="frow"><label>Qualidade do Áudio</label><select><option value="" selected>Selecione...</option><option>C — Conforme</option><option>NC — Não Conforme</option><option>NA — Não se Aplica</option></select></div>' +
          '<div class="frow"><label>Qualidade do Vídeo</label><select><option value="" selected>Selecione...</option><option>C — Conforme</option><option>NC — Não Conforme</option><option>NA — Não se Aplica</option></select></div>' +
          '<div class="frow"><label>Repórter</label><select class="ctrs-reporter-select">' + obterOpcoesReporteresHTML() + '</select></div>' +
          '<div class="frow"><label>Entradas</label><input type="text" placeholder="Ex: 2 entradas conformes — externo"/></div>' +
          '<div class="frow"><label>Repórter Cinematográfico</label><select class="ctrs-rc-select">' + obterOpcoesRCsHTML() + '</select></div>' +
          '<div class="frow"><label>Status da Transmissão</label><select><option value="" selected>Selecione...</option><option>C — Conforme</option><option>NC — Não Conforme</option><option>NA — Não se Aplica</option></select></div>' +
        '</div>' +
        '<div class="frow"><label>Observações</label><textarea placeholder="Descreva as falhas. Se nenhuma, deixe em branco."></textarea></div>' +
        '<div style="display:flex;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--border-lt);margin-top:10px;">' +
          '<button type="button" class="btn btn-ghost btn-xs" onclick="removerTransmissaoCTRS(this);" style="color:var(--red);border-color:var(--red-border);display:inline-flex;align-items:center;gap:5px;padding:4px 10px;" title="Remover esta transmissão">' +
            '<i data-lucide="trash-2" style="width:13px;height:13px;stroke-width:2;"></i>' +
            '<span>Remover Transmissão</span>' +
          '</button>' +
        '</div>' +
      '</div>';

    container.appendChild(div);
    atualizarSelectsProfissionaisCTRS();
    atualizarSelectsEquipamentosCTRS();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (!silencioso) {
      salvarRascunhoRelatorioTV(true);
    }
  }

  function removerTransmissaoCTRS(btn) {
    var block = btn.closest('.acc-block');
    if (!block) return;
    block.remove();

    var remaining = document.querySelectorAll('#page-ctrs .acc-block');
    remaining.forEach(function(b, idx) {
      var num = idx + 1;
      var titleSpan = b.querySelector('.acc-title-text');
      if (titleSpan) {
        titleSpan.textContent = 'Transmissão Vivo ' + num;
      } else {
        var head = b.querySelector('.acc-head');
        if (head) {
          for (var i = 0; i < head.childNodes.length; i++) {
            if (head.childNodes[i].nodeType === 3 && head.childNodes[i].textContent.indexOf('Transmissão Vivo') !== -1) {
              head.childNodes[i].textContent = 'Transmissão Vivo ' + num;
              break;
            }
          }
        }
      }
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
    salvarRascunhoRelatorioTV(true);
  }

  window.adicionarTransmissaoCTRS = adicionarTransmissaoCTRS;
  window.removerTransmissaoCTRS   = removerTransmissaoCTRS;

  function obterDataHojeISO() {
    var d = new Date();
    var ano = d.getFullYear();
    var mes = String(d.getMonth() + 1).padStart(2, '0');
    var dia = String(d.getDate()).padStart(2, '0');
    return ano + '-' + mes + '-' + dia;
  }

  function carregarRascunhoRelatorioTV() {
    try {
      var dataEl  = document.getElementById('ctrs-data');
      var pracaEl = document.getElementById('ctrs-praca');
      var tipoEl  = document.getElementById('ctrs-tipo');
      var obsEl   = document.getElementById('ctrs-obs');
      var pracaAtiva = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
      if (pracaEl) pracaEl.value = pracaAtiva;
      if (dataEl)  dataEl.value = obterDataHojeISO();

      var raw = localStorage.getItem('tv_ctrs_rascunho_v2');
      if (!raw) return;
      var dados = JSON.parse(raw);
      if (!dados) return;

      if (tipoEl && dados.tipo)   tipoEl.value = dados.tipo;
      if (obsEl && dados.obs)     obsEl.value = dados.obs;

      if (Array.isArray(dados.transmissoes)) {
        var container = document.getElementById('ctrs-acc-container');
        var accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
        while (accBlocks.length < dados.transmissoes.length && container) {
          adicionarTransmissaoCTRS(true);
          accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
        }

        dados.transmissoes.forEach(function(tx, idx) {
          if (accBlocks[idx]) {
            var inputs = accBlocks[idx].querySelectorAll('input, select, textarea');
            var temDadosTx = !!(tx.cidade || tx.infra || tx.horaAbert || tx.horaFim || tx.reporter || tx.entradas || tx.rc || tx.falhas);
            if (inputs[0] && tx.cidade !== undefined)    inputs[0].value = tx.cidade;
            if (inputs[1] && tx.infra !== undefined)     inputs[1].value = tx.infra;
            if (inputs[2] && tx.horaAbert !== undefined) inputs[2].value = tx.horaAbert;
            if (inputs[3] && tx.horaFim !== undefined)   inputs[3].value = tx.horaFim;
            if (inputs[4] && tx.audioQ !== undefined) {
              if (idx === 0 || temDadosTx || (tx.audioQ !== 'C' && tx.audioQ !== '')) inputs[4].value = tx.audioQ;
            }
            if (inputs[5] && tx.videoQ !== undefined) {
              if (idx === 0 || temDadosTx || (tx.videoQ !== 'C' && tx.videoQ !== '')) inputs[5].value = tx.videoQ;
            }
            if (inputs[6] && tx.reporter !== undefined)  inputs[6].value = tx.reporter;
            if (inputs[7] && tx.entradas !== undefined)  inputs[7].value = tx.entradas;
            if (inputs[8] && tx.rc !== undefined)        inputs[8].value = tx.rc;
            if (inputs[9] && tx.statusTx !== undefined) {
              if (idx === 0 || temDadosTx || (tx.statusTx !== 'C' && tx.statusTx !== '')) inputs[9].value = tx.statusTx;
            }
            if (inputs[10] && tx.falhas !== undefined)   inputs[10].value = tx.falhas;
          }
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar rascunho CTRS:', e);
    }
  }

  var LOGO_TV_INTEGRACAO_B64 = 'data:image/png;base64,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';
  var EMAIL_RELAY_CIPHER_HEX = '90d7f09b56eea3cd099a98646d1576fb4cc53ef067f078b353286e09af3bc966dbaba361ffb80be843ca1dc3aede807b762f4d959b78643bbf3277e160f3f0016d1368183e4d9056e91c30939ba1a76c5655a044a74d51df70e27cc51cf2915f95f2d92b557ac03aec0b589163afebeb5ae7';

  function obterEndpointRelayEmailCTRS() {
    var k = atob('QEludGVncmEyNjIw') + '_CTRS_Relay_Key_2026';
    var hex = EMAIL_RELAY_CIPHER_HEX;
    var out = '';
    for (var idx = 0; idx < hex.length / 2; idx++) {
      var h = (2166136261 ^ idx) >>> 0;
      for (var j = 0; j < k.length; j++) {
        h = (h ^ k.charCodeAt(j)) >>> 0;
        h = Math.imul(h, 16777619) >>> 0;
      }
      h = (h ^ (h >>> 13)) >>> 0;
      h = Math.imul(h, 0x5bd1e995) >>> 0;
      var mask = ((h ^ (h >>> 15)) >>> 0) & 0xFF;
      var byteVal = parseInt(hex.substr(idx * 2, 2), 16);
      out += String.fromCharCode(byteVal ^ mask);
    }
    return out;
  }

  function getEstiloCelulaQualidadeEmail(codigo) {
    if (codigo === 'NC') {
      return {
        bg: '#FEF2F2',
        texto: '<strong style="color:#B91C1C;">&#9888; NC</strong> <span style="color:#991B1B; font-size:11px;">(N&atilde;o Conforme)</span>'
      };
    }
    if (codigo === 'NA') {
      return {
        bg: '#F8FAFC',
        texto: '<strong style="color:#475569;">NA</strong> <span style="color:#64748B; font-size:11px;">(N&atilde;o se Aplica)</span>'
      };
    }
    return {
      bg: '#F0FDF4',
      texto: '<strong style="color:#15803D;">&#10003; C</strong> <span style="color:#166534; font-size:11px;">(Conforme)</span>'
    };
  }

  function gerarHTMLTemplateCTRS(destinatarioInformado) {
    var dataEl  = document.getElementById('ctrs-data');
    var pracaEl = document.getElementById('ctrs-praca');
    var tipoEl  = document.getElementById('ctrs-tipo');
    var obsEl   = document.getElementById('ctrs-obs');

    var praca = pracaEl ? pracaEl.value : 'Juiz de Fora';
    var dataRaw = dataEl && dataEl.value ? dataEl.value : '';
    var dataFmt = '';
    if (dataRaw) {
      var p = dataRaw.split('-');
      dataFmt = (p.length === 3) ? (p[2] + '/' + p[1] + '/' + p[0]) : dataRaw;
    } else {
      var dNow = new Date();
      var dia = String(dNow.getDate()).padStart(2, '0');
      var mes = String(dNow.getMonth() + 1).padStart(2, '0');
      dataFmt = dia + '/' + mes + '/' + dNow.getFullYear();
    }

    var tipo = tipoEl ? tipoEl.value : 'INTEGRAÇÃO NOTÍCIA';
    var inCheck = '', mg1Check = '', mg2Check = '', outrosCheck = '';
    var tipoUpper = tipo.toUpperCase();
    if (tipoUpper.includes('NOTÍCIA') || tipoUpper.includes('IN')) {
      inCheck = 'X';
    } else if (tipoUpper === 'MG1') {
      mg1Check = 'X';
    } else if (tipoUpper === 'MG2') {
      mg2Check = 'X';
    } else {
      outrosCheck = 'X';
    }

    var obs = obsEl ? obsEl.value.trim() : '';
    var operadorAtual = (typeof getUsuarioAtual === 'function' && getUsuarioAtual()) ? getUsuarioAtual() : 'Equipe Operacional';

    var formatTimeVal = function(val) {
      if (!val) return '&mdash;';
      var parts = val.trim().split(':');
      if (parts.length === 2) return parts[0] + 'h' + parts[1] + "\'";
      return val.trim();
    };

    var formatQualidade = function(val, defaultVal) {
      if (!val) return defaultVal || '';
      var v = val.trim();
      if (v.startsWith('NC') || v.startsWith('Não Conforme')) return 'NC';
      if (v.startsWith('NA') || v.startsWith('Não se Aplica')) return 'NA';
      if (v.startsWith('C') || v.startsWith('Conforme')) return 'C';
      return defaultVal || '';
    };

    var accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
    var transmissoesHTML = '';
    var totalTransmissoesIncluidas = 0;

    accBlocks.forEach(function(acc, idx) {
      var inputs = acc.querySelectorAll('input, select, textarea');
      var cidade    = (inputs[0] && inputs[0].value.trim()) || '';
      var infra     = (inputs[1] && inputs[1].value.trim()) || '';
      var rawHoraAb = inputs[2] ? inputs[2].value.trim() : '';
      var rawHoraFm = inputs[3] ? inputs[3].value.trim() : '';
      var horaAbert = formatTimeVal(rawHoraAb);
      var horaFim   = formatTimeVal(rawHoraFm);
      var rawAudio  = inputs[4] ? inputs[4].value.trim() : '';
      var rawVideo  = inputs[5] ? inputs[5].value.trim() : '';
      var reporter  = (inputs[6] && inputs[6].value.trim()) || '';
      var entradas  = (inputs[7] && inputs[7].value.trim()) || '';
      var rc        = (inputs[8] && inputs[8].value.trim()) || '';
      var rawStatus = inputs[9] ? inputs[9].value.trim() : '';
      var falhas    = (inputs[10] && inputs[10].value.trim()) || '';

      var foiUtilizada = !!(cidade || infra || rawHoraAb || rawHoraFm || reporter || entradas || rc || falhas || rawAudio || rawVideo || rawStatus);
      if (idx > 0 && !foiUtilizada) {
        return;
      }

      totalTransmissoesIncluidas++;
      var num = totalTransmissoesIncluidas;

      var audioQ   = formatQualidade(rawAudio, 'C');
      var videoQ   = formatQualidade(rawVideo, 'C');
      var statusTx = formatQualidade(rawStatus, 'C');

      var estAudio  = getEstiloCelulaQualidadeEmail(audioQ);
      var estVideo  = getEstiloCelulaQualidadeEmail(videoQ);
      var estStatus = getEstiloCelulaQualidadeEmail(statusTx);

      var temNaoConformidade = (audioQ === 'NC' || videoQ === 'NC' || statusTx === 'NC');

      var reporterCompleto = reporter || '&mdash;';
      if (entradas) {
        reporterCompleto = (reporter ? reporter + ' <strong style="color:#15803D;">(' + entradas + ')</strong>' : '<strong style="color:#15803D;">(' + entradas + ')</strong>');
      }

      var cidadeCompleta = cidade;
      if (cidadeCompleta && !cidadeCompleta.toLowerCase().includes(praca.toLowerCase())) {
        cidadeCompleta = praca + ' &ndash; ' + cidadeCompleta;
      } else if (!cidadeCompleta) {
        cidadeCompleta = praca;
      }

      var headerBg    = temNaoConformidade ? '#FEE2E2' : '#DBEAFE';
      var headerColor = temNaoConformidade ? '#991B1B' : '#1E3A8A';
      var borderTable = temNaoConformidade ? '#FCA5A5' : '#94A3B8';

      var obsCellBg = (falhas && !falhas.toLowerCase().includes('sem ocorrência') && !falhas.toLowerCase().includes('sem ocorrencia'))
        ? (temNaoConformidade ? '#FEF2F2' : '#FFFBEB')
        : '#FFFFFF';

      transmissoesHTML +=
        '<table cellpadding="5" cellspacing="0" style="width:100%; max-width:800px; border-collapse:collapse; font-family:Segoe UI, Arial, Helvetica, sans-serif; font-size:12px; color:#0F172A; border:1.5px solid ' + borderTable + '; margin-bottom:12px;">' +
          '<tr bgcolor="' + headerBg + '" style="background-color:' + headerBg + ';">' +
            '<td colspan="3" bgcolor="' + headerBg + '" style="background-color:' + headerBg + '; text-align:center; font-weight:bold; font-size:12.5px; color:' + headerColor + '; border:1px solid ' + borderTable + '; padding:6px 10px;">' +
              'Informa&ccedil;&otilde;es da Transmiss&atilde;o ao Vivo ' + num +
              (temNaoConformidade ? ' &mdash; ATEN&Ccedil;&Atilde;O: N&Atilde;O CONFORMIDADE' : '') +
            '</td>' +
          '</tr>' +
          '<tr bgcolor="#F8FAFC" style="background-color:#F8FAFC;">' +
            '<td colspan="3" bgcolor="#F8FAFC" style="background-color:#F8FAFC; border:1px solid #94A3B8; padding:6px 10px;">' +
              '<strong>Cidade:</strong> <strong style="color:#0F2C59;">' + cidadeCompleta + '</strong>' +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td bgcolor="#FFFFFF" style="width:44%; background-color:#FFFFFF; border:1px solid #94A3B8; padding:6px 10px;">' +
              '<strong>Infraestrutura de Transmiss&atilde;o Utilizada:</strong> <strong style="color:#1E3A8A;">' + (infra || '&mdash;') + '</strong>' +
            '</td>' +
            '<td bgcolor="#FFFFFF" style="width:28%; background-color:#FFFFFF; border:1px solid #94A3B8; padding:6px 10px;">' +
              '<strong>Hora Abertura Sinal:</strong> <strong>' + horaAbert + '</strong>' +
            '</td>' +
            '<td bgcolor="' + estAudio.bg + '" style="width:28%; background-color:' + estAudio.bg + '; border:1px solid #94A3B8; padding:6px 10px;">' +
              '<strong>Qualidade &Aacute;udio:</strong> ' + estAudio.texto +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td bgcolor="#FFFFFF" style="background-color:#FFFFFF; border:1px solid #94A3B8; padding:6px 10px;">' +
              '<strong>Rep&oacute;rter:</strong> ' + reporterCompleto +
            '</td>' +
            '<td bgcolor="#FFFFFF" style="background-color:#FFFFFF; border:1px solid #94A3B8; padding:6px 10px;">' +
              '<strong>Hora final (Teste OK):</strong> <strong>' + horaFim + '</strong>' +
            '</td>' +
            '<td bgcolor="' + estVideo.bg + '" style="background-color:' + estVideo.bg + '; border:1px solid #94A3B8; padding:6px 10px;">' +
              '<strong>Qualidade V&iacute;deo:</strong> ' + estVideo.texto +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td bgcolor="#FFFFFF" style="background-color:#FFFFFF; border:1px solid #94A3B8; padding:6px 10px;">' +
              '<strong>Rep&oacute;rter Cinematogr&aacute;fico:</strong> ' + (rc || '&mdash;') +
            '</td>' +
            '<td colspan="2" bgcolor="' + estStatus.bg + '" style="background-color:' + estStatus.bg + '; border:1px solid #94A3B8; padding:6px 10px;">' +
              '<strong>Status da Transmiss&atilde;o:</strong> ' + estStatus.texto +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td colspan="3" bgcolor="' + obsCellBg + '" style="background-color:' + obsCellBg + '; border:1px solid #94A3B8; padding:6px 10px;">' +
              '<strong>Falhas ocorridas:</strong> ' +
              (falhas ? '<span style="color:#0F172A;">' + falhas + '</span>' : '<span style="color:#64748B;">Sem ocorr&ecirc;ncias.</span>') +
            '</td>' +
          '</tr>' +
        '</table>';
    });

    var isUberlandia = praca.indexOf('Uber') !== -1;

    var renderCelulaJornal = function(sigla, marcado) {
      if (marcado) {
        return '<td bgcolor="#DBEAFE" style="width:25%; border:1px solid #94A3B8; background-color:#DBEAFE; color:#1E3A8A; padding:6px 10px; text-align:center; font-weight:bold;">' +
          '&#10004; <strong>' + sigla + ': X</strong>' +
        '</td>';
      }
      return '<td bgcolor="#FFFFFF" style="width:25%; border:1px solid #94A3B8; background-color:#FFFFFF; color:#64748B; padding:6px 10px; text-align:center;">' +
        '<strong>' + sigla + ':</strong> &ndash;' +
      '</td>';
    };

    var destLimpo = (destinatarioInformado || '').trim();

    var htmlCompleto =
      '<div style="font-family:Segoe UI, Arial, Helvetica, sans-serif; color:#0F172A; max-width:800px; margin:0 auto; padding:10px; background-color:#FFFFFF;">' +
        '<!-- CABEÇALHO OFICIAL ENGENHARIA (COM LOGO E SEM DATAS DE REVISÃO) -->' +
        '<table cellpadding="6" cellspacing="0" style="width:100%; max-width:800px; border-collapse:collapse; font-family:Segoe UI, Arial, sans-serif; font-size:12px; color:#0F172A; border:1.5px solid #475569; margin-bottom:12px;">' +
          '<tr>' +
            '<td bgcolor="#FFFFFF" style="width:150px; background-color:#FFFFFF; text-align:center; vertical-align:middle; border:1px solid #94A3B8; padding:8px;">' +
              '<img src="' + LOGO_TV_INTEGRACAO_B64 + '" width="105" height="73" alt="TV Integração" style="display:block; margin:0 auto; width:105px; height:73px; border:0;" />' +
            '</td>' +
            '<td bgcolor="#F8FAFC" style="background-color:#F8FAFC; text-align:center; vertical-align:middle; border:1px solid #94A3B8; padding:10px 14px; line-height:1.45;">' +
              '<div style="font-size:11px; color:#475569; font-weight:bold; text-transform:uppercase; letter-spacing:0.4px;">Processo Engenharia 1.1.1 &ndash; P02 &ndash; F02</div>' +
              '<div style="font-size:15px; font-weight:bold; color:#0F2C59; margin-top:4px;">' +
                (isUberlandia ? 'Relat&oacute;rio de Transmiss&atilde;o ao Vivo' : 'Checklist de Transmiss&atilde;o ao Vivo CTRS') +
              '</div>' +
            '</td>' +
          '</tr>' +
        '</table>' +

        '<!-- INFORMAÇÕES PRINCIPAIS -->' +
        '<table cellpadding="5" cellspacing="0" style="width:100%; max-width:800px; border-collapse:collapse; font-family:Segoe UI, Arial, sans-serif; font-size:12px; color:#0F172A; border:1.5px solid #94A3B8; margin-bottom:12px;">' +
          '<tr bgcolor="#DBEAFE" style="background-color:#DBEAFE;">' +
            '<td colspan="4" bgcolor="#DBEAFE" style="background-color:#DBEAFE; text-align:center; font-weight:bold; color:#1E3A8A; border:1px solid #94A3B8; padding:6px 10px; font-size:12.5px;">' +
              'Informa&ccedil;&otilde;es Principais' +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td colspan="2" bgcolor="#FFFFFF" style="width:50%; background-color:#FFFFFF; border:1px solid #94A3B8; padding:6px 10px;">' +
              '<strong>Data:</strong> <strong style="color:#0F2C59;">' + dataFmt + '</strong>' +
            '</td>' +
            '<td colspan="2" bgcolor="#FFFFFF" style="width:50%; background-color:#FFFFFF; border:1px solid #94A3B8; padding:6px 10px;">' +
              '<strong>Pra&ccedil;a:</strong> <strong style="color:#0F2C59;">' + praca + '</strong>' +
            '</td>' +
          '</tr>' +
          '<tr>' +
            renderCelulaJornal('IN', !!inCheck) +
            renderCelulaJornal('MG1', !!mg1Check) +
            renderCelulaJornal('MG2', !!mg2Check) +
            renderCelulaJornal('OUTROS', !!outrosCheck) +
          '</tr>' +
        '</table>' +

        '<!-- TRANSMISSÕES AO VIVO -->' +
        transmissoesHTML +

        '<!-- LEGENDA -->' +
        '<table cellpadding="5" cellspacing="0" style="width:100%; max-width:800px; border-collapse:collapse; font-family:Segoe UI, Arial, sans-serif; font-size:11.5px; color:#0F172A; border:1.5px solid #94A3B8; margin-bottom:12px;">' +
          '<tr bgcolor="#F1F5F9" style="background-color:#F1F5F9;">' +
            '<td colspan="3" bgcolor="#F1F5F9" style="background-color:#F1F5F9; text-align:center; font-weight:bold; color:#1E293B; border:1px solid #94A3B8; padding:5px;">' +
              'Legenda' +
            '</td>' +
          '</tr>' +
          '<tr style="text-align:center;">' +
            '<td bgcolor="#F0FDF4" style="width:33.3%; background-color:#F0FDF4; border:1px solid #94A3B8; padding:6px 8px; color:#15803D; font-weight:bold;">&#10003; C &ndash; Conforme</td>' +
            '<td bgcolor="#FEF2F2" style="width:33.3%; background-color:#FEF2F2; border:1px solid #94A3B8; padding:6px 8px; color:#B91C1C; font-weight:bold;">&#9888; NC &ndash; N&atilde;o Conforme</td>' +
            '<td bgcolor="#F8FAFC" style="width:33.3%; background-color:#F8FAFC; border:1px solid #94A3B8; padding:6px 8px; color:#475569; font-weight:bold;">NA &ndash; N&atilde;o se Aplica</td>' +
          '</tr>' +
        '</table>' +

        '<!-- OBSERVAÇÕES -->' +
        '<table cellpadding="5" cellspacing="0" style="width:100%; max-width:800px; border-collapse:collapse; font-family:Segoe UI, Arial, sans-serif; font-size:12px; color:#0F172A; border:1.5px solid #94A3B8; margin-bottom:8px;">' +
          '<tr bgcolor="#F1F5F9" style="background-color:#F1F5F9;">' +
            '<td bgcolor="#F1F5F9" style="background-color:#F1F5F9; text-align:center; font-weight:bold; color:#1E293B; border:1px solid #94A3B8; padding:5px;">' +
              'Observa&ccedil;&otilde;es' +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td bgcolor="#FFFFFF" style="background-color:#FFFFFF; border:1px solid #94A3B8; padding:8px 10px; min-height:36px; white-space:pre-wrap;">' +
              (obs ? obs : '<span style="color:#64748B;">Sem observa&ccedil;&otilde;es.</span>') +
            '</td>' +
          '</tr>' +
        '</table>' +

        '<div style="font-size:10.5px; color:#64748B; text-align:right; padding-top:2px;">' +
          'Emitido por: <strong>' + operadorAtual + '</strong>' + (destLimpo ? (' &bull; Destinat&aacute;rio: <strong>' + destLimpo + '</strong>') : '') +
        '</div>' +
      '</div>';

    return {
      html: htmlCompleto,
      assunto: (isUberlandia ? 'Transmissão ao Vivo - ' : 'Transmissão ao Vivo - CTRS - ') + (inCheck ? 'IN' : (mg1Check ? 'MG1' : (mg2Check ? 'MG2' : 'OUTROS'))) + ' - ' + praca + ' - ' + dataFmt
    };
  }

  function limparFormularioCTRS(confirmar) {
    if (confirmar && !confirm('Deseja realmente limpar todos os campos preenchidos do relatório CTRS?')) {
      return;
    }
    try {
      localStorage.removeItem('tv_ctrs_rascunho_v2');

      var dataEl = document.getElementById('ctrs-data');
      var obsEl  = document.getElementById('ctrs-obs');
      if (dataEl) dataEl.value = obterDataHojeISO();
      if (obsEl)  obsEl.value = '';

      var accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
      accBlocks.forEach(function(acc) {
        var inputs = acc.querySelectorAll('input, select, textarea');
        inputs.forEach(function(inp) {
          if (inp.tagName === 'SELECT') inp.selectedIndex = 0;
          else inp.value = '';
        });
      });

      var container = document.getElementById('ctrs-acc-container');
      if (container) {
        var blocks = container.querySelectorAll('.acc-block');
        for (var i = 4; i < blocks.length; i++) {
          blocks[i].remove();
        }
      }

      if (confirmar && typeof mostrarToast === 'function') {
        mostrarToast('Formulário Limpo', 'Os campos do CTRS foram zerados para o próximo preenchimento.', 'info');
      }
    } catch (e) {
      console.warn('Erro ao limpar CTRS:', e);
    }
  }
  window.limparFormularioCTRS = limparFormularioCTRS;

  function copiarRelatorioOutlook() {
    var resultado = gerarHTMLTemplateCTRS();
    var html = resultado.html;
    var assunto = resultado.assunto;

    var previewEl = document.getElementById('ctrs-outlook-preview');
    if (previewEl) {
      previewEl.innerHTML = html;
    }

    var pracaAtual = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isUdi = pracaAtual.indexOf('Uber') !== -1 || (assunto && assunto.indexOf('Uberlândia') !== -1);
    var descEl = document.getElementById('popup-ctrs-outlook-desc');
    if (descEl) {
      descEl.innerHTML = isUdi
        ? 'O relatório oficial de transmissão foi formatado e copiado. Confira o visual abaixo ou cole no Outlook com <strong>CTRL + V</strong>.'
        : 'O checklist oficial do CTRS foi formatado e copiado. Confira o visual abaixo ou cole no Outlook com <strong>CTRL + V</strong>.';
    }

    var copiado = false;
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        var blobHtml = new Blob([html], { type: 'text/html' });
        var blobText = new Blob([assunto + '\n\n' + html.replace(/<[^>]+>/g, ' ')], { type: 'text/plain' });
        var item = new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText
        });
        navigator.clipboard.write([item]).then(function() {
          abrirPopup('popup-ctrs-outlook');
        }).catch(function(err) {
          fallbackCopiarAreaTransferencia(html);
        });
        copiado = true;
      } catch (e) {
        copiado = false;
      }
    }

    if (!copiado) {
      fallbackCopiarAreaTransferencia(html);
    }
  }
  window.copiarRelatorioOutlook = copiarRelatorioOutlook;

  function fallbackCopiarAreaTransferencia(html) {
    var container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.pointerEvents = 'none';
    container.style.opacity = '0';
    document.body.appendChild(container);

    var range = document.createRange();
    range.selectNode(container);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    try {
      document.execCommand('copy');
      abrirPopup('popup-ctrs-outlook');
    } catch (e) {
      alert('Não foi possível copiar automaticamente. Por favor selecione e copie os dados.');
    }

    window.getSelection().removeAllRanges();
    document.body.removeChild(container);
  }

  /* Abre o Pop-up de Envio do Relatório CTRS (com campo de destinatário vazio + prévia do relatório embaixo) */
  function enviarRelatorioTV() {
    var resultado = gerarHTMLTemplateCTRS('');
    var destInput = document.getElementById('enviar-ctrs-destinatario');
    var assuntoInput = document.getElementById('enviar-ctrs-assunto');
    var previewEl = document.getElementById('enviar-ctrs-preview');

    if (destInput) {
      destInput.value = '';
      destInput.oninput = function() {
        if (previewEl) {
          previewEl.innerHTML = gerarHTMLTemplateCTRS(destInput.value).html;
        }
      };
    }
    if (assuntoInput) {
      assuntoInput.value = resultado.assunto;
    }
    if (previewEl) {
      previewEl.innerHTML = resultado.html;
    }

    abrirPopup('popup-enviar-relatorio-ctrs');
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      try { lucide.createIcons(); } catch (e) {}
    }
    setTimeout(function() {
      if (destInput) destInput.focus();
    }, 80);
  }
  window.enviarRelatorioTV = enviarRelatorioTV;

  /* Confirma o envio do relatório para o destinatário digitado, dispara via HTTP sem abrir pop-up do Windows, salva no banco e limpa o formulário */
  async function confirmarEnvioRelatorioCTRS() {
    var destInput = document.getElementById('enviar-ctrs-destinatario');
    var assuntoInput = document.getElementById('enviar-ctrs-assunto');
    var destinatario = destInput ? destInput.value.trim() : '';

    if (!destinatario || destinatario.indexOf('@') === -1) {
      alert('Por favor, informe um e-mail de destinatário válido antes de enviar o relatório.');
      if (destInput) destInput.focus();
      return;
    }

    var resultado = gerarHTMLTemplateCTRS(destinatario);
    var assuntoFinal = (assuntoInput && assuntoInput.value.trim()) ? assuntoInput.value.trim() : resultado.assunto;
    var htmlFinal = resultado.html;

    /* Copia silenciosamente o relatório formatado para a área de transferência sem abrir nenhum pop-up */
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        var blobHtml = new Blob([htmlFinal], { type: 'text/html' });
        var blobText = new Blob([assuntoFinal + '\n\n' + htmlFinal.replace(/<[^>]+>/g, ' ')], { type: 'text/plain' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })]).catch(function() {});
      } catch (e) {}
    }

    var nowStr = formatDataHoraLocal();
    var pracaEl = document.getElementById('ctrs-praca');
    var tipoEl  = document.getElementById('ctrs-tipo');
    var obsEl   = document.getElementById('ctrs-obs');

    var praca = pracaEl ? pracaEl.value : 'Juiz de Fora';
    var tipo  = tipoEl ? tipoEl.value : 'INTEGRAÇÃO NOTÍCIA';
    var obs   = obsEl ? obsEl.value.trim() : '';

    /* Dispara o e-mail HTML completo em segundo plano via Relay Criptografado (Google Apps Script) */
    var relayUrl = obterEndpointRelayEmailCTRS();
    try {
      fetch(relayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          to: destinatario,
          subject: assuntoFinal,
          html: htmlFinal,
          senderName: getUsuarioAtual()
        })
      }).catch(function(err) {
        console.warn('Aviso no disparo de e-mail CTRS:', err);
      });
    } catch (e) {}

    /* Coleta falhas registradas nas seções sanfonadas */
    var falhasEncontradas = [];
    if (obs && !obs.toLowerCase().includes('sem ocorrência') && !obs.toLowerCase().includes('sem ocorrencia')) {
      falhasEncontradas.push(obs);
    }

    document.querySelectorAll('#page-ctrs .acc-body textarea').forEach(function(txt, i) {
      var val = txt.value.trim();
      if (val && !val.toLowerCase().includes('sem ocorrência') && !val.toLowerCase().includes('sem ocorrencia')) {
        falhasEncontradas.push('Transmissão Vivo ' + (i + 1) + ': ' + val);
      }
    });

    var novasOcorrenciasCriadas = 0;

    /* Para cada falha relatada, cria automaticamente uma Ocorrência no Dashboard */
    falhasEncontradas.forEach(function(falhaTxt, idx) {
      novasOcorrenciasCriadas++;
      var novaOc = {
        id:          'oc_auto_' + Date.now() + '_' + idx,
        titulo:      'Falha em Relatório TV (' + tipo + ')',
        prio:        'Alta',
        cat:         'Telejornal / Transmissão ao Vivo',
        resp:        'Todos do turno',
        local:       praca,
        prazo:       '12:00',
        desc:        falhaTxt,
        mine:        false,
        tags:        ['Relatório TV', 'Automática'],
        status:      'aberta',
        criado:      Date.now(),
        dataCriacao: nowStr,
        resolucao:   null,
        praca:       praca
      };
      ocorrencias = [novaOc].concat(ocorrencias);
    });

    if (novasOcorrenciasCriadas > 0) {
      save(ocorrencias, null, true);
    }

    /* Registra o Relatório no Histórico */
    var isUberlandia = praca.indexOf('Uber') !== -1;
    var tituloRelatorio = isUberlandia ? ('Relatório de Transmissão — ' + tipo) : ('Checklist CTRS — ' + tipo + ' (' + praca + ')');
    var novoHist = {
      id:            'h_ctrs_' + Date.now(),
      tipo:          'relatorio',
      subtipo:       isUberlandia ? 'Relatório Transmissão' : 'CTRS Transmissão',
      titulo:        tituloRelatorio,
      equipamento:   'Equipamentos de Transmissão / CTRS',
      categoria:     'Transmissão CTRS',
      local:         praca,
      dataCriacao:   nowStr,
      criadoPor:     getUsuarioAtual(),
      descCriacao:   'Relatório enviado para ' + destinatario + '. ' + (falhasEncontradas.length > 0 ? (falhasEncontradas.length + ' falha(s) identificada(s) e convertida(s) em ocorrência(s).') : 'Sem falhas registradas.'),
      status:        'Concluído',
      dataResolucao: nowStr,
      resolvidoPor:  getUsuarioAtual(),
      descResolucao: 'Relatório processado, enviado para ' + destinatario + ' e sincronizado com a base de dados.',
      praca:         praca
    };

    historicoSeedData = [novoHist].concat(historicoSeedData);
    saveHistorico(historicoSeedData, novoHist);

    fecharPopup('popup-enviar-relatorio-ctrs');
    limparFormularioCTRS(false);
    renderAll();

    if (novasOcorrenciasCriadas > 0) {
      if (typeof adicionarNotificacao === 'function') {
        adicionarNotificacao('Relatório Enviado (Ocorrência Criada)', 'Relatório enviado para ' + destinatario + ' e ' + novasOcorrenciasCriadas + ' ocorrência(s) gerada(s) no Dashboard.', 'warning');
      }
    } else {
      if (typeof adicionarNotificacao === 'function') {
        adicionarNotificacao('Relatório TV Enviado', 'Relatório enviado para ' + destinatario + ' e registrado no Histórico.', 'success');
      }
    }
  }
  window.confirmarEnvioRelatorioCTRS = confirmarEnvioRelatorioCTRS;

  if (typeof registrarAutosaveListener === 'function') {
    registrarAutosaveListener('page-ctrs', salvarRascunhoRelatorioTV);
  }
