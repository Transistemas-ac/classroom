import type { Role } from "./auth";

export function canManageCourseRole(role: Role, membershipRole?: string | null): boolean {
  return role === "admin" || (role === "teacher" && membershipRole === "teacher");
}

export function canViewCourseContent(
  role: Role,
  enrolled: boolean,
  managesCourse: boolean
): boolean {
  return managesCourse || enrolled || role === "admin";
}

export function canSubmitAssignment(role: Role, enrolled: boolean): boolean {
  return role === "student" && enrolled;
}

export function canGradeAssignment(role: Role, managesCourse: boolean): boolean {
  return managesCourse && (role === "teacher" || role === "admin");
}
