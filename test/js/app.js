/*
  Document Translator — Frontend Logic
  Handles theme toggle, language swap, file upload / management,
  and translate-flow UI state. No backend calls — ready for API integration.
*/

(function () {
  'use strict';

  const MAX_FILES   = 10;
  const MAX_SIZE_MB = 25;
  const ALLOWED_EXT = ['.pptx', '.pdf'];

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    html:         document.documentElement,
    themeToggle:  $('#theme-toggle'),
    sourceLang:   $('#source-lang'),
    targetLang:   $('#target-lang'),
    swapBtn:      $('#swap-btn'),
    dropzone:     $('#dropzone'),
    fileInput:    $('#file-input'),
    fileList:     $('#file-list'),
    translateBtn: $('#translate-btn'),
    statusText:   $('#status-text'),
    resultTime:   $('#result-time'),
    resultCount:  $('#result-count'),
    resultLangs:  $('#result-langs'),
    downloadBtn:  $('#download-btn'),
    previewBtn:   $('#preview-btn'),
  };

  let uploadedFiles = [];

  /* ── Theme ── */

  function getStoredTheme() {
    return localStorage.getItem('dt-theme') || 'light';
  }

  function applyTheme(theme) {
    dom.html.setAttribute('data-theme', theme);
    localStorage.setItem('dt-theme', theme);
  }

  function toggleTheme() {
    const next = dom.html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
  }

  /* ── Language Swap ── */

  function swapLanguages() {
    const src = dom.sourceLang.value;
    const tgt = dom.targetLang.value;
    dom.sourceLang.value = tgt;
    dom.targetLang.value = src;
  }

  /* ── File Helpers ── */

  function getExtension(name) {
    const i = name.lastIndexOf('.');
    return i !== -1 ? name.slice(i).toLowerCase() : '';
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function validateFile(file) {
    const ext = getExtension(file.name);
    if (!ALLOWED_EXT.includes(ext)) {
      return `"${file.name}" is not a supported file type.`;
    }
    if (file.size > MAX_SIZE_MB * 1048576) {
      return `"${file.name}" exceeds the ${MAX_SIZE_MB} MB limit.`;
    }
    if (uploadedFiles.length >= MAX_FILES) {
      return `Maximum of ${MAX_FILES} files reached.`;
    }
    const duplicate = uploadedFiles.some((f) => f.name === file.name && f.size === file.size);
    if (duplicate) {
      return `"${file.name}" has already been added.`;
    }
    return null;
  }

  /* ── File List Rendering ── */

  function renderFileList() {
    dom.fileList.innerHTML = '';

    if (uploadedFiles.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'file-card file-card--empty';
      empty.innerHTML = `
        <div class="file-card__info">
          <span class="file-card__name">No file selected</span>
          <span class="file-card__meta">Upload a file</span>
        </div>`;
      dom.fileList.appendChild(empty);
      return;
    }

    uploadedFiles.forEach((file, idx) => {
      const card = document.createElement('div');
      card.className = 'file-card';
      card.innerHTML = `
        <div class="file-card__info">
          <span class="file-card__name">${escapeHtml(file.name)}</span>
          <span class="file-card__meta">${formatSize(file.size)}</span>
        </div>
        <button class="file-card__remove" type="button" data-index="${idx}" aria-label="Remove ${escapeHtml(file.name)}">Remove</button>`;
      dom.fileList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ── File Handling ── */

  function handleFiles(files) {
    const errors = [];
    Array.from(files).forEach((file) => {
      const err = validateFile(file);
      if (err) {
        errors.push(err);
      } else {
        uploadedFiles.push(file);
      }
    });

    renderFileList();
    updateTranslateBtn();

    if (errors.length) alert(errors.join('\n'));
  }

  function removeFile(idx) {
    uploadedFiles.splice(idx, 1);
    renderFileList();
    updateTranslateBtn();
    resetResults();
  }

  /* ── Translate State ── */

  function updateTranslateBtn() {
    const ready = uploadedFiles.length > 0
      && dom.sourceLang.value !== dom.targetLang.value;
    dom.translateBtn.disabled = !ready;

    if (ready) {
      setStatus('ready', 'Ready');
    } else if (uploadedFiles.length === 0) {
      setStatus('idle', 'Waiting');
    } else {
      setStatus('idle', 'Select different languages');
    }
  }

  function setStatus(state, text) {
    dom.statusText.setAttribute('data-status', state);
    dom.statusText.textContent = text;
  }

  function resetResults() {
    dom.resultTime.textContent  = '0s';
    dom.resultCount.textContent = '0/0';
    dom.resultLangs.textContent = 'N/A';
    dom.downloadBtn.disabled = true;
    dom.previewBtn.disabled  = true;
  }

  function handleTranslate() {
    if (dom.translateBtn.disabled) return;

    dom.translateBtn.disabled = true;
    setStatus('working', 'Translating\u2026');
    resetResults();

    const srcLabel = dom.sourceLang.options[dom.sourceLang.selectedIndex].text;
    const tgtLabel = dom.targetLang.options[dom.targetLang.selectedIndex].text;
    const fileCount = uploadedFiles.length;

    /*
      Placeholder: replace this timeout with an actual API call.
      E.g. POST /api/translate with FormData containing files + language params,
      then poll GET /api/jobs/{id} until complete.
    */
    setTimeout(() => {
      setStatus('success', 'Complete');
      dom.resultTime.textContent  = '—';
      dom.resultCount.textContent = `${fileCount}/${fileCount}`;
      dom.resultLangs.textContent = `${srcLabel} → ${tgtLabel}`;
      dom.downloadBtn.disabled = false;
      dom.previewBtn.disabled  = false;
      dom.translateBtn.disabled = false;
    }, 2500);
  }

  /* ── Modals ── */

  function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(overlay) {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initModals() {
    document.querySelectorAll('[data-modal]').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(trigger.dataset.modal);
      });
    });

    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
      });

      const closeBtn = overlay.querySelector('.modal__close');
      if (closeBtn) closeBtn.addEventListener('click', () => closeModal(overlay));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const open = document.querySelector('.modal-overlay.is-open');
      if (open) closeModal(open);
    });
  }

  /* ── Event Binding ── */

  function init() {
    applyTheme(getStoredTheme());

    dom.themeToggle.addEventListener('click', toggleTheme);
    dom.swapBtn.addEventListener('click', swapLanguages);
    initModals();

    dom.sourceLang.addEventListener('change', updateTranslateBtn);
    dom.targetLang.addEventListener('change', updateTranslateBtn);

    // Dropzone click
    dom.dropzone.addEventListener('click', () => dom.fileInput.click());
    dom.dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dom.fileInput.click();
      }
    });

    // File input change
    dom.fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      e.target.value = '';
    });

    // Drag and drop
    dom.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dom.dropzone.classList.add('dropzone--active');
    });
    dom.dropzone.addEventListener('dragleave', () => {
      dom.dropzone.classList.remove('dropzone--active');
    });
    dom.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dom.dropzone.classList.remove('dropzone--active');
      handleFiles(e.dataTransfer.files);
    });

    // File remove delegation
    dom.fileList.addEventListener('click', (e) => {
      const btn = e.target.closest('.file-card__remove');
      if (!btn) return;
      const idx = parseInt(btn.dataset.index, 10);
      removeFile(idx);
    });

    // Translate
    dom.translateBtn.addEventListener('click', handleTranslate);

    // Download / Preview placeholders
    dom.downloadBtn.addEventListener('click', () => {
      alert('Download will be available once the backend is connected.');
    });
    dom.previewBtn.addEventListener('click', () => {
      alert('Preview will be available once the backend is connected.');
    });

    // Initial state
    updateTranslateBtn();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
