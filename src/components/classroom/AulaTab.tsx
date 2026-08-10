"use client";

import { useState } from "react";
import useFetchPosts from "@/src/hooks/useFetchPosts";
import type { Post, User } from "@/src/types";
import PostCard from "./PostCard";
import PostComposer from "./PostComposer";

function AulaTab({ courseId, me }: { courseId: number; me: User }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const isStaff = me.credentials === "admin" || me.credentials === "teacher";

  useFetchPosts(courseId, setPosts, setLoading);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner pink"></div>
        <span>Cargando el aula...</span>
      </div>
    );
  }

  const handleCreated = (post: Post) => setPosts((prev) => [post, ...prev]);
  const handleDeleted = (postId: number) =>
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  const handleUpdated = (post: Post) =>
    setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));

  return (
    <div className="aula-tab">
      {isStaff && <PostComposer courseId={courseId} onCreated={handleCreated} />}
      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <p>Todavía no hay posts en el aula</p>
        </div>
      ) : (
        <div className="post-feed">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              me={me}
              isStaff={isStaff}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AulaTab;
