# Entorno Local vs Producción

Esta es la guía documentada del flujo de trabajo de la aplicación backend. Se usa FastAPI con una base de datos PostgreSQL/PostGIS.

## Arquitectura de Entornos

- **Desarrollo Local**: FastAPI se ejecuta directamente en el host de Windows usando un entorno virtual de Python (`venv`). Se conecta a la base de datos de PostgreSQL/PostGIS ejecutada como un contenedor local usando Docker, consumiendo el puerto expuesto `5432` a `localhost`.
- **Producción**: Todo se ejecuta dentro de Docker y orquestado a través de `docker-compose`. Ambos servicios (backend y database) operan en la red interna de Docker. El backend se comunica con la base de datos apuntando al host `db`.

## Para Desarrollar (Localmente)

Para ejecutar tu entorno localmente y hacer cambios bajo la configuración local de FastAPI conectando al contenedor de la base de datos `db`:

1. Levantar solo la base de datos en Docker con el siguiente comando:
   ```bash
   docker-compose up -d db
   ```

2. Configurar y activar el entorno virtual (`venv`):
   ```bash
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
   *Instala las dependencias del `requirements.txt` si es necesario (`pip install -r requirements.txt`).*

3. Ejecutar la API de FastAPI a través de `uvicorn`:
   ```bash
   uvicorn app.main:app --reload
   ```

*Nota: Asegúrate de revisar el archivo `.env` que contenga la cadena de conexión asignada hacia `localhost`.*

## Para Producción

Para desplegar ambos servicios (API y la base de datos) usando Docker e interoperando usando la red interna protegida e ignorando el archivo `.env`:

```bash
docker-compose up -d --build
```
*(No es necesario usar el venv ni ejecutar uvicorn localmente. Todos los servicios inicializarán en contenedores.)*
