# RIMADLE — Guía de despliegue en Vercel

## Pasos para subir el juego

### 1. Consigue tu API key de Anthropic
- Ve a https://console.anthropic.com
- Inicia sesión o crea una cuenta
- En el menú lateral: **API Keys** → **Create Key**
- Copia la clave (empieza por `sk-ant-...`)

### 2. Crea una cuenta en Vercel
- Ve a https://vercel.com y regístrate (gratis)
- Puedes entrar con tu cuenta de GitHub, GitLab o email

### 3. Sube el proyecto
Tienes dos opciones:

**Opción A — Arrastrando la carpeta (más fácil):**
1. Ve a https://vercel.com/new
2. Haz clic en **"Browse"** o arrastra la carpeta `rimadle` entera
3. Vercel detectará la configuración automáticamente
4. Haz clic en **Deploy**

**Opción B — Desde GitHub:**
1. Sube la carpeta a un repositorio de GitHub
2. En Vercel: New Project → Import desde GitHub
3. Selecciona el repositorio → Deploy

### 4. Añade la API key (IMPORTANTE)
Antes o después del deploy:
1. En tu proyecto de Vercel → **Settings** → **Environment Variables**
2. Añade una variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** tu clave `sk-ant-...`
3. Haz clic en **Save**
4. Ve a **Deployments** → haz clic en los tres puntos del último deploy → **Redeploy**

### 5. ¡Listo!
Vercel te dará una URL del tipo `rimadle-xxxx.vercel.app` — ya puedes jugar desde cualquier dispositivo.

---

## Estructura del proyecto

```
rimadle/
├── public/
│   └── index.html      ← El juego completo
├── api/
│   └── rhyme.js        ← Backend que llama a la IA (oculta la API key)
├── vercel.json         ← Configuración de rutas
└── package.json        ← Configuración del proyecto
```

## ¿Cómo funciona?

```
Jugador → /api/rhyme (Vercel) → Anthropic API → respuesta → Jugador
```

La API key nunca llega al navegador del jugador — solo vive en el servidor de Vercel.
