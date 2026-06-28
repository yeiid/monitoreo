# API Reference - FTTH Mapper

**Base URL:** `/api/v1`
**Autenticación:** Bearer Token (JWT)
**Content-Type:** `application/json`

---

## Autenticación

### POST `/auth/login`

Autenticar usuario con email y contraseña.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "full_name": "Nombre Completo",
    "role": "org_admin",
    "organization_id": "uuid"
  }
}
```

**Errors:**
- `401` - Credenciales inválidas
- `403` - Cuenta desactivada
- `429` - Demasiados intentos (rate limit: 5/5min)

---

### GET `/auth/me`

Obtener datos del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "usuario@ejemplo.com",
  "full_name": "Nombre Completo",
  "role": "org_admin",
  "organization_id": "uuid",
  "is_active": true
}
```

---

### POST `/auth/change-password`

Cambiar contraseña del usuario autenticado.

**Request:**
```json
{
  "current_password": "contraseña_actual",
  "new_password": "nueva_contraseña"
}
```

**Response (200):**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

---

## Organizaciones

> Solo accesible para `super_admin`

### GET `/organizations`

Listar todas las organizaciones.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "ISP Ejemplo",
    "slug": "isp-ejemplo",
    "plan": "PRO",
    "max_technicians": 20,
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

---

### POST `/organizations`

Crear una nueva organización con admin inicial.

**Request:**
```json
{
  "name": "ISP Ejemplo",
  "slug": "isp-ejemplo",
  "plan": "PRO",
  "admin_email": "admin@isp-ejemplo.com",
  "admin_name": "Admin ISP"
}
```

**Response (201):** Objeto Organization creado.

---

### PUT `/organizations/{org_id}`

Actualizar una organización.

**Request:** Campos opcionales a actualizar.

---

## Usuarios

> Solo accesible para `org_admin` o `super_admin`

### GET `/users`

Listar usuarios de la organización actual.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "email": "tecnico@ejemplo.com",
    "full_name": "Técnico Uno",
    "role": "technician",
    "is_active": true
  }
]
```

---

### POST `/users`

Crear un nuevo técnico en la organización.

**Request:**
```json
{
  "email": "tecnico@ejemplo.com",
  "full_name": "Técnico Uno",
  "password": "contraseña_segura"
}
```

---

### PUT `/users/{user_id}`

Actualizar datos de un técnico.

---

### DELETE `/users/{user_id}`

Desactivar un técnico (soft delete).

---

## Nodos

### GET `/nodes`

Listar nodos de la organización.

**Query Parameters:**
- `node_type` (opcional): Filtrar por tipo (`OLT`, `ODF`, `MUFLA`, `CAJA_NAP`, `CLIENTE_ONU`)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "OLT Principal",
    "node_type": "OLT",
    "description": "OLT de la central",
    "optical_power_dbm": 5.0,
    "status": "online",
    "hardware_details": {"cards": 5, "ports_per_card": 16},
    "location": {"lat": 6.2518, "lng": -75.5636},
    "organization_id": "uuid",
    "created_by": "uuid",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
]
```

---

### POST `/nodes`

Crear un nuevo nodo.

**Request:**
```json
{
  "name": "Mufla 01",
  "node_type": "MUFLA",
  "description": "Mufla esquina norte",
  "optical_power_dbm": -3.0,
  "status": "online",
  "hardware_details": {},
  "location": {"lat": 6.2520, "lng": -75.5640}
}
```

**Response (201):** Nodo creado.

---

### GET `/nodes/{node_id}`

Obtener un nodo por ID.

**Response (200):** Objeto Node.

---

### PUT `/nodes/{node_id}`

Actualizar un nodo.

**Request:** Campos opcionales a actualizar.

---

### DELETE `/nodes/{node_id}`

Eliminar un nodo y todos sus recursos asociados (routes, strands, splitters, splices).

---

### POST `/nodes/{node_id}/sync-splices`

Sincronizar empalmes y splitters internos de un nodo (operación atómica).

