# Calwill & Fiorella — Frontend Web (E-Commerce & Panel Administrativo)

Aplicación web frontend del e-commerce **Calwill & Fiorella**, desarrollada con **React 19**, **TypeScript** y **Vite**[cite: 5]. Incluye la tienda pública (catálogo, detalle de variantes, carrito persistente, checkout con cálculo de envíos y pasarela de pago), el panel de autogestión de clientes y el panel administrativo integral para gestión de catálogo, ventas, facturación electrónica ARCA y usuarios[cite: 5].

---

## Tecnologías y Versiones

| Categoría | Tecnología / Librería | Versión |
| :--- | :--- | :--- |
| **Core & Lenguaje** | React / React DOM | `^19.2.0`[cite: 5] |
| | TypeScript (`strict: true`, `allowJs: false`) | `^7.0.2`[cite: 5] |
| **Bundler & Dev Server** | Vite (`@vitejs/plugin-react`) | `^7.2.4`[cite: 5] |
| **Enrutamiento** | React Router DOM | `^7.11.0`[cite: 5] |
| **Cliente HTTP** | Axios | `^1.21.1`[cite: 5] |
| **Estilos & UI** | Sass (`sass-embedded`) | `^1.97.2`[cite: 5] |
| | Bootstrap CSS / JS Bundle (CDN) | `5.3.7` / `5.3.8`[cite: 5] |
| | Bootstrap Icons (CDN) | `1.13.1`[cite: 5] |
| | Google Fonts (`Great Vibes`) | CDN[cite: 5] |
| **Calidad de Código** | ESLint + React Hooks + React Refresh | `^9.39.1`[cite: 5] |

---

## Requisitos Previos

* **Node.js** (versión LTS recomendada, `>= 20.x`) instalado en **Linux**, **Windows** o **macOS**.
* **Gestor de paquetes:** **Yarn** (recomendado, el proyecto incluye `yarn.lock`) o **npm** (incluido con Node.js).
  * *Nota para Windows:* si `yarn` no está habilitado tras instalar Node.js, podés activarlo ejecutando `corepack enable` en una terminal (PowerShell, CMD o Git Bash) o utilizar directamente `npm`.
* **Backend en ejecución:** para consumir datos reales (productos, autenticación JWT, carrito remoto, checkout y administración), debe estar levantada la API REST del backend (`proyecto_techlab_springboot`) en `http://localhost:8080/api` (o en la URL configurada en `.env.local`)[cite: 5].

---

## Instalación y Ejecución en Local

> **Importante — Cómo levantar la aplicación:**
> Este proyecto es una **SPA construida con Vite + React + TypeScript**[cite: 5]. **Debe ejecutarse exclusivamente mediante `yarn` o `npm`** (Vite Dev Server o Vite Preview)[cite: 5].
> * **No utilices extensiones como Live Server (puerto `5500`)** ni abras `index.html` / `dist/index.html` directamente desde el explorador de archivos: Live Server no compila módulos `.tsx`/`.scss` y rompe el enrutamiento SPA de React Router al recargar rutas internas (como `/productos` o `/admin`).
> * Tampoco corresponde al puerto `3000` por defecto (propio de Create React App), salvo que se especifique manualmente por parámetro.

### 1. Clonar el repositorio e instalar dependencias

**En Linux / macOS / Windows (PowerShell, CMD o Git Bash):**

```bash
git clone https://github.com/Lahkpom/calwill_y_fiorella_react.git
cd calwill_y_fiorella_react
```

Instalá todas las dependencias del proyecto ejecutando uno de los siguientes comandos:

```bash
# Opción A: Con Yarn (recomendado)
yarn

# Opción B: Con npm
npm install
```

### 2. Configurar variables de entorno

Copiá el archivo de plantilla `.env.example` hacia `.env`:

* **Linux / macOS / Git Bash (Windows):**
  ```bash
  cp .env.example .env
  ```
* **Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```
* **Windows (CMD):**
  ```cmd
  copy .env.example .env
  ```

Verificá el contenido de `.env`:

```dotenv
# URL base de la API REST del backend Spring Boot
VITE_API_URL=http://localhost:8080/api
```

### 3. Levantar el servidor de desarrollo

```bash
# Opción A: Con Yarn (abre por defecto en http://localhost:5173)
yarn dev

# Opción B: Con npm (abre por defecto en http://localhost:5173)
npm run dev
```

Si necesitás levantarlo en un puerto específico (por ejemplo, el puerto `3000`):

```bash
yarn dev --port 3000
# o con npm:
npm run dev -- --port 3000
```

### 4. Otros scripts disponibles

| Comando (Yarn) | Comando (npm) | Descripción |
| :--- | :--- | :--- |
| `yarn build` | `npm run build` | Compila la aplicación optimizada para producción en la carpeta `dist/`[cite: 5]. |
| `yarn preview` | `npm run preview` | Levanta un servidor local en `http://localhost:4173` para previsualizar el build de producción generado en `dist/`[cite: 5]. |
| `yarn lint` | `npm run lint` | Ejecuta ESLint sobre el código fuente para verificar reglas de estilo y hooks[cite: 5]. |
| `npx tsc --noEmit` | `npx tsc --noEmit` | Ejecuta el chequeo estricto de tipos de TypeScript sin emitir archivos compilados. |

