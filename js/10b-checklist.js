  /* ═══════════════════════════════════════════
     CHECKLIST DIÁRIO & MONITORAMENTO DE ROTINA (APPLE REMINDERS STYLE)
  ═══════════════════════════════════════════ */

  var CHECKLIST_STORAGE_KEY = 'tv_checklist_items_v1';
  var CHECKLIST_LAST_DATE_KEY = 'tv_checklist_last_date_v1';
  var checklistFiltroAtual = 'todos';
  var checklistItems = [];

  /* ── Verificação e Resete Automático da Meia-Noite ── */
  function verificarReseteMeiaNoite() {
    try {
      var hojeStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      var ultimaData = localStorage.getItem(CHECKLIST_LAST_DATE_KEY);

      if (!ultimaData) {
        localStorage.setItem(CHECKLIST_LAST_DATE_KEY, hojeStr);
      } else if (ultimaData !== hojeStr) {
        console.log('[Checklist] 🕛 Meia-noite detectada: Novo dia (' + hojeStr + '). Desmarcando tarefas de rotina...');
        // Desmarcar todas as rotinas para o novo dia
        if (Array.isArray(checklistItems) && checklistItems.length > 0) {
          checklistItems.forEach(function(it) {
            it.concluido = false;
            it.concluidoEm = null;
          });
          salvarChecklistStore();
        }
        localStorage.setItem(CHECKLIST_LAST_DATE_KEY, hojeStr);
        if (typeof mostrarToast === 'function') {
          mostrarToast('Novo Dia Iniciado', 'As rotinas foram desmarcadas automaticamente para o plantão de hoje.', 'info');
        }
      }
    } catch(e) {
      console.warn('Erro ao verificar resete da meia-noite:', e);
    }
  }

  function carregarChecklistStore() {
    try {
      var raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (raw) {
        checklistItems = JSON.parse(raw);
        // Purgar rotinas mockadas legadas antigas (prefixo 'rot-')
        checklistItems = checklistItems.filter(function(it) {
          return it && (!it.id || !it.id.toString().startsWith('rot-'));
        });
      } else {
        checklistItems = [];
        salvarChecklistStore();
      }
    } catch(e) {
      console.warn('Erro ao carregar checklist:', e);
      checklistItems = [];
    }

    verificarReseteMeiaNoite();
    atualizarDataChecklistUI();
    renderChecklist();
    sincronizarChecklistNuvem();
    carregarOperadoresSugeridos();
  }
  window.carregarChecklistStore = carregarChecklistStore;

  function salvarChecklistStore() {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklistItems));
    } catch(e) {
      console.warn('Erro ao salvar checklist:', e);
    }
  }

  function atualizarDataChecklistUI() {
    var elDate = document.getElementById('reminders-current-date');
    if (!elDate) return;
    try {
      var hoje = new Date();
      var opcoes = { weekday: 'long', day: 'numeric', month: 'long' };
      var dataFmt = hoje.toLocaleDateString('pt-BR', opcoes);
      // Capitalizar primeira letra
      dataFmt = dataFmt.charAt(0).toUpperCase() + dataFmt.slice(1);
      elDate.textContent = dataFmt;
    } catch(e) {
      elDate.textContent = 'Hoje';
    }
  }

  function renderChecklist() {
    var listPadraoEl = document.getElementById('reminders-list-padrao');
    var listPessoalEl = document.getElementById('reminders-list-pessoal');
    if (!listPadraoEl && !listPessoalEl) return;

    // Calcular estatísticas
    var total = checklistItems.length;
    var concluidos = checklistItems.filter(function(it) { return it.concluido; }).length;
    var pendentes = total - concluidos;
    var rotinas = checklistItems.filter(function(it) { return it.categoria === 'rotina' || it.padrao; }).length;
    var pct = total > 0 ? Math.round((concluidos / total) * 100) : 0;

    // Atualizar UI de resumo (Hero)
    var fill = document.getElementById('reminders-progress-fill');
    if (fill) fill.style.width = pct + '%';

    var pctEl = document.getElementById('reminders-pct');
    if (pctEl) pctEl.textContent = pct + '%';

    var lblEl = document.getElementById('reminders-count-lbl');
    if (lblEl) lblEl.textContent = concluidos + ' de ' + total + ' checados';

    // Atualizar Contadores dos Cards
    var cTodos = document.getElementById('fc-count-todos');
    if (cTodos) cTodos.textContent = total;

    var cPend = document.getElementById('fc-count-pendentes');
    if (cPend) cPend.textContent = pendentes;

    var cRot = document.getElementById('fc-count-rotina');
    if (cRot) cRot.textContent = rotinas;

    var cConc = document.getElementById('fc-count-concluidos');
    if (cConc) cConc.textContent = concluidos;

    // Separar itens entre Padrão TV (oficiais/recorrentes para toda a equipe) e Pessoais (privados do operador)
    var padraoItems = checklistItems.filter(function(it) {
      return !!it.padrao;
    });
    var pessoalItems = checklistItems.filter(function(it) {
      return !it.padrao;
    });

    // Atualizar badges das colunas
    var bPadrao = document.getElementById('badge-rotinas-padrao');
    if (bPadrao) {
      var concP = padraoItems.filter(function(i){ return i.concluido; }).length;
      bPadrao.textContent = concP + '/' + padraoItems.length;
    }
    var bPessoal = document.getElementById('badge-rotinas-pessoais');
    if (bPessoal) {
      var concU = pessoalItems.filter(function(i){ return i.concluido; }).length;
      bPessoal.textContent = concU + '/' + pessoalItems.length;
    }

    var listPadraoEl = document.getElementById('reminders-list-padrao');
    var listPessoalEl = document.getElementById('reminders-list-pessoal');

    function renderizarLista(itens, targetEl, emptyMsg) {
      if (!targetEl) return;
      var filtrados = itens.filter(function(it) {
        if (checklistFiltroAtual === 'pendentes') return !it.concluido;
        if (checklistFiltroAtual === 'concluidos') return it.concluido;
        if (checklistFiltroAtual === 'rotina') return it.categoria === 'rotina' || it.padrao;
        return true; // 'todos'
      });

      if (filtrados.length === 0) {
        var textoVazio = emptyMsg;
        if (itens.length > 0) {
          textoVazio = checklistFiltroAtual === 'pendentes'
            ? 'Todos os itens desta coluna foram concluídos!'
            : 'Nenhum item encontrado para o filtro ativo.';
        }
        targetEl.innerHTML = '<li class="reminders-empty" style="padding:28px 16px;">' +
          '<i data-lucide="check-circle" style="width:30px;height:30px;opacity:0.4;"></i>' +
          '<div style="font-size:13px;font-weight:600;margin-top:4px;">Nenhum item</div>' +
          '<div style="font-size:11.5px;color:var(--muted);">' + textoVazio + '</div>' +
          '</li>';
        return;
      }

      var html = '';
      filtrados.forEach(function(item) {
        var completedClass = item.concluido ? ' completed' : '';
        var tagLabel = getCategoriaLabel(item.categoria);
        var tagClass = 'tag-' + (item.categoria || 'avulso');
        var metaHorario = item.horario ? '<span>·</span><span>' + escapeHTML(item.horario) + '</span>' : '';

        html += '<li class="reminder-item' + completedClass + '" id="chk-item-' + item.id + '">' +
          '<button class="reminder-checkbox" onclick="toggleChecklistItem(\'' + item.id + '\')" title="' + (item.concluido ? 'Desmarcar' : 'Concluir') + '">' +
            '<i data-lucide="check" style="width:13px;height:13px;stroke-width:3;"></i>' +
          '</button>' +
          '<div class="reminder-body">' +
            '<div class="reminder-title">' + escapeHTML(item.titulo) + '</div>' +
            '<div class="reminder-meta">' +
              '<span class="reminder-tag ' + tagClass + '">' + tagLabel + '</span>' +
              metaHorario +
            '</div>' +
          '</div>' +
          '<div class="reminder-actions">' +
            '<button class="reminder-action-btn alert" onclick="criarOcorrenciaDoChecklist(\'' + item.id + '\')" data-tooltip="Falha detectada? Criar ocorrência desta rotina" aria-label="Criar ocorrência desta rotina">' +
              '<i data-lucide="alert-triangle" style="width:14px;height:14px;stroke-width:2.2;"></i>' +
            '</button>' +
            '<button class="reminder-action-btn del" onclick="removerItemChecklist(\'' + item.id + '\')" title="Excluir rotina/lembrete" aria-label="Excluir rotina">' +
              '<i data-lucide="trash-2" style="width:14px;height:14px;stroke-width:2;"></i>' +
            '</button>' +
          '</div>' +
        '</li>';
      });

      targetEl.innerHTML = html;
    }

    renderizarLista(padraoItems, listPadraoEl, 'Nenhuma rotina padrão cadastrada. Adicione acima para toda a equipe.');
    renderizarLista(pessoalItems, listPessoalEl, 'Nenhum lembrete pessoal cadastrado.');

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
  window.renderChecklist = renderChecklist;

  function getCategoriaLabel(cat) {
    switch(cat) {
      case 'rotina': return 'Rotina TV';
      case 'estudio': return 'Estúdio';
      case 'ctrs': return 'Transmissão CTRS';
      case 'infra': return 'Infraestrutura';
      default: return 'Lembrete';
    }
  }

  function toggleChecklistItem(id) {
    var item = checklistItems.find(function(it) { return it.id === id; });
    if (!item) return;
    item.concluido = !item.concluido;
    item.concluidoEm = item.concluido ? new Date().toISOString() : null;
    salvarChecklistStore();
    renderChecklist();

    // Sincroniza estado de conclusão com a nuvem
    if (item.padrao) {
      salvarRotinaPadraoNuvem(item);
    } else {
      salvarLembretePessoalNuvem(item);
    }

    if (item.concluido && typeof tocarSomNotificacao === 'function') {
      try { tocarSomNotificacao(); } catch(e) {}
    }
  }
  window.toggleChecklistItem = toggleChecklistItem;

  function filtrarChecklist(tipo, el) {
    checklistFiltroAtual = tipo;
    document.querySelectorAll('.reminders-filter-card').forEach(function(c) {
      c.classList.remove('active');
    });
    if (el) el.classList.add('active');

    var titleEl = document.getElementById('reminders-current-view-title');
    if (titleEl) {
      var mapTitles = {
        todos: 'Todas as Rotinas & Lembretes',
        pendentes: 'Itens Pendentes de Checagem',
        rotina: 'Procedimentos Preventivos da TV',
        concluidos: 'Itens Verificados & Concluídos'
      };
      titleEl.innerHTML = '<i data-lucide="list-checks" style="width:15px;height:15px;stroke-width:2;"></i> ' + (mapTitles[tipo] || 'Itens');
    }

    renderChecklist();
  }
  window.filtrarChecklist = filtrarChecklist;

  function adicionarRotinaPadrao() {
    var input = document.getElementById('reminders-new-padrao-input');
    var catSelect = document.getElementById('reminders-new-padrao-cat');
    if (!input || !input.value.trim()) return;

    var titulo = input.value.trim();
    var categoria = catSelect ? catSelect.value : 'rotina';
    var novoItem = {
      id: 'padrao-' + Date.now(),
      titulo: titulo,
      categoria: categoria,
      padrao: true,
      concluido: false,
      horario: 'Criado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    checklistItems.unshift(novoItem);
    salvarChecklistStore();
    input.value = '';
    renderChecklist();

    // Envia para o Supabase com padrao: true para toda a equipe
    salvarRotinaPadraoNuvem(novoItem);

    if (typeof mostrarToast === 'function') {
      mostrarToast('Rotina Padrão TV Adicionada', 'Procedimento oficial adicionado e compartilhado para toda a equipe.', 'success');
    }
  }
  window.adicionarRotinaPadrao = adicionarRotinaPadrao;

  function adicionarLembreteRapido() {
    var input = document.getElementById('reminders-new-input');
    var catSelect = document.getElementById('reminders-new-cat');
    if (!input || !input.value.trim()) return;

    var titulo = input.value.trim();
    var categoria = catSelect ? catSelect.value : 'avulso';
    var novoItem = {
      id: 'lembrete-' + Date.now(),
      titulo: titulo,
      categoria: categoria,
      padrao: false,
      concluido: false,
      horario: 'Criado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    checklistItems.unshift(novoItem);
    salvarChecklistStore();
    input.value = '';
    renderChecklist();

    // Envia direto para o Supabase atrelado ao UUID do operador
    salvarLembretePessoalNuvem(novoItem);

    if (typeof mostrarToast === 'function') {
      mostrarToast('Lembrete Adicionado', 'Item incluído na rotina de hoje e sincronizado na nuvem.', 'success');
    }
  }
  window.adicionarLembreteRapido = adicionarLembreteRapido;

  function removerItemChecklist(id) {
    var item = checklistItems.find(function(it) { return it.id === id; });
    if (!item) return;

    if (item.padrao) {
      if (!confirm('Esta é uma Rotina Padrão da emissora. Deseja realmente excluí-la para toda a equipe?')) {
        return;
      }
    }

    checklistItems = checklistItems.filter(function(it) { return it.id !== id; });
    salvarChecklistStore();
    renderChecklist();

    if (item.padrao) {
      excluirRotinaPadraoNuvem(id);
      if (typeof mostrarToast === 'function') {
        mostrarToast('Rotina Removida', 'A rotina padrão foi removida para todos os operadores.', 'info');
      }
    } else {
      excluirLembretePessoalNuvem(id);
      if (typeof mostrarToast === 'function') {
        mostrarToast('Lembrete Removido', 'Lembrete pessoal excluído.', 'info');
      }
    }
  }
  window.removerItemChecklist = removerItemChecklist;

  function reiniciarRotinaDiaria() {
    if (!confirm('Deseja reiniciar a rotina diária para o início de um novo turno? Os itens padrão serão desmarcados.')) {
      return;
    }
    // Desmarcar todos os itens e reter tarefas
    checklistItems.forEach(function(it) {
      it.concluido = false;
      it.concluidoEm = null;
    });
    salvarChecklistStore();
    renderChecklist();
    if (typeof mostrarToast === 'function') {
      mostrarToast('Rotina Reiniciada', 'O checklist está pronto para o novo turno.', 'info');
    }
  }
  window.reiniciarRotinaDiaria = reiniciarRotinaDiaria;

  function criarOcorrenciaDoChecklist(id) {
    var item = checklistItems.find(function(it) { return it.id === id; });
    if (!item) return;

    if (typeof abrirPopup === 'function') {
      abrirPopup('popup-nova-oc');

      // 1. Preenche o Título diretamente com o nome da rotina
      var tituloEl = document.getElementById('nova-titulo');
      if (tituloEl) {
        tituloEl.value = 'Falha na Rotina: ' + item.titulo;
      }

      // 2. Preenche a Categoria correta de acordo com a rotina
      var catEl = document.getElementById('nova-cat');
      if (catEl) {
        if (item.categoria === 'ctrs') {
          catEl.value = 'Telejornal / Transmissão ao Vivo';
        } else if (item.categoria === 'estudio') {
          catEl.value = 'Equipamento';
        } else if (item.categoria === 'infra') {
          catEl.value = 'Infraestrutura';
        } else if (item.categoria === 'rotina') {
          catEl.value = 'Programação';
        } else {
          catEl.value = 'Outro';
        }
      }

      // 3. Preenche a Descrição Detalhada com formato completo (atinge os 50 caracteres mínimos)
      var descEl = document.getElementById('nova-desc');
      if (descEl) {
        var agoraStr = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        descEl.value = 'Inconformidade detectada durante a verificação de rotina em ' + agoraStr + '.\nProcedimento checado: ' + item.titulo + '.\nDetalhes da falha observada: ';
        
        // Atualiza o contador de caracteres e botão de criar
        var counter = document.getElementById('nova-counter');
        if (counter) {
          var len = descEl.value.length;
          if (len >= 50) {
            counter.textContent = '✓ ' + len + ' caracteres — mínimo atingido';
            counter.className = 'char-count ok';
          }
        }
        var btnCriar = document.getElementById('btn-criar');
        if (btnCriar) {
          btnCriar.style.opacity = '1';
          btnCriar.style.cursor = 'pointer';
          btnCriar._valido = true;
        }

        setTimeout(function() {
          descEl.focus();
          descEl.setSelectionRange(descEl.value.length, descEl.value.length);
        }, 180);
      }
    }
  }
  window.criarOcorrenciaDoChecklist = criarOcorrenciaDoChecklist;



  /* ═══════════════════════════════════════════
     INTEGRAÇÃO SUPABASE: LISTA DE OPERADORES & RESOLUÇÃO DE UUID
  ═══════════════════════════════════════════ */

  var operadoresMap = {}; // nome -> id (UUID)

  function getDBCredentials() {
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

  function carregarOperadoresSugeridos() {
    var datalist = document.getElementById('lista-operadores-sugeridos');
    var db = getDBCredentials();
    if (!db.url || !db.key) return;

    var endpoint = db.url + '/rest/v1/operadores?select=id,nome&ativo=eq.true&order=nome.asc';
    fetch(endpoint, {
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key
      }
    })
    .then(function(res) { return res.ok ? res.json() : null; })
    .then(function(operadores) {
      if (Array.isArray(operadores) && operadores.length > 0) {
        operadoresMap = {};
        operadores.forEach(function(op) {
          operadoresMap[op.nome.trim()] = op.id;
        });

        // Salva o UUID do operador atual se o nome corresponder
        var usuarioAtual = getUsuarioAtual();
        if (operadoresMap[usuarioAtual]) {
          localStorage.setItem('tv_operador_uuid_v1', operadoresMap[usuarioAtual]);
        }

        if (datalist) {
          datalist.innerHTML = operadores.map(function(op) {
            return '<option value="' + escapeHTML(op.nome) + '">';
          }).join('');
        }
        console.log('[Operadores] ' + operadores.length + ' operadores carregados do banco de dados (Supabase).');

        // Sincroniza as rotinas com o banco agora que temos o UUID
        sincronizarChecklistNuvem();
      }
    })
    .catch(function(err) {
      console.warn('[Operadores] Não foi possível carregar operadores do Supabase:', err);
    });
  }
  window.carregarOperadoresSugeridos = carregarOperadoresSugeridos;

  /* ═══════════════════════════════════════════
     SINCRONIZAÇÃO EM NUVEM: ROTINAS DIRETAMENTE NO BANCO DE DADOS
  ═══════════════════════════════════════════ */

  function getOperadorUUID() {
    var uuid = localStorage.getItem('tv_operador_uuid_v1');
    if (uuid) return uuid;
    var usuarioAtual = getUsuarioAtual();
    if (operadoresMap[usuarioAtual]) {
      uuid = operadoresMap[usuarioAtual];
      localStorage.setItem('tv_operador_uuid_v1', uuid);
      return uuid;
    }
    return null;
  }

  function sincronizarChecklistNuvem() {
    var db = getDBCredentials();
    if (!db.url || !db.key) return;
    var opUUID = getOperadorUUID();
    var usuarioAtual = getUsuarioAtual();

    // Sempre busca todas as rotinas padrão (padrao=true) + as rotinas pessoais do operador atual
    var queryFilter = '';
    if (opUUID) {
      queryFilter = 'or=(padrao.eq.true,operador_id.eq.' + encodeURIComponent(opUUID) + ')';
    } else if (usuarioAtual && usuarioAtual !== 'Plantão Técnico' && usuarioAtual !== 'Operador') {
      queryFilter = 'or=(padrao.eq.true,operador_nome.eq.' + encodeURIComponent(usuarioAtual) + ')';
    } else {
      queryFilter = 'padrao=eq.true';
    }

    var endpoint = db.url + '/rest/v1/checklist_itens?select=*&' + queryFilter + '&order=criado_em.asc';

    fetch(endpoint, {
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Cache-Control': 'no-cache'
      }
    })
    .then(function(res) { return res.ok ? res.json() : null; })
    .then(function(cloudItens) {
      if (Array.isArray(cloudItens)) {
        var itensProcessados = cloudItens.map(function(c) {
          return {
            id: c.id,
            titulo: c.titulo,
            categoria: c.categoria || (c.padrao ? 'rotina' : 'avulso'),
            padrao: !!c.padrao,
            concluido: !!c.concluido,
            concluidoEm: c.concluido_em || null,
            horario: c.padrao
              ? 'Rotina TV'
              : (c.criado_em ? 'Criado em ' + new Date(c.criado_em).toLocaleDateString('pt-BR') : 'Pessoal'),
            operador_id: c.operador_id,
            operador_nome: c.operador_nome
          };
        });

        // Preservar itens locais recém-criados que ainda não estejam na nuvem
        var idNuvemMap = {};
        itensProcessados.forEach(function(item) { idNuvemMap[item.id] = true; });

        var pendentesLocais = checklistItems.filter(function(it) {
          return it && !idNuvemMap[it.id] && (!it.id || !it.id.toString().startsWith('rot-'));
        });

        checklistItems = itensProcessados.concat(pendentesLocais);
        salvarChecklistStore();
        renderChecklist();
        console.log('[Checklist DB] ✅ ' + itensProcessados.length + ' rotinas carregadas diretamente do banco de dados (Supabase checklist_itens).');
      }
    })
    .catch(function(err) {
      console.warn('[Checklist DB] Erro ao sincronizar com banco de dados:', err);
    });
  }
  window.sincronizarChecklistNuvem = sincronizarChecklistNuvem;
  window.sincronizarLembretesPessoaisNuvem = sincronizarChecklistNuvem;

  function salvarRotinaPadraoNuvem(item) {
    var db = getDBCredentials();
    if (!db.url || !db.key) {
      console.warn('[Checklist DB] Supabase não configurado. Salvo apenas localmente.');
      return;
    }

    var payload = {
      id: item.id,
      operador_id: null,
      operador_nome: 'Padrão TV',
      titulo: item.titulo,
      categoria: item.categoria || 'rotina',
      padrao: true,
      concluido: !!item.concluido,
      concluido_em: item.concluidoEm || null
    };

    var endpoint = db.url + '/rest/v1/checklist_itens';
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    })
    .then(function(res) {
      if (!res.ok) {
        return res.text().then(function(errText) {
          console.error('[Checklist DB] Erro ao salvar rotina padrão no banco:', res.status, errText);
        });
      }
      console.log('[Checklist DB] ✅ Rotina padrão salva com sucesso no banco de dados (checklist_itens):', item.titulo);
    })
    .catch(function(err) {
      console.error('[Checklist DB] Falha ao enviar rotina padrão para o banco:', err);
    });
  }
  window.salvarRotinaPadraoNuvem = salvarRotinaPadraoNuvem;

  function excluirRotinaPadraoNuvem(id) {
    var db = getDBCredentials();
    if (!db.url || !db.key || !id) return;
    var endpoint = db.url + '/rest/v1/checklist_itens?id=eq.' + encodeURIComponent(id);
    fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key
      }
    })
    .then(function(res) {
      if (res.ok) {
        console.log('[Checklist DB] ✅ Rotina padrão excluída do banco de dados:', id);
      }
    })
    .catch(function(err) {
      console.error('[Checklist DB] Falha ao excluir rotina padrão do banco:', err);
    });
  }
  window.excluirRotinaPadraoNuvem = excluirRotinaPadraoNuvem;

  function salvarLembretePessoalNuvem(item) {
    var db = getDBCredentials();
    if (!db.url || !db.key) return;
    var opUUID = getOperadorUUID();
    var usuarioAtual = getUsuarioAtual();

    var payload = {
      id: item.id,
      operador_id: opUUID || null,
      operador_nome: usuarioAtual,
      titulo: item.titulo,
      categoria: item.categoria || 'avulso',
      padrao: false,
      concluido: !!item.concluido,
      concluido_em: item.concluidoEm || null
    };

    var endpoint = db.url + '/rest/v1/checklist_itens';
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    })
    .then(function(res) {
      if (!res.ok) {
        return res.text().then(function(errText) {
          console.error('[Checklist DB] Erro ao salvar lembrete pessoal no banco:', res.status, errText);
        });
      }
      console.log('[Checklist DB] ✅ Lembrete pessoal salvo diretamente no banco de dados:', item.titulo);
    })
    .catch(function(err) {
      console.error('[Checklist DB] Falha ao enviar lembrete pessoal para o banco:', err);
    });
  }
  window.salvarLembretePessoalNuvem = salvarLembretePessoalNuvem;

  function excluirLembretePessoalNuvem(id) {
    var db = getDBCredentials();
    if (!db.url || !db.key || !id) return;
    var endpoint = db.url + '/rest/v1/checklist_itens?id=eq.' + encodeURIComponent(id);
    fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key
      }
    })
    .then(function(res) {
      if (res.ok) {
        console.log('[Checklist DB] ✅ Lembrete pessoal excluído do banco de dados:', id);
      }
    })
    .catch(function(err) {
      console.error('[Checklist DB] Falha ao excluir lembrete do banco:', err);
    });
  }
  window.excluirLembretePessoalNuvem = excluirLembretePessoalNuvem;

