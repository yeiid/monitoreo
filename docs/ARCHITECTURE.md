# Architecture Guide - FTTH Mapper

## Visión General

FTTH Mapper es un sistema de **monitoreo y diseño de planta externa de fibra óptica (FTTH)** que permite a proveedores de internet (ISPs) gestionar la topología física y lógica de sus redes.

---

## Arquitectura de Servicios

```
┌─────────────────────────────────────────────────────────────┐
│                        TRAEFIK/NGINX                        │
│                    (Reverse Proxy / TLS)                     │
└──────────────┬──────────────────┬───────────────────────────┘
               │                  │
    ┌──────────▼──────────┐  ┌───▼──────────────────┐
    │     FRONTEND        │  │      BACKEND API      │
    │   (Astro + React)   │  │    (FastAPI + SQL)    │
    │   Puerto: 80/443    │  │    Puerto: 8000       │
    └──────────┬──────────┘  └───┬──────────────────┘
               │                  │
    ┌──────────▼──────────┐  ┌───▼──────────────────┐
    │    TILE SERVER      │  │     PostgreSQL        │
    │  (TileServer GL)    │  │    + PostGIS          │
    │   Puerto: 8080      │  │    Puerto: 5432       │
    └─────────────────────┘  └──────────────────────┘
```

---

## Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Frontend | Astro + React | 5.17 + 19.2 | SPA con SSR/SSG |
| Mapas | MapLibre GL JS | 5.19 | Mapas vectoriales |
| Diagramas | React Flow | 12.10 | Diagramas de empalmes |
| Backend | FastAPI + SQLModel | 0.134 + 0.0.37 | API REST async |
| BD | PostgreSQL + PostGIS | 15 + 3.4 | Geoespacial |
| Tiles | TileServer GL | latest | Servidor de mapas |
| Infra | Docker Compose | - | Orquestación |

---

## Modelo de Datos

### Entidades de Autenticación

```
┌──────────────────┐       ┌──────────────────┐
│   Organization   │──1:N──│      User        │
├──────────────────┤       ├──────────────────┤
│ id (UUID)        │       │ id (UUID)        │
│ name             │       │ email (unique)   │
│ slug (unique)    │       │ hashed_password  │
│ plan             │       │ full_name        │
│ max_technicians  │       │ role             │
│ is_active        │       │ organization_id  │
└──────────────────┘       │ is_active        │
                           └──────────────────┘
```

**Roles:**
- `super_admin`: Acceso global, sin organización
- `org_admin`: Administrador de organización
- `technician`: Técnico de campo

### Entidades de Red

```
┌──────────────────┐       ┌──────────────────┐
│      Node        │──1:N──│     Route        │
├──────────────────┤  (FK) ├──────────────────┤
│ id (UUID)        │       │ id (UUID)        │
│ name             │◄──────│ start_node_id    │
│ node_type        │◄──────│ end_node_id      │
│ location (POINT) │       │ path (LINESTRING)│
│ organization_id  │       │ route_type       │
│ hardware_details │       │ capacity         │
│ created_by       │       │ length_meters    │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         │ 1:N                      │ 1:N
         ▼                          ▼
┌──────────────────┐       ┌──────────────────┐
│    Splitter      │       │   FiberStrand    │
├──────────────────┤       ├──────────────────┤
│ id (UUID)        │       │ id (UUID)        │
│ node_id          │       │ route_id         │
│ splitter_type    │       │ color (TIA-598)  │
│ diagram_id       │       │ strand_number    │
│ configuration    │       │ buffer_number    │
└────────┬─────────┘       └──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│     Splice       │
├──────────────────┤
│ id (UUID)        │
│ node_id          │
│ source_type/id   │
│ target_type/id   │
│ loss_db          │
│ optical_power_dbm│
└──────────────────┘
```

---

## Topología FTTH

```
OLT (Central)
  │
  ├── PATCHCORD ──► ODF (Distribuidor)
  │                    │
  │                    ├── TRONCAL ──► MUFLA (Empalme)
  │                                     │
  │                                     ├── DISTRIBUCION ──► CAJA_NAP (Punto de附着)
  │                                     │                      │
  │                                     │                      ├── ACOMETIDA ──► CLIENTE_ONU
  │                                     │
  │                                     └── DISTRIBUCION ──► OTRA_MUFLA
  │
  └── TRONCAL ──► OTRA_MUFLA
```

