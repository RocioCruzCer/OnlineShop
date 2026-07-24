# OnlineShop — Tienda en Línea con Arquitectura de Microservicios

Plataforma de comercio electrónico construida con arquitectura de microservicios, API Gateway con balanceo por nombre de servicio vía Netflix Eureka, y un frontend React SPA con interfaz responsiva.

## Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | Java 21 + Spring Boot | 4.1.0 |
| API Gateway | Spring Cloud Gateway (WebMVC) | 2025.1.2 |
| Servicio de descubrimiento | Netflix Eureka | 2025.1.2 |
| Base de datos | MySQL | 8.0 |
| Frontend | React + Vite | 19.2.7 / 8.1.1 |
| Orquestación | Docker + Docker Compose | Compose v3.8 |
| Build backend | Maven | 3.9.6 |
| JDK runtime | Eclipse Temurin | 21 (Alpine JRE) |

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│                    http://localhost:5173                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ proxy /api → localhost:8080
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (:8080)                        │
│             Spring Cloud Gateway Server WebMVC                  │
│        Balancea por nombre de servicio vía Eureka               │
└────┬──────────┬──────────┬──────────┬───────────────────────────┘
     │          │          │          │
     ▼          ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Usuario  │ │Producto │ │Pedido   │ │Carrito  │
│Service  │ │Service  │ │Service  │ │Service  │
│  :8081  │ │  :8082  │ │  :8083  │ │  :8084  │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │
     └───────────┴───────────┴───────────┘
                     │
            ┌────────▼────────┐
            │   MySQL (:3307) │
            │   onlineshop    │
            └─────────────────┘
                     ▲
        ┌────────────┴────────────┐
        │     Eureka Server       │
        │        :8761            │
        │  (Service Discovery)    │
        └─────────────────────────┘
```

### Comunicación entre servicios

| Servicio origen | Servicio destino | Protocolo | Mecanismo |
|---|---|---|---|
| Frontend | API Gateway | HTTP/REST | Proxy Vite (`/api` → `:8080`) |
| API Gateway | Cualquier microservicio | HTTP/REST | `lb://NOMBRE-SERVICE` vía Eureka |
| Pedido Service | Producto Service | HTTP/REST | `RestTemplate` `@LoadBalanced` + Eureka |
| Todos los microservicios | Eureka Server | HTTP | Registro y descubrimiento (`:8761`) |
| Todos los microservicios | MySQL | JDBC | Conexión directa vía Spring Datasource |

**Flujo de compra (stock):** El `pedido-service` obtiene el producto vía `GET http://producto-service/api/productos/{id}`, valida stock suficiente, y luego decrementa con `PUT http://producto-service/api/productos/{id}/stock` con body `{"cantidad": -N}`. Todo vía `RestTemplate` con balanceo de carga por nombre de servicio.

---

## Microservicios

### 1. Eureka Server (`:8761`)
- Servicio de descubrimiento para registro y localización de todos los microservicios.
- No se registra a sí mismo (`register-with-eureka: false`).

### 2. API Gateway (`:8080`)
- Punto de entrada único de la aplicación.
- Enrutamiento por paths con balanceo de carga por nombre de servicio.
- Configuración CORS habilitada para permitir conexiones desde el frontend.

### 3. Usuario Service (`:8081`)
- CRUD de usuarios, registro y autenticación (login por email + password).
- Entidad `Usuario`: `id`, `username`, `email`, `password`, `rol` (USER/ADMIN).

### 4. Producto Service (`:8082`)
- CRUD completo de productos con gestión de stock e imagen en Base64.
- Entidad `Producto`: `id`, `nombre`, `descripcion`, `precio` (BigDecimal), `stock` (Integer), `imagenData` (@Lob LONGTEXT).

### 5. Pedido Service (`:8083`)
- Gestión de pedidos con validación y decremento de stock inter-servicio.
- Entidad `Pedido`: `id`, `usuarioId`, `total`, `estado`, `fechaCreacion`, `fechaEntrega`, `fechaCancelacion`, `detalles[]`.
- Entidad `PedidoDetalle`: `id`, `pedido` (ManyToOne), `productoId`, `cantidad`, `precioUnitario`.
- Estados: `PENDIENTE` → `CONFIRMADO` → `ENVIADO` → `ENTREGADO` | `CANCELADO`.

