// ==UserScript==
// @name           Fluent Reveal Navbar Buttons
// @version        1.3.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds a visual effect to navbar buttons with performance optimizations and error handling
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/fluentRevealNavbar.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/fluentRevealNavbar.uc.js
// @license        CC BY-NC-SA 4.0
// ==/UserScript==

(function() {
  "use strict";
  
  class FluentRevealEffect {
    // User configuration
    static options = {
      includeBookmarks: true,
      includeUrlBar: true,
      lightColor: "var(--button-hover-bgcolor, hsla(224, 100%, 80%, 0.15))",
      gradientSize: 50,
      clickEffect: false,
      filterDy: false,
      cacheButtons: false,
      // Performance options
      throttleMs: 16, // ~60fps
      maxDistance: 200, // Max distance to apply effect
    };

    constructor() {
      this._options = { ...FluentRevealEffect.options };
      this._disposed = false;
      this._animationId = null;
      this._lastEventTime = 0;
      this._cachedElements = new Map();
      this._boundHandleEvent = this.handleEvent.bind(this);
      
      try {
        this.init();
      } catch (error) {
        console.error("FluentRevealEffect: Initialization failed: - fluentRevealNavbar.uc.js:41", error);
      }
    }

    init() {
      if (!window.gNavToolbox) {
        throw new Error("gNavToolbox not available");
      }

      this.applyEffect(window);
      document.documentElement.setAttribute("fluent-reveal-hover", "true");
      
      if (this._options.clickEffect) {
        document.documentElement.setAttribute("fluent-reveal-click", "true");
      }

      // Setup cleanup on window unload
      window.addEventListener("unload", () => this.dispose(), { once: true });
    }

    // Cached getters with error handling
    get toolbarButtons() {
      if (this._disposed) return [];
      
      try {
        if (!this._toolbarButtons || !this._options.cacheButtons) {
          this._toolbarButtons = [];
          
          const navToolbox = window.gNavToolbox;
          if (navToolbox) {
            this._toolbarButtons = Array.from(
              navToolbox.querySelectorAll(".toolbarbutton-1")
            );
            
            if (this._options.includeUrlBar) {
              const urlbarBg = navToolbox.querySelector("#urlbar-background");
              if (urlbarBg) this._toolbarButtons.push(urlbarBg);
            }
            
            if (this._options.includeBookmarks && this.personalToolbar) {
              const bookmarks = Array.from(
                this.personalToolbar.querySelectorAll(".toolbarbutton-1, .bookmark-item")
              );
              this._toolbarButtons = this._toolbarButtons.concat(bookmarks);
            }
          }
        }
        return this._toolbarButtons;
      } catch (error) {
        console.warn("FluentRevealEffect: Error getting toolbar buttons: - fluentRevealNavbar.uc.js:90", error);
        return [];
      }
    }

    get personalToolbar() {
      if (!this._personalToolbar) {
        this._personalToolbar = document.getElementById("PersonalToolbar");
      }
      return this._personalToolbar;
    }

    get browser() {
      if (!this._browser) {
        this._browser = document.getElementById("browser");
      }
      return this._browser;
    }

    // Throttled event handler
    handleEvent(e) {
      if (this._disposed) return;

      const now = performance.now();
      if (now - this._lastEventTime < this._options.throttleMs) {
        return;
      }
      this._lastEventTime = now;

      try {
        // Early exit for distant mouse events
        if (this._options.filterDy && this.browser) {
          const browserRect = this.browser.getBoundingClientRect();
          if (e.clientY > browserRect.y + this._options.gradientSize) {
            if (this._someEffectsApplied) {
              this.clearEffectsForAll();
            }
            return;
          }
        }

        // Cancel previous animation frame
        if (this._animationId) {
          cancelAnimationFrame(this._animationId);
        }

        this._animationId = requestAnimationFrame(() => {
          this._animationId = null;
          this.processEvent(e);
        });
      } catch (error) {
        console.warn("FluentRevealEffect: Error in handleEvent: - fluentRevealNavbar.uc.js:141", error);
      }
    }

    processEvent(e) {
      if (this._disposed) return;

      try {
        switch (e.type) {
          case "scroll":
          case "mousemove":
            if (this._options.clickEffect && this._options.is_pressed) {
              this.generateEffectsForAll(e, true);
            } else {
              this.generateEffectsForAll(e);
            }
            break;

          case "mousedown":
            this._options.is_pressed = true;
            if (this._options.clickEffect) {
              this.generateEffectsForAll(e, true);
            }
            break;

          case "mouseup":
            this._options.is_pressed = false;
            if (this._options.clickEffect) {
              this.generateEffectsForAll(e);
            }
            break;

          case "mouseleave":
            this.clearEffectsForAll();
            break;
        }
      } catch (error) {
        console.warn("FluentRevealEffect: Error processing event: - fluentRevealNavbar.uc.js:178", error);
      }
    }

    applyEffect(el, options = {}) {
      if (this._disposed || !el) return;

      try {
        const mergedOptions = { ...this._options, ...options };
        Object.assign(this._options, {
          clickEffect: mergedOptions.clickEffect,
          lightColor: mergedOptions.lightColor,
          gradientSize: mergedOptions.gradientSize,
          is_pressed: false,
        });

        // Use passive listeners where possible for better performance
        el.addEventListener("mousemove", this._boundHandleEvent, { passive: true });
        el.addEventListener("mouseleave", this._boundHandleEvent, { passive: true });
        el.addEventListener("scroll", this._boundHandleEvent, { passive: true, capture: true });

        if (this._options.clickEffect) {
          el.addEventListener("mousedown", this._boundHandleEvent, { passive: true });
          el.addEventListener("mouseup", this._boundHandleEvent, { passive: true });
        }
      } catch (error) {
        console.error("FluentRevealEffect: Error applying effect: - fluentRevealNavbar.uc.js:204", error);
      }
    }

    // Optimized with distance checking and caching
    generateToolbarButtonEffect(el, e, click = false) {
      if (this._disposed || !el) return;

      try {
        const { gradientSize, lightColor, maxDistance } = this._options;
        
        // Quick distance check to avoid expensive calculations
        const elRect = el.getBoundingClientRect();
        const mouseX = e.clientX || 0;
        const mouseY = e.clientY || 0;
        
        const distance = Math.sqrt(
          Math.pow(mouseX - (elRect.left + elRect.width / 2), 2) +
          Math.pow(mouseY - (elRect.top + elRect.height / 2), 2)
        );
        
        if (distance > maxDistance) {
          return this.clearEffect(el);
        }

        const isBookmark = el.id === "PlacesChevron" || el.classList.contains("bookmark-item");
        let area = this.getEffectArea(el, isBookmark);
        
        if (!area) return;

        // Check for focused URL bar
        if (this._options.includeUrlBar && el.id === 'urlbar-background' && 
            window.gURLBar?.focused) {
          return this.clearEffect(area);
        }

        // Check visibility and enabled state
        if (!this.isElementEffectable(el, area, isBookmark)) {
          return this.clearEffect(area);
        }

        const coords = this.calculateGradientCoords(area, e);
        if (!coords) return;

        const cssLightEffect = click ? 
          this.generateClickEffect(coords.x, coords.y, gradientSize, lightColor) : null;

        this.drawEffect(area, coords.x, coords.y, lightColor, gradientSize, cssLightEffect);
      } catch (error) {
        console.warn("FluentRevealEffect: Error generating button effect: - fluentRevealNavbar.uc.js:253", error);
      }
    }

    getEffectArea(el, isBookmark) {
      // Cache area lookups for performance
      const cacheKey = el.id || el.className;
      if (this._cachedElements.has(cacheKey)) {
        return this._cachedElements.get(cacheKey);
      }

      let area;
      if (isBookmark) {
        area = el;
      } else if (el.id === "urlbar-background") {
        area = el;
      } else {
        area = el.querySelector(".toolbarbutton-badge-stack") ||
               el.querySelector(".toolbarbutton-icon");
      }

      if (area && this._options.cacheButtons) {
        this._cachedElements.set(cacheKey, area);
      }

      return area;
    }

    isElementEffectable(el, area, isBookmark) {
      if (el.disabled || getComputedStyle(el).pointerEvents === "none") {
        return false;
      }

      const areaStyle = getComputedStyle(area);
      if (areaStyle.display === "none" || 
          areaStyle.visibility === "hidden" || 
          areaStyle.visibility === "collapse") {
        
        if (isBookmark) return false;
        
        // Try fallback to text element
        const textArea = el.querySelector(".toolbarbutton-text");
        if (!textArea) return false;
        
        const textStyle = getComputedStyle(textArea);
        return textStyle.display !== "none" && textStyle.visibility !== "hidden";
      }

      return true;
    }

    calculateGradientCoords(area, e) {
      try {
        const offset = area.getBoundingClientRect();
        return {
          x: (e.pageX || e.clientX) - offset.left - window.scrollX,
          y: (e.pageY || e.clientY) - offset.top - window.scrollY
        };
      } catch (error) {
        console.warn("FluentRevealEffect: Error calculating coordinates: - fluentRevealNavbar.uc.js:312", error);
        return null;
      }
    }

    generateClickEffect(x, y, gradientSize, lightColor) {
      return `radial-gradient(circle ${gradientSize}px at ${x}px ${y}px, ${lightColor}, rgba(255,255,255,0)), radial-gradient(circle 70px at ${x}px ${y}px, rgba(255,255,255,0), ${lightColor}, rgba(255,255,255,0), rgba(255,255,255,0))`;
    }

    generateEffectsForAll(e, click = false) {
      if (this._disposed) return;

      try {
        const buttons = this.toolbarButtons;
        for (const button of buttons) {
          this.generateToolbarButtonEffect(button, e, click);
        }
        this._someEffectsApplied = true;
      } catch (error) {
        console.warn("FluentRevealEffect: Error generating effects: - fluentRevealNavbar.uc.js:331", error);
      }
    }

    drawEffect(el, x, y, lightColor, gradientSize, cssLightEffect = null) {
      if (!el || this._disposed) return;

      try {
        const lightBg = cssLightEffect || 
          `radial-gradient(circle ${gradientSize}px at ${x}px ${y}px, ${lightColor}, rgba(255,255,255,0))`;
        
        el.style.backgroundImage = lightBg;
      } catch (error) {
        console.warn("FluentRevealEffect: Error drawing effect: - fluentRevealNavbar.uc.js:344", error);
      }
    }

    clearEffect(el) {
      if (!el || this._disposed) return;

      try {
        this._options.is_pressed = false;
        el.style.removeProperty("background-image");
      } catch (error) {
        console.warn("FluentRevealEffect: Error clearing effect: - fluentRevealNavbar.uc.js:355", error);
      }
    }

    clearEffectsForAll() {
      if (this._disposed) return;

      try {
        const buttons = this.toolbarButtons;
        for (const button of buttons) {
          const area = this.getEffectArea(button, 
            button.id === "PlacesChevron" || button.classList.contains("bookmark-item"));
          if (area) {
            this.clearEffect(area);
          }
        }
        this._someEffectsApplied = false;
      } catch (error) {
        console.warn("FluentRevealEffect: Error clearing all effects: - fluentRevealNavbar.uc.js:373", error);
      }
    }

    // Proper cleanup method
    dispose() {
      if (this._disposed) return;

      try {
        this._disposed = true;

        // Cancel any pending animation
        if (this._animationId) {
          cancelAnimationFrame(this._animationId);
          this._animationId = null;
        }

        // Clear all effects
        this.clearEffectsForAll();

        // Remove event listeners
        if (window && this._boundHandleEvent) {
          window.removeEventListener("mousemove", this._boundHandleEvent);
          window.removeEventListener("mouseleave", this._boundHandleEvent);
          window.removeEventListener("scroll", this._boundHandleEvent, true);
          
          if (this._options.clickEffect) {
            window.removeEventListener("mousedown", this._boundHandleEvent);
            window.removeEventListener("mouseup", this._boundHandleEvent);
          }
        }

        // Clear caches
        this._cachedElements.clear();
        this._toolbarButtons = null;
        this._personalToolbar = null;
        this._browser = null;

        // Remove DOM attributes
        document.documentElement.removeAttribute("fluent-reveal-hover");
        document.documentElement.removeAttribute("fluent-reveal-click");

      } catch (error) {
        console.warn("FluentRevealEffect: Error during disposal: - fluentRevealNavbar.uc.js:416", error);
      }
    }
  }

  function init() {
    try {
      if (!window.gNavToolbox) {
        console.error("FluentRevealEffect: gNavToolbox not available - fluentRevealNavbar.uc.js:424");
        return;
      }

      // Dispose existing instance if present
      if (window.fluentRevealNavbar?.dispose) {
        window.fluentRevealNavbar.dispose();
      }

      window.fluentRevealNavbar = new FluentRevealEffect();
    } catch (error) {
      console.error("FluentRevealEffect: Initialization failed: - fluentRevealNavbar.uc.js:435", error);
    }
  }

  // Initialize when ready
  if (window.gBrowserInit?.delayedStartupFinished) {
  }
    init();
  { else 'oncee'}
    window.addEventListener("load", init, { once: true });
}