# Plan de Integración Frontend - SEIRV

## 📋 Resumen Ejecutivo

Este documento detalla el plan completo para integrar las nuevas funcionalidades del backend en el frontend, incluyendo:
- Visualización del IRV (Índice de Riesgo Vehicular) normalizado y crudo
- Diseño de tarjetas de vehículos similar a la imagen de referencia
- Funcionalidad de administrador para editar severidad de recalls
- Mejoras en la visualización de recalls con información de severidad

---

## 🎯 Objetivos

1. **Visualizar IRV en la lista de vehículos**
   - Mostrar IRV normalizado (0-100) de forma prominente
   - Mostrar nivel de riesgo con colores (Bajo/Medio/Alto)
   - Incluir IRV crudo en detalles (opcional)

2. **Mejorar diseño de tarjetas de vehículos**
   - Diseño similar a la imagen de referencia
   - Información de recalls activos y pendientes
   - Botones de acción claros

3. **Funcionalidad de Admin para editar severidad**
   - Panel de administración para ver recalls
   - Formulario para editar severidad de recalls
   - Validación y feedback visual

4. **Mejoras en visualización de recalls**
   - Mostrar severidad calculada en cada recall
   - Indicadores visuales de severidad
   - Información de sincronización

---

## 📊 Endpoints del Backend Disponibles

### Endpoints de Vehículos

#### 1. `GET /api/v1/vehicles`
**Descripción:** Lista todos los vehículos del usuario autenticado

