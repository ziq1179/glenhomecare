/**
 * Load admin-managed photo URLs from the API and apply them to img[data-photo-slot].
 * Uses data-fallback for defaults so we do not load Unsplash first then replace (avoids flash).
 * Set window.GLENS_PHOTOS_API if the site and API are on different origins.
 */
(function () {
  'use strict';

  var PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  var apiBase = window.GLENS_PHOTOS_API || '';
  var apiUrl = (apiBase.replace(/\/$/, '') || (window.location.origin)) + '/api/photos';

  var imgs = document.querySelectorAll('img[data-photo-slot]');
  if (!imgs.length) return;

  imgs.forEach(function (img) {
    if (!img.getAttribute('data-fallback')) {
      var s = img.getAttribute('src');
      if (s && s.indexOf('data:') !== 0) {
        img.setAttribute('data-fallback', s);
      }
    }
    img.src = PLACEHOLDER;
  });

  function applyUrls(slots) {
    imgs.forEach(function (img) {
      var slot = img.getAttribute('data-photo-slot');
      var fallback = (img.getAttribute('data-fallback') || '').trim();
      var fromApi = slots && slot && slots[slot];
      var url = (fromApi && String(fromApi).trim()) ? String(fromApi).trim() : fallback;
      if (url) {
        img.src = url;
      }
    });
  }

  fetch(apiUrl)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (slots) {
      if (!slots || typeof slots !== 'object') slots = {};
      applyUrls(slots);
    })
    .catch(function () {
      applyUrls({});
    });
})();
