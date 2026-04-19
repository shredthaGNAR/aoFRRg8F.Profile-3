// ==UserScript==
// @name            Context Menu Mods
// @version         1.1.3
// @author          aminomancer
// @homepageURL     https://github.com/aminomancer/uc.css.js
// @description     Add some new items to the main content area context menu.
// @license         Creative Commons Attribution-NonCommercial-ShareAlike 4.0
// @include         main
// @include         chrome://browser/content/webext-panels.xhtml
// ==/UserScript==

(function () {
  const lazy = {};
  ChromeUtils.defineESModuleGetters(lazy, {
    BrowserUtils: "resource://gre/modules/BrowserUtils.sys.mjs",
    PrivateBrowsingUtils: "resource://gre/modules/PrivateBrowsingUtils.sys.mjs",
    SearchUIUtils: "resource:///modules/SearchUIUtils.sys.mjs", // Updated path
  });

  class ContextMenuMods {
    config = {
      "Replace search menuitem with submenu": true,
      l10n: {
        searchMenu: {
          menuLabel: `Search for “%S”`,
          menuAccesskey: "S",
        },
        searchMenuPrivate: {
          menuLabel: "Search in a Private Window",
          menuAccesskey: "h",
        },
      },
    };

    _initialized = false;
    engines = [];

    constructor() {
      this._searchMenuitem();
    }

    maybeInit() {
      if (!this._initialized && typeof nsContextMenu !== "undefined") {
        this._initialized = true;
        this._registerSheet();
        this._searchMenuItemInit();
      }
    }

    _registerSheet() {
      let sheet = /* css */ `
      .menuitem-iconic.searchmenuitem {
        list-style-image: var(--engine-icon, url("chrome://global/skin/icons/search-glass.svg"));
        -moz-context-properties: fill;
        fill: currentColor;
      }
      .menuitem-iconic.searchmenuitem > .menu-iconic-left > .menu-iconic-icon {
        width: 16px;
        height: 16px;
      }
    `;
      let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
      // Use modern Services.io for URI creation
      let uri = Services.io.newURI(`data:text/css;charset=UTF=8,${encodeURIComponent(sheet)}`);
      if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) {
        sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
      }
    }

    _searchMenuitem() {
      this.contextMenu = document.getElementById("contentAreaContextMenu");
      if (!this.contextMenu) return;

      // Wrap addEventListener to initialize on first interaction
      const originalAdd = this.contextMenu.addEventListener.bind(this.contextMenu);
      this.contextMenu.addEventListener = (type, callback, options) => {
        if (type === "popupshowing") {
          const wrappedCallback = (event) => {
            this.maybeInit();
            callback(event);
          };
          return originalAdd(type, wrappedCallback, options);
        }
        return originalAdd(type, callback, options);
      };

      const _updateEngines = async () => {
        await Services.search.promiseInitialized;
        let engineObjects = await Services.search.getVisibleEngines();
        this.engines = await Promise.all(
          engineObjects
            .filter(e => !e.hideOneOffButton)
            .map(async (engine) => ({
              id: engine.id,
              name: engine.name,
              iconURL: await engine.getIconURL(16),
            }))
        );
      };

      // Listen for search engine changes
      const observer = {
        observe: (subject, topic) => {
          if (topic === "browser-search-engine-modified") _updateEngines();
        }
      };
      Services.obs.addObserver(observer, "browser-search-engine-modified");
      _updateEngines();

      // Replace existing search items with our custom menu versions
      let originalMenu = document.getElementById("context-searchselect");
      let originalMenuPrivate = document.getElementById("context-searchselect-private");

      if (originalMenu) {
        let newMenu = document.createXULElement("menu");
        newMenu.id = "context-searchselect";
        newMenu.appendChild(document.createXULElement("menupopup"));
        
        let newMenuPrivate = document.createXULElement("menu");
        newMenuPrivate.id = "context-searchselect-private";
        newMenuPrivate.appendChild(document.createXULElement("menupopup"));

        originalMenu.replaceWith(newMenu);
        if (originalMenuPrivate) originalMenuPrivate.replaceWith(newMenuPrivate);

        [newMenu, newMenuPrivate].forEach(m => {
          m.addEventListener("popupshowing", e => gContextMenu.createSearchMenu(e));
          m.addEventListener("command", e => {
            if (e.target.classList.contains("searchmenuitem")) {
              this.search(m.searchTerms, m === newMenuPrivate, m.principal, m.csp, e);
            }
          });
        });
      }
    }

    _searchMenuItemInit() {
      const self = this;
      
      // Inject createSearchMenu into nsContextMenu
      nsContextMenu.prototype.createSearchMenu = function (event) {
        let popup = event.target;
        while (popup.firstChild) popup.firstChild.remove();

        for (let engine of self.engines) {
          let item = document.createXULElement("menuitem");
          item.classList.add("menuitem-iconic", "searchmenuitem");
          item.setAttribute("engine-id", engine.id);
          item.setAttribute("label", engine.name);
          if (engine.iconURL) item.setAttribute("image", engine.iconURL);
          popup.appendChild(item);
        }
      };

      // Patch the formatting logic
      const originalFormat = nsContextMenu.prototype.showAndFormatSearchContextItem;
      nsContextMenu.prototype.showAndFormatSearchContextItem = function () {
        originalFormat.apply(this, arguments);

        let menuItem = document.getElementById("context-searchselect");
        let menuItemPrivate = document.getElementById("context-searchselect-private");
        
        if (!menuItem || menuItem.hidden) return;

        let selectedText = this.isTextSelected ? this.selectedText : this.linkTextStr;
        menuItem.searchTerms = menuItemPrivate.searchTerms = selectedText;
        menuItem.principal = menuItemPrivate.principal = this.principal;
        menuItem.csp = menuItemPrivate.csp = this.csp;

        // Truncate label
        let displayTerms = selectedText.length > 15 ? selectedText.substring(0, 15) + "…" : selectedText;
        menuItem.label = self.config.l10n.searchMenu.menuLabel.replace("%S", displayTerms);
      };
    }

    search(searchText, usePrivate, principal, csp, event) {
      let where = lazy.BrowserUtils.whereToOpenLink(event, false, false);
      if (where === "current") where = "tab";
      
      lazy.SearchUIUtils.handleSearchCommand(window, searchText, {
        engine: Services.search.getEngineById(event.target.getAttribute("engine-id")),
        where,
        selection: true,
        triggeringPrincipal: principal,
        csp,
        isPrivate: usePrivate
      });
    }
  }

  // Initialize
  if (gBrowserInit.delayedStartupFinished) {
    window.ucContextMenuMods = new ContextMenuMods();
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        window.ucContextMenuMods = new ContextMenuMods();
      }
    };
    Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
  }
})();