### 6. Carrito Service (`:8084`)
- Gestión del carrito de compras por usuario.
- Entidad `CarritoItem`: `id`, `usuarioId`, `productoId`, `cantidad`, `precioUnitario`.

---

## Requisitos Previos

| Requisito | Versión mínima | Verificación |
|---|---|---|
| Docker | 20.10+ | `docker --version` |
| Docker Compose | 2.0+ (o Compose V2 plugin) | `docker compose version` |
| Node.js (solo para desarrollo del frontend) | 18+ | `node --version` |
| Git | Cualquier versión reciente | `git --version` |

> **Nota:** Java y Maven NO son requeridos localmente. Las imágenes Docker incluyen JDK 21 y Maven 3.9.6 en su proceso de build multi-etapa.

---

## Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/<usuario>/OnlineShop-main.git
cd OnlineShop-main
```

### 2. Construir las imágenes Docker
```bash
docker-compose build
```

### 3. Levantar todos los servicios
```bash
docker-compose up -d
```

### 4. Verificar que todos los contenedores estén corriendo
```bash
docker-compose ps
```

### 5. Acceder a la aplicación
| Servicio | URL |
|---|---|
| Frontend (desarrollo) | http://localhost:5173 |
| API Gateway | http://localhost:8080 |
| Eureka Dashboard | http://localhost:8761 |

### 6. Levantar el frontend en modo desarrollo
```bash
cd frontend
npm install
npm run dev
```

### Comandos útiles
```bash
# Ver logs de un servicio específico
docker-compose logs -f pedido-service

# Reconstruir y reiniciar un servicio
docker-compose up -d --build producto-service

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (borra la base de datos)
docker-compose down -v
```

---

## Variables de Entorno

| Variable | Descripción | Valor (docker-compose) | Servicio |
|---|---|---|---|
| `MYSQL_ROOT_PASSWORD` | Contraseña root de MySQL | `root` | mysql-db |
| `MYSQL_DATABASE` | Nombre de la base de datos | `onlineshop` | mysql-db |
| `SPRING_DATASOURCE_URL` | URL de conexión JDBC | `jdbc:mysql://mysql-db:3306/onlineshop?createDatabaseIfNotExist=true&allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC` | Todos los microservicios |
| `SPRING_DATASOURCE_USERNAME` | Usuario de MySQL | `root` | Todos los microservicios |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña de MySQL | `root` | Todos los microservicios |
| `SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT` | Dialecto Hibernate | `org.hibernate.dialect.MySQLDialect` | Todos los microservicios |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | URL del servidor Eureka | `http://eureka-server:8761/eureka/` | API Gateway y microservicios |

> **Nota:** Las contraseñas de MySQL en los `application.yaml` individuales (`1234567890`) son para ejecución local sin Docker. En Docker, las variables de entorno del `docker-compose.yml` sobreescriben estos valores.

---

## Endpoints de la API

Todas las rutas se acceden a través del API Gateway en `http://localhost:8080`.

### Usuario Service (`/api/usuarios`)

| Método | Ruta | Descripción | Body / Parámetros |
|---|---|---|---|
| `GET` | `/api/usuarios` | Listar todos los usuarios | — |
| `GET` | `/api/usuarios/{id}` | Obtener usuario por ID | — |
| `POST` | `/api/usuarios/registro` | Registrar nuevo usuario | `{ "username", "email", "password", "rol" }` |

### Producto Service (`/api/productos`)

