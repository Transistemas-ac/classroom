import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/src/lib/prisma";
import { apiHandler } from "@/src/lib/apiHandler";
import { canManageCourse, getAuthUser, unauthorizedResponse, forbiddenResponse } from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";

const updateSchema = z.object({
  status: z.enum(["present", "absent", "late", "excused"]),
  note: z.string().max(500).optional().nullable(),
});

export const PUT = apiHandler(async (req: NextRequest, ctx) => {
  const { recordId } = await ctx.params;
  const id = Number(recordId);
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();
  const record = await prisma.attendanceRecord.findUnique({
    where: { id },
    include: { session: true },
  });
  if (!record) return NextResponse.json({ success: false, message: "Attendance record not found" }, { status: 404 });
  if (!(await canManageCourse(authUser, record.session.course_id))) {
    return forbiddenResponse("❌ Only the course team can manage attendance");
  }
  const updated = await prisma.attendanceRecord.update({ where: { id }, data: updateSchema.parse(await req.json().catch(() => ({}))) });
  await recordAudit({ actorId: authUser.id, action: "attendance_record.updated", entityType: "attendance_record", entityId: id });
  return NextResponse.json(updated);
});
