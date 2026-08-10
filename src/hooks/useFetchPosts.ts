import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Post } from "@/src/types";

const useFetchPosts = (
  courseId: number | undefined,
  setPosts: Dispatch<SetStateAction<Post[]>>,
  setPostsLoading: Dispatch<SetStateAction<boolean>>
) => {
  useEffect(() => {
    if (!courseId) return;

    const fetchPosts = async () => {
      try {
        const response = await fetch(`/api/course/${courseId}/posts`);
        const data = await response.json();
        if (response.ok) setPosts(data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [courseId, setPosts, setPostsLoading]);
};

export default useFetchPosts;
