// AudiStop — service worker (Manifest V3).
//
// Idea central: el navegador nos dice, por pestaña, si está emitiendo sonido
// (tab.audible). Cuando una pestaña empieza a sonar, pausamos el <video>/<audio>
// de las demás pestañas que correspondan según el modo elegido.

const DEFAULTS = {
  enabled: true,
  mode: "all",   // "all" = cualquier pestaña pausa a las demás; "sites" = solo entre los sitios de la lista.
  sites: []      // dominios participantes cuando mode === "sites" (ej. "youtube.com", "music.youtube.com").
};

async function getSettings() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  // Normaliza por si el storage viene incompleto.
  return {
    enabled: s.enabled !== false,
    mode: s.mode === "sites" ? "sites" : "all",
    sites: Array.isArray(s.sites) ? s.sites : []
  };
}

// Extrae el dominio (sin "www.") de una URL; "" si no aplica (chrome://, etc.).
function domainOf(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.startsWith("www.") ? h.slice(4) : h;
  } catch {
    return "";
  }
}

// ¿El dominio de la pestaña está cubierto por la lista de sitios?
// Coincide por sufijo para que "youtube.com" cubra "music.youtube.com" si el
// usuario así lo quiere, pero cada entrada se compara de forma exacta o como sufijo.
function siteMatches(domain, sites) {
  if (!domain) return false;
  return sites.some(entry => {
    const e = entry.toLowerCase().trim();
    if (!e) return false;
    return domain === e || domain.endsWith("." + e);
  });
}

// Función que se inyecta EN la pestaña a pausar: detiene todo media que esté sonando.
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
    // Páginas donde no se puede inyectar (store del navegador, páginas internas,
    // PDFs, etc.). No hay nada que hacer ahí; se ignora en silencio.
  }
}

// Núcleo: una pestaña "trigger" empezó a sonar → pausar las demás que correspondan.
async function enforce(triggerTab) {
  const settings = await getSettings();
  if (!settings.enabled) return;

  const triggerDomain = domainOf(triggerTab.url);

  // En modo "sites", el trigger debe pertenecer al conjunto gestionado; si no, no tocamos nada.
  if (settings.mode === "sites" && !siteMatches(triggerDomain, settings.sites)) return;

  // Todas las pestañas que están emitiendo sonido ahora mismo.
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

// Se dispara cuando cambia el estado de audio de una pestaña. Reaccionamos solo a
// la transición "empezó a sonar" (audible === true).
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.audible === true) {
    enforce(tab);
  }
});

// Valores por defecto al instalar.
chrome.runtime.onInstalled.addListener(async () => {
  const cur = await chrome.storage.sync.get(DEFAULTS);
  await chrome.storage.sync.set({ ...DEFAULTS, ...cur });
});
