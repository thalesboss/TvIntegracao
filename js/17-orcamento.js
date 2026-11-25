(function (window, document, TVApp) {
  'use strict';

  TVApp.registerModule('orcamento', function (app) {
    var KEYS           = app.KEYS;
    var Security       = app.Security;
    var Storage        = app.Storage;
    var EventBus       = app.EventBus;
    var Session        = app.Session;
    var Store          = app.Store;
    var escapeHTML     = Security.escapeHTML;
    var escapeJSString = Security.escapeJSString;
    var sanitizeIdAttr = Security.sanitizeIdAttr;

    var anoOrcamento = new Date().getFullYear() + 1;
    var filtroOrcamentoAtivo = 'todos';

    function syncAnoOrcamentoUI() {
      anoOrcamento = new Date().getFullYear() + 1;
      document.querySelectorAll('.orc-ano-display, .sidebar-orc-ano').forEach(function (el) {
        el.textContent = anoOrcamento;
      });
    }

    function filtrarOrcamentoTipo(tipo, btn) {
      filtroOrcamentoAtivo = tipo || 'todos';
      if (btn && btn.closest('.pills')) {
        btn.closest('.pills').querySelectorAll('.pill').forEach(function (p) { p.classList.remove('on'); });
        btn.classList.add('on');
      }
      renderOrcamento();
    }
    window.filtrarOrcamentoTipo = filtrarOrcamentoTipo;

    function formatarMoeda(val) {
      return 'R$ ' + Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function limparTextoOrcamento(val, fallback) {
      if (!val || typeof val !== 'string') return fallback || '';
      var trimmed = val.trim();
      if (!trimmed || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
        return fallback || '';
      }
      return trimmed;
    }

    function limparTipo(tipo) {
      return (tipo && String(tipo).trim().toUpperCase() === 'OPEX') ? 'OPEX' : 'CAPEX';
    }

    function normalizarItemOrcamento(raw) {
      var d = limparTextoOrcamento(raw.desc || raw.descricao, 'Item sem descrição');
      var p = limparTextoOrcamento(raw.prio || raw.prioridade, 'Média');
      return {
        id: raw.id,
        ano: raw.ano || anoOrcamento,
        desc: d,
        descricao: d,
        tipo: limparTipo(raw.tipo),
        praca: limparTextoOrcamento(raw.praca, 'Juiz de Fora'),
        prio: p,
        prioridade: p,
        valor: Number(raw.valor) || 0,
        justificativa: limparTextoOrcamento(raw.justificativa, ''),
        status: limparTextoOrcamento(raw.status, 'Proposto'),
        criado_por: raw.criado_por || 'Sistema'
      };
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
      var pracaAtiva = (typeof window.getPracaAtual === 'function') ? window.getPracaAtual() : 'Juiz de Fora';
      var isUberlandia = pracaAtiva.indexOf('Uber') !== -1;
      var itemPraca = item.praca || '';
      return isUberlandia ? (itemPraca.indexOf('Uber') !== -1) : (!itemPraca || itemPraca.indexOf('Juiz') !== -1);
    }
    window.pertenceAPracaAtivaOrcamento = pertenceAPracaAtivaOrcamento;

    function renderOrcamento() {
      syncAnoOrcamentoUI();
      var tbody = document.getElementById('orc-itens-tbody');
      if (!tbody) return;
      if (!Array.isArray(Store.orcamentoSeedData)) Store.orcamentoSeedData = [];
      var itensDaPraca = Store.orcamentoSeedData.filter(pertenceAPracaAtivaOrcamento);
      var totalGeral = 0, totalCapex = 0, totalOpex = 0;
      itensDaPraca.forEach(function (item) {
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

      var countCapex = itensDaPraca.filter(function (i) { return i.tipo === 'CAPEX'; }).length;
      var countOpex = itensDaPraca.filter(function (i) { return i.tipo === 'OPEX'; }).length;
      var tabTodos = document.getElementById('orc-tab-todos');
      var tabCapex = document.getElementById('orc-tab-capex');
      var tabOpex = document.getElementById('orc-tab-opex');
      if (tabTodos) tabTodos.textContent = 'Todas as Linhas (' + itensDaPraca.length + ')';
      if (tabCapex) tabCapex.textContent = 'Equipamentos (' + countCapex + ')';
      if (tabOpex) tabOpex.textContent = 'Manutenção (' + countOpex + ')';

      var itensExibir = itensDaPraca.filter(function (item) {
        if (filtroOrcamentoAtivo === 'CAPEX') return item.tipo === 'CAPEX';
        if (filtroOrcamentoAtivo === 'OPEX') return item.tipo === 'OPEX';
        return true;
      });
      if (itensExibir.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px 12px;font-size:12.5px;">' +
          '<i data-lucide="inbox" style="width:24px;height:24px;stroke-width:1.5;margin-bottom:6px;color:var(--dim);"></i><br/>' +
          (Store.orcamentoSeedData.length === 0
            ? 'Nenhuma linha orçamentária cadastrada ainda. Clique em <strong>"+ Propor Orçamento"</strong> para iniciar.'
            : 'Nenhum item orçamentário encontrado nesta categoria.') +
          '</td></tr>';
      } else {
        tbody.innerHTML = itensExibir.map(function (rawItem, idx) {
          var item = normalizarItemOrcamento(rawItem);
          var tagTipo = item.tipo === 'CAPEX'
            ? '<span class="tag" style="background:#E8F2FF;color:#0071E3;border:1px solid #C7DFFB;font-weight:700;">⚙️ Equipamentos</span>'
            : '<span class="tag" style="background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;font-weight:700;">🛠️ Manutenção</span>';
          var tagPrio = (item.prio === 'Alta' || item.prio === 'Estratégica')
            ? '<span class="tag tag-r">' + escapeHTML(item.prio) + '</span>'
            : '<span class="tag tag-y">' + escapeHTML(item.prio) + '</span>';
          var tagStatus = item.status === 'Aprovado'
            ? '<span class="tag tag-g">✓ Aprovado</span>'
            : item.status === 'Em Revisão'
            ? '<span class="tag tag-y">Em Revisão</span>'
            : item.status === 'Rejeitado'
            ? '<span class="tag tag-r">Rejeitado</span>'
            : '<span class="tag tag-ind">Proposto</span>';
          var safeOrcId = escapeJSString(sanitizeIdAttr(item.id));
          return (
            '<tr style="transition:background 0.12s ease;cursor:pointer;" onclick="abrirDetalhesItemOrcamento(\'' + safeOrcId + '\')" title="Clique para ver detalhes, editar ou excluir">' +
              '<td style="text-align:center;font-weight:700;color:var(--muted);">' + (idx + 1) + '</td>' +
              '<td><strong style="color:var(--txt);font-size:13px;">' + escapeHTML(item.desc) + '</strong></td>' +
              '<td>' + tagTipo + '</td>' +
              '<td><span style="font-size:12px;color:var(--txt2);">' + escapeHTML(item.praca) + '</span></td>' +
              '<td>' + tagPrio + '</td>' +
              '<td style="text-align:right;font-weight:700;color:var(--txt);font-size:13px;">' + formatarMoeda(item.valor) + '</td>' +
              '<td style="text-align:center;">' + tagStatus + '</td>' +
              '<td style="text-align:center;" onclick="event.stopPropagation();">' +
                '<button type="button" class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); removerItemOrcamento(\'' + safeOrcId + '\')" title="Remover linha orçamentária" style="color:var(--red);padding:3px 8px;border-radius:6px;">' +
                  '<i data-lucide="trash-2" style="width:12px;height:12px;stroke-width:2;"></i>' +
                '</button>' +
              '</td>' +
            '</tr>'
          );
        }).join('');
      }
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
    }
    window.renderOrcamento = renderOrcamento;

    /* Exportação CSV/Excel UTF-8 com BOM nativamente compatível com Microsoft Excel */
    function exportarOrcamentoExcel() {
      syncAnoOrcamentoUI();
      var pracaAtiva = (typeof window.getPracaAtual === 'function') ? window.getPracaAtual() : 'Juiz de Fora';
      var itens = (Store.orcamentoSeedData || []).filter(pertenceAPracaAtivaOrcamento);
      if (itens.length === 0) {
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Sem Dados para Exportar', 'Não há linhas orçamentárias cadastradas para ' + pracaAtiva + '.', 'warning');
        }
        return;
      }
      var escapeCsvCell = function (v) {
        var s = String(v === null || v === undefined ? '' : v).replace(/\r?\n/g, ' ').trim();
        /* Previne CSV Formula Injection no Excel (=, +, -, @) */
        if (/^[=+\-@]/.test(s)) s = "'" + s;
        return '"' + s.replace(/"/g, '""') + '"';
      };
      var linhasCsv = [
        ['#', 'Ano', 'Descrição / Projeto', 'Classificação', 'Praça', 'Prioridade', 'Valor Previsto (R$)', 'Status', 'Autor', 'Justificativa'].map(escapeCsvCell).join(';')
      ];
      itens.forEach(function (raw, idx) {
        var it = normalizarItemOrcamento(raw);
        linhasCsv.push([
          idx + 1,
          it.ano,
          it.desc,
          it.tipo,
          it.praca,
          it.prio,
          it.valor.toFixed(2).replace('.', ','),
          it.status,
          it.criado_por,
          it.justificativa
        ].map(escapeCsvCell).join(';'));
      });
      var csvContent = '\uFEFF' + linhasCsv.join('\r\n');
      var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var slugPraca = pracaAtiva.indexOf('Uber') !== -1 ? 'UDI' : 'JF';
      a.href = url;
      a.download = 'Orcamento_' + anoOrcamento + '_' + slugPraca + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Relatório Exportado', 'Planilha de orçamento ' + anoOrcamento + ' baixada com sucesso.', 'success');
      }
    }
    window.exportarOrcamentoExcel = exportarOrcamentoExcel;

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
      if (pracaEl) pracaEl.value = (typeof window.getPracaAtual === 'function') ? window.getPracaAtual() : 'Juiz de Fora';
      if (prioEl) prioEl.selectedIndex = 1;
      atualizarFmtValorNovoOrcamento(0);
      window.abrirPopup('popup-novo-item-orcamento');
      if (descEl) setTimeout(function () { descEl.focus(); }, 150);
    }
    window.abrirModalAdicionarItemOrcamento = abrirModalAdicionarItemOrcamento;

    function confirmarItemOrcamento() {
      var descEl = document.getElementById('orc-modal-desc');
      var tipoEl = document.getElementById('orc-modal-tipo');
      var pracaEl = document.getElementById('orc-modal-praca');
      var valorEl = document.getElementById('orc-modal-valor');
      var prioEl = document.getElementById('orc-modal-prio');
      var justEl = document.getElementById('orc-modal-just');
      var desc = limparTextoOrcamento(descEl ? descEl.value : '', '');
      var valor = valorEl ? parseFloat(valorEl.value) : 0;
      if (!desc || isNaN(valor) || valor <= 0) {
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Campos Obrigatórios', 'Por favor, informe a Descrição do item e o Valor Estimado (R$).', 'warning');
        }
        return;
      }
      var prio = limparTextoOrcamento(prioEl ? prioEl.value : '', 'Média');
      var novo = normalizarItemOrcamento({
        id: 'orc_' + Date.now(),
        ano: anoOrcamento,
        desc: desc,
        tipo: tipoEl ? tipoEl.value : 'CAPEX',
        praca: pracaEl ? pracaEl.value : 'Juiz de Fora',
        prio: prio,
        valor: valor,
        justificativa: justEl ? justEl.value : '',
        status: 'Proposto',
        criado_por: Session.getUserName()
      });
      Store.orcamentoSeedData.push(novo);
      salvarOrcamentoStore();
      window.fecharPopup('popup-novo-item-orcamento');
      renderOrcamento();
      salvarItemOrcamentoNuvem(novo);
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Item Adicionado ao Orçamento', desc + ' gravado no banco de dados para ' + anoOrcamento + '.', 'success');
      }
    }
    window.confirmarItemOrcamento = confirmarItemOrcamento;

    function abrirDetalhesItemOrcamento(id) {
      var item = (Store.orcamentoSeedData || []).find(function (i) { return i && i.id === id; });
      if (!item) return;
      var norm = normalizarItemOrcamento(item);
      Object.assign(item, norm);
      var setV = function (elId, v) {
        var el = document.getElementById(elId);
        if (el) el.value = v;
      };
      setV('orc-det-id', norm.id);
      setV('orc-det-desc', norm.desc);
      setV('orc-det-tipo', norm.tipo);
      setV('orc-det-praca', norm.praca);
      setV('orc-det-valor', norm.valor);
      setV('orc-det-prio', norm.prio);
      setV('orc-det-status', norm.status);
      setV('orc-det-just', norm.justificativa);
      atualizarFmtValorOrcamento(norm.valor);
      window.abrirPopup('popup-detalhes-orcamento');
      var descEl = document.getElementById('orc-det-desc');
      if (descEl) setTimeout(function () { descEl.focus(); }, 150);
    }
    window.abrirDetalhesItemOrcamento = abrirDetalhesItemOrcamento;

    function salvarEdicaoItemOrcamento() {
      var idEl = document.getElementById('orc-det-id');
      if (!idEl || !idEl.value) return;
      var id = idEl.value;
      var item = (Store.orcamentoSeedData || []).find(function (i) { return i && i.id === id; });
      if (!item) return;

      var descEl = document.getElementById('orc-det-desc');
      var tipoEl = document.getElementById('orc-det-tipo');
      var pracaEl = document.getElementById('orc-det-praca');
      var valorEl = document.getElementById('orc-det-valor');
      var prioEl = document.getElementById('orc-det-prio');
      var statusEl = document.getElementById('orc-det-status');
      var justEl = document.getElementById('orc-det-just');

      var desc = limparTextoOrcamento(descEl ? descEl.value : '', '');
      var valor = valorEl ? parseFloat(valorEl.value) : 0;
      if (!desc || isNaN(valor) || valor <= 0) {
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Dados Inválidos', 'Por favor, informe uma descrição válida e um valor maior que zero.', 'warning');
        }
        return;
      }
      var novoStatus = limparTextoOrcamento(statusEl ? statusEl.value : '', 'Proposto');
      /* Exige permissão de Gestor ou TI/ADM para aprovar ou rejeitar orçamentos */
      if (novoStatus !== item.status && (novoStatus === 'Aprovado' || novoStatus === 'Rejeitado')) {
        if (!Session.hasRole(['TI/ADM', 'Gestor'], 'aprovar ou rejeitar orçamento')) return;
      }

      Object.assign(item, normalizarItemOrcamento({
        id: item.id,
        ano: item.ano || anoOrcamento,
        desc: desc,
        tipo: tipoEl ? tipoEl.value : 'CAPEX',
        praca: pracaEl ? pracaEl.value : 'Juiz de Fora',
        valor: valor,
        prio: prioEl ? prioEl.value : 'Média',
        status: novoStatus,
        justificativa: justEl ? justEl.value : '',
        criado_por: item.criado_por
      }));
      salvarOrcamentoStore();
      window.fecharPopup('popup-detalhes-orcamento');
      renderOrcamento();
      salvarItemOrcamentoNuvem(item);
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Orçamento Atualizado', 'A linha orçamentária foi atualizada com sucesso no banco de dados.', 'success');
      }
    }
    window.salvarEdicaoItemOrcamento = salvarEdicaoItemOrcamento;

    function excluirItemOrcamentoModal() {
      if (!Session.hasRole(['TI/ADM', 'Gestor'], 'excluir linha orçamentária')) return;
      var idEl = document.getElementById('orc-det-id');
      if (!idEl || !idEl.value) return;
      var id = idEl.value;
      if (!window.confirm('Deseja realmente excluir esta linha orçamentária do plano? Essa ação removerá o registro do banco de dados.')) {
        return;
      }
      window.fecharPopup('popup-detalhes-orcamento');
      Store.orcamentoSeedData = (Store.orcamentoSeedData || []).filter(function (i) { return i.id !== id; });
      salvarOrcamentoStore();
      renderOrcamento();
      excluirItemOrcamentoNuvem(id);
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Item Excluído', 'Linha orçamentária removida do banco de dados.', 'info');
      }
    }
    window.excluirItemOrcamentoModal = excluirItemOrcamentoModal;

    function removerItemOrcamento(id) {
      if (!Session.hasRole(['TI/ADM', 'Gestor'], 'remover linha orçamentária')) return;
      if (!window.confirm('Deseja remover esta linha orçamentária do plano?')) return;
      Store.orcamentoSeedData = (Store.orcamentoSeedData || []).filter(function (i) { return i.id !== id; });
      salvarOrcamentoStore();
      renderOrcamento();
      excluirItemOrcamentoNuvem(id);
    }
    window.removerItemOrcamento = removerItemOrcamento;

    function salvarOrcamentoStore() {
      Storage.setJSON(KEYS.ORCAMENTO_CACHE, Store.orcamentoSeedData);
    }

    function carregarOrcamentoStore() {
      var parsed = Storage.getJSON(KEYS.ORCAMENTO_CACHE, []);
      Store.orcamentoSeedData = Array.isArray(parsed) ? parsed.map(normalizarItemOrcamento) : [];
      renderOrcamento();
      sincronizarOrcamentoNuvem();
    }
    window.carregarOrcamentoStore = carregarOrcamentoStore;

    function sincronizarOrcamentoNuvem() {
      if (!window.DBService) return;
      window.DBService.select('orcamentos', 'select=*&order=id.asc')
        .then(function (res) {
          if (!res.ok || !Array.isArray(res.data)) return;
          var cloudIds = {};
          var formatadosDaNuvem = res.data.map(function (c) {
            cloudIds[c.id] = true;
            return normalizarItemOrcamento(c);
          });
          var locaisPendentes = (Store.orcamentoSeedData || []).filter(function (loc) {
            return loc && loc.id && !cloudIds[loc.id];
          });
          locaisPendentes.forEach(salvarItemOrcamentoNuvem);
          Store.orcamentoSeedData = formatadosDaNuvem.concat(locaisPendentes);
          salvarOrcamentoStore();
          renderOrcamento();
        })
        .catch(function (err) {
          console.warn('[Orçamento DB] Erro ao sincronizar orçamentos do banco:', err);
        });
    }
    window.sincronizarOrcamentoNuvem = sincronizarOrcamentoNuvem;
    EventBus.on('cloud:sync', sincronizarOrcamentoNuvem);

    function salvarItemOrcamentoNuvem(item) {
      if (!item || !window.DBService) return;
      var payload = normalizarItemOrcamento(item);
      window.DBService.upsert('orcamentos', payload).then(function (res) {
        if (res && !res.ok && res.status !== 0) {
          console.error('[Orçamento DB] Erro Supabase ao gravar orçamento:', res.status);
        }
      }).catch(function (err) {
        console.error('[Orçamento DB] Falha ao enviar orçamento para o banco:', err);
      });
    }
    window.salvarItemOrcamentoNuvem = salvarItemOrcamentoNuvem;

    function excluirItemOrcamentoNuvem(id) {
      if (!id || !window.DBService) return;
      window.DBService.remove('orcamentos', 'id=eq.' + encodeURIComponent(id)).catch(function (err) {
        console.error('[Orçamento DB] Falha ao excluir item do banco:', err);
      });
    }
    window.excluirItemOrcamentoNuvem = excluirItemOrcamentoNuvem;

    function salvarOrcamento() {
      salvarOrcamentoStore();
      (Store.orcamentoSeedData || []).forEach(salvarItemOrcamentoNuvem);
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Plano Orçamentário Salvo', 'Previsões orçamentárias de ' + anoOrcamento + ' sincronizadas com o banco de dados.', 'success');
      }
    }
    window.salvarOrcamento = salvarOrcamento;
  });
})(window, document, window.TVApp);
