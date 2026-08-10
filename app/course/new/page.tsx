"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/src/context/AuthContext";
import CourseForm from "@/src/components/CourseForm";

export default function NewCoursePage() {
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!user?.loggedIn) router.replace("/login");
  }, [user?.loggedIn, router]);

  return (
    <div className="edit-page">
      <CourseForm />
    </div>
  );
}
