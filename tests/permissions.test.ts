import { describe, expect, it } from "vitest";
import {
  canGradeAssignment,
  canManageCourseRole,
  canSubmitAssignment,
  canViewCourseContent,
} from "../src/lib/permissions";

describe("course permissions", () => {
  it("only admins and assigned profes manage a course", () => {
    expect(canManageCourseRole("admin")).toBe(true);
    expect(canManageCourseRole("teacher", "teacher")).toBe(true);
    expect(canManageCourseRole("teacher", "student")).toBe(false);
    expect(canManageCourseRole("student", "teacher")).toBe(false);
  });

  it("limits classroom content to members or course staff", () => {
    expect(canViewCourseContent("student", true, false)).toBe(true);
    expect(canViewCourseContent("student", false, false)).toBe(false);
    expect(canViewCourseContent("teacher", false, true)).toBe(true);
  });

  it("only enrolled students submit and course staff grade", () => {
    expect(canSubmitAssignment("student", true)).toBe(true);
    expect(canSubmitAssignment("teacher", true)).toBe(false);
    expect(canSubmitAssignment("student", false)).toBe(false);
    expect(canGradeAssignment("teacher", true)).toBe(true);
    expect(canGradeAssignment("teacher", false)).toBe(false);
    expect(canGradeAssignment("student", true)).toBe(false);
  });
});
