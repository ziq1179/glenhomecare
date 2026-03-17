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
    staff_group: 'Care & kitchen staff group'
  };

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

  if (token) {
    role = localStorage.getItem('glens_admin_role');
    if (!role) {
      fetch(API_BASE + '/me', { headers: { Authorization: 'Bearer ' + token } })
        .then(function (r) {
          if (r.ok) return r.json();
          throw new Error('Session invalid');
        })
        .then(function (data) {
          role = data.role;
          if (role) localStorage.setItem('glens_admin_role', role);
          showDashboard();
        })
        .catch(showLogin);
    } else {
      showDashboard();
    }
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

  function loadSlots() {
    fetch(API_BASE + '/photos')
      .then(function (r) { return r.json(); })
      .then(function (slots) {
        var container = document.getElementById('photo-slots');
        container.innerHTML = '';
        Object.keys(SLOT_LABELS).forEach(function (key) {
          var div = document.createElement('div');
          div.className = 'slot';
          var label = SLOT_LABELS[key];
          var url = slots[key] || '';
          div.innerHTML =
            '<label for="slot-' + key + '">' + label + '</label>' +
            '<span class="slot-key">' + key + '</span>' +
            '<input type="url" id="slot-' + key + '" name="' + key + '" value="' + (url || '').replace(/"/g, '&quot;') + '" placeholder="https://...">' +
            '<div class="preview" data-slot="' + key + '"></div>';
          container.appendChild(div);
          var input = div.querySelector('input');
          var preview = div.querySelector('.preview');
          function updatePreview() {
            var val = input.value.trim();
            preview.innerHTML = '';
            if (val) {
              var img = document.createElement('img');
              img.src = val;
              img.alt = label;
              img.onerror = function () { preview.innerHTML = '<span class="error">Invalid or blocked image</span>'; };
              preview.appendChild(img);
            }
          }
          input.addEventListener('input', updatePreview);
          input.addEventListener('change', updatePreview);
          updatePreview();
        });
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
