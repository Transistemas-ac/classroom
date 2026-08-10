import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/src/lib/prisma";
import { apiHandler } from "@/src/lib/apiHandler";
import { canManageCourse, getAuthUser, isEnrolled, unauthorizedResponse, forbiddenResponse } from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";

const eventSchema = z.object({
  type: z.enum(["clase", "entrega", "evento"]).default("evento"),
  title: z.string().min(1).max(180),
  description: z.string().max(3000).optional().nullable(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime().optional().nullable(),
});

export const GET = apiHandler(async (req: NextRequest, ctx) => {
  const { courseId } = await ctx.params;
  const id = Number(courseId);
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();
  if (!(await canManageCourse(authUser, id)) && !(await isEnrolled(authUser.id, id))) {
    return forbiddenResponse("❌ Forbidden: Not enrolled in the course");
  }

  const events = await prisma.calendarEvent.findMany({
    where: { course_id: id },
    orderBy: { starts_at: "asc" },
  });
  return NextResponse.json(events);
});

export const POST = apiHandler(async (req: NextRequest, ctx) => {
  const { courseId } = await ctx.params;
  const id = Number(courseId);
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();
  if (!(await canManageCourse(authUser, id))) {
    return forbiddenResponse("❌ Only the course team can manage the calendar");
  }

  const parsed = eventSchema.parse(await req.json().catch(() => ({})));
  const event = await prisma.calendarEvent.create({
    data: { ...parsed, course_id: id, author_id: authUser.id },
  });
  await recordAudit({ actorId: authUser.id, action: "calendar_event.created", entityType: "calendar_event", entityId: event.id });
  return NextResponse.json(event, { status: 201 });
});