**Tipos de nodo:**
| Tipo | Descripción | hardware_details |
|------|-------------|------------------|
| OLT | Optical Line Terminal (central) | `{cards, ports_per_card}` |
| ODF | Optical Distribution Frame | `{capacity, used_ports}` |
| MUFLA | Empalme de fibra | `{}` |
| CAJA_NAP | Punto de附着 en campo | `{}` |
| CLIENTE_ONU | Terminal del cliente | `{}` |

**Tipos de ruta:**
| Tipo | Descripción | Capacidad típica |
|------|-------------|------------------|
| PATCHCORD | OLT ↔ ODF | 1-12 fibras |
| TRONCAL | ODF ↔ MUFLA | 12-144 fibras |
| DISTRIBUCION | MUFLA ↔ NAP | 6-48 fibras |
| ACOMETIDA | NAP ↔ Cliente | 1-2 fibras |

---

## Flujo de Autenticación

```
┌─────────┐     POST /auth/login      ┌─────────┐
│ Client  │ ─────────────────────────► │  API    │
│         │ ◄───────────────────────── │         │
│         │   { access_token, user }   │         │
│         │                            │         │
│         │   GET /api/v1/nodes        │         │
│         │ ─────────────────────────► │         │
│         │   Authorization: Bearer    │         │
│         │ ◄───────────────────────── │         │
│         │   [ nodes array ]          │         │
└─────────┘                            └─────────┘
```

**Middleware de seguridad:**
1. `ProxyHeadersMiddleware` - Trust proxy headers (Dokploy/Traefik)
2. `force_https_middleware` - Forzar HTTPS detrás del proxy
3. `CORSMiddleware` - Orígenes permitidos
4. Rate limiter en login (5 intentos/5min)

---

## Multi-Tenancy

El sistema implementa multi-tenancy por **filtro de aplicación**:

```python
def get_org_filter(current_user: User) -> Optional[uuid.UUID]:
    if current_user.role == UserRole.SUPER_ADMIN:
        return None  # Ve todo
    return current_user.organization_id  # Solo su organización
```

**Uso en endpoints:**
```python
@router.get("")
async def list_nodes(session, current_user):
    statement = select(Node)
    org_id = get_org_filter(current_user)
    if org_id:
        statement = statement.where(Node.organization_id == org_id)
    return await session.execute(statement)
```

---

## Cálculo Óptico

### Constantes (ITU-T G.984, TIA-598)

| Parámetro | Valor | Referencia |
|-----------|-------|------------|
| Pérdida fibra | 0.25 dB/km | 1490nm GPON |
| Pérdida conector | 0.5 dB | SC/APC |
| Pérdida empalme | 0.1 dB | IEC 61300 |
| Pérdida splitter 1x4 | 7.2 dB | ITU-T G.984 |
| Pérdida splitter 1x8 | 10.5 dB | ITU-T G.984 |
| Pérdida splitter 1x16 | 13.8 dB | ITU-T G.984 |
| Potencia OLT | 5.0 dBm | Típico |

### Algoritmo de Presupuesto Óptico

```
1. Desde el nodo destino, traversa hacia atrás
2. En cada hop:
   - Acumula pérdida de fibra: (distancia_km × 0.25)
   - Acumula pérdida de conector: +0.5 dB
   - Acumula pérdida de empalme: +0.1 dB
   - Acumula pérdida de splitter (si aplica)
3. Continúa hasta encontrar la OLT
4. Calcula: potencia_recibida = potencia_OLT - pérdida_total
```

---

## Estructura de Directorios

```
monitoreo/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── main.py            # Entry point
│   │   ├── seed.py            # Datos iniciales
│   │   ├── api/v1/            # Endpoints
│   │   │   ├── router.py      # Registro central
│   │   │   ├── deps.py        # Dependencias auth
│   │   │   └── endpoints/     # Módulos de negocio
│   │   ├── models/            # Modelos SQLModel
│   │   ├── schemas/           # DTOs Pydantic
│   │   ├── core/              # Security, config
│   │   ├── utils/             # Utilidades
│   │   └── db/                # Sesión BD
│   └── requirements.txt
│
├── frontend/                   # Astro + React
│   ├── src/
│   │   ├── pages/             # Rutas (8 páginas)
│   │   ├── components/        # Componentes React
│   │   │   ├── auth/          # AuthProvider, AuthGuard
│   │   │   ├── map/           # Mapa interactivo
│   │   │   ├── diagram/       # ReactFlow empalmes
│   │   │   └── mobile/        # Responsive
│   │   ├── layouts/           # Layouts Astro
│   │   └── utils/             # apiFetch, etc.
│   └── package.json
│
├── maps/                       # TileServer GL
├── docker-compose.yml          # Orquestación
└── docs/                       # Documentación
```
