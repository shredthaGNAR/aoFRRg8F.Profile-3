/****************************************************************************
 * SECTION: SECUREFOX                                                       *
****************************************************************************/
/** TRACKING PROTECTION ***/
user_pref("browser.contentblocking.category", "strict");
user_pref("browser.download.start_downloads_in_tmp_dir", true);
user_pref("browser.uitour.enabled", false);
user_pref("privacy.globalprivacycontrol.enabled", true);

/** OCSP & CERTS / HPKP ***/
user_pref("security.OCSP.enabled", 0);
user_pref("privacy.antitracking.isolateContentScriptResources", true);
user_pref("security.csp.reporting.enabled", false);

/** SSL / TLS ***/
user_pref("security.ssl.treat_unsafe_negotiation_as_broken", true);
user_pref("browser.xul.error_pages.expert_bad_cert", true);
user_pref("security.tls.enable_0rtt_data", false);

/** DISK AVOIDANCE ***/
user_pref("browser.cache.disk.enable", true);
user_pref("browser.privatebrowsing.forceMediaMemoryCache", true);
user_pref("media.memory_cache_max_size", 65536);
user_pref("browser.sessionstore.interval", 60000);

/** SHUTDOWN & SANITIZING ***/
user_pref("privacy.history.custom", true);
user_pref("browser.privatebrowsing.resetPBM.enabled", true);

/** SPECULATIVE LOADING ***/
user_pref("network.http.speculative-parallel-limit", 0);
user_pref("network.dns.disablePrefetch", true);
user_pref("network.dns.disablePrefetchFromHTTPS", true);
user_pref("browser.urlbar.speculativeConnect.enabled", false);
user_pref("browser.places.speculativeConnect.enabled", false);
user_pref("network.prefetch-next", false);

/** SEARCH / URL BAR ***/
user_pref("browser.urlbar.trimHttps", false);
user_pref("browser.search.separatePrivateDefault.ui.enabled", true);
user_pref("browser.search.suggest.enabled", false);
user_pref("browser.urlbar.quicksuggest.enabled", true);
user_pref("browser.urlbar.groupLabels.enabled", false);
user_pref("browser.formfill.enable", true);
user_pref("network.IDN_show_punycode", true);

/** HTTPS-ONLY MODE ***/
user_pref("dom.security.https_only_mode", true);
user_pref("dom.security.https_only_mode_error_page_user_suggestions", true);

/** PASSWORDS ***/
user_pref("signon.formlessCapture.enabled", true);
user_pref("signon.privateBrowsingCapture.enabled", true);
user_pref("network.auth.subresource-http-auth-allow", 1);
user_pref("editor.truncate_user_pastes", false);

/** EXTENSIONS ***/
user_pref("extensions.enabledScopes", 5);

/** HEADERS / REFERERS ***/
user_pref("network.http.referer.XOriginTrimmingPolicy", 2);

/** CONTAINERS ***/
user_pref("privacy.userContext.ui.enabled", true);

/** VARIOUS ***/
user_pref("pdfjs.enableScripting", false);

/** SAFE BROWSING ***/
user_pref("browser.safebrowsing.downloads.remote.enabled", false);

/** TELEMETRY ***/
user_pref("toolkit.telemetry.archive.enabled", true);
user_pref("toolkit.telemetry.newProfilePing.enabled", true);
user_pref("toolkit.telemetry.shutdownPingSender.enabled", true);
user_pref("toolkit.telemetry.updatePing.enabled", true);
user_pref("toolkit.telemetry.bhrPing.enabled", true);
user_pref("toolkit.telemetry.firstShutdownPing.enabled", true);
user_pref("toolkit.telemetry.coverage.opt-out", true);
user_pref("toolkit.coverage.opt-out", true);
user_pref("browser.newtabpage.activity-stream.feeds.telemetry", false);
user_pref("browser.newtabpage.activity-stream.telemetry", false);
user_pref("datareporting.usage.uploadEnabled", false);

/** EXPERIMENTS ***/
user_pref("app.shield.optoutstudies.enabled", false);
user_pref("app.normandy.enabled", true);

