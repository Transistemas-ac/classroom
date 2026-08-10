"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/src/context/AuthContext";
import User from "@/src/views/User";

export default function UserPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId ? Number(params.userId) : undefined;

  useEffect(() => {
    if (!user?.loggedIn) router.replace("/login");
  }, [user?.loggedIn, router]);

  return <User userId={userId} />;
}
