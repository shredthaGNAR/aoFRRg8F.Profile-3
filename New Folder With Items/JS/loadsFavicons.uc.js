// Restore bookmark favicons - Compatible with fx-autoconfig
// Creates a toolbar button that fetches and restores favicons for all bookmarks

(() => {
    'use strict';

    // --- CONFIGURATION ---
    const CONFIG = {
        id: "ucf-loads-favicons",
        label: "Restore favicons",
        tooltiptext: "Restore bookmark favicons",
        image: "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><path style='fill:none;stroke:context-fill rgb(142, 142, 152);stroke-opacity:context-fill-opacity;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;' d='M3.6.6v14.8L8 11l4.4 4.4V.6z'/></svg>",
        maxtimeout: 30,  // Duration before request abort in seconds
        maxrequests: 50, // Maximum number of parallel requests
        alertnotification: true, // Notification of search completion
        alertmessage1: "Successfully processed!",
        alertmessage2: "Could not be processed."
    };

    class FaviconRestorer {
        constructor() {
            this.widget = null;
            this.favrunning = false;
            this.imageURL = null;
            this.NetUtil = null;
            this.AlertNotification = null;
            this.showAlert = null;
        }

        init() {
            try {
                // Wait for CustomizableUI to be available
                if (typeof CustomizableUI === 'undefined') {
                    setTimeout(() => this.init(), 100);
                    return;
                }

                this.createWidget();
                this.setupCleanup();
                console.log('FaviconRestorer: Successfully initialized');

            } catch (error) {
                console.error('FaviconRestorer: Initialization failed:', error);
            }
        }

        createWidget() {
            const self = this;
            
            this.widget = CustomizableUI.createWidget({
                id: CONFIG.id,
                label: CONFIG.label,
                tooltiptext: CONFIG.tooltiptext,
                defaultArea: CustomizableUI.AREA_NAVBAR,
                localized: false,
                
                onCreated(btn) {
                    self.setFill(btn);
                    btn.style.setProperty("list-style-image", `url("${self.getImageURL()}")`, "important");
                },
                
                onClick(e) {
                    if (e.button === 0) {
                        self.favSearchStart();
                    }
                }
            });
        }

        getImageURL() {
            if (this.imageURL) return this.imageURL;
            
            try {
                Services.io.getProtocolHandler("resource")
                    .QueryInterface(Ci.nsIResProtocolHandler)
                    .setSubstitution(CONFIG.id, Services.io.newURI(CONFIG.image));
                this.imageURL = `resource://${CONFIG.id}`;
            } catch (error) {
                console.warn('FaviconRestorer: Failed to create resource URL, using data URL');
                this.imageURL = CONFIG.image;
            }
            
            return this.imageURL;
        }

        getNetUtil() {
            if (this.NetUtil) return this.NetUtil;
            
            try {
                this.NetUtil = ChromeUtils.importESModule("resource://gre/modules/NetUtil.sys.mjs").NetUtil;
            } catch (error) {
                console.error('FaviconRestorer: Failed to import NetUtil:', error);
            }
            
            return this.NetUtil;
        }

        getAlertNotification() {
            if (this.AlertNotification) return this.AlertNotification;
            
            try {
                this.AlertNotification = Components.Constructor(
                    "@mozilla.org/alert-notification;1", 
                    "nsIAlertNotification", 
                    "initWithObject"
                );
            } catch (error) {
                console.error('FaviconRestorer: Failed to get AlertNotification:', error);
            }
            
            return this.AlertNotification;
        }

        getShowAlert() {
            if (this.showAlert) return this.showAlert;
            
            try {
                const alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
                const imageURL = this.getImageURL();
                
                if ("showAlertNotification" in alertsService) {
                    this.showAlert = alertsService.showAlertNotification.bind(null, imageURL);
                } else {
                    this.showAlert = (title, text) => {
                        const AlertNotification = this.getAlertNotification();
                        if (AlertNotification) {
                            alertsService.showAlert(new AlertNotification({imageURL, title, text}));
                        }
                    };
                }
            } catch (error) {
                console.error('FaviconRestorer: Failed to setup alert service:', error);
                this.showAlert = () => {}; // No-op fallback
            }
            
            return this.showAlert;
        }

        setFill(btn) {
            if (this.favrunning) {
                btn.style.setProperty("fill", "color-mix(in srgb, currentColor 20%, #e31b5d)", "important");
            } else {
                btn.style.removeProperty("fill");
            }
        }

        setBtnsFill() {
            try {
                for (let win of CustomizableUI.windows) {
                    let btn = this.widget.forWindow(win).node;
                    if (btn) this.setFill(btn);
                }
            } catch (error) {
                console.error('FaviconRestorer: Error setting button fill:', error);
            }
        }

        async favSearchStart() {
            if (this.favrunning) return;
            
            try {
                this.favrunning = true;
                this.setBtnsFill();

                const root = await PlacesUtils.promiseBookmarksTree(PlacesUtils.bookmarks.rootGuid);
                const urlsList = [];
                
                const convert = (node) => {
                    if (node.children) {
                        node.children.forEach(convert);
                    } else if (node.uri && /^(?:https?|ftp|file):/.test(node.uri)) {
                        urlsList.push(node.uri);
                    }
                };
                
                convert(root);

                const favForPage = (siteURI) => {
                    return new Promise(resolve => {
                        try {
                            const uri = Services.io.newURI(siteURI);
                            
                            if ("getFaviconURLForPage" in PlacesUtils.favicons) {
                                PlacesUtils.favicons.getFaviconURLForPage(uri, faviconURI => {
                                    resolve(faviconURI === null ? uri : null);
                                });
                            } else {
                                PlacesUtils.favicons.getFaviconForPage(uri).then(faviconURI => {
                                    resolve(faviconURI === null ? uri : null);
                                }).catch(() => resolve(uri));
                            }
                        } catch (error) {
                            resolve(null);
                        }
                    });
                };

                const results = await Promise.all(urlsList.map(favForPage));
                const filteredResults = results.filter(url => url !== null);
                
                this.favSearchResults(filteredResults);

            } catch (error) {
                console.error('FaviconRestorer: Error in favSearchStart:', error);
                this.favComplete(0, 0);
            }
        }

        favComplete(favsuccesslength, favmaxlength) {
            this.favrunning = false;
            this.setBtnsFill();
            
            if (CONFIG.alertnotification) {
                const showAlert = this.getShowAlert();
                const message = `${favsuccesslength} - ${CONFIG.alertmessage1}\n${favmaxlength - favsuccesslength} - ${CONFIG.alertmessage2}`;
                showAlert(CONFIG.label, message);
            }
        }

        favSearchResults(results) {
            const favmaxlength = results.length;
            let favsuccesslength = 0;
            let remainingResults = favmaxlength;
            
            if (!favmaxlength) {
                this.favComplete(0, 0);
                return;
            }

            const favmaxtimeout = CONFIG.maxtimeout * 1000;

            const setFaviconForPage = async (siteURI, faviconURI, type) => {
                try {
                    if ("setAndFetchFaviconForPage" in PlacesUtils.favicons) {
                        return new Promise(resolve => {
                            const timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
                            const request = PlacesUtils.favicons.setAndFetchFaviconForPage(
                                siteURI, 
                                faviconURI, 
                                false, 
                                PlacesUtils.favicons.FAVICON_LOAD_NON_PRIVATE, 
                                {
                                    onComplete() {
                                        favsuccesslength++;
                                        timer.cancel();
                                        resolve();
                                    }
                                }, 
                                Services.scriptSecurityManager.getSystemPrincipal()
                            );

                            if (!request) {
                                resolve();
                                return;
                            }

                            timer.initWithCallback(() => {
                                try {
                                    request.cancel();
                                } catch {}
                                resolve();
                            }, favmaxtimeout, timer.TYPE_ONE_SHOT);
                        });
                    } else {
                        // Fallback for older Firefox versions
                        const NetUtil = this.getNetUtil();
                        if (!NetUtil) throw new Error('NetUtil not available');

                        if (faviconURI.schemeIs("data")) {
                            PlacesUtils.favicons.setFaviconForPage(siteURI, faviconURI);
                            favsuccesslength++;
                            return;
                        }

                        const channel = NetUtil.newChannel({
                            uri: faviconURI,
                            loadingPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
                            securityFlags:
                                Ci.nsILoadInfo.SEC_REQUIRE_CORS_INHERITS_SEC_CONTEXT |
                                Ci.nsILoadInfo.SEC_COOKIES_INCLUDE |
                                Ci.nsILoadInfo.SEC_ALLOW_CHROME |
                                Ci.nsILoadInfo.SEC_DISALLOW_SCRIPT,
                            contentPolicyType: Ci.nsIContentPolicy.TYPE_INTERNAL_IMAGE_FAVICON,
                        });

                        return new Promise(resolve => {
                            NetUtil.asyncFetch(channel, async (input, status) => {
                                if (Components.isSuccessCode(status)) {
                                    try {
                                        const data = NetUtil.readInputStream(input, input.available());
                                        input.close();
                                        const buffer = new Uint8ClampedArray(data);
                                        const blob = new Blob([buffer], {type});
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            try {
                                                const dataURL = Services.io.newURI(reader.result);
                                                PlacesUtils.favicons.setFaviconForPage(siteURI, dataURL);
                                                favsuccesslength++;
                                            } catch {}
                                            resolve();
                                        };
                                        reader.onerror = () => resolve();
                                        reader.readAsDataURL(blob);
                                    } catch {
                                        resolve();
                                    }
                                } else {
                                    resolve();
                                }
                            });
                        });
                    }
                } catch (error) {
                    console.warn('FaviconRestorer: Error setting favicon:', error);
                }
            };

            const favSearchPage = async (siteURI) => {
                try {
                    const req = new XMLHttpRequest({mozAnon: false});
                    req.mozBackgroundRequest = true;
                    req.open("GET", siteURI.spec, true);
                    req.responseType = "document";
                    req.overrideMimeType("text/html");
                    req.timeout = favmaxtimeout;

                    await new Promise(resolve => {
                        req.onload = async () => {
                            try {
                                const doc = req.responseXML;
                                let favURI, favType;
                                
                                if (doc) {
                                    let lastlink, is16, is32, isany;
                                    for (let link of doc.head.querySelectorAll("link[href][rel~='icon']")) {
                                        if (link.sizes.length === 1) {
                                            const size = link.sizes[0];
                                            if (/any/i.test(size)) isany = link;
                                            else if (/32x32/i.test(size)) is32 = link;
                                            else if (/16x16/i.test(size)) is16 = link;
                                        }
                                        lastlink = link;
                                    }
                                    const icon = (isany || is32 || is16 || lastlink);
                                    favURI = icon?.href;
                                    favType = icon?.type;
                                }
                                
                                if (!favURI) {
                                    const baseURI = req.responseURL ? Services.io.newURI(req.responseURL).prePath : siteURI.prePath;
                                    favURI = `${baseURI}/favicon.ico`;
                                    favType = "image/x-icon";
                                }
                                
                                await setFaviconForPage(siteURI, Services.io.newURI(favURI), favType);
                            } catch (error) {
                                console.warn('FaviconRestorer: Error processing page:', error);
                            }
                            resolve();
                        };

                        req.onabort = req.onerror = req.ontimeout = () => {
                            resolve();
                        };

                        req.send(null);
                    });
                } catch (error) {
                    console.warn('FaviconRestorer: Error fetching page:', error);
                }

                remainingResults--;
                if (remainingResults === 0) {
                    this.favComplete(favsuccesslength, favmaxlength);
                } else if (results.length > 0) {
                    favSearchPage(results.shift());
                }
            };

            // Start processing with limited parallelism
            const initialBatch = results.splice(0, CONFIG.maxrequests);
            initialBatch.forEach(uri => favSearchPage(uri));
        }

        setupCleanup() {
            window.addEventListener('unload', () => this.cleanup());
        }

        cleanup() {
            try {
                if (this.widget) {
                    CustomizableUI.destroyWidget(CONFIG.id);
                    this.widget = null;
                }
                console.log('FaviconRestorer: Cleanup completed');
            } catch (error) {
                console.error('FaviconRestorer: Cleanup error:', error);
            }
        }
    }

    // Initialize the favicon restorer
    const faviconRestorer = new FaviconRestorer();

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => faviconRestorer.init());
    } else {
        setTimeout(() => faviconRestorer.init(), 50);
    }

    // Make available globally for debugging
    window.FaviconRestorerManager = faviconRestorer;

})();