/****************************************************************************
 * SECTION: PESKYFOX                                                        *
****************************************************************************/
/** MOZILLA UI ***/
user_pref("extensions.getAddons.showPane", false);
user_pref("extensions.htmlaboutaddons.recommendations.enabled", false);
user_pref("browser.discovery.enabled", true);
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons", true);
user_pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features", true);
user_pref("browser.preferences.moreFromMozilla", false);
user_pref("browser.aboutConfig.showWarning", false);
user_pref("browser.startup.homepage_override.mstone", "ignore");
user_pref("browser.aboutwelcome.enabled", false);
user_pref("browser.profiles.enabled", true);

/** THEME ADJUSTMENTS ***/
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref("browser.compactmode.show", true);
user_pref("browser.privateWindowSeparation.enabled", true);

/** AI ***/
user_pref("browser.ai.control.default", "blocked");
user_pref("browser.ml.enable", true);
user_pref("browser.ml.chat.enabled", true);
user_pref("browser.ml.chat.menu", true);
user_pref("browser.tabs.groups.smart.enabled", false);
user_pref("browser.ml.linkPreview.enabled", false);

/** FULLSCREEN NOTICE ***/
user_pref("full-screen-api.transition-duration.enter", "0 0");
user_pref("full-screen-api.transition-duration.leave", "0 0");
user_pref("full-screen-api.warning.timeout", 0);

/** URL BAR ***/
user_pref("browser.urlbar.trending.featureGate", false);

/** NEW TAB PAGE ***/
user_pref("browser.newtabpage.activity-stream.showSponsoredTopSites", false);
user_pref("browser.newtabpage.activity-stream.feeds.section.topstories", false);
user_pref("browser.newtabpage.activity-stream.showSponsored", false);
user_pref("browser.newtabpage.activity-stream.showSponsoredCheckboxes", false);

/** DOWNLOADS ***/
user_pref("browser.download.manager.addToRecentDocs", true);

/** PDF ***/
user_pref("browser.download.open_pdf_attachments_inline", true);

/** TAB BEHAVIOR ***/
user_pref("browser.bookmarks.openInTabClosesMenu", false);
user_pref("browser.menu.showViewImageInfo", true);
user_pref("findbar.highlightAll", true);
user_pref("layout.word_select.eat_space_to_next_word", false);


/****************************************************************************
 * SECTION: GENERAL                                                        *
****************************************************************************/

// PREF: initial paint delay
// How long FF will wait before rendering the page (in ms)
// [NOTE] You may prefer using 250.
// [NOTE] Dark Reader users may want to use 1000 [3].
// [1] https://bugzilla.mozilla.org/show_bug.cgi?id=1283302
// [2] https://docs.google.com/document/d/1BvCoZzk2_rNZx3u9ESPoFjSADRI0zIPeJRXFLwWXx_4/edit#heading=h.28ki6m8dg30z
// [3] https://old.reddit.com/r/firefox/comments/o0xl1q/reducing_cpu_usage_of_dark_reader_extension/
// [4] https://reddit.com/r/browsers/s/wvNB7UVCpx
user_pref("nglayout.initialpaint.delay", 250); // DEFAULT; formerly 250
//user_pref("nglayout.initialpaint.delay_in_oopif", 5); // DEFAULT

// PREF: Font rendering cache in Skia (32MB)
// Increases font cache size to improve performance on text-heavy websites.
// Especially beneficial for sites with many font faces or complex typography.
// [1] https://bugzilla.mozilla.org/show_bug.cgi?id=1239151#c2
user_pref("gfx.content.skia-font-cache-size", 32); // 32 MB; default=5; Chrome=20

// PREF: new tab preload
// [WARNING] Disabling this may cause a delay when opening a new tab in Firefox.
// [1] https://wiki.mozilla.org/Tiles/Technical_Documentation#Ping
// [2] https://github.com/arkenfox/user.js/issues/1556
user_pref("browser.newtab.preload", true); // DEFAULT

// PREF: control how tabs are loaded when a session is restored
// true=Tabs are not loaded until they are selected (default)
// false=Tabs begin to load immediately.
user_pref("browser.sessionstore.restore_on_demand", true); // DEFAULT
user_pref("browser.sessionstore.restore_pinned_tabs_on_demand", true);
user_pref("browser.sessionstore.restore_tabs_lazily", true); // DEFAULT

