# ERP-Generalizado · Versión ampliada (prototipo académico)

Aplicación web React/Vite + API Node/Express + MongoDB Atlas. Incluye catálogos CRUD de empresas, clientes, proveedores, productos y usuarios (directorio de roles **sin autenticación**), ventas y compras con movimientos de stock, inventario, indicadores del dashboard, reportes y exportación CSV.

## Inicio en Windows / VS Code

1. Extrae este ZIP en una **carpeta nueva**, conservando tu proyecto original como respaldo.
2. Copia **tu propio** `apps/backend/.env` del proyecto original a `apps/backend/.env` de esta copia. Debe contener `MONGODB_URI=...`. **Nunca subas `.env` a GitHub.**
3. Terminal 1: `cd apps\backend`, `npm install`, `npm start`.
4. Terminal 2: `cd apps\frontend`, `npm install`, `npm run dev`.
5. Abre `http://localhost:5173`.

## Recomendación de prueba

Crea primero un cliente, un proveedor y un producto. Registra una compra de 10 unidades y comprueba que el stock suba. Registra una venta de 3 unidades y comprueba que baje. Abre Reportes y descarga CSV. El backend utiliza transacciones de MongoDB para agrupar las operaciones de compra/venta y el ajuste de inventario.

## Consideraciones

- El directorio de usuarios **no implementa inicio de sesión, contraseñas ni control de permisos**. Es un prototipo, no un sistema seguro para producción.
- Los registros de venta y compra son permanentes y no tienen cancelación o devolución. No es facturación electrónica ni contabilidad fiscal.
- Los catálogos permiten editar y eliminar; evita eliminar clientes/proveedores con operaciones históricas (el proyecto no implementa protección referencial completa).
- El dashboard muestra datos almacenados, no datos ficticios. Los importes están en MXN.
- La conexión MongoDB Atlas necesita tener autorizada tu IP actual.
- Antes de producción: agregar autenticación, autorización por empresa, auditoría, validaciones robustas, protección CORS, pruebas automatizadas, monitoreo y flujos de cancelación.

## Endpoints

`GET/POST /api/clientes`, `/api/empresas`, `/api/proveedores`, `/api/productos`, `/api/usuarios` con `PUT/DELETE /api/{recurso}/:id`; `GET/POST /api/ventas`, `/api/compras`; `GET /api/inventario`, `/api/movimientos`, `/api/dashboard`, `/api/reportes`.
