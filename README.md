# Contigo · Asistente de gestión del Alzheimer

Simulación interactiva (React + Three.js + WebXR + Tailwind) de un brazalete asistencial
con dos experiencias conectadas en tiempo real:

- **Paciente (3D / VR / MR):** paseo en primera persona por el barrio, con gafas VR o en
  pantalla, ruta guiada casa → tienda → parque → casa, recordatorios y alarmas.
- **Cuidador:** panel de monitoreo con signos vitales, mapa en vivo, recordatorios, alertas,
  mensajes rápidos, localización y botón SOS.

## Desarrollo

```bash
npm install
npm run dev
```

Controles del paciente en escritorio: clic para mirar (ratón), **WASD** para caminar,
**Shift** para correr. En móvil: arrastrar para mirar y botón **Caminar**. En gafas VR:
botón **Entrar en VR** y locomoción con el joystick del mando izquierdo.

## Producción

```bash
npm run build   # genera un único dist/index.html autocontenido
npm run preview # sirve la build localmente
```

## Publicación en GitHub Pages

El repositorio incluye el workflow
[`.github/workflows/deploy-github-pages.yml`](.github/workflows/deploy-github-pages.yml),
que compila y publica la web automáticamente en cada push a la rama `main`.

Pasos iniciales (solo una vez):

1. Sube los cambios a `main` (fusiona la rama de trabajo).
2. En GitHub, entra a **Settings → Pages**.
3. En **Build and deployment → Source**, elige **GitHub Actions**.
4. El workflow construye el sitio y en minutos quedará publicado en
   `https://<usuario>.github.io/<repositorio>/`.

Notas de configuración:

- `vite.config.ts` usa `base: "./"` y `vite-plugin-singlefile`, por lo que el resultado es un
  único `dist/index.html` con todo el JS y CSS incrustado: funciona sin importar la ruta del
  proyecto y sin enrutamiento especial en Pages.
- El workflow añade `.nojekyll` al artefacto para que Pages no procese el sitio con Jekyll.
- WebXR exige HTTPS: GitHub Pages lo proporciona automáticamente, así que el botón
  **Entrar en VR** funciona al abrir la URL en el navegador de las gafas (Quest, Pico…).
