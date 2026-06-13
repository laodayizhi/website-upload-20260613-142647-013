(() => {
  const menuButton = document.querySelector('[data-menu-button]');
  const nav = document.querySelector('[data-nav]');

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      nav.classList.toggle('is-open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    let current = 0;

    const activate = (index) => {
      current = index;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    };

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const index = Number(dot.dataset.heroDot || 0);
        activate(index);
      });
    });

    if (slides.length > 1) {
      setInterval(() => {
        activate((current + 1) % slides.length);
      }, 5200);
    }
  }

  const filterInput = document.querySelector('[data-page-filter]');
  const filterList = document.querySelector('[data-filter-list]');

  if (filterInput && filterList) {
    const cards = Array.from(filterList.querySelectorAll('.movie-card'));
    filterInput.addEventListener('input', () => {
      const term = filterInput.value.trim().toLowerCase();
      cards.forEach((card) => {
        const text = [card.dataset.title, card.dataset.year, card.dataset.genre, card.dataset.region, card.dataset.type].join(' ').toLowerCase();
        card.style.display = text.includes(term) ? '' : 'none';
      });
    });
  }

  const searchPage = document.querySelector('[data-search-page]');

  if (searchPage) {
    const input = searchPage.querySelector('[data-site-search]');
    const cards = Array.from(searchPage.querySelectorAll('.movie-card'));
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('q') || '';

    const applySearch = (value) => {
      const term = value.trim().toLowerCase();
      cards.forEach((card) => {
        const text = [card.dataset.title, card.dataset.year, card.dataset.genre, card.dataset.region, card.dataset.type].join(' ').toLowerCase();
        card.style.display = text.includes(term) ? '' : 'none';
      });
    };

    if (input) {
      input.value = initial;
      applySearch(initial);
      input.addEventListener('input', () => applySearch(input.value));
    }

    searchPage.querySelectorAll('[data-search-chip]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const value = chip.dataset.searchChip || '';
        if (input) {
          input.value = value;
        }
        applySearch(value);
      });
    });
  }

  const video = document.querySelector('#moviePlayer');
  const trigger = document.querySelector('[data-player-trigger]');

  if (video && trigger) {
    const stream = video.dataset.stream;
    let prepared = false;

    const prepare = () => {
      if (!stream || prepared) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
        prepared = true;
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          maxBufferLength: 30,
          enableWorker: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
        prepared = true;
      }
    };

    const play = () => {
      prepare();
      trigger.classList.add('is-hidden');
      const promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {
          trigger.classList.remove('is-hidden');
        });
      }
    };

    trigger.addEventListener('click', play);
    video.addEventListener('click', () => {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener('play', () => {
      trigger.classList.add('is-hidden');
    });
    video.addEventListener('pause', () => {
      trigger.classList.remove('is-hidden');
    });
  }
})();
