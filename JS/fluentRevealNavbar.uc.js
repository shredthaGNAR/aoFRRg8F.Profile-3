// ==UserScript==
// @name           Fluent Reveal Navbar Buttons
// @version        2.0.0
// @author         aminomancer (Enhanced)
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds a visual effect to navbar buttons similar to the spotlight gradient effect on Windows 10's start menu tiles. When hovering over or near a button, a subtle radial gradient is applied to every button in the vicinity of the mouse.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/fluentRevealNavbar.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/fluentRevealNavbar.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0.
// ==/UserScript==

"use strict";

(() => {
  // Configuration
  const CONFIG = {
    // Include bookmarks on the toolbar in the effect
    includeBookmarks: true,
    
    // Include the URL bar in the effect
    includeUrlBar: true,
    
    // Color of the gradient (default uses button hover background color)
    lightColor: "var(--button-hover-bgcolor, hsla(224, 100%, 80%, 0.15))",
    
    // Size of the radial gradient in pixels
    gradientSize: 50,
    
    // Show additional light burst when clicking (not recommended)
    clickEffect: false,
    
    // Filter mouse movements too far from toolbar to reduce CPU load
    filterDy: true,
    
    // Cache toolbar buttons for better performance
    cacheButtons: true,
    
    // Debounce mouse movement events (milliseconds)
    debounceDelay: 16, // ~60fps
    
    // Enable debug logging
    debug: false,
  };

  class FluentRevealEffect {
    #listeners = new Map();
    #toolbarButtons = null;
    #cachedElements = new WeakMap();
    #rafId = null;
    #lastMouseEvent = null;
    #isPressed = false;
    #someEffectsApplied = false;
    #initialized = false;
    #lastProcessTime = 0;
    #mousePosition = { x: 0, y: 0 };

    constructor(options = {}) {
      this.options = { ...CONFIG, ...options };
      this.#init();
    }

    #init() {
      if (this.#initialized) {
        this.#log("Already initialized");
        return;
      }

      try {
        // Check if required elements exist
        if (!this.#validateEnvironment()) {
          throw new Error("Required browser elements not found");
        }

        this.#setupAttributes();
        this.#setupEventListeners();
        this.#trackMousePosition();
        this.#initialized = true;
        this.#log("Initialization complete");
      } catch (error) {
        console.error("[FluentRevealNavbar] Initialization failed:", error);
      }
    }

    #validateEnvironment() {
      return !!(
        window.gNavToolbox &&
        window.gURLBar &&
        document.getElementById("browser") &&
        document.getElementById("PersonalToolbar")
      );
    }

    #setupAttributes() {
      document.documentElement.setAttribute("fluent-reveal-hover", "true");
      if (this.options.clickEffect) {
        document.documentElement.setAttribute("fluent-reveal-click", "true");
      }
    }

    #trackMousePosition() {
      // Track mouse position globally for fallback
      const trackHandler = (e) => {
        this.#mousePosition.x = e.pageX;
        this.#mousePosition.y = e.pageY;
      };
      
      document.addEventListener("mousemove", trackHandler, { passive: true });
      this.#listeners.set("global-mousemove", trackHandler);
    }

    #setupEventListeners() {
      const target = window;
      
      const events = [
        ["mousemove", this.#handleMouseMove, { passive: true }],
        ["mouseleave", this.#handleMouseLeave, { passive: true }],
        ["scroll", this.#handleScroll, { passive: true, capture: true }],
      ];

      if (this.options.clickEffect) {
        events.push(
          ["mousedown", this.#handleMouseDown, { passive: true }],
          ["mouseup", this.#handleMouseUp, { passive: true }]
        );
      }

      events.forEach(([event, handler, options]) => {
        const boundHandler = handler.bind(this);
        target.addEventListener(event, boundHandler, options);
        this.#listeners.set(`${event}-${options?.capture || false}`, {
          target,
          event,
          handler: boundHandler,
          options,
        });
      });

      // Cleanup on window unload
      window.addEventListener("unload", () => this.destroy(), { once: true });
    }

    get toolbarButtons() {
      if (!this.#toolbarButtons || !this.options.cacheButtons) {
        this.#toolbarButtons = this.#collectToolbarButtons();
      }
      return this.#toolbarButtons;
    }

    #collectToolbarButtons() {
      try {
        const buttons = [];
        
        // Main toolbar buttons
        const mainButtons = gNavToolbox.querySelectorAll(
          "#nav-bar .toolbarbutton-1:not([hidden]):not([collapsed])"
        );
        buttons.push(...mainButtons);
        
        // URL bar
        if (this.options.includeUrlBar) {
          const urlBar = document.getElementById("urlbar-background");
          if (urlBar) buttons.push(urlBar);
        }
        
        // Bookmarks toolbar
        if (this.options.includeBookmarks) {
          const personalToolbar = document.getElementById("PersonalToolbar");
          if (personalToolbar && !personalToolbar.collapsed) {
            const bookmarkButtons = personalToolbar.querySelectorAll(
              ".toolbarbutton-1:not([hidden]), .bookmark-item:not([hidden])"
            );
            buttons.push(...bookmarkButtons);
          }
        }
        
        return buttons;
      } catch (error) {
        this.#logError("Failed to collect toolbar buttons", error);
        return [];
      }
    }

    #handleMouseMove = (event) => {
      this.#lastMouseEvent = event;
      this.#scheduleUpdate();
    };

    #handleMouseLeave = () => {
      this.#clearAllEffects();
    };

    #handleScroll = (event) => {
      if (this.#lastMouseEvent) {
        this.#scheduleUpdate();
      }
    };

    #handleMouseDown = (event) => {
      if (event.button === 0) {
        this.#isPressed = true;
        this.#lastMouseEvent = event;
        this.#scheduleUpdate(true);
      }
    };

    #handleMouseUp = (event) => {
      if (event.button === 0) {
        this.#isPressed = false;
        this.#lastMouseEvent = event;
        this.#scheduleUpdate();
      }
    };

    #scheduleUpdate(immediate = false) {
      if (!this.#lastMouseEvent) return;

      // Debounce updates for performance
      const now = performance.now();
      if (!immediate && now - this.#lastProcessTime < this.options.debounceDelay) {
        return;
      }

      // Cancel previous scheduled update
      if (this.#rafId) {
        cancelAnimationFrame(this.#rafId);
      }

      this.#rafId = requestAnimationFrame(() => {
        this.#processMouseEvent(this.#lastMouseEvent);
        this.#lastProcessTime = performance.now();
        this.#rafId = null;
      });
    }

    #processMouseEvent(event) {
      try {
        // Filter events too far from toolbar
        if (this.options.filterDy) {
          const browser = document.getElementById("browser");
          const browserRect = browser?.getBoundingClientRect();
          
          if (browserRect && event.clientY > browserRect.y + this.options.gradientSize + 50) {
            if (this.#someEffectsApplied) {
              this.#clearAllEffects();
            }
            return;
          }
        }

        this.#generateEffectsForAll(event, this.#isPressed && this.options.clickEffect);
      } catch (error) {
        this.#logError("Failed to process mouse event", error);
      }
    }

    #generateEffectsForAll(event, withClick = false) {
      const buttons = this.toolbarButtons;
      
      if (!buttons || buttons.length === 0) {
        return;
      }

      buttons.forEach(button => {
        if (this.#isElementVisible(button)) {
          this.#generateToolbarButtonEffect(button, event, withClick);
        }
      });
      
      this.#someEffectsApplied = true;
    }

    #generateToolbarButtonEffect(element, event, withClick = false) {
      try {
        // Get or cache the target area for this button
        const area = this.#getEffectArea(element);
        if (!area) return;

        // Skip if element is disabled or hidden
        if (this.#shouldSkipElement(element, area)) {
          return this.#clearEffect(area);
        }

        // Calculate gradient position
        const rect = area.getBoundingClientRect();
        const x = (event.pageX ?? this.#mousePosition.x) - rect.left - window.scrollX;
        const y = (event.pageY ?? this.#mousePosition.y) - rect.top - window.scrollY;

        // Draw the gradient effect
        this.#drawEffect(area, x, y, withClick);
      } catch (error) {
        this.#logError("Failed to generate effect for button", error);
      }
    }

    #getEffectArea(element) {
      // Check cache first
      if (this.#cachedElements.has(element)) {
        return this.#cachedElements.get(element);
      }

      let area = null;

      if (element.id === "urlbar-background") {
        area = element;
      } else if (element.id === "PlacesChevron" || element.classList.contains("bookmark-item")) {
        area = element;
      } else {
        // Try to find the icon or badge stack
        area = element.querySelector(".toolbarbutton-badge-stack") ||
               element.querySelector(".toolbarbutton-icon") ||
               element.querySelector(".toolbarbutton-text");
      }

      // Cache the result
      if (area) {
        this.#cachedElements.set(element, area);
      }

      return area;
    }

    #shouldSkipElement(element, area) {
      // Skip focused URL bar
      if (this.options.includeUrlBar && 
          element.id === "urlbar-background" && 
          gURLBar?.focused) {
        return true;
      }

      // Skip disabled elements
      if (element.disabled || element.hasAttribute("disabled")) {
        return true;
      }

      // Skip invisible elements
      const style = getComputedStyle(area);
      if (style.display === "none" || 
          style.visibility === "hidden" || 
          style.visibility === "collapse" ||
          style.pointerEvents === "none") {
        return true;
      }

      return false;
    }

    #isElementVisible(element) {
      if (!element || !element.isConnected) return false;
      
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    #drawEffect(element, x, y, withClick = false) {
      const { gradientSize, lightColor } = this.options;
      
      let backgroundImage;
      
      if (withClick) {
        // Click effect with double gradient
        backgroundImage = `
          radial-gradient(circle ${gradientSize}px at ${x}px ${y}px, 
            ${lightColor}, transparent),
          radial-gradient(circle 70px at ${x}px ${y}px, 
            transparent, ${lightColor}, transparent, transparent)
        `.replace(/\s+/g, ' ').trim();
      } else {
        // Normal hover effect
        backgroundImage = `radial-gradient(circle ${gradientSize}px at ${x}px ${y}px, ${lightColor}, transparent)`;
      }

      element.style.backgroundImage = backgroundImage;
    }

    #clearEffect(element) {
      if (element?.style) {
        element.style.removeProperty("background-image");
      }
    }

    #clearAllEffects() {
      try {
        this.toolbarButtons.forEach(button => {
          const area = this.#getEffectArea(button);
          if (area) {
            this.#clearEffect(area);
          }
        });
        this.#someEffectsApplied = false;
      } catch (error) {
        this.#logError("Failed to clear effects", error);
      }
    }

    #log(...args) {
      if (this.options.debug) {
        console.log("[FluentRevealNavbar]", ...args);
      }
    }

    #logError(...args) {
      console.error("[FluentRevealNavbar]", ...args);
    }

    // Public methods
    updateOptions(newOptions) {
      const oldOptions = { ...this.options };
      this.options = { ...this.options, ...newOptions };

      // Re-cache buttons if caching option changed
      if (oldOptions.cacheButtons !== this.options.cacheButtons) {
        this.#toolbarButtons = null;
      }

      // Update attributes if click effect changed
      if (oldOptions.clickEffect !== this.options.clickEffect) {
        if (this.options.clickEffect) {
          document.documentElement.setAttribute("fluent-reveal-click", "true");
          this.#setupClickListeners();
        } else {
          document.documentElement.removeAttribute("fluent-reveal-click");
        }
      }
    }

    #setupClickListeners() {
      if (!this.#listeners.has("mousedown-false")) {
        const mousedownHandler = this.#handleMouseDown.bind(this);
        const mouseupHandler = this.#handleMouseUp.bind(this);
        
        window.addEventListener("mousedown", mousedownHandler, { passive: true });
        window.addEventListener("mouseup", mouseupHandler, { passive: true });
        
        this.#listeners.set("mousedown-false", {
          target: window,
          event: "mousedown",
          handler: mousedownHandler,
          options: { passive: true },
        });
        
        this.#listeners.set("mouseup-false", {
          target: window,
          event: "mouseup",
          handler: mouseupHandler,
          options: { passive: true },
        });
      }
    }

    refreshButtons() {
      this.#toolbarButtons = null;
      this.#cachedElements = new WeakMap();
      return this.toolbarButtons;
    }

    destroy() {
      try {
        // Cancel any pending animation frame
        if (this.#rafId) {
          cancelAnimationFrame(this.#rafId);
          this.#rafId = null;
        }

        // Clear all effects
        this.#clearAllEffects();

        // Remove event listeners
        this.#listeners.forEach((listenerInfo) => {
          if (typeof listenerInfo === "function") {
            // Global mousemove handler
            document.removeEventListener("mousemove", listenerInfo);
          } else {
            const { target, event, handler, options } = listenerInfo;
            target.removeEventListener(event, handler, options);
          }
        });
        this.#listeners.clear();

        // Remove attributes
        document.documentElement.removeAttribute("fluent-reveal-hover");
        document.documentElement.removeAttribute("fluent-reveal-click");

        // Clear caches
        this.#toolbarButtons = null;
        this.#cachedElements = new WeakMap();
        this.#lastMouseEvent = null;
        
        this.#initialized = false;
        this.#log("Cleanup complete");
      } catch (error) {
        this.#logError("Cleanup failed", error);
      }
    }
  }

  // Initialize when browser is ready
  const init = () => {
    try {
      if (!window.fluentRevealNavbar) {
        window.fluentRevealNavbar = new FluentRevealEffect();
        
        // Add public API for debugging/customization
        window.FluentReveal = {
          updateOptions: (options) => window.fluentRevealNavbar.updateOptions(options),
          refreshButtons: () => window.fluentRevealNavbar.refreshButtons(),
          destroy: () => window.fluentRevealNavbar.destroy(),
          get options() { return window.fluentRevealNavbar.options; },
        };
      }
    } catch (error) {
      console.error("[FluentRevealNavbar] Failed to initialize:", error);
    }
  };

  if (gBrowserInit?.delayedStartupFinished) {
    init();
  } else {
    const observer = {
      observe(subject, topic) {
        if (topic === "browser-delayed-startup-finished" && subject === window) {
          Services.obs.removeObserver(observer, topic);
          init();
        }
      },
    };
    Services.obs.addObserver(observer, "browser-delayed-startup-finished");
  }
})();