// PREF: disable preSkeletonUI on startup [WINDOWS]
user_pref("browser.startup.preXulSkeletonUI", false);

// PREF: lazy load iframes
user_pref("dom.iframe_lazy_loading.enabled", true); // DEFAULT [FF121+]

// PREF: Prioritized Task Scheduling API 
// [1] https://github.com/yokoffing/Betterfox/issues/355
// [2] https://blog.mozilla.org/performance/2022/06/02/prioritized-task-scheduling-api-is-prototyped-in-nightly/
// [3] https://medium.com/airbnb-engineering/building-a-faster-web-experience-with-the-posttask-scheduler-276b83454e91
// [4] https://github.com/WICG/scheduling-apis/blob/main/explainers/prioritized-post-task.md
// [5] https://wicg.github.io/scheduling-apis/
// [6] https://caniuse.com/mdn-api_taskcontroller
user_pref("dom.enable_web_task_scheduling", true); // DEFAULT [FF142+]

/****************************************************************************
 * SECTION: GFX RENDERING TWEAKS                                            *
****************************************************************************/

// PREF: Webrender tweaks
// [1] https://searchfox.org/mozilla-central/rev/6e6332bbd3dd6926acce3ce6d32664eab4f837e5/modules/libpref/init/StaticPrefList.yaml#6202-6219
// [2] https://hacks.mozilla.org/2017/10/the-whole-web-at-maximum-fps-how-webrender-gets-rid-of-jank/
// [3] https://www.reddit.com/r/firefox/comments/tbphok/is_setting_gfxwebrenderprecacheshaders_to_true/i0bxs2r/
// [4] https://www.reddit.com/r/firefox/comments/z5auzi/comment/ixw65gb?context=3
// [5] https://gist.github.com/RubenKelevra/fd66c2f856d703260ecdf0379c4f59db?permalink_comment_id=4532937#gistcomment-4532937
user_pref("gfx.webrender.all", true); // enables WR + additional features
user_pref("gfx.webrender.precache-shaders", true); // longer initial startup time
user_pref("gfx.webrender.compositor", true); // DEFAULT WINDOWS macOS
user_pref("gfx.webrender.compositor.force-enabled", true); // enforce

// PREF: Webrender layer compositor
// [1] https://bugzilla.mozilla.org/show_bug.cgi?id=1945683
// [2] https://www.reddit.com/r/firefox/comments/1p58qre/firefox_is_getting_ready_to_make_youtube_fast/
// [3] https://www.ghacks.net/2025/11/24/these-two-tweaks-should-improve-firefoxs-performance-on-youtube-significantly/
user_pref("gfx.webrender.layer-compositor", true);
    // If your PC uses an AMD GPU, you might want to make a second change.
    // This one improves CPU usage on AMD systems.
user_pref("media.wmf.zero-copy-nv12-textures-force-enabled", true);

// PREF: GPU-accelerated Canvas2D
// Uses Accelerated Canvas2D for hardware acceleration of Canvas2D.
// This provides a consistent acceleration architecture across all platforms
// by utilizing WebGL instead of relying upon Direct2D.
// [WARNING] May cause issues on some Windows machines using integrated GPUs [2] [3]
// Add to your overrides if you have a dedicated GPU.
// [NOTE] Higher values will use more memory.
// [1] https://bugzilla.mozilla.org/show_bug.cgi?id=1741501
// [2] https://github.com/yokoffing/Betterfox/issues/153
// [3] https://github.com/yokoffing/Betterfox/issues/198
user_pref("gfx.canvas.accelerated", true); // [DEFAULT FF133+]
//user_pref("gfx.canvas.accelerated.cache-items", 4096); // [default=8192 FF135+]; Chrome=4096
//user_pref("gfx.canvas.accelerated.cache-size", 512); // default=256; Chrome=512
//user_pref("gfx.canvas.max-size", 32767); // DEFAULT=32767

// PREF: WebGL
//user_pref("webgl.max-size", 16384); // default=1024
user_pref("webgl.force-enabled", true);

/****************************************************************************
 * SECTION: DISK CACHE                                                     *
****************************************************************************/

// PREF: disk cache size
// [1] https://bugzilla.mozilla.org/buglist.cgi?bug_id=913808,968106,968101
// [2] https://rockridge.hatenablog.com/entry/2014/09/15/165501
// [3] https://www.reddit.com/r/firefox/comments/17oqhw3/firefox_and_ssd_disk_consumption/
user_pref("browser.cache.disk.smart_size.enabled", true); 

