# ERP Generalizado — PWA Android y iPhone

## ¿Qué se agregó?
- Manifiesto PWA, iconos de 192 y 512 px, metadatos para iOS y pantalla independiente.
- Service worker que guarda el shell básico y archivos estáticos. **No almacena respuestas de la API ni datos empresariales.**
- Ajustes de diseño para móviles y áreas seguras de pantalla.

## Iniciar en Windows

Backend, terminal 1:
```cmd
cd /d D:\Descargas\ERP-Generalizado-PWA\ERP-Generalizado\apps\backend
npm install
npm start
```
Frontend, terminal 2:
```cmd
cd /d D:\Descargas\ERP-Generalizado-PWA\ERP-Generalizado\apps\frontend
npm install
npm run dev
```
Ruta del frontend en desarrollo: http://localhost:5173 (en la computadora).

## Probar la PWA en la computadora
```cmd
cd apps\frontend
npm run build
npm run preview
```
Abrir http://localhost:4173 en la computadora. En Chrome/Edge, buscar el icono de instalación. En desarrollo con `npm run dev` el service worker no se registra intencionalmente.

## Instalar desde Android/iPhone
Para instalación desde un teléfono real, **publicar el frontend en un dominio HTTPS**. También hay que publicar el backend de manera segura, con autenticación y HTTPS, antes de exponer datos reales. En el hosting del frontend, configurar `VITE_API_URL` con la URL HTTPS pública del backend y recompilar (`npm run build`).

- Android: abrir URL HTTPS en Chrome > menú > Instalar aplicación / Agregar a pantalla principal.
- iPhone: abrir URL HTTPS en Safari > Compartir > Agregar a pantalla de inicio > Abrir como app > Agregar.

**Importante:** `localhost:3000` en el navegador de un teléfono se refiere al propio teléfono, no a la PC. Por eso las consultas al backend no funcionarán en el teléfono sin URL pública/configuración de red. Una PWA no convierte automáticamente la base de datos en un sistema offline. No abrir el backend al público antes de añadir login, permisos y validaciones de seguridad.
