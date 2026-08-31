const DEFAULTS = { enabled: true, mode: "all", sites: [], exceptions: [] };

const t = (key, subs) => chrome.i18n.getMessage(key, subs);

const el = {
  enabled: document.getElementById("enabled"),
  modeRadios: () => document.querySelectorAll('input[name="mode"]'),
  sitesPanel: document.getElementById("sitesPanel"),
  addCurrent: document.getElementById("addCurrent"),
  siteList: document.getElementById("siteList"),
  sitesEmpty: document.getElementById("sitesEmpty"),
  addCurrentException: document.getElementById("addCurrentException"),
  exceptionList: document.getElementById("exceptionList"),
  exceptionsEmpty: document.getElementById("exceptionsEmpty"),
  status: document.getElementById("status")
};

let state = { ...DEFAULTS };

// Fills every [data-i18n]/[data-i18n-title] element with the localized string.
// The browser picks the locale automatically (falls back to English).
function localize() {
  document.documentElement.lang = chrome.i18n.getUILanguage();
  for (const node of document.querySelectorAll("[data-i18n]")) {
    const msg = t(node.dataset.i18n);
    if (msg) node.textContent = msg;
  }
  for (const node of document.querySelectorAll("[data-i18n-title]")) {
    const msg = t(node.dataset.i18nTitle);
    if (msg) node.title = msg;
  }
}

function domainOf(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.startsWith("www.") ? h.slice(4) : h;
  } catch { return ""; }
}

async function load() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  state = {
    enabled: s.enabled !== false,
    mode: s.mode === "sites" ? "sites" : "all",
    sites: Array.isArray(s.sites) ? s.sites : [],
    exceptions: Array.isArray(s.exceptions) ? s.exceptions : []
  };
  render();
}

async function save() {
  await chrome.storage.sync.set(state);
  render();
}

function render() {
  el.enabled.checked = state.enabled;
  document.body.classList.toggle("disabled", !state.enabled);

  for (const r of el.modeRadios()) r.checked = (r.value === state.mode);
  el.sitesPanel.classList.toggle("hidden", state.mode !== "sites");

  // Site list.
  el.siteList.innerHTML = "";
  for (const d of state.sites) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = d;
    const rm = document.createElement("button");
    rm.className = "rm";
    rm.textContent = "×";
    rm.title = t("removeTitle");
    rm.addEventListener("click", () => {
      state.sites = state.sites.filter(x => x !== d);
      save();
    });
    li.appendChild(span);
    li.appendChild(rm);
    el.siteList.appendChild(li);
  }
  el.sitesEmpty.style.display = state.sites.length >= 2 ? "none" : "block";

  // Exception list.
  el.exceptionList.innerHTML = "";
  for (const d of state.exceptions) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = d;
    const rm = document.createElement("button");
    rm.className = "rm";
    rm.textContent = "×";
    rm.title = t("removeTitle");
    rm.addEventListener("click", () => {
      state.exceptions = state.exceptions.filter(x => x !== d);
      save();
    });
    li.appendChild(span);
    li.appendChild(rm);
    el.exceptionList.appendChild(li);
  }
  el.exceptionsEmpty.style.display = state.exceptions.length > 0 ? "none" : "block";

  // Status line.
  if (!state.enabled) {
    el.status.textContent = t("statusDisabled");
  } else if (state.mode === "all") {
    el.status.textContent = t("statusAllTabs");
  } else {
    el.status.textContent = state.sites.length >= 2
      ? t("statusBetweenSites", [String(state.sites.length)])
      : t("statusAddMoreSites");
  }
}

// ---- Events ----

el.enabled.addEventListener("change", () => { state.enabled = el.enabled.checked; save(); });

for (const r of el.modeRadios()) {
  r.addEventListener("change", () => {
    if (r.checked) { state.mode = r.value; save(); }
  });
}

el.addCurrent.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const d = domainOf(tab && tab.url);
  if (!d) { el.status.textContent = t("invalidDomain"); return; }
  if (!state.sites.includes(d)) state.sites.push(d);
  await save();
});

el.addCurrentException.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const d = domainOf(tab && tab.url);
  if (!d) { el.status.textContent = t("invalidDomain"); return; }
  if (!state.exceptions.includes(d)) state.exceptions.push(d);
  await save();
});

localize();
load();
