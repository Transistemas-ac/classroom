"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/src/context/AuthContext";
import Home from "@/src/views/Home";

export default function HomePage() {
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!user?.loggedIn) router.replace("/login");
  }, [user?.loggedIn, router]);

  return <Home />;
}
