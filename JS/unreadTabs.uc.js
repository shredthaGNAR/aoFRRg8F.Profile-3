// Unread Tabs - Visual indicator for tabs that haven't been selected since loading
// Compatible with fx-autoconfig

(() => {
    'use strict';

    const CONFIG = {
        // CSS properties for unread tab styling
        unreadTabStyle: `
            text-decoration-line: underline !important;
            text-decoration-style: dotted !important;
            text-decoration-color: magenta !important;
            text-decoration-thickness: 2px !important;
            text-decoration-skip-ink: none !important;
            text-underline-offset: .2em !important;
        `,
        
        // Selector for unread tabs
        selector: `.tabbrowser-tab:not([selected])[notselectedsinceload="true"] .tab-label`
    };

    class UnreadTabsManager {
        constructor() {
            this.styleSheet = null;
            this.initialized = false;
            this.boundHandleEvent = this.handleEvent.bind(this);
        }

        init() {
            if (this.initialized) return;
            
            try {
                // Wait for browser to be ready
                if (!gBrowser || !gBrowser.tabContainer) {
                    setTimeout(() => this.init(), 100);
                    return;
                }

                this.setupStyles();
                this.setupEventListeners();
                this.initializeExistingTabs();
                this.setupTabOpenListener();
                
                // Disable motion reduction override
                if (typeof window.gReduceMotionOverride !== 'undefined') {
                    window.gReduceMotionOverride = false;
                }
                
                this.initialized = true;
                console.log('UnreadTabs: Successfully initialized');
                
            } catch (error) {
                console.error('UnreadTabs: Initialization failed:', error);
            }
        }

        setupStyles() {
            try {
                if (!CONFIG.unreadTabStyle) return;
                
                const cssRule = `${CONFIG.selector} { ${CONFIG.unreadTabStyle} }`;
                const styleElement = document.createElementNS('http://www.w3.org/1999/xhtml', 'style');
                styleElement.textContent = cssRule;
                
                // Add to document head
                const head = document.getElementsByTagName('head')[0] || document.documentElement;
                head.appendChild(styleElement);
                
                this.styleSheet = styleElement;
                
            } catch (error) {
                console.error('UnreadTabs: Failed to setup styles:', error);
            }
        }

        setupEventListeners() {
            try {
                // Listen for tab selections
                gBrowser.tabContainer.addEventListener('TabSelect', this.boundHandleEvent);
                
                // Listen for window unload to cleanup
                window.addEventListener('unload', () => this.destroy());
                
            } catch (error) {
                console.error('UnreadTabs: Failed to setup event listeners:', error);
            }
        }

        setupTabOpenListener() {
            try {
                // Listen for new tabs being opened
                gBrowser.tabContainer.addEventListener('TabOpen', (event) => {
                    // Mark new tabs as unread
                    const newTab = event.target;
                    newTab.setAttribute('notselectedsinceload', 'true');
                });
                
            } catch (error) {
                console.error('UnreadTabs: Failed to setup tab open listener:', error);
            }
        }

        initializeExistingTabs() {
            try {
                const tabs = gBrowser.tabs;
                const selectedTab = gBrowser.selectedTab;
                
                for (const tab of tabs) {
                    if (tab === selectedTab) {
                        tab.setAttribute('notselectedsinceload', 'false');
                    } else {
                        tab.setAttribute('notselectedsinceload', 'true');
                    }
                }
                
                console.log(`UnreadTabs: Initialized ${tabs.length} existing tabs`);
                
            } catch (error) {
                console.error('UnreadTabs: Failed to initialize existing tabs:', error);
            }
        }

        handleEvent(event) {
            try {
                if (event.type === 'TabSelect' && event.target) {
                    // Mark the selected tab as read
                    event.target.setAttribute('notselectedsinceload', 'false');
                }
            } catch (error) {
                console.error('UnreadTabs: Error handling event:', error);
            }
        }

        destroy() {
            try {
                // Remove event listeners
                if (gBrowser && gBrowser.tabContainer) {
                    gBrowser.tabContainer.removeEventListener('TabSelect', this.boundHandleEvent);
                }
                
                // Remove stylesheet
                if (this.styleSheet && this.styleSheet.parentNode) {
                    this.styleSheet.parentNode.removeChild(this.styleSheet);
                }
                
                // Clean up tab attributes
                if (gBrowser && gBrowser.tabs) {
                    for (const tab of gBrowser.tabs) {
                        tab.removeAttribute('notselectedsinceload');
                    }
                }
                
                this.initialized = false;
                console.log('UnreadTabs: Cleanup completed');
                
            } catch (error) {
                console.error('UnreadTabs: Error during cleanup:', error);
            }
        }
    }

    // Initialize the manager
    const unreadTabsManager = new UnreadTabsManager();

    // Start initialization based on document state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => unreadTabsManager.init());
    } else {
        // Document already loaded, init immediately
        unreadTabsManager.init();
    }

    // Also try to init on window load as a fallback
    window.addEventListener('load', () => {
        if (!unreadTabsManager.initialized) {
            unreadTabsManager.init();
        }
    });

    // Make manager available globally for debugging
    window.UnreadTabsManager = unreadTabsManager;

})();