// PREF: cache memory pool
// Cache v2 provides a memory pool that stores metadata (such as response headers)
// for recently read cache entries [1]. It is managed by a cache thread, and caches with
// metadata in the pool appear to be reused immediately.
// [1] https://bugzilla.mozilla.org/buglist.cgi?bug_id=986179
//user_pref("browser.cache.disk.metadata_memory_limit", 16384); // default=250 (0.25 MB); limit of recent metadata we keep in memory for faster access

user_pref("browser.cache.frecency_half_life_hours", 6); // DEFAULT
//user_pref("browser.cache.disk.free_space_soft_limit", 10240); // default=5120 (5 MB)
//user_pref("browser.cache.disk.free_space_hard_limit", 2048); // default=1024 (1 MB)

// PREF: compression level for cached JavaScript bytecode [FF102+]
// [1] https://github.com/yokoffing/Betterfox/issues/247
// 0 = do not compress (default)
// 1 = minimal compression
// 9 = maximal compression
user_pref("browser.cache.jsbc_compression_level", 0);

/****************************************************************************
 * SECTION: MEMORY CACHE                                                   *
****************************************************************************/

// PREF: memory cache
// The "automatic" size selection (default) is based on a decade-old table
// that only contains settings for systems at or below 8GB of system memory [1].
// Waterfox G6 allows it to go above 8GB machines [3].
// Value can be up to the max size of an unsigned 64-bit integer.
// -1 = Automatically decide the maximum memory to use to cache decoded images,
// messages, and chrome based on the total amount of RAM
// For machines with 8GB+ RAM, that equals 32768 kb = 32 MB
// [1] https://kb.mozillazine.org/Browser.cache.memory.capacity#-1
// [2] https://searchfox.org/mozilla-central/source/netwerk/cache2/CacheObserver.cpp#94-125
// [3] https://github.com/WaterfoxCo/Waterfox/commit/3fed16932c80a2f6b37d126fe10aed66c7f1c214
user_pref("browser.cache.memory.capacity", 131072); // 128 MB RAM cache; alt=65536 (65 MB RAM cache); default=32768
user_pref("browser.cache.memory.max_entry_size", 20480); // 20 MB max entry; default=5120 (5 MB)

// PREF: amount of Back/Forward cached pages stored in memory for each tab
// Pages that were recently visited are stored in memory in such a way
// that they don't have to be re-parsed. This improves performance
// when pressing Back and Forward. This pref limits the maximum
// number of pages stored in memory. If you are not using the Back
// and Forward buttons that much, but rather using tabs, then there
// is no reason for Firefox to keep memory for this.
// -1=determine automatically (8 pages)
// [1] https://kb.mozillazine.org/Browser.sessionhistory.max_total_viewers#Possible_values_and_their_effects
user_pref("browser.sessionhistory.max_total_viewers", 8); // default=8
user_pref("browser.sessionstore.max_tabs_undo", 10); // default=25
user_pref("browser.sessionstore.max_entries", 10); // [HIDDEN OR REMOVED]
user_pref("dom.storage.default_quota", 20480); // 20MB; default=5120
user_pref("dom.storage.shadow_writes", true);

/****************************************************************************
 * SECTION: MEDIA CACHE                                                     *
****************************************************************************/

// PREF: media disk cache
user_pref("media.cache_size", 512000); // DEFAULT

// PREF: media cache combine sizes
//user_pref("media.memory_caches_combined_limit_kb", 1048576); // 1GB; default=524288
//user_pref("media.memory_caches_combined_limit_pc_sysmem", 5); // DEFAULT; alt=10; the percentage of system memory that Firefox can use for media caches

// PREF: Media Source Extensions (MSE) web standard
// Disabling MSE allows videos to fully buffer, but you're limited to 720p.
// [WARNING] Disabling MSE may break certain videos.
// false=Firefox plays the old WebM format
// true=Firefox plays the new WebM format (default)
// [1] https://support.mozilla.org/en-US/questions/1008271
user_pref("media.mediasource.enabled", true); // DEFAULT

