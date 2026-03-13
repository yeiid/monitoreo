# Reglas del Agente Antigravity

Este archivo define las restricciones y guías para el agente IA al trabajar en este proyecto.

## Estructura de Carpetas (NO TOCAR / NO MOVER)

- `backend/app/`: Núcleo de la aplicación FastAPI.
- `backend/models/`: Definición de modelos SQLModel/SQLAlchemy. No mover a carpetas externas sin permiso.
- `backend/api/`: Endpoints de la API. Mantener la estructura de versiones (v1/).
- `backend/scripts/`: Scripts de utilidad y mantenimiento de DB. No mover de aquí.
- `frontend/src/`: Código fuente de la interfaz Astro/React.
- `frontend/public/`: Assets estáticos y mapas.

## Reglas de Implementación

1. **Persistencia de Datos**: Nunca realices cambios destructivos en la base de datos sin un script de respaldo o aviso previo.
2. **Multi-Tenancy**: Toda nueva funcionalidad debe respetar el aislamiento por `organization_id`.
3. **Estética**: El frontend debe mantener el estilo "Premium Glassmorphism" y Modo Oscuro. No degradar la calidad visual por funcionalidad.
4. **Imports**: Siempre verifica los imports relativos al mover archivos. Especialmente al usar `dotenv`, asegúrate de que el path al archivo `.env` sea correcto.
5. **Configuración**: No sobrescribas el `DATABASE_URL` en `.env` sin verificar si el usuario está en modo VPS o Local.

## Docker y Despliegue

- No modificar los archivos `docker-compose*.yml` a menos que sea necesario para añadir servicios nuevos solicitados.
- Respetar las configuraciones de `fly.toml` y despliegue en Coolify.

## Comunicación
- Si un error de conexión persiste (como Timeout de DB), informa al usuario antes de intentar cambios masivos en el código de red.
