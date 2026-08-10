<h1 align="center">Aula Virtual de Transistemas</h1>

<p align="center">
  📚 Plataforma web educativa para gestionar cursos, contenidos, tareas, entregas, calificaciones, asistencia y comunicación entre docentes y estudiantes.
</p>

<p align="center">
  Construida con Next.js, React, TypeScript, Prisma y PostgreSQL, con despliegue preparado para Vercel.
</p>

<br>

## Características

### Usuarios y permisos

- **Tres roles:** `admin`, `teacher` y `student`, mostrados en la interfaz como Admin, Profe y Estudiante.
- **Permisos por curso:** una persona con rol Profe solo administra los cursos en los que está inscripta como parte del equipo docente.
- **Administración de usuarios:** los administradores pueden crear, editar, eliminar y cambiar el rol de las cuentas.
- **Perfiles:** nombre, apellido, pronombres, equipo, descripción, foto, enlace y preferencia de notificaciones por email.
- **Inscripciones con roles:** estudiantes pueden inscribirse a sí mismos; el equipo del curso puede administrar docentes y estudiantes.

### Cursos

- Creación y edición de cursos por administradores y profes.
- Estado `active` o `archived`.
- Fechas de inicio y finalización, descripción, enlace al temario y enlace externo de inscripción.
- Configuración de entregas fuera de término y penalización porcentual.
- Indicadores de próximas entregas, entregas pendientes y tareas sin calificar.

### Aula por curso

Cada curso tiene un espacio de trabajo con pestañas para separar las tareas habituales:

- **Aula:** feed de anuncios, materiales y tareas, con comentarios.
- **Tareas:** fechas de entrega, puntaje máximo, rúbricas, archivos y estado de cada entrega.
- **Notas:** libro de calificaciones por estudiante y tarea.
- **Calendario:** clases, entregas y eventos importantes.
- **Asistencia:** listas por encuentro con estados presente, ausente, tarde o justificade.
- **Personas:** disponible para el equipo del curso, con gestión de profes y estudiantes.

### Publicaciones y materiales

- Tipos de publicación: `anuncio`, `material` y `tarea`.
- Publicación inmediata, borradores y publicación programada.
- Archivos adjuntos almacenados en Vercel Blob.
- Edición y eliminación de publicaciones por el equipo del curso.
- Comentarios asociados a cada publicación.

### Entregas y calificaciones

- Los estudiantes pueden entregar texto, enlaces y archivos.
- Una entrega puede actualizarse hasta que sea calificada.
- Detección de entregas fuera de término.
- Penalización configurable a nivel de curso o tarea.
- Calificación numérica, feedback y puntajes por criterio de rúbrica.
- El libro de notas muestra resultados individuales para estudiantes y el curso completo para el equipo docente.
- El equipo del curso puede descargar un libro de notas en PDF.
- Al calificar, el estudiante puede recibir una notificación por email.

### Notificaciones y operación

- Emails transaccionales mediante la API de Resend.
- Email de bienvenida al registrarse.
- Avisos de inscripción a un curso.
- Avisos cuando una entrega fue calificada.
- Recordatorios diarios para tareas que vencen dentro de las próximas 24 horas.
- Registro de emails enviados, rechazados o salteados por falta de configuración.
- Endpoint de salud en `GET /api/healthz` para comprobar la conexión con la base de datos.

### Seguridad

- Contraseñas almacenadas con `bcrypt`.
- Sesiones JWT en una cookie `HttpOnly`, `SameSite=Lax` y con duración de siete días.
- Protección contra intentos repetidos de inicio de sesión: cinco intentos fallidos bloquean la combinación de usuario e IP durante quince minutos.
- Validación de payloads con Zod en los endpoints principales.
- Autorización del lado del servidor para cursos, publicaciones, entregas, notas, asistencia y usuarios.
- Registro de auditoría para acciones relevantes de administración y operación.
- Los archivos subidos están limitados a 25 MB y a una lista de tipos permitidos.

<br>

## Tecnologías

| Área              | Tecnología                             |
| ----------------- | -------------------------------------- |
| Framework         | Next.js 15 con App Router              |
| Interfaz          | React 19                               |
| Lenguaje          | TypeScript con modo estricto           |
| Estilos           | Sass y CSS                             |
| Base de datos     | PostgreSQL                             |
| ORM y migraciones | Prisma 6                               |
| Autenticación     | JWT, cookies seguras y bcrypt          |
| Validación        | Zod                                    |
| Archivos          | Vercel Blob                            |
| Emails            | Resend API                             |
| PDFs              | PDFKit                                 |
| Tests             | Vitest                                 |
| Despliegue        | Vercel o un entorno Node.js compatible |