/****************************************************************************
 * SECTION: IMAGE CACHE                                                     *
****************************************************************************/

// PREF: image cache
//user_pref("image.cache.size", 10485760); // (cache images up to 10MiB in size) [DEFAULT 5242880]
//user_pref("image.mem.decode_bytes_at_a_time", 65536); // default=16384; alt=32768; chunk size for calls to the image decoders
//user_pref("image.mem.max_decoded_image_kb", 512000); // 500MB [HIDDEN OR REMOVED?]

// PREF: set minimum timeout to unmap shared surfaces since they have been last used
// [NOTE] This is only used on 32-bit builds of Firefox where there is meaningful
// virtual address space pressure.
// [1] https://phabricator.services.mozilla.com/D109440
// [2] https://bugzilla.mozilla.org/show_bug.cgi?id=1699224
//user_pref("image.mem.shared.unmap.min_expiration_ms", 120000); // default=60000; minimum timeout to unmap shared surfaces since they have been last used

/****************************************************************************
 * SECTION: NETWORK                                                         *
****************************************************************************/

// PREF: use bigger packets
// [WARNING] Cannot open HTML files bigger than 4MB if value is too large [2].
// Reduce Firefox's CPU usage by requiring fewer application-to-driver data transfers.
// However, it does not affect the actual packet sizes transmitted over the network.
// [1] https://www.mail-archive.com/support-seamonkey@lists.mozilla.org/msg74561.html
// [2] https://github.com/yokoffing/Betterfox/issues/279
// [3] https://ra1ahq.blog/en/optimizaciya-proizvoditelnosti-mozilla-firefox
user_pref("network.buffer.cache.size", 65535); // default=32768 (32 kb); 262144 too large
user_pref("network.buffer.cache.count", 48); // default=24; 128 too large

// PREF: increase the absolute number of HTTP connections
// [1] https://kb.mozillazine.org/Network.http.max-connections
// [2] https://kb.mozillazine.org/Network.http.max-persistent-connections-per-server
// [3] https://www.reddit.com/r/firefox/comments/11m2yuh/how_do_i_make_firefox_use_more_of_my_900_megabit/jbfmru6/
user_pref("network.http.max-connections", 1800); // default=900
user_pref("network.http.max-persistent-connections-per-server", 10); // default=6; download connections; anything above 10 is excessive
user_pref("network.http.max-urgent-start-excessive-connections-per-host", 5); // default=3
user_pref("network.http.max-persistent-connections-per-proxy", 48); // default=32
user_pref("network.http.request.max-start-delay", 5); // default=10
user_pref("network.websocket.max-connections", 200); // DEFAULT

// PREF: pacing requests [FF23+]
// Controls how many HTTP requests are sent at a time.
// Pacing HTTP requests can have some benefits, such as reducing network congestion,
// improving web page loading speed, and avoiding server overload.
// Pacing requests adds a slight delay between requests to throttle them.
// If you have a fast machine and internet connection, disabling pacing
// may provide a small speed boost when loading pages with lots of requests.
// false = Firefox will send as many requests as possible without pacing
// true = Firefox will pace requests (default)
user_pref("network.http.pacing.requests.enabled", false);
user_pref("network.http.pacing.requests.min-parallelism", 10); // default=6
user_pref("network.http.pacing.requests.burst", 32); // default=10

// PREF: increase DNS cache
// [1] https://developer.mozilla.org/en-US/docs/Web/Performance/Understanding_latency
user_pref("network.dnsCacheEntries", 10000); // default=800

// PREF: adjust DNS expiration time
// [ABOUT] about:networking#dns
// [NOTE] These prefs will be ignored by DNS resolver if using DoH/TRR.
user_pref("network.dnsCacheExpiration", 3600); // keep entries for 1 hour; default=60
user_pref("network.dnsCacheExpirationGracePeriod", 120); // default=60; cache DNS entries for 2 minutes after they expire

// PREF: the number of threads for DNS
//user_pref("network.dns.max_high_priority_threads", 40); // DEFAULT [FF 123?]
//user_pref("network.dns.max_any_priority_threads", 24); // DEFAULT [FF 123?]

// PREF: increase TLS token caching 
user_pref("network.ssl_tokens_cache_capacity", 10240); // default=2048; more TLS token caching (fast reconnects)

