import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { sendUserEmail } from "@/src/lib/email";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization");
  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const posts = await prisma.post.findMany({
    where: {
      type: "tarea",
      is_published: true,
      due_date: { gt: now, lte: tomorrow },
    },
    include: {
      course: { select: { id: true, title: true } },
      submissions: { select: { user_id: true } },
    },
  });

  let sent = 0;
  for (const post of posts) {
    const students = await prisma.subscription.findMany({
      where: {
        course_id: post.course_id,
        credentials: "student",
        user_id: { notIn: post.submissions.map((submission) => submission.user_id) },
      },
      select: { user_id: true },
    });

    for (const student of students) {
      const kind = `due_reminder_${post.id}_${student.user_id}_${post.due_date?.toISOString()}`;
      const alreadySent = await prisma.emailLog.findFirst({
        where: { kind, status: { in: ["delivered", "queued", "accepted", "skipped_not_configured"] } },
      });
      if (alreadySent) continue;

      await sendUserEmail({
        userId: student.user_id,
        kind,
        subject: `Entrega próxima: ${post.title}`,
        title: `Tu entrega vence pronto`,
        body: `${post.title} de ${post.course.title} vence dentro de 24 horas.`,
        link: `${process.env.APP_URL ?? ""}/course/${post.course_id}`,
      });
      sent += 1;
    }
  }

  return NextResponse.json({ success: true, sent });
}
