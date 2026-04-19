// ==UserScript==
// @name            Urlbar Mods
// @version         1.8.3
// @author          aminomancer
// @description     Make some minor modifications to the urlbar. Refactored for modern Firefox.
// @license         Creative Commons Attribution-NonCommercial-ShareAlike 4.0
// ==/UserScript==

class UrlbarMods {
  static config = {
    "restore one-offs context menu": Services.prefs.getBoolPref("urlbarMods.restoreOneOffsContextMenu", false),
    "style identity icon drag box": Services.prefs.getBoolPref("urlbarMods.styleIdentityIconDragBox", true),
    "add new tooltips and classes for identity icon": Services.prefs.getBoolPref("urlbarMods.addNewTooltipsAndClassesForIdentityIcon", true),
    "show detailed icons in urlbar results": Services.prefs.getBoolPref("urlbarMods.showDetailedIconsInUrlbarResults", true),
    "disable urlbar intervention tips": Services.prefs.getBoolPref("urlbarMods.disableUrlbarInterventionTips", true),
    "sort urlbar results consistently": Services.prefs.getBoolPref("urlbarMods.sortUrlbarResultsConsistently", true),
    "underline whitespace results": Services.prefs.getBoolPref("urlbarMods.underlineWhitespaceResults", true),
  };

  constructor() {
    if (UrlbarMods.config["add new tooltips and classes for identity icon"]) this.extendIdentityIcons();
    if (UrlbarMods.config["style identity icon drag box"]) this.styleIdentityIconDragBox();
    if (UrlbarMods.config["restore one-offs context menu"]) this.restoreOneOffsContextMenu();
    if (UrlbarMods.config["show detailed icons in urlbar results"]) this.urlbarResultsDetailedIcons();
    if (UrlbarMods.config["disable urlbar intervention tips"]) this.disableUrlbarInterventions();
    if (UrlbarMods.config["sort urlbar results consistently"]) this.urlbarResultsSorting();
    if (UrlbarMods.config["underline whitespace results"]) this.underlineSpaceResults();
    this.oneOffEngineAttributes();
  }

  get urlbarOneOffs() {
    return gURLBar.view.oneOffSearchButtons;
  }

  async extendIdentityIcons() {
    MozXULElement.insertFTLIfNeeded("browser/browser.ftl");
    let strings = await document.l10n.formatValues([
      "identity-connection-internal", "identity-connection-file",
      "identity-active-blocked", "identity-passive-loaded",
      "identity-active-loaded", "identity-weak-encryption",
      "identity-connection-failure", "identity-https-only-info-no-upgrade",
    ]);

    gIdentityHandler._fluentStrings = Object.fromEntries(
      ["chromeUI", "localResource", "mixedActiveBlocked", "mixedDisplayContent", 
       "mixedActiveContent", "weakCipher", "aboutNetErrorPage", "httpsOnlyErrorPage"]
      .map((key, i) => [key, strings[i].replace(/(^\p{Sentence_Terminal}+)|(\p{Sentence_Terminal}+$)/gu, "")])
    );

    // Refresh classes and tooltips
    const origRefresh = gIdentityHandler._refreshIdentityIcons.bind(gIdentityHandler);
    gIdentityHandler._refreshIdentityIcons = function() {
      origRefresh();
      let tooltip = this._fluentStrings.chromeUI; // Default fallback
      if (this._isSecureInternalUI) {
        this._identityBox.className = isInitialPage(this._uri) ? "initialPage" : "chromeUI";
        this._identityIcon.setAttribute("tooltiptext", tooltip);
      }
      // Additional logic for about:neterror
      if (this._isAboutNetErrorPage) {
        this._identityBox.classList.add("aboutNetErrorPage");
        this._identityIcon.setAttribute("tooltiptext", this._fluentStrings.aboutNetErrorPage);
      }
    };
    gIdentityHandler._refreshIdentityIcons();
  }