**Respuesta:**
```json
[
  {
    "id": 1,
    "make": "Honda",
    "model": "Civic",
    "year": 2018,
    "license_plate": "ABC-1234",
    "mileage": 75000,
    "irv_value": 20.0,           // IRV normalizado (0-100)
    "irv_level": "Bajo",         // "Sin Recalls", "Bajo", "Medio", "Alto"
    "category_name": "Sedán",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

**Estado actual:** ✅ Ya implementado en `Vehicles.jsx`
**Acción requerida:** Actualizar para mostrar `irv_value` y `irv_level` correctamente

---

#### 2. `GET /api/v1/vehicles/{vehicle_id}`
**Descripción:** Obtiene detalles completos de un vehículo

**Respuesta:**
```json
{
  "id": 1,
  "user_id": 1,
  "make": "Honda",
  "model": "Civic",
  "year": 2018,
  "license_plate": "ABC-1234",
  "mileage": 75000,
  "category_id": 1,
  "irv_value": 20.0,              // IRV normalizado (0-100)
  "irv_raw": 3.0,                 // IRV crudo (para análisis)
  "irv_level": "Bajo",            // Nivel de riesgo
  "last_irv_calculation": "2024-01-15T10:00:00Z",
  "category_name": "Sedán",
  "total_recalls": 2,             // Total de recalls del vehículo
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Estado actual:** ❌ No implementado
**Acción requerida:** Crear página de detalle de vehículo

---

#### 3. `GET /api/v1/vehicles/{vehicle_id}/recalls`
**Descripción:** Obtiene los recalls de un vehículo

**Respuesta:**
```json
{
  "vehicle_id": 1,
  "make": "Honda",
  "model": "Civic",
  "year": 2018,
  "total_recalls": 2,
  "recalls": [
    {
      "NHTSACampaignNumber": "23V123456",
      "Component": "Brakes",
      "Summary": "Brake failure may occur...",
      "Consequence": "Loss of braking ability...",
      "Remedy": "Replace brake pads...",
      "ReportReceivedDate": "2023-05-15",
      "Manufacturer": "Honda",
      "severity": 3,               // 1=Baja, 2=Media, 3=Alta
      "severity_score": 3.2       // Score numérico para cálculos
    }
  ]
}
```

**Estado actual:** ✅ Ya implementado en `Recalls.jsx`
**Acción requerida:** Mostrar `severity` y `severity_score` en la UI

---

#### 4. `POST /api/v1/vehicles/{vehicle_id}/recalls/sync`
**Descripción:** Sincroniza recalls desde NHTSA y los guarda en BD

**Respuesta:**
```json
{
  "message": "Recalls sincronizados exitosamente",
  "vehicle_id": 1,
  "stats": {
    "total_nhtsa": 2,
    "created": 1,
    "updated": 1,
    "errors": []
  },
  "irv_value": 20.0,
  "irv_raw": 3.0,
  "irv_level": "Bajo"
}
```

**Estado actual:** ❌ No implementado
**Acción requerida:** Agregar botón de sincronización en página de recalls

---

#### 5. `POST /api/v1/vehicles/{vehicle_id}/irv/calculate`
**Descripción:** Calcula manualmente el IRV de un vehículo

**Query Params:**
- `include_breakdown` (bool, opcional): Incluir desglose detallado

**Respuesta:**
```json
{
  "message": "IRV calculado exitosamente",
  "vehicle_id": 1,
  "irv_value": 20,
  "irv_raw": 3.0,
  "irv_level": "Bajo",
  "last_calculation": "2024-01-15T10:00:00Z",
  "breakdown": {                  // Solo si include_breakdown=true
    "total_recalls": 2,
    "sum_severity_time": 5.2,
    "average_severity_time": 2.6,
    "mileage_factor": 1.15,
    "category_factor": 1.2,
    "category_avg_recalls": 2.5,
    "irv_raw": 3.0,
    "irv_max_teorico": 15.0,
    "irv_normalized": 20,
    "recall_details": [...]
  }
}
```

**Estado actual:** ❌ No implementado
**Acción requerida:** Agregar botón de recálculo en página de detalle

---

### Endpoints de Administración (Solo ADMIN)

#### 6. `GET /api/v1/vehicles/admin/recalls/{recall_id}`
**Descripción:** Obtiene detalles completos de un recall (SOLO ADMIN)

**Respuesta:**
```json
{
  "id": 5,
  "vehicle_id": 1,
  "nhtsa_campaign_number": "23V123456",
  "component": "Brakes",
  "summary": "Brake failure may occur...",
  "consequence": "Loss of braking ability...",
  "remedy": "Replace brake pads...",
  "manufacturer": "Honda",
  "report_received_date": "2023-05-15T00:00:00Z",
  "severity": 3,                 // Nivel actual (1, 2, o 3)
  "severity_score": 3.2,         // Score actual
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z",
  "last_synced_at": "2024-01-15T10:00:00Z"
}
```

**Estado actual:** ❌ No implementado
**Acción requerida:** Crear página de administración de recalls

---

#### 7. `PUT /api/v1/vehicles/admin/recalls/{recall_id}/severity`
**Descripción:** Actualiza la severidad de un recall (SOLO ADMIN)

**Query Params:**
- `recalculate_irv` (bool, default: true): Recalcular IRV del vehículo después de actualizar

**Body:**
```json
{
  "severity": 3,                  // 1, 2, o 3 (requerido)
  "severity_score": 3.5,         // Opcional (1.0-5.0)
  "notes": "Corregido manualmente: recall crítico de frenos"  // Opcional
}
```

**Respuesta:**
```json
{
  "id": 5,
  "vehicle_id": 1,
  "severity": 3,
  "severity_score": 3.5,
  // ... resto de campos del recall
}
```

**Estado actual:** ❌ No implementado
**Acción requerida:** Crear formulario de edición de severidad

---

## 🎨 Diseño de Tarjetas de Vehículos

### Estructura Visual (Basada en Imagen de Referencia)

```
┌─────────────────────────────────────────┐
│  Honda Civic 2018                       │
│  Kilometraje: 75,000 km                 │
│  Categoría: Sedán                       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        20                       │   │
│  │  [Riesgo Bajo]                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📋 2 Recalls activos                   │
│  ⚠️  1 Recall pendiente de atención    │
│                                         │
│  [Ver Detalles]  [Eliminar]            │
└─────────────────────────────────────────┘
```

### Componentes Requeridos

1. **Header de Tarjeta**
   - Nombre completo: `{make} {model} {year}`
   - Kilometraje formateado: `{mileage.toLocaleString()} km`
   - Categoría: `{category_name}`

2. **Sección IRV (Prominente)**
   - Número grande: `{irv_value}` (IRV normalizado)
   - Badge de nivel: `{irv_level}` con colores:
     - **Verde**: "Bajo" (0-33)
     - **Amarillo**: "Medio" (34-66)
     - **Rojo**: "Alto" (67-100)
     - **Gris**: "Sin Recalls" (0)

3. **Información de Recalls**
   - Total de recalls activos: `{total_recalls}`
   - Recalls pendientes (lógica a definir):
     - Si hay recalls con severidad 3 → "X Recall pendiente de atención"
     - Si todos atendidos → "✅ Todos atendidos"

4. **Botones de Acción**
   - "Ver Detalles" → Navegar a `/vehicles/{id}`
   - "Eliminar" → Confirmar y eliminar

---

## 📝 Tareas de Implementación

### Fase 1: Actualización de Lista de Vehículos

#### 1.1 Actualizar `src/pages/Vehicles.jsx`

**Cambios requeridos:**

1. **Actualizar servicio API** (`src/services/api.js`):
   ```javascript
   // Agregar método para obtener detalle de vehículo
   async getById(id) {
     const res = await apiClient.get(`/vehicles/${id}`);
     return res.data;
   },
   
   // Agregar método para sincronizar recalls
   async syncRecalls(vehicleId) {
     const res = await apiClient.post(`/vehicles/${vehicleId}/recalls/sync`);
     return res.data;
   },
   
   // Agregar método para calcular IRV
   async calculateIRV(vehicleId, includeBreakdown = false) {
     const res = await apiClient.post(
       `/vehicles/${vehicleId}/irv/calculate`,
       null,
       { params: { include_breakdown: includeBreakdown } }
     );
     return res.data;
   },
   ```

2. **Actualizar componente Vehicles.jsx**:
   - Modificar estructura de tarjeta para mostrar IRV de forma prominente
   - Agregar colores según `irv_level`:
     - Verde para "Bajo"
     - Amarillo para "Medio"
     - Rojo para "Alto"
     - Gris para "Sin Recalls"
   - Mostrar `total_recalls` si está disponible
   - Agregar link a página de detalle

3. **Crear estilos CSS**:
   - Estilos para tarjeta de vehículo (similar a imagen)
   - Estilos para sección IRV (número grande, badge)
   - Colores para niveles de riesgo
   - Estilos para información de recalls

**Archivos a modificar:**
- `src/pages/Vehicles.jsx`
- `src/services/api.js`
- `src/pages/Vehicles.css` (crear si no existe)

---

### Fase 2: Página de Detalle de Vehículo

#### 2.1 Crear `src/pages/VehicleDetail.jsx`

**Funcionalidades:**

1. **Información del vehículo**
   - Datos completos del vehículo
   - IRV normalizado y crudo
   - Última fecha de cálculo

2. **Sección de IRV**
   - Visualización del IRV normalizado (0-100)
   - IRV crudo (opcional, en tooltip o sección expandible)
   - Nivel de riesgo con colores
   - Botón para recalcular IRV manualmente
   - Desglose del cálculo (opcional, expandible)

3. **Sección de Recalls**
   - Lista de recalls con severidad
   - Botón para sincronizar recalls
   - Indicadores visuales de severidad

4. **Acciones**
   - Editar kilometraje
   - Sincronizar recalls
   - Recalcular IRV
   - Eliminar vehículo

**Archivos a crear:**
- `src/pages/VehicleDetail.jsx`
- `src/pages/VehicleDetail.css`

**Ruta a agregar:**
```javascript
// En App.jsx o router
<Route path="/vehicles/:id" element={<VehicleDetail />} />
```

---

### Fase 3: Mejoras en Visualización de Recalls

#### 3.1 Actualizar `src/pages/Recalls.jsx`

**Cambios requeridos:**

1. **Mostrar severidad en cada recall**
   - Badge de severidad:
     - 🔴 Alta (3)
     - 🟡 Media (2)
     - 🟢 Baja (1)
   - Mostrar `severity_score` (opcional, tooltip)

2. **Agregar botón de sincronización**
   - Botón "Sincronizar Recalls" en la página
   - Mostrar loading durante sincronización
   - Mostrar mensaje de éxito/error
   - Actualizar lista después de sincronizar

3. **Mejorar visualización**
   - Agrupar recalls por severidad (opcional)
   - Resaltar recalls de alta severidad
   - Mostrar fecha de última sincronización

**Archivos a modificar:**
- `src/pages/Recalls.jsx`
- `src/pages/Recalls.scss`

---

### Fase 4: Panel de Administración de Recalls

#### 4.1 Crear `src/pages/AdminRecalls.jsx`

**Funcionalidades:**

1. **Lista de recalls del sistema**
   - Filtrar por vehículo, severidad, etc.
   - Buscar por número de campaña NHTSA
   - Paginación

2. **Vista de detalle de recall**
   - Información completa del recall
   - Severidad actual (visual)
   - Formulario para editar severidad

3. **Formulario de edición de severidad**
   - Selector de severidad (1, 2, 3)
   - Campo opcional para `severity_score`
   - Campo opcional para notas
   - Checkbox: "Recalcular IRV del vehículo" (checked por defecto)
   - Botones: "Guardar" y "Cancelar"

4. **Validación**
   - Severidad debe ser 1, 2, o 3
   - `severity_score` debe estar entre 1.0 y 5.0
   - Mostrar mensajes de error

5. **Feedback visual**
   - Mostrar severidad anterior vs nueva
   - Mensaje de éxito después de guardar
   - Actualizar lista automáticamente

**Archivos a crear:**
- `src/pages/AdminRecalls.jsx`
- `src/pages/AdminRecalls.css`

**Servicios a agregar en `src/services/api.js`:**
```javascript
export const recallAdminService = {
  async getRecallDetail(recallId) {
    const res = await apiClient.get(`/vehicles/admin/recalls/${recallId}`);
    return res.data;
  },
  
  async updateSeverity(recallId, payload, recalculateIRV = true) {
    const res = await apiClient.put(
      `/vehicles/admin/recalls/${recallId}/severity?recalculate_irv=${recalculateIRV}`,
      payload
    );
    return res.data;
  },
};
```

**Ruta a agregar:**
```javascript
// En App.jsx o router (protegida con AdminRoute)
<Route 
  path="/admin/recalls" 
  element={
    <AdminRoute>
      <AdminRecalls />
    </AdminRoute>
  } 
/>
```

---

## 🎨 Guía de Estilos

### Colores para Niveles de IRV

```css
/* IRV Bajo (0-33) */
.irv-level-bajo {
  background-color: #10b981; /* Verde */
  color: white;
}

/* IRV Medio (34-66) */
.irv-level-medio {
  background-color: #f59e0b; /* Amarillo */
  color: white;
}

/* IRV Alto (67-100) */
.irv-level-alto {
  background-color: #ef4444; /* Rojo */
  color: white;
}

/* Sin Recalls */
.irv-level-sin-recalls {
  background-color: #6b7280; /* Gris */
  color: white;
}
```

### Colores para Severidad de Recalls

```css
/* Severidad Alta (3) */
.severity-high {
  background-color: #ef4444; /* Rojo */
  color: white;
}

/* Severidad Media (2) */
.severity-medium {
  background-color: #f59e0b; /* Amarillo */
  color: white;
}

/* Severidad Baja (1) */
.severity-low {
  background-color: #10b981; /* Verde */
  color: white;
}
```

### Componente de Tarjeta de Vehículo

```css
.vehicle-card {
  background: #1f2937; /* Dark gray */
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.vehicle-card .irv-display {
  text-align: center;
  margin: 20px 0;
}

.vehicle-card .irv-value {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 8px;
}

.vehicle-card .irv-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}
```

---

## 🔧 Utilidades y Helpers

### Crear `src/utils/irv.js`

```javascript
/**
 * Obtiene el color de clase CSS según el nivel de IRV
 */
export function getIRVLevelClass(irvLevel) {
  const level = irvLevel?.toLowerCase();
  if (level === 'bajo') return 'irv-level-bajo';
  if (level === 'medio') return 'irv-level-medio';
  if (level === 'alto') return 'irv-level-alto';
  return 'irv-level-sin-recalls';
}

/**
 * Obtiene el texto en español del nivel de IRV
 */
export function getIRVLevelText(irvLevel) {
  const level = irvLevel?.toLowerCase();
  const map = {
    'bajo': 'Riesgo Bajo',
    'medio': 'Riesgo Medio',
    'alto': 'Riesgo Alto',
    'sin recalls': 'Sin Recalls',
    'n/a': 'Sin Recalls'
  };
  return map[level] || 'Sin Recalls';
}

/**
 * Obtiene el color de clase CSS según la severidad
 */
export function getSeverityClass(severity) {
  if (severity === 3) return 'severity-high';
  if (severity === 2) return 'severity-medium';
  if (severity === 1) return 'severity-low';
  return 'severity-unknown';
}

/**
 * Obtiene el texto en español de la severidad
 */
export function getSeverityText(severity) {
  const map = {
    3: 'Alta',
    2: 'Media',
    1: 'Baja'
  };
  return map[severity] || 'Desconocida';
}
```

---

## 📱 Estructura de Navegación

### Rutas a Agregar/Modificar

```javascript
// En App.jsx o router principal

// Rutas públicas
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />

// Rutas privadas
<Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
<Route path="/vehicles" element={<PrivateRoute><Vehicles /></PrivateRoute>} />
<Route path="/vehicles/new" element={<PrivateRoute><VehicleForm /></PrivateRoute>} />
<Route path="/vehicles/:id" element={<PrivateRoute><VehicleDetail /></PrivateRoute>} />
<Route path="/recalls" element={<PrivateRoute><Recalls /></PrivateRoute>} />

// Rutas de administración
<Route path="/admin/users" element={<AdminRoute><UsersManagement /></AdminRoute>} />
<Route path="/admin/recalls" element={<AdminRoute><AdminRecalls /></AdminRoute>} />
```

---

## ✅ Checklist de Implementación

### Fase 1: Lista de Vehículos
- [ ] Actualizar `src/services/api.js` con nuevos métodos
- [ ] Modificar `src/pages/Vehicles.jsx` para mostrar IRV
- [ ] Crear estilos CSS para tarjetas de vehículos
- [ ] Implementar colores según nivel de IRV
- [ ] Agregar información de recalls en tarjetas
- [ ] Agregar link a página de detalle

### Fase 2: Página de Detalle
- [ ] Crear `src/pages/VehicleDetail.jsx`
- [ ] Crear `src/pages/VehicleDetail.css`
- [ ] Implementar visualización de IRV (normalizado y crudo)
- [ ] Implementar sección de recalls con severidad
- [ ] Agregar botón de sincronización de recalls
- [ ] Agregar botón de recálculo de IRV
- [ ] Agregar ruta en router

### Fase 3: Mejoras en Recalls
- [ ] Actualizar `src/pages/Recalls.jsx` para mostrar severidad
- [ ] Agregar badges de severidad en lista de recalls
- [ ] Agregar botón de sincronización
- [ ] Mejorar estilos de visualización

### Fase 4: Panel de Admin
- [ ] Crear `src/pages/AdminRecalls.jsx`
- [ ] Crear `src/pages/AdminRecalls.css`
- [ ] Agregar servicios de API para admin
- [ ] Implementar lista de recalls con filtros
- [ ] Implementar formulario de edición de severidad
- [ ] Agregar validación y feedback
- [ ] Agregar ruta protegida con AdminRoute

### Utilidades
- [ ] Crear `src/utils/irv.js` con funciones helper
- [ ] Probar funciones helper

### Testing
- [ ] Probar visualización de IRV en lista
- [ ] Probar página de detalle
- [ ] Probar sincronización de recalls
- [ ] Probar recálculo de IRV
- [ ] Probar edición de severidad (como admin)
- [ ] Probar validaciones
- [ ] Probar manejo de errores

---

## 🐛 Manejo de Errores

### Errores Comunes y Soluciones

1. **Error 401 (No autorizado)**
   - Verificar que el token esté en localStorage
   - Redirigir a login si el token expiró

2. **Error 403 (Prohibido - Admin)**
   - Verificar que el usuario tenga rol ADMIN
   - Mostrar mensaje: "No tienes permisos para acceder a esta sección"

3. **Error 404 (Vehículo no encontrado)**
   - Mostrar mensaje: "Vehículo no encontrado"
   - Redirigir a lista de vehículos

4. **Error 500 (Error del servidor)**
   - Mostrar mensaje genérico: "Error al procesar la solicitud"
   - Log del error en consola para debugging

---

## 📚 Referencias

### Documentación del Backend
- `IRV_CALCULATION.md` - Fórmula y componentes del IRV
- `IRV_STORAGE.md` - Almacenamiento del IRV en BD
- Endpoints documentados en Swagger/OpenAPI (si está disponible)

### Imagen de Referencia
- Diseño de tarjetas de vehículos a seguir
- Colores y estilos visuales

---

## 🚀 Orden de Implementación Recomendado

1. **Primero:** Actualizar lista de vehículos (Fase 1)
   - Impacto visual inmediato
   - Cambios relativamente simples

2. **Segundo:** Mejoras en Recalls (Fase 3)
   - Complementa la funcionalidad existente
   - No requiere nuevas páginas

3. **Tercero:** Página de detalle (Fase 2)
   - Requiere más trabajo pero es fundamental
   - Permite ver IRV crudo y detalles completos

4. **Cuarto:** Panel de Admin (Fase 4)
   - Funcionalidad especializada
   - Solo para usuarios admin

---

## 📝 Notas Adicionales

1. **IRV Raw vs Normalizado**
   - El IRV normalizado (0-100) es lo que se muestra principalmente
   - El IRV crudo es para análisis técnico y puede mostrarse en tooltips o secciones expandibles

2. **Sincronización de Recalls**
   - La sincronización actualiza los recalls y recalcula el IRV automáticamente
   - Mostrar feedback visual durante la sincronización

3. **Recálculo de IRV**
   - El recálculo puede tardar unos segundos
   - Mostrar loading state durante el cálculo
   - Actualizar valores en la UI después del cálculo

4. **Edición de Severidad (Admin)**
   - Solo usuarios con rol ADMIN pueden editar
   - La edición puede afectar el IRV del vehículo
   - Siempre recalcular IRV después de editar (por defecto)

---

## 🎯 Objetivos de Calidad

- ✅ Diseño responsive (móvil y desktop)
- ✅ Feedback visual claro en todas las acciones
- ✅ Manejo de errores robusto
- ✅ Código limpio y mantenible
- ✅ Accesibilidad básica (colores, contraste, etc.)
- ✅ Performance optimizada (lazy loading, paginación)

---

**Última actualización:** 2024-01-15
**Versión:** 1.0

