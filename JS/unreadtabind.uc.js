// ==UserScript==
// @name           Unread Tabs - Visual Indicator
// @version        2.0.0
// @description    Visual indicator for tabs that haven't been selected since loading, with enhanced features and customization
// @author         Anonymous (Enhanced)
// @compatibility  Firefox 90+
// @license        MIT
// ==/UserScript==

"use strict";

(() => {
  // Configuration
  const CONFIG = {
    // Visual styles for unread tabs
    styles: {
      default: {
        textDecoration: "underline dotted magenta",
        textDecorationThickness: "2px",
        textUnderlineOffset: "0.2em",
        textDecorationSkipInk: "none",
      },
      alternative: {
        fontStyle: "italic",
        opacity: "0.8",
      },
      bold: {
        fontWeight: "bold",
        color: "var(--tab-attention-icon-color, red)",
      },
    },
    
    // Choose style preset: 'default', 'alternative', 'bold', or 'custom'
    activeStyle: "default",
    
    // Custom CSS for unread tabs (used when activeStyle is 'custom')
    customCSS: ``,
    
    // Feature flags
    features: {
      markNewTabs: true,              // Mark newly opened tabs as unread
      markOnTitleChange: true,        // Mark as unread when title changes in background
      markOnNavigation: true,          // Mark as unread on navigation in background
      ignorePinnedTabs: false,        // Don't mark pinned tabs as unread
      ignoreBlankTabs: true,          // Don't mark blank/new tabs as unread
      persistAcrossSessions: false,   // Remember unread state across browser restarts
      showUnreadCount: true,          // Show unread count in tooltip
      fadeInAnimation: true,          // Animate unread indicator appearance
    },
    
    // Attribute names
    attributes: {
      unread: "data-unread-tab",
      timestamp: "data-unread-timestamp",
      originalTitle: "data-original-title",
    },
    
    // Debug mode
    debug: false,
  };

  class UnreadTabsManager {
    #initialized = false;
    #styleElement = null;
    #listeners = new Map();
    #mutationObserver = null;
    #tabObservers = new WeakMap();
    #unreadCount = 0;
    #animationClass = "unread-tab-fade-in";

    constructor(config = CONFIG) {
      this.config = { ...CONFIG, ...config };
      this.#init();
    }

    async #init() {
      if (this.#initialized) {
        this.#log("Already initialized");
        return;
      }

      try {
        // Wait for browser to be ready
        await this.#waitForBrowser();
        
        this.#setupStyles();
        this.#setupEventListeners();
        this.#initializeExistingTabs();
        this.#setupMutationObserver();
        
        if (this.config.features.showUnreadCount) {
          this.#updateUnreadCount();
        }
        
        this.#initialized = true;
        this.#log("Initialization complete");
      } catch (error) {
        this.#logError("Initialization failed", error);
      }
    }

    async #waitForBrowser() {
      return new Promise((resolve, reject) => {
        const checkBrowser = () => {
          if (window.gBrowser?.tabContainer) {
            resolve();
          } else if (document.readyState === "complete") {
            reject(new Error("Browser components not found"));
          } else {
            setTimeout(checkBrowser, 50);
          }
        };
        checkBrowser();
      });
    }

    #setupStyles() {
      try {
        const css = this.#generateCSS();
        
        this.#styleElement = document.createElement("style");
        this.#styleElement.id = "unread-tabs-styles";
        this.#styleElement.textContent = css;
        
        document.head.appendChild(this.#styleElement);
        this.#log("Styles applied");
      } catch (error) {
        this.#logError("Failed to setup styles", error);
      }
    }

    #generateCSS() {
      const { unread } = this.config.attributes;
      let mainStyle = "";
      
      // Generate style based on selected preset
      if (this.config.activeStyle === "custom" && this.config.customCSS) {
        mainStyle = this.config.customCSS;
      } else {
        const stylePreset = this.config.styles[this.config.activeStyle] || this.config.styles.default;
        mainStyle = Object.entries(stylePreset)
          .map(([prop, value]) => {
            const cssProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
            return `${cssProp}: ${value} !important;`;
          })
          .join("\n    ");
      }
      
      // Build complete CSS
      let css = `
        /* Unread tab indicator */
        .tabbrowser-tab[${unread}="true"]:not([selected]) .tab-label {
          ${mainStyle}
        }
        
        /* Optional: Style for tab container */
        .tabbrowser-tab[${unread}="true"]:not([selected]) {
          position: relative;
        }
      `;
      
      // Add fade-in animation if enabled
      if (this.config.features.fadeInAnimation) {
        css += `
          @keyframes unread-fade-in {
            from {
              opacity: 0.5;
            }
            to {
              opacity: 1;
            }
          }
          
          .tabbrowser-tab[${unread}="true"]:not([selected]).${this.#animationClass} .tab-label {
            animation: unread-fade-in 0.3s ease-in-out;
          }
        `;
      }
      
      // Additional visual indicator on tab line
      css += `
        .tabbrowser-tab[${unread}="true"]:not([selected]) .tab-context-line {
          background-color: var(--tab-attention-icon-color, magenta) !important;
          opacity: 0.5 !important;
          height: 2px !important;
        }
      `;
      
      return css;
    }

    #setupEventListeners() {
      try {
        const tabContainer = gBrowser.tabContainer;
        
        // Tab events
        const events = [
          ["TabOpen", this.#handleTabOpen],
          ["TabSelect", this.#handleTabSelect],
          ["TabClose", this.#handleTabClose],
          ["TabMove", this.#handleTabMove],
          ["TabPinned", this.#handleTabPinned],
          ["TabUnpinned", this.#handleTabUnpinned],
        ];
        
        // Additional events for enhanced features
        if (this.config.features.markOnTitleChange) {
          events.push(["TabAttrModified", this.#handleTabAttrModified]);
        }
        
        events.forEach(([event, handler]) => {
          const boundHandler = handler.bind(this);
          tabContainer.addEventListener(event, boundHandler);
          this.#listeners.set(event, boundHandler);
        });
        
        // Browser navigation events
        if (this.config.features.markOnNavigation) {
          this.#setupNavigationListeners();
        }
        
        // Window events
        window.addEventListener("unload", () => this.destroy(), { once: true });
        
        this.#log("Event listeners attached");
      } catch (error) {
        this.#logError("Failed to setup event listeners", error);
      }
    }

    #setupNavigationListeners() {
      // Listen for DOMTitleChanged on all browsers
      const navigationHandler = (event) => {
        const browser = event.currentTarget;
        const tab = gBrowser.getTabForBrowser(browser);
        
        if (tab && !tab.selected && this.#shouldMarkAsUnread(tab)) {
          this.#markTabAsUnread(tab, "navigation");
        }
      };
      
      // Attach to existing tabs
      for (const tab of gBrowser.tabs) {
        this.#attachNavigationListener(tab, navigationHandler);
      }
      
      // Store handler for cleanup
      this.#listeners.set("navigation", navigationHandler);
    }

    #attachNavigationListener(tab, handler) {
      try {
        const browser = gBrowser.getBrowserForTab(tab);
        if (browser && !this.#tabObservers.has(tab)) {
          browser.addEventListener("DOMTitleChanged", handler);
          browser.addEventListener("DOMContentLoaded", handler);
          this.#tabObservers.set(tab, handler);
        }
      } catch (error) {
        this.#logError("Failed to attach navigation listener", error);
      }
    }

    #detachNavigationListener(tab) {
      try {
        const browser = gBrowser.getBrowserForTab(tab);
        const handler = this.#tabObservers.get(tab);
        
        if (browser && handler) {
          browser.removeEventListener("DOMTitleChanged", handler);
          browser.removeEventListener("DOMContentLoaded", handler);
          this.#tabObservers.delete(tab);
        }
      } catch (error) {
        this.#logError("Failed to detach navigation listener", error);
      }
    }

    #setupMutationObserver() {
      if (!this.config.features.markOnTitleChange) return;
      
      try {
        this.#mutationObserver = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            if (mutation.type === "attributes" && mutation.attributeName === "label") {
              const tab = mutation.target;
              if (tab && !tab.selected && this.#shouldMarkAsUnread(tab)) {
                this.#markTabAsUnread(tab, "titleChange");
              }
            }
          });
        });
        
        // Observe all tabs for label changes
        const observerConfig = { 
          attributes: true, 
          attributeFilter: ["label"],
          subtree: true 
        };
        
        this.#mutationObserver.observe(gBrowser.tabContainer, observerConfig);
        
        this.#log("Mutation observer setup complete");
      } catch (error) {
        this.#logError("Failed to setup mutation observer", error);
      }
    }

    #initializeExistingTabs() {
      try {
        const tabs = gBrowser.tabs;
        const selectedTab = gBrowser.selectedTab;
        let unreadCount = 0;
        
        for (const tab of tabs) {
          if (tab === selectedTab) {
            this.#markTabAsRead(tab);
          } else if (this.#shouldMarkAsUnread(tab)) {
            // Check if tab has the built-in Firefox attribute
            if (tab.hasAttribute("notselectedsinceload") && 
                tab.getAttribute("notselectedsinceload") === "true") {
              this.#markTabAsUnread(tab, "existing", false);
              unreadCount++;
            }
          }
          
          // Attach navigation listener if needed
          if (this.config.features.markOnNavigation) {
            const handler = this.#listeners.get("navigation");
            if (handler) {
              this.#attachNavigationListener(tab, handler);
            }
          }
        }
        
        this.#log(`Initialized ${tabs.length} tabs, ${unreadCount} marked as unread`);
      } catch (error) {
        this.#logError("Failed to initialize existing tabs", error);
      }
    }

    // Event handlers
    #handleTabOpen = (event) => {
      const tab = event.target;
      if (!tab) return;
      
      if (this.config.features.markNewTabs && this.#shouldMarkAsUnread(tab)) {
        // Small delay to allow tab to initialize
        setTimeout(() => {
          if (!tab.selected) {
            this.#markTabAsUnread(tab, "new");
          }
        }, 100);
      }
      
      // Attach navigation listener
      if (this.config.features.markOnNavigation) {
        const handler = this.#listeners.get("navigation");
        if (handler) {
          this.#attachNavigationListener(tab, handler);
        }
      }
    };

    #handleTabSelect = (event) => {
      const tab = event.target;
      if (!tab) return;
      
      this.#markTabAsRead(tab);
    };

    #handleTabClose = (event) => {
      const tab = event.target;
      if (!tab) return;
      
      // Clean up observers
      this.#detachNavigationListener(tab);
      
      // Update count if tab was unread
      if (this.#isTabUnread(tab)) {
        this.#unreadCount--;
        this.#updateUnreadCount();
      }
    };

    #handleTabMove = (event) => {
      // Maintain unread state during moves
      this.#log("Tab moved", event.target?.label);
    };

    #handleTabPinned = (event) => {
      const tab = event.target;
      if (!tab) return;
      
      if (this.config.features.ignorePinnedTabs && this.#isTabUnread(tab)) {
        this.#markTabAsRead(tab);
      }
    };

    #handleTabUnpinned = (event) => {
      const tab = event.target;
      if (!tab) return;
      
      if (!tab.selected && this.#shouldMarkAsUnread(tab)) {
        this.#markTabAsUnread(tab, "unpinned");
      }
    };

    #handleTabAttrModified = (event) => {
      const tab = event.target;
      if (!tab || tab.selected) return;
      
      // Check if title changed
      const modifiedAttrs = event.detail?.changed || [];
      if (modifiedAttrs.includes("label") && this.#shouldMarkAsUnread(tab)) {
        this.#markTabAsUnread(tab, "modified");
      }
    };

    // Core functionality
    #markTabAsUnread(tab, reason = "unknown", animate = true) {
      if (!tab || this.#isTabUnread(tab)) return;
      
      try {
        const { unread, timestamp } = this.config.attributes;
        
        tab.setAttribute(unread, "true");
        tab.setAttribute(timestamp, Date.now().toString());
        
        if (animate && this.config.features.fadeInAnimation) {
          tab.classList.add(this.#animationClass);
          setTimeout(() => tab.classList.remove(this.#animationClass), 300);
        }
        
        this.#unreadCount++;
        this.#updateUnreadCount();
        
        this.#log(`Tab marked as unread: ${tab.label} (reason: ${reason})`);
        
        // Dispatch custom event
        this.#dispatchTabEvent("TabMarkedUnread", tab, { reason });
      } catch (error) {
        this.#logError("Failed to mark tab as unread", error);
      }
    }

    #markTabAsRead(tab) {
      if (!tab || !this.#isTabUnread(tab)) return;
      
      try {
        const { unread, timestamp } = this.config.attributes;
        
        tab.removeAttribute(unread);
        tab.removeAttribute(timestamp);
        tab.classList.remove(this.#animationClass);
        
        this.#unreadCount = Math.max(0, this.#unreadCount - 1);
        this.#updateUnreadCount();
        
        this.#log(`Tab marked as read: ${tab.label}`);
        
        // Dispatch custom event
        this.#dispatchTabEvent("TabMarkedRead", tab);
      } catch (error) {
        this.#logError("Failed to mark tab as read", error);
      }
    }

    #shouldMarkAsUnread(tab) {
      if (!tab) return false;
      
      // Check feature flags
      if (this.config.features.ignorePinnedTabs && tab.pinned) {
        return false;
      }
      
      if (this.config.features.ignoreBlankTabs) {
        const browser = gBrowser.getBrowserForTab(tab);
        if (browser?.currentURI?.spec === "about:blank" || 
            browser?.currentURI?.spec === "about:newtab") {
          return false;
        }
      }
      
      return true;
    }

    #isTabUnread(tab) {
      return tab?.hasAttribute(this.config.attributes.unread);
    }

    #updateUnreadCount() {
      if (!this.config.features.showUnreadCount) return;
      
      try {
        // Recalculate to ensure accuracy
        this.#unreadCount = Array.from(gBrowser.tabs).filter(tab => 
          this.#isTabUnread(tab)
        ).length;
        
        // Update window title or other UI elements
        this.#dispatchTabEvent("UnreadCountChanged", null, { 
          count: this.#unreadCount 
        });
        
        this.#log(`Unread count: ${this.#unreadCount}`);
      } catch (error) {
        this.#logError("Failed to update unread count", error);
      }
    }

    #dispatchTabEvent(eventName, tab, detail = {}) {
      try {
        const event = new CustomEvent(eventName, {
          bubbles: true,
          detail: { tab, ...detail },
        });
        
        (tab || gBrowser.tabContainer).dispatchEvent(event);
      } catch (error) {
        this.#logError(`Failed to dispatch ${eventName}`, error);
      }
    }

    #log(...args) {
      if (this.config.debug) {
        console.log("[UnreadTabs]", ...args);
      }
    }

    #logError(...args) {
      console.error("[UnreadTabs]", ...args);
    }

    // Public API
    markAllAsRead() {
      try {
        for (const tab of gBrowser.tabs) {
          this.#markTabAsRead(tab);
        }
        this.#log("All tabs marked as read");
      } catch (error) {
        this.#logError("Failed to mark all tabs as read", error);
      }
    }

    markAllAsUnread(exceptSelected = true) {
      try {
        for (const tab of gBrowser.tabs) {
          if (exceptSelected && tab.selected) continue;
          if (this.#shouldMarkAsUnread(tab)) {
            this.#markTabAsUnread(tab, "manual");
          }
        }
        this.#log("Tabs marked as unread");
      } catch (error) {
        this.#logError("Failed to mark tabs as unread", error);
      }
    }

    getUnreadTabs() {
      try {
        return Array.from(gBrowser.tabs).filter(tab => this.#isTabUnread(tab));
      } catch (error) {
        this.#logError("Failed to get unread tabs", error);
        return [];
      }
    }

    getUnreadCount() {
      return this.#unreadCount;
    }

    updateConfig(newConfig) {
      const oldConfig = { ...this.config };
      this.config = { ...this.config, ...newConfig };
      
      // Regenerate styles if needed
      if (oldConfig.activeStyle !== this.config.activeStyle ||
          oldConfig.customCSS !== this.config.customCSS) {
        this.#styleElement.textContent = this.#generateCSS();
      }
      
      // Re-setup listeners if features changed
      if (JSON.stringify(oldConfig.features) !== JSON.stringify(this.config.features)) {
        this.destroy();
        this.#init();
      }
    }

    destroy() {
      try {
        // Remove event listeners
        this.#listeners.forEach((handler, event) => {
          if (event === "navigation") return;
          gBrowser.tabContainer.removeEventListener(event, handler);
        });
        
        // Clean up navigation listeners
        for (const tab of gBrowser.tabs) {
          this.#detachNavigationListener(tab);
        }
        
        // Disconnect mutation observer
        this.#mutationObserver?.disconnect();
        
        // Remove styles
        this.#styleElement?.remove();
        
        // Clean up attributes
        for (const tab of gBrowser.tabs) {
          Object.values(this.config.attributes).forEach(attr => {
            tab.removeAttribute(attr);
          });
          tab.classList.remove(this.#animationClass);
        }
        
        this.#listeners.clear();
        this.#initialized = false;
        
        this.#log("Cleanup complete");
      } catch (error) {
        this.#logError("Cleanup failed", error);
      }
    }
  }

  // Initialize
  const init = () => {
    try {
      if (!window.UnreadTabsManager) {
        window.UnreadTabsManager = new UnreadTabsManager();
        
        // Public API
        window.UnreadTabs = {
          markAllAsRead: () => window.UnreadTabsManager.markAllAsRead(),
          markAllAsUnread: (exceptSelected) => 
            window.UnreadTabsManager.markAllAsUnread(exceptSelected),
          getUnreadTabs: () => window.UnreadTabsManager.getUnreadTabs(),
          getUnreadCount: () => window.UnreadTabsManager.getUnreadCount(),
          updateConfig: (config) => window.UnreadTabsManager.updateConfig(config),
        };
      }
    } catch (error) {
      console.error("[UnreadTabs] Failed to initialize:", error);
    }
  };

  // Check if browser is ready
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
