# AudiStop

Extensión para **Microsoft Edge** y **Google Chrome** que evita que se solapen
audios entre pestañas: cuando una pestaña empieza a sonar, **pausa** el video o
audio de las demás. Ideal para dejar de pelear entre **YouTube y YouTube Music**,
Spotify Web, SoundCloud y compañía en un mismo navegador.

## Por qué una extensión (y no un `.exe`)

El navegador **fusiona todas sus pestañas en una sola fuente de audio** de cara al
sistema operativo: ni la API de medios de Windows (SMTC) ni la de audio (WASAPI)
distinguen una pestaña de otra. Por eso una app de escritorio no puede separar
"YouTube" de "YouTube Music" si están en el mismo navegador. La única capa que sí ve
cada pestaña por dentro es el propio navegador — y ahí es donde vive esta extensión.

## Características

- **Modo "Todas las pestañas"**: cualquier pestaña que empiece a sonar pausa a las
  demás. Una a la vez, sin configurar nada.
- **Modo "Solo entre estos sitios"**: la regla aplica únicamente entre los dominios
  que elijas (ej. `youtube.com` y `music.youtube.com`); el resto de pestañas no se
  ven afectadas.
- **Pausa real**: detiene el `<video>`/`<audio>` de la otra pestaña (no solo lo
  silencia). Para reanudar, le das play tú.
- Interruptor global para activar/desactivar.
- Sin telemetría ni peticiones de red. Respeta el modo oscuro.

## Instalación (modo desarrollador)

Igual en Edge y Chrome:

1. Descarga o clona este repositorio.
2. Abre `edge://extensions` (o `chrome://extensions`).
3. Activa **Modo de desarrollador** (arriba a la derecha).
4. Clic en **Cargar descomprimida** / **Load unpacked**.
5. Selecciona la carpeta del repositorio.
6. Aparece el icono azul de AudiStop en la barra (puedes fijarlo con el pin).

## Uso

Clic en el icono para abrir el panel:

- **Interruptor** (arriba): activa o desactiva la extensión.
- **Todas las pestañas**: modo por defecto, cero configuración.
- **Solo entre estos sitios**: abre un sitio y pulsa **+ Añadir esta pestaña**;
  repite en el otro. Con esos dos dominios, solo se pausan entre ellos.

## Cómo se prueba

1. Abre YouTube y YouTube Music en dos pestañas del mismo navegador.
2. Dale play a YouTube.
3. Ve a YouTube Music y dale play → **YouTube se pausa** al instante.
4. Vuelve a YouTube y dale play → **YouTube Music se pausa**.

## Permisos y por qué

| Permiso | Motivo |
|---|---|
| `tabs` | Saber qué pestaña está emitiendo sonido y su dominio. |
| `scripting` + `<all_urls>` | Inyectar el pequeño script que pausa el media en la pestaña que corresponde. |
| `storage` | Recordar tu modo y tu lista de sitios (`chrome.storage.sync`). |

## Limitaciones

- Pausa elementos `<video>`/`<audio>` estándar. Funciona con YouTube, YouTube Music,
  Spotify Web, SoundCloud, etc. Un sitio que reproduzca sin un elemento media
  estándar podría no pausarse.
- No puede inyectarse en páginas internas del navegador (`edge://…`, la tienda de
  extensiones, PDFs); esas pestañas se ignoran.

## Privacidad

AudiStop no envía datos a ningún servidor. Toda la configuración se guarda en tu
propio perfil del navegador mediante `chrome.storage.sync`.

## Estructura

| Archivo | Rol |
|---|---|
| `manifest.json` | Manifest V3 de la extensión. |
| `background.js` | Service worker: detecta qué pestaña suena y pausa las demás. |
| `popup.html` · `popup.css` · `popup.js` | Panel de control (modos y lista de sitios). |
| `icons/` | Iconos de la extensión. |

## Licencia

[MIT](LICENSE) — libre para usar, copiar, modificar y redistribuir.
