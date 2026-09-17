  /* ═══════════════════════════════════════════
     INDEXEDDB LOCAL MEDIA CACHE (Para vídeos e fotos de qualquer tamanho)
  ═══════════════════════════════════════════ */
  var IDB_NAME = 'SistemaTV_MediaDB';
  var IDB_STORE = 'midias';

  function openMediaDB() {
    return new Promise(function(resolve) {
      if (!window.indexedDB) { resolve(null); return; }
      var req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function() { resolve(null); };
    });
  }

  function salvarMidiaIDB(id, dataUrl, meta) {
    return openMediaDB().then(function(db) {
      if (!db) return false;
      return new Promise(function(resolve) {
        try {
          var tx = db.transaction(IDB_STORE, 'readwrite');
          var store = tx.objectStore(IDB_STORE);
          store.put({ id: id, data: dataUrl, meta: meta || {}, timestamp: Date.now() });
          tx.oncomplete = function() { resolve(true); };
          tx.onerror = function() { resolve(false); };
        } catch (e) { resolve(false); }
      });
    });
  }

  function carregarMidiaIDB(id) {
    return openMediaDB().then(function(db) {
      if (!db) return null;
      return new Promise(function(resolve) {
        try {
          var tx = db.transaction(IDB_STORE, 'readonly');
          var store = tx.objectStore(IDB_STORE);
          var req = store.get(id);
          req.onsuccess = function(e) { resolve(e.target.result ? e.target.result.data : null); };
          req.onerror = function() { resolve(null); };
        } catch (e) { resolve(null); }
      });
    });
  }
  window.carregarMidiaIDB = carregarMidiaIDB;

  /* ═══════════════════════════════════════════
     PREVIEW E GERENCIAMENTO DE ARQUIVOS (PDF, FOTOS, VÍDEOS)
  ═══════════════════════════════════════════ */

  var uploadedFilesStore = {};

  function uploadArquivoParaStorage(anexo) {
    if (!anexo) return Promise.resolve(null);
    if (anexo.url && anexo.url.startsWith('http')) return Promise.resolve(anexo);
    if (!anexo.fileObj) return Promise.resolve(anexo);

    var timestamp = Date.now();
    var cleanName = (anexo.name || 'arquivo').replace(/[^a-zA-Z0-9._-]/g, '_');
    var filePath = timestamp + '_' + cleanName;
    var uploadUrl = SUPABASE_URL.replace(/\/$/, '') + '/storage/v1/object/anexos/' + filePath;

    return fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': anexo.type || 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: anexo.fileObj
    })
    .then(function(res) {
      if (res.ok) {
        var publicUrl = SUPABASE_URL.replace(/\/$/, '') + '/storage/v1/object/public/anexos/' + filePath;
        return {
          id: anexo.id,
          name: anexo.name,
          type: anexo.type,
          size: anexo.size,
          url: publicUrl,
          dataUrl: anexo.dataUrl
        };
      }
      return anexo;
    })
    .catch(function(err) {
      console.warn('[Storage Upload Fallback]', err);
      return anexo;
    });
  }
  window.uploadArquivoParaStorage = uploadArquivoParaStorage;

  function comprimirImagemSeNecessario(file, callback) {
    if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      var reader = new FileReader();
      reader.onload = function(e) { callback(e.target.result, file); };
      reader.readAsDataURL(file);
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var maxDim = 1600;
        var width = img.width;
        var height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        var compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

        if (typeof canvas.toBlob === 'function') {
          canvas.toBlob(function(blob) {
            var compressedBlob = blob || file;
            callback(compressedDataUrl, compressedBlob);
          }, 'image/jpeg', 0.82);
        } else {
          callback(compressedDataUrl, file);
        }
      };
      img.onerror = function() {
        callback(e.target.result, file);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  window.comprimirImagemSeNecessario = comprimirImagemSeNecessario;

  function handleFileSelect(input, containerId) {
    if (!input || !input.files || input.files.length === 0) return;
    if (!uploadedFilesStore[containerId]) uploadedFilesStore[containerId] = [];

    var fileList = Array.from(input.files);
    var pending = fileList.length;

    fileList.forEach(function(file) {
      var mediaId = 'med_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      comprimirImagemSeNecessario(file, function(dataUrl, blobOuFile) {
        var finalFile = blobOuFile || file;
        var mediaObj = {
          id: mediaId,
          name: file.name,
          type: (finalFile && finalFile.type) ? finalFile.type : (file.type || 'image/jpeg'),
          size: (finalFile && finalFile.size) ? finalFile.size : file.size,
          dataUrl: dataUrl,
          fileObj: finalFile
        };
        uploadedFilesStore[containerId].push(mediaObj);
        salvarMidiaIDB(mediaId, dataUrl, { name: file.name, type: mediaObj.type, size: mediaObj.size });
        pending--;
        if (pending === 0) {
          renderPreviewsForContainer(containerId);
        }
      });
    });

    input.value = ''; // reseta input para permitir re-selecionar o mesmo arquivo se necessário
  }
  window.handleFileSelect = handleFileSelect;

  function removerArquivoPreview(containerId, index, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (uploadedFilesStore[containerId] && uploadedFilesStore[containerId][index] !== undefined) {
      uploadedFilesStore[containerId].splice(index, 1);
      renderPreviewsForContainer(containerId);
    }
  }
  window.removerArquivoPreview = removerArquivoPreview;

  function renderPreviewsForContainer(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    var files = uploadedFilesStore[containerId] || [];
    files.forEach(function(file, idx) {
      var item = document.createElement('div');
      item.className = 'prev-item';
      item.style.position = 'relative';

      var removeBtn = document.createElement('button');
      removeBtn.className = 'prev-remove-btn';
      removeBtn.type = 'button';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = 'Remover este arquivo';
      removeBtn.onclick = function(e) {
        removerArquivoPreview(containerId, idx, e);
      };
      item.appendChild(removeBtn);

      var fType = (file.type || '').toLowerCase();
      var fName = (file.name || '').toLowerCase();
      var isImg = fType.startsWith('image/') || fName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
      var isPdf = fType === 'application/pdf' || fName.endsWith('.pdf');
      var isVid = fType.startsWith('video/') || fName.match(/\.(mp4|webm|mov|mkv|avi)$/i);

      if (isImg && file.dataUrl) {
        var img = document.createElement('img');
        img.src = file.dataUrl;
        img.alt = file.name || 'Imagem';
        img.loading = 'lazy';
        img.style.cursor = 'pointer';
        img.title = 'Clique para ampliar (Quick Look)';
        (function(currentFile) {
          img.onclick = function() {
            abrirQuickLook(currentFile.dataUrl, currentFile.name);
          };
        })(file);
        item.appendChild(img);
      } else if (isPdf) {
        var pdfBox = document.createElement('div');
        pdfBox.className = 'prev-vid prev-pdf-box';
        pdfBox.innerHTML = '<i data-lucide="file-text" style="width:24px;height:24px;stroke-width:1.5;color:var(--red);"></i>';
        item.appendChild(pdfBox);
      } else if (isVid) {
        var vidBox = document.createElement('div');
        vidBox.className = 'prev-vid';
        vidBox.innerHTML = '<i data-lucide="film" style="width:24px;height:24px;stroke-width:1.5;color:var(--blue);"></i><span style="font-size:9px;color:var(--blue);font-weight:800;margin-top:2px;">VÍDEO</span>';
        item.appendChild(vidBox);
      } else {
        var docBox = document.createElement('div');
        docBox.className = 'prev-vid';
        docBox.innerHTML = '<i data-lucide="file" style="width:24px;height:24px;stroke-width:1.5;color:var(--muted);"></i>';
        item.appendChild(docBox);
      }

      var nome = document.createElement('div');
      nome.className = 'prev-name';
      var displayName = file.name || 'Anexo';
      nome.textContent = displayName.length > 12 ? displayName.substring(0, 9) + '…' : displayName;
      item.appendChild(nome);

      container.appendChild(item);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.renderPreviewsForContainer = renderPreviewsForContainer;

  /* Listeners para áreas de upload (Requisições, Recebimentos e Ocorrências) */
  ['req', 'rec', 'rec1', 'rec2', 'nova', 'edit-oc', 'resolver'].forEach(function(prefix) {
    var area  = document.getElementById(prefix + '-upload-area');
    var file  = document.getElementById(prefix + '-arquivos');
    if (area && file) {
      area.onclick = function(e) {
        if (e.target !== file) file.click();
      };
      file.onchange = function() {
        handleFileSelect(this, prefix + '-previews');
      };
    }
  });
