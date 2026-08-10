import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { User } from "@/src/types";

const refreshUserData = async (
  userId: number,
  setUser: Dispatch<SetStateAction<User | undefined>>
) => {
  try {
    const response = await fetch(`/api/user/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error refreshing user data:", data.error);
      return;
    }

    const userData: User = {
      id: data.id,
      username: data.username,
      email: data.email,
      credentials: data.credentials,
      pronouns: data.pronouns,
      first_name: data.first_name,
      last_name: data.last_name,
      description: data.description,
      photo_url: data.photo_url,
      link: data.link,
      team: data.team,
      subscriptions: data.subscriptions,
      loggedIn: true,
    };

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  } catch (error) {
    console.error("Error refreshing user data:", error);
  }
};

export function useAuth(
  user: User | undefined,
  setUser: Dispatch<SetStateAction<User | undefined>>,
  setAuthLoading: Dispatch<SetStateAction<boolean>>
) {
  useEffect(() => {
    const refresh = async () => {
      setAuthLoading(true);

      try {
        let userId = user?.id;

        if (!userId) {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            userId = userData?.id;
          }
        }

        if (userId) {
          await refreshUserData(userId, setUser);
        }
      } finally {
        setAuthLoading(false);
      }
    };

    refresh();
  }, [user?.id, setUser, setAuthLoading]);
}
