import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { User } from "@/src/types";

const useFetchUserById = (
  userId: number | undefined,
  setUser: Dispatch<SetStateAction<User | undefined>>,
  setUserLoading: Dispatch<SetStateAction<boolean>>
) => {
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/user/${userId}`);
        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.error("Error fetching user by ID:", err);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, [userId, setUser, setUserLoading]);
};

export default useFetchUserById;
