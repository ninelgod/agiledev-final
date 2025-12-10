# Backend - Gestor de Préstamos

API backend para el sistema de gestión de préstamos.

## Estructura del Proyecto

```
backend/
├── src/
│   ├── server.ts          # Servidor Express principal
│   ├── api/               # Rutas API (convertidas de Next.js)
│   └── lib/               # Lógica de negocio y utilidades
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   └── seed.ts            # Datos de prueba
├── package.json
├── tsconfig.json
└── env.example
```

## Configuración

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   - Copiar `env.example` a `.env`
   - Actualizar las variables según tu entorno

3. **Configurar base de datos:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

## Desarrollo

```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:4000`

## Producción

```bash
npm run build
npm start
```

## Despliegue en Render

1. Crear un nuevo Web Service en Render
2. Conectar tu repositorio
3. Configurar:
   - **Build Command:** `npm install && npm run prisma:generate && npm run build`
   - **Start Command:** `npm start`
4. Agregar variables de entorno desde el panel de Render
5. Desplegar

## Variables de Entorno Requeridas

Ver `env.example` para la lista completa de variables necesarias.
