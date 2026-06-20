let state = {
  notes: [],
  activeNoteId: null,
  activeFilter: 'all',
  activeSort: 'newest',
  searchQuery: '',
  theme: 'dark',
  autoSaveTimer: null,
  noteToDeleteId: null
};

const ICONS = {
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.26V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.26a2 2 0 0 1-.78 1.24l-2.78 3.5A2 2 0 0 0 5 15.24V17z"></path></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  delete: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
};

const DOM = {
  themeToggle: document.getElementById('theme-toggle'),
  exportBtn: document.getElementById('export-btn'),
  importBtn: document.getElementById('import-btn'),
  importFile: document.getElementById('import-file'),
  newNoteHeaderBtn: document.getElementById('new-note-header-btn'),
  fabBtn: document.getElementById('fab-btn'),
  searchInput: document.getElementById('search-input'),
  clearSearch: document.getElementById('clear-search'),
  categoryFilters: document.getElementById('category-filters'),
  sortSelect: document.getElementById('sort-select'),
  notesGrid: document.getElementById('notes-grid'),
  emptyState: document.getElementById('empty-state'),
  emptyStateBtn: document.getElementById('empty-state-btn'),
  noteModal: document.getElementById('note-modal'),
  modalTitle: document.getElementById('modal-note-title'),
  modalContent: document.getElementById('modal-note-content'),
  modalCategory: document.getElementById('modal-note-category'),
  modalPinBtn: document.getElementById('modal-pin-btn'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalSaveBtn: document.getElementById('modal-save-btn'),
  charCounter: document.getElementById('char-counter'),
  saveStatus: document.getElementById('save-status'),
  confirmModal: document.getElementById('confirm-modal'),
  confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
  confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
  toastContainer: document.getElementById('toast-container')
};

document.addEventListener('DOMContentLoaded', () => {
  loadNotes();
  initTheme();
  setupEventListeners();
  renderNotes();
  showToast("Welcome to Smart Notes!", "info");
});

function setupEventListeners() {
  DOM.themeToggle.addEventListener('click', toggleTheme);

  DOM.newNoteHeaderBtn.addEventListener('click', () => openEditor());
  DOM.fabBtn.addEventListener('click', () => openEditor());
  DOM.emptyStateBtn.addEventListener('click', () => openEditor());

  DOM.searchInput.addEventListener('input', handleSearch);
  DOM.clearSearch.addEventListener('click', handleClearSearch);
  DOM.categoryFilters.addEventListener('click', handleCategoryFilter);
  DOM.sortSelect.addEventListener('change', handleSort);

  DOM.exportBtn.addEventListener('click', exportNotes);
  DOM.importBtn.addEventListener('click', () => DOM.importFile.click());
  DOM.importFile.addEventListener('change', importNotes);

  DOM.modalCloseBtn.addEventListener('click', () => {
    saveActiveNote(false);
    closeEditor();
  });
  DOM.modalSaveBtn.addEventListener('click', () => {
    saveActiveNote(false);
    closeEditor();
  });
  DOM.modalPinBtn.addEventListener('click', handleModalPinToggle);

  DOM.modalTitle.addEventListener('input', triggerAutoSave);
  DOM.modalContent.addEventListener('input', () => {
    updateCharacterCount();
    triggerAutoSave();
  });

  DOM.noteModal.addEventListener('click', (e) => {
    if (e.target === DOM.noteModal) {
      saveActiveNote(false);
      closeEditor();
    }
  });
  
  DOM.confirmModal.addEventListener('click', (e) => {
    if (e.target === DOM.confirmModal) {
      closeConfirmModal();
    }
  });

  DOM.confirmCancelBtn.addEventListener('click', closeConfirmModal);
  DOM.confirmDeleteBtn.addEventListener('click', executeDelete);

  window.addEventListener('keydown', handleKeyboardShortcuts);
}

function initTheme() {
  const savedTheme = localStorage.getItem('smart-notes-theme') || 'dark';
  setTheme(savedTheme);
}

function toggleTheme() {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
}

function setTheme(themeName) {
  state.theme = themeName;
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('smart-notes-theme', themeName);
}

function loadNotes() {
  try {
    const rawNotes = localStorage.getItem('smart-notes-data');
    state.notes = rawNotes ? JSON.parse(rawNotes) : getFallbackNotes();
  } catch (error) {
    console.error(error);
    state.notes = getFallbackNotes();
    showToast("Error loading notes. Loaded default set instead.", "danger");
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('smart-notes-data', JSON.stringify(state.notes));
  } catch (error) {
    console.error(error);
    showToast("Storage full! Unable to save notes.", "danger");
  }
}

function getFallbackNotes() {
  const now = Date.now();
  return [
    {
      id: "demo-1",
      title: "Welcome to Smart Notes! 💡",
      content: "Thank you for using Smart Notes. It is a premium glassmorphic notes application.\n\nHere are some tips to get started:\n- Click tags to filter notes by category.\n- Try searching for terms in real-time.\n- Press Ctrl + N to make a new note, and Ctrl + S to save.\n- Pin notes to make sure they stick at the top!",
      category: "ideas",
      pinned: true,
      createdAt: now - 7200000,
      updatedAt: now - 7200000
    },
    {
      id: "demo-2",
      title: "Project Milestone Checklist 📝",
      content: "1. [x] Complete UI design tokens and css layout.\n2. [x] Build CRUD operations and Local Storage setup.\n3. [ ] Perform cross-browser UI testing.\n4. [ ] Share notes app with colleagues for testing.",
      category: "todo",
      pinned: false,
      createdAt: now - 86400000,
      updatedAt: now - 43200000
    },
    {
      id: "demo-3",
      title: "Daily Journal - June 2",
      content: "Spent the evening building a responsive web app. The styling uses a premium backdrop blur filter with vibrant background gradient bubbles. The animations are extremely fluid, making the experience highly immersive. Feeling satisfied with the progress.",
      category: "journal",
      pinned: false,
      createdAt: now - 14400000,
      updatedAt: now - 14400000
    }
  ];
}

function renderNotes() {
  let filteredNotes = state.notes.filter(note => {
    const matchesCategory = state.activeFilter === 'all' || note.category === state.activeFilter;
    const query = state.searchQuery.toLowerCase().trim();
    const matchesSearch = !query || note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  filteredNotes.sort((a, b) => {
    if (state.activeSort === 'pinned') {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    }
    if (state.activeSort === 'newest') return b.updatedAt - a.updatedAt;
    if (state.activeSort === 'oldest') return a.updatedAt - b.updatedAt;
    if (state.activeSort === 'alphabetical') {
      const titleA = a.title || a.content || '';
      const titleB = b.title || b.content || '';
      return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
    }
    return 0;
  });

  if (filteredNotes.length === 0) {
    DOM.notesGrid.innerHTML = '';
    DOM.emptyState.classList.remove('hidden');
  } else {
    DOM.emptyState.classList.add('hidden');
    DOM.notesGrid.innerHTML = filteredNotes.map(note => createCardHTML(note)).join('');
    attachCardListeners();
  }
}

function createCardHTML(note) {
  const cleanTitle = escapeHTML(note.title || "Untitled Note");
  const cleanContent = escapeHTML(note.content || "Empty content...");
  const dateText = formatDate(note.updatedAt);
  const pinClass = note.pinned ? 'pinned' : '';
  const editMarker = note.updatedAt > note.createdAt ? ' (Edited)' : '';
  const pinLabel = note.pinned ? 'Unpin Note' : 'Pin Note';

  return `
    <div class="note-card ${pinClass}" data-id="${note.id}">
      <div class="card-pin-indicator" title="Pinned Note">
        ${ICONS.pin}
      </div>
      <div class="note-card-header">
        <h3 class="note-card-title">${cleanTitle}</h3>
      </div>
      <div class="note-card-body">
        ${cleanContent.replace(/\n/g, '<br>')}
      </div>
      <div class="note-card-footer">
        <span class="note-card-date" title="Created: ${formatDateFull(note.createdAt)}&#10;Last Edited: ${formatDateFull(note.updatedAt)}">${dateText}${editMarker}</span>
        <span class="note-card-tag tag-${note.category}">${note.category}</span>
      </div>
      <div class="note-card-actions">
        <button class="card-action-btn pin-card-btn" data-id="${note.id}" title="${pinLabel}" aria-label="${pinLabel}">
          ${ICONS.pin}
        </button>
        <button class="card-action-btn edit-card-btn" data-id="${note.id}" title="Edit Note" aria-label="Edit Note">
          ${ICONS.edit}
        </button>
        <button class="card-action-btn delete-btn delete-card-btn" data-id="${note.id}" title="Delete Note" aria-label="Delete Note">
          ${ICONS.delete}
        </button>
      </div>
    </div>
  `;
}

function attachCardListeners() {
  document.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-action-btn')) return;
      openEditor(card.getAttribute('data-id'));
    });
  });

  document.querySelectorAll('.pin-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePinNote(btn.getAttribute('data-id'));
    });
  });

  document.querySelectorAll('.edit-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditor(btn.getAttribute('data-id'));
    });
  });

  document.querySelectorAll('.delete-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerDeleteConfirmation(btn.getAttribute('data-id'));
    });
  });
}

