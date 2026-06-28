# Scalability Plan - FTTH Mapper

**Fecha:** 2026-06-28
**Estado actual:** Escalable para 1-5 instancias

---

## Evaluación Actual

### Aspectos Positivos

| Componente | Estado | Justificación |
|------------|--------|---------------|
| API Stateless | ✅ | JWT sin sesión server-side |
| Docker Compose | ✅ | Permite escalar servicio `api` |
| Async/Await | ✅ | Manejo eficiente de conexiones |
| PostGIS + GIST | ✅ | Consultas geoespaciales eficientes |
| Base de datos centralizada | ✅ | Puede usar read replicas |

### Bloqueadores Identificados

| Problema | Severidad | Impacto |
|----------|-----------|---------|
| Power budget carga TODA la BD en memoria | CRÍTICO | OOM a partir de ~10k nodos |
| Migraciones en startup | ALTO | Todas las instancias migran simultáneamente |
| Seed en startup | MEDIO | Múltiples instancias intentan sembrar |
| Sin rate limiting global | MEDIO | Ataques DDoS no se mitigan entre instancias |
| echo=True en engine | BAJO | Sobrecarga de I/O en logs |

---

## Plan de Escalabilidad

### Fase 1: Optimización Inmediata (1-5 instancias)

**Objetivo:** Eliminar cuellos de botella críticos.

#### 1.1 Cache de Grafo de Red para Power Budget

**Problema:** `GET /power-budget/{node_id}` carga TODOS los nodos, rutas y splitters en cada llamada.

**Solución:** Implementar cache en memoria con TTL.

```python
# utils/graph_cache.py
from functools import lru_cache
import time

_graph_cache = {}
_cache_ttl = 60  # segundos

def get_graph_snapshot(session):
    now = time.time()
    if "graph" in _graph_cache and now - _graph_cache["timestamp"] < _cache_ttl:
        return _graph_cache["graph"]
    
    # Cargar datos de la BD
    graph = load_full_graph(session)
    _graph_cache["graph"] = graph
    _graph_cache["timestamp"] = now
    return graph
```

**Impacto:** Reduce tiempo de respuesta de O(n) a O(1) para consultas repetidas.

#### 1.2 Migraciones con Alembic

**Problema:** Las migraciones en `main.py` se ejecutan en cada startup, causando conflictos.

**Solución:** Migrar a Alembic con distributed lock.

```bash
# Instalar Alembic
pip install alembic

# Inicializar
alembic init alembic

# Crear migración
alembic revision --autogenerate -m "initial schema"

# Aplicar en startup (solo una instancia)
alembic upgrade head
```

#### 1.3 Read Replicas para PostgreSQL

**Problema:** Toda la carga de lectura va al primary.

**Solución:** Configurar read replicas para queries de lectura.

```python
# db/session.py
READ_DATABASE_URL = os.getenv("DATABASE_URL_READ")

if READ_DATABASE_URL:
    read_engine = create_async_engine(READ_DATABASE_URL)
else:
    read_engine = engine  # Fallback al primary
```

---

### Fase 2: Arquitectura Escalable (5-20 instancias)

**Objetivo:** Separar componentes pesados.

#### 2.1 Servicio Independiente de Cálculo Óptico

**Componente:** `optical-calculator-service`

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   API        │────►│  Optical Calc    │────►│  Redis       │
│   Gateway    │     │  Service         │     │  (Cache)     │
└──────────────┘     └──────────────────┘     └──────────────┘
```

**Responsabilidades:**
- Cálculo de presupuesto óptico
- Trazado continuo
- Validación de topología

**Tecnología:** FastAPI independiente o worker con Celery.

#### 2.2 Redis para Cache y Rate Limiting

```python
# Cache global
import redis.asyncio as redis

redis_client = redis.from_url(os.getenv("REDIS_URL"))

async def get_cached_power_budget(node_id: str):
    cached = await redis_client.get(f"power_budget:{node_id}")
    if cached:
        return json.loads(cached)
    
    result = await calculate_power_budget(node_id)
    await redis_client.setex(f"power_budget:{node_id}", 300, json.dumps(result))
    return result
