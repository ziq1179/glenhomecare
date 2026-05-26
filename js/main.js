/**
 * Glens Residential Home - Main JavaScript
 * Mobile menu, FAQ accordion, contact form handling
 */

(function () {
  'use strict';

  // --- Mobile menu ---
  var menuToggle = document.querySelector('.menu-toggle');
  var navMainList = document.querySelector('.nav-main-list');

  if (menuToggle && navMainList) {
    menuToggle.addEventListener('click', function () {
      var isOpen = navMainList.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', isOpen);
      menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    // Close menu when a link is clicked (for in-page nav)
    navMainList.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMainList.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  // --- FAQ accordion ---
  var faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(function (button) {
    button.addEventListener('click', function () {
      var item = button.closest('.faq-item');
      var isOpen = item.classList.contains('is-open');

      // Close all others (optional: single open at a time)
      document.querySelectorAll('.faq-item.is-open').forEach(function (openItem) {
        openItem.classList.remove('is-open');
        var openBtn = openItem.querySelector('.faq-question');
        if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
      } else {
        item.classList.remove('is-open');
        button.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // --- Contact form (client-side validation + placeholder for backend) ---
  var contactForm = document.getElementById('contact-form');
  var formStatus = document.getElementById('form-status');

  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = contactForm.querySelector('[name="name"]');
      var email = contactForm.querySelector('[name="email"]');
      var message = contactForm.querySelector('[name="message"]');
      var privacy = contactForm.querySelector('[name="privacy"]');

      formStatus.textContent = '';
      formStatus.className = 'form-status';

      if (!name || !name.value.trim()) {
        formStatus.textContent = 'Please enter your name.';
        formStatus.classList.add('error');
        name.focus();
        return;
      }
      if (!email || !email.value.trim()) {
        formStatus.textContent = 'Please enter your email.';
        formStatus.classList.add('error');
        email.focus();
        return;
      }
      if (!message || !message.value.trim()) {
        formStatus.textContent = 'Please enter a message.';
        formStatus.classList.add('error');
        message.focus();
        return;
      }
      if (!privacy || !privacy.checked) {
        formStatus.textContent = 'Please agree to the Privacy Policy.';
        formStatus.classList.add('error');
        privacy.focus();
        return;
      }

      var phoneEl = contactForm.querySelector('[name="phone"]');
      var apiBase = (window.GLENS_PHOTOS_API || '').replace(/\/$/, '') || window.location.origin;
      formStatus.textContent = 'Sending…';
      formStatus.className = 'form-status';

      fetch(apiBase + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          phone: phoneEl ? phoneEl.value.trim() : '',
          message: message.value.trim()
        })
      })
        .then(function (r) {
          if (r.ok) return r.json();
          return r.json().then(function (data) { throw new Error(data.error || 'Something went wrong'); });
        })
        .then(function () {
          formStatus.textContent = 'Thank you. We will be in touch soon.';
          formStatus.classList.add('success');
          contactForm.reset();
        })
        .catch(function (err) {
          formStatus.textContent = err.message || 'Something went wrong. Please try again or call us.';
          formStatus.classList.add('error');
        });
    });
  }

  // --- Review form ---
  var reviewForm = document.getElementById('review-form');
  var reviewFormStatus = document.getElementById('review-form-status');

  if (reviewForm && reviewFormStatus) {
    var ratingInput = reviewForm.querySelector('.rating-input');
    if (ratingInput) {
      ratingInput.querySelectorAll('input[name="rating"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
          ratingInput.setAttribute('data-rating', this.value);
        });
      });
    }

    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = reviewForm.querySelector('[name="name"]');
      var reviewText = reviewForm.querySelector('[name="review"]');
      var privacy = reviewForm.querySelector('[name="privacy"]');

      reviewFormStatus.textContent = '';
      reviewFormStatus.className = 'form-status';

      if (!name || !name.value.trim()) {
        reviewFormStatus.textContent = 'Please enter your name.';
        reviewFormStatus.classList.add('error');
        if (name) name.focus();
        return;
      }
      if (!reviewText || !reviewText.value.trim()) {
        reviewFormStatus.textContent = 'Please write your review.';
        reviewFormStatus.classList.add('error');
        if (reviewText) reviewText.focus();
        return;
      }
      if (reviewText.value.trim().length < 20) {
        reviewFormStatus.textContent = 'Please write at least 20 characters.';
        reviewFormStatus.classList.add('error');
        reviewText.focus();
        return;
      }
      if (!privacy || !privacy.checked) {
        reviewFormStatus.textContent = 'Please agree to the Privacy Policy.';
        reviewFormStatus.classList.add('error');
        if (privacy) privacy.focus();
        return;
      }

      // For static site: show success. When you add a backend (e.g. Neon), POST here.
      reviewFormStatus.textContent = 'Thank you for your review. We appreciate your feedback.';
      reviewFormStatus.classList.add('success');
      reviewForm.reset();
      if (ratingInput) ratingInput.removeAttribute('data-rating');
    });
  }

  // --- Careers form ---
  var careersForm = document.getElementById('careers-form');
  var careersStatus = document.getElementById('careers-form-status');

  if (careersForm && careersStatus) {
    careersForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var fullName = careersForm.querySelector('[name=”full_name”]');
      var address  = careersForm.querySelector('[name=”address”]');
      var phone    = careersForm.querySelector('[name=”phone”]');
      var role     = careersForm.querySelector('[name=”role”]');
      var cv       = careersForm.querySelector('[name=”cv”]');

      careersStatus.textContent = '';
      careersStatus.className = 'form-status';

      if (!fullName || !fullName.value.trim()) {
        careersStatus.textContent = 'Please enter your full name.';
        careersStatus.classList.add('error');
        if (fullName) fullName.focus();
        return;
      }
      if (!address || !address.value.trim()) {
        careersStatus.textContent = 'Please enter your address.';
        careersStatus.classList.add('error');
        address.focus();
        return;
      }
      if (!phone || !phone.value.trim()) {
        careersStatus.textContent = 'Please enter your phone number.';
        careersStatus.classList.add('error');
        phone.focus();
        return;
      }
      if (!role || !role.value) {
        careersStatus.textContent = 'Please select a role.';
        careersStatus.classList.add('error');
        role.focus();
        return;
      }
      if (!cv || !cv.files || cv.files.length === 0) {
        careersStatus.textContent = 'Please attach your CV.';
        careersStatus.classList.add('error');
        if (cv) cv.focus();
        return;
      }

      var formData = new FormData();
      formData.append('full_name', fullName.value.trim());
      formData.append('address', address.value.trim());
      formData.append('phone', phone.value.trim());
      formData.append('role', role.value);
      formData.append('cv', cv.files[0]);

      var apiBase = (window.GLENS_PHOTOS_API || '').replace(/\/$/, '') || window.location.origin;
      careersStatus.textContent = 'Submitting…';

      fetch(apiBase + '/api/careers/apply', {
        method: 'POST',
        body: formData
      })
        .then(function (r) {
          if (r.ok) return r.json();
          return r.json().then(function (data) { throw new Error(data.error || 'Something went wrong'); });
        })
        .then(function () {
          careersStatus.textContent = 'Application received — thank you. We will be in touch.';
          careersStatus.classList.add('success');
          careersForm.reset();
        })
        .catch(function (err) {
          careersStatus.textContent = err.message || 'Something went wrong. Please try again or call us.';
          careersStatus.classList.add('error');
        });
    });
  }

  // --- Life in pictures: 3 rows visible, then “Show all” ---
  (function () {
    var grid = document.getElementById('life-gallery-grid');
    var btn = document.getElementById('life-gallery-toggle');
    if (!grid || !btn) return;

    var items = Array.prototype.slice.call(grid.querySelectorAll('.img-wrap'));
    if (!items.length) return;

    var expanded = false;
    var resizeTimer = null;
    var VISIBLE_ROW_COUNT = 3;

    function getItemsPerRow() {
      var top0 = items[0].offsetTop;
      var n = 0;
      for (var i = 0; i < items.length; i++) {
        if (items[i].offsetTop === top0) n++;
        else break;
      }
      return n > 0 ? n : 1;
    }

    function update() {
      for (var h = 0; h < items.length; h++) {
        items[h].classList.remove('life-gallery-item--hidden');
      }

      var perRow = getItemsPerRow();
      var maxVisible = perRow * VISIBLE_ROW_COUNT;
      var needsToggle = items.length > maxVisible;

      if (!needsToggle) {
        btn.hidden = true;
        expanded = false;
        return;
      }

      btn.hidden = false;

      if (expanded) {
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = 'Show fewer photos';
      } else {
        for (var j = maxVisible; j < items.length; j++) {
          items[j].classList.add('life-gallery-item--hidden');
        }
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = 'Show all photos';
      }
    }

    function scheduleUpdate() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resizeTimer = null;
        update();
      }, 120);
    }

    btn.addEventListener('click', function () {
      expanded = !expanded;
      update();
    });

    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('load', scheduleUpdate);
    if (window.ResizeObserver) {
      try {
        new ResizeObserver(scheduleUpdate).observe(grid);
      } catch (e) { /* ignore */ }
    }
    update();
  })();
})();