/****************************************************************************
 * SECTION: EXPERIMENTAL                                                    *
****************************************************************************/

// PREF: CSS Masonry Layout [NIGHTLY]
// [1] https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout/Masonry_Layout
// [2] https://www.smashingmagazine.com/native-css-masonry-layout-css-grid/
user_pref("layout.css.grid-template-masonry-value.enabled", true);

/****************************************************************************
 * SECTION: TAB UNLOAD                                                      *
****************************************************************************/

// PREF: unload tabs on low memory
// [ABOUT] about:unloads
// Firefox will detect if your computer’s memory is running low (less than 200MB)
// and suspend tabs that you have not used in awhile.
// [1] https://support.mozilla.org/en-US/kb/unload-inactive-tabs-save-system-memory-firefox
// [2] https://hacks.mozilla.org/2021/10/tab-unloading-in-firefox-93/
user_pref("browser.tabs.unloadOnLowMemory", true); // DEFAULT


// PREF: determine how long (in ms) tabs are inactive before they unload
// 60000=1min; 300000=5min; 600000=10min (default)
user_pref("browser.tabs.min_inactive_duration_before_unload", 300000); // 5min; default=600000

/****************************************************************************
 * SECTION: PROCESS COUNT                                                  *
****************************************************************************/

// PREF: process count
// [ABOUT] View in about:processes.
// With Firefox Quantum (2017), CPU cores = processCount. However, since the
// introduction of Fission [2], the number of website processes is controlled
// by processCount.webIsolated. Disabling fission.autostart or changing
// fission.webContentIsolationStrategy reverts control back to processCount.
// [1] https://www.reddit.com/r/firefox/comments/r69j52/firefox_content_process_limit_is_gone/
// [2] https://firefox-source-docs.mozilla.org/dom/ipc/process_model.html#web-content-processes 
user_pref("dom.ipc.processCount", 8); // DEFAULT; Shared Web Content
user_pref("dom.ipc.processCount.webIsolated", 4); // default=4; Isolated Web Content
user_pref("dom.ipc.keepProcessesAlive.web", 1); // default=1 [HIDDEN OR REMOVED]

// PREF: use one process for process preallocation cache
user_pref("dom.ipc.processPrelaunch.fission.number", 3); // default=3; Process Preallocation Cache

// OPTION 1: isolate all websites
// Web content is always isolated into its own `webIsolated` content process
// based on site-origin, and will only load in a shared `web` content process
// if site-origin could not be determined.
user_pref("fission.webContentIsolationStrategy", 1); // DEFAULT
user_pref("browser.preferences.defaultPerformanceSettings.enabled", true); // DEFAULT
user_pref("dom.ipc.processCount.webIsolated", 1); // one process per site origin

// OPTION 2: isolate only "high value" websites
// Only isolates web content loaded by sites which are considered "high
// value". A site is considered high value if it has been granted a
// `highValue*` permission by the permission manager, which is done in
// response to certain actions.
//user_pref("fission.webContentIsolationStrategy", 2);
//user_pref("browser.preferences.defaultPerformanceSettings.enabled", false);
//user_pref("dom.ipc.processCount.webIsolated", 1); // one process per site origin (high value)
user_pref("dom.ipc.processCount", 8); // determine by number of CPU cores/processors

// OPTION 3: do not isolate websites
// All web content is loaded into a shared `web` content process. This is
// similar to the non-Fission behavior; however, remote subframes may still
// be used for sites with special isolation behavior, such as extension or
// mozillaweb content processes.
//user_pref("fission.webContentIsolationStrategy", 0);
//user_pref("browser.preferences.defaultPerformanceSettings.enabled", false);
//user_pref("dom.ipc.processCount", 8); // determine by number of CPU cores/processors

/****************************************************************************************
 * OPTION: INSTANT SCROLLING (SIMPLE ADJUSTMENT)                                       *
****************************************************************************************/
// recommended for 60hz+ displays
//user_pref("apz.overscroll.enabled", true); // DEFAULT NON-LINUX
//user_pref("general.smoothScroll", true); // DEFAULT
//user_pref("mousewheel.default.delta_multiplier_y", 275); // 250-400; adjust this number to your liking
// Firefox Nightly only:
// [1] https://bugzilla.mozilla.org/show_bug.cgi?id=1846935
user_pref("general.smoothScroll.msdPhysics.enabled", true); // [FF122+ Nightly]

