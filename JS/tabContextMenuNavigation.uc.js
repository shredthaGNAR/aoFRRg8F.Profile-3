// ==UserScript==
// @name           Tab Context Menu Navigation Updated
// @version        1.2.X
// @author         GLM
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Add navigation menuitems to the tab context menu (Back, Forward, Reload, Bookmark). The menuitems are oriented horizontally with icons and operate on the context tab(s) rather than the active tab.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tabContextMenuNavigation.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tabContextMenuNavigation.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0.
// ==/UserScript==

"use strict";

// Wrap in IIFE to prevent global scope pollution
(() => {
  // Configuration object with enhanced structure
  const CONFIG = {
    l10n: {
      single: {
        back: "Navigate tab back one page",
        forward: "Navigate tab forward one page",
        reload: "Reload tab",
        bookmark: "Bookmark tab",
      },
      multi: {
        back: "Navigate selected tabs back one page",
        forward: "Navigate selected tabs forward one page",
        reload: "Reload selected tabs",
        bookmark: "Bookmark selected tabs...",
      },
      accessKeys: {
        back: "G",
        forward: "F",
        reload: "R",
        bookmark: "B",
      },
    },
    selectors: {
      tabContext: "tabContextMenu",
      newTab: "#context_openANewTab",
      reloadTab: "#context_reloadTab",
      reloadSelectedTabs: "#context_reloadSelectedTabs",
      bookmarkTab: "#context_bookmarkTab",
      bookmarkSelectedTabs: "#context_bookmarkSelectedTabs",
    },
    icons: {
      back: "chrome://browser/skin/back.svg",
      forward: "chrome://browser/skin/forward.svg",
      reload: "chrome://global/skin/icons/reload.svg",
      bookmark: "chrome://browser/skin/bookmark-hollow.svg",
    },
  };

  class TabContextMenuNavigation {
    #elements = new Map();
    #listeners = new Map();
    #styleElement = null;
    #initialized = false;

    constructor() {
      try {
        this.#init();
      } catch (error) {
        console.error("TabContextMenuNavigation initialization failed:", error);
      }
    }

    #init() {
      if (this.#initialized) {
        return;
      }

      // Set operating system attribute
      document.documentElement.setAttribute(
        "operatingsystem",
        AppConstants.platform
      );

      this.#createElements();
      this.#injectStyles();
      this.#attachEventListeners();
      this.#hideOriginalMenuitems();
      this.#initialized = true;
    }

    #createElements() {
      const doc = document;
      
      // Create menugroup container
      const contextNavigation = this.#createElement("menugroup", {
        id: "tab-context-navigation",
      });
      
      // Create separator
      const contextNavSeparator = this.#createElement("menuseparator", {
        id: "tab-context-sep-navigation",
      });

      // Create menu items
      const menuItems = [
        {
          id: "tab-context-back",
          tooltipKey: "back",
          command: "goBack",
        },
        {
          id: "tab-context-forward",
          tooltipKey: "forward",
          command: "goForward",
        },
        {
          id: "tab-context-reload",
          tooltipKey: "reload",
          command: "reload",
        },
        {
          id: "tab-context-bookmark",
          tooltipKey: "bookmark",
          command: "bookmark",
        },
      ];

      menuItems.forEach(({ id, tooltipKey, command }) => {
        const menuitem = this.#createElement("menuitem", {
          id,
          class: "menuitem-iconic",
          tooltiptext: CONFIG.l10n.single[tooltipKey],
          accesskey: CONFIG.l10n.accessKeys[tooltipKey],
        });
        
        // Use arrow function to preserve context
        menuitem.addEventListener("command", () => this[command]());
        
        contextNavigation.appendChild(menuitem);
        this.#elements.set(tooltipKey, menuitem);
      });

      // Store main elements
      this.#elements.set("navigation", contextNavigation);
      this.#elements.set("separator", contextNavSeparator);

      // Insert into DOM
      const tabContext = this.tabContext;
      if (tabContext) {
        tabContext.prepend(contextNavSeparator);
        tabContext.prepend(contextNavigation);
        
        // Remove separator after "New Tab" if present
        this.#cleanupNewTabSeparator();
      }
    }

    #createElement(tag, attributes = {}) {
      const element = document.createXULElement(tag);
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
      return element;
    }

    #cleanupNewTabSeparator() {
      try {
        const newTab = this.tabContext.querySelector(CONFIG.selectors.newTab);
        if (newTab?.nextElementSibling?.tagName === "menuseparator") {
          newTab.nextElementSibling.remove();
        }
      } catch (error) {
        console.warn("Failed to cleanup new tab separator:", error);
      }
    }

    #attachEventListeners() {
      const popupShowingHandler = (event) => this.#onPopupShowing(event);
      this.tabContext.addEventListener("popupshowing", popupShowingHandler);
      this.#listeners.set("popupshowing", popupShowingHandler);
    }

    #onPopupShowing(event) {
      if (event.target !== this.tabContext) {
        return;
      }

      const contextTab = this.contextTab;
      if (!contextTab) {
        return;
      }

      const isMultiselected = contextTab.multiselected;
      const tabs = isMultiselected ? gBrowser.selectedTabs : [contextTab];
      
      // Update button states
      this.#updateButtonStates(tabs, isMultiselected);
      
      // Update tooltips
      this.#updateTooltips(isMultiselected);
    }

    #updateButtonStates(tabs, isMultiselected) {
      const backButton = this.#elements.get("back");
      const forwardButton = this.#elements.get("forward");
      
      if (!backButton || !forwardButton) {
        return;
      }

      if (isMultiselected) {
        backButton.disabled = !tabs.some(tab => 
          this.#canGoBack(tab)
        );
        forwardButton.disabled = !tabs.some(tab => 
          this.#canGoForward(tab)
        );
      } else {
        backButton.disabled = !this.#canGoBack(tabs[0]);
        forwardButton.disabled = !this.#canGoForward(tabs[0]);
      }
    }

    #canGoBack(tab) {
      try {
        return gBrowser.getBrowserForTab(tab)?.webNavigation?.canGoBack ?? false;
      } catch (error) {
        return false;
      }
    }

    #canGoForward(tab) {
      try {
        return gBrowser.getBrowserForTab(tab)?.webNavigation?.canGoForward ?? false;
      } catch (error) {
        return false;
      }
    }

    #updateTooltips(isMultiselected) {
      const type = isMultiselected ? "multi" : "single";
      
      ["back", "forward", "reload", "bookmark"].forEach(key => {
        const element = this.#elements.get(key);
        if (element) {
          element.setAttribute("tooltiptext", CONFIG.l10n[type][key]);
        }
      });
    }

    goBack() {
      this.#navigateTabs((browser) => {
        if (browser.webNavigation?.canGoBack) {
          browser.goBack();
        }
      });
    }

    goForward() {
      this.#navigateTabs((browser) => {
        if (browser.webNavigation?.canGoForward) {
          browser.goForward();
        }
      });
    }

    reload() {
      const contextTab = this.contextTab;
      if (!contextTab) {
        return;
      }

      try {
        if (contextTab.multiselected) {
          gBrowser.reloadMultiSelectedTabs();
        } else {
          gBrowser.reloadTab(contextTab);
        }
      } catch (error) {
        console.error("Failed to reload tab(s):", error);
      }
    }

    bookmark() {
      const contextTab = this.contextTab;
      if (!contextTab) {
        return;
      }

      try {
        const pages = contextTab.multiselected
          ? PlacesCommandHook.uniqueSelectedPages
          : PlacesCommandHook.getUniquePages([contextTab]);
        
        PlacesUIUtils.showBookmarkPagesDialog(pages);
      } catch (error) {
        console.error("Failed to bookmark tab(s):", error);
      }
    }

    #navigateTabs(action) {
      const contextTab = this.contextTab;
      if (!contextTab) {
        return;
      }

      try {
        const tabs = contextTab.multiselected ? gBrowser.selectedTabs : [contextTab];
        tabs.forEach(tab => {
          const browser = gBrowser.getBrowserForTab(tab);
          if (browser) {
            action(browser);
          }
        });
      } catch (error) {
        console.error("Navigation failed:", error);
      }
    }

    #injectStyles() {
      if (this.#styleElement) {
        return;
      }

      const styles = this.#generateStyles();
      this.#styleElement = document.createElement("style");
      this.#styleElement.textContent = styles;
      document.head.appendChild(this.#styleElement);
    }

    #generateStyles() {
      const { icons, selectors } = CONFIG;
      
      return `
        /* Base styles for navigation group */
        #tab-context-navigation > .menuitem-iconic > .menu-iconic-text,
        #tab-context-navigation > .menuitem-iconic > .menu-accel-container {
          display: none;
        }
        
        #tab-context-navigation > .menuitem-iconic {
          -moz-box-flex: 1;
          -moz-box-pack: center;
          -moz-box-align: center;
        }
        
        #tab-context-navigation > .menuitem-iconic > .menu-iconic-left {
          appearance: none;
        }
        
        #tab-context-navigation > .menuitem-iconic > .menu-iconic-left > .menu-iconic-icon {
          width: 1.25em;
          height: auto;
          margin: 7px;
          -moz-context-properties: fill;
          fill: currentColor;
        }
        
        /* Icon definitions */
        #tab-context-back {
          list-style-image: url("${icons.back}");
        }
        
        #tab-context-forward {
          list-style-image: url("${icons.forward}");
        }
        
        #tab-context-reload {
          list-style-image: url("${icons.reload}");
        }
        
        #tab-context-bookmark {
          list-style-image: url("${icons.bookmark}");
        }
        
        /* RTL support */
        #tab-context-back:-moz-locale-dir(rtl),
        #tab-context-forward:-moz-locale-dir(rtl),
        #tab-context-reload:-moz-locale-dir(rtl) {
          transform: scaleX(-1);
        }
        
        /* Touch mode adjustments */
        #contentAreaContextMenu[touchmode] > #tab-context-navigation > menuitem {
          padding-block: 7px;
        }
        
        /* Navigation group styling */
        #tab-context-navigation {
          background-color: menu;
          padding-bottom: 4px;
        }
        
        #tab-context-sep-navigation {
          margin-inline-start: -28px;
          margin-top: -4px;
        }
        
        /* Windows non-native menus */
        @media (-moz-windows-non-native-menus) {
          #tab-context-navigation:not([hidden]) {
            background-color: inherit;
            padding: 0 0 4px;
            display: flex;
            flex-direction: row;
            --menuitem-min-width: calc(2em + 16px);
            min-width: calc(4 * var(--menuitem-min-width));
          }
          
          #tab-context-navigation > .menuitem-iconic {
            flex: 1 0 auto;
          }
          
          #tab-context-navigation > .menuitem-iconic[_moz-menuactive="true"] {
            background-color: transparent;
          }
          
          #tab-context-navigation > .menuitem-iconic > .menu-iconic-left {
            margin: 0;
            padding: 0;
          }
          
          #tab-context-navigation > .menuitem-iconic > .menu-iconic-left > .menu-iconic-icon {
            width: var(--menuitem-min-width);
            height: 32px;
            padding: 8px 1em;
            margin: 0;
          }
          
          #tab-context-navigation > .menuitem-iconic[_moz-menuactive="true"]:not([disabled="true"]) > .menu-iconic-left > .menu-iconic-icon {
            background-color: var(--menuitem-hover-background-color);
          }
          
          #tab-context-navigation > .menuitem-iconic[_moz-menuactive="true"][disabled="true"] > .menu-iconic-left > .menu-iconic-icon {
            background-color: var(--menuitem-disabled-hover-background-color);
          }
          
          #tab-context-navigation > .menuitem-iconic:first-child {
            -moz-box-pack: start;
          }
          
          #tab-context-navigation > .menuitem-iconic:last-child {
            -moz-box-pack: end;
          }
          
          #tab-context-navigation > .menuitem-iconic:last-child,
          #tab-context-navigation > .menuitem-iconic:first-child {
            flex-grow: 0;
            width: calc(var(--menuitem-min-width) + calc(100% - 4 * var(--menuitem-min-width)) / 6);
          }
          
          #tab-context-sep-navigation {
            margin-top: 0;
            margin-inline: 0;
          }
        }
        
        /* Linux-specific adjustments */
        :root[operatingsystem="linux"] #tab-context-navigation > .menuitem-iconic > .menu-iconic-left {
          padding-inline-end: 0 !important;
          margin-inline-end: 0 !important;
        }
        
        /* Hide original menu items */
        ${selectors.reloadTab},
        ${selectors.reloadSelectedTabs},
        ${selectors.bookmarkTab},
        ${selectors.bookmarkSelectedTabs} {
          display: none !important;
        }
      `.replace(/\s+/g, ' ').trim();
    }

    #hideOriginalMenuitems() {
      // This is handled by CSS, but we can also do it programmatically for safety
      const itemsToHide = [
        CONFIG.selectors.reloadTab,
        CONFIG.selectors.reloadSelectedTabs,
        CONFIG.selectors.bookmarkTab,
        CONFIG.selectors.bookmarkSelectedTabs,
      ];

      itemsToHide.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.style.display = "none";
        }
      });
    }

    // Lazy-loaded getters with caching
    get tabContext() {
      if (!this.#elements.has("tabContext")) {
        const element = document.getElementById(CONFIG.selectors.tabContext);
        if (element) {
          this.#elements.set("tabContext", element);
        }
      }
      return this.#elements.get("tabContext");
    }

    get contextTab() {
      return TabContextMenu?.contextTab ?? null;
    }

    // Cleanup method for potential future use
    destroy() {
      try {
        // Remove event listeners
        this.#listeners.forEach((handler, event) => {
          this.tabContext?.removeEventListener(event, handler);
        });
        this.#listeners.clear();

        // Remove elements
        this.#elements.get("navigation")?.remove();
        this.#elements.get("separator")?.remove();
        this.#elements.clear();

        // Remove styles
        this.#styleElement?.remove();
        this.#styleElement = null;

        this.#initialized = false;
      } catch (error) {
        console.error("Failed to destroy TabContextMenuNavigation:", error);
      }
    }
  }

  // Initialize when appropriate
  const init = () => {
    try {
      if (!window.tabContextMenuNavigation) {
        window.tabContextMenuNavigation = new TabContextMenuNavigation();
      }
    } catch (error) {
      console.error("Failed to initialize TabContextMenuNavigation:", error);
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