| Método | Ruta | Descripción | Body / Parámetros |
|---|---|---|---|
| `GET` | `/api/productos` | Listar todos los productos | — |
| `GET` | `/api/productos/{id}` | Obtener producto por ID | — |
| `POST` | `/api/productos` | Crear producto | `{ "nombre", "descripcion", "precio", "stock", "imagenData" }` |
| `PUT` | `/api/productos/{id}` | Actualizar producto | `{ "nombre", "descripcion", "precio", "stock", "imagenData" }` |
| `DELETE` | `/api/productos/{id}` | Eliminar producto | — |
| `PUT` | `/api/productos/{id}/stock` | Actualizar stock (incremento/decremento) | `{ "cantidad": N }` (negativo para decrementar) |

### Pedido Service (`/api/pedidos`)

| Método | Ruta | Descripción | Body / Parámetros |
|---|---|---|---|
| `GET` | `/api/pedidos` | Listar todos los pedidos | — |
| `GET` | `/api/pedidos/usuario/{usuarioId}` | Listar pedidos por usuario | — |
| `POST` | `/api/pedidos` | Crear pedido (valida y decrementa stock) | `{ "usuarioId", "total", "estado", "detalles": [...] }` |
| `PUT` | `/api/pedidos/{id}/estado` | Cambiar estado del pedido | `{ "estado": "CONFIRMADO" }` |

**Estados posibles:** `PENDIENTE`, `CONFIRMADO`, `ENVIADO`, `ENTREGADO`, `CANCELADO`

### Carrito Service (`/api/carrito`)

| Método | Ruta | Descripción | Body / Parámetros |
|---|---|---|---|
| `POST` | `/api/carrito` | Agregar ítem al carrito | `{ "usuarioId", "productoId", "cantidad", "precioUnitario" }` |
| `GET` | `/api/carrito/usuario/{usuarioId}` | Obtener carrito de un usuario | — |
| `DELETE` | `/api/carrito/{itemId}` | Eliminar un ítem del carrito | — |
| `DELETE` | `/api/carrito/usuario/{usuarioId}` | Vaciar carrito completo | — |

---

## Estructura de Carpetas

```
OnlineShop-main/
├── docker-compose.yml          # Orquestación de todos los contenedores
├── pom.xml                     # POM padre (herencia de versiones)
├── api-gateway/                # API Gateway - Enrutador central
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/.../      # ApiGatewayApplication, CorsConfig
├── eureka-server/              # Eureka Server - Descubrimiento de servicios
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/.../      # EurekaServerApplication
├── usuario-service/            # Microservicio de Usuarios
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/.../
│       ├── controller/         # UsuarioController
│       ├── entity/             # Usuario
│       ├── repository/         # UsuarioRepository
│       └── service/            # UsuarioService
├── producto-service/           # Microservicio de Productos
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/.../
│       ├── controller/         # ProductoController
│       ├── entity/             # Producto
│       ├── repository/         # ProductoRepository
│       └── service/            # ProductoService
├── pedido-service/             # Microservicio de Pedidos
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/.../
│       ├── config/             # RestTemplateConfig (@LoadBalanced)
│       ├── controller/         # PedidoController
│       ├── entity/             # Pedido, PedidoDetalle
│       ├── repository/         # PedidoRepository
│       └── service/            # PedidoService
├── carrito-service/            # Microservicio de Carrito
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/.../
│       ├── controller/         # CarritoController
│       ├── entity/             # CarritoItem
│       ├── repository/         # CarritoRepository
│       └── service/            # CarritoService
└── frontend/                   # Aplicación React (SPA)
    ├── package.json
    ├── vite.config.js          # Proxy /api → :8080
    ├── index.html
    └── src/
        ├── main.jsx            # Entry point
        ├── App.jsx             # Rutas y estado del carrito
        ├── index.css           # Estilos globales (Dusty Blue)
        ├── components/
        │   └── Navbar.jsx      # Barra de navegación
        ├── context/
        │   └── AuthContext.jsx # Estado de autenticación global
        ├── pages/
        │   ├── Catalogo.jsx    # Catálogo de productos + CRUD admin
        │   ├── Carrito.jsx     # Vista del carrito de compras
        │   ├── Pedidos.jsx     # Historial de pedidos (cliente/admin)
        │   └── Login.jsx       # Login y registro de usuarios
        └── services/
            └── api.js          # Cliente HTTP centralizado
```

---

