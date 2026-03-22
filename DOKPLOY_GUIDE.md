# 🚀 Guía de Despliegue en Dokploy — neuraljira.tech

## Arquitectura

Todo se sirve bajo **un solo dominio** (`neuraljira.tech`):
- `/` → Frontend (Astro/React vía Nginx)
- `/api/` → Backend API (FastAPI) — proxy por Nginx
- `/tiles/` → TileServer GL (mapa propio) — proxy por Nginx

## 1. Preparación

### En tu repositorio (local)
```bash
# Eliminar archivos obsoletos (ejecutar una sola vez)
powershell -File cleanup.ps1
# O manualmente:
# del backend\fly.toml backend\fix_status.py backend\docker-compose.yml
# del frontend\docker-compose.yml maps\docker-compose.yml
# del docker-compose.test-prod.yml docker-compose.local.yml docker-compose.prod.yml
# rmdir /s backend\scripts maps\styles\osm-bright

git add -A
git commit -m "chore: cleanup for production deployment"
git push
```

### Subir colombia.mbtiles al VPS
El archivo de mapa (~245MB) **no va en Git**. Súbelo manualmente:
```bash
# Desde tu máquina local (PowerShell/WSL):
scp maps/colombia.mbtiles tu-usuario@tu-vps:/tmp/colombia.mbtiles
```
Luego en el VPS copiaremos el archivo al volumen Docker (ver paso 4).

## 2. Configurar Dokploy

1. Crear un nuevo **Project** en Dokploy.
2. Crear un nuevo **Service** tipo **Compose**.
3. Conectar tu repositorio de GitHub.
4. En **Compose Path** seleccionar: `docker-compose.yml` (la raíz).

## 3. Variables de Entorno

En la pestaña **Environment** de Dokploy:
```env
POSTGRES_USER=monitoreo
POSTGRES_PASSWORD=TuContraseñaSegura123!
POSTGRES_DB=monitoreodb
CORS_ORIGINS=https://neuraljira.tech
```

> ⚠️ **Cambia la contraseña** por una segura. Las variables de frontend (`PUBLIC_API_URL`, `PUBLIC_MAP_TILE_URL`) ya están hardcodeadas en el compose como `/api/v1` y `/tiles/`.

## 4. Provisionar el Archivo de Mapa

Después del primer deploy, el volumen `map_data` existe pero está vacío. Copia el `.mbtiles`:

```bash
# En el VPS, encontrar el ID del volumen
docker volume inspect <proyecto>_map_data

# Copiar el archivo al volumen
docker cp /tmp/colombia.mbtiles <contenedor_tileserver>:/data/colombia.mbtiles

# Reiniciar tileserver
docker restart <contenedor_tileserver>
```

Alternativamente, si usas Dokploy con volúmenes persistentes mapeados:
```bash
cp /tmp/colombia.mbtiles /var/lib/docker/volumes/<proyecto>_map_data/_data/colombia.mbtiles
```

## 5. Dominio

En Dokploy, asignar el dominio al servicio **web**:
- **Dominio**: `neuraljira.tech`
- **Puerto interno**: `80`
- **HTTPS**: Activar (Dokploy/Traefik genera certificado automático)

Solo se necesita **un dominio**. No se necesitan subdominios para API ni mapas.

## 6. Deploy

Clic en **Deploy**. Dokploy leerá `docker-compose.yml` y levantará los 4 servicios.

### Verificar
- `https://neuraljira.tech` → Frontend
- `https://neuraljira.tech/api/v1/health` → API (debe retornar 200)
- `https://neuraljira.tech/tiles/styles/basic/style.json` → Estilo del mapa
