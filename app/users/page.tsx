"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/src/context/AuthContext";
import UserList from "@/src/components/UserList";

export default function UsersPage() {
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!user?.loggedIn) router.replace("/login");
  }, [user?.loggedIn, router]);

  return <UserList />;
}
