// ==UserScript==
// @name           replaceAndGoSearch.uc.js
// @namespace      http://space.geocities.yahoo.co.jp/gl/alice0775
// @description    Replace selection with clipboard text and go/search
// @include        main
// @async          true
// @author         Alice0775 (Updated for 2026 compatibility)
// @compatibility  Firefox 149+
// @version        2026.02.04
// ==/UserScript==

var replaceAndGoSearch = {
  init: async function() {
    // 1. Updated SearchService module path for modern Firefox
    const lazy = {};
    ChromeUtils.defineESModuleGetters(lazy, {
      SearchService: "resource:///modules/SearchService.sys.mjs",
    });

    // Ensure Search Service is ready
    if (!lazy.SearchService.isInitialized) {
      await lazy.SearchService.init();
    }

    this.urlBarMenu();
    this.searchBarMenu();

    window.addEventListener('aftercustomization', this, false);
    Services.prefs.addObserver('browser.search.widget.inNavBar', this, false);
    window.addEventListener('unload', this, false);
  },

  uninit: function() {
    window.removeEventListener('aftercustomization', this, false);
    Services.prefs.removeObserver('browser.search.widget.inNavBar', this);
    window.removeEventListener('unload', this, false);
  },

  urlBarMenu: function() {
    if (!window.gURLBar) return;

    // Use a more robust way to find the context menu
    let contextMenu = document.getElementById("textbox-contextmenu") || 
                      gURLBar.querySelector("moz-input-box")?.menupopup;
    
    if (!contextMenu) return;

    let insertLocation = contextMenu.querySelector('[cmd="cmd_paste"]');
    if (!insertLocation) return;

    if (contextMenu.querySelector("#replace-and-go")) return;

    let replaceAndGo = document.createXULElement("menuitem");
    replaceAndGo.id = "replace-and-go";
    replaceAndGo.setAttribute("label", "Replace and Go");
    replaceAndGo.setAttribute("accesskey", "r");
    
    replaceAndGo.addEventListener("command", (event) => {
      // Modern URLBar handling
      gURLBar._suppressStartQuery = true;
      window.goDoCommand("cmd_paste");
      
      // Force the URL bar to treat the new value as a confirmed navigation
      if (gURLBar.handleCommand) {
        gURLBar.handleCommand(event);
      }
      gURLBar._suppressStartQuery = false;
    });

    insertLocation.insertAdjacentElement("afterend", replaceAndGo);

    contextMenu.addEventListener("popupshowing", () => {
      if (gURLBar.view && gURLBar.view.isOpen) {
        gURLBar.view.close();
      }

      let controller = document.commandDispatcher.getControllerForCommand("cmd_paste");
      let enabled = controller && controller.isCommandEnabled("cmd_paste");
      replaceAndGo.toggleAttribute("disabled", !enabled);
    });
  },

  searchBarMenu: function() {
    let searchBar = document.getElementById('searchbar') || document.getElementById('searchbar-new');
    if (!searchBar) return;

    let contextMenu = searchBar.querySelector(".textbox-contextmenu");
    if (!contextMenu || contextMenu.querySelector("#replace-and-search")) return;

    let replaceAndSearch = document.createXULElement("menuitem");
    replaceAndSearch.id = "replace-and-search";
    replaceAndSearch.setAttribute("label", "Replace & Search");
    replaceAndSearch.setAttribute("accesskey", "r");

    replaceAndSearch.addEventListener("command", (event) => {
      window.goDoCommand("cmd_paste");
      if (searchBar.handleSearchCommand) {
        searchBar.handleSearchCommand(event);
      } else if (searchBar.handleCommand) {
        searchBar.handleCommand(event);
      }
    });

    contextMenu.addEventListener("popupshowing", () => {
      let insert = contextMenu.querySelector(".searchbar-paste-and-search") ||
                   contextMenu.querySelector("#paste-and-go") ||
                   contextMenu.querySelector('[cmd="cmd_paste"]');
      
      if (insert && !contextMenu.querySelector("#replace-and-search")) {
        insert.insertAdjacentElement("afterend", replaceAndSearch);
      }

      let controller = document.commandDispatcher.getControllerForCommand("cmd_paste");
      let enabled = controller && controller.isCommandEnabled("cmd_paste");
      replaceAndSearch.toggleAttribute("disabled", !enabled);
    });
  },

  observe(aSubject, aTopic, aPrefstring) {
    if (aTopic == 'nsPref:changed') {
      setTimeout(() => { this.searchBarMenu(); }, 100);
    }
  },

  handleEvent: function(event) {
    switch (event.type) {
      case "aftercustomization":
        this.urlBarMenu();
        this.searchBarMenu();
        break;
      case 'unload':
        this.uninit();
        break;
    }
  }
};

// Initialization Block
if (gBrowserInit.delayedStartupFinished) {
  replaceAndGoSearch.init();
} else {
  let delayedStartupFinished = (subject, topic) => {
    if (topic == "browser-delayed-startup-finished" && subject == window) {
      Services.obs.removeObserver(delayedStartupFinished, topic);
      replaceAndGoSearch.init();
    }
  };
  Services.obs.addObserver(delayedStartupFinished, "browser-delayed-startup-finished");
}