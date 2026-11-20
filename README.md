# Evolutiva Norte — sitio web

Sitio corporativo de una sola página para la constructora Evolutiva Norte (Tucumán).
HTML, CSS y JavaScript sin dependencias ni paso de compilación.

## Estructura

```
index.html        Contenido y secciones
css/styles.css    Estilos (mobile-first, variables de color en :root)
js/main.js        Menú, selector de necesidad, formulario de turnos
assets/           Favicon e imágenes
```

## Verlo en local

Abrí `index.html` en el navegador, o levantá un servidor estático:

```bash
python3 -m http.server 8000
```

## Publicarlo

Es un sitio estático, sin paso de compilación. Está preparado para **Cloudflare Pages**:

1. En Cloudflare: **Workers & Pages** → **Create** → **Pages** → **Connect to Git** y elegí este repositorio.
2. **Production branch:** `main`.
3. **Framework preset:** `None`. **Build command:** vacío. **Build output directory:** `/`.
4. Para el dominio: en el proyecto, **Custom domains** → **Set up a custom domain** → `evolutivanortetuc.com` (y `www.evolutivanortetuc.com`).

`_headers` agrega cabeceras de seguridad y caché en Cloudflare. El archivo `CNAME` solo lo usa GitHub Pages; en Cloudflare se ignora.

## Qué personalizar

| Qué | Dónde |
| --- | --- |
| Foto o render del inicio | `index.html`, comentario `IMAGEN DEL HERO` |
| Redes sociales | No hay enlaces por ahora; se agregan en el pie de `index.html` |
| Fotos de trabajos | `index.html`, sección `TRABAJOS`; las fotos están en `assets/img/pinar-2/` |
| Número de WhatsApp | `CONFIG.whatsapp` en `js/main.js` y los enlaces `wa.me` de `index.html` |
| Colores y tipografías | Variables de `:root` en `css/styles.css` |

## Formulario de turnos

Valida nombre, teléfono, tipo de proyecto, modalidad y franja horaria, con mensajes de error por campo.

- **Por defecto** abre WhatsApp con la solicitud ya redactada, así funciona sin backend.
- **Con backend:** completá `CONFIG.formEndpoint` en `js/main.js` con una URL que acepte `POST` en JSON
  (Formspree, un webhook o una API propia). Los campos enviados son
  `nombre`, `telefono`, `proyecto`, `modalidad`, `franja` y `mensaje`.
