// ==UserScript==
// @name           Unread Tabs Indicator
// @description    Marks tabs as unread when opened in background, removes mark when selected
// ==/UserScript==

(function() {
    if (location.href != 'chrome://browser/content/browser.xhtml') return;
    
    // Wait for browser to initialize
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
        // Add CSS for unread tab styling
        let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        let uri = Services.io.newURI(
            `data:text/css;charset=UTF-8,${encodeURIComponent(`
                .tabbrowser-tab[unread="true"] .tab-label {
                    font-style: italic !important;
                    color: Highlight !important;
                }
                .tabbrowser-tab[unread="true"]:not([selected]) .tab-content {
                    opacity: 0.7 !important;
                }
                .tabbrowser-tab[unread="true"]:not([selected]) .tab-icon-image,
                .tabbrowser-tab[unread="true"]:not([selected]) .tab-throbber {
                    opacity: 0.8 !important;
                }
            `)}`
        );
        
        if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) {
            sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
        }
        
        let func = {
            // Mark tab as unread when opened in background
            onTabOpen: function(e) {
                let tab = e.target;
                // Only mark as unread if it's not the selected tab
                if (tab != gBrowser.selectedTab) {
                    tab.setAttribute('unread', 'true');
                }
            },
            
            // Remove unread mark when tab is selected
            onTabSelect: function(e) {
                let tab = e.target;
                if (tab.hasAttribute('unread')) {
                    tab.removeAttribute('unread');
                }
            },
            
            // Handle tab switching - mark previous tab handling
            onTabSwitching: function(e) {
                let tab = e.detail.previousTab;
                // Optionally mark the tab we're switching away from
                // Uncomment if you want this behavior:
                // if (tab && !tab.hasAttribute('unread')) {
                //     tab.setAttribute('unread', 'true');
                // }
            },
            
            // Remove unread attribute when tab is closed
            onTabClose: function(e) {
                let tab = e.target;
                if (tab.hasAttribute('unread')) {
                    tab.removeAttribute('unread');
                }
            },
            
            // Mark tabs as unread when content changes in background tabs
            onTabAttrModified: function(e) {
                let tab = e.target;
                // If tab is loading in background and not selected, mark as unread
                if (e.detail.changed.includes('busy') && 
                    tab.hasAttribute('busy') && 
                    tab != gBrowser.selectedTab) {
                    tab.setAttribute('unread', 'true');
                }
            },
            
            // Handle DOMContentLoaded for background tabs
            onTabContentLoaded: function(browser) {
                let tab = gBrowser.getTabForBrowser(browser);
                if (tab && tab != gBrowser.selectedTab && !tab.hasAttribute('unread')) {
                    tab.setAttribute('unread', 'true');
                }
            }
        };
        
        // Add event listeners
        gBrowser.tabContainer.addEventListener('TabOpen', func.onTabOpen, false);
        gBrowser.tabContainer.addEventListener('TabSelect', func.onTabSelect, false);
        gBrowser.tabContainer.addEventListener('TabClose', func.onTabClose, false);
        gBrowser.tabContainer.addEventListener('TabAttrModified', func.onTabAttrModified, false);
        
        // Optional: Listen for content loaded in background tabs
        let tabListener = {
            onLocationChange: function(browser, webProgress, request, location, flags) {
                // Check if this is a background tab that finished loading
                if (webProgress.isTopLevel) {
                    let tab = gBrowser.getTabForBrowser(browser);
                    if (tab && tab != gBrowser.selectedTab) {
                        // Small delay to ensure the page has started loading
                        setTimeout(() => {
                            if (tab && tab != gBrowser.selectedTab && !tab.hasAttribute('unread')) {
                                tab.setAttribute('unread', 'true');
                            }
                        }, 100);
                    }
                }
            }
        };
        
        gBrowser.addTabsProgressListener(tabListener);
        
        // Mark existing background tabs as unread (optional)
        for (let tab of gBrowser.tabs) {
            if (tab != gBrowser.selectedTab && !tab.hasAttribute('unread')) {
                tab.setAttribute('unread', 'true');
            }
        }
        
        // Cleanup on window unload
        window.addEventListener('unload', function uninit() {
            gBrowser.tabContainer.removeEventListener('TabOpen', func.onTabOpen, false);
            gBrowser.tabContainer.removeEventListener('TabSelect', func.onTabSelect, false);
            gBrowser.tabContainer.removeEventListener('TabClose', func.onTabClose, false);
            gBrowser.tabContainer.removeEventListener('TabAttrModified', func.onTabAttrModified, false);
            gBrowser.removeTabsProgressListener(tabListener);
            
            // Unregister stylesheet
            if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) {
                sss.unregisterSheet(uri, sss.AUTHOR_SHEET);
            }
            
            window.removeEventListener('unload', uninit, false);
        }, false);
        
        // Optional: Add keyboard shortcut to mark all tabs as read
        let markAllRead = function() {
            for (let tab of gBrowser.tabs) {
                if (tab.hasAttribute('unread')) {
                    tab.removeAttribute('unread');
                }
            }
        };
        
        // Optional: Add context menu item to mark tab as read/unread
        let tabContextMenu = document.getElementById("tabContextMenu");
        if (tabContextMenu) {
            let menuSeparator = document.createXULElement("menuseparator");
            menuSeparator.id = "context_toggleUnreadSeparator";
            tabContextMenu.appendChild(menuSeparator);
            
            let menuItem = document.createXULElement("menuitem");
            menuItem.id = "context_toggleUnread";
            menuItem.setAttribute("label", "Toggle Unread Status");
            menuItem.addEventListener("command", function() {
                let tab = TabContextMenu.contextTab;
                if (tab.hasAttribute('unread')) {
                    tab.removeAttribute('unread');
                } else {
                    tab.setAttribute('unread', 'true');
                }
            });
            tabContextMenu.appendChild(menuItem);
            
            // Update menu item visibility
            tabContextMenu.addEventListener("popupshowing", function() {
                let tab = TabContextMenu.contextTab;
                let menuItem = document.getElementById("context_toggleUnread");
                if (menuItem) {
                    menuItem.setAttribute("checked", tab.hasAttribute('unread'));
                }
            });
        }
    }
})();
