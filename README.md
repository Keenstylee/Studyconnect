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
npm run dev      # Servidor de desarrollo
npm run build    # Compilacion de produccion
npm run preview  # Vista previa del build
```

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
