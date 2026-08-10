"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/src/context/AuthContext";

export default function RootPage() {
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    router.replace(user?.loggedIn ? "/home" : "/login");
  }, [user?.loggedIn, router]);

  return null;
}
