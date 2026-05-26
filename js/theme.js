/**
 * Apply site theme from API. Runs on load; sets data-theme on <html> so
 * theme-care-uk.css overrides apply when theme is "care-uk".
 * Uses same API origin as photos (GLENS_PHOTOS_API) when set.
 */
(function () {
  'use strict';
  var apiBase = (window.GLENS_PHOTOS_API || '').replace(/\/$/, '') || window.location.origin;
  fetch(apiBase + '/api/settings')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (data) {
      var VALID = ['original', 'care-uk', 'good-care'];
      var theme = (data && VALID.indexOf(data.theme) !== -1) ? data.theme : 'original';
      document.documentElement.setAttribute('data-theme', theme);
    })
    .catch(function () {
      document.documentElement.setAttribute('data-theme', 'original');
    });
})();
