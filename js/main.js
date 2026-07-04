
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


  var $dropZone   = $('#dropZone');
  var $fileInput  = $('#fileInput');
  var $progress   = $('#uploadProgress');
  var $progressBar= $progress.find('.progress-bar');
  var $progressStatus = $progress.find('.upload-status');
  var $previewGrid= $('#previewGrid');
  var MAX_SIZE    = 5 * 1024 * 1024; // 5 MB
  var ACCEPTED    = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  $dropZone.on('click', function (e) {
    if (e.target === $fileInput[0]) {
      return;
    }
    $fileInput.trigger('click');
  });
  $dropZone.on('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      $fileInput.trigger('click');
    }
  });

  $dropZone.on('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).addClass('is-dragover');
  });
  $dropZone.on('dragleave', function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).removeClass('is-dragover');
  });
  $dropZone.on('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).removeClass('is-dragover');
    var files = e.originalEvent.dataTransfer.files;
    handleFiles(files);
  });

  $fileInput.on('change', function () {
    handleFiles(this.files);
    this.value = ''; 
  });

  function isAccepted(file) {
    if (ACCEPTED.indexOf(file.type) !== -1) return true;
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].indexOf(ext) !== -1;
  }

  function handleFiles(files) {
    if (!files || !files.length) return;

    Array.prototype.forEach.call(files, function (file) {
      if (!isAccepted(file)) {
        addPreview(file, null, 'Unsupported file type', true);
        return;
      }
      if (file.size > MAX_SIZE) {
        addPreview(file, null, 'Exceeds 5 MB limit', true);
        return;
      }

      var reader = new FileReader();
      reader.onload = function (e) {
        addPreview(file, e.target.result, 'Uploading...', false);
      };
      reader.readAsDataURL(file);
    });
  }

  function addPreview(file, src, status, isError) {
    var $item = $(
      '<div class="preview-item">' +
        '<img alt="' + escapeHtml(file.name) + '" />' +
        '<button type="button" class="preview-remove" aria-label="Remove">' +
          '<i class="fa-solid fa-xmark"></i>' +
        '</button>' +
        '<div class="preview-status">' +
          '<i class="fa-solid fa-circle-notch fa-spin"></i>' +
          '<span class="status-text"></span>' +
        '</div>' +
      '</div>'
    );

    $item.find('img').attr('src', src || '');
    $item.find('.status-text').text(status);
    if (isError) {
      $item.addClass('is-error');
      $item.find('.preview-status i')
        .removeClass('fa-circle-notch fa-spin')
        .addClass('fa-circle-exclamation');
    }

    $previewGrid.append($item);

    $item.on('click', '.preview-remove', function () {
      $item.remove();
    });

    if (!isError) {
      uploadFile(file, $item);
    }
  }

  function uploadFile(file, $item) {
    var formData = new FormData();
    formData.append('images', file);

    $.ajax({
      url: '/upload',
      method: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      timeout: 30000,
      xhr: function () {
        var xhr = new window.XMLHttpRequest();
        xhr.upload.addEventListener('progress', function (e) {
          if (e.lengthComputable) {
            var pct = Math.round((e.loaded / e.total) * 100);
            $progress.removeClass('d-none');
            $progressBar.css('width', pct + '%');
            $progressStatus.text('Uploading ' + file.name + '... ' + pct + '%');
          }
        });
        return xhr;
      }
    })
      .done(function (response) {
        $progressBar.css('width', '100%');
        setTimeout(function () {
          $progress.addClass('d-none');
          $progressBar.css('width', '0%');
        }, 600);

        if (response && response.files && response.files.length) {
          var saved = response.files[0];
          $item.find('img').attr('src', saved.url);
        }
        $item.removeClass('is-error').addClass('is-done');
        $item.find('.preview-status i')
          .removeClass('fa-circle-notch fa-spin fa-circle-exclamation')
          .addClass('fa-circle-check');
        $item.find('.status-text').text('Uploaded');
      })
      .fail(function () {
        $progress.addClass('d-none');
        $item.addClass('is-error').removeClass('is-done');
        $item.find('.preview-status i')
          .removeClass('fa-circle-notch fa-spin')
          .addClass('fa-circle-exclamation');
        $item.find('.status-text').text('Upload failed');
      });
  }

});
