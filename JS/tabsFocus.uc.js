// ==UserScript==
// @name           Tab Hover Switch
// @description    Switch tabs on hover with optional preview mode and click-to-reload
// @include        main
// @onlyonce
// ==/UserScript==

(async (
    delay = 3000,
    clickreloadtab = false,
    previewmode = false,
    returndelay = 50,
) => {
    const handler = {
        init() {
            this.tid = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
            this.type = this.tid.TYPE_ONE_SHOT;
            var tabs = this.tabs = gBrowser.tabContainer;
            if (clickreloadtab) this.reload = document.querySelector("commandset#mainCommandSet > command[id='Browser:Reload']");

            if (previewmode) {
                this.pwTid = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
                this.onMouseIn = this._onMouseIn;
                this.onMouseOut = this._onMouseOut;
                this.onMouseDown = this._onMouseDown;
                this.onTabCloseHide = this.onTabCloseHide.bind(this);
                tabs.addEventListener("TabClose", this.onTabCloseHide);
                tabs.addEventListener("TabHide", this.onTabCloseHide);
                this.onTabSelect = this.onTabSelect.bind(this);
                tabs.addEventListener("TabSelect", this.onTabSelect);
                this.pwTab = gBrowser.selectedTab;
            }

            this.onMouseIn = this.onMouseIn.bind(this);
            tabs.addEventListener("mouseover", this.onMouseIn);
            this.onMouseOut = this.onMouseOut.bind(this);
            tabs.addEventListener("mouseout", this.onMouseOut);
            this.onMouseDown = this.onMouseDown.bind(this);
            tabs.addEventListener("mousedown", this.onMouseDown, true);
        },
        destructor() {
            var { tabs } = this;
            tabs.removeEventListener("mouseover", this.onMouseIn);
            tabs.removeEventListener("mouseout", this.onMouseOut);
            tabs.removeEventListener("mousedown", this.onMouseDown, true);
            if (!previewmode) return;
            tabs.removeEventListener("TabClose", this.onTabCloseHide);
            tabs.removeEventListener("TabHide", this.onTabCloseHide);
            tabs.removeEventListener("TabSelect", this.onTabSelect);
        },
        callback(e) {
            var tab = e.target.closest?.("tab:not([selected])");
            if (tab) gBrowser.selectedTab = tab;
        },
        previewCallback() {
            gBrowser.selectedTab = this.pwTab;
        },
        onMouseIn(e) {
            this.tid.initWithCallback(() => this.callback(e), delay, this.type);
        },
        _onMouseIn(e) {
            this.pwTid.cancel();
            this.tid.initWithCallback(() => this.callback(e), delay, this.type);
        },
        onMouseOut() {
            this.tid.cancel();
        },
        _onMouseOut() {
            this.tid.cancel();
            this.pwTid.initWithCallback(() => this.previewCallback(), returndelay, this.type);
        },
        onMouseDown(e) {
            this.tid.cancel();
            var tab = e.target.closest?.("tab[selected]");
            if (!tab) return;
            if (clickreloadtab && e.button === 0
                && e.composedTarget.matches?.("tab :not(toolbarbutton, image:not(.tab-icon-image)):scope")) this.reload.doCommand();
        },
        _onMouseDown(e) {
            this.tid.cancel();
            this.pwTid.cancel();
            var tab = e.target.closest?.("tab[selected]");
            if (!tab) return;
            if (clickreloadtab && e.button === 0 && this.pwTab == tab
                && e.composedTarget.matches?.("tab :not(toolbarbutton, image:not(.tab-icon-image)):scope")) this.reload.doCommand();
            this.pwTab = tab;
        },
        onTabCloseHide(e) {
            if (e.target == this.pwTab) this.pwTab = gBrowser.selectedTab;
        },
        onTabSelect(e) {
            if (!this.tid.callback) this.pwTab = e.target;
        },
    };

    // Wait for load event if not already loaded
    if (document.readyState !== "complete") {
        await new Promise(resolve => window.addEventListener("load", resolve, { once: true }));
    }

    handler.init();

    // Cleanup on window unload
    window.addEventListener("unload", () => handler.destructor(), { once: true });
})();
