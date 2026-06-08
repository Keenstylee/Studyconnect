# StudyConnect - Documentacion tecnica

## Resumen

StudyConnect es una aplicacion web para conectar estudiantes universitarios con grupos de estudio compatibles por curso, ciclo y disponibilidad.

La version actual usa una arquitectura cliente-servidor:

```text
React + Vite
  -> API REST con Express
  -> PostgreSQL
```

## Stack

| Capa | Tecnologia |
|---|---|
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| Base de datos | PostgreSQL |
| Seguridad | bcryptjs, JWT |
| Tiempo real | Socket.IO |
| Persistencia frontend | localStorage para sesion y cache de estado |

## Arquitectura general

```mermaid
flowchart LR
  U["Usuario"] --> F["Frontend React/Vite"]
  F -->|"fetch + JWT"| API["API REST Express"]
  API -->|"SQL"| DB[("PostgreSQL")]
  API --> AUTH["Middleware JWT"]
  API --> STATE["Servicio appState"]
  API <-->|"Socket.IO"| F
```

El frontend consume la API desde `src/api.js`. El backend expone endpoints bajo `/api` y protege las operaciones sensibles con JWT.

## Estructura del backend

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
    appState.js               # Construye el estado consumido por React
  utils/
    asyncHandler.js           # Manejo centralizado de errores async
    formatters.js             # Utilidades de formato
    validation.js             # Validaciones de reglas de negocio
```

## Modelo de datos

```mermaid
erDiagram
  users ||--o{ user_courses : has
  users ||--o{ user_availability : has
  users ||--o{ study_groups : owns
  users ||--o{ group_members : joins
  users ||--o{ join_requests : requests
  users ||--o{ messages : sends
  users ||--o{ notifications : receives

  study_groups ||--o{ group_members : contains
  study_groups ||--o{ join_requests : receives
  study_groups ||--o{ messages : contains

  users {
    int id PK
    varchar name
    varchar email UK
    varchar password_hash
    varchar university
    varchar career
    int cycle
    text availability
    text bio
    boolean is_active
  }

  study_groups {
    int id PK
    varchar name
    text description
    varchar course
    int owner_id FK
    int max_members
    varchar modality
    varchar university
    varchar image_url
    boolean is_public
    varchar schedule
  }

  group_members {
    int id PK
    int group_id FK
    int user_id FK
    varchar role
  }

  join_requests {
    int id PK
    int group_id FK
    int user_id FK
    varchar status
    text message
  }

  messages {
    int id PK
    int group_id FK
    int sender_id FK
    text content
    boolean is_deleted
  }

  notifications {
    int id PK
    int user_id FK
    varchar type
    varchar title
    text message
    jsonb data
    boolean is_read
  }
```

## Autenticacion JWT

```mermaid
sequenceDiagram
  participant F as Frontend
  participant API as Backend
  participant DB as PostgreSQL

  F->>API: POST /api/auth/login
  API->>DB: Buscar usuario por email
  API->>API: Comparar password con bcrypt
  API-->>F: session + JWT + state
  F->>API: Request protegida con Authorization Bearer
  API->>API: Verificar JWT
  API->>DB: Consultar datos del usuario autenticado
  API-->>F: Respuesta JSON
```

El token contiene `userId` y `email`. Los endpoints protegidos no confian en un `userId` enviado desde el frontend; lo obtienen desde el JWT validado.

## Flujo de solicitudes para unirse

```mermaid
sequenceDiagram
  participant A as Estudiante
  participant API as Backend
  participant DB as PostgreSQL
  participant O as Dueno del grupo

  A->>API: POST /api/groups/:id/join
  API->>DB: Validar grupo, cupo y membresia
  API->>DB: Crear join_request pending
  API->>DB: Crear notificacion al dueno
  API-->>A: Estado actualizado
  O->>API: PUT /api/join-requests/:id/accept
  API->>DB: Validar que O sea dueno
  API->>DB: Crear group_member
  API->>DB: Marcar solicitud accepted
  API->>DB: Notificar al estudiante
  API-->>O: Estado actualizado
```

## Endpoints

| Metodo | Endpoint | Protegido | Descripcion |
|---|---|---:|---|
| GET | `/api/health` | No | Verifica conexion API/DB |
| POST | `/api/auth/login` | No | Inicia sesion y devuelve JWT |
| POST | `/api/auth/register` | No | Crea usuario con password hasheado |
| GET | `/api/state` | Si | Devuelve estado completo para React |
| POST | `/api/groups` | Si | Crea grupo de estudio |
| POST | `/api/groups/:id/join` | Si | Crea solicitud para unirse |
| DELETE | `/api/groups/:id/leave` | Si | Sale de un grupo |
| PUT | `/api/join-requests/:id/:action` | Si | Acepta o rechaza solicitud |
| POST | `/api/messages` | Si | Envia mensaje a un grupo |
| PUT | `/api/profile` | Si | Actualiza perfil academico |
| PUT | `/api/notifications/read` | Si | Marca notificaciones como leidas |

`action` acepta:

```text
accept
reject
```

## Reglas de negocio

| Modulo | Reglas |
|---|---|
| Auth | Email valido, password minimo de 6 caracteres, bcrypt para hashes |
| Perfil | Nombre obligatorio, ciclo academico valido |
| Grupos | Nombre y curso obligatorios, maximo 2-50, modalidad valida |
| Solicitudes | No duplicados pendientes, no dueno, no miembro existente, validar cupo |
| Chat | Solo miembros o duenos pueden enviar mensajes |
| JWT | Endpoints protegidos obtienen usuario desde token |

## Variables de entorno

```env
PORT=4000
DATABASE_URL=postgres://postgres:TU_PASSWORD@localhost:5432/studyconnect
JWT_SECRET=cambia_este_secreto_en_desarrollo
```

Opcional:

```env
CLIENT_ORIGIN=http://localhost:5173
```

## Instalacion y ejecucion

```bash
npm install
npm run dev
```

Scripts disponibles:

```bash
npm run dev      # Frontend + backend
npm run client   # Solo frontend
npm run server   # Solo backend
npm run build    # Build de produccion
```

## Usuarios demo

Las cuentas seed usan password:

```text
password123
```

Ejemplo:

```text
keenscy@test.com
password123
```

## Migraciones

Las migraciones estan en:

```text
server/migrations/
```

Migracion actual:

```text
001_add_profile_group_fields.sql
```

Agrega:

```text
users.availability
study_groups.modality
study_groups.university
study_groups.image_url
```

## Estado actual del proyecto

Implementado:

```text
- Frontend React/Vite
- Backend Express modular
- PostgreSQL
- Login y registro
- Passwords hasheadas con bcrypt
- JWT
- Endpoints protegidos
- Grupos de estudio
- Solicitudes de ingreso
- Vista de solicitudes enviadas y recibidas
- Notificaciones
- Chat persistido
- Chat en tiempo real con Socket.IO
- Perfil academico
- Validaciones backend
```

Siguientes mejoras posibles:

```text
- Pruebas automatizadas del backend
- Deploy de frontend, backend y PostgreSQL
```
