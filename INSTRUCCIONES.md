# 🚀 Guía de despliegue — Zeppelin Web

## Qué vas a necesitar (todo gratuito)
- Cuenta en **GitHub** (github.com) → para guardar el código
- Cuenta en **Railway** (railway.app) → para el backend y la base de datos
- Cuenta en **Vercel** (vercel.com) → para el frontend

Tiempo estimado: **20-30 minutos**

---

## PASO 1 — Subir el código a GitHub

1. Entrá a **github.com** y creá una cuenta si no tenés
2. Hacé clic en **"New repository"** (botón verde)
3. Nombre: `zeppelin-web` → clic en **"Create repository"**
4. En tu computadora, abrí la carpeta `zeppelin/`
5. Abrí una terminal (en Windows: clic derecho → "Abrir terminal" o buscar "cmd")
6. Copiá y pegá estos comandos uno por uno:

```bash
cd zeppelin
git init
git add .
git commit -m "Primera versión de Zeppelin Web"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/zeppelin-web.git
git push -u origin main
```

> ⚠️ Reemplazá `TU_USUARIO` con tu nombre de usuario de GitHub

---

## PASO 2 — Deployar el backend en Railway

1. Entrá a **railway.app** → "Login with GitHub"
2. Clic en **"New Project"** → **"Deploy from GitHub repo"**
3. Seleccioná `zeppelin-web`
4. Cuando pregunte qué carpeta, seleccioná **`backend`**

### Agregar base de datos PostgreSQL:
1. En el proyecto, clic en **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway conecta la DB automáticamente

### Configurar variables de entorno:
1. Hacé clic en el servicio backend → pestaña **"Variables"**
2. Agregá:
   - `SECRET_KEY` → cualquier texto largo, ej: `mi-clave-super-secreta-zeppelin-2026`
3. La variable `DATABASE_URL` se agrega sola por Railway

### Inicializar la base de datos:
1. En el servicio backend → pestaña **"Shell"**
2. Ejecutá: `python seed.py`
3. Esto crea el usuario admin y los datos iniciales

### Anotar la URL del backend:
- En el servicio backend → pestaña **"Settings"** → **"Domains"**
- Generá un dominio público, quedará algo como: `zeppelin-backend.railway.app`
- **¡Copiá esa URL, la vas a necesitar!**

---

## PASO 3 — Deployar el frontend en Vercel

1. Entrá a **vercel.com** → "Login with GitHub"
2. Clic en **"Add New Project"** → seleccioná `zeppelin-web`
3. En **"Root Directory"** poné: `frontend`
4. En **"Environment Variables"** agregá:
   - Nombre: `REACT_APP_API_URL`
   - Valor: `https://tu-backend.railway.app` (la URL del paso anterior)
5. Clic en **"Deploy"**

Vercel te va a dar una URL tipo: `zeppelin-web.vercel.app`

---

## PASO 4 — Primer ingreso

1. Abrí la URL de Vercel en tu navegador
2. Ingresá con:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`
3. ⚠️ **Cambiá la contraseña inmediatamente** desde Configuración

---

## Resumen de URLs

| Qué | URL |
|-----|-----|
| Frontend (tu sistema) | `https://zeppelin-web.vercel.app` |
| Backend API | `https://zeppelin-backend.railway.app` |
| Documentación API | `https://zeppelin-backend.railway.app/docs` |

---

## ¿Problemas?

- **El backend no arranca:** Revisá que `DATABASE_URL` esté configurada en Railway
- **Error 401 al hacer login:** Asegurate de haber corrido `python seed.py`
- **El frontend no conecta:** Verificá que `REACT_APP_API_URL` apunte al backend correcto (sin `/` al final)
- **Error CORS:** Ya está configurado en el backend para aceptar cualquier origen

---

## Estructura del proyecto

```
zeppelin/
├── backend/               ← API Python/FastAPI
│   ├── app/
│   │   ├── main.py        ← Punto de entrada
│   │   ├── models/        ← Tablas de la base de datos
│   │   ├── api/routes/    ← Endpoints por módulo
│   │   └── core/          ← DB, seguridad, JWT
│   ├── seed.py            ← Datos iniciales (correr 1 vez)
│   ├── requirements.txt
│   └── Procfile
└── frontend/              ← React app
    ├── src/
    │   ├── pages/         ← Pantallas
    │   ├── components/    ← Layout y UI
    │   ├── lib/api.js     ← Cliente HTTP
    │   └── hooks/         ← Auth context
    └── package.json
```

---

## Módulos incluidos

✅ Login con JWT  
✅ Dashboard con KPIs en tiempo real  
✅ Clientes (CRUD completo)  
✅ Artículos / Stock  
✅ Facturación (FA, FB, NC, Remito, Presupuesto)  
✅ Cobranzas con selección múltiple  
✅ Pedidos  
✅ Proveedores  
✅ Caja  
✅ Bancos  
✅ Vendedores  
✅ Reportes (ventas, IVA, cta cte, stock, caja)  
✅ Base de datos PostgreSQL con toda la estructura del sistema original  

---

*Zeppelin Web — generado a partir de la estructura del sistema original Visual FoxPro*