function openEditor(noteId = null) {
  state.activeNoteId = noteId;
  DOM.saveStatus.textContent = "Saved";
  DOM.saveStatus.classList.remove('saving');

  if (noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;

    DOM.modalTitle.value = note.title;
    DOM.modalContent.value = note.content;
    DOM.modalCategory.value = note.category;
    
    if (note.pinned) {
      DOM.modalPinBtn.classList.add('active');
      DOM.modalPinBtn.setAttribute('title', 'Unpin Note');
    } else {
      DOM.modalPinBtn.classList.remove('active');
      DOM.modalPinBtn.setAttribute('title', 'Pin Note');
    }
  } else {
    DOM.modalTitle.value = '';
    DOM.modalContent.value = '';
    DOM.modalCategory.value = state.activeFilter !== 'all' ? state.activeFilter : 'personal';
    DOM.modalPinBtn.classList.remove('active');
    DOM.modalPinBtn.setAttribute('title', 'Pin Note');
  }

  updateCharacterCount();
  DOM.noteModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  setTimeout(() => DOM.modalTitle.focus(), 50);
}

function closeEditor() {
  DOM.noteModal.classList.add('hidden');
  document.body.style.overflow = '';
  state.activeNoteId = null;
  
  if (state.autoSaveTimer) {
    clearTimeout(state.autoSaveTimer);
    state.autoSaveTimer = null;
  }
}

