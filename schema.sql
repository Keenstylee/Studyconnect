-- ============================================================
--  StudyConnect — Esquema de Base de Datos (PostgreSQL)
--  Ejecutar en orden. Requiere PostgreSQL 14+
-- ============================================================

-- Extensión para UUIDs (opcional, usamos SERIAL por simplicidad)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. USUARIOS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    university    VARCHAR(150),
    career        VARCHAR(150),
    cycle         INTEGER CHECK (cycle BETWEEN 1 AND 12),
    bio           TEXT,
    avatar_url    VARCHAR(255),
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. CURSOS DEL USUARIO (para matching)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_courses (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course     VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, course)
);

-- ─────────────────────────────────────────────
-- 3. DISPONIBILIDAD HORARIA
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_availability (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week  VARCHAR(15) NOT NULL CHECK (
        day_of_week IN ('lunes','martes','miércoles','jueves','viernes','sábado','domingo')
    ),
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    CONSTRAINT valid_time CHECK (end_time > start_time)
);

-- ─────────────────────────────────────────────
-- 4. GRUPOS DE ESTUDIO
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_groups (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    course      VARCHAR(100) NOT NULL,
    owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 10 CHECK (max_members BETWEEN 2 AND 50),
    is_public   BOOLEAN DEFAULT TRUE,
    schedule    VARCHAR(200),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. MEMBRESÍAS EN GRUPOS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
    id        SERIAL PRIMARY KEY,
    group_id  INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner','member')),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- ─────────────────────────────────────────────
-- 6. SOLICITUDES DE INGRESO
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS join_requests (
    id         SERIAL PRIMARY KEY,
    group_id   INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
    message    TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- ─────────────────────────────────────────────
-- 7. MENSAJES DE CHAT
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id         SERIAL PRIMARY KEY,
    group_id   INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    sender_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    sent_at    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 8. NOTIFICACIONES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(50) NOT NULL,
    title      VARCHAR(150),
    message    TEXT,
    data       JSONB,
    is_read    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ÍNDICES (rendimiento)
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_courses_user       ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group     ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user      ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_group          ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at        ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user      ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread    ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_study_groups_course     ON study_groups(course);

-- ─────────────────────────────────────────────
-- DATOS DE PRUEBA (seeds)
-- ─────────────────────────────────────────────

-- Usuarios de prueba (contraseña: "password123" hasheada con bcrypt)
INSERT INTO users (name, email, password_hash, university, career, cycle) VALUES
('Keenscy Sánchez',  'keenscy@test.com',  '$2b$10$placeholder_hash_1', 'Universidad Nacional', 'Ing. de Sistemas', 6),
('Gorddy Vinces',    'gorddy@test.com',   '$2b$10$placeholder_hash_2', 'Universidad Nacional', 'Ing. de Sistemas', 6),
('Munaya Euribe',    'munaya@test.com',   '$2b$10$placeholder_hash_3', 'Universidad Nacional', 'Ing. de Sistemas', 5),
('Yaren Test',       'yaren@test.com',    '$2b$10$placeholder_hash_4', 'Universidad Nacional', 'Ing. de Sistemas', 4)
ON CONFLICT (email) DO NOTHING;

-- Cursos
INSERT INTO user_courses (user_id, course) VALUES
(1, 'Cálculo II'), (1, 'Base de Datos'), (1, 'Redes'),
(2, 'Cálculo II'), (2, 'Programación'),
(3, 'Base de Datos'), (3, 'Estadística'),
(4, 'Redes'), (4, 'Programación')
ON CONFLICT DO NOTHING;

-- Grupos de ejemplo
INSERT INTO study_groups (name, description, course, owner_id, max_members, schedule) VALUES
('Cálculo II Avanzado',  'Integrales, series y ecuaciones diferenciales.', 'Cálculo II',  2, 8, 'Martes y Jueves 7pm'),
('Base de Datos I',      'Modelado ER, SQL y normalización.',              'Base de Datos',3, 6, 'Lunes 6pm'),
('Redes y Protocolos',   'TCP/IP, subneting, Cisco Packet Tracer.',        'Redes',        4, 5, 'Miércoles 8pm'),
('Programación OOP',     'Java y Python orientado a objetos.',             'Programación', 2, 10,'Viernes 7pm')
ON CONFLICT DO NOTHING;

-- Membresías
INSERT INTO group_members (group_id, user_id, role) VALUES
(1, 2, 'owner'), (1, 3, 'member'),
(2, 3, 'owner'), (2, 4, 'member'),
(3, 4, 'owner'),
(4, 2, 'owner'), (4, 3, 'member'), (4, 4, 'member')
ON CONFLICT DO NOTHING;
