# Frontend — FTTH Mapper

Astro + React + MapLibre GL para monitoreo de red FTTH.

## Estructura

```
src/
├── components/
│   ├── auth/           # AuthProvider, AuthGuard, Login
│   ├── map/            # MapLibre, markers, hooks, paneles
│   ├── diagram/        # Diagramador de empalmes (ReactFlow)
│   ├── mobile/         # Componentes mobile
│   ├── AppShell.tsx    # Raiz de la app (envuelve todo en AuthProvider)
│   ├── Header.tsx      # Barra superior con busqueda y usuario
│   ├── Sidebar.tsx     # Navegacion lateral
│   └── MapApp.tsx      # Orquestador del mapa
├── layouts/
│   ├── Layout.astro    # Layout base
│   └── DashboardLayout.astro  # Layout con Sidebar + Header
└── pages/              # Rutas de Astro (index, nodos, config, etc.)
```

## Variables de Entorno

| Variable              | Ejemplo                                          | Descripcion                        |
|-----------------------|--------------------------------------------------|------------------------------------|
| `PUBLIC_API_URL`      | `/api/v1` o `http://localhost:8000/api/v1`       | URL base de la API backend         |
| `PUBLIC_MAP_TILE_URL` | `https://map.neuraljira.tech/api/v1/style.json`  | URL del servicio de mapas          |
| `PUBLIC_MAP_ATTRIBUTION` | `(default OSM)`                              | Attribution del mapa               |

> Las variables `PUBLIC_*` se inyectan en tiempo de build. Cambiarlas requiere reconstruir.

## Comandos

```bash
pnpm install        # Instalar dependencias
pnpm run dev        # Desarrollo local (localhost:4321)
pnpm run build      # Build de produccion
pnpm run preview    # Preview del build
```

## Docker (desarrollo local)

```bash
# Desde la raiz del repo:
docker compose up -d --build

# Verificar:
curl http://localhost:8081/
curl http://localhost:8081/api/v1/health
```

## Notas Importantes

### Servicio de mapas
El frontend consume el mapa desde un servicio externo (`map.neuraljira.tech`). No necesita un tileserver local en Docker.

### AuthProvider
`AppShell.tsx` envuelve toda la app en `<AuthProvider>`. Las paginas que usan `DashboardLayout` usan `<HeaderWithAuth>` que tambien incluye su propio `<AuthProvider>`. El hook `useAuth()` retorna valores por defecto seguros si no hay contexto disponible.

### Astro View Transitions
`DashboardLayout.astro` usa `transition:persist="header"` para persistir el Header entre navegaciones. Esto puede causar que el componente Header se mantenga en el DOM mientras el React tree se re-inicializa.
