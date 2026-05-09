/**
 * Load admin-managed media URLs from the API and apply them to img[data-photo-slot].
 * Supports images (default), direct video files (.mp4, .webm, .ogg, .mov), YouTube, and Vimeo.
 * Uses data-fallback for defaults so we do not load Unsplash first then replace (avoids flash).
 * Set window.GLENS_PHOTOS_API if the site and API are on different origins.
 */
(function () {
  'use strict';

  var PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  function classifyMediaUrl(url) {
    if (!url || typeof url !== 'string') return 'image';
    var u = url.trim();
    if (!u) return 'image';
    if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(u)) return 'video-file';
    if (/youtube\.com|youtu\.be/i.test(u)) return 'youtube';
    if (/vimeo\.com/i.test(u)) return 'vimeo';
    return 'image';
  }

  function youtubeVideoId(url) {
    try {
      var u = new URL(url, window.location.href);
      var h = u.hostname.replace(/^www\./, '');
      if (h === 'youtu.be') {
        var bid = u.pathname.replace(/^\//, '').split('/')[0];
        if (bid && /^[a-zA-Z0-9_-]{11}$/.test(bid)) return bid;
      }
      if (h.indexOf('youtube.com') !== -1) {
        var path = u.pathname;
        if (path.indexOf('/embed/') === 0) {
          var eid = path.slice(7).split('/')[0];
          if (eid) return eid;
        }
        if (path.indexOf('/shorts/') === 0) {
          var sid = path.split('/')[2];
          if (sid) return sid;
        }
        var v = u.searchParams.get('v');
        if (v) return v;
      }
    } catch (e) { /* ignore */ }
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|watch\?v=))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function vimeoVideoId(url) {
    var m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    return m ? m[1] : null;
  }

  function slotContainer(img) {
    return img.closest('.img-wrap') || img.parentElement;
  }

  function removeGlensVideos(container) {
    if (!container) return;
    container.querySelectorAll('.glens-slot-video').forEach(function (el) {
      el.parentNode.removeChild(el);
    });
  }

  function resetImg(img) {
    img.classList.remove('is-slot-replaced');
    img.style.display = '';
    img.removeAttribute('aria-hidden');
  }

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
      var container = slotContainer(img);
      removeGlensVideos(container);
      resetImg(img);

      var slot = img.getAttribute('data-photo-slot');
      var fallback = (img.getAttribute('data-fallback') || '').trim();
      var fromApi = slots && slot && slots[slot];
      var url = (fromApi && String(fromApi).trim()) ? String(fromApi).trim() : fallback;

      if (!url) {
        img.src = PLACEHOLDER;
        return;
      }

      var kind = classifyMediaUrl(url);
      if (kind === 'image') {
        img.src = url;
        return;
      }

      img.style.display = 'none';
      img.setAttribute('aria-hidden', 'true');
      img.classList.add('is-slot-replaced');

      var title = img.getAttribute('alt') || 'Video';

      if (kind === 'video-file') {
        var video = document.createElement('video');
        video.className = 'glens-slot-video';
        video.src = url;
        video.setAttribute('controls', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('preload', 'metadata');
        video.setAttribute('title', title);
        container.insertBefore(video, img.nextSibling);
        return;
      }

      if (kind === 'youtube') {
        var yid = youtubeVideoId(url);
        if (!yid) {
          resetImg(img);
          img.src = fallback || PLACEHOLDER;
          return;
        }
        var yt = document.createElement('iframe');
        yt.className = 'glens-slot-video glens-slot-video--embed';
        yt.src = 'https://www.youtube-nocookie.com/embed/' + yid + '?rel=0';
        yt.setAttribute('title', title);
        yt.setAttribute('allowfullscreen', '');
        yt.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        yt.setAttribute('loading', 'lazy');
        container.insertBefore(yt, img.nextSibling);
        return;
      }

      if (kind === 'vimeo') {
        var vid = vimeoVideoId(url);
        if (!vid) {
          resetImg(img);
          img.src = fallback || PLACEHOLDER;
          return;
        }
        var vm = document.createElement('iframe');
        vm.className = 'glens-slot-video glens-slot-video--embed';
        vm.src = 'https://player.vimeo.com/video/' + vid;
        vm.setAttribute('title', title);
        vm.setAttribute('allowfullscreen', '');
        vm.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
        vm.setAttribute('loading', 'lazy');
        container.insertBefore(vm, img.nextSibling);
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
