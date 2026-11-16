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
  window.saveHistorico = saveHistorico;
  function getHistoricoCompleto() {
    var mapa = {};
    var lista = [];
    var idsNaLixeira = (lixeiraData || []).map(function(item){ return item.id; });
    var ocPorId = {};
    var ocPorSig = {};
    function normSigOc(titulo, desc) {
      var t = String(titulo || '').trim().toLowerCase();
      var d = String(desc || '').replace(/<!--(?:CTRS|RONDA)_JSON:[^>]+-->/g, '').trim().toLowerCase();
      return t + '||' + d;
    }
    (ocorrencias || []).forEach(function(oc) {
      if (!oc || !oc.id) return;
      if (oc.status === 'lixeira' || idsNaLixeira.includes(oc.id)) return;
      ocPorId[oc.id] = oc;
      ocPorId['h_oc_' + oc.id] = oc;
      var sig = normSigOc(oc.titulo, oc.desc);
      if (!ocPorSig[sig]) ocPorSig[sig] = [];
      ocPorSig[sig].push(oc);
    });
    function mesclarOcNoItemHist(item, oc) {
      if (!oc) return item;
      var res = oc.resolucao || {};
      var statusMerged = item.status || 'Resolvido';
      if (oc.status === 'arquivada') {
        statusMerged = 'Em Observação';
      } else if (oc.status === 'aberta') {
        if ((Array.isArray(res.reincidencias) && res.reincidencias.length > 0) || (Array.isArray(oc.tags) && oc.tags.indexOf('Reincidente') !== -1)) {
          statusMerged = 'Reaberta (Reincidente)';
        } else if (Array.isArray(oc.tags) && oc.tags.indexOf('Parcialmente Resolvida') !== -1) {
          statusMerged = 'Parcialmente resolvido';
        } else if (res.statusRes) {
          statusMerged = res.statusRes;
        }
      } else if (res.statusRes) {
        statusMerged = res.statusRes;
      }
      var resFmt = res.data ? formatDataHoraLocal(res.data) : (item.dataResolucao || '');
      return Object.assign({}, item, {
        ocId:                    oc.id,
        titulo:                  oc.titulo || item.titulo,
        descCriacao:             oc.desc || item.descCriacao,
        status:                  statusMerged,
        dataResolucao:           resFmt,
        resolvidoPor:            res.resolvidoPor || item.resolvidoPor,
        descResolucao:           res.descRes || item.descResolucao,
        tags:                    Array.isArray(oc.tags) ? oc.tags : (item.tags || []),
        historicoEdicoes:        oc.historicoEdicoes || res.historicoEdicoes || item.historicoEdicoes || [],
        validacoesTurno:         Array.isArray(res.validacoesTurno) ? res.validacoesTurno : (item.validacoesTurno || []),
        metaHorasObservacao:     res.metaHorasObservacao || item.metaHorasObservacao || 24,
        inicioObservacao:        res.inicioObservacao || item.inicioObservacao || null,
        concluidoObservacaoPor:  res.concluidoObservacaoPor || item.concluidoObservacaoPor || '',
        concluidoObservacaoEm:   res.concluidoObservacaoEm || item.concluidoObservacaoEm || '',
        reincidencias:           Array.isArray(res.reincidencias) ? res.reincidencias : (item.reincidencias || [])
      });
    }
    (historicoSeedData || []).forEach(function(item) {
      if (!item || !item.id) return;
      if (item.status === 'lixeira' || idsNaLixeira.includes(item.id)) return;
      if (item.ocId && (idsNaLixeira.includes(item.ocId))) return;
      if (typeof pertenceAPracaAtiva === 'function' && !pertenceAPracaAtiva(item)) return;
      var ocMatch = null;
      if (item.tipo === 'ocorrencia') {
        var cleanId = String(item.id).replace(/^h_oc_/, '');
        ocMatch = (item.ocId && ocPorId[item.ocId]) || ocPorId[item.id] || ocPorId[cleanId] || null;
        if (!ocMatch && /^h_oc_\d+$/.test(String(item.id))) {
          var candidatos = ocPorSig[normSigOc(item.titulo, item.descCriacao)];
          if (candidatos && candidatos.length > 0) {
            ocMatch = candidatos.find(function(c) {
              var resC = (c.resolucao && c.resolucao.descRes) ? String(c.resolucao.descRes).trim() : '';
              return !item.descResolucao || !resC || resC === String(item.descResolucao).trim();
            }) || candidatos[0];
          }
        }
      }
      var canonKey = ocMatch ? ('oc:' + ocMatch.id) : (item.ocId ? ('oc:' + item.ocId) : null);
      if (mapa[item.id] || (canonKey && mapa[canonKey])) return;
      if (ocMatch && typeof pertenceAPracaAtiva === 'function' && !pertenceAPracaAtiva(ocMatch)) return;
      mapa[item.id] = true;
      if (canonKey) {
        mapa[canonKey] = true;
        mapa[canonKey.slice(3)] = true;
        mapa['h_oc_' + canonKey.slice(3)] = true;
      }
      lista.push(ocMatch ? mesclarOcNoItemHist(item, ocMatch) : item);
    });
    (ocorrencias || []).forEach(function(oc) {
      if (!oc || !oc.id) return;
      if (oc.status === 'lixeira' || idsNaLixeira.includes(oc.id)) return;
      if (typeof pertenceAPracaAtiva === 'function' && !pertenceAPracaAtiva(oc)) return;
      var isResolvidaOuArquivada = (oc.status === 'resolvida' || oc.status === 'arquivada' || (oc.resolucao && (oc.resolucao.statusRes && oc.resolucao.statusRes !== 'Aberta')));
      if (isResolvidaOuArquivada) {
        var histId = 'h_oc_' + oc.id;
        if (!mapa[oc.id] && !mapa[histId] && !mapa['oc:' + oc.id]) {
          var res = oc.resolucao || {};
          var statusLabel = res.statusRes ? res.statusRes : (oc.status === 'arquivada' ? 'Em Observação' : 'Resolvido');
          var nowFmt = formatDataHoraLocal(oc.dataCriacao || oc.criado);
          var resFmt = res.data ? formatDataHoraLocal(res.data) : nowFmt;
          var resPor = res.resolvidoPor || (oc.resp || getUsuarioAtual());
          var resDesc = res.descRes || (oc.desc || 'Ocorrência resolvida pela equipe técnica.');
          var anexosLista = (oc.anexos && Array.isArray(oc.anexos) && oc.anexos.length > 0)
            ? oc.anexos
            : (Array.isArray(res.anexos) ? res.anexos : []);
          var itemOcHist = {
            id:                      oc.id,
            ocId:                    oc.id,
            tipo:                    'ocorrencia',
            subtipo:                 oc.cat || 'Equipamento',
            titulo:                  oc.titulo,
            equipamento:             oc.equipamento || (oc.tags && oc.tags[1]) || '',
            categoria:               oc.cat || 'Equipamento',
            local:                   oc.local || (oc.praca || 'Central Técnica'),
            dataCriacao:             nowFmt,
            criadoPor:               (typeof obterCriadorOcorrencia === 'function') ? obterCriadorOcorrencia(oc) : (oc.criadoPor || getUsuarioAtual()),
            resp:                    (typeof formatarAtribuicaoResp === 'function') ? formatarAtribuicaoResp(oc.resp) : (oc.resp || 'Equipe do Turno (Todos)'),
            descCriacao:             oc.desc || 'Ocorrência registrada no sistema.',
            status:                  statusLabel,
            dataResolucao:           resFmt,
            resolvidoPor:            resPor,
            descResolucao:           resDesc,
            historicoEdicoes:        oc.historicoEdicoes || res.historicoEdicoes || [],
            validacoesTurno:         Array.isArray(res.validacoesTurno) ? res.validacoesTurno : [],
            metaHorasObservacao:     res.metaHorasObservacao || 24,
            inicioObservacao:        res.inicioObservacao || null,
            concluidoObservacaoPor:  res.concluidoObservacaoPor || '',
            concluidoObservacaoEm:   res.concluidoObservacaoEm || '',
            reincidencias:           Array.isArray(res.reincidencias) ? res.reincidencias : [],
            tags:                    oc.tags || [],
            anexos:                  anexosLista,
            praca:                   (typeof normalizarPracaOcorrencia === 'function')
              ? normalizarPracaOcorrencia(oc.praca, oc.local, oc.titulo, oc.equipamento || (oc.tags && oc.tags[1]))
              : (oc.praca || 'Juiz de Fora')
          };
          mapa[oc.id] = true;
          mapa[histId] = true;
          mapa['oc:' + oc.id] = true;
          lista.push(itemOcHist);
        }
      }
    });
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
    if (item && item.tipo === 'ocorrencia') {
      return '<span class="tag" style="background:#FEE2E2;color:#B91C1C;border:1px solid #FECACA;font-weight:700;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="wrench" style="width:11px;height:11px;stroke-width:2.2;"></i>Ocorrência</span>';
    } else if (item && item.tipo === 'relatorio') {
      return '<span class="tag" style="background:#DBEAFE;color:#1D4ED8;border:1px solid #93C5FD;font-weight:700;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="radio" style="width:11px;height:11px;stroke-width:2.2;"></i>' + escapeHTML(item.subtipo || 'Relatório CTRS') + '</span>';
    } else if (item && item.tipo === 'recebimento') {
      return '<span class="tag" style="background:#FEF3C7;color:#B45309;border:1px solid #FDE68A;font-weight:700;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="package" style="width:11px;height:11px;stroke-width:2.2;"></i>' + escapeHTML(item.subtipo || 'Recebimento') + '</span>';
    }
    return '<span class="tag tag-blue-soft">Registro</span>';
  }
  function extrairTimestampTimeline(item) {
    if (!item) return 0;
    if (typeof item.criado === 'number' && !isNaN(item.criado)) return item.criado;
    var raw = item.dataResolucao || item.dataCriacao || '';
    if (typeof raw === 'string' && raw.trim()) {
      var s = raw.trim();
      var mBr = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
      if (mBr) {
        return new Date(Number(mBr[3]), Number(mBr[2]) - 1, Number(mBr[1]), Number(mBr[4] || 0), Number(mBr[5] || 0)).getTime() || 0;
      }
      var parsed = new Date(s.replace(' ', 'T')).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  }
  function obterEstiloSemanticoHistoricoItem(item) {
    if (!item) {
      return { bg: '#FFFFFF', border: 'var(--border-lt)', left: 'var(--border)', hover: 'var(--blue)', tituloColor: 'var(--txt)', tagCls: 'tag-blue-soft', statusLabel: 'Registro', statusIcon: 'file-text' };
    }
    if (item.tipo === 'relatorio') {
      var isNC = item.status && String(item.status).toLowerCase().indexOf('não conform') !== -1;
      return {
        bg: '#F0F7FF',
        border: '#BFDBFE',
        left: '#0071E3',
        hover: '#0071E3',
        tituloColor: '#1E3A8A',
        tagCls: isNC ? 'tag-y' : 'tag-g',
        statusLabel: item.status || 'Conforme',
        statusIcon: isNC ? 'alert-triangle' : 'check-circle-2'
      };
    }
    if (item.tipo === 'recebimento') {
      return {
        bg: '#FFFBEB',
        border: '#FDE68A',
        left: '#D97706',
        hover: '#D97706',
        tituloColor: 'var(--txt)',
        tagCls: 'tag-y',
        statusLabel: item.status || 'Recebido',
        statusIcon: 'package'
      };
    }
    var stLow = String(item.status || (item.resolucao && item.resolucao.statusRes) || '').toLowerCase();
    var isObs = stLow === 'arquivada' || stLow.indexOf('observa') !== -1 || stLow.indexOf('arquiv') !== -1;
    var isParc = stLow.indexOf('parcial') !== -1;
    var isAberta = stLow === 'aberta' || stLow.indexOf('reaberta') !== -1 || stLow.indexOf('reincidente') !== -1;
    if (isObs) {
      return { bg: '#EEF2FF', border: '#C7D2FE', left: '#4F46E5', hover: '#4F46E5', tituloColor: '#312E81', tagCls: 'tag-ind', statusLabel: 'Em Observação', statusIcon: 'eye' };
    }
    if (isParc) {
      return { bg: '#FFFBEB', border: '#FDE68A', left: '#F59E0B', hover: '#F59E0B', tituloColor: '#92400E', tagCls: 'tag-y', statusLabel: 'Parcialmente Resolvida', statusIcon: 'clock' };
    }
    if (isAberta) {
      return { bg: '#FEF2F2', border: '#FECACA', left: '#EF4444', hover: '#EF4444', tituloColor: '#991B1B', tagCls: 'tag-r', statusLabel: 'Em Aberto', statusIcon: 'alert-triangle' };
    }
    return { bg: '#F0FDF4', border: '#BBF7D0', left: '#10B981', hover: '#10B981', tituloColor: '#14532D', tagCls: 'tag-g', statusLabel: 'Resolvida', statusIcon: 'check-circle-2' };
  }
  function atualizarBotoesFiltroTimelineModal(ids, activeFilter, cntTodos, cntOc, cntRel) {
    if (!ids) return;
    var elTodos = document.getElementById(ids.cntTodos);
    var elOc    = document.getElementById(ids.cntOc);
    var elRel   = document.getElementById(ids.cntRel);
    if (elTodos) elTodos.textContent = String(cntTodos || 0);
    if (elOc)    elOc.textContent    = String(cntOc || 0);
    if (elRel)   elRel.textContent   = String(cntRel || 0);
    [
      { id: ids.btnTodos, val: 'todos' },
      { id: ids.btnOc,    val: 'ocorrencia' },
      { id: ids.btnRel,   val: 'relatorio' }
    ].forEach(function(item) {
      var btn = document.getElementById(item.id);
      if (!btn) return;
      if (item.val === activeFilter) btn.classList.add('on');
      else btn.classList.remove('on');
    });
    if (typeof atualizarTodosGlidersPills === 'function') {
      requestAnimationFrame(function() {
        atualizarTodosGlidersPills(true);
      });
    }
  }
  function renderCardsTimelineMistaHTML(ocs, rels, filtro, popupParaFechar, emptyMsg) {
    var listaOcs = Array.isArray(ocs) ? ocs : [];
    var listaRels = Array.isArray(rels) ? rels : [];
    var combinados = [];
    if (filtro === 'todos' || filtro === 'ocorrencia') {
      listaOcs.forEach(function(o) {
        combinados.push({ kind: 'ocorrencia', ts: extrairTimestampTimeline(o), obj: o });
      });
    }
    if (filtro === 'todos' || filtro === 'relatorio') {
      listaRels.forEach(function(r) {
        combinados.push({ kind: 'relatorio', ts: extrairTimestampTimeline(r), obj: r });
      });
    }
    if (combinados.length === 0) {
      var msg = emptyMsg || (
        filtro === 'ocorrencia'
          ? 'Nenhuma ocorrência técnica registrada para este item.'
          : (filtro === 'relatorio'
              ? 'Nenhum relatório CTRS encontrado para este item.'
              : 'Nenhuma ocorrência ou relatório registrado para este item no momento.')
      );
      return (
        '<div style="background:#F8FAFC;border:1px dashed var(--border);border-radius:10px;padding:18px 14px;text-align:center;font-size:12px;color:var(--muted);">' +
          escapeHTML(msg) +
        '</div>'
      );
    }
    combinados.sort(function(a, b) { return b.ts - a.ts; });
    return combinados.map(function(entry) {
      if (entry.kind === 'ocorrencia') {
        var o = entry.obj;
        var st = obterEstiloSemanticoHistoricoItem({ tipo: 'ocorrencia', status: o.status, resolucao: o.resolucao });
        var safeOcId = (typeof sanitizeIdAttr === 'function') ? sanitizeIdAttr(o.id) : escapeHTML(o.id);
        var descLimpa = String(o.desc || '').replace(/<!--(?:CTRS|RONDA)_JSON:[^>]+-->/g, '').trim();
        var descResLimpa = (o.resolucao && o.resolucao.descRes)
          ? String(o.resolucao.descRes).replace(/<!--(?:CTRS|RONDA)_JSON:[^>]+-->/g, '').trim()
          : '';
        var solucaoBox = (o.status !== 'aberta' && descResLimpa)
          ? '<div style="margin-top:6px;padding:6px 10px;background:#FFFFFF;border:1px solid ' + st.border + ';border-left:3px solid ' + st.left + ';border-radius:6px;font-size:11.5px;color:#1E293B;"><strong>Solução aplicada:</strong> ' + escapeHTML(descResLimpa) + '</div>'
          : '';
        var temPreviewOc = !!(o.htmlRelatorio || o.dadosCTRS || (o.desc && String(o.desc).indexOf('<!--CTRS_JSON:') !== -1));
        var previewChip = temPreviewOc
          ? '<span style="font-size:10.5px;font-weight:700;color:#0071E3;background:#FFFFFF;border:1px solid #BFDBFE;padding:2px 8px;border-radius:10px;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="eye" style="width:11px;height:11px;"></i>Ver Relatório</span>'
          : '';
        return (
          '<div onclick="fecharPopup(\'' + popupParaFechar + '\'); verDetalhesOcorrencia(\'' + safeOcId + '\')" style="background:' + st.bg + ';border:1px solid ' + st.border + ';border-left:4px solid ' + st.left + ';border-radius:8px;padding:10px 13px;cursor:pointer;transition:all .15s ease;" onmouseover="this.style.borderColor=\'' + st.hover + '\';" onmouseout="this.style.borderColor=\'' + st.border + '\';" title="Clique para abrir os detalhes completos desta ocorrência">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
              '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;min-width:0;">' +
                '<span class="tag" style="background:#FEE2E2;color:#B91C1C;border:1px solid #FECACA;font-weight:700;font-size:10px;padding:1px 7px;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="wrench" style="width:10px;height:10px;stroke-width:2.3;"></i>OCORRÊNCIA</span>' +
                '<strong style="font-size:12.5px;color:' + st.tituloColor + ';">' + escapeHTML(o.titulo || 'Ocorrência Técnica') + '</strong>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">' +
                previewChip +
                '<span class="tag ' + st.tagCls + '" style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="' + st.statusIcon + '" style="width:11px;height:11px;stroke-width:2.2;"></i>' + escapeHTML(st.statusLabel) + '</span>' +
              '</div>' +
            '</div>' +
            (descLimpa ? '<div style="font-size:11.5px;color:var(--txt2);margin-top:5px;line-height:1.45;">' + escapeHTML(descLimpa) + '</div>' : '') +
            solucaoBox +
            '<div style="font-size:10.5px;color:var(--muted);margin-top:6px;display:flex;gap:12px;flex-wrap:wrap;">' +
              '<span style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="calendar" style="width:11px;height:11px;"></i>' + escapeHTML(o.dataCriacao || '') + '</span>' +
              '<span style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="user" style="width:11px;height:11px;"></i>Resp: ' + escapeHTML(o.resp || 'Equipe') + '</span>' +
            '</div>' +
          '</div>'
        );
      }
      var r = entry.obj;
      var stRel = obterEstiloSemanticoHistoricoItem(r);
      var safeRelId = (typeof sanitizeIdAttr === 'function') ? sanitizeIdAttr(r.id) : escapeHTML(r.id);
      var descRelLimpa = String(r.descCriacao || '').replace(/<!--(?:CTRS|RONDA)_JSON:[^>]+-->/g, '').trim();
      var badgeRel = escapeHTML((r.subtipo || 'Relatório CTRS').toUpperCase());
      return (
        '<div onclick="fecharPopup(\'' + popupParaFechar + '\'); verDetalhesHistoricoDirect(\'' + safeRelId + '\')" style="background:' + stRel.bg + ';border:1px solid ' + stRel.border + ';border-left:4px solid ' + stRel.left + ';border-radius:8px;padding:10px 13px;cursor:pointer;transition:all .15s ease;" onmouseover="this.style.borderColor=\'' + stRel.hover + '\';" onmouseout="this.style.borderColor=\'' + stRel.border + '\';" title="Clique para abrir a visualização completa do relatório">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
            '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;min-width:0;">' +
              '<span class="tag" style="background:#DBEAFE;color:#1D4ED8;border:1px solid #93C5FD;font-weight:700;font-size:10px;padding:1px 7px;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="radio" style="width:10px;height:10px;stroke-width:2.3;"></i>' + badgeRel + '</span>' +
              '<strong style="font-size:12.5px;color:' + stRel.tituloColor + ';">' + escapeHTML(r.titulo || 'Relatório de Transmissão') + '</strong>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">' +
              '<span style="font-size:10.5px;font-weight:700;color:#0071E3;background:#FFFFFF;border:1px solid #93C5FD;padding:2px 8px;border-radius:10px;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="eye" style="width:11px;height:11px;"></i>Ver Relatório</span>' +
              '<span class="tag ' + stRel.tagCls + '" style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="' + stRel.statusIcon + '" style="width:11px;height:11px;stroke-width:2.2;"></i>' + escapeHTML(stRel.statusLabel) + '</span>' +
            '</div>' +
          '</div>' +
          (descRelLimpa ? '<div style="font-size:11.5px;color:var(--txt2);margin-top:5px;line-height:1.45;">' + escapeHTML(descRelLimpa) + '</div>' : '') +
          '<div style="font-size:10.5px;color:var(--muted);margin-top:6px;display:flex;gap:12px;flex-wrap:wrap;">' +
            '<span style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="calendar" style="width:11px;height:11px;"></i>' + escapeHTML(r.dataCriacao || '') + '</span>' +
            '<span style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="user" style="width:11px;height:11px;"></i>Emitido por: ' + escapeHTML(r.criadoPor || 'Operador') + '</span>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }
