import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Course } from "@/src/types";

const useFetchCourses = (
  setCourses: Dispatch<SetStateAction<Course[]>>,
  setCoursesLoading: Dispatch<SetStateAction<boolean>>
) => {
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/course");
        const data = await response.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, [setCourses, setCoursesLoading]);
};

export default useFetchCourses;
