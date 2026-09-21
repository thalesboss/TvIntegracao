  /* ═══════════════════════════════════════════
     CHECKLIST DIÁRIO & MONITORAMENTO DE ROTINAS OPERACIONAIS — SUPABASE
  ═══════════════════════════════════════════ */

  var checklistFiltroAtual = 'todos';
  var checklistItems = [];
  var checklistUltimaDataVerificada = new Date().toISOString().slice(0, 10);

  /* ── Verificação e Resete Automático da Meia-Noite ── */
  function verificarReseteMeiaNoite() {
    try {
      var hojeStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      if (checklistUltimaDataVerificada !== hojeStr) {
        console.log('[Checklist] 🕛 Meia-noite detectada: Novo dia (' + hojeStr + '). Verificando ciclo de tarefas...');
        checklistUltimaDataVerificada = hojeStr;
        if (Array.isArray(checklistItems) && checklistItems.length > 0) {
          checklistItems.forEach(function(it) {
            // Itens com recorrência ativa são geridos estritamente pelo motor verificarRecorrenciasChecklist
            if (it.recorrencia && it.recorrencia.tipo && it.recorrencia.tipo !== 'nenhuma') {
              return;
            }
            // Apenas tarefas sem recorrência programada resetam na virada comum de dia
            it.concluido = false;
            it.concluidoEm = null;
            if (it.padrao) salvarRotinaPadraoNuvem(it);
            else salvarLembretePessoalNuvem(it);
          });
        }
        verificarRecorrenciasChecklist();
        if (typeof mostrarToast === 'function') {
          mostrarToast('Novo Dia Iniciado', 'As rotinas foram desmarcadas para o plantão de hoje.', 'info');
        }
      }
    } catch(e) {
      console.warn('Erro ao verificar resete da meia-noite:', e);
    }
  }

  var CHECKLIST_STORAGE_KEY = 'tv_checklist_itens_cache_v2';

  function carregarChecklistCacheLocal() {
    try {
      var raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch(e) {}
    return [];
  }

  function carregarChecklistStore() {
    // 1. Carrega imediatamente o cache local para que NADA suma ao atualizar a página (F5)
    var cacheLocal = carregarChecklistCacheLocal();
    if (cacheLocal && cacheLocal.length > 0) {
      checklistItems = cacheLocal;
    }
    verificarReseteMeiaNoite();
    verificarRecorrenciasChecklist();
    atualizarDataChecklistUI();
    renderChecklist();
    sincronizarChecklistNuvem();
    carregarOperadoresSugeridos();
  }
  window.carregarChecklistStore = carregarChecklistStore;

  function salvarChecklistStore() {
    window.checklistItems = checklistItems;
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklistItems));
    } catch(e) {}
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
        var recBadgeHTML = getRecorrenciaBadgeHTML(item);

        html += '<li class="reminder-item' + completedClass + '" id="chk-item-' + item.id + '">' +
          '<button class="reminder-checkbox" onclick="toggleChecklistItem(\'' + item.id + '\')" title="' + (item.concluido ? 'Desmarcar' : 'Concluir') + '">' +
            '<i data-lucide="check" style="width:13px;height:13px;stroke-width:3;"></i>' +
          '</button>' +
          '<div class="reminder-body">' +
            '<div class="reminder-title">' + escapeHTML(item.titulo) + '</div>' +
            '<div class="reminder-meta">' +
              '<span class="reminder-tag ' + tagClass + '">' + tagLabel + '</span>' +
              recBadgeHTML +
              metaHorario +
            '</div>' +
          '</div>' +
          '<div class="reminder-actions">' +
            '<button class="reminder-action-btn edit" onclick="abrirModalRecorrencia(\'' + item.id + '\')" title="Editar e Configurar Repetição" aria-label="Editar Rotina">' +
              '<i data-lucide="pencil" style="width:14px;height:14px;stroke-width:2.2;"></i>' +
            '</button>' +
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

  function getRecorrenciaBadgeHTML(item) {
    if (!item || !item.recorrencia || !item.recorrencia.tipo || item.recorrencia.tipo === 'nenhuma') {
      return '';
    }
    var rec = item.recorrencia;
    var label = '';
    if (rec.tipo === 'horaria') {
      label = '🔁 A cada ' + (rec.intervaloHoras || 1) + 'h';
    } else if (rec.tipo === 'diaria') {
      label = '🔁 Diário às ' + (rec.horario || '08:00');
    } else if (rec.tipo === 'semanal') {
      var dNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      var dList = Array.isArray(rec.diasSemana) ? rec.diasSemana : [1, 3, 5];
      var strDias = dList.map(function(d){ return dNames[d] || ''; }).filter(Boolean).join(', ');
      label = '🔁 ' + (strDias || 'Semanal') + ' às ' + (rec.horario || '09:00');
    }
    if (!label) return '';
    return '<span>·</span><span class="reminder-rec-badge" onclick="event.stopPropagation(); abrirModalRecorrencia(\'' + item.id + '\')" title="Clique para editar agendamento">' + escapeHTML(label) + '</span>';
  }
  window.getRecorrenciaBadgeHTML = getRecorrenciaBadgeHTML;

  function toggleChecklistItem(id) {
    var item = checklistItems.find(function(it) { return it.id === id; });
    if (!item) return;
    item.concluido = !item.concluido;
    item.concluidoEm = item.concluido ? new Date().toISOString() : null;

    // Regra estrita de ciclo:
    // Ao ser concluída, fixa a próxima data/hora em ciclo futuro para NUNCA voltar antes do tempo!
    if (item.concluido && item.recorrencia && item.recorrencia.tipo && item.recorrencia.tipo !== 'nenhuma') {
      item.recorrencia.ultimoCicloConcluido = new Date().toISOString();
      item.recorrencia.proximaExecucao = calcularProximaExecucao(item.recorrencia, new Date(), true);
      salvarRecorrenciaLocal(item.id, item.recorrencia);
    }

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
  window.getDBCredentials = getDBCredentials;

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

        // Define o UUID do operador atual se o nome corresponder
        var usuarioAtual = getUsuarioAtual();
        if (operadoresMap[usuarioAtual]) {
          window.OPERADOR_UUID_ATUAL = operadoresMap[usuarioAtual];
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
    if (window.OPERADOR_UUID_ATUAL) return window.OPERADOR_UUID_ATUAL;
    var usuarioAtual = getUsuarioAtual();
    if (usuarioAtual && operadoresMap && operadoresMap[usuarioAtual]) {
      window.OPERADOR_UUID_ATUAL = operadoresMap[usuarioAtual];
      return window.OPERADOR_UUID_ATUAL;
    }
    return null;
  }
  window.getOperadorUUID = getOperadorUUID;

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

    var endpoint = db.url + '/rest/v1/checklist_itens?select=*&categoria=not.in.(reporter,rc)&' + queryFilter + '&order=criado_em.asc';

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
        cloudItens = cloudItens.filter(function(c) {
          return c && c.categoria !== 'reporter' && c.categoria !== 'rc';
        });
        var recMap = carregarRecorrenciasLocais();
        var itensProcessados = cloudItens.map(function(c) {
          var rec = c.recorrencia || recMap[c.id] || null;
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
            operador_nome: c.operador_nome,
            recorrencia: rec
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
        verificarRecorrenciasChecklist();
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

  /* ═══════════════════════════════════════════
     MOTOR DE RECORRÊNCIA INTELIGENTE
  ═══════════════════════════════════════════ */

  var itemRecorrenciaAtual = null;
  var recorrenciaFrequenciaAtiva = 'nenhuma';

  function carregarRecorrenciasLocais() {
    try {
      var raw = localStorage.getItem('tv_checklist_recorrencias_v1');
      return raw ? JSON.parse(raw) : {};
    } catch(e) {
      return {};
    }
  }
  window.carregarRecorrenciasLocais = carregarRecorrenciasLocais;

  function salvarRecorrenciaLocal(id, rec) {
    try {
      var map = carregarRecorrenciasLocais();
      if (!rec || rec.tipo === 'nenhuma') {
        delete map[id];
      } else {
        map[id] = rec;
      }
      localStorage.setItem('tv_checklist_recorrencias_v1', JSON.stringify(map));
    } catch(e) {}
  }
  window.salvarRecorrenciaLocal = salvarRecorrenciaLocal;

  function abrirModalRecorrencia(id) {
    var item = checklistItems.find(function(it){ return it.id === id; });
    if (!item) return;

    itemRecorrenciaAtual = item;
    var idInput = document.getElementById('rec-item-id');
    if (idInput) idInput.value = item.id;
    var titleDisplay = document.getElementById('rec-item-title-display');
    if (titleDisplay) titleDisplay.textContent = item.titulo;
    var titleInput = document.getElementById('rec-item-title-input');
    if (titleInput) titleInput.value = item.titulo || '';

    var rec = item.recorrencia || { tipo: 'nenhuma', intervaloHoras: 1, horario: '08:00', diasSemana: [1, 3, 5] };
    selecionarFrequenciaRecorrencia(rec.tipo || 'nenhuma');

    var intEl = document.getElementById('rec-intervalo-horas');
    if (intEl) intEl.value = rec.intervaloHoras || 1;

    var hDiaria = document.getElementById('rec-hora-diaria');
    if (hDiaria) hDiaria.value = rec.horario || '08:00';

    var hSemanal = document.getElementById('rec-hora-semanal');
    if (hSemanal) hSemanal.value = rec.horario || '09:00';

    // Configurar pills de dias da semana (D S T Q Q S S)
    var diasAtivos = Array.isArray(rec.diasSemana) && rec.diasSemana.length > 0 ? rec.diasSemana : [1, 3, 5];
    var pills = document.querySelectorAll('#rec-dias-semana-wrap .rec-day-pill');
    pills.forEach(function(btn) {
      var diaNum = parseInt(btn.getAttribute('data-day'), 10);
      if (diasAtivos.indexOf(diaNum) !== -1) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    atualizarPreviaProximaExecucao();
    if (typeof abrirPopup === 'function') {
      abrirPopup('popup-recorrencia-checklist');
    }
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
  window.abrirModalRecorrencia = abrirModalRecorrencia;

  function selecionarFrequenciaRecorrencia(freq) {
    recorrenciaFrequenciaAtiva = freq;
    var botoes = ['nenhuma', 'horaria', 'diaria', 'semanal'];
    botoes.forEach(function(b) {
      var el = document.getElementById('rec-btn-' + b);
      if (el) {
        if (b === freq) el.classList.add('active');
        else el.classList.remove('active');
      }
      var sec = document.getElementById('rec-sec-' + b);
      if (sec) {
        sec.style.display = (b === freq) ? 'block' : 'none';
      }
    });
    atualizarPreviaProximaExecucao();
  }
  window.selecionarFrequenciaRecorrencia = selecionarFrequenciaRecorrencia;

  function toggleDiaSemanaRecorrencia(btn) {
    btn.classList.toggle('active');
    var ativos = document.querySelectorAll('#rec-dias-semana-wrap .rec-day-pill.active');
    if (ativos.length === 0) {
      btn.classList.add('active'); // pelo menos 1 dia ativo
    }
    atualizarPreviaProximaExecucao();
  }
  window.toggleDiaSemanaRecorrencia = toggleDiaSemanaRecorrencia;

  function calcularProximaExecucao(rec, baseDate, jaConcluidoNesteCiclo) {
    if (!rec || !rec.tipo || rec.tipo === 'nenhuma') return null;

    var base = baseDate ? new Date(baseDate) : new Date();
    if (isNaN(base.getTime())) base = new Date();

    if (rec.tipo === 'horaria') {
      var intervalo = parseInt(rec.intervaloHoras, 10) || 1;
      var next = new Date(base.getTime());
      next.setHours(next.getHours() + intervalo);
      next.setMinutes(0, 0, 0);
      while (next.getTime() <= base.getTime()) {
        next.setHours(next.getHours() + 1);
      }
      return next.toISOString();
    }

    if (rec.tipo === 'diaria') {
      var parts = (rec.horario || '08:00').split(':');
      var targetH = parseInt(parts[0], 10) || 0;
      var targetM = parseInt(parts[1], 10) || 0;

      var candidate = new Date(base.getFullYear(), base.getMonth(), base.getDate(), targetH, targetM, 0, 0);

      // Se já foi concluída neste ciclo diário (mesmo adiantada ou pontual),
      // ela NUNCA volta hoje: só volta amanhã no horário programado!
      if (jaConcluidoNesteCiclo || candidate.getTime() <= base.getTime()) {
        candidate.setDate(candidate.getDate() + 1);
      }
      return candidate.toISOString();
    }

    if (rec.tipo === 'semanal') {
      var partsSem = (rec.horario || '09:00').split(':');
      var sH = parseInt(partsSem[0], 10) || 0;
      var sM = parseInt(partsSem[1], 10) || 0;
      var dias = Array.isArray(rec.diasSemana) && rec.diasSemana.length > 0 ? rec.diasSemana : [1, 3, 5];

      var cDate = new Date(base.getFullYear(), base.getMonth(), base.getDate(), sH, sM, 0, 0);

      // Se concluída hoje, pula o dia de hoje imediatamente
      if (jaConcluidoNesteCiclo || cDate.getTime() <= base.getTime()) {
        cDate.setDate(cDate.getDate() + 1);
      }

      // Procura o próximo dia da semana programado (até 7 dias)
      for (var i = 0; i < 7; i++) {
        var dayOfWeek = cDate.getDay();
        if (dias.indexOf(dayOfWeek) !== -1) {
          return cDate.toISOString();
        }
        cDate.setDate(cDate.getDate() + 1);
      }
      return cDate.toISOString();
    }

    return null;
  }
  window.calcularProximaExecucao = calcularProximaExecucao;

  function obterConfigRecorrenciaDoModal() {
    var freq = recorrenciaFrequenciaAtiva;
    var rec = {
      tipo: freq,
      intervaloHoras: 1,
      horario: '08:00',
      diasSemana: [1, 3, 5],
      proximaExecucao: null,
      ultimoCicloConcluido: null
    };

    if (freq === 'horaria') {
      var intEl = document.getElementById('rec-intervalo-horas');
      rec.intervaloHoras = intEl ? parseInt(intEl.value, 10) : 1;
    } else if (freq === 'diaria') {
      var hEl = document.getElementById('rec-hora-diaria');
      rec.horario = hEl ? hEl.value : '08:00';
    } else if (freq === 'semanal') {
      var hsEl = document.getElementById('rec-hora-semanal');
      rec.horario = hsEl ? hsEl.value : '09:00';
      var dias = [];
      document.querySelectorAll('#rec-dias-semana-wrap .rec-day-pill.active').forEach(function(p){
        dias.push(parseInt(p.getAttribute('data-day'), 10));
      });
      rec.diasSemana = dias.length > 0 ? dias : [1, 3, 5];
    }
    return rec;
  }

  function atualizarPreviaProximaExecucao() {
    var textoEl = document.getElementById('rec-previa-texto');
    var subEl = document.getElementById('rec-previa-sub');
    if (!textoEl || !subEl) return;

    var freq = recorrenciaFrequenciaAtiva;
    if (freq === 'nenhuma') {
      textoEl.textContent = 'Sem repetição programada.';
      subEl.textContent = 'Esta rotina só será concluída uma única vez.';
      return;
    }

    var tempRec = obterConfigRecorrenciaDoModal();
    var proxISO = calcularProximaExecucao(tempRec, new Date(), true);
    if (!proxISO) {
      textoEl.textContent = 'Programação configurada.';
      subEl.textContent = '';
      return;
    }

    var d = new Date(proxISO);
    var diasNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    var diaSemana = diasNomes[d.getDay()];
    var horaFmt = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    var dataFmt = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2);

    textoEl.textContent = 'Próxima execução: ' + diaSemana + ' (' + dataFmt + ') às ' + horaFmt;
    subEl.textContent = 'Ao ser marcada como concluída, permanecerá concluída até esta data/hora, quando voltará automaticamente para a lista alertando o plantão.';
  }
  window.atualizarPreviaProximaExecucao = atualizarPreviaProximaExecucao;

  function salvarRecorrenciaItem() {
    var itemId = document.getElementById('rec-item-id').value;
    var item = checklistItems.find(function(it){ return it.id === itemId; });
    if (!item) return;

    var novaRec = obterConfigRecorrenciaDoModal();
    if (novaRec.tipo !== 'nenhuma') {
      novaRec.proximaExecucao = calcularProximaExecucao(novaRec, new Date(), !!item.concluido);
    } else {
      novaRec.proximaExecucao = null;
    }

    var titleInput = document.getElementById('rec-item-title-input');
    if (titleInput && titleInput.value.trim()) {
      item.titulo = titleInput.value.trim();
    }

    item.recorrencia = novaRec;
    salvarRecorrenciaLocal(item.id, novaRec);
    salvarChecklistStore();
    renderChecklist();

    if (item.padrao) salvarRotinaPadraoNuvem(item);
    else salvarLembretePessoalNuvem(item);

    if (typeof fecharPopup === 'function') {
      fecharPopup('popup-recorrencia-checklist');
    }
    if (typeof mostrarToast === 'function') {
      var msg = novaRec.tipo === 'nenhuma' ? 'Repetição desativada.' : 'Repetição agendada com sucesso!';
      mostrarToast('Agendamento', msg, 'success');
    }
  }
  window.salvarRecorrenciaItem = salvarRecorrenciaItem;

  function removerRecorrenciaItem() {
    selecionarFrequenciaRecorrencia('nenhuma');
    salvarRecorrenciaItem();
  }
  window.removerRecorrenciaItem = removerRecorrenciaItem;

  function verificarRecorrenciasChecklist() {
    if (!Array.isArray(checklistItems) || checklistItems.length === 0) return;

    var agora = Date.now();
    var houveMudanca = false;

    checklistItems.forEach(function(it) {
      if (!it || !it.concluido) return;
      if (!it.recorrencia || !it.recorrencia.tipo || it.recorrencia.tipo === 'nenhuma') return;

      var proxISO = it.recorrencia.proximaExecucao;
      if (!proxISO) return;

      var proxTime = new Date(proxISO).getTime();
      if (!isNaN(proxTime) && agora >= proxTime) {
        console.log('[Checklist] ⏰ Ciclo expirado para: "' + it.titulo + '". Desmarcando dos concluídos e alertando...');
        
        // Período expirado: rotina sai dos concluídos e volta para os pendentes!
        it.concluido = false;
        it.concluidoEm = null;
        it.recorrencia.proximaExecucao = calcularProximaExecucao(it.recorrencia, new Date(), false);
        houveMudanca = true;

        // Dispara Notificação Sonora e Toast
        if (typeof mostrarToast === 'function') {
          mostrarToast('⏰ Hora da Rotina!', 'Procedimento pendente de checagem: ' + it.titulo, 'warning');
        }
        if (typeof tocarSomNotificacao === 'function') {
          try { tocarSomNotificacao(); } catch(e){}
        }
        if (typeof window.adicionarNotificacao === 'function') {
          window.adicionarNotificacao('Rotina Agendada', 'Procedimento pendente de checagem: ' + it.titulo, 'alerta');
        }

        // Persiste o novo ciclo
        if (it.padrao) salvarRotinaPadraoNuvem(it);
        else salvarLembretePessoalNuvem(it);
        salvarRecorrenciaLocal(it.id, it.recorrencia);
      }
    });

    if (houveMudanca) {
      salvarChecklistStore();
      renderChecklist();
    }
  }
  window.verificarRecorrenciasChecklist = verificarRecorrenciasChecklist;

  // Intervalo periódico a cada 30 segundos para checagem ativa de ciclos
  setInterval(function() {
    verificarReseteMeiaNoite();
    verificarRecorrenciasChecklist();
  }, 30000);

  // Verificação ao retornar foco à página
  window.addEventListener('focus', function() {
    verificarReseteMeiaNoite();
    verificarRecorrenciasChecklist();
  });