---

## Usuarios de prueba

Credenciales para acceder con los roles de prueba disponibles:

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| Administrador (`ADMIN`) | `admin_1@gmail.com` | `admin_1` |
| Operador (`OPERATOR`) | `operator_1@gmail.com` | `operator_1` |
| Mayorista (`WHOLESALER`) | `wholesaler_1@gmail.com` | `wholesaler_1` |
| Cliente (`CUSTOMER`) | `customer_1@gmail.com` | `customer_1` |

---

## Arquitectura del Proyecto (`src/`)

La aplicación sigue una separación estricta entre **páginas delgadas (`pages/`)**, que únicamente componen las vistas asociadas a cada ruta, y **componentes modulares por dominio (`components/`)**, acompañados de sus respectivas hojas de estilos `.scss`[cite: 5]:

```text
src/
├── components/
│   ├── admin/               # Módulos del panel administrativo (layout, dashboard, products, variants, colors, sales, users)[cite: 5]
│   ├── auth/                # Formularios y estilos de inicio de sesión y registro[cite: 5]
│   ├── cart/                # Vista de carrito y estado vacío[cite: 5]
│   ├── checkout/            # Formulario de compra, cálculo de envío y selección de pago[cite: 5]
│   ├── conditions/          # Secciones informativas de medios de pago y reglas de envío[cite: 5]
│   ├── contact/             # Formulario de contacto[cite: 5]
│   ├── error/               # Visores de error y página 404[cite: 5]
│   ├── home/                # Secciones de portada (Hero, AboutUs, Features)[cite: 5]
│   ├── layout/              # Layout público (Navbar responsiva y Footer)[cite: 5]
│   ├── loader/              # Indicador visual de carga[cite: 5]
│   ├── products/            # Catálogo, tarjetas de producto y detalle (carrusel, talles, colores, stock)[cite: 5]
│   ├── userDashboard/       # Panel de cliente (perfil, órdenes activas, historial, modales de detalle y devolución)[cite: 5]
│   └── ProtectedRoute.tsx   # Guarda de rutas por autenticación y roles[cite: 5]
├── constants/               # Constantes y validadores de dominio (públicos objetivo del catálogo)[cite: 5]
├── contexts/                # Contextos globales (AuthContext, CartContext, MainDataContext)[cite: 5]
├── hooks/                   # Hooks personalizados de estado, formularios y datos[cite: 5]
├── pages/                   # Contenedores de ruta delgados (públicos, cuenta y administración)[cite: 5]
├── router/                  # Definición del árbol de rutas con React Router[cite: 5]
├── services/                # Capa de comunicación HTTP con la API REST (Axios + interceptores JWT) y API Georef[cite: 5]
├── styles/                  # Variables globales de marca (_variables.scss) y clases base (_button, _title, _subtitle)[cite: 5]
├── types/                   # Contratos e interfaces TypeScript por dominio[cite: 5]
└── utils/                   # Utilidades compartidas de formato y presentación[cite: 5]
```

---

## Guía de Navegación, Roles y Permisos

El sistema contempla cuatro roles de usuario autenticado (`CUSTOMER`, `WHOLESALER`, `OPERATOR`, `ADMIN`) además de los visitantes no autenticados (**Invitado / Público**)[cite: 5].

### Mapa de Rutas y Control de Acceso

