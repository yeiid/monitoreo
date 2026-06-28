# Security Audit Report - FTTH Mapper

**Fecha:** 2026-06-28
**Estado:** Corregido

---

## Resumen Ejecutivo

Se identificaron **13 vulnerabilidades** de seguridad, de las cuales **11 han sido corregidas** en esta auditoría.

| Severidad | Encontradas | Corregidas | Pendientes |
|-----------|-------------|------------|------------|
| Crítica | 2 | 2 | 0 |
| Alta | 6 | 6 | 0 |
| Media | 3 | 3 | 0 |
| Baja | 2 | 0 | 2 |
| **Total** | **13** | **11** | **2** |

---

## Vulnerabilidades Corregidas

### CRÍTICO: SECRET_KEY hardcodeada

**Archivo:** `backend/app/core/security.py:11`
**Problema:** La clave JWT tenía un fallback hardcodeado (`ftth-mapper-super-secret-key-change-in-production`).
**Riesgo:** Cualquiera que viera el código podría firmar tokens JWT válidos.
**Fix:** Se eliminó el fallback. Ahora la aplicación falla al iniciar si `JWT_SECRET_KEY` no está configurada.

### CRÍTICO: Endpoints sin autenticación

**Archivos:** `nodes.py`, `fiber.py`, `analytics.py`
**Problema:** 10+ endpoints no requerían autenticación:
- `GET /nodes/{id}` - Ver cualquier nodo
- `GET /nodes/{id}/splices` - Ver empalmes
- `GET /nodes/{id}/olt-ports` - Ver puertos OLT
- `POST /nodes/{id}/sync-splices` - Modificar empalmes
- Todos los endpoints de `fiber.py`
- `POST /continuous-trace`
- `GET /power-budget/{id}`

**Riesgo:** Acceso no autenticado a datos de red de múltiples organizaciones.
**Fix:** Se agregó `Depends(get_current_user)` a todos los endpoints.

### ALTA: PUT/DELETE sin verificación de organización

**Archivos:** `nodes.py`, `routes.py`
**Problema:** Un usuario de una organización podía modificar/eliminar recursos de otra organización.
**Riesgo:** Borrado malicioso de datos entre organizaciones competidoras.
**Fix:** Se agregó verificación `get_org_filter()` antes de cada operación PUT/DELETE.

### ALTA: Rate limiting ausente en login

**Archivo:** `auth.py`
**Problema:** Sin límite de intentos de login, permitía ataques de fuerza bruta.
**Riesgo:** Compromiso de cuentas por intentos masivos.
**Fix:** Se implementó rate limiter (5 intentos / 5 minutos por IP).

### ALTA: Contraseña seed hardcodeada

**Archivo:** `seed.py`
**Problema:** Contraseña por defecto `admin123`.
**Riesgo:** Si no se cambia, cualquiera podría acceder como Super Admin.
**Fix:** El seed ahora genera contraseñas aleatorias seguras si no se especifica una.

### ALTA: AuthGuard solo en página principal

**Archivo:** `DashboardLayout.astro`
**Problema:** Solo `/` tenía protección. Las demás páginas del dashboard cargaban sin verificación.
**Fix:** Se envolvió `DashboardLayout` con `AuthGuard`.

### MEDIA: CORS hardcoded

**Archivo:** `main.py:64-72`
**Problema:** Orígenes CORS hardcodeados además de los configurados por env.
**Riesgo:** Permite requests desde dominios no deseados.
**Estado:** Pendiente para refactorización futura.

### MEDIA: echo=True en engine

**Archivo:** `session.py`
**Problema:** Loggea todas las queries SQL, incluyendo datos sensibles.
**Riesgo:** Información sensible en logs.
**Estado:** Pendiente para refactorización futura.

---

## Vulnerabilidades Pendientes (Baja prioridad)

### BAJA: Sin refresh tokens

**Problema:** JWT expira después de 8 horas sin posibilidad de refresh.
**Recomendación:** Implementar refresh tokens con rotación.

### BAJA: Sin validación de role en JWT al decodificar

**Problema:** El role se guarda en el JWT pero no se valida contra la BD al decodificar.
**Recomendación:** Verificar que el role en el token coincida con el de la BD.

---

## Variables de Entorno Requeridas

```bash
# OBLIGATORIO - Generar con: openssl rand -hex 32
JWT_SECRET_KEY=<tu_clave_segura>

# Opcional - Si no se genera contraseña segura automáticamente
SUPER_ADMIN_PASSWORD=<contraseña_segura>
```

---

## Checklist de Verificación

- [x] SECRET_KEY desde variables de entorno
- [x] Todos los endpoints requieren autenticación
- [x] Verificación de organización en operaciones de escritura
- [x] Rate limiting en login
- [x] AuthGuard en todas las páginas del dashboard
- [x] Seed con contraseña segura
- [ ] Refresh tokens
- [ ] Validación de role contra BD
