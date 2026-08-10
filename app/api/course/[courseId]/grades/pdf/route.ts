import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import prisma from "@/src/lib/prisma";
import { canManageCourse, getAuthUser, unauthorizedResponse, forbiddenResponse } from "@/src/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) {
  const { courseId } = await ctx.params;
  const id = Number(courseId);
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();
  if (!(await canManageCourse(authUser, id))) {
    return forbiddenResponse("❌ Only the course team can export grades");
  }

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ success: false, message: "Course not found" }, { status: 404 });

  const [assignments, students, submissions] = await Promise.all([
    prisma.post.findMany({
      where: { course_id: id, type: "tarea" },
      select: { id: true, title: true, max_score: true },
      orderBy: { created_at: "asc" },
    }),
    prisma.subscription.findMany({
      where: { course_id: id, credentials: "student" },
      select: { user_id: true, user: { select: { username: true, first_name: true, last_name: true } } },
      orderBy: { user_id: "asc" },
    }),
    prisma.submission.findMany({
      where: { post: { course_id: id } },
      select: { user_id: true, post_id: true, score: true },
    }),
  ]);

  const document = new PDFDocument({ margin: 42, size: "A4" });
  const chunks: Buffer[] = [];
  document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const finished = new Promise<Buffer>((resolve) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
  });

  document.fontSize(20).fillColor("#1a1b1b").text(course.title);
  document.fontSize(10).fillColor("#6a6a69").text("Reporte de notas · Transistemas");
  document.moveDown();

  if (!assignments.length || !students.length) {
    document.fontSize(12).fillColor("#1a1b1b").text("No hay suficientes datos para generar el libro de notas.");
  } else {
    const columnWidth = 500 / (assignments.length + 1);
    const startX = 42;
    let y = document.y;
    const drawCell = (text: string, x: number, width: number, fill = "#f2f2f2") => {
      document.rect(x, y, width, 24).fillAndStroke(fill, "#cccccc");
      document.fillColor("#1a1b1b").fontSize(8).text(text, x + 4, y + 8, {
        width: width - 8,
        ellipsis: true,
      });
    };

    drawCell("Estudiante", startX, columnWidth, "#dff4ff");
    assignments.forEach((assignment, index) => {
      drawCell(`${assignment.title}${assignment.max_score ? ` (${assignment.max_score})` : ""}`, startX + columnWidth * (index + 1), columnWidth, "#fff4bf");
    });
    y += 24;

    for (const student of students) {
      if (y > 760) {
        document.addPage();
        y = 42;
      }
      const displayName = [student.user.first_name, student.user.last_name].filter(Boolean).join(" ") || student.user.username;
      drawCell(displayName, startX, columnWidth, "#ffffff");
      assignments.forEach((assignment, index) => {
        const submission = submissions.find((item) => item.user_id === student.user_id && item.post_id === assignment.id);
        drawCell(submission?.score === null || !submission ? "—" : String(submission.score), startX + columnWidth * (index + 1), columnWidth, submission?.score !== null && submission ? "#e5f8e9" : "#ffffff");
      });
      y += 24;
    }
  }

  document.end();
  const pdf = await finished;
  const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="notas-${id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
