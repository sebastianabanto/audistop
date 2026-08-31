// AudiStop — service worker (Manifest V3).
//
// Core idea: the browser tells us, per tab, whether it is producing sound
// (tab.audible). When a tab starts playing, we pause the <video>/<audio> of the
// other tabs that apply according to the selected mode.

const DEFAULTS = {
  enabled: true,
  mode: "all",     // "all" = any tab pauses the rest; "sites" = only between the listed sites.
  sites: [],       // participating domains when mode === "sites" (e.g. "example.com").
  exceptions: []   // domains whose sound never pauses other tabs (e.g. "web.whatsapp.com").
};

async function getSettings() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  // Normalize in case storage is incomplete.
  return {
    enabled: s.enabled !== false,
    mode: s.mode === "sites" ? "sites" : "all",
    sites: Array.isArray(s.sites) ? s.sites : [],
    exceptions: Array.isArray(s.exceptions) ? s.exceptions : []
  };
}

// Extracts the domain (without "www.") from a URL; "" if not applicable (chrome://, etc.).
function domainOf(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.startsWith("www.") ? h.slice(4) : h;
  } catch {
    return "";
  }
}

// Is the tab's domain covered by the site list? Matches by suffix so that
// "example.com" also covers "sub.example.com", while each entry is compared
// either exactly or as a suffix.
function siteMatches(domain, sites) {
  if (!domain) return false;
  return sites.some(entry => {
    const e = entry.toLowerCase().trim();
    if (!e) return false;
    return domain === e || domain.endsWith("." + e);
  });
}

// Injected INTO the tab to pause: stops every media element that is playing.
function pauseAllMediaInPage() {
  let paused = 0;
  for (const m of document.querySelectorAll("video, audio")) {
    try {
      if (!m.paused && !m.ended) { m.pause(); paused++; }
    } catch (e) { /* ignore */ }
  }
  return paused;
}

async function pauseTab(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: pauseAllMediaInPage
    });
  } catch (e) {
    // Pages we cannot inject into (browser store, internal pages, PDFs, etc.).
    // Nothing to do there; silently ignored.
  }
}

// Core: a "trigger" tab started playing → pause the other applicable tabs.
async function enforce(triggerTab) {
  const settings = await getSettings();
  if (!settings.enabled) return;

  const triggerDomain = domainOf(triggerTab.url);

  // Exception sites never trigger a pause of other tabs (e.g. brief notification sounds).
  if (siteMatches(triggerDomain, settings.exceptions)) return;

  // In "sites" mode the trigger must belong to the managed set; otherwise do nothing.
  if (settings.mode === "sites" && !siteMatches(triggerDomain, settings.sites)) return;

  // Every tab that is currently producing sound.
  const audible = await chrome.tabs.query({ audible: true });

  for (const other of audible) {
    if (other.id === triggerTab.id) continue;
    if (other.mutedInfo && other.mutedInfo.muted) continue;

    if (settings.mode === "sites") {
      const d = domainOf(other.url);
      if (!siteMatches(d, settings.sites)) continue;
    }
    await pauseTab(other.id);
  }
}

// Fires when a tab's audio state changes. We react only to the transition
// "started playing" (audible === true).
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.audible === true) {
    enforce(tab);
  }
});

// Default values on install.
chrome.runtime.onInstalled.addListener(async () => {
  const cur = await chrome.storage.sync.get(DEFAULTS);
  await chrome.storage.sync.set({ ...DEFAULTS, ...cur });
});
