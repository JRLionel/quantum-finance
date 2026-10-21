/* =========================================================
   量子金融科技 · 第十章
   页面交互：入场动画、阅读进度、目录定位、图片预览
   ========================================================= */

(function () {
  "use strict";

  var $ = function (selector, scope) {
    return (scope || document).querySelector(selector);
  };

  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 入场动画 ---------- */

  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealItems = $$("[data-reveal]");

    revealItems.forEach(function (el) {
      el.classList.add("reveal");
    });

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- 阅读进度 ---------- */

  var progressBar = $(".progress");

  if (progressBar) {
    var updateProgress = function () {
      var doc = document.documentElement;
      var total = doc.scrollHeight - window.innerHeight;
      var ratio = total > 0 ? window.scrollY / total : 0;
      progressBar.style.width = Math.min(100, Math.max(0, ratio * 100)) + "%";
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  /* ---------- 目录高亮 ---------- */

  var tocLinks = $$(".toc-aside a[href^='#']");

  if (tocLinks.length) {
    var targets = tocLinks
      .map(function (link) {
        var id = link.getAttribute("href").slice(1);
        var section = id ? document.getElementById(id) : null;
        return section ? { link: link, section: section } : null;
      })
      .filter(Boolean);

    var ticking = false;

    var syncToc = function () {
      var marker = window.scrollY + 150;
      var current = targets[0];

      targets.forEach(function (item) {
        if (item.section.getBoundingClientRect().top + window.scrollY <= marker) {
          current = item;
        }
      });

      // 滚动到页面底部时，高亮最后一节
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = targets[targets.length - 1];
      }

      targets.forEach(function (item) {
        item.link.classList.toggle("is-active", item === current);
      });

      ticking = false;
    };

    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(syncToc);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    syncToc();
  }

  /* ---------- 移动端目录：点击后收起 ---------- */

  $$(".toc-inline a").forEach(function (link) {
    link.addEventListener("click", function () {
      var details = link.closest("details");
      if (details) details.removeAttribute("open");
    });
  });

  /* ---------- 图片预览 ---------- */

  var lightbox = $(".lightbox");

  if (lightbox) {
    var lightboxImage = $("img", lightbox);
    var closeButton = $(".lightbox__close", lightbox);
    var lastFocused = null;

    var openLightbox = function (source) {
      lastFocused = document.activeElement;
      lightboxImage.src = source.getAttribute("data-full") || source.src;
      lightboxImage.alt = source.alt || "插图预览";
      lightbox.classList.add("is-open");
      document.body.classList.add("is-locked");
      closeButton.focus();
    };

    var closeLightbox = function () {
      lightbox.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      lightboxImage.removeAttribute("src");
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    };

    $$(".figure__frame").forEach(function (frame) {
      var image = $("img", frame);
      if (!image) return;

      frame.addEventListener("click", function () {
        openLightbox(image);
      });

      frame.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLightbox(image);
        }
      });
    });

    closeButton.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
        closeLightbox();
      }
    });
  }

  /* ---------- 打印 ---------- */

  $$("[data-print]").forEach(function (trigger) {
    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      window.print();
    });
  });

  /* ---------- 复制引用 ---------- */

  var feedback = function (button, message) {
    var original = button.innerHTML;
    button.textContent = message;
    button.disabled = true;
    window.setTimeout(function () {
      button.innerHTML = original;
      button.disabled = false;
    }, 1600);
  };

  var fallbackCopy = function (text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
  };

  $$("[data-copy]").forEach(function (button) {
    button.addEventListener("click", function () {
      var text = button.getAttribute("data-copy") || "";

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () {
          feedback(button, "已复制");
        }).catch(function () {
          fallbackCopy(text);
          feedback(button, "已复制");
        });
        return;
      }

      fallbackCopy(text);
      feedback(button, "已复制");
    });
  });
})();
