# Developer Guide - FTTH Mapper

## Requisitos Previos

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+ (o Docker)

---

## Setup Local

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd monitoreo
```

### 2. Configurar variables de entorno

```bash
# Copiar plantilla
cp .env.example .env

# Generar JWT_SECRET_KEY
openssl rand -hex 32

# Editar .env con las credenciales
```

### 3. Iniciar servicios

```bash
docker-compose up -d
```

Esto levanta:
- `db`: PostgreSQL + PostGIS (puerto 5433)
- `api`: FastAPI (puerto 8000)
- `web`: Astro + Nginx (puerto 8081)
- `tiles`: TileServer GL (puerto 8080)

### 4. Crear Super Admin

```bash
docker-compose exec api python -m app.seed
```

### 5. Acceder

- **Frontend:** http://localhost:8081
- **API:** http://localhost:8000
- **Tiles:** http://localhost:8080

---

## Desarrollo

### Backend (FastAPI)

```bash
# Entrar al contenedor
docker-compose exec api bash

# Instalar dependencias (ya instaladas en Docker)
pip install -r requirements.txt

# Ejecutar la API localmente (fuera de Docker)
cd backend
uvicorn app.main:app --reload --port 8000
```

**Estructura:**
```
backend/app/
├── main.py           # Entry point, CORS, middleware
├── seed.py           # Super Admin inicial
├── api/v1/
│   ├── router.py     # Registro central de endpoints
│   ├── deps.py       # Dependencias de auth
│   └── endpoints/    # Lógica de negocio
├── models/           # Modelos SQLModel
├── schemas/          # DTOs Pydantic
├── core/             # Security, rate_limit
├── utils/            # optical_physics, network
└── db/               # Sesión, engine
```

### Frontend (Astro + React)

```bash
# Entrar al contenedor
docker-compose exec web bash

# Instalar dependencias
cd frontend && pnpm install

# Desarrollo local
pnpm dev
```

**Estructura:**
```
frontend/src/
├── pages/            # Rutas Astro (SSG/SSR)
├── components/       # Componentes React
│   ├── auth/         # AuthProvider, AuthGuard
│   ├── map/          # Mapa interactivo
│   ├── diagram/      # ReactFlow empalmes
│   └── mobile/       # Responsive
├── layouts/          # Layouts Astro
├── utils/            # apiFetch
└── styles/           # CSS global
```

---

## Convenciones de Código

### Python (Backend)

- **Estilo:** PEP 8 con Black formatter
- **Tipado:** Type hints en todas las funciones
- **Naming:** snake_case para funciones/variables, PascalCase para clases
- **Docstrings:** Google style para endpoints públicos

```python
@router.get("/nodes", response_model=List[NodeRead])
async def list_nodes(
    node_type: str = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Listar nodos de la organización actual.

    Args:
        node_type: Filtrar por tipo de nodo (opcional)
        session: Sesión de base de datos
        current_user: Usuario autenticado

    Returns:
        Lista de nodos de la organización
    """
    ...
```

### TypeScript (Frontend)

- **Estilo:** Airbnb style guide
- **Formatter:** Prettier
- **Componentes:** Functional components con hooks
- **Props:** Interfaces definidas arriba del componente

```tsx
interface NodeProps {
  node: NodeType;
  onSelect: (id: string) => void;
}

const NodeCard: React.FC<NodeProps> = ({ node, onSelect }) => {
  return (
    <div onClick={() => onSelect(node.id)}>
      {node.name}
    </div>
  );
};
```

---

## Testing

### Backend

```bash
# Ejecutar tests
docker-compose exec api pytest

# Con cobertura
docker-compose exec api pytest --cov=app --cov-report=html
```

### Frontend

```bash
# Ejecutar tests
docker-compose exec web pnpm test

# Build de producción
docker-compose exec web pnpm build
```

---

## Deployment

### Docker Compose (Producción)

```bash
# Build de imágenes
docker-compose build

# Levantar en background
docker-compose up -d

# Ver logs
docker-compose logs -f api
```

### Dokploy/Traefik

Ver `DOKPLOY_GUIDE.md` para instrucciones detalladas.

Variables de entorno requeridas:
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
JWT_SECRET_KEY=<generar_con_openssl_rand_hex_32>
CORS_ORIGINS=https://tu-dominio.com
SUPER_ADMIN_EMAIL=admin@tu-dominio.com
SUPER_ADMIN_PASSWORD=<contraseña_segura>
```

---

## debugging

### Logs del Backend

```bash
# Ver logs en tiempo real
docker-compose logs -f api

# Buscar errores
docker-compose logs api | grep -i error
```

### Base de Datos

```bash
# Conectar a PostgreSQL
docker-compose exec db psql -U monitoreo -d monitoreodb

# Ver tablas
\dt

# Ver estructura de nodos
\d nodes
```

### API (Swagger)

En desarrollo: http://localhost:8000/docs

---

## Contribución

1. Crear branch de feature (`git checkout -b feature/nombre`)
2. Hacer cambios con tests
3. Asegurar que `pytest` y `pnpm test` pasan
4. Crear Pull Request con descripción clara