function saveActiveNote(isAutoSave = false) {
  const title = DOM.modalTitle.value.trim();
  const content = DOM.modalContent.value.trim();
  const category = DOM.modalCategory.value;
  const isPinned = DOM.modalPinBtn.classList.contains('active');

  if (!title && !content) {
    if (!isAutoSave && state.activeNoteId) {
      triggerDeleteConfirmation(state.activeNoteId);
    }
    return;
  }

  const now = Date.now();

  if (state.activeNoteId) {
    const noteIndex = state.notes.findIndex(n => n.id === state.activeNoteId);
    if (noteIndex !== -1) {
      state.notes[noteIndex] = {
        ...state.notes[noteIndex],
        title,
        content,
        category,
        pinned: isPinned,
        updatedAt: now
      };
      
      saveToLocalStorage();
      renderNotes();
      
      if (!isAutoSave) {
        showToast("Note updated successfully!", "success");
      }
    }
  } else {
    const newNote = {
      id: 'note-' + now,
      title,
      content,
      category,
      pinned: isPinned,
      createdAt: now,
      updatedAt: now
    };
    
    state.notes.push(newNote);
    state.activeNoteId = newNote.id;

    saveToLocalStorage();
    renderNotes();

    if (!isAutoSave) {
      showToast("Note created successfully!", "success");
    }
  }

  DOM.saveStatus.textContent = "Saved";
  DOM.saveStatus.classList.remove('saving');
}

function triggerAutoSave() {
  DOM.saveStatus.textContent = "Saving...";
  DOM.saveStatus.classList.add('saving');

  if (state.autoSaveTimer) {
    clearTimeout(state.autoSaveTimer);
  }

  state.autoSaveTimer = setTimeout(() => {
    saveActiveNote(true);
  }, 800);
}

function togglePinNote(noteId) {
  const noteIndex = state.notes.findIndex(n => n.id === noteId);
  if (noteIndex === -1) return;

  state.notes[noteIndex].pinned = !state.notes[noteIndex].pinned;
  state.notes[noteIndex].updatedAt = Date.now();
  
  saveToLocalStorage();
  renderNotes();

  const isPinnedNow = state.notes[noteIndex].pinned;
  showToast(
    isPinnedNow ? "Note pinned to top!" : "Note unpinned.",
    isPinnedNow ? "success" : "info"
  );
}