**Request:**
```json
{
  "splitters": [
    {
      "diagram_id": "splitter-1",
      "splitter_type": "1x8",
      "name": "Splitter Floor 1",
      "configuration": {}
    }
  ],
  "splices": [
    {
      "source_type": "splitter_in",
      "source_id": "splitter-1",
      "source_port": 1,
      "target_type": "strand",
      "target_id": "uuid-strand",
      "target_port": 1
    }
  ]
}
```

---

### GET `/nodes/{node_id}/splices`

Obtener empalmes y splitters internos de un nodo.

**Response (200):**
```json
{
  "splices": [...],
  "splitters": [...]
}
```

---

### GET `/nodes/{node_id}/olt-ports`

Obtener uso de puertos de una OLT.

> Solo para nodos de tipo `OLT`.

**Response (200):**
```json
{
  "node_id": "uuid",
  "node_name": "OLT Principal",
  "cards": 5,
  "ports_per_card": 16,
  "used_ports": [
    {
      "card": 1,
      "port": 1,
      "route_id": "uuid",
      "route_name": "Cable Troncal 1",
      "route_type": "TRONCAL",
      "capacity": 12,
      "end_node_id": "uuid",
      "end_node_name": "Mufla 01",
      "length_meters": 1250.5
    }
  ],
  "total_used": 1,
  "total_capacity": 80
}
```

---

## Rutas/Cables

### GET `/routes`

Listar rutas de la organización.