```

#### 2.3 CDN para Tiles Estáticos

**Problema:** TileServer GL es un cuello de botella para mapas.

**Solución:** Migrar tiles a CDN (Cloudflare R2, AWS S3).

```
┌──────────────┐     ┌──────────────────┐
│   Frontend   │────►│   CDN (S3/R2)    │
│              │     │   /tiles/*.mbtiles│
└──────────────┘     └──────────────────┘
```

---

### Fase 3: Escala Masiva (20+ instancias)

**Objetivo:** Arquitectura distribuida completa.

#### 3.1 CQRS para Lecturas Pesadas

**Problema:** Las queries de lectura (power budget, listados) son pesadas.

**Solución:** Command Query Responsibility Segregation.

```
┌──────────────┐     ┌──────────────────┐
│   Commands   │────►│  Write DB        │
│   (API)      │     │  (PostgreSQL)    │
└──────────────┘     └────────┬─────────┘
                              │ Sync
┌──────────────┐     ┌────────▼─────────┐
│   Queries    │◄────│  Read DB         │
│   (API)      │     │  (PostgreSQL)    │
└──────────────┘     └──────────────────┘
```

#### 3.2 Graph Database para Topología

**Problema:** PostgreSQL no es óptimo para traversals complejos.

**Solución:** Neo4j o ArangoDB para el grafo de red.

```cypher
// Ejemplo de travers Neo4j
MATCH path = (target:Node {id: $node_id})-[:ROUTE*]->(olt:Node {type: 'OLT'})
RETURN path
```

#### 3.3 Microservicios

```
┌─────────────────────────────────────────────────────────┐
│                     API Gateway                         │
└─────────┬───────────┬───────────┬───────────┬───────────┘
          │           │           │           │
   ┌──────▼──────┐ ┌──▼─────┐ ┌──▼─────┐ ┌──▼──────┐
   │  Nodes API  │ │ Routes │ │ Fiber  │ │ Optical │
   │             │ │  API   │ │  API   │ │ Calc    │
   └──────┬──────┘ └──┬─────┘ └──┬─────┘ └──┬──────┘
          │           │           │           │
   ┌──────▼───────────▼───────────▼───────────▼──────┐
   │              PostgreSQL + PostGIS               │
   └─────────────────────────────────────────────────┘
```

---

## Métricas de Escalabilidad

| Métrica | Actual | Objetivo Fase 1 | Objetivo Fase 2 |
|---------|--------|-----------------|-----------------|
| Tiempo respuesta API | < 200ms | < 100ms | < 50ms |
| Power budget query | < 2s | < 200ms | < 50ms |
| Conexiones concurrentes | 50 | 200 | 1000+ |
| Nodos soportados | ~1k | ~10k | ~100k |
| Instancias API | 1 | 3-5 | 10-20 |

---

## Recomendaciones de Infraestructura

### Producción Actual (Docker Compose)

```yaml
# docker-compose.yml
services:
  api:
    deploy:
      replicas: 2
    resources:
      limits:
        cpus: '1.0'
        memory: 512M
  
  db:
    resources:
      limits:
        cpus: '2.0'
        memory: 2G
```

### Producción Futura (Kubernetes)

```yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ftth-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ftth-api
  template:
    spec:
      containers:
      - name: api
        image: ftth-api:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## Checklist de Escalabilidad

### Fase 1 (Inmediato)
- [ ] Cache de grafo de red para power budget
- [ ] Migrar a Alembic
- [ ] Desactivar echo=True en producción
- [ ] Configurar read replicas

### Fase 2 (Corto plazo)
- [ ] Redis para cache global
- [ ] Servicio independiente de cálculo óptico
- [ ] CDN para tiles estáticos
- [ ] Rate limiting distribuido

### Fase 3 (Largo plazo)
- [ ] CQRS para lecturas pesadas
- [ ] Graph database para topología
- [ ] Microservicios
- [ ] Kubernetes
