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

      // For static site: show success and optionally mailto or send to future API
      // When you add a backend (e.g. Render + Neon), POST to your API here.
      formStatus.textContent = 'Thank you. We will be in touch soon.';
      formStatus.classList.add('success');
      contactForm.reset();
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
})();
