const DEFAULTS = { enabled: true, mode: "all", sites: [] };

const el = {
  enabled: document.getElementById("enabled"),
  modeRadios: () => document.querySelectorAll('input[name="mode"]'),
  sitesPanel: document.getElementById("sitesPanel"),
  addCurrent: document.getElementById("addCurrent"),
  siteList: document.getElementById("siteList"),
  sitesEmpty: document.getElementById("sitesEmpty"),
  status: document.getElementById("status")
};

let state = { ...DEFAULTS };

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
    sites: Array.isArray(s.sites) ? s.sites : []
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

  // Lista de sitios.
  el.siteList.innerHTML = "";
  for (const d of state.sites) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = d;
    const rm = document.createElement("button");
    rm.className = "rm";
    rm.textContent = "×";
    rm.title = "Quitar";
    rm.addEventListener("click", () => {
      state.sites = state.sites.filter(x => x !== d);
      save();
    });
    li.appendChild(span);
    li.appendChild(rm);
    el.siteList.appendChild(li);
  }
  el.sitesEmpty.style.display = state.sites.length >= 2 ? "none" : "block";

  // Estado.
  if (!state.enabled) {
    el.status.textContent = "Desactivado.";
  } else if (state.mode === "all") {
    el.status.textContent = "Activo · una pestaña a la vez.";
  } else {
    el.status.textContent = state.sites.length >= 2
      ? `Activo · entre ${state.sites.length} sitios.`
      : "Activo · faltan sitios por añadir.";
  }
}

// ---- Eventos ----

el.enabled.addEventListener("change", () => { state.enabled = el.enabled.checked; save(); });

for (const r of el.modeRadios()) {
  r.addEventListener("change", () => {
    if (r.checked) { state.mode = r.value; save(); }
  });
}

el.addCurrent.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const d = domainOf(tab && tab.url);
  if (!d) { el.status.textContent = "Esta pestaña no tiene un dominio válido."; return; }
  if (!state.sites.includes(d)) state.sites.push(d);
  await save();
});

load();
