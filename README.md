# AudiStop

**Never hear two tabs play audio at once.** AudiStop is a lightweight browser
extension for **Chrome** and **Edge** that automatically pauses the audio in your
other tabs the moment one starts playing. Switch from a music tab to a video, or
from a podcast to a live stream, and the previous one pauses on its own — no more
racing to find the tab that's making noise.

Works with any site that plays media through a standard `<video>` or `<audio>`
element: music streaming, video sites, podcasts, live streams, web players, and more.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Chrome & Edge](https://img.shields.io/badge/browser-Chrome%20%7C%20Edge-4285F4)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

## Why a browser extension?

A browser reports **all of its tabs as a single audio stream** to the operating
system — neither Windows' media APIs (SMTC) nor its audio APIs (WASAPI) can tell one
tab apart from another. That's why a desktop app can't manage "tab vs tab" inside the
same browser. The only layer that actually sees each tab is the browser itself, which
is exactly where AudiStop runs.

## Features

- **All tabs mode** — any tab that starts playing pauses the rest. One sound at a
  time, zero configuration.
- **Selected sites mode** — the rule applies only between the domains you choose;
  every other tab is left alone.
- **Real pause** — it actually pauses the `<video>`/`<audio>` element (not just mute),
  so nothing keeps playing in the background. Press play again whenever you want.
- **Global on/off switch.**
- **Bilingual UI** — English and Spanish, chosen automatically from your browser's
  language (falls back to English).
- **Private & lightweight** — no telemetry, no network requests, no accounts.
  Respects your dark mode.

## Installation

### Load unpacked (developer mode)

Same steps in Chrome and Edge:

1. Download or clone this repository.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select the repository folder.
5. The blue AudiStop icon appears in your toolbar (pin it if you like).

```bash
git clone https://github.com/sebastianabanto/audistop.git
```

## Usage

Click the toolbar icon to open the panel:

- **Switch** (top) — enable or disable the extension.
- **All tabs** — the default; nothing to configure.
- **Selected sites** — open a tab and click **+ Add this tab**; repeat for the
  others. The auto-pause rule then applies only among those domains.

## How it works

The extension listens for the browser's per-tab *audible* signal. When a tab starts
producing sound, a tiny script is injected into the other relevant tabs that pauses
any playing media element. Pausing a tab makes it silent, so there's no feedback
loop — when you manually press play on it again, it becomes the active source and the
others pause instead.

## Permissions

| Permission | Why it's needed |
|---|---|
| `tabs` | Detect which tab is producing sound and read its domain. |
| `scripting` + `<all_urls>` | Inject the small script that pauses media in the right tab. |
| `storage` | Remember your mode and site list (`chrome.storage.sync`). |

## Limitations

- Pauses standard `<video>`/`<audio>` elements. Sites that play sound without a
  standard media element may not respond.
- Cannot inject into internal browser pages (`chrome://…`, `edge://…`, the extension
  store, PDFs); those tabs are ignored.

## Privacy

AudiStop sends no data anywhere. Everything stays in your own browser profile via
`chrome.storage.sync`. See [`background.js`](background.js) — it's a few dozen lines.

## Project structure

| File | Role |
|---|---|
| `manifest.json` | Manifest V3 definition. |
| `background.js` | Service worker: detects the active tab and pauses the others. |
| `popup.html` · `popup.css` · `popup.js` | Control panel (modes and site list). |
| `_locales/` | UI translations (English and Spanish). |
| `icons/` | Extension icons. |

## Contributing

Issues and pull requests are welcome. The codebase is intentionally small and
dependency-free.

## License

[MIT](LICENSE) — free to use, copy, modify, and redistribute.
