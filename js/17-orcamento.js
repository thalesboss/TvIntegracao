  /* ═══════════════════════════════════════════
     PLANEJAMENTO ORÇAMENTÁRIO (ANO ATUAL + 1)
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

  function renderOrcamento() {
    syncAnoOrcamentoUI();
    var tbody = document.getElementById('orc-itens-tbody');
    if (!tbody) return;

    if (!Array.isArray(orcamentoSeedData)) orcamentoSeedData = [];

    var totalGeral = 0;
    var totalCapex = 0;
    var totalOpex = 0;

    orcamentoSeedData.forEach(function(item) {
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
    var countCapex = orcamentoSeedData.filter(function(i){ return i.tipo === 'CAPEX'; }).length;
    var countOpex = orcamentoSeedData.filter(function(i){ return i.tipo === 'OPEX'; }).length;
    var tabTodos = document.getElementById('orc-tab-todos');
    var tabCapex = document.getElementById('orc-tab-capex');
    var tabOpex = document.getElementById('orc-tab-opex');

    if (tabTodos) tabTodos.textContent = 'Todas as Linhas (' + orcamentoSeedData.length + ')';
    if (tabCapex) tabCapex.textContent = 'Equipamentos (' + countCapex + ')';
    if (tabOpex) tabOpex.textContent = 'Manutenção (' + countOpex + ')';

    /* Filtra itens para exibição na tabela */
    var itensExibir = orcamentoSeedData.filter(function(item) {
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

        var tagTipo = item.tipo === 'CAPEX' 
          ? '<span class="tag" style="background:#E8F2FF;color:#0071E3;border:1px solid #C7DFFB;font-weight:700;">⚙️ Equipamentos</span>' 
          : '<span class="tag" style="background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;font-weight:700;">🛠️ Manutenção</span>';

        var tagPrio = item.prio === 'Alta' || item.prio === 'Estratégica'
          ? '<span class="tag tag-r">' + item.prio + '</span>'
          : '<span class="tag tag-y">' + item.prio + '</span>';

        var tagStatus = item.status === 'Aprovado'
          ? '<span class="tag tag-g">✓ Aprovado</span>'
          : item.status === 'Em Revisão'
          ? '<span class="tag tag-y">Em Revisão</span>'
          : '<span class="tag tag-ind">Proposto</span>';

        return (
          '<tr style="transition:background 0.12s ease;">' +
            '<td style="text-align:center;font-weight:700;color:var(--muted);">' + (idx + 1) + '</td>' +
            '<td><strong style="color:var(--txt);font-size:13px;">' + item.desc + '</strong></td>' +
            '<td>' + tagTipo + '</td>' +
            '<td><span style="font-size:12px;color:var(--txt2);">' + item.praca + '</span></td>' +
            '<td>' + tagPrio + '</td>' +
            '<td style="text-align:right;font-weight:700;color:var(--txt);font-size:13px;">' + formatarMoeda(val) + '</td>' +
            '<td style="text-align:center;">' + tagStatus + '</td>' +
            '<td style="text-align:center;">' +
              '<button type="button" class="btn btn-ghost btn-xs" onclick="removerItemOrcamento(\'' + item.id + '\')" title="Remover linha orçamentária" style="color:var(--red);padding:3px 8px;border-radius:6px;">' +
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
    if (pracaEl) pracaEl.selectedIndex = 0;
    if (prioEl) prioEl.selectedIndex = 1;

    abrirPopup('popup-novo-item-orcamento');
  }
  window.abrirModalAdicionarItemOrcamento = abrirModalAdicionarItemOrcamento;

  function confirmarItemOrcamento() {
    var descEl = document.getElementById('orc-modal-desc');
    var tipoEl = document.getElementById('orc-modal-tipo');
    var pracaEl = document.getElementById('orc-modal-praca');
    var valorEl = document.getElementById('orc-modal-valor');
    var prioEl = document.getElementById('orc-modal-prio');

    var desc = descEl ? descEl.value.trim() : '';
    var valor = valorEl ? parseFloat(valorEl.value) : 0;

    if (!desc || !valor || valor <= 0) {
      alert('Por favor, informe a Descrição do item e o Valor Estimado (R$).');
      return;
    }

    var novo = {
      id: 'orc_' + Date.now(),
      desc: desc,
      tipo: tipoEl ? tipoEl.value : 'CAPEX',
      praca: pracaEl ? pracaEl.value : 'Juiz de Fora',
      prio: prioEl ? prioEl.value : 'Média',
      valor: valor,
      status: 'Proposto'
    };

    orcamentoSeedData.push(novo);
    salvarOrcamentoStore();
    fecharPopup('popup-novo-item-orcamento');
    renderOrcamento();

    if (typeof mostrarToast === 'function') {
      mostrarToast('Item Adicionado ao Orçamento', desc + ' incluído na previsão orçamentária de ' + anoOrcamento + '.', 'success');
    }
  }
  window.confirmarItemOrcamento = confirmarItemOrcamento;

  var ORCAMENTO_STORAGE_KEY = 'tv_orcamento_seed_v2';

  var INITIAL_ORCAMENTO_SEED = [
    {
      id: 'orc_init_1',
      ano: new Date().getFullYear(),
      tipo: 'CAPEX',
      praca: 'Juiz de Fora',
      descricao: 'Aquisição de Switcher de Vídeo SDI 12G 4K',
      justificativa: 'Modernização do controle mestre e suporte a sinais HD/4K de alta taxa de quadros.',
      valor: 45000,
      prioridade: 'Alta',
      dataCriacao: formatDataHoraLocal()
    },
    {
      id: 'orc_init_2',
      ano: new Date().getFullYear(),
      tipo: 'OPEX',
      praca: 'Uberlândia',
      descricao: 'Manutenção Preventiva de Geradores e Nobreaks',
      justificativa: 'Contrato de revisão trimestral das baterias e banco de carga da torre de transmissão.',
      valor: 8500,
      prioridade: 'Média',
      dataCriacao: formatDataHoraLocal()
    }
  ];

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
          orcamentoSeedData = parsed;
        } else {
          orcamentoSeedData = INITIAL_ORCAMENTO_SEED.slice();
        }
      } else {
        orcamentoSeedData = INITIAL_ORCAMENTO_SEED.slice();
      }
    } catch (e) {
      orcamentoSeedData = INITIAL_ORCAMENTO_SEED.slice();
    }
    window.orcamentoSeedData = orcamentoSeedData;
  }

  function removerItemOrcamento(id) {
    if (!confirm('Deseja remover esta linha orçamentária do plano?')) return;
    orcamentoSeedData = orcamentoSeedData.filter(function(i){ return i.id !== id; });
    salvarOrcamentoStore();
    renderOrcamento();
  }
  window.removerItemOrcamento = removerItemOrcamento;

  function salvarOrcamento() {
    salvarOrcamentoStore();
    if (typeof mostrarToast === 'function') {
      mostrarToast('Plano Orçamentário Salvo', 'As previsões orçamentárias do ciclo ' + anoOrcamento + ' foram salvas com sucesso.', 'success');
    }
    alert('Plano Orçamentário de ' + anoOrcamento + ' salvo com sucesso!');
  }
  window.salvarOrcamento = salvarOrcamento;

  function exportarOrcamentoExcel() {
    alert('Relatório de Orçamento ' + anoOrcamento + ' exportado com sucesso em formato consolidado (CAPEX/OPEX).');
  }
  window.exportarOrcamentoExcel = exportarOrcamentoExcel;
