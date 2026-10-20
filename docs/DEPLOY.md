# Publicar el juego

El juego es un sitio estático: no necesita servidor.

## Construir y comprobar

```
pnpm build        # genera dist/
pnpm smoke:dist   # sirve dist/ y comprueba que responde
```

## Cloudflare Pages

- Build command: `pnpm build`
- Output directory: `dist/`
- Variable de entorno del proyecto de Pages: `NODE_VERSION=24`

## itch.io

1. Ejecuta `pnpm build`.
2. Comprime el **contenido** de `dist/` en un zip, con `index.html` en la raíz del zip (no la carpeta `dist/`).
3. En itch.io crea un proyecto de tipo HTML y sube el zip.
4. Viewport sugerido: 960×640.

## Rollback

Vuelve a la versión anterior con `git checkout <tag>` (por ejemplo `step-16-boss-fight`), ejecuta `pnpm build` y sube de nuevo `dist/`. En Cloudflare Pages también puedes restaurar un despliegue anterior desde su panel.
