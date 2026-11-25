(function (window, document, TVApp) {
  'use strict';

  TVApp.registerModule('checklist', function (app) {
    var KEYS     = app.KEYS;
    var Security = app.Security;
    var Storage  = app.Storage;
    var EventBus = app.EventBus;
    var Session  = app.Session;
    var Store    = app.Store;
    var escapeHTML     = Security.escapeHTML;
    var escapeJSString = Security.escapeJSString;
    var sanitizeIdAttr = Security.sanitizeIdAttr;

    var checklistFiltroAtual = 'todos';
    var checklistUltimaDataVerificada = new Date().toISOString().slice(0, 10);
    var CHECKLIST_STORAGE_KEY = KEYS.CHECKLIST_CACHE;
    var operadoresMap = {};
    var itemRecorrenciaAtual = null;
    var recorrenciaFrequenciaAtiva = 'nenhuma';

    function verificarReseteMeiaNoite() {
      try {
        var hojeStr = new Date().toISOString().slice(0, 10);
        if (checklistUltimaDataVerificada !== hojeStr) {
          checklistUltimaDataVerificada = hojeStr;
          var items = Store.checklistItems || [];
          if (items.length > 0) {
            items.forEach(function (it) {
              if (it.recorrencia && it.recorrencia.tipo && it.recorrencia.tipo !== 'nenhuma') {
                return;
              }
              it.concluido = false;
              it.concluidoEm = null;
              if (it.padrao) salvarRotinaPadraoNuvem(it);
              else salvarLembretePessoalNuvem(it);
            });
          }
          verificarRecorrenciasChecklist();
          if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('Novo Dia Iniciado', 'As rotinas foram desmarcadas para o plantão de hoje.', 'info');
          }
        }
      } catch (e) {
        console.warn('Erro ao verificar resete da meia-noite:', e);
      }
    }

    function carregarChecklistCacheLocal() {
      var parsed = Storage.getJSON(CHECKLIST_STORAGE_KEY, []);
      return Array.isArray(parsed) ? parsed : [];
    }

    function carregarChecklistStore() {
      var cacheLocal = carregarChecklistCacheLocal();
      if (cacheLocal.length > 0) {
        Store.checklistItems = cacheLocal;
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
      Storage.setJSON(CHECKLIST_STORAGE_KEY, Store.checklistItems || []);
    }

    function atualizarDataChecklistUI() {
      var elDate = document.getElementById('reminders-current-date');
      if (!elDate) return;
      try {
        var hoje = new Date();
        var opcoes = { weekday: 'long', day: 'numeric', month: 'long' };
        var dataFmt = hoje.toLocaleDateString('pt-BR', opcoes);
        dataFmt = dataFmt.charAt(0).toUpperCase() + dataFmt.slice(1);
        elDate.textContent = dataFmt;
      } catch (e) {
        elDate.textContent = 'Hoje';
      }
    }

    function getCategoriaLabel(cat) {
      switch (cat) {
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
        var strDias = dList.map(function (d) { return dNames[d] || ''; }).filter(Boolean).join(', ');
        label = '🔁 ' + (strDias || 'Semanal') + ' às ' + (rec.horario || '09:00');
      }
      if (!label) return '';
      return '<span>·</span><span class="reminder-rec-badge" onclick="event.stopPropagation(); abrirModalRecorrencia(\'' + escapeJSString(item.id) + '\')" title="Clique para editar agendamento">' + escapeHTML(label) + '</span>';
    }
    window.getRecorrenciaBadgeHTML = getRecorrenciaBadgeHTML;

    function renderChecklist() {
      var listPadraoEl = document.getElementById('reminders-list-padrao');
      var listPessoalEl = document.getElementById('reminders-list-pessoal');
      if (!listPadraoEl && !listPessoalEl) return;
      var items = Store.checklistItems || [];
      var total = items.length;
      var concluidos = items.filter(function (it) { return it.concluido; }).length;
      var pendentes = total - concluidos;
      var rotinas = items.filter(function (it) { return it.categoria === 'rotina' || it.padrao; }).length;
      var pct = total > 0 ? Math.round((concluidos / total) * 100) : 0;
      var fill = document.getElementById('reminders-progress-fill');
      if (fill) fill.style.width = pct + '%';
      var pctEl = document.getElementById('reminders-pct');
      if (pctEl) pctEl.textContent = pct + '%';
      var lblEl = document.getElementById('reminders-count-lbl');
      if (lblEl) lblEl.textContent = concluidos + ' de ' + total + ' checados';
      var cTodos = document.getElementById('fc-count-todos');
      if (cTodos) cTodos.textContent = total;
      var cPend = document.getElementById('fc-count-pendentes');
      if (cPend) cPend.textContent = pendentes;
      var cRot = document.getElementById('fc-count-rotina');
      if (cRot) cRot.textContent = rotinas;
      var cConc = document.getElementById('fc-count-concluidos');
      if (cConc) cConc.textContent = concluidos;
      var padraoItems = items.filter(function (it) { return !!it.padrao; });
      var pessoalItems = items.filter(function (it) { return !it.padrao; });
      var bPadrao = document.getElementById('badge-rotinas-padrao');
      if (bPadrao) {
        var concP = padraoItems.filter(function (i) { return i.concluido; }).length;
        bPadrao.textContent = concP + '/' + padraoItems.length;
      }
      var bPessoal = document.getElementById('badge-rotinas-pessoais');
      if (bPessoal) {
        var concU = pessoalItems.filter(function (i) { return i.concluido; }).length;
        bPessoal.textContent = concU + '/' + pessoalItems.length;
      }
      function renderizarLista(itens, targetEl, emptyMsg) {
        if (!targetEl) return;
        var filtrados = itens.filter(function (it) {
          if (checklistFiltroAtual === 'pendentes') return !it.concluido;
          if (checklistFiltroAtual === 'concluidos') return it.concluido;
          if (checklistFiltroAtual === 'rotina') return it.categoria === 'rotina' || it.padrao;
          return true;
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
            '<div style="font-size:11.5px;color:var(--muted);">' + escapeHTML(textoVazio) + '</div>' +
            '</li>';
          return;
        }
        var html = '';
        filtrados.forEach(function (item) {
          var completedClass = item.concluido ? ' completed' : '';
          var tagLabel = getCategoriaLabel(item.categoria);
          var tagClass = 'tag-' + (item.categoria || 'avulso');
          var metaHorario = item.horario ? '<span>·</span><span>' + escapeHTML(item.horario) + '</span>' : '';
          var recBadgeHTML = getRecorrenciaBadgeHTML(item);
          var safeChkIdAttr = sanitizeIdAttr(item.id);
          var safeChkJsId   = escapeJSString(item.id);
          html += '<li class="reminder-item' + completedClass + '" id="chk-item-' + safeChkIdAttr + '">' +
            '<button class="reminder-checkbox" onclick="toggleChecklistItem(\'' + safeChkJsId + '\')" title="' + (item.concluido ? 'Desmarcar' : 'Concluir') + '">' +
              '<i data-lucide="check" style="width:13px;height:13px;stroke-width:3;"></i>' +
            '</button>' +
            '<div class="reminder-body">' +
              '<div class="reminder-title">' + escapeHTML(item.titulo) + '</div>' +
              '<div class="reminder-meta">' +
                '<span class="reminder-tag ' + escapeHTML(tagClass) + '">' + escapeHTML(tagLabel) + '</span>' +
                recBadgeHTML +
                metaHorario +
              '</div>' +
            '</div>' +
            '<div class="reminder-actions">' +
              '<button class="reminder-action-btn edit" onclick="abrirModalRecorrencia(\'' + safeChkJsId + '\')" title="Editar e Configurar Repetição" aria-label="Editar Rotina">' +
                '<i data-lucide="pencil" style="width:14px;height:14px;stroke-width:2.2;"></i>' +
              '</button>' +
              '<button class="reminder-action-btn alert" onclick="criarOcorrenciaDoChecklist(\'' + safeChkJsId + '\')" data-tooltip="Falha detectada? Criar ocorrência desta rotina" aria-label="Criar ocorrência desta rotina">' +
                '<i data-lucide="alert-triangle" style="width:14px;height:14px;stroke-width:2.2;"></i>' +
              '</button>' +
              '<button class="reminder-action-btn del" onclick="removerItemChecklist(\'' + safeChkJsId + '\')" title="Excluir rotina/lembrete" aria-label="Excluir rotina">' +
                '<i data-lucide="trash-2" style="width:14px;height:14px;stroke-width:2;"></i>' +
              '</button>' +
            '</div>' +
          '</li>';
        });
        targetEl.innerHTML = html;
      }
      renderizarLista(padraoItems, listPadraoEl, 'Nenhuma rotina padrão cadastrada. Adicione acima para toda a equipe.');
      renderizarLista(pessoalItems, listPessoalEl, 'Nenhum lembrete pessoal cadastrado.');
      if (typeof window.lucide !== 'undefined' && window.lucide.createIcons) window.lucide.createIcons();
    }
    window.renderChecklist = renderChecklist;

    function toggleChecklistItem(id) {
      var item = (Store.checklistItems || []).find(function (it) { return it.id === id; });
      if (!item) return;
      item.concluido = !item.concluido;
      item.concluidoEm = item.concluido ? new Date().toISOString() : null;
      if (item.concluido && item.recorrencia && item.recorrencia.tipo && item.recorrencia.tipo !== 'nenhuma') {
        item.recorrencia.ultimoCicloConcluido = new Date().toISOString();
        item.recorrencia.proximaExecucao = calcularProximaExecucao(item.recorrencia, new Date(), true);
        salvarRecorrenciaLocal(item.id, item.recorrencia);
      }
      salvarChecklistStore();
      renderChecklist();
      if (item.padrao) salvarRotinaPadraoNuvem(item);
      else salvarLembretePessoalNuvem(item);
      if (item.concluido && typeof window.tocarSomNotificacao === 'function') {
        try { window.tocarSomNotificacao(); } catch (e) {}
      }
    }
    window.toggleChecklistItem = toggleChecklistItem;

    function filtrarChecklist(tipo, el) {
      checklistFiltroAtual = tipo;
      document.querySelectorAll('.reminders-filter-card').forEach(function (c) {
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
        titleEl.innerHTML = '<i data-lucide="list-checks" style="width:15px;height:15px;stroke-width:2;"></i> ' + escapeHTML(mapTitles[tipo] || 'Itens');
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
      Store.checklistItems.unshift(novoItem);
      salvarChecklistStore();
      input.value = '';
      renderChecklist();
      salvarRotinaPadraoNuvem(novoItem);
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Rotina Padrão TV Adicionada', 'Procedimento oficial adicionado e compartilhado para toda a equipe.', 'success');
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
      Store.checklistItems.unshift(novoItem);
      salvarChecklistStore();
      input.value = '';
      renderChecklist();
      salvarLembretePessoalNuvem(novoItem);
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Lembrete Adicionado', 'Item incluído na rotina de hoje e sincronizado na nuvem.', 'success');
      }
    }
    window.adicionarLembreteRapido = adicionarLembreteRapido;

    function removerItemChecklist(id) {
      var item = (Store.checklistItems || []).find(function (it) { return it.id === id; });
      if (!item) return;
      if (item.padrao) {
        if (!confirm('Esta é uma Rotina Padrão da emissora. Deseja realmente excluí-la para toda a equipe?')) {
          return;
        }
      }
      Store.checklistItems = (Store.checklistItems || []).filter(function (it) { return it.id !== id; });
      salvarChecklistStore();
      renderChecklist();
      if (item.padrao) {
        excluirRotinaPadraoNuvem(id);
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Rotina Removida', 'A rotina padrão foi removida para todos os operadores.', 'info');
        }
      } else {
        excluirLembretePessoalNuvem(id);
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Lembrete Removido', 'Lembrete pessoal excluído.', 'info');
        }
      }
    }
    window.removerItemChecklist = removerItemChecklist;

    function criarOcorrenciaDoChecklist(id) {
      var item = (Store.checklistItems || []).find(function (it) { return it.id === id; });
      if (!item) return;
      if (typeof window.abrirPopup === 'function') {
        window.abrirPopup('popup-nova-oc');
        var tituloEl = document.getElementById('nova-titulo');
        if (tituloEl) {
          tituloEl.value = 'Falha na Rotina: ' + item.titulo;
        }
        var catEl = document.getElementById('nova-cat');
        if (catEl) {
          if (item.categoria === 'ctrs') catEl.value = 'Telejornal / Transmissão ao Vivo';
          else if (item.categoria === 'estudio') catEl.value = 'Equipamento';
          else if (item.categoria === 'infra') catEl.value = 'Infraestrutura';
          else if (item.categoria === 'rotina') catEl.value = 'Programação';
          else catEl.value = 'Outro';
        }
        var descEl = document.getElementById('nova-desc');
        if (descEl) {
          var agoraStr = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          descEl.value = 'Inconformidade detectada durante a verificação de rotina em ' + agoraStr + '.\nProcedimento checado: ' + item.titulo + '.\nDetalhes da falha observada: ';
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
          setTimeout(function () {
            descEl.focus();
            descEl.setSelectionRange(descEl.value.length, descEl.value.length);
          }, 180);
        }
      }
    }
    window.criarOcorrenciaDoChecklist = criarOcorrenciaDoChecklist;

    function carregarOperadoresSugeridos() {
      var datalist = document.getElementById('lista-operadores-sugeridos');
      if (!window.DBService || typeof window.DBService.select !== 'function') return;
      window.DBService.select('operadores', 'select=id,nome&ativo=eq.true&order=nome.asc')
        .then(function (res) {
          if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) return;
          operadoresMap = {};
          res.data.forEach(function (op) {
            if (op && op.nome) operadoresMap[op.nome.trim()] = op.id;
          });
          var usuarioAtual = Session.getUserName();
          if (operadoresMap[usuarioAtual]) {
            Store.operadorUuidAtual = operadoresMap[usuarioAtual];
          }
          if (datalist) {
            datalist.innerHTML = '';
          }
          sincronizarChecklistNuvem();
        })
        .catch(function (err) {
          console.warn('[Operadores] Não foi possível carregar operadores do Supabase:', err);
        });
    }
    window.carregarOperadoresSugeridos = carregarOperadoresSugeridos;

    function getOperadorUUID() {
      if (Store.operadorUuidAtual) return Store.operadorUuidAtual;
      var usuarioAtual = Session.getUserName();
      if (usuarioAtual && operadoresMap && operadoresMap[usuarioAtual]) {
        Store.operadorUuidAtual = operadoresMap[usuarioAtual];
        return Store.operadorUuidAtual;
      }
      return null;
    }
    window.getOperadorUUID = getOperadorUUID;

    function sincronizarChecklistNuvem() {
      if (!window.DBService || typeof window.DBService.select !== 'function') return;
      var opUUID = getOperadorUUID();
      var usuarioAtual = Session.getUserName();
      var queryFilter = '';
      if (opUUID) {
        queryFilter = 'or=(padrao.eq.true,operador_id.eq.' + encodeURIComponent(opUUID) + ')';
      } else if (usuarioAtual && usuarioAtual !== 'Plantão Técnico' && usuarioAtual !== 'Operador') {
        queryFilter = 'or=(padrao.eq.true,operador_nome.eq.' + encodeURIComponent(usuarioAtual) + ')';
      } else {
        queryFilter = 'padrao=eq.true';
      }
      window.DBService.select('checklist_itens', 'select=*&categoria=not.in.(reporter,rc)&' + queryFilter + '&order=criado_em.asc')
        .then(function (res) {
          if (!res.ok || !Array.isArray(res.data)) return;
          var cloudItens = res.data.filter(function (c) {
            return c && c.categoria !== 'reporter' && c.categoria !== 'rc';
          });
          var recMap = carregarRecorrenciasLocais();
          var itensProcessados = cloudItens.map(function (c) {
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
          var idNuvemMap = {};
          itensProcessados.forEach(function (item) { idNuvemMap[item.id] = true; });
          var pendentesLocais = (Store.checklistItems || []).filter(function (it) {
            return it && !idNuvemMap[it.id] && (!it.id || !it.id.toString().startsWith('rot-'));
          });
          Store.checklistItems = itensProcessados.concat(pendentesLocais);
          salvarChecklistStore();
          renderChecklist();
          verificarRecorrenciasChecklist();
        })
        .catch(function (err) {
          console.warn('[Checklist DB] Erro ao sincronizar com banco de dados:', err);
        });
    }
    window.sincronizarChecklistNuvem = sincronizarChecklistNuvem;
    window.sincronizarLembretesPessoaisNuvem = sincronizarChecklistNuvem;

    function salvarRotinaPadraoNuvem(item) {
      if (!window.DBService || typeof window.DBService.upsert !== 'function' || !item) return;
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
      window.DBService.upsert('checklist_itens', payload).catch(function (err) {
        console.error('[Checklist DB] Falha ao enviar rotina padrão para o banco:', err);
      });
    }
    window.salvarRotinaPadraoNuvem = salvarRotinaPadraoNuvem;

    function excluirRotinaPadraoNuvem(id) {
      if (!window.DBService || typeof window.DBService.remove !== 'function' || !id) return;
      window.DBService.remove('checklist_itens', 'id=eq.' + encodeURIComponent(id)).catch(function (err) {
        console.error('[Checklist DB] Falha ao excluir rotina padrão do banco:', err);
      });
    }
    window.excluirRotinaPadraoNuvem = excluirRotinaPadraoNuvem;

    function salvarLembretePessoalNuvem(item) {
      if (!window.DBService || typeof window.DBService.upsert !== 'function' || !item) return;
      var opUUID = getOperadorUUID();
      var usuarioAtual = Session.getUserName();
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
      window.DBService.upsert('checklist_itens', payload).catch(function (err) {
        console.error('[Checklist DB] Falha ao enviar lembrete pessoal para o banco:', err);
      });
    }
    window.salvarLembretePessoalNuvem = salvarLembretePessoalNuvem;

    function excluirLembretePessoalNuvem(id) {
      if (!window.DBService || typeof window.DBService.remove !== 'function' || !id) return;
      window.DBService.remove('checklist_itens', 'id=eq.' + encodeURIComponent(id)).catch(function (err) {
        console.error('[Checklist DB] Falha ao excluir lembrete do banco:', err);
      });
    }
    window.excluirLembretePessoalNuvem = excluirLembretePessoalNuvem;

    function carregarRecorrenciasLocais() {
      var parsed = Storage.getJSON(KEYS.CHECKLIST_REC, {});
      return (parsed && typeof parsed === 'object') ? parsed : {};
    }
    window.carregarRecorrenciasLocais = carregarRecorrenciasLocais;

    function salvarRecorrenciaLocal(id, rec) {
      var map = carregarRecorrenciasLocais();
      if (!rec || rec.tipo === 'nenhuma') {
        delete map[id];
      } else {
        map[id] = rec;
      }
      Storage.setJSON(KEYS.CHECKLIST_REC, map);
    }
    window.salvarRecorrenciaLocal = salvarRecorrenciaLocal;

    function abrirModalRecorrencia(id) {
      var item = (Store.checklistItems || []).find(function (it) { return it.id === id; });
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
      var diasAtivos = Array.isArray(rec.diasSemana) && rec.diasSemana.length > 0 ? rec.diasSemana : [1, 3, 5];
      var pills = document.querySelectorAll('#rec-dias-semana-wrap .rec-day-pill');
      pills.forEach(function (btn) {
        var diaNum = parseInt(btn.getAttribute('data-day'), 10);
        if (diasAtivos.indexOf(diaNum) !== -1) btn.classList.add('active');
        else btn.classList.remove('active');
      });
      atualizarPreviaProximaExecucao();
      if (typeof window.abrirPopup === 'function') {
        window.abrirPopup('popup-recorrencia-checklist');
      }
      if (typeof window.lucide !== 'undefined' && window.lucide.createIcons) window.lucide.createIcons();
    }
    window.abrirModalRecorrencia = abrirModalRecorrencia;

    function selecionarFrequenciaRecorrencia(freq) {
      recorrenciaFrequenciaAtiva = freq;
      ['nenhuma', 'horaria', 'diaria', 'semanal'].forEach(function (b) {
        var el = document.getElementById('rec-btn-' + b);
        if (el) {
          if (b === freq) el.classList.add('active');
          else el.classList.remove('active');
        }
        var sec = document.getElementById('rec-sec-' + b);
        if (sec) sec.style.display = (b === freq) ? 'block' : 'none';
      });
      atualizarPreviaProximaExecucao();
    }
    window.selecionarFrequenciaRecorrencia = selecionarFrequenciaRecorrencia;

    function toggleDiaSemanaRecorrencia(btn) {
      btn.classList.toggle('active');
      var ativos = document.querySelectorAll('#rec-dias-semana-wrap .rec-day-pill.active');
      if (ativos.length === 0) {
        btn.classList.add('active');
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
        if (jaConcluidoNesteCiclo || cDate.getTime() <= base.getTime()) {
          cDate.setDate(cDate.getDate() + 1);
        }
        for (var i = 0; i < 7; i++) {
          if (dias.indexOf(cDate.getDay()) !== -1) {
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
        document.querySelectorAll('#rec-dias-semana-wrap .rec-day-pill.active').forEach(function (p) {
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
      var idEl = document.getElementById('rec-item-id');
      var itemId = idEl ? idEl.value : '';
      var item = (Store.checklistItems || []).find(function (it) { return it.id === itemId; });
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
      if (typeof window.fecharPopup === 'function') {
        window.fecharPopup('popup-recorrencia-checklist');
      }
      if (typeof window.mostrarToast === 'function') {
        var msg = novaRec.tipo === 'nenhuma' ? 'Repetição desativada.' : 'Repetição agendada com sucesso!';
        window.mostrarToast('Agendamento', msg, 'success');
      }
    }
    window.salvarRecorrenciaItem = salvarRecorrenciaItem;

    function removerRecorrenciaItem() {
      selecionarFrequenciaRecorrencia('nenhuma');
      salvarRecorrenciaItem();
    }
    window.removerRecorrenciaItem = removerRecorrenciaItem;

    function verificarRecorrenciasChecklist() {
      var items = Store.checklistItems || [];
      if (items.length === 0) return;
      var agora = Date.now();
      var houveMudanca = false;
      items.forEach(function (it) {
        if (!it || !it.concluido) return;
        if (!it.recorrencia || !it.recorrencia.tipo || it.recorrencia.tipo === 'nenhuma') return;
        var proxISO = it.recorrencia.proximaExecucao;
        if (!proxISO) return;
        var proxTime = new Date(proxISO).getTime();
        if (!isNaN(proxTime) && agora >= proxTime) {
          it.concluido = false;
          it.concluidoEm = null;
          it.recorrencia.proximaExecucao = calcularProximaExecucao(it.recorrencia, new Date(), false);
          houveMudanca = true;
          if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('⏰ Hora da Rotina!', 'Procedimento pendente de checagem: ' + it.titulo, 'warning');
          }
          if (typeof window.tocarSomNotificacao === 'function') {
            try { window.tocarSomNotificacao(); } catch (e) {}
          }
          if (typeof window.adicionarNotificacao === 'function') {
            window.adicionarNotificacao('Rotina Agendada', 'Procedimento pendente de checagem: ' + it.titulo, 'alerta');
          }
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

    EventBus.on('cloud:sync', sincronizarChecklistNuvem);
    EventBus.on('operador:uuid-resolved', sincronizarChecklistNuvem);

    setInterval(function () {
      verificarReseteMeiaNoite();
      verificarRecorrenciasChecklist();
    }, 30000);
    window.addEventListener('focus', function () {
      verificarReseteMeiaNoite();
      verificarRecorrenciasChecklist();
    });
  });
})(window, document, window.TVApp);
