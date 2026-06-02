# StudyConnect

StudyConnect es una plataforma web de estudio colaborativo para estudiantes universitarios. Permite explorar grupos por curso, recibir sugerencias de compatibilidad y organizar sesiones de estudio.

## Estado del proyecto

Actualmente el repositorio contiene un prototipo funcional del frontend desarrollado con React.  
La conexión con backend, PostgreSQL y chat en tiempo real forma parte de la siguiente etapa.

## Funcionalidades implementadas

- Inicio de sesión y registro en modo demostración.
- Dashboard con estadísticas y grupos recomendados.
- Exploración de grupos de estudio.
- Datos de prueba para matching y sugerencias.
- Imágenes relacionadas con cada curso.
- Diseño responsive para PC y dispositivos móviles.
- Menú hamburguesa en pantallas pequeñas.
- Efectos CSS3: hover, transiciones, transformaciones y animaciones.
- Persistencia temporal mediante LocalStorage.

## Tecnologías actuales

| Tecnología | Uso |
| --- | --- |
| React 18 | Componentes reutilizables e interfaz de usuario |
| React DOM | Renderizado de React en el navegador |
| Vite | Servidor de desarrollo y build optimizado |
| @vitejs/plugin-react | Soporte para JSX y React dentro de Vite |
| CSS3 | Diseño responsive, animaciones y efectos visuales |
| LocalStorage | Persistencia temporal del prototipo |

## Tecnologías planificadas

| Tecnología | Uso futuro |
| --- | --- |
| Node.js + Express | API REST |
| PostgreSQL + pg | Base de datos relacional |
| Redis | Caché, sesiones y presencia en tiempo real |
| Socket.io | Chat y notificaciones |
| JWT + bcryptjs | Autenticación segura |
| Axios | Comunicación entre frontend y API |
| React Router DOM | Navegación entre páginas |

## Estructura del proyecto

```text
Studyconnect/
├── public/
│   └── assets/          # Imágenes utilizadas por la interfaz
├── src/
│   ├── App.jsx          # Componentes y lógica principal
│   ├── main.jsx         # Punto de montaje de React
│   └── styles.css       # Diseño, responsive y animaciones
├── index.html           # Entrada requerida por Vite
├── schema.sql           # Modelo relacional planificado
└── package.json         # Dependencias y scripts