**Query Parameters:**
- `node_id` (opcional): Filtrar por nodo inicio o fin

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Cable Troncal 1",
    "route_type": "TRONCAL",
    "capacity": 12,
    "description": "Cable principal OLT-Mufla",
    "start_node_id": "uuid",
    "end_node_id": "uuid",
    "length_meters": 1250.5,
    "source_card": 1,
    "source_port": 1,
    "path": {
      "coordinates": [[-75.5636, 6.2518], [-75.5640, 6.2520]]
    }
  }
]
```

---

### POST `/routes`

Crear una nueva ruta. Auto-genera fibras TIA-598 según capacidad.

**Request:**
```json
{
  "name": "Cable Troncal 1",
  "route_type": "TRONCAL",
  "capacity": 12,
  "description": "Cable principal",
  "start_node_id": "uuid",
  "end_node_id": "uuid",
  "source_card": 1,
  "source_port": 1,
  "path": {
    "coordinates": [[-75.5636, 6.2518], [-75.5640, 6.2520]]
  }
}
```

---

### GET `/routes/{route_id}`

Obtener una ruta por ID con GeoJSON.

---

### PUT `/routes/{route_id}`

Actualizar una ruta.

---

### DELETE `/routes/{route_id}`

Eliminar una ruta y sus fibras asociadas.

---

## Fibra

### Hilos (Strands)

#### POST `/fiber/strands`

Crear un hilo individual.

**Request:**
```json
{
  "color": "azul",
  "strand_number": 1,
  "buffer_number": 1,
  "route_id": "uuid"
}
```

---

#### GET `/fiber/strands`

Listar hilos.

**Query Parameters:**
- `route_id` (opcional): Filtrar por ruta

---

#### POST `/fiber/strands/generate`

Auto-generar todos los hilos de una ruta usando colores TIA-598.

**Request:**
```json
{
  "route_id": "uuid"
}
```

---

#### DELETE `/fiber/strands/{strand_id}`

Eliminar un hilo.

---

### Splitters

#### POST `/fiber/splitters`

Crear un splitter.

**Request:**
```json
{
  "node_id": "uuid",
  "splitter_type": "1x8",
  "name": "Splitter NAP 01",
  "configuration": {}
}
```

---

#### GET `/fiber/splitters`

Listar splitters.

**Query Parameters:**
- `node_id` (opcional): Filtrar por nodo

---

#### PUT `/fiber/splitters/{splitter_id}`

Actualizar un splitter.

---

#### DELETE `/fiber/splitters/{splitter_id}`

Eliminar un splitter.

---

### Empalmes (Splices)

#### POST `/fiber/splices`

Crear un empalme con cálculo de potencia óptica.

**Request:**
```json
{
  "node_id": "uuid",
  "source_type": "strand",
  "source_id": "uuid",
  "source_port": 1,
  "target_type": "splitter_in",
  "target_id": "uuid",
  "target_port": 1,
  "loss_db": 0.1
}
```

**Tipos de source/target:**
- `strand` - Hilo de fibra
- `splitter_in` - Entrada de splitter
- `splitter_out` - Salida de splitter

---

#### GET `/fiber/splices`

Listar empalmes.

**Query Parameters:**
- `node_id` (opcional): Filtrar por nodo

---

#### DELETE `/fiber/splices/{splice_id}`

Eliminar un empalme.

---

## Analytics

### POST `/continuous-trace`

Trazado continuo: crea un nodo Y una ruta en una sola operación atómica.

**Request:**
```json
{
  "start_node_id": "uuid",
  "path": {
    "coordinates": [[-75.5636, 6.2518], [-75.5640, 6.2520]]
  },
  "node_data": {
    "name": "Mufla 02",
    "node_type": "MUFLA",
    "location": {"lat": 6.2520, "lng": -75.5640}
  },
  "route_data": {
    "name": "Cable Distribución 1",
    "capacity": 12
  }
}
```

**Response (200):**
```json
{
  "node": { "id": "uuid", "name": "Mufla 02", ... },
  "route": { "id": "uuid", "name": "Cable Distribución 1", "length_meters": 450.2, ... }
}
```

**Lógica automática de route_type:**
| Nodo Inicio → Fin | Tipo Asignado |
|-------------------|---------------|
| OLT → ODF | PATCHCORD |
| ODF → MUFLA | TRONCAL |
| OLT → * | TRONCAL |
| MUFLA → MUFLA | TRONCAL |
| * → CLIENTE_ONU | ACOMETIDA |
| Otro | DISTRIBUCION |

---

### GET `/power-budget/{node_id}`

Calcular presupuesto óptico (backtrace desde un nodo hasta la OLT).

**Response (200):**
```json
{
  "node_id": "uuid",
  "node_name": "Cliente 01",
  "node_type": "CLIENTE_ONU",
  "olt_launch_power_dbm": 5.0,
  "received_power_dbm": -18.45,
  "level": "excellent",
  "total_loss_dB": 23.45,
  "breakdown": {
    "fiber_loss_dB": 3.125,
    "connector_loss_dB": 2.5,
    "splitter_loss_dB": 13.8,
    "splice_loss_dB": 0.4
  },
  "hop_chain": [
    {
      "node_id": "uuid-olt",
      "name": "OLT Central",
      "type": "OLT",
      "loss_dB": 0.0,
      "detail": "Potencia de salida OLT: +5.0 dBm"
    },
    {
      "node_id": "uuid-mufla",
      "name": "Mufla 01",
      "type": "MUFLA",
      "cable_name": "Cable Troncal 1",
      "cable_length_m": 1250.5,
      "fiber_loss_dB": 0.313,
      "connector_loss_dB": 0.5,
      "splitter_loss_dB": 13.8
    }
  ]
}
```

**Niveles de potencia:**
| Nivel | Rango |
|-------|-------|
| `excellent` | > -24 dBm |
| `warning` | -24 a -27 dBm |
| `critical` | < -27 dBm |

---

## Endpoints Globales

### GET `/`

Status de la API.

**Response:**
```json
{
  "message": "FTTH Mapping API is running",
  "version": "2.0.0"
}
```

---

### GET `/health`

Healthcheck para Docker/load balancers.

**Response:**
```json
{
  "status": "healthy"
}
```

---

## Códigos de Error

| Código | Significado |
|--------|-------------|
| `400` | Solicitud inválida |
| `401` | No autenticado / token inválido |
| `403` | Sin permisos |
| `404` | Recurso no encontrado |
| `422` | Error de validación |
| `429` | Rate limit excedido |
| `500` | Error interno del servidor |