## Persistencia de Datos

### Base de datos
- **Motor:** MySQL 8.0
- **Nombre de BD:** `onlineshop`
- **Acceso:** `root` / `root` (en Docker), `root` / `1234567890` (local)

### Tablas (generadas automáticamente por Hibernate JPA `ddl-auto: update`)

| Tabla | Servicio | Descripción |
|---|---|---|
| `usuarios` | usuario-service | Registro de usuarios (username, email, password, rol) |
| `productos` | producto-service | Catálogo de productos (nombre, precio, stock, imagenBase64) |
| `pedidos` | pedido-service | Encabezados de pedido (usuarioId, total, estado, fechas) |
| `pedido_detalles` | pedido-service | Líneas de detalle por pedido (productoId, cantidad, precioUnitario) |
| `carrito_items` | carrito-service | Ítems del carrito por usuario |

### Volúmenes Docker
```yaml
volumes:
  mysql_data:    # Datos persistentes de MySQL en /var/lib/mysql
```

Los datos se mantienen entre reinicios del stack. Para eliminarlos: `docker-compose down -v`.

---

## Despliegue en la Nube

**No se detectó configuración de despliegue en la nube.** El proyecto está configurado únicamente para ejecución local mediante Docker Compose.

Elementos no encontrados:
- No hay scripts de CI/CD (ni `.github/workflows/`, ni `Jenkinsfile`, ni `.gitlab-ci.yml`).
- No hay configuración de dominio o certificados SSL.
- No hay balanceador de carga externo (el API Gateway funge como punto de entrada único).
- No hay archivos de infraestructura como código (Terraform, CloudFormation, Kubernetes manifests).

> **Para desplegar en la nube** se recomienda: subir las imágenes Docker a un registry (Docker Hub, ECR, ACR), reemplazar `docker-compose.yml` con un orquestador como Kubernetes o ECS, y configurar un balanceador de carga (ALB/NLB) delante del API Gateway con certificado SSL.

---

## Pruebas

**No se encontraron pruebas automatizadas en el proyecto.** Solo existen los archivos generados por defecto al crear los proyectos Spring Boot:

| Archivo | Ubicación |
|---|---|
| `ApiGatewayApplicationTests.java` | `api-gateway/src/test/java/` |
| `EurekaServerApplicationTests.java` | `eureka-server/src/test/java/` |
| `UsuarioServiceApplicationTests.java` | `usuario-service/src/test/java/` |
| `ProductoServiceApplicationTests.java` | `producto-service/src/test/java/` |
| `PedidoServiceApplicationTests.java` | `pedido-service/src/test/java/` |
| `CarritoServiceApplicationTests.java` | `carrito-service/src/test/java/` |

No hay colecciones Postman, tests unitarios de negocio, ni tests de integración.

> **Recomendación:** Agregar tests de integración para el flujo de compra (validación de stock + creación de pedido), tests unitarios para cada `Service`, y una colección de Postman o Newman para validación manual de endpoints.

---

## Funcionalidades del Frontend

| Funcionalidad | Descripción |
|---|---|
| **Catálogo de productos** | Grid responsivo con imagen, nombre, precio, stock y botón de agregar al carrito |
| **Carrito de compras** | Lista de ítems con cantidad, nombre real del producto (`PROD-XXXX`), precio y total |
| **Flujo de compra** | Validación de stock, creación de pedido, vaciado de carrito |
| **Gestión de pedidos** | Vista cliente (con fechas dinámicas por estado) y vista admin (tabla global con cambio de estado) |
| **Login / Registro** | Autenticación por email + contraseña con toggle de visibilidad de password |
| **CRUD de productos (Admin)** | Crear, editar, eliminar productos con subida de imagen local (Base64) |
| **Roles** | `USER` (compra y ve sus pedidos) y `ADMIN` (gestiona productos y ve todos los pedidos) |
| **Temática Dusty Blue** | Interfaz clara con paleta azul dusty, alto contraste en navbar y botones |

---

## Licencia

No se especificó licencia en el repositorio. Por defecto, todos los derechos reservados.
