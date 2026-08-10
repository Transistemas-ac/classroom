import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { canManageCourse, getAuthUser, unauthorizedResponse, forbiddenResponse } from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";
import { sendUserEmail } from "@/src/lib/email";

const gradeSchema = z
  .object({
    score: z.number().int().min(0),
    feedback: z.string().max(2000).optional().nullable(),
    rubric_scores: z.record(z.string(), z.number().min(0)).optional().nullable(),
  })
  .strict();

export const PUT = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { submissionId } = await ctx.params;
    const id = Number(submissionId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { post: { include: { course: true } } },
    });
    if (!submission) throw new HttpError(404, "❌ Submission not found");
    if (!(await canManageCourse(authUser, submission.post.course_id))) {
      return forbiddenResponse("❌ Forbidden: Only the course team can grade");
    }

    const body = await req.json().catch(() => ({}));
    const parsed = gradeSchema.parse(body);

    if (submission.post.max_score !== null && parsed.score > submission.post.max_score) {
      throw new HttpError(400, `❌ Score cannot exceed ${submission.post.max_score}`);
    }

    if (parsed.rubric_scores && Array.isArray(submission.post.rubric)) {
      const rubric = submission.post.rubric as { title: string; points: number }[];
      for (const criterion of rubric) {
        const value = parsed.rubric_scores[criterion.title];
        if (value !== undefined && value > criterion.points) {
          throw new HttpError(400, `❌ ${criterion.title} cannot exceed ${criterion.points}`);
        }
      }
    }

    const penaltyPercent = submission.late
      ? submission.post.late_penalty_percent ?? submission.post.course.late_penalty_percent ?? 0
      : 0;
    const finalScore = Math.max(
      0,
      Math.floor(parsed.score * (1 - penaltyPercent / 100))
    );

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        raw_score: parsed.score,
        score: finalScore,
        penalty_percent: penaltyPercent || null,
        feedback: parsed.feedback ?? null,
        rubric_scores: parsed.rubric_scores === undefined
          ? undefined
          : parsed.rubric_scores ?? Prisma.JsonNull,
        graded_at: new Date(),
        graded_by: authUser.id,
      },
    });

    await recordAudit({
      actorId: authUser.id,
      action: "submission.graded",
      entityType: "submission",
      entityId: id,
      metadata: { rawScore: parsed.score, score: finalScore, penaltyPercent },
    });
    await sendUserEmail({
      userId: submission.user_id,
      kind: "submission_graded",
      subject: `Entrega calificada: ${submission.post.title}`,
      title: "Tu entrega fue calificada",
      body: `Obtuviste ${finalScore}${submission.post.max_score ? `/${submission.post.max_score}` : ""} puntos.${penaltyPercent ? ` Se aplicó una penalización por entrega tarde del ${penaltyPercent}%.` : ""}${parsed.feedback ? ` Feedback: ${parsed.feedback}` : ""}`,
      link: `${process.env.APP_URL ?? ""}/course/${submission.post.course_id}`,
    });

    return NextResponse.json(updated);
  }
);
