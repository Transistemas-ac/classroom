# Production Operations

## Email notifications

The app sends transactional email through Resend's REST API.

Configure these Vercel variables:

- `RESEND_API_KEY`
- `EMAIL_FROM=equipo@transistemas.org`
- `EMAIL_FROM_NAME=Transistemas`
- `APP_URL=https://classroom-five-chi.vercel.app`

The `transistemas.org` sending domain must be verified in Resend and its DNS records must be valid before enabling delivery.

Email events are stored in `EmailLog`. Users can disable notifications from their profile.

## File attachments

Configure `BLOB_READ_WRITE_TOKEN` in Vercel to enable the upload endpoint. Files are limited to 25 MB and are stored under the authenticated user's namespace.

## Due reminders

Vercel runs `/api/cron/due-reminders` daily. Configure `CRON_SECRET`; Vercel sends it as `Authorization: Bearer <CRON_SECRET>`.

## PDF gradebooks

Course staff can download a gradebook PDF from the Notas tab. The endpoint is:

`GET /api/course/:courseId/grades/pdf`

## Migrations

Run migrations separately from application builds:

```bash
npm run prisma:deploy
```

Do not run `prisma migrate reset` against production.
