(function () {
    function select(selector, root) {
        return (root || document).querySelector(selector);
    }

    function selectAll(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function readParams() {
        return new URLSearchParams(window.location.search);
    }

    function initMobileMenu() {
        var button = select("[data-menu-button]");
        var panel = select("[data-mobile-panel]");

        if (!button || !panel) {
            return;
        }

        button.addEventListener("click", function () {
            panel.classList.toggle("is-open");
        });
    }

    function initHeroSlider() {
        var slider = select("[data-hero-slider]");

        if (!slider) {
            return;
        }

        var slides = selectAll("[data-hero-slide]", slider);
        var dots = selectAll("[data-hero-dot]", slider);
        var prev = select("[data-hero-prev]", slider);
        var next = select("[data-hero-next]", slider);
        var index = 0;
        var timer = null;

        if (!slides.length) {
            return;
        }

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;

            slides.forEach(function (slide, itemIndex) {
                slide.classList.toggle("is-active", itemIndex === index);
            });

            dots.forEach(function (dot, itemIndex) {
                dot.classList.toggle("is-active", itemIndex === index);
            });
        }

        function start() {
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }

            start();
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                restart();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                restart();
            });
        }

        start();
    }

    function movieCard(movie) {
        return [
            '<article class="movie-card">',
            '<a class="movie-poster" href="' + escapeHtml(movie.url) + '" aria-label="' + escapeHtml(movie.title) + '">',
            '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
            '<span class="poster-shade"></span>',
            '<span class="play-dot">▶</span>',
            '<span class="year-badge">' + escapeHtml(movie.year) + '</span>',
            '</a>',
            '<div class="movie-card-body">',
            '<div class="movie-meta-line">',
            '<a href="' + escapeHtml(movie.categoryUrl) + '">' + escapeHtml(movie.category) + '</a>',
            '<span>' + escapeHtml(movie.region) + '</span>',
            '</div>',
            '<h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>',
            '<p>' + escapeHtml(movie.oneLine) + '</p>',
            '</div>',
            '</article>'
        ].join("");
    }

    function initSearchPage() {
        var results = select("[data-search-results]");

        if (!results || !window.MOVIES) {
            return;
        }

        var form = select("[data-search-form]");
        var input = select("[data-search-input]");
        var categoryFilter = select("[data-category-filter]");
        var regionFilter = select("[data-region-filter]");
        var yearFilter = select("[data-year-filter]");
        var sortFilter = select("[data-sort-filter]");
        var clearButton = select("[data-clear-filter]");
        var title = select("[data-search-title]");
        var pagination = select("[data-search-pagination]");
        var params = readParams();
        var page = Math.max(1, Number(params.get("page")) || 1);
        var perPage = 36;

        if (input) {
            input.value = params.get("q") || "";
        }

        if (categoryFilter && params.get("category")) {
            categoryFilter.value = params.get("category") || "";
        }

        if (regionFilter && params.get("region")) {
            regionFilter.value = params.get("region") || "";
        }

        if (yearFilter && params.get("year")) {
            yearFilter.value = params.get("year") || "";
        }

        function normalized(value) {
            return String(value || "").trim().toLowerCase();
        }

        function currentState() {
            return {
                q: normalized(input ? input.value : ""),
                category: categoryFilter ? categoryFilter.value : "",
                region: regionFilter ? regionFilter.value : "",
                year: yearFilter ? yearFilter.value : "",
                sort: sortFilter ? sortFilter.value : "id"
            };
        }

        function applyFilters() {
            var state = currentState();
            var list = window.MOVIES.filter(function (movie) {
                var haystack = normalized([
                    movie.title,
                    movie.region,
                    movie.type,
                    movie.year,
                    movie.genre,
                    movie.category,
                    (movie.tags || []).join(" "),
                    movie.oneLine
                ].join(" "));

                if (state.q && haystack.indexOf(state.q) === -1) {
                    return false;
                }

                if (state.category && movie.category !== state.category) {
                    return false;
                }

                if (state.region && movie.region !== state.region) {
                    return false;
                }

                if (state.year && String(movie.year) !== state.year) {
                    return false;
                }

                return true;
            });

            list.sort(function (a, b) {
                if (state.sort === "year") {
                    return Number(b.year || 0) - Number(a.year || 0) || a.id - b.id;
                }

                if (state.sort === "title") {
                    return String(a.title).localeCompare(String(b.title), "zh-Hans-CN");
                }

                return a.id - b.id;
            });

            return list;
        }

        function render() {
            var list = applyFilters();
            var pages = Math.max(1, Math.ceil(list.length / perPage));

            if (page > pages) {
                page = pages;
            }

            var start = (page - 1) * perPage;
            var visible = list.slice(start, start + perPage);

            if (title) {
                title.textContent = list.length ? "影片结果" : "未找到结果";
            }

            results.innerHTML = visible.map(movieCard).join("") || '<div class="content-card"><h2>暂无匹配内容</h2><p>可以尝试更换搜索词，或清除部分筛选条件。</p></div>';

            if (!pagination) {
                return;
            }

            if (pages <= 1) {
                pagination.innerHTML = "";
                return;
            }

            var buttons = [];
            var begin = Math.max(1, page - 2);
            var end = Math.min(pages, page + 2);

            buttons.push('<button type="button" data-page="' + Math.max(1, page - 1) + '">上一页</button>');

            for (var i = begin; i <= end; i += 1) {
                buttons.push('<button type="button" class="' + (i === page ? 'is-active' : '') + '" data-page="' + i + '">' + i + '</button>');
            }

            buttons.push('<button type="button" data-page="' + Math.min(pages, page + 1) + '">下一页</button>');
            pagination.innerHTML = buttons.join("");

            selectAll("[data-page]", pagination).forEach(function (button) {
                button.addEventListener("click", function () {
                    page = Number(button.getAttribute("data-page")) || 1;
                    render();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                });
            });
        }

        function resetPageAndRender() {
            page = 1;
            render();
        }

        [input, categoryFilter, regionFilter, yearFilter, sortFilter].forEach(function (control) {
            if (!control) {
                return;
            }

            control.addEventListener(control.tagName === "INPUT" ? "input" : "change", resetPageAndRender);
        });

        if (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                resetPageAndRender();
            });
        }

        if (clearButton) {
            clearButton.addEventListener("click", function () {
                if (input) {
                    input.value = "";
                }

                if (categoryFilter) {
                    categoryFilter.value = "";
                }

                if (regionFilter) {
                    regionFilter.value = "";
                }

                if (yearFilter) {
                    yearFilter.value = "";
                }

                if (sortFilter) {
                    sortFilter.value = "id";
                }

                resetPageAndRender();
            });
        }

        render();
    }

    document.addEventListener("DOMContentLoaded", function () {
        initMobileMenu();
        initHeroSlider();
        initSearchPage();
    });
}());
