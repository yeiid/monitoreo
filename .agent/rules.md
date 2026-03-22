# Reglas del Agente Antigravity

Este archivo define las restricciones y guías críticas para el desarrollo de FTTH Mapper.

## 🏗️ Estructura de Carpetas (NO TOCAR / NO MOVER)
- `backend/app/`: Núcleo de la aplicación FastAPI.
- `backend/models/`: Definición de modelos SQLModel/SQLAlchemy.
- `frontend/src/`: Código fuente de la interfaz Astro/React.
- `frontend/src/components/mobile/`: **NUEVO** Componentes específicos para vista móvil.
- `.agent/`: Carpeta oficial de reglas. **REGLA DE ORO**: Antes de crear nuevos archivos de reglas, verifica esta carpeta para evitar duplicados.

## 🕸️ Jerarquía y Lógica de Red
1.  **FLUJO OBLIGATORIO**: Toda conexión debe seguir la secuencia lógica:
    *   **OLT** → **Mufla** o **Caja NAP**.
    *   **Mufla** → **Mufla** o **Caja NAP**.
    *   **Caja NAP** → **Cliente ONU**.
2.  **ORIGEN DE CABLE**: Un cable **DEBE** nacer de un nodo (Icono). Se prohíben cables sueltos en el mapa.
3.  **ODF**: Se considera parte integral de la OLT. No crear como nodo independiente a menos que se especifique.

## 🎨 Diseño y UX (Premium Standard)
1.  **Glassmorphism**: Paneles con `backdrop-filter: blur(20px)` y `rgba(10, 10, 20, 0.85)`.
2.  **Colores Oficiales**: OLT (#ef4444), Mufla (#f97316), NAP (#3b82f6), Cliente (#10b981).
3.  **Mobile-First**: Toda nueva pantalla o componente debe ser testeado en resolución móvil. La toolbar debe ser colapsable en pantallas pequeñas.

## 🛠️ Reglas de Implementación
1.  **Persistencia**: Nunca borres datos de la DB sin respaldo.
2.  **API Proxy**: Usa siempre rutas relativas `/api/v1/...`. **PROHIBIDO** usar `localhost:8000` en el código frontend.
3.  **Multi-Tenancy**: Respetar siempre el filtrado por `organization_id`.
4.  **No Duplicidad**: Antes de implementar una solución, busca si ya existe un componente similar para refactorizar en lugar de duplicar codigo (Ej: DiagramadorEmpalmes).
