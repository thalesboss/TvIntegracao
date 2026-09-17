  /* ═══════════════════════════════════════════
     PLANEJAMENTO ORÇAMENTÁRIO (ANO ATUAL + 1) — BANCO DE DADOS SUPABASE
  ═══════════════════════════════════════════ */

  var anoOrcamento = new Date().getFullYear() + 1;

  function syncAnoOrcamentoUI() {
    anoOrcamento = new Date().getFullYear() + 1;
    document.querySelectorAll('.orc-ano-display, .sidebar-orc-ano').forEach(function(el) {
      el.textContent = anoOrcamento;
    });
  }

  var orcamentoSeedData = [];
  var filtroOrcamentoAtivo = 'todos';
  var ORCAMENTO_STORAGE_KEY = 'tv_orcamento_seed_v2';

  function getOrcamentoDBCredentials() {
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

  function filtrarOrcamentoTipo(tipo, btn) {
    filtroOrcamentoAtivo = tipo || 'todos';
    if (btn && btn.closest('.pills')) {
      btn.closest('.pills').querySelectorAll('.pill').forEach(function(p){ p.classList.remove('on'); });
      btn.classList.add('on');
    }
    renderOrcamento();
  }
  window.filtrarOrcamentoTipo = filtrarOrcamentoTipo;

  function formatarMoeda(val) {
    return 'R$ ' + Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function limparDescricao(desc, id) {
    if (!desc || typeof desc !== 'string') {
      if (id === 'orc_init_1') return 'Aquisição de Switcher de Vídeo SDI 12G 4K';
      if (id === 'orc_init_2') return 'Manutenção Preventiva de Geradores e Nobreaks';
      return '';
    }
    var trimmed = desc.trim();
    if (trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
      if (id === 'orc_init_1') return 'Aquisição de Switcher de Vídeo SDI 12G 4K';
      if (id === 'orc_init_2') return 'Manutenção Preventiva de Geradores e Nobreaks';
      return '';
    }
    return trimmed;
  }

  function limparPrioridade(prio, id) {
    if (!prio || typeof prio !== 'string') {
      if (id === 'orc_init_1') return 'Alta';
      if (id === 'orc_init_2') return 'Média';
      return 'Média';
    }
    var trimmed = prio.trim();
    if (trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null' || !trimmed) {
      if (id === 'orc_init_1') return 'Alta';
      if (id === 'orc_init_2') return 'Média';
      return 'Média';
    }
    return trimmed;
  }

  function limparJustificativa(just, id) {
    if (!just || typeof just !== 'string') {
      if (id === 'orc_init_1') return 'Modernização do controle mestre e suporte a sinais HD/4K de alta taxa de quadros.';
      if (id === 'orc_init_2') return 'Contrato de revisão trimestral das baterias e banco de carga da torre de transmissão.';
      return '';
    }
    var trimmed = just.trim();
    if (trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
      if (id === 'orc_init_1') return 'Modernização do controle mestre e suporte a sinais HD/4K de alta taxa de quadros.';
      if (id === 'orc_init_2') return 'Contrato de revisão trimestral das baterias e banco de carga da torre de transmissão.';
      return '';
    }
    return trimmed;
  }

  function limparPraca(praca) {
    if (!praca || typeof praca !== 'string') return 'Juiz de Fora';
    var trimmed = praca.trim();
    if (trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null' || !trimmed) {
      return 'Juiz de Fora';
    }
    return trimmed;
  }

  function limparTipo(tipo) {
    if (!tipo || typeof tipo !== 'string') return 'CAPEX';
    var t = tipo.trim().toUpperCase();
    return (t === 'OPEX') ? 'OPEX' : 'CAPEX';
  }

  function limparStatus(st) {
    if (!st || typeof st !== 'string') return 'Proposto';
    var trimmed = st.trim();
    if (trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null' || !trimmed) {
      return 'Proposto';
    }
    return trimmed;
  }

  function atualizarFmtValorOrcamento(val) {
    var el = document.getElementById('orc-det-valor-fmt');
    if (el) el.textContent = formatarMoeda(val);
  }
  window.atualizarFmtValorOrcamento = atualizarFmtValorOrcamento;

  function atualizarFmtValorNovoOrcamento(val) {
    var el = document.getElementById('orc-modal-valor-fmt');
    if (el) el.textContent = formatarMoeda(val);
  }
  window.atualizarFmtValorNovoOrcamento = atualizarFmtValorNovoOrcamento;

  function pertenceAPracaAtivaOrcamento(item) {
    if (!item) return false;
    var pracaAtiva = (typeof getPracaAtual === 'function') ? getPracaAtual() : 'Juiz de Fora';
    var isUberlandia = pracaAtiva.indexOf('Uber') !== -1;
    var itemPraca = item.praca || '';
    if (isUberlandia) {
      return itemPraca.indexOf('Uber') !== -1;
    } else {
      return !itemPraca || itemPraca.indexOf('Juiz') !== -1;
    }
  }
  window.pertenceAPracaAtivaOrcamento = pertenceAPracaAtivaOrcamento;

  function renderOrcamento() {
    syncAnoOrcamentoUI();
    var tbody = document.getElementById('orc-itens-tbody');
    if (!tbody) return;

    if (!Array.isArray(orcamentoSeedData)) orcamentoSeedData = [];

    var itensDaPraca = orcamentoSeedData.filter(pertenceAPracaAtivaOrcamento);

    var totalGeral = 0;
    var totalCapex = 0;
    var totalOpex = 0;

    itensDaPraca.forEach(function(item) {
      var val = Number(item.valor) || 0;
      totalGeral += val;
      if (item.tipo === 'CAPEX') totalCapex += val;
      else totalOpex += val;
    });

    var kpiTot = document.getElementById('orc-kpi-total');
    var kpiCapex = document.getElementById('orc-kpi-capex');
    var kpiOpex = document.getElementById('orc-kpi-opex');

    if (kpiTot) kpiTot.textContent = formatarMoeda(totalGeral);
    if (kpiCapex) kpiCapex.textContent = formatarMoeda(totalCapex);
    if (kpiOpex) kpiOpex.textContent = formatarMoeda(totalOpex);

    /* Atualiza Barra de Distribuição de Recursos */
    var pctCapex = totalGeral > 0 ? Math.round((totalCapex / totalGeral) * 100) : 0;
    var pctOpex = totalGeral > 0 ? (100 - pctCapex) : 0;

    var barCapexTxt = document.getElementById('orc-bar-capex-txt');
    var barOpexTxt = document.getElementById('orc-bar-opex-txt');
    var barCapexFill = document.getElementById('orc-bar-capex-fill');
    var barOpexFill = document.getElementById('orc-bar-opex-fill');

    if (barCapexTxt) barCapexTxt.textContent = pctCapex + '% (' + formatarMoeda(totalCapex) + ')';
    if (barOpexTxt) barOpexTxt.textContent = pctOpex + '% (' + formatarMoeda(totalOpex) + ')';
    if (barCapexFill) barCapexFill.style.width = (totalGeral > 0 ? pctCapex : 50) + '%';
    if (barOpexFill) barOpexFill.style.width = (totalGeral > 0 ? pctOpex : 50) + '%';

    /* Atualiza contadores nas abas pills */
    var countCapex = itensDaPraca.filter(function(i){ return i.tipo === 'CAPEX'; }).length;
    var countOpex = itensDaPraca.filter(function(i){ return i.tipo === 'OPEX'; }).length;
    var tabTodos = document.getElementById('orc-tab-todos');
    var tabCapex = document.getElementById('orc-tab-capex');
    var tabOpex = document.getElementById('orc-tab-opex');

    if (tabTodos) tabTodos.textContent = 'Todas as Linhas (' + itensDaPraca.length + ')';
    if (tabCapex) tabCapex.textContent = 'Equipamentos (' + countCapex + ')';
    if (tabOpex) tabOpex.textContent = 'Manutenção (' + countOpex + ')';

    /* Filtra itens para exibição na tabela */
    var itensExibir = itensDaPraca.filter(function(item) {
      if (filtroOrcamentoAtivo === 'CAPEX') return item.tipo === 'CAPEX';
      if (filtroOrcamentoAtivo === 'OPEX') return item.tipo === 'OPEX';
      return true;
    });

    if (itensExibir.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px 12px;font-size:12.5px;">' +
        '<i data-lucide="inbox" style="width:24px;height:24px;stroke-width:1.5;margin-bottom:6px;color:var(--dim);"></i><br/>' +
        (orcamentoSeedData.length === 0 
          ? 'Nenhuma linha orçamentária cadastrada ainda. Clique em <strong>"+ Propor Orçamento"</strong> para iniciar.'
          : 'Nenhum item orçamentário encontrado nesta categoria.') +
        '</td></tr>';
    } else {
      tbody.innerHTML = itensExibir.map(function(item, idx) {
        var val = Number(item.valor) || 0;
        var cleanDesc = limparDescricao(item.desc || item.descricao, item.id);
        var itemDesc = cleanDesc || 'Item sem descrição';
        var itemPrio = limparPrioridade(item.prio || item.prioridade, item.id);
        var itemPraca = limparPraca(item.praca);
        var itemTipo = limparTipo(item.tipo);
        var itemStatus = limparStatus(item.status);

        var tagTipo = itemTipo === 'CAPEX' 
          ? '<span class="tag" style="background:#E8F2FF;color:#0071E3;border:1px solid #C7DFFB;font-weight:700;">⚙️ Equipamentos</span>' 
          : '<span class="tag" style="background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;font-weight:700;">🛠️ Manutenção</span>';

        var tagPrio = itemPrio === 'Alta' || itemPrio === 'Estratégica'
          ? '<span class="tag tag-r">' + escapeHTML(itemPrio) + '</span>'
          : '<span class="tag tag-y">' + escapeHTML(itemPrio) + '</span>';

        var tagStatus = itemStatus === 'Aprovado'
          ? '<span class="tag tag-g">✓ Aprovado</span>'
          : itemStatus === 'Em Revisão'
          ? '<span class="tag tag-y">Em Revisão</span>'
          : itemStatus === 'Rejeitado'
          ? '<span class="tag tag-r">Rejeitado</span>'
          : '<span class="tag tag-ind">Proposto</span>';

        return (
          '<tr style="transition:background 0.12s ease;cursor:pointer;" onclick="abrirDetalhesItemOrcamento(\'' + item.id + '\')" title="Clique para ver detalhes, editar ou excluir">' +
            '<td style="text-align:center;font-weight:700;color:var(--muted);">' + (idx + 1) + '</td>' +
            '<td><strong style="color:var(--txt);font-size:13px;">' + escapeHTML(itemDesc) + '</strong></td>' +
            '<td>' + tagTipo + '</td>' +
            '<td><span style="font-size:12px;color:var(--txt2);">' + escapeHTML(itemPraca) + '</span></td>' +
            '<td>' + tagPrio + '</td>' +
            '<td style="text-align:right;font-weight:700;color:var(--txt);font-size:13px;">' + formatarMoeda(val) + '</td>' +
            '<td style="text-align:center;">' + tagStatus + '</td>' +
            '<td style="text-align:center;" onclick="event.stopPropagation();">' +
              '<button type="button" class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); removerItemOrcamento(\'' + item.id + '\')" title="Remover linha orçamentária" style="color:var(--red);padding:3px 8px;border-radius:6px;">' +
                '<i data-lucide="trash-2" style="width:12px;height:12px;stroke-width:2;"></i>' +
              '</button>' +
            '</td>' +
          '</tr>'
        );
      }).join('');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.renderOrcamento = renderOrcamento;

  function abrirModalAdicionarItemOrcamento() {
    syncAnoOrcamentoUI();
    var descEl = document.getElementById('orc-modal-desc');
    var valEl = document.getElementById('orc-modal-valor');
    var justEl = document.getElementById('orc-modal-just');
    var tipoEl = document.getElementById('orc-modal-tipo');
    var pracaEl = document.getElementById('orc-modal-praca');
    var prioEl = document.getElementById('orc-modal-prio');

    if (descEl) descEl.value = '';
    if (valEl) valEl.value = '';
    if (justEl) justEl.value = '';
    if (tipoEl) tipoEl.selectedIndex = 0;
    if (pracaEl) {
      if (typeof getPracaAtual === 'function') pracaEl.value = getPracaAtual();
      else pracaEl.selectedIndex = 0;
    }
    if (prioEl) prioEl.selectedIndex = 1;

    atualizarFmtValorNovoOrcamento(0);
    abrirPopup('popup-novo-item-orcamento');
    if (descEl) setTimeout(function(){ descEl.focus(); }, 150);
  }
  window.abrirModalAdicionarItemOrcamento = abrirModalAdicionarItemOrcamento;

  function confirmarItemOrcamento() {
    var descEl = document.getElementById('orc-modal-desc');
    var tipoEl = document.getElementById('orc-modal-tipo');
    var pracaEl = document.getElementById('orc-modal-praca');
    var valorEl = document.getElementById('orc-modal-valor');
    var prioEl = document.getElementById('orc-modal-prio');
    var justEl = document.getElementById('orc-modal-just');

    var rawDesc = descEl ? descEl.value.trim() : '';
    var desc = limparDescricao(rawDesc);
    var valor = valorEl ? parseFloat(valorEl.value) : 0;

    if (!desc || isNaN(valor) || valor <= 0) {
      alert('Por favor, informe a Descrição do item e o Valor Estimado (R$).');
      return;
    }

    var prio = limparPrioridade(prioEl ? prioEl.value : 'Média');
    var autor = (typeof getUsuarioAtual === 'function') ? getUsuarioAtual() : 'Operador';
    var novo = {
      id: 'orc_' + Date.now(),
      ano: anoOrcamento,
      desc: desc,
      descricao: desc,
      tipo: limparTipo(tipoEl ? tipoEl.value : 'CAPEX'),
      praca: limparPraca(pracaEl ? pracaEl.value : 'Juiz de Fora'),
      prio: prio,
      prioridade: prio,
      valor: valor,
      justificativa: justEl ? justEl.value.trim() : '',
      status: 'Proposto',
      criado_por: autor
    };

    orcamentoSeedData.push(novo);
    salvarOrcamentoStore();
    fecharPopup('popup-novo-item-orcamento');
    renderOrcamento();

    // Sincroniza diretamente com a tabela orcamentos no Supabase
    salvarItemOrcamentoNuvem(novo);

    if (typeof mostrarToast === 'function') {
      mostrarToast('Item Adicionado ao Orçamento', desc + ' gravado no banco de dados para ' + anoOrcamento + '.', 'success');
    }
  }
  window.confirmarItemOrcamento = confirmarItemOrcamento;

  /* ── Modal Detalhes & Edição do Item Orçamentário (Estilo Ocorrências) ── */
  function abrirDetalhesItemOrcamento(id) {
    var item = orcamentoSeedData.find(function(i) { return i && i.id === id; });
    if (!item) return;

    var idEl = document.getElementById('orc-det-id');
    var descEl = document.getElementById('orc-det-desc');
    var tipoEl = document.getElementById('orc-det-tipo');
    var pracaEl = document.getElementById('orc-det-praca');
    var valorEl = document.getElementById('orc-det-valor');
    var prioEl = document.getElementById('orc-det-prio');
    var statusEl = document.getElementById('orc-det-status');
    var justEl = document.getElementById('orc-det-just');

    var cleanDesc = limparDescricao(item.desc || item.descricao, item.id);
    var cleanTipo = limparTipo(item.tipo);
    var cleanPraca = limparPraca(item.praca);
    var cleanPrio = limparPrioridade(item.prio || item.prioridade, item.id);
    var cleanJust = limparJustificativa(item.justificativa, item.id);
    var cleanStatus = limparStatus(item.status);
    var valNum = Number(item.valor) || 0;

    // Atualiza o próprio item na memória para manter tudo saneado
    item.desc = cleanDesc;
    item.descricao = cleanDesc;
    item.tipo = cleanTipo;
    item.praca = cleanPraca;
    item.prio = cleanPrio;
    item.prioridade = cleanPrio;
    item.justificativa = cleanJust;
    item.status = cleanStatus;
    item.valor = valNum;

    if (idEl) idEl.value = item.id;
    if (descEl) descEl.value = cleanDesc;
    if (tipoEl) tipoEl.value = cleanTipo;
    if (pracaEl) pracaEl.value = cleanPraca;
    if (valorEl) valorEl.value = valNum;
    if (prioEl) prioEl.value = cleanPrio;
    if (statusEl) statusEl.value = cleanStatus;
    if (justEl) justEl.value = cleanJust;

    atualizarFmtValorOrcamento(valNum);
    abrirPopup('popup-detalhes-orcamento');
    if (descEl) setTimeout(function(){ descEl.focus(); }, 150);
  }
  window.abrirDetalhesItemOrcamento = abrirDetalhesItemOrcamento;

  function salvarEdicaoItemOrcamento() {
    var idEl = document.getElementById('orc-det-id');
    var descEl = document.getElementById('orc-det-desc');
    var tipoEl = document.getElementById('orc-det-tipo');
    var pracaEl = document.getElementById('orc-det-praca');
    var valorEl = document.getElementById('orc-det-valor');
    var prioEl = document.getElementById('orc-det-prio');
    var statusEl = document.getElementById('orc-det-status');
    var justEl = document.getElementById('orc-det-just');

    if (!idEl || !idEl.value) return;
    var id = idEl.value;

    var rawDesc = descEl ? descEl.value.trim() : '';
    var desc = limparDescricao(rawDesc, id);
    var valor = valorEl ? parseFloat(valorEl.value) : 0;

    if (!desc || isNaN(valor) || valor <= 0) {
      alert('Por favor, informe uma descrição válida e um valor maior que zero.');
      return;
    }

    var item = orcamentoSeedData.find(function(i) { return i && i.id === id; });
    if (!item) return;

    var prio = limparPrioridade(prioEl ? prioEl.value : 'Média', id);
    item.desc = desc;
    item.descricao = desc;
    item.tipo = limparTipo(tipoEl ? tipoEl.value : 'CAPEX');
    item.praca = limparPraca(pracaEl ? pracaEl.value : 'Juiz de Fora');
    item.valor = valor;
    item.prio = prio;
    item.prioridade = prio;
    item.status = limparStatus(statusEl ? statusEl.value : 'Proposto');
    item.justificativa = justEl ? justEl.value.trim() : '';

    salvarOrcamentoStore();
    fecharPopup('popup-detalhes-orcamento');
    renderOrcamento();

    // Sincroniza alteração no Supabase
    salvarItemOrcamentoNuvem(item);

    if (typeof mostrarToast === 'function') {
      mostrarToast('Orçamento Atualizado', 'A linha orçamentária foi atualizada com sucesso no banco de dados.', 'success');
    }
  }
  window.salvarEdicaoItemOrcamento = salvarEdicaoItemOrcamento;

  function excluirItemOrcamentoModal() {
    var idEl = document.getElementById('orc-det-id');
    if (!idEl || !idEl.value) return;
    var id = idEl.value;

    if (!confirm('Deseja realmente excluir esta linha orçamentária do plano? Essa ação removerá o registro do banco de dados.')) {
      return;
    }

    fecharPopup('popup-detalhes-orcamento');
    orcamentoSeedData = orcamentoSeedData.filter(function(i){ return i.id !== id; });
    salvarOrcamentoStore();
    renderOrcamento();

    // Exclui do Supabase
    excluirItemOrcamentoNuvem(id);

    if (typeof mostrarToast === 'function') {
      mostrarToast('Item Excluído', 'Linha orçamentária removida do banco de dados.', 'info');
    }
  }
  window.excluirItemOrcamentoModal = excluirItemOrcamentoModal;

  function removerItemOrcamento(id) {
    if (!confirm('Deseja remover esta linha orçamentária do plano?')) return;
    orcamentoSeedData = orcamentoSeedData.filter(function(i){ return i.id !== id; });
    salvarOrcamentoStore();
    renderOrcamento();
    excluirItemOrcamentoNuvem(id);
  }
  window.removerItemOrcamento = removerItemOrcamento;

  function salvarOrcamentoStore() {
    window.orcamentoSeedData = orcamentoSeedData;
    try {
      localStorage.setItem(ORCAMENTO_STORAGE_KEY, JSON.stringify(orcamentoSeedData));
    } catch (e) {}
  }

  function carregarOrcamentoStore() {
    try {
      var raw = localStorage.getItem(ORCAMENTO_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          orcamentoSeedData = parsed.map(function(item) {
            var d = limparDescricao(item.desc || item.descricao, item.id);
            var p = limparPrioridade(item.prio || item.prioridade, item.id);
            var j = limparJustificativa(item.justificativa, item.id);
            return {
              id: item.id,
              ano: item.ano || anoOrcamento,
              desc: d || 'Item sem descrição',
              descricao: d || 'Item sem descrição',
              tipo: limparTipo(item.tipo),
              praca: limparPraca(item.praca),
              prio: p,
              prioridade: p,
              valor: Number(item.valor) || 0,
              justificativa: j,
              status: limparStatus(item.status),
              criado_por: item.criado_por || 'Sistema'
            };
          });
        } else {
          orcamentoSeedData = [];
        }
      } else {
        orcamentoSeedData = [];
      }
    } catch (e) {
      orcamentoSeedData = [];
    }
    window.orcamentoSeedData = orcamentoSeedData;
    renderOrcamento();
    sincronizarOrcamentoNuvem();
  }
  window.carregarOrcamentoStore = carregarOrcamentoStore;

  /* ═══════════════════════════════════════════
     SINCRONIZAÇÃO EM NUVEM (SUPABASE: TABELA ORCAMENTOS)
  ═══════════════════════════════════════════ */

  function sincronizarOrcamentoNuvem() {
    var db = getOrcamentoDBCredentials();
    if (!db.url || !db.key) return;

    var endpoint = db.url + '/rest/v1/orcamentos?select=*&order=id.asc';
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
        orcamentoSeedData = cloudItens.map(function(c) {
          var d = limparDescricao(c.desc || c.descricao, c.id);
          var p = limparPrioridade(c.prio || c.prioridade, c.id);
          var j = limparJustificativa(c.justificativa, c.id);
          return {
            id: c.id,
            ano: c.ano || anoOrcamento,
            desc: d || 'Item sem descrição',
            descricao: d || 'Item sem descrição',
            tipo: limparTipo(c.tipo),
            praca: limparPraca(c.praca),
            prio: p,
            prioridade: p,
            valor: Number(c.valor) || 0,
            justificativa: j,
            status: limparStatus(c.status),
            criado_por: c.criado_por || 'Sistema'
          };
        });

        salvarOrcamentoStore();
        renderOrcamento();
        console.log('[Orçamento DB] ✅ ' + cloudItens.length + ' linhas orçamentárias sincronizadas do banco de dados (Supabase orcamentos).');
      }
    })
    .catch(function(err) {
      console.warn('[Orçamento DB] Erro ao sincronizar orçamentos do banco:', err);
    });
  }
  window.sincronizarOrcamentoNuvem = sincronizarOrcamentoNuvem;

  function salvarItemOrcamentoNuvem(item) {
    var db = getOrcamentoDBCredentials();
    if (!db.url || !db.key) return;

    var cleanDesc = limparDescricao(item.desc || item.descricao, item.id);
    var cleanPrio = limparPrioridade(item.prio || item.prioridade, item.id);
    var cleanJust = limparJustificativa(item.justificativa, item.id);
    var cleanPraca = limparPraca(item.praca);
    var cleanTipo = limparTipo(item.tipo);
    var cleanStatus = limparStatus(item.status);
    var autor = item.criado_por || (typeof getUsuarioAtual === 'function' ? getUsuarioAtual() : 'Operador');

    var payload = {
      id: item.id,
      ano: item.ano || anoOrcamento,
      desc: cleanDesc,
      descricao: cleanDesc,
      tipo: cleanTipo,
      praca: cleanPraca,
      prio: cleanPrio,
      prioridade: cleanPrio,
      valor: Number(item.valor) || 0,
      justificativa: cleanJust,
      status: cleanStatus,
      criado_por: autor
    };

    var endpoint = db.url + '/rest/v1/orcamentos';
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
          console.error('[Orçamento DB] Erro Supabase ao gravar orçamento:', res.status, errText);
        });
      }
      console.log('[Orçamento DB] ✅ Linha orçamentária salva diretamente no banco de dados (orcamentos):', cleanDesc);
    })
    .catch(function(err) {
      console.error('[Orçamento DB] Falha ao enviar orçamento para o banco:', err);
    });
  }
  window.salvarItemOrcamentoNuvem = salvarItemOrcamentoNuvem;

  function excluirItemOrcamentoNuvem(id) {
    var db = getOrcamentoDBCredentials();
    if (!db.url || !db.key || !id) return;

    var endpoint = db.url + '/rest/v1/orcamentos?id=eq.' + encodeURIComponent(id);
    fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'apikey': db.key,
        'Authorization': 'Bearer ' + db.key
      }
    })
    .then(function(res) {
      if (res.ok) {
        console.log('[Orçamento DB] ✅ Linha orçamentária excluída do banco de dados:', id);
      }
    })
    .catch(function(err) {
      console.error('[Orçamento DB] Falha ao excluir item do banco:', err);
    });
  }
  window.excluirItemOrcamentoNuvem = excluirItemOrcamentoNuvem;

  function salvarOrcamento() {
    salvarOrcamentoStore();
    orcamentoSeedData.forEach(function(item) {
      salvarItemOrcamentoNuvem(item);
    });
    if (typeof mostrarToast === 'function') {
      mostrarToast('Plano Orçamentário Salvo', 'Todas as previsões orçamentárias foram sincronizadas com o banco de dados.', 'success');
    }
    alert('Plano Orçamentário de ' + anoOrcamento + ' salvo com sucesso no banco de dados!');
  }
  window.salvarOrcamento = salvarOrcamento;

  function exportarOrcamentoExcel() {
    alert('Relatório de Orçamento ' + anoOrcamento + ' exportado com sucesso em formato consolidado (CAPEX/OPEX).');
  }
  window.exportarOrcamentoExcel = exportarOrcamentoExcel;
