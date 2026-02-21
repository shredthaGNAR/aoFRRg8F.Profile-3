// ==UserScript==
// @name           Urlbar Container Color Indicator
// @version        1.0.3x
// @author         GLM
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Change the background color of the urlbar to match the active tab's contextual identity (aka multi-account container). Made by request.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/urlbarContainerColor.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/urlbarContainerColor.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  // Wait for the browser to be ready
  if (gBrowserInit.delayedStartupFinished) {
    init();
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        init();
      }
    };
    Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
  }

  function init() {
    // Define the update function
    window.updateUserContextUIIndicator = function () {
      function replaceContainerClass(classType, element, value) {
        if (!element) return;
        let prefix = `identity-${classType}-`;
        if (value && element.classList.contains(prefix + value)) return;
        for (let className of element.classList) {
          if (className.startsWith(prefix)) element.classList.remove(className);
        }
        if (value) element.classList.add(prefix + value);
      }
      
      let hbox = document.getElementById("userContext-icons");
      let urlbar = gURLBar?.querySelector(".urlbar-input-container");
      
      if (!urlbar) return;
      
      let userContextId = gBrowser.selectedBrowser.getAttribute("usercontextid");
      
      if (!userContextId) {
        replaceContainerClass("color", hbox, "");
        replaceContainerClass("color", urlbar, "");
        urlbar.removeAttribute("contextid");
        if (hbox) hbox.hidden = true;
        return;
      }
      
      // Access ContextualIdentityService properly
      let identity;
      try {
        if (typeof ContextualIdentityService !== "undefined") {
          identity = ContextualIdentityService.getPublicIdentityFromId(userContextId);
        } else {
          // Alternative way to access the service
          let { ContextualIdentityService } = Cu.import(
            "resource://gre/modules/ContextualIdentityService.jsm",
            {}
          );
          identity = ContextualIdentityService.getPublicIdentityFromId(userContextId);
        }
      } catch (e) {
        console.error("Error accessing ContextualIdentityService:", e);
        return;
      }
      
      if (!identity) {
        replaceContainerClass("color", hbox, "");
        replaceContainerClass("color", urlbar, "");
        urlbar.removeAttribute("contextid");
        if (hbox) hbox.hidden = true;
        return;
      }
      
      replaceContainerClass("color", hbox, identity.color);
      replaceContainerClass("color", urlbar, identity.color);
      urlbar.setAttribute("contextid", identity.userContextId);
      
      if (hbox) {
        let label;
        try {
          if (typeof ContextualIdentityService !== "undefined") {
            label = ContextualIdentityService.getUserContextLabel(userContextId);
          } else {
            let { ContextualIdentityService } = Cu.import(
              "resource://gre/modules/ContextualIdentityService.jsm",
              {}
            );
            label = ContextualIdentityService.getUserContextLabel(userContextId);
          }
        } catch (e) {
          label = identity.name;
        }
        
        let labelElement = document.getElementById("userContext-label");
        if (labelElement) {
          labelElement.setAttribute("value", label);
        }
        hbox.setAttribute("tooltiptext", label);
        
        let indicator = document.getElementById("userContext-indicator");
        if (indicator) {
          replaceContainerClass("icon", indicator, identity.icon);
        }
        hbox.hidden = false;
      }
    };

    // Register the CSS
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    let uri = Services.io.newURI(
      `data:text/css;charset=UTF=8,${encodeURIComponent(
        `.urlbar-input-container[contextid] {background-color: color-mix(in srgb, transparent 75%, var(--identity-tab-color));} #urlbar[open] .urlbar-input-container[contextid] {border-bottom-left-radius: 0; border-bottom-right-radius: 0;} #urlbar[open] > .urlbar-input-container[contextid] ~ .urlbarView > .urlbarView-body-outer > .urlbarView-body-inner {border-color: transparent}`
      )}`
    );
    
    if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) {
      sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
    }

    // Set up event listeners to update on tab changes
    gBrowser.tabContainer.addEventListener("TabSelect", updateUserContextUIIndicator);
    gBrowser.tabContainer.addEventListener("TabAttrModified", (event) => {
      if (event.detail.changed.includes("usercontextid") && event.target.selected) {
        updateUserContextUIIndicator();
      }
    });

    // Initial update
    updateUserContextUIIndicator();
  }
})();
