// ==UserScript==
// @name           Unread Tab Indicator
// @description    Marks newly opened tabs as unread until they are selected or closed
// @author         Anonymous
// @version        1.1
// @compatibility  Firefox 90+
// ==/UserScript==

(function () {
  // Only run in the main browser window
  if (location.href !== "chrome://browser/content/browser.xhtml") return;

  // Event handler functions
  const handlers = {
    add: function (e) {
      if (e.target && e.target.setAttribute) {
        e.target.setAttribute("unread", "true");
      }
    },
    remove: function (e) {
      if (
        e.target &&
        e.target.hasAttribute &&
        e.target.hasAttribute("unread")
      ) {
        e.target.removeAttribute("unread");
      }
    },
  };

  // Initialize the script
  function init() {
    try {
      // Add event listeners
      gBrowser.tabContainer.addEventListener("TabOpen", handlers.add);
      gBrowser.tabContainer.addEventListener("TabSelect", handlers.remove);
      gBrowser.tabContainer.addEventListener("TabClose", handlers.remove);

      // Cleanup function for when window closes
      window.addEventListener("unload", function uninit() {
        gBrowser.tabContainer.removeEventListener("TabOpen", handlers.add);
        gBrowser.tabContainer.removeEventListener("TabSelect", handlers.remove);
        gBrowser.tabContainer.removeEventListener("TabClose", handlers.remove);
        window.removeEventListener("unload", uninit);
      });
    } catch (e) {
      console.error("Unread Tab Indicator: Initialization failed", e);
    }
  }

  // Wait for browser to be fully initialized
  if (gBrowserInit && gBrowserInit.delayedStartupFinished) {
    init();
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        init();
      }
    };
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
