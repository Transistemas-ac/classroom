import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import prisma from "@/src/lib/prisma";
import { apiHandler } from "@/src/lib/apiHandler";
import { sendTransactionalEmail } from "@/src/lib/email";

const schema = z.object({ email: z.string().email() });

export const POST = apiHandler(async (req: NextRequest) => {
  const { email } = schema.parse(await req.json().catch(() => ({})));
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await prisma.passwordResetToken.deleteMany({ where: { user_id: user.id, used_at: null } });
    await prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const link = `${process.env.APP_URL ?? ""}/reset-password?token=${token}`;
    await sendTransactionalEmail({
      recipient: user.email,
      userId: user.id,
      kind: "password_reset",
      subject: "Restablecé tu contraseña de Transistemas",
      html: `<main style="font-family:Arial,sans-serif"><h1>Restablecer contraseña</h1><p>El enlace vence en una hora.</p><p><a href="${link}">Crear una nueva contraseña</a></p></main>`,
      text: `Restablecé tu contraseña: ${link}\nEl enlace vence en una hora.`,
    });
  }

  return NextResponse.json({ success: true, message: "Si la cuenta existe, recibirás un email." });
});
