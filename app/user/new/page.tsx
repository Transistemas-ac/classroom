"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/src/context/AuthContext";
import User from "@/src/views/User";

export default function NewUserPage() {
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!user?.loggedIn) router.replace("/login");
  }, [user?.loggedIn, router]);

  return <User />;
}
