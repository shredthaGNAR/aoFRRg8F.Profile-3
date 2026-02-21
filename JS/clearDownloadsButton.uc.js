// ==UserScript==
// @name            Clear Downloads Panel Button
// @version         1.5.0
// @author          aminomancer (fixed)
// @description     Place a "Clear Downloads" button in the downloads panel.
// ==/UserScript==

class ClearDLPanel {
  constructor() {
    this.init();
  }

  async init() {
    await this.makeButton();
    this.hookCountChanged();
  }

  async genStrings() {
    // Localization needs to be handled carefully in modern Firefox
    try {
      this.strings = new Localization(["browser/downloads.ftl"], true);
      const messages = await this.strings.formatMessages([
        "downloads-cmd-clear-downloads",
      ]);
      this.label = messages[0].attributes.find(a => a.name === "label")?.value || "Clear Downloads";
      this.accessKey = messages[0].attributes.find(a => a.name === "accesskey")?.value || "C";
      return [this.label, this.accessKey];
    } catch (e) {
      return ["Clear Downloads", "C"];
    }
  }

  async makeButton() {
    const footer = document.getElementById("downloadsFooter");
    if (!footer) return;

    this.clearPanelButton = document.createXULElement("button");
    let [label, accesskey] = await this.genStrings();
    
    // Formatting label to Sentence case
    let labelString = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

    const attrs = {
      id: "clearDownloadsPanel",
      class: "downloadsPanelFooterButton subviewbutton panel-subview-footer-button toolbarbutton-1",
      label: labelString,
      accesskey: accesskey,
      flex: "1",
      pack: "start"
    };

    for (const [key, val] of Object.entries(attrs)) {
      this.clearPanelButton.setAttribute(key, val);
    }

    this.clearPanelButton.addEventListener("command", () => {
      // Direct command to clear list
      goDoCommand("downloadsCmd_clearList");
      if (typeof DownloadsPanel !== 'undefined') DownloadsPanel.hidePanel();
    });

    // Insertion logic
    const historyButton = document.getElementById("downloadsHistory");
    if (historyButton) {
      historyButton.after(this.clearPanelButton);
      
      // Add a separator for visual consistency
      let sep = document.createXULElement("toolbarseparator");
      this.clearPanelButton.before(sep);
      
      // Align buttons horizontally
      this.clearPanelButton.parentElement.style.display = "flex";
      this.clearPanelButton.parentElement.style.flexDirection = "row";
    }

    this.updateVisibility();
  }

  // Modern way to hook into the count change without eval()
  hookCountChanged() {
    if (typeof DownloadsView !== "undefined" && !DownloadsView._originalItemCountChanged) {
      DownloadsView._originalItemCountChanged = DownloadsView._itemCountChanged;
      
      // Wrap the original function
      DownloadsView._itemCountChanged = (count) => {
        DownloadsView._originalItemCountChanged(count);
        this.updateVisibility(count);
      };
    }
  }

  updateVisibility(count) {
    if (!this.clearPanelButton) return;
    
    // If count isn't passed, try to fetch it from the view
    let currentCount = count ?? DownloadsView?._visibleViewItems?.size ?? 0;
    this.clearPanelButton.hidden = currentCount < 1;
    
    // Hide the separator if the button is hidden
    let sep = this.clearPanelButton.previousElementSibling;
    if (sep && sep.tagName === "toolbarseparator") {
      sep.hidden = this.clearPanelButton.hidden;
    }
  }
}

// Startup execution
if (gBrowserInit.delayedStartupFinished) {
  new ClearDLPanel();
} else {
  let delayedListener = (subject, topic) => {
    if (topic == "browser-delayed-startup-finished" && subject == window) {
      Services.obs.removeObserver(delayedListener, topic);
      new ClearDLPanel();
    }
  };
  Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}