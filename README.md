# StudyConnect

StudyConnect es una aplicacion web para conectar estudiantes universitarios en grupos de estudio compatibles por curso, ciclo y disponibilidad.

## Stack actual

- React 18
- Vite 5
- CSS modular por archivo
- LocalStorage para persistencia del prototipo
- PostgreSQL como modelo de base de datos propuesto en `schema.sql`

## Instalacion

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev      # Frontend + backend
npm run client   # Solo frontend Vite
npm run server   # Solo API Express
npm run build    # Compilacion de produccion
npm run preview  # Vista previa del build
```

## Backend/API

El proyecto ahora incluye una API en `server/index.js` con Express y PostgreSQL.

La documentacion tecnica completa esta en:

```text
docs/arquitectura.md
```

Antes de ejecutar, crea un archivo `.env` tomando como base `.env.example`:

```env
PORT=4000
DATABASE_URL=postgres://postgres:TU_PASSWORD@localhost:5432/studyconnect
JWT_SECRET=cambia_este_secreto_en_desarrollo
```

Luego inicia la app completa:

```bash
npm run dev
```

La API queda disponible en:

```text
http://localhost:4000/api
```

## Migraciones

Las migraciones SQL viven en:

```text
server/migrations/
```

La migracion `001_add_profile_group_fields.sql` agrega campos que la interfaz utiliza:

```text
users.availability
study_groups.modality
study_groups.university
study_groups.image_url
```

## Arquitectura del backend

```text
server/
  index.js                    # Arranque de Express y montaje de rutas
  db.js                       # Conexion a PostgreSQL
  middleware/
    auth.js                   # JWT y proteccion de endpoints
  routes/
    auth.routes.js            # Login y registro
    state.routes.js           # Estado inicial de la app
    groups.routes.js          # Crear grupos, solicitar unirse y salir
    joinRequests.routes.js    # Aceptar o rechazar solicitudes
    messages.routes.js        # Mensajes de chat
    profile.routes.js         # Edicion de perfil
    notifications.routes.js   # Notificaciones
  services/
    appState.js               # Construye el estado que consume React
  utils/
    asyncHandler.js           # Manejo de errores async
    formatters.js             # Utilidades de formato
    validation.js             # Validaciones de reglas de negocio
```

## Reglas validadas por backend

```text
- Autenticacion: email valido y contrasena minima.
- Perfil: nombre obligatorio y ciclo academico valido.
- Grupos: nombre/curso obligatorios, modalidad valida y 2-50 integrantes.
- Solicitudes: evita duplicados pendientes, grupos llenos y solicitudes del dueno.
- Chat: solo miembros o duenos pueden enviar mensajes.
```

La interfaz incluye una vista de solicitudes para revisar solicitudes enviadas y responder solicitudes recibidas.

El chat usa Socket.IO para recibir mensajes nuevos en tiempo real.

## Estructura

```text
Studyconnect/
├── index.html
├── package.json
├── schema.sql
└── src/
    ├── App.jsx
    ├── main.jsx
    └── styles.css
```

## Nota

Esta version ya usa React para componentes, estado y renderizado. La conexion real con backend/API queda como siguiente fase del proyecto.
