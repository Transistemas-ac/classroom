"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/src/context/AuthContext";
import Register from "@/src/views/Register";

export default function RegisterPage() {
  const { user, setUser } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (user?.loggedIn) router.replace("/home");
  }, [user?.loggedIn, router]);

  return <Register setUser={setUser} />;
}
