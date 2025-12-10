# Frontend - Gestor de Préstamos

Aplicación frontend para el sistema de gestión de préstamos, construida con Next.js.

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/               # Next.js App Router (páginas y layouts)
│   └── frontend/          # Componentes y hooks
├── public/                # Archivos estáticos
├── styles/                # Estilos globales
├── package.json
├── tsconfig.json
├── next.config.mjs
└── env.example
```

## Configuración

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   - Copiar `env.example` a `.env.local`
   - Actualizar `NEXT_PUBLIC_API_URL` con la URL de tu backend en Render

## Desarrollo

```bash
npm run dev
```

La aplicación se ejecutará en `http://localhost:3000`

## Producción

```bash
npm run build
npm start
```

## Despliegue en Vercel

1. Instalar Vercel CLI (opcional):
   ```bash
   npm i -g vercel
   ```

2. Desplegar:
   ```bash
   vercel
   ```

3. O conectar tu repositorio directamente desde el dashboard de Vercel

4. Configurar variables de entorno en el panel de Vercel:
   - `NEXT_PUBLIC_API_URL`: URL de tu backend en Render
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Clave pública para notificaciones push

## Variables de Entorno Requeridas

Ver `env.example` para la lista completa de variables necesarias.