/****************************************************************************************
 * OPTION: NATURAL SMOOTH SCROLLING V3 [MODIFIED]                                      *
****************************************************************************************/
// credit: https://github.com/AveYo/fox/blob/cf56d1194f4e5958169f9cf335cd175daa48d349/Natural%20Smooth%20Scrolling%20for%20user.js
// recommended for 120hz+ displays
// largely matches Chrome flags: Windows Scrolling Personality and Smooth Scrolling
user_pref("apz.overscroll.enabled", true); // DEFAULT NON-LINUX
user_pref("general.smoothScroll", true); // DEFAULT
user_pref("general.smoothScroll.msdPhysics.continuousMotionMaxDeltaMS", 12);
user_pref("general.smoothScroll.msdPhysics.enabled", true);
user_pref("general.smoothScroll.msdPhysics.motionBeginSpringConstant", 600);
user_pref("general.smoothScroll.msdPhysics.regularSpringConstant", 650);
user_pref("general.smoothScroll.msdPhysics.slowdownMinDeltaMS", 25);
user_pref("general.smoothScroll.msdPhysics.slowdownMinDeltaRatio", "2");
user_pref("general.smoothScroll.msdPhysics.slowdownSpringConstant", 250);
user_pref("general.smoothScroll.currentVelocityWeighting", "1");
user_pref("general.smoothScroll.stopDecelerationWeighting", "1");
user_pref("mousewheel.default.delta_multiplier_y", 400); // 250-400; adjust this number to your liking
user_pref("security.allow_unsafe_dangerous_privileged_evil_eval", true);
user_pref("toolkit.telemetry.enabled", false);
user_pref("browser.discovery.enabled", false);
user_pref("app.shield.optoutstudies.enabled", false);
user_pref(
  "datareporting.healthreport.documentServerURI",
  "http://%(server)s/healthreport/",
);
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);
user_pref("browser.crashReports.unsubmittedCheck.autoSubmit2", false);
z;
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref("browser.proton.places-tooltip.enabled", true);
user_pref("layout.css.moz-document.content.enabled", true);
user_pref("browser.startup.blankWindow", false);
user_pref("browser.startup.preXulSkeletonUI", false);
// required for icons with data URLs
user_pref("svg.context-properties.content.enabled", true);
// required for acrylic gaussian blur
user_pref("layout.css.backdrop-filter.enabled", true);
// enable browser dark mode
user_pref("ui.systemUsesDarkTheme", 1);
// enable content dark mode
user_pref("layout.css.prefers-color-scheme.content-override", 1);
//// avoid native styling
user_pref("browser.display.windows.non_native_menus", 1);
user_pref("widget.content.allow-gtk-dark-theme", true);
// make sure the tab bar is in the titlebar on Linux
user_pref("browser.tabs.inTitlebar", 1);
////
// avoid custom menulist/select styling
user_pref("dom.forms.select.customstyling", false);
// keep "all tabs" menu available at all times, useful for all tabs menu
// expansion pack
user_pref("browser.tabs.tabmanager.enabled", true);
// disable urlbar result group labels since we don't use them
user_pref("browser.urlbar.groupLabels.enabled", false);
// allow urlbar result menu buttons without slowing down tabbing through results
user_pref("browser.urlbar.resultMenu.keyboardAccessible", true);
// Background for selected <option> elements and others
user_pref("ui.selecteditem", "#8f4ff0a4");
// Text color for selected <option> elements and others
user_pref("ui.selecteditemtext", "#FFFFFFCC");
user_pref("ui.infotext", "#FFFFFF");
user_pref("ui.infobackground", "#hsla(266, 86%, 28%, 0.625)");
////