<br>

## Arquitectura

```text
Navegador
    │
    ▼
Next.js App Router
    ├── páginas y componentes React
    ├── AuthContext y sesión de usuario
    └── route handlers bajo /api
            │
            ├── validación con Zod
            ├── autorización por rol y pertenencia al curso
            ├── auditoría de acciones
            └── Prisma Client
                    │
                    ▼
                PostgreSQL

Integraciones opcionales:
    ├── Resend: emails transaccionales
    ├── Vercel Blob: archivos adjuntos
    └── Vercel Cron: recordatorios de entregas
```

### Detalles de implementación

- `middleware.ts` redirige a las rutas públicas de autenticación y protege las páginas que requieren sesión.
- La cookie de sesión contiene un JWT, pero los endpoints vuelven a consultar la cuenta y sus inscripciones en PostgreSQL antes de autorizar operaciones.
- `src/lib/permissions.ts` concentra las reglas de permisos de cursos, entregas y calificaciones.
- Las relaciones entre personas y cursos se almacenan en `Subscription`, que también define si la inscripción es de estudiante o docente.
- Las migraciones comprometidas se encuentran en `prisma/migrations/`.
- Las respuestas que incluyen usuarios eliminan el campo de contraseña antes de enviarse al cliente.
- El cron de recordatorios es idempotente: usa `EmailLog` para evitar enviar el mismo aviso más de una vez.

<br>

## Primeros pasos

### Requisitos

- Node.js 20 o superior recomendado.
- npm.
- Una base de datos PostgreSQL accesible desde el entorno de ejecución.
- Una cuenta de Vercel Blob si se habilitarán archivos adjuntos.
- Una cuenta de Resend y un dominio verificado si se habilitarán emails.

### Instalación local

```sh
git clone https://github.com/Transistemas-ac/classroom.git
cd classroom
cp .env.example .env
npm ci
```

Editá `.env` con los valores de tu entorno. Como mínimo, configurá `JWT_SECRET`, `DATABASE_URL` y `DIRECT_URL`.

```sh
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

Para desarrollar cambios en el esquema de Prisma, usá una migración con nombre explícito:

```sh
npx prisma migrate dev --name nombre-del-cambio
```

`npm run prisma:reset` elimina y recrea la base de datos. Usalo únicamente en desarrollo.

### Primera cuenta administradora

La primera cuenta registrada en una base de datos vacía recibe automáticamente el rol `admin`. Las cuentas registradas después reciben el rol `student`.

En un entorno nuevo:

1. Configurá la base de datos y aplicá las migraciones.
2. Iniciá la aplicación.
3. Registrá la primera cuenta administradora.
4. Usá esa cuenta para crear profes, estudiantes y cursos.

Si el registro público no es apropiado para tu instalación, protegé o restringí esa ruta en la infraestructura de despliegue antes de exponer la aplicación.

<br>

## Variables de entorno

Copiá `.env.example` como `.env` en desarrollo o configurá estas variables en Vercel.

| Variable                | Requerida               | Descripción                                                                                             |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`              | No                      | Entorno de ejecución. Usá `production` en producción.                                                   |
| `JWT_SECRET`            | Sí                      | Secreto utilizado para firmar y verificar las sesiones. Debe ser largo, aleatorio y privado.            |
| `DATABASE_URL`          | Sí                      | URL principal de conexión a PostgreSQL.                                                                 |
| `DIRECT_URL`            | Sí                      | URL directa que Prisma usa para migraciones. En una instalación local puede ser igual a `DATABASE_URL`. |
| `RESEND_API_KEY`        | No                      | Activa el envío de emails mediante Resend.                                                              |
| `EMAIL_FROM`            | No                      | Dirección remitente. Por defecto: `equipo@transistemas.org`.                                            |
| `EMAIL_FROM_NAME`       | No                      | Nombre mostrado como remitente. Por defecto: `Transistemas`.                                            |
| `APP_URL`               | Recomendado             | URL pública usada en enlaces de emails y notificaciones.                                                |
| `CRON_SECRET`           | Requerida para cron     | Secreto esperado en `Authorization: Bearer <CRON_SECRET>`.                                              |
| `BLOB_READ_WRITE_TOKEN` | Requerida para archivos | Token de lectura y escritura de Vercel Blob.                                                            |

Ejemplo mínimo para desarrollo:

```env
NODE_ENV="development"
JWT_SECRET="reemplaza-esto-por-un-secreto-aleatorio"
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/classroom"
DIRECT_URL="postgresql://usuario:contraseña@localhost:5432/classroom"
APP_URL="http://localhost:3000"
```

Ejemplo de configuración opcional para servicios externos:

```env
RESEND_API_KEY="re_..."
EMAIL_FROM="equipo@transistemas.org"
EMAIL_FROM_NAME="Transistemas"
CRON_SECRET="secreto-del-cron"
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
```

### Emails con Resend

La aplicación usa la API REST de Resend. Para habilitarla:

1. Verificá el dominio remitente en Resend.
2. Configurá sus registros DNS.
3. Agregá `RESEND_API_KEY`, `EMAIL_FROM` y `EMAIL_FROM_NAME`.
4. Configurá `APP_URL` con la URL pública de la aplicación.

Si `RESEND_API_KEY` está vacío, los emails no se envían y quedan registrados con estado `skipped_not_configured`.

### Archivos adjuntos

`POST /api/uploads` usa Vercel Blob y acepta archivos PDF, texto, Markdown, imágenes JPEG/PNG/WebP, ZIP, DOCX y PPTX de hasta 25 MB.

Los blobs se crean actualmente con acceso público. No subas información sensible que no deba ser accesible mediante una URL compartida.

### Recordatorios de entregas

Vercel ejecuta `GET /api/cron/due-reminders` una vez por día, según la configuración de `vercel.json`. El endpoint requiere:

```text
Authorization: Bearer <CRON_SECRET>
```

El recordatorio se envía a estudiantes inscriptos que todavía no entregaron una tarea con vencimiento dentro de las próximas 24 horas y que tienen activadas sus notificaciones.

<br>

## Despliegue en Vercel

