
$(function () {
  'use strict';

 
  var $nav = $('#mainNav');
  $(window).on('scroll', function () {
    $nav.toggleClass('scrolled', $(window).scrollTop() > 40);
  });

  $nav.toggleClass('scrolled', $(window).scrollTop() > 40);

  
  $('a[href^="#"]:not([data-error-link])').on('click', function (e) {
    var target = $(this).attr('href');
    if (target.length > 1 && $(target).length) {
      e.preventDefault();
      var offset = $(target).offset().top - 70;
      $('html, body').animate({ scrollTop: offset }, 600);

      if ($('#navItems').hasClass('show')) {
        $('.navbar-toggler').click();
      }
    }
  });

  
  var errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
  $(document).on('click', '[data-error-link]', function (e) {
    e.preventDefault();
    errorModal.show();
  });

  
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var $el = $(entry.target);
        var delay = $el.data('delay') || 0;
        setTimeout(function () { $el.addClass('is-visible'); }, delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  $('.reveal').each(function () { revealObserver.observe(this); });

 
  var countersStarted = false;
  function runCounters() {
    if (countersStarted) return;
    countersStarted = true;

    $('.stat-number').each(function () {
      var $el = $(this);
      var target = parseInt($el.data('target'), 10) || 0;
      var duration = 1800;
      var startTime = null;

      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        // easeOutCubic
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.floor(eased * target);
        $el.text(value.toLocaleString());
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          $el.text(target.toLocaleString() + (target >= 1000 ? '+' : ''));
        }
      }
      requestAnimationFrame(step);
    });
  }

  var statsObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        runCounters();
        statsObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });
  var statsEl = document.querySelector('#stats');
  if (statsEl) statsObserver.observe(statsEl);


  var API_URL = 'https://api.restful-api.dev/objects';
  var $status = $('#apiStatus');
  var $grid   = $('#apiGrid');

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getProductIcon(name) {
    var n = (name || '').toLowerCase();
    if (n.indexOf('watch') !== -1) return 'fa-clock';
    if (n.indexOf('airpod') !== -1 || n.indexOf('beats') !== -1 || n.indexOf('headphone') !== -1) return 'fa-headphones-simple';
    if (n.indexOf('macbook') !== -1 || n.indexOf('laptop') !== -1) return 'fa-laptop';
    if (n.indexOf('ipad') !== -1 || n.indexOf('fold') !== -1 || n.indexOf('tablet') !== -1) return 'fa-tablet-screen-button';
    if (n.indexOf('phone') !== -1 || n.indexOf('pixel') !== -1 || n.indexOf('galaxy') !== -1) return 'fa-mobile-screen-button';
    return 'fa-cube';
  }

  function formatFieldLabel(key) {
    return String(key)
      .replace(/_/g, ' ')
      .trim()
      .replace(/\w\S*/g, function (word) {
        if (/^[A-Z0-9]+$/.test(word) && word.length <= 4) return word; // keep e.g. "GB", "CPU"
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
  }

  function formatFieldValue(key, value) {
    if (value === null || value === undefined || value === '') return '—';
    if (/price/i.test(key) && !isNaN(parseFloat(value))) {
      return '$' + parseFloat(value).toFixed(2);
    }
    return String(value);
  }

  function renderApiCards(data) {
    if (!Array.isArray(data) || data.length === 0) {
      $grid.html(
        '<div class="col-12"><p class="text-center text-muted">No items returned.</p></div>'
      );
      return;
    }

    var cards = data.map(function (item) {
      var id = escapeHtml(item.id);
      var name = escapeHtml(item.name);
      var icon = getProductIcon(item.name);
      var fields = (item.data && typeof item.data === 'object') ? item.data : null;
      var fieldKeys = fields ? Object.keys(fields) : [];

      var bodyHtml;
      if (fieldKeys.length) {
        bodyHtml = '<ul class="api-data-list mb-0">' +
          fieldKeys.map(function (key) {
            return '<li>' +
              '<span class="api-field-label">' + escapeHtml(formatFieldLabel(key)) + '</span>' +
              '<span class="api-field-value">' + escapeHtml(formatFieldValue(key, fields[key])) + '</span>' +
              '</li>';
          }).join('') +
          '</ul>';
      } else {
        bodyHtml = '<p class="api-no-data mb-0"><i class="fa-solid fa-circle-info me-2"></i>No extra details provided</p>';
      }

      return '' +
        '<div class="col-md-6 col-lg-4 d-flex">' +
          '<article class="api-card reveal flex-fill">' +
            '<div class="api-card-top">' +
              '<span class="api-id">#' + id + '</span>' +
              '<span class="api-icon"><i class="fa-solid ' + icon + '"></i></span>' +
            '</div>' +
            '<h5>' + (name || 'Untitled') + '</h5>' +
            bodyHtml +
          '</article>' +
        '</div>';
    }).join('');

    $grid.html(cards);
    $grid.find('.reveal').each(function () { revealObserver.observe(this); });
  }

  $.ajax({
    url: API_URL,
    method: 'GET',
    dataType: 'json',
    timeout: 10000
  })
    .done(function (data) {
      $status.addClass('d-none');
      renderApiCards(data);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      $status.html(
        '<div class="alert alert-warning d-inline-block">' +
        '<i class="fa-solid fa-triangle-exclamation me-2"></i>' +
        'Could not load live data from the REST API. ' +
        '(' + escapeHtml(textStatus || 'error') + ')</div>'
      );
    });
});
