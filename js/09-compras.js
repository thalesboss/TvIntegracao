(function (window, document, TVApp) {
  'use strict';

  TVApp.registerModule('compras', function (app) {
    var Storage = app.Storage;
    var Session = app.Session;
    var Store   = app.Store;
    var DRAFT_KEY = 'tv_compras_rascunho_v1';

    function adicionarLinhaItemCompra() {
      var tbody = document.getElementById('req-itens-tbody');
      if (!tbody) return;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td style="text-align:center;"><input type="number" class="item-quant" min="1" value="" placeholder="" style="text-align:center;font-weight:600;width:55px;" /></td>' +
        '<td><input type="text" class="item-desc" placeholder="Ex: Descrição do material..." /></td>' +
        '<td><input type="text" class="item-cod" placeholder="Código ex: P4-120" /></td>' +
        '<td><input type="text" class="item-fab" placeholder="Marca ou fabricante" /></td>' +
        '<td><input type="url" class="item-link" placeholder="https://link-do-produto.com..." /></td>' +
        '<td style="text-align:center;">' +
          '<button type="button" class="btn btn-ghost btn-xs" onclick="removerLinhaItemCompra(this)" title="Remover item" style="color:var(--red);padding:3px 6px;display:inline-flex;align-items:center;justify-content:center;">' +
            '<i data-lucide="trash-2" style="width:13px;height:13px;stroke-width:2;"></i>' +
          '</button>' +
        '</td>';
      tbody.appendChild(tr);
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
    }
    window.adicionarLinhaItemCompra = adicionarLinhaItemCompra;

    function removerLinhaItemCompra(btn) {
      var tr = btn && btn.closest ? btn.closest('tr') : null;
      if (tr) tr.remove();
      salvarRascunhoCompra(true);
    }
    window.removerLinhaItemCompra = removerLinhaItemCompra;

    function getVal(id) {
      var el = document.getElementById(id);
      return el ? el.value : '';
    }

    function salvarRascunhoCompra(silencioso) {
      var itens = [];
      var tbody = document.getElementById('req-itens-tbody');
      if (tbody) {
        tbody.querySelectorAll('tr').forEach(function (tr) {
          var qEl = tr.querySelector('.item-quant');
          var dEl = tr.querySelector('.item-desc');
          var cEl = tr.querySelector('.item-cod');
          var fEl = tr.querySelector('.item-fab');
          var lEl = tr.querySelector('.item-link');
          var quant = qEl ? qEl.value : '';
          var desc  = dEl ? dEl.value : '';
          var cod   = cEl ? cEl.value : '';
          var fab   = fEl ? fEl.value : '';
          var link  = lEl ? lEl.value : '';
          if (quant || desc || cod || fab || link) {
            itens.push({ quant: quant, desc: desc, cod: cod, fab: fab, link: link });
          }
        });
      }
      var dados = {
        praca:       getVal('req-praca'),
        carater:     getVal('req-carater'),
        solicitante: getVal('req-solicitante'),
        motivo:      getVal('req-motivo'),
        destino:     getVal('req-destino'),
        centro:      getVal('req-centrocusto'),
        projeto:     getVal('req-projeto'),
        itens:       itens
      };
      Storage.setJSON(DRAFT_KEY, dados);
      if (!silencioso && typeof window.mostrarToast === 'function') {
        window.mostrarToast('Rascunho Salvo', 'Dados de compras salvos com sucesso.', 'info');
      }
    }
    window.salvarRascunhoCompra = salvarRascunhoCompra;

    function carregarRascunhoCompra() {
      var dados = Storage.getJSON(DRAFT_KEY, null);
      if (!dados) return;
      var mapFields = {
        'req-praca':       dados.praca,
        'req-carater':     dados.carater,
        'req-solicitante': dados.solicitante,
        'req-motivo':      dados.motivo,
        'req-destino':     dados.destino,
        'req-centrocusto': dados.centro,
        'req-projeto':     dados.projeto
      };
      Object.keys(mapFields).forEach(function (id) {
        var el = document.getElementById(id);
        if (el && mapFields[id] !== undefined) el.value = mapFields[id];
      });
      if (Array.isArray(dados.itens) && dados.itens.length > 0) {
        var tbody = document.getElementById('req-itens-tbody');
        if (tbody) {
          tbody.innerHTML = '';
          dados.itens.forEach(function (item) {
            adicionarLinhaItemCompra();
            var lastRow = tbody.lastElementChild;
            if (lastRow) {
              var qEl = lastRow.querySelector('.item-quant');
              var dEl = lastRow.querySelector('.item-desc');
              var cEl = lastRow.querySelector('.item-cod');
              var fEl = lastRow.querySelector('.item-fab');
              var lEl = lastRow.querySelector('.item-link');
              if (qEl && item.quant !== undefined) qEl.value = item.quant;
              if (dEl && item.desc !== undefined)  dEl.value = item.desc;
              if (cEl && item.cod !== undefined)   cEl.value = item.cod;
              if (fEl && item.fab !== undefined)   fEl.value = item.fab;
              if (lEl && item.link !== undefined)  lEl.value = item.link;
            }
          });
        }
      }
    }
    window.carregarRascunhoCompra = carregarRascunhoCompra;

    function limparFormularioCompras(confirmar) {
      if (confirmar && !window.confirm('Deseja realmente limpar a requisição de compras?')) return;
      Storage.remove(DRAFT_KEY);
      Store.uploadedFilesStore['req-previews'] = [];
      var page = document.getElementById('page-compras-vendas');
      if (page) {
        page.querySelectorAll('input:not([type="radio"]), textarea').forEach(function (el) { el.value = ''; });
        page.querySelectorAll('select').forEach(function (el) { el.selectedIndex = 0; });
        var prev = document.getElementById('req-previews');
        if (prev) prev.innerHTML = '';
        var tbody = document.getElementById('req-itens-tbody');
        if (tbody) {
          tbody.innerHTML = '';
          adicionarLinhaItemCompra();
        }
        var pEl = document.getElementById('req-praca');
        if (pEl && typeof window.getPracaAtual === 'function') pEl.value = window.getPracaAtual();
        var sEl = document.getElementById('req-solicitante');
        if (sEl) sEl.value = Session.getUserName();
      }
      if (confirmar && typeof window.mostrarToast === 'function') {
        window.mostrarToast('Formulário Limpo', 'Campos de compras zerados.', 'info');
      }
    }
    window.limparFormularioCompras = limparFormularioCompras;

    function enviarRequisicaoCompra() {
      var nowStr = window.formatDataHoraLocal();
      var praca       = getVal('req-praca') || 'Juiz de Fora';
      var carater     = getVal('req-carater') || 'Normal';
      var solicitante = getVal('req-solicitante').trim() || Session.getUserName();
      var motivo      = getVal('req-motivo').trim();
      var destino     = getVal('req-destino').trim();
      var centro      = getVal('req-centrocusto') || 'Manutenção Técnica - JF';
      var projeto     = getVal('req-projeto').trim() || 'Padrão';

      if (!motivo || !destino) {
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Campos Obrigatórios', 'Por favor, preencha a Justificativa/Motivo e o Uso a que se destina antes de enviar.', 'warning');
        }
        return;
      }

      var tbody = document.getElementById('req-itens-tbody');
      var linhas = tbody ? tbody.querySelectorAll('tr') : [];
      var itensResumo = [];
      var erroValidacao = false;
      linhas.forEach(function (tr) {
        var qInput = tr.querySelector('.item-quant');
        var dInput = tr.querySelector('.item-desc');
        var q = qInput ? qInput.value.trim() : '';
        var d = dInput ? dInput.value.trim() : '';
        var c = tr.querySelector('.item-cod') ? tr.querySelector('.item-cod').value.trim() : '';
        var f = tr.querySelector('.item-fab') ? tr.querySelector('.item-fab').value.trim() : '';
        var lRaw = tr.querySelector('.item-link') ? tr.querySelector('.item-link').value.trim() : '';
        var l = lRaw ? app.Security.sanitizeExternalUrl(lRaw) : '';
        if (d || c || f || lRaw || q) {
          if (!q || parseInt(q, 10) <= 0 || isNaN(parseInt(q, 10))) {
            erroValidacao = true;
            if (qInput) {
              qInput.style.borderColor = '#EF4444';
              qInput.focus();
            }
          } else {
            if (qInput) qInput.style.borderColor = '';
            itensResumo.push(q + 'x ' + (d || 'Item') + (c ? (' [Cód: ' + c + ']') : '') + (f ? (' (' + f + ')') : '') + (l ? (' [' + l + ']') : ''));
          }
        }
      });

      if (erroValidacao) {
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Quantidade Obrigatória', 'Por favor, informe uma quantidade válida (número maior que 0) para o material solicitado.', 'warning');
        }
        return;
      }

      var anexosCompra = (Store.uploadedFilesStore['req-previews'] || []).map(function (a) {
        return {
          id: a.id || ('med_' + Date.now()),
          name: a.name || 'Proposta Anexa',
          type: a.type || '',
          size: a.size || 0,
          dataUrl: a.dataUrl || a.url || ''
        };
      }).filter(function (a) { return !!a.dataUrl; });

      var titulo = 'Requisição de Compra — ' + praca + ' (' + carater + ')';
      var descCompleta = 'Justificativa: ' + motivo + '\n' +
                         'Itens: ' + (itensResumo.length > 0 ? itensResumo.join('; ') : 'Material/Equipamento solicitado') + '\n' +
                         'Aplicação: ' + destino + ' | Centro de Custo: ' + centro + ' | Projeto: ' + projeto;
      var novoHist = {
        id:            'h_req_' + Date.now(),
        tipo:          'compra',
        subtipo:       'Requisição de Compra (' + carater + ')',
        titulo:        titulo,
        equipamento:   itensResumo[0] || 'Materiais de Compra',
        categoria:     centro || 'Compras / Vendas',
        local:         praca,
        dataCriacao:   nowStr,
        criadoPor:     solicitante,
        descCriacao:   descCompleta,
        status:        'Aguardando Aprovação',
        dataResolucao: 'Encaminhado para a chefia',
        resolvidoPor:  'Chefia / Setor de Compras',
        descResolucao: 'Solicitação registrada no sistema. Aguardando validação do chefe imediato para envio à gerência e compras.',
        anexos:        anexosCompra,
        praca:         praca
      };
      Store.historicoSeedData = [novoHist].concat(Store.historicoSeedData);
      window.saveHistorico(Store.historicoSeedData, novoHist);
      limparFormularioCompras(false);
      window.renderAll(true);
      if (typeof window.adicionarNotificacao === 'function') {
        window.adicionarNotificacao('Requisição de Compra Enviada', titulo + ' cadastrada para aprovação.', 'success');
      }
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Requisição Cadastrada', 'Requisição cadastrada no Histórico!', 'success');
      }
    }
    window.enviarRequisicaoCompra = enviarRequisicaoCompra;

    if (typeof window.registrarAutosaveListener === 'function') {
      window.registrarAutosaveListener('page-compras-vendas', salvarRascunhoCompra);
    }
  });
})(window, document, window.TVApp);
