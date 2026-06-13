(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initMobileMenu() {
    var button = qs('[data-mobile-menu-button]');
    var menu = qs('[data-mobile-menu]');

    if (!button || !menu) {
      return;
    }

    button.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('is-open');
      document.body.classList.toggle('menu-open', isOpen);
      button.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function initHeroCarousel() {
    var carousel = qs('[data-hero-carousel]');

    if (!carousel) {
      return;
    }

    var slides = qsa('[data-hero-slide]', carousel);
    var dots = qsa('[data-hero-dot]', carousel);
    var current = 0;

    if (slides.length <= 1) {
      return;
    }

    function activate(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        activate(Number(dot.getAttribute('data-hero-dot')) || 0);
      });
    });

    window.setInterval(function () {
      activate(current + 1);
    }, 5200);
  }

  function initFilters() {
    qsa('[data-filter-panel]').forEach(function (panel) {
      var grid = panel.parentElement ? qs('[data-listing-grid]', panel.parentElement) : null;
      var cards = grid ? qsa('[data-title]', grid) : [];
      var input = qs('.js-filter-input', panel);
      var yearSelect = qs('.js-filter-year', panel);
      var typeSelect = qs('.js-filter-type', panel);
      var categorySelect = qs('.js-filter-category', panel);
      var reset = qs('.js-filter-reset', panel);
      var count = qs('[data-filter-count]', panel);

      if (!grid || !cards.length) {
        return;
      }

      function uniqueValues(attribute) {
        var values = [];
        cards.forEach(function (card) {
          var value = card.getAttribute(attribute) || '';
          if (value && values.indexOf(value) === -1) {
            values.push(value);
          }
        });
        return values.sort(function (a, b) {
          return String(b).localeCompare(String(a), 'zh-CN');
        });
      }

      function fillSelect(select, attribute) {
        if (!select) {
          return;
        }
        uniqueValues(attribute).forEach(function (value) {
          var option = document.createElement('option');
          option.value = value;
          option.textContent = value;
          select.appendChild(option);
        });
      }

      fillSelect(yearSelect, 'data-year');
      fillSelect(typeSelect, 'data-type');

      function applyFilter() {
        var keyword = input ? input.value.trim().toLowerCase() : '';
        var year = yearSelect ? yearSelect.value : '';
        var type = typeSelect ? typeSelect.value : '';
        var category = categorySelect ? categorySelect.value : '';
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute('data-title'),
            card.getAttribute('data-year'),
            card.getAttribute('data-type'),
            card.getAttribute('data-category'),
            card.getAttribute('data-genre'),
            card.textContent
          ].join(' ').toLowerCase();

          var matched = true;
          if (keyword && haystack.indexOf(keyword) === -1) {
            matched = false;
          }
          if (year && card.getAttribute('data-year') !== year) {
            matched = false;
          }
          if (type && card.getAttribute('data-type') !== type) {
            matched = false;
          }
          if (category && card.getAttribute('data-category') !== category) {
            matched = false;
          }

          card.classList.toggle('hidden-by-filter', !matched);
          if (matched) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = String(visible);
        }
      }

      [input, yearSelect, typeSelect, categorySelect].forEach(function (control) {
        if (control) {
          control.addEventListener('input', applyFilter);
          control.addEventListener('change', applyFilter);
        }
      });

      if (reset) {
        reset.addEventListener('click', function () {
          if (input) {
            input.value = '';
          }
          [yearSelect, typeSelect, categorySelect].forEach(function (select) {
            if (select) {
              select.value = '';
            }
          });
          applyFilter();
        });
      }

      applyFilter();
    });
  }

  function initVideoPlayers() {
    qsa('.video-player-shell').forEach(function (shell) {
      var video = qs('video', shell);
      var button = qs('.video-overlay-button', shell);
      var status = qs('[data-video-status]', shell);
      var src = shell.getAttribute('data-video-src');
      var hlsInstance = null;
      var initialized = false;

      if (!video || !button || !src) {
        return;
      }

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function initSource() {
        if (initialized) {
          return Promise.resolve();
        }

        initialized = true;
        setStatus('正在初始化播放源...');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          setStatus('已使用浏览器原生 HLS 播放。');
          return Promise.resolve();
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90
          });
          hlsInstance.loadSource(src);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setStatus('播放源加载完成。');
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setStatus('播放源加载失败，请刷新页面重试。');
            }
          });
          return Promise.resolve();
        }

        video.src = src;
        setStatus('当前浏览器可能不支持 m3u8，请尝试 Safari 或新版 Chrome。');
        return Promise.resolve();
      }

      button.addEventListener('click', function () {
        initSource().then(function () {
          var playPromise = video.play();
          shell.classList.add('is-playing');
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
              shell.classList.remove('is-playing');
              setStatus('浏览器阻止了自动播放，请再次点击视频控件播放。');
            });
          }
        });
      });

      video.addEventListener('play', function () {
        shell.classList.add('is-playing');
      });

      video.addEventListener('pause', function () {
        if (!video.ended) {
          shell.classList.remove('is-playing');
        }
      });

      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function renderMovieCard(movie) {
    var tags = (movie.tags || []).slice(0, 4).map(function (tag) {
      return '<span class="tag">' + escapeHtml(tag) + '</span>';
    }).join('');

    return '' +
      '<article class="movie-card" data-title="' + escapeHtml(movie.title) + '" data-year="' + escapeHtml(movie.year) + '" data-type="' + escapeHtml(movie.type) + '" data-category="' + escapeHtml(movie.categoryName) + '" data-genre="' + escapeHtml(movie.genre) + '">' +
        '<a class="poster-frame" href="' + escapeHtml(movie.url) + '" aria-label="观看 ' + escapeHtml(movie.title) + '">' +
          '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + ' 封面" loading="lazy">' +
          '<span class="type-badge">' + escapeHtml(movie.type) + '</span>' +
          '<span class="poster-play">▶</span>' +
        '</a>' +
        '<div class="movie-card-body">' +
          '<div class="movie-meta-line"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span></div>' +
          '<h2><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h2>' +
          '<p>' + escapeHtml(movie.oneLine) + '</p>' +
          '<div class="tag-row">' + tags + '</div>' +
        '</div>' +
      '</article>';
  }

  function initGlobalSearch() {
    var results = qs('[data-global-search-results]');

    if (!results || !window.MOVIE_INDEX) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = (params.get('q') || '').trim();
    var input = qs('[data-search-page-input]');
    var title = qs('[data-search-title]');
    var summary = qs('[data-search-summary]');
    var recommendations = qs('[data-search-recommendations]');

    if (input) {
      input.value = query;
    }

    if (!query) {
      results.innerHTML = '';
      return;
    }

    var lowerQuery = query.toLowerCase();
    var matched = window.MOVIE_INDEX.filter(function (movie) {
      return [
        movie.title,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        movie.oneLine,
        (movie.tags || []).join(' ')
      ].join(' ').toLowerCase().indexOf(lowerQuery) !== -1;
    }).slice(0, 120);

    if (title) {
      title.textContent = '“' + query + '” 的搜索结果';
    }

    if (summary) {
      summary.textContent = '共找到 ' + matched.length + ' 条匹配内容，最多展示前 120 条。';
    }

    if (recommendations) {
      recommendations.style.display = matched.length ? 'none' : '';
    }

    results.innerHTML = matched.map(renderMovieCard).join('') || '<p class="filter-count">没有找到匹配影片，请尝试更换关键词。</p>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHeroCarousel();
    initFilters();
    initVideoPlayers();
    initGlobalSearch();
  });
})();
