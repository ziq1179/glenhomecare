(function () {
  'use strict';

  var API_BASE = window.API_BASE || '/api';
  var SLOT_LABELS = {
    exterior_entrance: 'Front entrance (exterior)',
    garden_grounds: 'Garden & outdoor seating',
    glens_landscape: 'Glens landscape (scenic)',
    bedroom: 'Single bedroom',
    lounge: 'Communal lounge',
    dining: 'Dining room set for meal',
    meal_plated: 'Plated meal / afternoon tea',
    activity: 'Quiet activity (e.g. reading nook, board games)',
    nursery_visit: 'Nursery children visit (with consent)',
    manager_headshot: 'Registered Manager headshot',
    staff_group: 'Care & kitchen staff group',
    services_elderly_care: 'Our Services – Elderly care (bedroom section)',
    life_hero_arts: 'Life page – top: Arts and crafts (left)',
    life_hero_lounge: 'Life page – top & one gallery: Balloon / intergenerational (shared)',
    life_gal_01: 'Life gallery: Communal lounge',
    life_gal_02: 'Life gallery: Garden and outdoor space',
    life_gal_03: 'Life gallery: Dining room',
    life_gal_04: 'Life gallery: Our home (exterior)',
    life_gal_05: 'Life gallery: Spaces to relax',
    life_gal_06: 'Life gallery: A comfortable bedroom',
    life_gal_07: 'Life gallery: Bingo and games',
    life_gal_08: 'Life gallery: Live music',
    life_gal_09: 'Life gallery: Entertainment together',
    life_gal_10: 'Life gallery: Visitors and performers',
    life_gal_11: 'Life gallery: Ball games and fun',
    life_gal_12: 'Life gallery: Activities with our team',
    life_gal_13: 'Life gallery: Celebrations',
    life_gal_14: 'Life gallery: Music and reminiscence',
    life_gal_15: 'Life gallery: Arts and crafts',
    life_gal_16: 'Life gallery: From our kitchen',
    life_gal_17: 'Life gallery: Homely food',
    life_gal_18: 'Life gallery: Roast dinner',
    life_gal_19: 'Life gallery: Soup of the day',
    life_gal_20: 'Life gallery: Lunchtime favourites',
    life_gal_21: 'Life gallery: Dessert',
    life_gal_22: 'Life gallery: Play and laughter (balloon)',
    life_gal_23: 'Life gallery: Together in the lounge',
    life_gal_24: 'Life gallery: Young visitors',
    life_gal_25: 'Life gallery: Life at the Glens',
    life_gal_26: 'Life gallery: Our community'
  };

  var LIFE_GRID_KEYS = Object.keys(SLOT_LABELS).filter(function (k) {
    return /^life_gal_/.test(k);
  }).sort(function (a, b) {
    return parseInt(a.replace(/^life_gal_/, ''), 10) - parseInt(b.replace(/^life_gal_/, ''), 10);
  });
  var MAIN_KEYS = Object.keys(SLOT_LABELS).filter(function (k) {
    return LIFE_GRID_KEYS.indexOf(k) === -1;
  });

  var token = localStorage.getItem('glens_admin_token');
  var role = localStorage.getItem('glens_admin_role');
  var loginPage = document.getElementById('login-page');
  var dashboardPage = document.getElementById('dashboard-page');

  var ROLE_LABELS = {
    super_admin: 'Super Admin',
    editor: 'Editor',
    photo_manager: 'Photo Manager',
    review_moderator: 'Review Moderator',
    viewer: 'Viewer'
  };

  var CAN_EDIT_PHOTOS = ['super_admin', 'editor', 'photo_manager'];
  var CAN_EDIT_THEME = ['super_admin', 'editor'];

  function showDashboard() {
    loginPage.hidden = true;
    dashboardPage.hidden = false;
    var roleEl = document.getElementById('admin-role');
    if (roleEl) {
      roleEl.textContent = role ? (ROLE_LABELS[role] || role) : 'Admin';
    }
    var form = document.getElementById('photos-form');
    var saveBtn = form && form.querySelector('button[type="submit"]');
    if (saveBtn) {
      saveBtn.hidden = !role || !CAN_EDIT_PHOTOS.includes(role);
    }
    var readOnlyNote = document.getElementById('readonly-note');
    if (readOnlyNote) {
      readOnlyNote.hidden = !role || CAN_EDIT_PHOTOS.includes(role);
    }
    var saveThemeBtn = document.getElementById('save-theme-btn');
    if (saveThemeBtn) saveThemeBtn.hidden = !role || !CAN_EDIT_THEME.includes(role);
    loadSlots();
    loadSettings();
    loadContactRequests();
  }

  var CAN_RESPOND_CONTACT = ['super_admin', 'editor', 'review_moderator'];

  function loadContactRequests() {
    var container = document.getElementById('contact-requests-list');
    var statusEl = document.getElementById('contact-requests-status');
    if (!container) return;
    container.innerHTML = '';
    if (statusEl) statusEl.textContent = 'Loading…';
    fetch(API_BASE + '/contact-requests', { headers: { Authorization: 'Bearer ' + token } })
      .then(function (r) {
        if (r.status === 401) throw new Error('Session expired');
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(function (list) {
        if (statusEl) statusEl.textContent = '';
        if (!list || list.length === 0) {
          container.innerHTML = '<p class="hint">No contact requests yet.</p>';
          return;
        }
        list.forEach(function (req) {
          var card = document.createElement('div');
          card.className = 'contact-request-card' + (req.responded ? ' is-responded' : '');
          var canRespond = role && CAN_RESPOND_CONTACT.includes(role);
          var dateStr = req.created_at ? new Date(req.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
          card.innerHTML =
            '<div class="contact-request-header">' +
              '<strong>' + escapeHtml(req.name) + '</strong> ' +
              '<span class="contact-request-meta">' + escapeHtml(req.email) + (req.phone ? ' · ' + escapeHtml(req.phone) : '') + '</span>' +
              '<span class="contact-request-date">' + escapeHtml(dateStr) + '</span>' +
              (req.responded ? '<span class="badge badge-responded">Responded</span>' : '<span class="badge badge-pending">Pending</span>') +
            '</div>' +
            '<p class="contact-request-message">' + escapeHtml(req.message) + '</p>' +
            (canRespond
              ? '<div class="contact-request-actions">' +
                  '<label>Response notes: <textarea class="contact-response-notes" data-id="' + req.id + '" rows="2" placeholder="e.g. Called back, visit arranged…">' + escapeHtml(req.response_notes || '') + '</textarea></label>' +
                  '<div class="contact-request-buttons">' +
                    (req.responded ? '' : '<button type="button" class="btn btn-secondary btn-mark-responsive" data-id="' + req.id + '">Mark as responded</button> ') +
                    '<button type="button" class="btn btn-secondary btn-save-notes" data-id="' + req.id + '">Save notes</button>' +
                  '</div></div>'
              : (req.response_notes ? '<p class="contact-request-notes"><em>Notes: ' + escapeHtml(req.response_notes) + '</em></p>' : '')
            );
          container.appendChild(card);
        });
        container.querySelectorAll('.btn-mark-responsive').forEach(function (btn) {
          btn.addEventListener('click', function () { markResponded(parseInt(btn.getAttribute('data-id'), 10)); });
        });
        container.querySelectorAll('.btn-save-notes').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = parseInt(btn.getAttribute('data-id'), 10);
            var textarea = container.querySelector('.contact-response-notes[data-id="' + id + '"]');
            saveResponseNotes(id, textarea ? textarea.value : '');
          });
        });
      })
      .catch(function (err) {
        if (err.message === 'Session expired') {
          showLogin();
          return;
        }
        if (statusEl) statusEl.textContent = err.message || 'Failed to load requests.';
        statusEl.className = 'status error';
      });
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function markResponded(id) {
    var statusEl = document.getElementById('contact-requests-status');
    if (statusEl) statusEl.textContent = 'Saving…';
    fetch(API_BASE + '/contact-requests/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ responded: true })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to update');
        if (statusEl) statusEl.textContent = 'Marked as responded.';
        statusEl.className = 'status success';
        loadContactRequests();
      })
      .catch(function () {
        if (statusEl) statusEl.textContent = 'Failed to update.';
        statusEl.className = 'status error';
      });
  }

  function saveResponseNotes(id, notes) {
    var statusEl = document.getElementById('contact-requests-status');
    if (statusEl) statusEl.textContent = 'Saving…';
    fetch(API_BASE + '/contact-requests/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ response_notes: notes })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to save');
        if (statusEl) statusEl.textContent = 'Notes saved.';
        statusEl.className = 'status success';
      })
      .catch(function () {
        if (statusEl) statusEl.textContent = 'Failed to save notes.';
        statusEl.className = 'status error';
      });
  }

  function loadSettings() {
    fetch(API_BASE + '/settings')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var themeEl = document.getElementById('site-theme');
        if (themeEl && (data.theme === 'original' || data.theme === 'care-uk')) {
          themeEl.value = data.theme;
        }
      })
      .catch(function () {});
  }

  function showLogin() {
    token = null;
    role = null;
    localStorage.removeItem('glens_admin_token');
    localStorage.removeItem('glens_admin_role');
    loginPage.hidden = false;
    dashboardPage.hidden = true;
  }

  // Verify saved token without GET /api/me (401 shows as a scary red error in DevTools even when we handle it).
  if (token) {
    fetch(API_BASE + '/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.ok && data.role) {
          role = data.role;
          localStorage.setItem('glens_admin_role', data.role);
          showDashboard();
          return;
        }
        showLogin();
      })
      .catch(showLogin);
  } else {
    showLogin();
  }

  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var password = document.getElementById('password').value;
    var errEl = document.getElementById('login-error');
    errEl.textContent = '';
    fetch(API_BASE + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Invalid password');
        return r.json();
      })
      .then(function (data) {
        token = data.token;
        role = data.role || 'super_admin';
        localStorage.setItem('glens_admin_token', token);
        localStorage.setItem('glens_admin_role', role);
        showDashboard();
      })
      .catch(function () {
        errEl.textContent = 'Invalid password. Try again.';
      });
  });

  document.getElementById('logout-btn').addEventListener('click', showLogin);

  var saveThemeBtn = document.getElementById('save-theme-btn');
  if (saveThemeBtn) {
    saveThemeBtn.addEventListener('click', function () {
      var themeEl = document.getElementById('site-theme');
      var theme = themeEl ? themeEl.value : 'original';
      var statusEl = document.getElementById('theme-status');
      if (statusEl) statusEl.textContent = 'Saving…';
      fetch(API_BASE + '/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ theme: theme })
      })
        .then(function (r) {
          if (r.status === 401) throw new Error('Session expired');
          if (!r.ok) throw new Error('Save failed');
          return r.json();
        })
        .then(function () {
          if (statusEl) {
            statusEl.textContent = 'Theme saved. The public site will use it on next load.';
            statusEl.className = 'status success';
          }
        })
        .catch(function (err) {
          if (statusEl) {
            statusEl.textContent = err.message || 'Failed to save theme.';
            statusEl.className = 'status error';
          }
        });
    });
  }

  function uploadJsonResponse(r) {
    return r.text().then(function (text) {
      var data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (e) { /* ignore */ }
      if (r.status === 401) {
        showLogin();
        throw new Error('Session expired (e.g. after server restart). Please log in again, then upload.');
      }
      if (!r.ok) throw new Error(data.error || ('Upload failed (' + r.status + ')'));
      return data;
    });
  }

  function wirePreview(input, preview, label) {
    function updatePreview() {
      var val = input.value.trim();
      preview.innerHTML = '';
      if (val) {
        if (/youtube\.com|youtu\.be|vimeo\.com/i.test(val) || /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(val)) {
          preview.innerHTML = '<span class="preview-video-note">Video link — will play on the public site</span>';
          return;
        }
        var absolute = val;
        if (val.indexOf('http://') !== 0 && val.indexOf('https://') !== 0) {
          absolute = (window.location && window.location.origin) ? (window.location.origin + (val.indexOf('/') === 0 ? val : '/' + val)) : val;
        }
        var img = document.createElement('img');
        img.src = absolute;
        img.alt = label;
        img.onerror = function () { preview.innerHTML = '<span class="error">Invalid or blocked image</span>'; };
        preview.appendChild(img);
      }
    }
    input.addEventListener('input', updatePreview);
    input.addEventListener('change', updatePreview);
    updatePreview();
  }

  function uploadLifeGridBulk(fileList, auth, statusEl, fileInputEl) {
    var keys = LIFE_GRID_KEYS;
    var files = Array.from(fileList || []).filter(Boolean);
    var maxN = keys.length;
    if (!files.length) {
      statusEl.textContent = 'Choose one or more images first.';
      statusEl.className = 'upload-hint error';
      return;
    }
    var truncated = files.length > maxN;
    var arr = files.slice(0, maxN);
    var i = 0;
    function runNext() {
      if (i >= arr.length) {
        statusEl.textContent = 'Uploaded ' + arr.length + ' image(s) to the gallery.' + (truncated ? ' (Only the first ' + maxN + ' files are used.)' : '');
        statusEl.className = 'upload-hint success';
        if (fileInputEl) fileInputEl.value = '';
        return;
      }
      var key = keys[i];
      statusEl.textContent = 'Uploading ' + (i + 1) + ' of ' + arr.length + '…';
      statusEl.className = 'upload-hint';
      var fd = new FormData();
      fd.append('photo', arr[i]);
      fetch(API_BASE + '/photos/upload?slot=' + encodeURIComponent(key), {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + auth },
        body: fd
      })
        .then(function (r) { return uploadJsonResponse(r); })
        .then(function (data) {
          var slotInput = document.getElementById('slot-' + key);
          if (slotInput && data.url) {
            slotInput.value = data.url;
            slotInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          i++;
          runNext();
        })
        .catch(function (err) {
          statusEl.textContent = err.message || 'Upload failed.';
          statusEl.className = 'upload-hint error';
        });
    }
    runNext();
  }

  function appendSingleUploadSlot(parent, key, url, canEdit) {
    var label = SLOT_LABELS[key];
    var div = document.createElement('div');
    div.className = 'slot';
    div.innerHTML =
      '<label for="slot-' + key + '">' + label + '</label>' +
      '<span class="slot-key">' + key + '</span>' +
      (canEdit
        ? '<div class="slot-upload">' +
          '<input type="file" id="file-' + key + '" class="file-input" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" aria-label="Upload image for ' + label + '">' +
          '<button type="button" class="btn btn-secondary btn-upload" data-upload-slot="' + key + '">Upload</button>' +
          '<span class="upload-hint" data-upload-status="' + key + '"></span></div>'
        : '') +
      '<input type="text" class="slot-url" id="slot-' + key + '" name="' + key + '" value="' + (url || '').replace(/"/g, '&quot;') + '" placeholder="Image URL, or YouTube / Vimeo / .mp4 link" autocomplete="off">' +
      '<div class="preview" data-slot="' + key + '"></div>';
    parent.appendChild(div);
    var input = div.querySelector('input.slot-url');
    var fileInput = div.querySelector('input.file-input');
    var preview = div.querySelector('.preview');
    var uploadBtn = div.querySelector('.btn-upload');
    if (canEdit && uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', function () {
        var st = div.querySelector('[data-upload-status="' + key + '"]');
        if (!fileInput.files || !fileInput.files[0]) {
          if (st) { st.textContent = 'Choose a file first.'; st.className = 'upload-hint error'; }
          return;
        }
        if (st) { st.textContent = 'Uploading…'; st.className = 'upload-hint'; }
        var fd = new FormData();
        fd.append('photo', fileInput.files[0]);
        var auth = localStorage.getItem('glens_admin_token') || token;
        fetch(API_BASE + '/photos/upload?slot=' + encodeURIComponent(key), {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + auth },
          body: fd
        })
          .then(function (r) { return uploadJsonResponse(r); })
          .then(function (data) {
            if (input && data.url) {
              input.value = data.url;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (st) { st.textContent = 'Saved to site.'; st.className = 'upload-hint success'; }
            fileInput.value = '';
          })
          .catch(function (err) {
            if (st) { st.textContent = err.message || 'Upload failed.'; st.className = 'upload-hint error'; }
          });
      });
    }
    wirePreview(input, preview, label);
  }

  function appendGallerySlotRow(parent, key, url) {
    var label = SLOT_LABELS[key];
    var div = document.createElement('div');
    div.className = 'slot';
    div.innerHTML =
      '<label for="slot-' + key + '">' + label + '</label>' +
      '<span class="slot-key">' + key + '</span>' +
      '<input type="text" class="slot-url" id="slot-' + key + '" name="' + key + '" value="' + (url || '').replace(/"/g, '&quot;') + '" placeholder="Image URL, or YouTube / Vimeo / .mp4 link" autocomplete="off">' +
      '<div class="preview" data-slot="' + key + '"></div>';
    parent.appendChild(div);
    var input = div.querySelector('input.slot-url');
    var preview = div.querySelector('.preview');
    wirePreview(input, preview, label);
  }

  function loadSlots() {
    fetch(API_BASE + '/photos')
      .then(function (r) { return r.json(); })
      .then(function (slots) {
        var container = document.getElementById('photo-slots');
        container.innerHTML = '';
        var canEdit = role && CAN_EDIT_PHOTOS.includes(role);

        var mainSection = document.createElement('div');
        mainSection.className = 'photos-subsection';
        mainSection.innerHTML = '<h3>Website &amp; Life page (single photo each)</h3>' +
          '<p class="hint subsection-hint">One image per slot: pick a file and click Upload, or paste a full URL below.</p>';
        var mainInner = document.createElement('div');
        mainSection.appendChild(mainInner);
        MAIN_KEYS.forEach(function (key) {
          appendSingleUploadSlot(mainInner, key, slots[key] || '', canEdit);
        });
        container.appendChild(mainSection);

        var gridSection = document.createElement('div');
        gridSection.className = 'photos-subsection photos-subsection-grid';
        gridSection.innerHTML = '<h3>Life in pictures – gallery grid</h3>' +
          '<p class="hint subsection-hint">Select <strong>multiple images</strong> (up to 26). They are applied in order: image 1 → first gallery slot, image 2 → second, and so on (same order as on the public “Life” page). You can still edit individual URLs below.</p>';

        if (canEdit) {
          var bulk = document.createElement('div');
          bulk.className = 'life-grid-bulk';
          bulk.innerHTML =
            '<input type="file" id="life-grid-file-input" class="file-input" multiple accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" aria-label="Choose multiple gallery images">' +
            '<button type="button" class="btn btn-secondary" id="life-grid-upload-btn">Upload to gallery</button>' +
            '<span class="upload-hint" id="life-grid-bulk-status" aria-live="polite"></span>';
          gridSection.appendChild(bulk);
        }

        var gridInner = document.createElement('div');
        gridSection.appendChild(gridInner);
        LIFE_GRID_KEYS.forEach(function (key) {
          appendGallerySlotRow(gridInner, key, slots[key] || '');
        });
        container.appendChild(gridSection);

        if (canEdit) {
          var fileMulti = document.getElementById('life-grid-file-input');
          var bulkBtn = document.getElementById('life-grid-upload-btn');
          var bulkStatus = document.getElementById('life-grid-bulk-status');
          if (bulkBtn && fileMulti && bulkStatus) {
            bulkBtn.addEventListener('click', function () {
              var auth = localStorage.getItem('glens_admin_token') || token;
              uploadLifeGridBulk(fileMulti.files, auth, bulkStatus, fileMulti);
            });
          }
        }
      });
  }

  document.getElementById('photos-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    var slots = {};
    Object.keys(SLOT_LABELS).forEach(function (key) {
      var input = form.querySelector('[name="' + key + '"]');
      if (input && input.value.trim()) slots[key] = input.value.trim();
    });
    var statusEl = document.getElementById('save-status');
    statusEl.textContent = 'Saving…';
    statusEl.className = 'status';
    fetch(API_BASE + '/photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ slots: slots })
    })
      .then(function (r) {
        if (r.status === 401) throw new Error('Session expired');
        if (!r.ok) throw new Error('Save failed');
        return r.json();
      })
      .then(function () {
        statusEl.textContent = 'Saved. The website will use these images.';
        statusEl.className = 'status success';
      })
      .catch(function (err) {
        statusEl.textContent = err.message || 'Failed to save.';
        statusEl.className = 'status error';
      });
  });
})();
