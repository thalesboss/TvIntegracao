(function (window, document, TVApp) {
  'use strict';

  TVApp.registerModule('lixeira-arquivados', function (app) {
    var Security = app.Security;
    var Markers  = app.Markers;
    var EventBus = app.EventBus;
    var Session  = app.Session;
    var Store    = app.Store;
    var escapeHTML     = Security.escapeHTML;
    var escapeJSString = Security.escapeJSString;

    var _lixeiraNuvemIndisponivel = false;
    var filtroArquivadosAtivo = 'todas';

    function saveLixeira(list) {
      Store.lixeiraData = list || [];
      atualizarBadgesLixeira();
    }
    window.saveLixeira = saveLixeira;

    function sincronizarLixeiraNuvem() {
      if (_lixeiraNuvemIndisponivel) return;
      if (!window.DBService || typeof window.DBService.select !== 'function') return;
      window.DBService.select('lixeira', 'select=*&order=dataExclusao.desc&limit=50')
        .then(function (res) {
          if (res && res.status === 404) {
            _lixeiraNuvemIndisponivel = true;
            return;
          }
          if (res && res.ok && Array.isArray(res.data)) {
            Store.lixeiraData = res.data;
            atualizarBadgesLixeira();
            renderLixeira();
          }
        })
        .catch(function (err) {
          console.warn('[Lixeira DB] Não foi possível sincronizar lixeira:', err);
        });
    }
    window.sincronizarLixeiraNuvem = sincronizarLixeiraNuvem;

    function salvarItemLixeiraNuvem(item) {
      if (_lixeiraNuvemIndisponivel || !item) return Promise.resolve(false);
      if (!window.DBService || typeof window.DBService.upsert !== 'function') return Promise.resolve(false);
      return window.DBService.upsert('lixeira', item)
        .then(function (res) {
          if (res && res.status === 404) {
            _lixeiraNuvemIndisponivel = true;
            return false;
          }
          return !!(res && res.ok);
        })
        .catch(function (err) {
          console.warn('[Lixeira DB] Erro ao enviar para lixeira remota:', err);
          return false;
        });
    }
    window.salvarItemLixeiraNuvem = salvarItemLixeiraNuvem;

    function excluirItemLixeiraNuvem(id) {
      if (_lixeiraNuvemIndisponivel || !id) return;
      if (!window.DBService || typeof window.DBService.remove !== 'function') return;
      window.DBService.remove('lixeira', 'id=eq.' + encodeURIComponent(id))
        .then(function (res) {
          if (res && res.status === 404) {
            _lixeiraNuvemIndisponivel = true;
          }
        })
        .catch(function (err) {
          console.warn('[Lixeira DB] Erro ao remover da lixeira remota:', err);
        });
    }
    window.excluirItemLixeiraNuvem = excluirItemLixeiraNuvem;

    function pertenceAPracaAtivaLixeira(item) {
      if (!item) return false;
      if (typeof window.pertenceAPracaAtiva === 'function') {
        if (item.ocOriginal && window.pertenceAPracaAtiva(item.ocOriginal)) return true;
        if (item.histOriginal && window.pertenceAPracaAtiva(item.histOriginal)) return true;
        return window.pertenceAPracaAtiva(item);
      }
      return true;
    }
    window.pertenceAPracaAtivaLixeira = pertenceAPracaAtivaLixeira;

    function atualizarBadgesLixeira() {
      var badge = document.querySelector('.lixeira-badge');
      if (badge) {
        var listaDaPraca = (Store.lixeiraData || []).filter(pertenceAPracaAtivaLixeira);
        if (listaDaPraca.length > 0) {
          badge.textContent = listaDaPraca.length;
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }
    }

    function verificarExpiracaoLixeira() {
      var list = Store.lixeiraData || [];
      if (list.length === 0) return;
      var agora = Date.now();
      var alterou = false;
      var novosItens = [];
      list.forEach(function (item) {
        var tempoRestanteMs = item.expiraEm - agora;
        if (tempoRestanteMs <= 0) {
          alterou = true;
          excluirItemLixeiraNuvem(item.id);
          if (window.DBService && typeof window.DBService.deleteRemote === 'function') {
            window.DBService.deleteRemote('ocorrencias', item.id);
            window.DBService.deleteRemote('historico', item.id);
          }
          return;
        }
        if (tempoRestanteMs <= 24 * 60 * 60 * 1000 && !item.notificado24h) {
          item.notificado24h = true;
          alterou = true;
          salvarItemLixeiraNuvem(item);
          if (typeof window.adicionarNotificacao === 'function') {
            window.adicionarNotificacao(
              'Aviso de Exclusão da Lixeira',
              'A ocorrência "' + (item.titulo || 'Ocorrência') + '" será excluída permanentemente em menos de 24 horas.',
              'warning'
            );
          }
        }
        novosItens.push(item);
      });
      if (alterou) {
        saveLixeira(novosItens);
      }
    }
    window.verificarExpiracaoLixeira = verificarExpiracaoLixeira;

    function extrairDadosCTRSDeItemHistorico(hist) {
      if (!hist) return null;
      if (hist.dadosCTRS && typeof hist.dadosCTRS === 'object') return hist.dadosCTRS;
      return Markers.extract(hist.descResolucao || '', 'CTRS');
    }

    function ajustarMetricasDashboardPorRelatorioCTRS(hist, direcao) {
      var metrics = Store.dashboardMetrics;
      if (!hist || !metrics) return;
      var d = extrairDadosCTRSDeItemHistorico(hist);
      if (!d) return;
      var delta = direcao < 0 ? -1 : 1;
      var listaMet = Array.isArray(d.metricasContabilizadas) ? d.metricasContabilizadas : [];
      if (listaMet.length === 0 && Array.isArray(d.transmissoes)) {
        var tipoUp = (d.chaveJornal || d.tipo || 'INTEGRAÇÃO NOTÍCIA').toUpperCase();
        var cj = 'INTEGRAÇÃO NOTÍCIA';
        if (tipoUp.indexOf('NOTÍCIA') !== -1 || tipoUp.indexOf('NOTICIA') !== -1 || tipoUp === 'IN') cj = 'INTEGRAÇÃO NOTÍCIA';
        else if (tipoUp === 'MG1') cj = 'MG1';
        else if (tipoUp === 'MG2') cj = 'MG2';
        else if (tipoUp.indexOf('GIRO') !== -1) cj = 'GIRO MG2';
        else cj = tipoUp;
        d.transmissoes.forEach(function (tx) {
          if (!tx) return;
          var temNC = (tx.audioQ === 'NC' || tx.videoQ === 'NC' || tx.statusTx === 'NC');
          var temCanc = !temNC && (tx.statusTx === 'NA' || tx.statusTx === 'CA' || tx.audioQ === 'NA' || tx.videoQ === 'NA');
          listaMet.push({
            telejornal: cj,
            equipamento: tx.infra || '',
            status: temNC ? 'nc' : (temCanc ? 'canc' : 'conf')
          });
        });
      }
      if (listaMet.length === 0) return;
      listaMet.forEach(function (m) {
        var campo = (m.status === 'nc') ? 'nc' : ((m.status === 'canc') ? 'canc' : 'conf');
        if (m.telejornal && metrics.telejornal && metrics.telejornal[m.telejornal]) {
          var atualTj = metrics.telejornal[m.telejornal][campo] || 0;
          metrics.telejornal[m.telejornal][campo] = Math.max(0, atualTj + delta);
        }
        if (m.equipamento && metrics.equipamento && metrics.equipamento[m.equipamento]) {
          var atualEq = metrics.equipamento[m.equipamento][campo] || 0;
          metrics.equipamento[m.equipamento][campo] = Math.max(0, atualEq + delta);
        }
      });
      if (typeof window.salvarDashboardMetricsStore === 'function') {
        window.salvarDashboardMetricsStore();
      }
      if (typeof window.renderDashboards === 'function') {
        window.renderDashboards();
      }
    }

    function excluirOcorrencia(id) {
      var targetId = id;
      var cleanOcId = String(targetId || '').replace(/^h_oc_/, '');
      var oc = (Store.ocorrencias || []).find(function (o) { return o && (o.id === targetId || o.id === cleanOcId); });
      var hist = (Store.historicoSeedData || []).find(function (h) { return h && (h.id === targetId || h.id === ('h_oc_' + cleanOcId) || h.ocId === cleanOcId); });
      var titulo = oc ? (oc.titulo || 'esta ocorrência') : (hist ? hist.titulo : 'esta ocorrência');
      if (confirm('Mover a ocorrência "' + titulo + '" para a Lixeira?\n\nEla ficará retida por 7 dias na Lixeira como backup antes da exclusão permanente.')) {
        var idParaSalvar = oc ? oc.id : (hist ? hist.id : targetId);
        var itemPraca = (oc && oc.praca) || (hist && hist.praca) || (typeof window.normalizarPracaOcorrencia === 'function' ? window.normalizarPracaOcorrencia(null, (oc && oc.local) || (hist && hist.local), titulo) : 'Juiz de Fora');
        var itemLixeira = {
          id: idParaSalvar,
          dataExclusao: Date.now(),
          expiraEm: Date.now() + 7 * 24 * 60 * 60 * 1000,
          titulo: titulo,
          ocOriginal: oc ? Object.assign({}, oc) : null,
          histOriginal: hist ? Object.assign({}, hist) : null,
          excluidoPor: Session.getUserName(),
          notificado24h: false,
          praca: itemPraca
        };
        var novaLixeira = [itemLixeira].concat((Store.lixeiraData || []).filter(function (i) { return i.id !== idParaSalvar && i.id !== targetId; }));
        saveLixeira(novaLixeira);
        salvarItemLixeiraNuvem(itemLixeira).then(function () {
          if (window.DBService && typeof window.DBService.deleteRemote === 'function' && idParaSalvar) {
            window.DBService.deleteRemote('ocorrencias', cleanOcId);
            window.DBService.deleteRemote('historico', idParaSalvar);
            window.DBService.deleteRemote('historico', 'h_oc_' + cleanOcId);
          }
        });
        var idsOcsVinculadasRelatorio = [];
        if (hist) {
          ajustarMetricasDashboardPorRelatorioCTRS(hist, -1);
          var dadosCtrsVinc = extrairDadosCTRSDeItemHistorico(hist);
          if (dadosCtrsVinc && Array.isArray(dadosCtrsVinc.idsOcorrenciasGeradas)) {
            idsOcsVinculadasRelatorio = dadosCtrsVinc.idsOcorrenciasGeradas;
            idsOcsVinculadasRelatorio.forEach(function (ocIdVinc) {
              if (window.DBService && typeof window.DBService.deleteRemote === 'function') {
                window.DBService.deleteRemote('ocorrencias', ocIdVinc);
              }
            });
          }
        }
        Store.ocorrencias = (Store.ocorrencias || []).filter(function (o) {
          if (!o) return false;
          if (o.id === idParaSalvar || o.id === targetId || o.id === cleanOcId) return false;
          if (idsOcsVinculadasRelatorio.indexOf(o.id) !== -1) return false;
          return true;
        });
        Store.historicoSeedData = (Store.historicoSeedData || []).filter(function (h) {
          if (!h) return false;
          if (h.id === idParaSalvar || h.id === targetId || h.id === ('h_oc_' + cleanOcId) || h.ocId === cleanOcId) return false;
          return true;
        });
        if (typeof window.save === 'function') window.save(Store.ocorrencias);
        if (typeof window.saveHistorico === 'function') window.saveHistorico(Store.historicoSeedData);
        if (typeof window.renderAll === 'function') window.renderAll();
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Movida para a Lixeira', '"' + titulo + '" ficará disponível na Lixeira por 7 dias.', 'info');
        }
      }
    }
    window.excluirOcorrencia = excluirOcorrencia;

    function restaurarOcorrenciaLixeira(id) {
      var item = (Store.lixeiraData || []).find(function (i) { return i.id === id; });
      if (!item) return;
      if (item.histOriginal && item.histOriginal.tipo === 'equipamento') {
        if (Array.isArray(Store.catalogoEquipamentos)) {
          var jaNoCat = false;
          Store.catalogoEquipamentos.forEach(function (e) {
            if (e.id === id) {
              e.status_operacional = 'operacional';
              jaNoCat = true;
              if (typeof window.salvarEquipamentoPostgreSQL === 'function') window.salvarEquipamentoPostgreSQL(e);
            }
          });
          if (!jaNoCat && item.histOriginal.eqOriginal) {
            var restEq = Object.assign({}, item.histOriginal.eqOriginal, { status_operacional: 'operacional' });
            Store.catalogoEquipamentos.push(restEq);
            if (typeof window.salvarEquipamentoPostgreSQL === 'function') window.salvarEquipamentoPostgreSQL(restEq);
          }
          if (typeof window.sincronizarDashboardMetricsComCatalogo === 'function') window.sincronizarDashboardMetricsComCatalogo();
          if (typeof window.renderCatalogoEquipamentos === 'function') window.renderCatalogoEquipamentos();
        }
      } else {
        if (item.ocOriginal) {
          Store.ocorrencias = [item.ocOriginal].concat((Store.ocorrencias || []).filter(function (o) { return o && o.id !== id; }));
          if (typeof window.save === 'function') window.save(Store.ocorrencias);
        }
        if (item.histOriginal) {
          ajustarMetricasDashboardPorRelatorioCTRS(item.histOriginal, 1);
          Store.historicoSeedData = [item.histOriginal].concat((Store.historicoSeedData || []).filter(function (h) { return h && h.id !== id; }));
          if (typeof window.saveHistorico === 'function') window.saveHistorico(Store.historicoSeedData, item.histOriginal);
        }
      }
      saveLixeira((Store.lixeiraData || []).filter(function (i) { return i.id !== id; }));
      excluirItemLixeiraNuvem(id);
      if (typeof window.renderAll === 'function') window.renderAll();
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Item Restaurado', '"' + (item.titulo || 'Item') + '" foi restaurado com sucesso.', 'success');
      }
    }
    window.restaurarOcorrenciaLixeira = restaurarOcorrenciaLixeira;

    function renderLixeira() {
      var container = document.getElementById('lixeira-list');
      atualizarBadgesLixeira();
      if (!container) return;
      var listaDaPraca = (Store.lixeiraData || []).filter(pertenceAPracaAtivaLixeira);
      if (listaDaPraca.length === 0) {
        container.innerHTML =
          '<div style="text-align:center;padding:48px 16px;background:var(--surface);border:1px solid var(--border-lt);border-radius:var(--r-lg);">' +
            '<i data-lucide="trash-2" style="width:36px;height:36px;color:var(--muted);stroke-width:1.5;margin-bottom:10px;"></i>' +
            '<p style="color:var(--txt);font-size:14px;font-weight:600;">A lixeira está vazia</p>' +
            '<p style="color:var(--muted);font-size:12px;margin-top:3px;">Ocorrências excluídas ficam retidas aqui por 7 dias antes da exclusão definitiva.</p>' +
          '</div>';
        if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
        return;
      }
      var agora = Date.now();
      function renderCardLixeiraHTML(item) {
        var msRestante = item.expiraEm - agora;
        var diasRestantes = Math.ceil(msRestante / (1000 * 60 * 60 * 24));
        var horasRestantes = Math.ceil(msRestante / (1000 * 60 * 60));
        var expiraBadge = '';
        if (horasRestantes <= 24) {
          expiraBadge = '<span class="tag tag-r" style="font-weight:600;"><i data-lucide="alert-triangle" style="width:11px;height:11px;stroke-width:2.2;margin-right:3px;"></i>Expira em ' + Math.max(1, horasRestantes) + 'h</span>';
        } else {
          expiraBadge = '<span class="tag tag-yellow-soft" style="font-weight:600;"><i data-lucide="clock" style="width:11px;height:11px;stroke-width:2;margin-right:3px;"></i>Expira em ' + diasRestantes + ' dias</span>';
        }
        var oc = item.ocOriginal || {};
        var desc = escapeHTML(Markers.strip(oc.desc || (item.histOriginal ? item.histOriginal.descCriacao : 'Sem descrição.')));
        var local = escapeHTML(oc.local || (item.histOriginal ? item.histOriginal.local : 'Central Técnica'));
        var excluidoEmStr = escapeHTML(typeof window.formatDataHoraLocal === 'function' ? window.formatDataHoraLocal(item.dataExclusao) : '');
        var safeLixJsId = escapeJSString(item.id);
        return (
          '<article class="oc-card" style="background:#FFFFFF;border:1px solid #E2E8F0;margin-bottom:10px;">' +
            '<div class="prio-line pl-r"></div>' +
            '<div class="oc-body">' +
              '<div class="oc-header">' +
                '<h3>' + escapeHTML(item.titulo || 'Ocorrência') + '</h3>' +
                '<span class="tag tag-gray-soft">Lixeira</span>' +
                expiraBadge +
              '</div>' +
              '<p class="oc-desc" style="color:var(--txt2);">' + desc + '</p>' +
              '<div class="oc-meta" style="margin-top:8px;">' +
                '<span><i data-lucide="trash" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Excluído por: ' + escapeHTML(item.excluidoPor || 'Operador') + '</span>' +
                '<span><i data-lucide="calendar" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> Em: ' + excluidoEmStr + '</span>' +
                '<span><i data-lucide="map-pin" style="width:12px;height:12px;stroke-width:2;color:var(--dim);"></i> ' + local + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="oc-actions" style="justify-content:center;gap:8px;">' +
              '<button class="btn-card-action btn-card-restore" onclick="restaurarOcorrenciaLixeira(\'' + safeLixJsId + '\')" title="Restaurar ocorrência para as ativas">' +
                '<i data-lucide="rotate-ccw" style="width:12px;height:12px;stroke-width:2.2;"></i> Restaurar' +
              '</button>' +
            '</div>' +
          '</article>'
        );
      }
      var secoes = window.agruparPorDias(listaDaPraca, function (item) { return item.dataExclusao; });
      container.innerHTML = window.renderSecoesComCards(secoes, renderCardLixeiraHTML);
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
    }
    window.renderLixeira = renderLixeira;

    function calcularProgressoObservacao(oc) {
      var res = (oc && oc.resolucao) ? oc.resolucao : {};
      var inicio = Number(res.inicioObservacao || res.data || (oc && oc.criado) || Date.now());
      if (isNaN(inicio) || inicio <= 0) inicio = Date.now();
      var metaHoras = Number(res.metaHorasObservacao) || 24;
      var decorridoMs = Math.max(0, Date.now() - inicio);
      var decorridoHoras = decorridoMs / (1000 * 60 * 60);
      var pct = Math.min(100, Math.round((decorridoHoras / metaHoras) * 100));
      var cumprida = decorridoHoras >= metaHoras;
      var tempoLabel = decorridoHoras < 1
        ? (Math.max(1, Math.round(decorridoHoras * 60)) + ' min')
        : (Math.floor(decorridoHoras) + 'h');
      return {
        inicio: inicio,
        metaHoras: metaHoras,
        decorridoHoras: decorridoHoras,
        pct: pct,
        cumprida: cumprida,
        tempoLabel: tempoLabel,
        validacoes: Array.isArray(res.validacoesTurno) ? res.validacoesTurno : []
      };
    }
    window.calcularProgressoObservacao = calcularProgressoObservacao;

    function sincronizarOcorrenciaNoHistorico(oc) {
      if (!oc || !oc.id) return null;
      var histId = 'h_oc_' + oc.id;
      var res = oc.resolucao || {};
      var descLimpaOc = Markers.strip(oc.desc || 'Ocorrência registrada no sistema.');
      var fmtFn = typeof window.formatDataHoraLocal === 'function' ? window.formatDataHoraLocal : function () { return new Date().toLocaleString('pt-BR'); };
      var nowFmt = fmtFn(oc.dataCriacao || oc.criado);
      var resFmt = res.data ? fmtFn(res.data) : fmtFn();
      var usuarioLogado = Session.getUserName();
      var statusFinal = oc.status === 'arquivada'
        ? 'Em Observação'
        : (res.statusRes || 'Resolvido');
      var anexosHist = (oc.anexos && Array.isArray(oc.anexos) && oc.anexos.length > 0)
        ? oc.anexos
        : (Array.isArray(res.anexos) ? res.anexos : []);
      var existente = (Store.historicoSeedData || []).find(function (h) {
        return h && (h.id === histId || h.id === oc.id || h.ocId === oc.id);
      });
      var idsDuplicadosRemovidos = [];
      Store.historicoSeedData = (Store.historicoSeedData || []).filter(function (h) {
        if (!h || !h.id) return false;
        var mesmoId = (h.id === histId || h.id === oc.id || h.ocId === oc.id);
        var mesmoLegado = false;
        if (!mesmoId && h.tipo === 'ocorrencia' && /^h_oc_\d+$/.test(String(h.id))) {
          var descH = Markers.strip(h.descCriacao || '');
          if (String(h.titulo || '').trim().toLowerCase() === String(oc.titulo || '').trim().toLowerCase() && descH.toLowerCase() === descLimpaOc.toLowerCase()) {
            mesmoLegado = true;
          }
        }
        if (mesmoId || mesmoLegado) {
          if (h.id !== histId) idsDuplicadosRemovidos.push(h.id);
          return false;
        }
        return true;
      });
      var itemHist = {
        id:                      histId,
        ocId:                    oc.id,
        tipo:                    'ocorrencia',
        subtipo:                 oc.cat || 'Equipamento',
        titulo:                  oc.titulo,
        equipamento:             oc.equipamento || (oc.local ? (oc.local + ' — ' + (oc.cat || 'Equipamento')) : (oc.cat || oc.titulo)),
        categoria:               oc.cat || 'Equipamento',
        local:                   oc.local || 'Central Técnica',
        dataCriacao:             (existente && existente.dataCriacao) ? existente.dataCriacao : nowFmt,
        criadoPor:               (typeof window.obterCriadorOcorrencia === 'function') ? window.obterCriadorOcorrencia(oc) : (oc.criadoPor || usuarioLogado),
        resp:                    (typeof window.formatarAtribuicaoResp === 'function') ? window.formatarAtribuicaoResp(oc.resp) : (oc.resp || 'Equipe do Turno (Todos)'),
        descCriacao:             oc.desc || 'Ocorrência registrada no sistema.',
        status:                  statusFinal,
        dataResolucao:           resFmt,
        resolvidoPor:            res.resolvidoPor || usuarioLogado,
        descResolucao:           res.descRes || '',
        historicoEdicoes:        oc.historicoEdicoes || res.historicoEdicoes || [],
        validacoesTurno:         Array.isArray(res.validacoesTurno) ? res.validacoesTurno : [],
        metaHorasObservacao:     res.metaHorasObservacao || 24,
        inicioObservacao:        res.inicioObservacao || null,
        concluidoObservacaoPor:  res.concluidoObservacaoPor || '',
        concluidoObservacaoEm:   res.concluidoObservacaoEm || '',
        reincidencias:           Array.isArray(res.reincidencias) ? res.reincidencias : [],
        htmlRelatorio:           oc.htmlRelatorio || null,
        dadosCTRS:               oc.dadosCTRS || null,
        link:                    oc.link || res.link || '',
        tags:                    Array.isArray(oc.tags) ? oc.tags : [],
        anexos:                  anexosHist,
        praca:                   (typeof window.normalizarPracaOcorrencia === 'function')
          ? window.normalizarPracaOcorrencia(oc.praca, oc.local, oc.titulo, oc.equipamento || (oc.tags && oc.tags[1]))
          : (oc.praca || (typeof window.getPracaAtual === 'function' ? window.getPracaAtual() : 'Juiz de Fora'))
      };
      Store.historicoSeedData = [itemHist].concat(Store.historicoSeedData);
      if (typeof window.saveHistorico === 'function') window.saveHistorico(Store.historicoSeedData, itemHist);
      if (window.DBService && typeof window.DBService.deleteRemote === 'function') {
        idsDuplicadosRemovidos.forEach(function (dupId) {
          window.DBService.deleteRemote('historico', dupId);
        });
      }
      return itemHist;
    }
    window.sincronizarOcorrenciaNoHistorico = sincronizarOcorrenciaNoHistorico;

    function registrarCheckObservacaoTurno(id) {
      var list = Store.ocorrencias || [];
      var idx = list.findIndex(function (o) { return o && o.id === id; });
      if (idx === -1) return;
      var oc = list[idx];
      var usuario = Session.getUserName();
      var agoraFmt = typeof window.formatDataHoraLocal === 'function' ? window.formatDataHoraLocal() : new Date().toLocaleString('pt-BR');
      var resAtual = Object.assign({}, oc.resolucao || {});
      var validacoes = Array.isArray(resAtual.validacoesTurno) ? resAtual.validacoesTurno.slice() : [];
      validacoes.push({
        operador: usuario,
        dataHora: agoraFmt,
        turno: (typeof window.obterLabelTurnoAtivoCurto === 'function') ? window.obterLabelTurnoAtivoCurto() : '',
        timestamp: Date.now()
      });
      resAtual.validacoesTurno = validacoes;
      list[idx] = Object.assign({}, oc, {
        resolucao: resAtual,
        ultimaEdicaoPor: usuario,
        ultimaEdicaoEm: agoraFmt
      });
      sincronizarOcorrenciaNoHistorico(list[idx]);
      if (typeof window.save === 'function') window.save(list, list[idx], false);
      if (typeof window.renderAll === 'function') window.renderAll(true);
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Check de Turno Registrado', 'Estabilidade validada neste turno por ' + usuario + '.', 'success');
      }
    }
    window.registrarCheckObservacaoTurno = registrarCheckObservacaoTurno;

    function filtrarArquivados(elOrTipo, tipo) {
      var el = (elOrTipo && typeof elOrTipo === 'object' && elOrTipo.nodeType) ? elOrTipo : null;
      var tipoFinal = typeof elOrTipo === 'string' ? elOrTipo : tipo;
      if (el && typeof el.closest === 'function') {
        var pills = el.closest('.pills');
        if (pills) {
          pills.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('on'); });
          el.classList.add('on');
        }
      } else if (tipoFinal) {
        document.querySelectorAll('#page-arquivados .pills .pill').forEach(function (p) {
          var pText = p.textContent.trim().toLowerCase();
          if (pText === tipoFinal.toLowerCase() || (tipoFinal.toLowerCase() === 'todas' && pText === 'todas')) {
            p.classList.add('on');
          } else {
            p.classList.remove('on');
          }
        });
      }
      filtroArquivadosAtivo = (tipoFinal || (el ? el.textContent.trim().toLowerCase() : 'todas')).toLowerCase();
      renderArquivados();
    }
    window.filtrarArquivados = filtrarArquivados;

    function concluirVerificacaoArquivado(id) {
      var list = Store.ocorrencias || [];
      var idx = list.findIndex(function (o) { return o && o.id === id; });
      if (idx === -1) return;
      var oc = list[idx];
      var usuario = Session.getUserName();
      var agoraFmt = typeof window.formatDataHoraLocal === 'function' ? window.formatDataHoraLocal() : new Date().toLocaleString('pt-BR');
      var tagsAtuais = (oc.tags || []).filter(function (t) { return t !== 'Arquivada' && t !== 'Em Observação'; });
      if (tagsAtuais.indexOf('Validada Pós-Reparo') === -1) tagsAtuais.push('Validada Pós-Reparo');
      var resAtual = Object.assign({}, oc.resolucao || {}, {
        statusRes: 'Resolvido (Validado Pós-Reparo)',
        concluidoObservacaoPor: usuario,
        concluidoObservacaoEm: agoraFmt
      });
      list[idx] = Object.assign({}, oc, {
        status: 'resolvida',
        tags: tagsAtuais,
        resolucao: resAtual,
        ultimaEdicaoPor: usuario,
        ultimaEdicaoEm: agoraFmt
      });
      sincronizarOcorrenciaNoHistorico(list[idx]);
      if (typeof window.save === 'function') window.save(list, list[idx], false);
      if (typeof window.renderAll === 'function') window.renderAll(true);
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Observação Concluída', '"' + (oc.titulo || 'Ocorrência') + '" cumpriu o período de testes e foi concluída definitivamente.', 'success');
      }
    }
    window.concluirVerificacaoArquivado = concluirVerificacaoArquivado;

    function restaurarArquivadoParaAbertas(id) {
      var list = Store.ocorrencias || [];
      var idx = list.findIndex(function (o) { return o && o.id === id; });
      if (idx === -1) return;
      var oc = list[idx];
      var motivo = prompt('⚠️ O equipamento ou sistema voltou a apresentar problema?\n\nDescreva brevemente o que ocorreu neste turno (ou deixe em branco para apenas reabrir):', '');
      if (motivo === null) return;
      var motivoLimpo = String(motivo || '').trim();
      var usuario = Session.getUserName();
      var agoraFmt = typeof window.formatDataHoraLocal === 'function' ? window.formatDataHoraLocal() : new Date().toLocaleString('pt-BR');
      var tagsNovas = (oc.tags || []).filter(function (t) { return t !== 'Arquivada' && t !== 'Em Observação' && t !== 'Validada Pós-Reparo'; });
      if (tagsNovas.indexOf('Reincidente') === -1) tagsNovas.push('Reincidente');
      var resAtual = Object.assign({}, oc.resolucao || {}, {
        statusRes: 'Reaberta (Reincidente)'
      });
      var reincList = Array.isArray(resAtual.reincidencias) ? resAtual.reincidencias.slice() : [];
      reincList.push({
        operador: usuario,
        dataHora: agoraFmt,
        motivo: motivoLimpo || 'Voltou a apresentar falha durante período de observação'
      });
      resAtual.reincidencias = reincList;
      var edicoes = Array.isArray(oc.historicoEdicoes) ? oc.historicoEdicoes.slice() : ((resAtual.historicoEdicoes && Array.isArray(resAtual.historicoEdicoes)) ? resAtual.historicoEdicoes.slice() : []);
      edicoes.unshift({
        autor: usuario,
        dataHora: agoraFmt,
        mudancas: [{
          campo: 'Reincidência em Observação',
          antes: 'Em Observação',
          depois: motivoLimpo || 'Voltou a apresentar falha'
        }]
      });
      resAtual.historicoEdicoes = edicoes;
      var descAtual = String(oc.desc || '');
      var ctrsObj = Markers.extract(descAtual, 'CTRS');
      descAtual = Markers.strip(descAtual);
      if (motivoLimpo) {
        descAtual = (descAtual ? descAtual + '\n\n' : '') + '[⚠️ Reincidência em ' + agoraFmt + ' por ' + usuario + ']: ' + motivoLimpo;
      }
      if (ctrsObj) {
        descAtual = descAtual + Markers.encode('CTRS', ctrsObj);
      }
      list[idx] = Object.assign({}, oc, {
        status: 'aberta',
        desc: descAtual,
        tags: tagsNovas,
        resolucao: resAtual,
        historicoEdicoes: edicoes,
        ultimaEdicaoPor: usuario,
        ultimaEdicaoEm: agoraFmt
      });
      sincronizarOcorrenciaNoHistorico(list[idx]);
      if (typeof window.save === 'function') window.save(list, list[idx], false);
      if (typeof window.renderAll === 'function') window.renderAll(true);
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('Voltou a Falhar (Reaberta)', '"' + (oc.titulo || 'Ocorrência') + '" voltou para Ocorrências Abertas marcada como Reincidente.', 'warning');
      }
    }
    window.restaurarArquivadoParaAbertas = restaurarArquivadoParaAbertas;

    function renderArquivados() {
      var container = document.getElementById('arquivados-list');
      var badge = document.querySelector('.arquivados-badge');
      var lista = typeof window.getArquivadas === 'function' ? window.getArquivadas() : [];
      if (badge) {
        if (lista.length > 0) {
          badge.textContent = lista.length;
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }
      if (!container) return;
      if (filtroArquivadosAtivo === 'prontas') {
        lista = lista.filter(function (o) { return calcularProgressoObservacao(o).cumprida; });
      } else if (filtroArquivadosAtivo === 'alta') {
        lista = lista.filter(function (o) { return (o.prio || '').toLowerCase() === 'alta'; });
      } else if (filtroArquivadosAtivo === 'media') {
        lista = lista.filter(function (o) { return (o.prio || '').toLowerCase() === 'média' || (o.prio || '').toLowerCase() === 'media'; });
      } else if (filtroArquivadosAtivo === 'baixa') {
        lista = lista.filter(function (o) { return (o.prio || '').toLowerCase() === 'baixa'; });
      }
      if (lista.length === 0) {
        container.innerHTML =
          '<div style="text-align:center;padding:48px 16px;background:var(--surface);border:1px solid var(--border-lt);border-radius:var(--r-lg);">' +
            '<i data-lucide="eye" style="width:36px;height:36px;color:var(--muted);stroke-width:1.5;margin-bottom:10px;"></i>' +
            '<p style="color:var(--txt);font-size:14px;font-weight:600;">Nenhuma ocorrência em observação</p>' +
            '<p style="color:var(--muted);font-size:12px;margin-top:3px;">Quando uma ocorrência for resolvida na opção \'Resolvido (Em Observação)\', ela ficará aqui para acompanhamento dos próximos turnos.</p>' +
          '</div>';
        if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
        return;
      }
      function renderCardArquivadoHTML(oc) {
        var plClass = typeof window.prioLine === 'function' ? window.prioLine(oc.prio) : 'pl-y';
        var tgClass = typeof window.tagClass === 'function' ? window.tagClass(oc.prio) : 'tag-y';
        var prog = calcularProgressoObservacao(oc);
        var timeRel = typeof window.formatDataRelativa === 'function' ? window.formatDataRelativa(oc.criado || oc.dataCriacao) : '';
        var timeH = timeRel ? '<span class="oc-meta-item" style="color:var(--muted);"><i data-lucide="clock" style="width:11.5px;height:11.5px;stroke-width:2;color:var(--dim);"></i>' + escapeHTML(timeRel) + '</span>' : '';
        var localH = oc.local ? '<span class="oc-meta-item"><i data-lucide="map-pin" style="width:11.5px;height:11.5px;stroke-width:2;color:var(--dim);"></i>' + escapeHTML(oc.local) + '</span>' : '';
        var criadorArq = (typeof window.obterCriadorOcorrencia === 'function') ? window.obterCriadorOcorrencia(oc) : (oc.criadoPor || Session.getUserName());
        var respArq = (typeof window.formatarAtribuicaoResp === 'function') ? window.formatarAtribuicaoResp(oc.resp) : (oc.resp || 'Equipe do Turno (Todos)');
        var respH = '<span class="oc-meta-item"><i data-lucide="user-check" style="width:11.5px;height:11.5px;stroke-width:2;color:var(--blue);"></i>Criado por: <strong style="color:var(--txt);">' + escapeHTML(criadorArq) + '</strong></span>' +
                    '<span class="oc-meta-item"><i data-lucide="users" style="width:11.5px;height:11.5px;stroke-width:2;color:var(--dim);"></i>' + escapeHTML(respArq) + '</span>';
        var resolucaoH = (oc.resolucao && oc.resolucao.descRes) ? ('<p style="font-size:12px;color:var(--green-dk);background:#F0FDF4;padding:6px 10px;border-radius:6px;border:1px solid #BBF7D0;margin-top:6px;"><strong>Solução Aplicada:</strong> ' + escapeHTML(oc.resolucao.descRes) + '</p>') : '';
        var progCor = prog.cumprida ? '#10B981' : '#6366F1';
        var progBg  = prog.cumprida ? '#ECFDF5' : '#EEF2FF';
        var progBdr = prog.cumprida ? '#A7F3D0' : '#C7D2FE';
        var progTxt = prog.cumprida ? '#065F46' : '#3730A3';
        var progressoObsH =
          '<div style="margin-top:8px;padding:8px 10px;background:' + progBg + ';border:1px solid ' + progBdr + ';border-radius:8px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;font-size:11.5px;font-weight:700;color:' + progTxt + ';margin-bottom:5px;">' +
              '<span style="display:inline-flex;align-items:center;gap:5px;">' +
                (prog.cumprida
                  ? '<i data-lucide="check-circle-2" style="width:13px;height:13px;stroke-width:2.3;"></i> Meta de observação cumprida — Pronto para concluir!'
                  : ('<i data-lucide="clock" style="width:13px;height:13px;stroke-width:2.2;"></i> Em observação há ' + prog.tempoLabel + ' (Meta: ' + prog.metaHoras + 'h sem falhas)')) +
              '</span>' +
              '<span>' + prog.pct + '%</span>' +
            '</div>' +
            '<div style="width:100%;height:6px;background:rgba(255,255,255,0.75);border-radius:99px;overflow:hidden;">' +
              '<div style="width:' + prog.pct + '%;height:100%;background:' + progCor + ';border-radius:99px;transition:width .3s ease;"></div>' +
            '</div>' +
          '</div>';
        var carimbosH = '';
        if (prog.validacoes.length > 0) {
          carimbosH =
            '<div style="margin-top:6px;display:flex;flex-direction:column;gap:3px;">' +
              prog.validacoes.map(function (v) {
                var turnoTxt = v.turno ? (' [' + escapeHTML(v.turno) + ']') : '';
                return '<div style="font-size:11px;color:#047857;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:6px;padding:4px 8px;display:flex;align-items:center;gap:5px;">' +
                  '<i data-lucide="check" style="width:12px;height:12px;stroke-width:2.5;flex-shrink:0;"></i>' +
                  '<span>Estável no turno' + turnoTxt + ' — verificado por <strong>' + escapeHTML(v.operador || 'Operador') + '</strong> (' + escapeHTML(v.dataHora || '') + ')</span>' +
                '</div>';
              }).join('') +
            '</div>';
        }
        var safeArqJsId = escapeJSString(oc.id);
        var cardBorderStyle = prog.cumprida ? 'background:#FFFFFF;border-color:#A7F3D0;cursor:pointer;margin-bottom:10px;' : 'background:#FFFFFF;cursor:pointer;margin-bottom:10px;';
        var descClean = Markers.strip(oc.desc || '');
        var descRendered = typeof window.formatarTextoComLinks === 'function' ? window.formatarTextoComLinks(descClean, true) : escapeHTML(descClean);
        return (
          '<article class="oc-card" tabindex="0" role="button" style="' + cardBorderStyle + '" onclick="verDetalhesHistoricoDirect(\'' + safeArqJsId + '\')">' +
            '<div class="prio-line ' + plClass + '"></div>' +
            '<div class="oc-body">' +
              '<div class="oc-header">' +
                '<h3>' + escapeHTML(oc.titulo || 'Ocorrência') + '</h3>' +
                '<span class="tag ' + tgClass + '">' + escapeHTML(oc.prio || 'Média') + '</span>' +
                '<span class="tag tag-ind" style="font-weight:600;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="eye" style="width:11px;height:11px;stroke-width:2.2;"></i> Em Observação</span>' +
                '<span class="tag tag-teal-soft">' + escapeHTML(oc.cat || 'Equipamento') + '</span>' +
                (oc.equipamento ? '<span class="tag tag-blue-soft">' + escapeHTML(oc.equipamento) + '</span>' : '') +
              '</div>' +
              '<p class="oc-desc">' + descRendered + '</p>' +
              ((oc.link || (oc.resolucao && oc.resolucao.link)) && typeof window.renderBotaoLinkExterno === 'function'
                ? '<div style="margin-top:4px;margin-bottom:6px;">' + window.renderBotaoLinkExterno(oc.link || (oc.resolucao && oc.resolucao.link), null, true) + '</div>'
                : '') +
              resolucaoH +
              progressoObsH +
              carimbosH +
              '<div class="oc-meta" style="margin-top:8px;">' +
                respH +
                localH +
                timeH +
              '</div>' +
            '</div>' +
            '<div class="oc-actions" style="flex-direction:column;align-items:stretch;justify-content:center;gap:6px;" onclick="event.stopPropagation();">' +
              '<button class="btn-card-action btn-card-resolve" onclick="event.stopPropagation(); concluirVerificacaoArquivado(\'' + safeArqJsId + '\');" title="Encerrar observação e concluir definitivamente">' +
                '<i data-lucide="check-circle-2" style="width:13px;height:13px;stroke-width:2.2;"></i> Concluir' +
              '</button>' +
              '<button class="btn-card-action btn-card-restore" onclick="event.stopPropagation(); registrarCheckObservacaoTurno(\'' + safeArqJsId + '\');" title="Confirmar que foi testado e operou sem falhas neste turno">' +
                '<i data-lucide="shield-check" style="width:13px;height:13px;stroke-width:2.2;"></i> Testado no Turno' +
              '</button>' +
              '<button class="btn-card-action" style="background:#FEF2F2;color:#DC2626;border-color:#FECACA;" onclick="event.stopPropagation(); restaurarArquivadoParaAbertas(\'' + safeArqJsId + '\');" title="O problema retornou — reabrir ocorrência como Reincidente">' +
                '<i data-lucide="alert-triangle" style="width:13px;height:13px;stroke-width:2.2;"></i> Voltou a Falhar' +
              '</button>' +
            '</div>' +
          '</article>'
        );
      }
      var secoes = window.agruparPorDias(lista, function (oc) { return oc.criado || oc.dataCriacao; });
      container.innerHTML = window.renderSecoesComCards(secoes, renderCardArquivadoHTML);
      if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
    }
    window.renderArquivados = renderArquivados;

    function resolverOcorrenciaDoModalDetalhes() {
      var itemDetalhes = Store.itemDetalhesAtual;
      if (!itemDetalhes) return;
      var targetId = itemDetalhes.ocId || String(itemDetalhes.id || '').replace(/^h_oc_/, '');
      var targetTitulo = itemDetalhes.titulo;
      if (typeof window.fecharPopup === 'function') window.fecharPopup('popup-detalhes-historico');
      var oc = (Store.ocorrencias || []).find(function (o) { return o && (o.id === targetId || o.id === itemDetalhes.id || o.titulo === targetTitulo); });
      if (typeof window.abrirResolver === 'function') {
        window.abrirResolver(oc ? oc.id : targetId);
      }
    }
    window.resolverOcorrenciaDoModalDetalhes = resolverOcorrenciaDoModalDetalhes;

    function editarOcorrenciaDoModalDetalhes() {
      var itemDetalhes = Store.itemDetalhesAtual;
      if (!itemDetalhes) return;
      var targetId = itemDetalhes.ocId || String(itemDetalhes.id || '').replace(/^h_oc_/, '');
      var targetTitulo = itemDetalhes.titulo;
      if (typeof window.fecharPopup === 'function') window.fecharPopup('popup-detalhes-historico');
      var oc = (Store.ocorrencias || []).find(function (o) { return o && (o.id === targetId || o.id === itemDetalhes.id || o.titulo === targetTitulo); });
      if (typeof window.abrirEditarOcorrencia === 'function') {
        window.abrirEditarOcorrencia(oc ? oc.id : targetId);
      }
    }
    window.editarOcorrenciaDoModalDetalhes = editarOcorrenciaDoModalDetalhes;

    function excluirOcorrenciaDoModalDetalhes() {
      var itemDetalhes = Store.itemDetalhesAtual;
      if (!itemDetalhes) return;
      var targetId = itemDetalhes.ocId || itemDetalhes.id;
      if (typeof window.fecharPopup === 'function') window.fecharPopup('popup-detalhes-historico');
      excluirOcorrencia(targetId);
    }
    window.excluirOcorrenciaDoModalDetalhes = excluirOcorrenciaDoModalDetalhes;

    function confirmarResolucao() {
      var resolverAtualId = Store.resolverAtualId;
      if (!resolverAtualId) {
        if (typeof window.fecharPopup === 'function') window.fecharPopup('popup-resolver');
        return;
      }
      var resolverDesc = document.getElementById('resolver-desc');
      var descResolucao = resolverDesc ? resolverDesc.value.trim() : '';
      if (descResolucao.length < 10) {
        if (typeof window.mostrarToast === 'function') {
          window.mostrarToast('Descrição Necessária', 'Preencha a descrição da resolução com pelo menos 10 caracteres (' + descResolucao.length + '/10).', 'warning');
        }
        if (resolverDesc) resolverDesc.focus();
        return;
      }
      var list = Store.ocorrencias || [];
      var idx = list.findIndex(function (o) { return o && o.id === resolverAtualId; });
      if (idx === -1) {
        if (typeof window.fecharPopup === 'function') window.fecharPopup('popup-resolver');
        return;
      }
      var statusEl = document.getElementById('resolver-status');
      var statusEscolhido = statusEl ? statusEl.value : 'Resolvido';
      var oc = list[idx];
      var nowStr = typeof window.formatDataHoraLocal === 'function' ? window.formatDataHoraLocal() : new Date().toLocaleString('pt-BR');
      var usuarioLogado = Session.getUserName();
      var isParcial = (statusEscolhido === 'Parcialmente resolvido');
      var isArquivada = (statusEscolhido === 'Em Observação' || statusEscolhido === 'Resolvida e Arquivada');
      var horasObsEl = document.getElementById('resolver-obs-horas');
      var metaHorasObs = 24;
      if (horasObsEl) {
        if (horasObsEl.value === 'custom') {
          var cValEl = document.getElementById('resolver-obs-custom-val');
          var cUnitEl = document.getElementById('resolver-obs-custom-unit');
          var numVal = cValEl ? Math.max(1, parseInt(cValEl.value, 10) || 1) : 24;
          metaHorasObs = (cUnitEl && cUnitEl.value === 'dias') ? (numVal * 24) : numVal;
        } else {
          metaHorasObs = parseInt(horasObsEl.value, 10) || 24;
        }
      }
      var updatedTags = (oc.tags || []).filter(function (t) { return t !== 'Parcialmente Resolvida' && t !== 'Arquivada' && t !== 'Em Observação' && t !== 'Validada Pós-Reparo'; });
      if (isParcial) {
        updatedTags.push('Parcialmente Resolvida');
      } else if (isArquivada) {
        updatedTags.push('Em Observação');
      }
      var novoStatus = 'resolvida';
      if (isParcial) novoStatus = 'aberta';
      else if (isArquivada) novoStatus = 'arquivada';
      var anexosNovos = ((Store.uploadedFilesStore && Store.uploadedFilesStore['resolver-previews']) || []).slice();
      var anexosAntigos = (oc.anexos && Array.isArray(oc.anexos)) ? oc.anexos : ((oc.resolucao && Array.isArray(oc.resolucao.anexos)) ? oc.resolucao.anexos : []);
      var anexosCombinados = anexosAntigos.concat(anexosNovos);
      var resObjFinal = {
        statusRes: statusEscolhido,
        descRes:   descResolucao,
        data:      Date.now(),
        resolvidoPor: usuarioLogado,
        criadoPor: (typeof window.obterCriadorOcorrencia === 'function') ? window.obterCriadorOcorrencia(oc) : (oc.criadoPor || usuarioLogado),
        link:      oc.link || (oc.resolucao && oc.resolucao.link) || '',
        anexos:    anexosCombinados,
        historicoEdicoes: oc.historicoEdicoes || (oc.resolucao && oc.resolucao.historicoEdicoes) || []
      };
      if (isArquivada) {
        resObjFinal.inicioObservacao = Date.now();
        resObjFinal.metaHorasObservacao = metaHorasObs;
        resObjFinal.validacoesTurno = (oc.resolucao && Array.isArray(oc.resolucao.validacoesTurno)) ? oc.resolucao.validacoesTurno : [];
      }
      list[idx] = Object.assign({}, oc, {
        status: novoStatus,
        tags: updatedTags,
        anexos: anexosCombinados,
        resolucao: resObjFinal,
        ultimaEdicaoPor: usuarioLogado,
        ultimaEdicaoEm: nowStr
      });
      Store.ocorrencias = list;
      sincronizarOcorrenciaNoHistorico(list[idx]);
      if (typeof window.save === 'function') window.save(list, list[idx], false);
      if (typeof window.fecharPopup === 'function') window.fecharPopup('popup-resolver');
      if (typeof window.renderAll === 'function') window.renderAll(true);
      Store.resolverAtualId = null;
      if (typeof window.mostrarToast === 'function') {
        if (isParcial) {
          window.mostrarToast('Parcialmente Resolvida', 'A ocorrência foi registrada no histórico e continua ativa para acompanhamento.', 'warning');
        } else if (isArquivada) {
          window.mostrarToast('Em Observação', 'Ocorrência enviada para monitoramento pós-reparo (' + metaHorasObs + 'h) nos próximos turnos.', 'info');
        } else {
          window.mostrarToast('Ocorrência Concluída', 'A ocorrência foi resolvida e registrada no histórico geral.', 'success');
        }
      }
    }
    window.confirmarResolucao = confirmarResolucao;

    EventBus.on('cloud:sync', sincronizarLixeiraNuvem);
    EventBus.on('praca:changed', atualizarBadgesLixeira);
    sincronizarLixeiraNuvem();
  });
})(window, document, window.TVApp);
