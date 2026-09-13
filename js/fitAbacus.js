/**
 * Fit-to-screen scaler for the Soroban abacus.
 *
 * Guarantees the full app window renders inside the visible viewport with
 * no horizontal scrolling or dragging:
 * - measures the abacus natural (unscaled) width
 * - shrinks it with transform scale to fit the container width (never upscale)
 * - compensates layout height so content below doesn't leave a gap
 * - re-runs on resize / orientation / visualViewport / load
 */
(function () {
  'use strict';

  var SELECTOR = '.abacus';
  var rafId = 0;

  function availableWidth(el) {
    var parent = el.parentElement;
    if (!parent) return window.innerWidth;
    var style = window.getComputedStyle(parent);
    var padL = parseFloat(style.paddingLeft) || 0;
    var padR = parseFloat(style.paddingRight) || 0;
    var w = parent.clientWidth - padL - padR;
    if (!w || w <= 0) w = window.innerWidth - padL - padR;
    return Math.max(0, w);
  }

  function availableHeight(el) {
    var isPanelActive = document.body.classList.contains('has-active-panel');
    var isMobile = window.innerWidth <= 768;
    var isLandscapeShort = window.innerHeight <= 520 && window.innerWidth > window.innerHeight;

    if (isLandscapeShort) {
      return Math.max(150, window.innerHeight - 75);
    }
    if (isMobile && isPanelActive) {
      return Math.max(150, window.innerHeight * 0.42 - 45);
    }
    return 0;
  }

  function fit() {
    rafId = 0;
    var el = document.querySelector(SELECTOR);
    if (!el) return;

    // Measure natural size without transform or max-width clamping.
    var prevTransform = el.style.transform;
    var prevMaxWidth = el.style.maxWidth;
    el.style.transform = 'none';
    el.style.maxWidth = 'none';
    // Force reflow so scrollWidth reflects unscaled layout.
    void el.offsetWidth;
    var naturalWidth = el.scrollWidth || el.offsetWidth || 0;
    var naturalHeight = el.offsetHeight || 0;
    el.style.maxWidth = prevMaxWidth || '';

    var availW = availableWidth(el);
    var availH = availableHeight(el);
    var scale = 1;
    if (naturalWidth > 0 && availW > 0) {
      scale = Math.min(1, availW / naturalWidth);
    }
    if (naturalHeight > 0 && availH > 0) {
      scale = Math.min(scale, availH / naturalHeight);
    }
    // Clamp tiny screens to avoid collapsing to zero.
    if (!(scale > 0)) scale = 1;
    if (scale < 0.3) scale = 0.3;

    el.style.setProperty('--fit-scale', String(scale));
    el.style.transform = 'scale(' + scale + ')';
    // Collapse the layout gap left by transform shrink (origin top center).
    el.style.marginBottom = ((naturalHeight * scale) - naturalHeight) + 'px';
  }

  function schedule() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(fit);
  }

  document.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', schedule);
  }

  // Expose for debugging / tests.
  window.__fitAbacus = fit;
})();
