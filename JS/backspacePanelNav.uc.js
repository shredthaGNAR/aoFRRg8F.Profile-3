// ==UserScript==
// @name            Backspace Panel Navigation
// @version         1.1.6
// @author          aminomancer
// @homepageURL     https://github.com/aminomancer
// @description     Press backspace to navigate back/forward in popup panels.
// @license         Creative Commons Attribution-NonCommercial-ShareAlike 4.0
// ==/UserScript==

(function () {
  function init() {
    // Locate the prototype for PanelView to patch key behavior globally
    const pc = Object.getPrototypeOf(PanelView.forNode(PanelUI.mainView));
    
    /**
     * Enhanced check for modern Firefox UI elements.
     * Prevents Backspace navigation when focus is inside a text-entry field.
     */
    function isNavigableWithTabOnly(element) {
      let tag = element.localName;
      return (
        tag == "menulist" ||
        tag == "select" ||
        tag == "radiogroup" ||
        tag == "input" ||
        tag == "textarea" ||
        tag == "search-textbox" || // Firefox's custom search inputs
        tag == "moz-input-box" ||  // Common wrapper for various UI inputs
        tag == "browser" ||
        tag == "iframe" ||
        element.isContentEditable || // Handles rich-text editors
        element.dataset?.navigableWithTabOnly === "true"
      );
    }

    // Capture the original function as a string for modification
    let navString = pc.keyNavigation.toString();
    
    // The logic to inject: navigate back if possible, otherwise close the popup
    const backspaceLogic = `case "Backspace":
        if (tabOnly() || (typeof isContextMenuOpen === "function" && isContextMenuOpen())) {
          break;
        }
        stop();
        if (PanelMultiView.forNode(this.node.panelMultiView).openViews.length > 1) {
          this.node.panelMultiView.goBack();
        } else {
          PanelMultiView.forNode(this.node.panelMultiView)?._panel.hidePopup(true);
        }
        break;
        `;

    try {
      eval(
        `pc.keyNavigation = ${navString
          .replace(/#isNavigableWithTabOnly/g, isNavigableWithTabOnly.toString())
          .replace(/(case\s+["']ArrowLeft["']\s*:)/, backspaceLogic + "$1")}`
      );
    } catch (e) {
      console.error("BackspacePanelNav: Failed to patch keyNavigation", e);
    }
  }

  // Ensure the UI is ready before attempting to patch
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