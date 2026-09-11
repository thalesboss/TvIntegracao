  /* ═══════════════════════════════════════════
     ENVIO DE RELATÓRIO TV (CTRS) E GERADOR AUTOMÁTICO DE OCORRÊNCIAS
  ═══════════════════════════════════════════ */

  function salvarRascunhoRelatorioTV(silencioso) {
    try {
      var dataEl  = document.getElementById('ctrs-data');
      var pracaEl = document.getElementById('ctrs-praca');
      var tipoEl  = document.getElementById('ctrs-tipo');
      var obsEl   = document.getElementById('ctrs-obs');

      var dados = {
        data:  dataEl  ? dataEl.value  : '',
        praca: pracaEl ? pracaEl.value : '',
        tipo:  tipoEl  ? tipoEl.value  : '',
        obs:   obsEl   ? obsEl.value   : '',
        transmissoes: []
      };

      var accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
      accBlocks.forEach(function(acc) {
        var inputs = acc.querySelectorAll('input, select, textarea');
        dados.transmissoes.push({
          cidade:      inputs[0] ? inputs[0].value : '',
          infra:       inputs[1] ? inputs[1].value : '',
          horaAbert:   inputs[2] ? inputs[2].value : '',
          horaFim:     inputs[3] ? inputs[3].value : '',
          audioQ:      inputs[4] ? inputs[4].value : '',
          videoQ:      inputs[5] ? inputs[5].value : '',
          reporter:    inputs[6] ? inputs[6].value : '',
          entradas:    inputs[7] ? inputs[7].value : '',
          rc:          inputs[8] ? inputs[8].value : '',
          statusTx:    inputs[9] ? inputs[9].value : '',
          falhas:      inputs[10] ? inputs[10].value : ''
        });
      });

      localStorage.setItem('tv_ctrs_rascunho_v2', JSON.stringify(dados));
      if (!silencioso) {
        alert('Rascunho do Relatório CTRS salvo com sucesso no navegador!');
      }
    } catch (e) {
      console.warn('Erro ao salvar rascunho CTRS:', e);
    }
  }
  window.salvarRascunhoRelatorioTV = salvarRascunhoRelatorioTV;

  function adicionarTransmissaoCTRS(silencioso) {
    var container = document.getElementById('ctrs-acc-container');
    if (!container) return;

    var currentCount = container.querySelectorAll('.acc-block').length;
    var newNum = currentCount + 1;

    var div = document.createElement('div');
    div.className = 'acc-block';
    div.innerHTML =
      '<div class="acc-head open" onclick="togAcc(this)" aria-expanded="true">' +
        '<span class="acc-title-text">Transmissão Vivo ' + newNum + '</span>' +
        '<i data-lucide="chevron-down" class="acc-arrow" style="width:14px;height:14px;stroke-width:2;"></i>' +
      '</div>' +
      '<div class="acc-body open">' +
        '<div class="fg2">' +
          '<div class="frow"><label>Cidade / Bairro</label><input type="text" placeholder="Ex: Centro — Juiz de Fora"/></div>' +
          '<div class="frow">' +
            '<label>Infraestrutura da Transmissão</label>' +
            '<select>' +
              '<option value="">Selecione o equipamento...</option>' +
              '<option value="LIVE U1">LIVE U1</option>' +
              '<option value="LIVE U2">LIVE U2</option>' +
              '<option value="LIVE U3">LIVE U3</option>' +
              '<option value="LIVE U4">LIVE U4</option>' +
              '<option value="LIVE U SMART">LIVE U SMART</option>' +
              '<option value="REDAÇÃO">REDAÇÃO</option>' +
              '<option value="KMJ">KMJ</option>' +
              '<option value="NET PRAÇA">NET PRAÇA</option>' +
              '<option value="NET PORTARIA">NET PORTARIA</option>' +
              '<option value="FORMATOS NET">FORMATOS NET</option>' +
              '<option value="NET 2º ANDAR">NET 2º ANDAR</option>' +
              '<option value="NET 3º ANDAR">NET 3º ANDAR</option>' +
              '<option value="NET 4º ANDAR">NET 4º ANDAR</option>' +
            '</select>' +
          '</div>' +
          '<div class="frow"><label>Hora Abertura Sinal</label><input type="time"/></div>' +
          '<div class="frow"><label>Hora Final (Teste OK)</label><input type="time"/></div>' +
          '<div class="frow"><label>Qualidade do Áudio</label><select><option>C — Conforme</option><option>NC — Não Conforme</option><option>NA — Não se Aplica</option></select></div>' +
          '<div class="frow"><label>Qualidade do Vídeo</label><select><option>C — Conforme</option><option>NC — Não Conforme</option><option>NA — Não se Aplica</option></select></div>' +
          '<div class="frow"><label>Repórter</label><input type="text" placeholder="Nome do repórter"/></div>' +
          '<div class="frow"><label>Entradas</label><input type="text" placeholder="Ex: 2 entradas conformes — externo"/></div>' +
          '<div class="frow"><label>Repórter Cinematográfico</label><input type="text" placeholder="Nome do RC"/></div>' +
          '<div class="frow"><label>Status da Transmissão</label><select><option>C — Conforme</option><option>NC — Não Conforme</option><option>NA — Não se Aplica</option></select></div>' +
        '</div>' +
        '<div class="frow"><label>Observações</label><textarea placeholder="Descreva as falhas. Se nenhuma, deixe em branco."></textarea></div>' +
        '<div style="display:flex;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--border-lt);margin-top:10px;">' +
          '<button type="button" class="btn btn-ghost btn-xs" onclick="removerTransmissaoCTRS(this);" style="color:var(--red);border-color:var(--red-border);display:inline-flex;align-items:center;gap:5px;padding:4px 10px;" title="Remover esta transmissão">' +
            '<i data-lucide="trash-2" style="width:13px;height:13px;stroke-width:2;"></i>' +
            '<span>Remover Transmissão</span>' +
          '</button>' +
        '</div>' +
      '</div>';

    container.appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (!silencioso) {
      salvarRascunhoRelatorioTV(true);
    }
  }

  function removerTransmissaoCTRS(btn) {
    var block = btn.closest('.acc-block');
    if (!block) return;
    block.remove();

    var remaining = document.querySelectorAll('#page-ctrs .acc-block');
    remaining.forEach(function(b, idx) {
      var num = idx + 1;
      var titleSpan = b.querySelector('.acc-title-text');
      if (titleSpan) {
        titleSpan.textContent = 'Transmissão Vivo ' + num;
      } else {
        var head = b.querySelector('.acc-head');
        if (head) {
          for (var i = 0; i < head.childNodes.length; i++) {
            if (head.childNodes[i].nodeType === 3 && head.childNodes[i].textContent.indexOf('Transmissão Vivo') !== -1) {
              head.childNodes[i].textContent = 'Transmissão Vivo ' + num;
              break;
            }
          }
        }
      }
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
    salvarRascunhoRelatorioTV(true);
  }

  window.adicionarTransmissaoCTRS = adicionarTransmissaoCTRS;
  window.removerTransmissaoCTRS   = removerTransmissaoCTRS;

  function carregarRascunhoRelatorioTV() {
    try {
      var raw = localStorage.getItem('tv_ctrs_rascunho_v2');
      if (!raw) return;
      var dados = JSON.parse(raw);
      if (!dados) return;

      var dataEl  = document.getElementById('ctrs-data');
      var pracaEl = document.getElementById('ctrs-praca');
      var tipoEl  = document.getElementById('ctrs-tipo');
      var obsEl   = document.getElementById('ctrs-obs');

      if (dataEl && dados.data)   dataEl.value = dados.data;
      if (pracaEl && dados.praca) pracaEl.value = dados.praca;
      if (tipoEl && dados.tipo)   tipoEl.value = dados.tipo;
      if (obsEl && dados.obs)     obsEl.value = dados.obs;

      if (Array.isArray(dados.transmissoes)) {
        var container = document.getElementById('ctrs-acc-container');
        var accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
        while (accBlocks.length < dados.transmissoes.length && container) {
          adicionarTransmissaoCTRS(true);
          accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
        }

        dados.transmissoes.forEach(function(tx, idx) {
          if (accBlocks[idx]) {
            var inputs = accBlocks[idx].querySelectorAll('input, select, textarea');
            if (inputs[0] && tx.cidade !== undefined)    inputs[0].value = tx.cidade;
            if (inputs[1] && tx.infra !== undefined)     inputs[1].value = tx.infra;
            if (inputs[2] && tx.horaAbert !== undefined) inputs[2].value = tx.horaAbert;
            if (inputs[3] && tx.horaFim !== undefined)   inputs[3].value = tx.horaFim;
            if (inputs[4] && tx.audioQ !== undefined)    inputs[4].value = tx.audioQ;
            if (inputs[5] && tx.videoQ !== undefined)    inputs[5].value = tx.videoQ;
            if (inputs[6] && tx.reporter !== undefined)  inputs[6].value = tx.reporter;
            if (inputs[7] && tx.entradas !== undefined)  inputs[7].value = tx.entradas;
            if (inputs[8] && tx.rc !== undefined)        inputs[8].value = tx.rc;
            if (inputs[9] && tx.statusTx !== undefined)  inputs[9].value = tx.statusTx;
            if (inputs[10] && tx.falhas !== undefined)   inputs[10].value = tx.falhas;
          }
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar rascunho CTRS:', e);
    }
  }

  function gerarHTMLTemplateCTRS() {
    var dataEl  = document.getElementById('ctrs-data');
    var pracaEl = document.getElementById('ctrs-praca');
    var tipoEl  = document.getElementById('ctrs-tipo');
    var obsEl   = document.getElementById('ctrs-obs');

    var praca = pracaEl ? pracaEl.value : 'Juiz de Fora';
    var dataRaw = dataEl && dataEl.value ? dataEl.value : '';
    var dataFmt = '';
    if (dataRaw) {
      var p = dataRaw.split('-');
      dataFmt = (p.length === 3) ? (p[2] + '/' + p[1] + '/' + p[0]) : dataRaw;
    } else {
      var dNow = new Date();
      var dia = String(dNow.getDate()).padStart(2, '0');
      var mes = String(dNow.getMonth() + 1).padStart(2, '0');
      dataFmt = dia + '/' + mes + '/' + dNow.getFullYear();
    }

    var tipo = tipoEl ? tipoEl.value : 'INTEGRAÇÃO NOTÍCIA';
    var inCheck = '', mg1Check = '', mg2Check = '', outrosCheck = '';
    var tipoUpper = tipo.toUpperCase();
    if (tipoUpper.includes('NOTÍCIA') || tipoUpper.includes('IN')) {
      inCheck = 'X';
    } else if (tipoUpper === 'MG1') {
      mg1Check = 'X';
    } else if (tipoUpper === 'MG2') {
      mg2Check = 'X';
    } else {
      outrosCheck = 'X';
    }

    var obs = obsEl ? obsEl.value.trim() : '';

    var formatTimeVal = function(val) {
      if (!val) return '';
      var parts = val.trim().split(':');
      if (parts.length === 2) return parts[0] + 'h' + parts[1] + '\'';
      return val.trim();
    };

    var formatQualidade = function(val) {
      if (!val) return 'C';
      var v = val.trim();
      if (v.startsWith('NC') || v.startsWith('Não Conforme')) return 'NC';
      if (v.startsWith('NA') || v.startsWith('Não se Aplica')) return 'NA';
      return 'C';
    };

    var accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
    var transmissoesHTML = '';

    accBlocks.forEach(function(acc, idx) {
      var num = idx + 1;
      var inputs = acc.querySelectorAll('input, select, textarea');
      var cidade    = (inputs[0] && inputs[0].value.trim()) || '';
      var infra     = (inputs[1] && inputs[1].value.trim()) || '';
      var horaAbert = formatTimeVal(inputs[2] ? inputs[2].value : '');
      var horaFim   = formatTimeVal(inputs[3] ? inputs[3].value : '');
      var audioQ    = formatQualidade(inputs[4] ? inputs[4].value : '');
      var videoQ    = formatQualidade(inputs[5] ? inputs[5].value : '');
      var reporter  = (inputs[6] && inputs[6].value.trim()) || '';
      var entradas  = (inputs[7] && inputs[7].value.trim()) || '';
      var rc        = (inputs[8] && inputs[8].value.trim()) || '';
      var statusTx  = formatQualidade(inputs[9] ? inputs[9].value : '');
      var falhas    = (inputs[10] && inputs[10].value.trim()) || '';

      var reporterCompleto = reporter;
      if (entradas) {
        reporterCompleto += (reporterCompleto ? ' (' + entradas + ')' : entradas);
      }

      var cidadeCompleta = cidade;
      if (cidadeCompleta && !cidadeCompleta.toLowerCase().includes(praca.toLowerCase())) {
        cidadeCompleta = praca + ' - ' + cidadeCompleta;
      } else if (!cidadeCompleta) {
        cidadeCompleta = praca;
      }

      transmissoesHTML +=
        '<table cellpadding="4" cellspacing="0" style="width:100%; max-width:820px; border-collapse:collapse; font-family:Arial, Helvetica, sans-serif; font-size:11.5px; color:#000000; border:1.5px solid #000000; margin-bottom:12px;">' +
          '<tr style="background-color:#F2F2F2;">' +
            '<td colspan="3" style="text-align:center; font-weight:bold; font-size:12px; border:1px solid #000000; padding:4px;">' +
              'Informações da Transmissão ao Vivo ' + num +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td colspan="3" style="border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Cidade:</strong> ' + cidadeCompleta +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="width:45%; border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Infraestrutura de Transmissão Utilizada:</strong> ' + infra +
            '</td>' +
            '<td style="width:33%; border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Hora Abertura Sinal:</strong> ' + horaAbert +
            '</td>' +
            '<td style="width:22%; border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Qualidade Áudio:</strong> ' + audioQ +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Repórter:</strong> ' + reporterCompleto +
            '</td>' +
            '<td style="border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Hora final (Teste OK):</strong> ' + horaFim +
            '</td>' +
            '<td style="border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Qualidade Vídeo:</strong> ' + videoQ +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Repórter Cinematográfico:</strong> ' + rc +
            '</td>' +
            '<td colspan="2" style="border:1px solid #000000; padding:4px 8px;">' +
              '<strong>Status da Transmissão:</strong> ' + statusTx +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td colspan="3" style="border:1px solid #000000; padding:4px 8px; min-height:30px;">' +
              '<strong>Observações:</strong> ' + (falhas || '') +
            '</td>' +
          '</tr>' +
        '</table>';
    });

    var htmlCompleto =
      '<div style="font-family:Arial, Helvetica, sans-serif; color:#000000; max-width:820px; margin:0 auto; padding:10px;">' +
        '<!-- CABEÇALHO OFICIAL ENGENHARIA -->' +
        '<table cellpadding="4" cellspacing="0" style="width:100%; max-width:820px; border-collapse:collapse; font-family:Arial, sans-serif; font-size:11.5px; color:#000000; border:1.5px solid #000000; margin-bottom:12px;">' +
          '<tr>' +
            '<td rowspan="2" style="width:160px; text-align:center; vertical-align:middle; border:1px solid #000000; padding:8px;">' +
              '<div style="font-weight:900; font-size:15px; letter-spacing:1px; color:#000000;">TV INTEGRAÇÃO</div>' +
            '</td>' +
            '<td style="text-align:center; vertical-align:middle; border:1px solid #000000; padding:6px; font-weight:bold; font-size:12px; line-height:1.4;">' +
              'Processo Engenharia 1.1.1 – P02 – F02<br/>' +
              'Checklist de Transmissão ao Vivo CTRS' +
            '</td>' +
            '<td style="width:140px; text-align:center; vertical-align:middle; border:1px solid #000000; padding:6px; font-size:11px;">' +
              'Formulário<br/>' +
              '<strong>Página: 1/1</strong>' +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="border:1px solid #000000; padding:4px 8px; font-size:10.5px;">' +
              '<table style="width:100%; border-collapse:collapse;">' +
                '<tr>' +
                  '<td style="text-align:left; border:none; padding:0;">Data Emissão Inicial: 11/08/2011</td>' +
                  '<td style="text-align:right; border:none; padding:0;">Data Revisão: 01/04/2016</td>' +
                '</tr>' +
              '</table>' +
            '</td>' +
            '<td style="text-align:center; border:1px solid #000000; padding:4px 8px; font-size:10.5px;">' +
              'Número Revisão: 02' +
            '</td>' +
          '</tr>' +
        '</table>' +

        '<!-- INFORMAÇÕES PRINCIPAIS -->' +
        '<table cellpadding="4" cellspacing="0" style="width:100%; max-width:820px; border-collapse:collapse; font-family:Arial, sans-serif; font-size:11.5px; color:#000000; border:1.5px solid #000000; margin-bottom:12px;">' +
          '<tr style="background-color:#F2F2F2;">' +
            '<td colspan="4" style="text-align:center; font-weight:bold; border:1px solid #000000; padding:4px;">' +
              'Informações Principais' +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td colspan="2" style="width:50%; border:1px solid #000000; padding:5px 8px;">' +
              '<strong>Data:</strong> ' + dataFmt +
            '</td>' +
            '<td colspan="2" style="width:50%; border:1px solid #000000; padding:5px 8px;">' +
              '<strong>Praça:</strong> ' + praca +
            '</td>' +
          '</tr>' +
          '<tr style="text-align:center;">' +
            '<td style="width:25%; border:1px solid #000000; padding:5px 8px;">' +
              '<strong>IN:</strong> ' + (inCheck || '&nbsp;') +
            '</td>' +
            '<td style="width:25%; border:1px solid #000000; padding:5px 8px;">' +
              '<strong>MG1:</strong> ' + (mg1Check || '&nbsp;') +
            '</td>' +
            '<td style="width:25%; border:1px solid #000000; padding:5px 8px;">' +
              '<strong>MG2:</strong> ' + (mg2Check || '&nbsp;') +
            '</td>' +
            '<td style="width:25%; border:1px solid #000000; padding:5px 8px;">' +
              '<strong>OUTROS:</strong> ' + (outrosCheck || '&nbsp;') +
            '</td>' +
          '</tr>' +
        '</table>' +

        '<!-- TRANSMISSÕES AO VIVO -->' +
        transmissoesHTML +

        '<!-- LEGENDA -->' +
        '<table cellpadding="4" cellspacing="0" style="width:100%; max-width:820px; border-collapse:collapse; font-family:Arial, sans-serif; font-size:11px; color:#000000; border:1.5px solid #000000; margin-bottom:12px;">' +
          '<tr style="background-color:#F2F2F2;">' +
            '<td colspan="3" style="text-align:center; font-weight:bold; border:1px solid #000000; padding:4px;">' +
              'Legenda' +
            '</td>' +
          '</tr>' +
          '<tr style="text-align:center;">' +
            '<td style="width:33.3%; border:1px solid #000000; padding:5px 8px;">C – Conforme</td>' +
            '<td style="width:33.3%; border:1px solid #000000; padding:5px 8px;">NC – Não Conforme</td>' +
            '<td style="width:33.3%; border:1px solid #000000; padding:5px 8px;">NA – Não se Aplica</td>' +
          '</tr>' +
        '</table>' +

        '<!-- OBSERVAÇÕES -->' +
        '<table cellpadding="4" cellspacing="0" style="width:100%; max-width:820px; border-collapse:collapse; font-family:Arial, sans-serif; font-size:11.5px; color:#000000; border:1.5px solid #000000; margin-bottom:12px;">' +
          '<tr style="background-color:#F2F2F2;">' +
            '<td style="text-align:center; font-weight:bold; border:1px solid #000000; padding:4px;">' +
              'Observações' +
            '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="border:1px solid #000000; padding:8px; min-height:40px; white-space:pre-wrap;">' +
              (obs || 'Sem observações.') +
            '</td>' +
          '</tr>' +
        '</table>' +
      '</div>';

    return {
      html: htmlCompleto,
      assunto: 'Transmissão ao Vivo - CTRS - ' + (inCheck ? 'IN' : (mg1Check ? 'MG1' : (mg2Check ? 'MG2' : 'OUTROS'))) + ' - ' + praca + ' - ' + dataFmt
    };
  }

  function limparFormularioCTRS(confirmar) {
    if (confirmar && !confirm('Deseja realmente limpar todos os campos preenchidos do relatório CTRS?')) {
      return;
    }
    try {
      localStorage.removeItem('tv_ctrs_rascunho_v2');

      var dataEl = document.getElementById('ctrs-data');
      var obsEl  = document.getElementById('ctrs-obs');
      if (dataEl) dataEl.value = new Date().toISOString().split('T')[0];
      if (obsEl)  obsEl.value = '';

      var accBlocks = document.querySelectorAll('#page-ctrs .acc-block');
      accBlocks.forEach(function(acc) {
        var inputs = acc.querySelectorAll('input, select, textarea');
        inputs.forEach(function(inp) {
          if (inp.tagName === 'SELECT') inp.selectedIndex = 0;
          else inp.value = '';
        });
      });

      // Se houver mais de 4 blocos dinâmicos, remove os excedentes
      var container = document.getElementById('ctrs-acc-container');
      if (container) {
        var blocks = container.querySelectorAll('.acc-block');
        for (var i = 4; i < blocks.length; i++) {
          blocks[i].remove();
        }
      }

      if (confirmar && typeof mostrarToast === 'function') {
        mostrarToast('Formulário Limpo', 'Os campos do CTRS foram zerados para o próximo preenchimento.', 'info');
      }
    } catch (e) {
      console.warn('Erro ao limpar CTRS:', e);
    }
  }
  window.limparFormularioCTRS = limparFormularioCTRS;

  function copiarRelatorioOutlook() {
    var resultado = gerarHTMLTemplateCTRS();
    var html = resultado.html;
    var assunto = resultado.assunto;

    var assuntoEl = document.getElementById('ctrs-outlook-assunto');
    if (assuntoEl) {
      assuntoEl.textContent = assunto;
    }

    var copiado = false;
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        var blobHtml = new Blob([html], { type: 'text/html' });
        var blobText = new Blob([assunto + '\n\n' + html.replace(/<[^>]+>/g, ' ')], { type: 'text/plain' });
        var item = new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText
        });
        navigator.clipboard.write([item]).then(function() {
          abrirPopup('popup-ctrs-outlook');
          limparFormularioCTRS(false);
        }).catch(function(err) {
          fallbackCopiarAreaTransferencia(html);
          limparFormularioCTRS(false);
        });
        copiado = true;
      } catch (e) {
        copiado = false;
      }
    }

    if (!copiado) {
      fallbackCopiarAreaTransferencia(html);
      limparFormularioCTRS(false);
    }
  }
  window.copiarRelatorioOutlook = copiarRelatorioOutlook;

  function fallbackCopiarAreaTransferencia(html) {
    var container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.pointerEvents = 'none';
    container.style.opacity = '0';
    document.body.appendChild(container);

    var range = document.createRange();
    range.selectNode(container);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    try {
      document.execCommand('copy');
      abrirPopup('popup-ctrs-outlook');
    } catch (e) {
      alert('Não foi possível copiar automaticamente. Por favor selecione e copie os dados.');
    }

    window.getSelection().removeAllRanges();
    document.body.removeChild(container);
  }

  function enviarRelatorioTV() {
    var nowStr = formatDataHoraLocal();
    var pracaEl = document.getElementById('ctrs-praca');
    var tipoEl  = document.getElementById('ctrs-tipo');
    var obsEl   = document.getElementById('ctrs-obs');

    var praca = pracaEl ? pracaEl.value : 'Juiz de Fora';
    var tipo  = tipoEl ? tipoEl.value : 'INTEGRAÇÃO NOTÍCIA';
    var obs   = obsEl ? obsEl.value.trim() : '';

    /* Coleta falhas registradas nas seções sanfonadas */
    var falhasEncontradas = [];
    if (obs && !obs.toLowerCase().includes('sem ocorrência') && !obs.toLowerCase().includes('sem ocorrencia')) {
      falhasEncontradas.push(obs);
    }

    document.querySelectorAll('#page-ctrs .acc-body textarea').forEach(function(txt, i) {
      var val = txt.value.trim();
      if (val && !val.toLowerCase().includes('sem ocorrência') && !val.toLowerCase().includes('sem ocorrencia')) {
        falhasEncontradas.push('Transmissão Vivo ' + (i + 1) + ': ' + val);
      }
    });

    var novasOcorrenciasCriadas = 0;

    /* Para cada falha relatada, cria automaticamente uma Ocorrência no Dashboard */
    falhasEncontradas.forEach(function(falhaTxt, idx) {
      novasOcorrenciasCriadas++;
      var novaOc = {
        id:          'oc_auto_' + Date.now() + '_' + idx,
        titulo:      'Falha em Relatório TV (' + tipo + ')',
        prio:        'Alta',
        cat:         'Telejornal / Transmissão ao Vivo',
        resp:        'Todos do turno',
        local:       praca,
        prazo:       '12:00',
        desc:        falhaTxt,
        mine:        false,
        tags:        ['Relatório TV', 'Automática'],
        status:      'aberta',
        criado:      Date.now(),
        dataCriacao: nowStr,
        resolucao:   null
      };
      ocorrencias = [novaOc].concat(ocorrencias);
    });

    if (novasOcorrenciasCriadas > 0) {
      save(ocorrencias);
    }

    /* Registra o Relatório no Histórico */
    var novoHist = {
      id:            'h_ctrs_' + Date.now(),
      tipo:          'relatorio',
      subtipo:       'CTRS Transmissão',
      titulo:        'Checklist CTRS — ' + tipo + ' (' + praca + ')',
      equipamento:   'Equipamentos de Transmissão / CTRS',
      categoria:     'Transmissão CTRS',
      local:         praca,
      dataCriacao:   nowStr,
      criadoPor:     getUsuarioAtual(),
      descCriacao:   'Relatório TV enviado. ' + (falhasEncontradas.length > 0 ? (falhasEncontradas.length + ' falha(s) identificada(s) e convertida(s) em ocorrência(s).') : 'Sem falhas registradas.'),
      status:        'Concluído',
      dataResolucao: nowStr,
      resolvidoPor:  getUsuarioAtual(),
      descResolucao: 'Relatório processado e sincronizado automaticamente.'
    };

    historicoSeedData = [novoHist].concat(historicoSeedData);
    saveHistorico(historicoSeedData);

    // Limpa o rascunho e o formulário do CTRS para a próxima transmissão
    limparFormularioCTRS(false);

    renderAll();

    if (novasOcorrenciasCriadas > 0) {
      if (typeof adicionarNotificacao === 'function') {
        adicionarNotificacao('Ocorrência Criada do Relatório', novasOcorrenciasCriadas + ' falha(s) do relatório convertida(s) em Ocorrência Ativa no Dashboard!', 'warning');
      }
      alert('Relatório TV registrado no sistema!\n\n⚠️ Foi identificada falha e ' + novasOcorrenciasCriadas + ' nova Ocorrência foi gerada AUTOMATICAMENTE no Dashboard!\n\nNota: A função de envio por e-mail ainda não está disponível.');
    } else {
      if (typeof adicionarNotificacao === 'function') {
        adicionarNotificacao('Relatório TV Enviado', 'Relatório processado com sucesso.', 'success');
      }
      alert('Relatório TV registrado com sucesso no Histórico!\n\nNota: A função de envio por e-mail ainda não está disponível.');
    }
  }
  window.enviarRelatorioTV = enviarRelatorioTV;

  if (typeof registrarAutosaveListener === 'function') {
    registrarAutosaveListener('page-ctrs', salvarRascunhoRelatorioTV);
  }
