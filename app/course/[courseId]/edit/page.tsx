"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/src/context/AuthContext";
import CourseForm from "@/src/components/CourseForm";

export default function EditCoursePage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const params = useParams<{ courseId: string }>();

  useEffect(() => {
    if (!user?.loggedIn) router.replace("/login");
  }, [user?.loggedIn, router]);

  return (
    <div className="edit-page">
      <CourseForm courseId={Number(params.courseId)} />
    </div>
  );
}
