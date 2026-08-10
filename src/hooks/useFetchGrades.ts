import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

export type GradebookData = {
  tareas: { id: number; title: string; due_date: string | null; max_score: number | null }[];
  students: UserSafe[];
  submissions: Submission[];
};

type UserSafe = {
  id: number;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
  credentials: string;
};

type Submission = {
  id: number;
  post_id: number;
  user_id: number;
  body?: string | null;
  link?: string | null;
  submitted_at: string;
  score?: number | null;
  feedback?: string | null;
  graded_at?: string | null;
  user?: UserSafe;
};

const useFetchGrades = (
  courseId: number | undefined,
  setData: Dispatch<SetStateAction<GradebookData | null>>,
  setLoading: Dispatch<SetStateAction<boolean>>
) => {
  useEffect(() => {
    if (!courseId) return;

    const fetchGrades = async () => {
      try {
        const response = await fetch(`/api/course/${courseId}/grades`);
        const data = await response.json();
        if (response.ok) setData(data);
      } catch (err) {
        console.error("Error fetching grades:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [courseId, setData, setLoading]);
};

export default useFetchGrades;