// ⚠️ REQUIRED on macOS
user_pref("widget.macos.native-context-menus", true);
user_pref("xpinstall.signatures.required", false);
user_pref("extensions.autoDisableScopes", 0);
user_pref("browser.shell.checkDefaultBrowser", true);
user_pref("browser.startup.homepage_override.mstone", "ignore");
user_pref("browser.display.use_system_colors", false);
user_pref("browser.privatebrowsing.enable-new-indicator", true);
user_pref("accessibility.mouse_focuses_formcontrol", 1);
user_pref("browser.tabs.tabMinWidth", 76);
user_pref("browser.urlbar.accessibility.tabToSearch.announceResults", false);
// disable large urlbar suggestions for now. they are styled so this is not
// required, but I don't find them useful since they only seem to appear when
// the urlbar is empty and search engine is set to google.
user_pref("browser.urlbar.richSuggestions.featureGate", true);
// but enable the rich one-line suggestions that appear when typing long search
// terms and guess an end to the sentence
user_pref("browser.urlbar.richSuggestions.tail", true);
user_pref("browser.urlbar.suggest.quicksuggest.nonsponsored", true);
user_pref("browser.urlbar.suggest.quicksuggest.sponsored", false);
user_pref("browser.urlbar.trimURLs", false);
// hide fullscreen enter/exit warning
user_pref("full-screen-api.transition-duration.enter", "0 0");
user_pref("full-screen-api.transition-duration.leave", "0 0");
user_pref("full-screen-api.warning.delay", -1);
user_pref("full-screen-api.warning.timeout", 0);
// whether to show content dialogs within tabs or above tabs
user_pref("prompts.contentPromptSubDialog", true);
// when using the keyboard to navigate menus, skip past disabled items
user_pref("ui.skipNavigatingDisabledMenuItem", 1);
user_pref("ui.prefersReducedMotion", 0);
// reduce the delay before showing submenus (e.g. View > Toolbars)
user_pref("ui.submenuDelay", 100);
// the delay before a tooltip appears when hovering an element (default 300ms)
user_pref("ui.tooltipDelay", 300);
// should pressing the Alt key alone focus the menu bar?
user_pref("ui.key.menuAccessKeyFocuses", false);
// reduce update frequency
user_pref("app.update.suppressPrompts", true);
user_pref("widget.non-native-theme.scrollbar.style", 4);
user_pref("widget.non-native-theme.win.scrollbar.use-system-size", false);
user_pref("widget.non-native-theme.scrollbar.size.override", 8);
user_pref("widget.non-native-theme.gtk.scrollbar.thumb-size", "0.818");
//user_pref("browser.theme.content-theme", 0);
//user_pref("browser.theme.toolbar-theme", 0);
user_pref("browser.display.background_color.dark", "#19191b");
user_pref("ui.highlight", "hsla(245, 100%, 70%, 0.55)");
user_pref("ui.highlighttext", "#ffffff");
user_pref("ui.textSelectDisabledBackground", "hsla(243, 35%, 65%, 0.45)");
user_pref("ui.textHighlightBackground", "hsla(245, 100%, 70%, 0.55)");
user_pref("ui.textHighlightForeground", "#FFFFFF");
user_pref("ui.textSelectAttentionBackground", "hsla(335, 100%, 60%, 0.65)");
user_pref("ui.textSelectAttentionForeground", "#FFFFFF");
//// spell check style
user_pref("ui.SpellCheckerUnderline", "#E2467A");
user_pref("ui.SpellCheckerUnderlineStyle", 3);
user_pref("ui.IMERawInputBackground", "#000000");
user_pref("ui.IMESelectedRawTextBackground", "hsla(245, 100%, 70%, 0.55)");
// about:reader dark mode
user_pref("reader.color_scheme", "dark");
user_pref("layout.css.font-visibility.private", 3);
user_pref("layout.css.font-visibility.resistFingerprinting", 3);
user_pref("userChrome.tabs.pinned-tabs.close-buttons.disabled", true);
user_pref("userChrome.urlbar-results.hide-help-button", true);
// add a drop shadow on menupopup and panel elements (e.g. context menus)
user_pref("userChrome.css.menupopup-shadows", true);
user_pref("userChrome.tabs.all-tabs-menu.reverse-order", true);
// turn bookmarks on the toolbar into small square buttons with no text labels
user_pref("userChrome.bookmarks-toolbar.icons-only", false);
// replace UI font with SF Pro, the system font for macOS.
// recommended for all operating systems, but not required.
// must have the fonts installed. check the repo's readme for more details.
user_pref("userChrome.css.mac-ui-fonts", false);
// custom wikipedia dark mode theme
user_pref("userChrome.css.wikipedia.dark-theme-enabled", false);