  styleIdentityIconDragBox() {
    const varToHex = (variable) => {
      let temp = document.createElement("div");
      temp.style.color = variable;
      document.body.appendChild(temp);
      let rgb = getComputedStyle(temp).color;
      temp.remove();
      let match = rgb.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, "0"));
      return `#${match.slice(0, 3).join("")}`;
    };

    // Modern implementation of rounded rect on canvas
    const roundRect = (ctx, x, y, w, h, r, fill, stroke) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
    };

    gIdentityHandler.onDragStart = function(event) {
      if (gURLBar.getAttribute("pageproxystate") != "valid") return;
      const scale = window.devicePixelRatio;
      const canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
      const ctx = canvas.getContext("2d");
      
      let value = gBrowser.currentURI.displaySpec;
      let backgroundColor = varToHex("var(--tooltip-bgcolor, var(--arrowpanel-background))");
      let textColor = varToHex("var(--tooltip-color, var(--arrowpanel-color))");

      canvas.width = 400 * scale;
      canvas.height = 32 * scale;
      roundRect(ctx, 0, 0, canvas.width, canvas.height, 5 * scale, backgroundColor, null);
      
      ctx.fillStyle = textColor;
      ctx.font = `${12 * scale}px sans-serif`;
      ctx.fillText(value, 10 * scale, 20 * scale);

      event.dataTransfer.setData("text/plain", value);
      event.dataTransfer.setDragImage(canvas, 16, 16);
    };
  }

  restoreOneOffsContextMenu() {
    const proto = Object.getPrototypeOf(this.urlbarOneOffs);
    if (proto) proto._on_contextmenu = (e) => {}; // Simplified restore
  }

  async urlbarResultsDetailedIcons() {
    const { UrlbarResult } = ChromeUtils.importESModule("resource:///modules/UrlbarResult.sys.mjs");
    const { UrlbarUtils } = ChromeUtils.importESModule("resource:///modules/UrlbarUtils.sys.mjs");
    
    // Patching the Result view to accept clientType and engine attributes
    const view = gURLBar.view;
    const origUpdateRow = view._updateRow.bind(view);
    view._updateRow = function(result, item) {
      origUpdateRow(result, item);
      if (result.payload.clientType) item.setAttribute("clientType", result.payload.clientType);
      if (result.payload.engine) item.setAttribute("engine", result.payload.engine);
    };

    // Add CSS for device icons
    let css = `.urlbarView-row[clientType="phone"] { --device-icon: url("chrome://browser/skin/device-phone.svg"); }
               .urlbarView-row[clientType="desktop"] { --device-icon: url("chrome://browser/skin/device-desktop.svg"); }`;
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    let uri = Services.io.newURI(`data:text/css;charset=UTF=8,${encodeURIComponent(css)}`);
    if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }

  disableUrlbarInterventions() {
    gURLBar.controller.manager.unregisterProviderByName("UrlbarProviderInterventions");
  }

  urlbarResultsSorting() {
    const { UrlbarPrefs } = ChromeUtils.importESModule("resource:///modules/UrlbarPrefs.sys.mjs");
    if (!UrlbarPrefs._originalMakeResultGroups) {
      UrlbarPrefs._originalMakeResultGroups = UrlbarPrefs.makeResultGroups;
      UrlbarPrefs.makeResultGroups = function(options) {
        options.showSearchSuggestionsFirst = Services.prefs.getBoolPref("browser.urlbar.showSearchSuggestionsFirst", true);
        return this._originalMakeResultGroups(options);
      };
    }
  }

  underlineSpaceResults() {
    const view = gURLBar.view;
    const origAddText = view._addTextContentWithHighlights.bind(view);
    view._addTextContentWithHighlights = function(node, text, highlights) {
      if (/^\s{2,}$/.test(text)) {
        text = text.replace(/\s/g, `\u00A0`);
        node.setAttribute("all-whitespace", true);
      }
      origAddText(node, text, highlights);
    };
  }

  oneOffEngineAttributes() {
    const { UrlbarSearchOneOffs } = ChromeUtils.importESModule("resource:///modules/UrlbarSearchOneOffs.sys.mjs");
    UrlbarSearchOneOffs.prototype.setTooltipForEngineButton = function(button) {
      button.setAttribute("engine", button.engine.name);
      button.setAttribute("tooltiptext", button.engine.name);
    };
  }
}

// Initializer
if (gBrowserInit.delayedStartupFinished) {
  new UrlbarMods();
} else {
  Services.obs.addObserver(function listener(s, t) {
    Services.obs.removeObserver(listener, t);
    new UrlbarMods();
  }, "browser-delayed-startup-finished");
}