// 'Favicon in urlbars identity box' script for Firefox 13X+ by Aris - MODERNIZED
// Restores current page's favicon inside the identity-box of the urlbar.
// Compatible with fx-autoconfig

(() => {
    'use strict';

    // --- CONFIGURATION ---
    const CONFIG = {
        // Icon to show for pages without a specific favicon
        // Options: 
        //   - 'chrome://global/skin/icons/defaultFavicon.svg' (Default browser globe)
        //   - 'chrome://branding/content/icon32.png' (Firefox branding icon)
        //   - null (use the icon provided by the browser for no-favicon sites)
        ICON_FOR_PAGES_WITHOUT_FAVICON: 'chrome://branding/content/icon32.png',
        
        // If true, clicking the favicon opens the Page Info window
        FAVICON_CLICK_OPENS_PAGE_INFO: true,
        
        // Update delay in milliseconds
        UPDATE_DELAY: 100
    };

    class FaviconInUrlbar {
        constructor() {
            this.faviconElement = null;
            this.initialized = false;
            this.boundUpdateIcon = this.updateIcon.bind(this);
            this.boundCleanup = this.cleanup.bind(this);
        }

        init() {
            if (this.initialized) return;

            try {
                // Wait for browser objects to be available
                if (!gBrowser || !document.getElementById('identity-box')) {
                    setTimeout(() => this.init(), 100);
                    return;
                }

                this.createFaviconElement();
                this.insertIntoIdentityBox();
                this.setupEventListeners();
                this.updateIcon(); // Initial update
                
                this.initialized = true;
                console.log('FaviconInUrlbar: Successfully initialized');

            } catch (error) {
                console.error('FaviconInUrlbar: Initialization failed:', error);
            }
        }

        createFaviconElement() {
            try {
                // Create XUL image element for Firefox chrome context
                this.faviconElement = document.createXULElement ? 
                    document.createXULElement("image") : 
                    document.createElement("image");
                
                this.faviconElement.setAttribute("id", "favimginurlbar");
                this.faviconElement.setAttribute("class", "urlbar-favicon");
                
                // Apply styles
                this.faviconElement.style.cssText = `
                    width: 16px !important;
                    height: 16px !important;
                    margin-inline-start: 2px !important;
                    margin-inline-end: 2px !important;
                    -moz-context-properties: fill;
                    -moz-appearance: none;
                    list-style-image: url(${CONFIG.ICON_FOR_PAGES_WITHOUT_FAVICON});
                    flex-shrink: 0;
                `;

                // Add click handler if configured
                if (CONFIG.FAVICON_CLICK_OPENS_PAGE_INFO) {
                    this.faviconElement.addEventListener("click", this.handleClick.bind(this));
                }

            } catch (error) {
                console.error('FaviconInUrlbar: Failed to create favicon element:', error);
            }
        }

        insertIntoIdentityBox() {
            try {
                const identityBox = document.getElementById('identity-box');
                if (!identityBox || !this.faviconElement) return;

                // Remove any existing favicon element
                const existing = document.getElementById('favimginurlbar');
                if (existing) {
                    existing.remove();
                }

                // Insert before the security icon, or at the beginning
                const securityIcon = document.getElementById('connection-icon') || 
                                   document.getElementById('site-security-icon');
                
                if (securityIcon) {
                    identityBox.insertBefore(this.faviconElement, securityIcon);
                } else {
                    identityBox.appendChild(this.faviconElement);
                }

            } catch (error) {
                console.error('FaviconInUrlbar: Failed to insert favicon element:', error);
            }
        }

        handleClick(event) {
            try {
                event.preventDefault();
                event.stopPropagation();
                
                if (typeof gIdentityHandler !== 'undefined' && gIdentityHandler) {
                    if (gIdentityHandler.handleMoreInfoClick) {
                        gIdentityHandler.handleMoreInfoClick(event);
                    } else if (gIdentityHandler._identityBox) {
                        // Fallback: trigger click on identity box
                        gIdentityHandler._identityBox.click();
                    }
                }
            } catch (error) {
                console.error('FaviconInUrlbar: Click handler error:', error);
            }
        }

        getFaviconUri() {
            try {
                if (!gBrowser || !gBrowser.selectedTab) return null;

                const currentTab = gBrowser.selectedTab;
                
                // Try multiple methods to get the favicon
                let faviconUri = null;
                
                // Method 1: Tab's image attribute
                faviconUri = currentTab.getAttribute('image');
                if (faviconUri && faviconUri !== '') return faviconUri;
                
                // Method 2: gBrowser.getIcon
                if (typeof gBrowser.getIcon === 'function') {
                    faviconUri = gBrowser.getIcon(currentTab);
                    if (faviconUri && faviconUri !== '') return faviconUri;
                }
                
                // Method 3: Browser's favicon attribute
                if (currentTab.linkedBrowser) {
                    faviconUri = currentTab.linkedBrowser.getAttribute('favicon');
                    if (faviconUri && faviconUri !== '') return faviconUri;
                }
                
                // Method 4: Try to get from browser's mIconURL
                if (currentTab.linkedBrowser && currentTab.linkedBrowser.mIconURL) {
                    faviconUri = currentTab.linkedBrowser.mIconURL;
                    if (faviconUri && faviconUri !== '') return faviconUri;
                }

                return null;

            } catch (error) {
                console.warn('FaviconInUrlbar: Error getting favicon URI:', error);
                return null;
            }
        }

        updateIcon() {
            setTimeout(() => {
                try {
                    if (!this.faviconElement) return;

                    let faviconUri = this.getFaviconUri();
                    
                    // Use default icon if no favicon found
                    if (!faviconUri) {
                        faviconUri = CONFIG.ICON_FOR_PAGES_WITHOUT_FAVICON;
                    }

                    // Apply the favicon
                    if (faviconUri) {
                        this.faviconElement.style.listStyleImage = `url("${faviconUri}")`;
                        this.faviconElement.setAttribute('src', faviconUri);
                    }

                } catch (error) {
                    console.error('FaviconInUrlbar: Update icon error:', error);
                }
            }, CONFIG.UPDATE_DELAY);
        }

        setupEventListeners() {
            try {
                if (!gBrowser || !gBrowser.tabContainer) return;

                // Listen for tab events on the tab container
                const tabContainer = gBrowser.tabContainer;
                tabContainer.addEventListener('TabSelect', this.boundUpdateIcon);
                tabContainer.addEventListener('TabAttrModified', this.boundUpdateIcon);
                tabContainer.addEventListener('TabClose', this.boundUpdateIcon);
                
                // Listen for page loads
                gBrowser.addEventListener('pageshow', this.boundUpdateIcon);
                gBrowser.addEventListener('DOMContentLoaded', this.boundUpdateIcon);
                
                // Cleanup on window unload
                window.addEventListener('unload', this.boundCleanup);

            } catch (error) {
                console.error('FaviconInUrlbar: Failed to setup event listeners:', error);
            }
        }

        cleanup() {
            try {
                // Remove event listeners
                if (gBrowser && gBrowser.tabContainer) {
                    const tabContainer = gBrowser.tabContainer;
                    tabContainer.removeEventListener('TabSelect', this.boundUpdateIcon);
                    tabContainer.removeEventListener('TabAttrModified', this.boundUpdateIcon);
                    tabContainer.removeEventListener('TabClose', this.boundUpdateIcon);
                    
                    gBrowser.removeEventListener('pageshow', this.boundUpdateIcon);
                    gBrowser.removeEventListener('DOMContentLoaded', this.boundUpdateIcon);
                }

                // Remove the favicon element
                if (this.faviconElement && this.faviconElement.parentNode) {
                    this.faviconElement.parentNode.removeChild(this.faviconElement);
                }

                this.initialized = false;
                console.log('FaviconInUrlbar: Cleanup completed');

            } catch (error) {
                console.error('FaviconInUrlbar: Cleanup error:', error);
            }
        }
    }

    // Initialize the favicon manager
    const faviconManager = new FaviconInUrlbar();

    // Start initialization based on document state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => faviconManager.init());
    } else {
        // Document already loaded, init immediately or with small delay
        setTimeout(() => faviconManager.init(), 50);
    }

    // Also try on window load as fallback
    window.addEventListener('load', () => {
        if (!faviconManager.initialized) {
            faviconManager.init();
        }
    });

    // Make available globally for debugging
    window.FaviconInUrlbarManager = faviconManager;

})();
