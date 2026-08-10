import prisma from "./prisma";

type EmailInput = {
  recipient: string;
  userId?: number;
  kind: string;
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendTransactionalEmail(input: EmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "equipo@transistemas.org";
  const fromName = process.env.EMAIL_FROM_NAME ?? "Transistemas";

  if (!apiKey) {
    await prisma.emailLog.create({
      data: {
        user_id: input.userId,
        recipient: input.recipient,
        kind: input.kind,
        status: "skipped_not_configured",
      },
    });
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [input.recipient],
        from: `${fromName} <${from}>`,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    const payload = (await response.json()) as {
      id?: string;
      message?: string;
      name?: string;
    };

    await prisma.emailLog.create({
      data: {
        user_id: input.userId,
        recipient: input.recipient,
        kind: input.kind,
        status: response.ok ? "accepted" : "failed",
        provider_id: payload.id,
        error: response.ok ? undefined : `${payload.name ?? "resend_error"}: ${payload.message ?? "Email rejected"}`,
      },
    });
  } catch (error) {
    await prisma.emailLog.create({
      data: {
        user_id: input.userId,
        recipient: input.recipient,
        kind: input.kind,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown email error",
      },
    });
  }
}

export async function sendUserEmail(input: {
  userId: number;
  kind: string;
  subject: string;
  title: string;
  body: string;
  link?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, email_notifications: true },
  });
  if (!user?.email || !user.email_notifications) return;

  const safeTitle = escapeHtml(input.title);
  const safeBody = escapeHtml(input.body).replaceAll("\n", "<br />");
  const safeLink = input.link ? escapeHtml(input.link) : undefined;
  const linkMarkup = safeLink
    ? `<p><a href="${safeLink}">Abrir en Transistemas</a></p>`
    : "";

  await sendTransactionalEmail({
    recipient: user.email,
    userId: input.userId,
    kind: input.kind,
    subject: input.subject,
    html: `<main style="font-family:Arial,sans-serif;line-height:1.5"><h1>${safeTitle}</h1><p>${safeBody}</p>${linkMarkup}</main>`,
    text: `${input.title}\n\n${input.body}${input.link ? `\n\n${input.link}` : ""}`,
  });
}

export async function sendUsersEmail(input: {
  userIds: number[];
  kind: string;
  subject: string;
  title: string;
  body: string;
  link?: string;
}) {
  await Promise.allSettled(
    input.userIds.map((userId) => sendUserEmail({ ...input, userId }))
  );
}
