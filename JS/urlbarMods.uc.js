// ==UserScript==
// @name            Urlbar Mods
// @version         2.0.0
// @author          aminomancer (Enhanced)
// @description     Enhanced URL bar modifications with improved compatibility and features for Firefox Nightly
// @license         Creative Commons Attribution-NonCommercial-ShareAlike 4.0
// ==/UserScript==

"use strict";

(() => {
  // Configuration with safe preference reading
  const CONFIG = {
    features: {
      restoreOneOffsContextMenu: false,
      styleIdentityIconDragBox: true,
      addNewTooltipsAndClassesForIdentityIcon: true,
      showDetailedIconsInUrlbarResults: true,
      disableUrlbarInterventionTips: true,
      sortUrlbarResultsConsistently: true,
      underlineWhitespaceResults: true,
      enhancedDragAndDrop: true,
      improvedAutocomplete: true,
    },
    
    // Safely read preferences with fallbacks
    readPrefs() {
      const prefs = {};
      for (const [key, defaultValue] of Object.entries(this.features)) {
        const prefName = `urlbarMods.${key}`;
        try {
          prefs[key] = Services.prefs.getBoolPref(prefName, defaultValue);
        } catch (e) {
          prefs[key] = defaultValue;
        }
      }
      return prefs;
    },
    
    debug: false,
  };

  class UrlbarMods {
    #initialized = false;
    #listeners = new Map();
    #observers = new Map();
    #styleSheets = new Set();
    #originalFunctions = new Map();
    #config = {};

    constructor() {
      this.#init();
    }

    async #init() {
      if (this.#initialized) {
        this.#log("Already initialized");
        return;
      }

      try {
        // Load configuration
        this.#config = CONFIG.readPrefs();
        
        // Wait for required components
        await this.#waitForComponents();
        
        // Apply modifications based on config
        await this.#applyModifications();
        
        this.#initialized = true;
        this.#log("Initialization complete");
      } catch (error) {
        this.#logError("Initialization failed", error);
      }
    }

    async #waitForComponents() {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout waiting for browser components"));
        }, 10000);

        const checkComponents = () => {
          if (window.gURLBar?.view?.oneOffSearchButtons && 
              window.gIdentityHandler && 
              window.gBrowser) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkComponents, 100);
          }
        };
        
        checkComponents();
      });
    }

    async #applyModifications() {
      const modifications = [
        ["addNewTooltipsAndClassesForIdentityIcon", () => this.#extendIdentityIcons()],
        ["styleIdentityIconDragBox", () => this.#styleIdentityIconDragBox()],
        ["restoreOneOffsContextMenu", () => this.#restoreOneOffsContextMenu()],
        ["showDetailedIconsInUrlbarResults", () => this.#urlbarResultsDetailedIcons()],
        ["disableUrlbarInterventionTips", () => this.#disableUrlbarInterventions()],
        ["sortUrlbarResultsConsistently", () => this.#urlbarResultsSorting()],
        ["underlineWhitespaceResults", () => this.#underlineSpaceResults()],
        ["enhancedDragAndDrop", () => this.#enhancedDragAndDrop()],
        ["improvedAutocomplete", () => this.#improvedAutocomplete()],
      ];

      for (const [feature, applyFn] of modifications) {
        if (this.#config[feature]) {
          try {
            await applyFn();
            this.#log(`Applied: ${feature}`);
          } catch (error) {
            this.#logError(`Failed to apply ${feature}`, error);
          }
        }
      }

      // Always apply these
      await this.#oneOffEngineAttributes();
    }

    async #extendIdentityIcons() {
      try {
        // Load localization
        MozXULElement.insertFTLIfNeeded("browser/browser.ftl");
        
        const stringIds = [
          "identity-connection-internal",
          "identity-connection-file",
          "identity-active-blocked",
          "identity-passive-loaded",
          "identity-active-loaded",
          "identity-weak-encryption",
          "identity-connection-failure",
          "identity-https-only-info-no-upgrade",
        ];
        
        const strings = await document.l10n.formatValues(stringIds);
        
        // Store localized strings
        gIdentityHandler._fluentStrings = {
          chromeUI: strings[0]?.replace(/(^\p{Sentence_Terminal}+)|(\p{Sentence_Terminal}+$)/gu, "") || "Chrome UI",
          localResource: strings[1]?.replace(/(^\p{Sentence_Terminal}+)|(\p{Sentence_Terminal}+$)/gu, "") || "Local Resource",
          mixedActiveBlocked: strings[2]?.replace(/(^\p{Sentence_Terminal}+)|(\p{Sentence_Terminal}+$)/gu, "") || "Mixed Content Blocked",
          mixedDisplayContent: strings[3]?.replace(/(^\p{Sentence_Terminal}+)|(\p{Sentence_Terminal}+$)/gu, "") || "Mixed Display Content",
          mixedActiveContent: strings[4]?.replace(/(^\p{Sentence_Terminal}+)|(\p{Sentence_Terminal}+$)/gu, "") || "Mixed Active Content",
          weakCipher: strings[5]?.replace(/(^\p{Sentence_Terminal}+)|(\p{Sentence_Terminal}+$)/gu, "") || "Weak Encryption",
          aboutNetErrorPage: strings[6]?.replace(/(^\p{Sentence_Terminal}+)|(\p{Sentence_Terminal}+$)/gu, "") || "Connection Error",
          httpsOnlyErrorPage: strings[7]?.replace(/(^\p{Sentence_Terminal}+)|(\p{Sentence_Terminal}+$)/gu, "") || "HTTPS-Only Error",
        };

        // Store original function
        if (!this.#originalFunctions.has("_refreshIdentityIcons")) {
          this.#originalFunctions.set("_refreshIdentityIcons", 
            gIdentityHandler._refreshIdentityIcons.bind(gIdentityHandler));
        }

        // Override refresh function
        gIdentityHandler._refreshIdentityIcons = function() {
          // Call original
          const origRefresh = gIdentityHandler._originalRefreshIdentityIcons || 
                            UrlbarMods.getInstance().#originalFunctions.get("_refreshIdentityIcons");
          if (origRefresh) origRefresh.call(this);

          // Add custom classes and tooltips
          if (!this._identityBox || !this._identityIcon) return;

          let tooltip = this._fluentStrings?.chromeUI || "Browser Chrome";
          let className = "unknownIdentity";

          if (this._isSecureInternalUI) {
            className = this._uri && isInitialPage(this._uri) ? "initialPage" : "chromeUI";
            tooltip = this._fluentStrings?.chromeUI || tooltip;
          } else if (this._isAboutNetErrorPage) {
            className = "aboutNetErrorPage";
            tooltip = this._fluentStrings?.aboutNetErrorPage || "Network Error";
          } else if (this._isAboutBlockedPage) {
            className = "aboutBlockedPage";
            tooltip = this._fluentStrings?.aboutBlockedPage || "Blocked Page";
          } else if (this._isAboutHttpsOnlyErrorPage) {
            className = "httpsOnlyErrorPage";
            tooltip = this._fluentStrings?.httpsOnlyErrorPage || "HTTPS-Only Error";
          }

          this._identityBox.className = className;
          this._identityIcon.setAttribute("tooltiptext", tooltip);
        };

        // Store reference for cleanup
        gIdentityHandler._originalRefreshIdentityIcons = 
          this.#originalFunctions.get("_refreshIdentityIcons");

        // Trigger refresh
        gIdentityHandler._refreshIdentityIcons();
      } catch (error) {
        this.#logError("Failed to extend identity icons", error);
      }
    }

    #styleIdentityIconDragBox() {
      try {
        // Helper function to convert CSS variable to hex
        const varToHex = (variable, fallback = "#000000") => {
          try {
            const temp = document.createElement("div");
            temp.style.color = variable;
            document.documentElement.appendChild(temp);
            const rgb = getComputedStyle(temp).color;
            temp.remove();
            
            const match = rgb.match(/\d+/g);
            if (!match || match.length < 3) return fallback;
            
            return `#${match.slice(0, 3)
              .map(x => parseInt(x).toString(16).padStart(2, "0"))
              .join("")}`;
          } catch (e) {
            return fallback;
          }
        };

        // Store original onDragStart
        if (!this.#originalFunctions.has("onDragStart")) {
          this.#originalFunctions.set("onDragStart", 
            gIdentityHandler.onDragStart?.bind(gIdentityHandler));
        }

        // Enhanced drag handler
        gIdentityHandler.onDragStart = function(event) {
          if (gURLBar.getAttribute("pageproxystate") !== "valid") {
            return;
          }

          try {
            const scale = window.devicePixelRatio || 1;
            const canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
            const ctx = canvas.getContext("2d");
            
            if (!ctx) {
              throw new Error("Failed to get canvas context");
            }

            // Get current URI
            const uri = gBrowser.currentURI;
            const value = uri?.displaySpec || uri?.spec || "about:blank";
            
            // Get colors with fallbacks
            const backgroundColor = varToHex(
              "var(--tooltip-bgcolor, var(--arrowpanel-background))", 
              "#2b2a33"
            );
            const textColor = varToHex(
              "var(--tooltip-color, var(--arrowpanel-color))", 
              "#fbfbfe"
            );

            // Set canvas dimensions
            const maxWidth = 400;
            const height = 32;
            canvas.width = maxWidth * scale;
            canvas.height = height * scale;
            
            // Scale context for high DPI
            ctx.scale(scale, scale);

            // Draw rounded rectangle background
            const radius = 5;
            ctx.fillStyle = backgroundColor;
            ctx.beginPath();
            ctx.roundRect(0, 0, maxWidth, height, radius);
            ctx.fill();

            // Draw text
            ctx.fillStyle = textColor;
            ctx.font = "12px system-ui, -apple-system, sans-serif";
            ctx.textBaseline = "middle";
            
            // Truncate text if too long
            const padding = 10;
            const maxTextWidth = maxWidth - (padding * 2);
            let displayText = value;
            
            if (ctx.measureText(displayText).width > maxTextWidth) {
              const ellipsis = "…";
              while (ctx.measureText(displayText + ellipsis).width > maxTextWidth && 
                     displayText.length > 0) {
                displayText = displayText.slice(0, -1);
              }
              displayText += ellipsis;
            }
            
            ctx.fillText(displayText, padding, height / 2);

            // Set drag data
            const dt = event.dataTransfer;
            dt.effectAllowed = "all";
            dt.setData("text/x-moz-url", `${value}\n${gBrowser.contentTitle || value}`);
            dt.setData("text/uri-list", value);
            dt.setData("text/plain", value);
            dt.setDragImage(canvas, 16, 16);
            
            // Prevent default to allow custom drag
            event.stopPropagation();
          } catch (error) {
            console.error("Drag start error:", error);
            // Fallback to original behavior
            const originalHandler = UrlbarMods.getInstance().#originalFunctions.get("onDragStart");
            if (originalHandler) {
              originalHandler.call(this, event);
            }
          }
        };
      } catch (error) {
        this.#logError("Failed to style identity icon drag box", error);
      }
    }

    #restoreOneOffsContextMenu() {
      try {
        const oneOffs = gURLBar.view?.oneOffSearchButtons;
        if (!oneOffs) {
          throw new Error("One-off search buttons not found");
        }

        const proto = Object.getPrototypeOf(oneOffs);
        if (!proto) return;

        // Store original handler if exists
        if (!this.#originalFunctions.has("_on_contextmenu")) {
          this.#originalFunctions.set("_on_contextmenu", proto._on_contextmenu);
        }

        // Override context menu handler to allow native menu
        proto._on_contextmenu = function(event) {
          // Allow default context menu
          event.stopPropagation();
          
          // Custom context menu logic can be added here
          const button = event.target.closest(".searchbar-engine-one-off-item");
          if (button?.engine) {
            // Could add custom menu items here
            this.#log(`Context menu on engine: ${button.engine.name}`);
          }
        };
      } catch (error) {
        this.#logError("Failed to restore one-offs context menu", error);
      }
    }

    async #urlbarResultsDetailedIcons() {
      try {
        // Import required modules
        const { UrlbarResult } = ChromeUtils.importESModule(
          "resource:///modules/UrlbarResult.sys.mjs"
        );
        const { UrlbarUtils } = ChromeUtils.importESModule(
          "resource:///modules/UrlbarUtils.sys.mjs"
        );

        const view = gURLBar.view;
        if (!view) {
          throw new Error("URLBar view not found");
        }

        // Store original function
        if (!this.#originalFunctions.has("_updateRow")) {
          this.#originalFunctions.set("_updateRow", view._updateRow.bind(view));
        }

        // Override _updateRow to add custom attributes
        view._updateRow = function(result, item) {
          // Call original
          const origUpdateRow = UrlbarMods.getInstance().#originalFunctions.get("_updateRow");
          if (origUpdateRow) {
            origUpdateRow.call(this, result, item);
          }

          // Add custom attributes
          if (result?.payload) {
            if (result.payload.clientType) {
              item.setAttribute("clientType", result.payload.clientType);
            }
            if (result.payload.engine) {
              item.setAttribute("engine", result.payload.engine);
            }
            if (result.payload.source) {
              item.setAttribute("source", result.payload.source);
            }
          }
        };

        // Add CSS for device and source icons
        await this.#addStyleSheet("urlbar-detailed-icons", `
          .urlbarView-row[clientType="phone"] .urlbarView-favicon {
            --device-icon: url("chrome://browser/skin/device-phone.svg");
          }
          .urlbarView-row[clientType="tablet"] .urlbarView-favicon {
            --device-icon: url("chrome://browser/skin/device-tablet.svg");
          }
          .urlbarView-row[clientType="desktop"] .urlbarView-favicon {
            --device-icon: url("chrome://browser/skin/device-desktop.svg");
          }
          .urlbarView-row[clientType="tv"] .urlbarView-favicon {
            --device-icon: url("chrome://browser/skin/device-tv.svg");
          }
          .urlbarView-row[clientType="phone"]::after,
          .urlbarView-row[clientType="tablet"]::after,
          .urlbarView-row[clientType="desktop"]::after,
          .urlbarView-row[clientType="tv"]::after {
            content: "";
            width: 16px;
            height: 16px;
            margin-inline-start: 4px;
            background-image: var(--device-icon);
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.6;
          }
          .urlbarView-row[source="history"] {
            --source-icon: url("chrome://browser/skin/history.svg");
          }
          .urlbarView-row[source="bookmarks"] {
            --source-icon: url("chrome://browser/skin/bookmark.svg");
          }
        `);
      } catch (error) {
        this.#logError("Failed to add detailed icons to urlbar results", error);
      }
    }

    #disableUrlbarInterventions() {
      try {
        // Unregister the interventions provider
        const manager = gURLBar.controller?.manager;
        if (manager?.unregisterProviderByName) {
          manager.unregisterProviderByName("UrlbarProviderInterventions");
          this.#log("Disabled URL bar interventions");
        }

        // Also disable via preferences
        Services.prefs.setBoolPref("browser.urlbar.suggest.topsites", false);
        Services.prefs.setBoolPref("browser.urlbar.interventions.enabled", false);
        Services.prefs.setBoolPref("browser.urlbar.interventions.tips", false);
      } catch (error) {
        this.#logError("Failed to disable urlbar interventions", error);
      }
    }

    async #urlbarResultsSorting() {
      try {
        const { UrlbarPrefs } = ChromeUtils.importESModule(
          "resource:///modules/UrlbarPrefs.sys.mjs"
        );

        if (!UrlbarPrefs.makeResultGroups) {
          throw new Error("UrlbarPrefs.makeResultGroups not found");
        }

        // Store original function
        if (!this.#originalFunctions.has("makeResultGroups")) {
          this.#originalFunctions.set("makeResultGroups", 
            UrlbarPrefs.makeResultGroups.bind(UrlbarPrefs));
        }

        // Override makeResultGroups for consistent sorting
        UrlbarPrefs.makeResultGroups = function(options = {}) {
          // Force consistent sorting preferences
          const modifiedOptions = {
            ...options,
            showSearchSuggestionsFirst: Services.prefs.getBoolPref(
              "browser.urlbar.showSearchSuggestionsFirst", 
              true
            ),
          };

          // Call original with modified options
          const origMakeResultGroups = UrlbarMods.getInstance().#originalFunctions.get("makeResultGroups");
          return origMakeResultGroups ? 
            origMakeResultGroups.call(this, modifiedOptions) : 
            [];
        };
      } catch (error) {
        this.#logError("Failed to setup urlbar results sorting", error);
      }
    }

    #underlineSpaceResults() {
      try {
        const view = gURLBar.view;
        if (!view) {
          throw new Error("URLBar view not found");
        }

        // Store original function
        if (!this.#originalFunctions.has("_addTextContentWithHighlights")) {
          this.#originalFunctions.set("_addTextContentWithHighlights", 
            view._addTextContentWithHighlights?.bind(view));
        }

        // Override text content function to handle whitespace
        view._addTextContentWithHighlights = function(node, text, highlights) {
          // Check if text is mostly whitespace
          if (/^\s{2,}$/.test(text)) {
            // Replace spaces with non-breaking spaces for visibility
            text = text.replace(/\s/g, "\u00A0");
            node.setAttribute("all-whitespace", "true");
          }

          // Call original
          const origAddText = UrlbarMods.getInstance().#originalFunctions.get("_addTextContentWithHighlights");
          if (origAddText) {
            origAddText.call(this, node, text, highlights);
          } else {
            // Fallback
            node.textContent = text;
          }
        };

        // Add CSS for whitespace results
        this.#addStyleSheet("urlbar-whitespace", `
          [all-whitespace="true"] {
            text-decoration: underline;
            text-decoration-style: dotted;
            text-decoration-color: var(--panel-disabled-color);
            opacity: 0.6;
          }
        `);
      } catch (error) {
        this.#logError("Failed to setup whitespace results underlining", error);
      }
    }

    #enhancedDragAndDrop() {
      try {
        // Add visual feedback during drag operations
        const urlbar = document.getElementById("urlbar");
        if (!urlbar) return;

        urlbar.addEventListener("dragenter", (e) => {
          if (e.dataTransfer.types.includes("text/plain") || 
              e.dataTransfer.types.includes("text/uri-list")) {
            urlbar.setAttribute("dragover", "true");
          }
        });

        urlbar.addEventListener("dragleave", () => {
          urlbar.removeAttribute("dragover");
        });

        urlbar.addEventListener("drop", () => {
          urlbar.removeAttribute("dragover");
        });

        // Add CSS for drag feedback
        this.#addStyleSheet("urlbar-drag", `
          #urlbar[dragover="true"] {
            box-shadow: 0 0 0 2px var(--focus-outline-color, Highlight) !important;
          }
        `);
      } catch (error) {
        this.#logError("Failed to setup enhanced drag and drop", error);
      }
    }

    async #improvedAutocomplete() {
      try {
        // Improve autocomplete behavior
        Services.prefs.setIntPref("browser.urlbar.delay", 50);
        Services.prefs.setIntPref("browser.urlbar.maxRichResults", 12);
        Services.prefs.setBoolPref("browser.urlbar.autoFill", true);
        Services.prefs.setBoolPref("browser.urlbar.suggest.history", true);
        Services.prefs.setBoolPref("browser.urlbar.suggest.bookmark", true);
      } catch (error) {
        this.#logError("Failed to setup improved autocomplete", error);
      }
    }

    async #oneOffEngineAttributes() {
      try {
        const { UrlbarSearchOneOffs } = ChromeUtils.importESModule(
          "resource:///modules/UrlbarSearchOneOffs.sys.mjs"
        );

        if (!UrlbarSearchOneOffs.prototype.setTooltipForEngineButton) {
          // Method doesn't exist, create it
          UrlbarSearchOneOffs.prototype.setTooltipForEngineButton = function(button) {
            if (button?.engine) {
              button.setAttribute("engine", button.engine.name);
              button.setAttribute("tooltiptext", button.engine.name);
              
              // Add icon if available
              if (button.engine.iconURI) {
                button.style.setProperty("--engine-icon", `url(${button.engine.iconURI.spec})`);
              }
            }
          };
        }

        // Apply to existing buttons
        const oneOffs = gURLBar.view?.oneOffSearchButtons;
        if (oneOffs?.buttons) {
          for (const button of oneOffs.buttons) {
            oneOffs.setTooltipForEngineButton(button);
          }
        }
      } catch (error) {
        this.#logError("Failed to setup one-off engine attributes", error);
      }
    }

    async #addStyleSheet(id, css) {
      try {
        // Check if stylesheet already exists
        if (this.#styleSheets.has(id)) {
          return;
        }

        const sss = Cc["@mozilla.org/content/style-sheet-service;1"]
          .getService(Ci.nsIStyleSheetService);
        
        const uri = Services.io.newURI(
          `data:text/css;charset=UTF-8,${encodeURIComponent(css)}`
        );
        
        if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) {
          sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
          this.#styleSheets.add(id);
        }
      } catch (error) {
        this.#logError(`Failed to add stylesheet ${id}`, error);
      }
    }

    #log(...args) {
      if (CONFIG.debug) {
        console.log("[UrlbarMods]", ...args);
      }
    }

    #logError(...args) {
      console.error("[UrlbarMods]", ...args);
    }

    // Singleton pattern
    static #instance = null;
    
    static getInstance() {
      if (!UrlbarMods.#instance) {
        UrlbarMods.#instance = new UrlbarMods();
      }
      return UrlbarMods.#instance;
    }

    // Public API
    updateConfig(newConfig) {
      this.#config = { ...this.#config, ...newConfig };
      // Re-apply modifications
      this.destroy();
      this.#init();
    }

    destroy() {
      try {
        // Restore original functions
        this.#originalFunctions.forEach((original, name) => {
          const [obj, method] = this.#getFunctionTarget(name);
          if (obj && method) {
            obj[method] = original;
          }
        });

        // Remove stylesheets
        const sss = Cc["@mozilla.org/content/style-sheet-service;1"]
          .getService(Ci.nsIStyleSheetService);
        
        // Note: Can't easily unregister data: URIs, would need to track them

        // Clear collections
        this.#listeners.clear();
        this.#observers.clear();
        this.#originalFunctions.clear();
        this.#styleSheets.clear();
        
        this.#initialized = false;
        this.#log("Cleanup complete");
      } catch (error) {
        this.#logError("Cleanup failed", error);
      }
    }

    #getFunctionTarget(name) {
      // Map function names to their objects
      const mapping = {
        "_refreshIdentityIcons": [gIdentityHandler, "_refreshIdentityIcons"],
        "onDragStart": [gIdentityHandler, "onDragStart"],
        "_on_contextmenu": [Object.getPrototypeOf(gURLBar.view?.oneOffSearchButtons), "_on_contextmenu"],
        "_updateRow": [gURLBar.view, "_updateRow"],
        "makeResultGroups": [ChromeUtils.importESModule("resource:///modules/UrlbarPrefs.sys.mjs").UrlbarPrefs, "makeResultGroups"],
        "_addTextContentWithHighlights": [gURLBar.view, "_addTextContentWithHighlights"],
      };
      
      return mapping[name] || [null, null];
    }
  }

  // Initialize
  const init = () => {
    try {
      if (!window.UrlbarMods) {
        window.UrlbarMods = UrlbarMods.getInstance();
        
        // Public API
        window.UrlbarModsAPI = {
          updateConfig: (config) => window.UrlbarMods.updateConfig(config),
          destroy: () => window.UrlbarMods.destroy(),
          getInstance: () => window.UrlbarMods,
        };
      }
    } catch (error) {
      console.error("[UrlbarMods] Failed to initialize:", error);
    }
  };

  // Wait for browser to be ready
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
C00lbr0!C00lbr0!C00lbr0!C00lbr0!