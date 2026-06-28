# Guia de Despliegue en Dokploy — neuraljira.tech

## Arquitectura

Todo se sirve bajo **un solo dominio** (`neuraljira.tech`):
- `/` → Frontend (Astro/React via Nginx)
- `/api/` → Backend API (FastAPI) — proxy por Nginx
- Mapas → Servicio externo `map.neuraljira.tech` (consumido directamente por el frontend)

### Servicios Docker (docker-compose.yml)

| Servicio  | Descripcion                     | Puerto |
|-----------|---------------------------------|--------|
| `db`      | PostGIS (PostgreSQL 15)         | 5435   |
| `api`     | Backend FastAPI                 | 8000   |
| `web`     | Frontend Astro + Nginx          | 8081   |

## 1. Preparacion

### En tu repositorio (local)
```bash
git add -A
git commit -m "chore: cleanup for production deployment"
git push
```

## 2. Configurar Dokploy

1. Crear un nuevo **Project** en Dokploy.
2. Crear un nuevo **Service** tipo **Compose**.
3. Conectar tu repositorio de GitHub.
4. En **Compose Path** seleccionar: `docker-compose.yml` (la raiz).

## 3. Variables de Entorno

En la pestana **Environment** de Dokploy:
```env
POSTGRES_USER=monitoreo
POSTGRES_PASSWORD=TuContrasenaSegura123!
POSTGRES_DB=monitoreodb
CORS_ORIGINS=https://neuraljira.tech
JWT_SECRET_KEY=<generar_con_openssl_rand_hex_32>
SUPER_ADMIN_EMAIL=admin@ftth-mapper.com
SUPER_ADMIN_PASSWORD=<contraseña_segura>
SUPER_ADMIN_NAME=Super Administrador
```

> **Importante**: 
> - `JWT_SECRET_KEY` es **obligatoria**. Generar con: `openssl rand -hex 32`
> - Si `SUPER_ADMIN_PASSWORD` no se define o es insegura, se genera automáticamente una contraseña aleatoria (se guarda en los logs del primer deploy).

## 4. Dominio

En Dokploy, asignar el dominio al servicio **web**:
- **Dominio**: `neuraljira.tech`
- **Puerto interno**: `80`
- **HTTPS**: Activar (Dokploy/Traefik genera certificado automatico)

Solo se necesita **un dominio**. No se necesitan subdominios para API ni mapas.

## 5. Deploy

Clic en **Deploy**. Dokploy leera `docker-compose.yml` y levantara los 3 servicios.

### Verificar
- `https://neuraljira.tech` → Frontend
- `https://neuraljira.tech/api/v1/health` → API (debe retornar 200)
- `https://map.neuraljira.tech/api/v1/style.json` → Servicio de mapas (debe retornar 200)

## 6. Errores Comunes

### nginx: host not found in upstream "map-manager-1"
**Causa**: `nginx.conf` referencia un servicio que no existe en la red Docker.
**Solucion**: Eliminar el bloque `location /map-api/` de `nginx.conf` si el mapa se consume desde un servicio externo.

### useAuth debe usarse dentro de un AuthProvider
**Causa**: El Header se renderiza fuera del contexto `AuthProvider` durante transiciones de Astro.
**Solucion**: Ya esta resuelto en `AuthProvider.tsx` — `useAuth()` devuelve valores por defecto seguros cuando no hay contexto.

### 502 Bad Gateway en /map-api/
**Causa**: El proxy `/map-api/` apunta a un servicio que no esta corriendo.
**Solucion**: Verificar que `PUBLIC_MAP_TILE_URL` en `docker-compose.yml` apunte a la URL correcta del servicio de mapas.

## 7. Variables de Build del Frontend

Estas variables se establecen en el `docker-compose.yml` bajo `services.web.build.args`:

| Variable             | Valor                                       | Descripcion                          |
|----------------------|---------------------------------------------|--------------------------------------|
| `PUBLIC_API_URL`     | `/api/v1`                                   | URL base de la API (relativa)        |
| `PUBLIC_MAP_TILE_URL`| `https://map.neuraljira.tech/api/v1/style.json` | URL del servicio de mapas            |

> **Nota**: El frontend detecta automaticamente el hostname. En `neuraljira.tech` usa `https://map.neuraljira.tech/api/v1/style.json` directamente (ver `types.ts`).
