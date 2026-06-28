# FTTH Mapper — Monitoreo de Red de Fibra Óptica

Sistema de monitoreo y diseño de planta externa FTTH con mapa interactivo, gestión de nodos (OLT, ODF, Muflas, NAPs, Clientes), trazado de cables, diagrama de empalmes y presupuesto óptico.

## Stack

- **Frontend**: Astro + React + MapLibre GL + ReactFlow
- **Backend**: FastAPI + PostGIS (PostgreSQL 15)
- **Auth**: JWT (AuthProvider + AuthGuard)
- **Mapa**: Servicio externo `map.neuraljira.tech`
- **Deploy**: Docker Compose + Nginx reverse proxy

## Arquitectura Docker

```
monitoreo-db-1       → PostgreSQL 15 + PostGIS
monitoreo-api-1      → FastAPI (puerto 8000, proxy en 8081)
monitoreo-web-1      → Nginx + Astro build estático
```

## Avances Recientes

### 1. Fix Mapa API Proxy (502 Bad Gateway)
- Eliminado proxy roto `/map-api/` que apuntaba a `map-manager-1:8000` (no existía)
- Configurado `PUBLIC_MAP_TILE_URL=https://map.neuraljira.tech/api/v1/style.json`
- Frontend consume servicio de mapas externo directamente

### 2. Fix AuthProvider Crashes
- `useAuth()` retorna valores por defecto seguros en vez de lanzar error
- Previene crashes durante Astro View Transitions con `transition:persist`

### 3. Fix Hostname 0.0.0.0
- `API_BASE` resuelve correctamente a `/api/v1` en todos los entornos
- Nginx usa `$http_host` en vez de `$host` para preservar el puerto

### 4. Diagrama de Empalmes — Conexiones Persistidas

**Problema**: Las conexiones (splices) no se guardaban correctamente entre sesiones.

**Cambios**:
- **Backend** (`network.py`): Campo `diagram_id` agregado al modelo `Splitter`
- **Backend** (`nodes.py`): `diagram_id` se guarda al crear splitters en `sync-splices`
- **Backend** (`main.py`): Auto-migración en startup para agregar columna faltante
- **Frontend** (`DiagramadorEmpalmes.tsx`): 
  - Save usa strand UUIDs (`edge.sourceHandle`) en vez de route UUIDs
  - Reload construye reverse maps (`strandToRoute`, `splitterDbToDiagram`) para reconstruir edges

### 5. GPS — Mi Ubicación y Trazado desde Posición

**Funcionalidades nuevas**:
- **GeolocateControl** integrado en el mapa (MapLibre nativo)
- **Botón "Ubicación"** en toolbar: solicita GPS y vuela al mapa
- **Botón "Trazar aquí"**: inicia cable desde posición GPS (no requiere nodo existente)
- **Marcador GPS** personalizado con animación de pulso azul
- **CSS** para `.gps-marker`, `.gps-marker-dot`, `.gps-marker-pulse`

### 6. Móvil — MobileToolbar

**Problema**: El toolbar de escritorio (7+ botones) desbordaba la pantalla en móviles.

**Solución**:
- **MobileToolbar** (`mobile/MobileToolbar.tsx`): Componente con 4 botones compactos (Lugar, OLT, Cable, Menú)
- **MapToolbar** (`MapToolbar.tsx`): Agregada clase `desktop-only` para ocultar en móvil
- **CSS** (`global.css`): `.map-toolbar-hud.desktop-only { display: none }` en `max-width: 768px`
- **FTTHMap.tsx**: Importado y conectado MobileToolbar con handlers

### 7. TerminationModal Responsive

**Problema**: Panel de "Final del Trazo" no era centrado ni responsive.

**Solución**:
- Cambiado de `info-panel` + posicionamiento manual a `modal-overlay` + `modal-content`
- `width: 90vw; max-width: 420px` se adapta a móviles
- `max-height: 85vh; overflow: auto` para contenido scrolleable
- Agregada clase `.toolbar-btn` al CSS

### 8. OLT/ODF Management

- **GestorOLT.tsx**: Vista de chassis con puertos reales desde `/olt-ports`
- **GestorODF.tsx**: Panel ODF con rutas conectadas
- **TerminationModal.tsx**: OLT como primer destino, ODF como destino intermedio
- **Backend**: Endpoint `GET /nodes/{id}/olt-ports` retorna uso de puertos

### 9. Backend — Auto-Migración

- `main.py` ejecuta `run_migrations()` en cada startup
- Verifica si columnas faltantes existen (`splitters.diagram_id`)
- Aplica `ALTER TABLE` + `CREATE INDEX` de forma idempotente
- Funciona en Dokploy sin intervención manual

## Endpoints API Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/nodes` | Listar nodos |
| POST | `/api/v1/nodes` | Crear nodo |
| GET | `/api/v1/nodes/{id}/splices` | Splices de un nodo |
| GET | `/api/v1/nodes/{id}/olt-ports` | Puertos OLT en uso |
| POST | `/api/v1/nodes/{id}/sync-splices` | Sincronizar empalmes |
| GET | `/api/v1/routes` | Listar rutas |
| POST | `/api/v1/routes` | Crear ruta |
| POST | `/api/v1/continuous-trace` | Trazado continuo (nodo + ruta) |
| GET | `/api/v1/fiber/strands` | Hilos de fibra |
| POST | `/api/v1/fiber/strands/generate` | Generar hilos automáticos |

## Credenciales

```
Email: admin@ftth-mapper.com
Password: admin123
```

## Comandos Docker

```bash
# Levantar todo
docker compose up -d --build

# Ver logs
docker compose logs -f api
docker compose logs -f web

# Reconstruir solo un servicio
docker compose build api && docker compose up -d api
docker compose build web && docker compose up -d web

# Apagar todo
docker compose down

# Apagar y eliminar volúmenes
docker compose down -v
```

## Estructura del Proyecto

```
monitoreo/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # nodes, routes, fiber, analytics, auth
│   │   ├── models/             # network.py (Node, Route, FiberStrand, Splitter, Splice)
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── db/                 # session.py (engine, init_db)
│   │   └── main.py             # FastAPI app + auto-migration
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── map/            # FTTHMap, MapToolbar, InfoPanels, hooks
│   │   │   ├── diagram/        # ReactFlow diagram components
│   │   │   ├── mobile/         # MobileToolbar
│   │   │   ├── auth/           # AuthProvider, Login
│   │   │   ├── DiagramadorEmpalmes.tsx
│   │   │   ├── GestorOLT.tsx
│   │   │   └── GestorODF.tsx
│   │   └── styles/global.css
│   └── Dockerfile
├── docker-compose.yml
└── nginx.conf
```
