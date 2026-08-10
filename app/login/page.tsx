"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/src/context/AuthContext";
import Login from "@/src/views/Login";

export default function LoginPage() {
  const { user, setUser } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (user?.loggedIn) router.replace("/home");
  }, [user?.loggedIn, router]);

  return <Login setUser={setUser} />;
}
