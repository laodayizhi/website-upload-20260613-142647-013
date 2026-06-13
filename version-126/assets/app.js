(function () {
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-nav]');
    if (toggle && panel) {
        toggle.addEventListener('click', function () {
            panel.classList.toggle('is-open');
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    if (slides.length > 1) {
        var active = 0;
        var show = function (index) {
            active = index;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === active);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === active);
            });
        };
        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
            });
        });
        window.setInterval(function () {
            show((active + 1) % slides.length);
        }, 5200);
    }

    var searchInputs = Array.prototype.slice.call(document.querySelectorAll('[data-site-search]'));
    searchInputs.forEach(function (input) {
        input.addEventListener('input', function () {
            var value = input.value.trim().toLowerCase();
            var scope = document;
            var scopeSelector = input.getAttribute('data-search-scope');
            if (scopeSelector) {
                scope = document.querySelector(scopeSelector) || document;
            }
            Array.prototype.slice.call(scope.querySelectorAll('[data-search-item]')).forEach(function (item) {
                var text = (item.getAttribute('data-search-text') || '').toLowerCase();
                item.style.display = !value || text.indexOf(value) !== -1 ? '' : 'none';
            });
        });
    });

    Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(function (box) {
        var video = box.querySelector('video');
        var button = box.querySelector('[data-play]');
        var cover = box.querySelector('.player-cover');
        var url = box.getAttribute('data-video');
        var mounted = false;
        var mount = function () {
            if (!video || !url || mounted) {
                return;
            }
            mounted = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
            } else if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({ enableWorker: true });
                hls.loadSource(url);
                hls.attachMedia(video);
            } else {
                video.src = url;
            }
        };
        var play = function () {
            mount();
            box.classList.add('is-playing');
            video.controls = true;
            var promise = video.play();
            if (promise && promise.catch) {
                promise.catch(function () {});
            }
        };
        if (button) {
            button.addEventListener('click', play);
        }
        if (cover) {
            cover.addEventListener('click', play);
        }
        if (video) {
            video.addEventListener('click', function () {
                if (video.paused) {
                    play();
                }
            });
        }
    });
})();
