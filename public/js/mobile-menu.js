/**
 * Mobile Menu System - The Aura Inn
 * Professional slide-from-right panel with touch swipe support
 * Uses #auraMobileMenu (outside <header>) to avoid style.css conflicts
 */

(function () {
    "use strict";

    var menu = document.getElementById("auraMobileMenu");
    var backdrop = document.getElementById("auraMMBackdrop");
    var panel = document.getElementById("auraMMPanel");
    var openBtn = document.getElementById("mobileMenuBtn");
    var closeBtn = document.getElementById("auraMMClose");
    var hamburger = document.getElementById("hamburgerIcon");

    if (!menu || !openBtn) return;

    var isOpen = false;

    function openMenu() {
        if (isOpen) return;
        isOpen = true;
        menu.classList.add("open");
        menu.setAttribute("aria-hidden", "false");
        if (hamburger) hamburger.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeMenu() {
        if (!isOpen) return;
        isOpen = false;
        menu.classList.remove("open");
        menu.setAttribute("aria-hidden", "true");
        if (hamburger) hamburger.classList.remove("active");
        document.body.style.overflow = "";
    }

    // Toggle on hamburger click
    openBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener("click", closeMenu);
    }

    // Close on backdrop tap
    if (backdrop) {
        backdrop.addEventListener("click", closeMenu);
    }

    // Close when clicking a link or the Book Now button
    var clickables = menu.querySelectorAll("a, button");
    for (var i = 0; i < clickables.length; i++) {
        (function (el) {
            if (el.id === "auraMMClose") return;
            el.addEventListener("click", function () {
                setTimeout(closeMenu, 150);
            });
        })(clickables[i]);
    }

    // Escape key
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && isOpen) {
            closeMenu();
        }
    });

    // Auto-close on resize to desktop
    window.addEventListener("resize", function () {
        if (window.innerWidth >= 768 && isOpen) {
            closeMenu();
        }
    });

    // ===== TOUCH SWIPE TO CLOSE (swipe right to dismiss) =====
    if (panel) {
        var touchStartX = 0;
        var touchCurrentX = 0;
        var isSwiping = false;
        var SWIPE_THRESHOLD = 80;

        panel.addEventListener("touchstart", function (e) {
            touchStartX = e.touches[0].clientX;
            touchCurrentX = touchStartX;
            isSwiping = true;
            panel.style.transition = "none";
        }, { passive: true });

        panel.addEventListener("touchmove", function (e) {
            if (!isSwiping) return;
            touchCurrentX = e.touches[0].clientX;
            var deltaX = touchCurrentX - touchStartX;
            if (deltaX < 0) {
                panel.style.transform = "translateX(" + deltaX + "px)";
            }
        }, { passive: true });

        panel.addEventListener("touchend", function () {
            if (!isSwiping) return;
            isSwiping = false;
            var deltaX = touchCurrentX - touchStartX;
            panel.style.transition = "";
            panel.style.transform = "";
            if (deltaX < -SWIPE_THRESHOLD) {
                closeMenu();
            }
        }, { passive: true });
    }
})();
