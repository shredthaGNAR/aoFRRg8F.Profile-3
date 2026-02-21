// ==UserScript==
// @name           Private Tabs
// @version        1.4.3x
// @author         GLM
// @homepage       https://github.com/aminomancer
// @description    An fx-autoconfig port of [Private Tab](https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/privateTab.uc.js) by xiaoxiaoflood. Adds buttons and menu items allowing you to open a "private tab" in nearly any circumstance in which you'd be able to open a normal tab. Instead of opening a link in a private window, you can open it in a private tab instead. This will use a special container and prevent history storage, depending on user configuration. You can also toggle tabs back and forth between private and normal mode. This script adds two hotkeys: Ctrl+Alt+P to open a new private tab, and Ctrl+Alt+T to toggle private mode for the active tab. These hotkeys can be configured along with several other options at the top of the script file.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/privateTabs.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/privateTabs.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @include        main
// @include        chrome://browser/content/places/bookmarksSidebar.xhtml
// @include        chrome://browser/content/places/historySidebar.xhtml
// @include        chrome://browser/content/places/places.xhtml
// ==/UserScript==

(function() {
  // Check if UC_API is available (fx-autoconfig environment)
  if (typeof UC_API === 'undefined') {
    console.error('Private Tabs: UC_API not found. This script requires fx-autoconfig loader.');
    return;
  }

  class PrivateTabManager {
    // user preferences. set these in about:config if you want them to persist
    // between script updates without having to reapply them.
    defaultPrefs = [
      // if you want to not record history but don't care about other data, maybe
      // even want to keep private logins
      ["neverClearData", false],
      ["restoreTabsOnRestart", true],
      ["doNotClearDataUntilFxIsClosed", true],
      ["deleteContainerOnDisable", false],
      ["clearDataOnDisable", false],
      // key to toggle private mode for the active tab. ctrl + alt + T by default.
      ["toggleHotkey", "T"],
      // key for opening a new private tab. ctrl + alt + P by default.
      ["newTabHotkey", "P"],
      // modifiers for toggle hotkey. alt+ctrl on windows; alt+cmd on mac
      ["toggleModifiers", "alt accel"],
      // modifiers for new tab hotkey.
      ["newTabModifiers", "alt accel"],
    ];
    
    setupPrefs() {
      let defaultBranch = Services.prefs.getDefaultBranch("");
      for (let [name, value] of this.defaultPrefs) {
        let prefName = `privateTabs.${name}`;
        XPCOMUtils.defineLazyPreferenceGetter(this.config, name, prefName, value);
        try {
          switch (typeof value) {
            case "boolean":
              if (!Services.prefs.prefHasUserValue(prefName)) {
                defaultBranch.setBoolPref(prefName, value);
              }
              break;
            case "number":
              if (!Services.prefs.prefHasUserValue(prefName)) {
                defaultBranch.setIntPref(prefName, value);
              }
              break;
            case "string":
              if (!Services.prefs.prefHasUserValue(prefName)) {
                defaultBranch.setStringPref(prefName, value);
              }
              break;
          }
        } catch(e) {
          console.error(`Failed to set pref ${prefName}:`, e);
        }
      }
    }
    
    config = {};
    openTabs = new Set();
    BTN_ID = "privateTab-button";
    BTN2_ID = "newPrivateTab-button";
    
    constructor() {
      this.setupPrefs();
      // the internal duplicateTab method doesn't pass the skipAnimation parameter
      // to addTrustedTab. so we need to make our own function, which requires us
      // to access some private objects.
      try {
        let sessionStoreModule = ChromeUtils.importESModule(
          "resource:///modules/sessionstore/SessionStore.sys.mjs"
        );
        this.SSI = sessionStoreModule.SessionStoreInternal;
        this.TAB_CUSTOM_VALUES = sessionStoreModule.TAB_CUSTOM_VALUES;
      } catch(e) {
        console.error("Failed to import SessionStore module:", e);
      }
      
      ChromeUtils.defineESModuleGetters(this, {
        Management: "resource://gre/modules/Extension.sys.mjs",
        TabState: "resource:///modules/sessionstore/TabState.sys.mjs",
        TabStateFlusher: "resource:///modules/sessionstore/TabStateFlusher.sys.mjs",
        ContextualIdentityService: "resource://gre/modules/ContextualIdentityService.sys.mjs",
      });
      
      this.sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
        Ci.nsIStyleSheetService
      );
      
      let iconsSheet = UC_API.FileSystem.chromeDir().entry();
      iconsSheet.append("uc-context-menu-icons.css");
      this.menuClass = iconsSheet.exists() ? `menuitem-iconic privatetab-icon` : "";
      
      if (typeof MozElements !== 'undefined' && MozElements.MozTab) {
        this.orig_getAttribute = MozElements.MozTab.prototype.getAttribute;
      }
      
      this.init();
      
      if (location.href !== "chrome://browser/content/browser.xhtml") {
        return this.exec();
      }
      
      if (gBrowserInit.delayedStartupFinished) {
        this.exec();
      } else {
        let delayedListener = (subject, topic) => {
          if (topic == "browser-delayed-startup-finished" && subject == window) {
            Services.obs.removeObserver(delayedListener, topic);
            this.exec();
          }
        };
        Services.obs.addObserver(
          delayedListener,
          "browser-delayed-startup-finished"
        );
      }
    }

    async exec() {
      if (PrivateBrowsingUtils.isWindowPrivate(window)) return;
      
      let openAll = document.getElementById(
        "placesContext_openBookmarkContainer:tabs"
      );
      if (openAll) {
        let openAllPrivate = UC_API.Utils.createElement(document, "menuitem", {
          id: "openAllPrivate",
          label: "Open All in Private Tabs",
          accesskey: "v",
          "selection-type": "single|none",
          "node-type": "folder|query_tag",
          class: this.menuClass,
        });
        openAll.after(openAllPrivate);
        openAllPrivate.addEventListener("command", e => {
          e.userContextId = this.container.userContextId;
          PlacesUIUtils.openSelectionInTabs(e);
        });
      }

      let openAllLinks = document.getElementById("placesContext_openLinks:tabs");
      if (openAllLinks) {
        let openAllLinksPrivate = UC_API.Utils.createElement(document, "menuitem", {
          id: "openAllLinksPrivate",
          label: "Open All in Private Tabs",
          accesskey: "v",
          class: this.menuClass,
          "selection-type": "multiple",
          "node-type": "link",
          "hide-if-node-type": "link_bookmark",
        });
        openAllLinks.after(openAllLinksPrivate);
        openAllLinksPrivate.addEventListener("command", e => {
          e.userContextId = this.container.userContextId;
          PlacesUIUtils.openSelectionInTabs(e);
        });
      }

      let openTab = document.getElementById("placesContext_open:newtab");
      if (openTab) {
        let openPrivate = UC_API.Utils.createElement(document, "menuitem", {
          id: "openPrivate",
          label: "Open in a New Private Tab",
          accesskey: "v",
          class: this.menuClass,
          "selection-type": "single",
          "node-type": "link",
        });
        openTab.after(openPrivate);
        openPrivate.addEventListener("command", e => {
          let view = e.target.parentElement._view;
          PlacesUIUtils._openNodeIn(
            view.selectedNode,
            "tab",
            view.ownerWindow,
            false,
            this.container.userContextId
          );
        });
      }

      let placesContext = document.getElementById("placesContext");
      if (placesContext) {
        placesContext.addEventListener("popupshowing", this);
      }

      if (location.href !== "chrome://browser/content/browser.xhtml") return;

      await UC_API.Hotkeys.define({
        modifiers: this.config.toggleModifiers,
        key: this.config.toggleHotkey,
        id: "togglePrivateTab-key",
        command: win => {
          if (win === window && win.privateTab) {
            win.privateTab.togglePrivate();
          }
        },
      }).attachToWindow(window, { suppressOriginalKey: true });

      await UC_API.Hotkeys.define({
        modifiers: this.config.newTabModifiers,
        key: this.config.newTabHotkey,
        id: "newPrivateTab-key",
        command: win => {
          if (win === window && win.privateTab) {
            win.privateTab.BrowserOpenTabPrivate();
          }
        },
      }).attachToWindow(window, { suppressOriginalKey: true });

      let toggleKey = document.getElementById("togglePrivateTab-key");
      let newPrivateTabKey = document.getElementById("newPrivateTab-key");

      let menuNewTab = document.getElementById("menu_newNavigatorTab");
      if (menuNewTab) {
        let menuOpenLink = UC_API.Utils.createElement(document, "menuitem", {
          id: "menu_newPrivateTab",
          label: "New Private Tab",
          accesskey: "v",
          acceltext: ShortcutUtils.prettifyShortcut(newPrivateTabKey),
          class: this.menuClass,
        });
        menuNewTab.after(menuOpenLink);
        menuOpenLink.addEventListener("command", e =>
          e.target.ownerGlobal.privateTab.BrowserOpenTabPrivate()
        );
      }

      let openLink = UC_API.Utils.createElement(document, "menuitem", {
        id: "openLinkInPrivateTab",
        label: "Open Link in New Private Tab",
        accesskey: "v",
        class: this.menuClass,
        hidden: true,
      });
      openLink.addEventListener("command", e => {
        let win = e.target.ownerGlobal;
        win.openLinkIn(
          win.gContextMenu.linkURL,
          "tab",
          win.gContextMenu._openLinkInParameters({
            userContextId: win.privateTab.container.userContextId,
            triggeringPrincipal: e.target.ownerDocument.nodePrincipal,
          })
        );
      });

      let contentAreaMenu = document.getElementById("contentAreaContextMenu");
      if (contentAreaMenu) {
        contentAreaMenu.addEventListener("popupshowing", this);
        contentAreaMenu.addEventListener("popuphidden", this);
      }
      
      let contextOpenLink = document.getElementById("context-openlinkintab");
      if (contextOpenLink) {
        contextOpenLink.after(openLink);
      }

      let contextPinTab = document.getElementById("context_pinTab");
      if (contextPinTab) {
        let toggleTab = UC_API.Utils.createElement(document, "menuitem", {
          id: "toggleTabPrivateState",
          label: "Private Tab",
          type: "checkbox",
          accesskey: "v",
          acceltext: ShortcutUtils.prettifyShortcut(toggleKey),
        });
        contextPinTab.after(toggleTab);
        toggleTab.addEventListener("command", e => {
          let win = e.target.ownerGlobal;
          win.privateTab.togglePrivate(win.TabContextMenu.contextTab);
        });
      }

      let tabContextMenu = document.getElementById("tabContextMenu");
      if (tabContextMenu) {
        tabContextMenu.addEventListener("popupshowing", this);
      }

      let privateMask = document.querySelector(
        ".private-browsing-indicator-with-label"
      );
      if (privateMask) {
        privateMask.classList.add("private-mask");
      }

      let newTabButton = document.getElementById("tabs-newtab-button");
      if (newTabButton) {
        let btn2 = UC_API.Utils.createElement(document, "toolbarbutton", {
          id: this.BTN2_ID,
          label: "New Private Tab",
          tooltiptext: `Open a new private tab (${ShortcutUtils.prettifyShortcut(
            newPrivateTabKey
          )})`,
          class: "toolbarbutton-1 chromeclass-toolbar-additional",
        });
        btn2.addEventListener("click", this);
        newTabButton.after(btn2);
      }

      gBrowser.tabContainer.addEventListener("TabSelect", this);
      addEventListener("XULFrameLoaderCreated", this);

      if (this.observePrivateTabs) {
        gBrowser.tabContainer.addEventListener("TabClose", this);
      }

      if (this.orig_getAttribute && MozElements.MozTab) {
        MozElements.MozTab.prototype.getAttribute = function (att) {
          if (att == "usercontextid" && this.isToggling) {
            delete this.isToggling;
            return window.privateTab.orig_getAttribute.call(this, att) ==
              window.privateTab.container.userContextId
              ? 0
              : window.privateTab.container.userContextId;
          }
          return window.privateTab.orig_getAttribute.call(this, att);
        };
      }

      if (customElements.get("tabbrowser-tabs")) {
        customElements.get("tabbrowser-tabs").prototype._updateNewTabVisibility =
          function () {
            let wrap = n =>
              n.parentNode.localName == "toolbarpaletteitem" ? n.parentNode : n;
            let unwrap = n =>
              n && n.localName == "toolbarpaletteitem" ? n.firstElementChild : n;

            let newTabFirst = false;
            let sibling = (id, otherId) => {
              let sib = this;
              do {
                if (sib.id == "new-tab-button") newTabFirst = true;
                sib = unwrap(wrap(sib).nextElementSibling);
              } while (
                sib &&
                (sib.hidden || sib.id == "alltabs-button" || sib.id == otherId)
              );
              return sib?.id == id && sib;
            };

            const kAttr = "hasadjacentnewtabbutton";
            let adjacentNewTab = sibling(
              "new-tab-button",
              window.privateTab.BTN_ID
            );
            if (adjacentNewTab) {
              this.setAttribute(kAttr, "true");
            } else {
              this.removeAttribute(kAttr);
            }

            const kAttr2 = "hasadjacentnewprivatetabbutton";
            let adjacentPrivateTab = sibling(
              window.privateTab.BTN_ID,
              "new-tab-button"
            );
            if (adjacentPrivateTab) {
              this.setAttribute(kAttr2, "true");
            } else {
              this.removeAttribute(kAttr2);
            }

            if (adjacentNewTab && adjacentPrivateTab) {
              let doc = adjacentPrivateTab.ownerDocument;
              let tabsNewTab = doc.getElementById("tabs-newtab-button");
              let btn2 = doc.getElementById(window.privateTab.BTN2_ID);
              if (tabsNewTab && btn2) {
                if (newTabFirst) {
                  tabsNewTab.after(btn2);
                } else {
                  btn2.after(tabsNewTab);
                }
              }
            }
          };
        gBrowser.tabContainer._updateNewTabVisibility();
      }
      
      if (!Services.ppmm.sharedData.get("uc_privateTabs")) {
        CustomizableUI.createWidget({
          id: this.BTN_ID,
          type: "custom",
          defaultArea: CustomizableUI.AREA_NAVBAR,
          showInPrivateBrowsing: false,
          onBuild: doc => {
            let btn = UC_API.Utils.createElement(doc, "toolbarbutton", {
              id: this.BTN_ID,
              label: "New Private Tab",
              tooltiptext: `Open a new private tab (${ShortcutUtils.prettifyShortcut(
                newPrivateTabKey
              )})`,
              class: "toolbarbutton-1 chromeclass-toolbar-additional",
            });
            btn.addEventListener("command", e => {
              if (e.target.ownerGlobal.privateTab) {
                e.target.ownerGlobal.privateTab.BrowserOpenTabPrivate();
              }
            });
            return btn;
          },
        });
        Services.ppmm.sharedData.set("uc_privateTabs", true);
      }
    }

    init() {
      this.ContextualIdentityService.ensureDataReady();
      this.container = this.ContextualIdentityService._identities.find(
        container => container.name == "Private"
      );
      if (!this.container) {
        this.ContextualIdentityService.create("Private", "fingerprint", "purple");
        this.container = this.ContextualIdentityService._identities.find(
          container => container.name == "Private"
        );
      } else if (!this.config.neverClearData) {
        this.clearData();
      }

      let style = {
        url: Services.io.newURI(
          `data:text/css;charset=UTF-8,${encodeURIComponent(
            `.privatetab-icon, #${this.BTN_ID}, #${this.BTN2_ID} { list-style-image: url(chrome://browser/skin/privateBrowsing.svg) !important; fill: currentColor; -moz-context-properties: fill; } @-moz-document url('chrome://browser/content/browser.xhtml') { .private-mask[enabled="true"] { display: flex !important; } .private-mask:not([enabled="true"]) { display: none !important; } #tabbrowser-tabs[hasadjacentnewprivatetabbutton]:not([overflow]) ~ #${this.BTN_ID}, #tabbrowser-tabs[overflow] > #tabbrowser-arrowscrollbox > #tabbrowser-arrowscrollbox-periphery > #${this.BTN2_ID}, #tabbrowser-tabs:not([hasadjacentnewprivatetabbutton]) > #tabbrowser-arrowscrollbox > #tabbrowser-arrowscrollbox-periphery > #${this.BTN2_ID}, #TabsToolbar[customizing="true"] #${this.BTN2_ID} { display: none; } .tabbrowser-tab[usercontextid="${this.container.userContextId}"] .tab-label { text-decoration: underline !important; text-decoration-color: -moz-nativehyperlinktext !important; text-decoration-style: dashed !important; } .tabbrowser-tab[usercontextid="${this.container.userContextId}"][pinned] .tab-icon-image, .tabbrowser-tab[usercontextid="${this.container.userContextId}"][pinned] .tab-throbber { border-bottom: 1px dashed -moz-nativehyperlinktext !important; }}`
          )}`
        ),
        type: this.sss.USER_SHEET,
      };
      if (!this.sss.sheetRegistered(style.url, style.type)) {
        this.sss.loadAndRegisterSheet(style.url, style.type);
      }

      CustomizableUI.addListener(this);

      if (!Services.ppmm.sharedData.get("uc_privateTabs")) {
        const lazy = {};
        ChromeUtils.defineESModuleGetters(lazy, {
          BrowserWindowTracker:
            "resource:///modules/BrowserWindowTracker.sys.mjs",
          PlacesUtils: "resource://gre/modules/PlacesUtils.sys.mjs",
          PrivateBrowsingUtils:
            "resource://gre/modules/PrivateBrowsingUtils.sys.mjs",
        });
        
        if (typeof PlacesUtils !== 'undefined') {
          let originalOpenTabset = PlacesUtils.openTabset;
          if (originalOpenTabset) {
            lazy.PlacesUtils.openTabset = function(aURIs, aOptions) {
              aOptions = aOptions || {};
              aOptions.userContextId = aOptions.userContextId || 0;
              originalOpenTabset.call(this, aURIs, aOptions);
            };
          }
        }
      }

      const { WebExtensionPolicy } = Cu.getGlobalForObject(Services);
      let TST_ID = "treestyletab@piro.sakura.ne.jp";
      this.setTstStyle(WebExtensionPolicy.getByID(TST_ID)?.getURL());
      if (location.href === "chrome://browser/content/browser.xhtml") {
        this.Management.on("ready", (_ev, extension) => {
          if (extension.id === TST_ID) this.setTstStyle(extension.getURL());
        });
        this.Management.on("uninstall", (_ev, extension) => {
          if (extension.id === TST_ID && this.TST_STYLE) {
            this.sss.unregisterSheet(this.TST_STYLE.uri, this.TST_STYLE.type);
          }
        });
      }

      if (!this.config.neverClearData) {
        Services.obs.addObserver(this, "quit-application-granted");
      }
    }

    observe(sub, top, data) {
      if (top === "quit-application-granted") {
        this.clearData();
        if (!this.config.restoreTabsOnRestart) this.closeTabs();
      }
    }

    clearData() {
      Services.clearData.deleteDataFromOriginAttributesPattern({
        userContextId: this.container.userContextId,
      });
    }

    closeTabs() {
      this.ContextualIdentityService._forEachContainerTab((tab, tabbrowser) => {
        if (tab.userContextId == this.container.userContextId) {
          tabbrowser.removeTab(tab);
        }
      });
    }

    duplicateTab(tab, { index, inBackground }) {
      // Create a new tab.
      let userContextId = tab.getAttribute("usercontextid");

      let tabOptions = {
        userContextId,
        index,
        skipAnimation: true,
        ...(tab == gBrowser.selectedTab
          ? { relatedToCurrent: true, ownerTab: tab }
          : {}),
        skipLoad: true,
        preferredRemoteType: tab.linkedBrowser.remoteType,
      };
      let newTab = gBrowser.addTrustedTab(null, tabOptions);

      // Start the throbber to pretend we're doing something while actually
      // waiting for data from the frame script. This throbber is disabled
      // if the URI is a local about: URI.
      let uriObj = tab.linkedBrowser.currentURI;
      if (!uriObj || (uriObj && !uriObj.schemeIs("about"))) {
        newTab.setAttribute("busy", "true");
      }

      // Hack to ensure that the about:home, about:newtab, and about:welcome
      // favicon is loaded instantaneously, to avoid flickering and improve
      // perceived performance.
      gBrowser.setDefaultIcon(newTab, uriObj);

      // Collect state before flushing.
      let tabState = this.TabState.collect(tab, this.TAB_CUSTOM_VALUES.get(tab));

      // Flush to get the latest tab state to duplicate.
      let browser = tab.linkedBrowser;
      this.TabStateFlusher.flush(browser).then(() => {
        // The new tab might have been closed in the meantime.
        if (newTab.closing || !newTab.linkedBrowser) return;

        let window = newTab.ownerGlobal;

        // The tab or its window might be gone.
        if (!window || !window.__SSi) return;

        // Update state with flushed data. We can't use TabState.clone() here as
        // the tab to duplicate may have already been closed. In that case we only
        // have access to the <xul:browser>.
        let options = { includePrivateData: true };
        this.TabState.copyFromCache(browser.permanentKey, tabState, options);

        tabState.index += 0;
        tabState.index = Math.max(
          1,
          Math.min(tabState.index, tabState.entries.length)
        );
        tabState.pinned = false;

        if (!inBackground) gBrowser.selectedTab = newTab;

        // Restore the state into the new tab.
        if (this.SSI) {
          this.SSI.restoreTab(newTab, tabState, {
            restoreImmediately: true,
          });
        }
      });

      return newTab;
    }

    togglePrivate(tab = gBrowser.selectedTab) {
      let isCurrentlyPrivate = this.isPrivate(tab);
      let targetUserContextId = isCurrentlyPrivate ? 0 : this.container.userContextId;

      // Mark the tab as toggling to handle the getAttribute override
      tab.isToggling = true;

      // Duplicate the tab with the new container
      let newTab = this.duplicateTab(tab, {
        index: tab._tPos + 1,
        inBackground: tab != gBrowser.selectedTab,
      });

      // Close the original tab
      gBrowser.removeTab(tab, { animate: false, closeWindowWithLastTab: false });

      // Update the mask after tab switch
      this.toggleMask();
    }

    toggleMask() {
      let privateMask = document.querySelector(
        ".private-browsing-indicator-with-label"
      );
      if (privateMask) {
        if (gBrowser.selectedTab.isToggling) {
          privateMask.setAttribute(
            "enabled",
            gBrowser.selectedTab.userContextId == this.container.userContextId
              ? "false"
              : "true"
          );
        } else {
          privateMask.setAttribute(
            "enabled",
            gBrowser.selectedTab.userContextId == this.container.userContextId
              ? "true"
              : "false"
          );
        }
      }
    }

    BrowserOpenTabPrivate() {
      openTrustedLinkIn(BROWSER_NEW_TAB_URL, "tab", {
        userContextId: this.container.userContextId,
      });
    }

    isPrivate(tab) {
      return tab.getAttribute("usercontextid") == this.container.userContextId;
    }

    contentContext(_e) {
      let tab = gBrowser.getTabForBrowser(gContextMenu.browser);
      gContextMenu.showItem(
        "openLinkInPrivateTab",
        gContextMenu.onSaveableLink || gContextMenu.onPlainTextLink
      );
      if (this.isPrivate(tab)) {
        gContextMenu.showItem("context-openlinkincontainertab", false);
      }
    }

    hideContext(_e) {
      let openLink = document.getElementById("openLinkInPrivateTab");
      if (openLink) {
        openLink.hidden = true;
      }
    }

    tabContext(_e) {
      let toggleTab = document.getElementById("toggleTabPrivateState");
      if (toggleTab) {
        toggleTab.setAttribute(
          "checked",
          TabContextMenu.contextTab.userContextId == this.container.userContextId
        );
      }
    }

    placesContext(_e) {
      let elements = [
        {id: "openPrivate", ref: "placesContext_open:newtab"},
        {id: "openAllPrivate", ref: "placesContext_openBookmarkContainer:tabs"},
        {id: "openAllLinksPrivate", ref: "placesContext_openLinks:tabs"}
      ];
      
      for (let {id, ref} of elements) {
        let element = document.getElementById(id);
        let refElement = document.getElementById(ref);
        if (element && refElement) {
          element.disabled = refElement.disabled;
          element.hidden = refElement.hidden;
        }
      }
    }

    handleEvent(e) {
      switch (e.type) {
        case "TabSelect":
          this.onTabSelect(e);
          break;
        case "TabClose":
          this.onTabClose(e);
          break;
        case "XULFrameLoaderCreated":
          this.privateListener(e);
          break;
        case "popupshowing":
          if (e.target === document.getElementById("placesContext")) {
            this.placesContext(e);
          }
          if (e.target === document.getElementById("contentAreaContextMenu")) {
            this.contentContext(e);
          }
          if (e.target === document.getElementById("tabContextMenu")) {
            this.tabContext(e);
          }
          break;
        case "popuphidden":
          if (e.target === document.getElementById("contentAreaContextMenu")) {
            this.hideContext(e);
          }
          break;
        case "click":
          if (e.target.id === this.BTN2_ID) {
            if (e.button == 0) {
              this.BrowserOpenTabPrivate();
            } else if (e.button == 2) {
              document.popupNode = document.getElementById(this.BTN_ID);
              let contextMenu = document.getElementById("toolbar-context-menu");
              if (contextMenu) {
                contextMenu.openPopup(e.target, "after_start", 14, -10, false, false);
                let removeItem = document.getElementsByClassName(
                  "customize-context-removeFromToolbar"
                )[0];
                let moveItem = document.getElementsByClassName(
                  "customize-context-moveToPanel"
                )[0];
                if (removeItem) removeItem.disabled = false;
                if (moveItem) moveItem.disabled = false;
              }
              e.preventDefault();
            }
          }
          break;
      }
    }

    privateListener(e) {
      let browser = e.target;
      let tab = gBrowser.getTabForBrowser(browser);
      if (!tab) return;
      let isPrivate = this.isPrivate(tab);

      if (!isPrivate) {
        if (this.observePrivateTabs) {
          this.openTabs.delete(tab);
          if (!this.openTabs.size) this.clearData();
        }
        return;
      }

      if (this.observePrivateTabs) this.openTabs.add(tab);

      browser.browsingContext.useGlobalHistory = false;
    }

    onTabSelect(e) {
      if (e.target.userContextId !== e.detail.previousTab.userContextId) {
        this.toggleMask();
      }
    }

    onTabClose(e) {
      if (this.isPrivate(e.target)) {
        this.openTabs.delete(e.target);
        if (!this.openTabs.size) this.clearData();
      }
    }

    onWidgetAfterCreation(id) {
      if (id == this.BTN_ID) {
        let newTabPlacement =
          CustomizableUI.getPlacementOfWidget("new-tab-button")?.position;
        if (newTabPlacement) {
          CustomizableUI.addWidgetToArea(
            this.BTN_ID,
            CustomizableUI.AREA_TABSTRIP,
            newTabPlacement + 1
          );
        }
        gBrowser.tabContainer._updateNewTabVisibility();
        CustomizableUI.removeListener(this);
      }
    }

    get observePrivateTabs() {
      return (
        this._observePrivateTabs ||
        (this._observePrivateTabs =
          !this.config.neverClearData &&
          !this.config.doNotClearDataUntilFxIsClosed)
      );
    }

    setTstStyle(baseURL) {
      if (!baseURL) return;
      this.TST_STYLE = {
        uri: Services.io.newURI(
          `data:text/css;charset=UTF-8,${encodeURIComponent(
            `@-moz-document url-prefix(${baseURL}sidebar/sidebar.html) { .tab.contextual-identity-firefox-container-${this.container.userContextId} .label-content { text-decoration: underline !important; text-decoration-color: -moz-nativehyperlinktext !important; text-decoration-style: dashed !important; } .tab.contextual-identity-firefox-container-${this.container.userContextId} tab-favicon { border-bottom: 1px dashed -moz-nativehyperlinktext !important;}}`
          )}`
        ),
        type: this.sss.USER_SHEET,
      };
      if (!this.sss.sheetRegistered(this.TST_STYLE.uri, this.TST_STYLE.type)) {
        this.sss.loadAndRegisterSheet(this.TST_STYLE.uri, this.TST_STYLE.type);
      }
    }
  }

  window.privateTab = new PrivateTabManager();
})();