1. Importá el repositorio [`Transistemas-ac/classroom`](https://github.com/Transistemas-ac/classroom) en Vercel.
2. Conectá una base PostgreSQL y configurá `DATABASE_URL` y `DIRECT_URL`.
3. Agregá `JWT_SECRET` y `APP_URL` en las variables de entorno.
4. Agregá Resend y Vercel Blob si vas a usar emails o archivos.
5. Configurá `CRON_SECRET` para habilitar el endpoint de recordatorios.
6. Aplicá las migraciones desde un entorno con acceso a la base:

   ```sh
   npm run prisma:deploy
   ```

7. Desplegá la aplicación.

Las migraciones deben ejecutarse como una operación separada del build de la aplicación. No uses `prisma migrate reset` en producción.

### Comprobación de salud

```sh
curl https://tu-dominio.example/api/healthz
```

Respuesta esperada:

```json
{
  "status": "ok",
  "database": "ok"
}
```

<br>

## Scripts

| Comando                   | Descripción                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `npm run dev`             | Inicia Next.js en modo desarrollo.                                |
| `npm run build`           | Genera Prisma Client y compila la aplicación.                     |
| `npm start`               | Inicia la aplicación compilada.                                   |
| `npm run lint`            | Ejecuta ESLint.                                                   |
| `npm test`                | Ejecuta los tests de Vitest.                                      |
| `npm run prisma:generate` | Genera Prisma Client.                                             |
| `npm run prisma:deploy`   | Aplica las migraciones existentes.                                |
| `npm run prisma:migrate`  | Ejecuta la migración de desarrollo configurada en `package.json`. |
| `npm run prisma:reset`    | Reinicia la base de datos en desarrollo. Es destructivo.          |
| `npx tsc --noEmit`        | Ejecuta una comprobación manual de tipos.                         |

Antes de abrir un cambio, ejecutá:

```sh
npm run lint
npm test
npm run build
```

<br>

## Matriz de permisos

| Capacidad                                          | Admin                         | Profe                            | Estudiante                        |
| -------------------------------------------------- | ----------------------------- | -------------------------------- | --------------------------------- |
| Gestionar usuarios y roles                         | Sí                            | No                               | No                                |
| Crear cursos                                       | Sí                            | Sí                               | No                                |
| Editar un curso                                    | Todos los cursos              | Cursos donde es parte del equipo | No                                |
| Administrar publicaciones, calendario y asistencia | Todos los cursos              | Cursos donde es parte del equipo | No                                |
| Inscribirse                                        | Puede gestionar inscripciones | Puede inscribirse como profe     | Puede inscribirse como estudiante |
| Ver contenido del curso                            | Sí                            | Si administra o está inscripto   | Si está inscripto                 |
| Entregar tareas                                    | No                            | No                               | Sí, si está inscripto             |
| Calificar entregas                                 | Si administra el curso        | Si administra el curso           | No                                |
| Descargar libro de notas PDF                       | Si administra el curso        | Si administra el curso           | No                                |
| Consultar auditoría                                | Sí                            | No                               | No                                |

La autorización efectiva se aplica en los route handlers del servidor, no solamente en los controles visuales de la interfaz.

<br>

## Rutas principales

### Páginas

| Ruta                     | Uso                                                  |
| ------------------------ | ---------------------------------------------------- |
| `/`                      | Página inicial.                                      |
| `/login`                 | Inicio de sesión.                                    |
| `/register`              | Registro de cuenta.                                  |
| `/forgot-password`       | Solicitud de recuperación de contraseña.             |
| `/reset-password`        | Cambio de contraseña mediante token.                 |
| `/home`                  | Panel principal de cursos, usuarios e inscripciones. |
| `/course/new`            | Creación de un curso.                                |
| `/course/:courseId`      | Aula de un curso.                                    |
| `/course/:courseId/edit` | Edición de un curso.                                 |
| `/users`                 | Listado de usuarios para administradores y profes.   |
| `/user/new`              | Creación de usuarios por administradores.            |
| `/user/:userId`          | Edición de perfil.                                   |

### API seleccionada

| Endpoint                                    | Uso                                         |
| ------------------------------------------- | ------------------------------------------- |
| `POST /api/register`                        | Registra una cuenta e inicia su sesión.     |
| `POST /api/login`                           | Inicia sesión con usuario y contraseña.     |
| `POST /api/logout`                          | Cierra la sesión actual.                    |
| `GET /api/me`                               | Devuelve la cuenta autenticada.             |
| `GET/POST /api/course`                      | Lista y crea cursos.                        |
| `GET/PUT/DELETE /api/course/:courseId`      | Consulta, edita o elimina un curso.         |
| `GET/POST /api/course/:courseId/posts`      | Lista y crea publicaciones.                 |
| `GET/PUT/DELETE /api/posts/:postId`         | Consulta, edita o elimina una publicación.  |
| `GET/POST /api/posts/:postId/submissions`   | Consulta o crea una entrega.                |
| `PUT /api/submissions/:submissionId`        | Califica una entrega.                       |
| `GET /api/course/:courseId/grades`          | Obtiene el libro de notas.                  |
| `GET /api/course/:courseId/grades/pdf`      | Descarga el libro de notas en PDF.          |
| `GET/POST /api/course/:courseId/events`     | Consulta o crea eventos del calendario.     |
| `GET/POST /api/course/:courseId/attendance` | Consulta o crea encuentros de asistencia.   |
| `PUT /api/attendance/:recordId`             | Actualiza un registro de asistencia.        |
| `POST /api/uploads`                         | Sube un archivo a Vercel Blob.              |
| `GET /api/cron/due-reminders`               | Envía recordatorios de tareas próximas.     |
| `GET /api/healthz`                          | Comprueba la disponibilidad de PostgreSQL.  |
| `GET /api/audit`                            | Consulta la auditoría para administradores. |

<br>

## Estructura del proyecto

```text
app/
├── api/                  # Route handlers de autenticación y dominio
├── course/               # Páginas de creación, edición y aula
├── user/                 # Páginas de perfiles y usuarios
├── login/                # Inicio de sesión
├── register/             # Registro
└── layout.tsx            # Layout raíz y metadata

src/
├── components/           # Componentes de navegación, listas y aula
├── context/              # Estado de autenticación del cliente
├── hooks/                # Hooks para consultas de la API
├── lib/                  # Sesiones, permisos, Prisma, email, auditoría y rate limit
├── styles/               # Sass de la interfaz
├── views/                # Vistas de login, registro, inicio, usuario y curso
└── types.ts              # Tipos y etiquetas compartidas

prisma/
├── migrations/           # Historial de migraciones
└── schema.prisma         # Modelo de datos

docs/
└── operations.md         # Notas de operación en producción

tests/
└── permissions.test.ts   # Tests de permisos de cursos
```

<br>

## Notas operativas

- `DATABASE_URL` puede ser una conexión agrupada y `DIRECT_URL` una conexión directa, según el proveedor de PostgreSQL.
- `APP_URL` debe apuntar al dominio público real para que los enlaces de emails funcionen.
- El recordatorio de tareas no envía mensajes a estudiantes que ya entregaron o que desactivaron las notificaciones.
- El campo `EmailLog` permite revisar si un email fue aceptado, rechazado o omitido por falta de configuración.
- El libro de notas aplica la penalización por entrega tarde al puntaje final, manteniendo también el puntaje original.
- No se deben guardar secretos en el repositorio. Los archivos `.env` están excluidos por `.gitignore`.

<br>

## Licencia

Este repositorio todavía no incluye un archivo de licencia. Hasta que se agregue una licencia explícita, el código debe considerarse sin licencia de uso otorgada.

## <br></br>

_Creado con orgullo por el Equipo de Desarrollo de Transistemas ♥_
