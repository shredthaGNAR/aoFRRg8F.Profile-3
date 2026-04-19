// ==UserScript==
// @name           Let Ctrl+W Close Pinned Tabs
// @version        1.1.0
// @author         aminomancer (fixed)
// @description    Removes the behavior that prevents closing pinned tabs with Ctrl+W.
// ==/UserScript==

(() => {
  function init() {
    // Check if the function exists
    if (typeof BrowserCommands?.closeTabOrWindow === "function") {
      const originalCloseTab = BrowserCommands.closeTabOrWindow;

      // Wrap the original function
      BrowserCommands.closeTabOrWindow = function() {
        let tab = gBrowser.selectedTab;
        
        // If the tab is pinned, we temporarily trick the logic 
        // by shadowing the pinned property or just using the internal close command
        if (tab.pinned) {
          // Use the internal gBrowser method directly to bypass the "is it pinned?" shortcut check
          gBrowser.removeTab(tab, { animate: true });
        } else {
          originalCloseTab.apply(this, arguments);
        }
      };
    }
  }

  // Handle startup timing
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
})();