| Ruta | Acceso Permitido | Comportamiento si no cumple requisitos |
| :--- | :--- | :--- |
| `/` | Público / Todos los roles[cite: 5] | Página de inicio con presentación de la marca y características destacadas[cite: 5]. |
| `/productos` | Público / Todos los roles[cite: 5] | Catálogo filtrable por público objetivo (`NINIAS`, `NINIOS`, `HOMBRES`, `MUJERES`, `UNISEX`)[cite: 5]. |
| `/productos/:id_product` | Público / Todos los roles[cite: 5] | Ficha técnica del calzado con selector de color, talle, stock y agregado al carrito[cite: 5]. |
| `/pagos_envios` | Público / Todos los roles[cite: 5] | Información sobre modalidades de pago y condiciones de envío[cite: 5]. |
| `/contacto` | Público / Todos los roles[cite: 5] | Formulario de consultas conectado al servicio de mensajería[cite: 5]. |
| `/iniciar_sesion` | Público / Invitado[cite: 5] | Si ya hay sesión activa, redirige a `/admin` (`ADMIN`/`OPERATOR`) o `/mi_cuenta` (`CUSTOMER`/`WHOLESALER`)[cite: 5]. |
| `/registrarse` | Público / Invitado[cite: 5] | Alta de cuenta minorista; si ya hay sesión activa, redirige a `/mi_cuenta`[cite: 5]. |
| `/carrito` | Público / Todos los roles[cite: 5] | Gestión de ítems seleccionados (persiste en `localStorage` para invitados o en backend para usuarios logueados)[cite: 5]. |
| `/checkout` | Público / Todos los roles[cite: 5] | Finalización de compra; si el carrito está vacío, redirige automáticamente a `/carrito`[cite: 5]. |
| `/mi_cuenta` | Autenticados (`CUSTOMER`, `WHOLESALER`, `OPERATOR`, `ADMIN`)[cite: 5] | Sin sesión activa, redirige a `/iniciar_sesion`[cite: 5]. |
| `/mi_cuenta/ordenes_activas` | Autenticados (Todos los roles)[cite: 5] | Sin sesión activa, redirige a `/iniciar_sesion`[cite: 5]. |
| `/mi_cuenta/historial` | Autenticados (Todos los roles)[cite: 5] | Sin sesión activa, redirige a `/iniciar_sesion`[cite: 5]. |
| `/admin` | `ADMIN`, `OPERATOR`[cite: 5] | Sin sesión redirige a `/iniciar_sesion`; con rol `CUSTOMER` o `WHOLESALER` redirige a `/`[cite: 5]. |
| `/admin/productos` | `ADMIN`, `OPERATOR`[cite: 5] | Igual que `/admin`[cite: 5]. |
| `/admin/variantes` | `ADMIN`, `OPERATOR`[cite: 5] | Igual que `/admin`[cite: 5]. |
| `/admin/colores` | `ADMIN`, `OPERATOR`[cite: 5] | Igual que `/admin`[cite: 5]. |
| `/admin/ventas` | `ADMIN`, `OPERATOR`[cite: 5] | Igual que `/admin`[cite: 5]. |
| `/admin/usuarios` | `ADMIN`, `OPERATOR`[cite: 5] | Igual que `/admin`[cite: 5]. |

---

### Funcionalidades por Perfil de Usuario

#### 1. Visitante Invitado y Cliente (`CUSTOMER` / `WHOLESALER`)
* **Exploración y Carrito:** Puede navegar el catálogo, seleccionar variantes por talle y color y armar su carrito sin necesidad de iniciar sesión[cite: 5]. Al iniciar sesión, el carrito local no se sincroniza con el servidor, muestra el persistido (Al logout vuelve a mostar el local)[cite: 5].
* **Checkout:** Permite completar compras como invitado o usuario autenticado, eligiendo **retiro sin cargo en Estación Llavallol** o **envío a domicilio** (con selección de provincia/localidad vía API Georef y cotización en tiempo real) y pagando mediante **Mercado Pago**, **transferencia bancaria** o **efectivo** (habilitado según modalidad de envío)[cite: 5].
* **Autenticación y Seguridad:** Inicio de sesión con soporte para flujo obligatorio de actualización de contraseña inicial o vencida[cite: 5].
* **Autogestión (`/mi_cuenta`):**
  * Edición de datos personales, teléfono, datos fiscales (DNI/CUIT/Razón Social) y cambio de contraseña[cite: 5].
  * Seguimiento de **órdenes activas** (con opción de reintentar pago en Mercado Pago si quedó pendiente) e **historial** paginado con filtros por estado[cite: 5].
  * **Cancelación de pedidos** en estados `PENDIENTE` o `PREPARACION`[cite: 5].
  * **Solicitud de devoluciones** sobre pedidos entregados dentro de los últimos 10 días (seleccionando ítems, cantidades, motivo y resolución deseada)[cite: 5].

#### 2. Operador (`OPERATOR`) y Administrador (`ADMIN`) — Panel `/admin`
Ambos roles acceden al panel administrativo con barra lateral auto-colapsable[cite: 5], pero con distintos niveles de privilegio en operaciones destructivas y gestión de personal:

| Módulo | Operador (`OPERATOR`) | Administrador (`ADMIN`) |
| :--- | :--- | :--- |
| **Productos, Variantes y Colores** | Crear nuevos registros, editar mediante modal, filtrar/ordenar y activar o desactivar (`ACTIVE`/`INACTIVE`)[cite: 5]. **No puede eliminar registros**[cite: 5]. | Todos los permisos de `OPERATOR` **más eliminación definitiva** de productos, variantes y colores[cite: 5]. |
| **Ventas y Facturación ARCA** | Visualizar pestañas de *Auditoría Urgente*, *Ventas Activas* e *Historial*; avanzar estados logísticos, registrar notas internas, conciliar pagos manuales, consultar comprobantes fiscales (CAE/QR), corregir datos fiscales y reintentar emisiones rechazadas[cite: 5]. | Mismos permisos operativos sobre ventas y facturación electrónica[cite: 5]. |
| **Gestión de Usuarios** | Visualiza únicamente el segmento de **Clientes y Mayoristas**; puede dar de alta cuentas mayoristas (`WHOLESALER`), editar datos/roles de clientes y activar/desactivar cuentas[cite: 5]. **No visualiza ni gestiona operadores ni elimina usuarios**[cite: 5]. | Acceso completo a los segmentos **Clientes/Mayoristas** y **Operadores**; puede dar de alta nuevos operadores (`OPERATOR`), editar usuarios y eliminar cuentas[cite: 5]. |