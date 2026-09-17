  /* ═══════════════════════════════════════════
     HISTÓRICO GERAL — ESTRUTURA DE DADOS
  ═══════════════════════════════════════════ */

  var HISTORICO_LOCAL_STORAGE_KEY = 'tv_historico_seed_v2';
  var historicoSeedData = [];

  try {
    var rawHist = localStorage.getItem(HISTORICO_LOCAL_STORAGE_KEY);
    if (rawHist) {
      var pHist = JSON.parse(rawHist);
      if (Array.isArray(pHist) && pHist.length > 0) historicoSeedData = pHist;
    }
  } catch(e) {}
  window.historicoSeedData = historicoSeedData;

  function saveHistorico(list, itemAdicionado) {
    historicoSeedData = list || [];
    window.historicoSeedData = historicoSeedData;
    try {
      localStorage.setItem(HISTORICO_LOCAL_STORAGE_KEY, JSON.stringify(historicoSeedData));
    } catch(e) {}
    if (typeof DBService !== 'undefined' && DBService) {
      if (itemAdicionado && typeof DBService.pushHistoricoItem === 'function') {
        DBService.pushHistoricoItem(itemAdicionado);
      } else if (typeof DBService.pushRemote === 'function') {
        DBService.pushRemote('historico', historicoSeedData);
      }
    }
  }

  function getHistoricoCompleto() {
    var mapa = {};
    var lista = [];
    var idsNaLixeira = (lixeiraData || []).map(function(item){ return item.id; });

    // 1. Itens manuais ou relatórios vindos de historicoSeedData
    (historicoSeedData || []).forEach(function(item) {
      if (item && item.id) {
        if (item.status === 'lixeira' || idsNaLixeira.includes(item.id)) return;
        if (typeof pertenceAPracaAtiva === 'function' && !pertenceAPracaAtiva(item)) return;
        mapa[item.id] = true;
        lista.push(item);
      }
    });

    // 2. Ocorrências resolvidas ou arquivadas vindas de ocorrencias (do dashboard/banco)
    (ocorrencias || []).forEach(function(oc) {
      if (!oc || !oc.id) return;
      if (oc.status === 'lixeira' || idsNaLixeira.includes(oc.id)) return;
      if (typeof pertenceAPracaAtiva === 'function' && !pertenceAPracaAtiva(oc)) return;
      var isResolvidaOuArquivada = (oc.status === 'resolvida' || oc.status === 'arquivada' || (oc.resolucao && oc.resolucao.statusRes));
      if (isResolvidaOuArquivada) {
        var histId = 'h_oc_' + oc.id;
        if (!mapa[oc.id] && !mapa[histId]) {
          var statusLabel = (oc.resolucao && oc.resolucao.statusRes) ? oc.resolucao.statusRes : (oc.status === 'arquivada' ? 'Resolvida e Arquivada' : 'Resolvido');
          var nowFmt = formatDataHoraLocal(oc.dataCriacao || oc.criado);
          var resFmt = (oc.resolucao && oc.resolucao.data) ? formatDataHoraLocal(oc.resolucao.data) : nowFmt;
          var resPor = (oc.resolucao && oc.resolucao.resolvidoPor) ? oc.resolucao.resolvidoPor : (oc.resp || getUsuarioAtual());
          var resDesc = (oc.resolucao && oc.resolucao.descRes) ? oc.resolucao.descRes : (oc.desc || 'Ocorrência resolvida pela equipe técnica.');
          var anexosLista = (oc.anexos && Array.isArray(oc.anexos) && oc.anexos.length > 0)
            ? oc.anexos
            : ((oc.resolucao && Array.isArray(oc.resolucao.anexos)) ? oc.resolucao.anexos : []);

          var itemOcHist = {
            id:            oc.id,
            tipo:          'ocorrencia',
            subtipo:       oc.cat || 'Equipamento',
            titulo:        oc.titulo,
            equipamento:   oc.equipamento || (oc.tags && oc.tags[1]) || '',
            categoria:     oc.cat || 'Equipamento',
            local:         oc.local || (oc.praca || 'Central Técnica'),
            dataCriacao:   nowFmt,
            criadoPor:     oc.resp || 'Sistema',
            descCriacao:   oc.desc || 'Ocorrência registrada no sistema.',
            status:        statusLabel,
            dataResolucao: resFmt,
            resolvidoPor:  resPor,
            descResolucao: resDesc,
            tags:          oc.tags || [],
            anexos:        anexosLista,
            praca:         oc.praca || (typeof getPracaAtual === 'function' ? getPracaAtual() : 'Juiz de Fora')
          };
          mapa[oc.id] = true;
          mapa[histId] = true;
          lista.push(itemOcHist);
        }
      }
    });

    // Ordena pelo mais recente
    lista.sort(function(a, b) {
      var tA = a.dataResolucao || a.dataCriacao || '';
      var tB = b.dataResolucao || b.dataCriacao || '';
      return tB.localeCompare(tA);
    });

    return lista;
  }
  window.getHistoricoCompleto = getHistoricoCompleto;

  function loadHistorico() {
    return getHistoricoCompleto();
  }

  var historicoFiltroCategoria = 'todos';
  var itemHistoricoSelecionado = null;

  function getNomeUsuarioAtual() {
    return getUsuarioAtual().toLowerCase();
  }

  function isItemDoUsuario(item) {
    var usuarioAtual = getNomeUsuarioAtual();
    var criado = (item.criadoPor || '').toLowerCase();
    var resolvido = (item.resolvidoPor || '').toLowerCase();
    return criado.includes(usuarioAtual) || resolvido.includes(usuarioAtual);
  }

  function getTagTipoBadge(item) {
    if (item.tipo === 'ocorrencia') {
      return '<span class="tag tag-blue-soft">Ocorrência</span>';
    } else if (item.tipo === 'relatorio') {
      return '<span class="tag tag-teal-soft">' + (item.subtipo || 'Relatório') + '</span>';
    } else if (item.tipo === 'recebimento') {
      return '<span class="tag tag-yellow-soft">' + (item.subtipo || 'Recebimento') + '</span>';
    }
    return '<span class="tag tag-blue-soft">Registro</span>';
  }
