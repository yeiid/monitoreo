# Guía de Despliegue en Dokploy

Dokploy es más minimalista que Coolify y se basa puramente en Docker Compose. Sigue estos pasos para desplegar tu proyecto:

## 1. Preparación en Dokploy
1. Crea un nuevo **Project** en Dokploy en tu VPS.
2. Crea un nuevo **Service** de tipo **Compose**.
3. Conecta tu repositorio de GitHub o carga los archivos manualmente.

## 2. Variables de Entorno
Configura las siguientes variables en la pestaña **Environment** de tu servicio en Dokploy:
- `POSTGRES_USER`: monitoreo (o el que prefieras)
- `POSTGRES_PASSWORD`: TuContraseñaSegura
- `POSTGRES_DB`: monitoreodb
- `PUBLIC_API_URL`: https://tu-api.dominio.com/api/v1
- `PUBLIC_MAP_TILE_URL`: https://tu-mapa.dominio.com/styles/basic/style.json

## 3. Configuración de Dominios
En Dokploy, a diferencia de Coolify, puedes asignar dominios a servicios específicos dentro de tu Compose:
- **API (api)**: Asígnale un dominio y mapea el puerto interno `8000`.
- **Web (web)**: Asígnale tu dominio principal y mapea el puerto interno `80`.
- **MapServer (mapserver)**: Asígnale un subdominio (ej: `mapa.dominio.com`) y mapea el puerto interno `8080`.

## 4. Volúmenes Persistentes
Asegúrate de que las rutas en tu VPS coincidan con el `docker-compose.prod.yml`:
- `/var/lib/monitoreo/db` -> Almacén de base de datos PostGIS.
- `/var/lib/monitoreo/maps` -> Donde movimos los archivos recientemente (PBF, mbtiles, estilos).

## 5. Ruta de Pruebas (Staging/Production Testing)
Para realizar pruebas de producción de manera segura antes de afectar el dominio principal:
1. Crea un nuevo **Service** en Dokploy llamado `monitoreo-staging`.
2. Usa una base de datos separada (ej: `monitoreodb_test`).
3. Asigna dominios de prueba (ej: `test.tu-dominio.com`).
4. Despliega desde la misma rama pero con variables de entorno diferentes para aislar el tráfico.

## 6. Aplicar y Desplegar
Una vez configurado, haz clic en **Deploy**. Dokploy leerá tu `docker-compose.prod.yml` (o el respectivo de cada carpeta) y levantará todo automáticamente.
