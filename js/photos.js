/**
 * Load admin-managed photo URLs from the API and apply them to img[data-photo-slot].
 * Set window.GLENS_PHOTOS_API to your API base URL (e.g. 'https://your-api.onrender.com')
 * if the site is served from a different origin than the API.
 */
(function () {
  'use strict';

  var apiBase = window.GLENS_PHOTOS_API || '';
  var apiUrl = (apiBase.replace(/\/$/, '') || (window.location.origin)) + '/api/photos';

  var imgs = document.querySelectorAll('img[data-photo-slot]');
  if (!imgs.length) return;

  fetch(apiUrl)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (slots) {
      if (!slots || typeof slots !== 'object') return;
      imgs.forEach(function (img) {
        var slot = img.getAttribute('data-photo-slot');
        var url = slot && slots[slot];
        if (url && typeof url === 'string') img.src = url;
      });
    })
    .catch(function () {});
})();