function handleModalPinToggle() {
  DOM.modalPinBtn.classList.toggle('active');
  const isPinned = DOM.modalPinBtn.classList.contains('active');
  DOM.modalPinBtn.setAttribute('title', isPinned ? 'Unpin Note' : 'Pin Note');
  triggerAutoSave();
}

function triggerDeleteConfirmation(noteId) {
  state.noteToDeleteId = noteId;
  DOM.confirmModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeConfirmModal() {
  DOM.confirmModal.classList.add('hidden');
  if (!state.activeNoteId) {
    document.body.style.overflow = '';
  }
  state.noteToDeleteId = null;
}

function executeDelete() {
  const noteId = state.noteToDeleteId;
  if (!noteId) return;

  state.notes = state.notes.filter(n => n.id !== noteId);
  saveToLocalStorage();
  renderNotes();

  closeConfirmModal();
  showToast("Note deleted successfully.", "danger");

  if (state.activeNoteId === noteId) {
    closeEditor();
  }
}

function handleSearch(e) {
  state.searchQuery = e.target.value;
  DOM.clearSearch.style.display = state.searchQuery ? 'flex' : 'none';
  renderNotes();
}

function handleClearSearch() {
  DOM.searchInput.value = '';
  state.searchQuery = '';
  DOM.clearSearch.style.display = 'none';
  DOM.searchInput.focus();
  renderNotes();
}

function handleCategoryFilter(e) {
  const tabButton = e.target.closest('.filter-tab');
  if (!tabButton) return;

  document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
  tabButton.classList.add('active');

  state.activeFilter = tabButton.getAttribute('data-category');
  renderNotes();
}

function handleSort(e) {
  state.activeSort = e.target.value;
  renderNotes();
}

function exportNotes() {
  if (state.notes.length === 0) {
    showToast("No notes to export!", "warning");
    return;
  }

  try {
    const dataStr = JSON.stringify(state.notes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.download = `smart_notes_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("Notes exported successfully!", "success");
  } catch (error) {
    console.error(error);
    showToast("Export failed. Please try again.", "danger");
  }
}

function importNotes(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const importedData = JSON.parse(evt.target.result);
      
      if (!Array.isArray(importedData)) {
        throw new Error("Invalid format");
      }

      let count = 0;
      const validCategories = ['personal', 'work', 'ideas', 'todo', 'journal'];
      
      importedData.forEach(importedNote => {
        if (importedNote.content !== undefined) {
          const now = Date.now();
          const newNote = {
            id: `note-${now}-${Math.floor(Math.random() * 1000)}`,
            title: importedNote.title || "Imported Note",
            content: importedNote.content,
            category: validCategories.includes(importedNote.category) ? importedNote.category : 'personal',
            pinned: !!importedNote.pinned,
            createdAt: importedNote.createdAt || now,
            updatedAt: importedNote.updatedAt || now
          };
          state.notes.push(newNote);
          count++;
        }
      });

      if (count > 0) {
        saveToLocalStorage();
        renderNotes();
        showToast(`Successfully imported ${count} notes!`, "success");
      } else {
        showToast("No valid notes found in the file.", "warning");
      }
    } catch (error) {
      console.error(error);
      showToast("Import failed. Invalid file format.", "danger");
    }
    DOM.importFile.value = '';
  };
  reader.readAsText(file);
}

function handleKeyboardShortcuts(e) {
  const isConfirmOpen = !DOM.confirmModal.classList.contains('hidden');
  const isEditorOpen = !DOM.noteModal.classList.contains('hidden');

  if (e.key === 'Escape') {
    if (isConfirmOpen) {
      closeConfirmModal();
      e.preventDefault();
    } else if (isEditorOpen) {
      saveActiveNote(false);
      closeEditor();
      e.preventDefault();
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    if (isConfirmOpen) closeConfirmModal();
    openEditor();
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    if (isEditorOpen) {
      e.preventDefault();
      saveActiveNote(false);
      closeEditor();
    }
  }
}

function updateCharacterCount() {
  const chars = DOM.modalContent.value.length;
  DOM.charCounter.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
}

function showToast(message, type = "info") {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  const iconText = ICONS[type] || ICONS.info;

  toast.innerHTML = `
    <div class="toast-icon">${iconText}</div>
    <div class="toast-message">${escapeHTML(message)}</div>
  `;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateFull(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}