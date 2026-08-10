import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { User } from "@/src/types";

const useFetchUsers = (
  setUsers: Dispatch<SetStateAction<User[]>>,
  setUsersLoading: Dispatch<SetStateAction<boolean>>
) => {
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/user");
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [setUsers, setUsersLoading]);
};

export default useFetchUsers;
