# 📦 Mercado Libre Stock & Rotation Analytics

Aplicación web integral para analizar métricas internas de vendedor de **Mercado Libre**, evaluando la rotación de stock para determinar con precisión qué productos reponer y en qué volúmenes.

---

## 🏗️ Arquitectura del Sistema

- **Backend**: Google Apps Script (GAS) — Gestiona la integración OAuth 2.0 con Mercado Libre, consulta los endpoints `/orders/search` e `/items`, realiza los cálculos de rotación y expone un endpoint JSON vía `doGet(e)`.
- **Base de Datos**: Google Sheets — Almacena la configuración, historial diario de ventas y rendimiento por publicación.
- **Frontend**: Dashboard web moderno (HTML, Vanilla CSS y JavaScript) con tema oscuro, estética Glassmorphism, gráficos de Chart.js y simulación dinámica de stock en tiempo real. Hospedable en **GitHub Pages**.

---

## 🚀 Paso a Paso: Guía de Despliegue y Configuración

### 1. Registro de la Aplicación en Mercado Libre Developers

1. Ingresa al [Portal de Desarrolladores de Mercado Libre](https://developers.mercadolibre.com/).
2. Inicia sesión con la cuenta de vendedor y ve a **Mis Aplicaciones** (`My Apps`) > **Crear nueva aplicación**.
3. Completa los datos requeridos:
   - **Nombre**: `Meli Stock Manager`
   - **Descripción**: Dashboard interno de analítica de inventario.
   - **Redirect URI**: `https://script.google.com/macros/s/PUBLIC_URL/exec` (URL de tu Web App de Google Apps Script).
   - **Permisos (Scopes)**: Marca la opción de **Lectura (`read`)**.
4. Copia el **App ID / Client ID** y el **Client Secret Key**.

---

### 2. Configuración en Google Sheets y Google Apps Script

1. Crea una nueva planilla en [Google Sheets](https://sheets.google.com).
2. Ve al menú superior **Extensiones > Apps Script**.
3. Reemplaza el contenido de `Código.gs` por el código del archivo [`gas/Code.gs`](gas/Code.gs).
4. Reemplaza `appsscript.json` por el contenido de [`gas/appsscript.json`](gas/appsscript.json) *(si no lo ves, activa en la tuerca de Configuración: "Mostrar el archivo de manifiesto appsscript.json en el editor")*.
5. Guarda el proyecto y regresa a la planilla de Google Sheets.
6. Recarga la página de Google Sheets. Verás un nuevo menú en la parte superior: `⚡ Mercado Libre Analytics`.
7. Haz clic en **⚡ Mercado Libre Analytics > 📊 Inicializar Estructura de Hojas**.
8. En la nueva pestaña **Config**, completa tus credenciales:
   - `CLIENT_ID`: Tu App ID de Mercado Libre.
   - `CLIENT_SECRET`: Tu Client Secret Key.
   - `REFRESH_TOKEN`: Tu Refresh Token inicial (obtenido mediante el flujo OAuth).
   - `LEAD_TIME_DAYS`: Días de demora del proveedor (ej. `15`).
   - `SAFETY_STOCK_DAYS`: Días de stock de seguridad (ej. `7`).
   - `TARGET_COVERAGE_DAYS`: Días de cobertura deseados al reponer (ej. `45`).

---

### 3. Obtención del Refresh Token Inicial (OAuth 2.0)

Para generar tu primer `refresh_token`, abre en el navegador:

```text
https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=TU_CLIENT_ID&redirect_uri=TU_REDIRECT_URI
```

*(Sustituye `.com.ar` por el dominio de tu país: `.cl`, `.mx`, `.co`, `.com.br`, etc.)*

1. Haz clic en **Autorizar**.
2. Al ser redirigido, copia el parámetro `code` de la URL.
3. Intercambia dicho `code` haciendo una petición POST a `https://api.mercadolibre.com/oauth/token` con `grant_type=authorization_code` para obtener el `refresh_token` inicial y pégalo en la hoja `Config`.

---

### 4. Publicación del Web App de Google Apps Script

1. En el editor de Apps Script, haz clic en **Desplegar > Nuevo despliegue**.
2. Selecciona el tipo **Aplicación Web**.
3. Configuración:
   - **Ejecutar como**: Tu usuario (`Yo`).
   - **Quién tiene acceso**: `Cualquiera` (`Anyone`).
4. Haz clic en **Desplegar** y copia la **URL de la aplicación web** (`https://script.google.com/macros/s/.../exec`).

---

### 5. Despliegue del Dashboard Frontend (GitHub Pages)

1. Sube la carpeta `frontend/` (`index.html`, `styles.css`, `app.js`, `mock-data.json`) a un repositorio de GitHub.
2. Ve a las **Settings > Pages** del repositorio y activa GitHub Pages en la rama `main` / `master`.
3. Abre la URL de tu sitio en GitHub Pages (ej. `https://tu-usuario.github.io/meli-stock-analytics/`).
4. En el Dashboard, haz clic en el botón **🔑 Conexión API** y pega la URL de tu Web App de Google Apps Script.

---

## 🧮 Lógica de Negocio y Fórmulas

- **Venta Promedio Diaria ($VPD$)**:
  $$VPD = \frac{\text{Ventas acumuladas en 30 días}}{30}$$

- **Punto de Pedido ($PP$)**:
  $$PP = VPD \times (\text{Lead Time} + \text{Días Stock Seguridad})$$

- **Días de Cobertura ($DC$)**:
  $$DC = \frac{\text{Stock Actual}}{VPD}$$

- **Sugerencia de Reposición ($SR$)**:
  $$\text{Si Stock Actual} \le PP \implies SR = (VPD \times \text{Días Cobertura Objetivo}) - \text{Stock Actual}$$
