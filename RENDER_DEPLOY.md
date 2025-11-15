# Guía de Deployment en Render

Esta guía te ayudará a deployar tu aplicación SEIRV en Render.

## 📋 Pre-requisitos

1. Cuenta en [Render](https://render.com) (gratuita)
2. Tu código en un repositorio Git (GitHub, GitLab, o Bitbucket)
3. Acceso a tu repositorio desde Render

## 🗄️ Paso 1: Crear Base de Datos PostgreSQL

1. Ve a tu [Dashboard de Render](https://dashboard.render.com/)
2. Click en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name**: `seirv-db` (o el nombre que prefieras)
   - **Database**: `seirv_db`
   - **User**: Se genera automáticamente
   - **Region**: Elige el más cercano a tus usuarios
   - **PostgreSQL Version**: 15
   - **Plan**: Free (para empezar)
4. Click en **"Create Database"**
5. **IMPORTANTE**: Anota las siguientes variables (las verás después de crear):
   - `Internal Database URL` (para el backend)
   - `External Database URL` (para conexiones externas, si es necesario)

## 🔧 Paso 2: Deployar Backend (Web Service)

1. En tu Dashboard, click **"New +"** → **"Web Service"**
2. Conecta tu repositorio
3. Configura el servicio:
   - **Name**: `seirv-backend` (o el nombre que prefieras)
   - **Environment**: `Docker`
   - **Region**: Misma región que tu base de datos
   - **Branch**: `master` (o tu rama principal)
   - **Root Directory**: `seirv-backend`
   - **Dockerfile Path**: `seirv-backend/Dockerfile`
   - **Docker Context**: `seirv-backend`

### Variables de Entorno del Backend:

Agrega estas variables en **"Environment"**:

```
DATABASE_URL=<Internal Database URL de tu PostgreSQL>
SECRET_KEY=<Genera una clave secreta fuerte (puedes usar: openssl rand -hex 32)>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=False
API_V1_PREFIX=/api/v1
CORS_ORIGINS=https://seirv-frontend.onrender.com,http://localhost:3000,http://localhost:5173
```

**NOTA**: Reemplaza `seirv-frontend.onrender.com` con el dominio real de tu frontend (lo obtendrás después de deployar el frontend).

### Configuración Avanzada del Backend:

- **Build Command**: (Dejar vacío, Docker lo maneja)
- **Start Command**: (Dejar vacío, Docker lo maneja)
- **Plan**: Free (750 horas/mes gratis)

4. Click en **"Create Web Service"**

El backend se desplegará y tendrás una URL como: `https://seirv-backend.onrender.com`

## 🎨 Paso 3: Deployar Frontend (Static Site O Web Service)

Tienes dos opciones:

### Opción A: Static Site (Recomendado - Más económico)

1. En tu Dashboard, click **"New +"** → **"Static Site"**
2. Conecta tu repositorio
3. Configura:
   - **Name**: `seirv-frontend`
   - **Branch**: `master`
   - **Root Directory**: `seirv-frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://seirv-backend.onrender.com/api/v1
     ```
   **NOTA**: Reemplaza `seirv-backend.onrender.com` con la URL real de tu backend.

### Opción B: Web Service con Docker (Como tienes Dockerfile)

1. En tu Dashboard, click **"New +"** → **"Web Service"**
2. Conecta tu repositorio
3. Configura:
   - **Name**: `seirv-frontend`
   - **Environment**: `Docker`
   - **Root Directory**: `seirv-frontend`
   - **Dockerfile Path**: `seirv-frontend/Dockerfile`
   - **Docker Context**: `seirv-frontend`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://seirv-backend.onrender.com/api/v1
     ```

4. Click en **"Create"**

## 🔄 Paso 4: Actualizar CORS del Backend

Una vez que tengas la URL del frontend:

1. Ve a tu servicio de Backend en Render
2. Ve a **"Environment"**
3. Actualiza `CORS_ORIGINS` con la URL real de tu frontend:
   ```
   CORS_ORIGINS=https://seirv-frontend.onrender.com,http://localhost:3000,http://localhost:5173
   ```
4. Guarda los cambios (se reiniciará automáticamente)

## ✅ Paso 5: Verificar el Deployment

1. **Backend**: Visita `https://seirv-backend.onrender.com/docs` para ver la documentación de la API
2. **Frontend**: Visita tu URL de frontend
3. Prueba el login y las funcionalidades

## 📝 Notas Importantes

### Base de Datos:
- El plan **Free** de PostgreSQL en Render tiene 90 días de vida inactiva. Si no usas la DB por 90 días, se pausa.
- Para producción, considera un plan pago.

### Web Services:
- El plan **Free** permite 750 horas/mes (suficiente para un servicio que corre 24/7)
- Los servicios free se "duermen" después de 15 minutos de inactividad
- La primera petición después de dormir puede tardar ~30 segundos en responder

### URLs:
- Render asigna URLs automáticamente: `https://<nombre-servicio>.onrender.com`
- Puedes configurar un dominio personalizado en **"Settings"** → **"Custom Domain"**

## 🔧 Troubleshooting

### Backend no se conecta a la base de datos:
- Verifica que `DATABASE_URL` use la **Internal Database URL**
- Asegúrate de que el backend y la DB estén en la misma región

### Error de CORS:
- Verifica que `CORS_ORIGINS` incluya la URL exacta de tu frontend (con `https://`)
- El backend debe reiniciarse después de cambiar variables de entorno

### Frontend no carga datos:
- Verifica que `VITE_API_URL` apunte correctamente al backend
- Revisa la consola del navegador para errores
- Verifica que el backend esté corriendo y respondiendo

### Servicio se duerme:
- En el plan free, esto es normal
- Considera usar un servicio de "ping" (como UptimeRobot) para mantenerlo activo
- O actualiza a un plan pago

## 🚀 Comandos Útiles

Para generar un `SECRET_KEY` seguro:
```bash
openssl rand -hex 32
```

Para ver logs en Render:
- Ve a tu servicio → **"Logs"** tab

## 📚 Recursos

- [Documentación de Render](https://render.com/docs)
- [Render PostgreSQL](https://render.com/docs/databases)
- [Render Web Services](https://render.com/docs/web-services)

