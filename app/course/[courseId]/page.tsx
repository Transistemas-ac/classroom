"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/src/context/AuthContext";
import Course from "@/src/views/Course";

export default function CoursePage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ? Number(params.courseId) : undefined;

  useEffect(() => {
    if (!user?.loggedIn) router.replace("/login");
  }, [user?.loggedIn, router]);

  return <Course courseId={courseId} />;
}
