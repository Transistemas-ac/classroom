import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/src/lib/prisma";
import { apiHandler } from "@/src/lib/apiHandler";
import { canManageCourse, getAuthUser, unauthorizedResponse, forbiddenResponse } from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";

const updateEventSchema = z.object({
  type: z.enum(["clase", "entrega", "evento"]).optional(),
  title: z.string().min(1).max(180).optional(),
  description: z.string().max(3000).optional().nullable(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional().nullable(),
});

export const PUT = apiHandler(async (req: NextRequest, ctx) => {
  const { eventId } = await ctx.params;
  const id = Number(eventId);
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();
  const event = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
  if (!(await canManageCourse(authUser, event.course_id))) {
    return forbiddenResponse("❌ Only the course team can manage the calendar");
  }
  const updated = await prisma.calendarEvent.update({ where: { id }, data: updateEventSchema.parse(await req.json().catch(() => ({}))) });
  await recordAudit({ actorId: authUser.id, action: "calendar_event.updated", entityType: "calendar_event", entityId: id });
  return NextResponse.json(updated);
});

export const DELETE = apiHandler(async (req: NextRequest, ctx) => {
  const { eventId } = await ctx.params;
  const id = Number(eventId);
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();
  const event = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
  if (!(await canManageCourse(authUser, event.course_id))) {
    return forbiddenResponse("❌ Only the course team can manage the calendar");
  }
  await prisma.calendarEvent.delete({ where: { id } });
  await recordAudit({ actorId: authUser.id, action: "calendar_event.deleted", entityType: "calendar_event", entityId: id });
  return NextResponse.json({ success: true });
});
