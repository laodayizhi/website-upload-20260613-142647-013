(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initPlayer();
  });

  function initMenu() {
    var button = document.querySelector("[data-menu-button]");
    var nav = document.querySelector("[data-mobile-nav]");

    if (!button || !nav) {
      return;
    }

    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    start();
  }

  function initFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));

    panels.forEach(function (panel) {
      var section = panel.closest("section") || document;
      var input = panel.querySelector("[data-site-search]");
      var category = panel.querySelector("[data-filter-category]");
      var year = panel.querySelector("[data-filter-year]");
      var region = panel.querySelector("[data-filter-region]");
      var cards = Array.prototype.slice.call(section.querySelectorAll("[data-movie-card]"));
      var empty = section.querySelector("[data-empty-result]");

      function matches(card) {
        var query = input ? input.value.trim().toLowerCase() : "";
        var selectedCategory = category ? category.value : "";
        var selectedYear = year ? year.value : "";
        var selectedRegion = region ? region.value : "";
        var text = [
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-year"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags")
        ].join(" ").toLowerCase();

        if (query && text.indexOf(query) === -1) {
          return false;
        }

        if (selectedCategory && card.getAttribute("data-category") !== selectedCategory) {
          return false;
        }

        if (selectedYear && card.getAttribute("data-year") !== selectedYear) {
          return false;
        }

        if (selectedRegion && card.getAttribute("data-region") !== selectedRegion) {
          return false;
        }

        return true;
      }

      function apply() {
        var visible = 0;
        cards.forEach(function (card) {
          var shouldShow = matches(card);
          card.hidden = !shouldShow;
          if (shouldShow) {
            visible += 1;
          }
        });
        if (empty) {
          empty.hidden = visible !== 0;
        }
      }

      [input, category, year, region].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });
    });
  }

  function initPlayer() {
    var stage = document.querySelector("[data-player]");

    if (!stage) {
      return;
    }

    var video = stage.querySelector("video");
    var button = stage.querySelector("[data-play-button]");
    var hls = null;
    var loaded = false;

    if (!video || !button) {
      return;
    }

    function loadSource() {
      if (loaded) {
        return Promise.resolve();
      }

      var source = video.getAttribute("data-src");
      loaded = true;

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        return new Promise(function (resolve) {
          hls.on(window.Hls.Events.MANIFEST_PARSED, resolve);
          hls.on(window.Hls.Events.ERROR, function (eventName, data) {
            if (data && data.fatal) {
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              } else {
                hls.destroy();
              }
            }
          });
          window.setTimeout(resolve, 1200);
        });
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        return Promise.resolve();
      }

      video.src = source;
      return Promise.resolve();
    }

    function play() {
      loadSource().then(function () {
        return video.play();
      }).then(function () {
        stage.classList.add("is-playing");
      }).catch(function () {
        stage.classList.remove("is-playing");
      });
    }

    button.addEventListener("click", play);

    video.addEventListener("play", function () {
      stage.classList.add("is-playing");
    });

    video.addEventListener("pause", function () {
      stage.classList.remove("is-playing");
    });

    video.addEventListener("ended", function () {
      stage.classList.remove("is-playing");
    });

    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });
  }
})();
