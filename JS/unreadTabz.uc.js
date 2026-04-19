// ==UserScript==
// @name           Unread Tabs Indicator
// @description    Adds visual indicator (dotted underline) to unread tabs
// @include        main
// @onlyonce
// ==/UserScript==

(async (
    propertiesUnread = `
text-decoration-line: underline !important;
text-decoration-style: dotted !important;
text-decoration-color: magenta !important;
text-decoration-thickness: 2px !important;
text-decoration-skip-ink: none !important;
text-underline-offset: .2em !important;
`,
) => {
    const handler = {
        init() {
            window.gReduceMotionOverride = false;
            if (propertiesUnread) {
                const css = `.tabbrowser-tab:not([selected],[multiselected])[notselectedsinceload=true] .tab-label {${propertiesUnread}}`;
                const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
                const uri = Services.io.newURI(`data:text/css;charset=utf-8,${encodeURIComponent(css)}`);
                if (!sss.sheetRegistered(uri, sss.USER_SHEET)) {
                    sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
                }
            }
        },
        setup() {
            gBrowser.tabContainer.addEventListener("TabSelect", this);
        },
        handleEvent({ target }) {
            target.setAttribute("notselectedsinceload", "false");
        },
        destroy() {
            gBrowser.tabContainer.removeEventListener("TabSelect", this);
        },
    };

    // Run init on DOMContentLoaded (or immediately if already past that point)
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => handler.init(), { once: true });
    } else {
        handler.init();
    }

    // Run setup on load (or immediately if already loaded)
    if (document.readyState !== "complete") {
        window.addEventListener("load", () => handler.setup(), { once: true });
    } else {
        handler.setup();
    }

    // Register cleanup for when the script is unloaded (fx-autoconfig supports this)
    if (typeof _ucUtils !== "undefined" && _ucUtils.registerHotkey) {
        // fx-autoconfig doesn't have a universal unload hook in all versions,
        // but we can use window unload as fallback
    }
    window.addEventListener("unload", () => handler.destroy(), { once: true });
})();
